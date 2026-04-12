import React from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  getBookmarkedPosts,
  getCurrentProfile,
  getDrafts,
  getNotifications,
  getPosts,
  updateCurrentProfile,
} from "../lib/apiClient";
import "./SettingsPage.css";

const SETTINGS_STORAGE_KEY = "ziele-settings-preferences-v1";
const THEME_STORAGE_KEY = "ziele-theme";
const FONT_SIZE_STORAGE_KEY = "ziele-font-size";
const COMPACT_MODE_STORAGE_KEY = "ziele-compact-mode";
const THEME_PREFERENCE_EVENT = "ziele:theme-preference-updated";

const DEFAULT_SETTINGS = {
  displayName: "",
  username: "",
  bio: "",
  email: "",
  theme: "system",
  fontSize: "medium",
  compactMode: false,
  emailNotifications: true,
  pushNotifications: true,
  commentNotify: true,
  followNotify: true,
  likeNotify: false,
  weeklyDigest: true,
  profilePublic: true,
  showEmail: false,
  showActivity: true,
  allowDMs: true,
};

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy" },
  { id: "account", label: "Account" },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const FONT_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const FONT_SIZE_MAP = {
  small: "15px",
  medium: "16px",
  large: "17px",
};

function normalizeUsername(value = "") {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

function normalizeBio(value = "") {
  return String(value || "").trim().slice(0, 160);
}

function getLoginEmail(user, fallback = "") {
  if (!user) return String(fallback || "");

  const primary = user.primaryEmailAddress?.emailAddress;
  if (primary) return primary;

  const first = user.emailAddresses?.[0]?.emailAddress;
  return first || String(fallback || "");
}

function getDefaultDisplayName(user, fallbackUsername = "") {
  const value =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    fallbackUsername ||
    "";
  return String(value || "").trim();
}

function getDefaultUsername(user, loginEmail = "") {
  const emailPart = String(loginEmail || "")
    .split("@")[0]
    .trim();
  return normalizeUsername(user?.username || emailPart);
}

function getPreferenceSnapshot(settings) {
  return {
    theme: settings.theme,
    fontSize: settings.fontSize,
    compactMode: Boolean(settings.compactMode),
    emailNotifications: Boolean(settings.emailNotifications),
    pushNotifications: Boolean(settings.pushNotifications),
    commentNotify: Boolean(settings.commentNotify),
    followNotify: Boolean(settings.followNotify),
    likeNotify: Boolean(settings.likeNotify),
    weeklyDigest: Boolean(settings.weeklyDigest),
    profilePublic: Boolean(settings.profilePublic),
    showEmail: Boolean(settings.showEmail),
    showActivity: Boolean(settings.showActivity),
    allowDMs: Boolean(settings.allowDMs),
  };
}

function loadStoredPreferences() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return getPreferenceSnapshot({
      ...DEFAULT_SETTINGS,
      ...parsed,
    });
  } catch {
    return {};
  }
}

function saveStoredPreferences(preferences) {
  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    // Ignore storage failures; app still works in memory.
  }
}

function resolveTheme(theme) {
  if (theme === "light" || theme === "dark") return theme;
  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)",
  )?.matches;
  return prefersDark ? "dark" : "light";
}

function applyAppearancePreferences(preferences) {
  const resolvedTheme = resolveTheme(preferences.theme);
  const nextFontSize = FONT_SIZE_MAP[preferences.fontSize] || FONT_SIZE_MAP.medium;

  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.body.setAttribute("data-theme", resolvedTheme);
  document.documentElement.style.fontSize = nextFontSize;
  document.body.classList.toggle("compact-mode", Boolean(preferences.compactMode));

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
    window.localStorage.setItem(
      FONT_SIZE_STORAGE_KEY,
      preferences.fontSize || "medium",
    );
    window.localStorage.setItem(
      COMPACT_MODE_STORAGE_KEY,
      preferences.compactMode ? "true" : "false",
    );
  } catch {
    // Ignore storage failures.
  }

  window.dispatchEvent(
    new CustomEvent(THEME_PREFERENCE_EVENT, {
      detail: {
        theme: preferences.theme,
        resolvedTheme,
        fontSize: preferences.fontSize,
        compactMode: Boolean(preferences.compactMode),
      },
    }),
  );
}

