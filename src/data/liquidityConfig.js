/* ============================================================================
   Idle-Cash Liquidity Activation · theme config + 3 archetypes (IR / BH / OB).

   Sibling to retentionConfig.js — same shape, different domain. Engine D
   (deepen/defend balances). Consumed by LiquidityAnalyzeView,
   LiquiditySimulateView, LiquidityIfWhatView and the Theme.jsx hero.

   MONEY MODEL (internally consistent funnel):
     388,000 flagged (idle ≥ $5K, dormant 60d+)
       → $9.3B idle cash in scope (388K × ~$24K median)
       → ~75,000 show strong activation signals → treat 67.5K (90/10 RCT)
       → balanced product-fit policy (HYS / MMA / short CD), +30 bps blended
       → 5.4% funded conversion · 3,645 funded relationships · $265M funded balances
       → +$4.3M Incremental relationship value (idle leakage 12% → 6.4%)
   ========================================================================= */

export const LIQUIDITY_HYPOTHESIS_ID = "H-LIQ-2026-03-12";
export const LIQUIDITY_HYPOTHESIS_TITLE = "Route idle cash to the best-fit product";

export const LIQUIDITY_CONFIG = {
  theme: "liquidity",
  cluster: "cluster_idle_cash_liquidity",
  name: "Idle Cash · Liquidity Activation",
  objective: "deep",
  engine: "D",                 // Deepen/defend balances
  badge: "LIQUIDITY",
  claim: "Idle cash earning almost nothing while competitors advertise 4%+. The bet: route genuinely deployable surplus cash into the best-fit liquidity product — high-yield savings, money market, or CD — at the minimum incentive needed to convert, while leaving everyday operating cash untouched.",
  valueLever: "Deepen/defend balances",
  buyer: "Consumer Deposits / Treasury Pricing",
  valueBridge: {
    activatedNII:    "+$4.3M",
    activatedBal:    "$265M",
    flightDefended:  "−5.6pp",
    headline:        "Incremental relationship value + funded balances",
  },
  bindingConstraint: {
    owner: "Compliance / Legal / MRM",
    text:  "Locking a customer's operating or emergency buffer into a term product is a suitability and liquidity-risk failure. Each targeted balance must be shown to be genuinely surplus idle cash — not money the customer will need before the term ends.",
  },
  teeth: ["suitability", "drift"],
  pop: 388000,
  share: 0.072,
  macro: {
    state: "Falling-rate cycle + intensifying high-yield competition for deposits",
    drift: false,             // STABLE — the yield gap is structural, not noise
    sub: "stable — frames the idle-flight velocity without destabilising the model",
    field: ["rate path / deposit beta", "high-yield challenger promo intensity", "open-banking portability acceleration", "idle-balance behaviour shift lag"],
  },
};

export const LIQUIDITY_PERSONAS = {
  idle_retiree: {
    id: "idle_retiree", init: "IR", nm: "Idle Retiree", kind: "target",
    tag: "large idle savings · yield-gap exposed",
    sb: "Long-tenured saver · $42K in savings at ~0.05% · starting to shop",
    moment: "A $42K savings balance has sat untouched 90+ days at ~0.05% APY while competitors advertise 4%+. Two in-app searches for '7-month CD rates' appeared last week. The suitability model scores this archetype 0.79 — genuinely surplus idle cash, fully activatable.",
    fv: [
      ["idle balance",            0.88],
      ["dormancy depth",          0.81],
      ["yield gap",               0.82],
      ["high-yield search",       0.34],
      ["tenure",                  0.79],
      ["suitability score", 0.79],
    ],
  },
  bonus_holder: {
    id: "bonus_holder", init: "BH", nm: "Bonus Holder", kind: "target",
    tag: "one-time inflow · idle 60d · searching",
    sb: "Working-age · bonus credit sitting un-deployed · actively comparing",
    moment: "A $9.4K bonus landed and has sat idle 60 days. In-app searches for 'CD rates' just appeared and an aggregator login fired yesterday. The suitability model scores 0.71 — surplus and elastic; this balance leaves within weeks if not captured.",
    fv: [
      ["idle balance",            0.62],
      ["dormancy depth",          0.58],
      ["yield gap",               0.77],
      ["high-yield search",       0.74],
      ["tenure",                  0.46],
      ["suitability score", 0.71],
    ],
  },
  operating_buffer: {
    id: "operating_buffer", init: "OB", nm: "Operating Buffer", kind: "falsepos",
    tag: "working capital · FALSE POSITIVE",
    sb: "Looks idle on balance · actually a deliberate operating / emergency buffer",
    moment: "A $26K balance looks dormant and trips the idle-cash flag. But it funds quarterly tax payments and two standing ACH instructions, and the customer drew it down twice in the last year. Suitability model scores 0.31 — below the 0.55 gate. Locking this into a term product is a liquidity-risk and Reg-suitability failure.",
    fv: [
      ["idle balance",            0.69],
      ["dormancy depth",          0.34],
      ["yield gap",               0.41],
      ["high-yield search",       0.12],
      ["tenure",                  0.66],
      ["suitability score", 0.31],
    ],
  },
};

export const LIQUIDITY_ARCHETYPE_ORDER = ["idle_retiree", "bonus_holder", "operating_buffer"];

/* Numerical calibration anchors for liquidity's simulateOutcomes().
   Re-framed for the "route idle cash to the best-fit liquidity product" thesis,
   anchored to the BALANCED product-fit policy.
   Funnel: 388K flagged → ~75K show strong activation signals → treat 67.5K
   (90/10 RCT) → 5.4% funded conversion → 3,645 funded relationships / $265M
   funded balances → +$4.3M Incremental relationship value (idle leakage 12% → 6.4%). */
