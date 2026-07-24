/* ============================================================================
   Micro-segment engine — turns the SAME aggregate recommendation into a
   per-segment breakdown that is CONTEXTUAL to the input configuration.

   deriveSegments(model, lever, outcomes) returns { rows, rollup } where:
     - rows appear only for the cohorts the user selected   (contextual to cohort)
     - each row's rate  = base offer × the segment's rate-factor, capped at the
       offer ceiling                                          (contextual to rate)
     - each row's channel = its preferred channel that the user actually allowed
       (else the first allowed channel)                       (contextual to channel)
     - each row's product = the system's per-segment best product
     - per-segment value (niiM) sums EXACTLY to outcomes.retainedM, and size sums
       to the reached population — so the table reconciles to the aggregate KPIs.

   No matter the input combination, the output is generated from it.
   ========================================================================= */

/* Each master segment:
   parent     — the input cohort id it decomposes from (filter key)
   name       — plain micro-segment name
   need       — one-line "why this move"
   product    — ordered product-id preference (system picks the first available)
   channel    — ordered channel-id preference (picks first the user allowed)
   rateFactor — multiplier on the base offer; high-flight segments get more,
                sticky ones less; 0 = a non-rate move (re-engagement)
   weight     — relative size + value basis used to split the cohort + the value */

/* offerFrac = each segment's own point WITHIN its product's [low,high] offer
   range at the Balanced posture (frac 0.72). The per-segment offer scales this
   by policy.frac/0.72 (see deriveSegments), so the three policies differ and
   the offers move with the sliders. */
export const LIQUIDITY_SEGMENTS = [
  { parent: "yield-exposed", name: "Rate-responsive · high balance", need: "Large, actively shopping — worth a banker and a stronger rate.",
    product: ["cd_7mo", "hy_savings"], channel: ["banker", "app"], rateFactor: 1.4, weight: 0.40, offerFrac: 0.7714 },
  { parent: "yield-exposed", name: "Rate-responsive · standard", need: "Shopping but smaller — a scaled digital offer holds them.",
    product: ["hy_savings", "cd_7mo"], channel: ["app", "email"], rateFactor: 1.1, weight: 0.60, offerFrac: 0.5333 },
  { parent: "dormant-saver", name: "Dormant savers", need: "Untouched, not yet shopping — a low-cost sweep captures yield cheaply.",
    product: ["money_market", "cd_7mo"], channel: ["email", "app"], rateFactor: 0.6, weight: 1.0, offerFrac: 0.4000 },
  { parent: "high-value", name: "High-value flight risk", need: "Top flight decile — defend with a banker and a strong, capped rate.",
    product: ["cd_7mo", "hy_savings"], channel: ["banker"], rateFactor: 1.6, weight: 1.0, offerFrac: 1.0 },
  { parent: "long-tenured", name: "Long-tenured holders", need: "Loyal, unlikely to leave — a modest CD rewards loyalty without overpaying.",
    product: ["cd_7mo", "smart_savings"], channel: ["email", "banker"], rateFactor: 0.9, weight: 1.0, offerFrac: 0.4571 },
  { parent: "multi-product", name: "Multi-product shoppers", need: "Want yield with liquidity — high-yield savings, not a lock-up.",
    product: ["hy_savings", "money_market"], channel: ["app", "email"], rateFactor: 1.3, weight: 1.0, offerFrac: 0.6889 },
];

/* Wealth Attach micro-segments. parent = advice-ready sub-cohort the user can
   select; rateFactor here is a VALUE-WEIGHT index (conversion × AUM-richness)
   that splits the incremental AUM; convPct is the segment's display conversion
   rate (read directly by the wealth views). Motions are non-rate "products". */
