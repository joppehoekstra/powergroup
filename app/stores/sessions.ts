import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

export const useSessionsStore = defineStore("sessionsStore", () => {
  const firebaseStore = useFirebaseStore();
  const toast = useToast();
  const currentSession = ref<any>(null);
  const userSessions = ref<any[]>([]);

  async function createSession(sessionData: {
    title: string;
    date: string;
    time: string;
  }) {
    try {
      const { db, auth } = firebaseStore;
      if (!auth.currentUser) throw new Error("User not authenticated");

      const scheduledAt = new Date(`${sessionData.date}T${sessionData.time}`);

      const docRef = await addDoc(collection(db, "sessions"), {
        title: sessionData.title,
        scheduledAt: Timestamp.fromDate(scheduledAt),
        createdAt: Timestamp.now(),
        userId: auth.currentUser.uid,
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

  function subscribeToUserSessions(userId: string) {
    const { db } = firebaseStore;
    const q = query(collection(db, "sessions"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        userSessions.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
          currentSession.value = { id: doc.id, ...doc.data() };
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
    createSession,
    subscribeToSession,
    subscribeToUserSessions,
  };
});
