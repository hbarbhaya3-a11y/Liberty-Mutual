/* ============================================================================
   LiquidityIfWhatView — If-What (goal-driven optimization) for idle-cash
   liquidity activation.

   Mirrors gig's IfWhatConfig + IfWhatResults conceptually:
     CONFIG:
       1. GOAL (radio cards)
       2. CUSTOMER (cohort radio cards)
       3. ELIGIBILITY (dual-range sliders for numeric levers)
       4. OFFER (dual-range for rate + multi-checkbox for products allowed)
       5. CHANNEL (multi-checkbox for channels allowed)
       6. CONSTRAINTS (collapsed, read-only)
     RESULTS:
       Two-column: top-3 rec cards (left) + Pareto chart (right)
       Clicking a rec opens a deep-dive panel below
   ========================================================================= */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAppShell } from "@/state/AppShell";
import { useSetPageContext } from "@/state/pageContext";
import SimulationLoader from "@/components/loaders/SimulationLoader";
import Icon from "@/components/Icon";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import SegmentedResults from "@/components/SegmentedResults";
import { LIQUIDITY_SEGMENTS, deriveSegments, PRODUCT_MARKET } from "@/data/segmentModels";
import RangeWithBubble from "@/components/RangeWithBubble";
import CustomSegmentBuilder from "@/components/CustomSegmentBuilder";
import { RULE_ATTRS } from "@/data/customSegment";
import {
  LIQUIDITY_HYPOTHESIS_ID,
  LIQUIDITY_HYPOTHESIS_TITLE,
  LIQUIDITY_CALIBRATION,
  liquidityHypothesis,
} from "@/data/liquidityConfig";
import "@/styles/ifwhat.css";

const PAGE_SUBTITLE = LIQUIDITY_HYPOTHESIS_TITLE;

/* Micro-segment model for the deep-dive's "By micro-segment" tab. */
const LIQ_SEG_MODEL = {
  segments: LIQUIDITY_SEGMENTS,
  cohortCounts: { full: 75000, "yield-exposed": 20000, "dormant-saver": 18000, "high-value": 7000, "long-tenured": 8000, "multi-product": 12000 },
  heldBackLabel: "Operating / emergency buffers",
  heldBackShare: 0.06,
};

/* Objective ordering is deliberate: the problem here is RETENTION, so retention
   is the recommended (default) objective and net interest income is demoted to a
   business KPI, last — NII is the wrong headline goal here. Ids unchanged so the
   optimizer scoring branches keep working. */
const OBJECTIVES = [
  { id: "relationship_value",  label: "Maximize Incremental relationship value" },
  { id: "flight_reduction",    label: "Maximize funded balances" },
  { id: "activation_return",   label: "Maximize funded conversion" },
  { id: "net_interest_income", label: "Maximize 8-week incremental value" },
];

const COHORT_OPTIONS = [
  { id: "full",            name: "Full cohort",             count: 75000, share: 0.095, sig: "Every selected customer showing one or more idle-cash activation signals." },
  { id: "yield-exposed",   name: "Yield-responsive eligible", count: 20000, share: 0.028, sig: "Idle balance >$5K · rate responsive · genuinely surplus cash." },
  { id: "dormant-saver",   name: "Dormant savers",          count: 18000, share: 0.023, sig: "Balance untouched 60d+ · near-zero yield · no high-yield search yet." },
  { id: "high-value",      name: "High-value idle",         count:  7000, share: 0.009, sig: "Idle balance >$85K · top balance decile · single-product depth." },
  { id: "long-tenured",    name: "Long-tenured idlers",     count:  8000, share: 0.010, sig: "10+ years tenure · stable idle balances · low product depth." },
  { id: "multi-product",   name: "Multi-product idlers",    count: 12000, share: 0.015, sig: "3+ products held · idle balances not yet in yield products." },
  { id: "digital-ready",   name: "Digital-ready idlers",    count: 10000, share: 0.013, sig: "App-active · likely to respond to digital savings / MMA offer." },
];

/* Per-product uplift ceiling (maxBps) — the incentive range the optimizer may
   test for each. Rates (PRODUCT_MARKET) are web-verified and left untouched.
   Standard Savings is the optional nurture / fallback. */
const OFFER_PRODUCT_OPTIONS = [
  { id: "hy_savings",   label: "High-yield savings", maxBps: 40 },
  { id: "money_market", label: "Money Market / MMA", maxBps: 35 },
  { id: "cd_7mo",       label: "7-month CD",         maxBps: 25 },
  { id: "cd_12mo",      label: "12-month CD",        maxBps: 30 },
  { id: "cd_18mo",      label: "18-month CD",        maxBps: 30 },
  { id: "smart_savings", label: "Standard Savings",  maxBps: 10, optional: true },
];

const CHANNEL_OPTIONS = [
  { id: "app",    label: "App notification" },
  { id: "email",  label: "Email" },
  { id: "mail",   label: "Direct mail" },
  { id: "banker", label: "Banker outreach" },
];

const ALWAYS_ON_CONSTRAINTS = [
  { id: "suitability",   label: "Suitability margin ≥ 0.85" },
  { id: "liquidity-risk", label: "Liquidity risk · never lock operating/emergency buffers into a term product" },
  { id: "model-risk",    label: "Model risk approved · idle-cash state stable" },
  { id: "fraud",         label: "Fraud envelope · activation-offer Q2 bound" },
];

const DEFAULT_RANGES = {
  minBalanceK:     { low: 5,  high: 60, min: 5,  max: 100, step: 5, unit: "K",   label: "Min idle balance to qualify", caption: "Customers below this aren't worth the activation cost." },
  offerCeilingBps: { low: 20, high: 60, min: 0, max: 80,  step: 5, unit: "bps", label: "Rate uplift ceiling",     caption: "Idle cash earns ~0.05% today · market 4.15% · BPS = increment over market" },
};

/* ----------------------------------------------------------------------------
   DualRange — two-thumb min/max slider. Mirrors gig's IfWhatConfig DualRange
   1:1 so the .iw-dual* styles render identically.
---------------------------------------------------------------------------- */
function DualRange({ min, max, step, low, high, onChange, unit = "", marker, markers }) {
  /* Coerce to numbers — callers may pass formatted strings (e.g. "3.95"). */
  low = Number(low); high = Number(high);
  const setLow = (v) => onChange({ low: Math.min(Number(v), high - step), high });
  const setHigh = (v) => onChange({ low, high: Math.max(Number(v), low + step) });
  const range = max - min;
  const fillLeft = ((low - min) / range) * 100;
  const fillRight = ((high - min) / range) * 100;
  /* Match Chrome's native thumb positioning (thumb-center clamped to
     [thumbWidth/2, W - thumbWidth/2]) so the visible custom thumbs sit
     exactly where the invisible native thumbs receive drag. */
  const thumbCenter = (pct) => `calc(11px + ${pct}% - ${(pct * 0.22).toFixed(3)}px)`;
  const lowAt  = thumbCenter(fillLeft);
  const highAt = thumbCenter(fillRight);
  /* Reference markers — `markers={[{value,label,strong}]}` or legacy `marker`.
     `strong` (e.g. Market) renders boldly in the accent; others render faint. */
  const markerList = (markers && markers.length ? markers : (marker ? [marker] : []))
    .filter((m) => m && m.value != null);
  return (
    <div className="iw-dual">
      <div className="iw-dual-track" />
      <div className="iw-dual-fill" style={{ left: lowAt, right: `calc(100% - ${highAt})` }} />
      {/* Reference markers (e.g. today's / competitor rate). */}
      {markerList.map((m, i) => (
        <div
          key={i}
          className={"iw-dual-marker" + (m.strong ? " strong" : "")}
          style={{ left: thumbCenter(((Number(m.value) - min) / range) * 100) }}
        >
          <span className="iw-dual-marker-l" style={{ left: "50%" }}>{m.label}</span>
        </div>
      ))}
      {/* Custom visible thumbs — opaque, sit on top of the fill so they cap it cleanly. */}
      <div className="iw-dual-thumb iw-dual-thumb-low"  style={{ left: lowAt }} />
      <div className="iw-dual-thumb iw-dual-thumb-high" style={{ left: highAt }} />
      <div className="iw-dual-bubble iw-dual-bubble-low"  style={{ left: lowAt }}>{low}{unit}</div>
      <div className="iw-dual-bubble iw-dual-bubble-high" style={{ left: highAt }}>{high}{unit}</div>
      <input
        type="range" min={min} max={max} step={step} value={low}
        onChange={(e) => setLow(e.target.value)}
        className="iw-dual-input iw-dual-input-low" aria-label="Minimum"
      />
      <input
        type="range" min={min} max={max} step={step} value={high}
        onChange={(e) => setHigh(e.target.value)}
        className="iw-dual-input iw-dual-input-high" aria-label="Maximum"
      />
    </div>
  );
}

