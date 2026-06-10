/**
 * ReservationModel — Firestore CRUD for `reservations`.
 */

import {
    db, updateDoc, doc, setDoc, serverTimestamp,
} from "../firebase.js";
import { getNextId } from "../helpers/idGenerator.js";

const COL = "reservations";

/**
 * Create a new reservation.
 */
export async function createReservation(data) {
    const id = await getNextId(COL);
    await setDoc(doc(db, COL, id), {
        ...data,
        status: "upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return { id };
}

/**
 * Update reservation status.
 */
export async function updateReservationStatus(id, status) {
    await updateDoc(doc(db, COL, id), {
        status,
        updatedAt: serverTimestamp(),
    });
}
