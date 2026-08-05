/* ============================================================================
   RetentionIfWhatView — If-What (goal-driven optimization) for retention.

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
import SimulationLoader from "@/components/loaders/SimulationLoader";
import Icon from "@/components/Icon";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import SegmentedResults from "@/components/SegmentedResults";
import { RETENTION_SEGMENTS, deriveSegments, PRODUCT_MARKET, RETENTION_PRODUCT_LABEL, RETENTION_CHANNEL_LABEL } from "@/data/segmentModels";
import RangeWithBubble from "@/components/RangeWithBubble";
import DualRange from "@/components/DualRange";
import ConversationalCohortBuilder from "@/components/ConversationalCohortBuilder";
import {
  RETENTION_HYPOTHESIS_ID,
  RETENTION_HYPOTHESIS_TITLE,
  RETENTION_CALIBRATION,
} from "@/data/retentionConfig";
import "@/styles/ifwhat.css";

const PAGE_SUBTITLE = RETENTION_HYPOTHESIS_TITLE;

/* Dollar-discount equivalent of a bps offer on the ~$1,650 avg premium,
   rounded to $5. Every offer except the capped renewal rate is shown as a
   dollar discount rather than a rate. */
const dollarOff = (bps) => Math.round(1650 * (Number(bps) || 0) / 1000 / 5) * 5;

/* Compact number stepper for "N years or more" threshold levers (lock term,
   loyalty tenure) — clearer than a slider for a single integer threshold. */
function YearsStepper({ value, min, max, onChange, disabled }) {
  const clamp = (v) => Math.max(min, Math.min(max, Math.round(Number(v) || min)));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="number" min={min} max={max} step={1} value={value} disabled={disabled}
        onChange={(e) => onChange(clamp(e.target.value))}
        style={{ width: 66, padding: "6px 9px", borderRadius: 6, border: "1px solid var(--hair)", background: "var(--panel, #fff)", color: "var(--ink-1)", fontWeight: 700, fontSize: 13 }} />
      <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>years or more</span>
    </div>
  );
}

/* Micro-segment model for the deep-dive's "By micro-segment" tab. */
const RET_SEG_MODEL = {
  segments: RETENTION_SEGMENTS,
  cohortCounts: { full: 550849, "rate-sensitive": 161000, "operating-decliner": 132000, "high-value": 22000, "long-tenured": 59000, "multi-product": 88000 },
  heldBackLabel: "Will-stay & already-gone",
  heldBackShare: 0.06,
  productLabels: RETENTION_PRODUCT_LABEL,
  channelLabels: RETENTION_CHANNEL_LABEL,
};

const OBJECTIVES = [
  { id: "retained_deposits", label: "Maximize NWP protected" },
  { id: "runoff_reduction",  label: "Minimize % renewals lapsing" },
  { id: "primacy_return",    label: "Maximize bundle penetration" },
];

const COHORT_OPTIONS = [
  { id: "full",               name: "Full cohort",              count: 550849, share: 0.095, sig: "Every customer showing one or more drift signals." },
  { id: "rate-sensitive",     name: "Shopping-elastic eligible", count: 161000, share: 0.028, sig: "Engagement dropping >20% · price-elastic · not deeply bundled."  },
  { id: "operating-decliner", name: "Silent Pre-Shopper", count: 132000, share: 0.023, sig: "Portal logins falling · paperless-opens decaying · no competitor quote yet."  },
  { id: "high-value",         name: "High-value at-risk", count: 22000, share: 0.004, sig: "LTV >$12K · top shopping decile · single-line (unbundled)."  },
  { id: "long-tenured",       name: "Long-tenured shoppers", count: 59000, share: 0.010, sig: "10+ years tenure · rate action landed in the last 6 months."  },
  { id: "multi-product",      name: "Multi-policy shoppers", count: 88000, share: 0.015, sig: "3+ policies held · early shopping signals on the auto policy."  },
];

const OFFER_PRODUCT_OPTIONS = [
  { id: "cd_6mo",          label: "Capped renewal increase" },
  { id: "cd_12mo",         label: "Premium discount" },
  { id: "cd_trade_up_24",  label: "Multi-year rate lock" },
  { id: "elite_mma",       label: "Deductible-adjusted rate" },
  { id: "smart_savings",   label: "Loyalty / tenure discount" },
];

const COVERAGE_OPTIONS = [
  { id: "dd_switch", label: "Rebalance coverage",            sub: "Right-size limits / deductibles to the risk without dropping core protection" },
  { id: "bill_pay",  label: "Premium-tier restructuring",   sub: "Move to a matched tier with equivalent core coverage at a better price" },
  { id: "auto_save", label: "Value add-ons",                sub: "Roadside, rental or accident-forgiveness at no / low cost" },
  { id: "zelle",     label: "Telematics safety credit (RightTrack)", sub: "Usage-based safe-driver credit offered at renewal" },
];

const BUNDLE_OPTIONS = [
  { id: "auto_home",    label: "Auto → Home",          sub: "Home quote pre-filled from household data · contingent bundle discount" },
  { id: "auto_life",    label: "Auto → Life (Ethos)",  sub: "Life offer at a life-event moment via the Ethos partnership" },
  { id: "renters_auto", label: "Renters → Auto",       sub: "Auto quote for renters with a vehicle in the household · contingent pricing" },
];

const CHANNEL_OPTIONS = [
  { id: "app",    label: "App notification" },
  { id: "email",  label: "Email" },
  { id: "mail",   label: "Direct mail" },
  { id: "banker", label: "Comparion agent call" },
];

const ALWAYS_ON_CONSTRAINTS = [
  { id: "fairness",      label: "Renewal-pricing fairness (disparate-impact) ≥ 0.85" },
  { id: "profitability", label: "Profitability floor · every retained dollar margin-positive" },
  { id: "model-risk",    label: "Model risk approved · drift state stable" },
  { id: "fraud",         label: "Loss-ratio envelope · retention-offer Q2 bound" },
];