/* RangeRow — gig's lever-row + iw-range-pill structure for numeric ranges. */
function RangeRow({ label, caption, unit, min, max, step, low, high, onChange, ticks, marker, markers }) {
  return (
    <div className="lever-row">
      <div className="lever-head">
        <span className="lever-name">{label}</span>
        <span className="iw-range-pill">
          {low}{unit} <span className="iw-range-sep">–</span> {high}{unit}
        </span>
      </div>
      {caption && <div className="lever-caption">{caption}</div>}
      <div className="lever-control">
        <DualRange min={min} max={max} step={step} low={low} high={high} onChange={onChange} unit={unit} marker={marker} markers={markers} />
        <div className="iw-range-scale">
          {(ticks || [min, Math.round((min + max) / 2), max]).map((t, i) => (
            <span key={i}>{t}{unit}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* MinRow — single-value slider for a MINIMUM-threshold lever. A floor is one
   number, not a range, so this shows a single thumb (≥ value). Same markup as
   RangeRow otherwise. */
function MinRow({ label, caption, unit, min, max, step, value, onChange, ticks }) {
  const v = Number(value);
  const pct = ((v - min) / (max - min)) * 100;
  const thumbCenter = (p) => `calc(11px + ${p}% - ${(p * 0.22).toFixed(3)}px)`;
  const at = thumbCenter(pct);
  return (
    <div className="lever-row">
      <div className="lever-head">
        <span className="lever-name">{label}</span>
        <span className="iw-range-pill">≥ {value}{unit}</span>
      </div>
      {caption && <div className="lever-caption">{caption}</div>}
      <div className="lever-control">
        {/* Single-thumb slider that reuses the DualRange visual treatment. */}
        <div className="iw-dual">
          <div className="iw-dual-track" />
          <div className="iw-dual-fill" style={{ left: thumbCenter(0), right: `calc(100% - ${at})` }} />
          <div className="iw-dual-thumb" style={{ left: at }} />
          <div className="iw-dual-bubble" style={{ left: at }}>{value}{unit}</div>
          <input type="range" min={min} max={max} step={step} value={v}
            onChange={(e) => onChange(Number(e.target.value))}
            className="iw-dual-input iw-dual-input-low" aria-label={label} />
        </div>
        <div className="iw-range-scale">
          {(ticks || [min, Math.round((min + max) / 2), max]).map((t, i) => (<span key={i}>{t}{unit}</span>))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Mock optimizer — returns top-3 liquidity-activation policies inside the
   user's ranges, honouring the products/channels they allow. Scaled against
   LIQUIDITY_CALIBRATION so numbers stay plausible.
---------------------------------------------------------------------------- */
function runOptimizer(objective, ranges, productOffers, allowedChannels, cohortPresets, customBase) {
  const C = LIQUIDITY_CALIBRATION;
  const COHORT_COUNTS = {
    "full":            C.signalCohortN,
    "yield-exposed":   C.eligibleAfterGate,
    "dormant-saver":   C.bonusHolderN,
    "high-value":      C.highValueN,
    "long-tenured":    8000,
    "multi-product":   12000,
    "digital-ready":   10000,
  };
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  // A fetched custom segment (customBase) REPLACES the preset cohort base.
  const cohortBase = customBase != null
    ? customBase
    : list.includes("full")
      ? C.signalCohortN
      : list.reduce((s, id) => s + (COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;
  /* Eligibility gate — mirrors the config tile (1.0 at the default min-balance,
     reducing only as the floor is raised). The scenario models the WHOLE eligible
     cohort — there's no RCT here; the treatment/control split is chosen at Go-Live. */
  const _eligFrac = Math.max(0.2, Math.min(1, 1 - ((ranges.minBalanceK.low - 5) / 140)));
  const eligibleN = Math.round(cohortBase * _eligFrac);
  const selProd = Object.keys(productOffers);
  const pickProduct = (preferred, fallback) =>
    selProd.includes(preferred) ? preferred
    : selProd.includes(fallback) ? fallback
    : selProd[0] || "cd_7mo";

  const clamp = (range, val) => Math.max(range.low, Math.min(range.high, val));
  // Resolve an "offer target" (bps, or "high") into a picked offer PER product,
  // clamped inside each product's own [low,high] range.
  const offerMap = (target) => Object.fromEntries(selProd.map((id) => {
    const [lo, hi] = productOffers[id];
    return [id, target === "high" ? hi : Math.max(lo, Math.min(hi, target))];
  }));
  const blended = (m) => { const v = Object.values(m); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; };

  /* Suitability margin is positioned to spread the anchors ALONG the
     Pareto trade-off so the chart shows a real curve, not 3 clustered
     points. Higher NII → lower suitability (more aggressive eligibility);
     lower NII → higher suitability (more selective, surplus-only cohort). */
  const fairnessFor = (retainedScale) => {
    // Linear inverse mapping: retainedScale 0.7 → 0.97, 1.0 → 0.92, 1.3 → 0.87
    const f = 0.97 - (retainedScale - 0.7) * (0.10 / 0.6);
    return Math.max(0.86, Math.min(0.98, f));
  };

  const mkRec = (id, rank, name, sub, picks, retainedScale, runoffScale) => {
    const blendedBps = blended(picks.productOffers);
    return {
      id, rank, name, sub,
      picks: { ...picks, blendedBps, channels: allowedChannels, cohortPresets: list },
      outcomes: {
        retainedM: C.retainedDepositsAnnualM * retainedScale * (eligibleN / C.signalCohortN),
        runoffReductionPp: (C.runoffReductionPp * 100) * runoffScale,
        ddRecoveryPp: 6 + (rank === 1 ? 2 : 0),
        netAnnualisedK: Math.round(C.netAnnualisedK * retainedScale - C.offerCostM * 1000 * (blendedBps / 40 - 1)),
        fairnessMargin: fairnessFor(retainedScale),
        eligibleN,   // the cohort the scenario models (no RCT here)
        treatmentN: Math.round(eligibleN * 0.9 * (picks.minBalanceK <= 30 ? 1.0 : 0.85)),
      },
    };
  };

  /* The 3 DISTINCT posture policies for the value objective (the proposal's
     Scenarios 1-3). Each is a genuinely different play — product mix, incentive,
     and the conversion↔value trade-off — not just an aggressiveness dial.
     Highest conversion (Aggressive) is NOT the highest value; Balanced wins. */
  const POLICY_SPECS = [
    { id: "balanced",   name: "Balanced",
      sub: "All products, routed by segment at a moderate incentive — the best total value.",
      frac: 0.72, avgBalK: 72.7, netMargin: 0.0162, fairness: 0.92,
      products: ["hy_savings", "money_market", "cd_7mo"] },
    { id: "efficient",  name: "Margin-optimised",
      sub: "Lower incentive, MMA + CD weighted — fewer but higher-balance conversions, best margin per customer.",
      frac: 0.42, avgBalK: 82, netMargin: 0.0171, fairness: 0.95,
      products: ["money_market", "cd_12mo", "cd_18mo"] },
    { id: "aggressive", name: "Conversion-optimised",
      sub: "Higher incentive, savings-weighted — the most conversions, but lower value each.",
      frac: 0.96, avgBalK: 52, netMargin: 0.0151, fairness: 0.88,
      products: ["hy_savings", "money_market"] },
  ];
  // Everything below derives from the SELECTED inputs — nothing hardcoded:
  //   cohort        -> treated
  //   offer ranges  -> per-product posture point -> reach-weighted blended bps
  //   blended bps   -> conversion + leakage
  //   products      -> mix + which products appear (via deriveSegments)
  const namedPolicy = (spec) => {
    const allowed = Object.keys(productOffers);
    let useProds = spec.products.filter((p) => allowed.includes(p));
    if (!useProds.length) useProds = allowed;
    // Posture multiplier vs Balanced (frac 0.72): Balanced = 1.0, Margin < 1,
    // Conversion > 1 — shifts every segment's per-segment offer up/down together.
    const offerMult = spec.frac / 0.72;
    // The user's [low,high] ranges for this policy's products — drive the
    // per-segment offers (each segment sits at its own point in the range).
    const policyRanges = Object.fromEntries(useProds.map((id) => [id, productOffers[id]]));
    // Per-product collapsed offer at the policy posture — for the policy band display.
    const policyOffers = {};
    useProds.forEach((id) => {
      const rng = productOffers[id];
      const lo = Array.isArray(rng) ? rng[0] : 0;
      const hi = Array.isArray(rng) ? rng[1] : rng;
      policyOffers[id] = Math.max(0, Math.round((lo + spec.frac * (hi - lo)) / 5) * 5);
    });
    // Reach-weighted blended incentive from the SAME per-segment offers the micro
    // table shows (ranges + offerMult → each segment's own point in its range).
    const seg = deriveSegments(LIQ_SEG_MODEL, { cohortPresets: list, productOffers: policyRanges, channels: allowedChannels, offerMult }, { retainedM: 1 });
    const blendedBps = seg.rollup.blendedBps;
    const blendedAPY = +((seg.rollup.blendedMarket ?? 4.0) + blendedBps / 100).toFixed(2);
    const conv = Math.min(0.09, +(0.019 + blendedBps * 0.00146).toFixed(4));
    const leakage = Math.max(0.045, +(C.runoffBau - blendedBps * 0.0023).toFixed(4));
    // The scenario models the WHOLE eligible cohort (no RCT holdout here).
    const rel = Math.round(eligibleN * conv);
    const fundedBalM = Math.round(rel * spec.avgBalK / 1000);
    const netVal12M = +(fundedBalM * spec.netMargin).toFixed(2);
    return {
      id: spec.id, name: spec.name, sub: spec.sub,
      picks: { productOffers: policyOffers, productRanges: policyRanges, offerMult, blendedBps, blendedAPY, fundedConversion: conv,
        minBalanceK: ranges.minBalanceK.low, channels: allowedChannels, cohortPresets: list },
      outcomes: {
        retainedM: netVal12M, fundedConversion: conv, fundedBalancesM: fundedBalM,
        newRelationships: rel,   // = eligibleN × conv — single source for all surfaces
        netValue8wkM: +(netVal12M * 0.0837).toFixed(2),
        runoffWithPolicy: leakage, runoffReductionPp: +((C.runoffBau - leakage) * 100).toFixed(1),
        ddRecoveryPp: 6,
        eligibleN,   // the cohort the scenario models (no RCT here)
        treatmentN: Math.round(eligibleN * 0.9), fairnessMargin: spec.fairness,
      },
    };
  };
  if (objective === "relationship_value") {
    // Rank by the objective (Incremental relationship value) so the recommended (#1) is
    // whichever policy actually wins for the selected inputs — not fixed.
    return POLICY_SPECS.map(namedPolicy)
      .sort((a, b) => b.outcomes.retainedM - a.outcomes.retainedM)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }

  if (objective === "net_interest_income") {
    return [
      mkRec("balanced", 1, "Balanced activator",
        "Mid-range uplift · 7-month CD · keeps net annualised firmly positive.",
        { productOffers: offerMap(40), minBalanceK: clamp(ranges.minBalanceK, 25),
          offerTerm: pickProduct("cd_7mo", "hy_savings") }, 1.05, 1.00),
      mkRec("aggressive", 2, "Aggressive activator",
        "Pushes the uplift ceiling to capture the rate-elastic tail — higher upside, thinner net margin.",
        { productOffers: offerMap("high"), minBalanceK: ranges.minBalanceK.low,
          offerTerm: pickProduct("cd_18mo", "cd_12mo") }, 1.18, 1.12),
      mkRec("selective", 3, "Selective activator",
        "Higher balance floor + lower uplift — narrower cohort, highest cost-efficiency.",
        { productOffers: offerMap(30), minBalanceK: clamp(ranges.minBalanceK, 50),
          offerTerm: pickProduct("cd_7mo", "hy_savings") }, 0.78, 0.85),
    ];
  }
  if (objective === "flight_reduction") {
    return [
      mkRec("steepest", 1, "Steepest flight cut",
        "Highest uplift + broadest eligibility — maximum reduction in idle cash leaving.",
        { productOffers: offerMap("high"), minBalanceK: ranges.minBalanceK.low,
          offerTerm: pickProduct("cd_18mo", "cd_12mo") }, 1.20, 1.25),
      mkRec("broad", 2, "Broad reach",
        "Captures more pre-shopping idle balances with a 7-month commitment.",
        { productOffers: offerMap(45), minBalanceK: ranges.minBalanceK.low,
          offerTerm: pickProduct("cd_7mo", "hy_savings") }, 1.10, 1.18),
      mkRec("conservative", 3, "Conservative",
        "Smaller move — still measurable, much cheaper to run.",
        { productOffers: offerMap(35), minBalanceK: clamp(ranges.minBalanceK, 30),
          offerTerm: pickProduct("cd_7mo", "hy_savings") }, 0.88, 0.95),
    ];
  }
  return [
    mkRec("primacy", 1, "Yield-leveraged",
      "High-yield savings offer prompts customers to consolidate idle cash back into yield — primary mechanism for balance activation.",
      { productOffers: offerMap(50), minBalanceK: ranges.minBalanceK.low,
        offerTerm: pickProduct("hy_savings", "smart_savings") }, 0.90, 0.95),
    mkRec("mixed", 2, "Mixed approach",
      "Short CD bridges activation and re-engagement.",
      { productOffers: offerMap(40), minBalanceK: ranges.minBalanceK.low,
        offerTerm: pickProduct("cd_7mo", "cd_12mo") }, 0.95, 0.98),
    mkRec("wide", 3, "Wide net",
      "Smart Savings catches the broadest sub-segment of idlers.",
      { productOffers: offerMap(45), minBalanceK: ranges.minBalanceK.low,
        offerTerm: pickProduct("smart_savings", "hy_savings") }, 0.98, 1.00),
  ];
}

function fmtProduct(id) {
  return OFFER_PRODUCT_OPTIONS.find((p) => p.id === id)?.label || id;
}

/* ----------------------------------------------------------------------------
   PolicyCompare — the "Compare all 3" tab content. A scorecard matrix
   (metrics × the 3 policies, inline bars, recommended column tinted, row winner
   highlighted) + overlaid trend charts (the 3 policies built over the 8-week
   test) + the product-allocation mix. Lives inside the Compare tab — a
   deliberate comparison view, not a floating panel.
---------------------------------------------------------------------------- */
const CMP_RAMP = [0.08, 0.20, 0.34, 0.49, 0.63, 0.76, 0.88, 1.0];
/* Round a max up to a clean axis ceiling (1/2/3/5/10 × 10^n) so gridline labels
   read 2,500 / 5,000 rather than 4,687. */
function niceCeil(x) {
  if (!(x > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const n = x / p;
  const step = n <= 1 ? 1 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 3 ? 3 : n <= 5 ? 5 : 10;
  return step * p;
}
const CMP_COL = { balanced: "var(--acc, #ffb15a)", efficient: "var(--acq, #5b9dff)", aggressive: "var(--violet, #b794f6)" };
const CMP_GROUPS = [
  { k: "HYS", col: "#5b9dff", test: (l) => l.includes("high-yield") },
  { k: "MMA", col: "#4fd1c5", test: (l) => l.includes("money") },
  { k: "CD",  col: "#ffb15a", test: (l) => l.includes("cd") },
  { k: "Other", col: "#b794f6", test: () => true },
];
/* Product mix for a policy, computed from the SAME per-segment routing the
   micro-segment table shows (deriveSegments), grouped by product family and
   reach-weighted — so the Compare bar matches each policy's deep-dive table. */
function cmpMixOf(rec) {
  const seg = deriveSegments(LIQ_SEG_MODEL, {
    cohortPresets: rec.picks.cohortPresets,
    productOffers: rec.picks.productRanges || rec.picks.productOffers,
    channels: rec.picks.channels,
    offerMult: rec.picks.offerMult,
  }, rec.outcomes);
  const w = {};
  (seg.rows || []).forEach((row) => {
    const l = (row.product || "").toLowerCase();
    const g = CMP_GROUPS.find((G) => G.test(l)) || CMP_GROUPS[CMP_GROUPS.length - 1];
    w[g.k] = (w[g.k] || 0) + (row.size || 0);
  });
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  return CMP_GROUPS.filter((g) => w[g.k]).map((g) => ({ k: g.k, col: g.col, pct: (w[g.k] / total) * 100 }));
}

const CMP_BASE_LEAK = 12;
/* CmpLines — high-fidelity comparison line chart with a hover read-out.
   Module-level (not nested in PolicyCompare) so hover state persists. */
function CmpLines({ title, ser, finalOf, fmt, down, gid }) {
  const [hoverI, setHoverI] = useState(null);
  const W = 340, H = 200, PL = 46, PR = 16, PT = 16, PB = 26;
  const innerW = W - PL - PR, innerH = H - PT - PB;
  const yMax = down ? CMP_BASE_LEAK : niceCeil(Math.max(...ser.map(finalOf)));
  const X = (i) => PL + (i / 7) * innerW;
  const Y = (v) => PT + (1 - v / yMax) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const recS = ser.find((s) => s.rec) || ser[0];
  const valAt = (s, i) => down ? CMP_BASE_LEAK - (CMP_BASE_LEAK - finalOf(s)) * CMP_RAMP[i] : finalOf(s) * CMP_RAMP[i];
  const tipW = 132, tipH = 18 + ser.length * 14 + 4;
  const hx = hoverI != null ? X(hoverI) : 0;
  const tipX = Math.min(Math.max(hx + 10, PL), W - PR - tipW);
  return (
    <div className="cmp-chart">
      <div className="cmp-chart-t">{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cmp-svg" preserveAspectRatio="xMidYMid meet" onMouseLeave={() => setHoverI(null)}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={recS.col} stopOpacity="0.22" />
            <stop offset="100%" stopColor={recS.col} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={Y(t)} y2={Y(t)} className="cmp-grid-l" />
            <text x={PL - 7} y={Y(t) + 3} textAnchor="end" className="cmp-yt">{fmt(t)}</text>
          </g>
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (<line key={"v" + i} x1={X(i)} x2={X(i)} y1={PT} y2={H - PB} className="cmp-grid-v" />))}
        {down && <line x1={PL} x2={W - PR} y1={Y(CMP_BASE_LEAK)} y2={Y(CMP_BASE_LEAK)} className="cmp-base" />}
        {!down && (
          <polygon points={`${X(0)},${Y(0)} ${CMP_RAMP.map((_, i) => `${X(i)},${Y(valAt(recS, i))}`).join(" ")} ${X(7)},${Y(0)}`} fill={`url(#${gid})`} />
        )}
        {ser.map((s) => {
          const pts = CMP_RAMP.map((_, i) => `${X(i)},${Y(valAt(s, i))}`);
          const [lx, ly] = pts[pts.length - 1].split(",");
          return (
            <g key={s.id}>
              <polyline points={pts.join(" ")} fill="none" stroke={s.col} strokeWidth={s.rec ? 2.6 : 1.7} opacity={s.rec ? 1 : 0.8} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={lx} cy={ly} r={s.rec ? 3.6 : 2.6} fill={s.col} stroke="var(--bg-1)" strokeWidth="1.2" />
            </g>
          );
        })}
        {hoverI != null && (
          <g pointerEvents="none">
            <line x1={hx} x2={hx} y1={PT} y2={H - PB} className="cmp-cross" />
            {ser.map((s) => (<circle key={s.id} cx={hx} cy={Y(valAt(s, hoverI))} r="3.2" fill={s.col} stroke="var(--bg-1)" strokeWidth="1.2" />))}
            <g transform={`translate(${tipX}, ${PT + 2})`}>
              <rect width={tipW} height={tipH} rx="6" className="cmp-tip-bg" />
              <text x="9" y="13" className="cmp-tip-h">Week {hoverI + 1}</text>
              {ser.map((s, i) => (
                <g key={s.id} transform={`translate(9, ${26 + i * 14})`}>
                  <circle cx="3" cy="-3.5" r="3.2" fill={s.col} />
                  <text x="12" y="0" className="cmp-tip-l">{s.short}</text>
                  <text x={tipW - 18} y="0" textAnchor="end" className="cmp-tip-v">{fmt(valAt(s, hoverI))}</text>
                </g>
              ))}
            </g>
          </g>
        )}
        {CMP_RAMP.map((_, i) => (
          <rect key={"h" + i} x={X(i) - innerW / 14} y={PT} width={innerW / 7} height={innerH} fill="transparent" style={{ cursor: "crosshair" }} onMouseEnter={() => setHoverI(i)} />
        ))}
        <text x={PL} y={H - 7} className="cmp-axt">wk 1</text>
        <text x={(PL + W - PR) / 2} y={H - 7} textAnchor="middle" className="cmp-axt">wk 4</text>
        <text x={W - PR} y={H - 7} textAnchor="end" className="cmp-axt">wk 8</text>
      </svg>
    </div>
  );
}

function PolicyCompare({ recs, onDrill }) {
  if (!recs.length || recs[0]?.outcomes?.fundedConversion == null) return null;
  const ser = recs.map((r) => ({
    id: r.id, rank: r.rank, name: r.name, rec: r.rank === 1, col: CMP_COL[r.id] || "#888",
    netVal: r.outcomes.retainedM,
    conv: (r.outcomes.fundedConversion ?? 0) * 100,
    rel: r.outcomes.newRelationships != null ? r.outcomes.newRelationships : Math.round((r.outcomes.eligibleN || 0) * (r.outcomes.fundedConversion || 0)),
    bal: r.outcomes.fundedBalancesM ?? 0,
    leak: (r.outcomes.runoffWithPolicy ?? 0) * 100,
    uplift: r.picks.blendedBps ?? 0,
    mixSegs: cmpMixOf(r),
    short: r.name.split(/[\s-]/)[0],
  }));
  const ROWS = [
    { k: "Incremental relationship value",   get: (s) => s.netVal, fmt: (v) => `+$${v.toFixed(1)}M` },
    { k: "Funded conversion",    get: (s) => s.conv,   fmt: (v) => `${v.toFixed(1)}%` },
    { k: "Funded relationships", get: (s) => s.rel,    fmt: (v) => v.toLocaleString() },
    { k: "Funded balances",      get: (s) => s.bal,    fmt: (v) => `+$${v}M` },
    { k: "Idle-cash leakage",    get: (s) => s.leak,   fmt: (v) => `${v.toFixed(1)}%`, lower: true },
    { k: "Blended uplift",       get: (s) => s.uplift, fmt: (v) => `+${v} bps` },
  ];
  return (
    <>
      <section className="panel reveal in">
        <div className="panel-h">
          <span className="stag">SCORECARD</span>
          <span className="stt">Read across a row — the leader on each metric is highlighted</span>
        </div>
        <div className="panel-body">
          <table className="iw-scorecard">
            <thead>
              <tr>
                <th />
                {ser.map((s) => (
                  <th key={s.id} className={s.rec ? "is-rec" : ""}>
                    <button className="iw-sc-col" onClick={() => onDrill(s.id)} title="Open deep dive">
                      <span className="iw-sc-rank">#{s.rank}</span> {s.name}{s.rec ? " ★" : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const vals = ser.map(row.get);
                const best = row.lower ? Math.min(...vals) : Math.max(...vals);
                const mx = Math.max(...vals) || 1;
                return (
                  <tr key={row.k}>
                    <td className="iw-sc-metric">{row.k}</td>
                    {ser.map((s, i) => {
                      const v = vals[i];
                      return (
                        <td key={s.id} className={(s.rec ? "is-rec " : "") + (v === best ? "is-win" : "")}>
                          <span className="iw-sc-cell">
                            <span className="iw-sc-bar" style={{ width: `${Math.max(8, (v / mx) * 100)}%`, background: s.col }} />
                            <span className="iw-sc-v">{row.fmt(v)}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel reveal in">
        <div className="panel-h">
          <span className="stag">OVER THE 8-WEEK TEST</span>
          <span className="stt">Conversion-optimised converts the most; Balanced builds the most value</span>
        </div>
        <div className="panel-body">
          <div className="cmp-legend">
            {ser.map((s) => (<span key={s.id} className="cmp-leg"><i style={{ background: s.col }} /> {s.name}</span>))}
          </div>
          <div className="cmp-grid">
            <CmpLines ser={ser} gid="cmpRel" title="Cumulative funded relationships" finalOf={(s) => s.rel} fmt={(v) => Math.round(v).toLocaleString()} />
            <CmpLines ser={ser} gid="cmpBal" title="Cumulative funded balances" finalOf={(s) => s.bal} fmt={(v) => `$${Math.round(v)}M`} />
            <CmpLines ser={ser} gid="cmpLeak" title="Idle-cash leakage" finalOf={(s) => s.leak} fmt={(v) => `${v.toFixed(1)}%`} down />
            <div className="cmp-chart">
              <div className="cmp-chart-t">Product allocation mix</div>
              <div className="cmp-mix">
                {ser.map((s) => (
                  <div key={s.id} className="cmp-mix-row">
                    <span className="cmp-mix-name">{s.name}</span>
                    <span className="cmp-mix-bar">
                      {s.mixSegs.map((seg, i) => {
                        const pct = Math.round(seg.pct);
                        return (
                          <span key={seg.k + i} className="cmp-mix-seg" style={{ width: `${seg.pct}%`, background: seg.col }} title={`${seg.k} ${pct}%`}>
                            {pct >= 12 ? `${pct}%` : ""}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                ))}
                <div className="cmp-mix-key">
                  <span><i style={{ background: "#5b9dff" }} />HYS</span>
                  <span><i style={{ background: "#4fd1c5" }} />MMA</span>
                  <span><i style={{ background: "#ffb15a" }} />CD</span>
                  <span><i style={{ background: "#b794f6" }} />Other</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ----------------------------------------------------------------------------
   LiquidityPareto — mirrors gig's ParetoFrontier visual treatment:
   synthetic candidate cloud + frontier line + infeasible region shading +
   axis labels + always-on anchor labels + hover/select halos.
---------------------------------------------------------------------------- */
function generateSyntheticCandidates(recs, n) {
  // Generate candidates with a real Pareto trade-off shape: higher
  // NII comes at the cost of suitability margin. The suitability
  // CEILING falls linearly with NII; each candidate sits below
  // that ceiling with noise. Some fall below the 0.85 floor (infeasible
  // region — rendered red). Anchored recs sit on or near the frontier.
  const out = [];
  const xMax = Math.max(...recs.map((r) => r.outcomes.retainedM), 12) * 1.25;
  let seed = 137;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < n; i++) {
    // X uniformly distributed across the chart
    const x = 0.5 + rand() * (xMax - 0.5);
    // Suitability ceiling: high X → lower ceiling. Caps at 0.98 (low X), bottoms at 0.85 (high X).
    const ceiling = 0.985 - (x / xMax) * 0.135;
    // Most candidates sit just below ceiling (active feasible region);
    // some fall well below (dominated); ~12% drop below 0.85 floor (infeasible).
    const r1 = rand();
    let y;
    if (r1 < 0.12) {
      // infeasible — below floor
      y = 0.76 + rand() * 0.09;
    } else if (r1 < 0.55) {
      // near-frontier — just below ceiling
      y = ceiling - rand() * 0.04;
    } else {
      // dominated — well below ceiling
      y = ceiling - 0.04 - rand() * 0.08;
    }
    y = Math.max(0.74, Math.min(0.99, y));
    out.push({ id: `syn-${i}`, x, fair: y });
  }
  return out;
}

function computeFrontier(points) {
  // Sort descending by x (NII $); keep points where suitability is
  // monotonically rising as we walk left — these are the non-dominated.
  const sorted = points.filter((p) => p.fair >= 0.85).slice().sort((a, b) => b.x - a.x);
  const frontier = [];
  let bestFair = 0;
  for (const p of sorted) {
    if (p.fair > bestFair) {
      frontier.push(p);
      bestFair = p.fair;
    }
  }
  return frontier.slice().sort((a, b) => a.x - b.x);
}

function LiquidityPareto({ recs, selectedId, onSelect }) {
  const W = 540, H = 320, PL = 56, PR = 22, PT = 24, PB = 46;

  const retainedVals = recs.map((r) => r.outcomes.retainedM);
  const xMin = 0, xMax = Math.max(...retainedVals, 12) * 1.3;
  const yMin = 0.74, yMax = 1.00;
  const X = (v) => PL + ((v - xMin) / (xMax - xMin)) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - yMin) / (yMax - yMin)) * (H - PT - PB);

  const synthetic = React.useMemo(() => generateSyntheticCandidates(recs, 220), [recs]);
  const anchorIds = new Set(recs.map((r) => r.id));
  // Build a unified set for frontier computation
  const allPoints = [
    ...synthetic.map((s) => ({ id: s.id, x: s.x, fair: s.fair })),
    ...recs.map((r) => ({ id: r.id, x: r.outcomes.retainedM, fair: r.outcomes.fairnessMargin })),
  ];
  const frontier = computeFrontier(allPoints);
  const frontierIds = new Set(frontier.map((p) => p.id));
  const frontierPath = frontier.map((p) => `${X(p.x).toFixed(1)},${Y(p.fair).toFixed(1)}`).join(" ");

  return (
    <div className="pareto">
      <div className="pareto-body pareto-body-chart-only">
        <div className="pareto-chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="pareto-svg" preserveAspectRatio="xMidYMid meet">
            {/* Plot frame */}
            <rect x={PL} y={PT} width={W - PL - PR} height={H - PT - PB}
                  fill="none" stroke="var(--hair)" strokeWidth="0.5" />

            {/* Y gridlines */}
            {[0.85, 0.90, 0.95, 1.00].map((v) => (
              <g key={`y-${v}`}>
                <line x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)}
                      stroke="var(--hair)" strokeWidth="0.5"
                      strokeDasharray={v === 0.85 ? "0" : "2 3"}
                      opacity={v === 0.85 ? 0.9 : 0.5} />
                <text x={PL - 8} y={Y(v) + 3} textAnchor="end" fontSize="9"
                      fontFamily="var(--mono)"
                      fill={v === 0.85 ? "var(--red, #ef4444)" : "var(--ink-4)"}>{v.toFixed(2)}</text>
              </g>
            ))}
            <text x={PL - 8} y={Y(0.85) - 6} textAnchor="end" fontSize="8.5"
                  fontFamily="var(--mono)" fill="var(--red, #ef4444)">0.85 floor</text>

            {/* X ticks */}
            {[0, xMax * 0.25, xMax * 0.5, xMax * 0.75, xMax].map((v, i) => (
              <g key={`x-${i}`}>
                <line x1={X(v)} y1={H - PB} x2={X(v)} y2={H - PB + 4}
                      stroke="var(--ink-4)" strokeWidth="0.5" />
                <text x={X(v)} y={H - PB + 14} textAnchor="middle" fontSize="9"
                      fontFamily="var(--mono)" fill="var(--ink-4)">${v.toFixed(1)}M</text>
              </g>
            ))}

            {/* Axis labels */}
            <text x={(PL + W - PR) / 2} y={H - 10} textAnchor="middle" fontSize="9.5"
                  fontFamily="var(--mono)" fill="var(--ink-3)">
              Net interest income · $M / yr →
            </text>
            <text x={-((PT + H - PB) / 2)} y={14} textAnchor="middle" fontSize="9.5"
                  fontFamily="var(--mono)" fill="var(--ink-3)"
                  transform={`rotate(-90, ${-((PT + H - PB) / 2)}, 14)`}
                  style={{ transformOrigin: "0 0" }}>
              ← Suitability margin
            </text>

            {/* Infeasible region — below 0.85 floor, soft red wash */}
            <rect x={PL} y={Y(0.85)} width={W - PL - PR} height={(H - PB) - Y(0.85)}
                  fill="var(--red, #ef4444)" opacity="0.05" />

            {/* Frontier shaded region — area under the frontier line */}
            {frontier.length >= 2 && (
              <polygon
                points={`${X(frontier[0].x)},${Y(0.85)} ${frontier.map((p) => `${X(p.x)},${Y(p.fair)}`).join(" ")} ${X(frontier[frontier.length - 1].x)},${Y(0.85)}`}
                fill="var(--acc, #ffb15a)" opacity="0.06" />
            )}

            {/* Synthetic candidate cloud */}
            {synthetic.map((c) => {
              if (anchorIds.has(c.id)) return null;
              const infeasible = c.fair < 0.85;
              const onFrontier = frontierIds.has(c.id);
              return (
                <circle key={c.id} cx={X(c.x)} cy={Y(c.fair)}
                        r={onFrontier ? 2.6 : 2}
                        fill={infeasible ? "var(--red, #ef4444)" : (onFrontier ? "var(--acc, #ffb15a)" : "var(--ink-3)")}
                        opacity={infeasible ? 0.45 : (onFrontier ? 0.75 : 0.35)} />
              );
            })}

            {/* Frontier line on top of cloud */}
            {frontier.length >= 2 && (
              <polyline points={frontierPath}
                        fill="none"
                        stroke="var(--acc, #ffb15a)"
                        strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                        opacity="0.78" />
            )}

            {/* Named anchors — the 3 recommendations */}
            {recs.map((rec) => {
              const isSelected = rec.id === selectedId;
              const r = isSelected ? 9 : 7;
              const cx = X(rec.outcomes.retainedM);
              const cy = Y(rec.outcomes.fairnessMargin);
              const isTop = rec.rank === 1;
              return (
                <g key={rec.id} style={{ cursor: "pointer" }} onClick={() => onSelect(rec.id)}>
                  {/* Generous hit area */}
                  <circle cx={cx} cy={cy} r="14" fill="transparent" />
                  {/* Halo when selected */}
                  {isSelected && (
                    <circle cx={cx} cy={cy} r={r + 5} fill="var(--acc, #ffb15a)" opacity="0.22" />
                  )}
                  <circle cx={cx} cy={cy} r={r}
                          fill={isTop ? "var(--acc, #ffb15a)" : "var(--violet, #b794f6)"}
                          stroke="var(--panel)" strokeWidth={isSelected ? 2.4 : 1.6} />
                  {/* Always-visible label */}
                  <text x={cx + 12} y={cy - 6} fontSize="10" fontWeight="700"
                        fill="var(--ink)" fontFamily="var(--mono)">
                    #{rec.rank} {isTop ? "★" : ""}
                  </text>
                  <text x={cx + 12} y={cy + 6} fontSize="9"
                        fill="var(--ink-3)" fontFamily="var(--ui)">
                    {rec.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   LiquidityIfWhatView
   ========================================================================= */
export default function LiquidityIfWhatView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setIntermezzo,
  } = useAppShell();

  const isAutopilot = tuneMode === "autopilot";
  const activeHypId = selectedHypothesisId || LIQUIDITY_HYPOTHESIS_ID;

  const [mode, setMode]                       = useState("config");
  const [objective, setObjective]             = useState("relationship_value");
  const [cohortPresets, setCohortPresets]     = useState(["full"]);

  const toggleCohort = (id) => {
    setUseCustom(false);                                                          // picking a preset clears the custom segment
    setCohortPresets((cur) => {
      if (id === "full") return ["full"];                                        // full cohort is exclusive
      const next = cur.includes(id) ? cur.filter((p) => p !== id) : [...cur.filter((p) => p !== "full"), id];
      return next.length ? next : ["full"];                                      // never leave it empty
    });
  };
  const [ranges, setRanges]                   = useState(DEFAULT_RANGES);
  // Product × Offer — per-product uplift RANGE the optimizer may sweep:
  // { productId: [lowBps, highBps] }. Presence = product allowed.
  // Pre-select the products from the hypothesis the user chose to test (Card
  // A/B/C). Deselecting any now correctly drops it from every policy + the
  // results (the policy mix intersects with this set).
  const [productOffers, setProductOffers]     = useState(
    liquidityHypothesis(activeHypId).ifWhatOffers || { hy_savings: [0, 40], money_market: [0, 35], cd_7mo: [0, 25], cd_12mo: [0, 30] }
  );
  const allowedProducts = Object.keys(productOffers);
  const [allowedChannels, setAllowedChannels] = useState(["app", "email", "banker"]);
  /* Simulation duration — single configurable value (not a range). Default
     8wk matches the calibration anchor every result tile is scored against. */
  const [simWeeks, setSimWeeks] = useState(8);
  const [recommendations, setRecs]            = useState([]);
  // Results tab: "compare" (scorecard + comparison charts) or a recommendation
  // id (that policy's deep dive).
  const [resultTab, setResultTab]             = useState("compare");

  // Custom segment builder (rule-defined cohort; REPLACES the presets)
  const [customRules, setCustomRules] = useState([]);
  const [customCount, setCustomCount] = useState(null);
  const [useCustom,   setUseCustom]   = useState(false);
  const customBase = useCustom ? customCount : null;

  // Publish page context so Ask TwinX is contextual to config vs. results.
  const _askFacts = React.useMemo(
    () => mode === "results"
      ? {
          useCase: "liquidity",
          objective: OBJECTIVES.find((o) => o.id === objective)?.label,
          recommended: recommendations[0]?.name,
          policies: recommendations.map((r) => ({
            rank: r.rank, name: r.name,
            netValueM: r.outcomes?.retainedM != null ? +r.outcomes.retainedM.toFixed(1) : undefined,
            fundedConversionPct: r.outcomes?.fundedConversion != null ? +(r.outcomes.fundedConversion * 100).toFixed(1) : undefined,
            fundedBalancesM: r.outcomes?.fundedBalancesM,
            flightReductionPp: r.outcomes?.runoffReductionPp,
          })),
          cohort: recommendations[0]?.outcomes?.treatmentN != null
            ? { treatmentN: recommendations[0].outcomes.treatmentN, controlN: Math.round(recommendations[0].outcomes.treatmentN / 9), eligibleN: recommendations[0].outcomes.treatmentN + Math.round(recommendations[0].outcomes.treatmentN / 9) }
            : undefined,
        }
      : { useCase: "liquidity" },
    [mode, objective, recommendations]
  );
  useSetPageContext(mode === "results" ? "ifwhat-results" : "ifwhat-config", _askFacts);

  const setRange = (key, value) => setRanges((cur) => ({ ...cur, [key]: { ...cur[key], ...value } }));
  // Keep ≥1 product/channel allowed — an empty allow-list has no well-defined
  // optimizer pick and makes the policy band + micro-segments diverge.
  const toggleProduct = (id) => setProductOffers((cur) => {
    if (cur[id] != null) { const next = { ...cur }; delete next[id]; return Object.keys(next).length ? next : cur; }
    return { ...cur, [id]: [10, 30] };   // sensible default uplift range for a newly-added product
  });
  const setProductRange = (id, low, high) => setProductOffers((cur) => ({ ...cur, [id]: [low, high] }));
  const toggleChannel = (id) => setAllowedChannels((cur) => cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((c) => c !== id)) : [...cur, id]);

  const onRun = useCallback(() => {
    setMode("running");
    pushAgentEvent({
      kind: "info", src: "Optimizer",
      text: `If-What · liquidity · maximizing ${OBJECTIVES.find((o) => o.id === objective)?.label || objective}`,
    });
  }, [pushAgentEvent, objective]);

  const onLoaderComplete = useCallback(() => {
    const recs = runOptimizer(objective, ranges, productOffers, allowedChannels, cohortPresets, customBase);
    setRecs(recs);
    setResultTab("compare");
    setMode("results");
    pushAgentEvent({
      kind: "good", src: "Optimizer",
      text: `Found ${recs.length} liquidity policies · top pick: ${recs[0]?.name}`,
    });
  }, [objective, ranges, productOffers, allowedChannels, cohortPresets, customBase, pushAgentEvent]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);

  const onStage = useCallback((rec) => {
    const stagedAt = Date.now();
    const oc = rec.outcomes || {};
    const treatmentN = oc.treatmentN || 0;
    const controlN = Math.round(treatmentN / 9);   // ~90/10 split
    const policy = {
      id: `p-${stagedAt}`,
      name: rec.name,
      hypothesis: activeHypId,
      cluster: "idle-cash-liquidity",
      themeId: "liquidity",
      experimentType: "liquidity",
      source: "ifwhat-optimizer",
      rank: rec.rank,
      objective,
      ...rec.picks,
      stagedBy: tuneMode === "autopilot" ? "autopilot" : "user",
      status: "pending",
      stagedAt,
      /* Projection from the chosen optimizer policy — drives the downstream
         live-RCT curves, cohort split, value-at-stake and Learn grid. */
      projected: {
        cohortLabel: rec.name,
        eligibleN: treatmentN + controlN,
        treatmentN, controlN,
        pilotWeeks: 8,
        valueAtStakeM: oc.retainedM,
        kpis: [
          { key: "nii",       label: "Net interest income",     unit: "$M", value: oc.retainedM,                    tau: 2.2, drift: 0.04 },
          { key: "flight_pp", label: "Idle-cash flight (Δ pp)", unit: "pp", value: -(oc.runoffReductionPp || 0),    tau: 1.8, drift: 0.05 },
          { key: "conv_pp",   label: "Funded conversion (pp)",  unit: "pp", value: (oc.fundedConversion || 0) * 100, tau: 2.2, drift: 0.04 },
          { key: "bal_m",     label: "Funded balances",         unit: "$M", value: oc.fundedBalancesM,               tau: 2.0, drift: 0.04 },
        ],
      },
    };
    stagePolicy(policy);
    pushAgentEvent({
      kind: "good", src: "Optimizer",
      text: tuneMode === "autopilot" ? `Autopilot picked #${rec.rank}: ${rec.name}` : `Staged #${rec.rank}: ${rec.name}`,
    });
    setIntermezzo(tuneMode === "autopilot" ? "staged-autopilot" : "staged-guided");
    setTimeout(() => { setIntermezzo(null); navWorkspace("deploy"); }, 1500);
  }, [activeHypId, objective, tuneMode, stagePolicy, pushAgentEvent, setIntermezzo, navWorkspace]);

  // Autopilot cinematic
  const hasAutoRunRef = useRef(false);
  const hasAutoStagedRef = useRef(false);

  useEffect(() => {
    if (!isAutopilot || hasAutoRunRef.current || mode !== "config") return;
    hasAutoRunRef.current = true;
    const id = setTimeout(() => { if (tuneMode === "autopilot" && mode === "config") onRun(); }, 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutopilot]);

  useEffect(() => {
    if (!isAutopilot || mode !== "results" || hasAutoStagedRef.current || recommendations.length === 0) return;
    hasAutoStagedRef.current = true;
    const id = setTimeout(() => { if (tuneMode === "autopilot") onStage(recommendations[0]); }, 3500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isAutopilot, recommendations]);

  /* ====================================================================
     RESULTS — 2 column: rec cards (left) + Pareto chart (right) + deep-dive below
     ==================================================================== */
  if (mode === "results") {
    const objLabel = OBJECTIVES.find((o) => o.id === objective)?.label || objective;
    const selected = recommendations.find((r) => r.id === resultTab) || recommendations[0];

    // ── Deep-dive micro-segment derivation (for the SegmentedResults tabs) ──
    const _o = selected ? selected.outcomes : null;
    const _seg = selected ? deriveSegments(LIQ_SEG_MODEL, {
      cohortPresets: selected.picks.cohortPresets,
      productOffers: selected.picks.productRanges || selected.picks.productOffers,   // ranges → per-segment offers
      channels: (allowedChannels && allowedChannels.length ? allowedChannels : ["app", "email", "banker"]),
      offerMult: selected.picks.offerMult,
      // Value column reconciles to funded balances (the meaningful $ flow).
    }, _o ? { ..._o, retainedM: Math.round(_o.retainedM / 0.0162), reachTarget: _o.eligibleN } : _o) : null;
    // runoffReductionPp from the optimizer is ALREADY in pp (= C.runoffBau*100*scale).
    const _baseRunoffPp = LIQUIDITY_CALIBRATION.runoffBau * 100;
    const _withPp = selected ? Math.max(_baseRunoffPp - _o.runoffReductionPp, 2) : _baseRunoffPp;
    // KPI strip — the LEAD KPI (Tier 1) MUST match the optimized objective and
    // the rank-card hero. The other three are supporting context (aggregate =
    // broader set, primary highlighted; the micro table aligns to the lead).
    // Funded metrics: 12-mo / 8-wk net value, funded conversion/relationships/balances, leakage.
    const _fundedBalM = _o ? (_o.fundedBalancesM != null ? _o.fundedBalancesM : Math.round(_o.retainedM / 0.0162)) : 0;
    const _convWith   = _o ? (_o.fundedConversion != null ? _o.fundedConversion : Math.min(0.09, 0.019 + (selected.picks.blendedBps || 0) * 0.001167)) : 0.019;
    const _netVal8wk  = _o ? _o.retainedM * (0.36 / 4.3) : 0;
    const _mNetVal12  = { label: "Incremental relationship value", value: `+$${_o ? _o.retainedM.toFixed(1) : 0}M`, baseline: "$0" };
    const _mNetVal8   = { label: "8-week incremental net value", value: `+$${_netVal8wk.toFixed(2)}M`, baseline: "$0" };
    const _mFundConv  = { label: "Funded product conversion", value: `${(_convWith * 100).toFixed(1)}%`, baseline: "1.9%" };
    const _mFundRel   = { label: "New funded relationships", value: `${_o ? (_o.newRelationships ?? Math.round(_o.eligibleN * _convWith)).toLocaleString() : 0}`, baseline: `${_o ? Math.round(_o.eligibleN * 0.019).toLocaleString() : 0}` };
    const _mFundBal   = { label: "Incremental funded balances", value: `+$${_fundedBalM}M`, baseline: "$0" };
    const _mLeak      = { label: "Idle cash leakage", value: `${_withPp.toFixed(1)}%`, baseline: `${_baseRunoffPp.toFixed(1)}%` };
    const _kpis = !selected ? [] :
      objective === "net_interest_income"
        ? [_mNetVal12, _mNetVal8, _mFundConv, _mFundRel, _mFundBal]
        : objective === "activation_return"
          ? [_mFundConv, _mFundRel, _mNetVal12, _mFundBal, _mLeak]
          : objective === "relationship_value"
            ? [_mNetVal12, _mFundConv, _mFundRel, _mFundBal, _mLeak]
            : [_mFundBal, _mNetVal12, _mFundConv, _mFundRel, _mLeak];
    const _valueLabel = "Funded bal.";
    // Policy band (the levers that produced this) — shown atop the Aggregate tab.
    const _policy = selected ? [
      { k: "Cohort", v: `${(selected.picks.cohortPresets || []).map((id) => COHORT_OPTIONS.find((c) => c.id === id)?.name).filter(Boolean).join(", ") || "All"} · ${(_o?.eligibleN || 0).toLocaleString()} eligible customers` },
      { k: "Min balance", v: `$${selected.picks.minBalanceK}K` },
      { k: "Product × Offer", v: Object.entries(selected.picks.productOffers || {})
          .map(([id, bps]) => `${fmtProduct(id)} ${((PRODUCT_MARKET[id] ?? 0) + bps / 100).toFixed(2)}%`)
          .join(" · ") || "—" },
      { k: "Channels", v: selected.picks.channels.map((c) => CHANNEL_OPTIONS.find((o) => o.id === c)?.label).filter(Boolean).join(", ") },
    ] : [];
    // Funded relationships built over the 8-week scenario (cohort × conversion).
    const _rel = Math.round((_o.treatmentN || 0) * (_o.fundedConversion || 0));
    const _chartsGrid = selected ? (
      <div className="sim-result-grid">
        <ResultTileNII
          outcomes={{ NII_8wk_M: _o.fundedBalancesM || 0 }}
          progress={1}
          title="Funded balances accumulation"
          subhead="cumulative balances routed into yield · 8-wk test"
          insight="Most balances are routed in the first few weeks after the offer lands."
        />
        <ResultTileBars
          title="Idle-cash leakage / wk"
          subhead={`${_baseRunoffPp.toFixed(1)}% today → ${_withPp.toFixed(1)}% with policy`}
          steady={_o.runoffReductionPp / 8}
          baselinePerWk={_baseRunoffPp / 8}
          progress={1}
          format={(n) => `${n.toFixed(2)}pp`}
          rampWeeks={2}
          seed={11}
          numbers={[{ k: "reduction vs today", v: `−${_o.runoffReductionPp.toFixed(1)}pp` }]}
          insight="Leakage drops from week 3 once customers act on the offer."
          accent="var(--acc,#ffb15a)"
        />
        <ResultTileBars
          title="New funded relationships / wk"
          subhead="projected ramp · 8-wk test"
          steady={_rel / 8}
          baselinePerWk={0}
          progress={1}
          format={(n) => Math.round(n).toLocaleString()}
          rampWeeks={4}
          seed={23}
          numbers={[{ k: "8-wk total", v: _rel.toLocaleString() }]}
          insight="Conversions lag the offer by ~3 weeks, then ramp."
          accent="var(--violet,#b794f6)"
        />
        <ResultTileNII
          outcomes={{ NII_8wk_M: _o.retainedM * (8 / 52) }}
          progress={1}
          title="Net value accumulation"
          subhead="cumulative incremental net value · 8-wk run-rate"
          insight="Most of the value lands inside the first 4 weeks."
        />
      </div>
    ) : null;

    return (
      <div className="results-page" style={{ "--acc": "#ffb15a", "--acc-soft": "rgba(255,177,90,.13)" }}>
        <header className="results-page-header">
          <button className="tj-btn tj-btn-ghost" onClick={() => setMode("config")}>
            <Icon name="arrowLeft" size={14} /> Tune and re-run
          </button>
          <div className="results-page-title">
            <div className="test-journey-eyebrow">RESULTS · IF-WHAT OPTIMIZER · {PAGE_SUBTITLE.toUpperCase()}</div>
            <h1 className="test-journey-title">Top 3 policies · {objLabel}</h1>
          </div>
          <div className="results-page-spacer" />
        </header>

        <div className="results-page-body">
          <div className="results-content">

            {/* TAB BAR — Compare all 3, then one tab per policy */}
            <div className="iw-result-tabs">
              <button
                className={"iw-rtab" + (resultTab === "compare" ? " is-active" : "")}
                onClick={() => setResultTab("compare")}
              >
                Compare all 3
              </button>
              {recommendations.map((rec) => (
                <button
                  key={rec.id}
                  className={"iw-rtab" + (resultTab === rec.id ? " is-active" : "") + (rec.rank === 1 ? " is-rec" : "")}
                  onClick={() => setResultTab(rec.id)}
                >
                  <span className="iw-rtab-num">#{rec.rank}</span> {rec.name}{rec.rank === 1 ? " ★" : ""}
                </button>
              ))}
            </div>

            {resultTab === "compare" ? (
            <>
            {/* TOP 3 RECOMMENDATIONS — horizontal cards (Pareto removed) */}
            <section className="panel reveal in iw-recs-row">
              <div className="panel-h">
                <span className="stag">TOP 3 RECOMMENDATIONS</span>
                <span className="stt">Click the card to inspect</span>
              </div>
              <div className="panel-body iw-recs-grid">
              {recommendations.map((rec) => {
                const isSelected = rec.id === resultTab;
                // Derive the card summary the SAME way as the deep-dive, so the
                // card's rate + product mix match the per-segment detail.
                const _recSeg = deriveSegments(LIQ_SEG_MODEL, {
                  cohortPresets: rec.picks.cohortPresets,
                  productOffers: rec.picks.productRanges || rec.picks.productOffers,
                  channels: rec.picks.channels,
                  offerMult: rec.picks.offerMult,
                }, rec.outcomes);
                const _recVehicles = [...new Set((_recSeg.rows || []).map((r) => r.product))].filter(Boolean);
                return (
                  <button
                    key={rec.id}
                    className={"iw-rank-card" + (isSelected ? " is-selected" : "") + (rec.rank === 1 ? " is-rank-1" : "")}
                    onClick={() => setResultTab(rec.id)}
                  >
                    <div className="iw-rank-head">
                      <span className="iw-rank-num">#{rec.rank}</span>
                      {rec.rank === 1 && (
                        <span className="iw-rank-rec">
                          <Icon name="star" size={10} /> OPTIMIZER PICK
                        </span>
                      )}
                    </div>
                    <div className="iw-rank-name">{rec.name}</div>
                    <div className="iw-rank-hero iw-rank-kpi-good">
                      <div className="iw-rank-hero-k">
                        {objective === "net_interest_income" ? "8-week incremental net value"
                         : objective === "flight_reduction" ? "Incremental funded balances"
                         : objective === "activation_return" ? "Funded product conversion"
                         : "Incremental relationship value"}
                      </div>
                      <div className="iw-rank-hero-v">
                        {objective === "net_interest_income" ? `+$${(rec.outcomes.retainedM * 0.0837).toFixed(2)}M`
                         : objective === "flight_reduction" ? `+$${Math.round(rec.outcomes.retainedM / 0.0162)}M`
                         : objective === "activation_return" ? `${((0.019 + (rec.picks.blendedBps || 0) * 0.001167) * 100).toFixed(1)}%`
                         : `+$${rec.outcomes.retainedM.toFixed(1)}M`}
                        <span className="iw-rank-kpi-est">est.</span>
                      </div>
                    </div>
                    <div className="iw-rank-summary">
                      {rec.outcomes.fundedConversion != null ? (
                        <>
                          <div className="iw-rank-summary-row">
                            <span className="iw-rank-summary-k">Blended offer</span>
                            <span className="iw-rank-summary-v">{(rec.picks.blendedAPY).toFixed(2)}% APY · +{rec.picks.blendedBps} bps</span>
                          </div>
                          <div className="iw-rank-summary-row">
                            <span className="iw-rank-summary-k">Funded conversion</span>
                            <span className="iw-rank-summary-v">{(rec.outcomes.fundedConversion * 100).toFixed(1)}% · {(rec.outcomes.newRelationships ?? Math.round((rec.outcomes.eligibleN || 0) * rec.outcomes.fundedConversion)).toLocaleString()} rel.</span>
                          </div>
                          <div className="iw-rank-summary-row">
                            <span className="iw-rank-summary-k">Funded balances</span>
                            <span className="iw-rank-summary-v">+${rec.outcomes.fundedBalancesM}M</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="iw-rank-summary-row">
                            <span className="iw-rank-summary-k">Offer rate</span>
                            <span className="iw-rank-summary-v">{((_recSeg.rollup.blendedMarket ?? 4.15) + _recSeg.rollup.blendedBps / 100).toFixed(2)}% blended · {_recVehicles.length} product{_recVehicles.length > 1 ? "s" : ""}</span>
                          </div>
                          <div className="iw-rank-summary-row">
                            <span className="iw-rank-summary-k">Min bal</span>
                            <span className="iw-rank-summary-v">≥${rec.picks.minBalanceK}K</span>
                          </div>
                          <div className="iw-rank-summary-row">
                            <span className="iw-rank-summary-k">Net</span>
                            <span className="iw-rank-summary-v">+${rec.outcomes.netAnnualisedK}K / yr</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="iw-rank-why">{rec.sub}</div>
                  </button>
                );
              })}
              </div>
            </section>

            {/* SCORECARD + COMPARISON CHARTS */}
            <PolicyCompare recs={recommendations} onDrill={setResultTab} />
            </>
            ) : selected ? (
        /* DEEP DIVE — the selected policy's full picture */
          <section className="panel reveal in">
            <div className="iw-deepdive">
              <div className="iw-dd-header">
                <div>
                  <div className="iw-dd-eyebrow">RANK #{selected.rank} · DEEP DIVE</div>
                  <div className="iw-dd-name">{selected.name}</div>
                  <div className="iw-dd-sub">{selected.sub}</div>
                </div>
                <button className="iw-detail-stage" onClick={() => onStage(selected)}>
                  <Icon name="upload" size={13} /> Stage this policy
                </button>
              </div>

              <div className={"iw-dd-verdict iw-dd-verdict-" + (selected.rank === 1 ? "good" : selected.rank === 2 ? "mixed" : "weak")}>
                <span className="iw-dd-verdict-glyph">
                  <Icon name={selected.rank === 1 ? "check" : selected.rank === 2 ? "warn" : "x"} size={18} strokeWidth={2.5} />
                </span>
                <div className="iw-dd-verdict-body">
                  <div className="iw-dd-verdict-title">
                    {selected.rank === 1 ? "OPTIMIZER PICK · supports the hypothesis"
                     : selected.rank === 2 ? "ALTERNATIVE · partial support"
                     : "ALTERNATIVE · weaker support"}
                  </div>
                  <div className="iw-dd-verdict-sub">
                    {selected.rank === 1 ? "Best on the chosen objective while respecting every guardrail."
                     : selected.rank === 2 ? "Reaches the objective but with a thinner suitability or profitability margin."
                     : "Lower upside but cheapest to run; useful as a baseline comparison."}
                  </div>
                </div>
              </div>

              {/* RESULTS — 4 KPIs (both tabs) + tabs: Aggregate charts | By micro-segment table */}
              <div className="iw-dd-block">
                <SegmentedResults
                  kpis={_kpis}
                  accent="#ffb15a"
                  objective={objLabel}
                  valueLabel={_valueLabel}
                  valueScale={1}
                  segments={_seg}
                  policy={_policy}
                  charts={_chartsGrid}
                  anchorRate={4.15}
                />
              </div>

              {/* GUARDRAILS — same pill strip pattern as What-If results */}
              <div className="iw-dd-block">
                <div className="sim-guardrails-strip">
                  <div className="sim-guardrails-h">
                    <Icon name="check" size={12} strokeWidth={2.5} />
                    <span>Guardrails · all projected to pass</span>
                  </div>
                  <div className="sim-guardrails-pills">
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Suitability</span>
                      <span className="sim-guardrail-pill-d">margin {selected.outcomes.fairnessMargin.toFixed(2)} vs 0.85 floor</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Liquidity risk</span>
                      <span className="sim-guardrail-pill-d">no operating/emergency buffers locked</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Model risk · approved</span>
                      <span className="sim-guardrail-pill-d">idle-cash state stable</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Fraud check</span>
                      <span className="sim-guardrail-pill-d">within seasonal bound</span>
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </section>
        ) : null}

          </div>
        </div>
      </div>
    );
  }

  /* ====================================================================
     CONFIG — 6 sections
     ==================================================================== */
  // ---- Live eligibility count (recomputes as the min-balance low thumb moves) ----
  // Threshold = the range's low value; higher floor → lower count.
  const minBalanceK = ranges.minBalanceK.low;
  const _cohortBase = useCustom && customCount != null
    ? customCount
    : (cohortPresets.includes("full")
        ? 75000
        : cohortPresets.reduce((s, id) => s + (COHORT_OPTIONS.find((c) => c.id === id)?.count || 0), 0)) || 75000;
  const _eligFrac = Math.max(0.2, Math.min(1, 1 - ((minBalanceK - 5) / (100 * 1.4))));
  const eligibleCount = Math.round(_cohortBase * _eligFrac);
  return (
    <div className="sim-ws sim-ws-single test-journey" style={{ "--acc": "#ffb15a", "--acc-soft": "rgba(255,177,90,.13)" }}>
      <header className="sim-ws-header">
        <div className="test-journey-eyebrow">IF-WHAT · {PAGE_SUBTITLE.toUpperCase()}</div>
        <div className="sim-ws-header-row">
          <h1 className="sim-ws-title">Find the best idle-cash activation policy</h1>
          <span className={"sim-mode-pill " + (isAutopilot ? "sim-mode-pill-auto" : "sim-mode-pill-guided")}>
            <span className="sim-mode-pill-dot" />
            {isAutopilot ? "AUTOPILOT" : "IF-WHAT"}
          </span>
        </div>
      </header>

      <section className="panel sim-ws-col sim-ws-levers sim-ws-levers-full">

        {/* 1 · GOAL */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">1</span>
            <span className="sim-lever-section-name">GOAL</span>
            <span className="sim-lever-section-meta">What the optimizer maximizes</span>
          </div>
          <div className="iw-objectives">
            {OBJECTIVES.map((o) => (
              <label key={o.id} className={"iw-objective" + (objective === o.id ? " is-selected" : "")}>
                <input type="radio" name="liq-iw-objective" value={o.id} checked={objective === o.id}
                  onChange={() => setObjective(o.id)} disabled={isAutopilot} />
                <span className="iw-objective-body">
                  <span className="iw-objective-l">{o.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 2 · CUSTOMER */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">2</span>
            <span className="sim-lever-section-name">CUSTOMER</span>
            <span className="sim-lever-section-meta">Which cohort the offer reaches</span>
          </div>
          <div className="sim-lever-fieldset" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {COHORT_OPTIONS.map((c) => {
              const isSelected = !useCustom && cohortPresets.includes(c.id);
              return (
                <label key={c.id} className={"sim-cohort-card" + (isSelected ? " is-on" : "") + (useCustom ? " is-dim" : "")}>
                  <input type="checkbox" checked={isSelected}
                    onChange={() => toggleCohort(c.id)} disabled={isAutopilot} />
                  <div className="sim-cohort-card-h">
                    <span className="sim-cohort-card-n">{c.name}</span>
                  </div>
                  <div className="sim-cohort-card-counts">
                    <span><b>{(c.count / 1000).toFixed(0)}K</b> customers</span>
                  </div>
                  <div className="sim-cohort-card-sig">{c.sig}</div>
                </label>
              );
            })}
          </div>

          {/* Custom segment builder — a rule-defined cohort that REPLACES the
              preset selection once fetched + used. */}
          <CustomSegmentBuilder
            attrs={RULE_ATTRS.liquidity}
            base={75000}
            rules={customRules}
            setRules={setCustomRules}
            count={customCount}
            setCount={setCustomCount}
            active={useCustom}
            onUse={() => setUseCustom(true)}
            onClear={() => setUseCustom(false)}
          />
        </div>

        {/* 3 · ELIGIBILITY — single minimum-balance threshold */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">3</span>
            <span className="sim-lever-section-name">ELIGIBILITY</span>
            <span className="sim-lever-section-meta">The minimum balance to qualify</span>
          </div>
          <MinRow
            label={ranges.minBalanceK.label}
            caption={ranges.minBalanceK.caption}
            unit={ranges.minBalanceK.unit}
            min={ranges.minBalanceK.min} max={ranges.minBalanceK.max} step={ranges.minBalanceK.step}
            value={ranges.minBalanceK.low}
            onChange={(v) => setRange("minBalanceK", { low: v })}
            ticks={[5, 50, 100]}
          />
          <div className="elig-tile">
            <span className="elig-tile-v">{eligibleCount.toLocaleString()}</span>
            <span className="elig-tile-l">customers qualify at this threshold</span>
          </div>
        </div>

        {/* 4 · PRODUCT × OFFER — pick products, set each one's uplift RANGE over its own market */}
        <div className="sim-lever-section sim-lever-section-policy">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">4</span>
            <span className="sim-lever-section-name">PRODUCT × OFFER</span>
            <span className="sim-lever-section-meta">Products the optimizer may use — set each one's uplift range over its own market</span>
          </div>
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Products & offer ranges</span>
              <span className="lever-value">{allowedProducts.length} of {OFFER_PRODUCT_OPTIONS.length}</span>
            </div>
            <div className="lever-caption">Different products trade in different markets. Select the products to allow; each reveals its own uplift range, anchored to that product's market, that the optimizer sweeps within. Idle cash earns ~0.05% today.</div>
            <div className="px-offer-list">
              {OFFER_PRODUCT_OPTIONS.map((p) => {
                const rng = productOffers[p.id];
                const sel = rng != null;
                const mkt = PRODUCT_MARKET[p.id] ?? 0;
                return (
                  <div key={p.id} className={"px-offer-card" + (sel ? " is-selected" : "")}>
                    <label className="px-offer-head">
                      <input type="checkbox" checked={sel} onChange={() => toggleProduct(p.id)} disabled={isAutopilot} />
                      <span className="px-offer-name"><span className="px-offer-l">{p.label}</span></span>
                      {!sel && <span className="px-offer-mkt">current APY {mkt.toFixed(2)}%</span>}
                    </label>
                    {sel && (
                      <div className="px-offer-body">
                        {/* Common 0-100 bps spectrum for every product, so each
                            product's starting range sits at its true position on
                            one scale (0-40 and 0-35 render at different points,
                            not both pinned right). */}
                        <DualRange min={0} max={100} step={5} unit=" bps"
                          low={rng[0]} high={rng[1]}
                          onChange={({ low, high }) => setProductRange(p.id, low, high)} />
                        <div className="px-offer-eff">
                          <span className="rate-ref-item is-market"><span className="rate-ref-l">current APY</span><span className="rate-ref-v">{mkt.toFixed(2)}%</span></span>
                          <span className="px-offer-arrow">→</span>
                          <span className="rate-ref-item"><span className="rate-ref-l">offer range</span><span className="rate-ref-v">{(mkt + rng[0] / 100).toFixed(2)}–{(mkt + rng[1] / 100).toFixed(2)}%</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5 · CHANNEL — multi-select */}
        <div className="sim-lever-section sim-lever-section-comms">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">5</span>
            <span className="sim-lever-section-name">CHANNEL</span>
            <span className="sim-lever-section-meta">Which channels the optimizer may use</span>
          </div>
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Allowed delivery channels</span>
              <span className="lever-value">{allowedChannels.length} of {CHANNEL_OPTIONS.length}</span>
            </div>
            <div className="lever-caption">The optimizer picks the most cost-effective subset from the channels you allow.</div>
            <div className="lever-checks">
              {CHANNEL_OPTIONS.map((c) => {
                const on = allowedChannels.includes(c.id);
                return (
                  <label key={c.id} className={"lever-check" + (on ? " on" : "")}>
                    <input type="checkbox" checked={on} onChange={() => toggleChannel(c.id)} disabled={isAutopilot} />
                    {c.label}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6 · SIMULATION DURATION — single-thumb slider, default 8wk.
            Not a search dimension; just the model horizon every candidate
            is scored over. Pilot RCT length lives in Deploy. */}
        <div className="sim-lever-section sim-lever-section-comms">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">6</span>
            <span className="sim-lever-section-name">SIMULATION DURATION</span>
            <span className="sim-lever-section-meta">Model horizon every candidate is scored over</span>
          </div>
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Weeks</span>
              <span className="lever-value">{simWeeks} weeks</span>
            </div>
            <div className="lever-caption">The pilot RCT length is set separately in Deploy.</div>
            <div className="lever-control">
              <RangeWithBubble
                min={4} max={12} step={2}
                value={simWeeks}
                onChange={(e) => setSimWeeks(+e.target.value)}
                disabled={isAutopilot}
                formatter={(v) => `${v} weeks`}
              />
              <div className="iw-range-scale"><span>4w</span><span>8w</span><span>12w</span></div>
            </div>
          </div>
        </div>

        {/* 7 · GUARDRAILS — collapsed by default, at the end */}
        <details className="sim-lever-section">
          <summary className="sim-lever-section-band">
            <span className="sim-lever-section-num">7</span>
            <span className="sim-lever-section-name">GUARDRAILS</span>
            <span className="sim-lever-section-meta">Always on · enforced on every recommendation</span>
          </summary>
          <ul className="iw-guards">
            {ALWAYS_ON_CONSTRAINTS.map((c) => (
              <li key={c.id}>
                <Icon name="check" size={12} strokeWidth={2.5} />
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
        </details>

      </section>

      <div className="results-actions" style={{ justifyContent: "flex-end" }}>
        <button
          className="tj-btn tj-btn-primary tj-btn-lg sim-run-btn"
          onClick={onRun}
          disabled={mode === "running"}
        >
          <Icon name="play" size={14} />
          {mode === "running" ? "Searching…" : "Find best policies"}
        </button>
      </div>

      {mode === "running" && (
        <div className="sim-overlay" role="dialog" aria-modal="true" aria-label="Optimizer running">
          <div className="sim-overlay-backdrop" />
          <div className="sim-overlay-card">
            <SimulationLoader
              variant="whatif"
              includeDeepening={false}
              onComplete={onLoaderComplete}
              onCancel={onLoaderCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
