/* ============================================================================
   pretty.js — single source of truth for display-layer translation.

   Three categories:
     1) TwinX brand vocabulary  → kept verbatim (Simulate, Optimize,
        Hypothesis, Policy, Twin, Champion, Challenger, Pre-registration,
        Promote, Estimand, Decision Gate, Governance Gate)
     2) Banking/compliance jargon → kept, spelled out on first use
        (NII / Net Interest Income, RCT / Live pilot, SR 11-7,
        Intent-to-Treat, fair-lending)
     3) Engineering jargon → translated to plain business language
        (Λ, π*, τ(x), CATE, mSPRT, e-value, CUPED, mde, ci_upper/ci_lower,
         underscored_keys, bootstrap iters, posterior draws)

   System identifiers (H-2026-04-12, twin_8a3f1c, decision-tx-0047) are
   demoted to small grey "ref: …" footnotes — never shown as headlines.

   Conventions:
     - All functions are pure; no JSX, no React imports.
     - Unknown keys fall back to a humanized version of the raw key so
       new data can't crash the UI.
   ========================================================================= */

/* ---------- 1. Hypotheses ----------------------------------------------- */
/* Per-id explicit names (preferred — these are stable, named ideas). */
const HYPOTHESIS_NAMES = {
  "H-2026-04-12": "Friday rent-day relief",
  "H-2026-05-01": "Friday-evening payment window",
  "H-2026-05-09": "Trusted Zelle senders",
  "H-2026-05-02": "Relationship-priced rate defense",
  "H-2026-05-10": "Rate-window response",
  "H-2026-04-18": "Equity-event primacy capture",
  "H-2026-05-08": "Light-touch transition response",
  "H-2026-05-03": "Sweep-to-yield introduction",
  "H-2026-05-11": "External-brokerage rail streamline",
  "H-2026-05-06": "Supplier-payment limit lift",
  "H-2026-05-04": "Mobile deposit experience fix",
  "H-2026-05-05": "Cross-border newcomer bundle",
  "H-2026-04-15": "First-ever wire safety hold",
  "H-2026-05-07": "Daytime wire scrutiny",
};

/* Business-friendly long sentences for each hypothesis (used in Step 1,
   Step 3, and tooltips). The engineering text in bundle.js stays intact
   so the data layer is unchanged. */
const HYPOTHESIS_SENTENCES = {
  "H-2026-04-12":
    "When TwinX recognizes a customer's recurring rent payment pattern (verified over at least 18 months), raise their transaction limit by 20% so Friday-evening rent doesn't get blocked.",
  "H-2026-05-01":
    "Relax transaction limits only during the Friday 4–8 PM window when gig-worker payouts cluster, leaving normal limits in place at all other times.",
  "H-2026-05-09":
    "Streamline person-to-person Zelle limits for customers with an established payment history with the recipient, so trusted transfers move through faster.",
  "H-2026-05-02":
    "Apply tiered relationship-priced rates for rate-sensitive affluent customers the moment we see them testing competitor accounts, to defend the balance.",
  "H-2026-05-10":
    "Open a time-boxed rate-defense window that triggers only when competitors widen their rate gap beyond a set threshold.",
  "H-2026-04-18":
    "On a detected life-event inflow (large deposit + first-ever brokerage transfer), open a 14-day primacy window with raised limits, RM hand-off, and a wealth-advisory introduction.",
  "H-2026-05-08":
    "Lighter-touch life-event response: raised limits and a digital wealth nudge, without the RM hand-off.",
  "H-2026-05-03":
    "Detect idle cash plus external sweep behaviour and introduce an automated sweep-to-yield product before balances leave for a competitor.",
  "H-2026-05-11":
    "Streamline external-brokerage transfer limits for stable multi-bank customers, so sweep flows stay in-house.",
  "H-2026-05-06":
    "Lift Zelle and ACH transaction ceilings for growing small businesses that repeatedly hit limits on verified recurring supplier payments.",
  "H-2026-05-04":
    "Fix the mobile check-deposit flow where new, mobile-first customers concentrate failed retries and complaints in the onboarding window.",
  "H-2026-05-05":
    "For new-to-country customers with established cross-border remittance corridors, introduce a next-best product bundle to deepen the relationship.",
  "H-2026-04-15":
    "When a long-tenured retiree attempts a first-ever high-value wire whose stated purpose matches known elder-financial-exploitation language, temporarily hold the wire and reach out to the customer's trusted contact.",
  "H-2026-05-07":
    "Apply heightened scrutiny to first-ever high-value wires during weekday business hours, when coercion calls tied to elder-financial-exploitation tend to cluster.",
};

