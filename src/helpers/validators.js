/**
 * Validators — shared input validation helpers.
 */

/**
 * Basic email format check.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Password must be at least 6 chars (Firebase minimum).
 * @param {string} pwd
 * @returns {boolean}
 */
export function isValidPassword(pwd) {
    return typeof pwd === "string" && pwd.length >= 6;
}
