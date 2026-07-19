import { useTheme } from "./useTheme";

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: SystemIcon },
];

function SunIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="10" cy="10" r="3.5" />
      <path strokeLinecap="round" d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4M15.5 15.5l-1.4-1.4M5.9 5.9 4.5 4.5" />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M17.3 12.5A7.5 7.5 0 0 1 7.5 2.7a.6.6 0 0 0-.75-.75A8.7 8.7 0 1 0 18 13.2a.6.6 0 0 0-.7-.7Z" />
    </svg>
  );
}

function SystemIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="2.5" y="4" width="15" height="10" rx="1.5" />
      <path strokeLinecap="round" d="M7 17h6M10 14v3" />
    </svg>
  );
}

// Compact 3-way segmented control instead of a single toggle — "system" is a real
// distinct choice (tracks the OS live), not just an initial default.
export default function ThemeToggle({ className = "" }) {
  const { preference, setTheme } = useTheme();

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 ${className}`}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-label={`${label} theme`}
          aria-pressed={preference === value}
          className={`rounded-md p-1.5 transition-colors ${
            preference === value
              ? "bg-indigo-600 text-white"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
