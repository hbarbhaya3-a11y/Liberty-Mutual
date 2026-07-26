// All theme + signal + category data, ported from index.html.
// One source of truth so every page imports from here.

export const OBJ = {
  acq: { lab: "Acquisition", col: "#5b9dff", fill1: "rgba(91,157,255,.13)", fill2: "rgba(91,157,255,.03)", bd: "rgba(91,157,255,.30)", glow: "rgba(91,157,255,.5)" },
  deep: { lab: "Deepening", col: "#b794f6", fill1: "rgba(183,148,246,.13)", fill2: "rgba(183,148,246,.03)", bd: "rgba(183,148,246,.30)", glow: "rgba(183,148,246,.5)" },
  ret: { lab: "Retention", col: "#ffb15a", fill1: "rgba(255,177,90,.13)", fill2: "rgba(255,177,90,.03)", bd: "rgba(255,177,90,.30)", glow: "rgba(255,177,90,.5)" },
};

export const STLAB = {
  emerging: "Emerging",
  strengthening: "Strengthening",
  confirmed: "Confirmed",
  spiking: "Spiking",
};

export const INTERNAL_CATS = [
  { n: "Money Movement", c: 96, col: "#5b9dff" },
  { n: "Channel & Engage", c: 84, col: "#4fd1c5" },
  { n: "Campaign & Spend", c: 71, col: "#b794f6" },
  { n: "Competitive & Rate", c: 58, col: "#ff6b6b" },
  { n: "Acquisition Funnel", c: 52, col: "#63b3ed" },
  { n: "Life-Event", c: 43, col: "#9f7aea" },
  { n: "Attrition & Service", c: 38, col: "#ffb15a" },
  { n: "Brand & Macro", c: 58, col: "#48bb78" },
];

