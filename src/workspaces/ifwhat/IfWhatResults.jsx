/* ============================================================================
   IfWhatResults — the results page for If-What exploration.

   Top : Pareto frontier — non-dominated policies plotted in (objective ×
         fair-lending margin) space. Visual "shape" of the trade-off region.
   Mid : Top 3 recommended policies as cards. Each shows configuration
         summary + key KPIs + metadata (scenarios considered, fidelity).
   Click any card → expanded detail panel underneath.

   On Autopilot, Twin auto-selects rank #1 a few seconds after the page
   reveals, and the staging flow proceeds.
   ========================================================================= */
import { useEffect, useState } from "react";
import ParetoFrontier from "@/components/ParetoFrontier";
import Icon from "@/components/Icon";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import "@/styles/ifwhat.css";
import "@/styles/test-journey.css";

/* Top 3 recommendations — in a real product these come back from the
   optimizer as RANGES (not point estimates), because the simulator's job
   is to tighten the range into a point estimate with a CI. Each ranks
   a *mechanistically distinct* policy lever — not three flavours of the
   same lever — so the user has a real choice. */
/* Three recommendations — each represents a STRATEGICALLY DISTINCT
   choice, not three dial settings of the same policy. The dimensions
   that vary across the three are the ones a PM actually decides on:
     · Cohort scope  (single segment vs. cross-segment expansion)
     · Eligibility precision (strict verified-history vs. permissive)
     · Comms reach (high-precision RM-led vs. broad digital)

   All three implement the same fundamental mechanism (RTP send-limit
   lift for verified recurring obligations) — which keeps every config
   inside the simulator's lever space — but they take meaningfully
   different *positions* on the underlying trade-offs.

   Pilot population is NOT included here — that's a deploy-time
   decision; the optimizer doesn't search over it. */