export const WEALTH_SEGMENTS = [
  { parent: "relationship-deep", name: "Advice-ready · relationship-deep", need: "Deep banking, clear wealth gap — a portfolio review converts the trust at scale.",
    product: ["portfolio_review"], channel: ["email", "fa"], rateFactor: 4.5, weight: 0.65, convPct: 4.5 },
  { parent: "relationship-deep", name: "Pre-retirement · rollover-intent", need: "Retirement-age, rollover-minded — a retirement-readiness review meets a real need.",
    product: ["portfolio_review", "senior_fa"], channel: ["fa", "email"], rateFactor: 5.4, weight: 0.35, convPct: 5.1 },
  { parent: "high-aum", name: "High-AUM · high-readiness", need: "Highest potential — worth scarce senior-FA capacity.",
    product: ["senior_fa", "portfolio_review"], channel: ["fa", "phone"], rateFactor: 8.8, weight: 0.55, convPct: 6.8 },
  { parent: "high-aum", name: "External-mover · transfers firing", need: "Assets leaving now — a pre-emptive review, fast-tracked, before they commit.",
    product: ["portfolio_review", "senior_fa"], channel: ["fa", "app"], rateFactor: 6.2, weight: 0.45, convPct: 5.6 },
  { parent: "digital", name: "Digitally-engaged planners", need: "Curious in-app — start digital, escalate the ones who lean in.",
    product: ["digital_starter", "portfolio_review"], channel: ["app", "email"], rateFactor: 2.2, weight: 1.0, convPct: 3.2 },
  { parent: "branch-trust", name: "Branch-trust segment", need: "Existing banker trust — a warm banker-to-FA handoff lands best.",
    product: ["banker_handoff"], channel: ["banker"], rateFactor: 2.9, weight: 1.0, convPct: 4.9 },
  { parent: "early-stage", name: "Early-stage affluent", need: "Above threshold, low intent — nurture with education before any advisor time.",
    product: ["education"], channel: ["email", "app"], rateFactor: 0.8, weight: 1.0, convPct: 1.5 },
];

export const RETENTION_SEGMENTS = [
  { parent: "rate-sensitive", name: "Rate-driven · high balance", need: "Genuinely rate-driven and large — the minimum-effective rate, banker-led.",
    product: ["cd_12mo", "cd_18mo"], channel: ["banker", "app"], rateFactor: 1.4, weight: 0.40 },
  { parent: "rate-sensitive", name: "Rate-driven · standard", need: "Sensitive but smaller — a scaled digital rate offer holds them cheaply.",
    product: ["cd_12mo", "cd_6mo"], channel: ["app", "email"], rateFactor: 1.0, weight: 0.60 },
  { parent: "operating-decliner", name: "Primacy slipping", need: "Leaving because payroll/bill-pay are thinning — re-engage, don't pay rate.",
    product: ["reengage", "cd_6mo"], channel: ["app", "banker"], rateFactor: 0.0, weight: 1.0 },
  { parent: "high-value", name: "High-value at risk", need: "Top attrition decile — a banker-negotiated rate, capped.",
    product: ["cd_18mo", "cd_12mo"], channel: ["banker"], rateFactor: 1.5, weight: 1.0 },
  { parent: "long-tenured", name: "Long-tenured savers", need: "Loyal, eroding slowly — a modest rate rewards them without overpaying.",
    product: ["cd_12mo", "cd_6mo"], channel: ["email", "banker"], rateFactor: 0.8, weight: 1.0 },
  { parent: "multi-product", name: "Relationship-anchorable", need: "Multi-product — a relationship rate conditional on keeping payroll on-us.",
    product: ["cd_trade_up_24", "cd_12mo"], channel: ["banker", "app"], rateFactor: 0.6, weight: 1.0 },
];

/* Friendly product labels (fallback to the id if not mapped). */
const PRODUCT_LABEL = {
  cd_7mo: "7-mo CD", hy_savings: "High-yield savings", money_market: "Money-market sweep",
  smart_savings: "Smart Savings", cd_6mo: "6-mo CD", cd_12mo: "12-mo CD", cd_18mo: "18-mo CD",
  cd_trade_up_24: "Relationship rate", reengage: "Re-engage primacy (no rate)",
  // Wealth-attach motions (non-rate "products")
  portfolio_review: "Portfolio review", senior_fa: "Senior FA 1:1", banker_handoff: "Banker→FA handoff",
  education: "Educational nudge", digital_starter: "Digital wealth starter",
};
const CHANNEL_LABEL = { app: "In-app", email: "Email", banker: "Banker", mail: "Direct mail", rm: "RM", fa: "FA outreach", phone: "Phone", branch: "Branch" };

