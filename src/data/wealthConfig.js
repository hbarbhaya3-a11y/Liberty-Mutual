/* ============================================================================
   Affluent / Wealth Attach · theme config + 3 archetypes (AD / HM / AS).

   Sibling to liquidityConfig.js — same shape, different domain. Engine W
   (wealth attach / convert). Consumed by WealthAnalyzeView,
   WealthSimulateView, WealthIfWhatView and the Theme.jsx hero.

   POSITIONING (the one hard rule from the brief):
     The optimization objective is NEW WEALTH-RELATIONSHIP CONVERSION.
     AUM and fee revenue are DOWNSTREAM value, never the headline goal — and
     the specific motion (portfolio review, senior-FA, …) is never prescribed
     up front; it is one allowed move the optimizer picks, and the name only
     appears in the OUTPUT.

   MONEY MODEL (internally consistent funnel):
     18,400 flagged (mass-affluent, no wealth relationship)
       → $1.1B investable assets held outside (18.4K × ~$60K median held-away)
       → suitability / advice-readiness gate (≥ 0.55) → 6,200 advice-ready
       → reachable / consent-eligible → 5,400
       → relevant, suitability-matched wealth motion → 4.3% conversion
       → 267 new wealth relationships · +$64M AUM ($240K avg)
       → 62% funded · 710 appointments · +$320K annual fee revenue (downstream)
       → 76% advisor-capacity utilisation · $410 cost per converted relationship
   ========================================================================= */

export const WEALTH_HYPOTHESIS_ID = "H-WEALTH-2026-06-29";
export const WEALTH_HYPOTHESIS_TITLE = "Convert advice-ready into wealth relationships";

export const WEALTH_CONFIG = {
  theme: "wealth",
  cluster: "cluster_wealth_attach",
  name: "Affluent / Wealth Attach · White-Space",
  objective: "deep",
  engine: "W",                 // Wealth attach / convert
  badge: "WEALTH",
  claim: "Mass-affluent households bank with us every day but invest somewhere else — and some of that money has already started to move out. The bet: advice-readiness is detectable, and the right wealth motion for each household converts that everyday trust into a real relationship — aimed at the customers who genuinely need the advice, while the unready and the unsuitable are left alone.",
  valueLever: "Convert white-space into wealth relationships",
  buyer: "Consumer Banking + Wealth Management",
  valueBridge: {
    newRelationships: "+267",
    attachedAUM:      "+$64M",
    flightDefended:   "−4.5pp",
    headline:         "new wealth relationships + AUM attached",
  },
  bindingConstraint: {
    owner: "Compliance / Legal / MRM / Wealth Supervision",
    text:  "A wealth recommendation is a recommendation — Reg BI best-interest and suitability apply. Each targeted household must show a genuine, evidenced advice-need, not just a high balance estimate; the unsuitable and the unready must be left out, or the conversion is a fair-treatment failure.",
  },
  teeth: ["suitability", "fairness"],
  pop: 18400,
  share: 0.061,
  macro: {
    state: "Wealth-platform disintermediation + retirement demographic wave",
    drift: false,             // STABLE — the white-space is structural, not noise
    sub: "stable — frames the external-flight risk without destabilising the model",
    field: ["external wealth-platform pull", "retirement / rollover demographic wave", "advisor-capacity supply", "advice-readiness behaviour shift"],
  },
};

