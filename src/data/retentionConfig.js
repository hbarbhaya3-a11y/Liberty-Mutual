/* ============================================================================
   Auto Renewal Retention · theme config + 3 archetypes (SR / SP / SB).

   Liberty Mutual USRM Personal Lines — reverses the 7.1pt auto retention
   collapse (73.5% → 66.4%) with precision, elasticity-aware renewal repricing.
   Sibling to themeConfigs.js — does NOT modify it.
   Consumed by RetentionAnalyzeView, RetentionSimulateView and Theme.jsx hero.
   ========================================================================= */

export const RETENTION_HYPOTHESIS_ID = "H-RET-2026-05-14";
export const RETENTION_HYPOTHESIS_TITLE = "Defend at-risk auto renewals";

export const RETENTION_CONFIG = {
  theme: "retention",
  cluster: "cluster_high_ltv_renewal_shopping",
  name: "High-LTV Auto · Renewal Shopping Risk",
  objective: "ret",
  engine: "D",                 // Defend/retain renewals
  badge: "RETENTION",
  claim: "Our best auto customers — high-LTV, low-loss, mature — shop first when a broad-brush rate action hits them uniformly. Digital engagement cools, competitor quote-shopping fires, coverage-reduction requests rise. These signals show up ~30–45 days before the renewal decision. Defend the genuinely elastic, not the sticky bundled majority.",
  valueLever: "Defend/retain renewals",
  buyer: "Retention Ops / Personal Lines Pricing",
  valueBridge: {
    retainedDeposits: "+$19.3M",
    spreadProtected:  "+$386K",
    runoffReduction:  "−2.3pp",
    headline:         "protected NWP + retention lift",
  },
  bindingConstraint: {
    owner: "Compliance / Legal / Model Risk",
    text:  "Differential renewal offers without an auditable, consistent basis risk disparate-impact / fair-lending exposure under NAIC Model Bulletin 24-08. The elasticity model is the required evidence that targeted customers are genuinely price-elastic, not operationally-loyal bundled households being discounted needlessly.",
  },
  teeth: ["fairlending", "shopping"],
  pop: 75000,
  share: 0.095,
  macro: {
    state: "Record 57% auto shopping (JD Power 2025) + Progressive/GEICO rate pressure",
    drift: false,             // STABLE — key contrast vs churn theme
    sub: "stable — frames the shopping-risk velocity without destabilising the model",
    field: ["competitor rate path / gap", "shopping-intensity index by state", "DOI filing approval lag", "mass-affluent behaviour shift lag"],
  },
};

export const RETENTION_PERSONAS = {
  drifting_saver: {
    id: "drifting_saver", init: "SR", nm: "Shopping Renewer", kind: "target",
    tag: "high-LTV · elastic · 45d pre-renewal",
    sb: "High-LTV auto · claims-free · competitor quote-shopping detected",
    moment: "A competitor quote-request signal lands 45 days before renewal in this archetype's median customer, alongside a 20%+ drop in digital engagement. Claims-free 3 years, high LTV. The elasticity model scores this archetype 0.81 — genuinely price-elastic, not loyalty-anchored.",
    fv: [
      ["shopping propensity 45d",       0.78],
      ["digital engagement decline",    0.62],
      ["competitor price gap",          0.55],
      ["bundle depth",                  0.38],
      ["rate-elasticity score",         0.81],
      ["loyalty stickiness score",      0.41],
    ],
  },
  operating_decliner: {
    id: "operating_decliner", init: "SP", nm: "Silent Pre-Shopper", kind: "target",
    tag: "engagement decay · pre-shopping",
    sb: "Digital engagement weakening before any shopping signal appears",
    moment: "Portal logins have fallen 18% over 90 days. Paperless-statement opens dropped off, a coverage-reduction request was filed, and one CSR service call logged mild dissatisfaction. No competitor quote yet — this archetype is ~60 days ahead of the shopping window.",
    fv: [
      ["shopping propensity 45d",       0.42],
      ["digital engagement decline",    0.79],
      ["competitor price gap",          0.31],
      ["bundle depth",                  0.28],
      ["rate-elasticity score",         0.31],
      ["loyalty stickiness score",      0.52],
    ],
  },
  anchored_saver: {
    id: "anchored_saver", init: "SB", nm: "Sticky Bundled", kind: "falsepos",
    tag: "operationally loyal · FALSE POSITIVE",
    sb: "Looks elastic on one signal · deeply bundled, auto-pay, long tenure",
    moment: "A single competitor-ad exposure and one coverage question fire a shopping alert. But this archetype bundles auto + home + umbrella, is on auto-pay, and has 8-year tenure. Stickiness model scores 0.77 — above the 0.70 gate. A retention discount here is margin given away, and repricing the operationally-loyal majority differently is a fair-lending basis failure.",
    fv: [
      ["shopping propensity 45d",       0.51],
      ["digital engagement decline",    0.31],
      ["competitor price gap",          0.22],
      ["bundle depth",                  0.74],
      ["rate-elasticity score",         0.44],
      ["loyalty stickiness score",      0.77],
    ],
  },
};

export const RETENTION_ARCHETYPE_ORDER = ["drifting_saver", "operating_decliner", "anchored_saver"];

/* Numerical calibration anchors for retention's simulateOutcomes() function.
   Aligned to the demo narrative — 30K policies tested, $840M NWP under test,
   BAU lapse 7.5% → 5.2% with policy, $19.3M protected premium. */
export const RETENTION_CALIBRATION = {
  cohortTotal:            75000,
  eligibleAfterGate:      30000,    // 30K policies tested at Strategy A
  operatingDeclinerN:     22000,
  highValueN:              3000,
  balancesUnderTestM:       840,    // $840M NWP
  runoffBau:              0.075,    // 7.5% BAU lapse
  runoffWithPolicy:       0.052,    // 5.2% with policy
  runoffReductionPp:      0.023,    // -2.3pp
  retainedDepositsAnnualM: 19.3,    // $19.3M NWP protected
  offerCostM:             0.140,    // $140K retention-offer cost
  spreadProtectedK:         386,    // $386K margin protected
  netAnnualisedK:           246,    // $246K net annualised
  treatmentN:             24000,    // 80% of 30K
  controlN:                6000,    // 20% holdout
  complaintsBaseline:        80,
  complaintsDelta:          180,    // medium customer fatigue
  udaapMargin:             0.93,    // fair-lending headroom
  udaapFloor:              0.85,
  stickinessThreshold:     0.70,
};

/* Pre-simulation range strings for Analyze hero KPIs. */
export const RETENTION_PRESIM_RANGES = [
  { label: "NWP protected",                 value: "+$15–25M", unit: "/ yr · est. range",           tone: "g" },
  { label: "Annualized relationship value", value: "+$45–65M", unit: "/ yr · est. range",           tone: "g" },
  { label: "% renewals lapsing",            value: "4–6%",     unit: "vs 7.5% today · est. range",   tone: "g" },
  { label: "Bundle-penetration lift",       value: "+5–10pp",  unit: "cross-sell · est. range",      tone: "g" },
  { label: "Policies retained",             value: "+400–700", unit: "est. range",                  tone: "g" },
];


export default RETENTION_CONFIG;
