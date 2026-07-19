import Logo from "./Logo";

// Shown while the initial session check runs (AuthContext status === "loading") —
// the one moment on every fresh page load where there's genuinely nothing to show
// yet, so it's the right place for a branded splash rather than a bare spinner.
export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>

        <div className="flex gap-1.5" aria-hidden="true">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" />
        </div>

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">HR team is heart of company</p>
      </div>
    </div>
  );
}
