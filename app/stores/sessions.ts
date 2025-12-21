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
  userId: string;
  template: boolean;
  slides: Slide[];
}

export const useSessionsStore = defineStore("sessionsStore", () => {
  const firebaseStore = useFirebaseStore();
  const toast = useToast();
  const currentSession = ref<Session | null>(null);
  const userSessions = ref<Session[]>([]);
  const activeSlideIndex = ref(0);

  async function createSession(sessionData: {
    title: string;
    date: string;
    time: string;
  }) {
    try {
      const { db, auth } = firebaseStore;
      if (!auth.currentUser) throw new Error("User not authenticated");

      const scheduledAt = new Date(`${sessionData.date}T${sessionData.time}`);

      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const docRef = await addDoc(collection(db, "sessions"), {
        title: sessionData.title,
        scheduledAt: Timestamp.fromDate(scheduledAt),
        createdAt: Timestamp.now(),
        userId: auth.currentUser.uid,
        template: false,
        slides: [
          {
            title: "Slide 1",
            duration: 15,
            agentInstructions: "",
            facilitatorNotes: "",
            color: randomColor,
          },
        ],
      });
      return docRef.id;
    } catch (error: any) {
      toast.add({
        title: "Error creating session",
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
    const { db } = firebaseStore;
    try {
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value = {
          ...currentSession.value,
          ...sessionData,
        } as Session;
      }

      const sessionRef = doc(db, "sessions", sessionId);
      await updateDoc(sessionRef, sessionData);
    } catch (error: any) {
      toast.add({
        title: "Error updating session",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  function subscribeToUserSessions(userId: string) {
    const { db } = firebaseStore;
    const q = query(collection(db, "sessions"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        userSessions.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Session[];
      },
      (error) => {
        toast.add({
          title: "Error fetching sessions",
          description: error.message,
          color: "error",
        });
      }
    );
    return unsubscribe;
  }

  async function subscribeToSession(sessionId: string) {
    const { db } = firebaseStore;
    const unsubscribe = onSnapshot(
      doc(db, "sessions", sessionId),
      (doc) => {
        if (doc.exists()) {
          currentSession.value = { id: doc.id, ...doc.data() } as Session;
        }
      },
      (error) => {
        toast.add({
          title: "Error fetching session",
          description: error.message,
          color: "error",
        });
      }
    );
    return unsubscribe;
  }

  return {
    currentSession,
    userSessions,
    activeSlideIndex,
    createSession,
    updateSession,
    subscribeToSession,
    subscribeToUserSessions,
  };
});
