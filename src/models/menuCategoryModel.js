/**
 * MenuCategoryModel — Firestore CRUD for `menu_categories`.
 * Soft-delete only (status: false).
 */

import {
    db, collection, query, where, getDocs, onSnapshot,
    doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from "../firebase.js";
import { getNextId } from "../helpers/idGenerator.js";

const COL = "menu_categories";

/** Subscribe to real-time active category updates. */
export function onCategoriesChange(callback) {
    const q = query(collection(db, COL), where("status", "==", true));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        callback(list);
    });
}

/** Get all active categories once. */
export async function getAllCategories() {
    const q = query(collection(db, COL), where("status", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    return list;
}

/** Get all categories including soft-deleted. */
export async function getAllCategoriesIncludeDeleted() {
    const snap = await getDocs(collection(db, COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    return list;
}

/** Get single category by ID. */
export async function getCategoryById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Create a new category. */
export async function createCategory(data) {
    const id = await getNextId(COL);
    await setDoc(doc(db, COL, id), {
        name: data.name || "",
        status: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return id;
}

/** Update category fields. */
export async function updateCategory(id, data) {
    const upd = { ...data, updatedAt: serverTimestamp() };
    delete upd.sortOrder;
    delete upd.icon;
    await updateDoc(doc(db, COL, id), upd);
}

/** Soft-delete a category. */
export async function deleteCategory(id) {
    await updateDoc(doc(db, COL, id), {
        status: false,
        updatedAt: serverTimestamp(),
    });
}

/** Restore a soft-deleted category. */
export async function restoreCategory(id) {
    await updateDoc(doc(db, COL, id), {
        status: true,
        updatedAt: serverTimestamp(),
    });
}
