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
  { n: "Shopping & Elasticity", c: 96, col: "#5b9dff" },
  { n: "Digital Engagement", c: 84, col: "#4fd1c5" },
  { n: "Claims Experience", c: 71, col: "#b794f6" },
  { n: "Competitive & Rate", c: 58, col: "#ff6b6b" },
  { n: "Quote & Bind Funnel", c: 52, col: "#63b3ed" },
  { n: "Life-Event", c: 43, col: "#9f7aea" },
  { n: "Bundle & Cross-Sell", c: 38, col: "#ffb15a" },
  { n: "Portfolio & CAT", c: 58, col: "#48bb78" },
];

export const INTERNAL_THEMES = [
  { id: "retention", type: "Auto Retention", name: "High-LTV auto · renewal shopping risk", obj: "ret", status: "confirmed", valueM: 908, vq: "NWP under observation", count: 241, vel: 7, conf: 87, urg: 0.80, desc: "Digital engagement drop, competitor quote-shopping and coverage-reduction requests — three joint signals marking high-LTV, claims-free auto customers whose renewal is at risk ~45 days before they shop for rate.", macro: "Record 57% auto shopping + Progressive/GEICO rate pressure", pinned: true, pinOrder: 0 },
  { id: "branch", type: "Acquisition Window", name: "Competitor rate-hike exposure", obj: "acq", status: "spiking", valueM: 1900, vq: "quote opportunity", count: 134, vel: 8, conf: 81, urg: 1.0, desc: "Rival carriers filing double-digit auto rate hikes open a short capture window across four states — competitor-shopper quote-starts already surging in affected ZIPs.", macro: "Industry-wide auto rate-hardening cycle" },
  { id: "gig", type: "New Segment Emerging", name: "Gig & rideshare drivers segment", obj: "deep", status: "spiking", valueM: 140, vq: "cross-sell opportunity", count: 312, vel: 9, conf: 88, urg: 0.90, desc: "A coherent cohort of rideshare / delivery drivers is forming outside existing segment definitions — mis-rated on personal auto, needs rideshare endorsement, high velocity, currently unowned.", macro: "Gig-economy driving growth · coverage-gap exposure", pinned: true, pinOrder: 1 },
  { id: "liquidity", type: "Telematics Activation", name: "Telematics-ready safe drivers", obj: "deep", status: "strengthening", valueM: 46, vq: "retention + loss opportunity", count: 388, vel: 6, conf: 84, urg: 0.60, desc: "Low-mileage, low-risk drivers paying full rate while telematics competitors court them — enroll them in RightTrack at the discount that holds them, before Progressive Snapshot does.", macro: "Usage-based-insurance adoption · telematics competition", pinned: true, pinOrder: 2 },
  { id: "wealth", type: "Bundle Attach · White-Space", name: "Auto-only, home insured elsewhere", obj: "deep", status: "strengthening", valueM: 5.9, vq: "est. annual bundle value pool", count: 184, vel: 5, conf: 83, urg: 0.55, desc: "18,400 households hold auto with us but home elsewhere — property records, life-events and quote history mark a window to win the home policy and lock a bundled household (7.0-yr tenure vs 5.5) before the auto renews.", macro: "Bundle-share competition · homeownership turnover", pinned: true, pinOrder: 3 },
  { id: "smbgrowth", type: "Growth Signal · Small Commercial", name: "Small businesses entering an expansion cycle", obj: "deep", status: "spiking", valueM: 46, vq: "incremental NWP opportunity", count: 384, vel: 8, conf: 82, urg: 0.75, desc: "38,400 small businesses showing growth-and-expansion signals — 61% placing the new or expanded coverage off-us with an insurtech or competitor. A short window to win the account back and bundle the lines, held to loss ratio.", macro: "SMB expansion cycle · insurtech (Next / Hiscox / biBERK) competition", b2b: true, pinned: true, pinOrder: 4 },
  { id: "smbrate", type: "Lead Opportunity · Small Commercial", name: "New high-value leads in play", obj: "ret", status: "spiking", valueM: 54, vq: "new-business NWP in play", count: 412, vel: 7, conf: 85, urg: 0.80, desc: "New small-commercial leads submitted and shopping — each a specific account worth winning now, competitively priced against the insurtechs and held to loss ratio. Open a lead to run the guided new-business simulation: signal → goals, guardrails & levers → intelligence.", macro: "Insurtech & competitor new-business competition", b2b: true, pinned: true, pinOrder: 5 },
  { id: "newcomer", type: "New Segment Emerging", name: "New-to-market young drivers", obj: "acq", status: "strengthening", valueM: 640, vq: "quote opportunity", count: 121, vel: 4, conf: 67, urg: 0.45, desc: "Thin-history first-time drivers and recent movers mark an under-served, growing quote inflow.", macro: "Household formation · new-driver growth" },
  { id: "limits", type: "Coverage-Limit Adequacy", name: "Underinsured limits on growing accounts", obj: "deep", status: "emerging", valueM: 210, vq: "deepening opportunity", count: 96, vel: 3, conf: 58, urg: 0.35, desc: "Repeated exposure-growth events on growing small-business twins signal limits that no longer match the risk — an increase-limit / umbrella deepening opportunity.", macro: "Rising replacement cost & liability severity", b2b: true },
  { id: "home", type: "Life-Event Surge", name: "Home-purchase intent cluster", obj: "deep", status: "strengthening", valueM: 96, vq: "bundle opportunity", count: 158, vel: 5, conf: 74, urg: 0.55, desc: "Real-estate-activity signals concentrate in two metros — home + auto bundle intent.", macro: "Mortgage-rate dip + housing turnover" },
  { id: "sweep", type: "New Product Opportunity", name: "Usage-based-insurance demand", obj: "deep", status: "strengthening", valueM: 72, vq: "CLV opportunity", count: 184, vel: 4, conf: 71, urg: 0.40, desc: "Low-mileage behaviour plus competitor-telematics queries point to latent demand for a pay-per-mile product.", macro: "Telematics / UBI adoption" },
  { id: "mobile", type: "Service Degradation", name: "Mobile FNOL / claims-app friction", obj: "ret", status: "spiking", valueM: 88, vq: "lapse exposure", count: 147, vel: 9, conf: 84, urg: 0.85, desc: "Failed photo-estimate uploads and complaint spikes cluster on a single claims-app flow.", macro: "Rising digital-service expectations" },
  { id: "wallet", type: "Competitive Displacement", name: "Coverage-reduction erosion", obj: "ret", status: "confirmed", valueM: 64, vq: "premium at risk", count: 203, vel: 5, conf: 86, urg: 0.50, desc: "Coverage down-shifts and deductible increases to cut premium across the core base — value perception eroding toward a rival quote.", macro: "Price-driven coverage cutting" },
  { id: "elder", type: "Claims-Experience Watch", name: "Claims-driven churn watch", obj: "ret", status: "spiking", valueM: 42, vq: "lapse exposure", count: 2600, vel: 6, conf: 84, urg: 0.85, desc: "Long-cycle claims and low post-settlement NPS, concentrated in long-tenured policyholders — smooth-claim customers renew; poor-experience ones lapse at the next renewal.", macro: "Claims-experience retention link" },

  /* ── Roadmap use-case tiles (preview / "Coming soon" — not yet enterable).
     Rendered as cockpit tiles alongside the live 4 + 2 SMB; together they form
     the fixed 14-usecase set shown in BOTH radar modes (see USECASE_THEMES). */
  { id: "lifeevent",   type: "Life-Event Acquisition", name: "New driver in household",                obj: "acq", status: "spiking",       valueM: 12.2, vq: "est. annual acquisition value pool",         count: 112, vel: 8, conf: 64, urg: 0.85, desc: "Teen-turning-16, relocation and new-marriage signals mark households whose insurance setup is being reshaped — add the driver and anchor retention before the household re-shops the whole policy elsewhere.", macro: "Household-formation & new-driver wave" },
  { id: "moneymoment", type: "New-Vehicle Acquisition", name: "New-vehicle purchase moment",   obj: "acq", status: "spiking",       valueM: 12.4, vq: "est. annual new-vehicle value pool",      count: 98,  vel: 7, conf: 66, urg: 0.80, desc: "New-vehicle registrations, lease-end and dealer-finance signals mark households buying a car — win the new auto policy and add the vehicle at the purchase moment, before a competitor quotes it.", macro: "Vehicle-purchase & lease-end cycle" },
  { id: "cardgrowth",  type: "Coverage Growth",        name: "Premium-vehicle underinsured",          obj: "deep", status: "strengthening", valueM: 6.1,  vq: "est. annual coverage-growth value pool",    count: 156, vel: 5, conf: 73, urg: 0.50, desc: "New premium-vehicle registrations and rising asset values show coverage running below replacement — decide whether to raise limits, add gap/OEM coverage or size the endorsement to the exposure at stake.", macro: "Vehicle-value inflation · underinsurance" },
  { id: "lending",     type: "Umbrella Activation",    name: "Umbrella white-space emerging",         obj: "deep", status: "strengthening", valueM: 9.3,  vq: "est. annual umbrella value pool",           count: 134, vel: 4, conf: 70, urg: 0.55, desc: "Rising household net worth, new teen drivers and high-liability assets signal a near-term umbrella need — offer the coverage the household is most likely to take before an incident exposes the gap.", macro: "Litigation severity · asset-value build" },
  { id: "primaryconv", type: "Bundle Conversion",      name: "Single-line ready to bundle",           obj: "deep", status: "confirmed",     valueM: 6.3,  vq: "est. annual bundle-conversion value pool",  count: 178, vel: 5, conf: 80, urg: 0.55, desc: "Home-ownership signals, quote history and household vehicles reveal single-line customers already behaving like future bundles — convert them at the renewal moment before the relationship stays partial.", macro: "Homeownership & multi-vehicle deepening" },
  { id: "relsave",     type: "Involuntary-Lapse Save", name: "Billing & payment-failure lapse",         obj: "ret", status: "confirmed",     valueM: 9.3,  vq: "est. annual involuntary-lapse value pool",  count: 209, vel: 6, conf: 82, urg: 0.70, desc: "Missed payments, failed auto-pay and NSF events push otherwise-willing customers toward involuntary cancellation — recover the payment and re-enroll auto-pay before the policy lapses.", macro: "Payment-friction & involuntary lapse" },
  { id: "affluentret", type: "High-Value Retention",   name: "High-value household drift",             obj: "ret", status: "strengthening", valueM: 3.6,  vq: "est. annual high-value-defense value pool", count: 121, vel: 5, conf: 78, urg: 0.60, desc: "Engagement drop-off, coverage reduction and competitor-quote signals identify high-LTV bundled households at risk — prioritize by value-at-risk before high-premium relationships leave.", macro: "High-value attrition · competitor shopping" },
  { id: "cardret",     type: "Discount Retention",     name: "Discount roll-off premium shock",       obj: "ret", status: "strengthening", valueM: 3.0,  vq: "est. annual discount-defense value pool",   count: 147, vel: 6, conf: 76, urg: 0.55, desc: "A lapsing discount (safe-driver, paid-in-full, loyalty or telematics) pushes the renewal premium up sharply — the customers most likely to shop the jump; re-qualify or re-earn the discount before they leave.", macro: "Discount roll-off · renewal premium shock" },
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
  ["#5b9dff", "Low-mileage driver >12mo · full-rate premium", "telematics-feed", "liquidity"],
  ["#4fd1c5", "In-app search: safe-driver discount", "app-telemetry", "liquidity"],
  ["#9f7aea", "Home policy bound off-us · auto with us", "property-records", "wealth"],
  ["#b794f6", "In-app: bundle-quote calculator opened", "app-telemetry", "wealth"],
  ["#9f7aea", "Auto-only 90d · home ownership detected", "household-graph", "wealth"],
  ["#4fd1c5", "New coverage bound off-us · insurtech placement", "submission-feed", "smbgrowth"],
  ["#5b9dff", "New location + payroll growth · WC/GL exposure up", "exposure-detail", "smbgrowth"],
  ["#ff6b6b", "New lead submitted · broker shopping competitor quotes", "submission-feed", "smbrate"],
  ["#ffb15a", "High-value lead · expansion + competitive pressure", "lead-monitor", "smbrate"],
  ["#5b9dff", "Multi-platform driving · Uber + DoorDash", "telematics-feed", "gig"],
  ["#63b3ed", "Rideshare endorsement gap · mobile-first", "underwriting", "gig"],
  ["#5b9dff", "Low annual mileage <5k · 90d telematics", "telematics-feed", "sweep"],
  ["#4fd1c5", "In-app search: pay-per-mile insurance", "app-telemetry", "sweep"],
  ["#ffb15a", "Competitor quote-request captured · 42d pre-renewal", "shopping-feed", "retention"],
  ["#ffb15a", "Digital engagement −21% MoM · high-LTV auto", "contentsquare", "retention"],
  ["#ff6b6b", "Shopping-propensity decile elevated · scoring engine", "risk-model", "retention"],
  ["#4fd1c5", "Coverage-reduction request · value-perception drop", "csw", "retention"],
  ["#ffb15a", "Photo-estimate upload failed · 3rd retry", "claims-app", "mobile"],
  ["#ffb15a", "Complaint: claims app will not upload", "care-nlp", "mobile"],
  ["#5b9dff", "Exposure grew past policy limit · SMB twin", "exposure-engine", "limits"],
  ["#5b9dff", "Under-limit flag · umbrella gap widening", "exposure-engine", "limits"],
  ["#9f7aea", "New-mover · out-of-state relocation", "public-records", "newcomer"],
  ["#63b3ed", "First-time driver quote · thin history", "quote-engine", "newcomer"],
  ["#4fd1c5", "Coverage reduced -22% · 30d", "policy-admin", "wallet"],
  ["#5b9dff", "Deductible raised · premium-cutting pattern", "policy-admin", "wallet"],
  ["#9f7aea", "Real-estate activity detected · metro A", "intent-model", "home"],
  ["#9f7aea", "Mortgage pre-qual signal · bundle intent", "intent-model", "home"],
  ["#ff6b6b", "Rival files +14% auto rate · 4 states", "reg-filings", "branch"],
  ["#63b3ed", "Competitor-shopper quote surge · rate-hike ZIP", "quote-engine", "branch"],
];

export const INTERNAL_FORMING = [
  { nm: "Engagement decay ahead of renewal shopping", em: "digital-engagement decline detected 60 days before competitor quote-shopping in the silent-pre-shopper sub-segment", obj: "ret" },
  { nm: "Rideshare coverage-gap clustering", em: "personal-auto policies with rideshare-platform activity across the under-35 base", obj: "deep" },
  { nm: "New-driver bundle moment", em: "teen-turning-16 signals meeting home-ownership in the household", obj: "acq" },
  { nm: "Agent-to-digital migration", em: "captive-agent (Comparion) contact decline meeting portal-adoption rise", obj: "ret" },
  { nm: "Bundle-readiness clustering in the high-LTV tenure band", em: "home-purchase signals meeting auto-only tenure and competitor home-quote history, ahead of any bundle offer", obj: "deep" },
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