const TOP_3 = [
  {
    rank: 1,
    id: "balanced",
    name: "Verified-Pattern · Balanced",
    mechanism: "Pattern-matched RTP send-limit lift",
    sub: "Lift the per-txn RTP send limit +20% for gig customers whose recurring rent payments match an 18-month verified-landlord pattern. Best risk-adjusted return on the core hypothesis.",
    hypothesisId: "H-2026-04-12",
    summary: {
      cohort:   "Gig · 200K",
      rails:    "RTP · ACH",
      policy:   "18-mo verified · +20% lift",
      comms:    "Proactive · pre-payday · 3 / wk",
      duration: "8 weeks",
    },
    config: {
      "Cohort":              "Gig · High-Velocity (200K)",
      "Verified-history":    "18 mo",
      "RTP send-limit lift": "+20%",
      "Pilot duration":      "8 weeks",
      "Eligible rails":      "RTP (primary), ACH",
      "Comms style":         "Proactive",
      "Send timing":         "Pre-payday",
      "Comms frequency":     "3 / wk",
    },
    kpis: [
      { k: "NII",                   v: "+$5.6M / yr",  ci: "CI $4.8–6.4M",    est: true, tone: "good" },
      { k: "Payments saved",        v: "+235K / yr",   ci: "CI 190K–280K",    est: true, tone: "good" },
      { k: "Complaints prevented",  v: "+3.0K / yr",   ci: "CI 2.4K–3.6K",    est: true, tone: "good" },
      { k: "Fair-lending margin",   v: "0.94",         ci: "CI 0.92–0.96",    est: true, tone: "good" },
    ],
    metrics: {
      NII_8wk_M: 1.19,
      blockedRemoved_qtr: 58800,
      baselineBlocked_qtr: 75400,
      complaintsRemoved_qtr: 750,
      baselineComplaints_qtr: 962,
      treatedN: 34500,
      blockedReductionPct: 78,
      complaintsReductionPct: 78,
      cohortSegments: [
        { id: "single", label: "Single-payee renters", pct: 46, color: "var(--acq, #5b9dff)" },
        { id: "multi",  label: "Multi-payee renters",  pct: 34, color: "var(--violet, #b794f6)" },
        { id: "util",   label: "Rent + utilities",     pct: 14, color: "var(--acc, #ffb15a)" },
        { id: "edge",   label: "Edge / once-off",      pct: 6,  color: "var(--ink-3)" },
      ],
    },
    meta: {
      scenarios: 124312,
      fidelity: "pre-sim · point + CI",
      ci: "tightens to $4.8–$6.4M post-sim",
    },
    isRecommended: true,
  },
  {
    rank: 2,
    id: "tight-gate",
    name: "Tight-Gate · Conservative",
    mechanism: "Pattern-matched RTP send-limit lift",
    sub: "Stricter eligibility — 24-month verified history, smaller lift, RTP only, educational comms. Helps fewer customers, but bigger fair-lending headroom and lowest model-risk surface.",
    hypothesisId: "H-2026-04-12",
    summary: {
      cohort:   "Gig · 200K",
      rails:    "RTP",
      policy:   "24-mo verified · +15% lift",
      comms:    "Educational · pre-payday · 2 / wk",
      duration: "10 weeks",
    },
    config: {
      "Cohort":              "Gig · High-Velocity (200K)",
      "Verified-history":    "24 mo",
      "RTP send-limit lift": "+15%",
      "Pilot duration":      "10 weeks",
      "Eligible rails":      "RTP",
      "Comms style":         "Educational",
      "Send timing":         "Pre-payday",
      "Comms frequency":     "2 / wk",
    },
    kpis: [
      { k: "NII",                   v: "+$3.0M / yr",  ci: "CI $2.6–3.4M",    est: true, tone: "neutral" },
      { k: "Payments saved",        v: "+135K / yr",   ci: "CI 110K–160K",    est: true, tone: "good" },
      { k: "Complaints prevented",  v: "+1.7K / yr",   ci: "CI 1.4K–2.0K",    est: true, tone: "good" },
      { k: "Fair-lending margin",   v: "0.965",        ci: "CI 0.95–0.98",    est: true, tone: "good" },
    ],
    metrics: {
      NII_8wk_M: 0.64,
      blockedRemoved_qtr: 33000,
      baselineBlocked_qtr: 52000,
      complaintsRemoved_qtr: 420,
      baselineComplaints_qtr: 660,
      treatedN: 22500,
      blockedReductionPct: 63,
      complaintsReductionPct: 64,
      cohortSegments: [
        { id: "single", label: "Single-payee renters", pct: 56, color: "var(--acq, #5b9dff)" },
        { id: "multi",  label: "Multi-payee renters",  pct: 28, color: "var(--violet, #b794f6)" },
        { id: "util",   label: "Rent + utilities",     pct: 11, color: "var(--acc, #ffb15a)" },
        { id: "edge",   label: "Edge / once-off",      pct: 5,  color: "var(--ink-3)" },
      ],
    },
    meta: {
      scenarios: 96284,
      fidelity: "pre-sim · point + CI",
      ci: "tightens to $2.6–$3.4M post-sim",
    },
  },
  {
    rank: 3,
    id: "cross-cohort",
    name: "Cross-Cohort · Expansion",
    mechanism: "Pattern-matched RTP send-limit lift",
    sub: "Same mechanism applied to a second segment — small business · seasonal — that shows the same recurring-payment signature. Higher NII from broader customer base; fair-lending margin tighter (still passing).",
    hypothesisId: "H-2026-04-12",
    summary: {
      cohort:   "Gig + SMB · 353K",
      rails:    "RTP · ACH",
      policy:   "18-mo verified · +18% lift",
      comms:    "Proactive · pre-payday · 3 / wk",
      duration: "8 weeks",
    },
    config: {
      "Cohort":              "Gig (200K) + SMB Seasonal (153K)",
      "Verified-history":    "18 mo",
      "RTP send-limit lift": "+18%",
      "Pilot duration":      "8 weeks",
      "Eligible rails":      "RTP (primary), ACH",
      "Comms style":         "Proactive",
      "Send timing":         "Pre-payday",
      "Comms frequency":     "3 / wk",
    },
    kpis: [
      { k: "NII",                   v: "+$8.2M / yr",  ci: "CI $7.2–9.2M",    est: true, tone: "good" },
      { k: "Payments saved",        v: "+380K / yr",   ci: "CI 320K–440K",    est: true, tone: "good" },
      { k: "Complaints prevented",  v: "+4.7K / yr",   ci: "CI 4.0K–5.4K",    est: true, tone: "good" },
      { k: "Fair-lending margin",   v: "0.885",        ci: "CI 0.87–0.90",    est: true, tone: "warn" },
    ],
    metrics: {
      NII_8wk_M: 1.74,
      blockedRemoved_qtr: 95000,
      baselineBlocked_qtr: 124000,
      complaintsRemoved_qtr: 1180,
      baselineComplaints_qtr: 1520,
      treatedN: 60900,
      blockedReductionPct: 77,
      complaintsReductionPct: 78,
      cohortSegments: [
        { id: "gig-single",   label: "Gig · single-payee",   pct: 28, color: "var(--acq, #5b9dff)" },
        { id: "gig-multi",    label: "Gig · multi-payee",    pct: 22, color: "var(--violet, #b794f6)" },
        { id: "smb-supplier", label: "SMB · supplier recurring", pct: 32, color: "var(--acc, #ffb15a)" },
        { id: "smb-other",    label: "SMB · other recurring",    pct: 18, color: "var(--ink-3)" },
      ],
    },
    meta: {
      scenarios: 81406,
      fidelity: "pre-sim · point + CI",
      ci: "tightens to $7.2–$9.2M post-sim",
    },
  },
];

