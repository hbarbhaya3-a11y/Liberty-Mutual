/* ============================================================================
   SMB Deposit Retention via Rate — runs the SAME flow as the idle-cash scenario
   (hypothesis-first Analyze → What-If/If-What popup → modeled levers → results
   with charts → micro-segments → stage → deploy).

   Sibling of liquidityConfig.js — SAME export shape so the idle-cash views fork
   mechanically. Engine D (deepen/defend balances), but the lever is interest-
   rate repricing and the cohort is the SMB operating-deposit relationship.

   MONEY MODEL (internally consistent):
     41,200 SMB operating-deposit accounts · $3.4B at risk · blended 1.10% paid
       → $54M NII exposure (the spread that walks if the balance leaves)
       → minimum-effective reprice at a blended +38 bps (vs +95 bps to MATCH)
       → retains $2.6B of $3.4B and $41M of $54M NII
       → +$13M MORE NII retained / yr than a blanket competitor-match
       → no-overpay suppresses the will-stay segment; margin floor blocks the rest
   ========================================================================= */

export const SMBRATE_HYPOTHESIS_ID = "H-SMB-RATE-2026-03-04";
export const SMBRATE_HYPOTHESIS_TITLE = "Defend SMB deposits";

export const SMBRATE_CONFIG = {
  theme: "smbrate",
  kind: "b2b",
  segment: "B2B · SMB",
  cluster: "cluster_smb_operating_deposit_rate",
  name: "Defend SMB deposits",
  objective: "ret",
  engine: "D",
  badge: "DEPOSIT RISK",
  accent: "#ff6b6b",
  claim: "$3.4B of healthy SMB deposits are being courted away on rate — these businesses aren't in trouble, they're just shopping. Defend them with the smallest rate increase that actually holds each account, and don't pay the ones that would stay anyway.",
  valueLever: "Deepen/defend balances",
  buyer: "Commercial Deposits / Treasury Pricing",
  valueBridge: {
    niiRetained:   "+$41M",
    vsMatch:       "+$13M",
    balancesKept:  "$2.6B",
    headline:      "NII retained vs. a blanket competitor-match",
  },
  bindingConstraint: {
    owner: "Treasury / Compliance / MRM",
    text:  "Repricing into a negative spread, or overpaying accounts that would stay without an offer, destroys NII; the margin floor and the no-overpay rule are the hard constraints that keep the program net-positive and the pricing consistent across comparable accounts.",
  },
  teeth: ["margin", "overpay"],
  pop: 41200,
  share: 0.058,
  macro: {
    state: "Rate-cut cycle turning + competitor high-yield deposit promotions intensifying",
    drift: false,
    sub: "stable — frames how fast deposits are leaving without overstating the flight risk",
    field: ["rate path / deposit beta", "competitor HY deposit promo intensity", "open-banking portability", "SMB cash-management behaviour"],
  },
};

/* Pre-sim KPI range strings for the Analyze hero (estimator output, not point
   predictions — the simulation tightens each into a CI). */
export const SMBRATE_PRESIM_RANGES = [
  { label: "NII retained",            value: "+$34–46M",     unit: "/ yr · est. range",                  tone: "g" },
  { label: "vs. competitor-match",    value: "+$9–16M",      unit: "more NII / yr · est. range",          tone: "g" },
  { label: "Balances retained",       value: "$2.3–2.9B",    unit: "of $3.4B at risk · est. range",       tone: "g" },
  { label: "Blended rate given",      value: "+32 to +44",   unit: "bps · vs +95 to match",               tone: "a" },
];

/* ---- Three strategies shown as signal cards on the Analyze page ----
   Mirrors the idle-cash signal cards: one starred recommendation + two
   adjacent scenarios, each a mechanism-distinct way to defend the deposit. */
