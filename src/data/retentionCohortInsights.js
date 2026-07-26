/* ============================================================================
   Deposit Retention · cohort insight constants used by retention reason cards.

   Sibling to cohortInsights.js (does NOT modify it). Mini-chart data drives
   the retention reason cards in RetentionAnalyzeView.
   ========================================================================= */

export const RETENTION_REASON_CARDS = [
  {
    n: "R1",
    t: "Engagement drop + competitor-quote joint signal",
    d: "The joint occurrence of digital-engagement decline and a competitor quote-request is 2.3× more predictive than either signal alone — the combination identifies genuine shopping-onset, not noise.",
    pct: 84,
    a: "joint signal precision 0.84",
    chart: "joint-signal",
  },
  {
    n: "R2",
    t: "Coverage-question volatility 2.1× cohort median",
    d: "Month-to-month coverage-inquiry and portal-visit swings exceeding 2× median are a reliable predictor of 90-day lapse in the high-LTV segment.",
    pct: 78,
    a: "volatility ratio 2.1×",
    chart: "volatility-bars",
  },
  {
    n: "R3",
    t: "Engagement + paperless-open decay joint",
    d: "Portal-login decline combined with paperless-statement open decay marks the silent-pre-shopper sub-segment — intervening before competitor shopping develops.",
    pct: 71,
    a: "engagement decay joint",
    chart: "primacy-decay",
  },
  {
    n: "R4",
    t: "Elastic shoppers distinguishable from sticky bundled",
    d: "The shopping-risk model separates price-elastic shoppers (competitor quotes + coverage questions) from operationally-loyal bundled households (auto-pay, long tenure) — different intervention windows.",
    pct: 66,
    a: "elastic vs sticky separability",
    chart: "stickiness-distribution",
  },
  {
    n: "R5",
    t: "Single-line (unbundled) amplifier",
    d: "Auto-only customers with no home/umbrella anchor have a 1.9× higher 12-month lapse probability — bundle depth is not the cause but amplifies every other signal.",
    pct: 62,
    a: "unbundled multiplier 1.9×",
    chart: "product-depth",
  },
];

/* Histogram bins for the joint-signal chart (balance-decline % bands × frequency).
   The 10-15% band is the actionable peak — Strategy A's primary target. */
export const JOINT_SIGNAL_BINS = [
  { band: "< 5%",   freq: 12 },
  { band: "5-10%",  freq: 28 },
  { band: "10-15%", freq: 41, target: true },
  { band: "15-20%", freq: 18, target: true },
  { band: "> 20%",  freq:  9 },
];

/* Volatility-ratio distribution bars. Bands 1.5-2.0× and 2.0-2.5× are the
   actionable bands — above-median but not so volatile as to be noise. */
export const VOLATILITY_BARS = [
  { ratio: "< 1.0×",   pct:  8 },
  { ratio: "1.0-1.5×", pct: 22 },
  { ratio: "1.5-2.0×", pct: 35, target: true },
  { ratio: "2.0-2.5×", pct: 24, target: true },
  { ratio: "> 2.5×",   pct: 11 },
];

/* Primacy-decay overlay: DD frequency + bill-pay count per archetype.
   Higher values = more decayed (worse primacy). */
export const PRIMACY_DECAY = [
  { archetype: "Shopping Renewer",   dd: 0.55, bp: 0.62 },
  { archetype: "Silent Pre-Shopper", dd: 0.84, bp: 0.78 },
  { archetype: "Sticky Bundled",     dd: 0.22, bp: 0.15 },
];

/* Loyalty-score distribution. Target gate at 0.70 — bins above are sticky
   (fair-lending-protected, NOT offered the discount); bins below are elastic (eligible). */
export const STICKINESS_DISTRIBUTION = [
  { bin: "0.0-0.2", pct:  4, eligible: true  },
  { bin: "0.2-0.4", pct: 12, eligible: true  },
  { bin: "0.4-0.6", pct: 28, eligible: true  },
  { bin: "0.6-0.7", pct: 16, eligible: true  },
  { bin: "0.7-0.8", pct: 22, sticky: true    },
  { bin: "0.8-1.0", pct: 18, sticky: true    },
];

/* Product-depth amplifier — % of cohort by product count. */
export const PRODUCT_DEPTH = [
  { products: "1",  pct: 49, amplified: true },
  { products: "2",  pct: 27 },
  { products: "3",  pct: 14 },
  { products: "4+", pct: 10 },
];