function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function safeFromSettled(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState("profile");
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [accountBusy, setAccountBusy] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [infoMessage, setInfoMessage] = React.useState("");

  const displayNameEditedRef = React.useRef(false);
  const usernameEditedRef = React.useRef(false);

  const navigate = useNavigate();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { openUserProfile } = useClerk();

  React.useEffect(() => {
    if (!isUserLoaded) return undefined;

    let cancelled = false;
    const storedPreferences = loadStoredPreferences();
    const loginEmail = getLoginEmail(user);
    const fallbackUsername = getDefaultUsername(user, loginEmail);
    const fallbackDisplayName = getDefaultDisplayName(user, fallbackUsername);

    setSettings((prev) => ({
      ...prev,
      ...storedPreferences,
      email: loginEmail || prev.email,
    }));
    applyAppearancePreferences({
      ...DEFAULT_SETTINGS,
      ...storedPreferences,
    });

    getCurrentProfile()
      .then((profile) => {
        if (cancelled || !profile) return;

        const nextUsername = normalizeUsername(
          profile.username || profile.handle || fallbackUsername,
        );

        const nextDisplayName =
          String(profile.name || fallbackDisplayName || nextUsername).trim();

        setSettings((prev) => ({
          ...prev,
          ...storedPreferences,
          displayName: nextDisplayName,
          username: nextUsername,
          bio: normalizeBio(profile.bio || ""),
          email: getLoginEmail(user, profile.email || prev.email),
        }));

        displayNameEditedRef.current = false;
        usernameEditedRef.current = false;
      })
      .catch(() => {
        if (cancelled) return;

        setSettings((prev) => ({
          ...prev,
          ...storedPreferences,
          displayName: fallbackDisplayName || prev.displayName,
          username: fallbackUsername || prev.username,
          email: loginEmail || prev.email,
        }));

        setErrorMessage(
          "Could not fetch profile from backend. Showing identity from your login session.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isUserLoaded, user]);

  React.useEffect(() => {
    if (!saved) return undefined;
    const timeout = window.setTimeout(() => setSaved(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  const {
    theme,
    fontSize,
    compactMode,
    emailNotifications,
    pushNotifications,
    commentNotify,
    followNotify,
    likeNotify,
    weeklyDigest,
    profilePublic,
    showEmail,
    showActivity,
    allowDMs,
  } = settings;

  const preferenceSnapshot = React.useMemo(
    () => ({
      theme,
      fontSize,
      compactMode,
      emailNotifications,
      pushNotifications,
      commentNotify,
      followNotify,
      likeNotify,
      weeklyDigest,
      profilePublic,
      showEmail,
      showActivity,
      allowDMs,
    }),
    [
      theme,
      fontSize,
      compactMode,
      emailNotifications,
      pushNotifications,
      commentNotify,
      followNotify,
      likeNotify,
      weeklyDigest,
      profilePublic,
      showEmail,
      showActivity,
      allowDMs,
    ],
  );

  React.useEffect(() => {
    if (loading) return;
    saveStoredPreferences(preferenceSnapshot);
    applyAppearancePreferences(preferenceSnapshot);
  }, [loading, preferenceSnapshot]);

  const updateSetting = React.useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setErrorMessage("");
  }, []);

  const handleDisplayNameChange = (event) => {
    const nextValue = event.target.value;
    displayNameEditedRef.current = true;

    setSettings((prev) => {
      const next = {
        ...prev,
        displayName: nextValue,
      };

      if (!usernameEditedRef.current) {
        const derivedUsername = normalizeUsername(nextValue);
        if (derivedUsername) {
          next.username = derivedUsername;
        }
      }

      return next;
    });

    setSaved(false);
    setErrorMessage("");
  };

  const handleUsernameChange = (event) => {
    const typedValue = event.target.value;
    const normalized = normalizeUsername(typedValue);
    usernameEditedRef.current = true;

    setSettings((prev) => {
      const next = {
        ...prev,
        username: normalized,
      };

      if (!displayNameEditedRef.current) {
        next.displayName = typedValue.trim();
      }

      return next;
    });

    setSaved(false);
    setErrorMessage("");
  };

  const openAccountCenter = React.useCallback(() => {
    if (typeof openUserProfile === "function") {
      openUserProfile();
      return;
    }

    navigate("/profile");
  }, [navigate, openUserProfile]);

  const handleSave = async () => {
    if (saving || loading) return;

    const normalizedUsername = normalizeUsername(
      settings.username || settings.displayName || getDefaultUsername(user, settings.email),
    );
    const normalizedName = String(
      settings.displayName || normalizedUsername,
    )
      .trim()
      .slice(0, 64);
    const normalizedBio = normalizeBio(settings.bio);

    if (!normalizedUsername) {
      setErrorMessage(
        "Username is required. Use letters, numbers, or underscores only.",
      );
      return;
    }

    if (!normalizedName) {
      setErrorMessage("Display name is required.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const updatedProfile = await updateCurrentProfile({
        name: normalizedName,
        handle: normalizedUsername,
        bio: normalizedBio,
      });

      let clerkSyncWarning = "";
      if (
        user &&
        typeof user.update === "function" &&
        normalizeUsername(user.username || "") !== normalizedUsername
      ) {
        try {
          await user.update({ username: normalizedUsername });
        } catch {
          clerkSyncWarning =
            "Settings were saved, but Clerk username could not be synced here. Use Account -> Manage account details.";
        }
      }

      const mergedEmail = getLoginEmail(user, updatedProfile?.email || settings.email);
      const mergedUsername = normalizeUsername(
        updatedProfile?.username || updatedProfile?.handle || normalizedUsername,
      );

      setSettings((prev) => ({
        ...prev,
        displayName: String(updatedProfile?.name || normalizedName).trim(),
        username: mergedUsername,
        bio: normalizeBio(updatedProfile?.bio ?? normalizedBio),
        email: mergedEmail,
      }));

      displayNameEditedRef.current = false;
      usernameEditedRef.current = false;
      setSaved(true);
      setInfoMessage(clerkSyncWarning || "Settings saved successfully.");
    } catch (error) {
      setErrorMessage(error?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (accountBusy) return;

    setAccountBusy(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const [
        profileResult,
        postsResult,
        notificationsResult,
        bookmarksResult,
        draftsResult,
      ] = await Promise.allSettled([
        getCurrentProfile(),
        getPosts(),
        getNotifications(),
        getBookmarkedPosts(),
        getDrafts(),
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        identity: {
          clerkId: user?.id || null,
          email: getLoginEmail(user, settings.email),
          username: normalizeUsername(settings.username),
          displayName: settings.displayName,
        },
        profile: safeFromSettled(profileResult, null),
        posts: safeFromSettled(postsResult, []),
        notifications: safeFromSettled(notificationsResult, []),
        bookmarks: safeFromSettled(bookmarksResult, []),
        drafts: safeFromSettled(draftsResult, []),
        preferences: getPreferenceSnapshot(settings),
      };

      const dateLabel = new Date().toISOString().slice(0, 10);
      downloadJsonFile(exportPayload, `ziele-data-export-${dateLabel}.json`);
      setInfoMessage("Data export downloaded.");
    } catch {
      setErrorMessage("Could not export data right now.");
    } finally {
      setAccountBusy(false);
    }
  };

  const handleDeactivateAccount = () => {
    const confirmed = window.confirm(
      "This opens your account management screen to continue deactivation. Continue?",
    );
    if (!confirmed) return;

    openAccountCenter();
    setInfoMessage(
      "Account management opened. Use Clerk account controls to deactivate safely.",
    );
  };

  const handleDeleteAccount = async () => {
    if (accountBusy) return;
    if (!user || typeof user.delete !== "function") {
      setErrorMessage(
        "Delete action is unavailable in this session. Open account management and delete from there.",
      );
      return;
    }

    const confirmDelete = window.confirm(
      "Delete account permanently? This cannot be undone.",
    );
    if (!confirmDelete) return;

    const typed = window.prompt("Type DELETE to confirm:");
    if (typed !== "DELETE") {
      setInfoMessage("Account deletion canceled.");
      return;
    }

    setAccountBusy(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      await user.delete();
      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Could not delete account from this session. Open account management and retry.",
      );
    } finally {
      setAccountBusy(false);
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
        <h1>Settings</h1>
        <button
          type="button"
          className={`settings-save-btn${saved ? " saved" : ""}`}
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </button>
      </div>

      {loading ? (
        <p className="settings-status">Loading settings...</p>
      ) : null}
      {errorMessage ? (
        <p className="settings-status settings-status--error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {infoMessage ? (
        <p className="settings-status settings-status--info">{infoMessage}</p>
      ) : null}

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`settings-nav-btn${activeSection === section.id ? " active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeSection === "profile" && (
            <section
              className="settings-section"
              aria-labelledby="settings-profile-title"
            >
              <h2 id="settings-profile-title">Profile Settings</h2>
              <p className="settings-section-desc">
                Display name and username stay synced with your profile identity.
              </p>

              <div className="settings-field">
                <label htmlFor="settings-display-name">Display Name</label>
                <input
                  id="settings-display-name"
                  type="text"
                  value={settings.displayName}
                  onChange={handleDisplayNameChange}
                  className="settings-input"
                  maxLength={64}
                  disabled={loading || saving}
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
                    onChange={handleUsernameChange}
                    className="settings-input"
                    maxLength={30}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={loading || saving}
                  />
                </div>
              </div>

              <div className="settings-field">
                <label htmlFor="settings-bio">Bio</label>
                <textarea
                  id="settings-bio"
                  value={settings.bio}
                  onChange={(event) =>
                    updateSetting("bio", normalizeBio(event.target.value))
                  }
                  className="settings-textarea"
                  rows={3}
                  maxLength={160}
                  disabled={loading || saving}
                />
                <span className="settings-char-count">{settings.bio.length}/160</span>
              </div>

              <div className="settings-field">
                <label htmlFor="settings-email">Login Email</label>
                <input
                  id="settings-email"
                  type="email"
                  value={settings.email}
                  className="settings-input settings-input--readonly"
                  readOnly
                />
                <span className="settings-field-help">
                  This is your authenticated Clerk login email.
                </span>
              </div>
            </section>
          )}

          {activeSection === "appearance" && (
            <section
              className="settings-section"
              aria-labelledby="settings-appearance-title"
            >
              <h2 id="settings-appearance-title">Appearance</h2>
              <p className="settings-section-desc">
                Theme, font size, and compact mode are applied instantly.
              </p>

              <div className="settings-field">
                <label>Theme</label>
                <div className="settings-radio-group">
                  {THEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`settings-radio-btn${settings.theme === opt.value ? " active" : ""}`}
                      onClick={() => updateSetting("theme", opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-field">
                <label>Font Size</label>
                <div className="settings-radio-group">
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`settings-radio-btn${settings.fontSize === opt.value ? " active" : ""}`}
                      onClick={() => updateSetting("fontSize", opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {renderToggle(
                "compactMode",
                "Compact Mode",
                "Reduce spacing for denser layout.",
              )}
            </section>
          )}

          {activeSection === "notifications" && (
            <section
              className="settings-section"
              aria-labelledby="settings-notifications-title"
            >
              <h2 id="settings-notifications-title">Notifications</h2>
              <p className="settings-section-desc">
                Notification preferences are stored and restored automatically.
              </p>

              <div className="settings-group">
                <h3 className="settings-group-title">Channels</h3>
                {renderToggle(
                  "emailNotifications",
                  "Email Notifications",
                  "Receive notifications via email.",
                )}
                {renderToggle(
                  "pushNotifications",
                  "Push Notifications",
                  "Browser and mobile push alerts.",
                )}
              </div>

              <div className="settings-group">
                <h3 className="settings-group-title">Activity</h3>
                {renderToggle(
                  "commentNotify",
                  "Comments",
                  "When someone comments on your posts.",
                )}
                {renderToggle(
                  "followNotify",
                  "New Followers",
                  "When someone follows you.",
                )}
                {renderToggle("likeNotify", "Likes", "When someone likes your posts.")}
              </div>

              <div className="settings-group">
                <h3 className="settings-group-title">Digest</h3>
                {renderToggle(
                  "weeklyDigest",
                  "Weekly Digest",
                  "A weekly summary of account activity.",
                )}
              </div>
            </section>
          )}

          {activeSection === "privacy" && (
            <section
              className="settings-section"
              aria-labelledby="settings-privacy-title"
            >
              <h2 id="settings-privacy-title">Privacy</h2>
              <p className="settings-section-desc">
                Privacy preferences are now persisted.
              </p>

              {renderToggle(
                "profilePublic",
                "Public Profile",
                "Allow everyone to view your profile.",
              )}
              {renderToggle(
                "showEmail",
                "Show Email",
                "Display login email on profile (if supported by profile UI).",
              )}
              {renderToggle(
                "showActivity",
                "Show Activity",
                "Allow others to see your activity status.",
              )}
              {renderToggle(
                "allowDMs",
                "Allow Messages",
                "Allow direct messages from other users.",
              )}
            </section>
          )}

          {activeSection === "account" && (
            <section
              className="settings-section"
              aria-labelledby="settings-account-title"
            >
              <h2 id="settings-account-title">Account</h2>
              <p className="settings-section-desc">
                Manage account security and data controls.
              </p>

              <div className="settings-account-actions">
                <div className="settings-account-card">
                  <div>
                    <h4>Change Password</h4>
                    <p>Open account security settings and update password.</p>
                  </div>
                  <button
                    type="button"
                    className="settings-action-btn"
                    onClick={openAccountCenter}
                    disabled={accountBusy}
                  >
                    Open
                  </button>
                </div>

                <div className="settings-account-card">
                  <div>
                    <h4>Export Data</h4>
                    <p>Download profile, posts, drafts, bookmarks, and notifications.</p>
                  </div>
                  <button
                    type="button"
                    className="settings-action-btn"
                    onClick={handleExportData}
                    disabled={accountBusy}
                  >
                    Download
                  </button>
                </div>

                <div className="settings-account-card settings-account-card--danger">
                  <div>
                    <h4>Deactivate Account</h4>
                    <p>Open account controls to continue a safe deactivation flow.</p>
                  </div>
                  <button
                    type="button"
                    className="settings-action-btn settings-action-btn--danger"
                    onClick={handleDeactivateAccount}
                    disabled={accountBusy}
                  >
                    Deactivate
                  </button>
                </div>

                <div className="settings-account-card settings-account-card--danger">
                  <div>
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account after explicit confirmation.</p>
                  </div>
                  <button
                    type="button"
                    className="settings-action-btn settings-action-btn--danger"
                    onClick={handleDeleteAccount}
                    disabled={accountBusy}
                  >
                    Delete
                  </button>
                </div>

                <div className="settings-account-card">
                  <div>
                    <h4>Manage Account Details</h4>
                    <p>Open Clerk profile to edit security, session, and identity details.</p>
                  </div>
                  <button
                    type="button"
                    className="settings-action-btn"
                    onClick={openAccountCenter}
                    disabled={accountBusy}
                  >
                    Manage
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
