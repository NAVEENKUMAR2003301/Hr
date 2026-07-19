import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { ThemeContext } from "./theme-context";

const STORAGE_KEY = "theme";

function getStoredPreference() {
  if (typeof window === "undefined") return "system";
  return localStorage.getItem(STORAGE_KEY) ?? "system";
}

function subscribeToSystemScheme(callback) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSystemScheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyResolvedTheme(resolved) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

// `preference` is what the user chose (light | dark | system); `resolved` is what's
// actually rendered (light | dark). System scheme is tracked via useSyncExternalStore
// (not an effect + setState) so "system" preference reacts to live OS changes without
// ever calling setState synchronously inside an effect body.
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(getStoredPreference);
  const systemScheme = useSyncExternalStore(subscribeToSystemScheme, getSystemScheme, () => "light");
  const resolved = preference === "system" ? systemScheme : preference;

  useEffect(() => {
    applyResolvedTheme(resolved);
  }, [resolved]);

  const setTheme = useCallback((next) => {
    setPreference(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setTheme }}>{children}</ThemeContext.Provider>
  );
}
