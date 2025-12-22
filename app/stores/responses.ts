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

export const useResponsesStore = defineStore("responsesStore", () => {
  const firebaseStore = useFirebaseStore();
  const toast = useToast();
  const currentSessionResponses = ref<any>(null);
  let unsubscribe: (() => void) | null = null;
  let unwatchDb: (() => void) | null = null;

  async function createResponse(
    sessionId: string,
    slideId: string,
    responseData: any
  ) {
    try {
      if (!firebaseStore.db || !firebaseStore.auth!.currentUser) return;

      await addDoc(collection(firebaseStore.db, "responses"), {
        sessionId,
        slideId,
        userId: firebaseStore.auth!.currentUser!.uid,
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

  async function subscribeToResponses(sessionId: string, slideId: string) {
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
