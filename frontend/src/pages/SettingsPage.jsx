import React, { useState, useEffect } from "react";
import { getCurrentProfile, updateCurrentProfile } from "../lib/apiClient";
import "./SettingsPage.css";

/* ── Mock settings state ──────────────────────────────────────── */

const initialSettings = {
  // Profile
  displayName: "Omansh Choudhary",
  username: "omansh",
  bio: "Building the future of social blogging. Creator of Ziele.",
  email: "omansh@ziele.app",
  // Appearance
  theme: "system",
  fontSize: "medium",
  compactMode: false,
  // Notifications
  emailNotifications: true,
  pushNotifications: true,
  commentNotify: true,
  followNotify: true,
  likeNotify: false,
  weeklyDigest: true,
  // Privacy
  profilePublic: true,
  showEmail: false,
  showActivity: true,
  allowDMs: true,
};

const SETTING_SECTIONS = [
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "appearance", label: "Appearance", icon: "🎨" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "privacy", label: "Privacy", icon: "🔒" },
  { id: "account", label: "Account", icon: "⚙️" },
];

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const fontSizeOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentProfile()
      .then((profile) => {
        if (!cancelled && profile) {
          setSettings((prev) => ({
            ...prev,
            displayName: profile.name || prev.displayName,
            username: profile.handle || prev.username,
            bio: profile.bio || prev.bio,
          }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await updateCurrentProfile({
        name: settings.displayName,
        handle: settings.username,
        bio: settings.bio,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  const renderToggle = (key, label, desc) => (
    <div className="settings-toggle-row" key={key}>
      <div className="settings-toggle-info">
        <span className="settings-toggle-label">{label}</span>
        {desc && <span className="settings-toggle-desc">{desc}</span>}
      </div>
      <button
        type="button"
        className={`settings-toggle${settings[key] ? " active" : ""}`}
        onClick={() => updateSetting(key, !settings[key])}
        role="switch"
        aria-checked={settings[key]}
        aria-label={label}
      >
        <span className="settings-toggle-knob" />
      </button>
    </div>
  );

  return (
    <div className="page settings-page">
      <div className="settings-header">
        <h1>
          <span className="settings-header-icon" aria-hidden="true">⚙️</span>
          Settings
        </h1>
        <button
          type="button"
          className={`settings-save-btn${saved ? " saved" : ""}`}
          onClick={handleSave}
        >
          {saved ? "✓ Saved" : "Save changes"}
        </button>
      </div>

      <div className="settings-layout">
        {/* ── Sidebar nav ── */}
        <nav className="settings-nav" aria-label="Settings sections">
          {SETTING_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`settings-nav-btn${activeSection === section.id ? " active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="settings-nav-icon">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <div className="settings-content">

          {/* Profile */}
          {activeSection === "profile" && (
            <section className="settings-section" aria-labelledby="settings-profile-title">
              <h2 id="settings-profile-title">Profile Settings</h2>
              <p className="settings-section-desc">Manage how your profile appears to other users.</p>

              <div className="settings-field">
                <label htmlFor="settings-display-name">Display Name</label>
                <input
                  id="settings-display-name"
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => updateSetting("displayName", e.target.value)}
                  className="settings-input"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="settings-username">Username</label>
                <div className="settings-input-with-prefix">
                  <span className="settings-input-prefix">@</span>
                  <input
                    id="settings-username"
                    type="text"
                    value={settings.username}
                    onChange={(e) => updateSetting("username", e.target.value)}
                    className="settings-input"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label htmlFor="settings-bio">Bio</label>
                <textarea
                  id="settings-bio"
                  value={settings.bio}
                  onChange={(e) => updateSetting("bio", e.target.value)}
                  className="settings-textarea"
                  rows={3}
                  maxLength={160}
                />
                <span className="settings-char-count">{settings.bio.length}/160</span>
              </div>

              <div className="settings-field">
                <label htmlFor="settings-email">Email</label>
                <input
                  id="settings-email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateSetting("email", e.target.value)}
                  className="settings-input"
                />
              </div>
            </section>
          )}

          {/* Appearance */}
          {activeSection === "appearance" && (
            <section className="settings-section" aria-labelledby="settings-appearance-title">
              <h2 id="settings-appearance-title">Appearance</h2>
              <p className="settings-section-desc">Customize how Ziele looks and feels.</p>

              <div className="settings-field">
                <label>Theme</label>
                <div className="settings-radio-group">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`settings-radio-btn${settings.theme === opt.value ? " active" : ""}`}
                      onClick={() => updateSetting("theme", opt.value)}
                    >
                      {opt.value === "light" && "☀️"}
                      {opt.value === "dark" && "🌙"}
                      {opt.value === "system" && "💻"}
                      {" "}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-field">
                <label>Font Size</label>
                <div className="settings-radio-group">
                  {fontSizeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`settings-radio-btn${settings.fontSize === opt.value ? " active" : ""}`}
                      onClick={() => updateSetting("fontSize", opt.value)}
                    >
                      <span style={{ fontSize: opt.value === "small" ? "0.8rem" : opt.value === "large" ? "1.1rem" : "0.95rem" }}>
                        Aa
                      </span>
                      {" "}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {renderToggle("compactMode", "Compact Mode", "Reduce spacing for a denser layout")}
            </section>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <section className="settings-section" aria-labelledby="settings-notifications-title">
              <h2 id="settings-notifications-title">Notifications</h2>
              <p className="settings-section-desc">Choose what you&apos;re notified about.</p>

              <div className="settings-group">
                <h3 className="settings-group-title">Channels</h3>
                {renderToggle("emailNotifications", "Email Notifications", "Receive notifications via email")}
                {renderToggle("pushNotifications", "Push Notifications", "Browser and mobile push alerts")}
              </div>

              <div className="settings-group">
                <h3 className="settings-group-title">Activity</h3>
                {renderToggle("commentNotify", "Comments", "When someone comments on your posts")}
                {renderToggle("followNotify", "New Followers", "When someone follows you")}
                {renderToggle("likeNotify", "Likes", "When someone likes your posts")}
              </div>

              <div className="settings-group">
                <h3 className="settings-group-title">Digest</h3>
                {renderToggle("weeklyDigest", "Weekly Digest", "A summary of your activity every week")}
              </div>
            </section>
          )}

          {/* Privacy */}
          {activeSection === "privacy" && (
            <section className="settings-section" aria-labelledby="settings-privacy-title">
              <h2 id="settings-privacy-title">Privacy</h2>
              <p className="settings-section-desc">Control who can see your information.</p>

              {renderToggle("profilePublic", "Public Profile", "Anyone can view your profile")}
              {renderToggle("showEmail", "Show Email", "Display your email on your profile")}
              {renderToggle("showActivity", "Show Activity", "Others can see when you were last active")}
              {renderToggle("allowDMs", "Allow Messages", "Let other users send you direct messages")}
            </section>
          )}

          {/* Account */}
          {activeSection === "account" && (
            <section className="settings-section" aria-labelledby="settings-account-title">
              <h2 id="settings-account-title">Account</h2>
              <p className="settings-section-desc">Manage your account security and data.</p>

              <div className="settings-account-actions">
                <div className="settings-account-card">
                  <div>
                    <h4>Change Password</h4>
                    <p>Update your password to keep your account secure.</p>
                  </div>
                  <button type="button" className="settings-action-btn">Update</button>
                </div>

                <div className="settings-account-card">
                  <div>
                    <h4>Export Data</h4>
                    <p>Download a copy of all your posts, comments, and profile data.</p>
                  </div>
                  <button type="button" className="settings-action-btn">Download</button>
                </div>

                <div className="settings-account-card settings-account-card--danger">
                  <div>
                    <h4>Deactivate Account</h4>
                    <p>Temporarily disable your account. You can reactivate anytime.</p>
                  </div>
                  <button type="button" className="settings-action-btn settings-action-btn--danger">
                    Deactivate
                  </button>
                </div>

                <div className="settings-account-card settings-account-card--danger">
                  <div>
                    <h4>Delete Account</h4>
                    <p>Permanently remove your account and all associated data. This action cannot be undone.</p>
                  </div>
                  <button type="button" className="settings-action-btn settings-action-btn--danger">
                    Delete
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