export const INTERNAL_THEMES = [
  { id: "retention", type: "Deposit Retention", name: "Mass affluent · deposit drift", obj: "ret", status: "confirmed", valueM: 2100, vq: "deposits under observation", count: 241, vel: 7, conf: 87, urg: 0.80, desc: "Balance decline, outbound ACH acceleration and weakened operating behaviour — three joint signals marking a cohort whose deposit primacy is eroding before it shops for rate.", macro: "Rate-cut cycle + open-banking switching friction falling", pinned: true, pinOrder: 0 },
  { id: "branch", type: "Acquisition Window", name: "Competitor branch exits", obj: "acq", status: "spiking", valueM: 1900, vq: "inflow opportunity", count: 134, vel: 8, conf: 81, urg: 1.0, desc: "Rival closures open a short capture window across four markets — app-starts already surging in affected ZIPs.", macro: "Regional bank consolidation wave" },
  { id: "gig", type: "New Segment Emerging", name: "Gig & creator-economy depositors", obj: "deep", status: "spiking", valueM: 140, vq: "deepening opportunity", count: 312, vel: 9, conf: 88, urg: 0.90, desc: "A coherent cohort of irregular-cadence, multi-platform inflows is forming outside existing segment definitions — high velocity, currently unowned.", macro: "Fintech deposit disintermediation", pinned: true, pinOrder: 1 },
  { id: "liquidity", type: "Liquidity Activation", name: "Idle-cash liquidity activation", obj: "deep", status: "strengthening", valueM: 46, vq: "deepening opportunity", count: 388, vel: 6, conf: 84, urg: 0.60, desc: "Idle cash sitting at near-zero yield while high-yield competitors pull — route it into the right product at the minimum rate that holds it, before it leaves.", macro: "Falling-rate cycle · high-yield competition", pinned: true, pinOrder: 2 },
  { id: "wealth", type: "Wealth Attach · White-Space", name: "Mass-affluent banking, investing elsewhere", obj: "deep", status: "strengthening", valueM: 5.9, vq: "est. annual wealth-attach value pool", count: 184, vel: 5, conf: 83, urg: 0.55, desc: "18,400 households bank with us but hold ~$1.1B of investable assets outside — surplus balances, retirement-content engagement and transfers leaving for outside platforms mark a window to start the wealth conversation before the money commits elsewhere.", macro: "Wealth-platform disintermediation · retirement demographic wave", pinned: true, pinOrder: 3 },
  { id: "smbgrowth", type: "Growth Signal · Small Commercial", name: "Small businesses entering an expansion cycle", obj: "deep", status: "spiking", valueM: 46, vq: "incremental NWP opportunity", count: 384, vel: 8, conf: 82, urg: 0.75, desc: "38,400 small businesses showing growth-and-expansion signals — 61% placing the new or expanded coverage off-us with an insurtech or competitor. A short window to win the account back and bundle the lines, held to loss ratio.", macro: "SMB expansion cycle · insurtech (Next / Hiscox / biBERK) competition", b2b: true, pinned: true, pinOrder: 4 },
  { id: "smbrate", type: "Deposit Risk · B2B", name: "Rate-sensitive SMB operating balances", obj: "ret", status: "spiking", valueM: 54, vq: "NII exposure", count: 412, vel: 7, conf: 85, urg: 0.80, desc: "41,200 SMB deposit accounts showing early outflow and rate-shopping — $3.4B operating deposits being courted away on rate, with zero business distress. Defend at the lowest rate that works.", macro: "Rate-cut cycle · competitor HY deposit promos", b2b: true, pinned: true, pinOrder: 5 },
  { id: "newcomer", type: "New Segment Emerging", name: "New-to-country households", obj: "acq", status: "strengthening", valueM: 640, vq: "inflow opportunity", count: 121, vel: 4, conf: 67, urg: 0.45, desc: "Thin-file onboarding patterns and remittance corridors mark an under-served, growing inflow.", macro: "Immigration & remittance-corridor growth" },
  { id: "limits", type: "Money-Movement Limits", name: "Zelle / ACH ceilings constraining SMB", obj: "deep", status: "emerging", valueM: 210, vq: "deepening opportunity", count: 96, vel: 3, conf: 58, urg: 0.35, desc: "Repeated limit-hit events on growing small-business twins signal a need for higher movement tiers.", macro: "FedNow / real-time-payments adoption" },
  { id: "home", type: "Life-Event Surge", name: "Home-buying intent cluster", obj: "deep", status: "strengthening", valueM: 96, vq: "CLV opportunity", count: 158, vel: 5, conf: 74, urg: 0.55, desc: "Real-estate-activity signals concentrate in two metros — mortgage and wealth intent.", macro: "Mortgage-rate dip + housing turnover" },
  { id: "sweep", type: "New Product Opportunity", name: "Automated sweep-to-yield demand", obj: "deep", status: "strengthening", valueM: 72, vq: "CLV opportunity", count: 184, vel: 4, conf: 71, urg: 0.40, desc: "Idle-balance behaviour plus competitor-yield queries point to latent demand for an auto-sweep product.", macro: "Falling-rate yield competition" },
  { id: "mobile", type: "Service Degradation", name: "Mobile check-deposit friction", obj: "ret", status: "spiking", valueM: 88, vq: "attrition exposure", count: 147, vel: 9, conf: 84, urg: 0.85, desc: "Failed-deposit retries and complaint spikes cluster on a single app flow.", macro: "Rising digital-service expectations" },
  { id: "wallet", type: "Competitive Displacement", name: "Top-of-wallet card erosion", obj: "ret", status: "confirmed", valueM: 64, vq: "revenue at risk", count: 203, vel: 5, conf: 86, urg: 0.50, desc: "Spend-velocity decline and category drift to a rival card across the core base.", macro: "BNPL & rewards-led card competition" },
  { id: "elder", type: "Fraud Tighten", name: "Elder financial exploitation watch", obj: "ret", status: "spiking", valueM: 0.5, vq: "attrition exposure", count: 5567, vel: 2, conf: 84, urg: 0.85, desc: "First-ever high-value wires to novel beneficiaries matching FinCEN BEC/EFE language, concentrated in long-tenured low-velocity retirees.", macro: "Elder-fraud / EFE typologies" },

  /* ── Roadmap use-case tiles (preview / "Coming soon" — not yet enterable).
     Rendered as cockpit tiles alongside the live 4 + 2 SMB; together they form
     the fixed 14-usecase set shown in BOTH radar modes (see USECASE_THEMES). */
  { id: "lifeevent",   type: "Life-Event Acquisition", name: "New households at switch moment",        obj: "acq", status: "spiking",       valueM: 12.2, vq: "est. annual acquisition value pool",         count: 112, vel: 8, conf: 64, urg: 0.85, desc: "Relocation, new-baby, marriage/cohabitation and new-graduate signals mark households whose banking setup is being reshaped — pursue them before the new primary relationship forms elsewhere.", macro: "Household-formation & relocation wave" },
  { id: "moneymoment", type: "Money-Moment Acquisition", name: "Primary attach at financial inflection", obj: "acq", status: "spiking",       valueM: 12.4, vq: "est. annual primary-attach value pool",      count: 98,  vel: 7, conf: 66, urg: 0.80, desc: "Mortgage shopping, first retirement deposits and large one-time inflows identify prospects at high-intent money moments — attach the primary relationship when the money is already moving.", macro: "Mortgage & rollover money-in-motion" },
  { id: "cardgrowth",  type: "Card Growth",            name: "Premium-ready card spend",               obj: "deep", status: "strengthening", valueM: 6.1,  vq: "est. annual card-growth value pool",        count: 156, vel: 5, conf: 73, urg: 0.50, desc: "Competitor-card payments, premium-eligible spend and rising spend velocity show card share moving off-us — decide whether to capture spend, upgrade the card or size rewards to the margin at stake.", macro: "Card-share shift · premium-rewards competition" },
  { id: "lending",     type: "Lending Activation",     name: "Borrowing need emerging",               obj: "deep", status: "strengthening", valueM: 9.3,  vq: "est. annual lending value pool",            count: 134, vel: 4, conf: 70, urg: 0.55, desc: "Home-equity build, costly external debt and auto-lease maturity signal a near-term borrowing need — offer the loan the customer is most likely to take and attach protection where it adds value.", macro: "Home-equity build · external-debt refinance" },
  { id: "primaryconv", type: "Primary Conversion",     name: "Mono-line customers ready to deepen",    obj: "deep", status: "confirmed",     valueM: 6.3,  vq: "est. annual primary-conversion value pool",  count: 178, vel: 5, conf: 80, urg: 0.55, desc: "New payroll signals, card-only relationships and small-business inflows reveal customers already behaving like future primaries — convert them at the income moment before the relationship stays partial.", macro: "Payroll-switch & card-only deepening" },
  { id: "relsave",     type: "Relationship Save",      name: "Distress and disengagement drift",       obj: "ret", status: "confirmed",     valueM: 9.3,  vq: "est. annual relationship-save value pool",   count: 209, vel: 6, conf: 82, urg: 0.70, desc: "Service friction, repeat overdraft/NSF, dormancy and branch disruption mark relationships sliding into distress — intervene with the lowest-cost save action before the customer disappears.", macro: "Service-friction & overdraft distress" },
  { id: "affluentret", type: "Affluent Retention",     name: "High-value relationship drift",          obj: "ret", status: "strengthening", valueM: 3.6,  vq: "est. annual affluent-defense value pool",    count: 121, vel: 5, conf: 78, urg: 0.60, desc: "Balance decline, engagement drop-off and adviser-contact lapse identify affluent households at risk — prioritize by value-at-risk before high-unit-value relationships leave.", macro: "Affluent attrition · adviser-contact lapse" },
  { id: "cardret",     type: "Card Retention",         name: "Card spend shifting away",               obj: "ret", status: "strengthening", valueM: 3.0,  vq: "est. annual card-defense value pool",       count: 147, vel: 6, conf: 76, urg: 0.55, desc: "Spend decline, balance shift to a competitor card and reward-redemption dormancy show card relationships moving off-us — size the save offer to the margin actually at risk.", macro: "Competitor-card spend migration" },
];

