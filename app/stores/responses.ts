import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

export const useResponsesStore = defineStore("responsesStore", () => {
  const firebaseStore = useFirebaseStore();
  const toast = useToast();
  const currentSessionResponses = ref<any>(null);
  let unsubscribe: (() => void) | null = null;

  async function createResponse(sessionId: string, responseData: any) {
    try {
      if (!firebaseStore.auth.currentUser) return;

      await addDoc(collection(firebaseStore.db, "responses"), {
        sessionId,
        userId: firebaseStore.auth.currentUser.uid,
        ...responseData,
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      toast.add({
        title: "Error creating response",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  async function subscribeToResponses(sessionId: string) {
    if (unsubscribe) unsubscribe();

    const q = query(
      collection(firebaseStore.db, "responses"),
      where("sessionId", "==", sessionId)
    );

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        currentSessionResponses.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      },
      (error) => {
        toast.add({
          title: "Error fetching responses",
          description: error.message,
          color: "error",
        });
      }
    );
  }

  return {
    currentSessionResponses,
    createResponse,
    subscribeToResponses,
  };
});