export const SMBRATE_STRATEGIES = [
  {
    id: "A", status: { label: "Active now", tone: "amber", sub: "rate-shopping" },
    title: "Defend SMB deposits",
    statement: {
      who: "41,200 SMB operating accounts · $3.4B · early outflow + rate-shopping, no distress.",
      what: "The smallest rate increase that actually holds each account — sized to what each one needs, no more.",
      why: "Saves the balances that are genuinely rate-sensitive at far less margin than matching the competitor's headline.",
    },
    kpis: [
      { kind: "scale",  label: "Scope",         value: "$3.4B",   unit: "operating deposits at risk",          context: "41,200 accounts" },
      { kind: "gate",   label: "Margin floor",  value: "hard",    unit: "no reprice into negative spread",     context: "+ no-overpay rule" },
      { kind: "stakes", label: "Stakes (est.)", value: "+$41M",   unit: "NII retained / yr · est.",            context: "+$13M vs blanket match" },
    ],
    recommended: { star: true, name: "Defend SMB deposits" },
    ctaLabel: "Open the Decision Loop →", championHypothesis: "H-SMB-RATE-2026-03-04",
  },
  {
    id: "B", status: { label: "Adjacent scenario", tone: "blue", sub: "relationship mechanism" },
    title: "Relationship rate",
    statement: {
      who: "~9,100 multi-product accounts with partial outflow but payroll/treasury still on-us.",
      what: "A better rate conditional on keeping payroll / treasury on-us — defends NII and primacy together.",
      why: "Anchoring the relationship retains the balance more cheaply than matching rate, and re-bundles the flows.",
    },
    kpis: [
      { kind: "scale",  label: "Scope",         value: "9,100",   unit: "relationship-anchorable",             context: "multi-product" },
      { kind: "gate",   label: "Condition",     value: "on-us",   unit: "payroll / treasury retained",         context: "primacy defended" },
      { kind: "stakes", label: "Stakes (est.)", value: "+$9M",    unit: "NII retained / yr · est. range",      context: "lowest rate given" },
    ],
    recommended: { star: false, name: "Relationship rate" },
    ctaLabel: "Open the Decision Loop →", championHypothesis: "H-SMB-RATE-2026-03-04",
  },
  {
    id: "C", status: { label: "Adjacent scenario", tone: "violet", sub: "discipline" },
    title: "Avoid overpaying",
    statement: {
      who: "~7,400 low-elasticity accounts modeled to stay without any offer.",
      what: "No rate offer — the no-overpay rule suppresses repricing on the will-stay segment.",
      why: "An offer here is pure margin given away; the discipline of not paying is where the NII is won.",
    },
    kpis: [
      { kind: "scale",  label: "Scope",         value: "7,400",   unit: "will-stay accounts",                  context: "low elasticity" },
      { kind: "gate",   label: "Action",        value: "none",    unit: "no offer by design",                  context: "margin protected" },
      { kind: "stakes", label: "Stakes (est.)", value: "~$6M",    unit: "interest expense avoided / yr",       context: "cost not spent" },
    ],
    recommended: { star: false, name: "Avoid overpaying" },
    ctaLabel: "Open the Decision Loop →", championHypothesis: "H-SMB-RATE-2026-03-04",
  },
];

/* ---- Drivers shown on the Analyze page (the "why this surfaced" reasons,
   each with a mini-chart) — the triggers + the deposit book at risk. ---- */
export const SMBRATE_DRIVERS = [
  { n: "01", t: "Recurring flows leaving", pct: 18700, unit: "accounts",
    d: "Payroll and vendor ACH starting to route to a competitor — the earliest, most reliable outflow signal.", chart: "trigger-bars" },
  { n: "02", t: "Balance velocity declining", pct: 15900, unit: "accounts",
    d: "Transaction count and on-us fee usage falling — engagement thinning before the balance moves.", chart: "trigger-bars" },
  { n: "03", t: "Idle balance + partial outflow", pct: 13400, unit: "accounts",
    d: "Large idle balances with partial pulls — the classic rate-shopping profile: parking cash, testing the door.", chart: "trigger-bars" },
  { n: "04", t: "Debt servicing moving off-us", pct: 6400, unit: "accounts",
    d: "Loan/line servicing shifting to the competitor that likely also took the deposit.", chart: "trigger-bars" },
];

/* Rate-tier mix of the at-risk book (drives the repricing baseline). */
export const SMBRATE_RATE_TIERS = [
  { p: "Legacy low-rate", pct: 48 },
  { p: "Standard", pct: 37 },
  { p: "Already-negotiated high-rate", pct: 15 },
];

/* ---- Numerical calibration anchors for the simulate model. Field names mirror
   LIQUIDITY_CALIBRATION so simulateOutcomes() forks mechanically; semantics:
     - "retainedDepositsAnnualM" = NII retained (annual)
     - "runoff" = deposit outflow (BAU vs with policy)
     - offerCeilingBps = the rate uplift (bps) lever ---- */
