/* ============================================================================
   LiquiditySimulateView — Idle-Cash Liquidity Activation Simulate workbench.

   Forked from RetentionSimulateView.jsx structure but scoped to liquidity:
     - 5 lever sections (COHORT / ELIGIBILITY / OFFER / ACTIVATION NUDGES /
       CHANNEL)
     - Single-column lever layout (mirroring gig's post-redesign)
     - Sticky config strip with suitability margin in the central pill slot
     - PriorAnchorPill reads MOCK_EXPERIMENTS (spread-extended with
       LIQUIDITY_EXPERIMENTS in LearnWorkspace) for hypothesis anchors
     - Results: verdict + 3 ProofKpi cards + 4 guardrail pills + 2×2 tiles
     - Stage for Deploy → intermezzo → navWorkspace("deploy")
     - Autopilot cinematic: T+1500 auto-run, T+3500 auto-stage

   What-If only — the If-What optimizer branch lives in LiquidityIfWhatView.
   ========================================================================= */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "@/state/AppShell";
import { useSetPageContext } from "@/state/pageContext";
import SimulationLoader from "@/components/loaders/SimulationLoader";
import Icon from "@/components/Icon";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import SegmentedResults from "@/components/SegmentedResults";
import { LIQUIDITY_SEGMENTS, deriveSegments, PRODUCT_MARKET } from "@/data/segmentModels";

/* Cohort sizes (mirror the CUSTOMER cards) — the engine splits these across the
   micro-segments and filters by what the user selected. */
const LIQ_SEG_MODEL = {
  segments: LIQUIDITY_SEGMENTS,
  cohortCounts: { full: 75000, "yield-exposed": 20000, "dormant-saver": 18000, "high-value": 7000, "long-tenured": 8000, "multi-product": 12000 },
  heldBackLabel: "Operating / emergency buffers",
  heldBackShare: 0.06,
};
import RangeWithBubble from "@/components/RangeWithBubble";
import CustomSegmentBuilder from "@/components/CustomSegmentBuilder";
import { RULE_ATTRS } from "@/data/customSegment";
import { MOCK_EXPERIMENTS } from "@/workspaces/LearnWorkspace";
import LiquidityIfWhatView from "@/workspaces/LiquidityIfWhatView";
import {
  LIQUIDITY_HYPOTHESIS_ID,
  LIQUIDITY_HYPOTHESIS_TITLE,
  LIQUIDITY_CALIBRATION,
  liquidityHypothesis,
} from "@/data/liquidityConfig";

const PAGE_SUBTITLE = LIQUIDITY_HYPOTHESIS_TITLE;

/* Twin's recommended liquidity-activation levers — autopilot anchor + reset
   target. 4 levers, prefilled to test the Idle-to-Yield CD policy as written
   on the signal card.

   What the policy IS (these are levers):
     - Min idle balance to qualify · dormancy-window trigger
     - Rate uplift over base · activation vehicle
     - Delivery channel

   What goes elsewhere:
     - Pilot duration / holdout % / auto-rollback → Deploy's RCT setup
       (these are measurement decisions made when launching the test,
       not part of the policy being tested)
     - RM capacity, frequency, tone → operational/communications detail */
const RECOMMENDED = {
  minBalanceK:        5,
  offerCeilingBps:    30,                            // blended uplift anchor (balanced product-fit policy)
  offerTerm:          "hy_savings",
  channels:           ["app", "email", "banker"],   // multi-select
  bankingServices:    [],                            // default off; turn on to layer activation nudges
  triggerWindowDays:  60,                            // dormancy window before predicted high-yield flight
};

/* Default per-product offers (bps over each product's OWN market). The blended
   uplift across these equals RECOMMENDED.offerCeilingBps, so the outcome math
   stays anchored. Each selected product gets its own slider in the UI. */
const RECOMMENDED_OFFERS = { hy_savings: 30, money_market: 35, cd_7mo: 25 };   // balanced mix, blend = 30 bps

/* ----------------------------------------------------------------------------
   Activation nudges the bank can attach to an offer to move idle cash into
   yield. Each is an actual in-app/servicing action — not a behavioural target.
---------------------------------------------------------------------------- */
const BANKING_SERVICES = [
  { id: "auto_renew",         label: "Auto-renew at maturity",     sub: "CD rolls into the then-current best rate at term end · keeps the balance in yield" },
  { id: "rate_alert",         label: "Rate-alert opt-in",          sub: "Notify the customer when a higher-yield vehicle becomes available" },
  { id: "sweep_on_deposit",   label: "Sweep-on-deposit",           sub: "New idle deposits above the buffer auto-sweep into the activated vehicle" },
];

/* ----------------------------------------------------------------------------
   Activation vehicle options · radio cards, single-select.
   factor scales activated-balance NII relative to the recommended 7-month CD.
---------------------------------------------------------------------------- */
/* Per-product uplift ceiling (maxBps) — the incentive range the optimizer may
   test for each product. Rates come from PRODUCT_MARKET (web-verified) and are
   left untouched. Standard Savings is the optional nurture / fallback. */