export const LIQUIDITY_CALIBRATION = {
  cohortTotal:            388000,   // flagged: idle ≥ $5K, dormant 60d+
  signalCohortN:           75000,   // ~75K showing strong activation signals (the "full" selectable cohort)
  idleInScopeB:              9.3,   // $9.3B idle cash in scope (388K × ~$24K median)
  eligibleAfterGate:       20000,   // yield-responsive eligible sub-cohort
  bonusHolderN:            18000,   // dormant savers
  highValueN:               7000,
  avgFundedBalanceK:        72.7,   // avg balance routed into a funded product
  avgBalK:                    24,    // $24K median idle balance
  runoffBau:               0.120,   // 12% idle-cash leakage (BAU)
  runoffWithPolicy:        0.064,   // 6.4% leakage with the balanced policy
  runoffReductionPp:       0.056,   // −5.6pp
  retainedDepositsAnnualM:  4.30,   // Incremental relationship value (balanced policy)
  netValue8wkM:            0.36,    // 8-week incremental (test-window) net value
  fundedConversion:        0.054,   // 5.4% funded-product conversion (balanced)
  fundedConversionBaseline:0.019,   // 1.9% organic (holdout) conversion
  offerCostM:              1.400,   // rate give-up across the funded book
  spreadProtectedK:          265,
  netAnnualisedK:           4300,   // $4.3M net annualised
  treatmentN:              67500,   // 90% of the 75K signal cohort (10% holdout RCT)
  controlN:                 7500,
  complaintsBaseline:        120,
  complaintsDelta:           180,
  udaapMargin:             0.94,    // suitability margin (here: suitability-fit)
  udaapFloor:              0.85,
  stickinessThreshold:     0.55,    // suitability/elasticity gate
};

/* Pre-simulation range strings for Analyze hero KPIs.
   These previews are the SAME five metrics the What-If / If-What results report,
   shown as estimate ranges. Each result point estimate lands inside its range, so
   the hero note's promise ("the simulation tightens each range") holds literally. */
export const LIQUIDITY_PRESIM_RANGES = [
  { label: "Incremental relationship value",  value: "+$3.5–5.2M", unit: "business case · est. range",      tone: "g" },
  { label: "Funded product conversion",     value: "4–7%",       unit: "vs ~1.9% today · est. range",     tone: "g" },
  { label: "Deepened relationships",        value: "3,000–5,500", unit: "incremental · est. range",       tone: "g" },
  { label: "Incremental funded balances",   value: "$240–320M",  unit: "into yield · est. range",         tone: "g" },
  { label: "Idle cash leakage",             value: "4–9%",       unit: "vs 12% today · est. range",       tone: "g" },
];

/* Three testable hypotheses for idle-cash activation. Card A is the recommended
   (the optimizer routes per segment); B and C are narrower product bets the user
   can test instead. Each carries the product focus it seeds into the test flow —
   `whatIfOffers` (single bps per product) for the What-If, `ifWhatOffers`
   (low/high bps ranges) for the If-What optimizer. Selecting a card sets
   selectedHypothesisId; the workspaces read it to seed their product selection. */
export const LIQUIDITY_HYPOTHESES = [
  {
    id: LIQUIDITY_HYPOTHESIS_ID,
    rank: "A",
    recommended: true,
    title: "Route idle cash to best-fit liquidity product",
    lead: "Of 388,000 customers flagged for sustained idle cash, ~75,000 show strong activation signals this cycle. Route genuinely deployable surplus cash into the best-fit liquidity product — high-yield savings, MMA, short-term CD, or a CD ladder — at the minimum incentive that holds it, while leaving everyday operating cash untouched.",
    whatIfOffers: { hy_savings: 30, money_market: 35, cd_7mo: 25 },
    ifWhatOffers: { hy_savings: [0, 45], money_market: [0, 45], cd_7mo: [0, 35], cd_12mo: [0, 35] },
  },
  {
    id: "H-LIQ-2026-03-12-B",
    rank: "B",
    recommended: false,
    title: "Convert liquid balances to HYS / MMA",
    lead: "About 35,000 customers hold large idle balances with likely ongoing liquidity needs. Move that accessible surplus cash into high-yield savings or a money-market account — customers earn more while keeping full liquidity, and the bank deepens the deposit relationship before balances leak externally.",
    whatIfOffers: { hy_savings: 35, money_market: 35 },
    ifWhatOffers: { hy_savings: [0, 40], money_market: [0, 35] },
  },
  {
    id: "H-LIQ-2026-03-12-C",
    rank: "C",
    recommended: false,
    title: "Move stable surplus cash to CD / ladder",
    lead: "For customers with stable idle balances and low near-term liquidity need, offer a short-term CD or ladder on the portion of cash that appears stable and investable — converting idle cash into committed deposits that improve customer yield and strengthen balance retention.",
    whatIfOffers: { cd_7mo: 25, cd_12mo: 30, cd_18mo: 25 },
    ifWhatOffers: { cd_7mo: [0, 25], cd_12mo: [0, 30], cd_18mo: [0, 30] },
  },
];

/* Lookup: hypothesis by id, falling back to the recommended (Card A). */
export function liquidityHypothesis(id) {
  return LIQUIDITY_HYPOTHESES.find((h) => h.id === id) || LIQUIDITY_HYPOTHESES[0];
}

export default LIQUIDITY_CONFIG;
