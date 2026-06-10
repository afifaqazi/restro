/**
 * Formatters — shared display helpers.
 */

/**
 * Format a number as currency (default PKR / Rs.).
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
export function formatCurrency(amount, currency = "PKR") {
    return `${currency} ${Number(amount || 0).toLocaleString("en-PK")}`;
}

/**
 * Friendly date string.
 * @param {Date|{toDate:Function}} ts
 * @returns {string}
 */
export function formatTimestamp(ts) {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
}