/* The fixed set of 14 use-case tiles shown in BOTH radar modes (Inside-Out and
   Outside-In). Switching modes no longer changes the tiles — only the left-hand
   signal stream / category ticker / forming-theme feed swaps (those stay per
   mode). Order: the 4 live use cases + 2 SMB (kept from before), then the 8
   roadmap previews. */
export const USECASE_TILE_IDS = [
  "retention", "gig", "liquidity", "wealth", "smbgrowth", "smbrate",
  "lifeevent", "moneymoment", "cardgrowth", "lending", "primaryconv", "relsave", "affluentret", "cardret",
];
export const USECASE_THEMES = USECASE_TILE_IDS
  .map((id) => INTERNAL_THEMES.find((t) => t.id === id))
  .filter(Boolean);

export const INTERNAL_SIGS = [
  ["#5b9dff", "Idle cash >$25k · 60d dormant balance", "core-dda", "liquidity"],
  ["#4fd1c5", "In-app search: 7-month CD rates", "app-telemetry", "liquidity"],
  ["#9f7aea", "External transfer → brokerage · $18k", "money-movement", "wealth"],
  ["#b794f6", "In-app: retirement / IRA calculator opened", "app-telemetry", "wealth"],
  ["#9f7aea", "Surplus balance sustained 90d · no wealth product", "core-dda", "wealth"],
  ["#4fd1c5", "New coverage bound off-us · insurtech placement", "submission-feed", "smbgrowth"],
  ["#5b9dff", "New location + payroll growth · WC/GL exposure up", "exposure-detail", "smbgrowth"],
  ["#ff6b6b", "SMB payroll flow leaving · on-us velocity −12%", "core-dda", "smbrate"],
  ["#ffb15a", "Large idle balance + partial outflow · rate-shopping", "treasury-monitor", "smbrate"],
  ["#5b9dff", "Multi-platform inflow · Uber + Stripe + Etsy", "payments-rail", "gig"],
  ["#63b3ed", "Thin-file app-start · mobile-first", "onboarding", "gig"],
  ["#5b9dff", "Idle balance >$25k · 90d dormant cash", "core-dda", "sweep"],
  ["#4fd1c5", "In-app search: high-yield savings", "app-telemetry", "sweep"],
  ["#ffb15a", "Balance decline −14% · mass-affluent cohort", "deposit-ledger", "retention"],
  ["#ffb15a", "Outbound ACH spike +21% · 90d rolling", "ach-monitor", "retention"],
  ["#ff6b6b", "Attrition decile elevated · scoring engine", "risk-model", "retention"],
  ["#4fd1c5", "DDA activity −12% · operating-balance erosion", "core-dda", "retention"],
  ["#ffb15a", "Mobile deposit failed · 3rd retry", "mobile-sdk", "mobile"],
  ["#ffb15a", "Complaint: check will not scan", "care-nlp", "mobile"],
  ["#5b9dff", "Zelle limit hit · SMB twin", "movement-engine", "limits"],
  ["#5b9dff", "ACH ceiling reached · 2nd this week", "movement-engine", "limits"],
  ["#9f7aea", "Remittance corridor established · MX", "payments-rail", "newcomer"],
  ["#63b3ed", "Newcomer onboarding · no SSN history", "onboarding", "newcomer"],
  ["#4fd1c5", "Card spend velocity -22% · 30d", "card-ledger", "wallet"],
  ["#5b9dff", "Category drift: groceries to rival card", "spend-graph", "wallet"],
  ["#9f7aea", "Real-estate activity detected · metro A", "intent-model", "home"],
  ["#9f7aea", "Mortgage pre-qual signal · affluent", "intent-model", "home"],
  ["#ff6b6b", "Rival branch closure filed · 4 markets", "public-filings", "branch"],
  ["#63b3ed", "App-start surge · dislocation ZIP", "onboarding", "branch"],
];

