import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api.js";

const INITIAL_PROFILE = { name: "", currency: "INR" };
const INITIAL_PASSWORD = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const CURRENCIES = [
  { value: "INR", label: "Indian Rupee (INR)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "SGD", label: "Singapore Dollar (SGD)" },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getInitials(name) {
  return (
    name?.trim().split(/\s+/).slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase()).join("") || "U"
  );
}

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
    viewBox: "0 0 24 24",
  };

  const paths = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    edit: (
      <>
        <path d="m15 5 4 4M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 9h18m-6 5h2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5m0 3h.01" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.user}</svg>;
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-slate-200/80 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeading({ icon, eyebrow, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7F7F2] text-[#087F5B]">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#087F5B]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-lg font-bold tracking-tight text-[#0C1A33]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, icon }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#F7F9FC] p-4 transition-colors hover:border-emerald-100">
      <div className="flex items-center gap-2 text-slate-400">
        {icon && <Icon name={icon} className="h-4 w-4" />}
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-[#0C1A33]">
        {value || "—"}
      </p>
    </div>
  );
}

function Notice({ children, type = "success" }) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <Icon
        name={isError ? "alert" : "check"}
        className="mt-0.5 h-5 w-5 shrink-0"
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function FormField({
  label,
  id,
  hint,
  children,
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#0C1A33]"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0C1A33] outline-none transition placeholder:text-slate-400 focus:border-[#0BB079] focus:ring-4 focus:ring-emerald-50";

function Modal({ titleId, children, onClose, busy = false }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#071326]/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-auto max-h-[calc(100dvh-24px)] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/60 bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-48px)] sm:p-8"
      >
        {children}
      </section>
    </div>
  );
}

function ModalHeading({ eyebrow, title, description, id, onClose, busy }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#087F5B]">
          {eyebrow}
        </p>
        <h2
          id={id}
          className="mt-2 text-2xl font-bold tracking-tight text-[#0C1A33]"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        aria-label={`Close ${title.toLowerCase()}`}
        onClick={onClose}
        disabled={busy}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-[#0C1A33] disabled:opacity-50"
      >
        <Icon name="close" />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [password, setPassword] = useState(INITIAL_PASSWORD);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [pageError, setPageError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const result = await apiRequest("/users/me", { method: "GET" });
      const currentUser = result.data?.user;

      if (!currentUser) {
        throw new Error("The server returned an invalid profile.");
      }

      setUser(currentUser);
      setProfile({
        name: currentUser.name || "",
        currency: currentUser.currency || "INR",
      });
    } catch (error) {
      setPageError(error.message || "Unable to load your profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const result = await apiRequest("/users/me", { method: "GET" });
        if (cancelled) return;

        const currentUser = result.data?.user;
        if (!currentUser) {
          throw new Error("The server returned an invalid profile.");
        }

        setUser(currentUser);
        setProfile({
          name: currentUser.name || "",
          currency: currentUser.currency || "INR",
        });
      } catch (error) {
        if (!cancelled) {
          setPageError(error.message || "Unable to load your profile.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPassword((current) => ({ ...current, [name]: value }));
  };

  const openEditProfile = () => {
    setProfile({
      name: user?.name || "",
      currency: user?.currency || "INR",
    });
    setProfileError("");
    setNotice("");
    setIsEditing(true);
  };

  const cancelEditProfile = () => {
    setProfile({
      name: user?.name || "",
      currency: user?.currency || "INR",
    });
    setProfileError("");
    setIsEditing(false);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setNotice("");

    const name = profile.name.trim();

    if (name.length < 2 || name.length > 100) {
      setProfileError("Name must be between 2 and 100 characters.");
      return;
    }

    if (!/^[A-Z]{3}$/.test(profile.currency)) {
      setProfileError("Choose a valid three-letter currency code.");
      return;
    }

    setIsSavingProfile(true);

    try {
      const result = await apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify({ name, currency: profile.currency }),
      });

      const updatedUser = result.data?.user;
      if (!updatedUser) {
        throw new Error("The server did not return the updated profile.");
      }

      setUser(updatedUser);
      setProfile({
        name: updatedUser.name || "",
        currency: updatedUser.currency || "INR",
      });
      setIsEditing(false);
      setNotice(result.message || "Profile updated successfully.");
    } catch (error) {
      setProfileError(error.message || "Unable to update your profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openPasswordModal = () => {
    setPassword(INITIAL_PASSWORD);
    setPasswordError("");
    setNotice("");
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (isChangingPassword) return;
    setIsPasswordModalOpen(false);
    setPassword(INITIAL_PASSWORD);
    setPasswordError("");
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setNotice("");

    if (!password.currentPassword || !password.newPassword) {
      setPasswordError("Enter your current password and a new password.");
      return;
    }

    if (password.newPassword.length < 8) {
      setPasswordError("Your new password must contain at least 8 characters.");
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      setPasswordError("The new password and confirmation do not match.");
      return;
    }

    if (password.currentPassword === password.newPassword) {
      setPasswordError(
        "Your new password must differ from your current password.",
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await apiRequest("/users/me/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        }),
      });

      setPassword(INITIAL_PASSWORD);
      setIsPasswordModalOpen(false);
      setNotice(result.message || "Password changed successfully.");
    } catch (error) {
      setPasswordError(error.message || "Unable to change your password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F4F7FA] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Card className="p-10 text-center sm:p-16">
            <div
              role="status"
              aria-label="Loading profile"
              className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0BB079]"
            />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading your profile...
            </p>
          </Card>
        </div>
      </main>
    );
  }

  if (pageError && !user) {
    return (
      <main className="min-h-screen bg-[#F4F7FA] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Card className="p-6 sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Icon name="alert" className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-[#0C1A33]">
              Unable to load profile
            </h1>
            <p role="alert" className="mt-2 text-sm leading-6 text-rose-700">
              {pageError}
            </p>
            <button
              type="button"
              onClick={loadProfile}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0C1A33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#087F5B] focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <Icon name="refresh" className="h-4 w-4" />
              Try again
            </button>
          </Card>
        </div>
      </main>
    );
  }

  const active = Boolean(user?.isActive);

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#087F5B]">
              <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
              Account settings
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0C1A33] sm:text-4xl">
              My profile<span className="text-[#0BB079]">.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Your account, your preferences, and your financial life in one
              place.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold ${
              active
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                active ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            {active ? "Account active" : "Account inactive"}
          </div>
        </header>

        {notice && <Notice>{notice}</Notice>}
        {pageError && <Notice type="error">{pageError}</Notice>}

        {/* Profile identity card */}
        <Card className="overflow-hidden">
          <div className="relative overflow-hidden bg-[#0C1A33] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
            <div className="pointer-events-none absolute -right-12 -top-28 h-64 w-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-1 -top-16 h-48 w-48 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 h-24 w-24 rounded-full bg-[#0BB079]/10 blur-2xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-[#0BB079] to-[#087F5B] text-2xl font-extrabold text-white shadow-lg shadow-black/20 sm:h-24 sm:w-24 sm:text-3xl">
                  {getInitials(user?.name)}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    SpendWise member
                  </p>
                  <h2 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {user?.name || "Your profile"}
                  </h2>
                  <p className="mt-1 break-all text-sm text-slate-300">
                    {user?.email}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      {user?.role || "USER"}
                    </span>
                    <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                      {active ? "Verified active account" : "Inactive account"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={openEditProfile}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#0C1A33] shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                <Icon name="edit" className="h-4 w-4" />
                Edit profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6 lg:p-8">
            <Field
              label="Account created"
              value={formatDate(user?.createdAt)}
              icon="calendar"
            />
            <Field
              label="Preferred currency"
              value={user?.currency || "INR"}
              icon="wallet"
            />
            <Field
              label="Account status"
              value={active ? "Active" : "Inactive"}
              icon="shield"
            />
          </div>
        </Card>

        {/* Personal information */}
        <Card className="p-5 sm:p-7 lg:p-8">
          <SectionHeading
            icon="user"
            eyebrow="Your details"
            title="Personal information"
            description="Review the information associated with your SpendWise account."
          />

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <Field label="Full name" value={user?.name} icon="user" />
            <Field label="Email address" value={user?.email} icon="user" />
            <Field
              label="Default currency"
              value={user?.currency || "INR"}
              icon="wallet"
            />
            <Field
              label="Account role"
              value={user?.role || "USER"}
              icon="shield"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-[#E7F7F2]/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#087F5B] shadow-sm">
                <Icon name="check" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0C1A33]">
                  Keep your details up to date
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Your currency preference is used as your default for your
                  account.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openEditProfile}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#087F5B] transition hover:bg-white"
            >
              Edit details
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0C1A33] text-emerald-300">
                <Icon name="lock" className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#087F5B]">
                  Account protection
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#0C1A33]">
                  Security & password
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Protect your financial information with a strong password.
                  You can update it whenever you need to.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openPasswordModal}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#0C1A33] transition hover:border-emerald-300 hover:bg-[#E7F7F2] hover:text-[#087F5B] focus:outline-none focus:ring-4 focus:ring-emerald-50"
            >
              Change password
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FC] p-4">
            <Icon
              name="shield"
              className="mt-0.5 h-5 w-5 shrink-0 text-[#087F5B]"
            />
            <div>
              <p className="text-sm font-semibold text-[#0C1A33]">
                Your account security matters
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Changing your password requires your current password and
                revokes existing refresh-token sessions. You may need to sign
                in again.
              </p>
            </div>
          </div>
        </Card>

        <p className="pb-2 text-center text-xs leading-5 text-slate-400">
          Your personal details are managed through your secure SpendWise
          account.
        </p>
      </div>

      {/* Edit profile modal */}
      {isEditing && (
        <Modal
          titleId="edit-profile-title"
          onClose={cancelEditProfile}
          busy={isSavingProfile}
        >
          <ModalHeading
            eyebrow="Account details"
            title="Edit profile"
            description="Update your name and preferred currency."
            id="edit-profile-title"
            onClose={cancelEditProfile}
            busy={isSavingProfile}
          />

          <form onSubmit={handleSaveProfile} className="mt-7 space-y-5">
            {profileError && <Notice type="error">{profileError}</Notice>}

            <FormField label="Full name" id="edit-profile-name">
              <input
                id="edit-profile-name"
                name="name"
                type="text"
                value={profile.name}
                onChange={handleProfileChange}
                minLength={2}
                maxLength={100}
                required
                autoComplete="name"
                autoFocus
                className={inputClass}
                placeholder="Enter your full name"
              />
            </FormField>

            <FormField
              label="Email address"
              id="edit-profile-email"
              hint="Your email address cannot be changed here."
            >
              <input
                id="edit-profile-email"
                type="email"
                value={user?.email || ""}
                readOnly
                className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`}
              />
            </FormField>

            <FormField
              label="Default currency"
              id="edit-profile-currency"
              hint="Changing this preference does not convert existing transactions."
            >
              <select
                id="edit-profile-currency"
                name="currency"
                value={profile.currency}
                onChange={handleProfileChange}
                required
                className={inputClass}
              >
                {!CURRENCIES.some(
                  (currency) => currency.value === profile.currency,
                ) && (
                  <option value={profile.currency}>{profile.currency}</option>
                )}
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelEditProfile}
                disabled={isSavingProfile}
                className="min-h-11 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0C1A33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#087F5B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfile ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name="check" className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change password modal */}
      {isPasswordModalOpen && (
        <Modal
          titleId="change-password-title"
          onClose={closePasswordModal}
          busy={isChangingPassword}
        >
          <ModalHeading
            eyebrow="Security settings"
            title="Change password"
            description="Confirm your current password and choose a new one."
            id="change-password-title"
            onClose={closePasswordModal}
            busy={isChangingPassword}
          />

          <form onSubmit={handleChangePassword} className="mt-7 space-y-5">
            {passwordError && <Notice type="error">{passwordError}</Notice>}

            <FormField
              label="Current password"
              id="current-password"
            >
              <input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={password.currentPassword}
                onChange={handlePasswordChange}
                required
                autoFocus
                className={inputClass}
                placeholder="Enter current password"
              />
            </FormField>

            <FormField
              label="New password"
              id="new-password"
              hint="Must contain at least 8 characters."
            >
              <input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password.newPassword}
                onChange={handlePasswordChange}
                required
                className={inputClass}
                placeholder="Enter new password"
              />
            </FormField>

            <FormField
              label="Confirm new password"
              id="confirm-password"
            >
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password.confirmPassword}
                onChange={handlePasswordChange}
                required
                className={inputClass}
                placeholder="Re-enter new password"
              />
            </FormField>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Changing your password revokes existing refresh-token
                sessions. You may need to sign in again.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={isChangingPassword}
                className="min-h-11 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0C1A33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#087F5B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChangingPassword ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Icon name="lock" className="h-4 w-4" />
                    Update password
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}