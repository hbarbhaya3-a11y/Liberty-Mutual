/* ============================================================================
   Deposit Retention · cohort insight constants used by retention reason cards.

   Sibling to cohortInsights.js (does NOT modify it). Mini-chart data drives
   the retention reason cards in RetentionAnalyzeView.
   ========================================================================= */

export const RETENTION_REASON_CARDS = [
  {
    n: "R1",
    t: "Balance slope + outbound ACH joint signal",
    d: "The joint occurrence of balance decline and ACH-out acceleration is 2.3× more predictive than either signal alone — the combination identifies genuine drift-onset, not noise.",
    pct: 84,
    a: "joint signal precision 0.84",
    chart: "joint-signal",
  },
  {
    n: "R2",
    t: "Operating-balance volatility 2.1× cohort median",
    d: "Month-to-month operating-balance swings exceeding 2× median are a reliable predictor of 90-day runoff in the mass-affluent segment.",
    pct: 78,
    a: "volatility ratio 2.1×",
    chart: "volatility-bars",
  },
  {
    n: "R3",
    t: "Direct-deposit + bill-pay decay joint",
    d: "Direct-deposit frequency decline combined with bill-pay deactivation marks the operating-decliner sub-segment — intervening before rate-shopping develops.",
    pct: 71,
    a: "DD+BP decay joint",
    chart: "primacy-decay",
  },
  {
    n: "R4",
    t: "Drift distinguishable from rate-shopping",
    d: "The drift classification model separates primacy-weakening (upstream behavioural) from active rate-shopping (aggregator logins + probing transfers) — different intervention windows.",
    pct: 66,
    a: "drift vs shopping separability",
    chart: "stickiness-distribution",
  },
  {
    n: "R5",
    t: "Low product depth amplifier",
    d: "Single-product customers with no secondary anchor have a 1.9× higher 12-month attrition probability — product depth is not the cause but amplifies every other signal.",
    pct: 62,
    a: "depth multiplier 1.9×",
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
  { archetype: "Drifting Saver",     dd: 0.55, bp: 0.62 },
  { archetype: "Operating Decliner", dd: 0.84, bp: 0.78 },
  { archetype: "Anchored Saver",     dd: 0.22, bp: 0.15 },
];

/* Stickiness-score distribution. Target gate at 0.70 — bins above are sticky
   (UDAAP-protected, NOT offered the rate); bins below are elastic (eligible). */
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
