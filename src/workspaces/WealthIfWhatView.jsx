/* ============================================================================
   WealthIfWhatView — If-What (goal-driven optimization) for affluent / wealth
   attach. Structural twin of LiquidityIfWhatView.

   The GOAL + the allowed moves + the ranges are STATED; the winning motion
   (portfolio review, senior-FA, …) is an OUTPUT of the optimizer, never a
   premise. The optimizer returns the best policy + 2 alternatives on a Pareto
   frontier (new relationships [x] vs fair-treatment/suitability margin [y]);
   selecting one re-derives its micro-segment breakdown.

   Mirrors gig's IfWhatConfig + IfWhatResults conceptually:
     CONFIG:
       1. GOAL (radio cards)
       2. CUSTOMER (cohort checkboxes)
       3. ELIGIBILITY (dual-range sliders for numeric levers)
       4. ALLOWED MOVES (multi-checkbox for motions the optimizer may use)
       5. CHANNEL (multi-checkbox for channels allowed)
       6. SIMULATION DURATION
       7. GUARDRAILS (collapsed, read-only)
     RESULTS:
       Tabs: Compare all 3 (scorecard + charts) + one deep-dive per policy
       Pareto chart spreads the 3 anchors along the relationship↔fairness curve
   ========================================================================= */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAppShell } from "@/state/AppShell";
import { useSetPageContext } from "@/state/pageContext";
import SimulationLoader from "@/components/loaders/SimulationLoader";
import Icon from "@/components/Icon";
import { ResultTileNII, ResultTileBars, ResultTileCohort } from "@/components/SimResultTiles";
import SegmentedResults from "@/components/SegmentedResults";
import { WEALTH_SEGMENTS, deriveSegments } from "@/data/segmentModels";
import RangeWithBubble from "@/components/RangeWithBubble";
import CustomSegmentBuilder from "@/components/CustomSegmentBuilder";
import { RULE_ATTRS } from "@/data/customSegment";
import {
  WEALTH_HYPOTHESIS_ID,
  WEALTH_HYPOTHESIS_TITLE,
  WEALTH_CALIBRATION,
  wealthHypothesis,
} from "@/data/wealthConfig";
import "@/styles/ifwhat.css";

const PAGE_SUBTITLE = WEALTH_HYPOTHESIS_TITLE;

/* Cohort counts — the 5 WEALTH_SEGMENTS parents. Sum = 6,200 = the advice-ready
   eligible pool after the suitability gate (WEALTH_CALIBRATION.eligibleAfterGate). */
const WEALTH_COHORT_COUNTS = {
  "relationship-deep": 1700,
  "high-aum":          1100,
  "digital":           1500,
  "branch-trust":      1100,
  "early-stage":        800,
};

/* Micro-segment model for the deep-dive's "By micro-segment" tab. */
const WEALTH_SEG_MODEL = {
  segments: WEALTH_SEGMENTS,
  cohortCounts: WEALTH_COHORT_COUNTS,
  heldBackLabel: "Aspirational savers · held out by suitability gate",
  heldBackShare: 0.06,
};

/* Objective ordering is deliberate: the problem here is CONVERSION into wealth
   RELATIONSHIPS, so relationship value is the recommended (default) objective;
   AUM and fee revenue are DOWNSTREAM and demoted, last — they are the wrong
   headline goal here. Ids drive the optimizer scoring branches. */
const OBJECTIVES = [
  { id: "relationship_value", label: "Maximize new wealth relationships" },
  { id: "incremental_aum",    label: "Maximize incremental AUM" },
  { id: "funded_conversion",  label: "Maximize funded-account conversion" },
  { id: "appointments",       label: "Maximize appointment booking" },
  { id: "within_capacity",    label: "Optimize within advisor capacity" },
];

const COHORT_OPTIONS = [
  { id: "all",               name: "Full cohort",                     count: 6200, share: 0.100, sig: "Every advice-ready household — the optimizer routes each to its best-fit motion. The default scope." },
  { id: "relationship-deep", name: "Advice-ready (relationship-deep)", count: 1700, share: 0.027, sig: "Deep banking · clear, evidenced wealth gap · surplus held 90d+ · suitability ≥ 0.55." },
  { id: "high-aum",          name: "High-AUM movers",                  count: 1100, share: 0.018, sig: "$250K+ investable · external transfers firing now · time-boxed, high-conviction." },
  { id: "digital",           name: "Digitally-engaged",               count: 1500, share: 0.024, sig: "App-active · retirement / investing content engaged · curious, not yet committed." },
  { id: "branch-trust",      name: "Branch-trust",                    count: 1100, share: 0.018, sig: "Existing banker relationship · a warm banker-to-FA handoff lands best." },
  { id: "early-stage",       name: "Early-stage affluent",            count:  800, share: 0.013, sig: "Above the investable threshold · low intent · nurture before any advisor time." },
];

/* Allowed moves — the optimizer's menu (multi-select). These are the MOVES the
   optimizer is permitted to pick; the winning motion is an OUTPUT, not a premise.
   portfolio_review is allowed by default (not prescribed). Non-rate "products". */
const MOVE_OPTIONS = [
  { id: "portfolio_review", label: "Portfolio review" },
  { id: "senior_fa",        label: "Senior FA 1:1" },
  { id: "banker_handoff",   label: "Banker→FA handoff" },
  { id: "education",        label: "Educational nudge" },
  { id: "digital_starter",  label: "Digital wealth starter" },
];

const CHANNEL_OPTIONS = [
  { id: "fa",     label: "FA outreach" },
  { id: "email",  label: "Email" },
  { id: "app",    label: "In-app" },
  { id: "banker", label: "Banker" },
  { id: "phone",  label: "Phone" },
];

const ALWAYS_ON_CONSTRAINTS = [
  { id: "suitability",   label: "Suitability / Reg BI · best-interest met · evidenced advice-need required" },
  { id: "fair-treatment", label: "Fair treatment · the unready and the unsuitable are left out, not pitched" },
  { id: "capacity",      label: "Advisor capacity · senior-FA slots never over-booked beyond the pilot cap" },
  { id: "model-risk",    label: "Model risk approved · advice-readiness score stable" },
];

