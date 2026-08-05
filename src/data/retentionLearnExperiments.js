/* ============================================================================
   Auto Renewal Retention · MOCK_EXPERIMENTS + SYSTEMIC_MISCALIBRATIONS entries
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
    name: "Targeted Renewal Defense · Strategy A v1",
    hypothesis: "H-RET-2026-02-10",
    cluster: "high-ltv-renewal-shopping",
    themeName: "Auto Retention",
    themeId: "retention",
    experimentType: "retention",
    fidelity: 0.91,
    outcome: "promoted",
    closedAt: dayBack(49),
    pilotDuration: 8,
    treatmentN: 440679,
    controlN: 110170,
    fidelityRows: [
      { k: "NWP protected",           predicted: "+$138.2M / yr",  actual: "+$134M",    tone: "ok"   },
      { k: "Lapse-rate reduction",     predicted: "−19pp",         actual: "−18pp",     tone: "ok"   },
      { k: "Bundle-penetration lift",  predicted: "+6pp",          actual: "+14pp",      tone: "warn" },   // OVERSHOOT
      { k: "Fair-lending margin",      predicted: "0.93",          actual: "0.93",       tone: "ok"   },
      { k: "Customer fatigue",         predicted: "+180 / qtr",    actual: "+162 / qtr", tone: "ok"   },
    ],
    writeback: [
      "Sticky-bundled filter threshold validated at 0.70: gate confirmed across 440,679 treated policies — no fair-lending complaint generated",
      "Rate-elasticity model downgraded for silent-pre-shopper sub-segment; engagement-decay mechanism upgraded — bundle penetration overshot +8pp, confirming cross-sell-at-save is stronger than modelled",
      "Strategy B (Re-engage Before Shopping) promoted to its own concurrent pilot — drafted as H-RET-2026-06-01",
    ],
    /* These modelUpdates drive PriorAnchorPill in SimulateWorkspace. */
    priorAnchorFor: ["H-RET-2026-05-14", "H-RET-2026-06-01"],
    modelUpdates: [
      {
        driver: "retention.loyalty_discriminator.threshold",
        before: 0.65, after: 0.70, dir: "up",
        sourceKpi: "Fair-lending margin",
        note: "Threshold tightened post-pilot — 0.70 confirmed as the auditable gate after Compliance review",
      },
      {
        driver: "retention.engagement_index.recovery_weight",
        before: 0.18, after: 0.31, dir: "up",
        sourceKpi: "Bundle-penetration lift",
        note: "Bundle-penetration overshoot (+8pp) → upgrade cross-sell-at-save contribution",
      },
      {
        driver: "retention.rate_elasticity.pre_shopper_weight",
        before: 0.42, after: 0.28, dir: "down",
        sourceKpi: "Engagement recovery",
        note: "Engagement mechanism stronger than rate-elasticity in this sub-segment",
      },
    ],
  },
];

export const RETENTION_SYSTEMIC = [
  {
    id: "misc-ret-001",
    theme: "Auto Retention",
    themeId: "retention",
    tone: "good",
    pattern: "Renewal friction-removal under-predicts secondary cross-sell uptake",
    drift: "+0.13 weight",
    sources: ["exp-ret-2026-0041"],
    action: "retention.engagement_index.recovery_weight 0.18 → 0.31 added to model; rate-elasticity weight downgraded 0.42 → 0.28 in silent-pre-shopper sub-segment",
    fullText: "Strategy A's capped-rate + retention offer removes renewal-shock anxiety, which prompts a subset of the treated cohort to add a home or umbrella policy at the save moment — a second-order cross-sell uptake the elasticity model did not anticipate. Effect: bundle penetration overshoots predicted +6pp to actual +14pp.",
  },
];

export default RETENTION_EXPERIMENTS;
