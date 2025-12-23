import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

export interface Section {
  emoji: string;
  title: string;
  description: string;
}

export interface ThinkingSection {
  title: string;
  summary: string;
}

export interface Response {
  id?: string;
  sessionId: string;
  slideId: string;
  responseSections: Section[];
  thinkingSections?: ThinkingSection[];
  thoughtSummary?: string;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  updatedBy?: string;
}

function parseThinkingSections(text: string) {
  const sections: { title: string; summary: string }[] = [];
  const regex = /(?:^|\n)\s*\*\*(.*?)\*\*\s*\n([\s\S]*?)(?=(?:\n\s*\*\*)|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && match[2]) {
      sections.push({
        title: match[1].trim(),
        summary: match[2].trim(),
      });
    }
  }
  return sections;
}

export const useResponsesStore = defineStore("responsesStore", () => {
  const firebaseStore = useFirebaseStore();
  const toast = useToast();
  const dbResponses = ref<Response[]>([]);
  const temporaryResponse = ref<Partial<Response> | null>(null);

  const currentSessionResponses = computed(() => {
    const responses = [...dbResponses.value];
    if (temporaryResponse.value) {
      // @ts-ignore
      responses.push(temporaryResponse.value);
    }
    return responses;
  });

  let unsubscribe: (() => void) | null = null;
  let unwatchDb: (() => void) | null = null;

  function setTemporaryResponse(response: any) {
    try {
      const processedResponse = { ...response };
      if (response.temporaryThinkingResponse) {
        processedResponse.thinkingSections = parseThinkingSections(
          response.temporaryThinkingResponse
        );
      }
      temporaryResponse.value = processedResponse;
    } catch (error: any) {
      console.error("Error setting temporary response:", error);
      toast.add({
        title: "Error setting temporary response",
        description: error.message,
        color: "error",
      });
    }
  }

  function clearTemporaryResponse() {
    try {
      temporaryResponse.value = null;
    } catch (error: any) {
      console.error("Error clearing temporary response:", error);
      toast.add({
        title: "Error clearing temporary response",
        description: error.message,
        color: "error",
      });
    }
  }

  async function createResponse(payload: {
    sessionID: string;
    slideID: string;
    responseSections: any[];
    thoughtSummary?: string;
  }) {
    try {
      if (!firebaseStore.db || !firebaseStore.auth!.currentUser) return;

      const thinkingSections = payload.thoughtSummary
        ? parseThinkingSections(payload.thoughtSummary)
        : [];

      await addDoc(collection(firebaseStore.db, "responses"), {
        sessionId: payload.sessionID,
        slideId: payload.slideID,
        createdBy: firebaseStore.auth!.currentUser!.uid,
        updatedBy: firebaseStore.auth!.currentUser!.uid,
        responseSections: payload.responseSections,
        thoughtSummary: payload.thoughtSummary || null,
        thinkingSections: thinkingSections,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      clearTemporaryResponse();
    } catch (error: any) {
      console.error("Error creating response:", error);
      toast.add({
        title: "Error creating response",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  async function subscribeToResponses(sessionId: string, slideId: string) {
    try {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (unwatchDb) {
        unwatchDb();
        unwatchDb = null;
      }

      if (!firebaseStore.db) {
        unwatchDb = watch(
          () => firebaseStore.db,
          (newDb) => {
            if (newDb) {
              if (unwatchDb) unwatchDb();
              unwatchDb = null;
              subscribeToResponses(sessionId, slideId);
            }
          }
        );
        return;
      }

      const q = query(
        collection(firebaseStore.db, "responses"),
        where("sessionId", "==", sessionId),
        where("slideId", "==", slideId),
        orderBy("createdAt", "asc")
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          dbResponses.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Response[];
        },
        (error) => {
          console.error("Error fetching responses:", error);
          toast.add({
            title: "Error fetching responses",
            description: error.message,
            color: "error",
          });
        }
      );
    } catch (error: any) {
      console.error("Error subscribing to responses:", error);
      toast.add({
        title: "Error subscribing to responses",
        description: error.message,
        color: "error",
      });
    }
  }

  return {
    currentSessionResponses,
    createResponse,
    subscribeToResponses,
    setTemporaryResponse,
    clearTemporaryResponse,
  };
});
