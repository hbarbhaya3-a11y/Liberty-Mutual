/* ============================================================================
   Deposit Retention · MOCK_EXPERIMENTS + SYSTEMIC_MISCALIBRATIONS entries
   for LearnWorkspace.

   These are merged into the existing exported arrays via spread in
   LearnWorkspace.jsx. The pilot's modelUpdates drive PriorAnchorPill in
   SimulateWorkspace — closing the loop.
   ========================================================================= */

const dayBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const RETENTION_EXPERIMENTS = [
  {
    id: "exp-ret-2026-0041",
    name: "Targeted Deposit Defense · Strategy A v1",
    hypothesis: "H-RET-2026-02-10",
    cluster: "mass-affluent-deposit-drift",
    themeName: "Deposit Retention",
    themeId: "retention",
    experimentType: "retention",
    fidelity: 0.91,
    outcome: "promoted",
    closedAt: dayBack(49),
    pilotDuration: 8,
    treatmentN: 24000,
    controlN: 6000,
    fidelityRows: [
      { k: "Retained deposits",        predicted: "+$19.3M / yr",  actual: "+$18.7M",    tone: "ok"   },
      { k: "Balance runoff reduction",  predicted: "−2.3pp",        actual: "−2.2pp",     tone: "ok"   },
      { k: "Direct-deposit recovery",   predicted: "+6pp",          actual: "+14pp",      tone: "warn" },   // OVERSHOOT
      { k: "Pricing fairness (UDAAP)",  predicted: "0.93",          actual: "0.93",       tone: "ok"   },
      { k: "Customer fatigue",          predicted: "+180 / qtr",    actual: "+162 / qtr", tone: "ok"   },
    ],
    writeback: [
      "Anchored-customer filter threshold validated at 0.70: gate confirmed across 24,000 treated customers — no fairness complaint generated",
      "Rate-elasticity model downgraded for operating-decliner sub-segment; primacy-index mechanism upgraded — direct-deposit recovery overshot +8pp, confirming operating-anchor intervention is stronger than modelled",
      "Strategy B (Primacy Re-Anchoring) promoted to its own concurrent pilot — drafted as H-RET-2026-06-01",
    ],
    /* These modelUpdates drive PriorAnchorPill in SimulateWorkspace.
       The pill renders for ANY hypothesisId that links here — both the
       v2 Strategy A (H-RET-2026-05-14) and the new Strategy B
       (H-RET-2026-06-01) anchor on this pilot. */
    priorAnchorFor: ["H-RET-2026-05-14", "H-RET-2026-06-01"],
    modelUpdates: [
      {
        driver: "retention.stickiness_discriminator.threshold",
        before: 0.65, after: 0.70, dir: "up",
        sourceKpi: "UDAAP margin",
        note: "Threshold tightened post-pilot — 0.70 confirmed as the auditable gate after Compliance review",
      },
      {
        driver: "retention.primacy_index.dd_recovery_weight",
        before: 0.18, after: 0.31, dir: "up",
        sourceKpi: "Direct-deposit recovery",
        note: "Direct-deposit recovery overshoot (+8pp) → upgrade primacy-index contribution",
      },
      {
        driver: "retention.rate_elasticity.operating_decliner_weight",
        before: 0.42, after: 0.28, dir: "down",
        sourceKpi: "Direct-deposit recovery",
        note: "Operating-primacy mechanism stronger than rate-elasticity in this sub-segment",
      },
    ],
  },
];

export const RETENTION_SYSTEMIC = [
  {
    id: "misc-ret-001",
    theme: "Deposit Retention",
    themeId: "retention",
    tone: "good",
    pattern: "Retention friction-removal under-predicts secondary primacy recovery",
    drift: "+0.13 weight",
    sources: ["exp-ret-2026-0041"],
    action: "retention.primacy_index.dd_recovery_weight 0.18 → 0.31 added to model; rate-elasticity weight downgraded 0.42 → 0.28 in operating-decliner sub-segment",
    fullText: "Strategy A's deposit-defence offer removes balance-drift anxiety, which prompts a subset of the treated cohort to re-route primary payroll back — a second-order operating-anchor recovery the rate-elasticity model did not anticipate. Effect: direct-deposit recovery overshoots predicted +6pp to actual +14pp.",
  },
];

export default RETENTION_EXPERIMENTS;