export const INTERNAL_FORMING = [
  { nm: "Direct-deposit decay ahead of primacy loss", em: "payroll-inflow decline detected 60 days before rate-shopping in the operating-decliner sub-segment", obj: "ret" },
  { nm: "Subscription-stacking fatigue", em: "recurring-debit clustering across the under-35 base", obj: "deep" },
  { nm: "Early payroll-advance demand", em: "pre-payday balance dips meeting advance-app inflows", obj: "acq" },
  { nm: "Branch-to-digital migration", em: "foot-traffic decline meeting app-adoption rise", obj: "ret" },
  { nm: "Advice-readiness clustering in the mass-affluent tenure band", em: "retirement-content engagement meeting surplus balances and first external-investment transfers, ahead of any wealth offer", obj: "deep" },
];

export const MACRO_CATS = [
  { n: "Monetary & Rates", c: 44, col: "#5b9dff" },
  { n: "Macro-Economic", c: 38, col: "#4fd1c5" },
  { n: "Regulatory", c: 29, col: "#ff6b6b" },
  { n: "Competitive Moves", c: 41, col: "#ffb15a" },
  { n: "Industry & Fintech", c: 35, col: "#b794f6" },
  { n: "Capital Markets", c: 31, col: "#63b3ed" },
  { n: "Consumer Sentiment", c: 27, col: "#48bb78" },
  { n: "Geopolitical", c: 18, col: "#9f7aea" },
];

