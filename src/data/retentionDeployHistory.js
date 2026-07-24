/* ============================================================================
   Deposit Retention · MOCK_HISTORY entries for DeployWorkspace.

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
    name: "Targeted Deposit Defense · Strategy A v1",
    hypothesis: "H-RET-2026-02-10",
    cluster: "mass-affluent-deposit-drift",
    themeName: "Deposit Retention",
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
    blurb: "Personalised CD/money-market offer to rate-sensitive customers · fairness-filtered · 20% control arm · 8-week pilot. Promoted to 80% rollout.",
    learnings: {
      headline: "Strategy A v1 landed inside CI on primary KPIs · promoted to 80% rollout · direct-deposit recovery overshot by +8pp (the surprise feeding the v2 priors)",
      actuals: [
        { k: "Retained deposits",         predicted: "+$19.3M / yr",  actual: "+$18.7M",    tone: "ok",   delta: "within CI" },
        { k: "Balance runoff reduction",   predicted: "−2.3pp",        actual: "−2.2pp",     tone: "ok",   delta: "within CI" },
        { k: "Direct-deposit recovery",    predicted: "+6pp",          actual: "+14pp",      tone: "warn", delta: "OVERSHOOT · +8pp beyond predicted" },
        { k: "Pricing fairness (UDAAP)",   predicted: "0.93",          actual: "0.93",       tone: "ok",   delta: "held exact" },
        { k: "Customer fatigue",           predicted: "+180 / qtr",    actual: "+162 / qtr", tone: "ok",   delta: "better than predicted" },
      ],
      surprises: [
        "Direct-deposit recovery overshot prediction by +8pp — removing balance-drift anxiety apparently prompts a subset of treated customers to re-route primary payroll back. The rate-elasticity model did not anticipate this secondary primacy mechanism.",
        "Anchored-customer filter held cleanly at 0.65 but Compliance audit recommended tightening to 0.70 to strengthen the audit basis for v2.",
      ],
      didntWork: [
        "Pure-price elasticity in the operating-decliner sub-segment came in 33% weaker than modelled — the primacy mechanism dominates rate in that slice.",
      ],
      nextMove: {
        verdict: "Promoted to 80% rollout",
        tone: "ok",
        rationale: "All primary KPIs landed inside CI · UDAAP margin held · direct-deposit recovery overshot — the operating-anchor mechanism is stronger than modelled. Strategy B (Primacy Re-Anchoring) drafted as concurrent pilot.",
      },
    },
  },
  {
    id: "mock-ret-2",
    name: "Primacy Re-Anchoring · Strategy B",
    hypothesis: "H-RET-2025-11-12",
    cluster: "mass-affluent-deposit-drift",
    themeName: "Deposit Retention",
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
    blurb: "No-rate primacy re-engagement (payroll + bill-pay re-anchor) to drifting mass-affluent customers · fairness-filtered · 20% control arm · 8-week pilot. Promoted to 80% rollout.",
    learnings: {
      headline: "Strategy B landed inside CI on retained deposits with zero rate spend · promoted to 80% rollout · direct-deposit recovery led the result without a single bps of giveback",
      actuals: [
        { k: "Retained deposits",         predicted: "+$16.1M / yr",  actual: "+$16.6M",    tone: "ok",   delta: "within CI" },
        { k: "Balance runoff reduction",   predicted: "−1.9pp",        actual: "−2.0pp",     tone: "ok",   delta: "within CI" },
        { k: "Direct-deposit recovery",    predicted: "+9pp",          actual: "+11pp",      tone: "ok",   delta: "better than predicted" },
        { k: "Pricing fairness (UDAAP)",   predicted: "0.93",          actual: "0.94",       tone: "ok",   delta: "held above floor" },
        { k: "Customer fatigue",           predicted: "+150 / qtr",    actual: "+138 / qtr", tone: "ok",   delta: "better than predicted" },
      ],
      surprises: [
        "The no-rate re-anchor recovered deposits at +11pp on direct-deposit with zero rate giveback — re-engaging payroll and bill-pay primacy held balances that the rate-defense pilot only reached with a priced offer. Mechanism, not money.",
        "UDAAP margin lifted to 0.94 because a no-rate play removes the differential-pricing exposure the priced arm carried, simplifying the audit basis.",
      ],
      didntWork: [
        "The already-de-primed sub-segment barely moved — once payroll has fully left, a re-engagement nudge alone cannot recover it; that slice needs the priced Strategy A offer.",
      ],
      nextMove: {
        verdict: "Promoted to 80% rollout",
        tone: "ok",
        rationale: "Retained deposits inside CI with zero rate spend · UDAAP margin held above floor · primacy re-anchor recovered direct-deposit cleanly. Strategy A (priced) and Strategy B (no-rate) now route by drift stage — re-anchor first, price only the de-primed tail.",
      },
    },
  },
];

export default RETENTION_DEPLOY_HISTORY;