const DEFAULT_RANGES = {
  minBalanceK:     { low: 25, high: 60, min: 20, max: 100, step: 5, unit: "K",   label: "Min household LTV to qualify", caption: "Households below this arent worth the offer cost."  },
  offerCeilingBps: { low: 25, high: 60, min: 0, max: 80,  step: 5, unit: "bps", label: "Retention-offer ceiling", caption: "Avg auto premium ~$1,650/yr · bps = increment over renewal"  },
};



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

/* MinRow — single-value slider for a MINIMUM-threshold lever (a floor is one
   number, not a range). Same markup as RangeRow otherwise. */
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
        {/* Single-thumb slider that reuses the DualRange visual treatment.
            `range-single` restores pointer-events on the input — without it the
            base .iw-dual-input has pointer-events:none and the thumb can't be
            dragged (the two-thumb DualRange relies on its per-thumb pseudos). */}
        <div className="iw-dual range-single">
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
   Mock optimizer — returns top-3 retention policies inside the user's
   ranges, honouring the products/channels they allow. Scaled against
   RETENTION_CALIBRATION so numbers stay plausible.
---------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------
   Mock optimizer — returns top-3 retention policies inside the user's
   ranges, honouring the products/channels they allow. Scaled against
   RETENTION_CALIBRATION so numbers stay plausible.
