/* ============================================================================
   IfWhatCharts — per-recommendation chart components for the If-What deep
   dive. Mirrors the depth of the What-If results page (J-Curve · Weekly
   Trajectory small-multiples · Arena breakdown) but scaled per-rank so
   each top-3 recommendation renders its own curves.

   Why a separate file (instead of importing from SimulateWorkspace):
     - The What-If versions are tightly coupled to ResultsReveal's animation
       state (cur, progress, playKey). The If-What deep dive is a static
       snapshot of an already-completed result — no animation needed.
     - Per-rank scaling: rank 1 = 1.0 multiplier, rank 2 = 0.84, rank 3 =
       0.52. Each rank's J-Curve, KPI trajectories, and arena metrics use
       that multiplier so the visual story diverges per recommendation.
   ========================================================================= */
import { useState } from "react";

const SPARK_COLORS = {
  nii: "var(--acq, #5b9dff)",
  fail: "var(--green, #42e08b)",
  fraud: "var(--ink-3)",
  di: "var(--green, #42e08b)",
  cc: "var(--green, #42e08b)",
  comp: "var(--green, #42e08b)",
};

/* Build a KPI suite for a given rank. Multiplier scales the "final" outcome
   numbers; the curve *shape* is the same exponential ramp, so what differs
   across ranks is altitude, not character. */
function kpisFor(rank) {
  // Rank 1 baseline. Lower ranks scale outcomes down.
  const mult = rank === 1 ? 1.0 : rank === 2 ? 0.84 : 0.52;
  const di = rank === 1 ? 0.94 : rank === 2 ? 0.93 : 0.97; // rank 3 is conservative → safer
  return [
    {
      key: "nii", label: "Net Interest Income",
      finalNum: 11.9 * mult,
      fmt: (n) => `+$${n.toFixed(1)}M`,
      shape: (t) => 11.9 * mult * (1 - Math.exp(-t / 2.2)),
    },
    {
      key: "fail", label: "Failures removed",
      finalNum: 29300 * mult,
      fmt: (n) => `−${Math.round(n).toLocaleString()}/qtr`,
      shape: (t) => 29300 * mult * (1 - Math.exp(-t / 1.6)),
    },
    {
      key: "fraud", label: "Fraud impact",
      finalNum: 0,
      fmt: () => "CI ≤ 0",
      shape: (t) => 0.5 * Math.sin(t / 1.5) * 0.2,
    },
    {
      key: "di", label: "Fair-lending margin",
      finalNum: di,
      fmt: (n) => n.toFixed(2),
      shape: (t) => 0.85 + (di - 0.85) * (1 - Math.exp(-t / 2.0)),
      flat: true,
    },
    {
      key: "cc", label: "Call-centre savings",
      finalNum: 16.8 * mult,
      fmt: (n) => `−$${n.toFixed(1)}M`,
      shape: (t) => 16.8 * mult * (1 - Math.exp(-t / 2.4)),
    },
    {
      key: "comp", label: "Complaints",
      finalNum: 3360 * mult,
      fmt: (n) => `−${Math.round(n).toLocaleString()}`,
      shape: (t) => 3360 * mult * (1 - Math.exp(-t / 2.0)),
    },
  ];
}

/* ============================================================================
   IfWhatJCurve — cumulative NII curve for the selected rank.
   Same dip-then-climb shape as What-If's hero, scaled by the rank's
   multiplier so a rank 3 policy reaches a noticeably smaller payback.
   ========================================================================= */
