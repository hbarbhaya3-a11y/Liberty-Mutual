/* ============================================================================
   Idle-Cash Liquidity Activation · MOCK_HISTORY entries for DeployWorkspace.

   Merged into the Deploy portfolio via spread in DeployWorkspace.jsx, alongside
   RETENTION_DEPLOY_HISTORY. Adds the prior closed liquidity pilot.
   ========================================================================= */

const dayBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const LIQUIDITY_DEPLOY_HISTORY = [
  {
    id: "mock-liq-1",
    name: "Idle-to-Yield CD · Strategy A v1",
    hypothesis: "H-LIQ-2026-01-22",
    cluster: "idle-cash-liquidity",
    themeName: "Liquidity Activation",
    themeId: "liquidity",
    experimentType: "liquidity",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(132),
    approvedAt: dayBack(130),
    complianceAt: dayBack(129),
    pilotStartedAt: dayBack(124),
    pilotEndedAt: dayBack(68),
    pilotDuration: 8,
    pilotWeek: 8,
    pilotTotal: 8,
    pilotEndReason: "duration-complete",
    treatmentN: 40000,
    controlN: 10000,
    blurb: "7-month CD at +20 bps uplift to suitability-gated idle-cash holders · in-app + banker · 20% control arm · 8-week pilot. Promoted to 80% rollout.",
    learnings: {
      headline: "Strategy A v1 landed inside CI on net NII · promoted to 80% rollout · activation rate overshot by +6pp on the bonus-holder slice (the surprise feeding the v2 priors)",
      actuals: [
        { k: "Net interest income",   predicted: "+$0.7M / yr",  actual: "+$0.72M",    tone: "ok",   delta: "within CI" },
        { k: "Idle flight defended",  predicted: "−6.0pp",        actual: "−6.3pp",     tone: "ok",   delta: "within CI" },
        { k: "Balances activated",    predicted: "$46M",         actual: "$49M",     tone: "ok",   delta: "better than predicted" },
        { k: "Suitability margin",    predicted: "0.94",          actual: "0.94",       tone: "ok",   delta: "held exact" },
        { k: "Customer fatigue",      predicted: "+45 / qtr",     actual: "+38 / qtr",  tone: "ok",   delta: "better than predicted" },
      ],
      surprises: [
        "Activation rate on the bonus-holder slice overshot prediction by +6pp — a fresh one-time inflow converts faster than a long-dormant savings balance once an in-app CD nudge is shown. The response model under-weighted recency of the inflow.",
        "Suitability gate held cleanly at 0.55 but MRM recommended a +0.05 buffer on borderline operating-buffer scores to strengthen the audit basis for v2.",
      ],
      didntWork: [
        "Pure rate-uplift on the long-tenured idle-retiree slice came in 22% weaker than modelled — a banker conversation, not a higher rate, moved that segment. Channel dominates rate there.",
      ],
      nextMove: {
        verdict: "Promoted to 80% rollout",
        tone: "ok",
        rationale: "Net NII landed inside CI · suitability margin held · activation overshot on fresh-inflow holders — recency is a stronger signal than modelled. Strategy B (High-Yield Savings Migration) drafted as concurrent pilot for the liquid-preference slice.",
      },
    },
  },
  {
    id: "mock-liq-2",
    name: "High-Yield Savings Migration · Strategy B",
    hypothesis: "H-LIQ-2025-10-30",
    cluster: "idle-cash-liquidity",
    themeName: "Liquidity Activation",
    themeId: "liquidity",
    experimentType: "liquidity",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(238),
    approvedAt: dayBack(236),
    complianceAt: dayBack(235),
    pilotStartedAt: dayBack(229),
    pilotEndedAt: dayBack(173),
    pilotDuration: 8,
    pilotWeek: 8,
    pilotTotal: 8,
    pilotEndReason: "duration-complete",
    treatmentN: 32000,
    controlN: 8000,
    blurb: "High-Yield Savings migration at +15 bps for the liquid-preference slice (Strategy B) · in-app one-tap move · 20% control arm · 8-week pilot. Promoted to 80% rollout.",
    learnings: {
      headline: "Strategy B landed inside CI on net NII · promoted to 80% rollout · liquid-preference holders activated +4pp above plan once the move stayed penalty-free",
      actuals: [
        { k: "Net interest income",   predicted: "+$0.6M / yr",  actual: "+$0.61M",    tone: "ok",   delta: "within CI" },
        { k: "Idle flight defended",  predicted: "−5.2pp",        actual: "−5.4pp",     tone: "ok",   delta: "within CI" },
        { k: "Balances activated",    predicted: "$37M",        actual: "$39M",     tone: "ok",   delta: "better than predicted" },
        { k: "Suitability margin",    predicted: "0.94",          actual: "0.95",       tone: "ok",   delta: "held above floor" },
        { k: "Customer fatigue",      predicted: "+52 / qtr",     actual: "+44 / qtr",  tone: "ok",   delta: "better than predicted" },
      ],
      surprises: [
        "Liquid-preference holders migrated +4pp above plan — keeping the move penalty-free and reversible removed the lock-in objection the CD framing carried. Optionality mattered more than the headline rate for this slice.",
        "Suitability gate held at 0.94 with the no-lock product surfacing fewer borderline operating-buffer scores than the term-CD path.",
      ],
      didntWork: [
        "The dormant-balance sub-slice converted 18% weaker than the liquid-preference core — a savings move alone did not stir genuinely inactive balances, which still need a banker touch.",
      ],
      nextMove: {
        verdict: "Promoted to 80% rollout",
        tone: "ok",
        rationale: "Net NII landed inside CI · suitability margin held above floor · liquid-preference activation beat plan on penalty-free framing. Strategy A (Idle-to-Yield CD) and Strategy B now run as a paired playbook routed by liquidity preference.",
      },
    },
  },
];

export default LIQUIDITY_DEPLOY_HISTORY;
