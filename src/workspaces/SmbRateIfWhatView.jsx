/* ============================================================================
   SmbRateIfWhatView — If-What (goal-driven optimization) for SMB deposit
   retention via interest-rate repricing.

   Mirrors gig's IfWhatConfig + IfWhatResults conceptually:
     CONFIG:
       1. GOAL (radio cards)
       2. CUSTOMER (cohort radio cards)
       3. ELIGIBILITY (dual-range sliders for numeric levers)
       4. OFFER (dual-range for rate uplift + multi-checkbox for moves allowed)
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
import {
  SMBRATE_HYPOTHESIS_ID,
  SMBRATE_HYPOTHESIS_TITLE,
  SMBRATE_CALIBRATION,
} from "@/data/smbRateConfig";
import "@/styles/ifwhat.css";

const PAGE_SUBTITLE = SMBRATE_HYPOTHESIS_TITLE;

const OBJECTIVES = [
  { id: "net_interest_income", label: "Maximize net interest income retained", sub: "Defend the most NII per bps of rate given · headline KPI" },
  { id: "flight_reduction",    label: "Minimize deposit outflow",             sub: "Reduce the rate at which at-risk balances leave for competitor high-yield" },
  { id: "activation_return",   label: "Maximize balances retained",           sub: "Hold the most at-risk dollars on-us with the minimum-effective reprice" },
];

const COHORT_OPTIONS = [
  { id: "full",            name: "Full at-risk book",        count: 41200, share: 0.058, sig: "Every SMB operating account showing one or more outflow signals." },
  { id: "yield-exposed",   name: "Rate-driven eligible",     count: 19900, share: 0.028, sig: "Balance at risk · genuinely rate-sensitive · margin-floor-clear." },
  { id: "dormant-saver",   name: "Mid-balance, sensitive",   count: 12600, share: 0.018, sig: "Recurring flows down · velocity declining · responds to a modest digital uplift." },
  { id: "high-value",      name: "High-balance, rate-driven", count:  7300, share: 0.010, sig: "Large idle balance · top outflow decile · acquirer relationship intact." },
  { id: "long-tenured",    name: "Long-tenured anchors",     count:  9100, share: 0.013, sig: "Multi-year relationship · large balance with partial outflow in the last 6 months." },
  { id: "multi-product",   name: "Relationship-anchorable",  count:  9100, share: 0.013, sig: "3+ products held · payroll/treasury still on-us · partial rate-shopping signals." },
];

const OFFER_PRODUCT_OPTIONS = [
  { id: "cd_7mo",          label: "Smallest rate that keeps them" },
  { id: "cd_12mo",         label: "Fixed rate increase (set tier)" },
  { id: "cd_18mo",         label: "Banker-negotiated rate" },
  { id: "hy_savings",      label: "Better rate if they keep payroll with us" },
  { id: "money_market",    label: "Match the competitor's rate" },
  { id: "smart_savings",   label: "Small in-app rate offer" },
];

const CHANNEL_OPTIONS = [
  { id: "app",    label: "In-app offer" },
  { id: "email",  label: "Email" },
  { id: "mail",   label: "Direct mail" },
  { id: "banker", label: "Banker / RM outreach" },
];

const ALWAYS_ON_CONSTRAINTS = [
  { id: "suitability",   label: "Pricing-consistency margin ≥ 0.85" },
  { id: "margin-floor", label: "Margin floor · never reprice into a negative spread" },
  { id: "model-risk",    label: "Model risk approved · rate-response model stable" },
  { id: "fraud",         label: "No-overpay rule · never reprice the will-stay segment" },
];

const DEFAULT_RANGES = {
  minBalanceK:     { low: 25,  high: 250, min: 25,  max: 500, step: 25, unit: "K",   label: "Min balance at risk to qualify", caption: "Accounts below this aren't worth the repricing cost." },
  offerCeilingBps: { low: 20, high: 60, min: 0, max: 95,  step: 1, unit: "bps", label: "Rate uplift ceiling",     caption: "Top rate uplift the optimizer may offer any single account (vs +95 to match)." },
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
   Mock optimizer — returns top-3 SMB repricing policies inside the user's
   ranges, honouring the moves/channels they allow. Scaled against
   SMBRATE_CALIBRATION so numbers stay plausible.
---------------------------------------------------------------------------- */
function runOptimizer(objective, ranges, allowedProducts, allowedChannels, cohortPresets) {
  const C = SMBRATE_CALIBRATION;
  const COHORT_COUNTS = {
    "full":            C.cohortTotal,
    "yield-exposed":   C.eligibleAfterGate,
    "dormant-saver":   C.midBalanceN,
    "high-value":      C.highBalanceN,
    "long-tenured":    C.anchorN,
    "multi-product":   C.anchorN,
  };
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  const cohortBase = list.includes("full")
    ? C.cohortTotal
    : list.reduce((s, id) => s + (COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;
  const pickProduct = (preferred, fallback) =>
    allowedProducts.includes(preferred) ? preferred
    : allowedProducts.includes(fallback) ? fallback
    : allowedProducts[0] || "cd_12mo";

  const clamp = (range, val) => Math.max(range.low, Math.min(range.high, val));

  /* Pricing-consistency margin is positioned to spread the anchors ALONG the
     Pareto trade-off so the chart shows a real curve, not 3 clustered
     points. Higher NII → lower margin (more aggressive repricing);
     lower NII → higher margin (more selective, will-stay-suppressed cohort). */
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
      netAnnualisedK: Math.round(C.netAnnualisedK * retainedScale - C.offerCostM * 1000 * (picks.offerCeilingBps / 40 - 1)),
      fairnessMargin: fairnessFor(retainedScale),
      treatmentN: Math.round((cohortBase * 0.8) * (picks.minBalanceK <= 150 ? 1.0 : 0.85)),
    },
  });

  if (objective === "net_interest_income") {
    return [
      mkRec("balanced", 1, "Minimum-effective reprice",
        "Mid-range uplift · the smallest rate that holds each segment · keeps net NII firmly positive.",
        { offerCeilingBps: clamp(ranges.offerCeilingBps, 38), minBalanceK: clamp(ranges.minBalanceK, 100),
          offerTerm: pickProduct("cd_7mo", "smart_savings") }, 1.00, 1.00),
      mkRec("aggressive", 2, "Aggressive defender",
        "Pushes the uplift ceiling to capture the rate-elastic tail — higher upside, thinner net margin.",
        { offerCeilingBps: ranges.offerCeilingBps.high, minBalanceK: ranges.minBalanceK.low,
          offerTerm: pickProduct("cd_18mo", "cd_12mo") }, 1.18, 1.12),
      mkRec("selective", 3, "Selective defender",
        "Higher balance floor + lower uplift — narrower cohort, highest cost-efficiency.",
        { offerCeilingBps: clamp(ranges.offerCeilingBps, 28), minBalanceK: clamp(ranges.minBalanceK, 200),
          offerTerm: pickProduct("cd_7mo", "smart_savings") }, 0.78, 0.85),
    ];
  }
  if (objective === "flight_reduction") {
    return [
      mkRec("steepest", 1, "Steepest outflow cut",
        "Highest uplift + broadest eligibility — maximum reduction in at-risk balances leaving.",
        { offerCeilingBps: ranges.offerCeilingBps.high, minBalanceK: ranges.minBalanceK.low,
          offerTerm: pickProduct("cd_18mo", "cd_12mo") }, 1.20, 1.25),
      mkRec("broad", 2, "Broad reach",
        "Captures more pre-migration balances with a digital rate offer.",
        { offerCeilingBps: clamp(ranges.offerCeilingBps, 45), minBalanceK: ranges.minBalanceK.low,
          offerTerm: pickProduct("cd_7mo", "smart_savings") }, 1.10, 1.18),
      mkRec("conservative", 3, "Conservative",
        "Smaller move — still measurable, much cheaper to run.",
        { offerCeilingBps: clamp(ranges.offerCeilingBps, 35), minBalanceK: clamp(ranges.minBalanceK, 100),
          offerTerm: pickProduct("cd_7mo", "smart_savings") }, 0.88, 0.95),
    ];
  }
  return [
    mkRec("primacy", 1, "Relationship-anchored",
      "A relationship-rate conditional on keeping payroll/treasury on-us prompts accounts to consolidate balances back — primary mechanism for balance retention.",
      { offerCeilingBps: clamp(ranges.offerCeilingBps, 50), minBalanceK: ranges.minBalanceK.low,
        offerTerm: pickProduct("hy_savings", "smart_savings") }, 0.90, 0.95),
    mkRec("mixed", 2, "Mixed approach",
      "A digital rate offer bridges retention and re-engagement.",
      { offerCeilingBps: clamp(ranges.offerCeilingBps, 40), minBalanceK: ranges.minBalanceK.low,
        offerTerm: pickProduct("cd_7mo", "cd_12mo") }, 0.95, 0.98),
    mkRec("wide", 3, "Wide net",
      "Targeted digital offer catches the broadest sub-segment of at-risk accounts.",
      { offerCeilingBps: clamp(ranges.offerCeilingBps, 45), minBalanceK: ranges.minBalanceK.low,
        offerTerm: pickProduct("smart_savings", "hy_savings") }, 0.98, 1.00),
  ];
}

