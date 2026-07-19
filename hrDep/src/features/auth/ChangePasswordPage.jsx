import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axiosClient";
import { useAuth } from "./useAuth";
import Logo from "../../components/Logo";
import ThemeToggle from "../theme/ThemeToggle";

export default function ChangePasswordPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setUser(res.data.user);
      navigate(res.data.user.role === "EMPLOYEE" ? "/user" : "/admin");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to change password"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <ThemeToggle className="absolute top-5 right-5" />
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Set your password</p>
            <p className="text-xs text-slate-500 mt-1">
              This is your first login{user?.role ? ` as ${user.role.toLowerCase()}` : ""}. Choose a new password to continue.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Temporary password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
