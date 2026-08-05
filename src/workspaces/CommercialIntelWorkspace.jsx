/* ============================================================================
   CommercialIntelWorkspace — account / RFP-level "Underwriter of the Future"
   intelligence for USRM Small Commercial. Commercial-sector only.

   Three menu items (routes), one shared account/RFP context, logical flow:
     1. quoteintel  → Quote Intelligence      (Screens 14–15 · PRD I.3–I.9, J.1–J.2/10/12)
     2. elasticity  → Elasticity & Win Prob    (Screens 16–17 · PRD J.4–J.5, K) — Sensitivity Lab
     3. negotiation → Negotiation Intelligence (Screens 18–19 · PRD J.6–J.8/11)

   All charts are self-contained SVG using app design tokens (theme.css).
   ========================================================================= */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RangeWithBubble from "@/components/RangeWithBubble";
import "@/styles/commercial-intel.css";
import "@/styles/ifwhat.css";

const ACC_KEY = "twinx-ci-account";
const go = (nav, view) => nav(`/?seed_route=${view}`);
const money = (n) => (n >= 1000 ? "$" + (n / 1000).toFixed(n >= 100000 ? 0 : 1) + "K" : "$" + n);

/* Trigger a browser download of a generated text document. Used by the
   Intelligence-flow "Generate …" CTAs so each produces a real, saveable file. */
