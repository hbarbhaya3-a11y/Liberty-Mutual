/* ============================================================================
   Bundle Attach (auto-only, home insured elsewhere) · MOCK_HISTORY entries for
   DeployWorkspace.

   Merged into the Deploy portfolio via spread in DeployWorkspace.jsx, alongside
   RETENTION/LIQUIDITY/B2B history. Adds the prior closed bundle-attach pilots.
   The motion IS named here — these pilots already ran and proved a policy.
   ========================================================================= */

const dayBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const WEALTH_DEPLOY_HISTORY = [
  {
    id: "mock-wlth-1",
    name: "Home-Bundle Coverage Review · v1",
    hypothesis: "H-WEALTH-2026-02-18",
    cluster: "cluster_wealth_attach",
    themeName: "Bundle Attach",
    themeId: "wealth",
    experimentType: "wealth",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(126),
    approvedAt: dayBack(124),
    complianceAt: dayBack(123),
    pilotStartedAt: dayBack(117),
    pilotEndedAt: dayBack(33),
    pilotDuration: 12,
    pilotWeek: 12,
    pilotTotal: 12,
    pilotEndReason: "duration-complete",
    treatmentN: 4960,
    controlN: 1240,
    blurb: "Personalized home + auto coverage review to bundle-ready auto-only households · app + email + agent · senior agent reserved for high-value movers · 20% control · 12-week pilot. Promoted to full rollout.",
    learnings: {
      headline: "v1 landed inside CI on new bundled households · promoted to rollout · the high-value-mover slice converted +1.4pp above plan once the review was fast-tracked ahead of the home-policy renewal elsewhere",
      actuals: [
        { k: "New bundled households", predicted: "+214",       actual: "+221",   tone: "ok", delta: "within CI" },
        { k: "Incremental bundled premium", predicted: "+$4.8M", actual: "+$5.1M", tone: "ok", delta: "better than predicted" },
        { k: "Bound-policy rate",      predicted: "60%",        actual: "62%",    tone: "ok", delta: "within CI" },
        { k: "Fairness margin",        predicted: "0.94",       actual: "0.94",   tone: "ok", delta: "held exact" },
        { k: "Agent utilisation",      predicted: "71%",        actual: "69%",    tone: "ok", delta: "healthy headroom" },
      ],
      surprises: [
        "The high-value-mover slice converted +1.4pp above plan when the review was fast-tracked ahead of the detected home-policy renewal elsewhere — timing beat the headline offer for households already shopping. The churn model under-weighted recency of the first renewal notice.",
        "Fairness gate held cleanly at 0.55; MRM recommended a +0.05 buffer on borderline 'already-bundled' scores to strengthen the fair-pricing audit basis for v2.",
      ],
      didntWork: [
        "Pure educational nudge on the low-intent auto-only slice converted 24% weaker than modelled — content alone did not move households with low intent; they need a nurture sequence before any agent time. Intent dominates content there.",
      ],
      nextMove: {
        verdict: "Promoted to full rollout",
        tone: "ok",
        rationale: "New bundled households landed inside CI · fairness margin held · high-value movers beat plan on fast-tracked timing — recency of the first renewal notice is a stronger signal than modelled. A digital-starter nurture track drafted as a concurrent pilot for the low-intent slice.",
      },
    },
  },
  {
    id: "mock-wlth-2",
    name: "Digital Bundle-Starter Nurture · Strategy C",
    hypothesis: "H-WEALTH-2025-11-12",
    cluster: "cluster_wealth_attach",
    themeName: "Bundle Attach",
    themeId: "wealth",
    experimentType: "wealth",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(232),
    approvedAt: dayBack(230),
    complianceAt: dayBack(229),
    pilotStartedAt: dayBack(222),
    pilotEndedAt: dayBack(138),
    pilotDuration: 12,
    pilotWeek: 12,
    pilotTotal: 12,
    pilotEndReason: "duration-complete",
    treatmentN: 2080,
    controlN: 520,
    blurb: "Guided digital home-bundle starter journey for the digitally-engaged cohort (Strategy C) · in-app · escalates to an agent on engagement · 20% control · 12-week pilot. Promoted to paired playbook.",
    learnings: {
      headline: "Strategy C landed inside CI on conversion · promoted to a paired playbook · digital-first households escalated to an agent at +3pp above plan once the path stayed low-pressure",
      actuals: [
        { k: "New bundled households", predicted: "+58",        actual: "+61",    tone: "ok", delta: "better than predicted" },
        { k: "Incremental bundled premium", predicted: "+$0.9M", actual: "+$1.0M", tone: "ok", delta: "within CI" },
        { k: "Cost per household",     predicted: "$250",       actual: "$238",   tone: "ok", delta: "better than predicted" },
        { k: "Fairness margin",        predicted: "0.95",       actual: "0.95",   tone: "ok", delta: "held above floor" },
        { k: "Customer fatigue",       predicted: "+24 / qtr",  actual: "+19 / qtr", tone: "ok", delta: "better than predicted" },
      ],
      surprises: [
        "Digitally-engaged households escalated to an agent +3pp above plan once the path stayed low-pressure and self-paced — optionality mattered more than a hard agent push for this slice.",
        "Fairness gate held at 0.95 with the digital-first path surfacing fewer borderline 'already-bundled' scores than the direct-review path.",
      ],
      didntWork: [
        "The low-intent sub-slice converted 19% weaker than the engaged core — a digital path alone did not stir genuinely unready households, which still need a content nurture sequence first.",
      ],
      nextMove: {
        verdict: "Promoted to paired playbook",
        tone: "ok",
        rationale: "Conversion landed inside CI · fairness margin held above floor · digital escalation beat plan on a low-pressure path. Strategy A (coverage-review-led) and Strategy C now run as a paired playbook routed by digital intent.",
      },
    },
  },
];

export default WEALTH_DEPLOY_HISTORY;
