/**
 * ThemeManager — applies and loads theme colours from settings.
 * Import on every page so the user's chosen theme is always active.
 *
 * Usage:
 *   import { loadAndApplyTheme, applyTheme } from "../helpers/themeManager.js";
 *   await loadAndApplyTheme();          // on page load
 *   applyTheme("#e63946", "#c62d39", "rgba(230,57,70,0.12)");  // live switch
 */

import { getSettings } from "../models/settingsModel.js";

/**
 * Apply theme colours to CSS custom properties.
 * @param {string} primary     — e.g. "#6c63ff"
 * @param {string} primaryDark — e.g. "#5a52d5"
 * @param {string} primaryLight — e.g. "rgba(108,99,255,0.12)"
 */
export function applyTheme(primary, primaryDark, primaryLight) {
    const root = document.documentElement;
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-dark", primaryDark);
    root.style.setProperty("--primary-light", primaryLight);
}

/**
 * Load saved settings from Firestore and apply the theme.
 * Also updates sidebar brand if a restaurant name / logo is saved.
 * Safe to call on any page — silently does nothing on failure.
 */
export async function loadAndApplyTheme() {
    try {
        const settings = await getSettings();
        if (!settings) return;

        // Apply theme colours
        if (settings.primaryColor) {
            applyTheme(
                settings.primaryColor,
                settings.primaryDark || settings.primaryColor,
                settings.primaryLight || `${settings.primaryColor}1f`,
            );
        }

        // Update sidebar brand text & icon
        const brandText = document.querySelector(".sidebar__brand-text");
        const brandIcon = document.querySelector(".sidebar__brand-icon");

        if (brandText && settings.restaurantName) {
            brandText.textContent = settings.restaurantName;
        }
        if (brandIcon && settings.logo) {
            brandIcon.innerHTML = `<img src="${settings.logo}" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;" />`;
        }

        // Update POS topbar brand (different layout, no sidebar)
        const posBrand = document.querySelector(".pos-topbar__brand");
        if (posBrand) {
            const posBrandSpan = posBrand.querySelector("span");
            const posBrandIcon = posBrand.querySelector("i");
            if (posBrandSpan && settings.restaurantName) {
                posBrandSpan.textContent = settings.restaurantName;
            }
            if (settings.logo && posBrandIcon) {
                const img = document.createElement("img");
                img.src = settings.logo;
                img.alt = "Logo";
                img.style.cssText = "max-width:28px;max-height:28px;object-fit:contain;border-radius:4px;";
                posBrandIcon.replaceWith(img);
            }
        }
    } catch (err) {
        console.error("ThemeManager: could not load settings", err);
    }
}