---------------------------------------------------------------------------- */
function runOptimizer(objective, ranges, productOffers, bundleOffers, allowedCoverage, allowedChannels, noticeDays, cohortPresets) {
  const C = RETENTION_CALIBRATION;
  const COHORT_COUNTS = {
    "full":               C.cohortTotal,
    "rate-sensitive":     C.eligibleAfterGate,
    "operating-decliner": C.operatingDeclinerN,
    "high-value":         22000,
    "long-tenured":       59000,
    "multi-product":      88000,
  };
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  const cohortBase = list.includes("full")
    ? C.cohortTotal
    : list.reduce((s, id) => s + (COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;
  const selProd = Object.keys(productOffers);
  const selBundles = Object.keys(bundleOffers || {});

  const clamp = (range, val) => Math.max(range.low, Math.min(range.high, val));
  const offerMap = (target) => Object.fromEntries(selProd.map((id) => {
    const r = productOffers[id];
    const [lo, hi] = Array.isArray(r) ? r : [20, 60];
    const targetVal = target === "high" ? hi : typeof target === "number" ? target : Math.round((lo + hi) / 2);
    return [id, Math.max(lo, Math.min(hi, targetVal))];
  }));

  const bundleMap = (target) => Object.fromEntries(selBundles.map((id) => {
    const r = bundleOffers ? bundleOffers[id] : null;
    const [lo, hi] = Array.isArray(r) ? r : [10, 30];
    const targetVal = target === "high" ? hi : typeof target === "number" ? target : Math.round((lo + hi) / 2);
    return [id, Math.max(lo, Math.min(hi, targetVal))];
  }));

  const blended = (m) => {
    if (!m || typeof m !== "object") return 25;
    const v = Object.values(m).filter((x) => typeof x === "number" && !isNaN(x));
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 25;
  };

  const fairnessFor = (retainedScale) => {
    const f = 0.97 - (retainedScale - 0.7) * (0.10 / 0.6);
    return Math.max(0.86, Math.min(0.98, f));
  };

  const mkRec = (id, rank, name, sub, picks, retainedScale, runoffScale) => {
    const prodOffersMap = picks.productOffers || offerMap("mid");
    const bundOffersMap = picks.bundleOffers || bundleMap("mid");
    const bpsVal = blended(prodOffersMap);
    const bundleBpsVal = blended(bundOffersMap);

    const bundleLiftVal = selBundles.length * 0.04 + (bundleBpsVal / 100) * 0.08;
    const coverageLiftVal = (allowedCoverage || []).length * 0.03;

    let calcRetainedM = C.retainedDepositsAnnualM * (retainedScale + bundleLiftVal + coverageLiftVal) * (cohortBase / C.eligibleAfterGate);
    if (isNaN(calcRetainedM) || calcRetainedM <= 0) calcRetainedM = 6.7 * retainedScale;

    let calcRunoff = (C.runoffReductionPp * 100) * runoffScale;
    if (isNaN(calcRunoff) || calcRunoff <= 0) calcRunoff = 2.3 * runoffScale;

    let calcDD = 6 + Math.round(bundleBpsVal / 10) + (rank === 1 ? 2 : 0);
    if (isNaN(calcDD) || calcDD <= 0) calcDD = 8;

    return {
      id, rank, name, sub,
      picks: {
        ...picks,
        productOffers: prodOffersMap,
        blendedBps: bpsVal,
        bundleOffers: bundOffersMap,
        allowedCoverage: allowedCoverage || [],
        channels: allowedChannels,
        noticeDays: Array.isArray(noticeDays) ? noticeDays : [noticeDays],
        cohortPresets: list
      },
      outcomes: {
        retainedM: +calcRetainedM.toFixed(1),
        runoffReductionPp: +calcRunoff.toFixed(2),
        ddRecoveryPp: calcDD,
        netAnnualisedK: Math.round(C.netAnnualisedK * retainedScale - C.offerCostM * 1000 * (bpsVal / 40 - 1)),
        fairnessMargin: fairnessFor(retainedScale),
        treatmentN: Math.round((cohortBase * 0.8) * ((picks.minBalanceK || 25) <= 30 ? 1.0 : 0.85)),
      },
    };
  };

  if (objective === "retained_deposits") {
    return [
      mkRec("balanced", 1, "Balanced defender",
        "Mid-range capped increase + premium discount · contingent bundle discount · keeps net annualised firmly positive.",
        { productOffers: offerMap(40), bundleOffers: bundleMap(25), minBalanceK: clamp(ranges.minBalanceK, 25) }, 1.05, 1.00),
      mkRec("aggressive", 2, "Aggressive defender",
        "Pushes offer ceiling & bundle discount to capture rate-elastic tail — higher upside.",
        { productOffers: offerMap("high"), bundleOffers: bundleMap("high"), minBalanceK: ranges.minBalanceK.low }, 1.18, 1.12),
      mkRec("selective", 3, "Selective defender",
        "Higher LTV floor + lower offer — narrower cohort, highest cost-efficiency.",
        { productOffers: offerMap(30), bundleOffers: bundleMap(15), minBalanceK: clamp(ranges.minBalanceK, 50) }, 0.78, 0.85),
    ];
  }
  if (objective === "runoff_reduction") {
    return [
      mkRec("steepest", 1, "Steepest runoff cut",
        "Highest offer + broadest eligibility — maximum reduction in renewals lapsing.",
        { productOffers: offerMap("high"), bundleOffers: bundleMap("high"), minBalanceK: ranges.minBalanceK.low }, 1.20, 1.25),
      mkRec("broad", 2, "Broad reach",
        "Captures more pre-shopping customers with 12-month commitment & bundle discount.",
        { productOffers: offerMap(45), bundleOffers: bundleMap(25), minBalanceK: ranges.minBalanceK.low }, 1.10, 1.18),
      mkRec("conservative", 3, "Conservative",
        "Smaller move — still measurable, much cheaper to run.",
        { productOffers: offerMap(35), bundleOffers: bundleMap(15), minBalanceK: clamp(ranges.minBalanceK, 30) }, 0.88, 0.95),
    ];
  }
  return [
    mkRec("primacy", 1, "Bundle-leveraged",
      "Bundle nudge prompts households to add home/umbrella policy at save moment — primary mechanism for bundle penetration.",
      { productOffers: offerMap(50), bundleOffers: bundleMap("high"), minBalanceK: ranges.minBalanceK.low }, 0.90, 0.95),
    mkRec("mixed", 2, "Mixed approach",
      "Balanced offer + bundle discount bridges retention and re-engagement.",
      { productOffers: offerMap(40), bundleOffers: bundleMap(25), minBalanceK: ranges.minBalanceK.low }, 0.95, 0.98),
    mkRec("wide", 3, "Wide net",
      "Loyalty discount tier catches broadest sub-segment of returners.",
      { productOffers: offerMap(45), bundleOffers: bundleMap(20), minBalanceK: ranges.minBalanceK.low }, 0.98, 1.00),
  ];
}

function fmtProduct(id) {
  return OFFER_PRODUCT_OPTIONS.find((p) => p.id === id)?.label || id;
}

/* ----------------------------------------------------------------------------
   RetentionPareto — mirrors gig's ParetoFrontier visual treatment:
   synthetic candidate cloud + frontier line + infeasible region shading +
   axis labels + always-on anchor labels + hover/select halos.
---------------------------------------------------------------------------- */
function generateSyntheticCandidates(recs, n) {
  // Generate candidates with a real Pareto trade-off shape: higher
  // retained-$ comes at the cost of fairness margin. The fairness
  // CEILING falls linearly with retained-$; each candidate sits below
  // that ceiling with noise. Some fall below the 0.85 floor (infeasible
  // region — rendered red). Anchored recs sit on or near the frontier.
  const out = [];
  const xMax = Math.max(...recs.map((r) => r.outcomes.retainedM), 12) * 1.25;
  let seed = 137;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < n; i++) {
    // X uniformly distributed across the chart
    const x = 0.5 + rand() * (xMax - 0.5);
    // Fairness ceiling: high X → lower ceiling. Caps at 0.98 (low X), bottoms at 0.85 (high X).
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
  // Sort descending by x (retained $); keep points where fairness is
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

function RetentionPareto({ recs, selectedId, onSelect }) {
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
              NWP protected · $M / yr →
            </text>
            <text x={-((PT + H - PB) / 2)} y={14} textAnchor="middle" fontSize="9.5"
                  fontFamily="var(--mono)" fill="var(--ink-3)"
                  transform={`rotate(-90, ${-((PT + H - PB) / 2)}, 14)`}
                  style={{ transformOrigin: "0 0" }}>
              ← Renewal-pricing fairness
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
   RetentionIfWhatView
   ========================================================================= */
export default function RetentionIfWhatView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setIntermezzo,
  } = useAppShell();

  const isAutopilot = tuneMode === "autopilot";
  const activeHypId = selectedHypothesisId || RETENTION_HYPOTHESIS_ID;

  const [mode, setMode]                       = useState("config");
  const [objective, setObjective]             = useState("retained_deposits");
  const [cohortPresets, setCohortPresets]     = useState(["rate-sensitive"]);

  const toggleCohort = (id) => setCohortPresets((cur) => {
    if (id === "full") return ["full"];                                          // full cohort is exclusive
    const next = cur.includes(id) ? cur.filter((p) => p !== id) : [...cur.filter((p) => p !== "full"), id];
    return next.length ? next : ["full"];                                        // never leave it empty
  });
  const [ranges, setRanges]                   = useState(DEFAULT_RANGES);
  // Product × Offer — per-product uplift RANGE { productId: [lowBps, highBps] }; presence = allowed.
  const [productOffers, setProductOffers]     = useState({ cd_12mo: [30, 50], cd_6mo: [20, 40] });
  const allowedProducts = Object.keys(productOffers);
  const [allowedChannels, setAllowedChannels] = useState(["app", "email", "banker"]);
  const [allowedCoverage, setAllowedCoverage] = useState(["dd_switch"]);
  const [bundleOffers,    setBundleOffers]    = useState({ auto_home: [15, 35] });
  const [noticeDays,      setNoticeDays]      = useState([45]);
  const [customNotice,    setCustomNotice]    = useState("");
  // Pricing-lever qualifiers (mirror the What-If view): the loyalty tier's
  // relationship (tenure) range and the deductible-adjusted offer's deductible %.
  const [loyaltyTenure,   setLoyaltyTenure]   = useState([3, 30]);
  const [deductiblePct,   setDeductiblePct]   = useState([10, 20]);
  const [lockYears,       setLockYears]       = useState([2, 4]);   // multi-year rate-lock term range
  const [multiTouch,      setMultiTouch]      = useState(true);

  const toggleCoverage = (id) => setAllowedCoverage((cur) => cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]);

  const toggleBundle = (id) => setBundleOffers((cur) => {
    if (cur[id] != null) {
      const next = { ...cur };
      delete next[id];
      return Object.keys(next).length ? next : cur;
    }
    return { ...cur, [id]: [15, 35] };
  });

  const setBundleRange = (id, low, high) => setBundleOffers((cur) => ({ ...cur, [id]: [low, high] }));

  const toggleNotice = (d) => setNoticeDays((cur) => {
    const list = Array.isArray(cur) ? cur : [cur];
    if (list.includes(d)) return list.length === 1 ? list : list.filter((x) => x !== d);
    return [...list, d].sort((a, b) => a - b);
  });

  const addCustomNotice = () => {
    const d = parseInt(customNotice, 10);
    if (!Number.isFinite(d) || d < 7 || d > 120) return;
    setNoticeDays((cur) => {
      const list = Array.isArray(cur) ? cur : [cur];
      if (list.includes(d)) return list;
      return [...list, d].sort((a, b) => a - b);
    });
    setCustomNotice("");
  };
  /* Campaign duration — single configurable value (not a range). Default
     8wk matches the calibration anchor every result tile is scored against. */
  const [simWeeks, setSimWeeks] = useState(8);
  const [recommendations, setRecs]            = useState([]);
  const [selectedRecId, setSelectedRecId]     = useState(null);

  // Custom segment-builder state (gig's sim-cohort-custom pattern)
  const [customOpen,  setCustomOpen]  = useState(false);
  const [customRules, setCustomRules] = useState([]);
  const addRule    = () => setCustomRules((cur) => [...cur, { feature: "balance_min", op: "gte", value: 25 }]);
  const updateRule = (i, patch) => setCustomRules((cur) => cur.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const removeRule = (i) => setCustomRules((cur) => cur.filter((_, idx) => idx !== i));

  const setRange = (key, value) => setRanges((cur) => ({ ...cur, [key]: { ...cur[key], ...value } }));
  // Keep ≥1 product/channel allowed — an empty allow-list has no well-defined
  // optimizer pick and makes the policy band + micro-segments diverge.
  const toggleProduct = (id) => setProductOffers((cur) => {
    if (cur[id] != null) { const next = { ...cur }; delete next[id]; return Object.keys(next).length ? next : cur; }
    return { ...cur, [id]: [20, 40] };   // default uplift range for a newly-added product
  });
  const setProductRange = (id, low, high) => setProductOffers((cur) => ({ ...cur, [id]: [low, high] }));
  const toggleChannel = (id) => setAllowedChannels((cur) => cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((c) => c !== id)) : [...cur, id]);

  const onRun = useCallback(() => {
    setMode("running");
    pushAgentEvent({
      kind: "info", src: "Optimizer",
      text: `If-What · retention · maximizing ${OBJECTIVES.find((o) => o.id === objective)?.label || objective}`,
    });
  }, [pushAgentEvent, objective]);

  const onLoaderComplete = useCallback(() => {
    const recs = runOptimizer(objective, ranges, productOffers, bundleOffers, allowedCoverage, allowedChannels, noticeDays, cohortPresets);
    setRecs(recs);
    setSelectedRecId(recs[0]?.id || null);
    setMode("results");
    pushAgentEvent({
      kind: "good", src: "Optimizer",
      text: `Found ${recs.length} retention policies · top pick: ${recs[0]?.name}`,
    });
  }, [objective, ranges, productOffers, bundleOffers, allowedCoverage, allowedChannels, noticeDays, cohortPresets, pushAgentEvent]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);

  const onStage = useCallback((rec) => {
    const stagedAt = Date.now();
    const policy = {
      id: `p-${stagedAt}`,
      name: rec.name,
      hypothesis: activeHypId,
      cluster: "high-ltv-renewal-shopping",
      themeId: "retention",
      experimentType: "retention",
      source: "ifwhat-optimizer",
      rank: rec.rank,
      objective,
      ...rec.picks,
      stagedBy: tuneMode === "autopilot" ? "autopilot" : "user",
      status: "pending",
      stagedAt,
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
    const selected = recommendations.find((r) => r.id === selectedRecId) || recommendations[0];

    // ── Deep-dive micro-segment derivation (for the SegmentedResults tabs) ──
    const _o = selected ? selected.outcomes : null;
    const _seg = selected ? deriveSegments(RET_SEG_MODEL, {
      cohortPresets: selected.picks.cohortPresets,
      productOffers: selected.picks.productOffers,   // per-product picked offers → per-product effective rates
      bundleOffers: selected.picks.bundleOffers,
      bundles: Object.keys(selected.picks.bundleOffers || {}),
      bankingServices: selected.picks.allowedCoverage,
      channels: (allowedChannels && allowedChannels.length ? allowedChannels : ["app", "email", "banker"]),
      noticeDays: Array.isArray(noticeDays) ? noticeDays : [noticeDays],   // per-segment reach-out lead in the deep-dive table
      loyaltyTenure, deductiblePct, lockYears,   // pricing-lever qualifiers surfaced per segment
    }, _o) : null;
    // runoffReductionPp from the optimizer is ALREADY in pp (= C.runoffBau*100*scale).
    const _baseRunoffPp = RETENTION_CALIBRATION.runoffBau * 100;
    const _withPp = selected ? Math.max(_baseRunoffPp - _o.runoffReductionPp, 2) : _baseRunoffPp;
    // KPI strip — the LEAD KPI (Tier 1) MUST match the optimized objective and
    // the rank-card hero. The other three are supporting context.
    const _mRet   = { label: "NWP impact", value: `+$${_o ? _o.retainedM.toFixed(1) : 0}M`, baseline: "$0" };
    const _mLeave = { label: "% renewals lapsing", value: `${_withPp.toFixed(1)}%`, baseline: `${_baseRunoffPp.toFixed(1)}%` };
    const _mDD    = { label: "Bundle penetration", value: `+${_o ? _o.ddRecoveryPp : 0}pp`, baseline: "0pp" };
    const _mRelVal   = { label: "CLV impact", value: `+$${(_o ? _o.retainedM * 2.5 : 0).toFixed(1)}M`, baseline: "$0" };
    const _mDefended = { label: "Policies retained", value: `${_o ? Math.round(_o.treatmentN * (_baseRunoffPp - _withPp) / 100).toLocaleString() : 0}`, baseline: "0" };
    const _mPct   = { label: "At-risk retained", value: `${_o ? (_o.treatmentN * (_baseRunoffPp - _withPp) / 100 / RETENTION_CALIBRATION.cohortTotal * 100).toFixed(1) : 0}%`, baseline: "0%" };
    const _kpis = !selected ? [] :
      objective === "retained_deposits"
        ? [_mRet, _mRelVal, _mDefended, _mPct, _mLeave, _mDD]
        : objective === "primacy_return"
          ? [{ label: "Bundle adds", value: `+${_o.ddRecoveryPp}pp`, baseline: "0pp" }, _mRet, _mRelVal, _mDefended, _mPct, _mLeave]
          : [{ label: "Lapse-rate reduction", value: `−${_o.runoffReductionPp.toFixed(1)}pp`, baseline: `${_baseRunoffPp.toFixed(1)}%` }, _mRet, _mRelVal, _mDefended, _mPct, _mDD];
    // Policy band (the levers that produced this) — shown atop the Aggregate tab.
    const _policy = selected ? [
      { k: "Cohort", v: (selected.picks.cohortPresets || []).map((id) => COHORT_OPTIONS.find((c) => c.id === id)?.name).filter(Boolean).join(", ") || "All" },
      { k: "Min LTV", v: `$${selected.picks.minBalanceK}K` },
      { k: "Pricing", v: Object.entries(selected.picks.productOffers || {})
          .map(([id, bps]) => {
            let s = `${fmtProduct(id)} ${((PRODUCT_MARKET[id] ?? 0) + bps / 100).toFixed(2)}%`;
            if (id === "smart_savings") s += ` (≥${loyaltyTenure[0]}y tenure)`;
            if (id === "elite_mma") s += ` (${deductiblePct[0]}–${deductiblePct[1]}% deductible)`;
            if (id === "cd_trade_up_24") s += ` (≥${lockYears[0]}y lock)`;
            return s;
          })
          .join(" · ") || "—" },
      { k: "Coverage", v: allowedCoverage.map((c) => COVERAGE_OPTIONS.find((o) => o.id === c)?.label).filter(Boolean).join(", ") || "—" },
      { k: "Bundle", v: Object.entries(selected.picks.bundleOffers || bundleOffers)
          .map(([id, rng]) => `${BUNDLE_OPTIONS.find((o) => o.id === id)?.label || id} (-${Array.isArray(rng) ? Math.round((rng[0] + rng[1]) / 2) : rng} bps)`)
          .join(" · ") || "—" },
      { k: "Channels", v: selected.picks.channels.map((c) => CHANNEL_OPTIONS.find((o) => o.id === c)?.label).filter(Boolean).join(", ") },
      { k: "Renewal reminder", v: `${(Array.isArray(noticeDays) ? noticeDays : [noticeDays]).join(" / ")}-day before renewal${multiTouch ? " · multi-touch" : ""}` },
      { k: "Treated", v: `${(_seg ? _seg.rollup.reach : 0).toLocaleString()} customers` },
    ] : [];
    const _chartsGrid = selected ? (
      <div className="sim-result-grid">
        <ResultTileNII
          outcomes={{ NII_8wk_M: _o.retainedM * (8 / 52) }}
          progress={1}
          title="NWP protected accumulation"
          subhead="projected · cumulative over an 8-wk pilot"
          insight="Most of the effect lands inside the first 4 weeks."
        />
        <ResultTileBars
          title="% renewals lapsing / wk"
          subhead={`${_baseRunoffPp.toFixed(1)}% today → ${_withPp.toFixed(1)}% with policy`}
          steady={_o.runoffReductionPp / 8}
          baselinePerWk={_baseRunoffPp / 8}
          progress={1}
          format={(n) => `${n.toFixed(2)}pp`}
          rampWeeks={2}
          seed={11}
          numbers={[{ k: "reduction vs today", v: `−${_o.runoffReductionPp.toFixed(1)}pp` }]}
          insight="Effect builds from week 3 once customers act on the offer."
          accent="var(--acc,#ffb15a)"
        />
        <ResultTileBars
          title="Bundle penetration / wk"
          subhead="projected ramp"
          steady={_o.ddRecoveryPp / 8}
          baselinePerWk={0}
          progress={1}
          format={(n) => `${n.toFixed(2)}pp`}
          rampWeeks={4}
          seed={23}
          numbers={[{ k: "8-wk total", v: `+${_o.ddRecoveryPp}pp` }]}
          insight="Lags the offer by ~3 weeks."
          accent="var(--violet,#b794f6)"
        />
        <ResultTileCohort
          segments={[
            { id: "a", label: "Rate-driven", pct: 55, color: "var(--acc,#ffb15a)" },
            { id: "b", label: "Operating-decliner", pct: 24, color: "var(--violet,#b794f6)" },
            { id: "c", label: "High-value", pct: 14, color: "var(--cyan,#4fd1c5)" },
            { id: "d", label: "Will-stay", pct: 7, color: "var(--ink-3)" },
          ]}
          treatedN={_o.treatmentN || 440679}
          insight="Most of the value concentrates in the top two segments."
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

            {/* TOP 3 RECOMMENDATIONS — horizontal cards (Pareto removed) */}
            <section className="panel reveal in iw-recs-row">
              <div className="panel-h">
                <span className="stag">TOP 3 RECOMMENDATIONS</span>
                <span className="stt">Click the card to inspect</span>
              </div>
              <div className="panel-body iw-recs-grid">
              {recommendations.map((rec) => {
                const isSelected = rec.id === selectedRecId;
                // Derive the card summary the SAME way as the deep-dive, so the
                // card's rate + product mix match the per-segment detail.
                const _recSeg = deriveSegments(RET_SEG_MODEL, {
                  cohortPresets: rec.picks.cohortPresets,
                  productOffers: rec.picks.productOffers,
                  channels: rec.picks.channels,
                  loyaltyTenure, deductiblePct, lockYears,
                }, rec.outcomes);
                const _recVehicles = [...new Set((_recSeg.rows || []).map((r) => r.product))].filter(Boolean);
                return (
                  <button
                    key={rec.id}
                    className={"iw-rank-card" + (isSelected ? " is-selected" : "") + (rec.rank === 1 ? " is-rank-1" : "")}
                    onClick={() => setSelectedRecId(rec.id)}
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
                        {objective === "retained_deposits" ? "NWP protected / yr"
                         : objective === "runoff_reduction" ? "Lapse-rate reduction"
                         : "Bundle adds / qtr"}
                      </div>
                      <div className="iw-rank-hero-v">
                        {objective === "retained_deposits" ? `+$${rec.outcomes.retainedM.toFixed(1)}M`
                         : objective === "runoff_reduction" ? `−${rec.outcomes.runoffReductionPp.toFixed(2)}pp`
                         : `+${rec.outcomes.ddRecoveryPp}pp`}
                        <span className="iw-rank-kpi-est">est.</span>
                      </div>
                    </div>
                    <div className="iw-rank-summary">
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
                    </div>
                  </button>
                );
              })}
              </div>
            </section>

        {/* DEEP DIVE — selected recommendation's full picture */}
        {selected && (
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
                     : selected.rank === 2 ? "Reaches the objective but with a thinner fairness or profitability margin."
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
                  valueLabel="NWP protected / yr"
                  productHeader="Offer"
                  hideRateCap={false}
                  offerLabel="Discount"
                  rateLabel="Capped renewal rate"
                  hideBaseline={true}
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
                      <span className="sim-guardrail-pill-l">Renewal-pricing fairness</span>
                      <span className="sim-guardrail-pill-d">Fair-lending margin {selected.outcomes.fairnessMargin.toFixed(2)} vs 0.85 floor</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Profitability floor</span>
                      <span className="sim-guardrail-pill-d">net +${selected.outcomes.netAnnualisedK}K annualised</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Model risk · approved</span>
                      <span className="sim-guardrail-pill-d">drift state stable</span>
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
        )}

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
  const _cohortBase = (cohortPresets.includes("full")
    ? 550849
    : cohortPresets.reduce((s, id) => s + (COHORT_OPTIONS.find((c) => c.id === id)?.count || 0), 0)) || 550849;
  const _eligFrac = Math.max(0.2, Math.min(1, 1 - ((minBalanceK - 20) / (100 * 1.4))));
  const eligibleCount = Math.round(_cohortBase * _eligFrac);
  return (
    <div className="sim-ws sim-ws-single test-journey" style={{ "--acc": "#ffb15a", "--acc-soft": "rgba(255,177,90,.13)" }}>
      <header className="sim-ws-header">
        <div className="test-journey-eyebrow">IF-WHAT · {PAGE_SUBTITLE.toUpperCase()}</div>
        <div className="sim-ws-header-row">
          <h1 className="sim-ws-title">Find the best retention policy</h1>
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
                <input type="radio" name="ret-iw-objective" value={o.id} checked={objective === o.id}
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
              const isSelected = cohortPresets.includes(c.id);
              return (
                <label key={c.id} className={"sim-cohort-card" + (isSelected ? " is-on" : "")}>
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

          {/* Custom segment builder — collapsed by default. Same pattern as
              What-If: adds an additional rule-defined group on top of the
              selected preset cohorts, scoped only to this scenario. */}
          <div className={"sim-cohort-custom" + (customOpen ? " is-open" : "")}>
            <button
              type="button"
              className="sim-cohort-custom-toggle"
              onClick={() => setCustomOpen((v) => !v)}
            >
              <Icon name={customOpen ? "chevronDown" : "chevronRight"} size={12} />
              Add a custom segment (rule-defined)
              {customRules.length > 0 && (
                <span className="sim-cohort-custom-count">
                  {customRules.length} rule{customRules.length === 1 ? "" : "s"}
                </span>
              )}
            </button>
            {customOpen && (
              <div className="sim-cohort-custom-body">
                <div className="sim-cohort-custom-model">
                  <b>How this works:</b> a custom segment is an <em>additional</em> group defined by feature rules — it gets <em>added to</em> the selected cohorts above, not used to filter them. Scoped to this scenario only.
                </div>
                {customRules.length === 0 ? (
                  <div className="sim-cohort-custom-empty">
                    No rules yet. Click "Add rule" to start building.
                  </div>
                ) : (
                  <div className="sim-cohort-custom-rules">
                    {customRules.map((r, i) => (
                      <div key={i} className="sim-cohort-custom-rule">
                        <select value={r.feature} onChange={(e) => updateRule(i, { feature: e.target.value })} disabled={isAutopilot}>
                          <option value="balance_min">Household LTV</option>
                          <option value="balance_decline_90d">Engagement decline (90d)</option>
                          <option value="ach_outflow_90d">Competitor quote-shopping (90d)</option>
                          <option value="dda_activity_decline">Portal-login decline</option>
                          <option value="direct_deposit_decay">Coverage-reduction request</option>
                          <option value="tenure_months">Tenure (months)</option>
                          <option value="product_depth">Product depth (count)</option>
                        </select>
                        <select value={r.op} onChange={(e) => updateRule(i, { op: e.target.value })} disabled={isAutopilot}>
                          <option value="gte">≥</option>
                          <option value="lte">≤</option>
                          <option value="eq">=</option>
                          <option value="between">between</option>
                        </select>
                        <input type="number" value={r.value} onChange={(e) => updateRule(i, { value: Number(e.target.value) })} disabled={isAutopilot} />
                        <button type="button" className="sim-cohort-custom-rm" onClick={() => removeRule(i)} aria-label="Remove rule" disabled={isAutopilot}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" className="sim-cohort-custom-add" onClick={addRule} disabled={isAutopilot}>+ Add rule</button>
              </div>
            )}
          </div>

          {/* Conversational AI Cohort Builder */}
          <ConversationalCohortBuilder
            onApplyCohort={(customCohort) => {
              setClusterPicks([customCohort.id]);
            }}
            isAutopilot={isAutopilot}
          />
        </div>

        {/* 3 · ELIGIBILITY — single minimum-balance threshold */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">3</span>
            <span className="sim-lever-section-name">ELIGIBILITY</span>
            <span className="sim-lever-section-meta">The minimum household LTV to qualify</span>
          </div>
          <MinRow
            label={ranges.minBalanceK.label}
            caption={ranges.minBalanceK.caption}
            unit={ranges.minBalanceK.unit}
            min={ranges.minBalanceK.min} max={ranges.minBalanceK.max} step={ranges.minBalanceK.step}
            value={ranges.minBalanceK.low}
            onChange={(v) => setRange("minBalanceK", { low: v })}
            ticks={[20, 50, 100]}
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
            <span className="sim-lever-section-name">PRICING</span>
            <span className="sim-lever-section-meta">Discount spreading by tenure × LTV · deductible swap · retention discount tiers — set each offer's range</span>
          </div>
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Products & offer ranges</span>
              <span className="lever-value">{allowedProducts.length} of {OFFER_PRODUCT_OPTIONS.length}</span>
            </div>
            <div className="lever-caption">Select the offers to allow; each reveals its own range, anchored to the renewal premium, that the optimizer sweeps within. Avg at-risk auto premium ~$1,650/yr today.</div>
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
                    </label>
                    {sel && (
                      <div className="px-offer-body">
                        <DualRange min={0} max={80} step={5} unit=" bps"
                          low={rng[0]} high={rng[1]}
                          onChange={({ low, high }) => setProductRange(p.id, low, high)} />
                        <div className="px-offer-eff">
                          <span className="rate-ref-item"><span className="rate-ref-l">discount</span><span className="rate-ref-v" style={{ color: "var(--green)", fontWeight: 700 }}>{p.id === "cd_6mo" ? `−${rng[0]}–${rng[1]} bps off renewal rate` : `−$${dollarOff(rng[0])}–$${dollarOff(rng[1])} off premium`}</span></span>
                        </div>
                        {p.id === "smart_savings" && (
                          <div className="px-offer-qual" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--hair)" }}>
                            <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginBottom: 4, fontWeight: 600 }}>
                              Relationship threshold — minimum tenure the optimizer may target with the loyalty discount
                            </div>
                            <YearsStepper value={loyaltyTenure[0]} min={0} max={20}
                              onChange={(v) => setLoyaltyTenure([v, 30])} />
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                              Applies to households with <b>≥ {loyaltyTenure[0]} years</b> of relationship.
                            </div>
                          </div>
                        )}
                        {p.id === "elite_mma" && (
                          <div className="px-offer-qual" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--hair)" }}>
                            <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginBottom: 4, fontWeight: 600 }}>
                              Deductible range — % of coverage moved to the deductible to fund the discount
                            </div>
                            <DualRange min={5} max={25} step={5} unit="%"
                              low={deductiblePct[0]} high={deductiblePct[1]}
                              onChange={({ low, high }) => setDeductiblePct([low, high])} />
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                              Deductible swept between <b>{deductiblePct[0]}–{deductiblePct[1]}%</b> of coverage — a higher deductible funds a larger rate offset.
                            </div>
                          </div>
                        )}
                        {p.id === "cd_trade_up_24" && (
                          <div className="px-offer-qual" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--hair)" }}>
                            <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginBottom: 4, fontWeight: 600 }}>
                              Lock term — minimum years the optimizer may lock the rate for
                            </div>
                            <YearsStepper value={lockYears[0]} min={1} max={5}
                              onChange={(v) => setLockYears([v, 5])} />
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                              Rate locked for <b>≥ {lockYears[0]} years</b> — the customer keeps it even if the market rises.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5 · COVERAGE — non-price value add-on levers */}
        <div className="sim-lever-section sim-lever-section-products">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">5</span>
            <span className="sim-lever-section-name">COVERAGE</span>
            <span className="sim-lever-section-meta">Rebalance coverage · premium-tier restructuring · value add-ons</span>
          </div>
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Coverage levers allowed</span>
              <span className="lever-value">{allowedCoverage.length} of {COVERAGE_OPTIONS.length}</span>
            </div>
            <div className="lever-caption">Non-price levers the optimizer may add to hold the policy on value.</div>
            <div className="px-offer-list" style={{ display: "grid", gap: 10, marginTop: 8 }}>
              {COVERAGE_OPTIONS.map((c) => {
                const on = allowedCoverage.includes(c.id);
                return (
                  <div key={c.id} className={"px-offer-card" + (on ? " is-selected" : "")} style={{ border: "1px solid var(--hair)", borderRadius: 8, padding: "10px 12px", background: on ? "rgba(91, 157, 255, 0.08)" : "var(--bg-2)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={on} onChange={() => toggleCoverage(c.id)} disabled={isAutopilot} />
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{c.label}</span>
                    </label>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2, marginLeft: 24 }}>{c.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6 · BUNDLE — cross-line contingent-pricing plays with discount bps ranges */}
        <div className="sim-lever-section sim-lever-section-products">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">6</span>
            <span className="sim-lever-section-name">BUNDLE</span>
            <span className="sim-lever-section-meta">Auto → Home · Auto → Life (Ethos) · Renters → Auto — contingent pricing &amp; discount ranges</span>
          </div>
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Bundle plays &amp; discount ranges</span>
              <span className="lever-value">{Object.keys(bundleOffers).length} of {BUNDLE_OPTIONS.length}</span>
            </div>
            <div className="lever-caption">Cross-line offers the optimizer may attach; set the contingent discount range (bps) for each allowed bundle play.</div>
            <div className="px-offer-list" style={{ display: "grid", gap: 10, marginTop: 8 }}>
              {BUNDLE_OPTIONS.map((b) => {
                const rng = bundleOffers[b.id];
                const sel = rng != null;
                return (
                  <div key={b.id} className={"px-offer-card" + (sel ? " is-selected" : "")} style={{ border: "1px solid var(--hair)", borderRadius: 8, padding: "10px 12px", background: sel ? "rgba(183, 148, 246, 0.08)" : "var(--bg-2)" }}>
                    <label className="px-offer-head" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleBundle(b.id)} disabled={isAutopilot} />
                      <span className="px-offer-name" style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{b.label}</span>
                    </label>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2, marginLeft: 24 }}>{b.sub}</div>
                    {sel && (
                      <div className="px-offer-body" style={{ marginTop: 8, marginLeft: 24 }}>
                        <DualRange min={0} max={80} step={5} unit=" bps"
                          low={rng[0]} high={rng[1]}
                          onChange={({ low, high }) => setBundleRange(b.id, low, high)} />
                        <div className="px-offer-eff" style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 4 }}>
                          <span className="rate-ref-item"><span className="rate-ref-l">contingent discount range: </span><b>{rng[0]}–{rng[1]} bps</b></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 7 · CHANNEL — multi-select */}
        <div className="sim-lever-section sim-lever-section-comms">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">7</span>
            <span className="sim-lever-section-name">CHANNEL</span>
            <span className="sim-lever-section-meta">Agent call vs app push vs email — which the optimizer may use</span>
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

        {/* 8 · TIMING — renewal-notice lead + multi-touch sequencing */}
        <div className="sim-lever-section sim-lever-section-comms">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">8</span>
            <span className="sim-lever-section-name">TIMING</span>
            <span className="sim-lever-section-meta">35 / 45 / 60-day notice · multi-touch sequencing per Customer Twin</span>
          </div>
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Renewal reminder</span>
              <span className="lever-value">{(Array.isArray(noticeDays) ? noticeDays : [noticeDays]).map((d) => `${d}d`).join(" · ")} before renewal</span>
            </div>
            <div className="lever-caption">How many days before renewal the optimizer may send the reminder. Select preset reminder windows or enter a custom one.</div>
            <div className="lever-checks" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(Array.isArray(noticeDays) ? noticeDays : [noticeDays]).map((d) => (
                <label key={d} className="lever-check on" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(66, 224, 139, 0.12)", border: "1px solid var(--green)", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={true} onChange={() => toggleNotice(d)} disabled={isAutopilot} />
                  {d}-day reminder
                </label>
              ))}
              {[35, 45, 60].filter((p) => !(Array.isArray(noticeDays) ? noticeDays : [noticeDays]).includes(p)).map((p) => (
                <label key={p} className="lever-check" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--bg-2)", border: "1px solid var(--hair)", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={false} onChange={() => toggleNotice(p)} disabled={isAutopilot} />
                  {p}-day reminder
                </label>
              ))}
            </div>
            <div className="notice-custom" style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                type="number"
                min={7}
                max={120}
                placeholder="custom (7–120)"
                value={customNotice}
                onChange={(e) => setCustomNotice(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomNotice(); } }}
                disabled={isAutopilot}
                style={{ width: 130, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--hair)", background: "var(--bg-2)", color: "var(--ink)", fontSize: 12 }}
              />
              <button
                type="button"
                className="notice-custom-add"
                onClick={addCustomNotice}
                disabled={isAutopilot}
                style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--green)", background: "rgba(66, 224, 139, 0.15)", color: "var(--ink)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
              >
                + Add reminder
              </button>
            </div>
          </div>
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Multi-touch sequencing</span>
              <span className="lever-value">{multiTouch ? "on" : "single-touch"}</span>
            </div>
            <div className="lever-caption">Allow multiple sequenced touchpoints per Customer Twin.</div>
            <div className="lever-checks">
              <label className={"lever-check" + (multiTouch ? " on" : "")}>
                <input type="checkbox" checked={multiTouch} onChange={() => setMultiTouch((v) => !v)} disabled={isAutopilot} />
                Multi-touch sequence
              </label>
            </div>
          </div>
        </div>

        {/* 9 · CAMPAIGN DURATION — model horizon every candidate is scored over. */}
        <div className="sim-lever-section sim-lever-section-comms">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">9</span>
            <span className="sim-lever-section-name">CAMPAIGN DURATION</span>
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
            <span className="sim-lever-section-num">10</span>
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
