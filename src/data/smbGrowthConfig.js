/* ============================================================================
   SMB Growth / Re-bundle — runs the SAME flow as the idle-cash scenario
   (hypothesis-first Analyze → What-If/If-What popup → modeled levers → results
   with charts → micro-segments → stage → deploy).

   Sibling of smbRateConfig.js — SAME export shape so the idle-cash views fork
   mechanically. The intervention here is a re-bundle offer (credit + payments
   win-back), and the modeled outcome is CROSS-SELL CONVERSION + incremental
   revenue (not NII).

   MONEY MODEL (internally consistent):
     38,400 SMBs entering expansion · 61% financing/processing off-us
       → re-bundle offer (pre-approved line + card win-back + merchant)
       → cross-sell conversion 8.4% (base) → 19.1% (best configuration)
       → +$31M incremental Yr-1 revenue · +0.4 products-per-relationship
       → per-segment: lead product + channel, each vs its do-nothing base
       → Watch/Hold segment gets no offer (cost > modeled return)
   ========================================================================= */

export const SMBGROWTH_HYPOTHESIS_ID = "H-SMB-GROWTH-2026-03-04";
export const SMBGROWTH_HYPOTHESIS_TITLE = "Win back business banking";

export const SMBGROWTH_CONFIG = {
  theme: "smbgrowth",
  kind: "b2b",
  segment: "B2B · SMB",
  cluster: "cluster_smb_growth_expansion",
  name: "Win back business banking",
  objective: "deep",
  engine: "C",
  badge: "GROWTH SIGNAL",
  accent: "#4fd1c5",
  claim: "38,400 small businesses are growing — and 61% are already taking their financing and card processing to a competitor. Win it back: lead with the one product each business needs most right now, then bring its everyday banking along with it.",
  valueLever: "Life-event / expansion capture",
  buyer: "Business Banking / SMB Segment",
  valueBridge: {
    conversion:    "8.4% → 19.1%",
    incrRevenue:   "+$31M",
    primacy:       "+0.4 products",
    headline:      "cross-sell conversion + incremental revenue",
  },
  bindingConstraint: {
    owner: "Credit Risk / Pricing",
    text:  "Pre-approved lines carry credit-risk exposure and the offer can buy conversion away below the margin line; the credit-risk limit and the price floor are the hard constraints that keep the re-bundle profitable and the pre-approvals sound.",
  },
  teeth: ["credit", "pricefloor"],
  pop: 38400,
  share: 0.041,
  macro: {
    state: "SMB expansion cycle + fintech and competitor financing competing for the growth",
    drift: false,
    sub: "stable — frames the expansion-financing window without destabilising the model",
    field: ["SMB formation & expansion rate", "fintech SMB-credit competition", "merchant-acquirer switching", "rate environment for SMB lending"],
  },
};

/* Pre-sim KPI range strings for the Analyze hero. */
export const SMBGROWTH_PRESIM_RANGES = [
  { label: "Cross-sell conversion",   value: "16–22%",       unit: "from 8.4% base · est. range",         tone: "g" },
  { label: "Incremental Yr-1 revenue", value: "+$26–37M",    unit: "/ yr · est. range",                    tone: "g" },
  { label: "Products per relationship", value: "+0.3 to +0.5", unit: "primacy lift · est. range",          tone: "g" },
  { label: "Cost to serve",           value: "$12–320",      unit: "per acct · varies by channel",         tone: "a" },
];

