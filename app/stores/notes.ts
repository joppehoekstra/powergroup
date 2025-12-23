import { useFirebaseStore } from "./firebase";
import { useAIStore } from "./ai";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export interface SessionFile {
  id: string;
  sessionId: string;
  type: "pdf" | "image" | "audio";
  storagePath: string;
  createdAt: any;
  createdBy: string;
  url?: string;
}

export interface SessionNote {
  id: string;
  sessionId: string;
  fullText: string | null; // e.g. voice memo transcription (either generated using the browser SpeechRecognition API, or using LLM), extracted text from PDF, etc.
  fullTextModelUsed: "browser" | "llm" | null;
  title: string | null; // Generated using the browser Summary API, or using LLM
  titleModelUsed: "browser" | "llm" | null;
  summary: string | null; // Generated using the browser Summary API, or using LLM
  summaryModelUsed: "browser" | "llm" | null;
  emoji: string | null;
  file: SessionFile | null;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export const useNotesStore = defineStore("notesStore", () => {
  const firebaseStore = useFirebaseStore();
  const toast = useToast();
  const notes = ref<SessionNote[]>([]);
  let unsubscribe: Unsubscribe | null = null;

  function subscribeToSessionNotes(sessionID: string) {
    try {
      if (!firebaseStore.db) return;

      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      const q = query(
        collection(firebaseStore.db, "notes"),
        where("sessionId", "==", sessionID),
        orderBy("createdAt", "desc")
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const newNotes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as SessionNote[];

          notes.value = newNotes;

          // Automatically fetch download URLs for files
          newNotes.forEach(async (note) => {
            if (note.file && note.file.storagePath && !note.file.url) {
              const url = await getFile(note.file.storagePath);
              if (url) {
                note.file.url = url;
              }
            }
          });

          // Trigger processing for any incomplete notes
          processNotes();
        },
        (error) => {
          console.error("Error subscribing to notes:", error);
          toast.add({
            title: "Error subscribing to notes",
            description: error.message,
            color: "error",
          });
        }
      );
    } catch (error: any) {
      console.error("Error setting up notes subscription:", error);
      toast.add({
        title: "Error setting up notes subscription",
        description: error.message,
        color: "error",
      });
    }
  }

  async function addSessionNote(note: SessionNote) {
    try {
      if (!firebaseStore.db) return;

      const noteRef = doc(collection(firebaseStore.db, "notes"), note.id);

      // Remove undefined values to avoid Firestore errors if any
      const noteData = {
        ...note,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: firebaseStore.user?.uid || "anonymous",
        updatedBy: firebaseStore.user?.uid || "anonymous",
      };

      // Ensure we don't save the temporary URL to Firestore
      if (noteData.file && noteData.file.url) {
        // Create a new file object without the url property
        const { url, ...fileData } = noteData.file;
        noteData.file = fileData as SessionFile;
      }

      await setDoc(noteRef, noteData);
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast.add({
        title: "Error adding note",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  async function getFile(storagePath: string) {
    if (!firebaseStore.storage) return null;
    try {
      const fileRef = storageRef(firebaseStore.storage, storagePath);
      return await getDownloadURL(fileRef);
    } catch (error: any) {
      console.error("Error getting download URL:", error);
      toast.add({
        title: "Error getting file URL",
        description: error.message,
        color: "error",
      });
      return null;
    }
  }

  async function getSessionFiles(sessionID: string) {
    try {
      if (notes.value.length > 0) {
        await Promise.all(
          notes.value.map(async (note) => {
            if (note.file && note.file.storagePath && !note.file.url) {
              const url = await getFile(note.file.storagePath);
              if (url) note.file.url = url;
            }
          })
        );
      }
    } catch (error: any) {
      console.error("Error getting session files:", error);
      toast.add({
        title: "Error getting session files",
        description: error.message,
        color: "error",
      });
    }
  }

  async function uploadSessionFile(file: SessionFile, blob: Blob) {
    try {
      if (!firebaseStore.storage) return;

      const fileRef = storageRef(firebaseStore.storage, file.storagePath);
      await uploadBytes(fileRef, blob);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.add({
        title: "Error uploading file",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  function processNotes() {
    // Extract text (for PDFs), transcribe (for audio), generate title and summary - called when adding notes, or when subscribeToSessionNotes returns notes that lack any of these fields. Only the fields that are missing need to be generated.
    const aiStore = useAIStore();
    if (!notes.value.length) return;

    notes.value.forEach(async (note) => {
      // Skip if already fully processed
      if (
        note.fullText &&
        note.fullTextModelUsed === "llm" &&
        note.title &&
        note.summary
      )
        return;

      let updated = false;
      const updates: Partial<SessionNote> = {};

      // 1. Generate Full Text (always replace LLM transcript for better accuracy)
      if (note.fullTextModelUsed !== "llm" && note.file) {
        try {
          let blob: Blob | null = null;
          let url = note.file.url;

          if (!url && note.file.storagePath) {
            const fetchedUrl = await getFile(note.file.storagePath);
            if (fetchedUrl) url = fetchedUrl;
          }

          if (url) {
            const resp = await fetch(url);
            blob = await resp.blob();
          }

          if (blob) {
            if (note.file.type === "audio") {
              updates.fullText = await aiStore.transcribeAudio(blob);
              updates.fullTextModelUsed = "llm";
            } else if (note.file.type === "pdf" || note.file.type === "image") {
              updates.fullText = await aiStore.extractText(blob);
              updates.fullTextModelUsed = "llm";
            }
            updated = true;
          }
        } catch (e) {
          console.error("Failed to extract text for note", note.id, e);
        }
      }

      // 2. Generate Title/Summary
      const text = updates.fullText || note.fullText;
      if (text && (!note.title || !note.summary)) {
        try {
          const result = await aiStore.generateEmojiTitleSummary(text);

          updates.title = result.title;
          updates.titleModelUsed = result.model;
          updates.summary = result.summary;
          updates.summaryModelUsed = result.model;
          updates.emoji = result.emoji;

          updated = true;
        } catch (e) {
          console.error("Failed to generate summary for note", note.id, e);
        }
      }

      if (updated) {
        const noteRef = doc(collection(firebaseStore.db!, "notes"), note.id);
        await updateDoc(noteRef, {
          ...updates,
          updatedAt: serverTimestamp(),
          updatedBy: firebaseStore.user?.uid,
        });
      }
    });
  }

  return {
    notes,
    subscribeToSessionNotes,
    addSessionNote,
    getFile,
    getSessionFiles,
    uploadSessionFile,
    processNotes,
  };
});
