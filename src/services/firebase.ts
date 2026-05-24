import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const invalidEnv = (value: string | undefined) => {
  if (!value) return true;
  return /your_|project_id_here|messaging_sender_id_here|app_id_here/i.test(value);
};

const missingVars = Object.entries(firebaseConfig)
  .filter(([, value]) => invalidEnv(value))
  .map(([key]) => key);

export const firebaseConfigError = missingVars.length
  ? `Firebase env vars missing or invalid: ${missingVars.join(", ")}. Please set them in .env and restart Vite.`
  : "";

if (firebaseConfigError) {
  console.error(firebaseConfigError);
} else if (import.meta.env.DEV) {
  console.log("Firebase env loaded:", {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    appId: firebaseConfig.appId,
    measurementId: firebaseConfig.measurementId,
  });
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);