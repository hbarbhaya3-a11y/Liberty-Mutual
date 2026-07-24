/* ============================================================================
   RightRail — persistent always-on signal stream + agent activity feed.
   Collapsible to a thin tab via shell state. Mirrors the incentives app's
   SignalsRail / CollapsedRailTab pair.

   In Phase 1 the feed shows a small seed of demo signals so the rail isn't
   empty on first paint. As workspaces dispatch `pushAgentEvent`, real
   events flow in via the global state.
   ========================================================================= */
import { useEffect } from "react";
import { useAppShell } from "@/state/AppShell";

const DEMO_SIGNALS = [
  { id: "seed-1", kind: "info",   src: "Customer data",      text: "Refreshed · 15.3M customer records" },
  { id: "seed-2", kind: "good",   src: "Guardrail check",    text: "NII impact within band" },
  { id: "seed-3", kind: "amber",  src: "Competitor scan",    text: "Rate gap widened +55 bps" },
  { id: "seed-4", kind: "info",   src: "TwinX classifier",   text: "Scored eligible customers" },
];

export default function RightRail() {
  const { railCollapsed, toggleRail, agentActivity, pushAgentEvent } = useAppShell();

  // Seed the rail with demo signals on first mount (only if empty).
  useEffect(() => {
    if (agentActivity.length === 0) {
      DEMO_SIGNALS.forEach((s) => pushAgentEvent(s));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (railCollapsed) {
    return (
      <div className="shell-rail-collapsed" onClick={toggleRail} title="Expand signals">
        <span className="src-icon">◐</span>
        <span className="src-count">{agentActivity.length}</span>
        <span className="src-label">signals</span>
      </div>
    );
  }

  return (
    <aside className="shell-rail">
      <div className="sr-h">
        <span className="sr-h-t">Signals & agent activity</span>
        <button className="sr-h-collapse" onClick={toggleRail} title="Collapse">›</button>
      </div>
      <div className="sr-body">
        {agentActivity.length === 0 && (
          <div className="sr-empty">No signals yet · workspace actions will appear here.</div>
        )}
        {agentActivity.map((s) => (
          <div key={s.id} className={"sr-row sr-" + (s.kind || "info")}>
            <span className="sr-dot" />
            <div className="sr-content">
              <div className="sr-text">{s.text}</div>
              <div className="sr-meta">
                <span className="sr-src">{s.src}</span>
                <span className="sr-ts">{relTime(s.ts)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function relTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + "m ago";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + "h ago";
  return Math.floor(diff / 86_400_000) + "d ago";
}
