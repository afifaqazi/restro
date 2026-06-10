/**
 * TableModel — Firestore CRUD for `tables` collection.
 * Soft-delete only (status: false).
 */

import {
    db, collection, query, where, getDocs, onSnapshot,
    doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from "../firebase.js";
import { getNextId } from "../helpers/idGenerator.js";

const COL = "tables";

/**
 * Subscribe to real-time active table updates.
 * @param {Function} callback — receives array of table objects.
 * @returns {Function} unsubscribe
 */
export function onTablesChange(callback) {
    const q = query(collection(db, COL), where("status", "==", true));
    return onSnapshot(q, (snap) => {
        const tables = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        tables.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        callback(tables);
    });
}

/** Get all active tables once. */
export async function getAllTables() {
    const q = query(collection(db, COL), where("status", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    return list;
}

/** Get all tables including soft-deleted. */
export async function getAllTablesIncludeDeleted() {
    const snap = await getDocs(collection(db, COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    return list;
}

/** Get single table by ID. */
export async function getTableById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Update a table's status and optionally its currentOrderId. */
export async function updateTableStatus(tableId, tableStatus, currentOrderId = null) {
    await updateDoc(doc(db, COL, tableId), {
        tableStatus,
        currentOrderId,
        updatedAt: serverTimestamp(),
    });
}

/** Create a new table. */
export async function createTable(data) {
    const id = await getNextId(COL);
    await setDoc(doc(db, COL, id), {
        label: data.label || "",
        capacity: Number(data.capacity) || 4,
        tableStatus: "idle",
        currentOrderId: null,
        status: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return id;
}

/** Update table fields. */
export async function updateTable(id, data) {
    const upd = { ...data, updatedAt: serverTimestamp() };
    if (data.capacity !== undefined) upd.capacity = Number(data.capacity);
    delete upd.sortOrder;
    await updateDoc(doc(db, COL, id), upd);
}

/** Soft-delete a table. */
export async function deleteTable(id) {
    await updateDoc(doc(db, COL, id), {
        status: false,
        updatedAt: serverTimestamp(),
    });
}

/** Restore a soft-deleted table. */
export async function restoreTable(id) {
    await updateDoc(doc(db, COL, id), {
        status: true,
        updatedAt: serverTimestamp(),
    });
}
