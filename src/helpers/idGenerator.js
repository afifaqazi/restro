/**
 * ID Generator — creates readable, sequential document IDs.
 * Uses a shared `counters` collection in Firestore.
 *
 * Pattern: PREFIX-001, PREFIX-002, …
 * Each collection gets its own counter doc.
 */

import {
    db, doc, getDoc, setDoc, updateDoc, increment,
} from "../firebase.js";

const COUNTERS_COL = "counters";

/**
 * Collection-to-prefix mapping.
 * Centralised so every model and the seed use the same prefixes.
 */
const PREFIX_MAP = {
    users: "USR",
    employees: "EMP",
    menu_categories: "CAT",
    menu_items: "ITEM",
    tables: "TBL",
    customers: "CUST",
    orders: "ORD",
    expenses: "EXP",
    reservations: "RSV",
};

/**
 * Pad width per prefix (orders get 5 digits, rest get 3).
 */
const PAD_MAP = {
    ORD: 5,
};

/**
 * Generate the next sequential ID for a given collection.
 * @param {string} collectionName — e.g. "menu_categories"
 * @returns {Promise<string>} — e.g. "CAT-003"
 */
export async function getNextId(collectionName) {
    const prefix = PREFIX_MAP[collectionName] || collectionName.toUpperCase().slice(0, 4);
    const pad = PAD_MAP[prefix] || 3;
    const counterRef = doc(db, COUNTERS_COL, collectionName);

    try {
        await updateDoc(counterRef, { lastNumber: increment(1) });
    } catch {
        // Counter doc doesn't exist yet — create it
        await setDoc(counterRef, { lastNumber: 1 });
    }

    const snap = await getDoc(counterRef);
    const num = snap.data().lastNumber;
    return `${prefix}-${String(num).padStart(pad, "0")}`;
}

/**
 * Set a counter to a specific value (used by seed script).
 * @param {string} collectionName
 * @param {number} value
 */
export async function setCounter(collectionName, value) {
    await setDoc(doc(db, COUNTERS_COL, collectionName), { lastNumber: value });
}

export { PREFIX_MAP };
