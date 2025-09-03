import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Declaramos las variables fuera para que puedan ser exportadas
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Esta comprobación es la clave:
// 'typeof window' solo es 'undefined' en un entorno de servidor.
if (typeof window !== 'undefined' && !getApps().length) {
  // Si estamos en el navegador y Firebase no se ha inicializado...
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
storage = getStorage(app);
} else if (getApps().length) {
  // Si ya se ha inicializado, usa la app existente.
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// Exportamos las variables.
export { app, auth, db, storage };