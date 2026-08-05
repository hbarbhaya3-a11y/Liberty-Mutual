/* ============================================================================
   RetentionSimulateView — Deposit Retention Simulate workbench.

   Forked from SimulateWorkspace.jsx structure but scoped to retention:
     - 5 lever sections (COHORT / ELIGIBILITY / OFFER / COMMUNICATIONS /
       PRIMACY RE-ANCHOR FOLLOW-ON)
     - Single-column lever layout (mirroring gig's post-redesign)
     - Sticky config strip with Fair-lending margin in the central pill slot
     - PriorAnchorPill reads MOCK_EXPERIMENTS (spread-extended with
       RETENTION_EXPERIMENTS in LearnWorkspace) for hypothesis anchors
     - Results: verdict + 3 ProofKpi cards + 4 guardrail pills + 2×2 tiles
     - Stage for Deploy → intermezzo → navWorkspace("deploy")
     - Autopilot cinematic: T+1500 auto-run, T+3500 auto-stage

   What-If only — the If-What optimizer branch is gig-specific and not
   forked here (can be added later if retention needs the Pareto sweep).
   ========================================================================= */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "@/state/AppShell";
import SimulationLoader from "@/components/loaders/SimulationLoader";
import Icon from "@/components/Icon";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import SegmentedResults from "@/components/SegmentedResults";
import { RETENTION_SEGMENTS, deriveSegments, PRODUCT_MARKET, RETENTION_PRODUCT_LABEL, RETENTION_CHANNEL_LABEL } from "@/data/segmentModels";

/* Cohort sizes (mirror the CUSTOMER cards) — the engine splits these across the
   micro-segments and filters by what the user selected. */
const RET_SEG_MODEL = {
  segments: RETENTION_SEGMENTS,
  cohortCounts: { full: 550849, "rate-sensitive": 161000, "operating-decliner": 132000, "high-value": 22000, "long-tenured": 59000, "multi-product": 88000 },
  heldBackLabel: "Will-stay & already-gone",
  heldBackShare: 0.06,
  // Insurance-context label overrides so the recommendation table speaks our
  // language (rate caps / Comparion agents) instead of the banking defaults.
  productLabels: RETENTION_PRODUCT_LABEL,
  channelLabels: RETENTION_CHANNEL_LABEL,
};
import RangeWithBubble from "@/components/RangeWithBubble";
import DualRange from "@/components/DualRange";
import ConversationalCohortBuilder from "@/components/ConversationalCohortBuilder";
import { MOCK_EXPERIMENTS } from "@/workspaces/LearnWorkspace";
import RetentionIfWhatView from "@/workspaces/RetentionIfWhatView";
import {
  RETENTION_HYPOTHESIS_ID,
  RETENTION_HYPOTHESIS_TITLE,
  RETENTION_CALIBRATION,
} from "@/data/retentionConfig";

const PAGE_SUBTITLE = RETENTION_HYPOTHESIS_TITLE;

/* Twin's recommended retention levers — autopilot anchor + reset target.
   4 levers, prefilled to test Strategy A as written on the signal card.

   What the policy IS (these are levers):
     - Min household LTV to qualify · balance decline trigger
     - Offer rate ceiling · offer product
     - Delivery channel

   What goes elsewhere:
     - Pilot duration / holdout % / auto-rollback → Deploy's RCT setup
       (these are measurement decisions made when launching the test,
       not part of the policy being tested)
     - RM capacity, frequency, tone → operational/communications detail */
const RECOMMENDED = {
  minBalanceK:        25,
  offerCeilingBps:    40,
  offerTerm:          "cd_12mo",
  channels:           ["app", "email", "banker"],   // multi-select
  bankingServices:    [],                            // COVERAGE levers · Strategy A default off; Strategy B turns on
  bundles:            [],                            // BUNDLE levers · cross-line contingent-pricing plays
  multiTouch:         true,                          // TIMING · multi-touch sequencing per Customer Twin
  noticeDays:         [45],                           // TIMING · renewal-notice lead(s) — multi-select + custom
};

/* Renewal-notice lead presets offered on the TIMING lever. Users can also add a
   custom lead. Each micro-segment picks its preferred lead from the selected set
   (see RETENTION_SEGMENTS.noticeDays + deriveSegments). */
const NOTICE_DAY_PRESETS = [35, 45, 60];

/* Representative scalar lead for the outcome math (the simulator scores a single
   horizon). 45d is the calibrated sweet spot, so prefer it when selected; else
   fall back to the average of the selected leads. */
function primaryNoticeDay(days) {
  const list = (days && days.length) ? days : [45];
  if (list.includes(45)) return 45;
  return Math.round(list.reduce((a, d) => a + d, 0) / list.length);
}

/* Default per-product offers (bps over each product's OWN market). Blended uplift
   equals RECOMMENDED.offerCeilingBps so the retention outcome math stays anchored. */
const RECOMMENDED_OFFERS = { cd_12mo: 45, cd_6mo: 35 };

/* Dollar-discount equivalent of a bps offer on the ~$1,650 avg premium,
   rounded to $5. Every offer except the capped renewal rate is shown to the
   customer as a dollar discount rather than a rate. */
const dollarOff = (bps) => Math.round(1650 * (Number(bps) || 0) / 1000 / 5) * 5;

/* Compact number stepper for "N years or more" threshold levers (lock term,
   loyalty tenure) — clearer than a slider for a single integer threshold. */