/* Lifecycle tag → small business-friendly status badge. */
const HYP_LIFECYCLE = {
  cc_winner: { label: "Top performer in pilot", tone: "good" },
  simulated: { label: "Simulated only", tone: "neutral" },
  generated: { label: "Newly generated", tone: "neutral" },
};

export function prettyHypothesisName(hyp) {
  if (!hyp) return "—";
  if (HYPOTHESIS_NAMES[hyp.hypothesis_id]) return HYPOTHESIS_NAMES[hyp.hypothesis_id];
  // Fallback: derive from intervention.kind.
  const kind = hyp.intervention && hyp.intervention.kind;
  return prettyKind(kind);
}

export function prettyHypothesisSentence(hyp) {
  if (!hyp) return "—";
  if (HYPOTHESIS_SENTENCES[hyp.hypothesis_id]) return HYPOTHESIS_SENTENCES[hyp.hypothesis_id];
  // Fallback: use the raw description with light scrubbing.
  return scrubText(hyp.intervention && hyp.intervention.description);
}

export function prettyLifecycle(lc) {
  return HYP_LIFECYCLE[lc] || { label: humanize(lc), tone: "neutral" };
}

/* Fallback friendly name for intervention.kind. */
function prettyKind(kind) {
  const m = {
    ceiling_lift_on_pattern_match: "Pattern-based limit lift",
    coordinated_transition_response: "Life-event primacy response",
    tighten_novel_counterparty: "Novel-counterparty safety hold",
    time_of_day_modifier: "Time-of-day limit adjustment",
    amount_band_policy: "Tiered amount-band policy",
    rail_specific_policy: "Channel-specific limit policy",
  };
  return m[kind] || humanize(kind);
}

/* ---------- 2. Clusters ------------------------------------------------- */
const CLUSTER_NAMES = {
  cluster_gig_economy_high_velocity: "Gig-worker customers",
  cluster_mass_affluent_rate_sensitive: "Rate-sensitive mass-affluent customers",
  cluster_young_affluent_emergent: "Young-affluent customers in life transition",
  cluster_affluent_stable_multi_banker: "Stable affluent customers with multiple banks",
  cluster_small_business_seasonal: "Growing small-business customers",
  cluster_cold_start_new: "Newly opened, mobile-first customers",
  cluster_mono_product_migrant: "New-to-country single-product customers",
  cluster_retired_stable_low_velocity: "Long-tenured retired customers",
};

const CLUSTER_DESCRIPTIONS = {
  cluster_gig_economy_high_velocity:
    "Irregular multi-platform inflows with a Friday-evening payout cadence, strong recurring landlord rent patterns, and heavy person-to-person outbound activity.",
  cluster_mass_affluent_rate_sensitive:
    "High balances showing aggregator-login spikes and small probing transfers to competitor banks. Rate-elasticity concentrates in a thin sub-tier.",
  cluster_young_affluent_emergent:
    "Long-stable balances broken by a recent large equity-event inflow and first-ever brokerage transfers. High potential to capture as primary bank.",
  cluster_affluent_stable_multi_banker:
    "Stable high balances spread across multiple institutions, with idle cash and recurring sweeps to external brokerages.",
  cluster_small_business_seasonal:
    "Growing small-business cash flows that hit Zelle and ACH limits repeatedly, with seasonal peaks and recurring supplier-payment patterns.",
  cluster_cold_start_new:
    "Newly opened, mobile-first relationships with sparse history and elevated failed-retry signatures on mobile check deposits.",
  cluster_mono_product_migrant:
    "Single-product, thin-file new-to-country households with established cross-border remittance corridors.",
  cluster_retired_stable_low_velocity:
    "Long-tenured, low-velocity retirees with stable balances and elevated exposure to first-ever high-value wires matching known elder-financial-exploitation language.",
};

export function prettyClusterName(clus) {
  if (!clus) return "—";
  return CLUSTER_NAMES[clus.cluster_id] || clus.semantic_name || humanize(clus.cluster_id);
}

export function prettyClusterDescription(clus) {
  if (!clus) return "";
  return CLUSTER_DESCRIPTIONS[clus.cluster_id] || clus.defining_signature || "";
}

