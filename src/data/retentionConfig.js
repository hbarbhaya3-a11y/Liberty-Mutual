/* ============================================================================
   Deposit Retention · theme config + 3 archetypes (DS / OD / AS).

   Sibling to themeConfigs.js — does NOT modify it.
   Consumed by RetentionAnalyzeView, RetentionSimulateView and Theme.jsx hero.
   ========================================================================= */

export const RETENTION_HYPOTHESIS_ID = "H-RET-2026-05-14";
export const RETENTION_HYPOTHESIS_TITLE = "Defend at-risk savings";

export const RETENTION_CONFIG = {
  theme: "retention",
  cluster: "cluster_mass_affluent_deposit_drift",
  name: "Mass Affluent · Deposit Drift",
  objective: "ret",
  engine: "D",                 // Deepen/defend balances
  badge: "RETENTION",
  claim: "Better-off savers are starting to move money to banks that pay more — balances sliding, transfers accelerating out, everyday activity thinning. These signals show up about 60 days before they actually leave. Defend the ones genuinely about to go, not the sticky majority.",
  valueLever: "Deepen/defend balances",
  buyer: "Consumer Deposits / Treasury Pricing",
  valueBridge: {
    retainedDeposits: "+$19.3M",
    spreadProtected:  "+$386K",
    runoffReduction:  "−2.3pp",
    headline:         "retained deposits + spread protected",
  },
  bindingConstraint: {
    owner: "Compliance / Legal / MRM",
    text:  "Differential deposit offers without an auditable, consistent basis are a UDAAP risk; the stickiness model is the required evidence that targeted customers are genuinely elastic, not operationally-sticky balances being re-priced away from.",
  },
  teeth: ["udaap", "drift"],
  pop: 75000,
  share: 0.095,
  macro: {
    state: "Rate-cut cycle turning + 1033 open-banking switching friction falling",
    drift: false,             // STABLE — key contrast vs old churn theme
    sub: "stable — frames the deposit-drift velocity without destabilising the model",
    field: ["rate path / deposit beta", "open-banking portability acceleration", "competitor HY promo intensity", "mass-affluent behaviour shift lag"],
  },
};

export const RETENTION_PERSONAS = {
  drifting_saver: {
    id: "drifting_saver", init: "DS", nm: "Drifting Saver", kind: "target",
    tag: "rate-sensitive · 14% balance decline",
    sb: "Mass-affluent saver · multi-channel deposit · outbound ACH accelerating",
    moment: "An $18K outbound ACH lands as part of a 6-month balance erosion pattern in this archetype's median customer. Aggregator login activity appeared 45 days prior. The stickiness model scores this archetype 0.41 — genuinely elastic, not operationally anchored.",
    fv: [
      ["balance slope 90d",            0.78],
      ["operating-balance volatility", 0.62],
      ["direct-deposit decay",         0.55],
      ["primacy index",                0.38],
      ["rate-elasticity score",        0.81],
      ["stickiness score",     0.41],
    ],
  },
  operating_decliner: {
    id: "operating_decliner", init: "OD", nm: "Operating Decliner", kind: "target",
    tag: "DDA decay · pre-rate-shopping",
    sb: "Operating account weakening before rate signal appears",
    moment: "DDA transaction count has fallen 18% over 90 days. Direct-deposit frequency dropped from biweekly to monthly. Bill-pay deactivated on 3 recurring payees. No aggregator activity yet — this archetype is 60 days ahead of the rate-shopping window.",
    fv: [
      ["balance slope 90d",            0.42],
      ["operating-balance volatility", 0.79],
      ["direct-deposit decay",         0.84],
      ["primacy index",                0.28],
      ["rate-elasticity score",        0.31],
      ["stickiness score",     0.52],
    ],
  },
  anchored_saver: {
    id: "anchored_saver", init: "AS", nm: "Anchored Saver", kind: "falsepos",
    tag: "operationally sticky · FALSE POSITIVE",
    sb: "Looks elastic on one signal · operationally anchored balances",
    moment: "Single aggregator login and a $12K outbound transfer fire a drift alert. But this archetype's operating balance funds payroll disbursements and two standing ACH instructions. Stickiness model scores 0.77 — above the 0.70 gate. Offering rate here is margin given away, and pricing the operationally-anchored majority differently is a UDAAP basis failure.",
    fv: [
      ["balance slope 90d",            0.51],
      ["operating-balance volatility", 0.31],
      ["direct-deposit decay",         0.22],
      ["primacy index",                0.74],
      ["rate-elasticity score",        0.44],
      ["stickiness score",     0.77],
    ],
  },
};

export const RETENTION_ARCHETYPE_ORDER = ["drifting_saver", "operating_decliner", "anchored_saver"];

/* Numerical calibration anchors for retention's simulateOutcomes() function.
   Aligned to the original demo narrative — 30K customers tested, $840M
   balances under test, BAU runoff 7.5% → 5.2% with policy, $19.3M retained. */
export const RETENTION_CALIBRATION = {
  cohortTotal:            75000,
  eligibleAfterGate:      30000,    // 30K customers tested at Strategy A
  operatingDeclinerN:     22000,
  highValueN:              3000,
  balancesUnderTestM:       840,    // $840M
  runoffBau:              0.075,    // 7.5% BAU
  runoffWithPolicy:       0.052,    // 5.2% with policy
  runoffReductionPp:      0.023,    // -2.3pp
  retainedDepositsAnnualM: 19.3,    // $19.3M annual
  offerCostM:             0.140,    // $140K
  spreadProtectedK:         386,    // $386K spread protected at 2%
  netAnnualisedK:           246,    // $246K net annualised
  treatmentN:             24000,    // 80% of 30K
  controlN:                6000,    // 20% holdout
  complaintsBaseline:        80,
  complaintsDelta:          180,    // medium customer fatigue
  udaapMargin:             0.93,
  udaapFloor:              0.85,
  stickinessThreshold:     0.70,
};

/* Pre-simulation range strings for Analyze hero KPIs.
   These previews are the SAME five metrics the What-If / If-What results report,
   shown as estimate ranges. Each result point estimate lands inside its range, so
   the hero note's promise ("the simulation tightens each range") holds literally. */
export const RETENTION_PRESIM_RANGES = [
  { label: "Retained deposits",             value: "+$15–25M", unit: "/ yr · est. range",          tone: "g" },
  { label: "Annualized relationship value", value: "+$45–65M", unit: "/ yr · est. range",          tone: "g" },
  { label: "% deposits leaving",            value: "4–6%",     unit: "vs 7.5% today · est. range",  tone: "g" },
  { label: "Direct-deposit recovery",       value: "+5–10pp",  unit: "primacy · est. range",       tone: "g" },
  { label: "Customers retained",            value: "+400–700", unit: "est. range",                 tone: "g" },
];

export default RETENTION_CONFIG;
