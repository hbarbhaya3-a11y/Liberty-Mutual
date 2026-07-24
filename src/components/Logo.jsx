import { useTheme } from "@/components/ThemeContext";

// TwinX wordmark. Original SVGs are 128×24; we expose a width prop so callers
// can shrink/grow proportionally. Dark theme → white logo (on dark bg),
// light theme → black logo (on light bg).
export function Logo({ width = 96, className = "" }) {
  const { theme } = useTheme();
  const src = theme === "light" ? "/TwinX_Black.svg" : "/TwinX_White.svg";
  const height = (width / 128) * 24;
  return (
    <img
      src={src}
      width={width}
      height={height}
      alt="TwinX"
      className={`twinx-logo ${className}`}
      draggable={false}
    />
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
