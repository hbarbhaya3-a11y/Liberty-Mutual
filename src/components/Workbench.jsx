import React from "react";

/* ============================================================================
   Workbench
   ----------------------------------------------------------------------------
   Two-column layout used by every Test step:
     LEFT  — levers (anchored, ~38% width, min 280px), own scroll
     RIGHT — pre-experimentation insights, own scroll
     FOOTER (optional) — sticky bottom (Continue / Back actions)

   Pure layout. Children manage their own padding & content.
   ========================================================================== */
export default function Workbench({ levers, insights, footer }) {
  return (
    <div className="workbench">
      <div className="workbench-grid">
        <aside className="workbench-levers" aria-label="Levers">
          {levers}
        </aside>
        <section className="workbench-insights" aria-label="Insights">
          {insights}
        </section>
      </div>
      {footer && <div className="workbench-footer">{footer}</div>}
    </div>
  );
}
