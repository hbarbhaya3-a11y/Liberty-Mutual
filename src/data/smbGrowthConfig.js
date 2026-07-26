/* ============================================================================
   Small Commercial Growth / Cross-line Re-bundle — Liberty Mutual USRM.
   "Detect the growing account, win the bind, bundle the lines."

   Runs the SAME flow as the sibling scenarios (hypothesis-first Analyze →
   What-If/If-What popup → modeled levers → results with charts → micro-segments
   → stage → deploy). Sibling of smbRateConfig.js — SAME export shape so the
   views fork mechanically. The intervention here is precision underwriting +
   an elasticity-aware, cross-line quote (win the growing account back from the
   insurtechs), and the modeled outcome is QUOTE-TO-BIND CONVERSION + incremental
   Yr-1 NWP — held to loss ratio (not NII).

   MONEY MODEL (internally consistent — maps to PRD "Underwriter of the Future"):
     38,400 small businesses entering expansion · 61% placing new / expanded
     coverage off-us (Next / Hiscox / biBERK / competitors)
       → precision quote (elasticity-aware price + cross-line bundle)
       → quote-to-bind conversion 8.4% (base) → 19.1% (best configuration)
       → +$31M incremental Yr-1 NWP · +0.4 lines-per-account
       → per-segment: lead line + channel, each vs its do-nothing base
       → Watch/Hold segment gets no quote (would re-open the loss-ratio problem)
   ========================================================================= */

export const SMBGROWTH_HYPOTHESIS_ID = "H-SC-GROWTH-2026-03-04";
export const SMBGROWTH_HYPOTHESIS_TITLE = "Win back the growing account";

export const SMBGROWTH_CONFIG = {
  theme: "smbgrowth",
  kind: "b2b",
  segment: "USRM · Small Commercial",
  cluster: "cluster_sc_growth_expansion",
  name: "Win back the growing account",
  objective: "deep",
  engine: "C",
  badge: "GROWTH SIGNAL",
  accent: "#4fd1c5",
  claim: "38,400 small businesses are growing — and 61% are placing the new and expanded coverage with an insurtech or a competitor. Win it back: lead with the one line each business needs most right now, priced to bind, then bundle the rest of the account around it — held to loss ratio.",
  valueLever: "Growth capture / cross-line re-bundle",
  buyer: "USRM Small Commercial · Underwriting & Product",
  valueBridge: {
    conversion:    "8.4% → 19.1%",
    incrRevenue:   "+$31M",
    primacy:       "+0.4 lines",
    headline:      "quote-to-bind conversion + incremental NWP",
  },
  bindingConstraint: {
    owner: "Underwriting / Actuarial",
    text:  "Growth cannot re-create the loss-ratio problem. Pricing to win can buy conversion below rate adequacy, and appetite expansion carries loss-ratio exposure; the rate-adequacy floor and the loss-ratio limit are the hard constraints that keep the re-bundle profitable and the book sound.",
  },
  teeth: ["credit", "pricefloor"],
  pop: 38400,
  share: 0.041,
  macro: {
    state: "Small-business expansion cycle + insurtechs (Next / Hiscox / biBERK) competing for the growth",
    drift: false,
    sub: "stable — frames the growth-capture window without destabilising the model",
    field: ["SMB formation & expansion rate", "insurtech small-commercial penetration", "broker placement switching", "rate environment & loss-cost trend"],
  },
};

/* Pre-sim KPI range strings for the Analyze hero. */
export const SMBGROWTH_PRESIM_RANGES = [
  { label: "Quote-to-bind conversion",  value: "16–22%",       unit: "from 8.4% base · est. range",         tone: "g" },
  { label: "Incremental Yr-1 NWP",      value: "+$26–37M",     unit: "/ yr · est. range",                    tone: "g" },
  { label: "Lines per account",         value: "+0.3 to +0.5", unit: "cross-line bundle lift · est. range",  tone: "g" },
  { label: "Cost to serve",             value: "$12–320",      unit: "per acct · varies by channel",         tone: "a" },
];

