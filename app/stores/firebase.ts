// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User,
  type Auth,
} from "firebase/auth";

export const useFirebaseStore = defineStore("firebaseStore", () => {
  const runtimeConfig = useRuntimeConfig();
  const toast = useToast();

  const app = shallowRef<FirebaseApp>();
  const db = shallowRef<Firestore>();
  const storage = shallowRef<FirebaseStorage>();
  const auth = shallowRef<Auth>();
  const user = shallowRef<User | null>();

  function init() {
    try {
      if (app.value) return;

      app.value = initializeApp(runtimeConfig.public.firebase);
      db.value = getFirestore(app.value);
      storage.value = getStorage(app.value);
      auth.value = getAuth(app.value);

      initializeAppCheck(app.value, {
        provider: new ReCaptchaV3Provider(runtimeConfig.public.recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });

      const aiStore = useAIStore();
      aiStore.init();

      onAuthStateChanged(auth.value, (u) => {
        user.value = u;
        if (!u) {
          signInAnonymously(auth.value!).catch((error) => {
            console.error("Anonymous auth failed", error);
            toast.add({
              title: "Anonymous auth failed",
              description: error.message,
              color: "error",
            });
          });
        }
      });
    } catch (error: any) {
      console.error("Error initializing Firebase:", error);
      toast.add({
        title: "Error initializing Firebase",
        description: error.message,
        color: "error",
      });
    }
  }

  return { app, db, storage, auth, user, init };
});