function fmtProduct(id) {
  return OFFER_PRODUCT_OPTIONS.find((p) => p.id === id)?.label || id;
}

/* ----------------------------------------------------------------------------
   SmbRatePareto — mirrors gig's ParetoFrontier visual treatment:
   synthetic candidate cloud + frontier line + infeasible region shading +
   axis labels + always-on anchor labels + hover/select halos.
---------------------------------------------------------------------------- */
function generateSyntheticCandidates(recs, n) {
  // Generate candidates with a real Pareto trade-off shape: higher
  // NII comes at the cost of pricing-consistency margin. The margin
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
  // Sort descending by x (NII $); keep points where margin is
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

function SmbRatePareto({ recs, selectedId, onSelect }) {
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
              NII retained · $M / yr →
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
                fill="var(--acc, #ff6b6b)" opacity="0.06" />
            )}

            {/* Synthetic candidate cloud */}
            {synthetic.map((c) => {
              if (anchorIds.has(c.id)) return null;
              const infeasible = c.fair < 0.85;
              const onFrontier = frontierIds.has(c.id);
              return (
                <circle key={c.id} cx={X(c.x)} cy={Y(c.fair)}
                        r={onFrontier ? 2.6 : 2}
                        fill={infeasible ? "var(--red, #ef4444)" : (onFrontier ? "var(--acc, #ff6b6b)" : "var(--ink-3)")}
                        opacity={infeasible ? 0.45 : (onFrontier ? 0.75 : 0.35)} />
              );
            })}

            {/* Frontier line on top of cloud */}
            {frontier.length >= 2 && (
              <polyline points={frontierPath}
                        fill="none"
                        stroke="var(--acc, #ff6b6b)"
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
                    <circle cx={cx} cy={cy} r={r + 5} fill="var(--acc, #ff6b6b)" opacity="0.22" />
                  )}
                  <circle cx={cx} cy={cy} r={r}
                          fill={isTop ? "var(--acc, #ff6b6b)" : "var(--violet, #b794f6)"}
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
   SmbRateIfWhatView
   ========================================================================= */
