/* ============================================================================
   LearnWorkspace — portfolio dashboard of completed scenarios.

   Cross-scenario results view: every pilot that ran to completion sits
   in this table with realised-vs-predicted fidelity, outcome verdict, and
   the date it closed. Aggregate header strip surfaces patterns across the
   set (average fidelity, promotion rate, common drift, scenarios closed).

   Row click → inline expansion showing realised-vs-predicted KPI grid +
   writeback ledger of what the loop learned and pushed back into the twin.
   ========================================================================= */
import { useEffect, useMemo, useState } from "react";
import TWINX from "@/data/bundle";
import { useAppShell, DEFAULT_THEME_ID, DEFAULT_HYPOTHESIS_ID } from "@/state/AppShell";
import Icon from "@/components/Icon";
import "@/styles/portfolio.css";
import { RETENTION_EXPERIMENTS, RETENTION_SYSTEMIC } from "@/data/retentionLearnExperiments";
import { deriveLearnRow } from "@/data/projectedRct";

/* themeId → display name for derived (just-completed) pilots. */
const THEME_NAMES = {
  wealth:    "Wealth attach",
  liquidity: "Idle-cash liquidity",
  retention: "Deposit retention",
  gig:       "Gig money movement",
  smbrate:   "SMB rate defense",
  smbgrowth: "SMB growth",
};

/* Mock historical scenarios — the portfolio of completed pilots a PM
   would see in production. One of these is the recently-staged Trust-Aware
   Lift after it ran to completion; the rest are unrelated prior runs. */
