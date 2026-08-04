/* ============================================================================
   SmbGrowthSimulateView — Small Commercial Growth Simulate workbench.

   Forked from SmbRateSimulateView.jsx structure but re-domained from
   renewal-retention via rate to Small Commercial growth-capture —
   a bind + cross-line capture play (win the growing account back):
     - 6 lever sections (CUSTOMER / ELIGIBILITY / OFFER / EXPANSION NUDGES /
       CHANNEL / SIMULATION DURATION)
     - Single-column lever layout
     - Sticky config strip with pricing-consistency margin in the central slot
     - Results: verdict + 3 ProofKpi cards + 4 guardrail pills + 2×2 tiles
       WITH CHARTS + a micro-segment per-segment recommendation table
     - Stage for Deploy → intermezzo → navWorkspace("deploy")
     - Autopilot cinematic: T+1500 auto-run, T+3500 auto-stage

   What-If only — the If-What optimizer branch lives in SmbGrowthIfWhatView.

   The model reads SMBGROWTH_CALIBRATION, whose field names mirror the rate
   calibration so simulateOutcomes() forks mechanically; semantics are
   re-labelled for growth: "incremental Yr-1 NWP", "quote-to-bind conversion"
   (which RISES base→best), and offerCeilingBps is the RATE-FLEXIBILITY
   (bps) lever.
   ========================================================================= */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "@/state/AppShell";
import SimulationLoader from "@/components/loaders/SimulationLoader";
import Icon from "@/components/Icon";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import RangeWithBubble from "@/components/RangeWithBubble";
import DualRange from "@/components/DualRange";
import { MOCK_EXPERIMENTS } from "@/workspaces/LearnWorkspace";
import ConversationalCohortBuilder from "@/components/ConversationalCohortBuilder";
import SegmentedResults from "@/components/SegmentedResults";
import SmbGrowthIfWhatView from "@/workspaces/SmbGrowthIfWhatView";
import {
  SMBGROWTH_HYPOTHESIS_ID,
  SMBGROWTH_HYPOTHESIS_TITLE,
  SMBGROWTH_CALIBRATION,
  SMBGROWTH_MICROSEGMENTS,
  SMBGROWTH_SEGMENT_COLUMNS,
  SMBGROWTH_CONFIG,
  configureGrowthSegments,
} from "@/data/smbGrowthConfig";

const PAGE_SUBTITLE = SMBGROWTH_HYPOTHESIS_TITLE;

/* Twin's recommended SMB-growth / re-bundle levers — autopilot anchor + reset
   target. Prefilled to test the re-bundle offer as written on the signal card.

   What the policy IS (these are levers):
     - Pre-approved limit ($K) the expansion offer carries
     - Intro-pricing / fee-waiver depth (bps) · the headline offer lever
     - Packaging tier · delivery channel

   What goes elsewhere:
     - Pilot duration / holdout % / auto-rollback → Deploy's RCT setup
     - RM capacity, frequency, tone → operational/communications detail */
const RECOMMENDED = {
  minBalanceK:        75,
  offerCeilingBps:    75,
  offerTerm:          "pkg_bundled",
  channels:           ["app", "banker", "rmcall"],   // multi-select
  bankingServices:    [],                             // default off; turn on to layer expansion nudges
  triggerWindowDays:  60,                             // expansion-signal window before the competitor finances it
};

/* ----------------------------------------------------------------------------
   Expansion nudges the bank can attach to a re-bundle offer to deepen the
   relationship and pull the operating flows back on-us. Each is a real
   servicing / relationship action.
---------------------------------------------------------------------------- */
const BANKING_SERVICES = [
  { id: "relationship_lock", label: "Multi-line bundle credit",  sub: "Better bundled price conditional on keeping WC / GL on the book · deepens the account" },
  { id: "rate_alert",        label: "Expansion-review opt-in",   sub: "Proactively re-review the account when a new expansion signal fires" },
  { id: "sweep_on_deposit",  label: "Telematics safety credit",  sub: "Fleet / WC safety-program credit that lowers the blended loss ratio" },
];

/* ----------------------------------------------------------------------------
   Packaging options · radio cards, single-select.
   How the lead line is wrapped. factor scales conversion / incremental
   NWP relative to the recommended bundled packaging.
---------------------------------------------------------------------------- */
const OFFER_PRODUCTS = [
  { id: "pkg_alacarte", label: "Packaging · single line", sub: "Lead line only · lowest cost, weakest attach and bind rate",              factor: 0.90 },
  { id: "pkg_light",    label: "Packaging · light bundle", sub: "Lead + one line · modest bind lift, modest give-up",                     factor: 0.96 },
  { id: "pkg_bundled",  label: "Packaging · bundled",     sub: "Recommended · lead + core lines attached · best bind balance",           factor: 1.00 },
  { id: "pkg_intro",    label: "Packaging · rate-flexed bundle", sub: "Bundle with a rate concession · binds more, gives up more margin", factor: 1.05 },
  { id: "pkg_full",     label: "Packaging · full account", sub: "Full Business Advantage stack · highest attach, approaches rate adequacy", factor: 1.08 },
];