function downloadDoc(filename, body) {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const slug = (s) => (s || "account").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

/* ---- Sample RFP / lead-level accounts (derived from the growth cohort) ---- */
const ACCOUNTS = [
  {
    id: "ironline", name: "Ironline Fabrication LLC", industry: "Metal fabrication",
    classCode: "GL 59482", state: "TX", revenue: "$4.2M", employees: 34, tenure: "New business",
    segment: "Scaling multi-location", growth: "New 2nd location + payroll +18% YoY",
    broker: { name: "Lockton — Dallas", tier: "Elite", bindRate: "31%", book: "0.68 loss ratio" },
    triage: "auto-quote", triageWhy: "Strong appetite match · complete ACORD · no fraud flags · broker book strong",
    loss: "1 GL claim / 3 yrs · $12K · below class benchmark (0.9× ISO)",
    portfolio: "Grows target TX construction segment · concentration +0.2% (within cap) · appetite aligned",
    competitors: [{ n: "Next Insurance", pv: 18900 }, { n: "biBERK", pv: 17400 }, { n: "Hiscox", pv: 19600 }],
    lines: ["BOP", "General Liability"], crossLine: ["Workers Comp", "Commercial Auto", "Umbrella"],
    econ: {
      technicalPrem: 15400, expenseRatio: 27.5, costToServe: 640, channel: "Broker (auto-quote)",
      ltv: { years: 3, value: 44200, note: "3-yr expected value at ~88% renewal" },
      attach: { line: "Umbrella + Cyber", prob: 0.42, ev: 6300 },
    },
    concentration: { seg: "TX construction", before: 4.1, after: 4.3, cap: 6.0 },
    blendedLR: { before: 71.8, after: 71.9 },
    compReaction: {
      competitor: "biBERK", theirPrice: 17400,
      ifMatch: { ourPrice: 17400, theirResp: "Hold — thin service model, rarely re-cuts", netWin: 74 },
      ifHold: { ourPrice: 18200, theirResp: "Broker leans biBERK on price", netWin: 62 },
      note: "Matching biBERK is safe here — they seldom counter below adequacy; hold on service value.",
    },
    // quote scenarios: premium, win %, margin %, portfolio NWP $, recommended
    quotes: [
      { id: "base", label: "Baseline", prem: 18200, cov: "BOP + GL · $1M/$2M", margin: 14.8, win: 62, rec: false },
      { id: "ded", label: "Deductible-optimized", prem: 16600, cov: "$5K → $10K deductible", margin: 16.1, win: 71, rec: true },
      { id: "cov", label: "Coverage-restructured", prem: 19400, cov: "+ Umbrella $1M", margin: 15.2, win: 55, rec: false },
      { id: "bundle", label: "Bundle-contingent", prem: 27800, cov: "+ WC + Auto (2 vans)", margin: 17.4, win: 48, rec: false },
    ],
    projLR: "72.5%", winScore: 71, winCI: "±6pp",
    winFactors: [
      { k: "Broker Twin — Lockton bind rate on GL", w: 30, v: 12 },
      { k: "Account Twin — shopping propensity", w: 20, v: -4 },
      { k: "Market Twin — insurtech pressure", w: 20, v: -7 },
      { k: "Historical similarity — TX fab class", w: 15, v: 6 },
      { k: "Price position vs competitor median", w: 15, v: 9 },
    ],
    position: "At-market (52nd pctile)",
    elasticity: {
      rec: 16600, zone: [15800, 17400], marginLo: 10.5, marginHi: 20.5,
      curve: [[14000, 88], [15000, 82], [16600, 71], [18200, 62], [20000, 47], [22000, 31]],
      dims: [{ k: "Segment", v: 78 }, { k: "Broker", v: 64 }, { k: "Industry", v: 52 }, { k: "Competitor", v: 83 }, { k: "Coverage", v: 34 }],
    },
    negotiation: {
      flex: "High — Lockton values speed + certainty over last-dollar price",
      bridge: { start: 14.8, steps: [{ k: "Rate concession", d: -1.3 }, { k: "Deductible ↑", d: 1.5 }, { k: "Safety credit", d: -0.3 }, { k: "Cross-line", d: 1.0 }] },
      opening: "$18,200 baseline · $1M/$2M · $5K deductible",
      counter: "Broker cites biBERK at $17,400 · asks for match + higher deductible",
      fallbacks: ["$17,400 at $10K deductible (holds adequacy)", "$16,600 + telematics/safety credit", "$16,600 floor — rate-adequacy limit"],
      nonprice: ["Faster bind (same-day COI)", "Fleet safety-program credit", "Multi-year term lock"],
      walkaway: 16600,
      // concession ladder: each step's premium, win %, margin %
      ladder: [
        { label: "Open", prem: 18200, win: 62, margin: 14.8 },
        { label: "Match + $10K ded", prem: 17400, win: 71, margin: 16.1 },
        { label: "+ safety credit", prem: 16600, win: 78, margin: 15.7 },
        { label: "Floor", prem: 16600, win: 78, margin: 15.7 },
      ],
      concessions: [
        { req: "Match biBERK −$800", resp: "Counter with $10K deductible", cost: "−1.3pp margin", win: "+9pp", port: "LR neutral" },
        { req: "Waive first-year fee", resp: "Offer safety credit instead", cost: "−0.4pp margin", win: "+3pp", port: "LR ↓ (safety)" },
      ],
      alts: ["Deductible-optimized ($10K)", "Bundle-contingent (WC + Auto)", "Multi-year (2-yr rate lock)"],
    },
  },
  {
    id: "cedaroak", name: "Cedar & Oak Logistics", industry: "Regional trucking",
    classCode: "CA 01340", state: "OH", revenue: "$8.9M", employees: 61, tenure: "New business",
    segment: "Fleet / equipment-heavy", growth: "Fleet +6 units (18→24) · new lane expansion",
    broker: { name: "USI — Columbus", tier: "Preferred", bindRate: "24%", book: "0.74 loss ratio" },
    triage: "referral", triageWhy: "High severity (fleet auto) · 2 prior claims · routes to Commercial Auto specialist",
    loss: "2 auto claims / 3 yrs · $84K · at class benchmark (1.0× ISO)",
    portfolio: "Adds OH transportation exposure · concentration +0.6% (watch) · appetite: monitor",
    competitors: [{ n: "biBERK", pv: 142000 }, { n: "Progressive", pv: 138000 }, { n: "Next", pv: 151000 }],
    lines: ["Commercial Auto"], crossLine: ["Inland Marine", "Umbrella", "General Liability"],
    econ: {
      technicalPrem: 132000, expenseRatio: 26.0, costToServe: 2100, channel: "Broker + referral UW",
      ltv: { years: 3, value: 214000, note: "3-yr expected value at ~79% renewal" },
      attach: { line: "Inland Marine + Umbrella", prob: 0.36, ev: 14800 },
    },
    concentration: { seg: "OH transportation", before: 5.4, after: 6.0, cap: 6.5 },
    blendedLR: { before: 77.6, after: 77.9 },
    compReaction: {
      competitor: "Progressive", theirPrice: 138000,
      ifMatch: { ourPrice: 138000, theirResp: "Likely re-cut −$4K (aggressive on fleet)", netWin: 52 },
      ifHold: { ourPrice: 146000, theirResp: "Progressive holds the low price", netWin: 44 },
      note: "Matching Progressive invites a counter-cut; the telematics safety credit wins with a better loss ratio.",
    },
    quotes: [
      { id: "base", label: "Baseline", prem: 146000, cov: "Fleet CA · $1M CSL", margin: 11.2, win: 44, rec: false },
      { id: "ded", label: "Deductible-optimized", prem: 134000, cov: "$2.5K → $5K deductible", margin: 12.6, win: 53, rec: false },
      { id: "cov", label: "Coverage + safety", prem: 139000, cov: "+ telematics credit", margin: 13.9, win: 58, rec: true },
      { id: "bundle", label: "Bundle-contingent", prem: 178000, cov: "+ Inland Marine + Umbrella", margin: 13.1, win: 39, rec: false },
    ],
    projLR: "78.1%", winScore: 58, winCI: "±8pp",
    winFactors: [
      { k: "Broker Twin — USI bind rate on fleet CA", w: 30, v: 5 },
      { k: "Account Twin — shopping propensity", w: 20, v: -9 },
      { k: "Market Twin — Progressive aggressive", w: 20, v: -10 },
      { k: "Historical similarity — OH fleet class", w: 15, v: 4 },
      { k: "Price position (telematics credit)", w: 15, v: 11 },
    ],
    position: "Below-market with safety credit (34th pctile)",
    elasticity: {
      rec: 139000, zone: [134000, 142000], marginLo: 8.5, marginHi: 16.5,
      curve: [[120000, 79], [130000, 67], [139000, 58], [146000, 44], [155000, 30], [165000, 18]],
      dims: [{ k: "Segment", v: 74 }, { k: "Broker", v: 55 }, { k: "Industry", v: 82 }, { k: "Competitor", v: 86 }, { k: "Coverage", v: 48 }],
    },
    negotiation: {
      flex: "Moderate — USI price-sensitive on fleet; safety credit is the lever",
      bridge: { start: 11.2, steps: [{ k: "Rate concession", d: -1.1 }, { k: "Deductible ↑", d: 1.4 }, { k: "Telematics credit", d: 0.6 }, { k: "Bundle", d: 0.9 }] },
      opening: "$146K baseline · $1M CSL · $2.5K deductible",
      counter: "Broker cites Progressive $138K · pushes for match",
      fallbacks: ["$139K with telematics safety credit (LR ↓↓)", "$134K at $5K deductible", "$134K floor — fleet CA adequacy"],
      nonprice: ["Telematics safety program", "Fleet driver-training credit", "Loss-control engineering visit"],
      walkaway: 134000,
      ladder: [
        { label: "Open", prem: 146000, win: 44, margin: 11.2 },
        { label: "Safety credit", prem: 139000, win: 58, margin: 13.9 },
        { label: "$5K deductible", prem: 134000, win: 66, margin: 12.6 },
        { label: "Floor", prem: 134000, win: 66, margin: 12.6 },
      ],
      concessions: [
        { req: "Match Progressive −$8K", resp: "Offer $139K + telematics (better LR)", cost: "−1.1pp margin", win: "+14pp", port: "LR ↓↓" },
        { req: "Drop deductible", resp: "Hold — raises severity", cost: "n/a", win: "—", port: "reject (LR risk)" },
      ],
      alts: ["Coverage + safety ($139K)", "Deductible-optimized ($5K)", "Bundle (Inland Marine + Umbrella)"],
    },
  },
];

/* ---- Book-level P&L context (Small Commercial · quarter-to-date) ---- */
const BOOK = {
  nwp: 41.8, nwpPlan: 48.0, winRate: 34, winRatePlan: 38,
  lossRatio: 63.2, lossTarget: 66, expenseRatio: 27.1, combinedTarget: 96,
  quoted: 312, bound: 106, pipelineEV: 2.14, // $M expected value in open pipeline
  byClass: [
    { k: "Contractors / GL", nwp: 12.4, lr: 61, share: 30 },
    { k: "Fleet / Comm Auto", nwp: 9.1, lr: 74, share: 22 },
    { k: "Property / BOP", nwp: 8.7, lr: 58, share: 21 },
    { k: "Workers Comp", nwp: 6.9, lr: 66, share: 16 },
    { k: "Hospitality", nwp: 4.7, lr: 79, share: 11 },
  ],
  byState: [
    { k: "TX", nwp: 11.2, lr: 62 }, { k: "OH", nwp: 8.4, lr: 71 },
    { k: "FL", nwp: 7.1, lr: 74 }, { k: "CA", nwp: 6.3, lr: 68 },
    { k: "Other", nwp: 8.8, lr: 59 },
  ],
  // concentration heatmap: appetite headroom by class × state (share vs cap)
  concentration: [
    { seg: "TX construction", share: 4.3, cap: 6.0 },
    { seg: "OH transportation", share: 6.0, cap: 6.5 },
    { seg: "FL property", share: 5.2, cap: 6.0 },
    { seg: "CA hospitality", share: 3.1, cap: 4.0 },
  ],
};

/* Broker scorecard — cross-book performance (drives quote flexibility) */
const BROKERS = [
  { name: "Lockton — Dallas", tier: "Elite", submissions: 41, bindRate: 31, bookLR: 68, winTrend: +4 },
  { name: "USI — Columbus", tier: "Preferred", submissions: 33, bindRate: 24, bookLR: 74, winTrend: -2 },
  { name: "Comparion", tier: "Standard", submissions: 58, bindRate: 19, bookLR: 79, winTrend: +1 },
];

/* Win/Loss feed — closes the Learn loop; recalibrates win-prob + elasticity */
const WINLOSS = [
  { acct: "Ridgeline Roofing", outcome: "bound", prem: 22400, predWin: 68, note: "Priced at EV-optimal; broker took first offer" },
  { acct: "Blue Harbor Cold Storage", outcome: "lost", prem: 96000, predWin: 55, note: "Lost to Progressive −$9K; model over-estimated flexibility" },
  { acct: "Verde Landscaping", outcome: "bound", prem: 14100, predWin: 72, note: "Safety credit closed it; LR came in below plan" },
  { acct: "Anchor Freight", outcome: "lost", prem: 141000, predWin: 47, note: "Declined match below adequacy — correct no-bid" },
];

/* ---- economic helpers shared across views ---- */
const marginDollars = (q) => q.prem * (q.margin / 100);       // annual margin $
const evOf = (q) => (q.win / 100) * marginDollars(q);          // expected margin $ = win% × margin$
const combinedOf = (acc) => (parseFloat(acc.projLR) || 0) + (acc.econ?.expenseRatio || 0); // loss + expense

/* linear interpolation of bind% along the elasticity curve for a given premium */
function bindAt(curve, x) {
  if (x <= curve[0][0]) return curve[0][1];
  if (x >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1], [x1, y1] = curve[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return curve[curve.length - 1][1];
}

/* ---------------- reusable SVG chart primitives ---------------- */
const AXIS = "var(--ink-4)", GRID = "var(--hair)", ACC = "var(--acc)", INK3 = "var(--ink-3)";

function BarRow({ data, fmt, max }) {
  const m = max || Math.max(...data.map((d) => d.v));
  return (
    <div className="ci-barrows">
      {data.map((d) => (
        <div key={d.k} className="ci-barrow">
          <span className="ci-barrow-k">{d.k}</span>
          <div className="ci-barrow-track">
            <i style={{ width: `${(d.v / m) * 100}%`, background: d.c || ACC }} />
          </div>
          <span className="ci-barrow-v">{fmt ? fmt(d.v) : d.v}</span>
        </div>
      ))}
    </div>
  );
}

function Scatter({ points, xLab, yLab }) {
  const W = 440, H = 240, padL = 42, padR = 16, padT = 16, padB = 38;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xPad = (xMax - xMin) * 0.18 || 5, yPad = (yMax - yMin) * 0.28 || 1;
  const x0 = xMin - xPad, x1 = xMax + xPad, y0 = yMin - yPad, y1 = yMax + yPad;
  const sx = (x) => padL + ((x - x0) / (x1 - x0)) * (W - padL - padR);
  const sy = (y) => H - padB - ((y - y0) / (y1 - y0)) * (H - padB - padT);
  const nice = (v) => (Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10);
  const ticks = (lo, hi, n) => Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
  const xt = ticks(x0, x1, 4), yt = ticks(y0, y1, 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ci-svg">
      {/* y grid + tick values */}
      {yt.map((v, i) => (
        <g key={"y" + i}>
          <line x1={padL} y1={sy(v)} x2={W - padR} y2={sy(v)} stroke={GRID} />
          <text x={padL - 6} y={sy(v) + 3} fontSize="9" fill={INK3} textAnchor="end">{nice(v)}</text>
        </g>
      ))}
      {/* x tick values */}
      {xt.map((v, i) => (
        <text key={"x" + i} x={sx(v)} y={H - padB + 14} fontSize="9" fill={INK3} textAnchor="middle">{nice(v)}</text>
      ))}
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke={AXIS} />
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke={AXIS} />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={p.rec ? 7 : 5} fill={p.rec ? ACC : "var(--acq)"} opacity={p.rec ? 1 : 0.75} />
          <text x={sx(p.x)} y={sy(p.y) - 11} fontSize="8.5" fill={INK3} textAnchor="middle">{p.label}</text>
          <text x={sx(p.x)} y={sy(p.y) + 15} fontSize="8" fill={p.rec ? ACC : INK3} textAnchor="middle" fontWeight="700">{nice(p.x)}% · {nice(p.y)}%</text>
        </g>
      ))}
      <text x={(W + padL) / 2} y={H - 4} fontSize="9.5" fill={INK3} textAnchor="middle">{xLab}</text>
      <text x={12} y={12} fontSize="9.5" fill={INK3}>{yLab}</text>
    </svg>
  );
}

