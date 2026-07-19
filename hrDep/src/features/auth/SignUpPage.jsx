import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { signupSchema } from "../../lib/schemas";
import { getErrorMessage } from "../../lib/utils";
import Logo from "../../components/Logo";
import ThemeToggle from "../theme/ThemeToggle";

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function SignUpPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", signupCode: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await signup(form);
      navigate("/admin");
    } catch (err) {
      setError(getErrorMessage(err, "Sign up failed"));
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
          <h1 className="text-center text-lg font-semibold text-slate-900 dark:text-slate-50">HR sign up</h1>

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Your name
            </label>
            <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} autoComplete="name" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signupCode" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              HR sign-up code
            </label>
            <input
              id="signupCode"
              type="password"
              value={form.signupCode}
              onChange={(e) => set("signupCode", e.target.value)}
              className={inputClass}
              placeholder="Ask your HR admin for this"
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
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Signing up…" : "Sign up"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-indigo-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
