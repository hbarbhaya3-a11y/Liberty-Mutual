/* ============================================================================
   B2B · Growth / Re-bundle Journey — "Detect the growing SMB, win the re-bundle"

   First of the two B2B (SMB) use cases. Drives the shared, config-driven B2B
   flow: B2BClusterView (Analyze) → Configure → Run → MicroSegmentResults → Stage.
   Sibling use case (b2bRateConfig.js) reuses the SAME views with a parallel
   schema, so the only structural variation lives in `configSections` (typed).

   SCHEMA (shared by both B2B configs):
     theme, kind:"b2b", badge, segment, accent, name, hypothesisId
     card{...}            → Cockpit opportunity/risk card
     triggers[]           → SCREEN 1 Panel A (plain-language, live counts)
     cohort{holdings[]}   → SCREEN 1 Panel B (what they hold today + read)
     hypotheses[]         → SCREEN 1 Panel C (pick one; one starred)
     configSections[]     → SCREEN 2 (typed: single|multi|toggle-rows|slider|checklist)
     headline{}           → SCREEN 3 cohort headline (vs base)
     microSegments[]      → SCREEN 3 emergent segments (incl. a hold + blocked row)
     governance{}         → activation trace
   ========================================================================= */

export const B2B_GROWTH_CONFIG = {
  theme: "smbgrowth",
  kind: "b2b",
  badge: "GROWTH SIGNAL",
  segment: "B2B · SMB",
  accent: "#4fd1c5",
  name: "Small businesses entering an expansion cycle",
  hypothesisId: "H-SMB-GROWTH-2026-03-04",
  hypothesisTitle: "Re-bundle the off-us flows",

  // ---- SCREEN 0 · Cockpit opportunity card ----
  card: {
    tag: "GROWTH SIGNAL · Small businesses entering an expansion cycle",
    cohort: 38400,
    cohortLine: "38,400 SMBs showing growth-and-financing signals this month",
    value: "~$2.1B financing need · ~$46M annual revenue opportunity",
    trend: "+12% vs last month",
    offUs: 61,
    offUsLine: "61% currently financing or processing off-us",
  },

  // ---- SCREEN 1 · Panel A — triggers ----
  triggers: [
    { id: "realestate", label: "Real-estate expansion / new-location activity", plain: "opening or expanding a site", count: 14100 },
    { id: "asset", label: "Major asset purchase / equipment-rental escalation", plain: "buying or leasing equipment", count: 11800 },
    { id: "recurring", label: "Increase in recurring cost — payroll, rent rising", plain: "scaling headcount / footprint", count: 19200 },
    { id: "cashflow", label: "Cash-flow surge / profitability boost", plain: "revenue accelerating", count: 9600 },
    { id: "offus", label: "New off-us small-biz card / merchant-acquirer change", plain: "financing the growth elsewhere", count: 23400, urgency: true },
  ],

  // ---- SCREEN 1 · Panel B — cohort & holdings ----
  cohort: {
    count: 38400,
    summary: [
      { k: "Median revenue", v: "~$1.4M" },
      { k: "Avg products / relationship", v: "1.7" },
      { k: "Off-us financing or processing", v: "61%" },
    ],
    holdings: [
      { p: "Checking", pct: 100 },
      { p: "Card processing (Elavon)", pct: 44 },
      { p: "Business credit card", pct: 29 },
      { p: "Lending / line of credit", pct: 11 },
      { p: "Payroll / Bill Pay", pct: 8 },
      { p: "Treasury / sweep", pct: 6 },
    ],
    read: "Deep deposit base, thin on credit, payments and software — a large white space for the re-bundle.",
  },

  // ---- SCREEN 1 · Panel C — hypotheses ----
  hypotheses: [
    { id: "new-product", name: "New-product readiness", star: false,
      desc: "These SMBs are ready for expansion financing — Business Line of Credit, equipment finance, SBA — they don't yet hold on-us." },
    { id: "rebundle", name: "Re-bundle the off-us flows", star: true,
      desc: "Win back the credit and payments leaving the relationship (business card, merchant services) before the competitor deepens. The bank's own data shows the relationship is actively leaking." },
    { id: "deepen", name: "Whole-relationship deepening", star: false,
      desc: "Lead with the highest-converting product, then attach the Business Essentials bundle (payments + Payroll + Bill Pay + Spend Management) around it." },
  ],

  // ---- SCREEN 2 · Configuration (typed sections) ----
  configSections: [
    { id: "objective", type: "single", label: "Objective", help: "the optimization target",
      options: [
        { id: "conv", label: "Increase conversion rate", default: true },
        { id: "rev", label: "Maximize incremental revenue" },
        { id: "primacy", label: "Maximize primacy / products-per-relationship" },
        { id: "rar", label: "Maximize risk-adjusted return" },
      ] },
    { id: "products", type: "multi", label: "Products to offer", help: "pre-checked from the hypothesis",
      options: [
        { id: "bloc", label: "Business Line of Credit / equipment finance", default: true },
        { id: "card", label: "Business credit card — win back the off-us card", default: true },
        { id: "merchant", label: "Merchant services (Elavon) for the new location", default: true },
        { id: "treasury", label: "Treasury / sweep", default: false },
        { id: "essentials", label: "Business Essentials bundle (checking + payments + Payroll + Bill Pay)", default: false },
      ] },
    { id: "offers", type: "toggle-rows", label: "Offers / packaging", help: "the form of the offer is itself a conversion lever",
      rows: [
        { id: "limit", a: "Pre-approved limit, terms up front", b: "“review your options” invite", default: "a" },
        { id: "price", a: "Bundled price", b: "à la carte", default: "a" },
        { id: "intro", a: "Intro pricing / fee waiver", b: "Standard pricing", default: "a" },
      ] },
    { id: "channels", type: "multi", label: "Channels", help: "TwinX can assign channel per micro-segment",
      options: [
        { id: "banker", label: "Primary banker / RM", default: true },
        { id: "inapp", label: "In-app pre-approval (digital)", default: true },
        { id: "email", label: "Outbound email + app follow-up", default: true },
        { id: "branch", label: "Branch", default: false },
      ] },
    { id: "kpis", type: "multi", label: "KPIs to simulate", help: "what's reported (optimize one, watch several)",
      options: [
        { id: "conv", label: "Cross-sell conversion rate", default: true },
        { id: "rev", label: "Incremental revenue (Year 1)", default: true },
        { id: "attach", label: "Downstream attach (next-product, 6–12 mo)", default: true },
        { id: "primacy", label: "Products-per-relationship / primacy lift", default: false },
        { id: "cost", label: "Cost to serve & risk-adjusted return", default: false },
      ] },
    { id: "guardrails", type: "checklist", label: "Guardrails", help: "hard constraints the simulation must honor",
      items: [
        "Credit-risk limit on pre-approved lines",
        "Price floor — don't buy conversion away",
        "Contact-frequency cap · fairness consistency",
      ] },
  ],

  // ---- SCREEN 3 · cohort headline (best configuration vs base) ----
  headline: {
    lead: "Best configuration lifts cross-sell conversion",
    metricFrom: "8.4%",
    metricTo: "19.1%",
    points: [
      { v: "+$31M", l: "incremental Yr-1 revenue" },
      { v: "+0.4", l: "products-per-relationship" },
      { v: "green", l: "all guardrails" },
    ],
  },

  // ---- SCREEN 3 · emergent micro-segments ----
  // unit columns: the per-segment KPIs; `tone` drives styling (go | hold | blocked)
  segmentColumns: [
    { id: "product", label: "Recommended lead product" },
    { id: "channel", label: "Channel" },
    { id: "conv", label: "Conv. (vs base)" },
    { id: "rev", label: "Incr. rev / acct" },
    { id: "attach", label: "Downstream attach" },
  ],
  microSegments: [
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
  ],

  // ---- governance / activation ----
  governance: {
    holdout: 10,
    trace: [
      "Credit-risk limit on pre-approved lines honored",
      "Price floor honored — no offer below the margin line",
      "Contact-frequency cap applied",
      "Fairness consistency — comparable SMBs, comparable offers",
    ],
    note: "On approval, each segment routes to its channel (banker NBA queues, in-app pre-approvals); the 10% holdout is untouched so lift is measurable.",
  },
};

export default B2B_GROWTH_CONFIG;
