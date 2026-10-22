
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api.js";

const INITIAL_PROFILE = {
  name: "",
  currency: "INR",
};

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
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function Notice({ children, type = "success" }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${styles}`}
    >
      {children}
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
      const result = await apiRequest("/users/me", {
        method: "GET",
      });

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
        const result = await apiRequest("/users/me", {
          method: "GET",
        });

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

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPassword((current) => ({
      ...current,
      [name]: value,
    }));
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
        body: JSON.stringify({
          name,
          currency: profile.currency,
        }),
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
        "Your new password must differ from your current password."
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
      <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div
            role="status"
            aria-label="Loading profile"
            className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"
          />
          <p className="mt-4 text-sm text-slate-500">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  if (pageError && !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5m0 3h.01" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Unable to load profile
          </h1>
          <p role="alert" className="mt-2 text-sm text-red-700">
            {pageError}
          </p>
          <button
            type="button"
            onClick={loadProfile}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Account management
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                My profile
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Manage your personal details and keep your account secure.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {user?.isActive ? "Account active" : "Account inactive"}
            </span>
          </div>
        </header>

        {notice && (
          <div className="mb-6">
            <Notice>{notice}</Notice>
          </div>
        )}

        {pageError && (
          <div className="mb-6">
            <Notice type="error">{pageError}</Notice>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-32 bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-500 sm:h-40">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -right-8 -top-16 h-48 w-48 rounded-full border-[24px] border-white" />
              <div className="absolute right-28 top-12 h-24 w-24 rounded-full border-[14px] border-white" />
            </div>
            <div className="absolute bottom-0 left-6 translate-y-1/2 sm:left-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-slate-950 text-2xl font-bold text-white shadow-md sm:h-24 sm:w-24 sm:text-3xl">
                {getInitials(user?.name)}
              </div>
            </div>
          </div>

          <div className="px-5 pb-6 pt-14 sm:px-8 sm:pt-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words text-2xl font-bold text-slate-900">
                  {user?.name}
                </h2>
                <p className="mt-1 break-all text-sm text-slate-500">
                  {user?.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {user?.role || "USER"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    SpendWise member
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={openEditProfile}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path d="m15 5 4 4M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z" />
                </svg>
                Edit profile
              </button>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-3">
              <Field
                label="Account created"
                value={formatDate(user?.createdAt)}
              />
              <Field
                label="Preferred currency"
                value={user?.currency || "INR"}
              />
              <Field
                label="Account status"
                value={user?.isActive ? "Active" : "Inactive"}
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Personal information
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your saved account details. Select Edit profile to make changes.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">
            <Field label="Full name" value={user?.name} />
            <Field label="Email address" value={user?.email} />
            <Field
              label="Default currency"
              value={user?.currency || "INR"}
            />
            <Field label="Account role" value={user?.role || "USER"} />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                >
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Security & password
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                  Keep your account protected. You can change your password
                  whenever you need to.
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  Password updates require your current password.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openPasswordModal}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Change password
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </section>
      </div>

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelEditProfile();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Account details
                </p>
                <h2
                  id="edit-profile-title"
                  className="mt-2 text-2xl font-bold text-slate-900"
                >
                  Edit profile
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Update your name and preferred currency.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close edit profile"
                onClick={cancelEditProfile}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-7 space-y-5">
              {profileError && <Notice type="error">{profileError}</Notice>}

              <div>
                <label
                  htmlFor="edit-profile-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-profile-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="edit-profile-email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Email address cannot be changed here.
                </p>
              </div>

              <div>
                <label
                  htmlFor="edit-profile-currency"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Default currency
                </label>
                <select
                  id="edit-profile-currency"
                  name="currency"
                  value={profile.currency}
                  onChange={handleProfileChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  {!CURRENCIES.some(
                    (currency) => currency.value === profile.currency
                  ) && (
                    <option value={profile.currency}>
                      {profile.currency}
                    </option>
                  )}
                  {CURRENCIES.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Changing this preference does not convert existing transactions.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelEditProfile}
                  disabled={isSavingProfile}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePasswordModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  Security settings
                </p>
                <h2
                  id="change-password-title"
                  className="mt-2 text-2xl font-bold text-slate-900"
                >
                  Change password
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your current password and choose a new one.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close change password"
                onClick={closePasswordModal}
                disabled={isChangingPassword}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-7 space-y-5">
              {passwordError && <Notice type="error">{passwordError}</Notice>}

              <div>
                <label
                  htmlFor="current-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Current password
                </label>
                <input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={password.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Must be at least 8 characters long.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Changing your password revokes existing refresh-token sessions.
                You may need to sign in again.
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={isChangingPassword}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isChangingPassword ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