/* Competitive MARKET rate per product (June 2026, verified ranges). The offer
   is anchored PER PRODUCT — a CD and a high-yield savings trade in different
   markets — and the effective rate = this market + the per-product uplift bps.
   One value per product (a 12-mo CD is a 12-mo CD across use cases). */
export const PRODUCT_MARKET = {
  cd_7mo: 4.05, cd_6mo: 4.10, cd_12mo: 3.95, cd_18mo: 3.95, cd_trade_up_24: 3.85,
  hy_savings: 3.80, elite_mma: 3.80, money_market: 3.55, smart_savings: 3.40, reengage: 0,
};

const firstAllowed = (prefs, allowed, fallbackPool) => {
  for (const p of prefs) if (allowed.includes(p)) return p;
  return allowed[0] || fallbackPool[0] || prefs[0];
};

/* model: { segments, cohortCounts, heldBackLabel, heldBackShare }
   lever: { cohortPresets[], offerCeilingBps, channels[] }
   outcomes: { eligibleN, retainedM }  (the aggregate the rows must sum to) */
export function deriveSegments(model, lever, outcomes) {
  const { segments, cohortCounts } = model;
  const allCohorts = Object.keys(cohortCounts).filter((c) => c !== "full" && c !== "all");
  // "full" (idle cash / deposits) and "all" (wealth) are both all-cohorts sentinels.
  const presets = lever.cohortPresets || [];
  const sel = presets.includes("full") || presets.includes("all") || !presets.length
    ? allCohorts
    : presets.filter((c) => c !== "full" && c !== "all");
  const active = segments.filter((s) => sel.includes(s.parent));
  if (!active.length) return { rows: [], rollup: { reach: 0, retainedM: 0, blendedBps: 0, heldBack: 0 } };

  // per-parent weight totals, so multiple children split their cohort's count
  const parentWeight = {};
  active.forEach((s) => { parentWeight[s.parent] = (parentWeight[s.parent] || 0) + s.weight; });

  const ceiling = lever.offerCeilingBps != null ? lever.offerCeilingBps : 20;
  // The chosen ceiling is a HARD max. The highest-need segment in the model
  // anchors to it; every other segment scales below by its rate-factor — so no
  // segment is ever offered more than the ceiling the user set.
  const maxFactor = Math.max(...segments.map((s) => s.rateFactor)) || 1;
  const channels = (lever.channels && lever.channels.length) ? lever.channels : ["app"];
  // Products the user actually allowed: an explicit list (If-What multi-select),
  // a single chosen product (What-If offerTerm), else every product. Each segment
  // then picks its most-preferred product FROM that set — so selecting/limiting
  // products genuinely changes the recommended-product column.
  // Per-product offer model (idle cash): lever.productOffers = { productId: bps }
  // (a [low,high] range collapses to its midpoint for the deep-dive). Each segment
  // takes the offer of ITS assigned product, anchored to that product's market.
  // Falls back to the legacy single-ceiling model (retention, until migrated).
  const productOffers = (lever.productOffers && Object.keys(lever.productOffers).length) ? lever.productOffers : null;
  const offerBpsFor = (id) => {
    const o = productOffers[id];
    return Array.isArray(o) ? Math.round((o[0] + o[1]) / 2) : (o || 0);
  };
  const allowedProducts = productOffers ? Object.keys(productOffers)
    : (lever.products && lever.products.length) ? lever.products
    : (lever.offerTerm ? [lever.offerTerm] : Object.keys(PRODUCT_LABEL));

  // Held-back share is carved OUT of the cohort (suitability / will-stay
  // exclusions), so the per-segment sizes + held-back sum back to the cohort —
  // they must not exceed it.
  const hbShare = model.heldBackShare || 0.05;
  // raw size + value-weight per segment
  const raw = active.map((s) => {
    const size = Math.round((cohortCounts[s.parent] || 0) * (s.weight / parentWeight[s.parent]) * (1 - hbShare));
    // No-rate segments (re-engagement) keep their own action product (e.g.
    // "reengage") rather than being forced into a selected rate product.
    const productId = s.rateFactor === 0 ? s.product[0] : firstAllowed(s.product, allowedProducts, s.product);
    const channelId = firstAllowed(s.channel, channels, channels);
    // Offer bps. When the offer is a RANGE and the segment carries an offerFrac
    // (+ a policy multiplier), each segment sits at its OWN point in the range —
    // scaled by lever.offerMult (policy posture); otherwise per-product midpoint;
    // else the legacy need-scaled ceiling (rounded to 5 bps).
    const offerRange = productOffers ? productOffers[productId] : null;
    const rateBps = s.rateFactor === 0 ? 0
      : (Array.isArray(offerRange) && s.offerFrac != null && lever.offerMult != null)
        ? Math.round(Math.max(offerRange[0], Math.min(offerRange[1],
            offerRange[0] + Math.min(1, s.offerFrac * lever.offerMult) * (offerRange[1] - offerRange[0]))))
      : productOffers ? offerBpsFor(productId)
      : Math.min(Math.round(ceiling * (s.rateFactor / maxFactor) / 5) * 5, ceiling);
    const marketRate = productOffers ? (PRODUCT_MARKET[productId] ?? null) : null;
    const valueW = size * (0.4 + s.rateFactor);   // bigger + higher-need = more value at stake
    return { name: s.name, need: s.need, parent: s.parent, size, rateBps, valueW, marketRate,
      convPct: s.convPct,   // wealth: display conversion rate, passed through to the table
      product: PRODUCT_LABEL[productId] || productId,
      channel: CHANNEL_LABEL[channelId] || channelId, noRate: s.rateFactor === 0 };
  });

  // Optional reach target: scale the segment sizes so the reached population
  // equals the ACTUAL treated count the optimizer produced (treatmentN) — this
  // keeps the micro-table + the "Treated" KPI from ever exceeding the cohort,
  // and reconciles them with the config. Proportions (and therefore value mix
  // + blended bps) are untouched, so only the absolute counts rescale.
  const reachTarget = outcomes && Number(outcomes.reachTarget);
  if (reachTarget > 0) {
    const rawReach = raw.reduce((a, r) => a + r.size, 0) || 1;
    const f = reachTarget / rawReach;
    raw.forEach((r) => { r.size = Math.max(0, Math.round(r.size * f)); });
  }

  const sumValue = raw.reduce((a, r) => a + r.valueW, 0) || 1;
  const totalRetainedM = outcomes.retainedM || 0;
  const rows = raw.map((r) => ({ ...r, niiM: +(totalRetainedM * (r.valueW / sumValue)).toFixed(1) }));

  const reach = rows.reduce((a, r) => a + r.size, 0);
  const blendedBps = reach ? Math.round(rows.reduce((a, r) => a + r.rateBps * r.size, 0) / reach) : 0;
  // Reach-weighted blended MARKET across rated rows — so a blended effective rate
  // (blendedMarket + blendedBps/100) is meaningful when products differ.
  const ratedRows = rows.filter((r) => r.marketRate != null && !r.noRate);
  const ratedReach = ratedRows.reduce((a, r) => a + r.size, 0);
  const blendedMarket = ratedReach
    ? +(ratedRows.reduce((a, r) => a + r.marketRate * r.size, 0) / ratedReach).toFixed(2)
    : null;
  const heldBack = Math.round(reach * hbShare / (1 - hbShare));   // reach + heldBack = cohort

  return {
    rows,
    heldBack: { label: model.heldBackLabel || "Held back (no offer)", size: heldBack },
    rollup: { reach, retainedM: +totalRetainedM.toFixed(1), blendedBps, blendedMarket, heldBack },
  };
}