export const SMBRATE_CALIBRATION = {
  cohortTotal:            41200,
  atRiskBalancesB:          3.4,
  niiExposureM:              54,    // NII at risk on $3.4B
  blendedRatePaidPct:      1.10,
  eligibleAfterGate:      41200,
  highBalanceN:            7300,
  midBalanceN:            12600,
  anchorN:                 9100,
  balancesUnderTestM:      3400,    // $3.4B
  runoffBau:              0.440,    // 44% leaves on rate if nothing is done
  runoffWithPolicy:       0.235,    // 23.5% leaves with minimum-effective reprice
  runoffReductionPp:      0.205,
  retainedDepositsAnnualM:   41,    // $41M NII retained at +38 bps default
  competitorMatchBps:        95,    // blanket-match comparison
  vsMatchM:                  13,    // +$13M more NII than a blanket match (default)
  offerCostM:             9.900,    // margin given at +38 bps on retained
  spreadProtectedK:         612,
  netAnnualisedK:         31100,    // net benefit at defaults ($31.1M)
  treatmentN:             37080,    // 90%
  controlN:                4120,    // 10%
  complaintsBaseline:        40,
  complaintsDelta:           55,
  udaapMargin:             0.95,    // pricing-consistency / fairness margin
  udaapFloor:              0.85,
  stickinessThreshold:     0.55,
  overpayRate:                0,    // % repriced that would have stayed (no-overpay holds at 0)
};

/* ---- emergent micro-segments (the B2B addition to the results) ---- */
export const SMBRATE_SEGMENT_COLUMNS = [
  { id: "product", label: "Recommended move" },
  { id: "rate", label: "Rate offered" },
  { id: "channel", label: "Channel" },
  { id: "conv", label: "NII retained vs. do-nothing" },
  { id: "attach", label: "Net NII benefit" },
];
export const SMBRATE_MICROSEGMENTS = [
  { id: "highbal", name: "High-balance, rate-driven", n: 7300, tone: "go",
    signals: "Large idle balance · rate-shopping · acquirer intact",
    product: "Minimum-effective reprice", rate: "+55 bps", channel: "Primary banker",
    conv: "+$18M", attach: "High",
    need: "Large, genuinely rate-sensitive balances — model the lowest rate that holds them.",
    offer: "Banker-negotiated minimum-effective rate, capped under the ceiling.",
    cost: "Margin given at +55 bps; net-positive against the exposure slice.",
    confidence: "$18M retained ± $1.6M (holdout-backed)" },
  { id: "midbal", name: "Mid-balance, sensitive", n: 12600, tone: "go",
    signals: "Recurring flows down · velocity declining",
    product: "Targeted digital rate offer", rate: "+35 bps", channel: "In-app",
    conv: "+$14M", attach: "Medium",
    need: "Sensitive but smaller — a scaled digital offer at a modest uplift retains them cheaply.",
    offer: "In-app rate offer at +35 bps, no banker cost.",
    cost: "Low — digital delivery, modest margin.",
    confidence: "$14M retained ± $1.3M (holdout-backed)" },
  { id: "anchor", name: "Relationship-anchorable", n: 9100, tone: "go",
    signals: "Multi-product · partial outflow · payroll on-us",
    product: "Relationship-rate (payroll/treasury on-us)", rate: "+25 bps", channel: "RM + app",
    conv: "+$9M", attach: "High — re-bundles too",
    need: "Multi-product accounts retained more cheaply by anchoring the relationship than matching rate.",
    offer: "Better rate conditional on keeping payroll / treasury on-us — defends NII and primacy.",
    cost: "Lowest rate given; re-bundle upside on top.",
    confidence: "$9M retained ± $0.9M (holdout-backed)" },
  { id: "willstay", name: "Will stay anyway", n: 7400, tone: "hold",
    signals: "Low elasticity · sticky operating account",
    product: "No reprice — no-overpay rule", rate: "—", channel: "—",
    conv: "~0 saved · margin protected", attach: "Highest — cost avoided",
    need: "Modeled to stay without a reprice; an offer here is pure margin given away.",
    offer: "No rate offer — repricing would cost ~$6M/yr in unnecessary interest expense.",
    cost: "$0 — the discipline of not paying is where NII is won.",
    confidence: "Suppressed by the no-overpay rule." },
  { id: "gone", name: "Already gone / below floor", n: 4800, tone: "blocked",
    signals: "Account migrated · or reprice breaches margin floor",
    product: "No action", rate: "—", channel: "—",
    conv: "~0", attach: "Guardrail-blocked",
    need: "Either already migrated or a retaining rate would breach the margin floor.",
    offer: "No action — the margin floor blocks any profitable offer.",
    cost: "$0 — keeping these would be NII-negative.",
    confidence: "Blocked by the margin-floor guardrail." },
];

export default SMBRATE_CONFIG;
