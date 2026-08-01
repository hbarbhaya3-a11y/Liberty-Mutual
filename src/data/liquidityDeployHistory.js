/* ============================================================================
   Telematics-Ready Safe Drivers · MOCK_HISTORY entries for DeployWorkspace.

   Merged into the Deploy portfolio via spread in DeployWorkspace.jsx, alongside
   RETENTION_DEPLOY_HISTORY. Adds the prior closed telematics pilots.
   ========================================================================= */

const dayBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const LIQUIDITY_DEPLOY_HISTORY = [
  {
    id: "mock-liq-1",
    name: "RightTrack Telematics Enrollment · Strategy A v1",
    hypothesis: "H-LIQ-2026-01-22",
    cluster: "idle-cash-liquidity",
    themeName: "Telematics Activation",
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
    blurb: "RightTrack enrollment at a guaranteed-discount offer to low-mileage, low-risk drivers · in-app + agent · 20% control arm · 8-week pilot. Promoted to 80% rollout.",
    learnings: {
      headline: "Strategy A v1 landed inside CI on retention lift · promoted to 80% rollout · enrollment overshot by +6pp on the low-mileage slice (the surprise feeding the v2 priors)",
      actuals: [
        { k: "Retention lift",        predicted: "+0.7pp / yr", actual: "+0.72pp",  tone: "ok",   delta: "within CI" },
        { k: "Competitor loss defended", predicted: "−6.0pp",   actual: "−6.3pp",     tone: "ok",   delta: "within CI" },
        { k: "Drivers enrolled",      predicted: "46,000",      actual: "49,000",   tone: "ok",   delta: "better than predicted" },
        { k: "Fairness margin",       predicted: "0.94",        actual: "0.94",       tone: "ok",   delta: "held exact" },
        { k: "Customer fatigue",      predicted: "+45 / qtr",   actual: "+38 / qtr",  tone: "ok",   delta: "better than predicted" },
      ],
      surprises: [
        "Enrollment on the low-mileage slice overshot prediction by +6pp — drivers who already believe they drive safely enroll faster once an in-app guaranteed-discount offer is shown. The response model under-weighted self-perceived risk.",
        "Fairness gate held cleanly at 0.55 but MRM recommended a +0.05 buffer on borderline mileage-inference scores to strengthen the audit basis for v2.",
      ],
      didntWork: [
        "Pure discount-uplift on the long-tenured older-driver slice came in 22% weaker than modelled — an agent conversation, not a bigger discount, moved that segment. Channel dominates rate there.",
      ],
      nextMove: {
        verdict: "Promoted to 80% rollout",
        tone: "ok",
        rationale: "Retention lift landed inside CI · fairness margin held · enrollment overshot on low-mileage drivers — self-perceived risk is a stronger signal than modelled. Strategy B (Usage-Based Insurance Migration) drafted as concurrent pilot for the pay-per-mile-preference slice.",
      },
    },
  },
  {
    id: "mock-liq-2",
    name: "Usage-Based Insurance Migration · Strategy B",
    hypothesis: "H-LIQ-2025-10-30",
    cluster: "idle-cash-liquidity",
    themeName: "Telematics Activation",
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
    blurb: "Pay-per-mile (usage-based) migration for the low-mileage-preference slice (Strategy B) · in-app one-tap switch · 20% control arm · 8-week pilot. Promoted to 80% rollout.",
    learnings: {
      headline: "Strategy B landed inside CI on retention lift · promoted to 80% rollout · low-mileage-preference drivers migrated +4pp above plan once the switch stayed penalty-free",
      actuals: [
        { k: "Retention lift",        predicted: "+0.6pp / yr", actual: "+0.61pp",  tone: "ok",   delta: "within CI" },
        { k: "Competitor loss defended", predicted: "−5.2pp",   actual: "−5.4pp",     tone: "ok",   delta: "within CI" },
        { k: "Drivers enrolled",      predicted: "37,000",      actual: "39,000",   tone: "ok",   delta: "better than predicted" },
        { k: "Fairness margin",       predicted: "0.94",        actual: "0.95",       tone: "ok",   delta: "held above floor" },
        { k: "Customer fatigue",      predicted: "+52 / qtr",   actual: "+44 / qtr",  tone: "ok",   delta: "better than predicted" },
      ],
      surprises: [
        "Low-mileage-preference drivers migrated +4pp above plan — keeping the switch penalty-free and reversible removed the lock-in objection the annual-policy framing carried. Optionality mattered more than the headline discount for this slice.",
        "Fairness gate held at 0.94 with the pay-per-mile product surfacing fewer borderline mileage-inference scores than the fixed-discount path.",
      ],
      didntWork: [
        "The high-mileage sub-slice converted 18% weaker than the low-mileage core — a usage-based switch alone did not suit genuinely high-mileage drivers, who still need a standard-rate conversation.",
      ],
      nextMove: {
        verdict: "Promoted to 80% rollout",
        tone: "ok",
        rationale: "Retention lift landed inside CI · fairness margin held above floor · low-mileage-preference migration beat plan on penalty-free framing. Strategy A (RightTrack Enrollment) and Strategy B now run as a paired playbook routed by driving profile.",
      },
    },
  },
];

export default LIQUIDITY_DEPLOY_HISTORY;
