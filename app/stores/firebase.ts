// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User,
  type Auth,
} from "firebase/auth";

export const useFirebaseStore = defineStore("firebaseStore", () => {
  const runtimeConfig = useRuntimeConfig();

  const app = ref<FirebaseApp>();
  const db = ref<Firestore>();
  const auth = ref<Auth>();
  const user = ref<User | null>();

  function init() {
    if (app.value) return;

    app.value = initializeApp(runtimeConfig.public.firebase);
    db.value = getFirestore(app.value);
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
        });
      }
    });
  }

  return { app, db, auth, user, init };
});
