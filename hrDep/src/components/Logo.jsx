// Brand: STACKLY
// Icon: two interlocking comma shapes forming a flowing "S" — teal (growth, people)
// spiraling into navy (stability, trust), the same motif reused for the favicon and
// the pre-React splash screen so every "S" mark in the app is the same shape.

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
        <path d="M16 3a13 13 0 0 1 0 26 6.5 6.5 0 0 1 0-13 6.5 6.5 0 0 0 0-13z" fill="#1e3a5f" />
        <path d="M16 29a13 13 0 0 1 0-26 6.5 6.5 0 0 1 0 13 6.5 6.5 0 0 0 0 13z" fill="#7dd8bf" />
      </svg>

      {withWordmark && (
        <span className={`${text} font-extrabold tracking-tight text-[#1e3a5f] dark:text-slate-50`}>
          STACKLY
        </span>
      )}
    </div>
  );
}
