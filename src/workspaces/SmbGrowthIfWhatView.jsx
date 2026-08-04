/* ============================================================================
   SmbGrowthIfWhatView — If-What (goal-driven optimization) for SMB growth /
   re-bundle: win back the off-us credit + payments before the competitor
   deepens, leading with the highest-converting product per micro-segment.

   Mirrors gig's IfWhatConfig + IfWhatResults conceptually:
     CONFIG:
       1. GOAL (radio cards)
       2. CUSTOMER (cohort radio cards)
       3. ELIGIBILITY (dual-range sliders for numeric levers)
       4. OFFER (dual-range for intro-pricing depth + multi-checkbox for moves allowed)
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
import RangeWithBubble from "@/components/RangeWithBubble";
import ConversationalCohortBuilder from "@/components/ConversationalCohortBuilder";
import SegmentedResults from "@/components/SegmentedResults";
import {
  SMBGROWTH_HYPOTHESIS_ID,
  SMBGROWTH_HYPOTHESIS_TITLE,
  SMBGROWTH_CALIBRATION,
  SMBGROWTH_CONFIG,
  SMBGROWTH_MICROSEGMENTS,
} from "@/data/smbGrowthConfig";
import "@/styles/ifwhat.css";

const PAGE_SUBTITLE = SMBGROWTH_HYPOTHESIS_TITLE;
const ACCENT = SMBGROWTH_CONFIG.accent;

const OBJECTIVES = [
  { id: "incremental_revenue", label: "Maximize incremental NWP",         sub: "Win the most incremental Yr-1 NWP per point of rate discount given · headline KPI" },
  { id: "conversion_lift",     label: "Maximize quote-to-bind conversion", sub: "Lift the rate at which growing accounts bind the lead line back on the book" },
  { id: "primacy_return",      label: "Maximize lines per account",       sub: "Bundle the most accounts across lines with the minimum-effective price move" },
];

/* Cohort options — kept consistent with the What-If simulation's CUSTOMER
   filter (same shared cohorts, labels and counts) so the two flows read as one. */
const COHORT_OPTIONS = [
  { id: "full",            name: "Full cohort",               count: 38400, share: 0.041, sig: "Select-all · every account in the expansion cohort." },
  { id: "off-us",          name: "Off-us / insurtech placers", count: 12000, share: 0.013, sig: "New off-us placement / prior-carrier switch · coverage leaving the account." },
  { id: "multisite",       name: "Scaling multi-location",    count:  9000, share: 0.010, sig: "New location + rising payroll · BOP + WC need." },
  { id: "equipment",       name: "Fleet / equipment-heavy",   count:  8000, share: 0.008, sig: "Fleet increase · Commercial Auto fit." },
  { id: "surplus",         name: "Revenue-surge, scaling",    count: 9600, share: 0.010, sig: "Revenue accelerating · surplus · cross-line bundle + umbrella attach." },
  { id: "multi-product",   name: "Account-anchorable",        count:  9100, share: 0.010, sig: "3+ lines held · WC/GL still on the book · partial off-us placement signals." },
];

const OFFER_PRODUCT_OPTIONS = [
  { id: "card_winback",    label: "Win back the lead line", sub: "Priced to bind lead line" },
  { id: "line_preapprove", label: "Auto-quoted BOP / property", sub: "Pre-analyzed site coverage" },
  { id: "equip_finance",   label: "Commercial Auto (fleet) / inland marine", sub: "Fleet safety credit" },
  { id: "merchant",        label: "Workers Comp for added payroll", sub: "Payroll-linked WC" },
  { id: "bundle",          label: "Business Advantage bundle", sub: "Multi-line discount package" },
  { id: "sweep",           label: "Add umbrella / cyber", sub: "High-limit liability attach" },
];

/* Delivery channels — kept consistent with the What-If simulation's CHANNEL
   filter (same ids and labels) so the two flows read as one. */
const CHANNEL_OPTIONS = [
  { id: "banker",  label: "Broker / Agent" },
  { id: "app",     label: "Direct digital instant-quote" },
  { id: "rmcall",  label: "Referral underwriter" },
  { id: "email",   label: "Broker outreach + digital" },
];

const ALWAYS_ON_CONSTRAINTS = [
  { id: "pricefloor",  label: "Rate-adequacy floor · never price to bind below adequacy" },
  { id: "credit",      label: "Loss-ratio limit · expand appetite only within sound risk selection" },
  { id: "model-risk",  label: "Model risk approved · win-probability model stable (NAIC 24-08)" },
  { id: "no-overpay",  label: "No-overpay rule · never discount the will-bind-anyway segment" },
];

