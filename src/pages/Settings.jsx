import { useState, useEffect } from "react";
import { getSettings, saveSettings } from "../models/settingsModel";
import { showToast } from "../helpers/toast";
import { applyTheme } from "../helpers/themeManager";

const THEME_PRESETS = [
  { id: "violet", name: "Violet", color: "#6c63ff", dark: "#5a52d5", light: "rgba(108,99,255,0.12)" },
  { id: "crimson", name: "Crimson", color: "#e63946", dark: "#c62d39", light: "rgba(230,57,70,0.12)" },
  { id: "emerald", name: "Emerald", color: "#10b981", dark: "#059669", light: "rgba(16,185,129,0.12)" },
  { id: "ocean", name: "Ocean Blue", color: "#2196f3", dark: "#1976d2", light: "rgba(33,150,243,0.12)" },
  { id: "amber", name: "Amber", color: "#f59e0b", dark: "#d97706", light: "rgba(245,158,11,0.12)" },
  { id: "charcoal", name: "Charcoal", color: "#374151", dark: "#1f2937", light: "rgba(55,65,81,0.12)" },
  { id: "teal", name: "Teal", color: "#0d9488", dark: "#0f766e", light: "rgba(13,148,136,0.12)" },
  { id: "royal", name: "Royal Purple", color: "#7c3aed", dark: "#6d28d9", light: "rgba(124,58,237,0.12)" },
  { id: "rose", name: "Rose", color: "#e11d48", dark: "#be123c", light: "rgba(225,29,72,0.12)" },
  { id: "indigo", name: "Indigo", color: "#4f46e5", dark: "#4338ca", light: "rgba(79,70,229,0.12)" },
  { id: "sky", name: "Sky", color: "#0ea5e9", dark: "#0284c7", light: "rgba(14,165,233,0.12)" },
  { id: "bronze", name: "Bronze", color: "#92400e", dark: "#78350f", light: "rgba(146,64,14,0.12)" },
];

