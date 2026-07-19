export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const RELATIVE_UNITS = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function formatRelativeTime(date) {
  if (!date) return "—";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${unit}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

// Centralizes the "shape" of an API error (err.response.data.error, set by the
// server's errorHandler) so every form's catch block doesn't hand-roll the same
// extraction — one place to update if that shape ever changes.
export function getErrorMessage(err, fallback = "Something went wrong") {
  return err.response?.data?.error ?? fallback;
}