const OFFER_PRODUCTS = [
  { id: "hy_savings",     label: "High-yield savings",  sub: "Variable rate · most liquid, least sticky",                   factor: 0.92, maxBps: 40 },
  { id: "money_market",   label: "Money Market / MMA",  sub: "Variable rate · flexible, tiered yield",                      factor: 0.87, maxBps: 35 },
  { id: "cd_7mo",         label: "7-month CD",          sub: "Short commitment · best balance of activation and liquidity", factor: 1.00, maxBps: 25 },
  { id: "cd_12mo",        label: "12-month CD",         sub: "Longer lock-in · defends more balance, less liquid",          factor: 1.06, maxBps: 30 },
  { id: "cd_18mo",        label: "18-month CD",         sub: "Strongest lock-in · highest-conviction idle savers",          factor: 1.10, maxBps: 30 },
  { id: "smart_savings",  label: "Standard Savings",    sub: "Nurture / fallback · low or no incentive",                    factor: 0.94, maxBps: 10, optional: true },
];

/* ----------------------------------------------------------------------------
   Delivery channels · multi-select checkboxes.
---------------------------------------------------------------------------- */
const CHANNEL_OPTIONS = [
  { id: "app",     label: "App notification" },
  { id: "email",   label: "Email" },
  { id: "mail",    label: "Direct mail" },
  { id: "banker",  label: "Banker outreach" },
];

/* Pilot-design defaults used at staging time (Deploy will own these
   downstream; here they just produce sensible simulation results). */
const PILOT_DEFAULTS = {
  pilotDuration: 8,
  holdoutPct:    10,   // 90/10 RCT split
  rollbackOn:    true,
};