/* Map objective id → KPI label string. The card surfaces only the KPI
   matching the chosen objective so it stays uncluttered; the full set
   lives in the deep-dive. */
const OBJECTIVE_TO_KPI_LABEL = {
  "nii-recovered":         "NII",
  "payments-saved":        "Payments saved",
  "complaints-prevented":  "Complaints prevented",
};

function RankCard({ rec, objective, isSelected, isAutopilotPick, onSelect }) {
  /* Find the KPI matching the selected objective — this is the only KPI
     rendered on the card so it stays uncluttered. The full KPI set is
     surfaced in the deep-dive PROOF KPIs strip when the user clicks in. */
  const heroLabel = OBJECTIVE_TO_KPI_LABEL[objective] || "NII";
  const heroKpi = rec.kpis.find((k) => k.k === heroLabel) || rec.kpis[0];

  return (
    <button
      className={
        "iw-rank-card" +
        (isSelected ? " is-selected" : "") +
        (rec.rank === 1 ? " is-rank-1" : "") +
        (isAutopilotPick ? " is-ap-pick" : "")
      }
      onClick={() => onSelect(rec.id)}
    >
      <div className="iw-rank-head">
        <span className="iw-rank-num">#{rec.rank}</span>
        {rec.isRecommended && (
          <span className="iw-rank-rec">
            <Icon name="star" size={10} /> RECOMMENDED
          </span>
        )}
        {isAutopilotPick && (
          <span className="iw-rank-appick">
            <Icon name="check" size={10} strokeWidth={2.5} /> TWIN PICKED
          </span>
        )}
      </div>
      <div className="iw-rank-name">{rec.name}</div>

      {/* Hero KPI — single block matching the selected objective. The
          rank's standing on the objective is the first thing the eye
          lands on. Full narrative + the other three KPIs live in the
          deep-dive when the card is clicked. */}
      <div className={"iw-rank-hero iw-rank-kpi-" + heroKpi.tone}>
        <div className="iw-rank-hero-k">{heroKpi.k}</div>
        <div className="iw-rank-hero-v">
          {heroKpi.v}
          {heroKpi.est && <span className="iw-rank-kpi-est">est.</span>}
        </div>
        {heroKpi.ci && <div className="iw-rank-hero-ci">{heroKpi.ci}</div>}
      </div>

      {/* Compressed configuration band — cohort, rails, policy, comms.
          Each Top-3 card shows the same 5 fields in the same order so the
          cards line up and the user can compare what differs (it's not
          just outcomes — it's the policy parameters themselves). */}
      {rec.summary && (
        <div className="iw-rank-summary">
          <div className="iw-rank-summary-row">
            <span className="iw-rank-summary-k">Cohort</span>
            <span className="iw-rank-summary-v">{rec.summary.cohort}</span>
          </div>
          <div className="iw-rank-summary-row">
            <span className="iw-rank-summary-k">Rails</span>
            <span className="iw-rank-summary-v">{rec.summary.rails}</span>
          </div>
          <div className="iw-rank-summary-row">
            <span className="iw-rank-summary-k">Policy</span>
            <span className="iw-rank-summary-v">{rec.summary.policy}</span>
          </div>
          <div className="iw-rank-summary-row">
            <span className="iw-rank-summary-k">Comms</span>
            <span className="iw-rank-summary-v">{rec.summary.comms}</span>
          </div>
          <div className="iw-rank-summary-row">
            <span className="iw-rank-summary-k">Duration</span>
            <span className="iw-rank-summary-v">{rec.summary.duration}</span>
          </div>
        </div>
      )}
    </button>
  );
}

