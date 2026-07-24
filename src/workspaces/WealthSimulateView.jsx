/* ============================================================================
   WealthSimulateView — Affluent / Wealth-Attach Simulate workbench.

   Structural twin of LiquiditySimulateView.jsx, re-domained to wealth attach:
     - 6 lever sections (COHORT / ELIGIBILITY / WEALTH MOTION / ATTACHED
       SERVICES / CHANNEL / SIMULATION DURATION)
     - Single-column lever layout
     - Sticky config strip with fair-treatment (suitability) margin in the
       central pill slot
     - PriorAnchorPill reads MOCK_EXPERIMENTS for hypothesis anchors
     - Results: verdict + SegmentedResults (KPIs + charts) + guardrail pills
     - Stage for Deploy → intermezzo → navWorkspace("deploy")
     - Autopilot cinematic: T+1500 auto-run, T+3500 auto-stage

   What-If only — the If-What optimizer branch lives in WealthIfWhatView.

   POSITIONING (the hard rule): the optimization objective is NEW WEALTH-
   RELATIONSHIP CONVERSION. AUM + fee revenue are DOWNSTREAM. The wealth
   motion (portfolio review / senior-FA / …) is the Twin's recommended
   STARTING POINT, never the prescribed answer.
   ========================================================================= */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "@/state/AppShell";
import { useSetPageContext } from "@/state/pageContext";
import SimulationLoader from "@/components/loaders/SimulationLoader";
import Icon from "@/components/Icon";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import SegmentedResults from "@/components/SegmentedResults";
import { WEALTH_SEGMENTS, deriveSegments, PRODUCT_MARKET } from "@/data/segmentModels";

/* Cohort sizes (mirror the CUSTOMER cards) — the engine splits these across the
   micro-segments and filters by what the user selected. Counts sum to
   WEALTH_CALIBRATION.eligibleAfterGate (6,200). */
const WEALTH_SEG_MODEL = {
  segments: WEALTH_SEGMENTS,
  cohortCounts: { "relationship-deep": 1700, "high-aum": 1100, "digital": 1500, "branch-trust": 1100, "early-stage": 800 },
  heldBackLabel: "Aspirational savers · held out by suitability gate",
  heldBackShare: 0.05,
};
import RangeWithBubble from "@/components/RangeWithBubble";
import CustomSegmentBuilder from "@/components/CustomSegmentBuilder";
import { RULE_ATTRS } from "@/data/customSegment";
import { MOCK_EXPERIMENTS } from "@/workspaces/LearnWorkspace";
import WealthIfWhatView from "@/workspaces/WealthIfWhatView";
import {
  WEALTH_HYPOTHESIS_ID,
  WEALTH_HYPOTHESIS_TITLE,
  WEALTH_CALIBRATION,
  wealthHypothesis,
} from "@/data/wealthConfig";

const PAGE_SUBTITLE = WEALTH_HYPOTHESIS_TITLE;

/* Twin's recommended wealth-attach levers — autopilot anchor + reset target.
   Prefilled to test the "convert advice-ready into wealth relationships" policy
   as written on the signal card.

   What the policy IS (these are levers):
     - Min investable assets to qualify · advice-readiness window
     - Primary wealth motion · attached services
     - Delivery channel

   What goes elsewhere:
     - Pilot duration / holdout % / auto-rollback → Deploy's RCT setup
       (measurement decisions made at launch, not the policy under test)
     - Advisor scheduling, tone, frequency → operational detail */
const RECOMMENDED = {
  minInvestableK:     100,                               // $100K investable-assets floor
  motion:             "portfolio_review",               // Twin's recommended STARTING POINT (not the answer)
  channels:           ["app", "email", "fa"],           // multi-select
  attachedServices:   [],                               // default off; layer in to raise activation
  readinessWindowDays: 60,                              // advice-readiness window
};

/* ----------------------------------------------------------------------------
   Attached services the bank can layer onto a wealth motion to raise activation
   and follow-through. Each is an actual servicing action — not a behavioural
   target.
---------------------------------------------------------------------------- */
const ATTACHED_SERVICES = [
  { id: "auto_followup",       label: "Auto-schedule FA follow-up",     sub: "Books the next advisor touch automatically after the first conversation · keeps the relationship warm" },
  { id: "retirement_checkup",  label: "Retirement-readiness checkup",   sub: "Attaches a structured retirement / rollover review to the motion · meets a concrete advice-need" },
  { id: "rollover_concierge",  label: "Rollover concierge",             sub: "Hands-on transfer assistance for held-away assets · removes the friction that stalls funding" },
];

/* ----------------------------------------------------------------------------
   Primary wealth motion · radio cards, single-select. The motion is one allowed
   MOVE, not the objective. `factor` scales conversion relative to the
   recommended portfolio review (= 1.00). senior_fa converts higher per-contact
   but is capacity-bound — see the senior-FA capacity guardrail in
   simulateOutcomes.
---------------------------------------------------------------------------- */
const MOTIONS = [
  { id: "portfolio_review", label: "Portfolio review",        sub: "Twin's recommended starting point · a relationship-led review converts everyday trust at scale", factor: 1.00 },
  { id: "senior_fa",        label: "Senior FA 1:1",           sub: "Highest per-contact conversion · but scarce senior-advisor capacity caps total throughput",      factor: 1.12 },
  { id: "banker_handoff",   label: "Banker→FA handoff",       sub: "Warm hand-off from an existing banker relationship · lands well on branch-trust households",      factor: 1.05 },
  { id: "education",        label: "Educational nudge",       sub: "Low-touch nurture · slower to convert, right for low-intent early-stage affluent",                factor: 0.55 },
  { id: "digital_starter",  label: "Digital wealth starter",  sub: "Self-serve digital onboarding · scales broadly, escalates the ones who lean in",                  factor: 0.70 },
];

