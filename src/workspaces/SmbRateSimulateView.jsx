/* ============================================================================
   SmbRateSimulateView — SMB Deposit Retention via Rate Simulate workbench.

   Forked from LiquiditySimulateView.jsx structure but re-domained from
   idle-cash liquidity activation to SMB operating-deposit retention via
   interest-rate repricing:
     - 6 lever sections (CUSTOMER / ELIGIBILITY / OFFER / RATE NUDGES /
       CHANNEL / SIMULATION DURATION)
     - Single-column lever layout
     - Sticky config strip with pricing-consistency margin in the central slot
     - Results: verdict + 3 ProofKpi cards + 4 guardrail pills + 2×2 tiles
       WITH CHARTS + a micro-segment per-segment recommendation table
     - Stage for Deploy → intermezzo → navWorkspace("deploy")
     - Autopilot cinematic: T+1500 auto-run, T+3500 auto-stage

   What-If only — the If-What optimizer branch lives in SmbRateIfWhatView.

   The model reads SMBRATE_CALIBRATION, whose field names mirror the idle-cash
   calibration so simulateOutcomes() forks mechanically; semantics are
   re-labelled for rate: "NII retained", "deposit outflow", and offerCeilingBps
   is the RATE UPLIFT (bps) lever.
   ========================================================================= */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "@/state/AppShell";
import SimulationLoader from "@/components/loaders/SimulationLoader";
import Icon from "@/components/Icon";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import RangeWithBubble from "@/components/RangeWithBubble";
import { MOCK_EXPERIMENTS } from "@/workspaces/LearnWorkspace";
import SmbRateIfWhatView from "@/workspaces/SmbRateIfWhatView";
import {
  SMBRATE_HYPOTHESIS_ID,
  SMBRATE_HYPOTHESIS_TITLE,
  SMBRATE_CALIBRATION,
  SMBRATE_MICROSEGMENTS,
  SMBRATE_SEGMENT_COLUMNS,
  SMBRATE_CONFIG,
} from "@/data/smbRateConfig";

const PAGE_SUBTITLE = SMBRATE_HYPOTHESIS_TITLE;

/* Twin's recommended SMB-rate-defense levers — autopilot anchor + reset
   target. Prefilled to test the Minimum-effective-rate policy as written
   on the signal card.

   What the policy IS (these are levers):
     - Min account balance to qualify
     - Rate uplift over base (bps) · the headline lever
     - Rate ceiling tier · delivery channel

   What goes elsewhere:
     - Pilot duration / holdout % / auto-rollback → Deploy's RCT setup
     - RM capacity, frequency, tone → operational/communications detail */
const RECOMMENDED = {
  minBalanceK:        25,
  offerCeilingBps:    38,
  offerTerm:          "ceil_375",
  channels:           ["app", "banker", "rmcall"],   // multi-select
  bankingServices:    [],                             // default off; turn on to layer rate nudges
  triggerWindowDays:  60,                             // outflow-velocity window before predicted flight
};

/* ----------------------------------------------------------------------------
   Rate nudges the bank can attach to a reprice to defend the relationship and
   keep the balance on-us. Each is an actual servicing/relationship action.
---------------------------------------------------------------------------- */
const BANKING_SERVICES = [
  { id: "relationship_lock", label: "Relationship-rate lock",   sub: "Better rate conditional on keeping payroll / treasury on-us · re-bundles primacy" },
  { id: "rate_alert",        label: "Rate-review opt-in",       sub: "Proactively re-review the customer's rate when a competitor promo intensifies" },
  { id: "sweep_on_deposit",  label: "Sweep-on-deposit",         sub: "New operating deposits above the buffer auto-sweep into the repriced tier" },
];