/* Deep-dive panel for a clicked recommendation. Mirrors the shape of the
   What-If results page (Verdict + Proof KPIs + curve + arenas) so the user
   gets the same depth of inspection on any If-What candidate as on a single
   What-If simulation. */
/* Extract a representative fair-lending value from the recommendation's
   KPI array — used in the Guardrails strip to show the projected margin
   alongside the 0.85 floor. Falls back to a sensible default if the KPI
   list doesn't include a fair-lending entry. */
function getFairLendingDetail(rec) {
  const k = rec.kpis.find((x) => /fair.?lending/i.test(x.k));
  if (!k) return "above 0.85 floor";
  return `${k.v} · floor 0.85`;
}

function DeepDive({ rec, onStage }) {
  return (
    <div className="iw-deepdive">
      {/* Header row — name + Stage CTA */}
      <div className="iw-dd-header">
        <div>
          <div className="iw-dd-eyebrow">RANK #{rec.rank} · DEEP DIVE</div>
          <div className="iw-dd-name">{rec.name}</div>
          <div className="iw-dd-sub">{rec.sub}</div>
        </div>
        <button className="iw-detail-stage" onClick={() => onStage(rec)}>
          <Icon name="upload" size={13} /> Stage this policy
        </button>
      </div>

      {/* Verdict band — Simulation supports / partial / fails (rank #1 = supported) */}
      <div className={"iw-dd-verdict iw-dd-verdict-" + (rec.rank === 1 ? "good" : rec.rank === 2 ? "mixed" : "weak")}>
        <span className="iw-dd-verdict-glyph">
          <Icon
            name={rec.rank === 1 ? "check" : rec.rank === 2 ? "warn" : "x"}
            size={18} strokeWidth={2.5}
          />
        </span>
        <div className="iw-dd-verdict-body">
          <div className="iw-dd-verdict-title">
            {rec.rank === 1
              ? "Simulation supports this policy"
              : rec.rank === 2
                ? "Partial support · one guardrail at risk"
                : "Simulation supports with margin · conservative"}
          </div>
          <div className="iw-dd-verdict-sub">
            {rec.meta.scenarios.toLocaleString()} scenarios · fidelity {rec.meta.fidelity} · NII CI {rec.meta.ci}
          </div>
        </div>
      </div>

      {/* PROOF KPIs — pre-sim ranges from the optimizer. Fair-lending is
          excluded from this strip (it's a constraint, not an outcome)
          and lives in the Guardrails strip below. Visually mirrors the
          What-If results page so the user sees the same layout language
          in both flows. */}
      <div className="iw-dd-block">
        <div className="iw-dd-block-h">
          <span className="stag">PROOF KPIs · PROJECTED RANGE</span>
          <span className="stt">Optimizer's pre-sim projection — point estimate with CI · running a What-If simulation on this policy tightens the CI further</span>
        </div>
        <div className="iw-dd-proof">
          {rec.kpis
            .filter((k) => !/fair.?lending/i.test(k.k))
            .map((k, i) => (
              <div key={i} className={"iw-dd-proof-kpi iw-rank-kpi-" + k.tone}>
                <div className="iw-dd-proof-k">{k.k}</div>
                <div className="iw-dd-proof-v">
                  {k.v}
                  {k.est && <span className="iw-dd-proof-est">est.</span>}
                </div>
                {k.ci && <div className="iw-dd-proof-ci">{k.ci}</div>}
              </div>
            ))}
        </div>
      </div>

      {/* GUARDRAILS · same pill strip pattern as the What-If results page.
          Constraints expressed as pass/fail pills, not as headline numbers. */}
      <div className="iw-dd-block">
        <div className="sim-guardrails-strip">
          <div className="sim-guardrails-h">
            <Icon name="check" size={12} strokeWidth={2.5} />
            <span>Guardrails · all projected to pass</span>
          </div>
          <div className="sim-guardrails-pills">
            {[
              { id: "fair",  label: "Fair-lending",          detail: getFairLendingDetail(rec) },
              { id: "fraud", label: "Fraud envelope",        detail: "CI ≤ 0 · within bound" },
              { id: "mrm",   label: "Model Risk (SR 11-7)",  detail: "model card v3.4 audited" },
              { id: "ecoa",  label: "ECOA 4/5 rule",         detail: "no protected-class proxy" },
            ].map((g) => (
              <span key={g.id} className="sim-guardrail-pill sim-guardrail-pass">
                <span className="sim-guardrail-pill-dot" />
                <span className="sim-guardrail-pill-l">{g.label}</span>
                <span className="sim-guardrail-pill-d">{g.detail}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="iw-dd-block">
        <div className="iw-dd-block-h">
          <span className="stag">POLICY CONFIGURATION</span>
          <span className="stt">The exact lever values that produced this result</span>
        </div>
        <table className="iw-detail-table">
          <tbody>
            {Object.entries(rec.config).map(([k, v]) => (
              <tr key={k}>
                <td className="iw-detail-k">{k}</td>
                <td className="iw-detail-v">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PROJECTED OUTCOMES · 2x2 grid — same shared tiles the What-If
          results page renders. A user moving between flows sees identical
          chart anatomy: NII area-with-CI, Payments-saved bars, Complaints
          bars, and Cohort composition stacked bar. */}
      <div className="iw-dd-block">
        <div className="iw-dd-block-h">
          <span className="stag">PROJECTED OUTCOMES</span>
          <span className="stt">Pre-sim trajectories from the optimizer — running a What-If on this policy tightens these into priced curves with CI</span>
        </div>
        <div className="sim-result-grid">
          <ResultTileNII
            outcomes={{ NII_8wk_M: rec.metrics.NII_8wk_M }}
            progress={1}
            insight={`Most of the upside lands by wk 6 — pilot length past that adds little. ${rec.meta.ci}.`}
          />
          <ResultTileBars
            title="Payments saved / wk"
            subhead={`vs ~${Math.round(rec.metrics.baselineBlocked_qtr / 8).toLocaleString()}/wk baseline (cohort untreated)`}
            steady={rec.metrics.blockedRemoved_qtr / 7.57}
            baselinePerWk={rec.metrics.baselineBlocked_qtr / 8}
            progress={1}
            format={(n) => Math.round(n).toLocaleString()}
            rampWeeks={1}
            seed={7 + rec.rank}
            numbers={[
              { k: "avg / wk (steady)", v: `${Math.round(rec.metrics.blockedRemoved_qtr / 7.57).toLocaleString()} (${rec.metrics.blockedReductionPct}% of baseline)` },
              { k: "wk 1 (ramp)",       v: Math.round((rec.metrics.blockedRemoved_qtr / 7.57) * 0.55).toLocaleString() },
              { k: "8-wk total",        v: rec.metrics.blockedRemoved_qtr.toLocaleString() },
            ]}
            insight="Slow start in wk 1 — customers need to know about the new policy before they use it. Full effect from wk 2."
            accent="var(--acc, #ffb15a)"
          />
          <ResultTileBars
            title="Complaints prevented / wk"
            subhead={`vs ~${Math.round(rec.metrics.baselineComplaints_qtr / 8)}/wk baseline (cohort untreated)`}
            steady={rec.metrics.complaintsRemoved_qtr / 7.57}
            baselinePerWk={rec.metrics.baselineComplaints_qtr / 8}
            progress={1}
            format={(n) => Math.round(n).toLocaleString()}
            rampWeeks={3}
            seed={19 + rec.rank}
            numbers={[
              { k: "avg / wk (steady)", v: `${Math.round(rec.metrics.complaintsRemoved_qtr / 7.57).toLocaleString()} (${rec.metrics.complaintsReductionPct}% of baseline)` },
              { k: "wk 1 (lagged)",     v: Math.round((rec.metrics.complaintsRemoved_qtr / 7.57) * 0.30).toLocaleString() },
              { k: "8-wk total",        v: rec.metrics.complaintsRemoved_qtr.toLocaleString() },
            ]}
            insight="Complaints drop about a week behind failures — the natural lag between a fixed payment and the call that never gets made."
            accent="var(--green, #42e08b)"
          />
          <ResultTileCohort
            segments={rec.metrics.cohortSegments}
            treatedN={rec.metrics.treatedN}
            insight={
              rec.rank === 1
                ? "Four-in-five customers helped are renters paying one or two landlords — the simpler patterns drive most of the value."
                : rec.rank === 2
                  ? "The Friday-evening window concentrates the impact — over half the gains come from that single time slice."
                  : "The re-route handles two distinct failure modes — RTP-over-limit and ACH-too-slow — at roughly 2:1."
            }
          />
        </div>
      </div>

    </div>
  );
}

export default function IfWhatResults({ isAutopilot, objective, onStage, onBackToConfig }) {
  // Default selection: rank #1 (the recommended policy).
  const [selectedId, setSelectedId] = useState(TOP_3[0].id);
  const selected = TOP_3.find((r) => r.id === selectedId);

  // Autopilot auto-stages the top recommendation a few seconds after the
  // page reveals. User can "Take over" via the back button before that.
  useEffect(() => {
    if (!isAutopilot) return;
    const t = setTimeout(() => onStage(TOP_3[0]), 4500);
    return () => clearTimeout(t);
  }, [isAutopilot, onStage]);

  return (
    <div className="results-page">
      <header className="results-page-header">
        <button className="tj-btn tj-btn-ghost" onClick={onBackToConfig}>
          <Icon name="arrowLeft" size={14} /> Tune and re-run
        </button>
        <div className="results-page-title">
          <div className="test-journey-eyebrow">RESULTS · IF-WHAT OPTIMIZER</div>
          <h1 className="test-journey-title">Pareto frontier · top 3 policies</h1>
        </div>
        <div className="results-page-spacer" />
      </header>

      <div className="results-page-body">
        <div className="results-content">
          {/* RECS + PARETO — combined panel. Vertically-stacked rec cards
              on the left (3 compact cards comparing the same lever space
              at different dosages) + Pareto frontier on the right (the
              trade-off shape). Both views show the same 3 candidates in
              different representations, so clicking either updates the
              deep-dive below. */}
          <section className="panel reveal in iw-recs-pareto">
            <div className="panel-h">
              <span className="stag">TOP 3 RECOMMENDATIONS</span>
              <span className="stt">Optimizer's best policies under your objective and ranges · click any card or Pareto point</span>
              {isAutopilot && (
                <span className="iw-ap-banner">
                  <span className="iw-ap-dot" />
                  Twin is selecting rank #1…
                </span>
              )}
            </div>
            <div className="panel-body iw-recs-pareto-body">
              <div className="iw-recs-col">
                {TOP_3.map((rec) => (
                  <RankCard
                    key={rec.id}
                    rec={rec}
                    objective={objective}
                    isSelected={rec.id === selectedId}
                    isAutopilotPick={isAutopilot && rec.rank === 1}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
              <div className="iw-pareto-col">
                <div className="iw-pareto-col-h">
                  <span className="iw-pareto-col-l">Pareto frontier</span>
                  <span className="iw-pareto-col-s">NII × fair-lending</span>
                </div>
                <div className="iw-pareto-col-chart">
                  <ParetoFrontier selectedId={selectedId} onSelect={setSelectedId} />
                </div>
              </div>
            </div>
          </section>

          {/* Deep dive for the selected recommendation — verdict + KPIs +
              configuration + reasoning. Same depth as a What-If result. */}
          {selected && (
            <section className="panel reveal in">
              <DeepDive rec={selected} onStage={onStage} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
