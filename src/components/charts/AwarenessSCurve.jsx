import React, { useMemo } from "react";
import "@/styles/test-charts.css";

/**
 * AwarenessSCurve — adstock awareness build over 6 weeks.
 *
 * For weeks 1..6:
 *   awareness(w) = effReach × (1 - exp(-frequency × 0.4 × w / 2))
 *
 * effReach is derived from channelMix (same weights as ChannelMixFunnel).
 * Plots the line, fills the area, marks the peak week with a small ●.
 *
 * Props
 *   frequency   : 1–5
 *   channelMix  : { inapp, push, email, sms, rm } — each 0–100
 */

const REACH = { inapp: 0.95, push: 0.70, email: 0.55, sms: 0.80, rm: 0.42 };
const WEEKS = 6;

export default function AwarenessSCurve({
  frequency = 3,
  channelMix = { inapp: 40, push: 20, email: 15, sms: 10, rm: 15 },
}) {
  const { points, peak, effReach } = useMemo(() => {
    const total =
      Object.values(channelMix).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
    const mix = Object.fromEntries(
      Object.entries(channelMix).map(([k, v]) => [k, (Number(v) || 0) / total])
    );
    const eff = Object.keys(REACH).reduce(
      (s, c) => s + (mix[c] || 0) * REACH[c],
      0
    );

    const pts = [];
    for (let w = 1; w <= WEEKS; w++) {
      const awareness = eff * (1 - Math.exp(-frequency * 0.4 * (w / 2)));
      pts.push({ w, awareness });
    }
    // Peak = the week where the curve gets within 2% of asymptote.
    let pk = WEEKS;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].awareness >= eff * 0.98) {
        pk = pts[i].w;
        break;
      }
    }
    return { points: pts, peak: pk, effReach: eff };
  }, [frequency, channelMix]);

  const W = 600;
  const H = 240;
  const PAD_L = 50;
  const PAD_R = 22;
  const PAD_T = 18;
  const PAD_B = 36;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  // Y range: 0..1 (awareness as proportion). Show ticks at 0/25/50/75/100.
  const x = (w) => PAD_L + ((w - 1) / (WEEKS - 1)) * plotW;
  const y = (a) => PAD_T + plotH - a * plotH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.w)} ${y(p.awareness)}`).join(" ");
  const area = `${line} L ${x(WEEKS)} ${PAD_T + plotH} L ${x(1)} ${PAD_T + plotH} Z`;

  const peakPt = points.find((p) => p.w === peak) || points[points.length - 1];

  return (
    <div className="test-chart chart-awareness-scurve">
      <div className="tc-title">Awareness build — 6-week adstock</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Awareness S-curve">
        {/* Y grid + ticks at 0, 25, 50, 75, 100% */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(g)}
              y2={y(g)}
              className="as-grid"
            />
            <text x={PAD_L - 8} y={y(g) + 3} textAnchor="end" className="tc-axis-tx">
              {Math.round(g * 100)}%
            </text>
          </g>
        ))}

        {/* Asymptote (ceiling) */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={y(effReach)}
          y2={y(effReach)}
          className="as-grid"
          strokeDasharray="3 4"
        />
        <text
          x={W - PAD_R - 4}
          y={y(effReach) - 5}
          textAnchor="end"
          className="tc-sub"
        >
          ceiling {Math.round(effReach * 100)}%
        </text>

        {/* X axis labels — week numbers */}
        {points.map((p) => (
          <text
            key={p.w}
            x={x(p.w)}
            y={H - PAD_B + 16}
            textAnchor="middle"
            className="tc-axis-tx"
          >
            wk {p.w}
          </text>
        ))}

        <path d={area} className="as-area" />
        <path d={line} className="as-line" />

        {/* Peak marker */}
        <circle cx={x(peakPt.w)} cy={y(peakPt.awareness)} r={5} className="as-peak" />
        <text
          x={x(peakPt.w)}
          y={y(peakPt.awareness) - 10}
          textAnchor="middle"
          className="tc-num"
          style={{ fontSize: 10 }}
        >
          peak wk {peakPt.w}
        </text>
      </svg>
      <div className="tc-commentary">
        <b>▶</b> Awareness peaks at <b>wk {peak}</b> with your current frequency ({frequency}/week).
      </div>
    </div>
  );
}