const DEFAULT_RANGES = {
  minInvestableK:    { low: 100, high: 250, min: 50, max: 250, step: 10, unit: "K", label: "Min investable assets to qualify", caption: "Households below this aren't worth a wealth motion's cost." },
  readinessDays:     { low: 60,  high: 90,  min: 30, max: 90,  step: 5,  unit: "d", label: "Advice-readiness window", caption: "How recently the advice-readiness signal must have fired." },
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
  /* Reference markers — `markers={[{value,label,strong}]}` or legacy `marker`. */
  const markerList = (markers && markers.length ? markers : (marker ? [marker] : []))
    .filter((m) => m && m.value != null);
  return (
    <div className="iw-dual">
      <div className="iw-dual-track" />
      <div className="iw-dual-fill" style={{ left: lowAt, right: `calc(100% - ${highAt})` }} />
      {markerList.map((m, i) => (
        <div
          key={i}
          className={"iw-dual-marker" + (m.strong ? " strong" : "")}
          style={{ left: thumbCenter(((Number(m.value) - min) / range) * 100) }}
        >
          <span className="iw-dual-marker-l" style={{ left: "50%" }}>{m.label}</span>
        </div>
      ))}
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
   Mock optimizer — returns top-3 wealth-attach policies inside the user's
   ranges, honouring the moves/channels they allow. Scaled against
   WEALTH_CALIBRATION so the numbers reconcile.

   `moves` is the set of allowed motion ids (a plain object { motionId: 0 } so
   deriveSegments reads its keys as the allowed-product set; motions are non-rate
   so the 0 bps is inert). The winning motion emerges from the routing.
---------------------------------------------------------------------------- */
function runOptimizer(objective, ranges, moves, allowedChannels, cohortPresets, customBase) {
  const C = WEALTH_CALIBRATION;
  const list = Array.isArray(cohortPresets) ? cohortPresets : [cohortPresets];
  // A fetched custom segment (customBase) REPLACES the preset cohort base.
  const cohortBase = customBase != null
    ? customBase
    : list.includes("all") || list.includes("full")
      ? Object.values(WEALTH_COHORT_COUNTS).reduce((s, n) => s + n, 0)
      : list.reduce((s, id) => s + (WEALTH_COHORT_COUNTS[id] || 0), 0) || C.eligibleAfterGate;
  /* Eligibility gate — the SAME min-investable scaling the config tile shows, so
     the optimizer treats the eligible pool. 1.0 at the default threshold (full
     cohort), reducing only as the user RAISES the floor — mirrors idle cash. */
  const _eligFrac = Math.max(0.4, Math.min(1, 1 - ((ranges.minInvestableK.low - 100) / 300)));
  const eligibleBase = Math.round(cohortBase * _eligFrac);
  const allMoves = Object.keys(moves);
  const moveAllowed = (id) => allMoves.includes(id);

  /* Fair-treatment / suitability margin is positioned to spread the anchors
     ALONG the Pareto trade-off so the chart shows a real curve, not 3 clustered
     points. More total relationships (broader reach) → slightly lower margin
     (more households pitched); the most selective policy holds the highest
     margin. Always above the 0.85 floor. */
  const fairnessFor = (relScale) => {
    // relScale 0.63 → 0.96, 1.0 → 0.94, 1.4 → 0.92
    const f = 0.96 - (relScale - 0.63) * (0.04 / 0.77);
    return Math.max(0.86, Math.min(0.97, f));
  };

  /* The 3 DISTINCT posture policies. Each is a genuinely different play —
     motion mix, advisor weighting, and the relationship↔capacity / fairness
     trade-off — not just an aggressiveness dial. The RECOMMENDED winner
     (Portfolio-Review-Led) is NOT the one with the highest per-contact
     conversion (Advisor-Weighted) — that one saturates senior-FA capacity and
     yields FEWER total relationships. Cheapest (Digital-Nurture-Led) scales but
     leaves AUM on the table. Anchored to WEALTH_CALIBRATION.

       relationships · AUM $M · advisor util · fair-treatment margin
       Portfolio-Review-Led   267   +$64M   76%   0.94   (recommended)
       Advisor-Weighted       232   +$58M   94%   0.93
       Digital-Nurture-Led    168   +$34M   41%   0.93 (low cost/conv)
  */
  const POLICY_SPECS = [
    { id: "portfolio_review_led", name: "Portfolio-Review-Led",
      sub: "Portfolio review routed by segment at the right advisor tier — the best total relationships at full suitability margin.",
      relationships: 267, aumM: 64, feeK: 320, conv: 0.043, advisorUtil: 0.76, fairness: 0.94,
      moves: ["portfolio_review", "senior_fa", "banker_handoff", "education"] },
    { id: "advisor_weighted", name: "Advisor-Weighted",
      sub: "Senior-FA-weighted — higher conversion per contact, but scarce senior-FA capacity saturates, so fewer households are reached overall.",
      relationships: 232, aumM: 58, feeK: 292, conv: 0.051, advisorUtil: 0.94, fairness: 0.93,
      moves: ["senior_fa", "portfolio_review"] },
    { id: "digital_nurture_led", name: "Digital-Nurture-Led",
      sub: "Digital-starter + education led — cheapest per conversion and scales widely, but leaves AUM on the table.",
      relationships: 168, aumM: 34, feeK: 180, conv: 0.031, advisorUtil: 0.41, fairness: 0.93,
      moves: ["digital_starter", "education", "portfolio_review"] },
  ];

  const seniorCap = ranges._seniorFaCap != null ? ranges._seniorFaCap : C.seniorFaSlotCap;
  const baseN = C.eligibleAfterGate;

  // Everything below derives from the SELECTED inputs — nothing hardcoded blindly:
  //   cohort -> reach  ·  allowed moves -> which motions appear (via deriveSegments)
  //   senior-FA cap -> saturates the advisor-weighted policy (the capacity tradeoff)
  const namedPolicy = (spec) => {
    // Intersect the policy's preferred moves with what the user actually allowed.
    let useMoves = spec.moves.filter((m) => moveAllowed(m));
    if (!useMoves.length) useMoves = allMoves.length ? allMoves : ["portfolio_review"];
    // deriveSegments reads keys of `moveMap` as the allowed-product (motion) set.
    const moveMap = Object.fromEntries(useMoves.map((m) => [m, 0]));

    // Scale the spec anchors by the ELIGIBLE cohort reach vs the calibrated base.
    const reachScale = eligibleBase / baseN;
    let relationships = Math.round(spec.relationships * reachScale);
    let aumM = +(spec.aumM * reachScale).toFixed(1);
    let advisorUtil = spec.advisorUtil;

    // Senior-FA capacity bites the advisor-weighted policy: if its routing
    // over-books the senior-FA cap, conversions clip and util saturates near 1.
    if (spec.id === "advisor_weighted") {
      const seniorDemand = Math.round(relationships * 1.9);   // heavy senior-FA routing
      if (seniorDemand > seniorCap) {
        const clip = seniorCap / seniorDemand;
        relationships = Math.round(relationships * (0.78 + 0.22 * clip));
        aumM = +(aumM * (0.80 + 0.20 * clip)).toFixed(1);
        advisorUtil = Math.min(0.97, spec.advisorUtil + (1 - clip) * 0.12);
      }
    }

    const relScale = relationships / 267;
    const fairness = +(Math.min(spec.fairness, fairnessFor(relScale))).toFixed(2);
    const treated = Math.round(eligibleBase * (C.treatmentN / baseN));
    const conv = spec.conv;
    const feeK = Math.round(spec.feeK * reachScale);
    const costPerConv = C.costPerConvUSD * (spec.id === "digital_nurture_led" ? 0.55 : spec.id === "advisor_weighted" ? 1.35 : 1.0);
    const netK = Math.round(feeK - (relationships * costPerConv) / 1000);
    // External flight defended scales with reach (BAU 18% → 13.5% on the recommended).
    const flightReductionPp = +((C.runoffReductionPp * 100) * (relScale * 0.9 + 0.1)).toFixed(1);

    return {
      id: spec.id, name: spec.name, sub: spec.sub,
      picks: {
        moves: moveMap, blendedConv: conv, minInvestableK: ranges.minInvestableK.low,
        channels: allowedChannels, cohortPresets: list, seniorFaCap: seniorCap,
      },
      outcomes: {
        // retainedM CARRIES INCREMENTAL AUM ($M) — the value the segment engine splits.
        retainedM: aumM,
        eligibleN: eligibleBase,   // the cohort the scenario models (no RCT here)
        newRelationships: relationships,
        fundedConversion: conv,
        incrementalAumM: aumM,
        feeRevenueK: feeK,
        appointments: Math.round(relationships * (C.appointments / C.newRelationships)),
        advisorUtil,
        runoffReductionPp: flightReductionPp,
        netAnnualisedK: netK,
        treatmentN: treated,
        fairnessMargin: fairness,
        costPerConvUSD: Math.round(costPerConv),
      },
    };
  };

  const recs = POLICY_SPECS.map(namedPolicy);

  // Rank by the chosen objective so the recommended (#1) is whichever policy
  // actually wins for the selected inputs.
  const score = (r) => {
    switch (objective) {
      case "incremental_aum":   return r.outcomes.incrementalAumM;
      case "funded_conversion": return r.outcomes.fundedConversion;
      case "appointments":      return r.outcomes.appointments;
      case "within_capacity":   // best relationships per unit of advisor capacity used
        return r.outcomes.newRelationships / Math.max(0.2, r.outcomes.advisorUtil);
      case "relationship_value":
      default:                  return r.outcomes.newRelationships;
    }
  };
  return recs
    .slice()
    .sort((a, b) => score(b) - score(a))
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

function fmtMove(id) {
  return MOVE_OPTIONS.find((m) => m.id === id)?.label || id;
}

/* ----------------------------------------------------------------------------
   PolicyCompare — the "Compare all 3" tab content. A scorecard matrix
   (metrics × the 3 policies, inline bars, recommended column tinted, row winner
   highlighted) + overlaid trend charts (the 3 policies built over the test) +
   the motion-allocation mix.
---------------------------------------------------------------------------- */
const CMP_RAMP = [0.08, 0.20, 0.34, 0.49, 0.63, 0.76, 0.88, 1.0];
function niceCeil(x) {
  if (!(x > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const n = x / p;
  const step = n <= 1 ? 1 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 3 ? 3 : n <= 5 ? 5 : 10;
  return step * p;
}
const CMP_COL = { portfolio_review_led: "var(--acc, #14b8a6)", advisor_weighted: "var(--acq, #5b9dff)", digital_nurture_led: "var(--violet, #b794f6)" };
/* Motion families for the allocation mix bar. */
const CMP_GROUPS = [
  { k: "Review",  col: "#14b8a6", test: (l) => l.includes("portfolio") || l.includes("review") },
  { k: "Sr FA",   col: "#5b9dff", test: (l) => l.includes("senior") || l.includes("fa 1:1") },
  { k: "Handoff", col: "#4fd1c5", test: (l) => l.includes("handoff") || l.includes("banker") },
  { k: "Digital", col: "#ffb15a", test: (l) => l.includes("digital") },
  { k: "Educate", col: "#b794f6", test: () => true },
];
/* Motion mix for a policy, from the SAME per-segment routing the micro-segment
   table shows (deriveSegments), grouped by motion family and reach-weighted. */
function cmpMixOf(rec) {
  const seg = deriveSegments(WEALTH_SEG_MODEL, {
    cohortPresets: rec.picks.cohortPresets,
    productOffers: rec.picks.moves,
    channels: rec.picks.channels,
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

const CMP_BASE_LEAK = 18;
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
  if (!recs.length || recs[0]?.outcomes?.newRelationships == null) return null;
  const ser = recs.map((r) => ({
    id: r.id, rank: r.rank, name: r.name, rec: r.rank === 1, col: CMP_COL[r.id] || "#888",
    rel: r.outcomes.newRelationships,
    aum: r.outcomes.incrementalAumM,
    conv: (r.outcomes.fundedConversion ?? 0) * 100,
    util: (r.outcomes.advisorUtil ?? 0) * 100,
    flight: CMP_BASE_LEAK - (r.outcomes.runoffReductionPp ?? 0),
    fee: r.outcomes.feeRevenueK ?? 0,
    mixSegs: cmpMixOf(r),
    short: r.name.split(/[\s-]/)[0],
  }));
  const ROWS = [
    { k: "New wealth relationships", get: (s) => s.rel,    fmt: (v) => Math.round(v).toLocaleString() },
    { k: "Conversion rate",          get: (s) => s.conv,   fmt: (v) => `${v.toFixed(1)}%` },
    { k: "Incremental AUM",          get: (s) => s.aum,    fmt: (v) => `+$${v.toFixed(0)}M` },
    { k: "Annual fee revenue",       get: (s) => s.fee,    fmt: (v) => `+$${Math.round(v)}K` },
    { k: "External flight",          get: (s) => s.flight, fmt: (v) => `${v.toFixed(1)}%`, lower: true },
    { k: "Advisor utilisation",      get: (s) => s.util,   fmt: (v) => `${v.toFixed(0)}%` },
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
          <span className="stt">Advisor-Weighted converts hardest per contact; Portfolio-Review-Led builds the most relationships</span>
        </div>
        <div className="panel-body">
          <div className="cmp-legend">
            {ser.map((s) => (<span key={s.id} className="cmp-leg"><i style={{ background: s.col }} /> {s.name}</span>))}
          </div>
          <div className="cmp-grid">
            <CmpLines ser={ser} gid="cmpRel" title="Cumulative new relationships" finalOf={(s) => s.rel} fmt={(v) => Math.round(v).toLocaleString()} />
            <CmpLines ser={ser} gid="cmpAum" title="Cumulative incremental AUM" finalOf={(s) => s.aum} fmt={(v) => `$${Math.round(v)}M`} />
            <CmpLines ser={ser} gid="cmpFlight" title="External flight" finalOf={(s) => s.flight} fmt={(v) => `${v.toFixed(1)}%`} down />
            <div className="cmp-chart">
              <div className="cmp-chart-t">Motion allocation mix</div>
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
                  <span><i style={{ background: "#14b8a6" }} />Review</span>
                  <span><i style={{ background: "#5b9dff" }} />Sr FA</span>
                  <span><i style={{ background: "#4fd1c5" }} />Handoff</span>
                  <span><i style={{ background: "#ffb15a" }} />Digital</span>
                  <span><i style={{ background: "#b794f6" }} />Educate</span>
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
   WealthPareto — mirrors gig's ParetoFrontier visual treatment:
   synthetic candidate cloud + frontier line + infeasible region shading +
   axis labels + always-on anchor labels + hover/select halos.
   X-axis = new wealth relationships (count); Y-axis = fair-treatment margin.
---------------------------------------------------------------------------- */
function generateSyntheticCandidates(recs, n) {
  // Higher relationship count comes at the cost of fair-treatment margin (more
  // households pitched). The margin CEILING falls linearly with the count; each
  // candidate sits below that ceiling with noise; ~12% drop below the 0.85 floor
  // (infeasible — rendered red). Anchored recs sit on or near the frontier.
  const out = [];
  const xMax = Math.max(...recs.map((r) => r.outcomes.newRelationships), 200) * 1.25;
  let seed = 137;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < n; i++) {
    const x = 20 + rand() * (xMax - 20);
    const ceiling = 0.985 - (x / xMax) * 0.135;
    const r1 = rand();
    let y;
    if (r1 < 0.12) {
      y = 0.76 + rand() * 0.09;            // infeasible — below floor
    } else if (r1 < 0.55) {
      y = ceiling - rand() * 0.04;         // near-frontier
    } else {
      y = ceiling - 0.04 - rand() * 0.08;  // dominated
    }
    y = Math.max(0.74, Math.min(0.99, y));
    out.push({ id: `syn-${i}`, x, fair: y });
  }
  return out;
}

function computeFrontier(points) {
  // Sort descending by x (relationships); keep points where margin is
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

function WealthPareto({ recs, selectedId, onSelect }) {
  const W = 540, H = 320, PL = 56, PR = 22, PT = 24, PB = 46;

  const relVals = recs.map((r) => r.outcomes.newRelationships);
  const xMin = 0, xMax = Math.max(...relVals, 200) * 1.3;
  const yMin = 0.74, yMax = 1.00;
  const X = (v) => PL + ((v - xMin) / (xMax - xMin)) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - yMin) / (yMax - yMin)) * (H - PT - PB);

  const synthetic = React.useMemo(() => generateSyntheticCandidates(recs, 220), [recs]);
  const anchorIds = new Set(recs.map((r) => r.id));
  const allPoints = [
    ...synthetic.map((s) => ({ id: s.id, x: s.x, fair: s.fair })),
    ...recs.map((r) => ({ id: r.id, x: r.outcomes.newRelationships, fair: r.outcomes.fairnessMargin })),
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
                      fontFamily="var(--mono)" fill="var(--ink-4)">{Math.round(v)}</text>
              </g>
            ))}

            {/* Axis labels */}
            <text x={(PL + W - PR) / 2} y={H - 10} textAnchor="middle" fontSize="9.5"
                  fontFamily="var(--mono)" fill="var(--ink-3)">
              New wealth relationships →
            </text>
            <text x={-((PT + H - PB) / 2)} y={14} textAnchor="middle" fontSize="9.5"
                  fontFamily="var(--mono)" fill="var(--ink-3)"
                  transform={`rotate(-90, ${-((PT + H - PB) / 2)}, 14)`}
                  style={{ transformOrigin: "0 0" }}>
              ← Fair-treatment margin
            </text>

            {/* Infeasible region — below 0.85 floor, soft red wash */}
            <rect x={PL} y={Y(0.85)} width={W - PL - PR} height={(H - PB) - Y(0.85)}
                  fill="var(--red, #ef4444)" opacity="0.05" />

            {/* Frontier shaded region — area under the frontier line */}
            {frontier.length >= 2 && (
              <polygon
                points={`${X(frontier[0].x)},${Y(0.85)} ${frontier.map((p) => `${X(p.x)},${Y(p.fair)}`).join(" ")} ${X(frontier[frontier.length - 1].x)},${Y(0.85)}`}
                fill="var(--acc, #14b8a6)" opacity="0.06" />
            )}

            {/* Synthetic candidate cloud */}
            {synthetic.map((c) => {
              if (anchorIds.has(c.id)) return null;
              const infeasible = c.fair < 0.85;
              const onFrontier = frontierIds.has(c.id);
              return (
                <circle key={c.id} cx={X(c.x)} cy={Y(c.fair)}
                        r={onFrontier ? 2.6 : 2}
                        fill={infeasible ? "var(--red, #ef4444)" : (onFrontier ? "var(--acc, #14b8a6)" : "var(--ink-3)")}
                        opacity={infeasible ? 0.45 : (onFrontier ? 0.75 : 0.35)} />
              );
            })}

            {/* Frontier line on top of cloud */}
            {frontier.length >= 2 && (
              <polyline points={frontierPath}
                        fill="none"
                        stroke="var(--acc, #14b8a6)"
                        strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                        opacity="0.78" />
            )}

            {/* Named anchors — the 3 recommendations */}
            {recs.map((rec) => {
              const isSelected = rec.id === selectedId;
              const r = isSelected ? 9 : 7;
              const cx = X(rec.outcomes.newRelationships);
              const cy = Y(rec.outcomes.fairnessMargin);
              const isTop = rec.rank === 1;
              return (
                <g key={rec.id} style={{ cursor: "pointer" }} onClick={() => onSelect(rec.id)}>
                  <circle cx={cx} cy={cy} r="14" fill="transparent" />
                  {isSelected && (
                    <circle cx={cx} cy={cy} r={r + 5} fill="var(--acc, #14b8a6)" opacity="0.22" />
                  )}
                  <circle cx={cx} cy={cy} r={r}
                          fill={isTop ? "var(--acc, #14b8a6)" : "var(--violet, #b794f6)"}
                          stroke="var(--panel)" strokeWidth={isSelected ? 2.4 : 1.6} />
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
   WealthIfWhatView
   ========================================================================= */
export default function WealthIfWhatView() {
  const {
    selectedHypothesisId, navigate: navWorkspace, stagePolicy, pushAgentEvent,
    tuneMode, setIntermezzo,
  } = useAppShell();

  const isAutopilot = tuneMode === "autopilot";
  const activeHypId = selectedHypothesisId || WEALTH_HYPOTHESIS_ID;
  // Seed the optimizer from the chosen hypothesis (A/B/C): card B restricts the
  // allowed-move menu to advisor-led motions on the high-AUM cohort, C to the
  // digital path on the digital cohort. Card A keeps the full menu + all cohorts
  // (the optimizer picks best-fit). Mirrors idle-cash's ifWhatOffers seeding.
  const seedHyp = wealthHypothesis(activeHypId);
  const seedCohort = (seedHyp.cohort && !seedHyp.cohort.includes("all"))
    ? seedHyp.cohort
    : ["all"];   // default to the Full-cohort scope (like idle cash), not every tile
  const seedMoves = Object.fromEntries((seedHyp.moves || []).map((m) => [m, 0]));

  const [mode, setMode]                       = useState("config");
  const [objective, setObjective]             = useState("relationship_value");
  // Default-select the hypothesis's cohorts (card A = all 5, so all 7 segments show).
  const [cohortPresets, setCohortPresets]     = useState(seedCohort);

  const toggleCohort = (id) => {
    setUseCustom(false);                                                          // picking a preset clears the custom segment
    setCohortPresets((cur) => {
      if (id === "all") return ["all"];                                          // Full cohort is exclusive
      const base = cur.filter((p) => p !== "all");                               // picking a specific drops Full cohort
      const next = base.includes(id) ? base.filter((p) => p !== id) : [...base, id];
      return next.length ? next : ["all"];                                       // empty → back to Full cohort
    });
  };
  const [ranges, setRanges]                   = useState(DEFAULT_RANGES);
  // Allowed moves — the optimizer's motion menu: { motionId: 0 }. Presence = allowed.
  // portfolio_review is allowed by default (not prescribed — it is one of the moves).
  const [moves, setMoves]                     = useState(
    Object.keys(seedMoves).length ? seedMoves
      : { portfolio_review: 0, senior_fa: 0, banker_handoff: 0, education: 0, digital_starter: 0 }
  );
  const allowedMoves = Object.keys(moves);
  const [allowedChannels, setAllowedChannels] = useState(["fa", "email", "app", "banker"]);
  /* Senior-FA slot cap — a guardrail the optimizer must route within; over-routing
     to senior_fa saturates this cap (the Advisor-Weighted tradeoff). */
  const [seniorFaCap, setSeniorFaCap]         = useState(WEALTH_CALIBRATION.seniorFaSlotCap);
  /* Simulation duration — single configurable value (not a range). */
  const [simWeeks, setSimWeeks]               = useState(8);
  const [recommendations, setRecs]            = useState([]);
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
          useCase: "wealth",
          objective: OBJECTIVES.find((o) => o.id === objective)?.label,
          recommended: recommendations[0]?.name,
          policies: recommendations.map((r) => ({
            rank: r.rank, name: r.name,
            newRelationships: r.outcomes?.newRelationships,
            conversionPct: r.outcomes?.fundedConversion != null ? +(r.outcomes.fundedConversion * 100).toFixed(1) : undefined,
            incrementalAumM: r.outcomes?.incrementalAumM,
            feeRevenueK: r.outcomes?.feeRevenueK,
          })),
          cohort: recommendations[0]?.outcomes?.treatmentN != null
            ? { treatmentN: recommendations[0].outcomes.treatmentN, controlN: Math.round(recommendations[0].outcomes.treatmentN / 4), eligibleN: recommendations[0].outcomes.treatmentN + Math.round(recommendations[0].outcomes.treatmentN / 4) }
            : undefined,
        }
      : { useCase: "wealth" },
    [mode, objective, recommendations]
  );
  useSetPageContext(mode === "results" ? "ifwhat-results" : "ifwhat-config", _askFacts);

  const setRange = (key, value) => setRanges((cur) => ({ ...cur, [key]: { ...cur[key], ...value } }));
  // Keep ≥1 move/channel allowed — an empty allow-list has no well-defined
  // optimizer pick and makes the policy band + micro-segments diverge.
  const toggleMove = (id) => setMoves((cur) => {
    if (cur[id] != null) { const next = { ...cur }; delete next[id]; return Object.keys(next).length ? next : cur; }
    return { ...cur, [id]: 0 };
  });
  const toggleChannel = (id) => setAllowedChannels((cur) => cur.includes(id) ? (cur.length === 1 ? cur : cur.filter((c) => c !== id)) : [...cur, id]);

  const onRun = useCallback(() => {
    setMode("running");
    pushAgentEvent({
      kind: "info", src: "Optimizer",
      text: `If-What · wealth attach · maximizing ${OBJECTIVES.find((o) => o.id === objective)?.label || objective}`,
    });
  }, [pushAgentEvent, objective]);

  const onLoaderComplete = useCallback(() => {
    const recs = runOptimizer(objective, { ...ranges, _seniorFaCap: seniorFaCap }, moves, allowedChannels, cohortPresets, customBase);
    setRecs(recs);
    setResultTab("compare");
    setMode("results");
    pushAgentEvent({
      kind: "good", src: "Optimizer",
      text: `Found ${recs.length} wealth-attach policies · top pick: ${recs[0]?.name}`,
    });
  }, [objective, ranges, seniorFaCap, moves, allowedChannels, cohortPresets, customBase, pushAgentEvent]);

  const onLoaderCancel = useCallback(() => setMode("config"), []);

  const onStage = useCallback((rec) => {
    const stagedAt = Date.now();
    const oc = rec.outcomes || {};
    const treatmentN = oc.treatmentN || 0;
    const controlN = Math.round(treatmentN / 4);   // ~80/20 split
    const policy = {
      id: `p-${stagedAt}`,
      name: rec.name,
      hypothesis: activeHypId,
      cluster: "cluster_wealth_attach",
      themeId: "wealth",
      experimentType: "wealth",
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
        pilotWeeks: 12,
        valueAtStakeM: oc.incrementalAumM,
        kpis: [
          { key: "aum",       label: "Incremental AUM",          unit: "$M", value: oc.incrementalAumM,           tau: 2.4, drift: 0.05 },
          { key: "newrel",    label: "New wealth relationships", unit: "#",  value: oc.newRelationships,          tau: 2.2, drift: 0.04 },
          { key: "flight_pp", label: "External flight (Δ pp)",   unit: "pp", value: -(oc.runoffReductionPp || 0), tau: 1.8, drift: 0.05 },
          { key: "fee",       label: "Fee revenue (annual)",     unit: "$K", value: oc.feeRevenueK,               tau: 2.0, drift: 0.04 },
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
     RESULTS — tabs: Compare all 3 (scorecard + charts) + deep-dive per policy
     ==================================================================== */
  if (mode === "results") {
    const objLabel = OBJECTIVES.find((o) => o.id === objective)?.label || objective;
    const selected = recommendations.find((r) => r.id === resultTab) || recommendations[0];

    // ── Deep-dive micro-segment derivation (for the SegmentedResults tabs) ──
    const _o = selected ? selected.outcomes : null;
    // retainedM carries INCREMENTAL AUM ($M); the segment engine splits it by value-weight.
    const _seg = selected ? deriveSegments(WEALTH_SEG_MODEL, {
      cohortPresets: selected.picks.cohortPresets,
      productOffers: selected.picks.moves,
      channels: (allowedChannels && allowedChannels.length ? allowedChannels : ["fa", "email", "app"]),
    }, { ..._o, reachTarget: _o.eligibleN }) : null;

    const _baseFlightPp = WEALTH_CALIBRATION.runoffBau * 100;                  // 18.0%
    const _withFlightPp = selected ? Math.max(_baseFlightPp - _o.runoffReductionPp, 2) : _baseFlightPp;

    // KPI strip — the LEAD KPI (Tier 1) MUST match the optimized objective and
    // the rank-card hero. The other tiles are supporting context. PRIMARY = new
    // wealth relationships; SECONDARY = incremental AUM; then conversion, fee
    // (downstream), advisor util, external flight.
    const _conv      = _o ? _o.fundedConversion : WEALTH_CALIBRATION.conversionWithPolicy;
    const _mRel      = { label: "New wealth relationships", value: `${_o ? _o.newRelationships.toLocaleString() : 0}`, baseline: `${_o ? Math.round((_o.eligibleN || 0) * WEALTH_CALIBRATION.conversionBau).toLocaleString() : 0}` };
    const _mAum      = { label: "Incremental AUM attached", value: `+$${_o ? _o.incrementalAumM.toFixed(0) : 0}M`, baseline: "$0" };
    const _mConv     = { label: "Wealth-relationship conversion", value: `${(_conv * 100).toFixed(1)}%`, baseline: "1.8%" };
    const _mFee      = { label: "Projected annual advisory fee revenue", value: `+$${_o ? Math.round(_o.feeRevenueK) : 0}K`, baseline: "$0" };
    const _mUtil     = { label: "Advisor-capacity utilisation", value: `${_o ? Math.round(_o.advisorUtil * 100) : 0}%`, baseline: "—" };
    const _mFlight   = { label: "External flight", value: `${_withFlightPp.toFixed(1)}%`, baseline: `${_baseFlightPp.toFixed(1)}%` };
    const _mAppt     = { label: "Appointments booked", value: `${_o ? _o.appointments.toLocaleString() : 0}`, baseline: "—" };
    const _kpis = !selected ? [] :
      objective === "incremental_aum"
        ? [_mAum, _mRel, _mConv, _mFee, _mFlight]
        : objective === "funded_conversion"
          ? [_mConv, _mRel, _mAum, _mFee, _mFlight]
          : objective === "appointments"
            ? [_mAppt, _mRel, _mConv, _mAum, _mFlight]
            : objective === "within_capacity"
              ? [_mRel, _mUtil, _mConv, _mAum, _mFlight]
              : [_mRel, _mAum, _mConv, _mFee, _mFlight];
    const _valueLabel = "AUM $M";
    // Policy band (the levers that produced this) — shown atop the Aggregate tab.
    const _policy = selected ? [
      { k: "Cohort", v: `${(selected.picks.cohortPresets || []).map((id) => COHORT_OPTIONS.find((c) => c.id === id)?.name).filter(Boolean).join(", ") || "All"} · ${(_o?.eligibleN || 0).toLocaleString()} eligible households` },
      { k: "Min investable", v: `$${selected.picks.minInvestableK}K` },
      { k: "Allowed moves", v: Object.keys(selected.picks.moves || {}).map((id) => fmtMove(id)).join(" · ") || "—" },
      { k: "Channels", v: selected.picks.channels.map((c) => CHANNEL_OPTIONS.find((o) => o.id === c)?.label).filter(Boolean).join(", ") },
    ] : [];
    const _rel = _o ? _o.newRelationships : 0;
    const _chartsGrid = selected ? (
      <div className="sim-result-grid">
        <ResultTileNII
          outcomes={{ NII_8wk_M: _o.incrementalAumM || 0 }}
          progress={1}
          title="Incremental AUM accumulation"
          subhead="cumulative held-away assets attached · 8-wk test"
          insight="Most AUM attaches in the first weeks after the wealth conversation lands."
        />
        <ResultTileBars
          title="External flight / wk"
          subhead={`${_baseFlightPp.toFixed(1)}% today → ${_withFlightPp.toFixed(1)}% with policy`}
          steady={_o.runoffReductionPp / 8}
          baselinePerWk={_baseFlightPp / 8}
          progress={1}
          format={(n) => `${n.toFixed(2)}pp`}
          rampWeeks={2}
          seed={11}
          numbers={[{ k: "reduction vs today", v: `−${_o.runoffReductionPp.toFixed(1)}pp` }]}
          insight="Flight slows from week 3 once households commit to the relationship."
          accent="var(--acc,#14b8a6)"
        />
        <ResultTileBars
          title="New relationships / wk"
          subhead="projected ramp · 8-wk test"
          steady={_rel / 8}
          baselinePerWk={0}
          progress={1}
          format={(n) => Math.round(n).toLocaleString()}
          rampWeeks={4}
          seed={23}
          numbers={[{ k: "8-wk total", v: _rel.toLocaleString() }]}
          insight="Conversions lag the outreach by ~3 weeks, then ramp."
          accent="var(--violet,#b794f6)"
        />
        <ResultTileNII
          outcomes={{ NII_8wk_M: (_o.feeRevenueK / 1000) }}
          progress={1}
          title="Fee revenue accumulation (downstream)"
          subhead="cumulative annual fee revenue · downstream of conversion"
          insight="Fee revenue is downstream — it follows the funded relationships, not the headline."
        />
      </div>
    ) : null;

    return (
      <div className="results-page" style={{ "--acc": "#14b8a6", "--acc-soft": "rgba(20,184,166,.13)" }}>
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
            {/* TOP 3 RECOMMENDATIONS — horizontal cards */}
            <section className="panel reveal in iw-recs-row">
              <div className="panel-h">
                <span className="stag">TOP 3 RECOMMENDATIONS</span>
                <span className="stt">Click the card to inspect</span>
              </div>
              <div className="panel-body iw-recs-grid">
              {recommendations.map((rec) => {
                const isSelected = rec.id === resultTab;
                // Derive the card summary the SAME way as the deep-dive, so the
                // card's motion mix matches the per-segment detail.
                const _recSeg = deriveSegments(WEALTH_SEG_MODEL, {
                  cohortPresets: rec.picks.cohortPresets,
                  productOffers: rec.picks.moves,
                  channels: rec.picks.channels,
                }, rec.outcomes);
                const _recMotions = [...new Set((_recSeg.rows || []).map((r) => r.product))].filter(Boolean);
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
                        {objective === "incremental_aum" ? "Incremental AUM attached"
                         : objective === "funded_conversion" ? "Wealth-relationship conversion"
                         : objective === "appointments" ? "Appointments booked"
                         : "New wealth relationships"}
                      </div>
                      <div className="iw-rank-hero-v">
                        {objective === "incremental_aum" ? `+$${rec.outcomes.incrementalAumM.toFixed(0)}M`
                         : objective === "funded_conversion" ? `${(rec.outcomes.fundedConversion * 100).toFixed(1)}%`
                         : objective === "appointments" ? rec.outcomes.appointments.toLocaleString()
                         : rec.outcomes.newRelationships.toLocaleString()}
                        <span className="iw-rank-kpi-est">est.</span>
                      </div>
                    </div>
                    <div className="iw-rank-summary">
                      <div className="iw-rank-summary-row">
                        <span className="iw-rank-summary-k">Conversion</span>
                        <span className="iw-rank-summary-v">{(rec.outcomes.fundedConversion * 100).toFixed(1)}% · {rec.outcomes.newRelationships.toLocaleString()} rel.</span>
                      </div>
                      <div className="iw-rank-summary-row">
                        <span className="iw-rank-summary-k">Incremental AUM</span>
                        <span className="iw-rank-summary-v">+${rec.outcomes.incrementalAumM.toFixed(0)}M</span>
                      </div>
                      <div className="iw-rank-summary-row">
                        <span className="iw-rank-summary-k">Advisor util · motions</span>
                        <span className="iw-rank-summary-v">{Math.round(rec.outcomes.advisorUtil * 100)}% · {_recMotions.length} motion{_recMotions.length > 1 ? "s" : ""}</span>
                      </div>
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
                    {selected.rank === 1 ? "Best on the chosen objective while respecting suitability, fair treatment and advisor capacity."
                     : selected.rank === 2 ? "Reaches the objective but with a thinner fairness margin or saturated advisor capacity."
                     : "Lower upside but cheapest to run; useful as a scale baseline."}
                  </div>
                </div>
              </div>

              {/* RESULTS — 5 KPIs (both tabs) + tabs: Aggregate charts | By micro-segment table */}
              <div className="iw-dd-block">
                <SegmentedResults
                  kpis={_kpis}
                  accent="#14b8a6"
                  objective={objLabel}
                  valueLabel={_valueLabel}
                  valueScale={1}
                  segments={_seg}
                  policy={_policy}
                  charts={_chartsGrid}
                  anchorRate={0}
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
                      <span className="sim-guardrail-pill-l">Suitability / fair treatment</span>
                      <span className="sim-guardrail-pill-d">margin {selected.outcomes.fairnessMargin.toFixed(2)} vs 0.85 floor</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Advisor capacity</span>
                      <span className="sim-guardrail-pill-d">{Math.round(selected.outcomes.advisorUtil * 100)}% util · within senior-FA cap</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Model risk · approved</span>
                      <span className="sim-guardrail-pill-d">advice-readiness score stable</span>
                    </span>
                    <span className="sim-guardrail-pill sim-guardrail-pass">
                      <span className="sim-guardrail-pill-dot" />
                      <span className="sim-guardrail-pill-l">Reg BI · best-interest</span>
                      <span className="sim-guardrail-pill-d">evidenced advice-need required</span>
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
     CONFIG — 7 sections
     ==================================================================== */
  // ---- Live eligibility count (recomputes as the min-investable low thumb moves) ----
  const minInvestableK = ranges.minInvestableK.low;
  const _cohortBase = useCustom && customCount != null
    ? customCount
    : cohortPresets.includes("all") || cohortPresets.includes("full")
      ? COHORT_OPTIONS.filter((c) => c.id !== "all" && c.id !== "full").reduce((s, c) => s + c.count, 0)
      : cohortPresets.reduce((s, id) => s + (COHORT_OPTIONS.find((c) => c.id === id)?.count || 0), 0) || WEALTH_CALIBRATION.eligibleAfterGate;
  const _eligFrac = Math.max(0.4, Math.min(1, 1 - ((minInvestableK - 100) / 300)));
  const eligibleCount = Math.round(_cohortBase * _eligFrac);
  return (
    <div className="sim-ws sim-ws-single test-journey" style={{ "--acc": "#14b8a6", "--acc-soft": "rgba(20,184,166,.13)" }}>
      <header className="sim-ws-header">
        <div className="test-journey-eyebrow">IF-WHAT · {PAGE_SUBTITLE.toUpperCase()}</div>
        <div className="sim-ws-header-row">
          <h1 className="sim-ws-title">Find the best wealth-attach policy</h1>
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
                <input type="radio" name="wealth-iw-objective" value={o.id} checked={objective === o.id}
                  onChange={() => setObjective(o.id)} disabled={isAutopilot} />
                <span className="iw-objective-body">
                  <span className="iw-objective-l">{o.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 2 · CUSTOMER */}
        <div className="sim-lever-section sim-lever-section-accent">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">2</span>
            <span className="sim-lever-section-name">CUSTOMER</span>
            <span className="sim-lever-section-meta">Which cohort the wealth motion reaches</span>
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
                    <span><b>{(c.count / 1000).toFixed(1)}K</b> households</span>
                  </div>
                  <div className="sim-cohort-card-sig">{c.sig}</div>
                </label>
              );
            })}
          </div>

          {/* Custom segment builder — a rule-defined cohort that REPLACES the
              preset selection once fetched + used. */}
          <CustomSegmentBuilder
            attrs={RULE_ATTRS.wealth}
            base={6200}
            rules={customRules}
            setRules={setCustomRules}
            count={customCount}
            setCount={setCustomCount}
            active={useCustom}
            onUse={() => setUseCustom(true)}
            onClear={() => setUseCustom(false)}
          />
        </div>

        {/* 3 · ELIGIBILITY — dual-range sliders */}
        <div className="sim-lever-section sim-lever-section-cohort">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">3</span>
            <span className="sim-lever-section-name">ELIGIBILITY</span>
            <span className="sim-lever-section-meta">Ranges the optimizer can pick within</span>
          </div>
          <MinRow
            label={ranges.minInvestableK.label}
            caption={ranges.minInvestableK.caption}
            unit={ranges.minInvestableK.unit}
            min={ranges.minInvestableK.min} max={ranges.minInvestableK.max} step={ranges.minInvestableK.step}
            value={ranges.minInvestableK.low}
            onChange={(v) => setRange("minInvestableK", { low: v })}
            ticks={[50, 150, 250]}
          />
          <RangeRow
            label={ranges.readinessDays.label}
            caption={ranges.readinessDays.caption}
            unit={ranges.readinessDays.unit}
            min={ranges.readinessDays.min} max={ranges.readinessDays.max} step={ranges.readinessDays.step}
            low={ranges.readinessDays.low} high={ranges.readinessDays.high}
            onChange={(v) => setRange("readinessDays", v)}
            ticks={[30, 60, 90]}
          />
          <div className="elig-tile">
            <span className="elig-tile-v">{eligibleCount.toLocaleString()}</span>
            <span className="elig-tile-l">households qualify at this threshold</span>
          </div>
        </div>

        {/* 4 · ALLOWED MOVES — the optimizer's motion menu (multi-select) */}
        <div className="sim-lever-section sim-lever-section-policy">
          <div className="sim-lever-section-band">
            <span className="sim-lever-section-num">4</span>
            <span className="sim-lever-section-name">ALLOWED MOVES</span>
            <span className="sim-lever-section-meta">The motions the optimizer may pick — the winning motion is an output, not a premise</span>
          </div>
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Allowed wealth motions</span>
              <span className="lever-value">{allowedMoves.length} of {MOVE_OPTIONS.length}</span>
            </div>
            <div className="lever-caption">Select the moves the optimizer is permitted to route to. The optimizer chooses the best motion per micro-segment — no single motion is prescribed up front.</div>
            <div className="lever-checks">
              {MOVE_OPTIONS.map((m) => {
                const on = moves[m.id] != null;
                return (
                  <label key={m.id} className={"lever-check" + (on ? " on" : "")}>
                    <input type="checkbox" checked={on} onChange={() => toggleMove(m.id)} disabled={isAutopilot} />
                    {m.label}
                  </label>
                );
              })}
            </div>
          </div>
          {/* Senior-FA slot cap — a capacity guardrail the optimizer routes within. */}
          <div className="lever-row">
            <div className="lever-head">
              <span className="lever-name">Senior-FA slot cap</span>
              <span className="lever-value">{seniorFaCap} slots</span>
            </div>
            <div className="lever-caption">Scarce senior-FA appointments available in the pilot. Over-routing to senior FA saturates this cap — that's the Advisor-Weighted trade-off.</div>
            <div className="lever-control">
              <RangeWithBubble
                min={300} max={900} step={50}
                value={seniorFaCap}
                onChange={(e) => setSeniorFaCap(+e.target.value)}
                disabled={isAutopilot}
                formatter={(v) => `${v} slots`}
              />
              <div className="iw-range-scale"><span>300</span><span>600</span><span>900</span></div>
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

        {/* 6 · SIMULATION DURATION — single-thumb slider, default 8wk. */}
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
