import { useTheme } from "@/components/ThemeContext";

// TwinX wordmark. Original SVGs are 128×24; we expose a width prop so callers
// can shrink/grow proportionally. Dark theme → white logo (on dark bg),
// light theme → black logo (on light bg).
export function Logo({ width = 96, className = "" }) {
  // Liberty Mutual wordmark. Rendered as text so we don't ship brand SVGs;
  // "TwinX" is retained as the small product tag beside the company name.
  useTheme();
  return (
    <span
      className={`twinx-logo lm-wordmark ${className}`}
      style={{ fontSize: Math.max(13, width / 6.2) }}
      aria-label="Liberty Mutual · TwinX"
    >
      <b>Liberty Mutual</b>
      <em>TwinX</em>
    </span>
  );
}

// Compact theme toggle button. Tracks the icon glyph to current state.
export function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
