import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Replace this with your own Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPf-g0f_fr0Tjs-r7P_R8C4_U_q2J1s-c",
  authDomain: "class-commander-1e392.firebaseapp.com",
  projectId: "class-commander-1e392",
  storageBucket: "class-commander-1e392.appspot.com",
  messagingSenderId: "367803353592",
  appId: "1:367803353592:web:65f725a33c2a9128544838",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
