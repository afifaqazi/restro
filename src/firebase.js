/**
 * Firebase initialisation & service exports for React app.
 */

import { initializeApp, deleteApp } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    updateEmail,
    updatePassword,
    sendPasswordResetEmail,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
    serverTimestamp,
    increment,
    Timestamp,
    writeBatch,
} from "firebase/firestore";

// ── Firebase config ────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyBFte-0kP5Mi-WeLrTwQXVcr6fh8ZKwJD4",
    authDomain: "restro-exdigitals.firebaseapp.com",
    projectId: "restro-exdigitals",
    storageBucket: "restro-exdigitals.firebasestorage.app",
    messagingSenderId: "220221552228",
    appId: "1:220221552228:web:6e54ff5b7cc5b353325171",
};

// ── Initialise ─────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── Exports ────────────────────────────────────────────────────
export {
    app,
    auth,
    db,
    firebaseConfig,
    // App helpers
    initializeApp,
    deleteApp,
    // Auth helpers
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    updateEmail,
    updatePassword,
    sendPasswordResetEmail,
    EmailAuthProvider,
    reauthenticateWithCredential,
    getAuth,
    // Firestore helpers
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
    serverTimestamp,
    increment,
    Timestamp,
    writeBatch,
};