export default function SmbRateIfWhatView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setIntermezzo,
  } = useAppShell();

  const isAutopilot = tuneMode === "autopilot";
  const activeHypId = selectedHypothesisId || SMBRATE_HYPOTHESIS_ID;

  const [mode, setMode]                       = useState("config");
  const [objective, setObjective]             = useState("net_interest_income");
  const [cohortPresets, setCohortPresets]     = useState(["yield-exposed"]);

  const toggleCohort = (id) => setCohortPresets((cur) =>
    cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((p) => p !== id)) : [...cur, id]
  );
  const [ranges, setRanges]                   = useState(DEFAULT_RANGES);
  const [allowedProducts, setAllowedProducts] = useState(["cd_7mo", "smart_savings", "money_market"]);
  const [allowedChannels, setAllowedChannels] = useState(["app", "email", "banker"]);
  /* Simulation duration — single configurable value (not a range). Default
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
  const toggleProduct = (id) => setAllowedProducts((cur) => cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id]);
  const toggleChannel = (id) => setAllowedChannels((cur) => cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]);

  const onRun = useCallback(() => {
    setMode("running");
    pushAgentEvent({
      kind: "info", src: "Optimizer",
      text: `If-What · smb-rate · maximizing ${OBJECTIVES.find((o) => o.id === objective)?.label || objective}`,
    });
  }, [pushAgentEvent, objective]);

  const onLoaderComplete = useCallback(() => {
    const recs = runOptimizer(objective, ranges, allowedProducts, allowedChannels, cohortPresets);
    setRecs(recs);
    setSelectedRecId(recs[0]?.id || null);
    setMode("results");
    pushAgentEvent({
      kind: "good", src: "Optimizer",
      text: `Found ${recs.length} repricing policies · top pick: ${recs[0]?.name}`,
    });
  }, [objective, ranges, allowedProducts, allowedChannels, cohortPresets, pushAgentEvent]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);

  const onStage = useCallback((rec) => {
    const stagedAt = Date.now();
    const policy = {
      id: `p-${stagedAt}`,
      name: rec.name,
      hypothesis: activeHypId,
      cluster: "smb-deposit-rate-defense",
      themeId: "smbrate",
      experimentType: "smbrate",
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

    return (
      <div className="results-page" style={{ "--acc": "#ff6b6b", "--acc-soft": "rgba(255,107,107,.13)" }}>
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
                        {objective === "net_interest_income" ? "NII retained / yr"
                         : objective === "flight_reduction" ? "Deposit-outflow reduction"
                         : "Balances retained / qtr"}
                      </div>
                      <div className="iw-rank-hero-v">
                        {objective === "net_interest_income" ? `+$${rec.outcomes.retainedM.toFixed(1)}M`
                         : objective === "flight_reduction" ? `−${rec.outcomes.runoffReductionPp.toFixed(2)}pp`
                         : `+${rec.outcomes.ddRecoveryPp}pp`}
                        <span className="iw-rank-kpi-est">est.</span>
                      </div>
                    </div>
                    <div className="iw-rank-summary">
                      <div className="iw-rank-summary-row">
                        <span className="iw-rank-summary-k">Uplift</span>
                        <span className="iw-rank-summary-v">+{rec.picks.offerCeilingBps}bps · {fmtProduct(rec.picks.offerTerm)}</span>
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
                    <div className="iw-dd-proof-k">NII retained</div>
                    <div className="iw-dd-proof-v">
                      +${selected.outcomes.retainedM.toFixed(1)}M
                      <span className="iw-dd-proof-est">/ yr</span>
                    </div>
                  </div>
                  <div className="iw-dd-proof-kpi iw-rank-kpi-good">
                    <div className="iw-dd-proof-k">Deposit outflow</div>
                    <div className="iw-dd-proof-v">
                      −{selected.outcomes.runoffReductionPp.toFixed(2)}pp
                      <span className="iw-dd-proof-est">vs today</span>
                    </div>
                  </div>
                  <div className="iw-dd-proof-kpi iw-rank-kpi-good">
                    <div className="iw-dd-proof-k">Balances retained on-us</div>
                    <div className="iw-dd-proof-v">
                      +{selected.outcomes.ddRecoveryPp}pp
                      <span className="iw-dd-proof-est">/ qtr</span>
                    </div>
                  </div>
                  <div className={"iw-dd-proof-kpi iw-rank-kpi-" + (selected.outcomes.netAnnualisedK >= 0 ? "good" : "warn")}>
                    <div className="iw-dd-proof-k">Net annualised value</div>
                    <div className="iw-dd-proof-v">
                      {selected.outcomes.netAnnualisedK >= 0 ? "+" : ""}${selected.outcomes.netAnnualisedK}K
                      <span className="iw-dd-proof-est">spread − rate give-up</span>
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
                      <span className="sim-guardrail-pill-l">Margin floor</span>
                      <span className="sim-guardrail-pill-d">no reprice into a negative spread</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Model risk · approved</span>
                      <span className="sim-guardrail-pill-d">rate-response model stable</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">No-overpay rule</span>
                      <span className="sim-guardrail-pill-d">will-stay segment suppressed</span>
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
                    <tr><td className="iw-detail-k">Min balance at risk to qualify</td><td className="iw-detail-v">${selected.picks.minBalanceK}K</td></tr>
                    <tr><td className="iw-detail-k">Rate uplift ceiling</td><td className="iw-detail-v">+{selected.picks.offerCeilingBps}bps</td></tr>
                    <tr><td className="iw-detail-k">Repricing move</td><td className="iw-detail-v">{fmtProduct(selected.picks.offerTerm)}</td></tr>
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
                    title="NII retained accumulation"
                    subhead="cumulative over 8-wk pilot · vs $0 baseline"
                    insight="Most retention lands in the first 4 weeks — accounts reached early lock balances on-us early."
                  />
                  <ResultTileBars
                    title="% deposit outflow / wk"
                    subhead={`drops from ${(SMBRATE_CALIBRATION.runoffBau * 100).toFixed(1)}% today to ${(SMBRATE_CALIBRATION.runoffBau * 100 - selected.outcomes.runoffReductionPp).toFixed(1)}% with policy`}
                    steady={selected.outcomes.runoffReductionPp / 8}
                    baselinePerWk={(SMBRATE_CALIBRATION.runoffBau * 100) / 8}
                    progress={1}
                    format={(n) => `${n.toFixed(2)}pp`}
                    rampWeeks={2}
                    seed={11 + selected.rank}
                    numbers={[
                      { k: "steady (with policy)", v: `${(SMBRATE_CALIBRATION.runoffBau * 100 - selected.outcomes.runoffReductionPp).toFixed(1)}% / qtr` },
                      { k: "reduction vs today",    v: `−${selected.outcomes.runoffReductionPp.toFixed(2)}pp` },
                      { k: "8-wk NII retained", v: `+$${selected.outcomes.retainedM.toFixed(1)}M` },
                    ]}
                    insight="First two weeks lag — accounts need time to act on the repricing offer. Full effect from week 3."
                    accent="var(--acc, #ff6b6b)"
                  />
                  <ResultTileBars
                    title="Balances retained on-us / wk"
                    subhead="at-risk cash holding on-us under the reprice"
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
                    insight="Retention lags the rate offer by ~3 weeks — accounts need time to re-anchor balances on-us."
                    accent="var(--violet, #b794f6)"
                  />
                  <ResultTileCohort
                    segments={[
                      { id: "ir",    label: "High-balance, rate-driven", pct: 55, color: "var(--acc, #ff6b6b)" },
                      { id: "bh",    label: "Mid-balance, sensitive",    pct: 24, color: "var(--violet, #b794f6)" },
                      { id: "irhv",  label: "Relationship-anchorable",   pct: 14, color: "var(--cyan, #4fd1c5)" },
                      { id: "edge",  label: "Will-stay (suppressed)",    pct:  7, color: "var(--ink-3)" },
                    ]}
                    treatedN={selected.outcomes.treatmentN}
                    insight={
                      selected.rank === 1
                        ? "Most of the value comes from High-balance, rate-driven accounts — the segment the optimizer's pick is calibrated for."
                        : selected.rank === 2
                          ? "Broader cohort with a wider move window — picks up some mid-balance accounts as a side effect."
                          : "Narrower targeting — concentrates spend on highest-conviction high-balance accounts only."
                    }
                  />
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
  return (
    <div className="sim-ws sim-ws-single test-journey" style={{ "--acc": "#ff6b6b", "--acc-soft": "rgba(255,107,107,.13)" }}>
      <header className="sim-ws-header">
        <div className="test-journey-eyebrow">IF-WHAT · {PAGE_SUBTITLE.toUpperCase()}</div>
        <div className="sim-ws-header-row">
          <h1 className="sim-ws-title">Find the best SMB deposit-retention policy</h1>
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
                <input type="radio" name="smbrate-iw-objective" value={o.id} checked={objective === o.id}
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
                          <option value="balance_min">Balance at risk</option>
                          <option value="dormancy_window_days">Velocity decline window (days)</option>
                          <option value="yield_gap">Rate gap vs competitor</option>
                          <option value="high_yield_search">Rate-shopping signal</option>
                          <option value="aggregator_login">ACH re-routing signal</option>
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

        {/* 4 · OFFER — dual-range + repricing-move choice-set */}
        <div className="sim-lever-section sim-lever-section-policy">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">4</span>
            <span className="sim-lever-section-name">OFFER</span>
            <span className="sim-lever-section-meta">Rate uplift range + the rate offers the optimizer may use</span>
          </div>
          <RangeRow
            label={ranges.offerCeilingBps.label}
            caption={ranges.offerCeilingBps.caption}
            unit={ranges.offerCeilingBps.unit}
            min={ranges.offerCeilingBps.min} max={ranges.offerCeilingBps.max} step={ranges.offerCeilingBps.step}
            low={ranges.offerCeilingBps.low} high={ranges.offerCeilingBps.high}
            onChange={(v) => setRange("offerCeilingBps", v)}
            ticks={[10, 50, 95]}
          />
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Rate offers the optimizer may use</span>
              <span className="lever-value">{allowedProducts.length} of {OFFER_PRODUCT_OPTIONS.length} allowed</span>
            </div>
            <div className="lever-caption">Each is a different rate offer the bank can make to a customer — the action itself, not the message or its tone. The optimizer builds its recommendation from only the ones you tick; untick one to take it off the table (e.g. forbid a full competitor match).</div>
            <div className="lever-checks">
              {OFFER_PRODUCT_OPTIONS.map((p) => {
                const on = allowedProducts.includes(p.id);
                return (
                  <label key={p.id} className={"lever-check" + (on ? " on" : "")}>
                    <input type="checkbox" checked={on} onChange={() => toggleProduct(p.id)} disabled={isAutopilot} />
                    {p.label}
                  </label>
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