export const MACRO_THEMES = [
  { id: "fintech", type: "Industry Disruption", name: "Fintech deposit disintermediation", obj: "acq", status: "confirmed", valueM: 4100, vq: "deposit base contested", count: 286, vel: 7, conf: 89, urg: 0.80, desc: "Neobanks, brokerage sweeps and embedded finance are structurally pulling primary-bank deposits — counter-capture the switchers.", footprint: "Gig-depositor leakage + sweep demand" },
  { id: "consolidation", type: "Competitive Structural Shift", name: "Regional bank consolidation wave", obj: "acq", status: "spiking", valueM: 3400, vq: "capture opportunity", count: 198, vel: 8, conf: 83, urg: 1.0, desc: "A wave of regional-bank M&A and branch rationalisation opens customer, deposit and talent capture windows.", footprint: "Competitor branch-exit window theme" },
  { id: "ratecut", type: "Monetary Policy Shift", name: "Rate-cut cycle turning", obj: "ret", status: "spiking", valueM: 2900, vq: "NII / deposit exposure", count: 241, vel: 8, conf: 86, urg: 0.90, desc: "Forward curve and Fed guidance point to a turning rate cycle — deposit repricing and beta pressure ahead.", footprint: "Mass-affluent deposit-drift retention" },
  { id: "creditstress", type: "Macro-Economic Cycle", name: "Consumer credit stress rising", obj: "deep", status: "strengthening", valueM: 2200, vq: "credit exposure", count: 167, vel: 5, conf: 72, urg: 0.60, desc: "Rising card delinquency and widening credit spreads signal consumer-credit stress building across the base.", footprint: "Financial-health deepening cohorts" },
  { id: "openbank", type: "Regulatory Change", name: "1033 open-banking mandate", obj: "ret", status: "strengthening", valueM: 1800, vq: "switching exposure", count: 112, vel: 4, conf: 68, urg: 0.50, desc: "The 1033 open-banking rule accelerates data portability — switching friction falls sharply across the industry.", footprint: "Aggregator-login deposit-drift signals" },
  { id: "cfpb", type: "Regulatory Change", name: "CFPB fee-cap finalisation", obj: "ret", status: "confirmed", valueM: 1200, vq: "fee-revenue exposure", count: 143, vel: 4, conf: 90, urg: 0.65, desc: "Finalised overdraft and late-fee caps compress non-interest revenue — model the exposure and reprice now.", footprint: "Fee-sentiment attrition in book" },
  { id: "labor", type: "Macro-Economic Cycle", name: "Labour market cooling", obj: "acq", status: "emerging", valueM: 640, vq: "inflow sensitivity", count: 88, vel: 3, conf: 60, urg: 0.35, desc: "A cooling labour market and falling savings rate soften household deposit formation and payroll inflows.", footprint: "Softening new-money inflows" },
  { id: "fednow", type: "Payments Modernisation", name: "FedNow / real-time payments", obj: "deep", status: "strengthening", valueM: 380, vq: "treasury opportunity", count: 131, vel: 5, conf: 70, urg: 0.45, desc: "Real-time-payments adoption is reshaping money movement — a treasury and SMB product frontier.", footprint: "SMB Zelle/ACH limit pressure" },
  { id: "stablecoin", type: "Emerging Technology", name: "Tokenised deposits & stablecoins", obj: "deep", status: "emerging", valueM: 290, vq: "product frontier", count: 74, vel: 4, conf: 55, urg: 0.30, desc: "Tokenised-deposit and stablecoin settlement pilots mark an emerging payments and product frontier.", footprint: "Idle-balance sweep-to-yield demand" },
];