const DRIFT_LABEL = {
  stable: { label: "Behavior is steady", tone: "good" },
  rate_sensitive_drift: { label: "Rate-sensitivity drift detected", tone: "warn" },
  efe_variant: { label: "Fraud-variant drift detected", tone: "warn" },
};
export function prettyDriftState(d) {
  return DRIFT_LABEL[d] || { label: humanize(d), tone: "neutral" };
}

/* ---------- 3. Metric labels & formatters ------------------------------- */
const METRIC_LABELS = {
  nii_contribution: "Net Interest Income",
  friction_events_delta: "Blocked-payment reduction",
  contact_centre_cost_delta: "Contact-center cost",
  complaint_exposure: "Complaint risk",
  fraud_rate_delta: "Fraud-rate change",
  multi_product_attach_rate_delta: "Multi-product attach rate",
  primacy_capture_rate: "Primacy capture rate",
};

const METRIC_SHORT = {
  nii_contribution: "NII",
  friction_events_delta: "Friction",
  contact_centre_cost_delta: "Contact-center",
  complaint_exposure: "Complaints",
  fraud_rate_delta: "Fraud",
  multi_product_attach_rate_delta: "Attach",
  primacy_capture_rate: "Primacy",
};

export function prettyMetricLabel(mid) {
  return METRIC_LABELS[mid] || humanize(mid);
}
export function prettyMetricShort(mid) {
  return METRIC_SHORT[mid] || prettyMetricLabel(mid);
}

/* Money formatter for usd_cents → "$4.0M". */
function fmtUSDcents(c) {
  const d = c / 100;
  const a = Math.abs(d);
  const s = d < 0 ? "-" : "";
  if (a >= 1e9) return s + "$" + (a / 1e9).toFixed(a % 1e9 === 0 ? 0 : 1) + "B";
  if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(a % 1e6 === 0 ? 0 : 1) + "M";
  if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(0) + "K";
  return s + "$" + Math.round(a);
}
export function prettyMetricValue(mid, v, unit) {
  if (v == null) return "—";
  if (unit === "usd_cents") return fmtUSDcents(v);
  if (unit === "bps") return (v > 0 ? "+" : "") + v.toFixed(2) + " bps";
  if (unit === "pp") return (v > 0 ? "+" : "") + v.toFixed(1) + " pp";
  if (unit === "pct") return v.toFixed(1) + "%";
  return (v > 0 ? "+" : "") + Math.round(v).toLocaleString();
}

/* For predicted_outcome dicts on hypothesis cards.
   Source keys (in bundle): nii_contribution (cents), friction_events_delta (count),
   contact_centre_cost_delta (cents), complaint_exposure (count), fraud_rate_delta (bps),
   multi_product_attach_rate_delta (pp), primacy_capture_rate (pct). */
const OUTCOME_UNIT = {
  nii_contribution: "usd_cents",
  friction_events_delta: "count",
  contact_centre_cost_delta: "usd_cents",
  complaint_exposure: "count",
  fraud_rate_delta: "bps",
  multi_product_attach_rate_delta: "pp",
  primacy_capture_rate: "pct",
};

/* Returns a short business sentence summarizing a predicted_outcome dict.
   E.g. "+$4.0M Net Interest Income · 8,400 fewer blocked payments · 120 fewer complaints". */
export function prettyPredictedOutcome(outcome) {
  if (!outcome) return "";
  const parts = [];
  const order = [
    "nii_contribution",
    "friction_events_delta",
    "complaint_exposure",
    "fraud_rate_delta",
    "contact_centre_cost_delta",
    "multi_product_attach_rate_delta",
    "primacy_capture_rate",
  ];
  for (const k of order) {
    if (outcome[k] == null) continue;
    const v = outcome[k];
    const unit = OUTCOME_UNIT[k] || "count";
    parts.push(outcomePhrase(k, v, unit));
  }
  return parts.join(" · ");
}
function outcomePhrase(key, v, unit) {
  const val = prettyMetricValue(key, v, unit);
  if (key === "nii_contribution") return `${val} Net Interest Income`;
  if (key === "friction_events_delta") return `${Math.abs(v).toLocaleString()} fewer blocked payments`;
  if (key === "complaint_exposure") {
    if (v < 0) return `${Math.abs(v).toLocaleString()} fewer complaints`;
    return `+${v.toLocaleString()} complaint risk`;
  }
  if (key === "fraud_rate_delta") {
    if (v < 0) return `fraud down ${Math.abs(v).toFixed(1)} bps`;
    return `fraud up ${v.toFixed(1)} bps`;
  }
  if (key === "contact_centre_cost_delta") return `${val} contact-center`;
  if (key === "multi_product_attach_rate_delta") return `${val} multi-product attach`;
  if (key === "primacy_capture_rate") return `${v.toFixed(0)}% primacy capture`;
  return `${prettyMetricLabel(key)} ${val}`;
}

