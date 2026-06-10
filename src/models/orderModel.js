/**
 * OrderModel — Firestore CRUD for the `orders` collection.
 * Uses `orderStatus` for order flow and `status` (boolean) for soft delete.
 */

import {
    db, collection, query, where, getDocs, onSnapshot,
    doc, getDoc, setDoc, updateDoc, serverTimestamp, increment,
} from "../firebase.js";
import { getNextId } from "../helpers/idGenerator.js";

const COL = "orders";

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

// ── Real-time active orders (not completed / cancelled) ────────
export function onActiveOrdersChange(callback) {
    const q = query(
        collection(db, COL),
        where("orderStatus", "in", ["pending", "preparing", "ready", "served"]),
        where("status", "==", true),
    );
    return onSnapshot(q, (snap) => {
        const orders = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((o) => isToday(o.createdAt));
        callback(orders);
    });
}

// ── Create a new order ─────────────────────────────────────────
export async function createOrder(data) {
    const id = await getNextId(COL);
    await setDoc(doc(db, COL, id), {
        ...data,
        orderNumber: id,
        orderStatus: data.orderStatus || "pending",
        status: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return { id, orderNumber: id };
}

// ── Update order status (workflow) ─────────────────────────────
export async function updateOrderStatus(orderId, orderStatus) {
    const upd = { orderStatus, updatedAt: serverTimestamp() };
    if (orderStatus === "completed") upd.completedAt = serverTimestamp();
    await updateDoc(doc(db, COL, orderId), upd);
}

// ── Complete order with payment ────────────────────────────────
export async function completeOrder(orderId, paymentMethod = "cash") {
    await updateDoc(doc(db, COL, orderId), {
        orderStatus: "completed",
        paymentMethod,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

// ── Update order fields (edit) ─────────────────────────────────
export async function updateOrder(orderId, data) {
    await updateDoc(doc(db, COL, orderId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

// ── Get single order by ID ─────────────────────────────────────
export async function getOrderById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Soft-delete an order ───────────────────────────────────────
export async function deleteOrder(id) {
    await updateDoc(doc(db, COL, id), {
        status: false,
        updatedAt: serverTimestamp(),
    });
}

// ── Restore a soft-deleted order ───────────────────────────────
export async function restoreOrder(id) {
    await updateDoc(doc(db, COL, id), {
        status: true,
        updatedAt: serverTimestamp(),
    });
}

// ── Get all orders (for history page) ──────────────────────────
export async function getAllOrders() {
    const q = query(collection(db, COL), where("status", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return list;
}

// ── Get orders by customer ID ──────────────────────────────────
export async function getOrdersByCustomerId(customerId) {
    const q = query(
        collection(db, COL),
        where("customerId", "==", customerId),
        where("status", "==", true),
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return list;
}

// ── Dashboard helpers ──────────────────────────────────────────
export async function getTodaysOrders() {
    const q = query(collection(db, COL), where("status", "==", true));
    const snap = await getDocs(q);
    return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((o) => isToday(o.createdAt));
}

export async function getOngoingOrderCount() {
    const orders = await getTodaysOrders();
    return orders.filter((o) => o.orderStatus === "pending" || o.orderStatus === "preparing").length;
}

export async function getTodaysIncome() {
    const orders = await getTodaysOrders();
    return orders
        .filter((o) => o.orderStatus === "completed" || o.orderStatus === "paid")
        .reduce((sum, o) => sum + (o.total || 0), 0);
}
