/**
 * Loader — full-page spinner overlay.
 *
 * Usage:
 *   import { showLoader, hideLoader } from "./components/loader.js";
 *   showLoader();
 *   // … async work …
 *   hideLoader();
 */

let loaderEl = null;

function ensure() {
    if (loaderEl) return loaderEl;
    loaderEl = document.createElement("div");
    loaderEl.id = "pageLoader";
    loaderEl.className = "page-loader hide";
    loaderEl.innerHTML = `<div class="spinner"></div>`;
    document.body.appendChild(loaderEl);
    return loaderEl;
}

/** Show the full-page loader. */
export function showLoader() {
    const el = ensure();
    // Force reflow so the transition fires after removing .hide
    el.classList.remove("hide");
    void el.offsetWidth;
}

/** Hide the full-page loader. */
export function hideLoader() {
    const el = ensure();
    el.classList.add("hide");
}
