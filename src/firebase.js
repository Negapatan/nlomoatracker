// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcsliPdfIucariLR71MWwNLPY5KtuyTzI",
  authDomain: "moa-tracker.firebaseapp.com",
  projectId: "moa-tracker",
  storageBucket: "moa-tracker.firebasestorage.app",
  messagingSenderId: "70000005935",
  appId: "1:70000005935:web:18b4b7d423f10eae94c7da",
  measurementId: "G-30VY0M29Q1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable auth persistence
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db)
  .catch((error) => {
    console.error("Firestore persistence error:", error);
  });

export { app, auth, db }; 