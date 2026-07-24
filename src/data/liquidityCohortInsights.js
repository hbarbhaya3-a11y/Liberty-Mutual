/* ============================================================================
   Idle-Cash Liquidity Activation · cohort insight constants used by liquidity
   reason cards.

   Sibling to retentionCohortInsights.js (does NOT modify it). Mini-chart data
   drives the liquidity reason cards in LiquidityAnalyzeView. Numbers are
   consistent with liquidityConfig.js: 388,000 flagged, ~75,000 showing activation signals
   after a 0.55 suitability gate, $1.2B under test.
   ========================================================================= */

export const LIQUIDITY_REASON_CARDS = [
  {
    n: "R1",
    t: "Idle-balance depth — large balances dormant 60d+",
    d: "Deep idle balances sitting untouched 60+ days are the structural fuel of the cohort — large dormant savings, not transient cash, account for the bulk of the $9.3B in scope and the ~$1.6B held by the ~75K showing genuine activation signals.",
    pct: 86,
    a: "idle-depth concentration 0.86",
    chart: "joint-signal",
  },
  {
    n: "R2",
    t: "Yield gap — ~0.05% held vs 4%+ market",
    d: "Balances earning ~0.05% APY against a 4%+ external market create a yield gap wide enough to make idle cash actively expensive to hold — the single largest driver of flight intent in the idle-cash cohort.",
    pct: 79,
    a: "yield gap ~4.0pp",
    chart: "volatility-bars",
  },
  {
    n: "R3",
    t: "In-app high-yield search activity rising",
    d: "Rising in-app searches for 'CD rates' and 'high-yield savings' precede outbound movement — the search behaviour climbs over the dormancy window and marks the cohort that is actively courting alternatives before any transfer fires.",
    pct: 72,
    a: "search-intent slope rising",
    chart: "primacy-decay",
  },
  {
    n: "R4",
    t: "Outbound pull acceleration — ACH/wire +50% QoQ",
    d: "Outbound ACH and wire pulls to external high-yield banks accelerated +50% quarter-over-quarter — the suitability model separates this genuine idle-flight onset from routine working-capital movement, defining the intervention window.",
    pct: 67,
    a: "outbound pull +50% QoQ",
    chart: "stickiness-distribution",
  },
  {
    n: "R5",
    t: "Suitability model separates surplus from buffers",
    d: "The suitability model separates genuinely activatable surplus idle cash from operating and emergency buffers — it is not a driver of flight but the gate that separates the ~75K showing genuine activation signals from operating buffers, routed into the best-fit funded product.",
    pct: 63,
    a: "suitability gate 0.55",
    chart: "product-depth",
  },
];

/* Histogram bins for the idle-balance-depth chart (idle-balance $ bands ×
   frequency). The $20-50K band is the actionable peak — the surplus idle pool
   the activation strategy primarily targets. */
export const JOINT_SIGNAL_BINS = [
  { band: "< $5K",     freq: 12 },
  { band: "$5-20K",    freq: 28 },
  { band: "$20-50K",   freq: 41, target: true },
  { band: "$50-100K",  freq: 18, target: true },
  { band: "> $100K",   freq:  9 },
];

/* Yield-gap distribution bars (held-vs-market spread bands). Bands 3.0-4.0pp
   and 4.0-5.0pp are the actionable bands — gap wide enough to motivate, balance
   large enough to matter. */
export const VOLATILITY_BARS = [
  { ratio: "< 1.0pp",    pct:  8 },
  { ratio: "1.0-3.0pp",  pct: 22 },
  { ratio: "3.0-4.0pp",  pct: 35, target: true },
  { ratio: "4.0-5.0pp",  pct: 24, target: true },
  { ratio: "> 5.0pp",    pct: 11 },
];

/* Dormancy-progression overlay: search-intent + outbound-pull index per
   archetype. Higher values = further along the idle-flight progression. */
export const PRIMACY_DECAY = [
  { archetype: "Idle Retiree",     dd: 0.55, bp: 0.62 },
  { archetype: "Bonus Holder",     dd: 0.84, bp: 0.78 },
  { archetype: "Operating Buffer", dd: 0.22, bp: 0.15 },
];

/* Suitability-score distribution. Gate at 0.55 — bins above are activatable
   surplus idle cash (eligible for the offer); bins below are operating /
   emergency buffers (must stay liquid, NOT offered the term product). */
export const STICKINESS_DISTRIBUTION = [
  { bin: "0.0-0.2", pct:  4, sticky: true    },
  { bin: "0.2-0.4", pct: 12, sticky: true    },
  { bin: "0.4-0.55", pct: 18, sticky: true   },
  { bin: "0.55-0.7", pct: 26, eligible: true },
  { bin: "0.7-0.8", pct: 22, eligible: true  },
  { bin: "0.8-1.0", pct: 18, eligible: true  },
];

/* Current product mix of the idle holders — % of cohort by product count.
   Single-product idle holders are the largest sub-segment to activate. */
export const PRODUCT_DEPTH = [
  { products: "1",  pct: 49, amplified: true },
  { products: "2",  pct: 27 },
  { products: "3",  pct: 14 },
  { products: "4+", pct: 10 },
];