function IfWhatJCurve({ rank }) {
  const W = 8;
  const Wd = 560, H = 200;
  const PL = 48, PR = 18, PT = 14, PB = 26;
  const mult = rank === 1 ? 1.0 : rank === 2 ? 0.84 : 0.52;
  const inflWk = rank === 1 ? 5 : rank === 2 ? 5 : 6; // conservative pays back later

  const shapeRamp = (w) => 1 - Math.exp(-w / 1.6);
  const phase = (start, end, t) =>
    t <= start ? 0 : t >= end ? 1 : shapeRamp(t - start);
  const f = (t) => {
    /* Coefficients in $K. Sum / 1000 yields $M on the chart axis.
       Scaled to US Bank portfolio range — a single retention test of
       this kind moves $10M+, not $1M. */
    const retention = 11900 * mult * phase(0, 4, t);
    const ccSave = 2800 * mult * phase(0, 4, t);
    const spend = 6700 * (rank === 3 ? 0.7 : 1.0) * phase(2, 6, t);
    const deepen = 3900 * mult * phase(4, 8, t);
    return (retention + ccSave - spend + deepen) / 1000;
  };

  const N = 80;
  const samp = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * W;
    samp.push({ t, v: f(t) });
  }
  const ciFrac = 0.15;
  let mx = Math.max(...samp.map((s) => s.v), 0);
  let mn = Math.min(...samp.map((s) => s.v), 0);
  if (mx === mn) { mx += 1; mn -= 1; }
  const pad = (mx - mn) * 0.12; mx += pad; mn -= pad;

  const X = (t) => PL + (t / W) * (Wd - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);

  const main = samp.map((s) => `${X(s.t).toFixed(1)},${Y(s.v).toFixed(1)}`).join(" ");
  const up = [], lo = [];
  samp.forEach((s) => {
    const hw = Math.abs(s.v) * ciFrac / Math.sqrt(Math.max(0.4, s.t));
    up.push(`${X(s.t).toFixed(1)},${Y(s.v + hw).toFixed(1)}`);
    lo.unshift(`${X(s.t).toFixed(1)},${Y(s.v - hw).toFixed(1)}`);
  });

  return (
    <div className="jcurve-wrap">
      <svg viewBox={`0 0 ${Wd} ${H}`} preserveAspectRatio="none" className="jcurve-svg" height={H}>
        <line x1={PL} y1={Y(0).toFixed(1)} x2={Wd - PR} y2={Y(0).toFixed(1)}
              stroke="var(--ink-4)" strokeWidth=".7" strokeDasharray="3 3" opacity=".55" />
        {Array.from({ length: W }, (_, i) => i + 1).map((w) => (
          <line key={w} x1={X(w).toFixed(1)} y1={PT} x2={X(w).toFixed(1)} y2={H - PB}
                stroke="var(--hair)" strokeWidth=".5" opacity=".55" />
        ))}
        {[mn, (mn + mx) / 2, mx].map((y, i) => (
          <text key={i} x={PL - 6} y={Y(y).toFixed(1) + 3} textAnchor="end"
                fontSize="9" fill="var(--ink-3)" fontFamily="var(--mono)">
            {y >= 0 ? `+$${y.toFixed(2)}M` : `−$${Math.abs(y).toFixed(2)}M`}
          </text>
        ))}
        {Array.from({ length: W }, (_, i) => i + 1).map((w) => (
          <text key={w} x={X(w).toFixed(1)} y={H - 9} textAnchor="middle"
                fontSize="9.5" fill="var(--ink-3)" fontFamily="var(--mono)">
            wk{w}
          </text>
        ))}
        <polygon points={up.concat(lo).join(" ")} fill="var(--acq, #5b9dff)" opacity=".12" />
        <polyline points={main} fill="none" stroke="var(--acq, #5b9dff)" strokeWidth="2.2"
                  strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={X(W).toFixed(1)} cy={Y(f(W)).toFixed(1)} r="3.4" fill="var(--acq, #5b9dff)" />
        {/* Payback marker — week varies by rank */}
        <line x1={X(inflWk).toFixed(1)} y1={PT} x2={X(inflWk).toFixed(1)} y2={H - PB}
              stroke="var(--acc, #ffb15a)" strokeWidth=".8" strokeDasharray="3 3" opacity=".7" />
        <circle cx={X(inflWk).toFixed(1)} cy={Y(f(inflWk)).toFixed(1)} r="4"
                fill="var(--bg-1, #0e0e10)" stroke="var(--acc, #ffb15a)" strokeWidth="1.8" />
        <text x={X(inflWk).toFixed(1) + 6} y={PT + 12} fontSize="10"
              fill="var(--acc, #ffb15a)" fontFamily="var(--mono)">
          payback · wk {inflWk}
        </text>
      </svg>
      <p className="how-caption">
        Cumulative NII crosses zero at week {inflWk} — the payback inflection.
        {rank === 3 && " Conservative policies pay back later."}
        {rank === 2 && " Rail-broadening modestly delays the climb."}
      </p>
    </div>
  );
}