/* ---- Three strategies shown as signal cards on the Analyze page ---- */
export const SMBGROWTH_STRATEGIES = [
  {
    id: "A", status: { label: "Active now", tone: "amber", sub: "placing off-us" },
    title: "Win back the growing account",
    statement: {
      who: "23,400 accounts placing new or expanded coverage off-us · expansion signals firing.",
      what: "Win back the account before the insurtech deepens — leading with the line each business needs most, priced to bind.",
      why: "Liberty's own submission and loss data show the account is growing and shopping — the strongest, most defensible move.",
    },
    kpis: [
      { kind: "scale",  label: "Scope",         value: "23,400",  unit: "off-us placers",                       context: "of 38,400 cohort" },
      { kind: "gate",   label: "Rate floor",    value: "hard",    unit: "don't buy conversion below adequacy",  context: "+ loss-ratio limit" },
      { kind: "stakes", label: "Stakes (est.)", value: "+$31M",   unit: "incremental Yr-1 NWP · est.",          context: "bind 8.4% → 19.1%" },
    ],
    recommended: { star: true, name: "Win back the growing account" },
    ctaLabel: "Open the Decision Loop →", championHypothesis: "H-SC-GROWTH-2026-03-04",
  },
  {
    id: "B", status: { label: "Adjacent scenario", tone: "blue", sub: "appetite mechanism" },
    title: "Lead with the line they need",
    statement: {
      who: "~16,000 accounts with expansion signals but the growth line not yet on the book.",
      what: "Pre-qualified, elasticity-aware quote for the expansion line they don't yet carry with Liberty.",
      why: "Captures the growth need directly, ahead of the off-us placement forming.",
    },
    kpis: [
      { kind: "scale",  label: "Scope",         value: "16,000",  unit: "growth-ready",                         context: "line not yet on book" },
      { kind: "gate",   label: "Appetite gate", value: "limit",   unit: "auto-quote within appetite",           context: "sound risk selection" },
      { kind: "stakes", label: "Stakes (est.)", value: "+$18M",   unit: "incremental Yr-1 NWP · est. range",    context: "line + downstream" },
    ],
    recommended: { star: false, name: "Lead with the line they need" },
    ctaLabel: "Open the Decision Loop →", championHypothesis: "H-SC-GROWTH-2026-03-04",
  },
  {
    id: "C", status: { label: "Adjacent scenario", tone: "violet", sub: "bundle mechanism" },
    title: "Bundle the account",
    statement: {
      who: "~9,600 revenue-surge accounts scaling, thin on lines.",
      what: "Lead with the line each business needs most, then bring the rest of the account along with it (WC + Auto + Umbrella + Cyber).",
      why: "Turns an expansion moment into a durable, multi-line account with a lower blended loss ratio.",
    },
    kpis: [
      { kind: "scale",  label: "Scope",         value: "9,600",   unit: "surplus & scaling",                    context: "thin on lines" },
      { kind: "gate",   label: "Bundle",        value: "attach",  unit: "cross-line around the lead",           context: "lines-per-account lift" },
      { kind: "stakes", label: "Stakes (est.)", value: "+0.4",    unit: "lines / account · est.",               context: "durable multi-line" },
    ],
    recommended: { star: false, name: "Bundle the account" },
    ctaLabel: "Open the Decision Loop →", championHypothesis: "H-SC-GROWTH-2026-03-04",
  },
];

/* ---- Drivers (growth triggers) shown on the Analyze page, each with a mini-chart ---- */
export const SMBGROWTH_DRIVERS = [
  { n: "01", t: "Off-us placement / prior-carrier switch", pct: 23400, unit: "accounts",
    d: "New coverage bound with an insurtech, or a prior-carrier non-renewal / switch — the growth is being insured elsewhere. The urgency flag.", chart: "trigger-bars" },
  { n: "02", t: "Employee-count / payroll growth", pct: 19200, unit: "accounts",
    d: "Headcount and payroll climbing — Workers Comp and GL exposure expanding, a coverage need forming.", chart: "trigger-bars" },
  { n: "03", t: "New location / real-estate expansion", pct: 14100, unit: "accounts",
    d: "Opening or expanding a site — BOP and property coverage needed at the new location.", chart: "trigger-bars" },
  { n: "04", t: "Fleet size increase / equipment", pct: 11800, unit: "accounts",
    d: "Adding vehicles or equipment — Commercial Auto and inland-marine exposure growing.", chart: "trigger-bars" },
  { n: "05", t: "Revenue growth / cash-flow surge", pct: 9600, unit: "accounts",
    d: "Revenue accelerating — higher premium potential and appetite for umbrella and cyber.", chart: "trigger-bars" },
];

/* Current coverage the cohort carries with Liberty (cross-line white space). */
export const SMBGROWTH_HOLDINGS = [
  { p: "Business Owners Policy (BOP)", pct: 100 },
  { p: "General Liability", pct: 44 },
  { p: "Workers Comp", pct: 29 },
  { p: "Commercial Auto", pct: 11 },
  { p: "Umbrella", pct: 8 },
  { p: "Cyber", pct: 6 },
];

/* ---- Calibration anchors for the conversion/NWP model. Field names mirror
   the idle-cash calibration so simulateOutcomes() forks mechanically; semantics:
     - "retainedDepositsAnnualM" = incremental Yr-1 NWP ($M)
     - "runoffBau" / "runoffWithPolicy" = quote-to-bind conversion BASE vs BEST
       (for growth the bar chart shows conversion RISING base→policy)
     - offerCeilingBps = the price-flexibility / rate-deviation (bps) lever
     - udaap* = fair-lending / pricing-consistency margin (NAIC 24-08) ---- */
