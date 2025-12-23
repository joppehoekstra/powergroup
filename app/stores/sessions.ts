import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  query,
  where,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { colors } from "~/utils/colors";

export interface Slide {
  id: string;
  title: string;
  duration: number;
  agentInstructions: string;
  facilitatorNotes: string;
  color?: string;
}

export interface Session {
  id?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  scheduledAt: Timestamp;
  title: string;
  createdBy: string;
  updatedBy: string;
  template: boolean;
  slides: Slide[];
}

export const useSessionsStore = defineStore("sessionsStore", () => {
  const firebaseStore = useFirebaseStore();
  const toast = useToast();
  const currentSession = ref<Session | null>(null);
  const userSessions = ref<Session[]>([]);

  function generateNewSlide(contextSlides?: Slide[]): Slide {
    const slides = contextSlides ?? currentSession.value?.slides ?? [];

    const emojis = [
      "💡",
      "🧠",
      "⚡",
      "✨",
      "🚀",
      "🎯",
      "🔥",
      "💬",
      "🎲",
      "💎",
      "🧩",
      "🌊",
      "✊",
      "❤️",
      "💜",
      "💪",
      "✅",
      "👀",
      "🐝",
      "🐞",
      "🦋",
      "🪲",
      "🐛",
      "🌍",
      "🤯",
    ];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    let slideNumber = slides.length + 1;
    while (
      slides.some((s) =>
        new RegExp(`Slide ${slideNumber}(?:$|[^0-9])`).test(s.title)
      )
    ) {
      slideNumber++;
    }

    const title = `${randomEmoji} Slide ${slideNumber}`;
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return {
      id: crypto.randomUUID(),
      title,
      duration: 15,
      agentInstructions: "",
      facilitatorNotes: "",
      color: randomColor,
    };
  }

  async function createSession(sessionData: {
    title: string;
    date: string;
    time: string;
  }) {
    firebaseStore.init();
    const { db, auth } = firebaseStore;
    if (!db || !auth) throw new Error("Firebase not initialized");

    try {
      if (!auth.currentUser) throw new Error("User not authenticated");

      const scheduledAt = new Date(`${sessionData.date}T${sessionData.time}`);
      const firstSlide = generateNewSlide([]);

      const docRef = await addDoc(collection(db, "sessions"), {
        title: sessionData.title,
        scheduledAt: Timestamp.fromDate(scheduledAt),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: auth.currentUser.uid,
        updatedBy: auth.currentUser.uid,
        template: false,
        slides: [firstSlide],
      });
      return { sessionId: docRef.id, firstSlideId: firstSlide.id };
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast.add({
        title: "Error creating session",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  async function addSlide(sessionId: string) {
    const { db } = firebaseStore;
    if (!currentSession.value || currentSession.value.id !== sessionId) {
      throw new Error("Session not loaded or mismatch");
    }

    try {
      const currentSlides = currentSession.value.slides || [];
      const newSlide = generateNewSlide();
      const slides = [...currentSlides, newSlide];

      await updateSession(sessionId, { slides });
      return newSlide.id;
    } catch (error: any) {
      console.error("Error adding slide:", error);
      toast.add({
        title: "Error adding slide",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  async function updateSession(
    sessionId: string,
    sessionData: Partial<Session>
  ) {
    const { db, auth } = firebaseStore;
    try {
      const updatePayload = {
        ...sessionData,
        updatedAt: Timestamp.now(),
        updatedBy: auth?.currentUser?.uid,
      };

      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value = {
          ...currentSession.value,
          ...updatePayload,
        } as Session;
      }

      const sessionRef = doc(db!, "sessions", sessionId);
      await updateDoc(sessionRef, updatePayload);
    } catch (error: any) {
      console.error("Error updating session:", error);
      toast.add({
        title: "Error updating session",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  function subscribeToUserSessions(userId: string) {
    try {
      const { db } = firebaseStore;
      const q = query(
        collection(db!, "sessions"),
        where("createdBy", "==", userId)
      );
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          userSessions.value = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Session[];
        },
        (error) => {
          console.error("Error fetching sessions:", error);
          toast.add({
            title: "Error fetching sessions",
            description: error.message,
            color: "error",
          });
        }
      );
      return unsubscribe;
    } catch (error: any) {
      console.error("Error subscribing to user sessions:", error);
      toast.add({
        title: "Error subscribing to user sessions",
        description: error.message,
        color: "error",
      });
    }
  }

  async function subscribeToSession(sessionId: string) {
    try {
      const { db } = firebaseStore;

      const unsubscribe = onSnapshot(
        doc(db!, "sessions", sessionId),
        (doc) => {
          if (doc.exists()) {
            currentSession.value = { id: doc.id, ...doc.data() } as Session;
          }
        },
        (error) => {
          console.error("Error fetching session:", error);
          toast.add({
            title: "Error fetching session",
            description: error.message,
            color: "error",
          });
        }
      );
      return unsubscribe;
    } catch (error: any) {
      console.error("Error subscribing to session:", error);
      toast.add({
        title: "Error subscribing to session",
        description: error.message,
        color: "error",
      });
    }
  }

  return {
    currentSession,
    userSessions,
    createSession,
    updateSession,
    addSlide,
    subscribeToSession,
    subscribeToUserSessions,
  };
});
