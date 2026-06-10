/**
 * AuthModel — Firebase Auth operations for user management.
 *
 * Creating users uses a secondary Firebase App to avoid signing out the current admin.
 * Email / password updates work directly for the currently signed-in user.
 * For other users, password resets are sent via email.
 */

import {
    auth,
    firebaseConfig,
    initializeApp,
    deleteApp,
    getAuth,
    createUserWithEmailAndPassword,
    updateEmail,
    updatePassword,
    sendPasswordResetEmail,
    signOut as fbSignOut,
} from "../firebase.js";

/**
 * Create a new Firebase Auth user WITHOUT signing out the current admin.
 * Uses a temporary secondary Firebase app instance.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} — the new user's Firebase Auth UID
 */
export async function createAuthUser(email, password) {
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuth_" + Date.now());
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const { user } = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = user.uid;
        await fbSignOut(secondaryAuth);
        await deleteApp(secondaryApp);
        return uid;
    } catch (err) {
        await fbSignOut(secondaryAuth).catch(() => { });
        await deleteApp(secondaryApp).catch(() => { });
        throw err;
    }
}

/**
 * Update the currently signed-in user's email in Firebase Auth.
 * @param {string} newEmail
 */
export async function updateCurrentUserEmail(newEmail) {
    if (!auth.currentUser) throw new Error("No user signed in");
    await updateEmail(auth.currentUser, newEmail);
}

/**
 * Update the currently signed-in user's password in Firebase Auth.
 * @param {string} newPassword
 */
export async function updateCurrentUserPassword(newPassword) {
    if (!auth.currentUser) throw new Error("No user signed in");
    await updatePassword(auth.currentUser, newPassword);
}

/**
 * Send a password-reset email so the user can set a new password.
 * Works for any user (current or other).
 * @param {string} email — the user's current Firebase Auth email
 */
export async function sendResetEmail(email) {
    await sendPasswordResetEmail(auth, email);
}