/* ---- Three strategies shown as signal cards on the Analyze page ---- */
export const SMBGROWTH_STRATEGIES = [
  {
    id: "A", status: { label: "Active now", tone: "amber", sub: "off-us leaking" },
    title: "Win back business banking",
    statement: {
      who: "23,400 SMBs financing or processing off-us · expansion signals firing.",
      what: "Win back the credit and payments relationship before the competitor deepens — leading with what each business needs most.",
      why: "The bank's own data shows the relationship is actively leaking — the strongest, most defensible move.",
    },
    kpis: [
      { kind: "scale",  label: "Scope",         value: "23,400",  unit: "off-us financers",                    context: "of 38,400 cohort" },
      { kind: "gate",   label: "Price floor",   value: "hard",    unit: "don't buy conversion away",           context: "+ credit-risk limit" },
      { kind: "stakes", label: "Stakes (est.)", value: "+$31M",   unit: "incremental Yr-1 rev · est.",         context: "conv 8.4% → 19.1%" },
    ],
    recommended: { star: true, name: "Win back business banking" },
    ctaLabel: "Open the Decision Loop →", championHypothesis: "H-SMB-GROWTH-2026-03-04",
  },
  {
    id: "B", status: { label: "Adjacent scenario", tone: "blue", sub: "readiness mechanism" },
    title: "Lead with what they need",
    statement: {
      who: "~16,000 SMBs with expansion-financing signals but no on-us credit.",
      what: "Pre-approved financing for the expansion need they don't yet hold on-us.",
      why: "Captures the financing need directly, ahead of the off-us relationship forming.",
    },
    kpis: [
      { kind: "scale",  label: "Scope",         value: "16,000",  unit: "financing-ready",                     context: "no on-us credit" },
      { kind: "gate",   label: "Credit gate",   value: "limit",   unit: "pre-approved within risk",            context: "sound underwriting" },
      { kind: "stakes", label: "Stakes (est.)", value: "+$18M",   unit: "incremental Yr-1 rev · est. range",   context: "line + downstream" },
    ],
    recommended: { star: false, name: "Lead with what they need" },
    ctaLabel: "Open the Decision Loop →", championHypothesis: "H-SMB-GROWTH-2026-03-04",
  },
  {
    id: "C", status: { label: "Adjacent scenario", tone: "violet", sub: "primacy mechanism" },
    title: "Bundle the relationship",
    statement: {
      who: "~9,600 cash-flow-surplus SMBs scaling, thin on products.",
      what: "Lead with what each business needs most, then bring its everyday banking along with it.",
      why: "Turns an expansion moment into durable primacy by capturing the everyday operating flows.",
    },
    kpis: [
      { kind: "scale",  label: "Scope",         value: "9,600",   unit: "surplus & scaling",                   context: "thin on products" },
      { kind: "gate",   label: "Bundle",        value: "attach",  unit: "Essentials around the lead",          context: "primacy lift" },
      { kind: "stakes", label: "Stakes (est.)", value: "+0.4",    unit: "products / relationship · est.",      context: "durable primacy" },
    ],
    recommended: { star: false, name: "Bundle the relationship" },
    ctaLabel: "Open the Decision Loop →", championHypothesis: "H-SMB-GROWTH-2026-03-04",
  },
];

/* ---- Drivers (triggers) shown on the Analyze page, each with a mini-chart ---- */
export const SMBGROWTH_DRIVERS = [
  { n: "01", t: "Off-us financing / acquirer change", pct: 23400, unit: "SMBs",
    d: "New off-us small-business card and merchant-acquirer switches — the relationship is financing the growth elsewhere. The urgency flag.", chart: "trigger-bars" },
  { n: "02", t: "Rising recurring cost", pct: 19200, unit: "SMBs",
    d: "Payroll and rent climbing — scaling headcount and footprint, a financing need forming.", chart: "trigger-bars" },
  { n: "03", t: "Real-estate / new-location activity", pct: 14100, unit: "SMBs",
    d: "Opening or expanding a site — growth capital and payments needed at the new location.", chart: "trigger-bars" },
  { n: "04", t: "Major asset purchase / equipment", pct: 11800, unit: "SMBs",
    d: "Buying or leasing equipment with escalating rental cost — ownership financing fits.", chart: "trigger-bars" },
  { n: "05", t: "Cash-flow surge / profitability", pct: 9600, unit: "SMBs",
    d: "Revenue accelerating — surplus cash to deploy into a bundle and a sweep.", chart: "trigger-bars" },
];

/* Current product holdings of the cohort (white space for the re-bundle). */
export const SMBGROWTH_HOLDINGS = [
  { p: "Checking", pct: 100 },
  { p: "Card processing (Elavon)", pct: 44 },
  { p: "Business credit card", pct: 29 },
  { p: "Lending / line of credit", pct: 11 },
  { p: "Payroll / Bill Pay", pct: 8 },
  { p: "Treasury / sweep", pct: 6 },
];

/* ---- Calibration anchors for the conversion/revenue model. Field names mirror
   the idle-cash calibration so simulateOutcomes() forks mechanically; semantics:
     - "retainedDepositsAnnualM" = incremental Yr-1 revenue ($M)
     - "runoffBau" / "runoffWithPolicy" = cross-sell conversion BASE vs BEST
       (note: for growth the bar chart shows conversion RISING base→policy)
     - offerCeilingBps = the intro-pricing / fee-waiver depth (bps) lever ---- */
