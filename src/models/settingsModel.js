/**
 * SettingsModel — Firestore CRUD for `settings` collection.
 * Uses a single document "restaurant" to store all restaurant settings.
 */

import {
    db, doc, getDoc, setDoc, serverTimestamp, onSnapshot,
} from "../firebase.js";

const DOC_PATH = "settings";
const DOC_ID = "restaurant";

/** Get restaurant settings once. */
export async function getSettings() {
    const snap = await getDoc(doc(db, DOC_PATH, DOC_ID));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Subscribe to real-time settings changes. */
export function onSettingsChange(callback) {
    return onSnapshot(doc(db, DOC_PATH, DOC_ID), (snap) => {
        callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
}

/** Save (create or overwrite) restaurant settings. */
export async function saveSettings(data) {
    await setDoc(doc(db, DOC_PATH, DOC_ID), {
        restaurantName: data.restaurantName || "",
        logo: data.logo || "",
        address: data.address || "",
        phone: data.phone || "",
        theme: data.theme || "violet",
        primaryColor: data.primaryColor || "#6c63ff",
        primaryDark: data.primaryDark || "#5a52d5",
        primaryLight: data.primaryLight || "rgba(108,99,255,0.12)",
        updatedAt: serverTimestamp(),
    }, { merge: true });
}
