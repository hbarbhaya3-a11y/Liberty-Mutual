/* ============================================================================
   Auto Renewal Retention · MOCK_HISTORY entries for DeployWorkspace.

   These are merged into the existing MOCK_HISTORY array via spread in
   DeployWorkspace.jsx. Adds the prior closed retention pilot that
   PriorAnchorPill reads from in SimulateWorkspace.
   ========================================================================= */

const dayBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const RETENTION_DEPLOY_HISTORY = [
  {
    id: "mock-ret-1",
    name: "Targeted Renewal Defense · Strategy A v1",
    hypothesis: "H-RET-2026-02-10",
    cluster: "high-ltv-renewal-shopping",
    themeName: "Auto Retention",
    themeId: "retention",
    experimentType: "retention",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(120),
    approvedAt: dayBack(118),
    complianceAt: dayBack(117),
    pilotStartedAt: dayBack(112),
    pilotEndedAt: dayBack(56),
    pilotDuration: 8,
    pilotWeek: 8,
    pilotTotal: 8,
    pilotEndReason: "duration-complete",
    treatmentN: 24000,
    controlN: 6000,
    blurb: "Capped rate + retention offer to price-elastic shopping customers · fair-lending-filtered · 20% control arm · 8-week pilot. Promoted to 80% rollout.",
    learnings: {
      headline: "Strategy A v1 landed inside CI on primary KPIs · promoted to 80% rollout · bundle-penetration overshot by +8pp (the surprise feeding the v2 priors)",
      actuals: [
        { k: "NWP protected",             predicted: "+$19.3M / yr",  actual: "+$18.7M",    tone: "ok",   delta: "within CI" },
        { k: "Lapse-rate reduction",       predicted: "−2.3pp",        actual: "−2.2pp",     tone: "ok",   delta: "within CI" },
        { k: "Bundle-penetration lift",    predicted: "+6pp",          actual: "+14pp",      tone: "warn", delta: "OVERSHOOT · +8pp beyond predicted" },
        { k: "Fair-lending margin",        predicted: "0.93",          actual: "0.93",       tone: "ok",   delta: "held exact" },
        { k: "Customer fatigue",           predicted: "+180 / qtr",    actual: "+162 / qtr", tone: "ok",   delta: "better than predicted" },
      ],
      surprises: [
        "Bundle penetration overshot prediction by +8pp — removing renewal-shock anxiety apparently prompts a subset of treated customers to add a home or umbrella policy at the save moment. The elasticity model did not anticipate this secondary cross-sell mechanism.",
        "Sticky-bundled filter held cleanly at 0.65 but Compliance audit recommended tightening to 0.70 to strengthen the disparate-impact audit basis for v2.",
      ],
      didntWork: [
        "Pure price-elasticity in the silent-pre-shopper sub-segment came in 33% weaker than modelled — the engagement mechanism dominates rate in that slice.",
      ],
      nextMove: {
        verdict: "Promoted to 80% rollout",
        tone: "ok",
        rationale: "All primary KPIs landed inside CI · fair-lending margin held · bundle penetration overshot — the cross-sell mechanism is stronger than modelled. Strategy B (Re-engage before shopping) drafted as concurrent pilot.",
      },
    },
  },
  {
    id: "mock-ret-2",
    name: "Re-engage Before Shopping · Strategy B",
    hypothesis: "H-RET-2025-11-12",
    cluster: "high-ltv-renewal-shopping",
    themeName: "Auto Retention",
    themeId: "retention",
    experimentType: "retention",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(224),
    approvedAt: dayBack(222),
    complianceAt: dayBack(221),
    pilotStartedAt: dayBack(215),
    pilotEndedAt: dayBack(159),
    pilotDuration: 8,
    pilotWeek: 8,
    pilotTotal: 8,
    pilotEndReason: "duration-complete",
    treatmentN: 21000,
    controlN: 5250,
    blurb: "No-discount value/service re-engagement (portal + agent talking-points) to disengaging high-LTV customers · fair-lending-filtered · 20% control arm · 8-week pilot. Promoted to 80% rollout.",
    learnings: {
      headline: "Strategy B landed inside CI on NWP protected with zero discount spend · promoted to 80% rollout · engagement recovery led the result without a single dollar of giveback",
      actuals: [
        { k: "NWP protected",             predicted: "+$16.1M / yr",  actual: "+$16.6M",    tone: "ok",   delta: "within CI" },
        { k: "Lapse-rate reduction",       predicted: "−1.9pp",        actual: "−2.0pp",     tone: "ok",   delta: "within CI" },
        { k: "Engagement recovery",        predicted: "+9pp",          actual: "+11pp",      tone: "ok",   delta: "better than predicted" },
        { k: "Fair-lending margin",        predicted: "0.93",          actual: "0.94",       tone: "ok",   delta: "held above floor" },
        { k: "Customer fatigue",           predicted: "+150 / qtr",    actual: "+138 / qtr", tone: "ok",   delta: "better than predicted" },
      ],
      surprises: [
        "The no-discount re-engagement recovered renewals at +11pp on engagement with zero giveback — re-engaging on value and service held policies that the discount pilot only reached with a priced offer. Mechanism, not money.",
        "Fair-lending margin lifted to 0.94 because a no-discount play removes the differential-pricing exposure the priced arm carried, simplifying the audit basis.",
      ],
      didntWork: [
        "The already-shopping sub-segment barely moved — once a competitor quote is in hand, a re-engagement nudge alone cannot recover it; that slice needs the priced Strategy A offer.",
      ],
      nextMove: {
        verdict: "Promoted to 80% rollout",
        tone: "ok",
        rationale: "NWP protected inside CI with zero discount spend · fair-lending margin held above floor · re-engagement recovered renewals cleanly. Strategy A (priced) and Strategy B (no-discount) now route by shopping stage — re-engage first, price only the actively-shopping tail.",
      },
    },
  },
];

export default RETENTION_DEPLOY_HISTORY;
