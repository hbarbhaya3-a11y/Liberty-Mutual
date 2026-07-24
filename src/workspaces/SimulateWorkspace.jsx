/* ============================================================================
   SimulateWorkspace — 3-mode state machine (config | running | results)

   CONFIG layout (post-redesign):
     - Header   : eyebrow + title + Autopilot/Guided mode toggle
     - Body 2c  : LEFT = all levers visible at once, grouped into 3 section
                  bands (Policy / Comms / Deepening). RIGHT = persistent
                  Fair-Lending Safe Zone chart (the central guardrail) +
                  "Twin's reasoning" card + sticky Run button.
     - Autopilot mode locks the levers (read-only) and surfaces a compute
       receipt; Guided mode unlocks them and surfaces a "Reset to Twin's
       recommendations" pill.

   RUNNING : config stays mounted, dimmed behind a centred loader modal.
   RESULTS : replaces config; new IA = Verdict + Proof-KPI header on top
             (the answer), then Weekly Trajectory / J-Curve / Arenas / CTAs.
   ========================================================================= */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "@/state/AppShell";
import RetentionSimulateView from "@/workspaces/RetentionSimulateView";
import LiquiditySimulateView from "@/workspaces/LiquiditySimulateView";
import WealthSimulateView from "@/workspaces/WealthSimulateView";
import B2BSimulateView from "@/workspaces/B2BSimulateView";
import SmbRateSimulateView from "@/workspaces/SmbRateSimulateView";
import SmbGrowthSimulateView from "@/workspaces/SmbGrowthSimulateView";
import { isB2B } from "@/data/b2bConfigs";
import SimulationLoader from "@/components/loaders/SimulationLoader";
import FairnessSafeZone from "@/components/charts/FairnessSafeZone";
import CohortWaterfall from "@/components/charts/CohortWaterfall";
import ConversionFunnel from "@/components/charts/ConversionFunnel";
import Icon from "@/components/Icon";
import RangeWithBubble from "@/components/RangeWithBubble";
import IfWhatConfig from "@/workspaces/ifwhat/IfWhatConfig";
import IfWhatResults from "@/workspaces/ifwhat/IfWhatResults";
import { PaymentDrill, CommsDrill, DeepeningDrill } from "@/workspaces/ifwhat/IfWhatCharts";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import { MOCK_EXPERIMENTS } from "@/workspaces/LearnWorkspace";

const PAGE_SUBTITLE = "Trust-Aware Ceiling Lift";

/* Twin's recommended settings for this hypothesis. Single source of truth
   for both Autopilot mode (which locks levers to these values) and the
   "Reset to Twin's recommendations" action available in Guided mode. */
const RECOMMENDED = {
  trustGate: 18,
  liftPct: 20,
  rails: ["zelle", "ach"],
  rolloutPct: 60,
  rollbackOn: true,
  channelMix: { inapp: 40, push: 20, email: 20, sms: 12, rm: 8 },
  frequency: 3,
  tone: "proactive",
  timing: "pre-payout",
  product: "hy_savings",
  intensity: 2,
  offerChannel: "inapp",
  waitUntilWarm: 50,
  deepRollout: 60,
};

/* ----------------------------------------------------------------------------
   simulateOutcomes — single source of truth for the lever → outcome chain.

   Both the live config strip (cohort summary, fair-lending pill) and the
   post-run Results page consume this. Inputs are the lever state; outputs
   are the cohort sizes, RCT N's, NII, blocked, complaints, cost savings.

   Calibration anchors (at recommended defaults: trustGate=18, liftPct=20,
   rails=zelle+ach+rtp+wire, rolloutPct=60, default comms):
     - verifiedEligible = 64,000  (= 200K × 0.32)
     - treated         = 38,400  (= 64K × 0.60 × 1.0)
     - treatmentN/controlN = 34,500 / 3,850
     - NII 8-wk = $1.19M · annual = $5.6M
     - Blocked removed / qtr = 29,300 · annual = 236K
     - Complaints / qtr = 840 · annual = 3,360
     - Call-centre savings / yr = $1.68M

   Move any lever and these all shift in lock-step.
---------------------------------------------------------------------------- */
const RAIL_SHARE = { zelle: 0.58, ach: 0.18, rtp: 0.12, wire: 0.04 };
const CH_REACH = { inapp: 0.78, push: 0.71, email: 0.55, sms: 0.62, rm: 0.92 };
const TONE_LIFT = { proactive: 1.0, educational: 0.92, generic: 0.71 };
const TIMING_LIFT = { "pre-payout": 1.0, "always-on": 0.84 };
/* Baseline comms reach for the default channelMix+freq+tone+timing — used to
   normalize so the recommended setup gives an adjustment factor of 1.0. */
const BASELINE_COMMS = (
  (40/100)*CH_REACH.inapp + (20/100)*CH_REACH.push + (20/100)*CH_REACH.email +
  (12/100)*CH_REACH.sms + (8/100)*CH_REACH.rm
) * (0.55 + 0.18 * Math.log(4)) * TONE_LIFT.proactive * TIMING_LIFT["pre-payout"];

function simulateOutcomes(opts) {
  const { cohortTotal, trustGate, liftPct, rails, rolloutPct, channelMix, frequency, tone, timing } = opts;

  /* Verified-history gate share — monotonically falls as gate rises.
     Anchor: 18 mo → 32% pass. 12 mo → ~53%. 24 mo → ~19%. 30 mo → ~12%. */
  const verifiedShare = Math.min(0.55, 0.32 * Math.exp(-(trustGate - 18) * 0.085));
  const verifiedEligible = Math.round(cohortTotal * verifiedShare);

  /* Rail coverage: sum of selected rail shares, normalized so all 4 rails = 1.0.
     If no rails selected, treated cohort is zero — the policy can't apply. */
  const railSum = rails.reduce((s, r) => s + (RAIL_SHARE[r] || 0), 0);
  const railCoverage = Math.min(1.0, railSum / 0.92);

  /* Treated population = verified × rollout share × rail coverage.
     90/10 matched split into treatment vs control (the existing RCT design). */
  const treated = Math.round(verifiedEligible * (rolloutPct / 100) * railCoverage);
  const treatmentN = Math.round((treated * 0.90) / 50) * 50;
  const controlN = Math.round((treated * 0.10) / 10) * 10;

  /* Comms adjustment factor. Reach × frequency-lift × tone × timing,
     normalized so the default comms setup = 1.0. Weaker comms → fewer
     treated customers actually adopt the lifted ceiling → less NII. */
  const totalMix = Object.values(channelMix).reduce((a, b) => a + b, 0) || 100;
  const reachProb = Object.entries(channelMix).reduce(
    (acc, [k, v]) => acc + (v / totalMix) * (CH_REACH[k] ?? 0.5), 0
  );
  const freqLift = Math.min(1.0, 0.55 + 0.18 * Math.log(1 + frequency));
  const commsRaw = reachProb * freqLift * (TONE_LIFT[tone] || 0.85) * (TIMING_LIFT[timing] || 0.9);
  const commsAdjust = commsRaw / BASELINE_COMMS;

  /* Policy strength scales linearly with lift % (relative to recommended 20%). */
  const liftFactor = liftPct / 20;

  /* Per-treated outcomes — calibrated at defaults to hit the demo's anchor
     numbers. Each scales with liftFactor × commsAdjust. */
  const NII_8wk_M = (treated * 31 * liftFactor * commsAdjust) / 1e6;
  const NII_annual_M = NII_8wk_M * (5.6 / 1.19);
  const blockedRemoved_qtr = Math.round(treated * 0.763 * liftFactor * commsAdjust);
  const blockedRemoved_yr = Math.round(blockedRemoved_qtr * (236000 / 29300));
  const complaints_qtr = Math.round(treated * 0.0219 * liftFactor * commsAdjust);
  const complaints_yr = complaints_qtr * 4;
  /* Each blocked rent payment that we *don't* avoid generates ~$7.1 of
     contact-centre cost (calibrated against the $1.68M anchor). */
  const ccSavings_M = (blockedRemoved_yr * 7.1) / 1e6;

  /* Baselines + post-policy values — both halves of the "baseline vs.
     with-policy" comparison. We derive baseline from policy effectiveness
     (at default lift the policy resolves ~78% of blockable events), then
     the post-policy state is just baseline minus what the policy removed. */
  const effectiveness = Math.max(0.01, Math.tanh(liftPct / 26) * 0.78);
  const baselineBlocked_qtr = Math.round(blockedRemoved_qtr / effectiveness);
  const baselineBlocked_yr = Math.round(blockedRemoved_yr / effectiveness);
  const baselineComplaints_qtr = Math.round(complaints_qtr / effectiveness);
  const baselineComplaints_yr = Math.round(complaints_yr / effectiveness);
  const blockedWithPolicy_qtr = Math.max(0, baselineBlocked_qtr - blockedRemoved_qtr);
  const complaintsWithPolicy_qtr = Math.max(0, baselineComplaints_qtr - complaints_qtr);
  const blockedReductionPct = baselineBlocked_qtr > 0
    ? Math.round((blockedRemoved_qtr / baselineBlocked_qtr) * 100)
    : 0;
  const complaintsReductionPct = baselineComplaints_qtr > 0
    ? Math.round((complaints_qtr / baselineComplaints_qtr) * 100)
    : 0;

  /* Fair-lending margin — drops with high lift and low trust gate. */
  const liftPenalty = Math.max(0, (liftPct - 20) * 0.006);
  const gatePenalty = Math.max(0, (18 - trustGate) * 0.012);
  const fairLendingMargin = Math.max(0.78, 0.96 - liftPenalty - gatePenalty);

  return {
    verifiedShare, verifiedEligible, railCoverage,
    treated, treatmentN, controlN,
    NII_8wk_M, NII_annual_M,
    blockedRemoved_qtr, blockedRemoved_yr,
    complaints_qtr, complaints_yr,
    ccSavings_M,
    baselineBlocked_qtr, baselineBlocked_yr,
    baselineComplaints_qtr, baselineComplaints_yr,
    blockedWithPolicy_qtr, complaintsWithPolicy_qtr,
    blockedReductionPct, complaintsReductionPct,
    fairLendingMargin, fairLendingSafe: fairLendingMargin >= 0.85,
  };
}

