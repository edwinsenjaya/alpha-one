import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "",
  authDomain: "alpha-one-4cc71.firebaseapp.com",
  projectId: "alpha-one-4cc71",
  storageBucket: "alpha-one-4cc71.firebasestorage.app",
  messagingSenderId: "479983404770",
  appId: "1:479983404770:web:d525ef4e6e7f748e5600bb",
  measurementId: "G-0M3YG2JR88",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