export default function Settings() {
  const [settings, setSettings] = useState({
    restaurantName: "",
    address: "",
    phone: "",
    logo: "",
    theme: "violet"
  });
  
  const [logoPreview, setLogoPreview] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0]);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentSettings = await getSettings();
        if (currentSettings) {
          setSettings(currentSettings);
          setLogoPreview(currentSettings.logo || "");
          const preset = THEME_PRESETS.find(p => p.id === currentSettings.theme) || THEME_PRESETS[0];
          setSelectedTheme(preset);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        showToast("Could not load settings.", "error");
      }
    };
    loadSettings();
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      showToast("Logo must be under 200 KB.", "warning");
      e.target.value = "";
      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Only PNG, JPG, SVG, or WebP allowed.", "warning");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!settings.restaurantName) {
      showToast("Restaurant name is required.", "warning");
      return;
    }

    setIsSavingDetails(true);
    try {
      await saveSettings({
        ...settings,
        logo: logoPreview,
        theme: selectedTheme.id,
        primaryColor: selectedTheme.color,
        primaryDark: selectedTheme.dark,
        primaryLight: selectedTheme.light,
      });
      showToast("Restaurant details saved!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save details.", "error");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
    try {
      await saveSettings({
        ...settings,
        logo: logoPreview,
        theme: selectedTheme.id,
        primaryColor: selectedTheme.color,
        primaryDark: selectedTheme.dark,
        primaryLight: selectedTheme.light,
      });
      applyTheme(selectedTheme.color, selectedTheme.dark, selectedTheme.light);
      showToast(`Theme "${selectedTheme.name}" applied!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to apply theme.", "error");
    } finally {
      setIsSavingTheme(false);
    }
  };

  return (
    <section className="settings-content">
      {/* ── Restaurant Details Card ── */}
      <div className="settings-card">
        <div className="settings-card__header">
          <div className="settings-card__icon">
            <i className="bi bi-shop"></i>
          </div>
          <div>
            <h5 className="settings-card__title">Restaurant Details</h5>
            <p className="settings-card__desc">This information appears on the sidebar, topbar, and printed bills.</p>
          </div>
        </div>

        <form className="settings-form" onSubmit={handleSaveDetails} noValidate>
          <div className="settings-logo-section">
            <div className="settings-logo-preview">
              {logoPreview ? (
                <img src={logoPreview} alt="Restaurant logo" />
              ) : (
                <>
                  <i className="bi bi-image placeholder-icon"></i>
                  <span className="placeholder-text">No logo</span>
                </>
              )}
            </div>
            <div className="settings-logo-actions">
              <label htmlFor="logoInput" className="btn btn-sm btn-outline-brand">
                <i className="bi bi-upload me-1"></i> Upload Logo
              </label>
              <input type="file" id="logoInput" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden onChange={handleLogoUpload} />
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleRemoveLogo}>
                <i className="bi bi-trash me-1"></i> Remove
              </button>
              <p className="settings-logo-hint">PNG, JPG, SVG or WebP. Max 200 KB. Recommended: 200×60 px.</p>
            </div>
          </div>

          <div className="form-group">
            <label>Restaurant Name</label>
            <input type="text" className="form-control form-control-brand" placeholder="e.g. The Royal Kitchen" maxLength="80" required value={settings.restaurantName} onChange={e => setSettings({ ...settings, restaurantName: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control form-control-brand" rows="2" placeholder="Address goes here" maxLength="250" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })}></textarea>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" className="form-control form-control-brand" placeholder="e.g. +92 300 1234567" maxLength="20" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
          </div>

          <button type="submit" className="btn btn-brand" disabled={isSavingDetails}>
            {isSavingDetails ? <><span className="btn-spinner"></span> Saving…</> : <><i className="bi bi-check-lg me-1"></i> Save Details</>}
          </button>
        </form>
      </div>

      {/* ── Theme Colors Card ── */}
      <div className="settings-card">
        <div className="settings-card__header">
          <div className="settings-card__icon">
            <i className="bi bi-palette"></i>
          </div>
          <div>
            <h5 className="settings-card__title">Theme &amp; Ambience</h5>
            <p className="settings-card__desc">Pick a colour scheme that matches your restaurant's personality.</p>
          </div>
        </div>

        <div className="theme-grid">
          {THEME_PRESETS.map((t) => (
            <div key={t.id} className={`theme-swatch ${t.id === selectedTheme.id ? "active" : ""}`} onClick={() => setSelectedTheme(t)}>
              <div className="theme-swatch__color" style={{ background: t.color }}>
                <i className="bi bi-check-lg theme-swatch__check"></i>
              </div>
              <span className="theme-swatch__name">{t.name}</span>
              <span className="theme-swatch__hex">{t.color}</span>
            </div>
          ))}
        </div>

        <div className="theme-preview">
          <div className="theme-preview__bar">
            <span className="theme-preview__swatch" style={{ background: selectedTheme.color }}></span>
            <span className="theme-preview__label">{selectedTheme.name}</span>
          </div>
          <div className="theme-preview__samples">
            <button className="btn btn-sm theme-preview__btn-primary" style={{ background: selectedTheme.color }}>Primary</button>
            <button className="btn btn-sm theme-preview__btn-outline" style={{ color: selectedTheme.color, borderColor: selectedTheme.color }}>Outline</button>
            <span className="theme-preview__link" style={{ color: selectedTheme.color }}>Sample link</span>
          </div>
        </div>

        <button type="button" className="btn btn-brand" onClick={handleSaveTheme} disabled={isSavingTheme}>
          {isSavingTheme ? <><span className="btn-spinner"></span> Applying…</> : <><i className="bi bi-brush me-1"></i> Apply Theme</>}
        </button>
      </div>
    </section>
  );
}