function Radar({ dims }) {
  // viewBox fits the content tightly: max drawn radius is the label ring
  // (labelF × r); pad just enough for the label text. No dead margin.
  const n = dims.length, r = 96, labelF = 1.16, M = 20;
  const maxR = r * labelF, C = maxR + M, S = C * 2;
  const cx = C, cy = C;
  const pt = (i, val) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (val / 100) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const ring = (f) => dims.map((_, i) => pt(i, f).join(",")).join(" ");
  const poly = dims.map((d, i) => pt(i, d.v).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="ci-svg ci-radar">
      {[100, 66, 33].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke={GRID} />)}
      {dims.map((d, i) => { const [x, y] = pt(i, 100); return <line key={d.k} x1={cx} y1={cy} x2={x} y2={y} stroke={GRID} />; })}
      <polygon points={poly} fill={ACC} fillOpacity="0.18" stroke={ACC} strokeWidth="2" />
      {dims.map((d, i) => {
        const [x, y] = pt(i, 100 * labelF);
        return <text key={d.k} x={x} y={y} fontSize="10.5" fill={INK3} textAnchor="middle" dominantBaseline="middle">{d.k}</text>;
      })}
    </svg>
  );
}

/* interactive Sensitivity Lab — slider over premium, live bind%/margin/expected-value */
function SensitivityLab({ e }) {
  const lo = e.curve[0][0], hi = e.curve[e.curve.length - 1][0];
  const [prem, setPrem] = useState(e.rec);
  const marginAt = (p) => e.marginLo + ((e.marginHi - e.marginLo) * (p - lo)) / (hi - lo);
  const evAt = (p) => (bindAt(e.curve, p) / 100) * p * (marginAt(p) / 100); // expected margin $
  const bind = bindAt(e.curve, prem);
  const margin = marginAt(prem);
  const ev = evAt(prem);
  const inZone = prem >= e.zone[0] && prem <= e.zone[1];

  // scan the range for the EV-optimal price + max EV (for the normalized EV curve)
  const N = 160, step = (hi - lo) / N;
  const samples = Array.from({ length: N + 1 }, (_, i) => { const p = lo + i * step; return { p, ev: evAt(p) }; });
  const evMax = Math.max(...samples.map((s) => s.ev));
  const evStar = samples.reduce((a, b) => (b.ev > a.ev ? b : a)).p;

  const W = 960, H = 260, pad = 44;
  const sx = (x) => pad + ((x - lo) / (hi - lo)) * (W - pad - 16);
  const sy = (y) => H - pad - (y / 100) * (H - pad - 16);
  const d = e.curve.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
  const evD = samples.map((s, i) => `${i ? "L" : "M"}${sx(s.p).toFixed(1)},${sy((s.ev / evMax) * 100).toFixed(1)}`).join(" ");
  const mx = sx(prem), my = sy(bind);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="ci-svg ci-lab-svg">
        <rect x={sx(e.zone[0])} y={12} width={sx(e.zone[1]) - sx(e.zone[0])} height={H - pad - 12} fill={ACC} opacity="0.10" />
        {[25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={pad} y1={sy(g)} x2={W - 16} y2={sy(g)} stroke={GRID} />
            <text x={pad - 6} y={sy(g) + 3} fontSize="9" fill={INK3} textAnchor="end">{g}</text>
          </g>
        ))}
        <path d={d} fill="none" stroke={ACC} strokeWidth="2.5" />
        <path d={evD} fill="none" stroke="var(--green)" strokeWidth="2" strokeDasharray="5 3" />
        {/* EV-optimal price marker */}
        <line x1={sx(evStar)} y1={12} x2={sx(evStar)} y2={H - pad} stroke="var(--green)" strokeWidth="1.5" />
        <text x={sx(evStar)} y={9} fontSize="8.5" fill="var(--green)" textAnchor="middle" fontWeight="700">EV-optimal {money(Math.round(evStar))}</text>
        <line x1={mx} y1={12} x2={mx} y2={H - pad} stroke="var(--acq)" strokeDasharray="4 3" />
        <line x1={pad} y1={my} x2={mx} y2={my} stroke="var(--acq)" strokeDasharray="4 3" />
        <circle cx={mx} cy={my} r="6" fill="var(--acq)" stroke="var(--panel)" strokeWidth="2" />
        <text x={pad} y={sy(100) - 3} fontSize="8" fill={ACC}>bind %</text>
        <text x={pad + 44} y={sy(100) - 3} fontSize="8" fill="var(--green)">expected value (norm.)</text>
        <text x={W - 90} y={H - pad + 14} fontSize="9" fill={INK3}>{money(hi)} premium →</text>
        <text x={pad} y={H - pad + 14} fontSize="9" fill={INK3}>{money(lo)}</text>
      </svg>
      <RangeWithBubble min={lo} max={hi} step={(hi - lo) / 120} value={prem}
        onChange={(ev2) => setPrem(+ev2.target.value)}
        formatter={(v) => money(Math.round(v))} />
      <div className="ci-lab-read">
        <div><span>Premium</span><b>{money(Math.round(prem))}</b></div>
        <div><span>Bind probability</span><b>{bind.toFixed(0)}%</b></div>
        <div><span>Margin</span><b>{margin.toFixed(1)}%</b></div>
        <div><span>Expected value</span><b>{money(Math.round(ev))}</b></div>
        <div className={inZone ? "ci-zone ok" : "ci-zone warn"}>{inZone ? "In recommended zone" : "Outside rec zone"}</div>
      </div>
      <div className="ci-evnote">
        <b>EV-optimal price · {money(Math.round(evStar))}</b> maximizes win% × margin$. Below it, each extra win-point is bought with
        more margin than the added bind probability returns — so chasing a lower price grows win-rate but shrinks expected value.
      </div>
    </div>
  );
}