export const WEALTH_PERSONAS = {
  advice_ready: {
    id: "advice_ready", init: "AD", nm: "Advice-Ready Deepener", kind: "target",
    tag: "deep banking · clear wealth gap",
    sb: "14-year customer · mortgage + card · ~$180K to invest · no wealth product",
    moment: "A 14-year customer with a mortgage, a card and ~$180K of investable assets sits with no wealth product at all. Surplus balances have held above the spending pattern for 90+ days, and three retirement-planning articles were opened in-app last week. The suitability model scores 0.82 — a genuine, evidenced advice-need the bank has simply never acted on.",
    fv: [
      ["investable potential",   0.74],
      ["wealth gap",             0.88],
      ["surplus liquidity",      0.81],
      ["external movement",      0.22],
      ["digital intent",         0.71],
      ["suitability score",      0.82],
    ],
  },
  high_aum_mover: {
    id: "high_aum_mover", init: "HM", nm: "High-AUM Mover", kind: "target",
    tag: "$250K+ · transfers firing now",
    sb: "High-AUM · first-ever brokerage transfer fired · time-boxed",
    moment: "$250K+ in estimated investable assets, and a first-ever $38K transfer to an outside brokerage fired yesterday after two aggregator logins. The money is organising itself elsewhere. The suitability model scores 0.78 — high-conviction and time-boxed; this relationship is decided in weeks, not months.",
    fv: [
      ["investable potential",   0.91],
      ["wealth gap",             0.79],
      ["surplus liquidity",      0.64],
      ["external movement",      0.86],
      ["digital intent",         0.58],
      ["suitability score",      0.78],
    ],
  },
  aspirational_saver: {
    id: "aspirational_saver", init: "AS", nm: "Aspirational Saver", kind: "falsepos",
    tag: "earmarked inheritance · FALSE POSITIVE",
    sb: "Looks affluent on a snapshot · the surplus is already spoken for",
    moment: "A $220K balance looks affluent and trips the wealth-attach flag. But it's an inheritance that settled six weeks ago, earmarked for a home purchase closing in 90 days — no investing intent, no external movement, every dollar already spoken for. Suitability scores 0.34 — below the 0.55 gate. Recommending a managed portfolio here is a suitability and fair-treatment failure.",
    fv: [
      ["investable potential",   0.83],
      ["wealth gap",             0.41],
      ["surplus liquidity",      0.69],
      ["external movement",      0.08],
      ["digital intent",         0.18],
      ["suitability score",      0.34],
    ],
  },
};

export const WEALTH_ARCHETYPE_ORDER = ["advice_ready", "high_aum_mover", "aspirational_saver"];

/* Numerical calibration anchors for wealth's simulateOutcomes() / runOptimizer().
   Field names mirror LIQUIDITY_CALIBRATION so the simulate math forks cleanly;
   semantics are re-cast for wealth attach:
     - the PRIMARY good outcome is conversion → new wealth relationships
     - "retainedM" carries INCREMENTAL AUM ($M) so the segment engine reconciles
     - "runoff" = investable assets committing to an external platform (flight)
   Funnel: 18.4K flagged → $1.1B held outside → 6.2K advice-ready after gate
   → 4.3% conversion → 267 relationships · +$64M AUM · +$320K fee (downstream). */
export const WEALTH_CALIBRATION = {
  cohortTotal:              18400,   // flagged: mass-affluent, no wealth relationship
  investablePoolB:            1.1,   // $1.1B investable held outside (18.4K × ~$60K median)
  eligibleAfterGate:         6200,   // advice-ready after suitability gate (≥ 0.55)
  reachableN:                5400,   // consent / contact-eligible
  highAumMoverN:             1900,   // external transfers firing now
  digitalPlannerN:           2600,   // retirement / investing content engaged
  avgAumK:                    240,   // $240K avg AUM per converted relationship
  conversionBau:            0.018,   // ~1.8% education-only baseline
  conversionWithPolicy:     0.043,   // 4.3% with the recommended motion
  newRelationships:           267,   // 6,200 × 4.3%
  incrementalAumM:             64,   // 267 × $240K ≈ $64M
  fundedRate:                0.62,   // 62% of conversions funded
  appointments:               710,   // appointments booked
  feeRevenueAnnualK:          320,   // +$320K annual fee revenue (downstream)
  advisorUtil:               0.76,   // 76% advisor-capacity utilisation
  costPerConvUSD:             410,   // $410 cost per converted relationship
  runoffBau:                0.180,   // 18% of held-away assets commit externally (BAU, 12-mo)
  runoffWithPolicy:         0.135,   // 13.5% with the attach policy
  runoffReductionPp:        0.045,   // −4.5pp external flight defended
  retainedDepositsAnnualM:     64,   // INCREMENTAL AUM ($M) — the value the segment engine splits
  offerCostM:               0.109,   // $109K campaign cost (267 × $410)
  spreadProtectedK:           320,   // +$320K annual fee revenue protected/earned
  netAnnualisedK:             320,   // net annualised fee revenue on the tested cohort
  treatmentN:                4960,   // 80% of 6,200
  controlN:                  1240,   // 20% holdout
  seniorFaSlotCap:            600,   // scarce senior-FA appointments available in the pilot
  complaintsBaseline:          20,   // a welcome conversation — low fatigue
  complaintsDelta:             28,   // low complaint delta
  udaapMargin:               0.94,   // suitability / fair-treatment margin (held by the gate)
  udaapFloor:                0.85,
  stickinessThreshold:       0.55,   // suitability / advice-readiness gate
};

