/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// --- START: FIREBASE CONFIGURATION ---
// IMPORTANT: Replace the placeholder values below with your actual
// Firebase project's configuration. You can find these details in your
// Firebase project settings under "General".
//
// HOW TO FIND YOUR CONFIG:
// 1. Go to the Firebase Console: https://console.firebase.google.com/
// 2. Select your project ("home-reno-vision-pro").
// 3. Click the gear icon (Project settings) in the top-left.
// 4. In the "General" tab, scroll down to the "Your apps" section.
// 5. Find your web app and look for the "Firebase SDK snippet" section.
// 6. Select the "Config" option to see your configuration values.
// 7. Copy and paste each value into the corresponding placeholder below.
//
// SECURITY WARNING:
// For simplicity in this development environment, we are placing credentials
// directly in the code. In a real-world production application, this is not
// recommended. You should use a build system (like Vite or Create React App)
// that can read these values from a secure `.env` file and prevent them
// from being checked into version control systems like Git.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "home-reno-vision-pro.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "home-reno-vision-pro",
  // NOTE: The storage bucket URL is typically in the format `your-project-id.appspot.com`.
  // I have corrected it for you, but please double-check this in your Firebase console.
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "home-reno-vision-pro.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "667691828187",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:667691828187:web:35ee0376ce835fe707ddfe",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6BCM7ZSLT3"
};
// --- END: FIREBASE CONFIGURATION ---

// Declare module-level variables that can be null.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null; // Kept for backwards compatibility but NOT initialized
let storage: FirebaseStorage | null = null;
const provider = new GoogleAuthProvider();
let firebaseError: string | null = null;


// Check if the Firebase config keys are provided
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.trim() === "") {
    firebaseError = "Firebase configuration is missing. Add your Firebase API key to firebase.ts to enable authentication and cloud storage features.";
    console.warn("⚠️ Firebase not configured. The app will work in local-only mode.");
    console.warn("To enable Firebase features:");
    console.warn("1. Go to https://console.firebase.google.com/");
    console.warn("2. Select your project");
    console.warn("3. Get your config from Project Settings");
    console.warn("4. Update the apiKey in firebase.ts");
} else {
    try {
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      // db = getFirestore(app); // DISABLED - Using Supabase instead (prevents Firestore 400 errors)
      storage = getStorage(app);
      console.log("✅ Firebase initialized successfully (Firestore disabled - using Supabase).");

    } catch (e) {
      firebaseError = e instanceof Error ? e.message : String(e);
      console.error("❌ Firebase initialization failed:", firebaseError);
      // Ensure all exports are null on failure
      app = null;
      auth = null;
      db = null;
      storage = null;
    }
}

export { auth, db, storage, provider, firebaseError }; // db is null - Firestore disabled, using Supabase