export const SMBGROWTH_CALIBRATION = {
  cohortTotal:            38400,
  eligibleAfterGate:      35500,    // excludes the watch/hold segment
  offUsFinancersN:        23400,
  scalingMultisiteN:       9200,
  equipmentN:              7600,
  balancesUnderTestM:      2100,    // $2.1B financing need detected
  baseConversionPct:        8.4,    // do-nothing cross-sell conversion
  bestConversionPct:       19.1,    // best-configuration conversion
  runoffBau:               0.084,   // base conversion as a fraction (chart "from")
  runoffWithPolicy:        0.191,   // best conversion as a fraction (chart "to")
  runoffReductionPp:       0.107,   // conversion LIFT (+10.7pp)
  retainedDepositsAnnualM:   31,    // +$31M incremental Yr-1 revenue at defaults
  productsPerRelLift:       0.4,
  revPerConversion:        2300,    // $ incremental Yr-1 revenue per converted acct
  offerCostM:             1.900,    // intro-pricing / fee-waiver cost at defaults
  spreadProtectedK:         640,
  netAnnualisedK:         29100,
  treatmentN:             34560,    // 90%
  controlN:                3840,    // 10%
  complaintsBaseline:        20,
  complaintsDelta:           35,
  udaapMargin:             0.92,    // pricing-consistency / fairness margin
  udaapFloor:              0.85,
  stickinessThreshold:     0.55,
};

/* ---- emergent micro-segments (the B2B addition to the results) ---- */
export const SMBGROWTH_SEGMENT_COLUMNS = [
  { id: "product", label: "Recommended lead product" },
  { id: "channel", label: "Channel" },
  { id: "conv", label: "Conv. (vs base)" },
  { id: "rev", label: "Incr. rev / acct" },
  { id: "attach", label: "Downstream attach" },
];
export const SMBGROWTH_MICROSEGMENTS = [
  { id: "multisite", name: "Scaling multi-site", n: 9200, tone: "go",
    signals: "Real-estate expansion + new location + rising recurring cost",
    product: "Business Line of Credit (pre-approved) + merchant for new site",
    channel: "Primary banker", conv: 26, convBase: 9, rev: "$1,640", attach: "Treasury, Payroll",
    need: "A multi-site expansion needs growth capital and payments at the new location before the competitor finances it.",
    offer: "Pre-approved line with terms up front · merchant bundled with the line.",
    cost: "Banker time, ~$210/acct — justified by the line + downstream treasury.",
    confidence: "26% ± 3.1pp (holdout-backed)" },
  { id: "offus", name: "Off-us financers", n: 12400, tone: "go",
    signals: "New off-us small-biz card + merchant-acquirer change",
    product: "Business card win-back, bundled price",
    channel: "In-app pre-approval", conv: 22, convBase: 7, rev: "$880", attach: "Bill Pay, line",
    need: "Credit and processing are already leaving — win the card back before the competitor deepens.",
    offer: "Pre-approved card limit, bundled price, shown in-app the moment the off-us signal fires.",
    cost: "Digital, ~$14/acct — the cheapest conversion in the cohort.",
    confidence: "22% ± 2.4pp (holdout-backed)" },
  { id: "equip", name: "Equipment-heavy", n: 7600, tone: "go",
    signals: "Major asset purchase + equipment-rental escalation",
    product: "Equipment finance / SBA",
    channel: "RM + app", conv: 18, convBase: 8, rev: "$2,100", attach: "Spend Mgmt",
    need: "Escalating rental cost makes ownership financing cheaper — equipment finance / SBA fits the asset.",
    offer: "Pre-qualified equipment-finance terms, RM-led with an app follow-up.",
    cost: "RM time, ~$320/acct — highest per-acct revenue offsets it.",
    confidence: "18% ± 2.8pp (holdout-backed)" },
  { id: "surplus", name: "Cash-flow surplus, scaling", n: 6300, tone: "go",
    signals: "Cash-flow surge + profitability boost",
    product: "Business Essentials bundle + sweep",
    channel: "In-app", conv: 24, convBase: 11, rev: "$640", attach: "Card, treasury",
    need: "Surplus cash and growth call for a bundle that captures the operating flows and sweeps the idle balance.",
    offer: "Bundle price on Business Essentials + sweep, presented in-app.",
    cost: "Digital, ~$12/acct — strong primacy attach downstream.",
    confidence: "24% ± 2.6pp (holdout-backed)" },
  { id: "hold", name: "Watch / hold", n: 2900, tone: "hold",
    signals: "Mixed signals, thin margin",
    product: "No offer — cost > modeled return",
    channel: "—", conv: null, convBase: null, rev: "—", attach: "—",
    need: "Signals are mixed and margin is thin; modeled conversion does not clear the cost to serve.",
    offer: "No offer this cycle — re-evaluate when a clearer trigger fires.",
    cost: "$0 — spending here is modeled to lose money.",
    confidence: "Suppressed — below the cost-to-serve threshold." },
];

export default SMBGROWTH_CONFIG;
