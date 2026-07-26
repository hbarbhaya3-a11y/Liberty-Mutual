import React from "react";

/* ============================================================================
   Ask TwinX — page-contextual knowledge base.

   Keyed by page id (published via useSetPageContext). Each page has:
     label   — short page name shown in the header
     seed    — opening message (fn(facts) -> node, or node)
     presets — contextual quick-pick questions
     answers — [{ keys, head, body }] matched by keyword; body is fn(facts)->node
   The chatbot falls back to the global CEO KB when a question doesn't match.
   ========================================================================= */

const g = (t) => <span className="g">{t}</span>;
const h = (t) => <span className="h">{t}</span>;
const r = (t) => <span className="r">{t}</span>;
const b = (t) => <b>{t}</b>;

const polLine = (facts) => {
  const p = facts?.policies || [];
  if (!p.length) return "the optimizer's top three policies";
  return p.map((x) => x.name).join(", ");
};

/* Colored evidence-tile row — same treatment as the strategic companion. */
const Ev = ({ items }) => (
  <div className="tc-ev">
    {items.map((x, i) => (
      <div key={i} className={`tc-evc ${x.c}`}><span className="v">{x.v}</span><span className="l">{x.l}</span></div>
    ))}
  </div>
);
/* Each policy → its distinguishing trait + a stable color, BY NAME (so the
   chips stay correct even when the ranking reorders the policies). */
const POL_TRAIT = {
  "balanced":             { c: "g", v: "value" },
  "margin-optimised":     { c: "a", v: "margin" },
  "conversion-optimised": { c: "v", v: "convs" },
};
const polEv = (facts) => {
  const base = facts?.policies && facts.policies.length
    ? facts.policies
    : [{ name: "Balanced" }, { name: "Margin-optimised" }, { name: "Conversion-optimised" }];
  return base.slice(0, 3).map((x) => {
    const t = POL_TRAIT[(x.name || "").toLowerCase()] || { c: "b", v: "policy" };
    return { c: t.c, v: t.v, l: (x.name || "").split(/[\s-]/)[0] };
  });
};