const DEFAULT_RANGES = {
  minBalanceK:     { low: 25,  high: 250, min: 25,  max: 500, step: 25, unit: "K",   label: "Min premium to qualify", caption: "Accounts below this aren't worth the underwriting cost." },
  offerCeilingBps: { low: 50, high: 90, min: 0, max: 120,  step: 1, unit: " bps off", label: "Rate-discount ceiling",     caption: "Deepest discount off filed rate the optimizer may offer any single account, within adequacy." },
};

/* ----------------------------------------------------------------------------
   DualRange — two-thumb min/max slider. Mirrors gig's IfWhatConfig DualRange
   1:1 so the .iw-dual* styles render identically.
---------------------------------------------------------------------------- */
function DualRange({ min, max, step, low, high, onChange, unit = "" }) {
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
  return (
    <div className="iw-dual">
      <div className="iw-dual-track" />
      <div className="iw-dual-fill" style={{ left: lowAt, right: `calc(100% - ${highAt})` }} />
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
function RangeRow({ label, caption, unit, min, max, step, low, high, onChange, ticks }) {
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
        <DualRange min={min} max={max} step={step} low={low} high={high} onChange={onChange} unit={unit} />
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
   Mock optimizer — returns top-3 SMB re-bundle policies inside the user's
   ranges, honouring the moves/channels they allow. Scaled against
   SMBGROWTH_CALIBRATION so numbers stay plausible.
---------------------------------------------------------------------------- */
function runOptimizer(objective, ranges, allowedProducts, allowedChannels, cohortPresets) {
  const C = SMBGROWTH_CALIBRATION;
  const COHORT_COUNTS = {
    "full":            C.cohortTotal,
    "off-us":          C.eligibleAfterGate,
    "multisite":       C.scalingMultisiteN,
    "equipment":       C.equipmentN,
    "surplus":         C.scalingMultisiteN,
    "multi-product":   C.scalingMultisiteN,
  };
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  const cohortBase = list.includes("full")
    ? C.cohortTotal
    : list.reduce((s, id) => s + (COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;
  const pickProduct = (preferred, fallback) =>
    allowedProducts.includes(preferred) ? preferred
    : allowedProducts.includes(fallback) ? fallback
    : allowedProducts[0] || "card_winback";

  const clamp = (range, val) => (range && range.low != null && range.high != null) ? Math.max(range.low, Math.min(range.high, val)) : (val || 75);

  /* Pricing-consistency margin is positioned to spread the anchors ALONG the
     Pareto trade-off so the chart shows a real curve, not 3 clustered
     points. Higher revenue → lower margin (more aggressive intro-pricing);
     lower revenue → higher margin (more selective, will-convert-anyway
     segment suppressed). */
  const fairnessFor = (retainedScale) => {
    // Linear inverse mapping: retainedScale 0.7 → 0.97, 1.0 → 0.92, 1.3 → 0.87
    const f = 0.97 - (retainedScale - 0.7) * (0.10 / 0.6);
    return Math.max(0.86, Math.min(0.98, f));
  };

  const mkRec = (id, rank, name, sub, picks, retainedScale, runoffScale) => ({
    id, rank, name, sub,
    picks: { ...picks, channels: allowedChannels, cohortPresets: list },
    outcomes: {
      retainedM: C.retainedDepositsAnnualM * retainedScale * (cohortBase / C.eligibleAfterGate),
      runoffReductionPp: (C.runoffReductionPp * 100) * runoffScale,
      ddRecoveryPp: 6 + (rank === 1 ? 2 : 0),
      netAnnualisedK: Math.round(C.netAnnualisedK * retainedScale - C.offerCostM * 1000 * ((picks.offerCeilingBps || 75) / 40 - 1)),
      fairnessMargin: fairnessFor(retainedScale),
      treatmentN: Math.round((cohortBase * 0.8) * ((picks.minBalanceK || 25) <= 150 ? 1.0 : 0.85)),
    },
  });

  if (objective === "incremental_revenue") {
    return [
      mkRec("balanced", 1, "Minimum-effective win-back",
        "Mid-range rate discount · per-segment win-probability model · keeps net NWP firmly positive.",
        { offerCeilingBps: clamp(ranges.offerCeilingBps, 75), minBalanceK: clamp(ranges.minBalanceK, 100),
          offerTerm: pickProduct("card_winback", "bundle") }, 1.00, 1.00),
      mkRec("aggressive", 2, "Aggressive expander",
        "Pushes the rate-flexibility ceiling to capture the price-elastic tail — higher upside, thinner net margin.",
        { offerCeilingBps: ranges.offerCeilingBps?.high || 90, minBalanceK: ranges.minBalanceK?.low || 25,
          offerTerm: pickProduct("line_preapprove", "card_winback") }, 1.18, 1.12),
      mkRec("selective", 3, "Selective expander",
        "Higher premium floor + tighter rate discount — narrower cohort, highest cost-efficiency.",
        { offerCeilingBps: clamp(ranges.offerCeilingBps, 55), minBalanceK: clamp(ranges.minBalanceK, 200),
          offerTerm: pickProduct("card_winback", "bundle") }, 0.78, 0.85),
    ];
  }
  if (objective === "conversion_lift") {
    return [
      mkRec("steepest", 1, "Steepest bind lift",
        "Deepest rate discount + broadest appetite — maximum lift in off-us accounts binding back.",
        { offerCeilingBps: ranges.offerCeilingBps?.high || 90, minBalanceK: ranges.minBalanceK?.low || 25,
          offerTerm: pickProduct("line_preapprove", "card_winback") }, 1.20, 1.25),
      mkRec("broad", 2, "Broad reach",
        "Captures more off-us accounts with a bundled-price lead-line win-back.",
        { offerCeilingBps: clamp(ranges.offerCeilingBps, 80), minBalanceK: ranges.minBalanceK?.low || 25,
          offerTerm: pickProduct("card_winback", "bundle") }, 1.10, 1.18),
      mkRec("conservative", 3, "Conservative",
        "Smaller move — still measurable, much cheaper to run.",
        { offerCeilingBps: clamp(ranges.offerCeilingBps, 65), minBalanceK: clamp(ranges.minBalanceK, 100),
          offerTerm: pickProduct("card_winback", "bundle") }, 0.88, 0.95),
    ];
  }
  return [
    mkRec("primacy", 1, "Account-anchored",
      "A bundle conditional on keeping WC/GL on the book prompts accounts to consolidate lines back — primary mechanism for lines-per-account lift.",
      { offerCeilingBps: clamp(ranges.offerCeilingBps, 85), minBalanceK: ranges.minBalanceK?.low || 25,
        offerTerm: pickProduct("bundle", "sweep") }, 0.90, 0.95),
    mkRec("mixed", 2, "Mixed approach",
      "A bundled-price lead-line win-back bridges binding and cross-line deepening.",
      { offerCeilingBps: clamp(ranges.offerCeilingBps, 70), minBalanceK: ranges.minBalanceK?.low || 25,
        offerTerm: pickProduct("card_winback", "line_preapprove") }, 0.95, 0.98),
    mkRec("wide", 3, "Wide net",
      "Umbrella / cyber attach catches the broadest sub-segment of expanding accounts.",
      { offerCeilingBps: clamp(ranges.offerCeilingBps, 80), minBalanceK: ranges.minBalanceK?.low || 25,
        offerTerm: pickProduct("sweep", "bundle") }, 0.98, 1.00),
  ];
}

function fmtProduct(id) {
  return OFFER_PRODUCT_OPTIONS.find((p) => p.id === id)?.label || id;
}

/* ----------------------------------------------------------------------------
   SmbGrowthPareto — mirrors gig's ParetoFrontier visual treatment:
   synthetic candidate cloud + frontier line + infeasible region shading +
   axis labels + always-on anchor labels + hover/select halos.
---------------------------------------------------------------------------- */
function generateSyntheticCandidates(recs, n) {
  // Generate candidates with a real Pareto trade-off shape: higher
  // revenue comes at the cost of pricing-consistency margin. The margin
  // CEILING falls linearly with revenue; each candidate sits below
  // that ceiling with noise. Some fall below the 0.85 floor (infeasible
  // region — rendered red). Anchored recs sit on or near the frontier.
  const out = [];
  const xMax = Math.max(...recs.map((r) => r.outcomes.retainedM), 12) * 1.25;
  let seed = 137;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < n; i++) {
    // X uniformly distributed across the chart
    const x = 0.5 + rand() * (xMax - 0.5);
    // Margin ceiling: high X → lower ceiling. Caps at 0.98 (low X), bottoms at 0.85 (high X).
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
  // Sort descending by x (revenue $); keep points where margin is
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

function SmbGrowthPareto({ recs, selectedId, onSelect }) {
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
              Incremental NWP · $M / yr →
            </text>
            <text x={-((PT + H - PB) / 2)} y={14} textAnchor="middle" fontSize="9.5"
                  fontFamily="var(--mono)" fill="var(--ink-3)"
                  transform={`rotate(-90, ${-((PT + H - PB) / 2)}, 14)`}
                  style={{ transformOrigin: "0 0" }}>
              ← Pricing-consistency margin
            </text>

            {/* Infeasible region — below 0.85 floor, soft red wash */}
            <rect x={PL} y={Y(0.85)} width={W - PL - PR} height={(H - PB) - Y(0.85)}
                  fill="var(--red, #ef4444)" opacity="0.05" />

            {/* Frontier shaded region — area under the frontier line */}
            {frontier.length >= 2 && (
              <polygon
                points={`${X(frontier[0].x)},${Y(0.85)} ${frontier.map((p) => `${X(p.x)},${Y(p.fair)}`).join(" ")} ${X(frontier[frontier.length - 1].x)},${Y(0.85)}`}
                fill="var(--acc, #4fd1c5)" opacity="0.06" />
            )}

            {/* Synthetic candidate cloud */}
            {synthetic.map((c) => {
              if (anchorIds.has(c.id)) return null;
              const infeasible = c.fair < 0.85;
              const onFrontier = frontierIds.has(c.id);
              return (
                <circle key={c.id} cx={X(c.x)} cy={Y(c.fair)}
                        r={onFrontier ? 2.6 : 2}
                        fill={infeasible ? "var(--red, #ef4444)" : (onFrontier ? "var(--acc, #4fd1c5)" : "var(--ink-3)")}
                        opacity={infeasible ? 0.45 : (onFrontier ? 0.75 : 0.35)} />
              );
            })}

            {/* Frontier line on top of cloud */}
            {frontier.length >= 2 && (
              <polyline points={frontierPath}
                        fill="none"
                        stroke="var(--acc, #4fd1c5)"
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
                    <circle cx={cx} cy={cy} r={r + 5} fill="var(--acc, #4fd1c5)" opacity="0.22" />
                  )}
                  <circle cx={cx} cy={cy} r={r}
                          fill={isTop ? "var(--acc, #4fd1c5)" : "var(--violet, #b794f6)"}
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
   SmbGrowthIfWhatView
   ========================================================================= */
export default function SmbGrowthIfWhatView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setExplorationMode, setIntermezzo,
  } = useAppShell();

  const isAutopilot = tuneMode === "autopilot";
  const activeHypId = selectedHypothesisId || SMBGROWTH_HYPOTHESIS_ID;

  const [mode, setMode]                       = useState("config");
  const [objective, setObjective]             = useState("incremental_revenue");
  const [cohortPresets, setCohortPresets]     = useState(["off-us"]);
  const [recommendations, setRecs]            = useState([]);
  const [selectedRecId, setSelectedRecId]     = useState(null);

  const toggleCohort = (id) => setCohortPresets((cur) =>
    cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((p) => p !== id)) : [...cur, id]
  );
  const [ranges, setRanges]                   = useState(DEFAULT_RANGES);
  // Patch a single range lever (matches the sibling If-What views). Without this
  // helper the OFFER "Rate-discount ceiling" and ELIGIBILITY sliders threw
  // "setRange is not defined" on every change and never moved.
  const setRange = (key, value) => setRanges((cur) => ({ ...cur, [key]: { ...cur[key], ...value } }));
  const [allowedProducts, setAllowedProducts] = useState(["card_winback", "bundle", "line_preapprove"]);
  const [productFlexMap, setProductFlexMap]   = useState({ card_winback: 60, line_preapprove: 45, equip_finance: 50, merchant: 40, bundle: 75, sweep: 30 });
  const [allowedChannels, setAllowedChannels] = useState(["banker", "app", "rmcall"]);
  /* Simulation duration — single configurable value (not a search dimension).
     Default 8wk matches the calibration horizon every candidate is scored over. */
  const [simWeeks, setSimWeeks] = useState(8);

  const [customOpen, setCustomOpen]   = useState(false);
  const [customRules, setCustomRules] = useState([]);
  const addRule = () => setCustomRules((cur) => [...cur, { feature: "financing_need_min", op: ">=", value: 50 }]);
  const removeRule = (idx) => setCustomRules((cur) => cur.filter((_, i) => i !== idx));
  const updateRule = (idx, patch) => setCustomRules((cur) => cur.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const toggleProduct = (id) => setAllowedProducts((cur) => cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((p) => p !== id)) : [...cur, id]);
  const setProductFlex = (id, val) => setProductFlexMap((cur) => ({ ...cur, [id]: val }));
  const toggleChannel = (id) => setAllowedChannels((cur) => cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]);

  const onRun = useCallback(() => {
    setMode("running");
    pushAgentEvent({
      kind: "info", src: "Optimizer",
      text: `If-What · smb-growth · maximizing ${OBJECTIVES.find((o) => o.id === objective)?.label || objective}`,
    });
  }, [pushAgentEvent, objective]);

  const onLoaderComplete = useCallback(() => {
    const recs = runOptimizer(objective, ranges, allowedProducts, allowedChannels, cohortPresets);
    setRecs(recs);
    setSelectedRecId(recs[0]?.id || null);
    setMode("results");
    pushAgentEvent({
      kind: "good", src: "Optimizer",
      text: `Found ${recs.length} growth-capture policies · top pick: ${recs[0]?.name}`,
    });
  }, [objective, ranges, allowedProducts, allowedChannels, cohortPresets, pushAgentEvent]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);

  const onStage = useCallback((rec) => {
    const stagedAt = Date.now();
    const policy = {
      id: `p-${stagedAt}`,
      name: rec.name,
      hypothesis: activeHypId,
      cluster: "smb-growth-expansion",
      themeId: "smbgrowth",
      experimentType: "smbgrowth",
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

  if (mode === "running") {
    return (
      <div className="sim-overlay" role="dialog" aria-modal="true" aria-label="Optimization running" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(11,15,25,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="sim-overlay-card">
          <SimulationLoader
            variant="ifwhat"
            subtitle={`IF-WHAT OPTIMIZER · ${PAGE_SUBTITLE.toUpperCase()}`}
            onComplete={onLoaderComplete}
            onCancel={onLoaderCancel}
          />
        </div>
      </div>
    );
  }

  /* ====================================================================
     RESULTS — 2 column: rec cards (left) + Pareto chart (right) + deep-dive below
     ==================================================================== */
  if (mode === "results") {
    const objLabel = OBJECTIVES.find((o) => o.id === objective)?.label || objective;
    const recList = (recommendations && recommendations.length > 0) ? recommendations : runOptimizer(objective, ranges, allowedProducts, allowedChannels, cohortPresets);
    const selected = recList.find((r) => r.id === selectedRecId) || recList[0];

    return (
      <div className="results-page" style={{ "--acc": ACCENT, "--acc-soft": "rgba(79,209,197,.13)" }}>
        <header className="results-page-header">
          <button className="tj-btn tj-btn-ghost" onClick={() => setMode("config")}>
            <Icon name="arrowLeft" size={14} /> Tune and re-run
          </button>
          <div className="results-page-title">
            <div className="test-journey-eyebrow">RESULTS · IF-WHAT OPTIMIZER · {PAGE_SUBTITLE.toUpperCase()}</div>
            <h1 className="test-journey-title">Top 3 policies · {objLabel}</h1>
          </div>
          <div style={{ display: "inline-flex", background: "var(--bg-2)", padding: "3px", borderRadius: "999px", border: "1px solid var(--hair)" }}>
            <button
              type="button"
              className="tj-btn tj-btn-ghost"
              style={{ borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: 700 }}
              onClick={() => setExplorationMode("whatif")}
            >
              WHAT-IF
            </button>
            <button
              type="button"
              className="tj-btn tj-btn-primary"
              style={{ borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: 700 }}
              onClick={() => setExplorationMode("ifwhat")}
            >
              IF-WHAT
            </button>
          </div>
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
              {recList.map((rec) => {
                const isSelected = rec.id === selectedRecId;
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
                        {objective === "incremental_revenue" ? "Incremental Yr-1 NWP"
                         : objective === "conversion_lift" ? "Quote-to-bind conversion lift"
                         : "Lines per account / qtr"}
                      </div>
                      <div className="iw-rank-hero-v">
                        {objective === "incremental_revenue" ? `+$${rec.outcomes.retainedM.toFixed(1)}M`
                         : objective === "conversion_lift" ? `+${rec.outcomes.runoffReductionPp.toFixed(2)}pp`
                         : `+${rec.outcomes.ddRecoveryPp}pp`}
                        <span className="iw-rank-kpi-est">est.</span>
                      </div>
                    </div>
                    <div className="iw-rank-summary">
                      <div className="iw-rank-summary-row">
                        <span className="iw-rank-summary-k">Rate discount</span>
                        <span className="iw-rank-summary-v">{rec.picks.offerCeilingBps}bps off · {fmtProduct(rec.picks.offerTerm)}</span>
                      </div>
                      <div className="iw-rank-summary-row">
                        <span className="iw-rank-summary-k">Min need</span>
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
                     : selected.rank === 2 ? "Reaches the objective but with a thinner pricing-consistency or profitability margin."
                     : "Lower upside but cheapest to run; useful as a baseline comparison."}
                  </div>
                </div>
              </div>

              {/* PROOF KPIs — pre-sim ranges for the selected recommendation */}
              <div className="iw-dd-block">
                <div className="iw-dd-block-h">
                  <span className="stag">PROOF KPIs · PROJECTED</span>
                  <span className="stt">Optimizer's pre-sim estimates — run a What-If on this policy to tighten into point estimates with CI</span>
                </div>
                <div className="iw-dd-proof">
                  <div className="iw-dd-proof-kpi iw-rank-kpi-good">
                    <div className="iw-dd-proof-k">Incremental Yr-1 NWP</div>
                    <div className="iw-dd-proof-v">
                      +${selected.outcomes.retainedM.toFixed(1)}M
                      <span className="iw-dd-proof-est">/ yr</span>
                    </div>
                  </div>
                  <div className="iw-dd-proof-kpi iw-rank-kpi-good">
                    <div className="iw-dd-proof-k">Quote-to-bind conversion</div>
                    <div className="iw-dd-proof-v">
                      +{selected.outcomes.runoffReductionPp.toFixed(2)}pp
                      <span className="iw-dd-proof-est">vs base</span>
                    </div>
                  </div>
                  <div className="iw-dd-proof-kpi iw-rank-kpi-good">
                    <div className="iw-dd-proof-k">Lines per account</div>
                    <div className="iw-dd-proof-v">
                      +{selected.outcomes.ddRecoveryPp}pp
                      <span className="iw-dd-proof-est">/ qtr</span>
                    </div>
                  </div>
                  <div className={"iw-dd-proof-kpi iw-rank-kpi-" + (selected.outcomes.netAnnualisedK >= 0 ? "good" : "warn")}>
                    <div className="iw-dd-proof-k">Net annualised value</div>
                    <div className="iw-dd-proof-v">
                      {selected.outcomes.netAnnualisedK >= 0 ? "+" : ""}${selected.outcomes.netAnnualisedK}K
                      <span className="iw-dd-proof-est">NWP − acquisition cost</span>
                    </div>
                  </div>
                </div>
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
                      <span className="sim-guardrail-pill-l">Pricing consistency</span>
                      <span className="sim-guardrail-pill-d">margin {selected.outcomes.fairnessMargin.toFixed(2)} vs 0.85 floor</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Price floor</span>
                      <span className="sim-guardrail-pill-d">never price to bind below rate adequacy</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Credit-risk limit</span>
                      <span className="sim-guardrail-pill-d">pre-approve only within sound underwriting</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">No-overpay rule</span>
                      <span className="sim-guardrail-pill-d">will-convert-anyway segment suppressed</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* POLICY CONFIGURATION — full lever values */}
              <div className="iw-dd-block">
                <div className="iw-dd-block-h">
                  <span className="stag">POLICY CONFIGURATION</span>
                  <span className="stt">The exact lever values that produced this result</span>
                </div>
                <table className="iw-detail-table">
                  <tbody>
                    <tr><td className="iw-detail-k">Cohort</td><td className="iw-detail-v">{(selected.picks.cohortPresets || []).map((id) => COHORT_OPTIONS.find((c) => c.id === id)?.name).filter(Boolean).join(" · ")}</td></tr>
                    <tr><td className="iw-detail-k">Min financing need to qualify</td><td className="iw-detail-v">${selected.picks.minBalanceK}K</td></tr>
                    <tr><td className="iw-detail-k">Rate-discount ceiling</td><td className="iw-detail-v">{selected.picks.offerCeilingBps}bps off</td></tr>
                    <tr><td className="iw-detail-k">Lead product</td><td className="iw-detail-v">{fmtProduct(selected.picks.offerTerm)}</td></tr>
                    <tr><td className="iw-detail-k">Delivery channels</td><td className="iw-detail-v">{selected.picks.channels.map((c) => CHANNEL_OPTIONS.find((o) => o.id === c)?.label).join(" · ")}</td></tr>
                    <tr><td className="iw-detail-k">Treated cohort size</td><td className="iw-detail-v">{selected.outcomes.treatmentN.toLocaleString()} accounts</td></tr>
                  </tbody>
                </table>
              </div>

              {/* PROJECTED OUTCOMES — 2×2 grid, mirrors What-If results page */}
              <div className="iw-dd-block">
                <div className="iw-dd-block-h">
                  <span className="stag">PROJECTED OUTCOMES</span>
                  <span className="stt">Pre-sim trajectories — running a What-If on this policy tightens these into priced curves with CI</span>
                </div>
                <div className="sim-result-grid">
                  <ResultTileNII
                    outcomes={{ NII_8wk_M: selected.outcomes.retainedM * (8 / 52) }}
                    progress={1}
                    title="Incremental NWP accumulation"
                    subhead="cumulative over 8-wk pilot · vs $0 baseline"
                    insight="Most binds land in the first 4 weeks — accounts quoted early win back the off-us coverage early."
                  />
                  <ResultTileBars
                    title="Quote-to-bind conversion / wk"
                    subhead={`rises from ${(SMBGROWTH_CALIBRATION.runoffBau * 100).toFixed(1)}% base to ${(SMBGROWTH_CALIBRATION.runoffBau * 100 + selected.outcomes.runoffReductionPp).toFixed(1)}% with policy`}
                    steady={selected.outcomes.runoffReductionPp / 8}
                    baselinePerWk={(SMBGROWTH_CALIBRATION.runoffBau * 100) / 8}
                    progress={1}
                    format={(n) => `${n.toFixed(2)}pp`}
                    rampWeeks={2}
                    seed={11 + selected.rank}
                    numbers={[
                      { k: "steady (with policy)", v: `${(SMBGROWTH_CALIBRATION.runoffBau * 100 + selected.outcomes.runoffReductionPp).toFixed(1)}% conv` },
                      { k: "lift vs base",         v: `+${selected.outcomes.runoffReductionPp.toFixed(2)}pp` },
                      { k: "8-wk incr. revenue",   v: `+$${selected.outcomes.retainedM.toFixed(1)}M` },
                    ]}
                    insight="First two weeks lag — accounts need time to act on the quote. Full effect from week 3."
                    accent="var(--acc, #4fd1c5)"
                  />
                  <ResultTileBars
                    title="Lines per account / wk"
                    subhead="off-us coverage binding back under the quote"
                    steady={selected.outcomes.ddRecoveryPp / 8}
                    baselinePerWk={0}
                    progress={1}
                    format={(n) => `${n.toFixed(2)}pp`}
                    rampWeeks={4}
                    seed={23 + selected.rank}
                    numbers={[
                      { k: "steady rate / wk", v: `${(selected.outcomes.ddRecoveryPp / 8).toFixed(2)}pp` },
                      { k: "8-wk total",       v: `+${selected.outcomes.ddRecoveryPp}pp` },
                      { k: "v1 pilot overshoot", v: "+8pp vs predicted" },
                    ]}
                    insight="Deepening lags the offer by ~3 weeks — accounts need time to re-anchor flows on-us."
                    accent="var(--violet, #b794f6)"
                  />
                  <ResultTileCohort
                    segments={[
                      { id: "ir",    label: "Off-us / insurtech placers",  pct: 55, color: "var(--acc, #4fd1c5)" },
                      { id: "bh",    label: "Scaling multi-site",          pct: 24, color: "var(--violet, #b794f6)" },
                      { id: "irhv",  label: "Equipment-heavy",             pct: 14, color: "var(--cyan, #4fd1c5)" },
                      { id: "edge",  label: "Watch / hold (suppressed)",   pct:  7, color: "var(--ink-3)" },
                    ]}
                    treatedN={selected.outcomes.treatmentN}
                    insight={
                      selected.rank === 1
                        ? "Most of the value comes from Off-us / insurtech placers — the segment the optimizer's pick is calibrated for."
                        : selected.rank === 2
                          ? "Broader cohort with a wider move window — picks up some scaling multi-site accounts as a side effect."
                          : "Narrower targeting — concentrates spend on highest-conviction off-us placers only."
                    }
                  />
                </div>
              </div>

              {/* RECOMMENDED MICRO-SEGMENTS & CONSUMER DETAILS TABLE */}
              <div className="iw-dd-block" style={{ marginTop: 20 }}>
                <SegmentedResults segments={SMBGROWTH_MICROSEGMENTS} accent="#10b981" />
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
  return (
    <div className="sim-ws sim-ws-single test-journey" style={{ "--acc": ACCENT, "--acc-soft": "rgba(79,209,197,.13)" }}>
      <header className="sim-ws-header">
        <div className="test-journey-eyebrow">IF-WHAT · {PAGE_SUBTITLE.toUpperCase()}</div>
        <div className="sim-ws-header-row">
          <h1 className="sim-ws-title">Find the best Small Commercial growth-capture policy</h1>
          <div style={{ display: "inline-flex", background: "var(--bg-2)", padding: "3px", borderRadius: "999px", border: "1px solid var(--hair)" }}>
            <button
              type="button"
              className="tj-btn tj-btn-ghost"
              style={{ borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: 700 }}
              onClick={() => setExplorationMode("whatif")}
            >
              WHAT-IF
            </button>
            <button
              type="button"
              className="tj-btn tj-btn-primary"
              style={{ borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: 700 }}
              onClick={() => setExplorationMode("ifwhat")}
            >
              IF-WHAT
            </button>
          </div>
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
                <input type="radio" name="smbgrowth-iw-objective" value={o.id} checked={objective === o.id}
                  onChange={() => setObjective(o.id)} disabled={isAutopilot} />
                <span className="iw-objective-body">
                  <span className="iw-objective-l">{o.label}</span>
                  <span className="iw-objective-d">{o.sub}</span>
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
                    <span><b>{(c.count / 1000).toFixed(0)}K</b> accounts</span>
                  </div>
                  <div className="sim-cohort-card-sig">{c.sig}</div>
                </label>
              );
            })}
          </div>
          {/* Conversational AI Cohort Builder (Commercial) */}
          <ConversationalCohortBuilder
            isCommercial={true}
            isAutopilot={isAutopilot}
            onApplyCohort={(customCohort) => {
              setCohortPresets(["off-us"]);
            }}
          />

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
                          <option value="financing_need_min">Premium size</option>
                          <option value="expansion_window_days">Expansion signal window (days)</option>
                          <option value="offus_gap">Off-us share of coverage</option>
                          <option value="offus_card_signal">Off-us placement signal</option>
                          <option value="acquirer_switch">Prior-carrier switch signal</option>
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
        </div>

        {/* 3 · ELIGIBILITY — dual-range sliders */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">3</span>
            <span className="sim-lever-section-name">ELIGIBILITY</span>
            <span className="sim-lever-section-meta">The minimum to qualify</span>
          </div>
          <MinRow
            label={ranges.minBalanceK.label}
            caption={ranges.minBalanceK.caption}
            unit={ranges.minBalanceK.unit}
            min={ranges.minBalanceK.min} max={ranges.minBalanceK.max} step={ranges.minBalanceK.step}
            value={ranges.minBalanceK.low}
            onChange={(v) => setRange("minBalanceK", { low: v })}
            ticks={[25, 250, 500]}
          />
        </div>

        {/* 4 · OFFER — dual-range + re-bundle-move choice-set */}
        <div className="sim-lever-section sim-lever-section-policy">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">4</span>
            <span className="sim-lever-section-name">OFFER</span>
            <span className="sim-lever-section-meta">Rate-discount range + the lines the optimizer may offer</span>
          </div>
          <RangeRow
            label={ranges.offerCeilingBps.label}
            caption={ranges.offerCeilingBps.caption}
            unit={ranges.offerCeilingBps.unit}
            min={ranges.offerCeilingBps.min} max={ranges.offerCeilingBps.max} step={ranges.offerCeilingBps.step}
            low={ranges.offerCeilingBps.low} high={ranges.offerCeilingBps.high}
            onChange={(v) => setRange("offerCeilingBps", v)}
            ticks={[10, 65, 120]}
          />
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Products the optimizer may offer</span>
              <span className="lever-value">{allowedProducts.length} of {OFFER_PRODUCT_OPTIONS.length} allowed</span>
            </div>
            <div className="lever-caption">Select allowed commercial products. Each selected product includes an individual rate-discount limit (bps off filed rate) slider.</div>
            <div className="iw-objectives">
              {OFFER_PRODUCT_OPTIONS.map((p) => {
                const on = allowedProducts.includes(p.id);
                const currentFlex = productFlexMap[p.id] ?? 50;
                return (
                  <div key={p.id} className={"iw-objective" + (on ? " is-selected" : "")} style={{ flexDirection: "column", alignItems: "stretch", gap: 10, padding: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", width: "100%" }}>
                      <input type="checkbox" checked={on} onChange={() => toggleProduct(p.id)} disabled={isAutopilot} />
                      <span className="iw-objective-body">
                        <span className="iw-objective-l">{p.label}</span>
                        <span className="iw-objective-d">{p.sub}</span>
                      </span>
                    </label>
                    {on && (
                      <div style={{ paddingLeft: 26, paddingTop: 6, borderTop: "1px solid var(--hair)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontFamily: "var(--ui)", color: "var(--ink-2)", marginBottom: 6 }}>
                          <span>Rate discount (off filed)</span>
                          <span style={{ fontWeight: 700, color: "var(--acc, #10b981)" }}>{currentFlex} bps off</span>
                        </div>
                        <RangeWithBubble
                          min={10} max={120} step={5} value={currentFlex}
                          onChange={(e) => setProductFlex(p.id, +e.target.value)}
                          disabled={isAutopilot}
                          formatter={(v) => `${v} bps off`}
                        />
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
