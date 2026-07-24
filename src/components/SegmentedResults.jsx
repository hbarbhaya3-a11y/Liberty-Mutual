/* ============================================================================
   SegmentedResults — the readability-first results surface, shared by the
   idle-cash / deposit-drift simulate views AND the If-What optimizer deep-dive.

   Information architecture (one causal story, top to bottom):
     1. KPI STRIP   — the outcome. The PRIMARY KPI (index 0) is emphasized; the
                      rest are supporting. Always visible (both tabs).
     2. TAB STRIP   — [ Aggregate ]  [ By micro-segment ]
     3a. Aggregate  — POLICY band (the levers that produced this) → the charts.
                      i.e. "this configuration → this blended result".
     3b. Micro      — the per-segment table. Each row carries its OWN
                      product / offer / channel — the granular configuration.

   The tabs do NOT show different results — same recommendation, two zoom
   levels. The micro table reconciles to the KPIs (value sums, rate weighted-avg).

   Emphasis hierarchy: Tier 1 = primary KPI. Tier 2 = other KPIs, each segment's
   Offer + Value. Tier 3 = policy chips, the "why" rationale, customer counts.
   ========================================================================= */
import { useState } from "react";
import "@/styles/segmented-results.css";

export default function SegmentedResults({
  kpis = [], charts, segments, policy = [], objective, valueLabel = "Value", accent = "#5b9dff",
  anchorRate = null, valueScale = 1,
}) {
  const [tab, setTab] = useState("aggregate");
  const rows = (segments && segments.rows) || [];
  const heldBack = segments && segments.heldBack;
  // Wealth attach (and any non-rate use case) carries a per-segment conversion
  // rate instead of an offer-rate. When present, the numeric move column shows
  // conversion %; rate use cases (idle cash / deposits) are unchanged.
  const isConversion = rows.some((r) => r.convPct != null);

  return (
    <div className="seg-results" style={{ "--seg-acc": accent }}>
      {/* 0 · Objective — ties the result back to the optimized input */}
      {objective && (
        <div className="seg-obj">
          <span className="seg-obj-k">Optimizing for</span>
          <span className="seg-obj-v">{objective}</span>
        </div>
      )}

      {/* 1 · KPI strip — primary KPI (i 0) leads the chosen objective, the rest support */}
      <div className="seg-kpis" style={{ gridTemplateColumns: `repeat(${kpis.length}, minmax(0, 1fr))` }}>
        {kpis.map((k, i) => (
          <div className={"seg-kpi" + (i === 0 ? " seg-kpi-lead" : "")} key={i}>
            <div className="seg-kpi-l">{k.label}</div>
            <div className="seg-kpi-v">{k.value}</div>
            {k.baseline != null
              ? <div className="seg-kpi-base"><span className="seg-kpi-base-k">baseline</span><span className="seg-kpi-base-v">{k.baseline}</span></div>
              : (k.sub && <div className="seg-kpi-s">{k.sub}</div>)}
          </div>
        ))}
      </div>

      {/* 2 · Tab strip */}
      <div className="seg-tabs" role="tablist">
        <button className={"seg-tab" + (tab === "aggregate" ? " on" : "")} onClick={() => setTab("aggregate")}>
          Aggregate
        </button>
        <button className={"seg-tab" + (tab === "segment" ? " on" : "")} onClick={() => setTab("segment")}>
          By micro-segment
        </button>
        <span className="seg-tabs-hint">
          {tab === "aggregate" ? "The policy and its blended result" : "The same policy, broken out by segment"}
        </span>
      </div>

      {/* 3a · Aggregate — POLICY band (cause) then charts (effect) */}
      {tab === "aggregate" && (
        <div className="seg-pane">
          {policy.length > 0 && (
            <div className="seg-policy">
              <span className="seg-policy-tag">Policy</span>
              <div className="seg-policy-items">
                {policy.map((p, i) => (
                  <span className="seg-policy-item" key={i}>
                    <span className="seg-policy-k">{p.k}</span>
                    <span className="seg-policy-v">{p.v}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {charts}
        </div>
      )}

      {/* 3b · By micro-segment — table (each row = its own configuration) */}
      {tab === "segment" && (
        <div className="seg-pane">
          <div className={"seg-table" + (isConversion ? "" : " seg-table-rated")} role="table">
            <div className="seg-tr seg-thead" role="row">
              <span className="seg-th seg-col-name">Micro-segment</span>
              <span className="seg-th">{isConversion ? "Recommended motion" : "Product"}</span>
              {isConversion ? (
                <span className="seg-th seg-col-num">Conversion</span>
              ) : (
                <>
                  <span className="seg-th seg-col-num">Offer increment</span>
                  <span className="seg-th seg-col-num">Recommended APY</span>
                </>
              )}
              <span className="seg-th">Channel</span>
              <span className="seg-th seg-col-num seg-col-size">Customers</span>
              <span className="seg-th seg-col-num">{valueLabel}</span>
            </div>
            {rows.map((r, i) => (
              <div className={"seg-tr seg-row" + (r.noRate ? " seg-row-flat" : "")} role="row" key={i}>
                <span className="seg-td seg-col-name">
                  <span className="seg-name">{r.name}</span>
                  <span className="seg-need">{r.need}</span>
                </span>
                <span className="seg-td seg-product">{r.product}</span>
                {r.convPct != null ? (
                  <span className="seg-td seg-col-num seg-offer"><span className="seg-offer-bps">{r.convPct.toFixed(1)}%</span></span>
                ) : (
                  <>
                    <span className="seg-td seg-col-num seg-offer">{r.noRate ? "—" : <span className="seg-offer-bps">+{r.rateBps} bps</span>}</span>
                    <span className="seg-td seg-col-num seg-offer">{r.noRate ? "—" : <span className="seg-offer-apy">{((r.marketRate != null ? r.marketRate : (anchorRate || 0)) + r.rateBps / 100).toFixed(2)}%</span>}</span>
                  </>
                )}
                <span className="seg-td seg-channel">{r.channel}</span>
                <span className="seg-td seg-col-num seg-col-size">{r.size.toLocaleString()}</span>
                <span className="seg-td seg-col-num seg-val">+${(r.niiM * valueScale).toFixed(1)}M</span>
              </div>
            ))}
            {heldBack && heldBack.size > 0 && (
              <div className="seg-tr seg-row seg-row-held" role="row">
                <span className="seg-td seg-col-name">
                  <span className="seg-name">{heldBack.label}</span>
                  <span className="seg-need">Modeled to stay / not suitable — no offer, by design.</span>
                </span>
                <span className="seg-td seg-product">— No offer —</span>
                {isConversion ? (
                  <span className="seg-td seg-col-num seg-offer">—</span>
                ) : (
                  <>
                    <span className="seg-td seg-col-num seg-offer">—</span>
                    <span className="seg-td seg-col-num seg-offer">—</span>
                  </>
                )}
                <span className="seg-td seg-channel">—</span>
                <span className="seg-td seg-col-num seg-col-size">{heldBack.size.toLocaleString()}</span>
                <span className="seg-td seg-col-num seg-val">$0</span>
              </div>
            )}
          </div>
          <div className="seg-foot">
            Each row is the system's recommended action for that segment — {isConversion ? "motions" : "products, rates"} and
            channels vary by what each segment needs. Values sum to the aggregate KPIs above.
          </div>
        </div>
      )}
    </div>
  );
}
