/* ============================================================================
   Affluent / Wealth Attach · MOCK_HISTORY entries for DeployWorkspace.

   Merged into the Deploy portfolio via spread in DeployWorkspace.jsx, alongside
   RETENTION/LIQUIDITY/B2B history. Adds the prior closed wealth-attach pilots.
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
    name: "Portfolio-Review-Led Attach · v1",
    hypothesis: "H-WEALTH-2026-02-18",
    cluster: "cluster_wealth_attach",
    themeName: "Wealth Attach",
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
    blurb: "Personalized portfolio review to suitability-gated advice-ready households · app + email + FA · senior-FA reserved for high-AUM movers · 20% control · 12-week pilot. Promoted to full rollout.",
    learnings: {
      headline: "v1 landed inside CI on new relationships · promoted to rollout · the high-AUM-mover slice converted +1.4pp above plan once the review was fast-tracked ahead of the outbound transfer",
      actuals: [
        { k: "New wealth relationships", predicted: "+214",       actual: "+221",   tone: "ok", delta: "within CI" },
        { k: "Incremental AUM",          predicted: "+$48M",      actual: "+$51M",  tone: "ok", delta: "better than predicted" },
        { k: "Funded-account rate",      predicted: "60%",        actual: "62%",    tone: "ok", delta: "within CI" },
        { k: "Suitability margin",       predicted: "0.94",       actual: "0.94",   tone: "ok", delta: "held exact" },
        { k: "Advisor utilisation",      predicted: "71%",        actual: "69%",    tone: "ok", delta: "healthy headroom" },
      ],
      surprises: [
        "The high-AUM-mover slice converted +1.4pp above plan when the review was fast-tracked ahead of the detected outbound transfer — timing beat the headline offer for assets already in motion. The flight model under-weighted recency of the first transfer.",
        "Suitability gate held cleanly at 0.55; MRM recommended a +0.05 buffer on borderline 'spoken-for' scores to strengthen the Reg BI audit basis for v2.",
      ],
      didntWork: [
        "Pure educational nudge on the early-stage affluent slice converted 24% weaker than modelled — content alone did not move customers with low intent; they need a nurture sequence before any advisor time. Intent dominates content there.",
      ],
      nextMove: {
        verdict: "Promoted to full rollout",
        tone: "ok",
        rationale: "New relationships landed inside CI · suitability margin held · high-AUM movers beat plan on fast-tracked timing — recency of the first transfer is a stronger signal than modelled. A digital-starter nurture track drafted as a concurrent pilot for the early-stage slice.",
      },
    },
  },
  {
    id: "mock-wlth-2",
    name: "Digital Wealth-Starter Nurture · Strategy C",
    hypothesis: "H-WEALTH-2025-11-12",
    cluster: "cluster_wealth_attach",
    themeName: "Wealth Attach",
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
    blurb: "Guided digital wealth-starter journey for the digitally-engaged cohort (Strategy C) · in-app · escalates to an FA on engagement · 20% control · 12-week pilot. Promoted to paired playbook.",
    learnings: {
      headline: "Strategy C landed inside CI on conversion · promoted to a paired playbook · digital-first households escalated to an FA at +3pp above plan once the path stayed low-pressure",
      actuals: [
        { k: "New wealth relationships", predicted: "+58",        actual: "+61",    tone: "ok", delta: "better than predicted" },
        { k: "Incremental AUM",          predicted: "+$9M",       actual: "+$10M",  tone: "ok", delta: "within CI" },
        { k: "Cost per relationship",    predicted: "$250",       actual: "$238",   tone: "ok", delta: "better than predicted" },
        { k: "Suitability margin",       predicted: "0.95",       actual: "0.95",   tone: "ok", delta: "held above floor" },
        { k: "Customer fatigue",         predicted: "+24 / qtr",  actual: "+19 / qtr", tone: "ok", delta: "better than predicted" },
      ],
      surprises: [
        "Digitally-engaged households escalated to an FA +3pp above plan once the path stayed low-pressure and self-paced — optionality mattered more than a hard advisor push for this slice.",
        "Suitability gate held at 0.95 with the digital-first path surfacing fewer borderline 'spoken-for' scores than the direct-review path.",
      ],
      didntWork: [
        "The low-intent sub-slice converted 19% weaker than the engaged core — a digital path alone did not stir genuinely unready households, which still need a content nurture sequence first.",
      ],
      nextMove: {
        verdict: "Promoted to paired playbook",
        tone: "ok",
        rationale: "Conversion landed inside CI · suitability margin held above floor · digital escalation beat plan on a low-pressure path. Strategy A (portfolio-review-led) and Strategy C now run as a paired playbook routed by digital intent.",
      },
    },
  },
];

export default WEALTH_DEPLOY_HISTORY;
