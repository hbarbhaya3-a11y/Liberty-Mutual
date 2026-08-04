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

/* Retention (retail / auto-renewal) micro-segments — insurance context.
   noticeDays = the segment's preferred renewal-notice lead(s); deriveSegments
   picks the first that the user actually allowed on the TIMING lever, so the
   reach-out day varies per segment the same way product/channel do. */
/* Retention (retail / auto-renewal) micro-segments — insurance context.
   noticeDays = the segment's preferred renewal-notice lead(s); deriveSegments
   picks the first that the user actually allowed on the TIMING lever, so the
   reach-out day varies per segment the same way product/channel do. */
export const RETENTION_SEGMENTS = [
  { parent: "rate-sensitive", name: "Shopping-elastic · Multi-vehicle Auto", need: "Actively comparing quotes on a multi-vehicle household auto policy — capped renewal rate + digital offer.",
    product: ["cd_18mo", "cd_12mo"], bundles: ["auto_home"], channel: ["banker", "app"], noticeDays: [60, 45], rateFactor: 1.4, weight: 0.25 },
  { parent: "rate-sensitive", name: "Shopping-elastic · Standard Auto", need: "Price-comparing single-vehicle auto policy — scaled rate cap holds them efficiently.",
    product: ["cd_12mo", "cd_6mo"], bundles: [], channel: ["app", "email"], noticeDays: [45, 35], rateFactor: 1.0, weight: 0.35 },
  { parent: "rate-sensitive", name: "Recent Claim · Rate-Sensitive Policy", need: "Received rate increase following a recent claim — requires dedicated agent consultation & deductible restructuring.",
    product: ["elite_mma", "cd_12mo"], bundles: [], channel: ["banker"], noticeDays: [60], rateFactor: 1.3, weight: 0.20 },
  { parent: "rate-sensitive", name: "Digital-First Renewal Shopper", need: "High portal activity and online quote checks — target with app notification and rate lock.",
    product: ["cd_12mo", "cd_6mo"], bundles: ["auto_home"], channel: ["app", "email"], noticeDays: [35, 45], rateFactor: 1.1, weight: 0.20 },

  { parent: "operating-decliner", name: "Disengaging · Pre-Shopper", need: "Lapsing because engagement is thinning — re-engage on value early, don't cut price.",
    product: ["reengage", "cd_6mo"], bundles: [], channel: ["app", "banker"], noticeDays: [60, 45], rateFactor: 0.7, weight: 0.50 },
  { parent: "operating-decliner", name: "Paperless Low-Touch Renewal", need: "Auto-pay enabled but zero brand touchpoints in 12 months — gentle renewal value summary.",
    product: ["reengage", "smart_savings"], bundles: [], channel: ["email", "app"], noticeDays: [45, 35], rateFactor: 0.6, weight: 0.50 },

  { parent: "high-value", name: "High-Value Household at Risk", need: "Top attrition decile with multi-policy exposure — agent-negotiated capped rate before competitor binding.",
    product: ["cd_18mo", "cd_12mo"], bundles: ["auto_home"], channel: ["banker"], noticeDays: [60], rateFactor: 1.5, weight: 0.60 },
  { parent: "high-value", name: "Senior Preferred · Low Mileage", need: "Long-term safe driver with low annual mileage — telematics safety credit + priority support.",
    product: ["smart_savings", "cd_12mo"], bundles: ["auto_life"], channel: ["banker", "mail"], noticeDays: [60, 45], rateFactor: 1.2, weight: 0.40 },

  { parent: "long-tenured", name: "Tenured Loyalist · Single Policy", need: "5+ years tenure on single Auto policy — loyalty discount tier rewards tenure without overpaying.",
    product: ["smart_savings", "cd_12mo"], bundles: [], channel: ["email", "mail"], noticeDays: [45, 35], rateFactor: 0.8, weight: 0.50 },
  { parent: "long-tenured", name: "Suburban Family Preferred", need: "Mid-tenure family with home & auto — premium tier restructuring to protect relationship.",
    product: ["cd_12mo", "elite_mma"], bundles: ["auto_home"], channel: ["banker", "email"], noticeDays: [45], rateFactor: 0.9, weight: 0.50 },

  { parent: "multi-product", name: "Bundle-Anchorable Auto & Home", need: "Multi-policy household — relationship discount contingent on keeping Auto + Home bundle intact.",
    product: ["cd_trade_up_24", "cd_12mo"], bundles: ["auto_home"], channel: ["banker", "app"], noticeDays: [45], rateFactor: 0.8, weight: 0.35 },
  { parent: "multi-product", name: "Renters-to-Auto Cross-Sell Target", need: "Renters policyholder with vehicle in household — contingent Auto quote discount.",
    product: ["smart_savings", "cd_6mo"], bundles: ["renters_auto"], channel: ["app", "email"], noticeDays: [35, 45], rateFactor: 0.7, weight: 0.25 },
  { parent: "multi-product", name: "Auto-to-Life Cross-Sell Candidate", need: "Life-stage event detected — contingent Ethos life insurance offer at renewal moment.",
    product: ["cd_12mo", "smart_savings"], bundles: ["auto_life"], channel: ["email", "banker"], noticeDays: [45, 60], rateFactor: 0.6, weight: 0.20 },
  { parent: "multi-product", name: "Umbrella & Preferred Risk Premier", need: "High net-worth multi-line policyholder — comprehensive coverage restructuring & agent touchpoint.",
    product: ["cd_trade_up_24", "cd_18mo"], bundles: ["auto_home", "auto_life"], channel: ["banker"], noticeDays: [60], rateFactor: 1.1, weight: 0.20 },
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

/* Retention (retail / auto-renewal) label overrides — the SAME product/channel
   ids carry insurance-context labels here so the recommendation table speaks
   our language (rate caps, Comparion agents) instead of the banking defaults
   (CDs, bankers). Passed in via model.productLabels / model.channelLabels. */
export const RETENTION_PRODUCT_LABEL = {
  cd_6mo: "Rate cap", cd_12mo: "Discount", cd_18mo: "Combined — rate cap + discount",
  cd_trade_up_24: "Multi-year rate lock", elite_mma: "Deductible-adjusted", smart_savings: "Loyalty discount tier",
  reengage: "Re-engage on value (no rate)",
};
export const RETENTION_CHANNEL_LABEL = {
  app: "App / portal", email: "Email", mail: "Direct mail", banker: "Comparion agent",
};

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
  // Label maps default to the banking labels; a model can override them with
  // context-specific labels (e.g. retention → insurance rate caps / Comparion).
  const productLabelMap = model.productLabels || PRODUCT_LABEL;
  const channelLabelMap = model.channelLabels || CHANNEL_LABEL;
  // Allowed reach-out leads the user selected on the TIMING lever (multi-select
  // + custom). Each segment then picks its most-preferred lead FROM that set —
  // so the recommended reach-out day genuinely varies per segment.
  const allowedNoticeDays = (lever.noticeDays && lever.noticeDays.length) ? lever.noticeDays : null;
  const noticeDayFor = (seg) => {
    if (!allowedNoticeDays) return seg.noticeDays ? seg.noticeDays[0] : null;
    const pref = (seg.noticeDays || []).find((d) => allowedNoticeDays.includes(d));
    return pref != null ? pref : allowedNoticeDays[0];
  };
  const allCohorts = Object.keys(cohortCounts).filter((c) => c !== "full" && c !== "all");
  // "full" (idle cash / deposits) and "all" (wealth) are both all-cohorts sentinels.
  const presets = lever.cohortPresets || [];
  const isRetentionModel = segments === RETENTION_SEGMENTS;
  const sel = presets.includes("full") || presets.includes("all") || !presets.length || isRetentionModel
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

    const BUNDLE_MAP = { auto_home: "Auto → Home", auto_life: "Auto → Life (Ethos)", renters_auto: "Renters → Auto" };
    const bundleOffersMap = lever.bundleOffers || null;
    const allowedBundleIds = bundleOffersMap ? Object.keys(bundleOffersMap) : (lever.bundles || []);

    const segBundles = s.bundles;
    let bundleText = "—";
    if (Array.isArray(segBundles) && segBundles.length > 0) {
      const matchId = segBundles.find((id) => allowedBundleIds.includes(id));
      if (matchId) {
        const bName = BUNDLE_MAP[matchId] || matchId;
        const rng = bundleOffersMap ? bundleOffersMap[matchId] : null;
        bundleText = Array.isArray(rng) ? `${bName} (-${Math.round((rng[0] + rng[1]) / 2)} bps)` : bName;
      }
    } else if (segBundles === undefined && allowedBundleIds.length > 0 && s.rateFactor > 1.2) {
      const defaultId = allowedBundleIds[0];
      const bName = BUNDLE_MAP[defaultId] || defaultId;
      const rng = bundleOffersMap ? bundleOffersMap[defaultId] : null;
      bundleText = Array.isArray(rng) ? `${bName} (-${Math.round((rng[0] + rng[1]) / 2)} bps)` : bName;
    }

    // Per-product qualifiers surfaced at the micro-segment level. The loyalty
    // tier carries the relationship (tenure) band it applies to; the
    // deductible-adjusted offer carries the deductible % we set against
    // coverage (insurance-context lever). Both flow from the pricing levers.
    let productDisplay = productLabelMap[productId] || productId;
    if (productId === "smart_savings" && lever.loyaltyTenure != null) {
      const lt = lever.loyaltyTenure;
      productDisplay += Array.isArray(lt) ? ` · ${lt[0]}–${lt[1]}y relationship` : ` · ${lt}y+ relationship`;
    }
    if (productId === "elite_mma" && lever.deductiblePct != null) {
      const dp = lever.deductiblePct;
      productDisplay += Array.isArray(dp) ? ` · ${dp[0]}–${dp[1]}% deductible` : ` · ${dp}% deductible`;
    }
    if (productId === "cd_trade_up_24" && lever.lockYears != null) {
      const ly = lever.lockYears;
      productDisplay += Array.isArray(ly) ? ` · ${ly[0]}–${ly[1]}y lock` : ` · ${ly}y lock`;
    }

    return { name: s.name, need: s.need, parent: s.parent, size, rateBps, valueW, marketRate,
      convPct: s.convPct,   // wealth: display conversion rate, passed through to the table
      reachOutDays: noticeDayFor(s),   // retention: per-segment renewal-notice lead
      product: productDisplay,
      bundle: bundleText,
      channel: channelLabelMap[channelId] || channelId, noRate: s.rateFactor === 0 };
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
  // NWP protected cannot be zero for active micro-segments (only heldBack "Will-stay & already-gone" shows $0)
  const rows = raw.map((r) => {
    const val = totalRetainedM * (r.valueW / sumValue);
    const niiM = Math.max(0.1, +val.toFixed(1));
    return { ...r, niiM };
  });

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