/* ---------- 4. Lever labels --------------------------------------------- */
const LEVER_LABELS = {
  ceiling_lift_pct: "Transaction-limit lift",
  min_recurrence_months: "Months of pattern history required",
  detection_window_months: "Look-back window for pattern detection",
  primacy_window_days: "Primacy capture window",
  first_ever_threshold_cents: "First-ever wire threshold",
  threshold_relax_pct: "Limit relaxation",
  __coverage: "Customers reached",
  __topband_bps: "Top-tier rate",
};
export function prettyLeverLabel(lever) {
  if (!lever) return "";
  return LEVER_LABELS[lever.key] || lever.label || humanize(lever.key);
}

/* ---------- 5. Pipeline stage names + captions -------------------------- */
const STAGE_INFO = {
  prep:  { name: "Data & Goals",            cap: "Customer features and the outcome TwinX is solving for" },
  model: { name: "Model setup",             cap: "Models calibrated, falsification checks passed" },
  sim:   { name: "Test & optimize policy",  cap: "Recommend, simulate and optimize the next policy" },
  gate:  { name: "Approval review",         cap: "Confidence, downside and routing decision" },
  gov:   { name: "Compliance review",       cap: "Fair-lending audit and SR 11-7 model risk sign-off" },
  rct:   { name: "Live pilot",              cap: "Randomized treatment vs control · monitored daily" },
  learn: { name: "Measure results",         cap: "Estimate, correct and write back to the twin" },
};
export function prettyStageName(loop) {
  return (STAGE_INFO[loop] && STAGE_INFO[loop].name) || humanize(loop);
}
export function prettyStageCap(loop) {
  return (STAGE_INFO[loop] && STAGE_INFO[loop].cap) || "";
}

/* ---------- 6. Run console — phrase replacements ------------------------ */
/* Friendly equivalents for the technical span keys used in pushLog calls. */
export const CONSOLE_TAG = {
  feature_store: "Customer data",
  cate_drifter: "TwinX classifier",
  rate_board: "Competitor rate gap",
  sim_engine: "TwinX simulator",
  guardrail: "Guardrail check",
  ach_monitor: "Transfer monitor",
  aggregator_scan: "Aggregator scan",
  registry: "Model registry",
  fair_audit: "Fairness audit",
  governance: "Governance",
  remediation: "Remediation",
  optimizer: "TwinX optimizer",
  workbench: "Workbench",
  ui: "UI",
  drop: "Drop",
  "re-audit": "Re-audit",
  resolve: "TwinX",
  "exp-2026-0047": "Live pilot",
  gate: "Governance gate",
};
export function prettyConsoleTag(raw) {
  return CONSOLE_TAG[raw] || humanize(raw);
}

/* ---------- 7. Ref-id detection / formatting ---------------------------- */
const REF_ID_PATTERN = /^(H-\d{4}|decision-tx-|prereg-|twin_|est-\d{4}-|exp-\d{4}-|mr-\d{4}-|est-USB-|exp-USB-|mr-USB-|fair-audit-|roll-|measure-|MRM-).*/;
export function looksLikeRefId(s) {
  return typeof s === "string" && REF_ID_PATTERN.test(s);
}
export function formatRef(s) {
  return `ref: ${s}`;
}

/* ---------- 8. Goal helpers (Autopilot) --------------------------------- */
export const AUTOPILOT_PROMPTS = [
  "Grow Net Interest Income without raising customer complaints",
  "Reduce blocked-payment friction for active customers",
  "Defend deposit balances against competitor rate moves",
  "Catch first-ever wire fraud without slowing legitimate transfers",
];

/* ---------- 9. Lightweight scrubbers ------------------------------------ */
function scrubText(s) {
  if (!s) return "";
  let t = String(s);
  // Soften the most common technical phrases that leak into descriptions.
  t = t.replace(/\bceiling[- ]lift\b/gi, "transaction-limit lift");
  t = t.replace(/\bstep[- ]up\b/gi, "limit");
  t = t.replace(/\brail\b/gi, "channel");
  t = t.replace(/\bbeneficiary\b/gi, "recipient");
  t = t.replace(/\bbps\b/gi, "basis points");
  return t;
}
function humanize(s) {
  if (s == null) return "";
  return String(s)
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
