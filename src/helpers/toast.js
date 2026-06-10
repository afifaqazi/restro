/**
 * Toast — lightweight notification component.
 *
 * Usage:
 *   import { showToast } from "./components/toast.js";
 *   showToast("Order saved!", "success");   // success | error | warning | info
 */

const ICON_MAP = {
    success: "bi-check-circle-fill",
    error: "bi-exclamation-triangle-fill",
    warning: "bi-exclamation-circle-fill",
    info: "bi-info-circle-fill",
};

/** Ensure a wrapper container exists in the DOM. */
function getWrapper() {
    let wrapper = document.getElementById("toastWrapper");
    if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.id = "toastWrapper";
        wrapper.className = "toast-wrapper";
        document.body.appendChild(wrapper);
    }
    return wrapper;
}

/**
 * Show a toast notification.
 * @param {string} message  — Text to display.
 * @param {"success"|"error"|"warning"|"info"} type — Toast type.
 * @param {number} duration — Auto-dismiss ms (default 3000).
 */
export function showToast(message, type = "info", duration = 3000) {
    const wrapper = getWrapper();

    const el = document.createElement("div");
    el.className = `toast-item toast-${type}`;
    el.innerHTML = `<i class="bi ${ICON_MAP[type] || ICON_MAP.info}"></i><span>${message}</span>`;
    wrapper.appendChild(el);

    // Auto-dismiss
    setTimeout(() => {
        el.classList.add("toast-hide");
        el.addEventListener("animationend", () => el.remove());
    }, duration);
}
