/**
 * Auth guard — reusable across all management pages.
 * Returns the user profile or redirects to login.
 */

import { auth, onAuthStateChanged } from "../firebase.js";
import { getUserByUid, getUserByEmail } from "../models/userModel.js";
import { showLoader } from "../components/loader.js";

export function guardAuth() {
    return new Promise((resolve) => {
        showLoader();
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.href = "../index.html";
                return;
            }

            let profile = null;
            try {
                const cached = sessionStorage.getItem("restro_user");
                if (cached) profile = JSON.parse(cached);
            } catch (_) { /* ignore */ }

            if (!profile) {
                try {
                    profile = await getUserByUid(user.uid, user.email);
                    if (profile) sessionStorage.setItem("restro_user", JSON.stringify(profile));
                } catch (err) {
                    console.error("Failed to fetch user profile:", err);
                }
            }

            if (!profile || profile.status !== true) {
                window.location.href = "../index.html";
                return;
            }

            resolve(profile);
        });
    });
}

/** Check if the current user is admin. */
export function isAdmin(profile) {
    return profile?.type === "admin";
}