/* Pre-simulation range strings for Analyze hero KPIs.
   The SAME five metrics the What-If / If-What results report, shown as estimate
   ranges. Each result point estimate lands inside its range, so the hero note's
   promise ("the simulation tightens each range") holds literally. */
export const WEALTH_PRESIM_RANGES = [
  { label: "Wealth-relationship conversion", value: "3–6%",        unit: "vs ~1.8% today · est. range",        tone: "g" },
  { label: "New wealth relationships",       value: "+180–320",    unit: "vs ~110 today · est. range",         tone: "g" },
  { label: "Incremental AUM attached",       value: "$45–80M",     unit: "held-away assets won · est. range",  tone: "g" },
  { label: "Funded-account rate",            value: "55–68%",      unit: "of conversions funded · est. range", tone: "g" },
  { label: "Projected annual advisory fee revenue", value: "+$0.24–0.42M", unit: "downstream · est. range",     tone: "g" },
];

/* Three testable hypotheses for wealth attach. Card A is the recommended one
   (the optimizer routes each household to its best-fit motion); B and C are
   narrower cohort/angle bets the user can test instead. Mirrors the idle-cash
   LIQUIDITY_HYPOTHESES shape: each carries the allowed-move set (`moves`) it
   seeds into the test flow. Selecting a card sets selectedHypothesisId; the
   workspaces read it. The specific motion is NEVER prescribed on the
   recommended card — "best-fit" means the optimizer decides. */
export const WEALTH_HYPOTHESES = [
  {
    id: WEALTH_HYPOTHESIS_ID,
    rank: "A",
    recommended: true,
    title: "Convert the advice-ready",
    lead: "Of 18,400 mass-affluent households flagged with no wealth relationship, ~6,200 show strong advice-readiness this cycle. Route each to the best-fit motion — a portfolio review, a senior-FA conversation, a banker handoff, or a guided digital journey — at the lightest touch that converts, while leaving the unready and the unsuitable alone.",
    moves: ["portfolio_review", "senior_fa", "banker_handoff", "education", "digital_starter"],
    defaultMotion: "portfolio_review",
    cohort: ["all"],
  },
  {
    id: "H-WEALTH-2026-06-29-B",
    rank: "B",
    recommended: false,
    title: "Catch the movers",
    lead: "About 1,900 high-AUM households are actively moving investable assets to an outside platform right now. Reach them with a priority advisor conversation before the transfer completes — the highest-conviction, most time-boxed slice of the opportunity.",
    moves: ["senior_fa", "portfolio_review"],
    defaultMotion: "senior_fa",
    cohort: ["high-aum"],
  },
  {
    id: "H-WEALTH-2026-06-29-C",
    rank: "C",
    recommended: false,
    title: "Nurture the digital-first",
    lead: "About 2,600 digitally-engaged planners are clicking retirement and investing content in-app. Meet them with a low-cost guided digital journey and escalate only the ones who lean in — spending advisor time where the customer signals real intent.",
    moves: ["digital_starter", "education", "portfolio_review"],
    defaultMotion: "digital_starter",
    cohort: ["digital"],
  },
];

/* Lookup: hypothesis by id, falling back to the recommended (Card A). */
export function wealthHypothesis(id) {
  return WEALTH_HYPOTHESES.find((h) => h.id === id) || WEALTH_HYPOTHESES[0];
}

export default WEALTH_CONFIG;