/* ============================================================================
   IfWhatTrajectory — small-multiples of all 6 KPIs for the selected rank.
   Each tile renders the per-KPI curve as a polyline, with synced hover
   highlighting the same week across all 6 tiles.
   ========================================================================= */
function IfWhatTrajectory({ rank }) {
  const kpis = kpisFor(rank);
  const [hoverWeek, setHoverWeek] = useState(null);
  const W = 220, H = 90, PL = 28, PR = 8, PT = 8, PB = 22;
  const Wks = 8;
  const weeks = Array.from({ length: Wks }, (_, i) => i + 1);

  return (
    <div className="wt-grid">
      {kpis.map((k) => {
        const f = k.shape;
        const N = 40;
        const samp = [];
        for (let i = 0; i <= N; i++) {
          const t = (i / N) * Wks;
          samp.push({ t, v: f(t) });
        }
        const all = samp.map((s) => s.v);
        let mn = Math.min(...all), mx = Math.max(...all);
        if (mn === mx) { mn -= 1; mx += 1; }
        const pad = (mx - mn) * 0.15; mn -= pad; mx += pad;
        if (k.key === "di") { mn = 0.78; mx = 0.98; }

        const X = (t) => PL + (t / Wks) * (W - PL - PR);
        const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
        const pts = samp.map((s) => `${X(s.t).toFixed(1)},${Y(s.v).toFixed(1)}`).join(" ");
        const col = SPARK_COLORS[k.key] || "var(--acq, #5b9dff)";

        const weekVal = (wk) => {
          if (k.key === "fraud") return null;
          if (k.flat) return f(wk);
          return f(wk);
        };
        const hoverVal = hoverWeek != null ? weekVal(hoverWeek) : null;

        return (
          <div key={k.key} className="wt-tile">
            <div className="wt-tile-h">
              <span className="wt-tile-label">{k.label}</span>
              <span className="wt-tile-val">
                {hoverWeek != null
                  ? (k.key === "fraud" ? "≈0" : k.fmt(hoverVal))
                  : (k.key === "fraud" ? "CI ≤ 0" : k.fmt(k.finalNum))}
              </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="wt-svg">
              {weeks.map((wk) => (
                <line key={`g-${wk}`} x1={X(wk)} y1={PT} x2={X(wk)} y2={H - PB}
                      stroke="var(--hair)" strokeWidth="0.5" opacity="0.6" />
              ))}
              {k.key === "di" && (
                <line x1={PL} y1={Y(0.85)} x2={W - PR} y2={Y(0.85)}
                      stroke="var(--ink-4)" strokeWidth="0.6"
                      strokeDasharray="2 2" opacity="0.6" />
              )}
              <polyline points={pts} fill="none" stroke={col} strokeWidth="1.7"
                        strokeLinejoin="round" strokeLinecap="round" />
              {hoverWeek != null && (
                <>
                  <line x1={X(hoverWeek)} y1={PT} x2={X(hoverWeek)} y2={H - PB}
                        stroke={col} strokeWidth="0.8" opacity="0.45" />
                  <circle cx={X(hoverWeek)} cy={Y(f(hoverWeek))}
                          r="3" fill={col} stroke="var(--panel)" strokeWidth="1.2" />
                </>
              )}
              {weeks.map((wk) => (
                <text key={`t-${wk}`} x={X(wk)} y={H - 6} textAnchor="middle"
                      fontSize="8" fill="var(--ink-4)" fontFamily="var(--mono)">{wk}</text>
              ))}
              <text x={W / 2} y={H - 0.5} textAnchor="middle" fontSize="7.5"
                    fill="var(--ink-4)" fontFamily="var(--mono)">week</text>
              {weeks.map((wk) => {
                const cellW = (W - PL - PR) / Wks;
                return (
                  <rect key={`h-${wk}`} x={X(wk) - cellW / 2} y={0}
                        width={cellW} height={H} fill="transparent"
                        onMouseEnter={() => setHoverWeek(wk)}
                        onMouseLeave={() => setHoverWeek(null)}
                        style={{ cursor: "crosshair" }} />
                );
              })}
            </svg>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
   IfWhatArenas — "How it got there" 3-arena breakdown for the selected
   rank. Each card is clickable; an expanded drill-down underneath the
   3-card grid surfaces specific details (friction distribution, channel
   performance, cross-sell propensity) so the user can move from "17.8%
   attach" to "here's WHICH customer segments are buying WHICH product."
   ========================================================================= */
function ArenaCard({ title, range, metric, metricCap, foot, chart, tone, isOpen, onClick }) {
  return (
    <button
      className={
        `arena-card arena-tone-${tone} reveal in arena-card-button` +
        (isOpen ? " is-open" : "")
      }
      onClick={onClick}
      type="button"
    >
      <div className="arena-card-h">
        <span className="arena-card-title">{title}</span>
        <span className="arena-card-range">{range}</span>
      </div>
      <div className="arena-card-metric">{metric}</div>
      <div className="arena-card-cap">{metricCap}</div>
      <div className="arena-card-chart">{chart}</div>
      <div className="arena-card-foot">{foot}</div>
      <div className="arena-card-drillchev">
        {isOpen ? "Collapse details ▴" : "See details ▾"}
      </div>
    </button>
  );
}

function FrictionDropMini({ rank }) {
  const W = 220, H = 50, PL = 4, PR = 4, PT = 6, PB = 6;
  const targetFriction = rank === 1 ? 12.4 : rank === 2 ? 14.1 : 17.8;
  const f = (t) => 22.7 - (22.7 - targetFriction) * (1 - Math.exp(-t / 1.4));
  const pts = [];
  for (let t = 0; t <= 4; t += 0.1) pts.push([t, f(t)]);
  const mn = 10, mx = 24;
  const X = (t) => PL + (t / 4) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
  const d = pts.map(([t, v], i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height={H} className="arena-mini-svg">
      <line x1={PL} y1={Y(16)} x2={W - PR} y2={Y(16)} stroke="var(--ink-4)" strokeDasharray="2 3" opacity=".5" strokeWidth=".6" />
      <path d={d} fill="none" stroke="var(--ret, #ffb15a)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={X(4)} cy={Y(f(4))} r="2.6" fill="var(--ret, #ffb15a)" />
    </svg>
  );
}

function SCurveMini({ rank }) {
  const W = 220, H = 50, PL = 4, PR = 4, PT = 6, PB = 6;
  const ceiling = rank === 1 ? 0.71 : rank === 2 ? 0.63 : 0.42;
  const f = (t) => ceiling / (1 + Math.exp(-(t - 3.2) * 1.6));
  const pts = [];
  for (let t = 0; t <= 6; t += 0.15) pts.push([t, f(t)]);
  const mn = 0, mx = 0.78;
  const X = (t) => PL + (t / 6) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
  const d = pts.map(([t, v], i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height={H} className="arena-mini-svg">
      <path d={d} fill="none" stroke="var(--acq, #5b9dff)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={X(6)} cy={Y(f(6))} r="2.6" fill="var(--acq, #5b9dff)" />
    </svg>
  );
}

function AttachMini({ rank }) {
  const W = 220, H = 50, PL = 4, PR = 4, PT = 6, PB = 6;
  const ceiling = rank === 1 ? 0.178 : rank === 2 ? 0.148 : 0.092;
  const f = (t) => ceiling * (1 - Math.exp(-(t) / 1.6));
  const pts = [];
  for (let t = 0; t <= 4; t += 0.12) pts.push([t, f(t)]);
  const mn = 0, mx = 0.20;
  const X = (t) => PL + (t / 4) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);
  const d = pts.map(([t, v], i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const bars = [];
  for (let i = 0; i < 4; i++) {
    const v = f(i + 1);
    const bx = PL + (i / 4) * (W - PL - PR) + 4;
    const bw = (W - PL - PR) / 4 - 6;
    bars.push(
      <rect key={i} x={bx} y={Y(v)} width={bw} height={Math.max(0, (H - PB) - Y(v))}
            fill="var(--green, #42e08b)" opacity=".18" />
    );
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height={H} className="arena-mini-svg">
      {bars}
      <path d={d} fill="none" stroke="var(--green, #42e08b)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={X(4)} cy={Y(f(4))} r="2.6" fill="var(--green, #42e08b)" />
    </svg>
  );
}

/* ============================================================================
   Arena drill-downs — what shows underneath when a card is expanded.
   Each arena has its own structured detail; the per-rank multiplier flows
   through so a rank-2 deep dive reads different numbers from rank-1.
   ========================================================================= */

function PaymentDrill({ rank }) {
  const mult = rank === 1 ? 1.0 : rank === 2 ? 0.84 : 0.52;
  /* Friction-removed distribution by customer subsegment. Counts ≈ 236,000
     a year for rank 1; scale down for less-ambitious policies. */
  const events = Math.round(236000 * mult);
  const rows = [
    { seg: "Single-payee renters (1–2 events / qtr removed)",  pct: 0.46, color: "var(--ret, #ffb15a)" },
    { seg: "Recurring landlord, multi-payee (3–5 events removed)", pct: 0.34, color: "var(--ret, #ffb15a)" },
    { seg: "Frequent rent + recurring utilities (6+ removed)", pct: 0.14, color: "var(--ret, #ffb15a)" },
    { seg: "Edge cases · once-off lifts", pct: 0.06, color: "var(--ink-3)" },
  ];
  return (
    <div className="arena-drill">
      <div className="arena-drill-h">
        Friction events removed by customer pattern · ~{events.toLocaleString()} / yr
      </div>
      <div className="arena-drill-bars">
        {rows.map((r, i) => (
          <div key={i} className="arena-drill-row">
            <span className="arena-drill-seg">{r.seg}</span>
            <span className="arena-drill-bar-wrap">
              <span className="arena-drill-bar" style={{ width: `${r.pct * 100}%`, background: r.color }} />
            </span>
            <span className="arena-drill-pct">{(r.pct * 100).toFixed(0)}%</span>
            <span className="arena-drill-n">{Math.round(events * r.pct).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="arena-drill-note">
        Most of the friction relief sits with single-payee renters — the cohort
        the trust gate was designed for. Multi-payee renters are the next tier
        to address in v2.
      </div>
    </div>
  );
}

function CommsDrill({ rank }) {
  /* Per-channel performance: share of awareness, cost per aware, NPS delta.
     Numbers tuned to feel realistic for a banking PM and scale with rank. */
  const mult = rank === 1 ? 1.0 : rank === 2 ? 0.88 : 0.62;
  const rows = [
    { ch: "In-app",   share: 0.48, cpa: 0.62, nps: 5.4, color: "var(--acq, #5b9dff)" },
    { ch: "Push",     share: 0.18, cpa: 0.41, nps: 3.1, color: "var(--acq, #5b9dff)" },
    { ch: "Email",    share: 0.14, cpa: 0.28, nps: 1.8, color: "var(--acq, #5b9dff)" },
    { ch: "SMS",      share: 0.12, cpa: 1.14, nps: 4.2, color: "var(--acq, #5b9dff)" },
    { ch: "RM call",  share: 0.08, cpa: 14.60, nps: 8.1, color: "var(--acq, #5b9dff)" },
  ];
  return (
    <div className="arena-drill">
      <div className="arena-drill-h">
        Channel performance · contribution to awareness, cost-per-aware, NPS delta
      </div>
      <table className="arena-drill-table">
        <thead>
          <tr>
            <th>Channel</th>
            <th>Share of awareness</th>
            <th>Cost / aware</th>
            <th>NPS Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="arena-drill-table-ch">{r.ch}</td>
              <td>
                <span className="arena-drill-inline-bar-wrap">
                  <span className="arena-drill-inline-bar" style={{ width: `${r.share * 100}%`, background: r.color }} />
                </span>
                <span className="arena-drill-table-pct">{(r.share * 100).toFixed(0)}%</span>
              </td>
              <td className="arena-drill-table-mono">${r.cpa.toFixed(2)}</td>
              <td className="arena-drill-table-mono">+{(r.nps * mult).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="arena-drill-note">
        In-app drives nearly half the awareness at the lowest cost per aware.
        RM call carries the highest NPS lift but only scales for the top
        decile of relationships.
      </div>
    </div>
  );
}

function DeepeningDrill({ rank }) {
  /* Cross-sell propensity by customer subsegment. Each segment shows the
     product with the strongest propensity + the attach rate that policy
     would land. Rank-2 and rank-3 attach rates step down proportionally. */
  const mult = rank === 1 ? 1.0 : rank === 2 ? 0.83 : 0.52;
  const segments = [
    { seg: "Young high-earners ($60–$120K)", best: "HY Savings",        attach: 0.241, color: "var(--green, #42e08b)" },
    { seg: "Family-stable, dual income",      best: "Credit Builder",    attach: 0.184, color: "var(--green, #42e08b)" },
    { seg: "Established savers ($120K+)",     best: "Secured Card",      attach: 0.142, color: "var(--green, #42e08b)" },
    { seg: "Volatile-income gig workers",     best: "Earned-wage access", attach: 0.211, color: "var(--green, #42e08b)" },
    { seg: "Low-balance churn risk",          best: "DD Switch",          attach: 0.092, color: "var(--ink-3)" },
  ];
  return (
    <div className="arena-drill">
      <div className="arena-drill-h">
        Cross-sell propensity by subsegment · which customers will take which product
      </div>
      <div className="arena-drill-bars">
        {segments.map((s, i) => {
          const a = s.attach * mult;
          return (
            <div key={i} className="arena-drill-row arena-drill-row-3col">
              <span className="arena-drill-seg">{s.seg}</span>
              <span className="arena-drill-best">
                <span className="arena-drill-best-arrow">→</span> {s.best}
              </span>
              <span className="arena-drill-bar-wrap">
                <span className="arena-drill-bar" style={{ width: `${(a / 0.30) * 100}%`, background: s.color }} />
              </span>
              <span className="arena-drill-pct">{(a * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
      <div className="arena-drill-note">
        Highest propensity is HY Savings on young high-earners — the same
        cohort the trust gate filters into. Volatile-income gig workers
        skew toward earned-wage access (different need, same trust
        signal). Low-balance churn risks under-attach across all products;
        revisit segmentation before scaling.
      </div>
    </div>
  );
}

function IfWhatArenas({ rank }) {
  const mult = rank === 1 ? 1.0 : rank === 2 ? 0.84 : 0.52;
  const blockedPct = rank === 1 ? "12.4" : rank === 2 ? "14.1" : "17.8";
  const awareness = rank === 1 ? "71%" : rank === 2 ? "63%" : "42%";
  // Marketing spend scaled to the larger cohort (was $48K for ~5K customers).
  const spend = rank === 1 ? 1.35 : rank === 2 ? 1.18 : 0.78;  // $M
  const attach = rank === 1 ? "17.8%" : rank === 2 ? "14.8%" : "9.2%";
  const primacy = (8.4 * mult).toFixed(1);  // $M — was $30K at smaller scale

  // Only one arena open at a time.
  const [open, setOpen] = useState(null);
  const toggle = (key) => setOpen((cur) => (cur === key ? null : key));

  return (
    <>
      <div className="arena-grid">
        <ArenaCard
          title="Payment policy"
          range="wk 1–4"
          metric={`${blockedPct}%`}
          metricCap="friction, from 22.7%"
          foot="✓ guardrails pass"
          chart={<FrictionDropMini rank={rank} />}
          tone="ret"
          isOpen={open === "pay"}
          onClick={() => toggle("pay")}
        />
        <ArenaCard
          title="Communications"
          range="wk 3–6"
          metric={awareness}
          metricCap="awareness in treated group"
          foot={`Spend $${spend.toFixed(2)}M · NPS +${(4.3 * mult).toFixed(1)}`}
          chart={<SCurveMini rank={rank} />}
          tone="acq"
          isOpen={open === "comms"}
          onClick={() => toggle("comms")}
        />
        <ArenaCard
          title="Deepening"
          range="wk 5–8"
          metric={attach}
          metricCap="attach on warmed group"
          foot={`Primacy uplift +$${primacy}M`}
          chart={<AttachMini rank={rank} />}
          tone="green"
          isOpen={open === "deepen"}
          onClick={() => toggle("deepen")}
        />
      </div>
      {open === "pay"    && <PaymentDrill rank={rank} />}
      {open === "comms"  && <CommsDrill rank={rank} />}
      {open === "deepen" && <DeepeningDrill rank={rank} />}
    </>
  );
}

export { IfWhatJCurve, IfWhatTrajectory, IfWhatArenas, PaymentDrill, CommsDrill, DeepeningDrill };
