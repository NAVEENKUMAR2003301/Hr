// Brand: STACKLY
// Color theory: indigo (trust, stability — dominant HR-brand hue) fading into cyan
// (clarity, momentum) on a neutral slate wordmark, following a 60/30/10 balance
// (neutral text 60%, indigo 30%, cyan accent 10% on the icon only).

const SIZES = {
  sm: { icon: 24, text: "text-lg", gap: "gap-2" },
  md: { icon: 32, text: "text-2xl", gap: "gap-2.5" },
  lg: { icon: 44, text: "text-4xl", gap: "gap-3" },
};

export default function Logo({ size = "md", withWordmark = true, className = "" }) {
  const { icon, text, gap } = SIZES[size] ?? SIZES.md;

  return (
    <div className={`inline-flex items-center ${gap} ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="stackly-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* three stacked layers, motif for "stack" + org hierarchy */}
        <path d="M16 3L29 9.5L16 16L3 9.5L16 3Z" fill="url(#stackly-grad)" />
        <path d="M3 16L16 22.5L29 16" stroke="url(#stackly-grad)" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        <path d="M3 22.5L16 29L29 22.5" stroke="url(#stackly-grad)" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
      </svg>

      {withWordmark && (
        <span className={`${text} font-extrabold tracking-tight text-slate-900 dark:text-slate-50`}>
          Stack<span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">ly</span>
        </span>
      )}
    </div>
  );
}