/* dual-line concession chart: premium ↓ vs win% ↑ across the ladder */
function ConcessionChart({ ladder }) {
  const W = 540, H = 210, pad = 40;
  const prems = ladder.map((l) => l.prem), wins = ladder.map((l) => l.win);
  const p0 = Math.min(...prems) * 0.98, p1 = Math.max(...prems) * 1.02;
  const sx = (i) => pad + (i / (ladder.length - 1)) * (W - pad - 40);
  const syP = (v) => 14 + (1 - (v - p0) / (p1 - p0)) * (H - pad - 14);
  const syW = (v) => 14 + (1 - v / 100) * (H - pad - 14);
  const line = (f) => ladder.map((l, i) => `${i ? "L" : "M"}${sx(i)},${f(l).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ci-svg">
      <line x1={pad} y1={H - pad} x2={W - 40} y2={H - pad} stroke={AXIS} />
      <path d={line((l) => syP(l.prem))} fill="none" stroke="var(--acq)" strokeWidth="2.5" />
      <path d={line((l) => syW(l.win))} fill="none" stroke={ACC} strokeWidth="2.5" />
      {ladder.map((l, i) => (
        <g key={i}>
          <circle cx={sx(i)} cy={syP(l.prem)} r="4" fill="var(--acq)" />
          <circle cx={sx(i)} cy={syW(l.win)} r="4" fill={ACC} />
          <text x={sx(i)} y={H - pad + 14} fontSize="8" fill={INK3} textAnchor="middle">{l.label}</text>
        </g>
      ))}
      <text x={pad} y={12} fontSize="9" fill="var(--acq)">premium</text>
      <text x={pad + 70} y={12} fontSize="9" fill={ACC}>win %</text>
    </svg>
  );
}

/* ---- shared account state via localStorage ---- */
function useAccount() {
  const [id, setId] = useState(() => {
    try { return localStorage.getItem(ACC_KEY) || ACCOUNTS[0].id; } catch { return ACCOUNTS[0].id; }
  });
  const set = (v) => { setId(v); try { localStorage.setItem(ACC_KEY, v); } catch { /* ignore */ } };
  return [ACCOUNTS.find((a) => a.id === id) || ACCOUNTS[0], set];
}

function AccountBar({ acc, onPick }) {
  return (
    <div className="ci-accbar">
      <div className="ci-accbar-l">
        <span className="ci-accbar-lab">RFP / Lead</span>
        <select value={acc.id} onChange={(e) => onPick(e.target.value)}>
          {ACCOUNTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="ci-accbar-meta">
        <span>{acc.industry}</span><i />
        <span>Class {acc.classCode}</span><i />
        <span>{acc.state}</span><i />
        <span>{acc.revenue} · {acc.employees} emp</span><i />
        <span className={"ci-triage ci-triage-" + acc.triage}>{acc.triage.replace("-", " ")}</span>
      </div>
    </div>
  );
}

function FlowNav({ view, nav }) {
  const steps = [["book", "Book"], ["quoteintel", "Quote"], ["elasticity", "Elasticity & Win-Prob"], ["negotiation", "Negotiation"]];
  return (
    <div className="ci-flow">
      {steps.map(([v, l], i) => (
        <button key={v} className={"ci-flow-step" + (v === view ? " on" : "")} onClick={() => go(nav, v)}>
          <span className="ci-flow-n">{i + 1}</span>{l}
        </button>
      ))}
    </div>
  );
}

/* ---------- 1 · QUOTE INTELLIGENCE ---------- */
/* KPI ribbon — headline stat cards (Quote Workbench pattern) */
function KpiRibbon({ items, cols }) {
  return (
    <div className={"ci-kpis" + (cols === 4 ? " ci-kpis-4" : "")}>
      {items.map((k) => (
        <div key={k.label} className="ci-kpi">
          <div className="ci-kpi-h"><span>{k.label}</span><em>{k.icon}</em></div>
          <div className="ci-kpi-v" style={k.color ? { color: k.color } : undefined}>{k.value}</div>
          {k.sub && <div className="ci-kpi-sub">{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* Margin Bridge waterfall — how each concession moves margin start→end */
function MarginBridge({ bridge }) {
  const W = 560, H = 210, pad = 34, gap = 10;
  let cum = bridge.start;
  const bars = [{ label: "Start", lo: 0, hi: bridge.start, kind: "total" }];
  bridge.steps.forEach((s) => {
    const from = cum; cum += s.d;
    bars.push({ label: s.k, lo: Math.min(from, cum), hi: Math.max(from, cum), kind: s.d >= 0 ? "up" : "down", d: s.d });
  });
  bars.push({ label: "End", lo: 0, hi: cum, kind: "total" });
  const max = Math.max(...bars.map((b) => b.hi)) * 1.18;
  const bw = (W - pad - 12 - gap * (bars.length - 1)) / bars.length;
  const sy = (v) => H - pad - (v / max) * (H - pad - 16);
  const col = { total: "var(--acq)", up: "var(--green)", down: "var(--red)" };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ci-svg">
      <line x1={pad} y1={H - pad} x2={W - 12} y2={H - pad} stroke="var(--ink-4)" />
      {bars.map((b, i) => {
        const x = pad + i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={sy(b.hi)} width={bw} height={Math.max(2, sy(b.lo) - sy(b.hi))} rx="3" fill={col[b.kind]} opacity={b.kind === "total" ? 0.9 : 0.85} />
            <text x={x + bw / 2} y={sy(b.hi) - 4} fontSize="9" fill="var(--ink)" textAnchor="middle">
              {b.kind === "total" ? b.hi.toFixed(1) + "%" : (b.d >= 0 ? "+" : "") + b.d.toFixed(1)}
            </text>
            <text x={x + bw / 2} y={H - pad + 13} fontSize="8" fill="var(--ink-3)" textAnchor="middle">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* Submission-readiness checklist + package CTA (Finalize pattern) */
const READINESS = [
  { k: "Data extraction & validation", d: "42 fields extracted · >90% confidence", ok: true },
  { k: "Appetite & risk assessment", d: "Within class / state appetite · rate adequate", ok: true },
  { k: "Regulatory compliance", d: "NAIC 24-08 fair-pricing · disparate-impact clear", ok: true },
  { k: "Portfolio & authority approval", d: "Within underwriter authority band", ok: true },
];
function ReadinessPanel({ winner, acc }) {
  const genQuotePackage = () => {
    const a = acc || {};
    const lines = (a.lines || []).join(", ");
    const body =
`QUOTE PACKAGE — ${a.name || "Account"}
${a.industry || ""} · ${a.classCode || ""} · ${a.state || ""} · ${a.revenue || ""} revenue · ${a.employees || "—"} employees
Lines: ${lines}
Broker: ${a.broker?.name || "—"} (${a.broker?.tier || "—"} · bind ${a.broker?.bindRate || "—"})

RECOMMENDED STRUCTURE
  Structure:        ${winner.label}
  Coverage:         ${winner.cov}
  Annual premium:   ${money(winner.prem)}
  Modeled margin:   ${winner.margin.toFixed(1)}%
  Win probability:  ${winner.win}%
  Projected LR:     ${a.projLR || "—"}

READINESS
${READINESS.map((r) => `  [${r.ok ? "x" : " "}] ${r.k} — ${r.d}`).join("\n")}

Guardrails: rate-adequacy floor · loss-ratio limit · NAIC 24-08 fair-pricing
Logged to the decision audit trail.

(Illustrative document generated by TwinX Commercial Intelligence.)`;
    downloadDoc(`quote-package-${slug(a.name)}.txt`, body);
  };
  return (
    <section className="ci-panel">
      <div className="ci-ready-h">
        <h3>Submission readiness</h3>
        <span className="ci-ready-badge">Ready to quote</span>
      </div>
      <ul className="ci-ready">
        {READINESS.map((r) => (
          <li key={r.k}><span className="ci-ready-dot" /><b>{r.k}</b><i>{r.d}</i></li>
        ))}
      </ul>
      <div className="ci-ready-cta">
        <button className="ci-btn ci-btn-ok" onClick={genQuotePackage}>Generate quote package →</button>
        <span className="ci-ready-note">Bind-ready · {winner.label} · logged to the decision audit trail</span>
      </div>
    </section>
  );
}

/* Decision audit trail — AI actions + underwriter decisions (governance) */
const AUDIT = [
  { role: "AI", who: "TwinX · Submission AI", t: "10:14", txt: "Extracted ACORD + loss runs (42 fields) · triaged the submission" },
  { role: "AI", who: "TwinX · Pricing Engine", t: "10:16", txt: "Ran elasticity + win-probability model · 10k iterations" },
  { role: "user", who: "J. Rivera · Underwriter", t: "10:21", txt: "Reviewed appetite match · accepted the recommended structure" },
  { role: "system", who: "TwinX · Governance", t: "10:22", txt: "Fair-pricing + disparate-impact checks passed (NAIC 24-08)" },
];
function AuditTrail() {
  return (
    <section className="ci-panel">
      <h3>Decision audit trail</h3>
      <p className="ci-sub">Full traceability of AI actions and underwriter decisions</p>
      <ul className="ci-audit">
        {AUDIT.map((e, i) => (
          <li key={i} className={"ci-audit-" + e.role}>
            <span className="ci-audit-t">{e.t}</span>
            <span className="ci-audit-dot" />
            <div className="ci-audit-b"><b>{e.who}</b><span>{e.txt}</span></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuoteView({ acc, nav }) {
  const winner = acc.quotes.find((q) => q.rec);
  const scatter = acc.quotes.map((q) => ({ x: q.win, y: q.margin, label: q.label.split("-")[0].split(" ")[0], rec: q.rec }));
  const portBars = acc.quotes.map((q) => ({ k: q.label.split(" ")[0], v: q.prem, c: q.rec ? ACC : "var(--acq)" }));
  const evBest = acc.quotes.reduce((a, b) => (evOf(b) > evOf(a) ? b : a), acc.quotes[0]);
  const combined = combinedOf(acc);
  const e = acc.econ || {};
  const gap = e.technicalPrem ? ((winner.prem - e.technicalPrem) / e.technicalPrem) * 100 : null;
  return (
    <>
      <KpiRibbon cols={4} items={[
        { label: "Win probability", value: winner.win + "%", icon: "↗", sub: "recommended structure", color: "var(--acc)" },
        { label: "Expected value", value: money(Math.round(evOf(winner))), icon: "$", sub: "win% × margin$", color: "var(--green)" },
        { label: "Margin", value: winner.margin + "%", icon: "%", sub: "on premium" },
        { label: "Combined ratio", value: combined.toFixed(1) + "%", icon: "Σ", sub: `target < ${BOOK.combinedTarget}%`, color: combined < BOOK.combinedTarget ? "var(--green)" : "var(--ret)" },
      ]} />
      <div className="ci-grid2">
        <section className="ci-panel">
          <h3>Account intelligence</h3>
          <ul className="ci-kv">
            <li><b>Growth signal</b><span>{acc.growth}</span></li>
            <li><b>Loss history</b><span>{acc.loss}</span></li>
            <li><b>Broker</b><span>{acc.broker.name} · {acc.broker.tier} · bind {acc.broker.bindRate} · {acc.broker.book}</span></li>
            <li><b>Portfolio fit</b><span>{acc.portfolio}</span></li>
            <li><b>Cross-line white space</b><span>{acc.crossLine.join(" · ")}</span></li>
          </ul>
          <div className="ci-triage-box">
            <span className={"ci-triage ci-triage-" + acc.triage}>{acc.triage.replace("-", " ")}</span>
            <span className="ci-triage-why">{acc.triageWhy}</span>
          </div>
        </section>
        <section className="ci-panel">
          <h3>Competitive intelligence</h3>
          <p className="ci-sub">Estimated competitor quotes for this account</p>
          <BarRow data={acc.competitors.map((c) => ({ k: c.n, v: c.pv, c: "var(--acq)" }))} fmt={money} />
          <p className="ci-pos">Liberty position · <b>{acc.position}</b></p>
        </section>
      </div>

      <section className="ci-panel">
        <h3>Multi-scenario quote generator</h3>
        <p className="ci-sub">Pre-generated structures · premium, coverage, win probability, margin, portfolio impact</p>
        <div className="ci-quotes">
          {acc.quotes.map((q) => (
            <div key={q.id} className={"ci-quote" + (q.rec ? " rec" : "")}>
              {q.rec && <span className="ci-badge">Recommended</span>}
              {!q.rec && q.id === evBest.id && <span className="ci-badge ci-badge-ev">Best EV</span>}
              <div className="ci-quote-h">{q.label}</div>
              <div className="ci-quote-prem">{money(q.prem)}</div>
              <div className="ci-quote-cov">{q.cov}</div>
              <div className="ci-quote-metrics"><span>Win <b>{q.win}%</b></span><span>Margin <b>{q.margin}%</b></span></div>
              <div className="ci-quote-ev"><span>Expected value</span><b>{money(Math.round(evOf(q)))}</b></div>
            </div>
          ))}
        </div>
        <div className="ci-grid2" style={{ marginTop: 16 }}>
          <div className="ci-chartbox">
            <h4>Win probability × margin</h4>
            <Scatter points={scatter} xLab="win probability %" yLab="margin %" />
          </div>
          <div className="ci-chartbox">
            <h4>Premium / NWP by scenario</h4>
            <BarRow data={portBars} fmt={money} />
          </div>
        </div>
        <div className="ci-winner">
          <b>TwinX pick · {winner.label}</b> — best balance of win probability ({winner.win}%) and expected value ({money(Math.round(evOf(winner)))}), held to loss ratio.
          {evBest.id !== winner.id && <> The <b>{evBest.label}</b> structure has a higher raw EV ({money(Math.round(evOf(evBest)))}) but sits outside appetite / adequacy — the recommendation protects margin over the last win-point.</>}
        </div>
      </section>

      <section className="ci-panel">
        <h3>Deal → book bridge</h3>
        <p className="ci-sub">How the recommended quote earns its rate and what binding it does to the book</p>
        <div className="ci-grid2">
          <div className="ci-bridgebox">
            <div className="ci-bridge-t">This deal · rate adequacy</div>
            <ul className="ci-kv">
              <li><b>Technical premium</b><span>{e.technicalPrem ? money(e.technicalPrem) : "—"}</span></li>
              <li><b>Quoted premium</b><span>{money(winner.prem)}</span></li>
              <li><b>Rate to technical</b><span style={{ color: gap >= 0 ? "var(--green)" : "var(--red)" }}>{gap == null ? "—" : (gap >= 0 ? "+" : "") + gap.toFixed(1) + "%"}</span></li>
              <li><b>Expected value</b><span>{money(Math.round(evOf(winner)))} <i style={{ color: "var(--ink-3)" }}>(win% × margin$)</i></span></li>
              <li><b>Cost to serve</b><span>{e.costToServe ? money(e.costToServe) : "—"} · {e.channel || "—"}</span></li>
              <li><b>3-yr lifetime value</b><span>{e.ltv ? money(e.ltv.value) : "—"} <i style={{ color: "var(--ink-3)" }}>{e.ltv?.note}</i></span></li>
              <li><b>Cross-line attach EV</b><span>{e.attach ? `${money(e.attach.ev)} @ ${Math.round(e.attach.prob * 100)}% · ${e.attach.line}` : "—"}</span></li>
            </ul>
          </div>
          <div className="ci-bridgebox">
            <div className="ci-bridge-t">Marginal book impact</div>
            {acc.concentration && (
              <div className="ci-conc-row">
                <div className="ci-conc-h"><span>{acc.concentration.seg} concentration</span>
                  <b>{acc.concentration.before}% → {acc.concentration.after}%</b><i>cap {acc.concentration.cap}%</i></div>
                <div className="ci-conc-track">
                  <span className="ci-conc-cap" style={{ left: `${(acc.concentration.cap / (acc.concentration.cap * 1.25)) * 100}%` }} />
                  <i className="ci-conc-before" style={{ width: `${(acc.concentration.before / (acc.concentration.cap * 1.25)) * 100}%` }} />
                  <i className="ci-conc-add" style={{ left: `${(acc.concentration.before / (acc.concentration.cap * 1.25)) * 100}%`, width: `${((acc.concentration.after - acc.concentration.before) / (acc.concentration.cap * 1.25)) * 100}%` }} />
                </div>
                <p className="ci-conc-note">{acc.concentration.after <= acc.concentration.cap ? "Within appetite cap — safe to add." : "Exceeds cap — refer / decline growth here."}</p>
              </div>
            )}
            <ul className="ci-kv" style={{ marginTop: 12 }}>
              <li><b>Blended loss ratio</b><span>{acc.blendedLR ? `${acc.blendedLR.before}% → ${acc.blendedLR.after}%` : "—"} <i style={{ color: "var(--ink-3)" }}>book {BOOK.lossRatio}% · target {BOOK.lossTarget}%</i></span></li>
              <li><b>Combined ratio (deal)</b><span>{combined.toFixed(1)}% <i style={{ color: "var(--ink-3)" }}>loss {acc.projLR} + expense {e.expenseRatio}%</i></span></li>
              <li><b>Contribution to plan</b><span>{money(winner.prem)} NWP toward the ${BOOK.nwpPlan.toFixed(1)}M quarter plan</span></li>
            </ul>
          </div>
        </div>
      </section>

      <ReadinessPanel winner={winner} acc={acc} />
      <AuditTrail />

      <div className="ci-cta">
        <button className="ci-btn" onClick={() => go(nav, "elasticity")}>Price it → Elasticity & Win-Probability</button>
      </div>
    </>
  );
}

/* ---------- 2 · ELASTICITY & WIN PROBABILITY ---------- */
function ElasticityView({ acc, nav }) {
  return (
    <>
      <div className="ci-grid2">
        <section className="ci-panel">
          <h3>Win probability · {acc.winScore}% <span className="ci-ci">{acc.winCI}</span></h3>
          <p className="ci-sub">Composite of the twins + price position · signal weights shown</p>
          <ul className="ci-factors">
            {acc.winFactors.map((f) => (
              <li key={f.k}>
                <span className="ci-f-k">{f.k}</span>
                <span className="ci-f-w">w{f.w}</span>
                <span className={"ci-f-v " + (f.v > 0 ? "up" : "dn")}>{f.v > 0 ? "+" : ""}{f.v}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="ci-panel">
          <h3>5-dimensional elasticity</h3>
          <p className="ci-sub">Higher = more price-sensitive on that dimension</p>
          <Radar dims={acc.elasticity.dims} />
        </section>
      </div>

      <section className="ci-panel">
        <h3>Sensitivity Lab · bind probability &amp; expected value vs premium</h3>
        <p className="ci-sub">Drag the slider — live bind %, margin, and expected value (win% × margin$). Solid = bind probability; dashed green = expected value. Shaded band is the recommended zone within adequacy. Recommended price <b>{money(acc.elasticity.rec)}</b>.</p>
        <SensitivityLab e={acc.elasticity} />
      </section>

      {acc.compReaction && (
        <section className="ci-panel">
          <h3>Competitor-reaction simulation · Market Twin</h3>
          <p className="ci-sub">What {acc.compReaction.competitor} likely does back if we move — the win probability shown is <i>after</i> their response.</p>
          <div className="ci-grid2">
            <div className="ci-react">
              <div className="ci-react-h">If we hold price</div>
              <div className="ci-react-price">{money(acc.compReaction.ifHold.ourPrice)}</div>
              <p className="ci-react-resp">{acc.compReaction.ifHold.theirResp}</p>
              <div className="ci-react-win">Net win <b>{acc.compReaction.ifHold.netWin}%</b></div>
            </div>
            <div className="ci-react ci-react-match">
              <div className="ci-react-h">If we match {acc.compReaction.competitor}</div>
              <div className="ci-react-price">{money(acc.compReaction.ifMatch.ourPrice)}</div>
              <p className="ci-react-resp">{acc.compReaction.ifMatch.theirResp}</p>
              <div className="ci-react-win">Net win <b>{acc.compReaction.ifMatch.netWin}%</b></div>
            </div>
          </div>
          <div className="ci-winner" style={{ marginTop: 12 }}>{acc.compReaction.note}</div>
        </section>
      )}

      <section className="ci-panel">
        <h3>Competitive positioning</h3>
        <BarRow data={acc.competitors.map((c) => ({ k: c.n, v: c.pv, c: "var(--acq)" }))} fmt={money} />
        <p className="ci-pos">Liberty · <b>{acc.position}</b></p>
      </section>

      <div className="ci-cta">
        <button className="ci-btn ghost" onClick={() => go(nav, "quoteintel")}>← Quote</button>
        <button className="ci-btn" onClick={() => go(nav, "negotiation")}>Prepare negotiation →</button>
      </div>
    </>
  );
}

/* ---------- 3 · NEGOTIATION INTELLIGENCE ---------- */
function NegotiationView({ acc, nav }) {
  const n = acc.negotiation;
  const winner = acc.quotes.find((q) => q.rec);
  const endMargin = n.bridge.start + n.bridge.steps.reduce((s, x) => s + x.d, 0);
  const genTermSheet = () => {
    const body =
`TERM SHEET — ${acc.name}
${acc.industry} · ${acc.classCode} · ${acc.state}
Lines: ${(acc.lines || []).join(", ")}
Broker: ${acc.broker?.name} (${acc.broker?.tier} · bind ${acc.broker?.bindRate})

STRUCTURE
  Recommended:      ${winner.label} — ${winner.cov}
  Premium:          ${money(winner.prem)}
  Win probability:  ${acc.winScore}%
  Projected margin: ${endMargin.toFixed(1)}%
  Projected LR:     ${acc.projLR || "—"}

NEGOTIATION
  Opening:          ${n.opening}
  Anticipated:      ${n.counter}
  Fallbacks:
${n.fallbacks.map((f, i) => `    ${i + 1}. ${f}`).join("\n")}
  Non-price levers: ${n.nonprice.join(" · ")}
  Walk-away:        ${money(n.walkaway)} — rate-adequacy floor

Guardrails: rate-adequacy floor · loss-ratio limit · NAIC 24-08 fair-pricing

(Illustrative document generated by TwinX Commercial Intelligence.)`;
    downloadDoc(`term-sheet-${slug(acc.name)}.txt`, body);
  };
  return (
    <>
      <KpiRibbon cols={4} items={[
        { label: "Win probability", value: acc.winScore + "%", icon: "↗", sub: "target > 60%", color: "var(--acc)" },
        { label: "Proj. margin", value: endMargin.toFixed(1) + "%", icon: "$", sub: "target > 12%", color: "var(--green)" },
        { label: "Loss ratio", value: acc.projLR, icon: "%", sub: "held to target" },
        { label: "Price position", value: acc.position.split(" (")[0], icon: "≈", sub: acc.position.match(/\(([^)]+)\)/)?.[1] || "" },
      ]} />

      <div className="ci-grid2">
        <section className="ci-panel">
          <h3>Broker negotiation context</h3>
          <ul className="ci-kv">
            <li><b>Broker</b><span>{acc.broker.name} · {acc.broker.tier} · bind {acc.broker.bindRate}</span></li>
            <li><b>Book quality</b><span>{acc.broker.book}</span></li>
            <li><b>Flexibility</b><span>{n.flex}</span></li>
            <li><b>Opening</b><span>{n.opening}</span></li>
            <li><b>Anticipated counter</b><span>{n.counter}</span></li>
            <li><b>Non-price levers</b><span>{n.nonprice.join(" · ")}</span></li>
            <li><b>Walk-away</b><span>{money(n.walkaway)} — rate-adequacy floor</span></li>
          </ul>
        </section>
        <section className="ci-panel">
          <h3>Concession path · premium vs win</h3>
          <p className="ci-sub">Each concession step trades premium for bind probability</p>
          <ConcessionChart ladder={n.ladder} />
        </section>
      </div>

      <section className="ci-panel">
        <h3>Negotiation playbook</h3>
        <div className="ci-play">
          <div><span className="ci-play-k">Opening</span>{n.opening}</div>
          <div><span className="ci-play-k">Anticipated counter</span>{n.counter}</div>
          <div><span className="ci-play-k">Fallbacks</span>
            <ol className="ci-fb">{n.fallbacks.map((f, i) => <li key={i}>{f}</li>)}</ol>
          </div>
          <div><span className="ci-play-k">Non-price levers</span>{n.nonprice.join(" · ")}</div>
          <div className="ci-walk"><span className="ci-play-k">Walk-away</span>{money(n.walkaway)} — below this, rate falls under adequacy</div>
        </div>
      </section>

      <section className="ci-panel">
        <h3>Concession optimizer</h3>
        <table className="ci-conc">
          <thead><tr><th>Broker asks</th><th>Recommended response</th><th>Margin cost</th><th>Win Δ</th><th>Portfolio</th></tr></thead>
          <tbody>
            {n.concessions.map((c, i) => (
              <tr key={i}><td>{c.req}</td><td>{c.resp}</td><td>{c.cost}</td><td className="up">{c.win}</td><td>{c.port}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="ci-sub" style={{ marginTop: 12 }}>Alternative structures if price stalls: {n.alts.join(" · ")}</p>
      </section>

      <div className="ci-grid2">
        <section className="ci-panel">
          <h3>Margin bridge</h3>
          <p className="ci-sub">How each concession lever moves margin, start → end</p>
          <MarginBridge bridge={n.bridge} />
        </section>
        <section className="ci-panel ci-propose">
          <div className="ci-propose-ic">🛡️</div>
          <h3>Ready to propose?</h3>
          <p className="ci-sub">Improved win probability to <b>{acc.winScore}%</b> at a margin of <b>{endMargin.toFixed(1)}%</b>, held to loss ratio.</p>
          <button className="ci-btn" onClick={genTermSheet}>Save &amp; generate term sheet →</button>
        </section>
      </div>

      <AuditTrail />

      <div className="ci-cta">
        <button className="ci-btn ghost" onClick={() => go(nav, "elasticity")}>← Elasticity & Win-Prob</button>
      </div>
    </>
  );
}

/* ---------- 0 · BOOK COCKPIT (portfolio P&L) ---------- */
function BookCockpit({ onOpen }) {
  const nwpPct = (BOOK.nwp / BOOK.nwpPlan) * 100;
  // EV-ranked submission pipeline: live accounts (clickable) + open leads
  const pipeline = [
    ...ACCOUNTS.map((a) => { const w = a.quotes.find((q) => q.rec); return { id: a.id, name: a.name, cls: a.classCode, state: a.state, ev: evOf(w), win: w.win, combined: combinedOf(a), triage: a.triage, live: true }; }),
    { id: "harborview", name: "Harborview Property Mgmt", cls: "BOP 65112", state: "FL", ev: 14200, win: 66, combined: 92.4, triage: "auto-quote", live: false },
    { id: "summit", name: "Summit Precision Machining", cls: "WC 3632", state: "OH", ev: 9800, win: 58, combined: 94.1, triage: "referral", live: false },
    { id: "delmar", name: "Del Mar Coastal Eatery", cls: "BOP 16900", state: "CA", ev: 4100, win: 41, combined: 103.2, triage: "decline", live: false },
  ].sort((a, b) => b.ev - a.ev);
  const maxClassNwp = Math.max(...BOOK.byClass.map((c) => c.nwp));
  return (
    <>
      <KpiRibbon cols={4} items={[
        { label: "NWP vs plan (QTD)", value: `$${BOOK.nwp.toFixed(1)}M`, icon: "$", sub: `${nwpPct.toFixed(0)}% of $${BOOK.nwpPlan.toFixed(1)}M plan`, color: "var(--acc)" },
        { label: "Win rate vs plan", value: BOOK.winRate + "%", icon: "↗", sub: `target ${BOOK.winRatePlan}% · ${BOOK.bound}/${BOOK.quoted} bound`, color: BOOK.winRate >= BOOK.winRatePlan ? "var(--green)" : "var(--ret)" },
        { label: "Loss ratio", value: BOOK.lossRatio + "%", icon: "%", sub: `target < ${BOOK.lossTarget}%`, color: BOOK.lossRatio < BOOK.lossTarget ? "var(--green)" : "var(--ret)" },
        { label: "Combined ratio", value: (BOOK.lossRatio + BOOK.expenseRatio).toFixed(1) + "%", icon: "Σ", sub: `target < ${BOOK.combinedTarget}%`, color: (BOOK.lossRatio + BOOK.expenseRatio) < BOOK.combinedTarget ? "var(--green)" : "var(--ret)" },
      ]} />

      <section className="ci-panel">
        <div className="ci-ready-h"><h3>Submission pipeline · ranked by expected value</h3><span className="ci-ready-note">{money(Math.round(BOOK.pipelineEV * 1e6 / 1000) * 1000)} open EV · click a live RFP to price it</span></div>
        <p className="ci-sub">Work the book by expected value (win% × margin$), not by arrival order. Combined-ratio flags where winning would cost the book.</p>
        <div className="ci-tablewrap">
          <table className="ci-book">
            <thead><tr><th>RFP / account</th><th>Class</th><th>St</th><th>Expected value</th><th>Win %</th><th>Combined</th><th>Triage</th><th></th></tr></thead>
            <tbody>
              {pipeline.map((r) => (
                <tr key={r.id + r.name} className={r.live ? "ci-book-live" : ""} onClick={r.live ? () => onOpen(r.id) : undefined}>
                  <td><b>{r.name}</b></td>
                  <td>{r.cls}</td>
                  <td>{r.state}</td>
                  <td className="ci-book-ev">{money(Math.round(r.ev))}</td>
                  <td>{r.win}%</td>
                  <td style={{ color: r.combined < BOOK.combinedTarget ? "var(--green)" : "var(--red)" }}>{r.combined.toFixed(1)}%</td>
                  <td><span className={"ci-triage ci-triage-" + r.triage}>{r.triage.replace("-", " ")}</span></td>
                  <td>{r.live ? <span className="ci-book-open">Open →</span> : <span className="ci-book-note">lead</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ci-grid2">
        <section className="ci-panel">
          <h3>Mix &amp; loss ratio by class</h3>
          <p className="ci-sub">NWP concentration and where the loss ratio is running hot</p>
          <div className="ci-mix">
            {BOOK.byClass.map((c) => (
              <div key={c.k} className="ci-mix-row">
                <span className="ci-mix-k">{c.k}</span>
                <div className="ci-mix-track"><i style={{ width: `${(c.nwp / maxClassNwp) * 100}%`, background: c.lr >= BOOK.lossTarget ? "var(--red)" : "var(--acc)" }} /></div>
                <span className="ci-mix-v">${c.nwp.toFixed(1)}M</span>
                <span className="ci-mix-lr" style={{ color: c.lr >= BOOK.lossTarget ? "var(--red)" : "var(--green)" }}>{c.lr}% LR</span>
              </div>
            ))}
          </div>
        </section>
        <section className="ci-panel">
          <h3>Appetite concentration · headroom to cap</h3>
          <p className="ci-sub">Where the book can still grow — and where to stop adding</p>
          <div className="ci-mix">
            {BOOK.concentration.map((c) => {
              const pct = (c.share / c.cap) * 100;
              const tone = pct >= 95 ? "var(--red)" : pct >= 80 ? "var(--ret)" : "var(--green)";
              return (
                <div key={c.seg} className="ci-mix-row">
                  <span className="ci-mix-k">{c.seg}</span>
                  <div className="ci-mix-track ci-mix-cap"><i style={{ width: `${Math.min(100, pct)}%`, background: tone }} /></div>
                  <span className="ci-mix-v">{c.share}% / {c.cap}%</span>
                  <span className="ci-mix-lr" style={{ color: tone }}>{pct >= 95 ? "at cap" : pct >= 80 ? "watch" : "open"}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="ci-grid2">
        <section className="ci-panel">
          <h3>Broker scorecard</h3>
          <p className="ci-sub">Cross-book performance — drives how much price flexibility each broker earns</p>
          <div className="ci-tablewrap">
            <table className="ci-book">
              <thead><tr><th>Broker</th><th>Tier</th><th>Subs</th><th>Bind %</th><th>Book LR</th><th>Win trend</th></tr></thead>
              <tbody>
                {BROKERS.map((b) => (
                  <tr key={b.name}>
                    <td><b>{b.name}</b></td>
                    <td>{b.tier}</td>
                    <td>{b.submissions}</td>
                    <td>{b.bindRate}%</td>
                    <td style={{ color: b.bookLR >= BOOK.lossTarget ? "var(--red)" : "var(--green)" }}>{b.bookLR}%</td>
                    <td style={{ color: b.winTrend >= 0 ? "var(--green)" : "var(--red)" }}>{b.winTrend >= 0 ? "+" : ""}{b.winTrend}pp</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="ci-panel">
          <h3>Win / loss learn loop</h3>
          <p className="ci-sub">Closed outcomes recalibrate the win-probability model and elasticity anchors</p>
          <ul className="ci-learn">
            {WINLOSS.map((w) => (
              <li key={w.acct} className={"ci-learn-" + w.outcome}>
                <span className={"ci-learn-tag ci-learn-tag-" + w.outcome}>{w.outcome}</span>
                <div className="ci-learn-b">
                  <b>{w.acct}</b> · {money(w.prem)} · predicted win {w.predWin}%
                  <span>{w.note}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="ci-sub" style={{ marginTop: 10 }}>Recalibration: model was over-confident on fleet flexibility (−8pp adjustment applied); no-bid discipline validated on sub-adequacy accounts.</p>
        </section>
      </div>
    </>
  );
}

const TITLES = {
  book: ["Book Cockpit", "Portfolio P&L · pipeline, mix, concentration and the learn loop"],
  quoteintel: ["Quote Intelligence", "Multi-scenario quote generation · account / RFP level"],
  elasticity: ["Elasticity & Win Probability", "Sensitivity Lab · price the account against the market"],
  negotiation: ["Negotiation Intelligence", "Playbook + concession strategy per broker"],
};

export default function CommercialIntelWorkspace({ view = "quoteintel" }) {
  const [acc, setAcc] = useAccount();
  const nav = useNavigate();
  const [title, sub] = TITLES[view] || TITLES.quoteintel;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => acc.id, [acc.id]); // remount charts on account switch
  return (
    <div className="ci-ws">
      <header className="ci-head">
        <div>
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
        <FlowNav view={view} nav={nav} />
      </header>
      {view !== "book" && <AccountBar acc={acc} onPick={setAcc} />}
      {view === "book" ? <BookCockpit onOpen={(id) => { setAcc(id); go(nav, "quoteintel"); }} />
        : view === "elasticity" ? <ElasticityView key={acc.id} acc={acc} nav={nav} />
        : view === "negotiation" ? <NegotiationView key={acc.id} acc={acc} nav={nav} />
        : <QuoteView key={acc.id} acc={acc} nav={nav} />}
    </div>
  );
}