const MOCK_EXPERIMENTS_BASE = [
  {
    id: "exp-2026-0047",
    name: "Trust-Aware Ceiling Lift v1",
    hypothesis: "H-2026-04-12",
    cluster: "gig-economy",
    themeName: "Gig money movement",
    fidelity: 0.94,
    outcome: "promoted",
    closedAt: dayBack(7),
    fidelityRows: [
      { k: "NII gain",            predicted: "+$56M / yr",   actual: "+$52.4M / yr",  tone: "ok" },
      { k: "Blocked payments",    predicted: "−236K / yr",    actual: "−228K / yr",    tone: "ok" },
      { k: "Fair-lending margin", predicted: "0.94",          actual: "0.93",          tone: "ok" },
      { k: "Complaints",          predicted: "−3,360 / yr",   actual: "−3,684 / yr",   tone: "ok" },
      { k: "Fraud impact",        predicted: "≈ 0",           actual: "≈ 0",            tone: "ok" },
    ],
    writeback: [
      "Verified-payee pattern weights updated: 18-month threshold confirmed across the cohort",
      "Trust-gate model fidelity now 0.94 R² on the validation window (up from 0.91 pre-pilot)",
      "Next move extending the policy to 80% rollout — drafted as next hypothesis",
    ],
    modelUpdates: [
      { driver: "trust_gate.fidelity_r2",            before: 0.91, after: 0.94, dir: "up",  sourceKpi: "NII gain",          note: "Validation window expanded to 12 weeks" },
      { driver: "verified_payee.recurrence_months",  before: 24,   after: 18,   dir: "down", sourceKpi: "NII gain",          note: "18-mo threshold sufficient — confirmed across cohort" },
      { driver: "gig.friction_to_nps_lift_weight",   before: 0.00, after: 0.04, dir: "new", sourceKpi: "Complaints",        note: "Secondary NPS lift from friction-removal — wasn't in prior model" },
    ],
  },
  {
    id: "exp-2026-0039",
    name: "Subscription-stacking nudge",
    hypothesis: "H-2026-03-22",
    cluster: "under-35",
    themeName: "Subscription stacking",
    fidelity: 0.87,
    outcome: "mixed",
    closedAt: dayBack(21),
    fidelityRows: [
      { k: "Cancellation rate", predicted: "−14%",         actual: "−9%",            tone: "warn" },
      { k: "Net retention",     predicted: "+2.1%",        actual: "+2.3%",          tone: "ok" },
      { k: "Notification CTR",  predicted: "32%",          actual: "28%",            tone: "warn" },
      { k: "NPS delta",         predicted: "+3.2",         actual: "+4.1",           tone: "ok" },
    ],
    writeback: [
      "Cancellation-rate driver weight reduced — nudge effect smaller than projected",
      "Under-35 segment sub-clusters identified for narrower targeting next round",
      "Twin flags need for behavioral cluster refit — scheduled for next sprint",
    ],
    modelUpdates: [
      { driver: "under_35.nudge_cancel_effect",      before: 0.32, after: 0.18, dir: "down", sourceKpi: "Cancellation rate", note: "Nudge effect ~44% smaller than modelled" },
      { driver: "under_35.cluster_refit_due",        before: "no", after: "yes", dir: "flag", sourceKpi: "Notification CTR",  note: "Sub-cluster heterogeneity exceeds within-cluster tolerance" },
    ],
  },
  {
    id: "exp-2026-0031",
    name: "Wholesale ladder · pilot 1",
    hypothesis: "H-2026-04-08",
    cluster: "b2b-deposits",
    themeName: "B2B deposits",
    fidelity: 0.91,
    outcome: "promoted",
    closedAt: dayBack(42),
    fidelityRows: [
      { k: "NII contribution",  predicted: "+$64M / yr",   actual: "+$61.5M / yr",  tone: "ok" },
      { k: "Deposit retention", predicted: "+4.2%",         actual: "+4.5%",         tone: "ok" },
      { k: "Average ticket",    predicted: "+$2.1M",        actual: "+$1.78M",       tone: "warn" },
      { k: "Fair-pricing band", predicted: "within ±2bp",   actual: "+1.4bp",        tone: "ok" },
    ],
    writeback: [
      "Tiered-rate elasticity confirmed for the $1M–$10M deposit band",
      "Outlier behaviour at the top tier — investigate before scale-up",
      "Next move a $10M+ tier extension as the next hypothesis",
    ],
    modelUpdates: [
      { driver: "wholesale.elasticity.1M_10M_band",  before: "est", after: "validated", dir: "flag", sourceKpi: "NII contribution", note: "Within ±4% of predicted — promote band to validated" },
      { driver: "wholesale.ticket_outlier.10M_plus", before: 1.0,  after: 1.2,  dir: "up",  sourceKpi: "Average ticket",    note: "Top-tier variance wider than modelled" },
    ],
  },
  {
    id: "exp-2026-0024",
    name: "Mass-affluent SMA bridge · prototype",
    hypothesis: "H-2026-02-19",
    cluster: "mass-affluent",
    themeName: "Wealth onramp",
    fidelity: 0.82,
    outcome: "did-not-support",
    closedAt: dayBack(68),
    fidelityRows: [
      { k: "Brokerage account attach", predicted: "+8%",    actual: "+2%",            tone: "bad" },
      { k: "Deposit retention",     predicted: "+1.8%",     actual: "+1.2%",          tone: "warn" },
      { k: "Cross-product attach",  predicted: "+11%",      actual: "+3%",            tone: "bad" },
      { k: "Cost-to-serve delta",   predicted: "−$15M",     actual: "−$5.2M",        tone: "warn" },
    ],
    writeback: [
      "Conversion path between checking and SMA flagged as too long for the segment",
      "Hypothesis returned to ideation — Twin proposes a credit-builder bridge instead",
      "Cross-product attach driver weights downgraded for this segment",
    ],
    modelUpdates: [
      { driver: "mass_affluent.cross_attach_weight", before: 0.18, after: 0.06, dir: "down", sourceKpi: "Cross-product attach", note: "Predicted +11%, realised +3% — driver de-rated" },
      { driver: "sma.conversion_path_steps",         before: 4,    after: 2,    dir: "down", sourceKpi: "Brokerage account attach", note: "4-step path too long for segment — collapsed to 2" },
    ],
  },
  {
    id: "exp-2026-0018",
    name: "Retirement glidepath · pilot",
    hypothesis: "H-2026-01-14",
    cluster: "retirement",
    themeName: "Retirement advisory",
    fidelity: 0.96,
    outcome: "promoted",
    closedAt: dayBack(86),
    fidelityRows: [
      { k: "Glidepath adoption", predicted: "+12%",       actual: "+13.4%",         tone: "ok" },
      { k: "AUM retention",      predicted: "+6.1%",      actual: "+5.9%",          tone: "ok" },
      { k: "Advisor touch lift", predicted: "+22%",       actual: "+24%",           tone: "ok" },
      { k: "Risk-band drift",    predicted: "within band", actual: "within band",   tone: "ok" },
    ],
    writeback: [
      "Glidepath adoption higher than projected in the 55-65 sub-band",
      "Twin retrained on the new retention curve — driver weights stable",
      "Recommend Phase-2 extension to ages 50-55",
    ],
  },
  {
    id: "exp-2026-0012",
    name: "Fraud-pattern wire holds",
    hypothesis: "H-2026-01-04",
    cluster: "elder",
    themeName: "Elder protection",
    fidelity: 0.92,
    outcome: "promoted",
    closedAt: dayBack(98),
    fidelityRows: [
      { k: "Fraud loss avoided",  predicted: "$6.0M", actual: "$6.42M", tone: "ok" },
      { k: "False-positive rate", predicted: "2.1%",  actual: "2.4%",  tone: "warn" },
      { k: "Customer friction",   predicted: "<0.4%", actual: "0.31%", tone: "ok" },
      { k: "Resolution time",     predicted: "14 hr", actual: "12 hr", tone: "ok" },
    ],
    writeback: [
      "Fraud-loss avoidance outperformed projection by 7%",
      "False-positive rate ran 30 bps above predicted — trusted-contact gate retrained",
      "Promoted to full rollout under standard fraud envelope",
    ],
    modelUpdates: [
      { driver: "fraud_pattern.loss_avoidance_factor", before: 1.00, after: 1.07, dir: "up",   sourceKpi: "Fraud loss avoided", note: "Realised 7% above projection on $6M base" },
      { driver: "trusted_contact_gate.fp_tolerance",   before: 0.021, after: 0.024, dir: "up", sourceKpi: "False-positive rate", note: "+30 bps tolerated; alternative wider customer friction" },
    ],
  },
  {
    id: "exp-2026-0009",
    name: "Affluent-tier checking primacy",
    hypothesis: "H-2025-12-18",
    cluster: "mass-affluent",
    themeName: "Wealth onramp",
    fidelity: 0.89,
    outcome: "mixed",
    closedAt: dayBack(112),
    fidelityRows: [
      { k: "Primacy lift",      predicted: "+3.4%",  actual: "+4.1%",  tone: "ok" },
      { k: "NII attribution",   predicted: "+$22M", actual: "+$17.4M", tone: "warn" },
      { k: "Cross-channel atch", predicted: "+18%",  actual: "+11%",   tone: "warn" },
      { k: "CET1 impact",       predicted: "neutral", actual: "neutral", tone: "ok" },
    ],
    writeback: [
      "Primacy lift exceeded — but NII attribution underperformed",
      "Cross-channel attach weaker than modelled — funnel re-segmented",
      "Next move scaled redesign with new attach driver weights",
    ],
  },
  {
    id: "exp-2026-0004",
    name: "Pre-payday RTP smart-route · prototype",
    hypothesis: "H-2025-11-22",
    cluster: "gig-economy",
    themeName: "Gig money movement",
    fidelity: 0.93,
    outcome: "promoted",
    closedAt: dayBack(124),
    fidelityRows: [
      { k: "RTP routing share",  predicted: "47%",      actual: "51%",      tone: "ok" },
      { k: "Failure rate",       predicted: "−4.2 pp",  actual: "−4.8 pp",  tone: "ok" },
      { k: "Median settle time", predicted: "18 sec",   actual: "16 sec",   tone: "ok" },
      { k: "Fee leakage",        predicted: "neutral",  actual: "−$0.28M",  tone: "ok" },
    ],
    writeback: [
      "RTP route picked up 4 pp faster than the model predicted",
      "Settle-time underrun became a small NPS lift in the trailing 4 wks",
      "Smart-route logic promoted to production · enabled for all verified senders",
    ],
  },
  {
    id: "exp-2025-0098",
    name: "Cross-sell · life-event capture",
    hypothesis: "H-2025-10-29",
    cluster: "home",
    themeName: "Life-event capture",
    fidelity: 0.84,
    outcome: "mixed",
    closedAt: dayBack(146),
    fidelityRows: [
      { k: "Life-event attach", predicted: "+9.2%",   actual: "+5.8%",  tone: "bad" },
      { k: "Primacy hold",      predicted: "+2.1%",   actual: "+2.4%",  tone: "ok" },
      { k: "NII per converted", predicted: "+$420",   actual: "+$385",  tone: "warn" },
      { k: "Consent rate",      predicted: ">62%",    actual: "57%",    tone: "warn" },
    ],
    writeback: [
      "Life-event signal accurate, but the conversion call-out is too late in the journey",
      "Consent rate ran 5 pp below projection — friction in the suitability gate",
      "Recommended next: shorter cross-sell window, advisor-led variant",
    ],
    modelUpdates: [
      { driver: "wealth_onramp.consent_rate_prior",  before: 0.62, after: 0.57, dir: "down", sourceKpi: "Consent rate",      note: "Suitability-gate friction larger than modelled" },
      { driver: "life_event.conversion_window_days", before: 14,   after: 7,    dir: "down", sourceKpi: "Life-event attach", note: "Call-out too late — window shortened" },
    ],
  },
  {
    id: "exp-2025-0082",
    name: "Subscription cancel · save offer",
    hypothesis: "H-2025-09-15",
    cluster: "under-35",
    themeName: "Subscription stacking",
    fidelity: 0.79,
    outcome: "did-not-support",
    closedAt: dayBack(178),
    fidelityRows: [
      { k: "Save rate",       predicted: "+18%",  actual: "+4%",   tone: "bad" },
      { k: "Customer NPS",    predicted: "+2.4",  actual: "−1.1",  tone: "bad" },
      { k: "Repeat saves",    predicted: "neutral", actual: "−6%", tone: "warn" },
      { k: "Cost per save",   predicted: "$28",   actual: "$74",   tone: "bad" },
    ],
    writeback: [
      "Save offer was perceived as friction, not value — cost per save 2.6x projected",
      "Cancellation intent model retrained on the negative NPS signal",
      "Hypothesis returned to ideation — replaced by an opt-in win-back flow",
    ],
  },
];