export const SMBGROWTH_CALIBRATION = {
  cohortTotal:            38400,
  eligibleAfterGate:      35500,    // excludes the watch/hold (loss-ratio-risk) segment
  offUsFinancersN:        23400,
  scalingMultisiteN:       9200,
  equipmentN:              7600,
  balancesUnderTestM:      2100,    // $2.1B premium opportunity detected
  baseConversionPct:        8.4,    // do-nothing quote-to-bind conversion
  bestConversionPct:       19.1,    // best-configuration conversion
  runoffBau:               0.084,   // base conversion as a fraction (chart "from")
  runoffWithPolicy:        0.191,   // best conversion as a fraction (chart "to")
  runoffReductionPp:       0.107,   // conversion LIFT (+10.7pp)
  retainedDepositsAnnualM:   31,    // +$31M incremental Yr-1 NWP at defaults
  productsPerRelLift:       0.4,
  revPerConversion:        2300,    // $ incremental Yr-1 NWP per bound account
  offerCostM:             1.900,    // price-flexibility / acquisition cost at defaults
  spreadProtectedK:         640,
  netAnnualisedK:         29100,
  treatmentN:             34560,    // 90%
  controlN:                3840,    // 10% holdout
  complaintsBaseline:        20,
  complaintsDelta:           35,
  udaapMargin:             0.92,    // pricing-consistency / fair-lending margin
  udaapFloor:              0.85,
  stickinessThreshold:     0.55,
};

/* ---- emergent micro-segments (the B2B addition to the results) ---- */
export const SMBGROWTH_SEGMENT_COLUMNS = [
  { id: "product", label: "Recommended lead line" },
  { id: "channel", label: "Channel" },
  { id: "conv", label: "Bind (vs base)" },
  { id: "rev", label: "Incr. NWP / acct" },
  { id: "attach", label: "Cross-line attach" },
];
export const SMBGROWTH_MICROSEGMENTS = [
  { id: "multisite", name: "Scaling multi-location", n: 9200, tone: "go",
    signals: "Real-estate expansion + new location + rising payroll",
    product: "BOP for the new site (auto-quoted) + Workers Comp",
    channel: "Broker / Agent", conv: 26, convBase: 9, rev: "$1,640", attach: "Umbrella, Auto",
    need: "A multi-location expansion needs property and liability at the new site, and WC for the added payroll, before the competitor writes it.",
    offer: "Pre-analyzed submission, elasticity-aware quote with terms up front · WC bundled with the BOP.",
    cost: "Underwriter time, ~$210/acct — justified by the multi-line premium.",
    confidence: "26% ± 3.1pp (holdout-backed)" },
  { id: "offus", name: "Off-us / insurtech placers", n: 12400, tone: "go",
    signals: "New off-us placement + prior-carrier switch",
    product: "Win-back quote on the lead line, priced to bind",
    channel: "Direct digital instant-quote", conv: 22, convBase: 7, rev: "$880", attach: "GL, Cyber",
    need: "The coverage is already leaving — win the account back with a fast, competitive quote before the insurtech deepens.",
    offer: "Elasticity-aware quote at the recommended price point, delivered the moment the off-us signal fires.",
    cost: "Digital, ~$14/acct — the cheapest bind in the cohort.",
    confidence: "22% ± 2.4pp (holdout-backed)" },
  { id: "equip", name: "Fleet / equipment-heavy", n: 7600, tone: "go",
    signals: "Fleet size increase + equipment purchase",
    product: "Commercial Auto (fleet) + inland marine",
    channel: "Referral UW + digital", conv: 18, convBase: 8, rev: "$2,100", attach: "Umbrella",
    need: "A growing fleet raises auto exposure — a fleet Commercial Auto program with a safety credit fits the risk.",
    offer: "Pre-qualified fleet terms with a telematics safety credit, specialist-led with a digital follow-up.",
    cost: "UW time, ~$320/acct — highest per-acct premium offsets it.",
    confidence: "18% ± 2.8pp (holdout-backed)" },
  { id: "surplus", name: "Revenue-surge, scaling", n: 6300, tone: "go",
    signals: "Revenue growth + profitability boost",
    product: "Business Advantage bundle (BOP + WC + Umbrella + Cyber)",
    channel: "Direct digital", conv: 24, convBase: 11, rev: "$640", attach: "Auto, Umbrella",
    need: "Surplus and growth call for a bundle that captures the whole account and lowers the blended loss ratio.",
    offer: "Bundled multi-line quote on the Business Advantage package, presented digitally.",
    cost: "Digital, ~$12/acct — strong cross-line attach downstream.",
    confidence: "24% ± 2.6pp (holdout-backed)" },
  { id: "hold", name: "Watch / hold", n: 2900, tone: "hold",
    signals: "Adverse loss trend, thin margin",
    product: "No quote — would re-open the loss-ratio problem",
    channel: "—", conv: null, convBase: null, rev: "—", attach: "—",
    need: "Loss signals are adverse and rate adequacy is thin; modeled bind does not clear the loss-ratio limit.",
    offer: "No quote this cycle — re-evaluate when the loss trend clears or rate is filed.",
    cost: "$0 — writing here is modeled to erode the loss ratio.",
    confidence: "Suppressed — below the rate-adequacy threshold." },
];

export default SMBGROWTH_CONFIG;
