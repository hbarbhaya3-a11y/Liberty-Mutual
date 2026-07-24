/* ============================================================================
   Affluent / Wealth Attach · cohort insight constants used by wealth reason
   cards.

   Sibling to liquidityCohortInsights.js (does NOT modify it). Mini-chart data
   drives the wealth reason cards in WealthAnalyzeView. Numbers are consistent
   with wealthConfig.js: 18,400 flagged, ~6,200 advice-ready after a 0.55
   suitability gate, $1.1B investable held outside.

   chart keys reuse the liquidity dispatch ("joint-signal", "volatility-bars",
   "primacy-decay", "stickiness-distribution", "product-depth") so the analyze
   chart switch forks unchanged.
   ========================================================================= */

export const WEALTH_REASON_CARDS = [
  {
    n: "R1",
    t: "Wealth gap — investable assets held away",
    d: "No wealth product despite a deep banking relationship — the single largest white-space driver in the book. 18.4K households hold an estimated $1.1B of investable assets outside, on top of trust the bank already earned.",
    pct: 86,
    a: "wealth gap · attach 0 · 18.4K",
    chart: "joint-signal",
  },
  {
    n: "R2",
    t: "External movement — assets already leaving",
    d: "Transfers to brokerage, fund and robo-advisor platforms, with aggregator logins, show the assets are already being courted elsewhere — every week un-acted raises the odds they commit for good.",
    pct: 79,
    a: "external pull rising",
    chart: "volatility-bars",
  },
  {
    n: "R3",
    t: "Advice-readiness intent rising",
    d: "Engagement with retirement, IRA and investing content climbs over the window — active curiosity that, paired with sustained surplus balances, marks a real, evidenced advice-need rather than just a high balance.",
    pct: 72,
    a: "readiness slope rising",
    chart: "primacy-decay",
  },
  {
    n: "R4",
    t: "Life-stage relevance — a natural advisory moment",
    d: "Retirement-age band, mortgage progress and household stability create a natural moment for advice — the model separates this genuine readiness from incidental balance spikes, defining the intervention window.",
    pct: 67,
    a: "life-stage fit",
    chart: "stickiness-distribution",
  },
  {
    n: "R5",
    t: "Suitability gate separates ready from unsuitable",
    d: "A high balance is not an advice-need. The suitability model separates the genuinely advice-ready from the unsuitable and the spoken-for — it is not a driver of conversion but the gate that turns 18.4K flagged into ~6.2K actionable without a fair-treatment failure.",
    pct: 63,
    a: "suitability gate 0.55",
    chart: "product-depth",
  },
];

/* Histogram bins for the investable-potential chart (held-away investable $
   bands × frequency). The $100-250K band is the actionable peak — the
   advice-ready core the attach motion primarily targets. */
export const JOINT_SIGNAL_BINS = [
  { band: "< $50K",     freq: 14 },
  { band: "$50-100K",   freq: 23 },
  { band: "$100-250K",  freq: 39, target: true },
  { band: "$250-500K",  freq: 17, target: true },
  { band: "> $500K",    freq:  7 },
];

/* External-movement distribution bars (share of cohort by outbound-investment
   intensity band). The mid bands are the actionable window — moving, but not
   yet fully committed elsewhere. */
export const VOLATILITY_BARS = [
  { ratio: "none",        pct: 31 },
  { ratio: "early",       pct: 26, target: true },
  { ratio: "active",      pct: 23, target: true },
  { ratio: "accelerating", pct: 13 },
  { ratio: "committed",   pct:  7 },
];

/* Advice-readiness progression overlay: digital-intent + surplus-balance index
   per archetype. Higher values = further along the readiness progression. */
export const PRIMACY_DECAY = [
  { archetype: "Advice-Ready Deepener", dd: 0.71, bp: 0.81 },
  { archetype: "High-AUM Mover",        dd: 0.58, bp: 0.64 },
  { archetype: "Aspirational Saver",    dd: 0.18, bp: 0.69 },
];

/* Suitability-score distribution. Gate at 0.55 — bins above are advice-ready
   and activatable (eligible for an offer); bins below are unsuitable or
   spoken-for (must NOT be routed to an advisor). */
export const STICKINESS_DISTRIBUTION = [
  { bin: "0.0-0.2", pct:  6, sticky: true    },
  { bin: "0.2-0.4", pct: 13, sticky: true    },
  { bin: "0.4-0.55", pct: 15, sticky: true   },
  { bin: "0.55-0.7", pct: 24, eligible: true },
  { bin: "0.7-0.8", pct: 24, eligible: true  },
  { bin: "0.8-1.0", pct: 18, eligible: true  },
];

/* Current banking product depth of the flagged households — % of cohort by
   product count. Deeper relationships convert best; the 3+ product holders are
   the highest-trust core to start the wealth conversation with. */
export const PRODUCT_DEPTH = [
  { products: "1",  pct: 17 },
  { products: "2",  pct: 28 },
  { products: "3",  pct: 33, amplified: true },
  { products: "4+", pct: 22, amplified: true },
];
