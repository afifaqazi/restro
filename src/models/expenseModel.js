/**
 * ExpenseModel — Firestore CRUD for `expenses` collection.
 * Soft-delete only (status: false).
 */

import {
    db, collection, query, where, getDocs, onSnapshot,
    doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp,
} from "../firebase.js";
import { getNextId } from "../helpers/idGenerator.js";

const COL = "expenses";

// ── Helpers ────────────────────────────────────────────────────
function todayMidnight() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function isToday(ts) {
    if (!ts) return false;
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d >= todayMidnight();
}

/** Subscribe to real-time active expenses. */
export function onExpensesChange(callback) {
    const q = query(collection(db, COL), where("status", "==", true));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(list);
    });
}

/** Get all active expenses once. */
export async function getAllExpenses() {
    const q = query(collection(db, COL), where("status", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return list;
}

/** Get all expenses including soft-deleted. */
export async function getAllExpensesIncludeDeleted() {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get single expense by ID. */
export async function getExpenseById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Get today's total expenses. */
export async function getTodaysExpenses() {
    const snap = await getDocs(collection(db, COL));
    return snap.docs
        .map((d) => d.data())
        .filter((e) => e.status !== false && isToday(e.createdAt))
        .reduce((sum, e) => sum + (e.amount || 0), 0);
}

/** Create a new expense. */
export async function createExpense(data) {
    const id = await getNextId(COL);
    await setDoc(doc(db, COL, id), {
        title: data.title || "",
        category: data.category || "other",
        amount: Number(data.amount) || 0,
        date: data.date ? Timestamp.fromDate(new Date(data.date)) : serverTimestamp(),
        notes: data.notes || "",
        addedBy: data.addedBy || "",
        status: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return id;
}

/** Update expense fields. */
export async function updateExpense(id, data) {
    const upd = { ...data, updatedAt: serverTimestamp() };
    if (data.amount !== undefined) upd.amount = Number(data.amount);
    if (data.date) upd.date = Timestamp.fromDate(new Date(data.date));
    await updateDoc(doc(db, COL, id), upd);
}

/** Soft-delete an expense. */
export async function deleteExpense(id) {
    await updateDoc(doc(db, COL, id), {
        status: false,
        updatedAt: serverTimestamp(),
    });
}

/** Restore a soft-deleted expense. */
export async function restoreExpense(id) {
    await updateDoc(doc(db, COL, id), {
        status: true,
        updatedAt: serverTimestamp(),
    });
}