export default function SimulateWorkspace() {
  const {
    selectedThemeId,
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    // Picked upstream on the test-mode branching screen. We just read them.
    tuneMode, setTuneMode,
    explorationMode,
    recordDecisionTrace, setIntermezzo,
  } = useAppShell();

  // ---------------- Mode state machine ----------------
  const [mode, setMode] = useState("config"); // 'config' | 'running' | 'results'

  // ---------------- Tuning mode (Autopilot vs Guided) ----------------
  const isAutopilot = tuneMode === "autopilot";
  const isIfWhat = explorationMode === "ifwhat";

  // ---------------- If-What state — objective + parameter ranges -----
  // Used only when explorationMode === 'ifwhat'. Suggested ranges centred
  // on Twin's recommended values; the user widens or tightens.
  const [ifWhatObjective, setIfWhatObjective] = useState("nii-recovered");
  /* Search ranges — continuous parameters the optimizer sweeps within
     low/high bounds. Each entry is a closed interval [low, high]. Pilot
     population is intentionally NOT included — rollout % is an operational
     decision set at deploy time, not a policy-design dimension the
     optimizer should search over. */
  const [ifWhatRanges, setIfWhatRanges] = useState({
    trustGate:     { low: 15, high: 24 },     // 12–30 mo
    liftPct:       { low: 15, high: 25 },     // +10–+40%
    /* Simulation duration is fixed at 8 weeks across all candidates so
       the optimizer compares policies on equal footing. Not exposed as
       a range. Pilot RCT length is a Deploy decision. */
    frequency:     { low: 2,  high: 4  },     // 1–5 / week
    waitUntilWarm: { low: 40, high: 60 },     // 30–70% of pilot
    deepRollout:   { low: 50, high: 70 },     // 30–90%
    offerProm:     { low: 2,  high: 3  },     // 1–4
  });
  /* Discrete-choice parameters — the optimizer picks the best subset/value
     from the user's allowed set. Different shape from ranges, so kept in a
     separate state slice. `cohorts` lists which customer clusters the
     optimizer may target; gig is primary (the hypothesis was built for it)
     but the user can widen to other clusters to see if the policy
     generalizes. */
  const [ifWhatEnums, setIfWhatEnums] = useState({
    cohorts:  ["gig"],                         // clusters to consider (gig primary)
    rails:    ["rtp", "ach"],                  // multi-select of rails to consider
    styles:   ["proactive", "educational"],    // tones to try
    timings:  ["pre-payout"],                  // send-timing variants to try
    autoRollback: true,                        // hard locked-on by default
    includeDeepening: false,                   // follow-on offer scope
  });

  // ---------------- Payment-policy levers ----------------
  const [trustGate, setTrustGate] = useState(RECOMMENDED.trustGate);
  const [liftPct, setLiftPct] = useState(RECOMMENDED.liftPct);
  const [rails, setRails] = useState(RECOMMENDED.rails);
  const [rolloutPct, setRolloutPct] = useState(RECOMMENDED.rolloutPct);
  /* Pilot duration · how long the RCT runs once live. Connects the
     design-stage choice to the Deploy workflow — the Live Pilot panel
     counts down from this value, and the Learnings panel triggers when
     the duration expires. */
  const [pilotDuration, setPilotDuration] = useState(8);
  const [rollbackOn, setRollbackOn] = useState(RECOMMENDED.rollbackOn);

  // ---------------- Communications levers ----------------
  const [channelMix, setChannelMix] = useState(RECOMMENDED.channelMix);
  const [frequency, setFrequency] = useState(RECOMMENDED.frequency);
  const [tone, setTone] = useState(RECOMMENDED.tone);
  const [timing, setTiming] = useState(RECOMMENDED.timing);
  const [product, setProduct] = useState(RECOMMENDED.product);
  const [intensity, setIntensity] = useState(RECOMMENDED.intensity);
  const [offerChannel, setOfferChannel] = useState(RECOMMENDED.offerChannel);
  const [waitUntilWarm, setWaitUntilWarm] = useState(RECOMMENDED.waitUntilWarm);
  const [deepRollout, setDeepRollout] = useState(RECOMMENDED.deepRollout);

  /* Deepening / follow-on offer is OFF by default. Including it changes
     the test scope from "friction-removal only" to "friction-removal plus
     a cross-sell offer". Tracked separately so the loader phases, arena
     cards, and drill-downs only surface when the user opts in. */
  const [includeDeepening, setIncludeDeepening] = useState(false);

  // ---------------- Cohort selection ----------------
  // Catalogue of available clusters. Gig is the primary cohort for H-2026-04-12;
  // others can be added to widen scope. Counts match what the results page
  // shows (200K gig cohort, 64K verified-eligible after the trust gate).
  /* Cluster catalogue. Each cluster is a generic customer-graph segment.
     Hypothesis-specific filtering (e.g. "verified" rent-day pattern) is NOT
     stored here — that's a function of trust gate and is computed downstream
     in simulateOutcomes() so the number stays consistent everywhere. */
  const CLUSTERS = useMemo(() => [
    {
      id: "gig", n: "Gig · High-Velocity", count: 200000, share: 0.115, drift: "stable",
      primary: true,
      signature: "Friday rent-day cadence · multi-platform inflows · instant-rail outbound 73%",
    },
    {
      id: "smb", n: "Small Business · Seasonal", count: 153000, share: 0.088, drift: "stable",
      signature: "Supplier-payment recurring · seasonal velocity peaks · multi-rail",
    },
    {
      id: "migrant", n: "Mono-Product · Migrant", count: 147000, share: 0.085, drift: "stable",
      signature: "Cross-border remittance corridors · thin-file · low product attach",
    },
    {
      id: "young", n: "Young Affluent · Emergent", count: 138000, share: 0.080, drift: "stable",
      signature: "Equity-event inflections · first brokerage transfers · primacy-ready",
    },
  ], []);
  const [extraClusters, setExtraClusters] = useState([]);
  const toggleCluster = useCallback((id) => {
    setExtraClusters((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }, []);

  // Custom cohort rule builder — rules combine to derive a synthetic count.
  // Empty by default; user opens the panel to add rules.
  const [customRules, setCustomRules] = useState([]);
  const [customOpen, setCustomOpen] = useState(false);
  const addRule = useCallback(() => {
    setCustomRules((prev) => [...prev, { feature: "balance_min", op: "gte", value: 5000 }]);
  }, []);
  const updateRule = useCallback((i, patch) => {
    setCustomRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }, []);
  const removeRule = useCallback((i) => {
    setCustomRules((prev) => prev.filter((_, idx) => idx !== i));
  }, []);
  // Synthetic count: each rule prunes roughly 30-50% of the base cohort.
  // Deterministic so the same rule set produces the same count each render.
  const customCount = useMemo(() => {
    if (customRules.length === 0) return 0;
    const baseN = 38000;
    const factor = customRules.reduce((acc, r, i) => acc * (0.52 + 0.08 * ((i + r.value.toString().length) % 5)), 1);
    return Math.round(baseN * factor);
  }, [customRules]);

  // Aggregate cohort total (in scope) — independent of trust gate (gate is
  // applied downstream to derive verified-eligible).
  const cohortTotal = useMemo(() => {
    const primary = CLUSTERS.find((c) => c.primary);
    const extras = CLUSTERS.filter((c) => extraClusters.includes(c.id));
    return primary.count + extras.reduce((s, c) => s + c.count, 0) + customCount;
  }, [CLUSTERS, extraClusters, customCount]);

  // Single computed bundle that drives both the live config strip and the
  // post-run results. Every lever change flows through here, so cohort
  // counts, NII, blocked, complaints, fair-lending all update in lock-step.
  const outcomes = useMemo(() => simulateOutcomes({
    cohortTotal, trustGate, liftPct, rails, rolloutPct,
    channelMix, frequency, tone, timing,
  }), [cohortTotal, trustGate, liftPct, rails, rolloutPct, channelMix, frequency, tone, timing]);

  const cohortSummary = useMemo(() => {
    const primary = CLUSTERS.find((c) => c.primary);
    const extras = CLUSTERS.filter((c) => extraClusters.includes(c.id));
    return {
      clusters: [primary, ...extras],
      hasCustom: customRules.length > 0,
      totalCount: cohortTotal,
      verifiedEligible: outcomes.verifiedEligible,
      verifiedPct: cohortTotal > 0 ? Math.round((outcomes.verifiedEligible / cohortTotal) * 100) : 0,
    };
  }, [CLUSTERS, extraClusters, customRules.length, cohortTotal, outcomes.verifiedEligible]);

  const fairLendingEst = useMemo(() => ({
    margin: Math.round(outcomes.fairLendingMargin * 100) / 100,
    safe: outcomes.fairLendingSafe,
  }), [outcomes.fairLendingMargin, outcomes.fairLendingSafe]);

  // ---------------- Results payload ----------------
  const [results, setResults] = useState(null);

  const toggleRail = useCallback((id) => {
    setRails((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }, []);

  // Reset all levers back to Twin's recommendation. Used by the "Reset"
  // pill in Guided mode AND automatically when the user switches back to
  // Autopilot (autopilot == "use Twin's settings").
  const resetToRecommended = useCallback(() => {
    setTrustGate(RECOMMENDED.trustGate);
    setLiftPct(RECOMMENDED.liftPct);
    setRails(RECOMMENDED.rails);
    setRolloutPct(RECOMMENDED.rolloutPct);
    setRollbackOn(RECOMMENDED.rollbackOn);
    setChannelMix(RECOMMENDED.channelMix);
    setFrequency(RECOMMENDED.frequency);
    setTone(RECOMMENDED.tone);
    setTiming(RECOMMENDED.timing);
    setProduct(RECOMMENDED.product);
    setIntensity(RECOMMENDED.intensity);
    setOfferChannel(RECOMMENDED.offerChannel);
    setWaitUntilWarm(RECOMMENDED.waitUntilWarm);
    setDeepRollout(RECOMMENDED.deepRollout);
  }, []);

  // "Take over" — when the user wants to escape Autopilot mid-cinematic.
  // Snapshots the current lever state and flips to Guided. The cinematic
  // sequence checks tuneMode each step and bails when it changes.
  const takeOverFromAutopilot = useCallback(() => {
    setTuneMode("guided");
  }, [setTuneMode]);

  // ---------------- Live preview math ----------------
  const preview = useMemo(() => {
    const baseFriction = 22.7;
    const blockedPct = baseFriction * (1 - 0.78 * Math.tanh(liftPct / 26));
    const diMargin = Math.min(0.99, 0.78 + (trustGate - 12) * 0.012 - (liftPct - 10) * 0.0035);
    const railFactor = 0.55 + 0.15 * rails.length;
    const niiEstM = (liftPct / 20) * (rolloutPct / 60) * railFactor * 0.42;
    return {
      blockedPct: blockedPct.toFixed(1),
      diMargin: diMargin.toFixed(2),
      niiEstM: niiEstM.toFixed(2),
      diOk: diMargin >= 0.85,
      blockedOk: blockedPct <= 16,
      niiOk: niiEstM >= 0.15,
    };
  }, [trustGate, liftPct, rails, rolloutPct]);

  // ---------------- Mode handlers ----------------
  const onRun = useCallback(() => {
    setResults(null);
    setMode("running");
    pushAgentEvent({
      kind: "info",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot · running simulation"
        : "What-If simulation kicked off · 8-week horizon",
    });
  }, [pushAgentEvent, tuneMode]);

  const onLoaderComplete = useCallback(() => {
    /* Snapshot the computed outcomes at the moment the sim "converges" so
       the Results page reflects the levers as they were set when Run was
       clicked. Stored on the results object alongside the verdict. */
    setResults({
      ...generateMockResults(outcomes),
      outcomes,
      includeDeepening,
      playKey: Date.now(),
    });
    setMode("results");
    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: `What-If converged · +$${outcomes.NII_8wk_M.toFixed(1)}M NII, −${outcomes.blockedRemoved_qtr.toLocaleString()} failures`,
    });
  }, [pushAgentEvent, outcomes, includeDeepening]);

  const onLoaderCancel = useCallback(() => {
    setMode("config");
  }, []);

  const onBackToConfig = useCallback(() => {
    setResults(null);
    setMode("config");
  }, []);

  const onStage = useCallback(() => {
    const stagedAt = Date.now();
    const policy = {
      id: `p-${stagedAt}`,
      name: PAGE_SUBTITLE,
      hypothesis: selectedHypothesisId,
      cluster: "gig-economy",
      themeId: selectedHypothesisId,
      trustGate, liftPct, rails, rolloutPct,
      pilotDuration, /* persists from Simulate → Deploy workflow */
      /* includeDeepening determines RCT KPI set in Deploy + arena visibility
         in results — if false, attach/adoption metrics don't apply. */
      includeDeepening,
      channelMix, frequency, tone, timing,
      product, intensity, offerChannel, waitUntilWarm, deepRollout,
      stagedBy: tuneMode === "autopilot" ? "autopilot" : "user",
      status: "pending",
      stagedAt,
    };
    stagePolicy(policy);

    // Record a decision-trace record so Deploy and Learn can show
    // "How Twin chose these values" in autopilot reviews.
    if (tuneMode === "autopilot") {
      recordDecisionTrace({
        hypothesisId: selectedHypothesisId,
        policyId: policy.id,
        levers: {
          trustGate, liftPct, rails, rolloutPct, rollbackOn,
          channelMix, frequency, tone, timing,
          product, intensity, offerChannel, waitUntilWarm, deepRollout,
        },
        reasoning: [
          "18-month verified pattern excludes high-volatility histories",
          "+20% lift sits 0.09 above the 0.85 disparity floor",
          "60% rollout — significance-readable and recallable in <48h",
        ],
        scenarios: 124312,
      });
    }

    pushAgentEvent({
      kind: "good",
      src: "Simulation",
      text: tuneMode === "autopilot"
        ? "Autopilot staged policy for Deploy"
        : "Policy staged for Deploy",
    });

    // Show the "Staged for Deploy" intermezzo for ~1.5s, then route to
    // Deploy. The intermezzo is rendered globally by <Shell /> via the
    // AppShell.intermezzo state.
    setIntermezzo(tuneMode === "autopilot" ? "staged-autopilot" : "staged-guided");
    setTimeout(() => {
      setIntermezzo(null);
      navWorkspace("deploy");
    }, 1500);
  }, [
    selectedHypothesisId, trustGate, liftPct, rails, rolloutPct, rollbackOn,
    channelMix, frequency, tone, timing,
    product, intensity, offerChannel, waitUntilWarm, deepRollout,
    tuneMode, stagePolicy, recordDecisionTrace, setIntermezzo,
    pushAgentEvent, navWorkspace,
  ]);

  // ---------------- AUTOPILOT cinematic sequence ----------------
  // When the user picks Autopilot upstream and lands here, run a short
  // watchable sequence:
  //   T+1.5s   → auto-click Run (triggers the loader)
  //   loader-onComplete → results land (existing path)
  //   T+~3.5s after results → auto-click Stage (triggers intermezzo + Deploy)
  // User can press "Take over" to fall back to Guided; the guards re-check
  // tuneMode at every async step and bail if the user has switched.
  const hasAutoRunRef = useRef(false);
  const hasAutoStagedRef = useRef(false);

  useEffect(() => {
    if (!isAutopilot) return;
    if (hasAutoRunRef.current) return;
    if (mode !== "config") return;
    hasAutoRunRef.current = true;
    const id = setTimeout(() => {
      // Re-check guards — user may have hit "Take over" in the meantime.
      if (tuneMode === "autopilot" && mode === "config") onRun();
    }, 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutopilot]);

  useEffect(() => {
    if (!isAutopilot) return;
    if (mode !== "results") return;
    if (hasAutoStagedRef.current) return;
    hasAutoStagedRef.current = true;
    // Let the results animation breathe (~3.5s reveals: verdict → KPIs →
    // trajectory) before auto-staging.
    const id = setTimeout(() => {
      if (tuneMode === "autopilot") onStage();
    }, 3500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isAutopilot]);

  // ---------------- Retention dispatch ----------------
  // Retention theme: dispatch to RetentionSimulateView. Placed AFTER all
  // hook declarations to satisfy the Rules of Hooks — early-return before
  // hooks would crash on any theme switch (different hook count per render).
  if (selectedThemeId === "retention") {
    return <RetentionSimulateView />;
  }
  if (selectedThemeId === "liquidity") {
    return <LiquiditySimulateView />;
  }
  if (selectedThemeId === "wealth") {
    return <WealthSimulateView />;
  }
  if (selectedThemeId === "smbrate") {
    return <SmbRateSimulateView />;
  }
  if (selectedThemeId === "smbgrowth") {
    return <SmbGrowthSimulateView />;
  }
  if (isB2B(selectedThemeId)) {
    return <B2BSimulateView />;
  }

  // ---------------- Entry gate ----------------
  if (!selectedHypothesisId) {
    return (
      <div className="tj-empty">
        <div className="test-journey-eyebrow">TESTING · WAITING</div>
        <h2>Pick a signal first</h2>
        <p>
          The Test page runs against an adopted hypothesis. Head back to the Cockpit, open a theme drawer,
          and pick the signal you want to test.
        </p>
        <button className="tj-btn tj-btn-primary" onClick={() => navWorkspace("cockpit")}>
          Open Cockpit <Icon name="arrowRight" size={14} />
        </button>
      </div>
    );
  }

  // ---------------- IF-WHAT branch ----------------
  // Goal + parameter ranges → optimizer → Pareto + top 3. Completely
  // different shape from the What-If lever workbench below.
  if (isIfWhat) {
    if (mode === "results") {
      return (
        <IfWhatResults
          isAutopilot={isAutopilot}
          objective={ifWhatObjective}
          onBackToConfig={onBackToConfig}
          onStage={(rec) => {
            // Build a policy snapshot from the picked recommendation so it
            // flows through the same stagePolicy → Deploy pipeline as What-If.
            const stagedAt = Date.now();
            const policy = {
              id: `p-${stagedAt}`,
              name: rec.name,
              hypothesis: selectedHypothesisId,
              cluster: "gig-economy",
              themeId: selectedHypothesisId,
              source: "ifwhat-optimizer",
              rank: rec.rank,
              config: rec.config,
              stagedBy: isAutopilot ? "autopilot" : "user",
              status: "pending",
              stagedAt,
            };
            stagePolicy(policy);
            pushAgentEvent({
              kind: "good",
              src: "Optimizer",
              text: isAutopilot
                ? `Autopilot picked #${rec.rank}: ${rec.name}`
                : `Staged #${rec.rank}: ${rec.name}`,
            });
            setIntermezzo(isAutopilot ? "staged-autopilot" : "staged-guided");
            setTimeout(() => {
              setIntermezzo(null);
              navWorkspace("deploy");
            }, 1500);
          }}
        />
      );
    }
    // Running overlay shared with What-If — uses the existing loader.
    return (
      <>
        <IfWhatConfig
          objective={ifWhatObjective}
          setObjective={setIfWhatObjective}
          ranges={ifWhatRanges}
          setRanges={setIfWhatRanges}
          enums={ifWhatEnums}
          setEnums={setIfWhatEnums}
          isAutopilot={isAutopilot}
          takeOver={() => setTuneMode("guided")}
          onRun={onRun}
        />
        {mode === "running" && (
          <div className="sim-overlay" role="dialog" aria-modal="true" aria-label="Optimizer running">
            <div className="sim-overlay-backdrop" />
            <div className="sim-overlay-card">
              <SimulationLoader
                variant="whatif"
                includeDeepening={includeDeepening}
                onComplete={onLoaderComplete}
                onCancel={onLoaderCancel}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // ---------------- RESULTS MODE ----------------
  if (mode === "results" && results) {
    return (
      <div className="results-page">
        <header className="results-page-header">
          <button className="tj-btn tj-btn-ghost" onClick={onBackToConfig}>
            <Icon name="arrowLeft" size={14} /> Tune and re-run
          </button>
          <div className="results-page-title">
            <div className="test-journey-eyebrow">RESULTS · {PAGE_SUBTITLE.toUpperCase()}</div>
            <h1 className="test-journey-title">Hypothesis testing results</h1>
          </div>
          <div className="results-page-spacer" />
        </header>
        <div className="results-page-body">
          <ResultsReveal
            results={results}
            blockedPct={preview.blockedPct}
            onReRun={onBackToConfig}
            onStage={onStage}
          />
        </div>
      </div>
    );
  }

  // ---------------- CONFIG MODE (default; also rendered behind RUNNING overlay) ----------------
  return (
    <>
      <div className="sim-workspace">
        {/* HEADER — title + mode indicator (the picker now lives upstream on
            the test-mode branching screen, not here). In Autopilot the
            indicator pulses + offers "Take over" to bail to Guided. In
            Guided it offers a quiet "Reset to Twin's recommendations" link. */}
        <header className="sim-ws-header">
          <div className="sim-ws-header-title">
            <div className="test-journey-eyebrow">TESTING · {PAGE_SUBTITLE.toUpperCase()}</div>
            <h1 className="test-journey-title">{PAGE_SUBTITLE}</h1>
            <p className="test-journey-sub">
              Hypothesis H-2026-04-12 · gig-economy segment · {outcomes.verifiedEligible.toLocaleString()} verified at {trustGate}-mo gate
            </p>
          </div>
          <div className="sim-ws-header-mode">
            {isAutopilot ? (
              <>
                <div className="sim-mode-pill sim-mode-pill-autopilot">
                  <span className="sim-mode-pill-dot" />
                  <span className="sim-mode-pill-l">AUTOPILOT</span>
                  <span className="sim-mode-pill-sub">Twin is running this test</span>
                </div>
                <button className="sim-mode-takeover" onClick={takeOverFromAutopilot}>
                  <Icon name="arrowLeft" size={11} /> Take over
                </button>
              </>
            ) : (
              <>
                <div className="sim-mode-pill sim-mode-pill-guided">
                  <span className="sim-mode-pill-l">WHAT-IF</span>
                  <span className="sim-mode-pill-sub">Workbench unlocked — tune the policy, simulate, see outcomes</span>
                </div>
                <button className="sim-mode-reset" onClick={resetToRecommended}>
                  <Icon name="learn" size={11} /> Reset to Twin's recommendations
                </button>
              </>
            )}
          </div>
        </header>

        {/* PRIOR-ANCHOR PILL — surfaces the Learn-side model updates that
            this sim will use as its prior. Only renders if the active
            hypothesis has a prior pilot that wrote back updates. Closes
            the visible loop: yesterday's RCT is today's simulation prior. */}
        <PriorAnchorPill hypothesisId={selectedHypothesisId} />

        {/* BODY — full-width single column. The right-side context charts
            (eligibility funnel, conversion funnel, fairness chart) were
            removed: during configuration the user is *deciding* on inputs,
            not analyzing outputs. The fair-lending guardrail — the only
            load-bearing live signal — survives as a compact status pill
            in the sticky strip at the top. */}
        <div className="sim-ws-body sim-ws-single">
          {/* STICKY STRIP — selected cohort summary + guardrail pill + Run.
              This is the only place "live" output appears during config;
              everything else is for setting inputs. */}
          <div className="sim-config-strip">
            <div className="sim-config-strip-cohort">
              <div className="sim-config-strip-cohort-h">
                <span className="sim-config-strip-l">Selected cohort</span>
                <span className="sim-config-strip-chips">
                  {cohortSummary.clusters.map((c) => (
                    <span key={c.id} className="sim-config-strip-chip">{c.n.split(" · ")[0]}</span>
                  ))}
                  {cohortSummary.hasCustom && (
                    <span className="sim-config-strip-chip sim-config-strip-chip-custom">Custom cohort</span>
                  )}
                </span>
              </div>
              <div className="sim-config-strip-counts">
                <span><b>{cohortSummary.totalCount.toLocaleString()}</b> customers in scope</span>
                <span className="sim-config-strip-sep">·</span>
                <span
                  className="sim-config-strip-verified"
                  title={`Verified = customers with ≥ ${trustGate} months of recurring landlord rent-day pattern. The verified-history slider moves this number — raise the gate, fewer qualify.`}
                >
                  <b>{cohortSummary.verifiedEligible.toLocaleString()}</b> verified ({cohortSummary.verifiedPct}% @ {trustGate}-mo gate)
                </span>
              </div>
            </div>
            <div className={"sim-config-strip-guard " + (fairLendingEst.safe ? "is-safe" : "is-breach")}>
              <span className="sim-config-strip-guard-dot" />
              <span className="sim-config-strip-guard-l">Fair-lending</span>
              <span className="sim-config-strip-guard-v">{fairLendingEst.margin.toFixed(2)}</span>
              <span className="sim-config-strip-guard-vs">vs 0.85 floor</span>
            </div>
            <button
              className="tj-btn tj-btn-primary tj-btn-lg sim-run-btn sim-config-strip-run"
              onClick={onRun}
              disabled={mode === "running"}
            >
              <Icon name="play" size={14} /> Run Simulation
            </button>
          </div>

          <section className="panel sim-ws-col sim-ws-levers sim-ws-levers-full">
            <div className="panel-body sim-ws-col-scroll">
              <fieldset
                className={"sim-lever-fieldset" + (isAutopilot ? " is-autopilot" : "")}
                disabled={isAutopilot}
              >
                {/* 1. COHORT — preset chips + dynamic rule builder for custom.
                    Counts and verified-eligible numbers anchor everything the
                    results page will show. No outcomes here — descriptive only. */}
                <div className="sim-lever-section sim-lever-section-cohort">
                  <div className="sim-lever-section-band">
                    <span className="sim-lever-section-num">1</span>
                    <span className="sim-lever-section-name">COHORT</span>
                    <span className="sim-lever-section-meta">Who the scenario runs on</span>
                  </div>
                  <div className="sim-cohort-presets">
                    {CLUSTERS.map((c) => {
                      const isSelected = c.primary || extraClusters.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={
                            "sim-cohort-card" +
                            (isSelected ? " is-on" : "") +
                            (c.primary ? " is-primary" : "")
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={c.primary}
                            onChange={() => !c.primary && toggleCluster(c.id)}
                          />
                          <div className="sim-cohort-card-h">
                            <span className="sim-cohort-card-n">{c.n}</span>
                            {c.primary && <span className="sim-cohort-card-tag">primary</span>}
                          </div>
                          <div className="sim-cohort-card-counts">
                            <span><b>{(c.count / 1000).toFixed(0)}K</b> customers</span>
                            <span className="sim-cohort-card-sep">·</span>
                            <span>{(c.share * 100).toFixed(1)}% of book</span>
                            <span className="sim-cohort-card-sep">·</span>
                            <span>drift {c.drift}</span>
                          </div>
                          <div className="sim-cohort-card-sig">{c.signature}</div>
                          {c.composition && (
                            <div className="sim-cohort-card-composition">
                              <div className="sim-cohort-card-comp-l">Composition</div>
                              <div className="sim-cohort-card-comp-rows">
                                {c.composition.map((p, i) => (
                                  <div key={i} className="sim-cohort-card-comp-row">
                                    <span className="sim-cohort-card-comp-bar-wrap">
                                      <span
                                        className="sim-cohort-card-comp-bar"
                                        style={{ width: `${p.pct}%` }}
                                      />
                                    </span>
                                    <span className="sim-cohort-card-comp-label">{p.label}</span>
                                    <span className="sim-cohort-card-comp-pct">{p.pct}%</span>
                                  </div>
                                ))}
                              </div>
                              <div className="sim-cohort-card-comp-hint">
                                To target a subgroup, use the custom-cohort rule builder below.
                              </div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {/* Custom cohort builder — collapsed by default. Distinct
                      from the preset clusters above: this defines an
                      ADDITIONAL group by feature-rules, scoped only to this
                      scenario. The customer counts ADD to the preset
                      clusters selected above (it's a union, not a filter
                      on those clusters). Stays out of the global catalogue. */}
                  <div className={"sim-cohort-custom" + (customOpen ? " is-open" : "")}>
                    <button
                      type="button"
                      className="sim-cohort-custom-toggle"
                      onClick={() => setCustomOpen((v) => !v)}
                    >
                      <Icon name={customOpen ? "chevronDown" : "chevronRight"} size={12} />
                      Add a custom cohort (rule-defined)
                      {customRules.length > 0 && (
                        <span className="sim-cohort-custom-count">
                          {customRules.length} rule{customRules.length === 1 ? "" : "s"} · ~{customCount.toLocaleString()} additional customers
                        </span>
                      )}
                    </button>
                    {customOpen && (
                      <div className="sim-cohort-custom-body">
                        <div className="sim-cohort-custom-model">
                          <b>How this works:</b> a custom cohort is an <em>additional</em> group defined by feature rules — it gets <em>added to</em> the preset clusters above, not used to filter them. The customer count is unioned. Scoped to this scenario only; not saved to the global catalogue.
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
                                >
                                  <option value="balance_min">Avg balance</option>
                                  <option value="velocity_30d">Txn velocity (30d)</option>
                                  <option value="zelle_share">Zelle outbound share</option>
                                  <option value="recurring_strength">Recurring-pattern strength</option>
                                  <option value="counterparty_diversity">Counterparty diversity</option>
                                  <option value="tenure_months">Tenure (months)</option>
                                </select>
                                <select
                                  value={r.op}
                                  onChange={(e) => updateRule(i, { op: e.target.value })}
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
                                />
                                <button
                                  type="button"
                                  className="sim-cohort-custom-rm"
                                  onClick={() => removeRule(i)}
                                  aria-label="Remove rule"
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
                        >
                          + Add rule
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. PRODUCTS · RAILS — full-width single row; only one
                    lever (rail picker) so a 2-col split with Policy left
                    half the section empty. Inline horizontal layout works. */}
                <div className="sim-lever-section sim-lever-section-products">
                  <div className="sim-lever-section-band">
                    <span className="sim-lever-section-num">2</span>
                    <span className="sim-lever-section-name">PRODUCTS · RAILS</span>
                    <span className="sim-lever-section-meta">Which rails the policy applies to</span>
                  </div>
                  <div className="sim-lever-list">
                    <LeverRow
                      label="Eligible payment rails"
                      caption="Which rails the policy change applies to. RTP is the rail being enabled for verified recurring patterns; the others widen scope (but ACH next-day settle won't clear rent-day timing on its own)."
                    >
                      <div className="lever-checks">
                        {[
                          ["rtp", "RTP"],
                          ["ach", "ACH"],
                          ["zelle", "Zelle"],
                          ["wire", "Wire"],
                        ].map(([id, lbl]) => (
                          <label key={id} className={"lever-check" + (rails.includes(id) ? " on" : "")}>
                            <input type="checkbox" checked={rails.includes(id)} onChange={() => toggleRail(id)} />
                            {lbl}
                          </label>
                        ))}
                      </div>
                    </LeverRow>
                  </div>
                </div>

                {/* 3. POLICY band — full-width below Products. */}
                <div className="sim-lever-section sim-lever-section-policy">
                  <div className="sim-lever-section-band">
                    <span className="sim-lever-section-num">3</span>
                    <span className="sim-lever-section-name">POLICY</span>
                    <span className="sim-lever-section-meta">The rules being changed</span>
                  </div>
                  <div className="sim-lever-list">
                    <LeverRow
                      label="Verified-history requirement"
                      caption="Months of recurring payments to the same payee a customer must show before they qualify."
                      value={`${trustGate} mo`}
                      offDefault={trustGate !== RECOMMENDED.trustGate}
                    >
                      <RangeWithBubble
                        min={12} max={30} step={3}
                        value={trustGate}
                        onChange={(e) => setTrustGate(Number(e.target.value))}
                        formatter={(v) => `${v} mo`}
                      />
                      <RangeScale marks={["12mo", "18mo", "24mo", "30mo"]} />
                    </LeverRow>

                    <LeverRow
                      label="RTP send-limit lift"
                      caption="How much the per-transaction RTP send limit is raised for payments to the verified counterparty. The bank's customer-level RTP cap (typically $1,200 for this segment) is what blocks rent today — lifting it lets payments above that threshold clear same-hour instead of falling through to next-day ACH."
                      value={`+${liftPct}%`}
                      offDefault={liftPct !== RECOMMENDED.liftPct}
                    >
                      <RangeWithBubble
                        min={10} max={40} step={5}
                        value={liftPct}
                        onChange={(e) => setLiftPct(Number(e.target.value))}
                        formatter={(v) => `+${v}%`}
                      />
                      <RangeScale marks={["+10%", "+20%", "+30%", "+40%"]} />
                    </LeverRow>

                    <LeverRow
                      label="Pilot population"
                      caption="Share of eligible customers included in this pilot."
                      value={`${rolloutPct}%`}
                      offDefault={rolloutPct !== RECOMMENDED.rolloutPct}
                    >
                      <RangeWithBubble
                        min={30} max={90} step={10}
                        value={rolloutPct}
                        onChange={(e) => setRolloutPct(Number(e.target.value))}
                        formatter={(v) => `${v}%`}
                      />
                      <RangeScale marks={["30%", "60%", "90%"]} />
                    </LeverRow>

                    <LeverRow
                      label="Auto-rollback"
                      caption="Automatically suspend the policy if any guardrail breaches during pilot."
                    >
                      <label className={"lever-check" + (rollbackOn ? " on" : "")}>
                        <input
                          type="checkbox"
                          checked={rollbackOn}
                          onChange={() => setRollbackOn((v) => !v)}
                        />
                        Enabled on guardrail breach
                      </label>
                    </LeverRow>
                  </div>
                </div>

                {/* 4. COMMUNICATIONS band */}
                <div className="sim-lever-section sim-lever-section-comms">
                  <div className="sim-lever-section-band">
                    <span className="sim-lever-section-num">4</span>
                    <span className="sim-lever-section-name">COMMUNICATIONS</span>
                    <span className="sim-lever-section-meta">How customers hear about the change</span>
                  </div>
                  <div className="sim-lever-list">
                    <LeverRow
                      label="Channel mix"
                      caption="How the announcement is distributed across communication channels (must total 100%)."
                      value={`${Object.values(channelMix).reduce((a, b) => a + b, 0)}% total`}
                    >
                      <div className="lever-channel-mix">
                        {[
                          ["inapp", "In-app"],
                          ["push", "Push"],
                          ["email", "Email"],
                          ["sms", "SMS"],
                          ["rm", "RM"],
                        ].map(([k, lbl]) => (
                          <div key={k} className="lever-channel-row">
                            <span className="lever-channel-lbl">{lbl}</span>
                            <input
                              type="range" min={0} max={100} step={1}
                              value={channelMix[k]}
                              onChange={(e) => setChannelMix((prev) => ({ ...prev, [k]: Number(e.target.value) }))}
                            />
                            <span className="lever-channel-val">{channelMix[k]}%</span>
                          </div>
                        ))}
                      </div>
                    </LeverRow>

                    <LeverRow
                      label="Announcement frequency"
                      caption="Customer communications per week during the rollout period."
                      value={`${frequency}/wk`}
                      offDefault={frequency !== RECOMMENDED.frequency}
                    >
                      <RangeWithBubble
                        min={1} max={5} step={1}
                        value={frequency}
                        onChange={(e) => setFrequency(Number(e.target.value))}
                        formatter={(v) => `${v} / wk`}
                      />
                      <RangeScale marks={["1", "2", "3", "4", "5"]} />
                    </LeverRow>

                    <LeverRow
                      label="Communication style"
                      caption="Tone of the customer-facing announcement copy."
                    >
                      <select value={tone} onChange={(e) => setTone(e.target.value)}>
                        <option value="proactive">Proactive</option>
                        <option value="educational">Educational</option>
                        <option value="generic">Generic</option>
                      </select>
                    </LeverRow>

                    <LeverRow
                      label="Send timing"
                      caption="When the announcement is delivered relative to typical customer payday."
                    >
                      <select value={timing} onChange={(e) => setTiming(e.target.value)}>
                        <option value="pre-payout">Pre-payday</option>
                        <option value="always-on">Always-on</option>
                      </select>
                    </LeverRow>
                  </div>
                </div>

                {/* 5. SIMULATION DURATION — own section above the
                    collapsed FOLLOW-ON, matching the retention What-If
                    layout. The model horizon every candidate is scored
                    over. Pilot RCT length lives in Deploy. */}
                <div className="sim-lever-section">
                  <div className="sim-lever-section-band">
                    <span className="sim-lever-section-num">5</span>
                    <span className="sim-lever-section-name">SIMULATION DURATION</span>
                    <span className="sim-lever-section-meta">Model horizon the simulator runs over</span>
                  </div>
                  <div className="sim-lever-list">
                    <LeverRow
                      label="Weeks"
                      caption="Time horizon the model runs over. Longer horizons let secondary effects (comms ramp, primacy lift) materialise; shorter horizons sharpen the immediate signal. The pilot RCT length is set separately in Deploy."
                      value={`${pilotDuration} weeks`}
                      offDefault={pilotDuration !== 8}
                    >
                      <RangeWithBubble
                        min={4} max={12} step={2}
                        value={pilotDuration}
                        onChange={(e) => setPilotDuration(Number(e.target.value))}
                        formatter={(v) => `${v} weeks`}
                      />
                      <RangeScale marks={["4w", "6w", "8w", "10w", "12w"]} />
                    </LeverRow>
                  </div>
                </div>

                {/* 6. FOLLOW-ON OFFER band — cross-sell/deepening levers,
                    not directly tied to the friction-removal hypothesis.
                    Collapsed by default so the primary levers (cohort →
                    products → policy → comms) are uncluttered; user can
                    open this to model the deepening arena. */}
                <details className="sim-lever-section sim-lever-advanced">
                  <summary className="sim-lever-section-h sim-lever-section-h-advanced">
                    <span>6 · FOLLOW-ON OFFER</span>
                    <span className="sim-lever-advanced-tag">advanced · optional</span>
                  </summary>
                  <div className="sim-lever-advanced-note">
                    Cross-sell levers — only relevant if you want to attach a deepening offer to customers who actually use the lifted RTP send-limit. If left off, the test scope stays friction-removal only.
                  </div>
                  <label className="sim-lever-include">
                    <input
                      type="checkbox"
                      checked={includeDeepening}
                      onChange={(e) => setIncludeDeepening(e.target.checked)}
                    />
                    <span className="sim-lever-include-l">Include follow-on offer in this test</span>
                    {includeDeepening
                      ? <span className="sim-lever-include-tag sim-lever-include-tag-on">in scope</span>
                      : <span className="sim-lever-include-tag">excluded</span>
                    }
                  </label>
                  <fieldset
                    className={"sim-lever-list sim-lever-deepening" + (includeDeepening ? "" : " is-excluded")}
                    disabled={!includeDeepening}
                  >
                    <LeverRow
                      label="Follow-on product offer"
                      caption="The product offered to customers who actively use the lifted RTP send-limit."
                    >
                      <select value={product} onChange={(e) => setProduct(e.target.value)}>
                        <option value="hy_savings">HY Savings</option>
                        <option value="secured_card">Secured Card</option>
                        <option value="ewa">Earned-wage access</option>
                        <option value="credit_builder">Credit Builder</option>
                        <option value="dd_switch">Direct-deposit switch</option>
                      </select>
                    </LeverRow>

                    <LeverRow
                      label="Offer prominence"
                      caption="How prominently the follow-on product is shown (1 = subtle, 4 = top-of-app)."
                      value={String(intensity)}
                      offDefault={intensity !== RECOMMENDED.intensity}
                    >
                      <RangeWithBubble
                        min={1} max={4} step={1}
                        value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        formatter={(v) => `level ${v}`}
                      />
                      <RangeScale marks={["1", "2", "3", "4"]} />
                    </LeverRow>

                    <LeverRow
                      label="Offer channel"
                      caption="Where the follow-on offer is delivered."
                    >
                      <select value={offerChannel} onChange={(e) => setOfferChannel(e.target.value)}>
                        <option value="inapp">In-app</option>
                        <option value="rm">RM</option>
                        <option value="lifecycle">Lifecycle</option>
                      </select>
                    </LeverRow>

                    <LeverRow
                      label="Days before follow-on offer"
                      caption="Percent of the pilot period that elapses before the follow-on offer begins."
                      value={`${waitUntilWarm}%`}
                      offDefault={waitUntilWarm !== RECOMMENDED.waitUntilWarm}
                    >
                      <RangeWithBubble
                        min={30} max={70} step={5}
                        value={waitUntilWarm}
                        onChange={(e) => setWaitUntilWarm(Number(e.target.value))}
                        formatter={(v) => `${v}%`}
                      />
                      <RangeScale marks={["30%", "50%", "70%"]} />
                    </LeverRow>

                    <LeverRow
                      label="Follow-on offer reach"
                      caption="Percent of qualifying customers shown the follow-on offer."
                      value={`${deepRollout}%`}
                      offDefault={deepRollout !== RECOMMENDED.deepRollout}
                    >
                      <RangeWithBubble
                        min={30} max={90} step={10}
                        value={deepRollout}
                        onChange={(e) => setDeepRollout(Number(e.target.value))}
                        formatter={(v) => `${v}%`}
                      />
                      <RangeScale marks={["30%", "60%", "90%"]} />
                    </LeverRow>
                  </fieldset>
                </details>
              </fieldset>
            </div>
          </section>

          {/* RIGHT RAIL REMOVED — the eligibility/conversion funnel previews
              and fair-lending chart used to live here. They blurred the
              "config" mental model by showing outputs during input setup,
              and two were visually redundant (both funnels). The single
              load-bearing signal — fair-lending margin vs floor — moved
              to the compact pill in the sticky strip above the levers.
              All chart math now drives the post-sim Results page. */}
        </div>
      </div>

      {/* RUNNING overlay — config stays mounted behind, dimmed */}
      {mode === "running" && (
        <div className="sim-overlay" role="dialog" aria-modal="true" aria-label="Simulation running">
          <div className="sim-overlay-backdrop" />
          <div className="sim-overlay-card">
            <SimulationLoader
              variant="whatif"
              includeDeepening={includeDeepening}
              onComplete={onLoaderComplete}
              onCancel={onLoaderCancel}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ----------------------------------------------------------------------------
   Verdict — green / amber / red callout above the results table.
---------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   PriorAnchorPill — closes the visible learning loop.

   When this hypothesis has been piloted before AND the pilot wrote back
   model updates (see LearnWorkspace.MOCK_EXPERIMENTS), this pill surfaces
   the anchor pilot + the most-meaningful prior update so the user *sees*
   today's sim using yesterday's RCT learnings, not the original prior.

   Hidden when no anchor pilot exists — no false signal of learning.
--------------------------------------------------------------------------- */
function PriorAnchorPill({ hypothesisId }) {
  if (!hypothesisId) return null;
  /* Find the most recent pilot for this hypothesis that has model updates. */
  const anchor = MOCK_EXPERIMENTS
    .filter((e) => e.hypothesis === hypothesisId && e.modelUpdates && e.modelUpdates.length > 0)
    .sort((a, b) => b.closedAt - a.closedAt)[0];
  if (!anchor) return null;
  /* Surface the headline update — first non-flag one if present, else first. */
  const headline = anchor.modelUpdates.find((u) => u.dir !== "flag") || anchor.modelUpdates[0];
  return (
    <div className="sim-prior-anchor">
      <span className="sim-prior-anchor-pill">PRIOR · ANCHORED</span>
      <span className="sim-prior-anchor-text">
        Using updated priors from <b>{anchor.id}</b> · <code>{headline.driver}</code>
        {headline.dir === "flag" ? (
          <> = <b>{String(headline.after)}</b></>
        ) : (
          <> {String(headline.before)} → <b>{String(headline.after)}</b> ({headline.dir === "up" ? "↑" : headline.dir === "down" ? "↓" : "+"})</>
        )}
      </span>
      <span className="sim-prior-anchor-sub">
        +{anchor.modelUpdates.length - 1} other update{anchor.modelUpdates.length - 1 === 1 ? "" : "s"} from this pilot · fidelity {anchor.fidelity.toFixed(2)} R²
      </span>
    </div>
  );
}

function computeVerdict({ niiOk, failuresOk, fraudOk, diOk }) {
  if (niiOk && failuresOk && fraudOk && diOk) return "proven";
  if (niiOk && failuresOk && (!fraudOk || !diOk)) return "mixed";
  return "disproven";
}

function Verdict({ verdict }) {
  // Note: a simulation can support or fail to support a hypothesis — it
  // cannot "prove" one. Using prove/disprove framing in a banking decision
  // tool undermines the credibility of every guardrail number on the page.
  if (verdict === "proven") {
    return (
      <div className="verdict-callout verdict-proven">
        <span className="verdict-glyph"><Icon name="check" size={20} strokeWidth={2.5} /></span>
        <div className="verdict-body">
          <div className="verdict-title">SIMULATION SUPPORTS HYPOTHESIS</div>
          <div className="verdict-sub">All predicted outcomes hit · all guardrails clear</div>
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
          <div className="verdict-sub">Main outcomes hit · one or more guardrails at risk</div>
        </div>
      </div>
    );
  }
  return (
    <div className="verdict-callout verdict-disproven">
      <span className="verdict-glyph"><Icon name="x" size={20} strokeWidth={2.5} /></span>
      <div className="verdict-body">
        <div className="verdict-title">SIMULATION DOES NOT SUPPORT HYPOTHESIS</div>
        <div className="verdict-sub">Predicted outcomes missed or a guardrail was breached</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   LeverRow — single tunable knob.

   New design: name (13px sans, weight 600) + plain-English caption + a value
   badge that goes amber when the value deviates from Twin's default. The
   caption is the biggest readability win — every lever now has a one-line
   explanation in business language, not just a label.
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
    <div className="range-scale">
      {marks.map((m) => (
        <span key={m}>{m}</span>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   ResultsReveal — orchestrates the staged reveal:
     A) Verdict        (0ms)
     B) KPI shells     (200ms)
     C) J-curve draw + KPI counters (600ms, 3000ms)
     D) Inflection pulse (mid)
     E) Arena cards    (3700ms staggered)
     F) Actions        (4400ms)
---------------------------------------------------------------------------- */
function ResultsReveal({ results, blockedPct, onReRun, onStage }) {
  const { verdict, playKey, outcomes, includeDeepening } = results;
  /* Defensive default: if a legacy results payload arrives without outcomes,
     fall back to the calibrated anchor values so the page still renders. */
  const o = outcomes || {
    NII_8wk_M: 1.19, NII_annual_M: 5.6,
    blockedRemoved_qtr: 29300, blockedRemoved_yr: 236000,
    complaints_qtr: 840, complaints_yr: 3360,
    ccSavings_M: 1.68, fairLendingMargin: 0.94,
    treatmentN: 34500, controlN: 3850,
    baselineBlocked_qtr: 37500, baselineBlocked_yr: 150000,
    baselineComplaints_qtr: 1080, baselineComplaints_yr: 4320,
  };
  const deepeningOn = !!includeDeepening;
  const [showVerdict, setShowVerdict] = useState(false);
  const [showKpis, setShowKpis] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showArenas, setShowArenas] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cur, setCur] = useState(0);
  // Which arena card is expanded for drill-down. null = none open.
  const [openArena, setOpenArena] = useState(null);
  const toggleArena = (k) => setOpenArena((cur) => (cur === k ? null : k));

  const timersRef = useRef([]);
  const rafRef = useRef(null);
  const rafKpiRef = useRef(null);

  useEffect(() => {
    setShowVerdict(false);
    setShowKpis(false);
    setShowChart(false);
    setShowArenas(false);
    setShowActions(false);
    setProgress(0);
    setCur(0);

    const t = (ms, fn) => {
      const id = setTimeout(fn, ms);
      timersRef.current.push(id);
    };
    t(0,    () => setShowVerdict(true));
    t(200,  () => setShowKpis(true));
    t(600,  () => setShowChart(true));
    t(3700, () => setShowArenas(true));
    t(4400, () => setShowActions(true));

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (rafKpiRef.current) cancelAnimationFrame(rafKpiRef.current);
    };
  }, [playKey]);

  useEffect(() => {
    if (!showChart) return;
    const W = 8;
    const durChart = 3000;
    const durKpi = 1500;
    let chartT0 = null;
    let kpiT0 = null;
    const ease = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const frame = (now) => {
      if (chartT0 === null) chartT0 = now;
      const p = Math.min(1, (now - chartT0) / durChart);
      setCur(ease(p) * W);
      if (p < 1) rafRef.current = requestAnimationFrame(frame);
      else setCur(W);
    };
    const frameKpi = (now) => {
      if (kpiT0 === null) kpiT0 = now;
      const p = Math.min(1, (now - kpiT0) / durKpi);
      setProgress(ease(p));
      if (p < 1) rafKpiRef.current = requestAnimationFrame(frameKpi);
      else setProgress(1);
    };
    rafRef.current = requestAnimationFrame(frame);
    rafKpiRef.current = requestAnimationFrame(frameKpi);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (rafKpiRef.current) cancelAnimationFrame(rafKpiRef.current);
    };
  }, [showChart, playKey]);

  const kpis = useMemo(() => ([
    {
      key: "nii",
      label: "Net Interest Income",
      finalNum: o.NII_8wk_M,
      fmt: (n) => `+$${n.toFixed(1)}M`,
      ci: `CI $${(o.NII_8wk_M * 0.73).toFixed(1)}–$${(o.NII_8wk_M * 1.27).toFixed(1)}M`,
      status: "ok",
      shape: (t) => 1 - Math.exp(-t / 2.2),
    },
    {
      key: "fail",
      label: "Failures removed",
      finalNum: o.blockedRemoved_qtr,
      fmt: (n) => `−${Math.round(n).toLocaleString()}/qtr`,
      ci: "vs baseline",
      status: "ok",
      shape: (t) => 1 - Math.exp(-t / 1.6),
    },
    {
      key: "fraud",
      label: "Fraud impact",
      finalNum: 0,
      fmt: () => "CI ≤ 0",
      ci: "within guardrail",
      status: "ok",
      shape: (t) => 0.5 * Math.sin(t / 1.5) * 0.2,
    },
    {
      key: "di",
      label: "Fair-lending margin",
      finalNum: o.fairLendingMargin,
      fmt: (n) => n.toFixed(2),
      ci: o.fairLendingMargin >= 0.85 ? "above 0.85 floor" : "BELOW 0.85 floor",
      status: o.fairLendingMargin >= 0.85 ? "ok" : "miss",
      shape: (t) => 0.85 + (o.fairLendingMargin - 0.85) * (1 - Math.exp(-t / 2.0)),
      flat: true,
    },
    {
      key: "cc",
      label: "Call-centre savings",
      finalNum: o.ccSavings_M,
      fmt: (n) => `−$${n.toFixed(1)}M`,
      ci: "cost down",
      status: "ok",
      shape: (t) => 1 - Math.exp(-t / 2.4),
    },
    {
      key: "comp",
      label: "Complaints",
      finalNum: o.complaints_yr,
      fmt: (n) => `−${Math.round(n).toLocaleString()}`,
      ci: "per year",
      status: "ok",
      shape: (t) => 1 - Math.exp(-t / 2.0),
    },
  ]), [o.NII_8wk_M, o.blockedRemoved_qtr, o.fairLendingMargin, o.ccSavings_M, o.complaints_yr]);

  /* ProofKpis — the 4 headline outcomes. Each card shows the SAME 3 pieces
     so the comparison is unambiguous:
       - value:    the metric WITH the policy in effect (the headline)
       - baseline: the metric WITHOUT the policy (status quo)
       - delta:    what the policy changed (with sign and %)
     For NII this triple collapses (baseline=$0, delta=value) — we render
     a simplified one-line note in that case. */
  const baseBlocked = o.baselineBlocked_qtr || 37500;
  const baseComplaints = o.baselineComplaints_qtr || 1080;
  const withBlocked = Math.max(0, baseBlocked - Math.round(o.blockedRemoved_qtr * progress));
  const withComplaints = Math.max(0, baseComplaints - Math.round(o.complaints_qtr * progress));

  /* 3 Proof KPIs — NII, Failures, Complaints. Fair-lending is dropped
     from the hero strip (it's a constraint, not an outcome) and demoted
     into the Guardrails strip below as a pass/fail pill. */
  const proofKpis = [
    {
      key: "nii", label: "Net Interest Income",
      value: `+$${(o.NII_8wk_M * progress).toFixed(1)}M`,
      valueCap: "/ 8wk",
      kind: "incremental",
      baseline: "$0",
      baselineCap: "no policy in effect",
      delta: `+$${(o.NII_8wk_M * progress).toFixed(1)}M`,
      deltaTone: "good",
      hit: "ok",
    },
    {
      key: "fail", label: "Payments saved",
      value: Math.round(o.blockedRemoved_qtr * progress).toLocaleString(),
      valueCap: "/ 8wk · would have been blocked",
      kind: "absolute",
      baseline: `${baseBlocked.toLocaleString()} / 8wk`,
      baselineCap: "baseline block volume",
      delta: `${o.blockedReductionPct || 78}% of baseline rescued`,
      deltaTone: "good",
      hit: "ok",
    },
    {
      key: "comp", label: "Complaints prevented",
      value: Math.round(o.complaints_qtr * progress).toLocaleString(),
      valueCap: "/ 8wk · would have been raised",
      kind: "absolute",
      baseline: `${baseComplaints.toLocaleString()} / 8wk`,
      baselineCap: "baseline complaint volume",
      delta: `${o.complaintsReductionPct || 78}% of baseline prevented`,
      deltaTone: "good",
      hit: "ok",
    },
  ];

  /* Guardrails strip — constraints passed or breached. Fair-lending lives
     here now (not in the proof KPIs), alongside fraud, MRM, and ECOA.
     All as pass/fail pills, not as headline numbers. */
  const fairLendingPass = o.fairLendingMargin >= 0.85;
  const guardrails = [
    { id: "fair", label: "Fair-lending", detail: `margin ${o.fairLendingMargin.toFixed(2)} · floor 0.85`, pass: fairLendingPass },
    { id: "fraud", label: "Fraud envelope", detail: "CI ≤ 0 · within bound", pass: true },
    { id: "mrm", label: "Model Risk (SR 11-7)", detail: "model card v3.4 audited", pass: true },
    { id: "ecoa", label: "ECOA 4/5 rule", detail: "no protected-class proxy", pass: true },
  ];

  /* Per-week splits used by the chart tiles. Wk 1 lands at ~57% of the
     steady-state rate (comms ramp); wks 2-8 are flat at steady-state.
     The math: total = 7.57 × steady, so steady = total / 7.57. */
  const blockedSteady = o.blockedRemoved_qtr / 7.57;
  const blockedWk1 = blockedSteady * 0.57;
  const blockedBaselinePerWk = baseBlocked / 8;
  const compSteady = o.complaints_qtr / 7.57;
  const compWk1 = compSteady * 0.57;
  const compBaselinePerWk = baseComplaints / 8;

  /* Cohort composition denominator = treatment cohort. Pulled directly
     from outcomes so the segment counts add to the same N the proof
     KPIs and the deploy workflow reference. */
  const treatedN = o.treatmentN || 34500;
  const cohortSegments = [
    { id: "single", label: "Single-payee renters", pct: 46, color: "var(--acq, #5b9dff)" },
    { id: "multi",  label: "Multi-payee renters",  pct: 34, color: "var(--violet, #b794f6)" },
    { id: "util",   label: "Rent + utilities",     pct: 14, color: "var(--acc, #ffb15a)" },
    { id: "edge",   label: "Edge / once-off",      pct: 6,  color: "var(--ink-3)" },
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
            {proofKpis.map((k) => (
              <ProofKpi key={k.key} {...k} />
            ))}
          </div>
        </div>
      </section>

      {/* GUARDRAILS · all the constraint checks as small pills. Fair-lending
          lives here now (not in the proof KPIs strip) — it's a constraint,
          not an outcome. */}
      <section className={`panel reveal ${showKpis ? "in" : ""}`}>
        <div className="sim-guardrails-strip">
          <div className="sim-guardrails-h">
            <Icon name="check" size={12} strokeWidth={2.5} />
            <span>Guardrails · all passed</span>
          </div>
          <div className="sim-guardrails-pills">
            {guardrails.map((g) => (
              <span key={g.id} className={"sim-guardrail-pill " + (g.pass ? "sim-guardrail-pass" : "sim-guardrail-fail")}>
                <span className="sim-guardrail-pill-dot" />
                <span className="sim-guardrail-pill-l">{g.label}</span>
                <span className="sim-guardrail-pill-d">{g.detail}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULATED OUTCOMES · 2×2 grid. Replaces both the previous
          trajectory grid AND the arena cards section.
            Top row · 2 temporal charts (NII area + Failures bars)
            Bottom row · temporal Complaints + aggregate Cohort composition
          Each chart carries a header with its baseline/denominator
          context, a numeric caption that closes the loop with the proof
          KPIs, and a business-language insight line. */}
      <section className={`panel reveal ${showChart ? "in" : ""}`}>
        <div className="panel-h">
          <span className="stag">SIMULATED OUTCOMES</span>
          <span className="stt">How the policy lands across temporal trajectories and cohort composition</span>
        </div>
        <div className="panel-body">
          <div className="sim-result-grid">
            <ResultTileNII outcomes={o} progress={progress} />
            <ResultTileBars
              title="Payments saved / wk"
              subhead={`vs ~${Math.round(blockedBaselinePerWk).toLocaleString()}/wk baseline (cohort untreated)`}
              steady={blockedSteady}
              baselinePerWk={blockedBaselinePerWk}
              progress={progress}
              format={(n) => Math.round(n).toLocaleString()}
              rampWeeks={1}
              seed={7}
              numbers={[
                { k: "avg / wk (steady)", v: `${Math.round(blockedSteady).toLocaleString()} (${o.blockedReductionPct || 78}% of baseline)` },
                { k: "wk 1 (ramp)", v: Math.round(blockedSteady * 0.55).toLocaleString() },
                { k: "8-wk total", v: o.blockedRemoved_qtr.toLocaleString() },
              ]}
              insight="Slow start in wk 1 — customers need to know about the new policy before they use it. Full effect from wk 2."
              accent="var(--acc, #ffb15a)"
            />
            <ResultTileBars
              title="Complaints prevented / wk"
              subhead={`vs ~${Math.round(compBaselinePerWk)}/wk baseline (cohort untreated)`}
              steady={compSteady}
              baselinePerWk={compBaselinePerWk}
              progress={progress}
              format={(n) => Math.round(n).toLocaleString()}
              rampWeeks={3}
              seed={19}
              numbers={[
                { k: "avg / wk (steady)", v: `${Math.round(compSteady).toLocaleString()} (${o.complaintsReductionPct || 78}% of baseline)` },
                { k: "wk 1 (lagged)", v: Math.round(compSteady * 0.30).toLocaleString() },
                { k: "8-wk total", v: o.complaints_qtr.toLocaleString() },
              ]}
              insight="Complaints drop about a week behind failures — the natural lag between a fixed payment and the call that never gets made."
              accent="var(--green, #42e08b)"
            />
            <ResultTileCohort
              segments={cohortSegments}
              treatedN={treatedN}
            />
          </div>
        </div>
      </section>

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

/* ----------------------------------------------------------------------------
   ProofKpi — single headline-outcome card.

   Each card answers: "what did the policy actually change vs. the
   pre-policy baseline?"
     - Big simulated value (mono numeric)
     - "vs baseline X" sub-line (status quo — what would have happened)
     - Hit/miss chip (✓ hit · ⚠ at risk · ✗ missed)

   No sparkline here — the Weekly Trajectory panel below carries the
   longitudinal story for all KPIs at once, so duplicating sparklines on
   each card would be redundant.
---------------------------------------------------------------------------- */
function ProofKpi({
  label, value, valueCap, baseline, baselineCap, delta, deltaTone = "good",
  kind = "absolute", hit = "ok",
}) {
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
      {/* Headline row: big number, unit cap, and delta chip. Delta sits
          adjacent to the headline so the reader pairs "value with policy"
          with "change from baseline" in one eye-fixation. */}
      <div className="proof-kpi-v-row">
        <span className="proof-kpi-v">{value}</span>
        {valueCap && <span className="proof-kpi-v-cap">{valueCap}</span>}
        {kind !== "incremental" && (
          <span className={"proof-kpi-delta-chip proof-kpi-delta-chip-" + deltaTone}>
            {delta}
          </span>
        )}
      </div>
      {/* Single baseline row — the comparison context that anchors the
          headline. No delta here; it's already in the chip above. */}
      <div className="proof-kpi-compare">
        <span className="proof-kpi-compare-k">baseline</span>
        <span className="proof-kpi-compare-v">{baseline}</span>
        {baselineCap && <span className="proof-kpi-compare-cap">· {baselineCap}</span>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Mini sparkline — 8-week interactive trajectory per KPI.

   Behavior:
     - Plots the KPI's analytic curve sampled at 40 points (smooth polyline).
     - Reveals progressively up to max(cur, 8 × progress) so the chart "draws
       in" alongside the rest of the results reveal.
     - 8 invisible <rect> hit-targets — one per simulated week — capture mouse
       events. Hovering surfaces a tooltip with "wk N · formatted value".
     - Special KPI quirks: DI is bounded 0.78–0.98 with an 0.85 floor line;
       fraud shows a "≈0 CI" annotation rather than weekly numbers.

   The hover-rect approach beats hit-testing the polyline (1.4px stroke is
   essentially unhittable). Tooltip rendered absolutely inside the wrapper
   so it can escape the SVG without clipping.
---------------------------------------------------------------------------- */
const SPARK_COLORS = {
  nii: "var(--acq, #5b9dff)",
  fail: "var(--green, #42e08b)",
  fraud: "var(--ink-3)",
  di: "var(--green, #42e08b)",
  cc: "var(--green, #42e08b)",
  comp: "var(--green, #42e08b)",
};

function MiniSpark({ kpi, progress, cur }) {
  const W = 140, H = 44, PL = 4, PR = 4, PT = 4, PB = 10;
  const Wks = 8;
  const [hoverWeek, setHoverWeek] = useState(null);

  const f = kpi.shape || ((t) => t / Wks);
  const col = SPARK_COLORS[kpi.key] || "var(--acq, #5b9dff)";

  // Sample the curve densely for the visible polyline.
  const N = 40;
  const samp = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Wks;
    samp.push({ t, v: f(t) });
  }
  const visibleMax = Math.max(cur, Wks * progress);
  const vis = samp.filter((s) => s.t <= visibleMax + 1e-6);
  if (vis.length < 1) vis.push(samp[0]);

  // Y range — pad ±12% so the curve doesn't kiss the edges. DI has a fixed
  // band so the 0.85 floor sits in a meaningful position.
  const all = samp.map((s) => s.v);
  let mn = Math.min(...all), mx = Math.max(...all);
  if (mn === mx) { mn -= 1; mx += 1; }
  const pad = (mx - mn) * 0.12; mn -= pad; mx += pad;
  if (kpi.key === "di") { mn = 0.78; mx = 0.98; }

  const X = (t) => PL + (t / Wks) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
  const pts = vis.map((s) => `${X(s.t).toFixed(1)},${Y(s.v).toFixed(1)}`).join(" ");

  // Weekly anchor points (week 1..8) for hover + dot rendering.
  const weeks = Array.from({ length: Wks }, (_, i) => i + 1);
  const weekVal = (wk) => {
    if (kpi.key === "fraud") return null; // fraud's CI is the meaningful thing
    if (kpi.flat) return 0.85 + (kpi.finalNum - 0.85) * (1 - Math.exp(-wk / 2.0));
    return kpi.finalNum * (1 - Math.exp(-wk / 1.8));
  };

  return (
    <div className="mini-spark-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`} width={W} height={H}
        className="mini-spark-svg" preserveAspectRatio="none"
      >
        {/* Faint weekly grid */}
        {weeks.map((wk) => (
          <line
            key={`g-${wk}`}
            x1={X(wk)} y1={PT} x2={X(wk)} y2={H - PB}
            stroke="var(--hair)" strokeWidth="0.5" opacity="0.5"
          />
        ))}

        {/* DI floor reference */}
        {kpi.key === "di" && (
          <line x1={PL} y1={Y(0.85)} x2={W - PR} y2={Y(0.85)}
                stroke="var(--ink-4)" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.6" />
        )}

        {/* The curve itself */}
        <polyline
          points={pts}
          fill="none" stroke={col} strokeWidth="1.5"
          strokeLinejoin="round" strokeLinecap="round"
        />

        {/* Hover dot — sits on the active week */}
        {hoverWeek != null && hoverWeek <= visibleMax && (
          <circle
            cx={X(hoverWeek)} cy={Y(f(hoverWeek))} r="2.6"
            fill={col} stroke="var(--panel)" strokeWidth="1"
          />
        )}

        {/* x-axis tick marks: w1, w4, w8 only — keeps it minimal */}
        {[1, 4, 8].map((wk) => (
          <text
            key={`tick-${wk}`}
            x={X(wk)} y={H - 2}
            textAnchor="middle"
            fontSize="6.5"
            fill="var(--ink-4)"
            fontFamily="var(--mono)"
          >w{wk}</text>
        ))}

        {/* Invisible hover targets — one per week */}
        {weeks.map((wk) => {
          const cellW = (W - PL - PR) / Wks;
          return (
            <rect
              key={`h-${wk}`}
              x={X(wk) - cellW / 2} y={0}
              width={cellW} height={H}
              fill="transparent"
              onMouseEnter={() => setHoverWeek(wk)}
              onMouseLeave={() => setHoverWeek(null)}
              style={{ cursor: "crosshair" }}
            />
          );
        })}
      </svg>

      {hoverWeek != null && (
        <div className="mini-spark-tip">
          <span className="mini-spark-tip-wk">wk {hoverWeek}</span>
          <span className="mini-spark-tip-v">
            {kpi.key === "fraud" ? "≈0 (CI ≤ 0)" : kpi.fmt(weekVal(hoverWeek))}
          </span>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   RESULT TILES — moved to src/components/SimResultTiles.jsx so the same
   three components (NII / Bars / Cohort) render in BOTH the What-If
   results 2×2 grid AND the If-What deep-dive PROJECTED OUTCOMES section.
   Import is at the top of this file.
---------------------------------------------------------------------------- */

/* ----------------------------------------------------------------------------
   WeeklyTrajectory — small-multiples grid showing all KPIs across the 8-week
   simulation horizon. RETAINED for any caller that still references it
   (e.g. If-What deep-dive), but the main results page no longer uses it.
---------------------------------------------------------------------------- */
function WeeklyTrajectory({ kpis, cur, progress }) {
  const [hoverWeek, setHoverWeek] = useState(null);
  const W = 220, H = 90, PL = 28, PR = 8, PT = 8, PB = 22;
  const Wks = 8;
  const weeks = Array.from({ length: Wks }, (_, i) => i + 1);

  return (
    <div className="wt-grid">
      {kpis.map((k) => {
        const f = k.shape || ((t) => t / Wks);
        const N = 40;
        const samp = [];
        for (let i = 0; i <= N; i++) {
          const t = (i / N) * Wks;
          samp.push({ t, v: f(t) });
        }
        const visibleMax = Math.max(cur, Wks * progress);
        const vis = samp.filter((s) => s.t <= visibleMax + 1e-6);
        if (vis.length < 1) vis.push(samp[0]);

        const all = samp.map((s) => s.v);
        let mn = Math.min(...all), mx = Math.max(...all);
        if (mn === mx) { mn -= 1; mx += 1; }
        const pad = (mx - mn) * 0.15; mn -= pad; mx += pad;
        if (k.key === "di") { mn = 0.78; mx = 0.98; }

        const X = (t) => PL + (t / Wks) * (W - PL - PR);
        const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
        const pts = vis.map((s) => `${X(s.t).toFixed(1)},${Y(s.v).toFixed(1)}`).join(" ");
        const col = SPARK_COLORS[k.key] || "var(--acq, #5b9dff)";

        const weekVal = (wk) => {
          if (k.key === "fraud") return null;
          if (k.flat) return 0.85 + (k.finalNum - 0.85) * (1 - Math.exp(-wk / 2.0));
          return k.finalNum * (1 - Math.exp(-wk / 1.8));
        };
        const hoverVal = hoverWeek != null ? weekVal(hoverWeek) : null;

        return (
          <div key={k.key} className="wt-tile">
            <div className="wt-tile-h">
              <span className="wt-tile-label">{k.label}</span>
              <span className="wt-tile-val">
                {hoverWeek != null
                  ? (k.key === "fraud" ? "≈0" : k.fmt(hoverVal))
                  : (k.key === "fraud" ? "CI ≤ 0" : k.fmt(k.finalNum * progress))}
              </span>
            </div>
            <svg
              viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
              preserveAspectRatio="none"
              className="wt-svg"
            >
              {/* Y-axis labels: min, max */}
              <text x={PL - 4} y={PT + 4} textAnchor="end" fontSize="7.5" fill="var(--ink-4)" fontFamily="var(--mono)">
                {k.key === "fraud" ? "" : k.fmt(mx).replace(/[+−-]?\$?/, (m) => m).slice(0, 8)}
              </text>
              <text x={PL - 4} y={H - PB + 3} textAnchor="end" fontSize="7.5" fill="var(--ink-4)" fontFamily="var(--mono)">
                {k.key === "fraud" ? "" : k.fmt(mn).replace(/[+−-]?\$?/, (m) => m).slice(0, 8)}
              </text>

              {/* Weekly grid */}
              {weeks.map((wk) => (
                <line
                  key={`g-${wk}`}
                  x1={X(wk)} y1={PT} x2={X(wk)} y2={H - PB}
                  stroke="var(--hair)" strokeWidth="0.5" opacity="0.6"
                />
              ))}

              {/* DI floor */}
              {k.key === "di" && (
                <line x1={PL} y1={Y(0.85)} x2={W - PR} y2={Y(0.85)}
                      stroke="var(--ink-4)" strokeWidth="0.6"
                      strokeDasharray="2 2" opacity="0.6" />
              )}

              {/* Curve */}
              <polyline
                points={pts}
                fill="none" stroke={col} strokeWidth="1.7"
                strokeLinejoin="round" strokeLinecap="round"
              />

              {/* Synced hover marker */}
              {hoverWeek != null && hoverWeek <= visibleMax && (
                <>
                  <line
                    x1={X(hoverWeek)} y1={PT} x2={X(hoverWeek)} y2={H - PB}
                    stroke={col} strokeWidth="0.8" opacity="0.45"
                  />
                  <circle
                    cx={X(hoverWeek)} cy={Y(f(hoverWeek))}
                    r="3" fill={col} stroke="var(--panel)" strokeWidth="1.2"
                  />
                </>
              )}

              {/* X-axis week ticks */}
              {weeks.map((wk) => (
                <text
                  key={`t-${wk}`}
                  x={X(wk)} y={H - 6}
                  textAnchor="middle"
                  fontSize="8"
                  fill="var(--ink-4)"
                  fontFamily="var(--mono)"
                >{wk}</text>
              ))}
              <text x={W / 2} y={H - 0.5} textAnchor="middle" fontSize="7.5"
                    fill="var(--ink-4)" fontFamily="var(--mono)">
                week
              </text>

              {/* Hit-targets — wider than the visible cell so hover is forgiving */}
              {weeks.map((wk) => {
                const cellW = (W - PL - PR) / Wks;
                return (
                  <rect
                    key={`h-${wk}`}
                    x={X(wk) - cellW / 2} y={0}
                    width={cellW} height={H}
                    fill="transparent"
                    onMouseEnter={() => setHoverWeek(wk)}
                    onMouseLeave={() => setHoverWeek(null)}
                    style={{ cursor: "crosshair" }}
                  />
                );
              })}
            </svg>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   JCurve — the hero chart. Progressively drawn via `cur` ∈ [0..8].
---------------------------------------------------------------------------- */
function JCurve({ cur }) {
  const W = 8;
  const Wd = 560, H = 200;
  const PL = 48, PR = 18, PT = 14, PB = 26;

  const shapeRamp = (w) => 1 - Math.exp(-w / 1.6);
  const phase = (start, end, t) => {
    if (t <= start) return 0;
    if (t >= end) return 1;
    return shapeRamp(t - start);
  };
  const f = (t) => {
    // Coefficients in $K. Sum / 1000 yields $M on the chart axis.
    // Scaled up ~14x from the original demo numbers to match US Bank
    // portfolio scale — a single retention test moves $10M+, not $1M.
    const retention = 11900 * phase(0, 4, t);
    const ccSave    = 2800 * phase(0, 4, t);
    const spend     = 6700 * phase(2, 6, t);
    const deepen    = 3900 * phase(4, 8, t);
    return (retention + ccSave - spend + deepen) / 1000;
  };

  const N = 80;
  const samp = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * W;
    samp.push({ t, v: f(t) });
  }
  const ciFrac = 0.15;
  const ciHi = samp.map((s) => s.v + Math.abs(s.v) * ciFrac / Math.sqrt(Math.max(0.4, s.t)));
  const ciLo = samp.map((s) => s.v - Math.abs(s.v) * ciFrac / Math.sqrt(Math.max(0.4, s.t)));
  let mx = Math.max(...ciHi, ...samp.map((s) => s.v), 0);
  let mn = Math.min(...ciLo, ...samp.map((s) => s.v), 0);
  if (mx === mn) { mx += 1; mn -= 1; }
  const pad = (mx - mn) * 0.12; mx += pad; mn -= pad;

  const X = (t) => PL + (t / W) * (Wd - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);

  const vis = samp.filter((s) => s.t <= cur + 1e-6);
  if (vis.length < 1) vis.push({ t: 0, v: f(0) });

  const up = [], lo = [];
  vis.forEach((s) => {
    const hw = Math.abs(s.v) * ciFrac / Math.sqrt(Math.max(0.4, s.t));
    up.push(`${X(s.t).toFixed(1)},${Y(s.v + hw).toFixed(1)}`);
    lo.unshift(`${X(s.t).toFixed(1)},${Y(s.v - hw).toFixed(1)}`);
  });

  const main = vis.map((s) => `${X(s.t).toFixed(1)},${Y(s.v).toFixed(1)}`).join(" ");
  const last = vis[vis.length - 1];
  const inflT = 5;
  const inflectionReached = cur >= inflT - 1e-6;
  const drawing = cur < W - 1e-6;

  return (
    <div className="jcurve-wrap">
      <svg viewBox={`0 0 ${Wd} ${H}`} preserveAspectRatio="none" className="jcurve-svg" height={H}>
        <line x1={PL} y1={Y(0).toFixed(1)} x2={Wd - PR} y2={Y(0).toFixed(1)}
              stroke="var(--ink-4)" strokeWidth=".7" strokeDasharray="3 3" opacity=".55" />
        {Array.from({ length: W }, (_, i) => i + 1).map((w) => (
          <line key={w} x1={X(w).toFixed(1)} y1={PT} x2={X(w).toFixed(1)} y2={H - PB}
                stroke="var(--hair)" strokeWidth=".5" opacity=".55" />
        ))}
        {[mn, (mn + mx) / 2, mx].map((y, i) => (
          <text key={i} x={PL - 6} y={Y(y).toFixed(1) + 3} textAnchor="end"
                fontSize="9" fill="var(--ink-3)" fontFamily="var(--mono)">
            {y >= 0 ? `+$${y.toFixed(2)}M` : `−$${Math.abs(y).toFixed(2)}M`}
          </text>
        ))}
        {Array.from({ length: W }, (_, i) => i + 1).map((w) => (
          <text key={w} x={X(w).toFixed(1)} y={H - 9} textAnchor="middle"
                fontSize="9.5" fill="var(--ink-3)" fontFamily="var(--mono)">
            wk{w}
          </text>
        ))}
        <polygon points={up.concat(lo).join(" ")} fill="var(--acq, #5b9dff)" opacity=".12" />
        <polyline points={main} fill="none" stroke="var(--acq, #5b9dff)" strokeWidth="2.2"
                  strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={X(last.t).toFixed(1)} cy={Y(last.v).toFixed(1)} r="3.4" fill="var(--acq, #5b9dff)" />
        {drawing && (
          <circle cx={X(last.t).toFixed(1)} cy={Y(last.v).toFixed(1)} r="3.4"
                  fill="none" stroke="var(--acq, #5b9dff)" strokeWidth="1.6" opacity=".6">
            <animate attributeName="r" from="3.4" to="9" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" from=".6" to="0" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
        {inflectionReached && (
          <>
            <line x1={X(inflT).toFixed(1)} y1={PT} x2={X(inflT).toFixed(1)} y2={H - PB}
                  stroke="var(--acc, #ffb15a)" strokeWidth=".8" strokeDasharray="3 3" opacity=".7" />
            <circle cx={X(inflT).toFixed(1)} cy={Y(f(inflT)).toFixed(1)} r="4"
                    fill="var(--bg-1, #0e0e10)" stroke="var(--acc, #ffb15a)" strokeWidth="1.8" />
            <circle cx={X(inflT).toFixed(1)} cy={Y(f(inflT)).toFixed(1)} r="4"
                    fill="none" stroke="var(--acc, #ffb15a)" strokeWidth="1.4" opacity=".55">
              <animate attributeName="r" from="4" to="11" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" from=".55" to="0" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <text x={X(inflT).toFixed(1) + 6} y={PT + 12} fontSize="10"
                  fill="var(--acc, #ffb15a)" fontFamily="var(--mono)">
              payback · wk 5
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   ArenaCard — fade-in with stagger; titled card with mini chart and metric.
---------------------------------------------------------------------------- */
function ArenaCard({ show, delay = 0, title, range, metric, metricCap, foot, chart, tone = "acq", isOpen, onClick }) {
  return (
    <button
      type="button"
      className={
        `arena-card reveal arena-tone-${tone} ${show ? "in" : ""} arena-card-button` +
        (isOpen ? " is-open" : "")
      }
      style={{ transitionDelay: show ? `${delay}ms` : "0ms" }}
      onClick={onClick}
    >
      <div className="arena-card-h">
        <span className="arena-card-title">{title}</span>
        <span className="arena-card-range">{range}</span>
      </div>
      <div className="arena-card-metric">{metric}</div>
      <div className="arena-card-cap">{metricCap}</div>
      <div className="arena-card-chart">{chart}</div>
      <div className="arena-card-foot">{foot}</div>
      <div className="arena-card-drillchev">
        {isOpen ? "Collapse details ▴" : "See details ▾"}
      </div>
    </button>
  );
}

/* --- arena mini charts --- */
function FrictionDropMini() {
  const W = 220, H = 50, PL = 4, PR = 4, PT = 6, PB = 6;
  const f = (t) => 22.7 - (22.7 - 12.4) * (1 - Math.exp(-t / 1.4));
  const pts = [];
  for (let t = 0; t <= 4; t += 0.1) pts.push([t, f(t)]);
  const mn = 10, mx = 24;
  const X = (t) => PL + (t / 4) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
  const d = pts.map(([t, v], i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height={H} className="arena-mini-svg">
      <line x1={PL} y1={Y(16)} x2={W - PR} y2={Y(16)} stroke="var(--ink-4)" strokeDasharray="2 3" opacity=".5" strokeWidth=".6" />
      <path d={d} fill="none" stroke="var(--ret, #ffb15a)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={X(4)} cy={Y(f(4))} r="2.6" fill="var(--ret, #ffb15a)" />
    </svg>
  );
}

function SCurveMini() {
  const W = 220, H = 50, PL = 4, PR = 4, PT = 6, PB = 6;
  const f = (t) => 0.71 / (1 + Math.exp(-(t - 3.2) * 1.6));
  const pts = [];
  for (let t = 0; t <= 6; t += 0.15) pts.push([t, f(t)]);
  const mn = 0, mx = 0.78;
  const X = (t) => PL + (t / 6) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
  const d = pts.map(([t, v], i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height={H} className="arena-mini-svg">
      <path d={d} fill="none" stroke="var(--acq, #5b9dff)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={X(6)} cy={Y(f(6))} r="2.6" fill="var(--acq, #5b9dff)" />
    </svg>
  );
}

function AttachMini() {
  const W = 220, H = 50, PL = 4, PR = 4, PT = 6, PB = 6;
  const f = (t) => 0.178 * (1 - Math.exp(-(t) / 1.6));
  const pts = [];
  for (let t = 0; t <= 4; t += 0.12) pts.push([t, f(t)]);
  const mn = 0, mx = 0.20;
  const X = (t) => PL + (t / 4) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
  const d = pts.map(([t, v], i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const bars = [];
  for (let i = 0; i < 4; i++) {
    const v = f(i + 1);
    const bx = PL + (i / 4) * (W - PL - PR) + 4;
    const bw = (W - PL - PR) / 4 - 6;
    bars.push(
      <rect key={i} x={bx} y={Y(v)} width={bw} height={Math.max(0, (H - PB) - Y(v))}
            fill="var(--green, #42e08b)" opacity=".18" />
    );
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height={H} className="arena-mini-svg">
      {bars}
      <path d={d} fill="none" stroke="var(--green, #42e08b)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={X(4)} cy={Y(f(4))} r="2.6" fill="var(--green, #42e08b)" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Mock results — synthetic but consistent with the §6.10 outcomes table.
---------------------------------------------------------------------------- */
function generateMockResults(o) {
  /* Verdict derives from the computed outcomes: NII positive, fair-lending
     above floor, and the policy reached *some* customers (non-zero rails). */
  const niiOk = o.NII_8wk_M > 0.05;
  const failuresOk = o.blockedRemoved_qtr > 0;
  const fraudOk = true;
  const diOk = o.fairLendingMargin >= 0.85;
  const verdict = computeVerdict({ niiOk, failuresOk, fraudOk, diOk });

  return {
    verdict,
    /* Note: this `outcomes` (an outcome-table for legacy consumers) is
       distinct from the computed `outcomes` bundle threaded separately
       through to the results page. We keep both for now. */
    outcomes: [
      { metric: "Net Interest Income",   value: `+$${o.NII_8wk_M.toFixed(1)}M`,  reference: `CI $${(o.NII_8wk_M*0.73).toFixed(1)}–$${(o.NII_8wk_M*1.27).toFixed(1)}M`,  status: niiOk ? "✓" : "✗" },
      { metric: "Failures removed",      value: `−${o.blockedRemoved_qtr.toLocaleString()}`,  reference: "per quarter",     status: failuresOk ? "✓" : "✗" },
      { metric: "Fraud impact",          value: "CI ≤ 0",   reference: "within guardrail", status: "✓" },
      { metric: "Fair-lending margin",   value: o.fairLendingMargin.toFixed(2),   reference: diOk ? "above 0.85 floor" : "BELOW 0.85 floor", status: diOk ? "✓" : "✗" },
      { metric: "Call-centre savings",   value: `−$${o.ccSavings_M.toFixed(1)}M`,  reference: "cost down",       status: "✓" },
      { metric: "Complaints",            value: `−${o.complaints_qtr.toLocaleString()}`,     reference: "per quarter",     status: "✓" },
    ],
  };
}