/* Merged export — base + retention scenarios. PriorAnchorPill in
   SimulateWorkspace reads this combined array to find prior pilots. */
export const MOCK_EXPERIMENTS = [...MOCK_EXPERIMENTS_BASE, ...RETENTION_EXPERIMENTS];

/* ---------------------------------------------------------------------------
   Systemic miscalibrations — patterns Twin detected across pilots, not from
   any single one. These are what the model uses to recalibrate its priors
   for whole *themes*, not individual hypotheses. Shown as a callout above
   the per-pilot table.

   Each entry references the pilots it was derived from, so the callout can
   link back to the evidence. In production these would be auto-mined from
   the `modelUpdates` ledger above; here they're declared to keep the demo
   data internally consistent.
--------------------------------------------------------------------------- */
const SYSTEMIC_MISCALIBRATIONS_BASE = [
  {
    id: "sys-wealth-consent",
    theme: "Wealth onramp",
    tone: "bad",
    pattern: "Twin under-predicts consent + cross-attach in wealth-onramp segments by ~5pp",
    drift: "−5.0pp",
    sources: ["exp-2025-0098", "exp-2026-0024", "exp-2026-0009"],
    action: "wealth_onramp.consent_rate prior 0.62 → 0.57 · advisor-led variant flagged",
  },
  {
    id: "sys-under35-nudge",
    theme: "Under-35 behavioural",
    tone: "warn",
    pattern: "Nudge-based interventions in under-35 systematically over-estimate effect size",
    drift: "+44% vs realised",
    sources: ["exp-2026-0039", "exp-2025-0082"],
    action: "under_35.cluster_refit scheduled · nudge-effect prior 0.32 → 0.18",
  },
  {
    id: "sys-gig-nps-upside",
    theme: "Gig money movement",
    tone: "good",
    pattern: "Gig-segment friction-removal policies under-predict secondary NPS / complaint lift",
    drift: "+0.04 weight",
    sources: ["exp-2026-0047", "exp-2026-0004"],
    action: "gig.friction_to_nps_lift weight 0.00 → 0.04 added to model",
  },
];

