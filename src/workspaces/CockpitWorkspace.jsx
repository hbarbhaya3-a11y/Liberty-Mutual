/* ============================================================================
   CockpitWorkspace — the Sense stage embedded in the unified Shell.

   Renders the Cockpit page in embedded mode (returns bare content, no
   PageShell wrap). The user's natural landing — sense the customer-behavior
   themes, pick one, drill into hypotheses.

   When the user picks a theme → hypothesis → "Test this hypothesis":
   onOpenTheme fires with (themeId, mode), sets the theme in global state,
   and routes the user to the Analyze workspace (start of the pipeline at
   the signal/data stage). From there they flow Analyze → Simulate →
   Deploy → Learn.
   ========================================================================= */
import { useNavigate } from "react-router-dom";
import { useAppShell } from "@/state/AppShell";
import Cockpit from "@/pages/Cockpit";

export default function CockpitWorkspace() {
  const navigate = useNavigate();
  const { selectTheme, setThemeMode, pushAgentEvent } = useAppShell();

  // When user clicks a theme in the Cockpit treemap, instead of doing the
  // legacy navigate-to-/theme handoff, we keep them inside the Shell and
  // take them straight to Theme page where they pick a hypothesis. The
  // Theme page already handles the "test this hypothesis" → pipeline route.
  const onOpenTheme = (id, mode) => {
    selectTheme(id);
    setThemeMode(mode === "macro" ? "macro" : "internal");
    pushAgentEvent({ kind: "info", src: "Cockpit", text: `Opened theme · ${id}` });
    // Renewal signal (smbrate) runs its own guided RFP wizard (signal details →
    // goals & guardrails → simulation → outputs), so open it directly in the
    // Analyze stage instead of the generic Theme detail page. The two "signal 1"
    // tiles — retail (retention) and commercial (smbgrowth) — likewise jump
    // straight to the Hypothesize/Analyse stage rather than the Sense detail page.
    if (id === "smbrate" || id === "smbgrowth" || id === "retention") {
      navigate(`/?seed_route=analyse&seed_theme=${encodeURIComponent(id)}`);
      return;
    }
    navigate(`/theme?id=${encodeURIComponent(id)}&mode=${encodeURIComponent(mode)}`);
  };

  // Wrap in .hub-ws-embed so the existing Cockpit-embedded layout rules in
  // shell.css apply (constrains .app height to viewport-minus-topbar so the
  // signal stream + treemap render at the right size — no bottom gap).
  return (
    <div className="hub-ws-embed">
      <Cockpit embedded onOpenTheme={onOpenTheme} />
    </div>
  );
}
