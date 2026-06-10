/**
 * CustomerModel — Firestore CRUD for `customers` collection.
 * Soft-delete only (status: false).
 */

import {
    db, collection, query, where, getDocs, onSnapshot,
    doc, getDoc, setDoc, updateDoc, serverTimestamp, increment,
} from "../firebase.js";
import { getNextId } from "../helpers/idGenerator.js";

const COL = "customers";

/** Subscribe to real-time active customers. */
export function onCustomersChange(callback) {
    const q = query(collection(db, COL), where("status", "==", true));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        callback(list);
    });
}

/** Get all active customers once. */
export async function getAllCustomers() {
    const q = query(collection(db, COL), where("status", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return list;
}

/** Get all customers including soft-deleted. */
export async function getAllCustomersIncludeDeleted() {
    const snap = await getDocs(collection(db, COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return list;
}

/** Get a single customer by ID. */
export async function getCustomerById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Find customer by phone number. */
export async function getCustomerByPhone(phone) {
    const q = query(collection(db, COL), where("phone", "==", phone));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
}

/** Create a new customer. */
export async function createCustomer(data) {
    const id = await getNextId(COL);
    await setDoc(doc(db, COL, id), {
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        totalOrders: 0,
        totalSpent: 0,
        notes: data.notes || "",
        status: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return id;
}

/** Update customer fields. */
export async function updateCustomer(id, data) {
    await updateDoc(doc(db, COL, id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/** Soft-delete a customer. */
export async function deleteCustomer(id) {
    await updateDoc(doc(db, COL, id), {
        status: false,
        updatedAt: serverTimestamp(),
    });
}

/** Restore a soft-deleted customer. */
export async function restoreCustomer(id) {
    await updateDoc(doc(db, COL, id), {
        status: true,
        updatedAt: serverTimestamp(),
    });
}

/** Increment customer order stats after an order. */
export async function incrementCustomerStats(customerId, orderTotal) {
    await updateDoc(doc(db, COL, customerId), {
        totalOrders: increment(1),
        totalSpent: increment(orderTotal),
        updatedAt: serverTimestamp(),
    });
}
