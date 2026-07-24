/* ============================================================================
   MicroSegmentResults — the config-driven results body for the shared B2B
   (SMB) Simulate flow. Renders three things entirely from `cfg`:

     1. HEADLINE   — best-configuration cohort metric (vs base) + proof points
     2. TABLE      — the emergent micro-segments (go / hold / blocked), clickable
     3. CARD       — the per-segment recommendation, shown for the selected row

   No hardcoded use-case content — every label, column, segment and figure comes
   from the resolved config (b2bGrowthConfig.js / b2bRateConfig.js). Styling is
   in styles/b2b.css.
   ========================================================================= */

import { useState } from "react";

export default function MicroSegmentResults({ cfg, accent }) {
  if (!cfg) return null;

  const { headline, segmentColumns, microSegments } = cfg;

  // Default-select the first "go" segment so the card is visible on load.
  const firstGo = microSegments.find((s) => s.tone === "go") || microSegments[0];
  const [selId, setSelId] = useState(firstGo ? firstGo.id : null);

  const toggle = (id) => setSelId((cur) => (cur === id ? null : id));

  const selected = microSegments.find((s) => s.id === selId) || null;

  // Render a single data cell for a given segment × column.
  const renderCell = (seg, col) => {
    const val = seg[col.id];

    // SPECIAL CASE the conversion column.
    if (col.id === "conv") {
      if (seg.convBase != null) {
        return (
          <span className="b2b-seg-cell">
            <span className="b2b-seg-conv">{seg.conv + "%"}</span>{" "}
            <span className="b2b-seg-conv-base">{"vs " + seg.convBase + "%"}</span>
          </span>
        );
      }
      // conv may be a string like "+$18M" — render as-is.
      if (val === "—" || val == null) {
        if (seg.tone === "hold") return <span className="b2b-seg-tag hold">Hold</span>;
        if (seg.tone === "blocked") return <span className="b2b-seg-tag blocked">Blocked</span>;
        return <span className="b2b-seg-cell">—</span>;
      }
      return <span className="b2b-seg-conv">{val}</span>;
    }

    // For hold/blocked rows whose value is a bare "—", surface a small tag in
    // the first data column instead of an empty dash.
    if ((val === "—" || val == null) && col.id === segmentColumns[0].id) {
      if (seg.tone === "hold") return <span className="b2b-seg-tag hold">Hold</span>;
      if (seg.tone === "blocked") return <span className="b2b-seg-tag blocked">Blocked</span>;
    }

    return <span className="b2b-seg-cell">{val == null ? "—" : val}</span>;
  };

  return (
    <>
      {/* ============== 1 · HEADLINE — verdict callout + proof-kpi tiles ===== */}
      <div className="verdict-callout verdict-proven">
        <span className="verdict-glyph">✓</span>
        <div className="verdict-body">
          <div className="verdict-title">{headline.lead}</div>
          <div className="verdict-sub">
            <span className="b2b-headline-from">{headline.metricFrom}</span>
            <span className="b2b-headline-arrow"> → </span>
            <span className="b2b-headline-to">{headline.metricTo}</span>
            {headline.metricNote && (
              <span className="b2b-headline-note"> · {headline.metricNote}</span>
            )}
          </div>
        </div>
      </div>

      <div className="proof-kpis-grid">
        {headline.points.map((p, i) => (
          <div key={i} className="proof-kpi">
            <div className="proof-kpi-h">
              <span className="proof-kpi-l">{p.l}</span>
            </div>
            <div className="proof-kpi-v-row">
              <span className="proof-kpi-v">{p.v}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============== 2 · MICRO-SEGMENT TABLE ============== */}
      <section className="aw-chapter">
        <div className="aw-chapter-h">
          <div className="aw-chapter-accent" />
          <div className="aw-chapter-text">
            <div className="aw-chapter-title">
              Emergent micro-segments · one cohort, many right answers
            </div>
            <div className="aw-chapter-sub">
              go / hold / blocked · click a row for the per-segment policy
            </div>
          </div>
          <div className="aw-chapter-meta-row">
            <span className="aw-chapter-meta">{microSegments.length} segments</span>
          </div>
        </div>

        <div className="b2b-segtable">
          <div className="b2b-seghead">
            <span>Micro-segment</span>
            {segmentColumns.map((col) => (
              <span key={col.id}>{col.label}</span>
            ))}
          </div>
          {microSegments.map((seg) => (
            <div
              key={seg.id}
              className={
                "b2b-segrow " + seg.tone + (selId === seg.id ? " sel" : "")
              }
              onClick={() => toggle(seg.id)}
            >
              <div>
                <span className="b2b-seg-name">{seg.name}</span>{" "}
                <span className="b2b-seg-n">{"~" + seg.n.toLocaleString()}</span>
                <div className="b2b-seg-sig">{seg.signals}</div>
              </div>
              {segmentColumns.map((col) => (
                <div key={col.id}>{renderCell(seg, col)}</div>
              ))}
            </div>
          ))}
        </div>

        {/* ============== 3 · PER-SEGMENT CARD ============== */}
        {selected && (
          <div className="b2b-segcard">
            <div className="b2b-segcard-h">
              <span className="b2b-segcard-name">{selected.name}</span>
              {selected.tone === "hold" && <span className="b2b-seg-tag hold">Hold</span>}
              {selected.tone === "blocked" && <span className="b2b-seg-tag blocked">Blocked</span>}
            </div>
            <div className="b2b-segcard-grid">
              <div className="b2b-segcard-row">
                <span className="b2b-segcard-k proof-kpi-l">Detected need</span>
                <span className="b2b-segcard-v">{selected.need}</span>
              </div>
              <div className="b2b-segcard-row">
                <span className="b2b-segcard-k proof-kpi-l">Recommended</span>
                <span className="b2b-segcard-v">
                  {selected.product}
                  {selected.rate ? " · " + selected.rate : ""}
                </span>
              </div>
              <div className="b2b-segcard-row">
                <span className="b2b-segcard-k proof-kpi-l">Channel</span>
                <span className="b2b-segcard-v">{selected.channel}</span>
              </div>
              <div className="b2b-segcard-row">
                <span className="b2b-segcard-k proof-kpi-l">Cost to serve</span>
                <span className="b2b-segcard-v">{selected.cost}</span>
              </div>
              <div className="b2b-segcard-row">
                <span className="b2b-segcard-k proof-kpi-l">Predicted KPI · confidence</span>
                <span className="b2b-segcard-v">{selected.confidence}</span>
              </div>
              <div className="b2b-segcard-cf">
                {"Counterfactual (do-nothing): " +
                  (selected.convBase != null
                    ? selected.convBase +
                      "% base conversion — lift shown is net, not gross."
                    : "shown beside each figure so the lift is real, not gross.")}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