/* Merged export — base + retention systemic miscalibrations. */
export const SYSTEMIC_MISCALIBRATIONS = [...SYSTEMIC_MISCALIBRATIONS_BASE, ...RETENTION_SYSTEMIC];

const OUTCOME = {
  promoted:          { label: "Promoted",            tone: "green" },
  mixed:             { label: "Mixed",               tone: "amber" },
  "did-not-support": { label: "Did not support",     tone: "muted" },
};

function dayBack(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.getTime();
}
function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function LearnWorkspace() {
  const {
    selectedThemeId, selectedHypothesisId, stagedPolicies,
    navigate: nav, selectTheme, selectHypothesis,
  } = useAppShell();

  useEffect(() => {
    if (!selectedThemeId) selectTheme(DEFAULT_THEME_ID);
    if (!selectedHypothesisId) selectHypothesis(DEFAULT_HYPOTHESIS_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  /* Staged pilots that carried a projection show up here as their own
     just-completed rows — realised-vs-predicted derived from the experiment
     the user actually ran, prepended above the historical portfolio. */
  const liveRows = useMemo(
    () => (stagedPolicies || [])
      .map((p) => deriveLearnRow(p, THEME_NAMES[p.themeId] || p.themeName || "—"))
      .filter(Boolean)
      .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0)),
    [stagedPolicies]
  );
  const rows = useMemo(() => [...liveRows, ...MOCK_EXPERIMENTS], [liveRows]);
  const filtered = useMemo(
    () => rows.filter((r) => filter === "all" || r.outcome === filter),
    [filter, rows]
  );

  // Aggregate header — average fidelity, promotion rate, total closed, drift count
  const aggregates = useMemo(() => {
    const fidelities = rows.map((r) => r.fidelity);
    const avgFid = fidelities.reduce((a, b) => a + b, 0) / fidelities.length;
    const promoted = rows.filter((r) => r.outcome === "promoted").length;
    const driftCount = rows.filter((r) => r.fidelityRows.some((f) => f.tone !== "ok")).length;
    return {
      avgFid: avgFid.toFixed(2),
      promoted,
      total: rows.length,
      promotionRate: `${Math.round((promoted / rows.length) * 100)}%`,
      driftCount,
    };
  }, [rows]);

  const counts = {
    all: rows.length,
    promoted: rows.filter((r) => r.outcome === "promoted").length,
    mixed: rows.filter((r) => r.outcome === "mixed").length,
    "did-not-support": rows.filter((r) => r.outcome === "did-not-support").length,
  };

  if (rows.length === 0) {
    return (
      <div className="ws-empty">
        <div className="ws-empty-tag">LEARN · WAITING</div>
        <h2>No completed pilots</h2>
        <p>Once a policy completes its live pilot in <b>Deploy</b>, it appears here with realised vs predicted results.</p>
        <button className="ws-stub-btn" onClick={() => nav("deploy")}>Open Deploy →</button>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      {/* HEADER */}
      <header className="portfolio-header">
        <div className="portfolio-header-title">
          <div className="test-journey-eyebrow">OPERATIONS · LEARN</div>
          <h1 className="test-journey-title">Scenario portfolio</h1>
          <p className="test-journey-sub">
            How well each pilot's <b>actual outcomes</b> matched what we predicted before the RCT — and what the bank decided to do next.
          </p>
        </div>
        <div className="portfolio-header-counts">
          <FilterChip active={filter === "all"}              onClick={() => setFilter("all")}              label="All"               count={counts.all} />
          <FilterChip active={filter === "promoted"}         onClick={() => setFilter("promoted")}         label="Promoted"          count={counts.promoted}         tone="green" />
          <FilterChip active={filter === "mixed"}            onClick={() => setFilter("mixed")}            label="Mixed"             count={counts.mixed}            tone="amber" />
          <FilterChip active={filter === "did-not-support"}  onClick={() => setFilter("did-not-support")}  label="Did not support"   count={counts["did-not-support"]} tone="muted" />
        </div>
      </header>

      <div className="portfolio-body">
        {/* AGGREGATE STRIP */}
        <div className="portfolio-aggregate">
          <div className="portfolio-agg-cell">
            <div className="portfolio-agg-k">Prediction accuracy</div>
            <div className="portfolio-agg-v">{aggregates.avgFid}</div>
            <div className="portfolio-agg-s">how closely actual results tracked the pre-RCT prediction (avg R² · {aggregates.total} pilots)</div>
          </div>
          <div className="portfolio-agg-cell">
            <div className="portfolio-agg-k">Promotion rate</div>
            <div className="portfolio-agg-v">{aggregates.promotionRate}</div>
            <div className="portfolio-agg-s">{aggregates.promoted} of {aggregates.total} pilots</div>
          </div>
          <div className="portfolio-agg-cell">
            <div className="portfolio-agg-k">Pilots with drift</div>
            <div className="portfolio-agg-v">{aggregates.driftCount}</div>
            <div className="portfolio-agg-s">At least one KPI outside CI</div>
          </div>
          <div className="portfolio-agg-cell">
            <div className="portfolio-agg-k">Closed this quarter</div>
            <div className="portfolio-agg-v">{aggregates.total}</div>
            <div className="portfolio-agg-s">Across {countThemes(rows)} themes</div>
          </div>
        </div>

        {/* SYSTEMIC MISCALIBRATIONS — patterns across pilots that drive
            theme-level prior updates, not just single-experiment updates.
            Surfaced above the table so the headline story is "Twin is
            recalibrating itself", not just "here are the experiments." */}
        <SystemicCallouts items={SYSTEMIC_MISCALIBRATIONS} />

        {/* TABLE */}
        <table className="portfolio-table">
          <thead>
            <tr>
              <th className="pt-col-rank">#</th>
              <th>Scenario</th>
              <th>Hypothesis</th>
              <th>Theme</th>
              <th title="How closely actual outcomes matched what the model predicted before the RCT (R²)">Prediction accuracy</th>
              <th>Outcome</th>
              <th className="pt-col-date">Closed</th>
              <th className="pt-col-chev" aria-label="Expand"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const isOpen = expandedId === row.id;
              const oTone = OUTCOME[row.outcome]?.tone || "muted";
              const oLabel = OUTCOME[row.outcome]?.label || row.outcome;
              return (
                <Row
                  key={row.id}
                  row={row}
                  i={i}
                  isOpen={isOpen}
                  oTone={oTone}
                  oLabel={oLabel}
                  onToggle={() => setExpandedId(isOpen ? null : row.id)}
                  expandedContent={<ExperimentDetail row={row} />}
                />
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="portfolio-empty">No scenarios in this outcome bucket.</div>
        )}
      </div>
    </div>
  );
}

function Row({ row, i, isOpen, oTone, oLabel, onToggle, expandedContent }) {
  return (
    <>
      <tr className={"pt-row" + (isOpen ? " pt-row-open" : "")} onClick={onToggle}>
        <td className="pt-col-rank">{i + 1}</td>
        <td className="pt-policy">
          <span className="pt-policy-name">{row.name}</span>
          {row.live && <span className="pt-live-badge">YOUR RUN</span>}
        </td>
        <td className="pt-hyp">{row.hypothesis}</td>
        <td className="pt-theme">{row.themeName}</td>
        <td className="pt-hyp">{row.fidelity.toFixed(2)} R²</td>
        <td>
          <span className={"pt-stage pt-stage-" + oTone}>{oLabel}</span>
        </td>
        <td className="pt-col-date">{fmtDate(row.closedAt)}</td>
        <td className="pt-col-chev">
          <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={13} />
        </td>
      </tr>
      {isOpen && (
        <tr className="pt-row-expand">
          <td colSpan={8}>{expandedContent}</td>
        </tr>
      )}
    </>
  );
}

function FilterChip({ active, onClick, label, count, tone = "default" }) {
  return (
    <button
      className={"portfolio-chip" + (active ? " is-active" : "") + " portfolio-chip-" + tone}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="portfolio-chip-n">{count}</span>
    </button>
  );
}

function ExperimentDetail({ row }) {
  return (
    <div className="portfolio-expand">
      <div className="learn-fidelity">
        <div className="learn-fidelity-h">REALISED vs PREDICTED</div>
        <div className="learn-fidelity-grid">
          {row.fidelityRows.map((f, i) => (
            <div key={i} className="learn-fidelity-row">
              <span className="learn-fidelity-k">{f.k}</span>
              <span className="learn-fidelity-pred">pred {f.predicted}</span>
              <span className={"learn-fidelity-act" + (f.tone === "warn" ? " is-warn" : "") + (f.tone === "bad" ? " is-bad" : "")}>
                {f.actual}
              </span>
            </div>
          ))}
        </div>
      </div>

      {row.modelUpdates && row.modelUpdates.length > 0 && (
        <ModelUpdatesLedger updates={row.modelUpdates} pilotId={row.id} />
      )}

      <div className="portfolio-hist">
        <div className="portfolio-hist-row">
          <span className="portfolio-hist-k">Writeback ledger</span>
          <span className="portfolio-hist-v">
            <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              {row.writeback.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </span>
        </div>
        <div className="portfolio-hist-row">
          <span className="portfolio-hist-k">Hypothesis</span>
          <span className="portfolio-hist-v">{row.hypothesis}</span>
        </div>
        <div className="portfolio-hist-row">
          <span className="portfolio-hist-k">Theme</span>
          <span className="portfolio-hist-v">{row.themeName}</span>
        </div>
        <div className="portfolio-hist-row">
          <span className="portfolio-hist-k">Fidelity</span>
          <span className="portfolio-hist-v">{row.fidelity.toFixed(2)} R² (validation window)</span>
        </div>
      </div>
    </div>
  );
}

function countThemes(rows) {
  const set = new Set(rows.map((r) => r.themeName));
  return set.size;
}

/* ---------------------------------------------------------------------------
   SystemicCallouts — top-of-table strip showing patterns Twin auto-detected
   across multiple pilots. The "model is learning" story lives here.
--------------------------------------------------------------------------- */
function SystemicCallouts({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="learn-systemic">
      <header className="learn-systemic-h">
        <span className="learn-systemic-eyebrow">CROSS-PILOT · TWIN RECALIBRATIONS</span>
        <span className="learn-systemic-sub">Patterns mined from ≥2 pilots — drive theme-level prior updates, not just single-experiment fixes.</span>
      </header>
      <div className="learn-systemic-grid">
        {items.map((s) => (
          <article key={s.id} className={`learn-systemic-card learn-systemic-card-${s.tone}`}>
            <div className="learn-systemic-card-h">
              <span className={`learn-systemic-pill learn-systemic-pill-${s.tone}`}>
                {s.tone === "good" ? "UPSIDE MISS" : s.tone === "warn" ? "OVER-EST" : "UNDER-PRED"}
              </span>
              <span className="learn-systemic-theme">{s.theme}</span>
              <span className="learn-systemic-drift">{s.drift}</span>
            </div>
            <div className="learn-systemic-pattern">{s.pattern}</div>
            <div className="learn-systemic-action">{s.action}</div>
            <div className="learn-systemic-sources">
              <span className="learn-systemic-sources-k">Evidence</span>
              {s.sources.map((src) => (
                <span key={src} className="learn-systemic-src">{src}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   ModelUpdatesLedger — explicit before/after values that this pilot pushed
   back into the model. Sits below the realised-vs-predicted grid so the
   user can trace any fidelity-row drift → the prior update it triggered.
--------------------------------------------------------------------------- */
function ModelUpdatesLedger({ updates, pilotId }) {
  return (
    <div className="learn-modelup">
      <div className="learn-modelup-h">
        <span>MODEL UPDATES · WRITTEN BACK TO TWIN</span>
        <span className="learn-modelup-h-sub">Each row links a fidelity-grid KPI to the driver weight or threshold it shifted</span>
      </div>
      <table className="learn-modelup-table">
        <thead>
          <tr>
            <th>Driver / threshold</th>
            <th>Before</th>
            <th aria-label="direction"></th>
            <th>After</th>
            <th>Source KPI</th>
            <th>Rationale</th>
          </tr>
        </thead>
        <tbody>
          {updates.map((u, i) => (
            <tr key={i}>
              <td><code className="learn-modelup-driver">{u.driver}</code></td>
              <td className="learn-modelup-num">{String(u.before)}</td>
              <td className={`learn-modelup-dir learn-modelup-dir-${u.dir}`}>
                {u.dir === "up" ? "↑" : u.dir === "down" ? "↓" : u.dir === "new" ? "+" : "•"}
              </td>
              <td className="learn-modelup-num"><b>{String(u.after)}</b></td>
              <td className="learn-modelup-kpi">{u.sourceKpi}</td>
              <td className="learn-modelup-note">{u.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="learn-modelup-foot">
        Next sim run for this hypothesis will use the updated priors · <code>{pilotId}</code> tagged as anchor pilot.
      </div>
    </div>
  );
}