/* ----------------------------------------------------------------------------
   Rate-ceiling tier options · radio cards, single-select.
   A higher ceiling allows a higher uplift to be offered. factor scales
   retained NII relative to the recommended 3.75% ceiling tier.
---------------------------------------------------------------------------- */
const OFFER_PRODUCTS = [
  { id: "ceil_325",  label: "Rate ceiling · 3.25%",  sub: "Conservative cap · protects margin, retains the most rate-sensitive only", factor: 0.90 },
  { id: "ceil_350",  label: "Rate ceiling · 3.50%",  sub: "Moderate cap · balances retention against margin give-up",                 factor: 0.96 },
  { id: "ceil_375",  label: "Rate ceiling · 3.75%",  sub: "Recommended cap · best balance of retention and margin",                   factor: 1.00 },
  { id: "ceil_400",  label: "Rate ceiling · 4.00%",  sub: "Aggressive cap · retains more balance, more margin given up",              factor: 1.05 },
  { id: "ceil_425",  label: "Rate ceiling · 4.25%",  sub: "Match-leaning cap · approaches blanket-match cost, less efficient",        factor: 1.08 },
];

/* ----------------------------------------------------------------------------
   Delivery channels · multi-select checkboxes.
---------------------------------------------------------------------------- */
const CHANNEL_OPTIONS = [
  { id: "banker",  label: "Primary banker" },
  { id: "app",     label: "In-app" },
  { id: "rmcall",  label: "RM call" },
  { id: "email",   label: "Email" },
];

/* Pilot-design defaults used at staging time (Deploy owns these downstream;
   here they just produce sensible simulation results). */
const PILOT_DEFAULTS = {
  pilotDuration: 8,
  holdoutPct:    10,
  rollbackOn:    true,
};

