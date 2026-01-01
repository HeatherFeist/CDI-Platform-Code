import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3bs9xcTJAppWf9qrIsVY6Uc8UKAR9LPs",
  authDomain: "shop-reneurgit-03846395-14409.firebaseapp.com",
  projectId: "shop-reneurgit-03846395-14409",
  storageBucket: "shop-reneurgit-03846395-14409.firebasestorage.app",
  messagingSenderId: "688494584898",
  appId: "1:688494584898:web:31519ff3465ab9bd56b9db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
