/* ============================================================================
   NotificationBell — topbar bell icon + dropdown popover surfacing the
   agentActivity feed. Replaces the persistent right-side RightRail.

   Behaviour:
     - Bell icon with a badge showing unread count
     - Click → opens a popover with the activity list (newest first)
     - Opening the popover marks everything as seen (badge clears)
     - Click outside or press Esc → closes the popover
   ========================================================================= */
import { useEffect, useRef, useState } from "react";
import { useAppShell } from "@/state/AppShell";

const DEMO_SIGNALS = [
  { id: "seed-1", kind: "info",  src: "Customer data",    text: "Refreshed · 15.3M customer records" },
  { id: "seed-2", kind: "good",  src: "Guardrail check",  text: "NII impact within band" },
  { id: "seed-3", kind: "amber", src: "Competitor scan",  text: "Rate gap widened +55 bps" },
  { id: "seed-4", kind: "info",  src: "TwinX classifier", text: "Scored eligible customers" },
];

export default function NotificationBell() {
  const { agentActivity, pushAgentEvent } = useAppShell();
  const [open, setOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const popRef = useRef(null);

  /* Seed the feed once so first paint isn't empty. */
  useEffect(() => {
    if (agentActivity.length === 0) {
      DEMO_SIGNALS.forEach((s) => pushAgentEvent(s));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Unread = events that arrived since the bell was last opened. */
  const unread = Math.max(0, agentActivity.length - seenCount);

  /* Mark all as seen when the popover opens. */
  useEffect(() => {
    if (open) setSeenCount(agentActivity.length);
  }, [open, agentActivity.length]);

  /* Click-outside + Esc close. */
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="gtb-bell-wrap" ref={popRef}>
      <button
        type="button"
        className={"gtb-bell" + (unread > 0 ? " gtb-bell-has-unread" : "")}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications · ${unread} unread`}
        title={`Activity & signals · ${unread} new`}
      >
        {/* Bell glyph (Unicode) — kept inline so we don't pull in another icon dep. */}
        <svg className="gtb-bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="gtb-bell-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="gtb-bell-pop" role="dialog" aria-label="Activity & signals">
          <div className="gtb-bell-pop-h">
            <span className="gtb-bell-pop-t">Activity & signals</span>
            <span className="gtb-bell-pop-c">{agentActivity.length} events</span>
          </div>
          <div className="gtb-bell-pop-body">
            {agentActivity.length === 0 && (
              <div className="gtb-bell-empty">Nothing yet · workspace actions will appear here.</div>
            )}
            {agentActivity.map((s) => (
              <div key={s.id} className={"gtb-bell-row gtb-bell-" + (s.kind || "info")}>
                <span className="gtb-bell-row-dot" />
                <div className="gtb-bell-row-body">
                  <div className="gtb-bell-row-text">{s.text}</div>
                  <div className="gtb-bell-row-meta">
                    <span className="gtb-bell-row-src">{s.src}</span>
                    <span className="gtb-bell-row-ts">{relTime(s.ts)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function relTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