/* ----------------------------------------------------------------------------
   Delivery channels · multi-select checkboxes.
---------------------------------------------------------------------------- */
const CHANNEL_OPTIONS = [
  { id: "banker",  label: "Broker / Agent" },
  { id: "app",     label: "Direct digital instant-quote" },
  { id: "rmcall",  label: "Referral underwriter" },
  { id: "email",   label: "Broker outreach + digital" },
];

/* Pilot-design defaults used at staging time (Deploy owns these downstream;
   here they just produce sensible simulation results). */
const PILOT_DEFAULTS = {
  pilotDuration: 8,
  holdoutPct:    10,
  rollbackOn:    true,
};

/* ----------------------------------------------------------------------------
   simulateOutcomes — SMB-growth / re-bundle lever → outcome chain.

   Anchors at recommended defaults (per SMBGROWTH_CALIBRATION):
     - eligibleAfterGate = 35,500 accounts (excludes watch/hold)
     - treatmentN/controlN = 34,560 / 3,840
     - Incremental Yr-1 NWP = $31M (at +75 bps rate-flexibility default)
     - Quote-to-bind conversion: 8.4% (base) → 19.1% (with policy) → +10.7pp lift
     - +$13M more NWP than a blanket rate concession
     - Spread protected = $640K / yr
     - Pricing-consistency margin = 0.92 (held by the price floor)

   The model FLIPS the rate template's runoff direction: conversion RISES from
   base toward the best-configuration ceiling as the offer strengthens.
---------------------------------------------------------------------------- */
function simulateOutcomes(opts) {
  const C = SMBGROWTH_CALIBRATION;
  const {
    minBalanceK, offerCeilingBps, offerTerm,
    channels, holdoutPct, pilotDuration,
    cohortPresets,
    bankingServices = [], triggerWindowDays = 60,
  } = opts;

  /* Multi-select cohort: sum the bases of the selected cohorts. Picking
     "Full cohort" supersedes the others since it includes everyone. */
  const COHORT_COUNTS = {
    "full":               C.cohortTotal,
    "rate-driven":        C.cohortTotal,        // expansion-ready eligible base — anchors the +$31M default
    "mid-sensitive":      C.scalingMultisiteN,
    "high-value":         C.equipmentN,
    "relationship":       C.offUsFinancersN,
    "multi-product":      12000,
  };
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  const presetBase = list.includes("full")
    ? C.cohortTotal
    : list.reduce((s, id) => s + (COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;

  /* Eligibility scaling — a higher pre-approved limit threshold narrows the
     qualifying pool. Cohort selection already encodes the expansion signals
     upstream. */
  const balanceFactor = Math.max(0.5, 1 - (minBalanceK - RECOMMENDED.minBalanceK) * 0.004);
  const eligibleN = Math.round(presetBase * Math.max(0.4, Math.min(1.4, balanceFactor)));

  /* Packaging-tier factor: blended across the selected products when a
     termFactor override is supplied (multi-select offer), else the single
     product's factor from the OFFER_PRODUCTS table. */
  const termFactor = opts.termFactor != null
    ? opts.termFactor
    : (OFFER_PRODUCTS.find((p) => p.id === offerTerm) || OFFER_PRODUCTS[0]).factor;

  /* Treatment / control split. */
  const treatmentN = Math.round(eligibleN * (1 - holdoutPct / 100));
  const controlN   = eligibleN - treatmentN;

  /* Channel reach factor — sum of per-channel weights, capped at 1.05 for
     full multi-channel coverage. Primary banker carries the highest
     per-account lift on large expansions; in-app scales broadly. */
  const channelWeights = { banker: 0.42, app: 0.28, rmcall: 0.30, email: 0.20 };
  const channelSum = (channels || []).reduce((s, c) => s + (channelWeights[c] || 0), 0);
  const channelFactor = Math.max(0.45, Math.min(1.05, channelSum / 1.0));

  /* Intro-pricing-depth scaling — incremental revenue scales roughly linearly
     with offer attractiveness (relative to recommended +75bps depth). */
  const ceilingFactor = offerCeilingBps / RECOMMENDED.offerCeilingBps;

  /* Expansion-nudge factor — each attached nudge raises the conversion
     mechanism. Full 3-nudge stack ≈ +60% effectiveness vs no nudges,
     diminishing past 3. */
  const servicesFactor = 1 + Math.min(0.6, bankingServices.length * 0.18);

  /* Expansion-signal window factor — 60d is the sweet spot. Earlier and the
     expansion signal hasn't formed; later and the competitor has already
     financed the growth. */
  const triggerFactor = 1 - Math.abs(triggerWindowDays - 60) / 120;

  /* Per-treated incremental-revenue math — calibrated to hit anchor at
     defaults (+$31M Yr-1). */
  const retainedM = C.retainedDepositsAnnualM
                  * (treatmentN / C.treatmentN)
                  * channelFactor
                  * Math.min(1.3, ceilingFactor)
                  * termFactor
                  * servicesFactor
                  * triggerFactor;

  /* Quote-to-bind conversion RISES from the base toward the best-configuration
     ceiling as the offer strengthens. strengthFactor blends offer depth and
     channel reach; conversion is clamped at the best-config ceiling. */
  const strengthFactor = Math.max(
    0,
    Math.min(1, channelFactor * Math.min(1.2, ceilingFactor) * termFactor * servicesFactor * triggerFactor)
  );
  const conversionWithPolicy = Math.min(
    C.runoffBau + (C.runoffWithPolicy - C.runoffBau) * strengthFactor,
    C.runoffWithPolicy
  );
  const runoffWithPolicy   = conversionWithPolicy;
  const runoffReductionPp  = conversionWithPolicy - C.runoffBau;   // conversion LIFT (+pp)

  /* Spread protected scales linearly with incremental revenue. */
  const spreadProtectedK = C.spreadProtectedK * (retainedM / C.retainedDepositsAnnualM);

  /* Products-per-relationship (primacy) lift scales with conversion — more
     accounts taking the lead product + bundle attach means deeper primacy. */
  const productsPerRelLift = (C.productsPerRelLift || 0.4) * (retainedM / C.retainedDepositsAnnualM);

  /* Intro-pricing give-up (margin cost) scales with offer depth. */
  const offerCostM = C.offerCostM * ceilingFactor;
  const netAnnualisedK = Math.round((spreadProtectedK * 1000 - offerCostM * 1e6) / 1000) + C.netAnnualisedK;

  /* Pricing-consistency margin held by the price floor. */
  const udaapMargin = C.udaapMargin;

  /* Customer fatigue scales with treatment size + offer aggressiveness. */
  const complaintsDelta = Math.round(
    C.complaintsDelta * (treatmentN / C.treatmentN) * Math.min(1.4, ceilingFactor)
  );

  /* Primacy-attach recovery — secondary mechanism. Baseline +6pp; each
     attached expansion nudge adds ~2pp because the nudge is the intervention
     this KPI actually measures. */
  const ddRecoveryPp = 6 + bankingServices.length * 2;

  /* Profitability gates */
  const profitabilityOk = netAnnualisedK > 0;
  const udaapOk = udaapMargin >= C.udaapFloor;

  return {
    eligibleN, treatmentN, controlN,
    retainedM, runoffBau: C.runoffBau, runoffWithPolicy, runoffReductionPp,
    spreadProtectedK, offerCostM, netAnnualisedK, productsPerRelLift,
    udaapMargin, udaapOk, profitabilityOk,
    complaintsDelta, ddRecoveryPp,
    pilotDuration,
    cohortTotal: C.cohortTotal,
  };
}

/* ----------------------------------------------------------------------------
   PriorAnchorPill — reads MOCK_EXPERIMENTS and finds the most recent pilot
   whose priorAnchorFor includes the current hypothesis. Surfaces the headline
   model update.
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
   Verdict — SMB-growth-specific verdict callout.
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
          <div className="verdict-sub">All growth KPIs hit · pricing-consistency margin held · margin floor clear</div>
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
          <div className="verdict-sub">Incremental NWP in range · pricing-consistency margin held · rate adequacy uncertain</div>
        </div>
      </div>
    );
  }
  return (
    <div className="verdict-callout verdict-disproven">
      <span className="verdict-glyph"><Icon name="x" size={20} strokeWidth={2.5} /></span>
      <div className="verdict-body">
        <div className="verdict-title">SIMULATION DOES NOT SUPPORT HYPOTHESIS</div>
        <div className="verdict-sub">Incremental NWP below CI · or the quote binds below the rate-adequacy floor</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   LeverRow — same structure / CSS as the template.
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
   ProofKpi — same structure / CSS as the template.
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
   SmbGrowthSimulateView
   ========================================================================= */
export default function SmbGrowthSimulateView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setTuneMode, explorationMode, setExplorationMode,
    recordDecisionTrace, setIntermezzo,
  } = useAppShell();

  // Mode state machine
  const [mode, setMode] = useState("config");          // 'config' | 'running' | 'results'
  const isAutopilot = tuneMode === "autopilot";

  // Hypothesis id — fall back to the recommended SMB-growth hypothesis if
  // nothing was seeded.
  const activeHypId = selectedHypothesisId || SMBGROWTH_HYPOTHESIS_ID;

  // ---- Lever state ----
  const [minBalanceK,       setMinBalanceK]       = useState(RECOMMENDED.minBalanceK);
  // Offer products — MULTI-SELECT (checkboxes), mirroring the If-What optimizer's
  // OFFER section. Each selected product reveals its own rate-discount slider;
  // the simulation prices against the blended discount + blended packaging factor.
  const [selectedOffers,    setSelectedOffers]    = useState([RECOMMENDED.offerTerm]);
  const toggleOffer = (id) => setSelectedOffers((cur) =>
    cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((x) => x !== id)) : [...cur, id]
  );
  // Primary product (first selected) — used where a single anchor is needed
  // (packaging-factor fallback, staged-policy record).
  const offerTerm = selectedOffers[0] || RECOMMENDED.offerTerm;
  // Per-product rate-flexibility (bps) — each offer/packaging product carries
  // its OWN dual-range slider [low, high] (a discount band with lower + upper
  // bounds), consistent with the If-What optimizer's range-based OFFER section.
  const DEFAULT_FLEX_RANGE = [RECOMMENDED.offerCeilingBps - 15, RECOMMENDED.offerCeilingBps + 15];
  const [productFlexMap,    setProductFlexMap]    = useState(() =>
    Object.fromEntries(OFFER_PRODUCTS.map((p) => [p.id, [...DEFAULT_FLEX_RANGE]]))
  );
  const setProductRange = (id, low, high) => setProductFlexMap((cur) => ({ ...cur, [id]: [low, high] }));
  // Midpoint of a product's discount band — the point the single-policy sim
  // prices against.
  const flexMid = (id) => {
    const r = productFlexMap[id];
    return Array.isArray(r) ? Math.round((r[0] + r[1]) / 2) : (r ?? RECOMMENDED.offerCeilingBps);
  };
  // Blended discount (bps) + blended packaging factor across the selected products.
  const offerCeilingBps = selectedOffers.length
    ? Math.round(selectedOffers.reduce((a, id) => a + flexMid(id), 0) / selectedOffers.length)
    : RECOMMENDED.offerCeilingBps;
  const blendedTermFactor = selectedOffers.length
    ? selectedOffers.reduce((a, id) => a + ((OFFER_PRODUCTS.find((p) => p.id === id) || OFFER_PRODUCTS[0]).factor), 0) / selectedOffers.length
    : 1;
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

  const toggleCohort = (id) => setCohortPresets((cur) =>
    cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((p) => p !== id)) : [...cur, id]
  );

  const toggleChannel = (id) => setChannels((cur) =>
    cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]
  );

  // ---- Off-default detection (for amber value-badge highlight) ----
  const off = (k, v) => v !== RECOMMENDED[k];
  const channelsOffDefault = channels.length !== RECOMMENDED.channels.length ||
    channels.some((c) => !RECOMMENDED.channels.includes(c));

  // ---- Live outcomes (config + results both read this) ----
  // Pilot params come from PILOT_DEFAULTS — they're not levers in this
  // workspace; Deploy owns them downstream when configuring the RCT.
  const outcomes = useMemo(() => simulateOutcomes({
    minBalanceK, offerCeilingBps, offerTerm, termFactor: blendedTermFactor, channels,
    holdoutPct:    PILOT_DEFAULTS.holdoutPct,
    pilotDuration: PILOT_DEFAULTS.pilotDuration,
    cohortPresets,
    bankingServices, triggerWindowDays,
  }), [minBalanceK, offerCeilingBps, offerTerm, blendedTermFactor,
       channels, cohortPresets,
       bankingServices, triggerWindowDays]);

  // ---- Results snapshot (taken on Run, frozen until next Run) ----
  const [results, setResults] = useState(null);

  // ---- Run / Loader / Stage handlers ----
  const onRun = useCallback(() => {
    setMode("running");
    pushAgentEvent({
      kind: "info",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot · running growth-capture bind simulation"
        : "What-If growth-capture bind simulation kicked off · 8-week horizon",
    });
  }, [pushAgentEvent, tuneMode]);

  const onLoaderComplete = useCallback(() => {
    const o = outcomes;
    const verdict = computeVerdict({
      retainedOk:      o.retainedM >= 25,
      runoffOk:        o.runoffReductionPp >= 0.05,
      udaapOk:         o.udaapOk,
      profitabilityOk: o.profitabilityOk,
    });
    setResults({
      verdict,
      playKey: Date.now(),
      outcomes: o,
      offerCeilingBps,
    });
    setMode("results");
    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: `What-If converged · +$${o.retainedM.toFixed(0)}M incremental Yr-1 revenue · conversion ${(o.runoffWithPolicy * 100).toFixed(1)}%`,
    });
  }, [outcomes, pushAgentEvent, offerCeilingBps]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);
  const onBackToConfig = useCallback(() => { setResults(null); setMode("config"); }, []);

  const onStage = useCallback(() => {
    const stagedAt = Date.now();
    const policy = {
      id: `p-${stagedAt}`,
      name: SMBGROWTH_HYPOTHESIS_TITLE,
      hypothesis: activeHypId,
      cluster: "smb-growth-expansion",
      themeId: "smbgrowth",
      experimentType: "smbgrowth",
      minBalanceK, offerCeilingBps, offerTerm, channels,
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
          "Off-us / insurtech placers + scaling multi-location — the expansion segments actively placing coverage elsewhere",
          "75 bps rate discount · bundled packaging — binds inside the rate-adequacy floor",
          "Broker/Agent + direct digital instant-quote + referral UW — large expansions led by a broker, the rest scaled digitally",
        ],
        scenarios: 96400,
      });
    }

    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot staged Small Commercial growth-capture policy for Deploy"
        : "Small Commercial growth-capture policy staged for Deploy",
    });

    setIntermezzo(tuneMode === "autopilot" ? "staged-autopilot" : "staged-guided");
    setTimeout(() => {
      setIntermezzo(null);
      navWorkspace("deploy");
    }, 1500);
  }, [
    activeHypId, minBalanceK, offerCeilingBps, offerTerm,
    channels, cohortPresets,
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
    setProductFlexMap(Object.fromEntries(OFFER_PRODUCTS.map((p) => [p.id, [...DEFAULT_FLEX_RANGE]])));
    setSelectedOffers([RECOMMENDED.offerTerm]);
    setChannels(RECOMMENDED.channels);
    setCohortPresets(["full"]);
    setBankingServices(RECOMMENDED.bankingServices);
    setTriggerWindowDays(RECOMMENDED.triggerWindowDays);
  }, []);

  // ---- Cohort-preset label (joins multi-selection) ----
  const COHORT_DISPLAY = {
    "full": "Full cohort",
    "rate-driven": "Expansion-ready",
    "mid-sensitive": "Scaling multi-location",
    "high-value": "Fleet / equipment-heavy",
    "relationship": "Off-us / insurtech placers",
    "multi-product": "Multi-line",
  };
  const cohortLabel = cohortPresets.length === 1
    ? COHORT_DISPLAY[cohortPresets[0]] || cohortPresets[0]
    : `${cohortPresets.length} cohorts`;

  if (explorationMode === "ifwhat") {
    return <SmbGrowthIfWhatView />;
  }

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
    <div className="sim-ws sim-ws-single test-journey" style={{ "--acc": SMBGROWTH_CONFIG.accent, "--acc-soft": SMBGROWTH_CONFIG.accent + "22" }}>
      {/* ============ HEADER ============ */}
      <header className="sim-ws-header">
        <div className="test-journey-eyebrow">TESTING · {PAGE_SUBTITLE.toUpperCase()}</div>
        <div className="sim-ws-header-row">
          <h1 className="sim-ws-title">{PAGE_SUBTITLE}</h1>
          <div className="sim-ws-header-meta" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "inline-flex", background: "var(--bg-2)", padding: "3px", borderRadius: "999px", border: "1px solid var(--hair)" }}>
              <button
                type="button"
                className={"tj-btn " + (explorationMode !== "ifwhat" ? "tj-btn-primary" : "tj-btn-ghost")}
                style={{ borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: 700 }}
                onClick={() => setExplorationMode("whatif")}
              >
                WHAT-IF
              </button>
              <button
                type="button"
                className={"tj-btn " + (explorationMode === "ifwhat" ? "tj-btn-primary" : "tj-btn-ghost")}
                style={{ borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: 700 }}
                onClick={() => setExplorationMode("ifwhat")}
              >
                IF-WHAT
              </button>
            </div>
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
          {outcomes.eligibleN.toLocaleString()} accounts actionable after the expansion-signal gate ·{" "}
          stickiness threshold fixed at 0.55 · price floor enforced per account.
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
              after expansion-signal gate ({Math.round((outcomes.eligibleN / outcomes.cohortTotal) * 100)}% of cohort)
            </span>
          </div>
        </div>
        <div className={"sim-config-strip-guard " + (outcomes.udaapOk ? "is-safe" : "is-breach")}>
          <span className="sim-config-strip-guard-dot" />
          <span className="sim-config-strip-guard-l">Pricing-consistency margin</span>
          <span className="sim-config-strip-guard-v">{outcomes.udaapMargin.toFixed(2)}</span>
          <span className="sim-config-strip-guard-vs">vs 0.85 floor</span>
        </div>
      </div>

      {/* ============ LEVER PANEL · 6 sections ============ */}
      <section className="panel sim-ws-col sim-ws-levers sim-ws-levers-full">

        {/* Section 1 · CUSTOMER (violet accent) — Cohort preset + segment builder */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">1</div>
            <div className="sim-lever-section-name">CUSTOMER</div>
            <div className="sim-lever-section-meta">Which businesses the growth-capture quote reaches — tick a scope or specific segments</div>
          </div>
          <div className="sim-lever-fieldset" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {[
              { id: "full",            count: 38400, signature: "Select-all · every account in the expansion cohort." },
              { id: "relationship",    count: 12400, signature: "New off-us placement / prior-carrier switch · coverage leaving the account." },
              { id: "mid-sensitive",   count:  9200, signature: "New location + rising payroll · BOP + WC need." },
              { id: "high-value",      count:  7600, signature: "Fleet increase · Commercial Auto fit." },
            ].map((c) => {
              const name = c.id === "full" ? "Full cohort"
                         : c.id === "relationship" ? "Off-us / insurtech placers"
                         : c.id === "mid-sensitive" ? "Scaling multi-location"
                         : "Fleet / equipment-heavy";
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
                    <span><b>{(c.count / 1000).toFixed(0)}K</b> accounts</span>
                  </div>
                  <div className="sim-cohort-card-sig">{c.signature}</div>
                </label>
              );
            })}
          </div>
          {/* Conversational AI Cohort Builder (Commercial) */}
          <ConversationalCohortBuilder
            isCommercial={true}
            isAutopilot={isAutopilot}
            onApplyCohort={(customCohort) => {
              setCohortPresets(["relationship"]);
            }}
          />
        </div>

        {/* Section 2 · ELIGIBILITY (violet accent) — Who in the cohort qualifies */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">2</div>
            <div className="sim-lever-section-name">ELIGIBILITY</div>
            <div className="sim-lever-section-meta">Which accounts in the cohort qualify for the growth-capture quote</div>
          </div>

          <LeverRow
            label="Min premium to qualify ($K)"
            caption="The minimum annual premium the account must carry to qualify. A higher floor narrows the pool to accounts worth the underwriting cost."
            value={`$${minBalanceK}K`}
            offDefault={off("minBalanceK", minBalanceK)}
          >
            <RangeWithBubble min={5} max={250} step={5} value={minBalanceK}
              onChange={(e) => setMinBalanceK(+e.target.value)} disabled={isAutopilot}
              formatter={(v) => `$${v}K`} />
            <RangeScale marks={["$5K", "$75K", "$250K"]} />
          </LeverRow>

        </div>

        {/* Section 3 · OFFER (amber accent) — What the offer is */}
        <div className="sim-lever-section sim-lever-section-policy">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">3</div>
            <div className="sim-lever-section-name">OFFER</div>
            <div className="sim-lever-section-meta">What we quote in front of the account</div>
          </div>

          <LeverRow
            label="Packaging & rate discount"
            caption="Select the offers to put in front of the account — each selected product reveals its OWN rate-discount slider (how deep a discount off filed rate its quote gives to win the bind). Multiple products blend into the quoted offer; a richer bundle binds and attaches more, a deeper discount binds more but gives up margin, held to adequacy."
            value={`${selectedOffers.length} of ${OFFER_PRODUCTS.length}`}
            offDefault={selectedOffers.length !== 1 || selectedOffers[0] !== RECOMMENDED.offerTerm}
          >
            <div className="iw-objectives">
              {OFFER_PRODUCTS.map((p) => {
                const selected = selectedOffers.includes(p.id);
                const rng = Array.isArray(productFlexMap[p.id]) ? productFlexMap[p.id] : DEFAULT_FLEX_RANGE;
                return (
                  <div
                    key={p.id}
                    className={"iw-objective" + (selected ? " is-selected" : "")}
                    style={{ flexDirection: "column", alignItems: "stretch", gap: 10, padding: 12 }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", width: "100%" }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOffer(p.id)}
                        disabled={isAutopilot}
                      />
                      <span className="iw-objective-body">
                        <span className="iw-objective-l">{p.label}</span>
                        <span className="iw-objective-d">{p.sub}</span>
                      </span>
                    </label>
                    {selected && (
                      <div style={{ paddingLeft: 26, paddingTop: 6, borderTop: "1px solid var(--hair)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontFamily: "var(--ui)", color: "var(--ink-2)", marginBottom: 6 }}>
                          <span>Rate discount range (off filed)</span>
                          <span style={{ fontWeight: 700, color: "var(--acc, #10b981)" }}>{rng[0]}–{rng[1]} bps off</span>
                        </div>
                        <DualRange
                          min={10} max={120} step={5} unit=" bps"
                          low={rng[0]} high={rng[1]}
                          onChange={({ low, high }) => setProductRange(p.id, low, high)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </LeverRow>
        </div>

        {/* Section 4 · EXPANSION NUDGES (green accent) — Relationship/servicing
            actions we attach to a re-bundle to deepen the relationship and pull
            the operating flows on-us. Each maps to a real servicing action. */}
        <div className="sim-lever-section sim-lever-section-products">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">4</div>
            <div className="sim-lever-section-name">EXPANSION NUDGES</div>
            <div className="sim-lever-section-meta">Account actions we attach to deepen the account and lower the blended loss ratio</div>
          </div>

          <LeverRow
            label="Nudge enrollment"
            caption="Each nudge is a real account action — a multi-line bundle credit, an expansion-review opt-in, or a telematics safety credit. Multiple nudges compound but with diminishing returns past 3."
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
            label="Expansion-signal window"
            caption="How many days of expansion signal before the competitor writes the growth to fire the quote. 60d is the sweet spot — earlier and the signal hasn't formed; later and the coverage has already gone off-us."
            value={`${triggerWindowDays}d window`}
            offDefault={triggerWindowDays !== RECOMMENDED.triggerWindowDays}
          >
            <RangeWithBubble
              min={30} max={90} step={15} value={triggerWindowDays}
              onChange={(e) => setTriggerWindowDays(+e.target.value)}
              disabled={isAutopilot}
              formatter={(v) => `${v}d window`}
            />
            <RangeScale marks={["30d", "60d", "90d"]} />
          </LeverRow>
        </div>

        {/* Section 5 · CHANNEL (green accent) — How it reaches the account */}
        <div className="sim-lever-section sim-lever-section-comms">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">5</div>
            <div className="sim-lever-section-name">CHANNEL</div>
            <div className="sim-lever-section-meta">How the quote reaches the account - pick one or more</div>
          </div>

          <LeverRow
            label="Delivery channels"
            caption="Account receives the quote via the channels you select. More channels means broader reach but more fatigue risk."
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

        {/* Section 6 · SIMULATION DURATION — model horizon every result is
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
   WITH CHARTS + per-segment recommendation micro-segment table.

   Same staged-reveal timing as the template: verdict @0, KPIs @200,
   chart/tiles @600, micro-segments @900, actions @4400.
   ========================================================================= */
function ResultsReveal({ results, onReRun, onStage }) {
  const { explorationMode, setExplorationMode } = useAppShell();
  const { verdict, playKey, outcomes } = results;
  const o = outcomes;

  // Config-driven per-segment recommendation. The commercial "value" is
  // Incr. NWP / acct / yr; each segment's rate discount (bps off filed) and
  // effective rate come FROM the selected offer configuration — bps = the
  // chosen offer's discount ceiling × the segment's own offerFrac (elasticity),
  // so a deeper/looser offer moves every segment's discount, effective rate,
  // and NWP together.
  const cfgBps = results.offerCeilingBps != null ? results.offerCeilingBps : RECOMMENDED.offerCeilingBps;
  const configuredSegments = useMemo(
    () => configureGrowthSegments(cfgBps, RECOMMENDED.offerCeilingBps),
    [cfgBps]
  );

  const [showVerdict, setShowVerdict] = useState(false);
  const [showKpis,    setShowKpis]    = useState(false);
  const [showChart,   setShowChart]   = useState(false);
  const [showSegs,    setShowSegs]    = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [progress,    setProgress]    = useState(0);
  const timersRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    setShowVerdict(false); setShowKpis(false); setShowChart(false); setShowSegs(false); setShowActions(false);
    setProgress(0);
    const t = (ms, fn) => { const id = setTimeout(fn, ms); timersRef.current.push(id); };
    t(0,    () => setShowVerdict(true));
    t(200,  () => setShowKpis(true));
    t(600,  () => setShowChart(true));
    t(900,  () => setShowSegs(true));
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
  // Revenue-shaped 8-week curve for the area chart (reuses ResultTileNII which
  // reads `outcomes.NII_8wk_M` and synthesises a CI cone). We map "incremental
  // revenue accumulated over the 8-week horizon" into the same field —
  // ~8/52 of annual.
  const tileOutcomes = { NII_8wk_M: o.retainedM * (8 / 52) };

  // For the cross-sell-conversion bar: base vs the achieved conversion (pp).
  const conversionBasePct   = o.runoffBau * 100;
  const conversionPolicyPct = o.runoffWithPolicy * 100;
  // For primacy-attach bar: pp attached per week (lags 3 wks then ramps).
  const ddRecPerWk          = o.ddRecoveryPp / 8;

  // Cohort donut segments by expansion archetype (4 to match the template; sums to 100)
  const cohortSegments = [
    { id: "hi",  label: "Off-us / insurtech placers", pct: 38, color: "var(--acc, #4fd1c5)" },
    { id: "mid", label: "Scaling multi-location",     pct: 33, color: "var(--violet, #b794f6)" },
    { id: "anc", label: "Fleet / equipment-heavy",    pct: 21, color: "var(--cyan, #4fd1c5)" },
    { id: "ws",  label: "Watch / hold (no quote)",    pct:  8, color: "var(--ink-3)" },
  ];

  return (
    <div className="results-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button className="tj-btn tj-btn-ghost" onClick={onReRun}>
          <Icon name="arrowLeft" size={14} /> Tune levers and re-run
        </button>
        <div style={{ display: "inline-flex", background: "var(--bg-2)", padding: "3px", borderRadius: "999px", border: "1px solid var(--hair)" }}>
          <button
            type="button"
            className={"tj-btn " + (explorationMode !== "ifwhat" ? "tj-btn-primary" : "tj-btn-ghost")}
            style={{ borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: 700 }}
            onClick={() => setExplorationMode("whatif")}
          >
            WHAT-IF
          </button>
          <button
            type="button"
            className={"tj-btn " + (explorationMode === "ifwhat" ? "tj-btn-primary" : "tj-btn-ghost")}
            style={{ borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: 700 }}
            onClick={() => setExplorationMode("ifwhat")}
          >
            IF-WHAT
          </button>
        </div>
      </div>
      {/* HEADER — Verdict + Proof KPIs together = "the answer" */}
      <section className={`panel results-header reveal ${showVerdict ? "in" : ""}`}>
        <Verdict verdict={verdict} />
        <div className={`proof-kpis reveal ${showKpis ? "in" : ""}`}>
          <div className="proof-kpis-h">
            <span className="stag">PROOF KPIs</span>
            <span className="stt">Simulated outcomes vs pre-policy baseline (status quo)</span>
          </div>
          <div className="proof-kpis-grid">
            <ProofKpi
              label="Incremental Yr-1 NWP"
              value={`+$${o.retainedM.toFixed(0)}M`}
              valueCap="/ yr"
              baseline="$0"
              baselineCap="coverage leaves the account"
              delta={`+$${o.retainedM.toFixed(0)}M`}
              deltaTone="good"
              hit={o.retainedM >= 25 ? "ok" : o.retainedM >= 15 ? "warn" : "miss"}
            />
            <ProofKpi
              label="Quote-to-bind conversion"
              value={`${(o.runoffWithPolicy * 100).toFixed(1)}%`}
              valueCap="with policy"
              baseline={`${(o.runoffBau * 100).toFixed(1)}%`}
              baselineCap="today, no quote"
              delta={`+${(o.runoffReductionPp * 100).toFixed(1)}pp`}
              deltaTone="good"
              hit={o.runoffReductionPp >= 0.05 ? "ok" : "warn"}
            />
            <ProofKpi
              label="Lines per account"
              value={`+${o.productsPerRelLift.toFixed(1)}`}
              valueCap="cross-line lift"
              baseline="1.7"
              baselineCap="today"
              delta={`+${o.productsPerRelLift.toFixed(1)}`}
              deltaTone="good"
              hit="ok"
            />
          </div>
        </div>
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
              <span className="sim-guardrail-pill-l">Rate adequacy</span>
              <span className="sim-guardrail-pill-d">net annualised +${(o.netAnnualisedK / 1000).toFixed(1)}M</span>
            </span>
            <span className={"sim-guardrail-pill " + (o.udaapOk ? "sim-guardrail-pass" : "sim-guardrail-fail")}>
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Pricing consistency</span>
              <span className="sim-guardrail-pill-d">margin {o.udaapMargin.toFixed(2)} vs 0.85 floor</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Loss-ratio limit · enforced</span>
              <span className="sim-guardrail-pill-d">appetite within risk selection</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Model risk · approved</span>
              <span className="sim-guardrail-pill-d">win-probability model stable</span>
            </span>
          </div>
        </div>
      </section>

      {/* SIMULATED OUTCOMES · 2×2 grid — SVG charts */}
      <section className={`panel reveal ${showChart ? "in" : ""}`}>
        <div className="sim-result-grid">
          <ResultTileNII
            outcomes={tileOutcomes}
            progress={progress}
            title="Incremental NWP accumulation"
            subhead="cumulative over 8-wk pilot · vs $0 baseline (coverage leaves the account)"
            insight="Most binds land inside the first 4 weeks — accounts quoted early, before the competitor writes the expansion, bind back. Extending the pilot adds little new NWP."
          />
          <ResultTileBars
            title="Quote-to-bind conversion: base vs best"
            subhead={`rises from ${(o.runoffBau*100).toFixed(1)}% base to ${(o.runoffWithPolicy*100).toFixed(1)}% with policy`}
            steady={conversionPolicyPct / 8}
            baselinePerWk={conversionBasePct / 8}
            progress={progress}
            format={(n) => `${n.toFixed(2)}pp`}
            rampWeeks={2}
            seed={11}
            numbers={[
              { k: "base bind rate (do-nothing)", v: `${(o.runoffBau * 100).toFixed(1)}%` },
              { k: "achieved bind rate (policy)", v: `${(o.runoffWithPolicy * 100).toFixed(1)}%` },
              { k: "8-wk incremental NWP",        v: `+$${o.retainedM.toFixed(0)}M` },
            ]}
            insight="The first two weeks lag — accounts need the quote to land before bind rate lifts. Full effect from week 3."
            accent="var(--acc, #4fd1c5)"
          />
          <ResultTileBars
            title="Cross-line attach / wk"
            subhead="additional lines bound onto the account by the bundle attach"
            steady={ddRecPerWk}
            baselinePerWk={0}
            progress={progress}
            format={(n) => `${n.toFixed(2)}pp`}
            rampWeeks={4}
            seed={23}
            numbers={[
              { k: "steady rate / wk",      v: `${ddRecPerWk.toFixed(2)}pp` },
              { k: "8-wk total",            v: `+${o.ddRecoveryPp}pp` },
              { k: "lines / account", v: `+${o.productsPerRelLift.toFixed(1)}` },
            ]}
            insight="Attached lines lag the quote by ~3 weeks — accounts add WC, auto and umbrella once the bundle is set up. Concentrated in weeks 6–8."
            accent="var(--violet, #b794f6)"
          />
          <ResultTileCohort
            segments={cohortSegments}
            treatedN={o.treatmentN}
            caption={`${cohortSegments[0].label} + ${cohortSegments[1].label} account for ${cohortSegments[0].pct + cohortSegments[1].pct}% · the two largest expansion archetypes`}
            insight="Most of the value comes from the off-us / insurtech placers segment — the slice the win-probability model prices most precisely."
          />
        </div>
      </section>

      {/* PER-SEGMENT RECOMMENDATION · micro-segment table grafted after the
          charts. Reuses the b2b-segtable / b2b-segrow / b2b-segcard JSX from
          MicroSegmentResults (sans its headline, which the verdict + proof
          KPIs above already cover). */}
      <section className={`panel reveal ${showSegs ? "in" : ""}`}>
        <MicroSegmentTable
          segmentColumns={SMBGROWTH_SEGMENT_COLUMNS}
          microSegments={configuredSegments}
        />
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

export function MicroSegmentTable({ segmentColumns, microSegments }) {
  const firstGo = microSegments.find((s) => s.tone === "go") || microSegments[0];
  const [selId, setSelId] = useState(firstGo ? firstGo.id : null);
  const toggle = (id) => setSelId((cur) => (cur === id ? null : id));
  const selected = microSegments.find((s) => s.id === selId) || null;

  const renderCell = (seg, col) => {
    const val = seg[col.id];

    if (col.id === "conv") {
      if (seg.convBase != null) {
        return (
          <span className="b2b-seg-cell">
            <span className="b2b-seg-conv">{seg.conv + "%"}</span>{" "}
            <span className="b2b-seg-conv-base">{"vs " + seg.convBase + "%"}</span>
          </span>
        );
      }
      if (val === "—" || val == null) {
        if (seg.tone === "hold") return <span className="b2b-seg-tag hold">Hold</span>;
        if (seg.tone === "blocked") return <span className="b2b-seg-tag blocked">Blocked</span>;
        return <span className="b2b-seg-cell">—</span>;
      }
      return <span className="b2b-seg-conv">{val}</span>;
    }

    if ((val === "—" || val == null) && col.id === segmentColumns[0].id) {
      if (seg.tone === "hold") return <span className="b2b-seg-tag hold">Hold</span>;
      if (seg.tone === "blocked") return <span className="b2b-seg-tag blocked">Blocked</span>;
    }

    return <span className="b2b-seg-cell">{val == null ? "—" : val}</span>;
  };

  return (
    <section className="aw-chapter">
      <div className="aw-chapter-h">
        <div className="aw-chapter-accent" />
        <div className="aw-chapter-text">
          <div className="aw-chapter-title">
            Per-segment recommendation · one cohort, many right answers
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
            className={"b2b-segrow " + seg.tone + (selId === seg.id ? " sel" : "")}
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
  );
}
