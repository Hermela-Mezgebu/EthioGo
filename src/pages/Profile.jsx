import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Globe2,
  LockKeyhole,
  Mail,
  MapPin,
  Plane,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

const STORAGE_KEY = "ethiogo-profile";
const AVATAR_KEY = "ethiogo-profile-avatar";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const DEFAULT_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  location: "Addis Ababa, Ethiopia",
  role: "Aviation Enthusiast",
  bio: "Exploring the world of aviation with EthioGo.",
  language: "English",
  emailNotifications: true,
  flightAlerts: true,
  productUpdates: false,
};

function readSavedProfile() {
  if (typeof window === "undefined") return DEFAULT_PROFILE;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_PROFILE;

    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      // Avoid malformed stored values causing controlled-input errors.
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      location:
        typeof parsed.location === "string"
          ? parsed.location
          : DEFAULT_PROFILE.location,
      role: typeof parsed.role === "string" ? parsed.role : DEFAULT_PROFILE.role,
      bio: typeof parsed.bio === "string" ? parsed.bio : DEFAULT_PROFILE.bio,
      language:
        typeof parsed.language === "string"
          ? parsed.language
          : DEFAULT_PROFILE.language,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function readSavedAvatar() {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(AVATAR_KEY) || "";
  } catch {
    return "";
  }
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={19} aria-hidden="true" />
      </div>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  required = false,
  autoComplete,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border border-border bg-background py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            Icon ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

function PreferenceToggle({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(readSavedProfile);
  const [savedProfile, setSavedProfile] = useState(readSavedProfile);
  const [avatar, setAvatar] = useState(readSavedAvatar);
  const [savedAvatar, setSavedAvatar] = useState(readSavedAvatar);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const hasChanges =
    JSON.stringify(profile) !== JSON.stringify(savedProfile) ||
    avatar !== savedAvatar;

  function handleChange(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setMessage("");
    setError("");
  }

  function handlePreferenceChange(name, value) {
    setProfile((current) => ({ ...current, [name]: value }));
    setMessage("");
    setError("");
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Your profile image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
        setMessage("");
        setError("");
      } else {
        setError("Unable to read this image. Please try another file.");
      }
    };
    reader.onerror = () => {
      setError("Unable to read this image. Please try another file.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleSave(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!profile.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    const normalizedProfile = {
      ...profile,
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      location: profile.location.trim(),
      role: profile.role.trim(),
      bio: profile.bio.trim(),
    };

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(normalizedProfile),
      );

      if (avatar) {
        window.localStorage.setItem(AVATAR_KEY, avatar);
      } else {
        window.localStorage.removeItem(AVATAR_KEY);
      }

      setProfile(normalizedProfile);
      setSavedProfile(normalizedProfile);
      setSavedAvatar(avatar);
      setMessage("Your profile details have been saved.");
    } catch {
      setError(
        "Unable to save your profile. Your browser storage may be full or disabled. Try using a smaller image.",
      );
    }
  }

  function handleReset() {
    setProfile(savedProfile);
    setAvatar(savedAvatar);
    setMessage("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveAvatar() {
    setAvatar("");
    setMessage("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleHelpClick() {
    // Replace this with your actual support route when it is available.
    window.alert("Connect this action to your EthioGo Help & Support page.");
  }

  const initials = profile.fullName.trim()
    ? profile.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "EG";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
        <div className="space-y-5">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          >
            <span>EthioGo</span>
            <ChevronRight size={15} aria-hidden="true" />
            <span>Account</span>
            <ChevronRight size={15} aria-hidden="true" />
            <span className="font-medium text-foreground">My Profile</span>
          </nav>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary">
                <UserRound size={14} aria-hidden="true" />
                ACCOUNT MANAGEMENT
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My Profile
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Manage your personal information and customize your EthioGo
                experience.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
              Your account preferences
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-32 bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700 sm:h-40">
            <div className="h-full w-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.16),transparent_32%)]" />
          </div>

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-primary/10 text-2xl font-bold text-primary shadow-lg sm:h-28 sm:w-28">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload profile photo"
                    className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-md transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <Camera size={17} aria-hidden="true" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    aria-label="Choose a profile photo"
                  />
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold sm:text-2xl">
                      {profile.fullName.trim() || "Your Name"}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <BadgeCheck size={14} aria-hidden="true" />
                      EthioGo Member
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.email || "Add your email address"}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={15} aria-hidden="true" />
                    {profile.location || "Location not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pb-1 text-sm text-muted-foreground">
                <Plane size={17} className="text-primary" aria-hidden="true" />
                {profile.role || "Aviation Enthusiast"}
              </div>
            </div>

            <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {profile.bio || "Tell us a little about yourself."}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Profile photo: image files up to 5 MB.
              </p>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs font-medium text-destructive underline-offset-4 hover:underline"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </section>

        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <SectionHeading
              icon={UserRound}
              title="Personal Information"
              description="Update the details associated with your profile."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Full name"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                icon={UserRound}
                autoComplete="name"
                required
              />
              <Field
                label="Email address"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="you@example.com"
                icon={Mail}
                type="email"
                autoComplete="email"
              />
              <Field
                label="Phone number"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="+251 ..."
                type="tel"
                autoComplete="tel"
              />
              <Field
                label="Location"
                name="location"
                value={profile.location}
                onChange={handleChange}
                placeholder="City, Country"
                icon={MapPin}
                autoComplete="address-level2"
              />
              <Field
                label="Profile title"
                name="role"
                value={profile.role}
                onChange={handleChange}
                placeholder="e.g. Aviation Enthusiast"
                icon={Plane}
              />

              <div className="space-y-2">
                <label
                  htmlFor="language"
                  className="block text-sm font-medium text-foreground"
                >
                  Preferred language
                </label>
                <div className="relative">
                  <Globe2
                    size={17}
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <select
                    id="language"
                    name="language"
                    value={profile.language}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="English">English</option>
                    <option value="Amharic">Amharic</option>
                    <option value="Oromo">Oromo</option>
                    <option value="Tigrinya">Tigrinya</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-foreground"
                >
                  About me
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={400}
                  placeholder="Write a short introduction..."
                  className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {profile.bio.length}/400 characters
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <SectionHeading
              icon={Bell}
              title="Notifications & Preferences"
              description="Choose which updates you want to receive."
            />
            <div className="divide-y divide-border">
              <PreferenceToggle
                title="Email notifications"
                description="Receive general account updates by email."
                checked={profile.emailNotifications}
                onChange={(value) =>
                  handlePreferenceChange("emailNotifications", value)
                }
              />
              <PreferenceToggle
                title="Flight alerts"
                description="Enable your preference for flight-related alerts."
                checked={profile.flightAlerts}
                onChange={(value) =>
                  handlePreferenceChange("flightAlerts", value)
                }
              />
              <PreferenceToggle
                title="Product updates"
                description="Receive information about new EthioGo features."
                checked={profile.productUpdates}
                onChange={(value) =>
                  handlePreferenceChange("productUpdates", value)
                }
              />
            </div>
            <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
              These settings are saved in this browser. Actual email delivery
              and flight notifications require notification services to be
              connected.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <SectionHeading
              icon={LockKeyhole}
              title="Account & Privacy"
              description="Information about how this profile works."
            />

            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <ShieldCheck
                size={20}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-primary"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Profile data storage
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This version stores profile details in your browser's local
                  storage. It does not create a server account or synchronize
                  data between devices. Avoid storing sensitive information
                  here.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleHelpClick}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <span className="flex items-center gap-3">
                <CircleHelp
                  size={19}
                  aria-hidden="true"
                  className="text-muted-foreground"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    Help & support
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Get help with your EthioGo experience.
                  </span>
                </span>
              </span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </section>

          <div className="sticky bottom-3 z-10 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-md sm:p-5">
            {message && (
              <div
                role="status"
                className="mb-3 flex items-center gap-2 text-sm text-primary"
              >
                <Check size={17} aria-hidden="true" />
                {message}
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="mb-3 flex items-center gap-2 text-sm text-destructive"
              >
                <X size={17} aria-hidden="true" />
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {hasChanges
                  ? "You have unsaved changes."
                  : "Your profile is up to date."}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hasChanges}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                >
                  <Save size={17} aria-hidden="true" />
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </form>

        <footer className="pb-4 text-center text-xs text-muted-foreground">
          EthioGo · Aviation information, made accessible.
        </footer>
      </div>
    </main>
  );
}