function YearsStepper({ value, min, max, onChange, disabled }) {
  const clamp = (v) => Math.max(min, Math.min(max, Math.round(Number(v) || min)));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="number" min={min} max={max} step={1} value={value} disabled={disabled}
        onChange={(e) => onChange(clamp(e.target.value))}
        style={{ width: 66, padding: "6px 9px", borderRadius: 6, border: "1px solid var(--hair)", background: "var(--panel, #fff)", color: "var(--ink-1)", fontWeight: 700, fontSize: 13 }} />
      <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>years or more</span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Value-added retention services Liberty can add in lieu of (or alongside) a
   priced offer. Each is an actual offering — not a behavioural target. Strategy
   B (Re-engage Before Shopping) is anchored on this lever; Strategy A can layer
   them on top of a capped-rate + retention offer.
---------------------------------------------------------------------------- */
/* COVERAGE levers — rebalance coverage, premium-tier restructuring, value
   add-ons (the "COVERAGE" category in the simulation-lever blueprint). Held
   as the `bankingServices` state for mechanical fork-compatibility. */
const BANKING_SERVICES = [
  { id: "dd_switch", label: "Rebalance coverage",            sub: "Right-size limits / deductibles to the risk without dropping core protection" },
  { id: "bill_pay",  label: "Premium-tier restructuring",   sub: "Move to a matched tier with equivalent core coverage at a better price" },
  { id: "auto_save", label: "Value add-ons",                sub: "Roadside, rental or accident-forgiveness at no / low cost" },
  { id: "zelle",     label: "Telematics safety credit (RightTrack)", sub: "Usage-based safe-driver credit offered at renewal" },
];

/* BUNDLE levers — cross-line contingent-pricing plays (the "BUNDLE" category
   in the blueprint). Multi-select; each drives bundle penetration. */
const BUNDLE_OPTIONS = [
  { id: "auto_home",    label: "Auto → Home",          sub: "Home quote pre-filled from household data · contingent bundle discount" },
  { id: "auto_life",    label: "Auto → Life (Ethos)",  sub: "Life offer at a life-event moment via the Ethos partnership" },
  { id: "renters_auto", label: "Renters → Auto",       sub: "Auto quote for renters with a vehicle in the household · contingent pricing" },
];

/* ----------------------------------------------------------------------------
   Offer options · radio cards, single-select. (ids retained for sim math.)
---------------------------------------------------------------------------- */
const OFFER_PRODUCTS = [
  { id: "cd_6mo",         label: "Capped renewal increase", sub: "Cap how much the renewal rises · no cash discount · set the cap range", factor: 0.92 },
  { id: "cd_12mo",        label: "Premium discount",        sub: "Premium credit / discount off the renewal · set the discount range",   factor: 1.00 },
  { id: "cd_trade_up_24", label: "Multi-year rate lock",    sub: "Locks rate · customer keeps it if market rises · set the lock term",   factor: 1.04 },
  { id: "elite_mma",      label: "Deductible-adjusted rate", sub: "Higher deductible offsets premium · set the deductible %",            factor: 0.87 },
  { id: "smart_savings",  label: "Loyalty / tenure discount", sub: "Tenure-based discount · set the relationship range",                 factor: 0.94 },
];

/* ----------------------------------------------------------------------------
   Delivery channels · multi-select checkboxes.
---------------------------------------------------------------------------- */
const CHANNEL_OPTIONS = [
  { id: "app",     label: "App / portal notification" },
  { id: "email",   label: "Email" },
  { id: "mail",    label: "Direct mail" },
  { id: "banker",  label: "Comparion agent call" },
];

/* Pilot-design defaults used at staging time (Deploy will own these
   downstream; here they just produce sensible simulation results). */
const PILOT_DEFAULTS = {
  pilotDuration: 8,
  holdoutPct:    20,
  rollbackOn:    true,
};

/* ----------------------------------------------------------------------------
   simulateOutcomes — retention lever → outcome chain.

   Anchors at recommended defaults (per RETENTION_CALIBRATION):
     - cohortTotal = 550,849 at-risk auto renewals (signal 1, run across all)
     - treatmentN/controlN = 440,679 / 110,170  (80% / 20% holdout)
     - NWP impact (8-wk) = $138.2M · CLV impact = $345M · ~83,700 policies retained
     - Lapse: 30% (BAU) → 11% (with policy) → −19pp reduction
     - Spread protected = $3.45M / 8 wk · offer cost = $60K · net = $106K
     - Fair-lending margin = 0.93 (held constant by loyalty gate)
---------------------------------------------------------------------------- */
function simulateOutcomes(opts) {
  const C = RETENTION_CALIBRATION;
  const {
    minBalanceK, offerCeilingBps, offerTerm, termFactor: termFactorOpt,
    channels, holdoutPct, pilotDuration,
    cohortPresets,
    bankingServices = [], triggerWindowDays = 60,
    bundles = [], multiTouch = false,
  } = opts;

  /* Multi-select cohort: sum the bases of the selected cohorts. Picking
     "Full cohort" supersedes the others since it includes everyone. */
  const COHORT_COUNTS = {
    "full":               C.cohortTotal,
    "rate-sensitive":     C.eligibleAfterGate,
    "operating-decliner": C.operatingDeclinerN,
    "high-value":         22000,
    "long-tenured":       59000,
    "multi-product":      88000,
  };
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  const presetBase = list.includes("full")
    ? C.cohortTotal
    : list.reduce((s, id) => s + (COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;

  /* Eligibility scaling — higher min-balance threshold cuts the eligible
     pool. Cohort selection already encodes the drift signals upstream. */
  const balanceFactor = Math.max(0.5, 1 - (minBalanceK - RECOMMENDED.minBalanceK) * 0.015);
  const eligibleN = Math.round(presetBase * Math.max(0.4, Math.min(1.4, balanceFactor)));

  /* Offer-term factor: pulled from the OFFER_PRODUCTS table so adding new
     products doesn't require math updates here. */
  // Blended term factor (Product × Offer) when supplied; else the single product's factor.
  const termFactor = termFactorOpt != null ? termFactorOpt
    : (OFFER_PRODUCTS.find((p) => p.id === offerTerm) || OFFER_PRODUCTS[1]).factor;

  /* Treatment / control split. */
  const treatmentN = Math.round(eligibleN * (1 - holdoutPct / 100));
  const controlN   = eligibleN - treatmentN;

  /* Channel reach factor — sum of per-channel weights, capped at 1.05 for
     full multi-channel coverage. Banker carries the highest per-customer
     lift; app+email scale broadly. */
  const channelWeights = { app: 0.30, email: 0.25, mail: 0.20, banker: 0.45 };
  const channelSum = (channels || []).reduce((s, c) => s + (channelWeights[c] || 0), 0);
  const channelFactor = Math.max(0.45, Math.min(1.05, channelSum / 1.0));

  /* Offer ceiling scaling — retained deposits scale roughly linearly with
     offer attractiveness (relative to recommended 40bps). */
  const ceilingFactor = offerCeilingBps / RECOMMENDED.offerCeilingBps;

  /* Coverage-lever factor — each COVERAGE lever (rebalance / premium-tier /
     add-on / telematics) raises retention, with diminishing returns past 3. */
  const servicesFactor = 1 + Math.min(0.6, bankingServices.length * 0.18);

  /* Bundle factor — bundled households retain materially better (7.0-yr vs
     5.5-yr tenure); each BUNDLE play compounds retention. */
  const bundleFactor = 1 + Math.min(0.12, bundles.length * 0.05);

  /* Timing factor — the right renewal-notice lead plus multi-touch sequencing
     lifts save-rate. 45d notice is the sweet spot for this cohort. */
  const triggerFactor = 1 - Math.abs(triggerWindowDays - 45) / 120;
  const timingFactor = triggerFactor * (multiTouch ? 1.03 : 1.0);

  /* Per-treated retention math — calibrated to hit anchor at defaults. */
  const retainedM = C.retainedDepositsAnnualM
                  * (treatmentN / C.treatmentN)
                  * channelFactor
                  * Math.min(1.3, ceilingFactor)
                  * termFactor
                  * servicesFactor
                  * bundleFactor
                  * timingFactor;

  /* Runoff reduction scales with offer strength + channel reach. */
  const runoffWithPolicy = Math.max(
    C.runoffBau - C.runoffReductionPp * channelFactor * Math.min(1.2, ceilingFactor),
    0.030
  );
  const runoffReductionPp = C.runoffBau - runoffWithPolicy;

  /* Spread protected scales linearly with retained deposits. */
  const spreadProtectedK = C.spreadProtectedK * (retainedM / C.retainedDepositsAnnualM);

  /* Offer cost scales with offer ceiling. */
  const offerCostM = C.offerCostM * ceilingFactor;
  const netAnnualisedK = Math.round((spreadProtectedK * 1000 - offerCostM * 1e6) / 1000);

  /* Fair-lending margin held constant by the loyalty gate (0.70 fixed). */
  const udaapMargin = C.udaapMargin;

  /* Customer fatigue scales with treatment size + offer aggressiveness. */
  const complaintsDelta = Math.round(
    C.complaintsDelta * (treatmentN / C.treatmentN) * Math.min(1.4, ceilingFactor)
  );

  /* Bundle penetration — secondary mechanism with a 3-week lag.
     Strategy A v1 RCT overshot prediction (+14pp vs +6pp predicted), which
     drives the prior-anchor in this v2 simulation. Baseline +6pp; each
     enrolled banking service adds ~2pp because the service is the
     intervention this KPI actually measures. */
  const ddRecoveryPp = Math.round(6 + bankingServices.length * 1.5 + bundles.length * 3 + (multiTouch ? 1 : 0));

  /* Profitability gates */
  const profitabilityOk = netAnnualisedK > 0;
  const udaapOk = udaapMargin >= C.udaapFloor;

  return {
    eligibleN, treatmentN, controlN,
    retainedM, runoffBau: C.runoffBau, runoffWithPolicy, runoffReductionPp,
    spreadProtectedK, offerCostM, netAnnualisedK,
    udaapMargin, udaapOk, profitabilityOk,
    complaintsDelta, ddRecoveryPp,
    pilotDuration,
    cohortTotal: C.cohortTotal,
  };
}

/* ----------------------------------------------------------------------------
   PriorAnchorPill — same shape as gig's. Reads MOCK_EXPERIMENTS (which is
   spread-extended with RETENTION_EXPERIMENTS in LearnWorkspace.jsx) and
   finds the most recent pilot whose priorAnchorFor includes the current
   hypothesis. Surfaces the headline model update.
---------------------------------------------------------------------------- */
function PriorAnchorPill({ hypothesisId }) {
  if (!hypothesisId) return null;
  const anchor = MOCK_EXPERIMENTS
    .filter((e) => e.priorAnchorFor?.includes(hypothesisId) && e.modelUpdates?.length > 0)
    .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))[0];
  if (!anchor) return null;
  const headline = anchor.modelUpdates.find((u) => u.dir !== "flag") || anchor.modelUpdates[0];
  return (
    <div className="sim-prior-anchor">
      <span className="sim-prior-anchor-pill">PRIOR · ANCHORED</span>
      <span className="sim-prior-anchor-text">
        Using updated priors from <b>{anchor.id}</b> · <code>{headline.driver}</code>{" "}
        {headline.dir === "flag"
          ? <> = <b>{String(headline.after)}</b></>
          : <> {String(headline.before)} → <b>{String(headline.after)}</b> ({headline.dir === "up" ? "↑" : headline.dir === "down" ? "↓" : "+"})</>}
      </span>
      <span className="sim-prior-anchor-sub">
        +{anchor.modelUpdates.length - 1} other update{anchor.modelUpdates.length - 1 === 1 ? "" : "s"} from this pilot · fidelity {anchor.fidelity.toFixed(2)} R²
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Verdict — retention-specific verdict callout.
---------------------------------------------------------------------------- */
function computeVerdict({ retainedOk, runoffOk, udaapOk, profitabilityOk }) {
  if (retainedOk && runoffOk && udaapOk && profitabilityOk) return "proven";
  if (retainedOk && runoffOk && (!udaapOk || !profitabilityOk)) return "mixed";
  return "disproven";
}

function Verdict({ verdict }) {
  if (verdict === "proven") {
    return (
      <div className="verdict-callout verdict-proven">
        <span className="verdict-glyph"><Icon name="check" size={20} strokeWidth={2.5} /></span>
        <div className="verdict-body">
          <div className="verdict-title">SIMULATION SUPPORTS HYPOTHESIS</div>
          <div className="verdict-sub">All retention KPIs hit · Fair-lending margin held · profitability guardrail clear</div>
        </div>
      </div>
    );
  }
  if (verdict === "mixed") {
    return (
      <div className="verdict-callout verdict-mixed">
        <span className="verdict-glyph"><Icon name="warn" size={20} /></span>
        <div className="verdict-body">
          <div className="verdict-title">PARTIAL SUPPORT · GUARDRAIL AT RISK</div>
          <div className="verdict-sub">NWP protected in range · Fair-lending margin held · profitability guardrail uncertain</div>
        </div>
      </div>
    );
  }
  return (
    <div className="verdict-callout verdict-disproven">
      <span className="verdict-glyph"><Icon name="x" size={20} strokeWidth={2.5} /></span>
      <div className="verdict-body">
        <div className="verdict-title">SIMULATION DOES NOT SUPPORT HYPOTHESIS</div>
        <div className="verdict-sub">NWP protected below CI · or UDAAP basis insufficient at this offer ceiling</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   LeverRow — mirrors gig's structure verbatim (uses same CSS).
---------------------------------------------------------------------------- */
function LeverRow({ label, caption, value, offDefault = false, children }) {
  return (
    <div className="lever-row">
      <div className="lever-head">
        <span className="lever-name">{label}</span>
        {value != null && (
          <span className={"lever-value" + (offDefault ? " off-default" : "")}>{value}</span>
        )}
      </div>
      {caption && <div className="lever-caption">{caption}</div>}
      <div className="lever-control">{children}</div>
    </div>
  );
}

function RangeScale({ marks }) {
  return (
    <div className="range-scale">{marks.map((m) => <span key={m}>{m}</span>)}</div>
  );
}

/* ----------------------------------------------------------------------------
   ProofKpi — mirrors gig's structure verbatim so .proof-kpi* CSS applies.
   Hit: "ok" | "warn" | "miss". DeltaTone: "good" | "warn" | "bad".
---------------------------------------------------------------------------- */
function ProofKpi({ label, value, valueCap, baseline, baselineCap, delta, deltaTone = "good", kind = "absolute", hit = "ok" }) {
  const chipIcon = hit === "ok" ? "check" : hit === "warn" ? "warn" : "x";
  const chipText = hit === "ok" ? "hit" : hit === "warn" ? "at risk" : "missed";
  return (
    <div className={"proof-kpi proof-kpi-" + hit}>
      <div className="proof-kpi-h">
        <span className="proof-kpi-l">{label}</span>
        <span className="proof-kpi-chip">
          <Icon name={chipIcon} size={10} strokeWidth={2.5} />
          {chipText}
        </span>
      </div>
      <div className="proof-kpi-v-row">
        <span className="proof-kpi-v">{value}</span>
        {valueCap && <span className="proof-kpi-v-cap">{valueCap}</span>}
        {kind !== "incremental" && delta && (
          <span className={"proof-kpi-delta-chip proof-kpi-delta-chip-" + deltaTone}>{delta}</span>
        )}
      </div>
      <div className="proof-kpi-compare">
        <span className="proof-kpi-compare-k">baseline</span>
        <span className="proof-kpi-compare-v">{baseline}</span>
        {baselineCap && <span className="proof-kpi-compare-cap">· {baselineCap}</span>}
      </div>
    </div>
  );
}

/* ============================================================================
   RetentionSimulateView
   ========================================================================= */
export default function RetentionSimulateView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setTuneMode, explorationMode,
    recordDecisionTrace, setIntermezzo,
  } = useAppShell();

  // If-What path: dispatch to the goal-driven optimizer view. The What-If
  // lever workbench below is for free-form lever configuration; If-What
  // asks "given this goal, what's the best policy in these ranges?"
  if (explorationMode === "ifwhat") {
    return <RetentionIfWhatView />;
  }

  // Mode state machine
  const [mode, setMode] = useState("config");          // 'config' | 'running' | 'results'
  const isAutopilot = tuneMode === "autopilot";

  // Hypothesis id — fall back to the recommended retention hypothesis if
  // nothing was seeded.
  const activeHypId = selectedHypothesisId || RETENTION_HYPOTHESIS_ID;

  // ---- Lever state ----
  const [minBalanceK,       setMinBalanceK]       = useState(RECOMMENDED.minBalanceK);
  // Product × Offer — per-product map { productId: bps-over-its-market }; presence = selected.
  const [productOffers,     setProductOffers]     = useState(RECOMMENDED_OFFERS);
  const [channels,          setChannels]          = useState(RECOMMENDED.channels);
  const [cohortPresets,     setCohortPresets]     = useState(["rate-sensitive"]);
  const [bankingServices,   setBankingServices]   = useState(RECOMMENDED.bankingServices);
  const [bundleOffers,      setBundleOffers]      = useState({ auto_home: [2, 5] });
  const [bundles,           setBundles]           = useState(RECOMMENDED.bundles);
  const [multiTouch,        setMultiTouch]        = useState(RECOMMENDED.multiTouch);
  const [noticeDays,        setNoticeDays]        = useState(RECOMMENDED.noticeDays);
  const [customNotice,      setCustomNotice]      = useState("");
  // Pricing-lever qualifiers: the loyalty tier's relationship (tenure) band and
  // the deductible-adjusted offer's deductible % against coverage.
  const [loyaltyTenure,     setLoyaltyTenure]     = useState([3, 30]);   // min years of relationship (threshold + open cap)
  const [deductiblePct,     setDeductiblePct]     = useState(10);        // % of coverage set as deductible
  const [lockYears,         setLockYears]         = useState(2);         // multi-year rate-lock term (years)

  const toggleBundleOffer = (id) => setBundleOffers((cur) => {
    if (cur[id]) {
      const next = { ...cur }; delete next[id]; return next;
    }
    return { ...cur, [id]: [2, 5] };
  });
  const setBundleRange = (id, low, high) => setBundleOffers((cur) => ({ ...cur, [id]: [low, high] }));
  // Representative scalar the outcome math scores against (single horizon).
  const triggerWindowDays = primaryNoticeDay(noticeDays);
  const toggleNotice = (d) => setNoticeDays((cur) =>
    cur.includes(d) ? (cur.length === 1 ? cur : cur.filter((x) => x !== d)) : [...cur, d].sort((a, b) => a - b)
  );
  const addCustomNotice = () => {
    const d = parseInt(customNotice, 10);
    if (!Number.isFinite(d) || d < 7 || d > 120) return;
    setNoticeDays((cur) => cur.includes(d) ? cur : [...cur, d].sort((a, b) => a - b));
    setCustomNotice("");
  };
  // Campaign duration — own section above the Run button. Default 8wk
  // because the result tiles are calibrated against an 8-wk anchor.
  const [simWeeks,          setSimWeeks]          = useState(PILOT_DEFAULTS.pilotDuration);

  const toggleService = (id) => setBankingServices((cur) =>
    cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
  );
  const toggleBundle = (id) => setBundles((cur) =>
    cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
  );

  const toggleCohort = (id) => setCohortPresets((cur) => {
    if (id === "full") return ["full"];                                          // full cohort is exclusive
    const next = cur.includes(id) ? cur.filter((p) => p !== id) : [...cur.filter((p) => p !== "full"), id];
    return next.length ? next : ["full"];                                        // never leave it empty
  });

  // ---- Custom segment builder state (extra rule-defined group) ----
  const [customOpen,  setCustomOpen]  = useState(false);
  const [customRules, setCustomRules] = useState([]);
  const addRule    = () => setCustomRules((cur) => [...cur, { feature: "balance_min", op: "gte", value: 25 }]);
  const updateRule = (i, patch) => setCustomRules((cur) => cur.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const removeRule = (i) => setCustomRules((cur) => cur.filter((_, idx) => idx !== i));

  const toggleChannel = (id) => setChannels((cur) =>
    cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((c) => c !== id)) : [...cur, id]
  );

  // ---- Off-default detection (for amber value-badge highlight) ----
  const off = (k, v) => v !== RECOMMENDED[k];
  const channelsOffDefault = channels.length !== RECOMMENDED.channels.length ||
    channels.some((c) => !RECOMMENDED.channels.includes(c));

  // ---- Product × Offer derived values ----
  const productFactor = (id) => (OFFER_PRODUCTS.find((p) => p.id === id) || {}).factor || 1;
  const selectedProductIds = Object.keys(productOffers);
  const blendedOfferBps = selectedProductIds.length
    ? Math.round(selectedProductIds.reduce((a, id) => a + productOffers[id], 0) / selectedProductIds.length)
    : 0;
  const DEFAULT_TERM_FACTOR = Object.keys(RECOMMENDED_OFFERS).reduce((a, id) => a + productFactor(id), 0)
    / Object.keys(RECOMMENDED_OFFERS).length;
  const blendedTermFactor = selectedProductIds.length
    ? (selectedProductIds.reduce((a, id) => a + productFactor(id), 0) / selectedProductIds.length) / DEFAULT_TERM_FACTOR
    : 1;
  const offerCeilingBps = blendedOfferBps;
  const offerTerm = selectedProductIds[0] || RECOMMENDED.offerTerm;
  const productsOffDefault = JSON.stringify(productOffers) !== JSON.stringify(RECOMMENDED_OFFERS);
  const toggleProduct = (id) => setProductOffers((cur) => {
    if (cur[id] != null) {
      const next = { ...cur }; delete next[id];
      return Object.keys(next).length ? next : cur;
    }
    return { ...cur, [id]: RECOMMENDED_OFFERS[id] != null ? RECOMMENDED_OFFERS[id] : 30 };
  });
  const setProductOffer = (id, bps) => setProductOffers((cur) => ({ ...cur, [id]: bps }));

  // ---- Live outcomes (config + results both read this) ----
  // Pilot params come from PILOT_DEFAULTS — they're not levers in this
  // workspace; Deploy owns them downstream when configuring the RCT.
  const outcomes = useMemo(() => simulateOutcomes({
    minBalanceK, offerCeilingBps, offerTerm, termFactor: blendedTermFactor, channels,
    holdoutPct:    PILOT_DEFAULTS.holdoutPct,
    pilotDuration: PILOT_DEFAULTS.pilotDuration,
    cohortPresets,
    bankingServices, triggerWindowDays, bundles, multiTouch,
  }), [minBalanceK, offerCeilingBps, offerTerm, blendedTermFactor,
       channels, cohortPresets,
       bankingServices, triggerWindowDays, noticeDays, bundles, multiTouch]);

  // ---- Results snapshot (taken on Run, frozen until next Run) ----
  const [results, setResults] = useState(null);

  // ---- Run / Loader / Stage handlers ----
  const onRun = useCallback(() => {
    setMode("running");
    pushAgentEvent({
      kind: "info",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot · running retention simulation"
        : "What-If retention simulation kicked off · 8-week horizon",
    });
  }, [pushAgentEvent, tuneMode]);

  const onLoaderComplete = useCallback(() => {
    const o = outcomes;
    const verdict = computeVerdict({
      retainedOk:      o.retainedM >= 8,
      runoffOk:        o.runoffReductionPp >= 0.013,
      udaapOk:         o.udaapOk,
      profitabilityOk: o.profitabilityOk,
    });
    setResults({
      verdict,
      playKey: Date.now(),
      outcomes: o,
      lever: { cohortPresets, offerCeilingBps, channels, minBalanceK, offerTerm, productOffers, bankingServices, bundles, multiTouch, triggerWindowDays, noticeDays, loyaltyTenure, deductiblePct, lockYears },
    });
    setMode("results");
    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: `What-If converged · +$${o.retainedM.toFixed(1)}M retained · −${(o.runoffReductionPp * 100).toFixed(1)}pp renewals lapsing`,
    });
  }, [outcomes, pushAgentEvent, cohortPresets, offerCeilingBps, channels, minBalanceK, offerTerm, productOffers, bankingServices, bundles, multiTouch, triggerWindowDays, noticeDays, loyaltyTenure, deductiblePct, lockYears]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);
  const onBackToConfig = useCallback(() => { setResults(null); setMode("config"); }, []);

  const onStage = useCallback(() => {
    const stagedAt = Date.now();
    const policy = {
      id: `p-${stagedAt}`,
      name: PAGE_SUBTITLE,
      hypothesis: activeHypId,
      cluster: "high-ltv-renewal-shopping",
      themeId: "retention",
      experimentType: "retention",
      minBalanceK, offerCeilingBps, offerTerm, productOffers, channels,
      cohortPresets,
      bankingServices, triggerWindowDays, noticeDays, loyaltyTenure, deductiblePct, lockYears,
      // Pilot defaults — Deploy will own these when the user actually
      // configures the RCT. Carried along so the staged-policy record
      // is complete for downstream consumers.
      pilotDuration: PILOT_DEFAULTS.pilotDuration,
      holdoutPct:    PILOT_DEFAULTS.holdoutPct,
      rollbackOn:    PILOT_DEFAULTS.rollbackOn,
      stagedBy: tuneMode === "autopilot" ? "autopilot" : "user",
      status: "pending",
      stagedAt,
    };
    stagePolicy(policy);

    if (tuneMode === "autopilot") {
      recordDecisionTrace({
        hypothesisId: activeHypId,
        policyId: policy.id,
        levers: {
          minBalanceK, offerCeilingBps, offerTerm,
          channels, cohortPresets,
          bankingServices, bundles, multiTouch, triggerWindowDays, noticeDays,
        },
        reasoning: [
          "Sticky-bundled filter at 0.70 — fair-lending-defensible cohort",
          "Capped renewal increase + premium discount — holds the renewal within combined-ratio floor",
          "45-day notice · multi-touch (email → app → Comparion agent) — right channel × time",
        ],
        scenarios: 96400,
      });
    }

    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot staged retention policy for Deploy"
        : "Retention policy staged for Deploy",
    });

    setIntermezzo(tuneMode === "autopilot" ? "staged-autopilot" : "staged-guided");
    setTimeout(() => {
      setIntermezzo(null);
      navWorkspace("deploy");
    }, 1500);
  }, [
    activeHypId, minBalanceK, offerCeilingBps, offerTerm,
    channels, cohortPresets,
    bankingServices, triggerWindowDays, noticeDays,
    tuneMode, stagePolicy, recordDecisionTrace, setIntermezzo,
    pushAgentEvent, navWorkspace,
  ]);

  // ---- Autopilot cinematic ----
  const hasAutoRunRef = useRef(false);
  const hasAutoStagedRef = useRef(false);

  useEffect(() => {
    if (!isAutopilot || hasAutoRunRef.current || mode !== "config") return;
    hasAutoRunRef.current = true;
    const id = setTimeout(() => {
      if (tuneMode === "autopilot" && mode === "config") onRun();
    }, 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutopilot]);

  useEffect(() => {
    if (!isAutopilot || mode !== "results" || hasAutoStagedRef.current) return;
    hasAutoStagedRef.current = true;
    const id = setTimeout(() => {
      if (tuneMode === "autopilot") onStage();
    }, 3500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isAutopilot]);

  // ---- Reset to Twin's recommendations ----
  const resetToRecommended = useCallback(() => {
    setMinBalanceK(RECOMMENDED.minBalanceK);
    setProductOffers(RECOMMENDED_OFFERS);
    setChannels(RECOMMENDED.channels);
    setCohortPresets(["rate-sensitive"]);
    setBankingServices(RECOMMENDED.bankingServices);
    setBundles(RECOMMENDED.bundles);
    setMultiTouch(RECOMMENDED.multiTouch);
    setNoticeDays(RECOMMENDED.noticeDays);
    setCustomNotice("");
  }, []);

  // ---- Cohort-preset label (joins multi-selection) ----
  const COHORT_DISPLAY = {
    "full": "Full cohort",
    "rate-sensitive": "Shopping-elastic",
    "operating-decliner": "Silent Pre-Shopper",
    "high-value": "High-value at-risk",
    "long-tenured": "Long-tenured",
    "multi-product": "Multi-product",
  };
  const cohortLabel = cohortPresets.length === 1
    ? COHORT_DISPLAY[cohortPresets[0]] || cohortPresets[0]
    : `${cohortPresets.length} cohorts`;

  // ---- Live eligibility count (recomputes as the min-balance slider moves) ----
  // Cohort base from the selected presets; higher min-balance → lower count.
  const ELIG_COHORT_COUNTS = { "rate-sensitive": 161000, "operating-decliner": 132000, "high-value": 22000, "long-tenured": 59000, "multi-product": 88000 };
  const _cohortBase = (cohortPresets.includes("full")
    ? 550849
    : cohortPresets.reduce((s, id) => s + (ELIG_COHORT_COUNTS[id] || 0), 0)) || 550849;
  const _eligFrac = Math.max(0.2, Math.min(1, 1 - ((minBalanceK - 20) / (100 * 1.4))));
  const eligibleCount = Math.round(_cohortBase * _eligFrac);

  // ============================================================
  // RESULTS MODE — early return
  // ============================================================
  if (mode === "results" && results) {
    return (
      <ResultsReveal
        results={results}
        onReRun={onBackToConfig}
        onStage={onStage}
      />
    );
  }

  // ============================================================
  // CONFIG / RUNNING modes
  // ============================================================
  return (
    <div className="sim-ws sim-ws-single test-journey" style={{ "--acc": "#ffb15a", "--acc-soft": "rgba(255,177,90,.13)" }}>
      {/* ============ HEADER ============ */}
      <header className="sim-ws-header">
        <div className="test-journey-eyebrow">TESTING · {PAGE_SUBTITLE.toUpperCase()}</div>
        <div className="sim-ws-header-row">
          <h1 className="sim-ws-title">{PAGE_SUBTITLE}</h1>
          <div className="sim-ws-header-meta">
            <span className={"sim-mode-pill " + (isAutopilot ? "sim-mode-pill-auto" : "sim-mode-pill-guided")}>
              <span className="sim-mode-pill-dot" />
              {isAutopilot ? "AUTOPILOT" : "WHAT-IF"}
            </span>
            {isAutopilot ? (
              <button className="tj-btn tj-btn-ghost" onClick={() => setTuneMode("guided")}>
                Take over <Icon name="arrowRight" size={12} />
              </button>
            ) : (
              <button className="tj-btn tj-btn-ghost" onClick={resetToRecommended}>
                Reset to Twin's recommendations
              </button>
            )}
          </div>
        </div>
        <p className="sim-ws-subline">
          {outcomes.eligibleN.toLocaleString()} eligible after the loyalty gate ·{" "}
          loyalty threshold fixed at 0.70 · profitability guardrail enforced per customer.
        </p>
      </header>

      {/* ============ PRIOR ANCHOR PILL ============ */}
      <PriorAnchorPill hypothesisId={activeHypId} />

      {/* ============ STICKY CONFIG STRIP ============ */}
      <div className="sim-config-strip">
        <div className="sim-config-strip-cohort">
          <div className="sim-config-strip-cohort-h">
            <span className="sim-config-strip-l">Selected cohort</span>
            <span className="sim-config-strip-chips">
              <span className="sim-config-strip-chip">{cohortLabel.split(" · ")[0]}</span>
            </span>
          </div>
          <div className="sim-config-strip-counts">
            <span>{outcomes.eligibleN.toLocaleString()} eligible</span>
            <span className="sim-config-strip-sep">·</span>
            <span className="sim-config-strip-verified">
              after loyalty gate ({Math.round((outcomes.eligibleN / outcomes.cohortTotal) * 100)}% of cohort)
            </span>
          </div>
        </div>
        <div className={"sim-config-strip-guard " + (outcomes.udaapOk ? "is-safe" : "is-breach")}>
          <span className="sim-config-strip-guard-dot" />
          <span className="sim-config-strip-guard-l">Pricing fairness</span>
          <span className="sim-config-strip-guard-v">{outcomes.udaapMargin.toFixed(2)}</span>
          <span className="sim-config-strip-guard-vs">vs 0.85 floor</span>
        </div>
      </div>

      {/* ============ LEVER PANEL · 4 sections ============ */}
      <section className="panel sim-ws-col sim-ws-levers sim-ws-levers-full">

        {/* Section 1 · CUSTOMER (violet accent) — Cohort preset + segment builder */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">1</div>
            <div className="sim-lever-section-name">CUSTOMER</div>
            <div className="sim-lever-section-meta">Which cohort the offer reaches</div>
          </div>
          <div className="sim-lever-fieldset" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {[
              { id: "full",               count: 550849, signature: "Every customer showing one or more shopping-risk signals." },
              { id: "rate-sensitive",     count: 161000, signature: "Engagement dropping >20% · price-elastic · not deeply bundled." },
              { id: "operating-decliner", count: 132000, signature: "Portal logins falling · paperless-opens decaying · no competitor quote yet." },
              { id: "high-value",         count:  22000, signature: "LTV >$12K · top shopping decile · single-line (unbundled)." },
              { id: "long-tenured",       count:  59000, signature: "10+ years tenure · rate action landed in the last 6 months." },
              { id: "multi-product",      count:  88000, signature: "3+ policies held · early shopping signals on the auto policy." },
            ].map((c) => {
              const name = c.id === "full" ? "Full cohort"
                         : c.id === "rate-sensitive" ? "Shopping-elastic eligible"
                         : c.id === "operating-decliner" ? "Silent Pre-Shopper"
                         : c.id === "high-value" ? "High-value at-risk"
                         : c.id === "long-tenured" ? "Long-tenured shoppers"
                         : "Multi-policy shoppers";
              const isSelected = cohortPresets.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={"sim-cohort-card" + (isSelected ? " is-on" : "")}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isAutopilot}
                    onChange={() => toggleCohort(c.id)}
                  />
                  <div className="sim-cohort-card-h">
                    <span className="sim-cohort-card-n">{name}</span>
                  </div>
                  <div className="sim-cohort-card-counts">
                    <span><b>{(c.count / 1000).toFixed(0)}K</b> customers</span>
                  </div>
                  <div className="sim-cohort-card-sig">{c.signature}</div>
                </label>
              );
            })}
          </div>

          {/* Custom segment builder — collapsed by default. Same pattern as
              gig's: adds an additional rule-defined group on top of the
              preset cohort. Scoped only to this scenario. */}
          <div className={"sim-cohort-custom" + (customOpen ? " is-open" : "")}>
            <button
              type="button"
              className="sim-cohort-custom-toggle"
              onClick={() => setCustomOpen((v) => !v)}
            >
              <Icon name={customOpen ? "chevronDown" : "chevronRight"} size={12} />
              Add a custom segment (rule-defined)
              {customRules.length > 0 && (
                <span className="sim-cohort-custom-count">
                  {customRules.length} rule{customRules.length === 1 ? "" : "s"}
                </span>
              )}
            </button>
            {customOpen && (
              <div className="sim-cohort-custom-body">
                <div className="sim-cohort-custom-model">
                  <b>How this works:</b> a custom segment is an <em>additional</em> group defined by feature rules — it gets <em>added to</em> the preset cohort above, not used to filter it. Scoped to this scenario only; not saved to the global catalogue.
                </div>
                {customRules.length === 0 ? (
                  <div className="sim-cohort-custom-empty">
                    No rules yet. Click "Add rule" to start building.
                  </div>
                ) : (
                  <div className="sim-cohort-custom-rules">
                    {customRules.map((r, i) => (
                      <div key={i} className="sim-cohort-custom-rule">
                        <select
                          value={r.feature}
                          onChange={(e) => updateRule(i, { feature: e.target.value })}
                          disabled={isAutopilot}
                        >
                          <option value="balance_min">Household LTV</option>
                          <option value="balance_decline_90d">Engagement decline (90d)</option>
                          <option value="ach_outflow_90d">Competitor quote-shopping (90d)</option>
                          <option value="dda_activity_decline">Portal-login decline</option>
                          <option value="direct_deposit_decay">Coverage-reduction request</option>
                          <option value="tenure_months">Tenure (months)</option>
                          <option value="product_depth">Product depth (count)</option>
                        </select>
                        <select
                          value={r.op}
                          onChange={(e) => updateRule(i, { op: e.target.value })}
                          disabled={isAutopilot}
                        >
                          <option value="gte">≥</option>
                          <option value="lte">≤</option>
                          <option value="eq">=</option>
                          <option value="between">between</option>
                        </select>
                        <input
                          type="number"
                          value={r.value}
                          onChange={(e) => updateRule(i, { value: Number(e.target.value) })}
                          disabled={isAutopilot}
                        />
                        <button
                          type="button"
                          className="sim-cohort-custom-rm"
                          onClick={() => removeRule(i)}
                          aria-label="Remove rule"
                          disabled={isAutopilot}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="sim-cohort-custom-add"
                  onClick={addRule}
                  disabled={isAutopilot}
                >
                  + Add rule
                </button>
              </div>
            )}
          </div>

          {/* Conversational AI Cohort Builder */}
          <ConversationalCohortBuilder
            onApplyCohort={(customCohort) => {
              setCohortPresets([customCohort.id]);
            }}
            isAutopilot={isAutopilot}
          />
        </div>

        {/* Section 2 · ELIGIBILITY (violet accent) — Who in the cohort qualifies */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">2</div>
            <div className="sim-lever-section-name">ELIGIBILITY</div>
            <div className="sim-lever-section-meta">Which customers in the cohort qualify for the offer</div>
          </div>

          <LeverRow
            label="Min household LTV to qualify"
            caption="Customers below this aren't worth the offer cost."
            value={`$${minBalanceK}K`}
            offDefault={off("minBalanceK", minBalanceK)}
          >
            <RangeWithBubble min={20} max={100} step={5} value={minBalanceK}
              onChange={(e) => setMinBalanceK(+e.target.value)} disabled={isAutopilot}
              formatter={(v) => `$${v}K`} />
            <RangeScale marks={["$20K", "$50K", "$100K"]} />
            <div className="elig-tile">
              <span className="elig-tile-v">{eligibleCount.toLocaleString()}</span>
              <span className="elig-tile-l">customers qualify at this threshold</span>
            </div>
          </LeverRow>

        </div>

        {/* Section 3 · PRODUCT × OFFER (amber accent) — pick products, set each one's rate over its own market */}
        <div className="sim-lever-section sim-lever-section-policy">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">3</div>
            <div className="sim-lever-section-name">PRICING</div>
            <div className="sim-lever-section-meta">Discount spreading by tenure × LTV · deductible swap · retention discount tiers</div>
          </div>

          <LeverRow
            label="Products & offer"
            caption="Select the offers to put in front of the customer; each reveals its own slider, anchored to the current renewal premium. The average at-risk auto premium is ~$1,650/yr today."
            value={`${selectedProductIds.length} product${selectedProductIds.length === 1 ? "" : "s"}`}
            offDefault={productsOffDefault}
          >
            <div className="px-offer-list">
              {OFFER_PRODUCTS.map((p) => {
                const sel = productOffers[p.id] != null;
                const mkt = PRODUCT_MARKET[p.id] ?? 0;
                const bps = sel ? productOffers[p.id] : 0;
                return (
                  <div key={p.id} className={"px-offer-card" + (sel ? " is-selected" : "")}>
                    <label className="px-offer-head">
                      <input type="checkbox" checked={sel}
                        onChange={() => toggleProduct(p.id)} disabled={isAutopilot} />
                      <span className="px-offer-name">
                        <span className="px-offer-l">{p.label}</span>
                        <span className="px-offer-sub">{p.sub}</span>
                      </span>
                    </label>
                    {sel && (
                      <div className="px-offer-body">
                        <RangeWithBubble min={0} max={80} step={5}
                          value={bps}
                          onChange={(e) => setProductOffer(p.id, +e.target.value)}
                          disabled={isAutopilot}
                          formatter={(v) => p.id === "cd_6mo" ? `${(v / 100).toFixed(2)}% rate cap` : `$${dollarOff(v)} off`} />
                        <div className="px-offer-eff">
                          <span className="rate-ref-item"><span className="rate-ref-l">discount</span><span className="rate-ref-v" style={{ color: "var(--green)", fontWeight: 700 }}>{p.id === "cd_6mo" ? "— (renewal rate capped)" : `$${dollarOff(bps)} off premium`}</span></span>
                        </div>
                        {p.id === "smart_savings" && (
                          <div className="px-offer-qual" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--hair)" }}>
                            <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginBottom: 4, fontWeight: 600 }}>
                              Relationship threshold — minimum tenure the loyalty discount applies to
                            </div>
                            <YearsStepper value={loyaltyTenure[0]} min={0} max={20} disabled={isAutopilot}
                              onChange={(v) => setLoyaltyTenure([v, 30])} />
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                              Households with <b>≥ {loyaltyTenure[0]} years</b> of relationship qualify for this tier.
                            </div>
                          </div>
                        )}
                        {p.id === "elite_mma" && (
                          <div className="px-offer-qual" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--hair)" }}>
                            <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginBottom: 4, fontWeight: 600 }}>
                              Deductible level — % of coverage moved to the deductible to fund the discount
                            </div>
                            <RangeWithBubble min={5} max={25} step={5}
                              value={deductiblePct}
                              onChange={(e) => setDeductiblePct(+e.target.value)}
                              disabled={isAutopilot}
                              formatter={(v) => `${v}% deductible`} />
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                              Deductible set at <b>{deductiblePct}%</b> of coverage — a higher deductible funds a larger rate offset.
                            </div>
                          </div>
                        )}
                        {p.id === "cd_trade_up_24" && (
                          <div className="px-offer-qual" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--hair)" }}>
                            <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginBottom: 4, fontWeight: 600 }}>
                              Lock term — minimum years the rate is locked for
                            </div>
                            <YearsStepper value={lockYears} min={1} max={5} disabled={isAutopilot}
                              onChange={(v) => setLockYears(v)} />
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                              Rate locked for <b>≥ {lockYears} years</b> — the customer keeps it even if the market rises.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </LeverRow>
        </div>

        {/* Section 4 · VALUE-ADDED SERVICES (green accent) — real Liberty
            offerings we can add at renewal. Strategy B (Re-engage Before
            Shopping) is anchored on this lever; Strategy A can also layer
            it on top of a capped-rate + retention offer. */}
        <div className="sim-lever-section sim-lever-section-products">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">4</div>
            <div className="sim-lever-section-name">COVERAGE</div>
            <div className="sim-lever-section-meta">Rebalance coverage · premium-tier restructuring · value add-ons</div>
          </div>

          <LeverRow
            label="Coverage levers"
            caption="Hold the policy on value, not price — right-size coverage, restructure the premium tier, or add a value-add (roadside, rental, telematics credit). Multiple levers compound with diminishing returns past 3."
            value={bankingServices.length === 0 ? "none selected" : `${bankingServices.length} of ${BANKING_SERVICES.length}`}
            offDefault={bankingServices.length !== RECOMMENDED.bankingServices.length}
          >
            <div className="iw-objectives">
              {BANKING_SERVICES.map((s) => {
                const checked = bankingServices.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={"iw-objective" + (checked ? " is-selected" : "")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(s.id)}
                      disabled={isAutopilot}
                    />
                    <span className="iw-objective-body">
                      <span className="iw-objective-l">{s.label}</span>
                      <span className="iw-objective-d">{s.sub}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </LeverRow>
        </div>

        {/* Section 5 · BUNDLE — cross-line contingent-pricing plays with discount range sliders */}
        <div className="sim-lever-section sim-lever-section-products">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">5</div>
            <div className="sim-lever-section-name">BUNDLE</div>
            <div className="sim-lever-section-meta">Auto → Home · Auto → Life (Ethos) · Renters → Auto — contingent pricing &amp; discount ranges</div>
          </div>

          <LeverRow
            label="Bundle plays &amp; contingent discount ranges"
            caption="Cross-line offers that turn a single-line renewal into a multi-line household. Set the contingent discount range (%) for each allowed bundle play."
            value={Object.keys(bundleOffers).length === 0 ? "none selected" : `${Object.keys(bundleOffers).length} of ${BUNDLE_OPTIONS.length}`}
            offDefault={Object.keys(bundleOffers).length === 0}
          >
            <div className="px-offer-list" style={{ display: "grid", gap: 10 }}>
              {BUNDLE_OPTIONS.map((b) => {
                const rng = bundleOffers[b.id];
                const sel = rng != null;
                return (
                  <div key={b.id} className={"px-offer-card" + (sel ? " is-selected" : "")} style={{ border: "1px solid var(--hair)", borderRadius: 8, padding: "10px 12px", background: sel ? "rgba(183, 148, 246, 0.08)" : "var(--bg-2)" }}>
                    <label className="px-offer-head" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleBundleOffer(b.id)} disabled={isAutopilot} />
                      <span className="px-offer-name" style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{b.label}</span>
                    </label>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2, marginLeft: 24 }}>{b.sub}</div>
                    {sel && (
                      <div className="px-offer-body" style={{ marginTop: 8, marginLeft: 24 }}>
                        <DualRange min={0} max={10} step={0.1} unit="%"
                          low={rng[0]} high={rng[1]}
                          onChange={({ low, high }) => setBundleRange(b.id, low, high)} />
                        <div className="px-offer-eff" style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 4 }}>
                          <span className="rate-ref-item"><span className="rate-ref-l">contingent discount range: </span><b>{rng[0]}–{rng[1]}%</b></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </LeverRow>
        </div>

        {/* Section 6 · CHANNEL — How it reaches the customer */}
        <div className="sim-lever-section sim-lever-section-comms">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">6</div>
            <div className="sim-lever-section-name">CHANNEL</div>
            <div className="sim-lever-section-meta">Agent call vs app push vs email — right channel × time</div>
          </div>

          <LeverRow
            label="Delivery channels"
            caption="Customer hears about the offer via the channels you select. More channels means broader reach but more fatigue risk."
            value={channels.length === 0 ? "none selected" : `${channels.length} selected`}
            offDefault={channelsOffDefault}
          >
            <div className="lever-checks">
              {CHANNEL_OPTIONS.map((c) => {
                const checked = channels.includes(c.id);
                return (
                  <label key={c.id} className={"lever-check" + (checked ? " on" : "")}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChannel(c.id)}
                      disabled={isAutopilot}
                    />
                    {c.label}
                  </label>
                );
              })}
            </div>
          </LeverRow>
        </div>

        {/* Section 7 · TIMING — renewal-notice lead + multi-touch sequencing */}
        <div className="sim-lever-section">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">7</div>
            <div className="sim-lever-section-name">TIMING</div>
            <div className="sim-lever-section-meta">35 / 45 / 60-day notice · multi-touch sequencing per Customer Twin</div>
          </div>

          <LeverRow
            label="Renewal reminders — days before renewal"
            caption="How many days before renewal to send the reminder. Select any number of reminder windows (or add a custom one) — each micro-segment is then reminded at its most-effective window from your set. 45d is the sweet spot for most; high-value shoppers warrant an earlier 60-day reminder."
            value={noticeDays.map((d) => `${d}d`).join(" · ")}
            offDefault={JSON.stringify(noticeDays) !== JSON.stringify(RECOMMENDED.noticeDays)}
          >
            <div className="lever-checks">
              {NOTICE_DAY_PRESETS.map((d) => (
                <label key={d} className={"lever-check" + (noticeDays.includes(d) ? " on" : "")}>
                  <input type="checkbox" checked={noticeDays.includes(d)}
                    onChange={() => toggleNotice(d)} disabled={isAutopilot} />
                  {d}-day reminder
                </label>
              ))}
              {noticeDays.filter((d) => !NOTICE_DAY_PRESETS.includes(d)).map((d) => (
                <label key={d} className="lever-check on">
                  <input type="checkbox" checked onChange={() => toggleNotice(d)} disabled={isAutopilot} />
                  {d}-day reminder
                </label>
              ))}
            </div>
            <div className="notice-custom">
              <input
                type="number"
                min={7}
                max={120}
                placeholder="custom (7–120)"
                value={customNotice}
                onChange={(e) => setCustomNotice(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomNotice(); } }}
                disabled={isAutopilot}
              />
              <button type="button" className="notice-custom-add" onClick={addCustomNotice} disabled={isAutopilot}>
                + Add reminder
              </button>
            </div>
          </LeverRow>

          <LeverRow
            label="Multi-touch sequencing"
            caption="Sequence multiple touchpoints (e.g. email → app → agent call) per Customer Twin instead of a single send. Lifts save-rate at some fatigue cost."
            value={multiTouch ? "on" : "single-touch"}
            offDefault={multiTouch !== RECOMMENDED.multiTouch}
          >
            <div className="lever-checks">
              <label className={"lever-check" + (multiTouch ? " on" : "")}>
                <input type="checkbox" checked={multiTouch}
                  onChange={() => setMultiTouch((v) => !v)} disabled={isAutopilot} />
                Multi-touch sequence
              </label>
            </div>
          </LeverRow>
        </div>

        {/* Section 8 · CAMPAIGN DURATION — model horizon every result is scored
            over; pilot RCT length lives in Deploy. */}
        <div className="sim-lever-section">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">8</div>
            <div className="sim-lever-section-name">CAMPAIGN DURATION</div>
            <div className="sim-lever-section-meta">Campaign horizon the simulator runs over</div>
          </div>

          <LeverRow
            label="Weeks"
            caption="Campaign horizon the model runs over. The pilot RCT length is set separately in Deploy."
            value={`${simWeeks} weeks`}
            offDefault={simWeeks !== PILOT_DEFAULTS.pilotDuration}
          >
            <RangeWithBubble
              min={4} max={12} step={2}
              value={simWeeks}
              onChange={(e) => setSimWeeks(+e.target.value)}
              disabled={isAutopilot}
              formatter={(v) => `${v} weeks`}
            />
            <RangeScale marks={["4w", "6w", "8w", "10w", "12w"]} />
          </LeverRow>
        </div>

      </section>

      {/* ============ RUN BUTTON · at the bottom, after all levers ============ */}
      <div className="results-actions" style={{ justifyContent: "flex-end" }}>
        <button
          className="tj-btn tj-btn-primary tj-btn-lg sim-run-btn"
          onClick={onRun}
          disabled={mode === "running"}
        >
          <Icon name="play" size={14} />
          {mode === "running" ? "Running…" : "Run Simulation"}
        </button>
      </div>

      {/* ============ RUNNING OVERLAY ============ */}
      {mode === "running" && (
        <div className="sim-overlay" role="dialog" aria-modal="true" aria-label="Simulation running">
          <div className="sim-overlay-backdrop" />
          <div className="sim-overlay-card">
            <SimulationLoader
              variant="whatif"
              includeDeepening={false}
              onComplete={onLoaderComplete}
              onCancel={onLoaderCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   ResultsReveal — verdict + 3 ProofKpi cards + 4 guardrail pills + 2×2 grid

   Same staged-reveal timing as gig: verdict @0, KPIs @200, chart/tiles @600,
   actions @4400.
   ========================================================================= */
function ResultsReveal({ results, onReRun, onStage }) {
  const { verdict, playKey, outcomes } = results;
  const o = outcomes;
  const [showVerdict, setShowVerdict] = useState(false);
  const [showKpis,    setShowKpis]    = useState(false);
  const [showChart,   setShowChart]   = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [progress,    setProgress]    = useState(0);
  const timersRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    setShowVerdict(false); setShowKpis(false); setShowChart(false); setShowActions(false);
    setProgress(0);
    const t = (ms, fn) => { const id = setTimeout(fn, ms); timersRef.current.push(id); };
    t(0,    () => setShowVerdict(true));
    t(200,  () => setShowKpis(true));
    t(600,  () => setShowChart(true));
    t(4400, () => setShowActions(true));
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playKey]);

  // Animate the result-tile progress (0 → 1) over 3s once the chart panel is in.
  useEffect(() => {
    if (!showChart) return;
    let t0 = null;
    const dur = 3000;
    const ease = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const frame = (now) => {
      if (t0 === null) t0 = now;
      const p = Math.min(1, (now - t0) / dur);
      setProgress(ease(p));
      if (p < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [showChart]);

  // ── Derived tile inputs ──────────────────────────────────────────────────
  // NII-shaped 8-week curve for the area chart (reuses gig's ResultTileNII
  // which reads `outcomes.NII_8wk_M` and synthesises a CI cone). For
  // retention we map "retained deposits over the 8-week horizon" into the
  // same field — ~8/52 of the annual retainedM.
  // Show the accumulation near the annual NWP-impact KPI on the dashboard
  // (not the ~8/52 pilot slice), so the graph and the KPI cards line up.
  const tileOutcomes = { NII_8wk_M: o.retainedM };

  // Per-week steady values for the bar tiles. Total over 8 wks ≈ steady × 8.
  const retainedPerWk_M    = o.retainedM / 52 * (52 / 8) / 8;        // ≈ retained M-per-week ramp target
  const retainedTotalQtr_M = o.retainedM * (13 / 52);                 // quarterly equivalent of annual
  // For runoff-reduction bar: percentage-point reduction landed per week, ramping over 2 wks
  const runoffReductionPct  = o.runoffReductionPp * 100;              // total pp reduction after ramp
  // For DD-recovery bar: pp recovered per week (lags 3 wks then ramps)
  const ddRecPerWk          = o.ddRecoveryPp / 8;

  // Cohort donut segments (4 to match gig's pattern; sums to 100)
  const cohortSegments = [
    { id: "ds",    label: "Shopping Renewer",         pct: 55, color: "var(--acc, #ffb15a)" },
    { id: "od",    label: "Silent Pre-Shopper",     pct: 24, color: "var(--violet, #b794f6)" },
    { id: "dshv", label: "DS · High-value tier",    pct: 14, color: "var(--cyan, #4fd1c5)" },
    { id: "edge",  label: "Edge cases",             pct:  7, color: "var(--ink-3)" },
  ];

  // ── Contextual micro-segment breakdown (reconciles to the KPIs) ──────────
  const lever = results.lever || { cohortPresets: ["rate-sensitive"], productOffers: RECOMMENDED_OFFERS, channels: ["app", "email", "banker"] };
  const seg = deriveSegments(RET_SEG_MODEL, lever, o);
  const kpis = [
    { label: "NWP impact", value: `+$${o.retainedM.toFixed(1)}M`, baseline: "$0" },
    { label: "CLV impact", value: `+$${(o.retainedM * 2.5).toFixed(1)}M`, baseline: "$0" },
    { label: "Policies retained", value: `${Math.round(o.treatmentN * (o.runoffBau - o.runoffWithPolicy)).toLocaleString()}`, baseline: "0" },
    { label: "At-risk retained", value: `${(o.treatmentN * (o.runoffBau - o.runoffWithPolicy) / o.cohortTotal * 100).toFixed(1)}%`, baseline: "0%" },
    { label: "% renewals lapsing", value: `${(o.runoffWithPolicy * 100).toFixed(1)}%`, baseline: `${(o.runoffBau * 100).toFixed(1)}%` },
  ];

  // Policy band (the levers that produced this) — shown atop the Aggregate tab.
  const COHORT_LABELS = {
    "full": "Full cohort", "rate-sensitive": "Shopping-elastic", "operating-decliner": "Silent Pre-Shopper",
    "high-value": "High-value at-risk", "long-tenured": "Long-tenured", "multi-product": "Multi-product",
  };
  const policy = [
    { k: "Cohort", v: (lever.cohortPresets || []).map((id) => COHORT_LABELS[id]).filter(Boolean).join(", ") || "All" },
    { k: "Min LTV", v: `$${lever.minBalanceK}K` },
    { k: "Pricing", v: Object.entries(lever.productOffers || {})
        .map(([id, bps]) => {
          let s = `${(OFFER_PRODUCTS.find((p) => p.id === id) || {}).label || id} ${((PRODUCT_MARKET[id] ?? 0) + bps / 100).toFixed(2)}%`;
          if (id === "smart_savings" && lever.loyaltyTenure) s += ` (≥${lever.loyaltyTenure[0]}y tenure)`;
          if (id === "elite_mma" && lever.deductiblePct != null) s += ` (${lever.deductiblePct}% deductible)`;
          if (id === "cd_trade_up_24" && lever.lockYears != null) s += ` (≥${lever.lockYears}y lock)`;
          return s;
        })
        .join(" · ") || "—" },
    { k: "Coverage", v: (lever.bankingServices || []).map((s) => (BANKING_SERVICES.find((x) => x.id === s) || {}).label).filter(Boolean).join(", ") || "—" },
    { k: "Bundle", v: (lever.bundles || []).map((s) => (BUNDLE_OPTIONS.find((x) => x.id === s) || {}).label).filter(Boolean).join(", ") || "—" },
    { k: "Channels", v: (lever.channels || []).map((c) => CHANNEL_OPTIONS.find((o) => o.id === c)?.label).filter(Boolean).join(", ") },
    { k: "Renewal reminder", v: `${(lever.noticeDays && lever.noticeDays.length ? lever.noticeDays : [lever.triggerWindowDays || 45]).map((d) => `${d}d`).join(" · ")} before renewal${lever.multiTouch ? " · multi-touch" : ""}` },
  ];

  const chartsGrid = (
    <div className="sim-result-grid">
      <ResultTileNII
        outcomes={tileOutcomes}
        progress={progress}
        title="NWP protected accumulation"
        subhead="cumulative over 8-wk pilot · vs $0 baseline (no policy)"
        insight="Most retention lands inside the first 4 weeks — customers reached early commit early. Extending the pilot adds little new retention."
      />
      <ResultTileBars
        title="% renewals lapsing / wk"
        subhead={`drops from ${(o.runoffBau*100).toFixed(1)}% today to ${(o.runoffWithPolicy*100).toFixed(1)}% with policy`}
        steady={runoffReductionPct / 8}
        baselinePerWk={(o.runoffBau * 100) / 8}
        progress={progress}
        format={(n) => `${n.toFixed(2)}%`}
        rampWeeks={2}
        seed={11}
        numbers={[
          { k: "steady rate (with policy)",  v: `${(o.runoffWithPolicy * 100).toFixed(1)}% / qtr` },
          { k: "reduction vs today",         v: `−${(o.runoffReductionPp * 100).toFixed(1)}%` },
          { k: "8-wk NWP protected", v: `+$${o.retainedM.toFixed(1)}M` },
        ]}
        insight="The first two weeks lag — customers need to act on the offer before the leaving rate starts dropping. Full effect from week 3."
        accent="var(--acc, #ffb15a)"
      />
      <ResultTileBars
        title="Bundle adds at save / wk"
        subhead="households adding a home/umbrella policy at renewal"
        steady={ddRecPerWk}
        baselinePerWk={0}
        progress={progress}
        format={(n) => `${n.toFixed(2)}%`}
        rampWeeks={4}
        seed={23}
        numbers={[
          { k: "steady rate / wk",      v: `${ddRecPerWk.toFixed(2)}%` },
          { k: "8-wk total",            v: `+${o.ddRecoveryPp}%` },
          { k: "v1 pilot overshoot",    v: "+8% vs predicted" },
        ]}
        insight="Bundle adds lag the save offer by ~3 weeks — households take time to act on the pre-filled quote. Concentrated in weeks 6–8 in the v1 pilot."
        accent="var(--violet, #b794f6)"
      />
      <ResultTileCohort
        segments={cohortSegments}
        treatedN={o.treatmentN}
        caption={`${cohortSegments[0].label} + ${cohortSegments[1].label} account for ${cohortSegments[0].pct + cohortSegments[1].pct}% · the two largest archetypes`}
        insight="Most of the value comes from Shopping Renewers — the price-elastic archetype the loyalty gate is calibrated for."
      />
    </div>
  );

  return (
    <div className="results-content">
      {/* HEADER — Verdict + Proof KPIs together = "the answer" */}
      <section className={`panel results-header reveal ${showVerdict ? "in" : ""}`}>
        <Verdict verdict={verdict} />
      </section>

      {/* RESULTS — 4 KPIs (both tabs) + tabs: Aggregate charts | By micro-segment table */}
      <section className={`panel reveal ${showChart ? "in" : ""}`}>
        <SegmentedResults
          kpis={kpis}
          accent="#ffb15a"
          valueLabel="NWP protected / 8 wk"
          offerLabel="Discount"
          rateLabel="Capped renewal rate"
          hideBaseline={true}
          segments={seg}
          policy={policy}
          charts={chartsGrid}
          anchorRate={4.15}
        />
      </section>

      {/* GUARDRAILS — constraint pills, separate from outcome KPIs */}
      <section className={`panel reveal ${showKpis ? "in" : ""}`}>
        <div className="sim-guardrails-strip">
          <div className="sim-guardrails-h">
            <Icon name="check" size={12} strokeWidth={2.5} />
            <span>Guardrails · all passed</span>
          </div>
          <div className="sim-guardrails-pills">
            <span className={"sim-guardrail-pill " + (o.profitabilityOk ? "sim-guardrail-pass" : "sim-guardrail-fail")}>
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Profitability floor</span>
              <span className="sim-guardrail-pill-d">net +${o.netAnnualisedK}K / 8 wk</span>
            </span>
            <span className={"sim-guardrail-pill " + (o.udaapOk ? "sim-guardrail-pass" : "sim-guardrail-fail")}>
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Renewal-pricing fairness</span>
              <span className="sim-guardrail-pill-d">Fair-lending margin {o.udaapMargin.toFixed(2)} vs 0.85 floor</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Model risk · approved</span>
              <span className="sim-guardrail-pill-d">drift state stable</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Fraud check</span>
              <span className="sim-guardrail-pill-d">within seasonal bound</span>
            </span>
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      <div className={`results-actions reveal ${showActions ? "in" : ""}`}>
        <button className="tj-btn tj-btn-ghost" onClick={onReRun}>
          <Icon name="arrowLeft" size={14} /> Tune levers and re-run
        </button>
        <button className="tj-btn tj-btn-primary tj-btn-stage" onClick={onStage}>
          <Icon name="upload" size={14} /> Stage for Deploy
        </button>
      </div>
    </div>
  );
}
