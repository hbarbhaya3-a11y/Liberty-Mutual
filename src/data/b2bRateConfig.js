/* ============================================================================
   B2B · Deposit Retention via Rate — "Defend the operating deposit at the
   lowest rate that works"

   Second B2B (SMB) use case. Same six-object journey + schema as b2bGrowthConfig;
   scoped to the operating-deposit relationship, with the intervention being
   interest-rate repricing. Reuses the shared B2B views (config-driven).

   Signature insight: TwinX finds the MINIMUM EFFECTIVE RATE per micro-segment —
   saving the genuinely rate-sensitive balances, declining to overpay the ones
   that would stay, and refusing the ones below the margin floor.
   ========================================================================= */

export const B2B_RATE_CONFIG = {
  theme: "smbrate",
  kind: "b2b",
  badge: "DEPOSIT RISK",
  segment: "B2B · SMB",
  accent: "#ff6b6b",
  name: "Rate-sensitive operating balances at risk of attrition",
  hypothesisId: "H-SMB-RATE-2026-03-04",
  hypothesisTitle: "Minimum-effective-rate",

  // ---- SCREEN 0 · Cockpit risk card ----
  card: {
    tag: "DEPOSIT RISK · Rate-sensitive operating balances at risk of attrition",
    cohort: 41200,
    cohortLine: "41,200 SMB deposit accounts showing early outflow + rate-shopping signals",
    value: "~$3.4B operating deposits at risk · blended rate 1.10% · ~$54M NII exposure",
    trend: "+9% vs last month",
    offUs: 0,
    offUsLine: "0% in business distress — healthy balances being courted away on rate",
  },

  // ---- SCREEN 1 · Panel A — triggers (outflow + rate-shopping, distress absent) ----
  triggers: [
    { id: "recurringdown", label: "Decrease in recurring cost — payroll / vendor flows leaving", plain: "recurring flows starting to leave the account", count: 18700 },
    { id: "velocitydown", label: "Declining balance velocity & on-us usage", plain: "fewer transactions and fee payments on-us", count: 15900 },
    { id: "idle", label: "Inefficient cash management — large idle balances + partial outflows", plain: "classic rate-shopping: parking cash, testing the door", count: 13400, urgency: true },
    { id: "debtout", label: "Decrease in debt repayment on-us", plain: "servicing moving to the competitor who likely took the deposit", count: 6400 },
  ],
  // exclusion chips — must be ABSENT (keeps it "leaving on rate", not "leaving because failing")
  exclusions: ["Cash-flow stress", "Business slowdown", "Business attrition"],

  // ---- SCREEN 1 · Panel B — the deposit book at risk ----
  cohort: {
    count: 41200,
    summary: [
      { k: "Balances at risk", v: "$3.4B" },
      { k: "Blended rate paid", v: "1.10%" },
      { k: "Avg account", v: "$82K" },
      { k: "Avg tenure", v: "6.1 yrs" },
    ],
    // here "holdings" carries the rate-tier mix (re-used by the same bar UI)
    holdingsLabel: "Rate-tier mix",
    holdings: [
      { p: "Legacy low-rate", pct: 48 },
      { p: "Standard", pct: 37 },
      { p: "Already-negotiated high-rate", pct: 15 },
    ],
    read: "A large slice is still on low legacy rates — the question is which of those will actually leave if not repriced.",
  },

  // ---- SCREEN 1 · Panel C — hypotheses ----
  hypotheses: [
    { id: "triage", name: "Rate-sensitivity triage", star: false,
      desc: "Only a subset is genuinely rate-driven; identify who will leave for rate vs. who stays regardless, and reprice only the former." },
    { id: "mineffective", name: "Minimum-effective-rate", star: true,
      desc: "For the truly at-risk, find the smallest rate increase that retains the balance — vs. matching the competitor's headline rate." },
    { id: "rebundle", name: "Reprice vs. re-bundle", star: false,
      desc: "Test whether a rate move, or anchoring with a sweep / treasury product at a blended rate, retains more NII per dollar of margin given." },
  ],

  // ---- SCREEN 2 · Configuration (typed sections) ----
  configSections: [
    { id: "objective", type: "single", label: "Objective", help: "the optimization target",
      options: [
        { id: "nii", label: "Maximize NII retained (net of repricing cost)", default: true },
        { id: "balances", label: "Maximize balances retained" },
        { id: "minrate", label: "Minimize rate paid" },
        { id: "rar", label: "Maximize risk-adjusted NII" },
      ] },
    { id: "strategy", type: "multi", label: "Repricing strategy — the intervention", help: "select to compare",
      options: [
        { id: "mineffective", label: "Minimum-effective-rate (lowest rate that retains, per segment)", default: true },
        { id: "match", label: "Match competitor headline rate", default: false },
        { id: "tiers", label: "Fixed uplift tiers (+25 / +50 / +75 bps)", default: false },
        { id: "relationship", label: "Relationship-rate (better rate if payroll / treasury stays on-us)", default: true },
        { id: "hold", label: "Hold at current rate — the counterfactual", default: false },
      ] },
    { id: "ceiling", type: "slider", label: "Rate ceiling", help: "cap the max rate the engine may offer",
      min: 2.5, max: 4.5, step: 0.25, default: 3.75, unit: "%" },
    { id: "term", type: "toggle-rows", label: "Term option", help: "",
      rows: [
        { id: "term", a: "Rate locked for a commitment period", b: "Standard (no lock)", default: "b" },
      ] },
    { id: "channels", type: "multi", label: "Channels", help: "per-segment assignment allowed",
      options: [
        { id: "banker", label: "Primary banker — negotiated, for large balances", default: true },
        { id: "inapp", label: "In-app / digital rate offer — low cost, scaled", default: true },
        { id: "rmcall", label: "Proactive RM call", default: true },
      ] },
    { id: "kpis", type: "multi", label: "KPIs to simulate", help: "what's reported",
      options: [
        { id: "nii", label: "NII retained vs. do-nothing", default: true },
        { id: "balances", label: "Balances retained", default: true },
        { id: "margin", label: "Rate paid / margin given up", default: true },
        { id: "netnii", label: "Net NII benefit (retained − incremental interest expense)", default: true },
        { id: "efficiency", label: "Repricing efficiency (NII retained per bp given)", default: false },
        { id: "overpay", label: "Over-pay rate (% repriced that would have stayed anyway)", default: false },
      ] },
    { id: "guardrails", type: "checklist", label: "Guardrails", help: "hard constraints the simulation must honor",
      items: [
        "Rate ceiling — hard cap",
        "Margin floor — don't reprice into negative spread",
        "No-overpay rule — suppress offers to accounts modeled to stay anyway",
        "Fairness consistency · contact-frequency cap",
      ] },
  ],

  // ---- SCREEN 3 · cohort headline (min-effective vs competitor-match) ----
  headline: {
    lead: "Minimum-effective-rate retains $2.6B of $3.4B at risk and $41M of $54M NII",
    metricFrom: "+95 bps",
    metricTo: "+38 bps",
    metricNote: "blended rate to retain — vs. matching the competitor",
    points: [
      { v: "+$13M", l: "more NII retained / yr than a blanket rate match" },
      { v: "$2.6B", l: "balances retained" },
      { v: "green", l: "all guardrails" },
    ],
  },

  // ---- SCREEN 3 · emergent micro-segments (rate-sensitivity × value) ----
  segmentColumns: [
    { id: "product", label: "Recommended move" },
    { id: "rate", label: "Rate offered" },
    { id: "channel", label: "Channel" },
    { id: "conv", label: "NII retained vs. do-nothing" },
    { id: "attach", label: "Net NII benefit" },
  ],
  microSegments: [
    { id: "highbal", name: "High-balance, rate-driven", n: 7300, tone: "go",
      signals: "Large idle balance · rate-shopping · acquirer intact",
      product: "Minimum-effective reprice", rate: "+55 bps", channel: "Primary banker",
      conv: "+$18M", attach: "High",
      need: "Large, genuinely rate-sensitive balances — model the lowest rate that holds them.",
      offer: "Banker-negotiated minimum-effective rate, capped under the ceiling.",
      cost: "Margin given up at +55 bps; net positive against a $54M exposure slice.",
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
      signals: "Multi-product, partial outflow",
      product: "Relationship-rate (conditional on payroll / treasury on-us)", rate: "+25 bps", channel: "RM + app",
      conv: "+$9M", attach: "High — re-bundles too",
      need: "Multi-product accounts retained more cheaply by anchoring the relationship than by matching rate.",
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
  ],

  // ---- governance / activation ----
  governance: {
    holdout: 10,
    trace: [
      "Rate ceiling honored — no offer above the cap",
      "Margin floor honored — no reprice into negative spread",
      "No-overpay rule applied — will-stay segment gets no offer",
      "Fairness consistency · contact-frequency cap",
    ],
    note: "On approval, segments route to channels; the “will stay” and “already gone” segments get no rate offer by design; the 10% holdout proves true NII lift.",
  },
};

export default B2B_RATE_CONFIG;
