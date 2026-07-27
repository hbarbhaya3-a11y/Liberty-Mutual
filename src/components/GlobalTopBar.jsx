/* ============================================================================
   GlobalTopBar — two-row sticky header present on every page.

   Row 1 (minimal, identity): Logo · spacer · Persona pill · Theme toggle
   Row 2 (contextual):        Page name · Theme/Hypothesis chips (when applicable)

   The previous one-row design crammed role/title/chips/env all together and
   made the persona inconsistent across screens. Splitting into rows lets the
   identity strip stay constant on every screen while the page context lives
   in its own row underneath.
   ========================================================================= */
import { useNavigate, useLocation } from "react-router-dom";
import { Logo, ThemeToggle } from "@/components/Logo";
import { useAppShell } from "@/state/AppShell";
import { NAV } from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";

/* Pages that aren't hypothesis-bound — theme + hypothesis chips shouldn't
   appear there because there's nothing selected yet (Sense) or the surface
   is portfolio-altitude (CEO, Learn). */
function hidesContextChips(l) {
  if (l.pathname.startsWith("/ceo")) return true;
  if (l.search.includes("seed_route=learn")) return true;
  if ((l.pathname === "/" || l.pathname.startsWith("/cockpit")) && !l.search.includes("seed_route=")) return true;
  return false;
}

/* Persona shown on every screen — standard format: avatar + name + role.
   The user's identity is consistent across the app; only the page name
   (in row 2) changes. */
export const PERSONA = {
  initials: "SK",
  name: "Sam Kayne",
  role: "VP Retention Ops · USRM Personal Lines",
};

export default function GlobalTopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedThemeId, selectedHypothesisId, sector, setSector, selectTheme } = useAppShell();

  // Switching sector re-scopes the whole app: pick that sector's default
  // signal (so the Analyze/Simulate flow shows the right B2C vs B2B content,
  // numbers and guardrails) and return to the default Sense screen.
  const SECTOR_DEFAULT_THEME = { retail: "retention", commercial: "smbgrowth" };
  const onSector = (s) => {
    if (s === sector) return;
    setSector(s);
    selectTheme(SECTOR_DEFAULT_THEME[s]);
    navigate("/");
  };
  const active = NAV.find((n) => n.match(location));
  const showChips = !hidesContextChips(location);

  return (
    <div className="global-topbar-wrap">
      {/* ROW 1 — identity strip. Standard format: Logo on the left,
          then spacer, then notifications bell, theme toggle, and profile
          (avatar + name + role) flush right. Constant across every
          screen. The bell replaces the persistent right-side rail. */}
      <header className="global-topbar global-topbar-row1">
        <button className="gtb-brand" onClick={() => navigate("/")} title="Home">
          <Logo width={86} />
        </button>
        <div className="gtb-spacer" />
        {/* Sector toggle — scopes the whole cockpit to a business line.
            Retail is the built-out default; commercial layers in later. */}
        <div className="gtb-sector" role="tablist" aria-label="Business sector">
          {["retail", "commercial"].map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={sector === s}
              className={`gtb-sector-opt${sector === s ? " is-active" : ""}`}
              onClick={() => onSector(s)}
            >
              {s === "retail" ? "Retail" : "Commercial"}
            </button>
          ))}
        </div>
        <NotificationBell />
        <ThemeToggle />
        <div className="gtb-profile" title={`${PERSONA.name} · ${PERSONA.role}`}>
          <div className="gtb-profile-av">{PERSONA.initials}</div>
          <div className="gtb-profile-text">
            <div className="gtb-profile-name">{PERSONA.name}</div>
            <div className="gtb-profile-role">{PERSONA.role}</div>
          </div>
        </div>
      </header>

      {/* ROW 2 — page context strip. Page name on the left, theme/hypothesis
          chips on the right (only when the screen is hypothesis-bound).
          Replaces the previous italic "eyebrow + title" doubling. */}
      <div className="global-topbar global-topbar-row2">
        {active && <div className="gtb-page">{active.label}</div>}
        <div className="gtb-spacer" />
        {showChips && selectedThemeId && (
          <div className="gtb-chip">
            <span className="gtb-chip-k">Theme</span>
            <span className="gtb-chip-v">{selectedThemeId}</span>
          </div>
        )}
        {showChips && selectedHypothesisId && (
          <div className="gtb-chip gtb-chip-hyp">
            <span className="gtb-chip-k">Hypothesis</span>
            <span className="gtb-chip-v">{selectedHypothesisId}</span>
          </div>
        )}
        {showChips && (
          <div className="gtb-env">
            <span className="gtb-env-dot" />
            env <b>prod-shadow</b>
          </div>
        )}
      </div>
    </div>
  );
}