/* ----------------------------------------------------------------------------
   simulateOutcomes — SMB-rate lever → outcome chain.

   Anchors at recommended defaults (per SMBRATE_CALIBRATION):
     - eligibleAfterGate = 41,200 accounts
     - treatmentN/controlN = 37,080 / 4,120
     - NII retained annual = $41M (at +38 bps default)
     - Deposit outflow: 44% (BAU) → 23.5% (with policy) → −20.5pp reduction
     - +$13M more NII than a +95 bps blanket competitor-match
     - Spread protected = $612K / yr
     - Pricing-consistency margin = 0.95 (held by the no-overpay rule)
---------------------------------------------------------------------------- */
function simulateOutcomes(opts) {
  const C = SMBRATE_CALIBRATION;
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
    "rate-driven":        C.eligibleAfterGate,
    "mid-sensitive":      C.midBalanceN,
    "high-value":         C.highBalanceN,
    "relationship":       C.anchorN,
    "multi-product":      12000,
  };
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  const presetBase = list.includes("full")
    ? C.cohortTotal
    : list.reduce((s, id) => s + (COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;

  /* Eligibility scaling — higher min-balance threshold cuts the eligible
     pool. Cohort selection already encodes the outflow signals upstream. */
  const balanceFactor = Math.max(0.5, 1 - (minBalanceK - RECOMMENDED.minBalanceK) * 0.004);
  const eligibleN = Math.round(presetBase * Math.max(0.4, Math.min(1.4, balanceFactor)));

  /* Rate-ceiling-tier factor: pulled from the OFFER_PRODUCTS table so adding
     new tiers doesn't require math updates here. A higher ceiling allows a
     higher uplift to be effective. */
  const termFactor = (OFFER_PRODUCTS.find((p) => p.id === offerTerm) || OFFER_PRODUCTS[0]).factor;

  /* Treatment / control split. */
  const treatmentN = Math.round(eligibleN * (1 - holdoutPct / 100));
  const controlN   = eligibleN - treatmentN;

  /* Channel reach factor — sum of per-channel weights, capped at 1.05 for
     full multi-channel coverage. Primary banker carries the highest
     per-account lift on large balances; in-app scales broadly. */
  const channelWeights = { banker: 0.42, app: 0.28, rmcall: 0.30, email: 0.20 };
  const channelSum = (channels || []).reduce((s, c) => s + (channelWeights[c] || 0), 0);
  const channelFactor = Math.max(0.45, Math.min(1.05, channelSum / 1.0));

  /* Rate-uplift scaling — retained NII scales roughly linearly with
     offer attractiveness (relative to recommended +38bps). */
  const ceilingFactor = offerCeilingBps / RECOMMENDED.offerCeilingBps;

  /* Rate-nudge factor — each attached nudge raises the retention mechanism.
     Full 3-nudge stack ≈ +60% effectiveness vs no nudges, diminishing past 3. */
  const servicesFactor = 1 + Math.min(0.6, bankingServices.length * 0.18);

  /* Outflow-velocity window factor — 60d is the sweet spot. Earlier and the
     outflow signal hasn't formed; later and the balance has begun to walk. */
  const triggerFactor = 1 - Math.abs(triggerWindowDays - 60) / 120;

  /* Per-treated retention math — calibrated to hit anchor at defaults. */
  const retainedM = C.retainedDepositsAnnualM
                  * (treatmentN / C.treatmentN)
                  * channelFactor
                  * Math.min(1.3, ceilingFactor)
                  * termFactor
                  * servicesFactor
                  * triggerFactor;

  /* Deposit-outflow reduction scales with offer strength + channel reach. */
  const runoffWithPolicy = Math.max(
    C.runoffBau - C.runoffReductionPp * channelFactor * Math.min(1.2, ceilingFactor),
    0.120
  );
  const runoffReductionPp = C.runoffBau - runoffWithPolicy;

  /* Spread protected scales linearly with retained NII. */
  const spreadProtectedK = C.spreadProtectedK * (retainedM / C.retainedDepositsAnnualM);

  /* vs-match advantage scales with retained NII (more retained = more NII won
     over the blanket +95bps competitor-match). */
  const vsMatchM = C.vsMatchM * (retainedM / C.retainedDepositsAnnualM);

  /* Rate give-up (margin cost) scales with offer ceiling. */
  const offerCostM = C.offerCostM * ceilingFactor;
  const netAnnualisedK = Math.round((spreadProtectedK * 1000 - offerCostM * 1e6) / 1000) + C.netAnnualisedK;

  /* Pricing-consistency margin held by the no-overpay rule. */
  const udaapMargin = C.udaapMargin;

  /* Customer fatigue scales with treatment size + offer aggressiveness. */
  const complaintsDelta = Math.round(
    C.complaintsDelta * (treatmentN / C.treatmentN) * Math.min(1.4, ceilingFactor)
  );

  /* Balances-defended recovery — secondary mechanism. Baseline +6pp; each
     attached rate nudge adds ~2pp because the nudge is the intervention this
     KPI actually measures. */
  const ddRecoveryPp = 6 + bankingServices.length * 2;

  /* Profitability gates */
  const profitabilityOk = netAnnualisedK > 0;
  const udaapOk = udaapMargin >= C.udaapFloor;

  return {
    eligibleN, treatmentN, controlN,
    retainedM, runoffBau: C.runoffBau, runoffWithPolicy, runoffReductionPp,
    spreadProtectedK, offerCostM, netAnnualisedK, vsMatchM,
    competitorMatchBps: C.competitorMatchBps,
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
   Verdict — SMB-rate-specific verdict callout.
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
          <div className="verdict-sub">All retention KPIs hit · pricing-consistency margin held · margin floor clear</div>
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
          <div className="verdict-sub">NII retained in range · pricing-consistency margin held · margin floor uncertain</div>
        </div>
      </div>
    );
  }
  return (
    <div className="verdict-callout verdict-disproven">
      <span className="verdict-glyph"><Icon name="x" size={20} strokeWidth={2.5} /></span>
      <div className="verdict-body">
        <div className="verdict-title">SIMULATION DOES NOT SUPPORT HYPOTHESIS</div>
        <div className="verdict-sub">NII retained below CI · or repricing breaches the margin floor at this uplift ceiling</div>
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
   SmbRateSimulateView
   ========================================================================= */
export default function SmbRateSimulateView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setTuneMode, explorationMode,
    recordDecisionTrace, setIntermezzo,
  } = useAppShell();

  // If-What path: dispatch to the goal-driven optimizer view. The What-If
  // lever workbench below is for free-form lever configuration; If-What
  // asks "given this goal, what's the best policy in these ranges?"
  if (explorationMode === "ifwhat") {
    return <SmbRateIfWhatView />;
  }

  // Mode state machine
  const [mode, setMode] = useState("config");          // 'config' | 'running' | 'results'
  const isAutopilot = tuneMode === "autopilot";

  // Hypothesis id — fall back to the recommended SMB-rate hypothesis if
  // nothing was seeded.
  const activeHypId = selectedHypothesisId || SMBRATE_HYPOTHESIS_ID;

  // ---- Lever state ----
  const [minBalanceK,       setMinBalanceK]       = useState(RECOMMENDED.minBalanceK);
  const [offerCeilingBps,   setOfferCeilingBps]   = useState(RECOMMENDED.offerCeilingBps);
  const [offerTerm,         setOfferTerm]         = useState(RECOMMENDED.offerTerm);
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
    minBalanceK, offerCeilingBps, offerTerm, channels,
    holdoutPct:    PILOT_DEFAULTS.holdoutPct,
    pilotDuration: PILOT_DEFAULTS.pilotDuration,
    cohortPresets,
    bankingServices, triggerWindowDays,
  }), [minBalanceK, offerCeilingBps, offerTerm,
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
        ? "Autopilot · running minimum-effective-rate simulation"
        : "What-If minimum-effective-rate simulation kicked off · 8-week horizon",
    });
  }, [pushAgentEvent, tuneMode]);

  const onLoaderComplete = useCallback(() => {
    const o = outcomes;
    const verdict = computeVerdict({
      retainedOk:      o.retainedM >= 25,
      runoffOk:        o.runoffReductionPp >= 0.10,
      udaapOk:         o.udaapOk,
      profitabilityOk: o.profitabilityOk,
    });
    setResults({
      verdict,
      playKey: Date.now(),
      outcomes: o,
    });
    setMode("results");
    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: `What-If converged · +$${o.retainedM.toFixed(0)}M NII retained · −${(o.runoffReductionPp * 100).toFixed(1)}pp deposit outflow`,
    });
  }, [outcomes, pushAgentEvent]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);
  const onBackToConfig = useCallback(() => { setResults(null); setMode("config"); }, []);

  const onStage = useCallback(() => {
    const stagedAt = Date.now();
    const policy = {
      id: `p-${stagedAt}`,
      name: SMBRATE_HYPOTHESIS_TITLE,
      hypothesis: activeHypId,
      cluster: "smb-deposit-rate-defense",
      themeId: "smbrate",
      experimentType: "smbrate",
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
          "Rate-driven cohort only — genuinely rate-sensitive balances, will-stay segment suppressed",
          "+38 bps uplift · 3.75% ceiling — minimum-effective rate inside the margin floor",
          "Primary banker + in-app + RM call — large balances negotiated, the rest scaled digitally",
        ],
        scenarios: 96400,
      });
    }

    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot staged SMB-rate policy for Deploy"
        : "SMB-rate policy staged for Deploy",
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
    setOfferCeilingBps(RECOMMENDED.offerCeilingBps);
    setOfferTerm(RECOMMENDED.offerTerm);
    setChannels(RECOMMENDED.channels);
    setCohortPresets(["full"]);
    setBankingServices(RECOMMENDED.bankingServices);
    setTriggerWindowDays(RECOMMENDED.triggerWindowDays);
  }, []);

  // ---- Cohort-preset label (joins multi-selection) ----
  const COHORT_DISPLAY = {
    "full": "Full at-risk book",
    "high-value": "High-balance, rate-driven",
    "mid-sensitive": "Mid-balance, sensitive",
    "relationship": "Relationship-anchorable",
  };
  const cohortLabel = cohortPresets.length === 1
    ? COHORT_DISPLAY[cohortPresets[0]] || cohortPresets[0]
    : `${cohortPresets.length} cohorts`;

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
    <div className="sim-ws sim-ws-single test-journey" style={{ "--acc": SMBRATE_CONFIG.accent, "--acc-soft": SMBRATE_CONFIG.accent + "22" }}>
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
          {outcomes.eligibleN.toLocaleString()} accounts actionable after the rate-sensitivity gate ·{" "}
          stickiness threshold fixed at 0.55 · margin floor enforced per account.
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
              after rate-sensitivity gate ({Math.round((outcomes.eligibleN / outcomes.cohortTotal) * 100)}% of cohort)
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
            <div className="sim-lever-section-meta">Which accounts the reprice reaches — tick a scope or specific segments</div>
          </div>
          <div className="sim-lever-fieldset" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {[
              { id: "full",            name: "Full at-risk book",        count: 41200, signature: "Every SMB operating account showing outflow or rate-shopping signals." },
              { id: "high-value",      name: "High-balance, rate-driven", count:  7300, signature: "Large idle balance · rate-shopping · top NII-exposure decile." },
              { id: "mid-sensitive",   name: "Mid-balance, sensitive",    count: 12600, signature: "Recurring flows down · velocity declining · smaller balances, sensitive." },
              { id: "relationship",    name: "Relationship-anchorable",   count:  9100, signature: "Multi-product · partial outflow · payroll/treasury still on-us." },
            ].map((c) => {
              const name = c.name;
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
        </div>

        {/* Section 2 · ELIGIBILITY (violet accent) — Who in the cohort qualifies */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">2</div>
            <div className="sim-lever-section-name">ELIGIBILITY</div>
            <div className="sim-lever-section-meta">Which accounts in the cohort qualify for the reprice</div>
          </div>

          <LeverRow
            label="Minimum account balance"
            caption="Accounts below this aren't worth the margin given up to retain."
            value={`$${minBalanceK}K`}
            offDefault={off("minBalanceK", minBalanceK)}
          >
            <RangeWithBubble min={5} max={250} step={5} value={minBalanceK}
              onChange={(e) => setMinBalanceK(+e.target.value)} disabled={isAutopilot}
              formatter={(v) => `$${v}K`} />
            <RangeScale marks={["$5K", "$25K", "$250K"]} />
          </LeverRow>

        </div>

        {/* Section 3 · OFFER (amber accent) — What the offer is */}
        <div className="sim-lever-section sim-lever-section-policy">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">3</div>
            <div className="sim-lever-section-name">OFFER</div>
            <div className="sim-lever-section-meta">What we put in front of the account</div>
          </div>

          <LeverRow
            label="Rate uplift over base (bps)"
            caption="The minimum-effective uplift over base offered to retain the balance — vs +95 bps to fully match the competitor."
            value={`+${offerCeilingBps} bps`}
            offDefault={off("offerCeilingBps", offerCeilingBps)}
          >
            <RangeWithBubble min={0} max={100} step={1} value={offerCeilingBps}
              onChange={(e) => setOfferCeilingBps(+e.target.value)} disabled={isAutopilot}
              formatter={(v) => `+${v} bps`} />
            <RangeScale marks={["0", "+38", "+95 match", "+100"]} />
          </LeverRow>

          <LeverRow
            label="Rate ceiling (%)"
            caption="The hard cap on any single repriced rate. A higher ceiling allows a higher uplift to be effective; it also gives up more margin."
            value={(OFFER_PRODUCTS.find((p) => p.id === offerTerm) || OFFER_PRODUCTS[0]).label}
            offDefault={off("offerTerm", offerTerm)}
          >
            <div className="iw-objectives">
              {OFFER_PRODUCTS.map((p) => (
                <label
                  key={p.id}
                  className={"iw-objective" + (offerTerm === p.id ? " is-selected" : "")}
                >
                  <input
                    type="radio"
                    name="smbrate-offer-ceiling"
                    value={p.id}
                    checked={offerTerm === p.id}
                    onChange={() => setOfferTerm(p.id)}
                    disabled={isAutopilot}
                  />
                  <span className="iw-objective-body">
                    <span className="iw-objective-l">
                      {p.label}
                    </span>
                    <span className="iw-objective-d">{p.sub}</span>
                  </span>
                </label>
              ))}
            </div>
          </LeverRow>
        </div>

        {/* Section 4 · RATE NUDGES (green accent) — Relationship/servicing
            actions we attach to a reprice to defend the balance and keep it
            on-us. Each maps to a real servicing or relationship action. */}
        <div className="sim-lever-section sim-lever-section-products">
          <div className="sim-lever-section-band">
            <div className="sim-lever-section-num">4</div>
            <div className="sim-lever-section-name">RATE NUDGES</div>
            <div className="sim-lever-section-meta">Servicing and relationship actions we attach to keep the balance on-us</div>
          </div>

          <LeverRow
            label="Nudge enrollment"
            caption="Each nudge is a real servicing or relationship action — a relationship-rate lock, a rate-review opt-in, or sweep-on-deposit. Multiple nudges compound but with diminishing returns past 3."
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
            label="Outflow-velocity window"
            caption="How many days of declining balance velocity before predicted flight to fire the reprice. 60d is the sweet spot — earlier and the outflow signal hasn't formed; later and the balance has already begun to walk."
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
            <div className="sim-lever-section-meta">How the reprice reaches the account - pick one or more</div>
          </div>

          <LeverRow
            label="Delivery channels"
            caption="Account hears about the reprice via the channels you select. More channels means broader reach but more fatigue risk."
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
  const { verdict, playKey, outcomes } = results;
  const o = outcomes;
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
  // NII-shaped 8-week curve for the area chart (reuses ResultTileNII which
  // reads `outcomes.NII_8wk_M` and synthesises a CI cone). We map "NII
  // retained over the 8-week horizon" into the same field — ~8/52 of annual.
  const tileOutcomes = { NII_8wk_M: o.retainedM * (8 / 52) };

  // For deposit-outflow-reduction bar: percentage-point reduction landed.
  const runoffReductionPct  = o.runoffReductionPp * 100;
  // For balances-defended bar: pp defended per week (lags 3 wks then ramps).
  const ddRecPerWk          = o.ddRecoveryPp / 8;

  // Cohort donut segments by rate-sensitivity (4 to match the template; sums to 100)
  const cohortSegments = [
    { id: "hi",  label: "High-balance, rate-driven", pct: 38, color: "var(--acc, #ff6b6b)" },
    { id: "mid", label: "Mid-balance, sensitive",    pct: 33, color: "var(--violet, #b794f6)" },
    { id: "anc", label: "Relationship-anchorable",   pct: 21, color: "var(--cyan, #4fd1c5)" },
    { id: "ws",  label: "Will-stay (no reprice)",    pct:  8, color: "var(--ink-3)" },
  ];

  return (
    <div className="results-content">
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
              label="NII retained"
              value={`+$${o.retainedM.toFixed(0)}M`}
              valueCap="/ yr"
              baseline="$0"
              baselineCap="balance walks on rate, NII lost"
              delta={`+$${o.retainedM.toFixed(0)}M`}
              deltaTone="good"
              hit={o.retainedM >= 25 ? "ok" : o.retainedM >= 15 ? "warn" : "miss"}
            />
            <ProofKpi
              label="Deposit outflow"
              value={`${(o.runoffWithPolicy * 100).toFixed(1)}%`}
              valueCap="with policy"
              baseline={`${(o.runoffBau * 100).toFixed(1)}%`}
              baselineCap="today, no policy"
              delta={`−${(o.runoffReductionPp * 100).toFixed(1)}pp`}
              deltaTone="good"
              hit={o.runoffReductionPp >= 0.10 ? "ok" : "warn"}
            />
            <ProofKpi
              label="vs. blanket competitor-match"
              value={`+$${o.vsMatchM.toFixed(0)}M`}
              valueCap="more NII / yr"
              baseline={`+${o.competitorMatchBps} bps`}
              baselineCap="blanket match to every account"
              delta={`+$${o.vsMatchM.toFixed(0)}M`}
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
              <span className="sim-guardrail-pill-l">Margin floor</span>
              <span className="sim-guardrail-pill-d">net annualised +${(o.netAnnualisedK / 1000).toFixed(1)}M</span>
            </span>
            <span className={"sim-guardrail-pill " + (o.udaapOk ? "sim-guardrail-pass" : "sim-guardrail-fail")}>
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Pricing consistency</span>
              <span className="sim-guardrail-pill-d">margin {o.udaapMargin.toFixed(2)} vs 0.85 floor</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">No-overpay · enforced</span>
              <span className="sim-guardrail-pill-d">will-stay segment suppressed</span>
            </span>
            <span className="sim-guardrail-pill sim-guardrail-pass">
              <span className="sim-guardrail-pill-dot" />
              <span className="sim-guardrail-pill-l">Model risk · approved</span>
              <span className="sim-guardrail-pill-d">rate-response model stable</span>
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
            title="NII retained accumulation"
            subhead="cumulative over 8-wk pilot · vs $0 baseline (balance walks)"
            insight="Most retention lands inside the first 4 weeks — accounts reached early before the balance moves off-us hold their deposits. Extending the pilot adds little new retention."
          />
          <ResultTileBars
            title="Deposit outflow / wk · BAU vs policy"
            subhead={`drops from ${(o.runoffBau*100).toFixed(1)}% today to ${(o.runoffWithPolicy*100).toFixed(1)}% with policy`}
            steady={runoffReductionPct / 8}
            baselinePerWk={(o.runoffBau * 100) / 8}
            progress={progress}
            format={(n) => `${n.toFixed(2)}pp`}
            rampWeeks={2}
            seed={11}
            numbers={[
              { k: "steady outflow (with policy)", v: `${(o.runoffWithPolicy * 100).toFixed(1)}%` },
              { k: "reduction vs today",           v: `−${(o.runoffReductionPp * 100).toFixed(1)}pp` },
              { k: "8-wk NII retained",            v: `+$${o.retainedM.toFixed(0)}M` },
            ]}
            insight="The first two weeks lag — accounts need the reprice to land before the outflow rate starts dropping. Full effect from week 3."
            accent="var(--acc, #ff6b6b)"
          />
          <ResultTileBars
            title="Balances defended on-us / wk"
            subhead="operating balance held by the minimum-effective reprice"
            steady={ddRecPerWk}
            baselinePerWk={0}
            progress={progress}
            format={(n) => `${n.toFixed(2)}pp`}
            rampWeeks={4}
            seed={23}
            numbers={[
              { k: "steady rate / wk",      v: `${ddRecPerWk.toFixed(2)}pp` },
              { k: "8-wk total",            v: `+${o.ddRecoveryPp}pp` },
              { k: "vs blanket match",      v: `+$${o.vsMatchM.toFixed(0)}M NII` },
            ]}
            insight="Defended balances lag the reprice by ~3 weeks — accounts settle in once the new rate is confirmed. Concentrated in weeks 6–8."
            accent="var(--violet, #b794f6)"
          />
          <ResultTileCohort
            segments={cohortSegments}
            treatedN={o.treatmentN}
            caption={`${cohortSegments[0].label} + ${cohortSegments[1].label} account for ${cohortSegments[0].pct + cohortSegments[1].pct}% · the two largest rate-sensitivity archetypes`}
            insight="Most of the value comes from the high-balance rate-driven segment — the slice we can price most precisely."
          />
        </div>
      </section>

      {/* PER-SEGMENT RECOMMENDATION · micro-segment table grafted after the
          charts. Reuses the b2b-segtable / b2b-segrow / b2b-segcard JSX from
          MicroSegmentResults (sans its headline, which the verdict + proof
          KPIs above already cover). */}
      <section className={`panel reveal ${showSegs ? "in" : ""}`}>
        <MicroSegmentTable
          segmentColumns={SMBRATE_SEGMENT_COLUMNS}
          microSegments={SMBRATE_MICROSEGMENTS}
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

/* ============================================================================
   MicroSegmentTable — the table + per-segment card from MicroSegmentResults,
   lifted verbatim (minus the headline section, which would require cfg.headline
   the verdict/proof-KPIs above already provide). 5 segments incl. Will-stay /
   Hold and Already-gone / Blocked, with the conv-vs-base handling preserved.
   ========================================================================= */
function MicroSegmentTable({ segmentColumns, microSegments }) {
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
