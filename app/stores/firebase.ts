// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";

export const useFirebaseStore = defineStore("firebaseStore", () => {
  const runtimeConfig = useRuntimeConfig();

  const app = initializeApp(runtimeConfig.public.firebase);
  const db = getFirestore(app);
  const auth = getAuth(app);

  console.log("Using reCAPTCHA key:", runtimeConfig.public.recaptchaKey);

  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(runtimeConfig.public.recaptchaKey),

    // Optional argument. If true, the SDK automatically refreshes App Check
    // tokens as needed.
    isTokenAutoRefreshEnabled: true,
  });

  const user = ref<User | null>(null);

  onAuthStateChanged(auth, (u) => {
    user.value = u;
    if (!u) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous auth failed", error);
      });
    }
  });

  return { app, db, auth, user };
});
