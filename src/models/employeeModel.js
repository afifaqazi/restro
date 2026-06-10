/**
 * EmployeeModel — Firestore CRUD for `employees` collection.
 * Soft-delete only (status: false).
 */

import {
    db, collection, query, where, getDocs, onSnapshot,
    doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp,
} from "../firebase.js";
import { getNextId } from "../helpers/idGenerator.js";

const COL = "employees";

/** Subscribe to real-time active employees. */
export function onEmployeesChange(callback) {
    const q = query(collection(db, COL), where("status", "==", true));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        callback(list);
    });
}

/** Get all active employees once. */
export async function getAllEmployees() {
    const q = query(collection(db, COL), where("status", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return list;
}

/** Get all employees including soft-deleted. */
export async function getAllEmployeesIncludeDeleted() {
    const snap = await getDocs(collection(db, COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return list;
}

/** Get single employee by ID. */
export async function getEmployeeById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Get active employee count. */
export async function getActiveEmployeeCount() {
    const q = query(collection(db, COL), where("status", "==", true));
    const snap = await getDocs(q);
    return snap.size;
}

/** Create a new employee. */
export async function createEmployee(data) {
    const id = await getNextId(COL);
    await setDoc(doc(db, COL, id), {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        type: data.type || "staff",
        customType: data.customType || "",
        salary: Number(data.salary) || 0,
        joiningDate: data.joiningDate
            ? Timestamp.fromDate(new Date(data.joiningDate))
            : serverTimestamp(),
        resigningDate: null,
        notes: data.notes || "",
        status: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return id;
}

/** Update employee fields. */
export async function updateEmployee(id, data) {
    const upd = { ...data, updatedAt: serverTimestamp() };
    // Convert date strings to Timestamps
    if (data.joiningDate) upd.joiningDate = Timestamp.fromDate(new Date(data.joiningDate));
    if (data.resigningDate) upd.resigningDate = Timestamp.fromDate(new Date(data.resigningDate));
    if (data.salary !== undefined) upd.salary = Number(data.salary);
    await updateDoc(doc(db, COL, id), upd);
}

/** Soft-delete an employee. */
export async function deleteEmployee(id) {
    await updateDoc(doc(db, COL, id), {
        status: false,
        updatedAt: serverTimestamp(),
    });
}

/** Restore a soft-deleted employee. */
export async function restoreEmployee(id) {
    await updateDoc(doc(db, COL, id), {
        status: true,
        updatedAt: serverTimestamp(),
    });
}
