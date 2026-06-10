/**
 * UserModel — Firestore operations for the `users` collection.
 */

import {
    db, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp,
} from "../firebase.js";
import { getNextId } from "../helpers/idGenerator.js";

const COLLECTION = "users";

/**
 * Fetch a user document by its Firestore doc ID.
 * @param {string} id — Document ID.
 * @returns {Promise<Object|null>}
 */
export async function getUserById(id) {
    const snap = await getDoc(doc(db, COLLECTION, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Fetch the FIRST user document whose `uid` field matches.
 * Falls back to email lookup for legacy docs without uid.
 * @param {string} uid — Firebase Auth UID.
 * @param {string} email — Fallback email.
 * @returns {Promise<Object|null>}
 */
export async function getUserByUid(uid, email) {
    // Try uid-based lookup first
    const qUid = query(collection(db, COLLECTION), where("uid", "==", uid), where("status", "==", true));
    const snapUid = await getDocs(qUid);
    if (!snapUid.empty) {
        const d = snapUid.docs[0];
        return { id: d.id, ...d.data() };
    }
    // Fallback to email lookup (legacy users without uid field)
    if (email) return getUserByEmail(email);
    return null;
}

/**
 * Fetch the FIRST user document whose `email` field matches.
 * This is the primary lookup after Firebase Auth sign-in.
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function getUserByEmail(email) {
    const q = query(collection(db, COLLECTION), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Create or merge-update a user document.
 * @param {string} id — Document ID.
 * @param {Object} data
 */
export async function saveUser(id, data) {
    await setDoc(doc(db, COLLECTION, id), {
        ...data,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

/**
 * Get all active users.
 * @returns {Promise<Array>}
 */
export async function getAllUsers() {
    const q = query(collection(db, COLLECTION), where("status", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return list;
}

/**
 * Get total count of active users.
 * @returns {Promise<number>}
 */
export async function getUserCount() {
    const q = query(collection(db, COLLECTION), where("status", "==", true));
    const snap = await getDocs(q);
    return snap.size;
}

/**
 * Create a new user document with a sequential ID.
 * @param {Object} data — user data including uid, email, name, etc.
 * @returns {Promise<string>} — generated document ID
 */
export async function createUser(data) {
    const id = await getNextId(COLLECTION);
    await setDoc(doc(db, COLLECTION, id), {
        uid: data.uid || "",
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        type: data.type || "waiter",
        status: true,
        createdBy: data.createdBy || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return id;
}

/**
 * Update user document fields.
 * @param {string} id — Document ID.
 * @param {Object} data — Fields to update.
 */
export async function updateUser(id, data) {
    const upd = { ...data, updatedAt: serverTimestamp() };
    await updateDoc(doc(db, COLLECTION, id), upd);
}

/**
 * Soft-delete a user.
 * @param {string} id — Document ID.
 */
export async function softDeleteUser(id) {
    await updateDoc(doc(db, COLLECTION, id), {
        status: false,
        updatedAt: serverTimestamp(),
    });
}