/* ----------------------------------------------------------------------------
   simulateOutcomes — liquidity lever → outcome chain.

   Anchors at recommended defaults (per LIQUIDITY_CALIBRATION):
     - eligibleAfterGate = 20,000  (out of 388K flagged, gated by suitability < 0.55)
     - treatmentN/controlN = 67,500 / 7,500  (90/10 RCT on the 75K signal cohort)
     - Incremental relationship value = $4.3M
     - Idle flight: 12% (BAU) → 6.4% (with policy) → −5.6pp reduction
     - Funded balances into yield = $265M
     - Rate give-up = $1.4M
     - Suitability margin = 0.94 (held constant by suitability gate)
     - Complaints delta = +45 / qtr
---------------------------------------------------------------------------- */
function simulateOutcomes(opts) {
  const C = LIQUIDITY_CALIBRATION;
  const {
    minBalanceK, offerCeilingBps, offerTerm, termFactor: termFactorOpt,
    channels, holdoutPct, pilotDuration,
    cohortPresets, customBase,
    bankingServices = [], triggerWindowDays = 60,
  } = opts;

  /* Multi-select cohort: sum the bases of the selected cohorts. Picking
     "Full cohort" supersedes the others since it includes everyone. A fetched
     custom segment (customBase) REPLACES the preset base entirely. */
  const COHORT_COUNTS = {
    "full":               C.signalCohortN,   // ~75K showing activation signals
    "yield-exposed":      C.eligibleAfterGate,
    "dormant-saver":      C.bonusHolderN,
    "high-value":         C.highValueN,
    "long-tenured":       8000,
    "multi-product":      12000,
    "digital-ready":      10000,
  };
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  const presetBase = customBase != null
    ? customBase
    : list.includes("full")
      ? C.signalCohortN
      : list.reduce((s, id) => s + (COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;

  /* Eligibility scaling — higher min-balance threshold cuts the eligible
     pool. Cohort selection already encodes the idle-cash signals upstream. */
  const balanceFactor = Math.max(0.5, 1 - (minBalanceK - RECOMMENDED.minBalanceK) * 0.015);
  const eligibleN = Math.round(presetBase * Math.max(0.4, Math.min(1.4, balanceFactor)));

  /* Offer-vehicle factor: pulled from the OFFER_PRODUCTS table so adding new
     vehicles doesn't require math updates here. */
  // Blended term factor (Product × Offer) when supplied; else the single product's factor.
  const termFactor = termFactorOpt != null ? termFactorOpt
    : (OFFER_PRODUCTS.find((p) => p.id === offerTerm) || OFFER_PRODUCTS[0]).factor;

  /* Treatment / control split. */
  const treatmentN = Math.round(eligibleN * (1 - holdoutPct / 100));
  const controlN   = eligibleN - treatmentN;

  /* Channel reach factor — sum of per-channel weights, capped at 1.05 for
     full multi-channel coverage. Banker carries the highest per-customer
     lift; app+email scale broadly. */
  const channelWeights = { app: 0.30, email: 0.25, mail: 0.20, banker: 0.45 };
  const channelSum = (channels || []).reduce((s, c) => s + (channelWeights[c] || 0), 0);
  const channelFactor = Math.max(0.45, Math.min(1.05, channelSum / 1.0));

  /* Rate-uplift scaling — activated NII scales roughly linearly with
     offer attractiveness (relative to recommended 20bps). */
  const ceilingFactor = offerCeilingBps / RECOMMENDED.offerCeilingBps;

  /* Activation-nudge factor — each attached nudge raises the activation
     mechanism. Full 3-nudge stack ≈ +60% activation vs no nudges, with
     diminishing returns past 3. */
  const servicesFactor = 1 + Math.min(0.6, bankingServices.length * 0.18);

  /* Dormancy-window factor — 60d is the sweet spot. Earlier and the idle
     signal hasn't formed yet; later and high-yield flight has begun. */
  const triggerFactor = 1 - Math.abs(triggerWindowDays - 60) / 120;

  /* Whole-eligible-cohort activation math — the scenario models the entire
     eligible cohort (no RCT here; the treatment/control split happens later at
     Go-Live). C.retainedDepositsAnnualM is the per-customer anchor (calibrated
     on C.treatmentN), so scaling by eligibleN gives the whole-cohort value. */
  const retainedM = C.retainedDepositsAnnualM
                  * (eligibleN / C.treatmentN)
                  * channelFactor
                  * Math.min(1.3, ceilingFactor)
                  * termFactor
                  * servicesFactor
                  * triggerFactor;

  /* Idle-flight reduction scales with offer strength + channel reach. */
  const runoffWithPolicy = Math.max(
    C.runoffBau - C.runoffReductionPp * channelFactor * Math.min(1.2, ceilingFactor),
    0.030
  );
  const runoffReductionPp = C.runoffBau - runoffWithPolicy;

  /* Spread protected scales linearly with activated NII. */
  const spreadProtectedK = C.spreadProtectedK * (retainedM / C.retainedDepositsAnnualM);

  /* Rate give-up scales with offer ceiling. */
  const offerCostM = C.offerCostM * ceilingFactor;
  /* Net annualised benefit = the net interest income (retainedM already nets the
     rate give-up). Subtracting offerCostM again here double-counted it and drove
     this negative, tripping the profitability floor on the recommended policy. */
  const netAnnualisedK = Math.round(retainedM * 1000);

  /* Suitability margin held constant by the suitability gate (0.55 fixed). */
  const udaapMargin = C.udaapMargin;

  /* Customer fatigue scales with the reached (whole eligible) cohort + offer aggressiveness. */
  const complaintsDelta = Math.round(
    C.complaintsDelta * (eligibleN / C.treatmentN) * Math.min(1.4, ceilingFactor)
  );

  /* Balances-activated recovery — secondary mechanism with a 3-week lag.
     Baseline +6pp; each attached activation nudge adds ~2pp because the
     nudge is the intervention this KPI actually measures. */
  const ddRecoveryPp = 6 + bankingServices.length * 2;

  /* Funded-product conversion — lifts from the organic (holdout) rate with the
     blended offer. 8-week (test-window) net value scales with the 12-month value. */
  const fundedConversion = Math.min(0.09, C.fundedConversionBaseline + offerCeilingBps * 0.001167);
  const fundedConversionBaseline = C.fundedConversionBaseline;
  const netValue8wkM = retainedM * (C.netValue8wkM / C.retainedDepositsAnnualM);

  /* Profitability gates */
  const profitabilityOk = netAnnualisedK > 0;
  const udaapOk = udaapMargin >= C.udaapFloor;

  return {
    eligibleN, treatmentN, controlN,
    retainedM, runoffBau: C.runoffBau, runoffWithPolicy, runoffReductionPp,
    spreadProtectedK, offerCostM, netAnnualisedK,
    fundedConversion, fundedConversionBaseline, netValue8wkM,
    udaapMargin, udaapOk, profitabilityOk,
    complaintsDelta, ddRecoveryPp,
    pilotDuration,
    cohortTotal: C.cohortTotal,
  };
}

/* ----------------------------------------------------------------------------
   PriorAnchorPill — same shape as gig's. Reads MOCK_EXPERIMENTS (which is
   spread-extended with LIQUIDITY_EXPERIMENTS in LearnWorkspace.jsx) and
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
   Verdict — liquidity-specific verdict callout.
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
          <div className="verdict-sub">All liquidity KPIs hit · suitability margin held · profitability guardrail clear</div>
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
          <div className="verdict-sub">Net interest income in range · suitability margin held · profitability guardrail uncertain</div>
        </div>
      </div>
    );
  }
  return (
    <div className="verdict-callout verdict-disproven">
      <span className="verdict-glyph"><Icon name="x" size={20} strokeWidth={2.5} /></span>
      <div className="verdict-body">
        <div className="verdict-title">SIMULATION DOES NOT SUPPORT HYPOTHESIS</div>
        <div className="verdict-sub">Net interest income below CI · or suitability basis insufficient at this uplift ceiling</div>
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
   LiquiditySimulateView
   ========================================================================= */
export default function LiquiditySimulateView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setTuneMode, explorationMode,
    recordDecisionTrace, setIntermezzo,
  } = useAppShell();

  // If-What path: dispatch to the goal-driven optimizer view. The What-If
  // lever workbench below is for free-form lever configuration; If-What
  // asks "given this goal, what's the best policy in these ranges?"
  if (explorationMode === "ifwhat") {
    return <LiquidityIfWhatView />;
  }

  // Mode state machine
  const [mode, setMode] = useState("config");          // 'config' | 'running' | 'results'
  // (page context published below, once `outcomes` + `results` exist)
  const isAutopilot = tuneMode === "autopilot";

  // Hypothesis id — fall back to the recommended liquidity hypothesis if
  // nothing was seeded.
  const activeHypId = selectedHypothesisId || LIQUIDITY_HYPOTHESIS_ID;

  // ---- Lever state ----
  const [minBalanceK,       setMinBalanceK]       = useState(RECOMMENDED.minBalanceK);
  // Product × Offer — a per-product map { productId: bps-over-its-market }.
  // Presence = product selected. Each selected product gets its own slider.
  // Seeded from the hypothesis the user chose to test (Card A/B/C), so the
  // products on screen match the hypothesis they clicked.
  const [productOffers,     setProductOffers]     = useState(liquidityHypothesis(activeHypId).whatIfOffers || RECOMMENDED_OFFERS);
  const [channels,          setChannels]          = useState(RECOMMENDED.channels);
  const [cohortPresets,     setCohortPresets]     = useState(["full"]);
  const [bankingServices,   setBankingServices]   = useState(RECOMMENDED.bankingServices);
  const [triggerWindowDays, setTriggerWindowDays] = useState(RECOMMENDED.triggerWindowDays);
  // Simulation duration — own section above the Run button. Default 8wk
  // because the result tiles are calibrated against an 8-wk anchor.
  const [simWeeks,          setSimWeeks]          = useState(PILOT_DEFAULTS.pilotDuration);

  const toggleService = (id) => setBankingServices((cur) =>
    cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
  );

  const toggleCohort = (id) => {
    setUseCustom(false);                                                         // picking a preset clears the custom segment
    setCohortPresets((cur) => {
      if (id === "full") return ["full"];                                        // full cohort is exclusive
      const next = cur.includes(id) ? cur.filter((p) => p !== id) : [...cur.filter((p) => p !== "full"), id];
      return next.length ? next : ["full"];                                      // never leave it empty
    });
  };

  // ---- Custom segment builder (rule-defined cohort; REPLACES the presets) ----
  const [customRules, setCustomRules] = useState([]);
  const [customCount, setCustomCount] = useState(null);   // null until "Fetch details"
  const [useCustom,   setUseCustom]   = useState(false);  // is the custom segment the active cohort?

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
  // Blended uplift (mean of the per-product offers) drives the aggregate outcomes.
  const blendedOfferBps = selectedProductIds.length
    ? Math.round(selectedProductIds.reduce((a, id) => a + productOffers[id], 0) / selectedProductIds.length)
    : 0;
  const DEFAULT_TERM_FACTOR = Object.keys(RECOMMENDED_OFFERS).reduce((a, id) => a + productFactor(id), 0)
    / Object.keys(RECOMMENDED_OFFERS).length;
  // Normalised so the default product mix sits at 1.0 (keeps the calibration anchored).
  const blendedTermFactor = selectedProductIds.length
    ? (selectedProductIds.reduce((a, id) => a + productFactor(id), 0) / selectedProductIds.length) / DEFAULT_TERM_FACTOR
    : 1;
  // Legacy single-value aliases for the outcome math, staging record + policy band.
  const offerCeilingBps = blendedOfferBps;
  const offerTerm = selectedProductIds[0] || RECOMMENDED.offerTerm;
  const productsOffDefault = JSON.stringify(productOffers) !== JSON.stringify(RECOMMENDED_OFFERS);
  const toggleProduct = (id) => setProductOffers((cur) => {
    if (cur[id] != null) {
      const next = { ...cur }; delete next[id];
      return Object.keys(next).length ? next : cur;   // never leave it empty
    }
    return { ...cur, [id]: RECOMMENDED_OFFERS[id] != null ? RECOMMENDED_OFFERS[id] : 20 };
  });
  const setProductOffer = (id, bps) => setProductOffers((cur) => ({ ...cur, [id]: bps }));

  // ---- Live outcomes (config + results both read this) ----
  // Pilot params come from PILOT_DEFAULTS — they're not levers in this
  // workspace; Deploy owns them downstream when configuring the RCT.
  const customBase = useCustom ? customCount : null;
  const outcomes = useMemo(() => simulateOutcomes({
    minBalanceK, offerCeilingBps, offerTerm, termFactor: blendedTermFactor, channels,
    holdoutPct:    PILOT_DEFAULTS.holdoutPct,
    pilotDuration: PILOT_DEFAULTS.pilotDuration,
    cohortPresets, customBase,
    bankingServices, triggerWindowDays,
  }), [minBalanceK, offerCeilingBps, offerTerm, blendedTermFactor,
       channels, cohortPresets, customBase,
       bankingServices, triggerWindowDays]);

  // ---- Results snapshot (taken on Run, frozen until next Run) ----
  const [results, setResults] = useState(null);

  /* Publish page context for Ask TwinX — on results, carry the live KPIs of
     this single configuration so answers cite the user's exact run. */
  const _whatifFacts = useMemo(() => (
    mode === "results"
      ? {
          useCase: "liquidity",
          verdict: results?.verdict,
          config: { minBalanceK, offerCeilingBps, channels, cohortPresets },
          kpis: {
            netValueM: outcomes.retainedM != null ? +outcomes.retainedM.toFixed(1) : undefined,
            fundedConversionPct: +(outcomes.fundedConversion * 100).toFixed(1),
            flightReductionPp: +(outcomes.runoffReductionPp * 100).toFixed(1),
            eligibleN: outcomes.eligibleN, treatmentN: outcomes.treatmentN, controlN: outcomes.controlN,
          },
        }
      : { useCase: "liquidity" }
  ), [mode, results, outcomes, minBalanceK, offerCeilingBps, channels, cohortPresets]);
  useSetPageContext(mode === "results" ? "whatif-results" : "whatif-config", _whatifFacts);

  // ---- Run / Loader / Stage handlers ----
  const onRun = useCallback(() => {
    setMode("running");
    pushAgentEvent({
      kind: "info",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot · running liquidity-activation simulation"
        : "What-If liquidity-activation simulation kicked off · 8-week horizon",
    });
  }, [pushAgentEvent, tuneMode]);

  const onLoaderComplete = useCallback(() => {
    const o = outcomes;
    const verdict = computeVerdict({
      retainedOk:      o.retainedM >= 0.45,
      runoffOk:        o.runoffReductionPp >= 0.013,
      udaapOk:         o.udaapOk,
      profitabilityOk: o.profitabilityOk,
    });
    setResults({
      verdict,
      playKey: Date.now(),
      outcomes: o,
      lever: { cohortPresets, offerCeilingBps, channels, minBalanceK, offerTerm, productOffers },
    });
    setMode("results");
    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: `What-If converged · +$${o.retainedM.toFixed(1)}M net interest income · −${(o.runoffReductionPp * 100).toFixed(1)}pp idle cash leaving`,
    });
  }, [outcomes, pushAgentEvent, cohortPresets, offerCeilingBps, channels, minBalanceK, offerTerm]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);
  const onBackToConfig = useCallback(() => { setResults(null); setMode("config"); }, []);

  const onStage = useCallback(() => {
    const stagedAt = Date.now();
    const o = outcomes;
    const policy = {
      id: `p-${stagedAt}`,
      name: PAGE_SUBTITLE,
      hypothesis: activeHypId,
      cluster: "idle-cash-liquidity",
      themeId: "liquidity",
      experimentType: "liquidity",
      minBalanceK, offerCeilingBps, offerTerm, productOffers, channels,
      cohortPresets,
      bankingServices, triggerWindowDays,
      // Pilot defaults — Deploy will own these when the user actually
      // configures the RCT. Carried along so the staged-policy record
      // is complete for downstream consumers.
      pilotDuration: PILOT_DEFAULTS.pilotDuration,
      holdoutPct:    PILOT_DEFAULTS.holdoutPct,
      rollbackOn:    PILOT_DEFAULTS.rollbackOn,
      stagedBy: tuneMode === "autopilot" ? "autopilot" : "user",
      status: "pending",
      stagedAt,
      /* Projected outcomes for THIS cohort + offer — drives the live-RCT KPI
         curves, the cohort split, the value-at-stake, and the Learn grid.
         The RCT predicted line ramps to exactly these values. */
      projected: {
        cohortLabel: `Surplus idle cash · $${minBalanceK}K+ balances`,
        eligibleN:  o.eligibleN,
        treatmentN: o.treatmentN,
        controlN:   o.controlN,
        pilotWeeks: PILOT_DEFAULTS.pilotDuration,
        valueAtStakeM: o.retainedM,
        kpis: [
          { key: "nii",       label: "Net interest income",     unit: "$M", value: o.retainedM,                  tau: 2.2, drift: 0.04 },
          { key: "flight_pp", label: "Idle-cash flight (Δ pp)", unit: "pp", value: -(o.runoffReductionPp * 100), tau: 1.8, drift: 0.05 },
          { key: "conv_pp",   label: "Funded conversion (pp)",  unit: "pp", value: o.fundedConversion * 100,     tau: 2.2, drift: 0.04 },
          { key: "value8_m",  label: "8-week net value",        unit: "$M", value: o.netValue8wkM,               tau: 2.0, drift: 0.04 },
        ],
      },
    };
    stagePolicy(policy);

    if (tuneMode === "autopilot") {
      recordDecisionTrace({
        hypothesisId: activeHypId,
        policyId: policy.id,
        levers: {
          minBalanceK, offerCeilingBps, offerTerm,
          channels, cohortPresets,
        },
        reasoning: [
          "Suitability-gated cohort at 0.55 — surplus idle cash only, buffers excluded",
          "+20bps uplift · 7-month CD — activates idle balance within profitability floor",
          "App + email + banker — broad scale plus relationship-tier reach",
        ],
        scenarios: 96400,
      });
    }

    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot staged liquidity policy for Deploy"
        : "Liquidity policy staged for Deploy",
    });

    setIntermezzo(tuneMode === "autopilot" ? "staged-autopilot" : "staged-guided");
    setTimeout(() => {
      setIntermezzo(null);
      navWorkspace("deploy");
    }, 1500);
  }, [
    activeHypId, minBalanceK, offerCeilingBps, offerTerm,
    channels, cohortPresets, outcomes,
    bankingServices, triggerWindowDays,
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
    setCohortPresets(["full"]);
    setBankingServices(RECOMMENDED.bankingServices);
    setTriggerWindowDays(RECOMMENDED.triggerWindowDays);
  }, []);

  // ---- Cohort-preset label (joins multi-selection) ----
  const COHORT_DISPLAY = {
    "full": "Full cohort",
    "yield-exposed": "Yield-exposed",
    "dormant-saver": "Dormant Saver",
    "high-value": "High-value idle",
    "long-tenured": "Long-tenured",
    "multi-product": "Multi-product",
  };
  const cohortLabel = cohortPresets.length === 1
    ? COHORT_DISPLAY[cohortPresets[0]] || cohortPresets[0]
    : `${cohortPresets.length} cohorts`;

  // ---- Live eligibility count (recomputes as the min-balance slider moves) ----
  // Cohort base from the selected presets; higher min-balance → lower count.
  const ELIG_COHORT_COUNTS = { "yield-exposed": 20000, "dormant-saver": 18000, "high-value": 7000, "long-tenured": 8000, "multi-product": 12000 };
  const _cohortBase = useCustom && customCount != null
    ? customCount
    : (cohortPresets.includes("full")
        ? 75000
        : cohortPresets.reduce((s, id) => s + (ELIG_COHORT_COUNTS[id] || 0), 0)) || 75000;
  const _eligFrac = Math.max(0.2, Math.min(1, 1 - ((minBalanceK - 5) / (100 * 1.4))));
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
          {outcomes.eligibleN.toLocaleString()} actionable — only genuinely surplus balances qualify ·{" "}
          everyday operating cash is excluded · profitability guardrail enforced per customer.
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
            <span>{outcomes.eligibleN.toLocaleString()} actionable</span>
            <span className="sim-config-strip-sep">·</span>
            <span className="sim-config-strip-verified">
              after suitability gate ({Math.round((outcomes.eligibleN / outcomes.cohortTotal) * 100)}% of cohort)
            </span>
          </div>
        </div>
        <div className={"sim-config-strip-guard " + (outcomes.udaapOk ? "is-safe" : "is-breach")}>
          <span className="sim-config-strip-guard-dot" />
          <span className="sim-config-strip-guard-l">Suitability margin</span>
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
              { id: "full",            count: 75000, signature: "Every selected customer showing one or more idle-cash activation signals." },
              { id: "yield-exposed",   count: 20000, signature: "Idle balance >$5K · rate responsive · genuinely surplus cash." },
              { id: "dormant-saver",   count: 18000, signature: "Balance untouched 60d+ · near-zero yield · no high-yield search yet." },
              { id: "high-value",      count:  7000, signature: "Idle balance >$85K · top balance decile · single-product depth." },
              { id: "long-tenured",    count:  8000, signature: "10+ years tenure · stable idle balances · low product depth." },
              { id: "multi-product",   count: 12000, signature: "3+ products held · idle balances not yet in yield products." },
              { id: "digital-ready",   count: 10000, signature: "App-active · likely to respond to digital savings / MMA offer." },
            ].map((c) => {
              const name = c.id === "full" ? "Full cohort"
                         : c.id === "yield-exposed" ? "Yield-responsive eligible"
                         : c.id === "dormant-saver" ? "Dormant savers"
                         : c.id === "high-value" ? "High-value idle"
                         : c.id === "long-tenured" ? "Long-tenured idlers"
                         : c.id === "digital-ready" ? "Digital-ready idlers"
                         : "Multi-product idlers";
              const isSelected = !useCustom && cohortPresets.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={"sim-cohort-card" + (isSelected ? " is-on" : "") + (useCustom ? " is-dim" : "")}
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

          {/* Custom segment builder — a rule-defined cohort that REPLACES the
              preset selection once fetched + used. */}
          <CustomSegmentBuilder
            attrs={RULE_ATTRS.liquidity}
            base={75000}
            rules={customRules}
            setRules={setCustomRules}
            count={customCount}
            setCount={setCustomCount}
            active={useCustom}
            onUse={() => setUseCustom(true)}
            onClear={() => setUseCustom(false)}
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
            label="Minimum idle balance"
            caption="Customers below this aren't worth the activation cost."
            value={`$${minBalanceK}K`}
            offDefault={off("minBalanceK", minBalanceK)}
          >
            <RangeWithBubble min={5} max={100} step={5} value={minBalanceK}
              onChange={(e) => setMinBalanceK(+e.target.value)} disabled={isAutopilot}
              formatter={(v) => `$${v}K`} />
            <RangeScale marks={["$5K", "$50K", "$100K"]} />
            <div className="elig-tile">
              <span className="elig-tile-v">{eligibleCount.toLocaleString()}</span>
              <span className="elig-tile-l">customers qualify at this threshold</span>
            </div>
          </LeverRow>

        </div>

        {/* Section 3 · PRODUCT × OFFER (amber accent) — pick products, set each one's rate over its own current APY */}
        <div className="sim-lever-section sim-lever-section-policy">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">3</div>
            <div className="sim-lever-section-name">PRODUCT × OFFER</div>
            <div className="sim-lever-section-meta">Select the products to offer — set each one's rate over its own current APY</div>
          </div>

          <LeverRow
            label="Products & offer"
            caption="Different products trade in different markets. Select the products to put in front of the customer; each reveals its own offer slider, anchored to that product's current APY. Idle cash earns ~0.05% today."
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
                      {!sel && <span className="px-offer-mkt">current APY {mkt.toFixed(2)}%</span>}
                    </label>
                    {sel && (
                      <div className="px-offer-body">
                        <RangeWithBubble min={0} max={100} step={5}
                          value={bps}
                          onChange={(e) => setProductOffer(p.id, +e.target.value)}
                          disabled={isAutopilot}
                          formatter={(v) => `+${v} bps`} />
                        <div className="px-offer-eff">
                          <span className="rate-ref-item is-market"><span className="rate-ref-l">current APY</span><span className="rate-ref-v">{mkt.toFixed(2)}%</span></span>
                          <span className="px-offer-arrow">→</span>
                          <span className="rate-ref-item"><span className="rate-ref-l">your offer</span><span className="rate-ref-v">{(mkt + bps / 100).toFixed(2)}%</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </LeverRow>
        </div>

        {/* Section 4 · ACTIVATION NUDGES (green accent) — In-app/servicing
            actions we attach to the offer to move idle cash into yield and
            keep it there. Each maps to a real in-app or servicing action. */}
        <div className="sim-lever-section sim-lever-section-products">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">4</div>
            <div className="sim-lever-section-name">ACTIVATION NUDGES</div>
            <div className="sim-lever-section-meta">In-app and servicing actions we attach to keep idle cash in yield</div>
          </div>

          <LeverRow
            label="Nudge enrollment"
            caption="Each nudge is a real in-app or servicing action — auto-renew at maturity, a rate-alert opt-in, or sweep-on-deposit. Multiple nudges compound but with diminishing returns past 3."
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

          <LeverRow
            label="Dormancy window"
            caption="How many days of dormancy before predicted high-yield flight to fire the activation prompt. 60d is the sweet spot — earlier and the idle signal hasn't formed; later and the customer is already shopping high-yield."
            value={`${triggerWindowDays}d dormancy`}
            offDefault={triggerWindowDays !== RECOMMENDED.triggerWindowDays}
          >
            <RangeWithBubble
              min={30} max={90} step={15} value={triggerWindowDays}
              onChange={(e) => setTriggerWindowDays(+e.target.value)}
              disabled={isAutopilot}
              formatter={(v) => `${v}d dormancy`}
            />
            <RangeScale marks={["30d", "60d", "90d"]} />
          </LeverRow>
        </div>

        {/* Section 5 · CHANNEL (green accent) — How it reaches the customer */}
        <div className="sim-lever-section sim-lever-section-comms">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">5</div>
            <div className="sim-lever-section-name">CHANNEL</div>
            <div className="sim-lever-section-meta">How the offer reaches the customer - pick one or more</div>
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

        {/* Section 6 · SIMULATION DURATION — own section, mirrors gig
            What-If + both If-What flows. Model horizon every result is
            scored over; pilot RCT length lives in Deploy. */}
        <div className="sim-lever-section">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">6</div>
            <div className="sim-lever-section-name">SIMULATION DURATION</div>
            <div className="sim-lever-section-meta">Model horizon the simulator runs over</div>
          </div>

          <LeverRow
            label="Weeks"
            caption="Time horizon the model runs over. The pilot RCT length is set separately in Deploy."
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
  // liquidity we map "net interest income over the 8-week horizon" into the
  // same field — ~8/52 of the annual retainedM.
  const tileOutcomes = { NII_8wk_M: o.netValue8wkM };

  // Per-week steady values for the bar tiles. Total over 8 wks ≈ steady × 8.
  const retainedPerWk_M    = o.retainedM / 52 * (52 / 8) / 8;        // ≈ NII M-per-week ramp target
  const retainedTotalQtr_M = o.retainedM * (13 / 52);                 // quarterly equivalent of annual
  // For idle-flight-reduction bar: percentage-point reduction landed per week, ramping over 2 wks
  const runoffReductionPct  = o.runoffReductionPp * 100;              // total pp reduction after ramp
  // For activation bar: pp activated per week (lags 3 wks then ramps)
  const ddRecPerWk          = o.ddRecoveryPp / 8;

  // ── Contextual micro-segment breakdown (reconciles to the KPIs) ──────────
  const lever = results.lever || { cohortPresets: ["full"], productOffers: RECOMMENDED_OFFERS, channels: ["app", "email", "banker"] };
  // Retained balances ($46M) are the deposit dollars held from flight; the
  // annualized relationship value (~$0.7M) is the NII earned on them at ~1.5% NIM.
  // Funded balances = the deposit $ routed into a yield product (Incremental relationship value
  // at ~1.6% net margin). The lead KPI is the Incremental relationship value.
  const _fundedBalM = Math.round(o.retainedM / 0.0162);
  const _convWith = +(o.fundedConversion * 100).toFixed(1);
  const _convBase = +(o.fundedConversionBaseline * 100).toFixed(1);
  // Whole eligible cohort converts (no RCT in the scenario) — matches the If-What.
  const _fundedRel = Math.round(o.eligibleN * o.fundedConversion);
  const _fundedRelBase = Math.round(o.eligibleN * o.fundedConversionBaseline);
  // Value column reconciles to funded balances (the meaningful $ flow).
  const seg = deriveSegments(LIQ_SEG_MODEL, lever, { ...o, retainedM: _fundedBalM, reachTarget: o.eligibleN });
  const kpis = [
    { label: "Incremental relationship value", value: `+$${o.retainedM.toFixed(1)}M`, baseline: "$0" },
    { label: "Funded product conversion", value: `${_convWith}%`, baseline: `${_convBase}%` },
    { label: "New funded relationships", value: `${_fundedRel.toLocaleString()}`, baseline: `${_fundedRelBase.toLocaleString()}` },
    { label: "Incremental funded balances", value: `+$${_fundedBalM}M`, baseline: "$0" },
    { label: "Idle cash leakage", value: `${(o.runoffWithPolicy * 100).toFixed(1)}%`, baseline: `${(o.runoffBau * 100).toFixed(1)}%` },
  ];

  // Policy band (the levers that produced this) — shown atop the Aggregate tab.
  const COHORT_LABELS = {
    "full": "Full cohort", "yield-exposed": "Yield-responsive", "dormant-saver": "Dormant savers",
    "high-value": "High-value idle", "long-tenured": "Long-tenured", "multi-product": "Multi-product",
    "digital-ready": "Digital-ready",
  };
  const policy = [
    { k: "Cohort", v: (lever.cohortPresets || []).map((id) => COHORT_LABELS[id]).filter(Boolean).join(", ") || "All" },
    { k: "Min balance", v: `$${lever.minBalanceK}K` },
    { k: "Product × Offer", v: Object.entries(lever.productOffers || {})
        .map(([id, bps]) => `${(OFFER_PRODUCTS.find((p) => p.id === id) || {}).label || id} ${((PRODUCT_MARKET[id] ?? 0) + bps / 100).toFixed(2)}%`)
        .join(" · ") || "—" },
    { k: "Channels", v: (lever.channels || []).map((c) => CHANNEL_OPTIONS.find((o) => o.id === c)?.label).filter(Boolean).join(", ") },
  ];

  const chartsGrid = (
    <div className="sim-result-grid">
      <ResultTileNII
        outcomes={tileOutcomes}
        progress={progress}
        title="8-week incremental net value"
        subhead="cumulative test-window value · vs $0 holdout baseline"
        insight="Most funded conversion lands inside the first 4 weeks — customers reached early route balances early. The 8-week figure is what the test directly measures; the 12-month is the projected business case."
      />
      <ResultTileBars
        title="Idle cash leakage / wk"
        subhead={`drops from ${(o.runoffBau*100).toFixed(1)}% today to ${(o.runoffWithPolicy*100).toFixed(1)}% with policy`}
        steady={runoffReductionPct / 8}
        baselinePerWk={(o.runoffBau * 100) / 8}
        progress={progress}
        format={(n) => `${n.toFixed(2)}pp`}
        rampWeeks={2}
        seed={11}
        numbers={[
          { k: "steady leakage (with policy)", v: `${(o.runoffWithPolicy * 100).toFixed(1)}% / qtr` },
          { k: "reduction vs today",           v: `−${(o.runoffReductionPp * 100).toFixed(1)}pp` },
          { k: "8-wk funded balances",         v: `+$${Math.round(_fundedBalM * 8 / 52)}M` },
        ]}
        insight="The first two weeks lag — customers need to act on the offer before the idle-flight rate starts dropping. Full effect from week 3."
        accent="var(--acc, #ffb15a)"
      />
      <ResultTileBars
        title="Balances activated into yield / wk"
        subhead="idle cash moving into a term/high-yield vehicle"
        steady={ddRecPerWk}
        baselinePerWk={0}
        progress={progress}
        format={(n) => `${n.toFixed(2)}pp`}
        rampWeeks={4}
        seed={23}
        numbers={[
          { k: "steady rate / wk",      v: `${ddRecPerWk.toFixed(2)}pp` },
          { k: "8-wk total",            v: `+${o.ddRecoveryPp}pp` },
          { k: "v1 pilot overshoot",    v: "+8pp vs predicted" },
        ]}
        insight="Activation lags the rate offer by ~3 weeks — customers need time to move idle cash into the vehicle. Concentrated in weeks 6–8 in the v1 pilot."
        accent="var(--violet, #b794f6)"
      />
      <ResultTileNII
        outcomes={{ NII_8wk_M: _fundedBalM * (8 / 52) }}
        progress={1}
        title="Funded balances accumulation"
        subhead="projected · cumulative balances routed into yield products"
        insight="Most balances are routed in the first few weeks after the offer lands."
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
          valueLabel="Funded bal."
          valueScale={1}
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
              <span className="sim-guardrail-pill-d">net annualised +${(o.netAnnualisedK / 1000).toFixed(1)}M</span>
            </span>
            <span className={"sim-guardrail-pill " + (o.udaapOk ? "sim-guardrail-pass" : "sim-guardrail-fail")}>
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Suitability</span>
              <span className="sim-guardrail-pill-d">margin {o.udaapMargin.toFixed(2)} vs 0.85 floor</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Liquidity risk · cleared</span>
              <span className="sim-guardrail-pill-d">no operating/emergency buffers locked</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Model risk · approved</span>
              <span className="sim-guardrail-pill-d">idle-cash state stable</span>
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
