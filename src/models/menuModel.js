/**
 * MenuModel — Firestore CRUD for `menu_items` collection.
 * Soft-delete only (status: false).
 */

import {
    db, collection, query, where, getDocs, onSnapshot,
    doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from "../firebase.js";
import { getNextId } from "../helpers/idGenerator.js";

const COL = "menu_items";

/** Subscribe to real-time menu item updates (active only). */
export function onMenuItemsChange(callback) {
    const q = query(collection(db, COL), where("status", "==", true));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        callback(list);
    });
}

/** Get all active menu items once. */
export async function getAllMenuItems() {
    const q = query(collection(db, COL), where("status", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    return list;
}

/** Get all menu items including soft-deleted. */
export async function getAllMenuItemsIncludeDeleted() {
    const snap = await getDocs(collection(db, COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    return list;
}

/** Get menu items by category. */
export async function getMenuItemsByCategory(categoryId) {
    const q = query(
        collection(db, COL),
        where("categoryId", "==", categoryId),
        where("status", "==", true),
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    return list;
}

/** Get single menu item by ID. */
export async function getMenuItemById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Create a new menu item. */
export async function createMenuItem(data) {
    const id = await getNextId(COL);
    await setDoc(doc(db, COL, id), {
        name: data.name || "",
        categoryId: data.categoryId || "",
        price: Number(data.price) || 0,
        description: data.description || "",
        image: data.image || "",
        status: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return id;
}

/** Update menu item fields. */
export async function updateMenuItem(id, data) {
    const upd = { ...data, updatedAt: serverTimestamp() };
    if (data.price !== undefined) upd.price = Number(data.price);
    delete upd.sortOrder;
    await updateDoc(doc(db, COL, id), upd);
}

/** Soft-delete a menu item. */
export async function deleteMenuItem(id) {
    await updateDoc(doc(db, COL, id), {
        status: false,
        updatedAt: serverTimestamp(),
    });
}

/** Restore a soft-deleted menu item. */
export async function restoreMenuItem(id) {
    await updateDoc(doc(db, COL, id), {
        status: true,
        updatedAt: serverTimestamp(),
    });
}
