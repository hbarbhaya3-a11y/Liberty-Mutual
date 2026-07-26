/* ============================================================================
   askTwinxContext — static, in-context knowledge packs for Ask TwinX.

   This is "RAG without a database": the corpus is tiny and fixed (a handful of
   use cases), so instead of embeddings + retrieval we generate a rich, grounded
   knowledge pack PER USE CASE from the same *_CALIBRATION objects that drive the
   UI — the model's background knowledge therefore can't drift from what's on
   screen. buildContext() assembles: the use-case pack + page-stage guidance +
   the LIVE on-screen facts (authoritative for the current page).
   ========================================================================= */
import { LIQUIDITY_CALIBRATION } from "@/data/liquidityConfig";
import { WEALTH_CALIBRATION } from "@/data/wealthConfig";
import { RETENTION_CALIBRATION } from "@/data/retentionConfig";

const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const k = (n) => `${Math.round(n / 1000)}K`;

/* ---- Idle-cash liquidity pack -------------------------------------------- */
function liquidityPack(C) {
  return `USE CASE — Idle-Cash Liquidity Activation (theme id "liquidity").
THESIS: Hundreds of thousands of consumer customers hold idle cash earning ~0.05% APY while competitors advertise 4%+. The bet: route genuinely SURPLUS idle cash into the best-fit liquidity product — high-yield savings (HYS), money-market (MMA), or a short CD / ladder — at the MINIMUM incentive that converts, while leaving everyday operating cash and emergency buffers untouched.

COHORT FUNNEL (canonical):
- ${C.cohortTotal.toLocaleString()} customers flagged (idle ≥ $5K, dormant 60d+) = $${C.idleInScopeB}B idle cash in scope (~$${C.avgBalK}K median balance).
- → ~${k(C.signalCohortN)} show strong rate-elastic activation signals — the selectable "full" cohort in the scenario.
- → ~${k(C.eligibleAfterGate)} are ACTIONABLE after a ${C.stickinessThreshold ?? 0.55} suitability gate (genuinely surplus, not buffers); this pool's balances are ~$1.2B "under test".
- → RCT split ${C.treatmentN.toLocaleString()} treatment / ${C.controlN.toLocaleString()} control (90/10 holdout).

VALUE CHAIN (nothing is hardcoded — every result number derives from the levers):
cohort → each selected product's offer RANGE sets the incentive (bps over the customer's current APY) → reach-weighted BLENDED uplift → FUNDED CONVERSION (organic baseline ~${pct(C.fundedConversionBaseline)}, ~${pct(C.fundedConversion)} with the balanced policy) → funded relationships + funded balances ($M moved into yield) → IDLE-CASH LEAKAGE falls (${pct(C.runoffBau, 0)} BAU → ${pct(C.runoffWithPolicy)} with policy, −${(C.runoffReductionPp * 100).toFixed(1)}pp). Net 12-month projected value ≈ +$${C.retainedDepositsAnnualM}M at the recommended defaults, net of ~$${C.offerCostM}M rate give-up.

THE THREE OPTIMIZER POLICIES (the If-What results — they are points on one trade-off curve, not weaker copies):
- Balanced — all products, moderate incentive, routes each segment to its best-fit product. Best TOTAL Incremental relationship value. The recommended default (#1).
- Margin-optimised — lower incentive, MMA/CD-weighted. FEWER but higher-balance conversions; best margin per customer; lowest rate give-up.
- Conversion-optimised — higher incentive, savings-weighted. The MOST funded conversions, but lower value each.

GUARDRAILS (hard constraints — any policy shown has already passed them):
- Suitability gate (0.55): the targeted balance must be shown to be genuinely surplus, not an operating/emergency buffer — locking a buffer into a term product is a suitability + liquidity-risk failure.
- RAROC / profitability floor: the rate give-up must stay below the net interest margin the balance earns.
- Model-risk (SR 11-7) approval + a fraud envelope.

GLOSSARY: "funded conversion" = share of treated customers who move idle cash into a funded yield product. "Idle-cash leakage / flight" = balances leaving to external high-yield banks/brokerages. "bps uplift" = incentive offered over the customer's current APY. "Suitability gate" = the 0.55 score separating genuine surplus from buffers.`;
}

