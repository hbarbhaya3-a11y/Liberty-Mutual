/* ============================================================================
   TopBar — sits above each workspace, shows:
     - the workspace's "role" line (small, all-caps, color = group accent)
     - workspace title
     - active context chip ("Working on: Friday rent-day relief")
     - environment / theme toggle on the right
   ========================================================================= */
import TWINX from "@/data/bundle";
import { useAppShell } from "@/state/AppShell";
import { ThemeToggle } from "@/components/Logo";
import { NAV } from "@/components/Sidebar";
import { prettyHypothesisName, prettyClusterName } from "@/data/pretty";

export default function TopBar() {
  const { route, selectedThemeId, selectedHypothesisId } = useAppShell();
  const active = NAV.find((n) => n.id === route);

  const themeMap = selectedThemeId ? TWINX.themeMap[selectedThemeId] : null;
  const cluster = themeMap && themeMap.cluster ? TWINX.clusters[themeMap.cluster] : null;
  const hyp = selectedHypothesisId ? TWINX.hypotheses[selectedHypothesisId] : null;

  return (
    <div className="shell-topbar">
      <div className="st-headings">
        <div className="st-role">
          <span className="st-role-dot" />
          {active?.role || "TwinX Decision Cockpit"}
        </div>
        <div className="st-title">{active?.label || "Workspace"}</div>
      </div>

      <div className="st-spacer" />

      {/* Active context chips — the user always sees what they're working on */}
      {cluster && (
        <div className="st-chip st-chip-theme" title="Selected customer group">
          <span className="st-chip-k">Customer group</span>
          <span className="st-chip-v">{prettyClusterName(cluster)}</span>
        </div>
      )}
      {hyp && (
        <div className="st-chip st-chip-hyp" title="Selected hypothesis">
          <span className="st-chip-k">Hypothesis</span>
          <span className="st-chip-v">{prettyHypothesisName(hyp)}</span>
        </div>
      )}

      <div className="st-env">
        <span className="st-env-dot" />
        env <b>prod-shadow</b>
      </div>

      <ThemeToggle />
    </div>
  );
}
