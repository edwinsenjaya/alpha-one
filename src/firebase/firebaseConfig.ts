import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBKeQmFoUc46FjVgeVEQSshMtHspro75iE",
  authDomain: "alpha-one-test.firebaseapp.com",
  projectId: "alpha-one-test",
  storageBucket: "alpha-one-test.firebasestorage.app",
  messagingSenderId: "400898552622",
  appId: "1:400898552622:web:eab835df0e8a55f98880bf",
  measurementId: "G-CFN2DLX47N",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