/* ---- Wealth-attach pack -------------------------------------------------- */
function wealthPack(C) {
  return `USE CASE — Wealth Attach / White-Space (theme id "wealth").
THESIS: Mass-affluent households bank with us but invest elsewhere, and some of that money has started to move out. Convert the everyday banking trust into a wealth relationship with the RIGHT motion (advisor-led, banker hand-off, or digital), targeted at the households who genuinely need the advice — without over-routing scarce senior-advisor capacity.

COHORT FUNNEL (canonical):
- ${C.cohortTotal.toLocaleString()} mass-affluent households flagged with NO wealth relationship = $${C.investablePoolB}B investable held outside (~$60K avg held away per household).
- → ~${C.eligibleAfterGate.toLocaleString()} are ADVICE-READY after a ${C.stickinessThreshold} suitability / advice-readiness gate; ~${C.reachableN.toLocaleString()} are consent/contact-eligible.
- → RCT split ${C.treatmentN.toLocaleString()} treatment / ${C.controlN.toLocaleString()} control (80/20 holdout).

VALUE CHAIN: cohort → the chosen MOTION + channels set per-contact conversion (organic baseline ~${pct(C.conversionBau)}, ~${pct(C.conversionWithPolicy)} with the recommended motion) → ~${C.newRelationships} new wealth relationships → incremental AUM attached (~$${C.incrementalAumM}M at $${C.avgAumK}K avg AUM per CONVERTED relationship) → ${pct(C.fundedRate, 0)} funded → ~+$${C.feeRevenueAnnualK}K annual fee revenue → external flight defended (${pct(C.runoffBau, 0)} BAU → ${pct(C.runoffWithPolicy)} with policy, −${(C.runoffReductionPp * 100).toFixed(1)}pp).
NOTE on numbers: "$${C.avgAumK}K" is avg AUM per CONVERTED relationship, NOT investable per flagged household (~$60K). Don't conflate them.

THE THREE OPTIMIZER POLICIES mirror the liquidity ones — Balanced (best total relationship value, the recommended default), Margin-optimised (fewer, higher-AUM conversions, best margin), Conversion-optimised (most new relationships, lower value each).

GUARDRAILS (hard constraints): suitability / Reg BI advice-readiness gate (${C.stickinessThreshold}); a senior-FA capacity cap (≈${C.seniorFaSlotCap} pilot appointments) — a motion that over-routes advisors is flagged; model-risk approval; fraud envelope. UDAAP / fair-treatment margin held at ~${C.udaapMargin}.

GLOSSARY: "AUM" = assets under management attached. "Motion" = how the conversation is run (portfolio review, senior-FA 1:1, banker→FA hand-off, digital starter). "Advice-ready" = passes the suitability/readiness gate. "External flight" = held-away assets committing permanently elsewhere.`;
}

/* ---- Auto renewal-retention pack ----------------------------------------- */
function retentionPack(C) {
  return `USE CASE — Auto Renewal Retention (theme id "retention").
THESIS: Liberty's best auto customers — high-LTV, low-loss, mature — shop first when a broad-brush rate action hits them uniformly, driving the 7.1pt retention collapse (73.5% → 66.4%). The bet: hold the genuinely price-elastic renewals with the SMALLEST incentive that works (a capped rate + retention offer, deductible-adjusted premium, or a bundle nudge), while NOT discounting the operationally-loyal, deeply-bundled majority who would renew anyway.

COHORT FUNNEL (canonical):
- ${C.cohortTotal.toLocaleString()} auto policies flagged with one or more renewal-shopping signals.
- → ~${(C.eligibleAfterGate/1000).toFixed(0)}K are ELIGIBLE after a ${C.stickinessThreshold} loyalty/elasticity gate (genuinely price-elastic, not sticky-bundled); ~$${C.balancesUnderTestM}M NWP "under test".
- → RCT split ${C.treatmentN.toLocaleString()} treatment / ${C.controlN.toLocaleString()} control (80/20 holdout).

VALUE CHAIN (nothing hardcoded — every result derives from the levers):
cohort → each selected retention action's offer RANGE sets the incentive → reach-weighted BLENDED save-rate → LAPSE falls (${(C.runoffBau*100).toFixed(1)}% BAU → ${(C.runoffWithPolicy*100).toFixed(1)}% with policy, −${(C.runoffReductionPp*100).toFixed(1)}pp) → policies held + NWP protected (≈ +$${C.retainedDepositsAnnualM}M / yr at recommended defaults, net of ~$${(C.offerCostM*1000).toFixed(0)}K retention-offer cost).

THE THREE OPTIMIZER POLICIES (points on one trade-off curve):
- Balanced — all actions, moderate incentive, routes each segment to its best-fit action. Best TOTAL NWP protected. Recommended default (#1).
- Margin-optimised — lower incentive, capped-rate/deductible-weighted. FEWER but higher-LTV saves; best margin per policy; lowest rate give-up.
- Conversion-optimised — higher incentive, retention-offer + bundle-weighted. The MOST renewals held, lower value each.

GUARDRAILS (hard constraints — any policy shown has already passed them):
- Fair-lending gate (${C.stickinessThreshold}): the elasticity model must evidence the targeted policy is genuinely price-elastic, not a loyal household priced away — a disparate-impact / NAIC Model Bulletin 24-08 failure otherwise.
- Combined-ratio / loss floor: the retention give-up must stay within the margin the policy earns.
- Model-risk approval + a loss-ratio envelope.

GLOSSARY: "save-rate" = share of treated renewals held vs lapsed. "Lapse / shopping" = renewals leaving for a competitor quote. "NWP protected" = net written premium retained. "Loyalty gate" = the ${C.stickinessThreshold} score separating price-elastic shoppers from operationally-loyal bundled households.`;
}