/* ----------------------------------------------------------------------------
   Delivery channels · multi-select checkboxes.
---------------------------------------------------------------------------- */
const CHANNEL_OPTIONS = [
  { id: "app",     label: "App notification" },
  { id: "email",   label: "Email" },
  { id: "fa",      label: "FA outreach" },
  { id: "banker",  label: "Banker outreach" },
  { id: "branch",  label: "Branch" },
  { id: "phone",   label: "Phone", sub: "Reserved for advisor follow-up — not initial outreach" },
];

/* Pilot-design defaults used at staging time (Deploy owns these downstream;
   here they just produce sensible simulation results). 12-week duration,
   20% holdout (80/20 RCT). */
const PILOT_DEFAULTS = {
  pilotDuration: 8,   // 8-week test window; headline value is the 12-month projection
  holdoutPct:    20,   // 80/20 RCT split
  rollbackOn:    true,
};

/* ----------------------------------------------------------------------------
   simulateOutcomes — wealth-attach lever → outcome chain.

   Anchors at recommended defaults (per WEALTH_CALIBRATION):
     - eligibleAfterGate = 6,200  (out of 18.4K flagged, gated by suitability < 0.55)
     - treatmentN/controlN = 4,960 / 1,240  (80/20)
     - New wealth relationships = 267  (PRIMARY)
     - Incremental AUM = +$64M  (267 × $240K)
     - Conversion 4.3% · funded 62% · 710 appointments · +$320K fee (downstream)
     - External flight: 18% (BAU) → 13.5% (with policy) → −4.5pp
     - Fair-treatment margin = 0.94 (held by the suitability gate)
     - Complaints delta = +28 / qtr
     - Senior-FA capacity: throughput capped at seniorFaSlotCap (600) when the
       senior-FA motion / advisor channels over-route the pilot.
---------------------------------------------------------------------------- */
function simulateOutcomes(opts) {
  const C = WEALTH_CALIBRATION;
  const {
    minInvestableK, motion, motionFactor: motionFactorOpt,
    channels, holdoutPct, pilotDuration,
    cohortPresets, customBase,
    attachedServices = [], readinessWindowDays = 60,
  } = opts;

  /* Multi-select cohort: sum the bases of the selected cohorts. Picking "All
     advice-ready" supersedes the others. A fetched custom segment (customBase)
     REPLACES the preset base entirely. */
  const COHORT_COUNTS = {
    "all":                C.eligibleAfterGate,    // 6,200 advice-ready
    "relationship-deep":  1700,
    "high-aum":           1100,
    "digital":            1500,
    "branch-trust":       1100,
    "early-stage":         800,
  };
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  const presetBase = customBase != null
    ? customBase
    : list.includes("all")
      ? C.eligibleAfterGate
      : list.reduce((s, id) => s + (COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;

  /* Eligibility scaling — a higher min-investable floor cuts the eligible pool.
     Cohort selection already encodes the advice-readiness signals upstream. */
  const balanceFactor = Math.max(0.5, 1 - (minInvestableK - RECOMMENDED.minInvestableK) * 0.0009);
  const eligibleN = Math.round(presetBase * Math.max(0.4, Math.min(1.4, balanceFactor)));

  /* Motion factor: pulled from the MOTIONS table so adding a new motion doesn't
     require math updates here. */
  const motionFactor = motionFactorOpt != null ? motionFactorOpt
    : (MOTIONS.find((m) => m.id === motion) || MOTIONS[0]).factor;

  /* Treatment / control split (80/20 default). */
  const treatmentN = Math.round(eligibleN * (1 - holdoutPct / 100));
  const controlN   = eligibleN - treatmentN;

  /* Channel reach factor — sum of per-channel weights, capped at 1.05 for full
     multi-channel coverage. FA + banker carry the highest per-household lift;
     app + email scale broadly. */
  const channelWeights = { app: 0.30, email: 0.25, fa: 0.45, banker: 0.40, branch: 0.20, phone: 0.25 };
  const channelSum = (channels || []).reduce((s, c) => s + (channelWeights[c] || 0), 0);
  const channelFactor = Math.max(0.45, Math.min(1.05, channelSum / 1.0));

  /* Attached-services factor — each attached service raises activation /
     follow-through. Full 3-service stack ≈ +54% vs none, diminishing past 3. */
  const servicesFactor = 1 + Math.min(0.6, attachedServices.length * 0.18);

  /* Advice-readiness window factor — 60d is the sweet spot. Earlier and the
     advice-need signal hasn't formed; later and the assets have begun moving
     to an external platform. */
  const windowFactor = 1 - Math.abs(readinessWindowDays - 60) / 120;

  /* ── Senior-FA capacity model ──────────────────────────────────────────────
     Advisor demand = treated households routed to an advisor-led conversation.
     The senior_fa motion routes everyone to a senior advisor; advisor-heavy
     channels (fa/banker) also load the queue. When demand exceeds the scarce
     senior-FA slot cap, throughput SATURATES: per-contact conversion is higher,
     but total relationships are capped — so choosing senior_fa alone should not
     beat portfolio_review on total relationships. */
  const advisorChannelLoad = (channels || []).reduce((s, c) => s + (c === "fa" ? 0.55 : c === "banker" ? 0.45 : 0), 0);
  const seniorFaShare = motion === "senior_fa" ? 1.0 : Math.min(0.6, advisorChannelLoad);
  const advisorDemand = treatmentN * C.conversionWithPolicy * seniorFaShare;
  const capacityHit = advisorDemand > C.seniorFaSlotCap;
  // Throughput multiplier ≤ 1: when demand exceeds the cap, the advisor-routed
  // share is throttled back to what the cap can serve.
  const capacityFactor = capacityHit
    ? (1 - seniorFaShare) + seniorFaShare * (C.seniorFaSlotCap / advisorDemand)
    : 1;

  /* Per-treated conversion math — calibrated to hit the anchor at defaults
     (eligibleN 6,200 × 0.043 ≈ 267). The senior_fa per-contact lift (factor
     1.12) is real, but capacityFactor claws it back once the slot cap binds. */
  const conversionWithPolicy = C.conversionWithPolicy
    * channelFactor
    * Math.min(1.3, motionFactor)
    * servicesFactor
    * windowFactor
    * capacityFactor;

  const newRelationships = Math.round(eligibleN * conversionWithPolicy);
  const conversionRate = eligibleN ? newRelationships / eligibleN : 0;

  /* Incremental AUM ($M) = relationships × avg AUM. This is DOWNSTREAM value —
     it follows from the conversion, it is never the headline goal. */
  const incrementalAumM = newRelationships * C.avgAumK / 1000;

  /* External-flight reduction scales with motion strength + channel reach
     (analog of the idle-flight reduction). */
  const runoffWithPolicy = Math.max(
    C.runoffBau - C.runoffReductionPp * channelFactor * Math.min(1.2, motionFactor),
    0.090
  );
  const runoffReductionPp = C.runoffBau - runoffWithPolicy;

  /* Funded rate + appointments + fee revenue (downstream), all anchored to the
     calibration and scaled with conversion strength relative to the anchor. */
  const convScale = C.newRelationships ? newRelationships / C.newRelationships : 1;
  const fundedRate   = C.fundedRate;                                  // 62% funded
  const fundedRel    = Math.round(newRelationships * fundedRate);
  const appointments = Math.round(C.appointments * convScale);        // 710 at anchor
  const feeRevenueK  = Math.round(C.feeRevenueAnnualK * convScale);   // +$320K downstream
  const costPerConvUSD = C.costPerConvUSD;                            // $410

  /* Advisor utilisation — share of the senior-FA slot cap consumed. Caps at
     100% when capacity binds (the capacity model already throttled throughput). */
  const advisorUtil = Math.min(1.0, capacityHit ? 1.0 : C.advisorUtil * (advisorDemand / (C.treatmentN * C.conversionWithPolicy * 0.45)));

  /* Fair-treatment (suitability) margin held constant by the suitability gate
     (0.55 fixed). */
  const udaapMargin = C.udaapMargin;

  /* Complaint delta scales with treatment size + motion intensity. */
  const complaintsDelta = Math.round(
    C.complaintsDelta * (treatmentN / C.treatmentN) * Math.min(1.4, motionFactor)
  );

  /* Net annualised fee revenue (downstream) on the tested cohort — keeps the
     same SHAPE as liquidity's netAnnualisedK. */
  const netAnnualisedK = Math.round(feeRevenueK * convScale);

  /* Profitability / feasibility gates. capacity-feasible flag surfaces the
     senior-FA tradeoff: a plan that over-routes advisors is flagged. */
  const profitabilityOk = netAnnualisedK > 0;
  const udaapOk = udaapMargin >= C.udaapFloor;
  const capacityOk = !capacityHit;

  /* retainedM carries INCREMENTAL AUM ($M) so the segment engine splits AUM. */
  const retainedM = incrementalAumM;

  return {
    eligibleN, treatmentN, controlN,
    newRelationships, conversionRate, incrementalAumM,
    fundedRate, fundedRel, appointments, feeRevenueK, costPerConvUSD,
    advisorUtil, capacityHit, capacityOk,
    runoffBau: C.runoffBau, runoffWithPolicy, runoffReductionPp,
    udaapMargin, udaapOk, profitabilityOk,
    complaintsDelta,
    netAnnualisedK,
    avgAumK: C.avgAumK,
    retainedM,                 // = incrementalAumM, for deriveSegments
    pilotDuration,
    cohortTotal: C.cohortTotal,
  };
}

/* ----------------------------------------------------------------------------
   PriorAnchorPill — reads MOCK_EXPERIMENTS (spread-extended in LearnWorkspace)
   and finds the most recent pilot whose priorAnchorFor includes the current
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
   Verdict — wealth-specific verdict callout.
---------------------------------------------------------------------------- */
function computeVerdict({ relationshipsOk, flightOk, udaapOk, capacityOk }) {
  if (relationshipsOk && flightOk && udaapOk && capacityOk) return "proven";
  if (relationshipsOk && flightOk && (!udaapOk || !capacityOk)) return "mixed";
  return "disproven";
}

function Verdict({ verdict }) {
  if (verdict === "proven") {
    return (
      <div className="verdict-callout verdict-proven">
        <span className="verdict-glyph"><Icon name="check" size={20} strokeWidth={2.5} /></span>
        <div className="verdict-body">
          <div className="verdict-title">SIMULATION SUPPORTS HYPOTHESIS</div>
          <div className="verdict-sub">Conversion in range · suitability margin held · advisor-capacity guardrail clear</div>
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
          <div className="verdict-sub">New relationships in range · suitability margin held · advisor capacity over-routed at this motion mix</div>
        </div>
      </div>
    );
  }
  return (
    <div className="verdict-callout verdict-disproven">
      <span className="verdict-glyph"><Icon name="x" size={20} strokeWidth={2.5} /></span>
      <div className="verdict-body">
        <div className="verdict-title">SIMULATION DOES NOT SUPPORT HYPOTHESIS</div>
        <div className="verdict-sub">New relationships below CI · or suitability basis insufficient at this cohort + motion mix</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   LeverRow — mirrors the shared lever structure (uses same CSS).
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

/* ============================================================================
   WealthSimulateView
   ========================================================================= */
export default function WealthSimulateView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setTuneMode, explorationMode,
    recordDecisionTrace, setIntermezzo,
  } = useAppShell();

  // If-What path: dispatch to the goal-driven optimizer view. The What-If lever
  // workbench below is for free-form lever configuration; If-What asks "given
  // this goal, what's the best policy in these ranges?"
  if (explorationMode === "ifwhat") {
    return <WealthIfWhatView />;
  }

  // Mode state machine
  const [mode, setMode] = useState("config");          // 'config' | 'running' | 'results'
  // (page context published below, once `outcomes` + `results` exist)
  const isAutopilot = tuneMode === "autopilot";

  // Hypothesis id — fall back to the recommended wealth hypothesis if nothing
  // was seeded.
  const activeHypId = selectedHypothesisId || WEALTH_HYPOTHESIS_ID;
  // Seed the workbench from the chosen hypothesis (A/B/C): card B opens
  // pre-weighted to advisor-led motion on the high-AUM cohort, C to the
  // digital-starter motion on the digital cohort. Card A keeps the recommended
  // best-fit defaults (the optimizer decides). Mirrors idle-cash's whatIfOffers.
  const seedHyp = wealthHypothesis(activeHypId);

  // ---- Lever state ----
  const [minInvestableK,    setMinInvestableK]    = useState(RECOMMENDED.minInvestableK);
  const [motion,            setMotion]            = useState(seedHyp.defaultMotion || RECOMMENDED.motion);
  const [channels,          setChannels]          = useState(RECOMMENDED.channels);
  // RECOMMENDED default selects ALL 5 parents (so all 7 micro-segments appear);
  // a narrower hypothesis (B/C) scopes to its own cohort.
  const [cohortPresets,     setCohortPresets]     = useState(seedHyp.cohort || ["all"]);
  const [attachedServices,  setAttachedServices]  = useState(RECOMMENDED.attachedServices);
  const [readinessWindowDays, setReadinessWindowDays] = useState(RECOMMENDED.readinessWindowDays);
  // Simulation duration — own section above the Run button. Default 8wk
  // test window; headline relationships/AUM/fee are the 12-month projection.
  const [simWeeks,          setSimWeeks]          = useState(PILOT_DEFAULTS.pilotDuration);

  const toggleService = (id) => setAttachedServices((cur) =>
    cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
  );

  const toggleCohort = (id) => {
    setUseCustom(false);                                                          // picking a preset clears the custom segment
    setCohortPresets((cur) => {
      if (id === "all") return ["all"];                                          // all advice-ready is exclusive
      const next = cur.includes(id) ? cur.filter((p) => p !== id) : [...cur.filter((p) => p !== "all"), id];
      return next.length ? next : ["all"];                                       // never leave it empty
    });
  };

  // ---- Custom segment builder (rule-defined cohort; REPLACES the presets) ----
  const [customRules, setCustomRules] = useState([]);
  const [customCount, setCustomCount] = useState(null);
  const [useCustom,   setUseCustom]   = useState(false);
  const customBase = useCustom ? customCount : null;

  const toggleChannel = (id) => setChannels((cur) =>
    cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((c) => c !== id)) : [...cur, id]
  );

  // ---- Off-default detection (for accent value-badge highlight) ----
  const off = (k, v) => v !== RECOMMENDED[k];
  const channelsOffDefault = channels.length !== RECOMMENDED.channels.length ||
    channels.some((c) => !RECOMMENDED.channels.includes(c));

  // ---- Motion derived values ----
  const motionFactor = (MOTIONS.find((m) => m.id === motion) || MOTIONS[0]).factor;

  // ---- Live outcomes (config + results both read this) ----
  // Pilot params come from PILOT_DEFAULTS — they're not levers in this
  // workspace; Deploy owns them downstream when configuring the RCT.
  const outcomes = useMemo(() => simulateOutcomes({
    minInvestableK, motion, motionFactor, channels,
    holdoutPct:    PILOT_DEFAULTS.holdoutPct,
    pilotDuration: PILOT_DEFAULTS.pilotDuration,
    cohortPresets, customBase,
    attachedServices, readinessWindowDays,
  }), [minInvestableK, motion, motionFactor, channels, cohortPresets, customBase,
       attachedServices, readinessWindowDays]);

  // ---- Results snapshot (taken on Run, frozen until next Run) ----
  const [results, setResults] = useState(null);

  /* Publish page context for Ask TwinX — on results, carry this configuration's
     live KPIs so answers cite the user's exact run. */
  const _whatifFacts = useMemo(() => (
    mode === "results"
      ? {
          useCase: "wealth",
          verdict: results?.verdict,
          config: { minInvestableK, motion, channels, cohortPresets },
          kpis: {
            incrementalAumM: outcomes.incrementalAumM,
            newRelationships: outcomes.newRelationships,
            conversionPct: +(outcomes.conversionRate * 100).toFixed(1),
            feeRevenueK: outcomes.feeRevenueK,
            flightReductionPp: +(outcomes.runoffReductionPp * 100).toFixed(1),
            eligibleN: outcomes.eligibleN, treatmentN: outcomes.treatmentN, controlN: outcomes.controlN,
          },
        }
      : { useCase: "wealth" }
  ), [mode, results, outcomes, minInvestableK, motion, channels, cohortPresets]);
  useSetPageContext(mode === "results" ? "whatif-results" : "whatif-config", _whatifFacts);

  // ---- Run / Loader / Stage handlers ----
  const onRun = useCallback(() => {
    setMode("running");
    pushAgentEvent({
      kind: "info",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot · running wealth-attach simulation"
        : "What-If wealth-attach simulation kicked off · 8-week test window · 12-month projection",
    });
  }, [pushAgentEvent, tuneMode]);

  const onLoaderComplete = useCallback(() => {
    const o = outcomes;
    const verdict = computeVerdict({
      relationshipsOk: o.newRelationships >= 180,
      flightOk:        o.runoffReductionPp >= 0.020,
      udaapOk:         o.udaapOk,
      capacityOk:      o.capacityOk,
    });
    setResults({
      verdict,
      playKey: Date.now(),
      outcomes: o,
      lever: { cohortPresets, motion, channels, minInvestableK },
    });
    setMode("results");
    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: `What-If converged · +${o.newRelationships} new wealth relationships · +$${o.incrementalAumM.toFixed(0)}M AUM · −${(o.runoffReductionPp * 100).toFixed(1)}pp external flight`,
    });
  }, [outcomes, pushAgentEvent, cohortPresets, motion, channels, minInvestableK]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);
  const onBackToConfig = useCallback(() => { setResults(null); setMode("config"); }, []);

  const onStage = useCallback(() => {
    const stagedAt = Date.now();
    const o = outcomes;
    const policy = {
      id: `p-${stagedAt}`,
      name: PAGE_SUBTITLE,
      hypothesis: activeHypId,
      cluster: "cluster_wealth_attach",
      themeId: "wealth",
      experimentType: "wealth",
      minInvestableK, motion, channels,
      cohortPresets,
      attachedServices, readinessWindowDays,
      // Pilot defaults — Deploy will own these when the user actually configures
      // the RCT. Carried along so the staged-policy record is complete.
      pilotDuration: PILOT_DEFAULTS.pilotDuration,
      holdoutPct:    PILOT_DEFAULTS.holdoutPct,
      rollbackOn:    PILOT_DEFAULTS.rollbackOn,
      stagedBy: tuneMode === "autopilot" ? "autopilot" : "user",
      status: "pending",
      stagedAt,
      /* Projected outcomes — what the engine computed for THIS cohort + motion.
         Drives the live-RCT KPI curves, the cohort split, the value-at-stake
         aggregate, and the Learn realised-vs-predicted grid. The RCT's
         predicted line ramps to exactly these values. */
      projected: {
        cohortLabel: `Advice-ready · $${minInvestableK}K+ investable`,
        eligibleN:  o.eligibleN,
        treatmentN: o.treatmentN,
        controlN:   o.controlN,
        pilotWeeks: PILOT_DEFAULTS.pilotDuration,
        valueAtStakeM: o.incrementalAumM,
        kpis: [
          { key: "aum",       label: "Incremental AUM",         unit: "$M", value: o.incrementalAumM,          tau: 2.4, drift: 0.05 },
          { key: "newrel",    label: "New wealth relationships", unit: "#",  value: o.newRelationships,         tau: 2.2, drift: 0.04 },
          { key: "flight_pp", label: "External flight (Δ pp)",   unit: "pp", value: -(o.runoffReductionPp * 100), tau: 1.8, drift: 0.05 },
          { key: "fee",       label: "Fee revenue (annual)",     unit: "$K", value: o.feeRevenueK,              tau: 2.0, drift: 0.04 },
        ],
      },
    };
    stagePolicy(policy);

    if (tuneMode === "autopilot") {
      recordDecisionTrace({
        hypothesisId: activeHypId,
        policyId: policy.id,
        levers: {
          minInvestableK, motion,
          channels, cohortPresets,
        },
        reasoning: [
          "Suitability-gated cohort at 0.55 — only evidenced advice-need qualifies; the unready and spoken-for are excluded",
          "Portfolio review as the recommended starting motion — converts everyday trust at scale within advisor capacity",
          "App + email + FA — broad scale plus advisor-tier reach, kept under the senior-FA slot cap",
        ],
        scenarios: 96400,
      });
    }

    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot staged wealth policy for Deploy"
        : "Wealth policy staged for Deploy",
    });

    setIntermezzo(tuneMode === "autopilot" ? "staged-autopilot" : "staged-guided");
    setTimeout(() => {
      setIntermezzo(null);
      navWorkspace("deploy");
    }, 1500);
  }, [
    activeHypId, minInvestableK, motion,
    channels, cohortPresets, outcomes,
    attachedServices, readinessWindowDays,
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
    setMinInvestableK(RECOMMENDED.minInvestableK);
    setMotion(RECOMMENDED.motion);
    setChannels(RECOMMENDED.channels);
    setCohortPresets(["all"]);
    setAttachedServices(RECOMMENDED.attachedServices);
    setReadinessWindowDays(RECOMMENDED.readinessWindowDays);
  }, []);

  // ---- Cohort-preset label (joins multi-selection) ----
  const COHORT_DISPLAY = {
    "all": "All advice-ready",
    "relationship-deep": "Advice-ready (relationship-deep)",
    "high-aum": "High-AUM movers",
    "digital": "Digitally-engaged",
    "branch-trust": "Branch-trust",
    "early-stage": "Early-stage affluent",
  };
  const cohortLabel = cohortPresets.length === 1
    ? COHORT_DISPLAY[cohortPresets[0]] || cohortPresets[0]
    : `${cohortPresets.length} cohorts`;

  // ---- Live eligibility count (recomputes as the min-investable slider moves) ----
  // Cohort base from the selected presets; higher min-investable → lower count.
  const ELIG_COHORT_COUNTS = { "relationship-deep": 1700, "high-aum": 1100, "digital": 1500, "branch-trust": 1100, "early-stage": 800 };
  const _cohortBase = useCustom && customCount != null
    ? customCount
    : (cohortPresets.includes("all")
        ? 6200
        : cohortPresets.reduce((s, id) => s + (ELIG_COHORT_COUNTS[id] || 0), 0)) || 6200;
  const _eligFrac = Math.max(0.2, Math.min(1, 1 - ((minInvestableK - 100) * 0.0009)));
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
    <div className="sim-ws sim-ws-single test-journey" style={{ "--acc": "#14b8a6", "--acc-soft": "rgba(20,184,166,.13)" }}>
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
          {outcomes.eligibleN.toLocaleString()} households actionable — only those clearing the suitability gate qualify ·{" "}
          the unready and spoken-for are excluded · fair-treatment guardrail enforced per household.
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
          <span className="sim-config-strip-guard-l">Fair-treatment margin</span>
          <span className="sim-config-strip-guard-v">{outcomes.udaapMargin.toFixed(2)}</span>
          <span className="sim-config-strip-guard-vs">vs 0.85 floor</span>
        </div>
      </div>

      {/* ============ LEVER PANEL ============ */}
      <section className="panel sim-ws-col sim-ws-levers sim-ws-levers-full">

        {/* Section 1 · CUSTOMER — Cohort preset + segment builder */}
        <div className="sim-lever-section sim-lever-section-accent">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">1</div>
            <div className="sim-lever-section-name">CUSTOMER</div>
            <div className="sim-lever-section-meta">Which cohort the motion reaches</div>
          </div>
          <div className="sim-lever-fieldset" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {[
              { id: "all",                count: 6200, signature: "Every selected household clearing the suitability gate with an evidenced advice-need." },
              { id: "relationship-deep",  count: 1700, signature: "Deep everyday banking · clear wealth gap · trust to convert at scale." },
              { id: "high-aum",           count: 1100, signature: "$250K+ investable · external transfers firing now · time-boxed." },
              { id: "digital",            count: 1500, signature: "App-active · engaging retirement / investing content · digital-first." },
              { id: "branch-trust",       count: 1100, signature: "Existing banker trust · a warm banker-to-FA handoff lands best." },
              { id: "early-stage",        count:  800, signature: "Above threshold, low intent · nurture with education before advisor time." },
            ].map((c) => {
              const name = c.id === "all" ? "All advice-ready"
                         : c.id === "relationship-deep" ? "Advice-ready (relationship-deep)"
                         : c.id === "high-aum" ? "High-AUM movers"
                         : c.id === "digital" ? "Digitally-engaged"
                         : c.id === "branch-trust" ? "Branch-trust"
                         : "Early-stage affluent";
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
                    <span><b>{(c.count / 1000).toFixed(1)}K</b> households</span>
                  </div>
                  <div className="sim-cohort-card-sig">{c.signature}</div>
                </label>
              );
            })}
          </div>

          {/* Custom segment builder — a rule-defined cohort that REPLACES the
              preset selection once fetched + used. */}
          <CustomSegmentBuilder
            attrs={RULE_ATTRS.wealth}
            base={6200}
            rules={customRules}
            setRules={setCustomRules}
            count={customCount}
            setCount={setCustomCount}
            active={useCustom}
            onUse={() => setUseCustom(true)}
            onClear={() => setUseCustom(false)}
          />
        </div>

        {/* Section 2 · ELIGIBILITY — Who in the cohort qualifies */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">2</div>
            <div className="sim-lever-section-name">ELIGIBILITY</div>
            <div className="sim-lever-section-meta">Which households in the cohort qualify for the motion</div>
          </div>

          <LeverRow
            label="Min investable assets to qualify"
            caption="Households below this aren't worth advisor time — a wealth recommendation needs a real asset base behind it."
            value={`$${minInvestableK}K`}
            offDefault={off("minInvestableK", minInvestableK)}
          >
            <RangeWithBubble min={50} max={250} step={10} value={minInvestableK}
              onChange={(e) => setMinInvestableK(+e.target.value)} disabled={isAutopilot}
              formatter={(v) => `$${v}K`} />
            <RangeScale marks={["$50K", "$100K", "$250K"]} />
            <div className="elig-tile">
              <span className="elig-tile-v">{eligibleCount.toLocaleString()}</span>
              <span className="elig-tile-l">households qualify at this threshold</span>
            </div>
          </LeverRow>

        </div>

        {/* Section 3 · WEALTH MOTION — the primary move (single-select). The
            motion is one allowed MOVE, not the objective. */}
        <div className="sim-lever-section sim-lever-section-policy">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">3</div>
            <div className="sim-lever-section-name">WEALTH MOTION</div>
            <div className="sim-lever-section-meta">The primary move offered — the Twin's recommended starting point, not the prescribed answer</div>
          </div>

          <LeverRow
            label="Primary wealth motion"
            caption="The objective is the new wealth relationship — the motion is just the move that gets there. Portfolio review is the Twin's recommended starting point; senior-FA converts higher per-contact but is capacity-bound; education and digital scale broadly at a lower conversion."
            value={(MOTIONS.find((m) => m.id === motion) || {}).label}
            offDefault={off("motion", motion)}
          >
            <div className="iw-objectives">
              {MOTIONS.map((m) => {
                const checked = motion === m.id;
                return (
                  <label
                    key={m.id}
                    className={"iw-objective" + (checked ? " is-selected" : "")}
                  >
                    <input
                      type="radio"
                      name="wealth-motion"
                      checked={checked}
                      onChange={() => setMotion(m.id)}
                      disabled={isAutopilot}
                    />
                    <span className="iw-objective-body">
                      <span className="iw-objective-l">
                        {m.label}
                        {m.id === "portfolio_review" && <span className="px-offer-mkt" style={{ marginLeft: 8 }}>recommended starting point</span>}
                      </span>
                      <span className="iw-objective-d">{m.sub}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </LeverRow>
        </div>

        {/* Section 4 · ATTACHED SERVICES — servicing actions we layer onto the
            motion to raise activation and follow-through. */}
        <div className="sim-lever-section sim-lever-section-products">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">4</div>
            <div className="sim-lever-section-name">ATTACHED SERVICES</div>
            <div className="sim-lever-section-meta">Servicing actions we attach to raise activation and follow-through</div>
          </div>

          <LeverRow
            label="Service enrollment"
            caption="Each service is a real servicing action — an auto-scheduled FA follow-up, a retirement-readiness checkup, or rollover concierge. Multiple services compound but with diminishing returns past 3."
            value={attachedServices.length === 0 ? "none selected" : `${attachedServices.length} of ${ATTACHED_SERVICES.length}`}
            offDefault={attachedServices.length !== RECOMMENDED.attachedServices.length}
          >
            <div className="iw-objectives">
              {ATTACHED_SERVICES.map((s) => {
                const checked = attachedServices.includes(s.id);
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
            label="Advice-readiness window"
            caption="How many days of detected advice-readiness before firing the motion. 60d is the sweet spot — earlier and the advice-need signal hasn't formed; later and the household's assets have begun moving to an external platform."
            value={`${readinessWindowDays}d window`}
            offDefault={readinessWindowDays !== RECOMMENDED.readinessWindowDays}
          >
            <RangeWithBubble
              min={30} max={90} step={15} value={readinessWindowDays}
              onChange={(e) => setReadinessWindowDays(+e.target.value)}
              disabled={isAutopilot}
              formatter={(v) => `${v}d window`}
            />
            <RangeScale marks={["30d", "60d", "90d"]} />
          </LeverRow>
        </div>

        {/* Section 5 · CHANNEL — How it reaches the household */}
        <div className="sim-lever-section sim-lever-section-comms">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">5</div>
            <div className="sim-lever-section-name">CHANNEL</div>
            <div className="sim-lever-section-meta">How the motion reaches the household - pick one or more</div>
          </div>

          <LeverRow
            label="Delivery channels"
            caption="Household hears about the motion via the channels you select. More channels means broader reach — but FA and banker channels also load the advisor queue, so over-weighting them can trip the senior-FA capacity guardrail. Phone is reserved for advisor follow-up, not initial outreach."
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

        {/* Section 6 · SIMULATION DURATION — model horizon every result is scored
            over; pilot RCT length lives in Deploy. */}
        <div className="sim-lever-section">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">6</div>
            <div className="sim-lever-section-name">SIMULATION DURATION</div>
            <div className="sim-lever-section-meta">Test window the simulator measures over — headline value is the 12-month projection</div>
          </div>

          <LeverRow
            label="Test window (weeks)"
            caption="The 8-week test window is what the simulation measures — conversion, appointments and early AUM. The headline relationships, AUM and fee figures are the 12-month value projection. Pilot RCT length is set separately in Deploy."
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
   ResultsReveal — verdict + SegmentedResults (KPIs + charts) + guardrail pills

   Same staged-reveal timing as liquidity: verdict @0, KPIs @200,
   chart/tiles @600, actions @4400.
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

  // ── Relationships ramp anchor ─────────────────────────────────────────────
  // The bar tiles render the 8-week TEST WINDOW: weekly run-rate bars (steady =
  // annual / 52). The headline +267 / +710 are the 12-MONTH projection, shown as
  // a separate row — not a test-window total. (Anchor curve kept for reference.)
  const REL_WOW_ANCHOR = [25, 50, 74, 105, 130, 161, 186, 211, 229, 248, 260, 267];

  // ── Derived tile inputs ──────────────────────────────────────────────────
  // The ResultTileNII reads `outcomes.NII_8wk_M` and synthesises a CI cone. For
  // wealth we map incremental AUM ($M) into that field so the area chart draws
  // the AUM ramp ($6M → $64M at anchor).
  const tileOutcomes = { NII_8wk_M: o.incrementalAumM };

  // Per-week steady values for the bar tiles.
  // External-flight reduction landed per week, ramping over 2 wks.
  const runoffReductionPct = o.runoffReductionPp * 100;              // total pp reduction after ramp
  // Appointments weekly run-rate (the 710 is the 12-month projection).
  const apptPerWk = o.appointments / 52;

  // ── Contextual micro-segment breakdown (reconciles to the KPIs) ──────────
  const lever = results.lever || { cohortPresets: ["all"], motion: "portfolio_review", channels: ["app", "email", "fa"] };
  // retainedM (= incremental AUM $M) is what the segment engine splits across
  // the micro-segments. niiM per row therefore reads "AUM $M".
  const seg = deriveSegments(WEALTH_SEG_MODEL, lever, { ...o, retainedM: o.incrementalAumM, reachTarget: o.eligibleN });

  const _convWith = +(o.conversionRate * 100).toFixed(1);
  const _convBase = +(WEALTH_CALIBRATION.conversionBau * 100).toFixed(1);

  // PRIMARY = New wealth relationships (count). SECONDARY = Incremental AUM.
  const kpis = [
    { label: "New wealth relationships", value: `+${o.newRelationships.toLocaleString()}`, baseline: `${Math.round(o.eligibleN * WEALTH_CALIBRATION.conversionBau)}` },
    { label: "Incremental AUM", value: `+$${o.incrementalAumM.toFixed(0)}M`, baseline: "$0" },
    { label: "Wealth-relationship conversion", value: `${_convWith}%`, baseline: `${_convBase}%` },
    { label: "Funded-account rate", value: `${(o.fundedRate * 100).toFixed(0)}%`, baseline: "—" },
    { label: "Appointments booked", value: `${o.appointments.toLocaleString()}`, baseline: "—" },
    { label: "Projected annual advisory fee revenue", value: `+$${(o.feeRevenueK / 1000).toFixed(2)}M`, baseline: "$0" },
    { label: "Advisor-capacity utilisation", value: `${(o.advisorUtil * 100).toFixed(0)}%`, baseline: "—" },
    { label: "Fair-treatment margin", value: `${o.udaapMargin.toFixed(2)}`, baseline: "0.85 floor" },
  ];

  // Policy band (the levers that produced this) — shown atop the Aggregate tab.
  const COHORT_LABELS = {
    "all": "All advice-ready", "relationship-deep": "Relationship-deep", "high-aum": "High-AUM movers",
    "digital": "Digitally-engaged", "branch-trust": "Branch-trust", "early-stage": "Early-stage affluent",
  };
  const MOTION_LABELS = Object.fromEntries(MOTIONS.map((m) => [m.id, m.label]));
  const policy = [
    { k: "Cohort", v: (lever.cohortPresets || []).map((id) => COHORT_LABELS[id]).filter(Boolean).join(", ") || "All" },
    { k: "Min investable", v: `$${lever.minInvestableK}K` },
    { k: "Wealth motion", v: MOTION_LABELS[lever.motion] || lever.motion },
    { k: "Channels", v: (lever.channels || []).map((c) => CHANNEL_OPTIONS.find((co) => co.id === c)?.label).filter(Boolean).join(", ") },
  ];

  const chartsGrid = (
    <div className="sim-result-grid">
      <ResultTileNII
        outcomes={tileOutcomes}
        progress={progress}
        title="Incremental AUM accumulation"
        subhead="cumulative · held-away assets attached · vs $0 holdout baseline"
        insight="Most AUM attaches after the relationship is opened and the rollover concierge clears the transfer — the curve trails the conversion ramp by a few weeks. The horizon figure is the projected business case; conversion is what the test directly measures."
      />
      <ResultTileBars
        title="External flight defended / wk"
        subhead={`drops from ${(o.runoffBau*100).toFixed(1)}% today to ${(o.runoffWithPolicy*100).toFixed(1)}% with policy`}
        steady={runoffReductionPct / 8}
        baselinePerWk={(o.runoffBau * 100) / 8}
        progress={progress}
        format={(n) => `${n.toFixed(2)}pp`}
        rampWeeks={2}
        seed={11}
        numbers={[
          { k: "steady flight (with policy)", v: `${(o.runoffWithPolicy * 100).toFixed(1)}% / yr` },
          { k: "reduction vs today",          v: `−${(o.runoffReductionPp * 100).toFixed(1)}pp` },
          { k: "incremental AUM",             v: `+$${o.incrementalAumM.toFixed(0)}M` },
        ]}
        insight="The first two weeks lag — households need to act on the motion before the external-flight rate starts dropping. Full effect from week 3."
        accent="#f59e0b"
      />
      <ResultTileBars
        title="New wealth relationships / wk"
        subhead="advice-ready households converting over the 8-week test window"
        steady={o.newRelationships / 52}
        baselinePerWk={(o.eligibleN * WEALTH_CALIBRATION.conversionBau) / 52}
        progress={progress}
        format={(n) => `${n.toFixed(0)}`}
        rampWeeks={3}
        seed={23}
        numbers={[
          { k: "run-rate / wk",      v: `${(o.newRelationships / 52).toFixed(0)}` },
          { k: "12-mo projection",   v: `+${o.newRelationships.toLocaleString()}` },
          { k: "appointments / wk",  v: `${apptPerWk.toFixed(0)}` },
        ]}
        insight="Conversion ramps over the first three weeks as advisor conversations get booked and held, then holds steady. Senior-FA capacity is the ceiling on the steepest plans."
        accent="#5b9dff"
      />
      <ResultTileNII
        outcomes={{ NII_8wk_M: o.feeRevenueK / 1000 }}
        progress={1}
        title="Projected annual advisory fee revenue"
        subhead="projected · advisory + product fees on funded relationships"
        insight="Fee revenue is downstream of the relationship — it accrues only after accounts fund. Never the headline goal; it follows the conversion."
      />
    </div>
  );

  return (
    <div className="results-content">
      {/* HEADER — Verdict + Proof KPIs together = "the answer" */}
      <section className={`panel results-header reveal ${showVerdict ? "in" : ""}`}>
        <Verdict verdict={verdict} />
      </section>

      {/* RESULTS — KPIs (both tabs) + tabs: Aggregate charts | By micro-segment table */}
      <section className={`panel reveal ${showChart ? "in" : ""}`}>
        <SegmentedResults
          kpis={kpis}
          accent="#14b8a6"
          valueLabel="AUM"
          valueScale={1}
          segments={seg}
          policy={policy}
          charts={chartsGrid}
          anchorRate={4.3}
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
            <span className={"sim-guardrail-pill " + (o.capacityOk ? "sim-guardrail-pass" : "sim-guardrail-fail")}>
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Advisor capacity</span>
              <span className="sim-guardrail-pill-d">{(o.advisorUtil * 100).toFixed(0)}% of senior-FA slots</span>
            </span>
            <span className={"sim-guardrail-pill " + (o.udaapOk ? "sim-guardrail-pass" : "sim-guardrail-fail")}>
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Suitability / fair treatment</span>
              <span className="sim-guardrail-pill-d">margin {o.udaapMargin.toFixed(2)} vs 0.85 floor</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Reg BI · best-interest cleared</span>
              <span className="sim-guardrail-pill-d">no unsuitable household recommended</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Model risk · approved</span>
              <span className="sim-guardrail-pill-d">advice-readiness state stable</span>
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