export const MACRO_SIGS = [
  ["#5b9dff", "Fed dot-plot signals two cuts in 2026", "fomc-feed", "ratecut"],
  ["#63b3ed", "2Y treasury yield -18bps this week", "rates-desk", "ratecut"],
  ["#5b9dff", "10Y treasury settles at 4.1%", "rates-desk", "ratecut"],
  ["#ff6b6b", "CFPB finalises $8 late-fee cap", "reg-tracker", "cfpb"],
  ["#ff6b6b", "1033 open-banking compliance date set", "reg-tracker", "openbank"],
  ["#ff6b6b", "OCC guidance on deposit concentration", "reg-tracker", "ratecut"],
  ["#ffb15a", "Regional bank merger announced", "mna-wire", "consolidation"],
  ["#ffb15a", "Rival to close 120 branches", "public-filings", "consolidation"],
  ["#b794f6", "Neobank crosses 10M deposit accounts", "industry-scan", "fintech"],
  ["#b794f6", "Brokerage sweep advertising 4.8% APY", "industry-scan", "fintech"],
  ["#b794f6", "Embedded-finance API adoption +40% YoY", "industry-scan", "fintech"],
  ["#b794f6", "FedNow volume +60% QoQ", "payments-index", "fednow"],
  ["#b794f6", "Stablecoin settlement pilot launches", "industry-scan", "stablecoin"],
  ["#4fd1c5", "Card delinquency 90+ days ticking up", "macro-feed", "creditstress"],
  ["#63b3ed", "Credit spreads widen 25bps", "capital-markets", "creditstress"],
  ["#4fd1c5", "Unemployment edges to 4.3%", "bls-feed", "labor"],
  ["#4fd1c5", "Personal savings rate falls to 3.2%", "macro-feed", "labor"],
  ["#48bb78", "Consumer-confidence index drops", "sentiment-index", "labor"],
  ["#48bb78", "Savings-intent survey softening", "sentiment-index", "ratecut"],
  ["#9f7aea", "Global funding-market stress flag", "systemic-monitor", "creditstress"],
];

export const MACRO_FORMING = [
  { nm: "Basel III endgame capital shift", em: "proposed RWA changes reshaping deposit economics", obj: "ret" },
  { nm: "Deposit-insurance reform debate", em: "post-regional-crisis policy signals building", obj: "ret" },
  { nm: "Real-time-payments fraud vector", em: "FedNow-linked scam patterns rising industry-wide", obj: "deep" },
  { nm: "AI-underwriting model scrutiny", em: "emerging model-governance guidance from regulators", obj: "deep" },
];

/* Every theme that exists anywhere — used to resolve signal-stream links even
   for themes that aren't rendered as tiles (the macro themes + retired internal
   ones still drive the per-mode signal feeds). */
export const ALL_THEMES = [...INTERNAL_THEMES, ...MACRO_THEMES];

export const MODES = {
  internal: {
    cats: INTERNAL_CATS,
    themes: USECASE_THEMES,
    sigs: INTERNAL_SIGS,
    forming: INTERNAL_FORMING,
    spm: 1284,
    spmSuffix: "internal + external",
    alwaysLead: "Always Listening · ",
    alwaysBold: "12 swarms",
    meterMode: "Inside-Out",
    meterSub: "signals · live 60s window",
    streamTitle: "Signal Stream",
    gt: "Emerging Themes",
    gd: "from our customer data · inside-out",
    linkLab: "Macro driver",
    linkIcon: "↘",
    linkField: "macro",
  },
  macro: {
    cats: MACRO_CATS,
    themes: USECASE_THEMES,
    sigs: MACRO_SIGS,
    forming: MACRO_FORMING,
    spm: 340,
    spmSuffix: "external sources only",
    alwaysLead: "Scanning · ",
    alwaysBold: "40+ sources",
    meterMode: "Outside-In",
    meterSub: "external signals · live 60s window",
    streamTitle: "Macro Signal Stream",
    gt: "Emerging Themes",
    gd: "from the outside world · outside-in",
    linkLab: "In your book",
    linkIcon: "↗",
    linkField: "footprint",
  },
};

export const fmtUSD = (m) => {
  if (m >= 1000) return "$" + (m / 1000).toFixed(m % 1000 === 0 ? 0 : 1) + "B";
  return "$" + m + "M";
};

const MAXSQRT = Math.sqrt(4100);
export const relevance = (t) =>
  0.45 * (Math.sqrt(t.valueM) / MAXSQRT) +
  0.22 * (t.vel / 10) +
  0.18 * (t.conf / 100) +
  0.15 * t.urg;

export const area = (t, metric) => {
  if (metric === "value") return Math.max(t.valueM, 50);
  if (metric === "velocity") return Math.pow(t.vel, 1.6) + 2;
  return Math.max(relevance(t), 0.18);
};