export const USE_CASE_PACKS = {
  liquidity: liquidityPack(LIQUIDITY_CALIBRATION),
  wealth: wealthPack(WEALTH_CALIBRATION),
  retention: retentionPack(RETENTION_CALIBRATION),
};

/* The strategic context of the current question + what a good answer focuses on.
   (Internal guidance — phrase answers strategically, never about the UI.) */
export const PAGE_STAGES = {
  "ifwhat-results": "Context: the executive is weighing the optimizer's three ranked policies for this scenario. Good answers explain the trade-off between them, which is recommended and why, what drove each number from the inputs, and which to run for a given goal — grounded in the live values below.",
  "whatif-results": "Context: the executive is looking at the projected outcome of one configuration they set. Good answers explain what each KPI means, what drove it from the levers, and whether the verdict supports the hypothesis.",
  "ifwhat-config": "Context: the executive is setting up the optimizer (objective, cohort, eligibility, per-product offer ranges, products, channels). Good answers explain what each lever does and how it will move the results.",
  "whatif-config": "Context: the executive is configuring the scenario (cohort, eligibility, per-product offers, channels). Good answers explain what each lever does and how it shapes the projected outcome.",
  "analyze": "Context: the executive is examining the recommended hypothesis — its data, models and the drivers behind it. Good answers explain the evidence, the funnel, and why this hypothesis is the recommended bet.",
};

/* Per-use-case metric keys the model may plot with a [[chart:KEY]] directive.
   The chat renders every visual from the live facts — the model only picks. */
export const CHART_METRICS_BY_USECASE = {
  liquidity: "netValueM ($M Incremental relationship value), fundedConversionPct (%), fundedBalancesM ($M), flightReductionPp (leakage reduction, pp)",
  wealth:    "incrementalAumM ($M), newRelationships (count), conversionPct (%), feeRevenueK ($K fee revenue)",
  retention: "nwpProtectedM ($M NWP protected), retentionLiftPp (retention lift, pp), lapseReductionPp (lapse reduction, pp), bundleLiftPp (bundle-penetration lift, pp)",
};

/* Named, higher-level visuals. Each is tagged COMPLEMENTS (adds something the
   results page does NOT already show) or DUPLICATES (the page already shows it,
   so use only if explicitly asked). */
export const NAMED_VISUALS =
  "[[chart:tradeoff]] COMPLEMENTS — value-vs-volume scatter with the efficient-frontier line (the page shows bars, not the frontier; best for 'why three' / the trade-off); " +
  "[[chart:funnel]] COMPLEMENTS — cohort → in-treatment → converted sizing (the page doesn't size the cohort; best for 'how big is this' / 'who's in scope'); " +
  "[[chart:scorecard]] DUPLICATES — every metric × policy grid; the results page already has this, so only when the user explicitly asks to see all metrics side-by-side; " +
  "[[chart:kpis]] — this run's key outcomes as tiles; only useful on a single What-If configuration where the user is asking what this run delivered.";

/* One exemplar showing the DEPTH + grounding + a chart + second-order thinking. */
export const FEWSHOT = {
  q: "What's the difference between the three policies?",
  a: `All three maximise the same objective — they're three points on the value↔volume↔margin trade-off curve, not weaker copies of one answer.

- **Balanced (recommended, #1)** routes each segment to its best-fit retention action at a moderate incentive. It wins the highest TOTAL NWP protected, so it's the safe default when no single constraint dominates.
- **Margin-optimised** sits lower in the offer ranges and weights capped-rate / deductible-adjusted actions. It saves fewer but higher-LTV renewals, giving the best margin per policy and the lowest rate give-up.
- **Conversion-optimised** sits higher and weights the retention offer + bundle nudge. It holds the most renewals but lower value each.

[[chart:tradeoff]]

Mechanically, the incentive posture within your offer ranges sets the blended save-rate → retention → policies held, NWP protected and residual lapse; every policy already clears the fair-lending, combined-ratio and loss guardrails. The choice isn't only this quarter's value, though — Conversion-optimised holds the most renewals and seeds a bigger bundle base next year, but it spends the most in retention offers, so the combined ratio and rate give-up are worth watching if the loss trend turns. Margin-optimised banks safer margin now yet leaves the most high-LTV renewals exposed to competitor shopping, raising the odds you revisit this cohort sooner. If growth restoration is the goal, the slightly-lower-value Conversion policy can be the better call once the follow-on bundle attach is counted.`,
};

/* Assemble the full grounded context for one question. */
export function buildContext(useCase, pageId, facts) {
  const pack = USE_CASE_PACKS[useCase];
  const stage = PAGE_STAGES[pageId];
  return [
    pack || "USE CASE — a TwinX decision-intelligence scenario on a customer segment.",
    stage || "",
    facts ? `LIVE VALUES from the current analysis (authoritative — prefer these exact numbers): ${JSON.stringify(facts)}` : "",
  ].filter(Boolean).join("\n\n");
}
