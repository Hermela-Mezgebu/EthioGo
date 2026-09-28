
import React, { useState } from "react";

import {
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  Globe2,
  KeyRound,
  Lock,
  Moon,
  Palette,
  Plane,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  Wifi,
  X,
  MapPin,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";

/* =========================================================
   STORAGE
========================================================= */

const SETTINGS_STORAGE_KEY = "aerotrack_settings";

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
  appearance: {
    compactMode: false,
    animations: true,
  },

  notifications: {
    flightUpdates: true,
    delays: true,
    cancellations: true,
    boarding: true,
    system: true,
  },

  flightData: {
    autoRefresh: true,
    refreshInterval: "15",
    defaultStatus: "all",
    showAircraftDetails: true,
    showCoordinates: true,
  },

  privacy: {
    saveSearchHistory: true,
    saveFavorites: true,
    anonymousAnalytics: false,
  },

  account: {
    name: "AeroTrack User",
    email: "user@aerotrack.com",
  },
};

/* =========================================================
   LOAD SETTINGS
========================================================= */

function loadSettings() {
  try {
    const saved = localStorage.getItem(
      SETTINGS_STORAGE_KEY
    );

    if (!saved) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,

      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        ...parsed.appearance,
      },

      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...parsed.notifications,
      },

      flightData: {
        ...DEFAULT_SETTINGS.flightData,
        ...parsed.flightData,
      },

      privacy: {
        ...DEFAULT_SETTINGS.privacy,
        ...parsed.privacy,
      },

      account: {
        ...DEFAULT_SETTINGS.account,
        ...parsed.account,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/* =========================================================
   SAVE SETTINGS
========================================================= */

function saveSettings(settings) {
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify(settings)
  );
}

/* =========================================================
   TOGGLE COMPONENT
========================================================= */