export const PAGE_KB = {
  /* ---------------- If-What optimizer RESULTS (the 3 policies) ------------- */
  "ifwhat-results": {
    label: "Optimizer results",
    seed: (f) => (
      <>
        <div className="head">Here are the optimizer's top {f?.policies?.length || 3} policies.</div>
        They all maximise <b>{f?.objective || "12-month relationship value"}</b> within your guardrails — ranked by the objective. Ask me to <b>explain them</b>, what <b>drove the numbers</b>, or <b>why these three</b>.
      </>
    ),
    presets: [
      "Explain these results",
      "What factors drove these numbers?",
      "Why three policies?",
      "Why did we get these three specifically?",
      "What's the difference between them?",
      "Which one should I run?",
    ],
    answers: [
      { keys: ["explain", "these results", "the results", "summary", "what am i looking", "walk me", "overview"],
        head: "Three policies on one objective — pick your posture.",
        body: (f) => (
          <>The optimizer searched the policy space you defined (cohort · offer ranges · allowed products) and returned the {f?.policies?.length || 3} best-scoring policies on <b>{f?.objective || "12-month net value"}</b>, ranked. {f?.recommended ? <>{b(f.recommended)} is the recommended ({g("#1")}) — it wins the objective while respecting every guardrail.</> : <>#1 is the recommended.</>} The other two are genuinely different postures, not just weaker versions — so you choose the value↔volume↔margin trade-off.
            <Ev items={polEv(f)} /></>
        ) },
      { keys: ["factor", "drove", "influence", "these numbers", "why these numbers", "what determines", "how computed", "where do", "come from"],
        head: "Everything traces from your selected inputs.",
        body: () => (
          <>The chain is: <b>cohort</b> → treated population → your <b>per-product offer ranges</b> set each policy's incentive (its posture point in your ranges) → the <b>reach-weighted blended uplift</b> → <b>conversion</b> (rises with the incentive) → which cascades to <b>relationships</b>, <b>NWP protected</b>, and <b>lapse</b>. The <b>products you selected</b> constrain the per-segment routing. Change any input and every number moves — nothing is hardcoded.</>
        ) },
      { keys: ["why three", "three policies", "three options", "3 options", "3 policies", "why 3", "number of options"],
        head: "Three points on the trade-off curve.",
        body: (f) => (
          <>One number isn't a decision. The optimizer surfaces a spread across the core trade-off — {g("most value")}, {h("best margin")}, {r("most conversions")} — so you can pick the posture that fits the quarter, instead of being handed a single answer with hidden assumptions. They're the meaningfully-distinct policies on the efficient frontier.
            <Ev items={polEv(f)} /></>
        ) },
      { keys: ["why these three", "why did we get these", "why only these", "these specifically", "why not other", "how chosen", "selected these"],
        head: "Each is the best policy for a different posture.",
        body: (f) => (
          <>Within <em>your</em> selected products + offer ranges, each takes a different incentive posture: {b("Margin-optimised")} sits low in the ranges (cheapest, highest-balance converts), {b("Balanced")} mid (best total value), {b("Conversion-optimised")} high (most conversions). They're the optimum at each posture — tighten the ranges or deselect a product and you'd get a different three. {f?.policies?.length ? <>Right now: {polLine(f)}.</> : null}</>
        ) },
      { keys: ["difference", "differ", "compare", "comparison", "vs", "versus", "trade-off", "tradeoff", "between them"],
        head: "Same objective, different bet.",
        body: (f) => (
          <>
            <div style={{ marginTop: 4 }}>{b("Balanced")} — all products, moderate incentive · routed per segment · the {g("best total value")}.</div>
            <div>{b("Margin-optimised")} — lower incentive, capped-rate/deductible-weighted · fewer but higher-balance conversions · {h("best margin per customer")}.</div>
            <div>{b("Conversion-optimised")} — higher incentive, retention-offer + bundle-weighted · the {r("most renewals held")}, but lower value each.</div>
            <Ev items={polEv(f)} />
            {f?.policies?.length ? <div style={{ marginTop: 5, opacity: 0.85 }}>Read the scorecard across a row to see who wins each metric.</div> : null}
          </>
        ) },
      { keys: ["which", "should i run", "recommend", "pick", "choose", "best one", "go with"],
        head: "Default to the recommended unless margin is the priority.",
        body: (f) => (
          <>{f?.recommended ? b(f.recommended) : "Balanced"} ({g("#1")}) wins the objective and is the safe default. Choose {b("Margin-optimised")} if cost-efficiency / margin per customer matters more than volume; choose {b("Conversion-optimised")} if you're optimising for the most new renewals held and can accept lower value each. The deep-dive tab shows each one's segments + guardrail checks before you stage it.
            <Ev items={polEv(f)} /></>
        ) },
      { keys: ["guardrail", "suitability", "risk", "compliance", "fairlending", "safe", "fairness"],
        head: "Every policy shown already passes the guardrails.",
        body: () => (
          <>Suitability margin, fair-lending (no operationally-loyal bundled households priced away), model-risk approval, and the fraud envelope are hard constraints — any policy that breaches them never reaches this list. The deep-dive shows each policy's margins against the floors.</>
        ) },
      { keys: ["8 week", "8-week", "12 month", "12-month", "leakage", "balances", "conversion rate", "relationships"],
        head: "The metrics, briefly.",
        body: () => (
          <><b>12-month net value</b> is the business case; the <b>8-week</b> figure is the test-window run-rate. <b>Funded conversion</b> = treated customers who open a held renewal; <b>NWP protected</b> = dollars routed into yield; <b>lapse</b> = the % still walking out vs the BAU lapse rate. All move with the incentive.</>
        ) },
    ],
  },

  /* ---------------- What-If single-play RESULTS -------------------------- */
  "whatif-results": {
    label: "Simulation results",
    seed: () => (
      <>
        <div className="head">Here's your simulated play.</div>
        These are the projected outcomes for the exact levers you set. Ask me to <b>explain the numbers</b>, whether it's a <b>good outcome</b>, or <b>what would improve it</b>.
      </>
    ),
    presets: [
      "Explain this result",
      "What drove these numbers?",
      "Is this a good outcome?",
      "What would improve it?",
      "What are the guardrails saying?",
    ],
    answers: [
      { keys: ["explain", "this result", "the numbers", "what am i looking", "overview", "walk me"],
        head: "Your configuration, projected over the pilot.",
        body: () => (
          <>This is a single what-if play — the outcomes follow directly from the levers you set: who's in the cohort, the LTV gate, the per-product offers, and the channels. The KPIs are the projected save-rate, balances, value, and leakage for that exact configuration, with a confidence interval from the pilot.</>
        ) },
      { keys: ["drove", "factor", "influence", "these numbers", "determines", "come from"],
        head: "The levers above drive every KPI.",
        body: () => (
          <>Bigger cohort + lower LTV gate → more treated customers. Higher per-product offers → higher conversion + balances, but more rate give-up (thinner margin) and more leakage defended. The blended uplift across your selected products is what moves conversion; the products themselves set the per-segment routing.</>
        ) },
      { keys: ["good", "is this good", "strong", "bad", "verdict", "should i"],
        head: "Read it against the guardrails + the value.",
        body: () => (
          <>A good play clears the suitability + profitability floors (the verdict badge) and lands positive net value. If the verdict is amber/red, the offer is likely too rich for the margin or the cohort too broad — tighten the LTV gate or trim the incentive and re-run.</>
        ) },
      { keys: ["improve", "better", "increase", "optimi", "more value", "higher"],
        head: "Try the optimizer, or move the highest-leverage lever.",
        body: () => (
          <>The fastest path is the <b>If-What optimizer</b> — give it your objective + ranges and it finds the best policy for you. Manually: raise the offer only on the price-elastic segments, tighten the LTV gate to drop low-value customers, and focus channels on the responsive cohorts. Re-run to compare.</>
        ) },
      { keys: ["guardrail", "risk", "suitability", "compliance", "fairlending", "profitability"],
        head: "The guardrail strip is the safety check.",
        body: () => (
          <>Suitability margin, fair-lending, model-risk, and fraud are checked live. Green means the play is inside every constraint; if one trips, the offer or cohort is pushing past a policy floor and the play shouldn't ship as-is.</>
        ) },
    ],
  },

  /* ---------------- Experiment CONFIG (levers) -------------------------- */
  "ifwhat-config": {
    label: "Optimizer setup",
    seed: () => (
      <>
        <div className="head">Set the goal and the space to search.</div>
        You're configuring the optimizer: pick the <b>objective</b>, the <b>cohort</b>, the offer <b>ranges</b> it may sweep, and the allowed products/channels. Ask me what any lever does or where to start.
      </>
    ),
    presets: [
      "What does each lever do?",
      "What's a good starting point?",
      "How does the cohort change the result?",
      "What's the custom segment for?",
      "What do the offer ranges mean?",
    ],
    answers: [
      { keys: ["lever", "each lever", "controls", "what does", "sections", "settings"],
        head: "Objective · cohort · eligibility · offer ranges · channels.",
        body: () => (
          <>The <b>objective</b> is what the optimizer maximises. The <b>cohort</b> is who's in scope. <b>Eligibility</b> is the minimum household-LTV floor to qualify. <b>Product × Offer</b> sets, per product, the incentive <em>range</em> the optimizer may test. <b>Channels</b> are the delivery methods it may use. Everything downstream derives from these.</>
        ) },
      { keys: ["start", "starting point", "default", "recommend", "what should i set", "good config"],
        head: "Start from the recommended hypothesis, then narrow.",
        body: () => (
          <>The defaults are seeded from the hypothesis you chose to test, so they're already sensible. Run once to see the three policies, then tighten an offer range or change the cohort to explore — the results re-rank as you go.</>
        ) },
      { keys: ["cohort", "customer", "who", "segment", "population", "change the result"],
        head: "The cohort sets the treated population.",
        body: () => (
          <>A bigger cohort scales the absolute numbers (more relationships, more balances); a tighter, higher-intent cohort lifts the conversion rate but on fewer people. The optimizer optimises the offer <em>within</em> whoever you select.</>
        ) },
      { keys: ["custom segment", "rule", "build", "fetch", "custom"],
        head: "Build a cohort from rules instead of a preset.",
        body: () => (
          <>The custom segment is a parallel path: AND a few rules (e.g. idle balance ≥ $10K · products held ≤ 1), click <b>Fetch details</b> for the count, then <b>Use this segment</b> — it replaces the preset cohort for the run. Tighter rules → fewer customers.</>
        ) },
      { keys: ["offer range", "range", "uplift", "bps", "product x offer", "incentive"],
        head: "Per-product incentive ranges the optimizer sweeps.",
        body: () => (
          <>Each selected product has a low–high bps range (over the current renewal premium). The optimizer tests incentives inside those ranges and each policy lands at a different point — lower for margin, higher for conversion. Deselect a product to remove it from every policy.</>
        ) },
    ],
  },
  "whatif-config": {
    label: "Scenario setup",
    seed: () => (
      <>
        <div className="head">Configure the play, then Run.</div>
        Set the cohort, the eligibility gate, the per-product offers, and the channels — the simulation updates live. Ask me what any lever does or what a sensible setting is.
      </>
    ),
    presets: [
      "What does each lever do?",
      "What's a sensible starting offer?",
      "How does the cohort change the result?",
      "What's the custom segment for?",
    ],
    answers: [
      { keys: ["lever", "each lever", "what does", "controls", "settings", "sections"],
        head: "Cohort · eligibility · product × offer · channels.",
        body: () => (
          <>The <b>cohort</b> is who's in scope; <b>eligibility</b> is the minimum household-LTV floor; <b>Product × Offer</b> sets the incentive per product over the current renewal premium; <b>channels</b> are how it's delivered. The result tiles recompute as you move any of them.</>
        ) },
      { keys: ["start", "sensible", "offer", "default", "what should", "good"],
        head: "Keep the recommended offer, tune from there.",
        body: () => (
          <>The defaults come from the hypothesis you're testing. Nudge a single product's offer or the LTV gate and watch the KPIs + verdict move — the goal is the smallest incentive that still converts.</>
        ) },
      { keys: ["cohort", "customer", "who", "population", "change"],
        head: "Cohort sets the treated population.",
        body: () => (
          <>Bigger cohort → larger absolute outcomes; tighter/higher-intent cohort → higher conversion on fewer people. You're tuning the offer for whoever you select.</>
        ) },
      { keys: ["custom segment", "rule", "fetch", "custom", "build"],
        head: "Rule-defined cohort, parallel to the presets.",
        body: () => (
          <>AND a few attribute rules, <b>Fetch details</b> for the count, then <b>Use this segment</b> to run on it instead of a preset. Tighter values → fewer customers.</>
        ) },
    ],
  },

  /* ---------------- Analyze / hypothesis page --------------------------- */
  "analyze": {
    label: "Hypothesis",
    seed: () => (
      <>
        <div className="head">This is the recommended hypothesis.</div>
        The page lays out who it targets, the data + models behind it, and the drivers that surfaced it. Ask me to explain it, why it's recommended, or what the evidence is.
      </>
    ),
    presets: [
      "Explain this hypothesis",
      "Why is this recommended?",
      "What's the evidence behind it?",
      "What are the alternatives?",
    ],
    answers: [
      { keys: ["explain", "this hypothesis", "what is", "the bet", "summary"],
        head: "Hold genuinely price-elastic renewals with the smallest action that works.",
        body: () => (
          <>The bet: a slice of high-LTV, claims-free auto customers are shopping their renewal because a broad-brush rate action hit them uniformly. Hold them with the right action — a capped rate, a retention offer, a deductible-adjusted premium, or a bundle nudge — at the minimum incentive that saves the policy, while leaving the operationally-loyal bundled majority alone.</>
        ) },
      { keys: ["why", "recommended", "best", "surfaced", "chose this"],
        head: "Highest protectable NWP behind a fair-lending gate.",
        body: () => (
          <>It scores highest on protectable premium while the elasticity model cleanly separates genuinely price-elastic shoppers from operationally-loyal bundled households — so it's both the biggest opportunity and the one we can act on without a disparate-impact / fair-lending failure.</>
        ) },
      { keys: ["evidence", "data", "proof", "signal", "drivers", "models"],
        head: "Engagement drop, competitor quote-shopping, and coverage-reduction requests.",
        body: () => (
          <>The drivers: a &gt;20% digital-engagement decline, captured competitor quote-requests ~45 days pre-renewal, coverage-reduction requests, and an elevated shopping-propensity decile — with a loyalty gate that flags which renewals are genuinely elastic. The Data + Models chapter lists every composed asset.</>
        ) },
      { keys: ["alternative", "other", "different", "options", "three", "cards"],
        head: "Three framings — test any of them.",
        body: () => (
          <>The signal cards offer three ways to act: defend the elastic shoppers with a capped rate + retention offer (recommended), re-engage the silent pre-shoppers on value before they shop, or run an agent save-call on the highest-value households. Each leads into the same test flow seeded with its own focus.</>
        ) },
    ],
  },
};

/* Page ids that should fall through to the global CEO/strategic KB. */
export const GENERAL_PAGES = new Set([null, "cockpit"]);
