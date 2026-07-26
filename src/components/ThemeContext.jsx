import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "twinx-theme";
const ThemeContext = createContext({ theme: "light", toggle: () => {} });

function readInitial() {
  if (typeof window === "undefined") return "light";
  // SCREENSHOT-OVERRIDE: ?theme=light query param wins (used by smoke tests).
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("theme_ui");
    if (q === "light" || q === "dark") return q;
  } catch { /* ignore */ }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage unavailable (private mode / quota) — fall through to default.
  }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitial);

  // useLayoutEffect so the class is applied before first paint — avoids a
  // dark-to-light flash on initial render when the saved preference is light.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-light", theme === "light");
    root.classList.toggle("theme-dark", theme === "dark");
    root.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
