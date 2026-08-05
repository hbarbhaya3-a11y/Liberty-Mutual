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
    retainedDeposits: "+$138.2M",
    spreadProtected:  "+$3.45M",
    runoffReduction:  "−19pp",
    headline:         "protected NWP + retention lift",
  },
  bindingConstraint: {
    owner: "Compliance / Legal / Model Risk",
    text:  "Differential renewal offers without an auditable, consistent basis risk disparate-impact / fair-lending exposure under NAIC Model Bulletin 24-08. The elasticity model is the required evidence that targeted customers are genuinely price-elastic, not operationally-loyal bundled households being discounted needlessly.",
  },
  teeth: ["fairlending", "shopping"],
  pop: 550849,
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
   Aligned to the demo narrative — 550,849 at-risk renewals, $909M NWP under
   observation, BAU lapse 30% → 11% with policy, $138.2M protected premium. */
/* Signal-1 base: 550,849 high-LTV auto renewals flagged at renewal-shopping
   risk (~9.5% of the ~5.8M in-force auto book). The hypothesis is run across
   ALL 550,849 at-risk renewals (not a gated subset). Every number below
   derives from this cohort at an avg annual premium of ~$1,650:
     · treatmentN        = 80% of the cohort (20% measurement holdout)
     · Policies retained = treatmentN × 19pp lapse reduction ≈ 83,700 / yr
                           (≈ one-sixth of the at-risk book held)
     · NWP under obs     = 550,849 × $1,650 ≈ $909M
     · NWP impact        = policies retained × $1,650 ≈ $138M / yr
     · CLV impact        = NWP impact × 2.5 relationship multiple ≈ $345M    */
export const RETENTION_CALIBRATION = {
  cohortTotal:           550849,    // 550,849 at-risk auto renewals (signal 1)
  eligibleAfterGate:     550849,    // hypothesis runs across all at-risk renewals
  operatingDeclinerN:    161000,
  highValueN:             22000,
  balancesUnderTestM:       909,    // $909M NWP under observation (550,849 × $1,650)
  runoffBau:              0.300,    // 30% BAU lapse for actively-shopping at-risk book
  runoffWithPolicy:       0.110,    // 11% with policy
  runoffReductionPp:      0.190,    // -19pp
  retainedDepositsAnnualM: 138.2,   // $138.2M NWP impact (protected premium)
  offerCostM:             2.000,    // $2.0M retention-offer cost
  spreadProtectedK:        3450,    // $3.45M underwriting margin protected
  netAnnualisedK:          1450,    // $1.45M net annualised
  treatmentN:            440679,    // 80% of 550,849
  controlN:              110170,    // 20% holdout
  complaintsBaseline:       590,
  complaintsDelta:         1320,    // medium customer fatigue
  udaapMargin:             0.93,    // fair-lending headroom
  udaapFloor:              0.85,
  stickinessThreshold:     0.70,
};

/* Pre-simulation range strings for Analyze hero KPIs (aligned with Signal Card 1). */
export const RETENTION_PRESIM_RANGES = [
  { label: "NWP at stake",                  value: "$909M",      unit: "all 550,849 at-risk renewals", tone: "g" },
  { label: "CLV at stake",                  value: "$2.27B",     unit: "full at-risk book",            tone: "g" },
  { label: "NWP impact",                    value: "+$130–145M", unit: "/ yr · protected premium",     tone: "g" },
  { label: "CLV impact",                    value: "+$325–360M", unit: "/ yr · est. range",            tone: "g" },
  { label: "Policies retained",             value: "82–85K",     unit: "/ yr · of at-risk renewals",   tone: "g" },
  { label: "At-risk retained",              value: "15%+",       unit: "of the at-risk book",          tone: "g" },
];


export default RETENTION_CONFIG;