function Toggle({
  enabled,
  onChange,
  label,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        enabled
          ? "bg-primary"
          : "bg-neutral-muted/40"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled
            ? "translate-x-6"
            : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* =========================================================
   SETTING ROW
========================================================= */

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
  last = false,
}) {
  return (
    <div
      className={`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
        !last ? "border-b border-border" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
          <Icon size={16} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral">
            {title}
          </p>

          <p className="mt-0.5 max-w-xl text-xs leading-5 text-neutral-muted">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Icon size={16} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-neutral">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-neutral-muted">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div>{children}</div>
    </section>
  );
}

/* =========================================================
   SELECT
========================================================= */

function Select({
  value,
  onChange,
  children,
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="h-9 min-w-[150px] rounded-lg border border-border bg-surface px-3 text-xs font-medium text-neutral outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
    >
      {children}
    </select>
  );
}

/* =========================================================
   MAIN SETTINGS PAGE
========================================================= */

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] =
    useState(loadSettings);

  const [activeSection, setActiveSection] =
    useState("appearance");

  const [saved, setSaved] =
    useState(false);

  const [showResetModal, setShowResetModal] =
    useState(false);

  /* =======================================================
     UPDATE SETTING
  ======================================================= */

  const updateSetting = (
    section,
    key,
    value
  ) => {
    setSettings((current) => ({
      ...current,

      [section]: {
        ...current[section],
        [key]: value,
      },
    }));

    setSaved(false);
  };

  /* =======================================================
     CHANGE THEME
  ======================================================= */

  const handleThemeChange = (selectedTheme) => {
    if (selectedTheme === theme) {
      return;
    }

    toggleTheme();

    setSaved(false);
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = () => {
    saveSettings(settings);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  /* =======================================================
     RESET
  ======================================================= */

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);

    saveSettings(DEFAULT_SETTINGS);

    /*
      ThemeContext owns the actual global theme.
      Resetting settings should therefore return
      the interface to light mode if currently dark.
    */
    if (theme === "dark") {
      toggleTheme();
    }

    setShowResetModal(false);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  /* =======================================================
     CLEAR LOCAL DATA
  ======================================================= */

  const handleClearData = () => {
    localStorage.removeItem(
      SETTINGS_STORAGE_KEY
    );

    setSettings(DEFAULT_SETTINGS);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  /* =======================================================
     SIDEBAR NAVIGATION
  ======================================================= */

  const sections = [
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "flight-data",
      label: "Flight Data",
      icon: Plane,
    },
    {
      id: "privacy",
      label: "Privacy & Data",
      icon: ShieldCheck,
    },
    {
      id: "account",
      label: "Account",
      icon: User,
    },
  ];

  return (
    <div className="min-h-full bg-background p-4 lg:p-6">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <SettingsIcon
                size={18}
                className="text-primary"
              />

              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Preferences
              </span>
            </div>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral">
              Settings
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-neutral-muted">
              Customize your AeroTrack experience,
              flight data, notifications and privacy
              preferences.
            </p>
          </div>

          {/* Save button */}

          <button
            type="button"
            onClick={handleSave}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark"
          >
            {saved ? (
              <>
                <Check size={14} />
                Saved
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">

        {/* =================================================
            SETTINGS NAVIGATION
        ================================================= */}

        <aside className="h-fit rounded-xl border border-border bg-surface p-2 shadow-sm">

          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-muted">
            Settings
          </p>

          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;

              const active =
                activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      section.id
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition ${
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-neutral-light hover:bg-primary-light hover:text-primary"
                  }`}
                >
                  <Icon size={15} />

                  <span>
                    {section.label}
                  </span>

                  {active && (
                    <ChevronRight
                      size={13}
                      className="ml-auto"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="my-2 border-t border-border" />

          <button
            type="button"
            onClick={() =>
              setShowResetModal(true)
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-danger transition hover:bg-danger/10"
          >
            <RotateCcw size={15} />

            Reset Settings
          </button>
        </aside>

        {/* =================================================
            SETTINGS CONTENT
        ================================================= */}

        <main className="min-w-0 space-y-5">

          {/* =================================================
              APPEARANCE
          ================================================= */}

          {activeSection ===
            "appearance" && (
            <>
              <SettingsCard
                icon={Palette}
                title="Appearance"
                description="Control how AeroTrack looks and feels."
              >

                {/* Theme */}

                <SettingRow
                  icon={Sun}
                  title="Theme"
                  description="Choose the appearance of the AeroTrack dashboard."
                >
                  <div className="flex rounded-lg border border-border bg-background p-1">

                    <button
                      type="button"
                      onClick={() =>
                        handleThemeChange(
                          "light"
                        )
                      }
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        theme === "light"
                          ? "bg-surface text-primary shadow-sm"
                          : "text-neutral-muted hover:text-neutral"
                      }`}
                    >
                      <Sun size={13} />

                      Light
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleThemeChange(
                          "dark"
                        )
                      }
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        theme === "dark"
                          ? "bg-neutral text-white shadow-sm"
                          : "text-neutral-muted hover:text-neutral"
                      }`}
                    >
                      <Moon size={13} />

                      Dark
                    </button>

                  </div>
                </SettingRow>

                {/* Compact Mode */}

                <SettingRow
                  icon={SettingsIcon}
                  title="Compact Mode"
                  description="Reduce spacing and card sizes to display more flight information."
                >
                  <Toggle
                    enabled={
                      settings.appearance
                        .compactMode
                    }
                    label="Compact mode"
                    onChange={(value) =>
                      updateSetting(
                        "appearance",
                        "compactMode",
                        value
                      )
                    }
                  />
                </SettingRow>

                {/* Animations */}

                <SettingRow
                  icon={Radio}
                  title="Interface Animations"
                  description="Enable subtle transitions and animations throughout the dashboard."
                  last
                >
                  <Toggle
                    enabled={
                      settings.appearance
                        .animations
                    }
                    label="Interface animations"
                    onChange={(value) =>
                      updateSetting(
                        "appearance",
                        "animations",
                        value
                      )
                    }
                  />
                </SettingRow>

              </SettingsCard>

              {/* Preview */}

              <SettingsCard
                icon={Eye}
                title="Interface Preview"
                description="Preview the AeroTrack visual system."
              >
                <div className="p-5">
                  <div className="rounded-xl bg-background p-4">

                    <div className="flex flex-wrap items-center gap-3">

                      <button
                        type="button"
                        className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
                      >
                        Primary Action
                      </button>

                      <button
                        type="button"
                        className="rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-neutral"
                      >
                        Gold Action
                      </button>

                      <button
                        type="button"
                        className="rounded-lg bg-info px-4 py-2 text-xs font-semibold text-white"
                      >
                        Blue Action
                      </button>

                      <span className="rounded-full bg-primary-light px-3 py-1 text-[10px] font-semibold text-primary">
                        In Flight
                      </span>

                    </div>
                  </div>
                </div>
              </SettingsCard>
            </>
          )}

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          {activeSection ===
            "notifications" && (
            <SettingsCard
              icon={Bell}
              title="Notifications"
              description="Choose which flight and system events you want to receive."
            >

              <SettingRow
                icon={Plane}
                title="Flight Updates"
                description="Receive updates when tracked flights change status."
              >
                <Toggle
                  enabled={
                    settings
                      .notifications
                      .flightUpdates
                  }
                  label="Flight updates"
                  onChange={(value) =>
                    updateSetting(
                      "notifications",
                      "flightUpdates",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={Clock3}
                title="Delay Alerts"
                description="Notify me when a tracked flight is delayed."
              >
                <Toggle
                  enabled={
                    settings
                      .notifications
                      .delays
                  }
                  label="Delay alerts"
                  onChange={(value) =>
                    updateSetting(
                      "notifications",
                      "delays",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={X}
                title="Cancellation Alerts"
                description="Receive an alert when a tracked flight is cancelled."
              >
                <Toggle
                  enabled={
                    settings
                      .notifications
                      .cancellations
                  }
                  label="Cancellation alerts"
                  onChange={(value) =>
                    updateSetting(
                      "notifications",
                      "cancellations",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={Radio}
                title="Boarding Alerts"
                description="Receive boarding-related updates when available."
              >
                <Toggle
                  enabled={
                    settings
                      .notifications
                      .boarding
                  }
                  label="Boarding alerts"
                  onChange={(value) =>
                    updateSetting(
                      "notifications",
                      "boarding",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={Wifi}
                title="System Notifications"
                description="Receive important AeroTrack system and service notifications."
                last
              >
                <Toggle
                  enabled={
                    settings
                      .notifications
                      .system
                  }
                  label="System notifications"
                  onChange={(value) =>
                    updateSetting(
                      "notifications",
                      "system",
                      value
                    )
                  }
                />
              </SettingRow>

            </SettingsCard>
          )}

          {/* =================================================
              FLIGHT DATA
          ================================================= */}

          {activeSection ===
            "flight-data" && (
            <>
              <SettingsCard
                icon={Plane}
                title="Flight Data"
                description="Configure how live flight information is displayed and refreshed."
              >

                <SettingRow
                  icon={RefreshCw}
                  title="Automatic Refresh"
                  description="Automatically refresh live flight data."
                >
                  <Toggle
                    enabled={
                      settings
                        .flightData
                        .autoRefresh
                    }
                    label="Automatic flight refresh"
                    onChange={(value) =>
                      updateSetting(
                        "flightData",
                        "autoRefresh",
                        value
                      )
                    }
                  />
                </SettingRow>

                <SettingRow
                  icon={Clock3}
                  title="Refresh Interval"
                  description="Choose how often live flight data should refresh."
                >
                  <Select
                    value={
                      settings
                        .flightData
                        .refreshInterval
                    }
                    onChange={(value) =>
                      updateSetting(
                        "flightData",
                        "refreshInterval",
                        value
                      )
                    }
                  >
                    <option value="15">
                      Every 15 seconds
                    </option>

                    <option value="30">
                      Every 30 seconds
                    </option>

                    <option value="60">
                      Every 1 minute
                    </option>

                    <option value="300">
                      Every 5 minutes
                    </option>
                  </Select>
                </SettingRow>

                <SettingRow
                  icon={Radio}
                  title="Default Flight Status"
                  description="Choose which flight status is selected by default."
                >
                  <Select
                    value={
                      settings
                        .flightData
                        .defaultStatus
                    }
                    onChange={(value) =>
                      updateSetting(
                        "flightData",
                        "defaultStatus",
                        value
                      )
                    }
                  >
                    <option value="all">
                      All Flights
                    </option>

                    <option value="active">
                      In Flight
                    </option>

                    <option value="scheduled">
                      Scheduled
                    </option>

                    <option value="landed">
                      Landed
                    </option>
                  </Select>
                </SettingRow>

                <SettingRow
                  icon={Plane}
                  title="Aircraft Details"
                  description="Show aircraft type and registration where available."
                >
                  <Toggle
                    enabled={
                      settings
                        .flightData
                        .showAircraftDetails
                    }
                    label="Aircraft details"
                    onChange={(value) =>
                      updateSetting(
                        "flightData",
                        "showAircraftDetails",
                        value
                      )
                    }
                  />
                </SettingRow>

                <SettingRow
                  icon={MapPin}
                  title="Flight Coordinates"
                  description="Show latitude and longitude when live position data is available."
                  last
                >
                  <Toggle
                    enabled={
                      settings
                        .flightData
                        .showCoordinates
                    }
                    label="Flight coordinates"
                    onChange={(value) =>
                      updateSetting(
                        "flightData",
                        "showCoordinates",
                        value
                      )
                    }
                  />
                </SettingRow>

              </SettingsCard>

              {/* API connection */}

              <SettingsCard
                icon={KeyRound}
                title="Flight Data Provider"
                description="Information about the service providing flight data."
              >
                <div className="p-5">

                  <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary-light/40 p-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                        <Wifi size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-neutral">
                          AviationStack
                        </p>

                        <p className="mt-0.5 text-xs text-neutral-muted">
                          Flight data provider
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[10px] font-semibold text-primary shadow-sm">

                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />

                      Connected

                    </div>

                  </div>

                  <p className="mt-3 text-[10px] leading-5 text-neutral-muted">
                    Your API credentials should remain
                    outside the public frontend whenever
                    possible. AeroTrack should access
                    protected API credentials through the
                    project's backend or API proxy.
                  </p>

                </div>
              </SettingsCard>
            </>
          )}

          {/* =================================================
              PRIVACY
          ================================================= */}

          {activeSection ===
            "privacy" && (
            <>
              <SettingsCard
                icon={ShieldCheck}
                title="Privacy & Data"
                description="Control what AeroTrack stores locally in your browser."
              >

                <SettingRow
                  icon={Search}
                  title="Search History"
                  description="Remember recent flight and airline searches on this device."
                >
                  <Toggle
                    enabled={
                      settings.privacy
                        .saveSearchHistory
                    }
                    label="Save search history"
                    onChange={(value) =>
                      updateSetting(
                        "privacy",
                        "saveSearchHistory",
                        value
                      )
                    }
                  />
                </SettingRow>

                <SettingRow
                  icon={Plane}
                  title="Saved Favorites"
                  description="Keep your favorite flights and routes saved on this device."
                >
                  <Toggle
                    enabled={
                      settings.privacy
                        .saveFavorites
                    }
                    label="Save favorites"
                    onChange={(value) =>
                      updateSetting(
                        "privacy",
                        "saveFavorites",
                        value
                      )
                    }
                  />
                </SettingRow>

                <SettingRow
                  icon={Eye}
                  title="Anonymous Analytics"
                  description="Allow anonymous usage information to help improve the application."
                  last
                >
                  <Toggle
                    enabled={
                      settings.privacy
                        .anonymousAnalytics
                    }
                    label="Anonymous analytics"
                    onChange={(value) =>
                      updateSetting(
                        "privacy",
                        "anonymousAnalytics",
                        value
                      )
                    }
                  />
                </SettingRow>

              </SettingsCard>

              {/* Local Data */}

              <SettingsCard
                icon={Lock}
                title="Local Data"
                description="Manage information stored by AeroTrack in your browser."
              >
                <div className="p-5">

                  <div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <p className="text-sm font-semibold text-neutral">
                        Clear local data
                      </p>

                      <p className="mt-1 text-xs text-neutral-muted">
                        Remove saved preferences,
                        searches and locally stored
                        AeroTrack data.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleClearData
                      }
                      className="flex items-center justify-center gap-2 rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger/10"
                    >
                      <Trash2 size={14} />

                      Clear Data
                    </button>

                  </div>

                </div>
              </SettingsCard>
            </>
          )}

          {/* =================================================
              ACCOUNT
          ================================================= */}

          {activeSection ===
            "account" && (
            <>
              <SettingsCard
                icon={User}
                title="Account"
                description="Manage your AeroTrack profile information."
              >
                <div className="p-5">

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                      AT
                    </div>

                    <div>

                      <h3 className="text-base font-bold text-neutral">
                        {settings.account.name}
                      </h3>

                      <p className="mt-1 text-xs text-neutral-muted">
                        {settings.account.email}
                      </p>

                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-semibold text-primary">

                        <ShieldCheck size={11} />

                        AeroTrack User

                      </div>

                    </div>

                  </div>

                </div>
              </SettingsCard>

              {/* Profile */}

              <SettingsCard
                icon={Globe2}
                title="Profile Information"
                description="Update the name and email shown in your AeroTrack account."
              >

                <div className="grid gap-4 p-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-xs font-semibold text-neutral">
                      Display Name
                    </label>

                    <input
                      type="text"
                      value={
                        settings.account.name
                      }
                      onChange={(event) =>
                        updateSetting(
                          "account",
                          "name",
                          event.target.value
                        )
                      }
                      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-neutral outline-none transition placeholder:text-neutral-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-xs font-semibold text-neutral">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={
                        settings.account.email
                      }
                      onChange={(event) =>
                        updateSetting(
                          "account",
                          "email",
                          event.target.value
                        )
                      }
                      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-neutral outline-none transition placeholder:text-neutral-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />

                  </div>

                </div>

              </SettingsCard>

              {/* Security */}

              <SettingsCard
                icon={Lock}
                title="Security"
                description="Account security options."
              >

                <SettingRow
                  icon={KeyRound}
                  title="Password"
                  description="Password management will be connected to the authentication backend."
                  last
                >

                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-neutral transition hover:border-primary hover:text-primary"
                  >
                    Manage

                    <ChevronRight
                      size={13}
                    />
                  </button>

                </SettingRow>

              </SettingsCard>
            </>
          )}

          {/* =================================================
              SAVE BAR
          ================================================= */}

          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">

            <div className="hidden items-center gap-2 sm:flex">

              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-primary">
                <Check size={13} />
              </div>

              <p className="text-[10px] text-neutral-muted">
                Changes are stored locally on this device.
              </p>

            </div>

            <div className="ml-auto flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  setSettings(
                    loadSettings()
                  )
                }
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-neutral transition hover:bg-background"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-dark"
              >
                <Save size={13} />

                Save Changes
              </button>

            </div>

          </div>

        </main>
      </div>

      {/* =================================================
          RESET MODAL
      ================================================= */}

      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-2xl">

            <div className="flex items-start justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <RotateCcw size={17} />
                </div>

                <div>

                  <h3 className="text-sm font-bold text-neutral">
                    Reset Settings?
                  </h3>

                  <p className="mt-1 text-xs text-neutral-muted">
                    This will restore all AeroTrack
                    settings to their defaults.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowResetModal(false)
                }
                className="rounded-md p-1 text-neutral-muted hover:bg-background"
              >
                <X size={15} />
              </button>

            </div>

            <div className="mt-5 flex justify-end gap-2">

              <button
                type="button"
                onClick={() =>
                  setShowResetModal(false)
                }
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-neutral transition hover:bg-background"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                Reset Settings
              </button>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
