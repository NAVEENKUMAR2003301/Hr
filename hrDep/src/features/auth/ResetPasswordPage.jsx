import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/axiosClient";
import { resetPasswordSchema } from "../../lib/schemas";
import { getErrorMessage } from "../../lib/utils";
import Logo from "../../components/Logo";
import ThemeToggle from "../theme/ThemeToggle";

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const parsed = resetPasswordSchema.safeParse({ newPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!token) {
      setError("Missing reset token — use the link from your email.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      navigate("/login");
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-gradient-to-b from-indigo-500/10 to-transparent dark:from-indigo-500/[0.08] blur-3xl"
      />

      <ThemeToggle className="absolute top-5 right-5" />

      <div className="relative w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none"
        >
          <h1 className="text-center text-lg font-semibold text-slate-900 dark:text-slate-50">Reset password</h1>

          {!token && (
            <p className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              This page needs a reset link — open the link from your email instead of visiting it directly.
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
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
            disabled={submitting || !token}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Resetting…" : "Reset password"}
          </button>

          <p className="text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-indigo-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
