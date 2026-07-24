import React, { useMemo } from "react";
import "@/styles/test-charts.css";

/**
 * IntensityAttach — two-line chart of attach % vs regret % as we scale
 * deepening intensity (1..4). Includes a regret guardrail at 8%.
 *
 *   attach(i) = 0.10 + 0.04 * i          → green
 *   regret(i) = 0.02 + 0.05 * (i-1) * 0.7 → amber
 *   guardrail = 0.08                      → red dashed
 *
 * Props
 *   intensity : 1..4  (user's current selection — placed as ● on attach curve)
 */

const X_VALS = [1, 2, 3, 4];

const attachF = (i) => 0.10 + 0.04 * i;
const regretF = (i) => 0.02 + 0.05 * (i - 1) * 0.7;
const GUARD = 0.08;

export default function IntensityAttach({ intensity = 2 }) {
  const { attachPts, regretPts, atY, rgY } = useMemo(() => {
    const a = X_VALS.map((x) => ({ x, y: attachF(x) }));
    const r = X_VALS.map((x) => ({ x, y: regretF(x) }));
    return {
      attachPts: a,
      regretPts: r,
      atY: attachF(intensity),
      rgY: regretF(intensity),
    };
  }, [intensity]);

  const W = 600;
  const H = 240;
  const PAD_L = 50;
  const PAD_R = 110;
  const PAD_T = 18;
  const PAD_B = 36;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const yMax = 0.32; // covers attach@4 = 0.26, regret guard 0.08, some headroom
  const xPos = (x) => PAD_L + ((x - X_VALS[0]) / (X_VALS[X_VALS.length - 1] - X_VALS[0])) * plotW;
  const yPos = (y) => PAD_T + plotH - (y / yMax) * plotH;

  const pathOf = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${xPos(p.x)} ${yPos(p.y)}`).join(" ");

  const breach = rgY > GUARD;

  return (
    <div className="test-chart chart-intensity-attach">
      <div className="tc-title">Deepening intensity — attach vs regret (with guardrail)</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Intensity vs attach and regret">
        {/* Y grid */}
        {[0, 0.08, 0.16, 0.24, 0.32].map((g) => (
          <g key={g}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yPos(g)} y2={yPos(g)} className="ia-grid" />
            <text x={PAD_L - 8} y={yPos(g) + 3} textAnchor="end" className="tc-axis-tx">
              {Math.round(g * 100)}%
            </text>
          </g>
        ))}

        {/* X labels */}
        {X_VALS.map((x) => (
          <text key={x} x={xPos(x)} y={H - PAD_B + 16} textAnchor="middle" className="tc-axis-tx">
            i={x}
          </text>
        ))}
        <text x={(PAD_L + W - PAD_R) / 2} y={H - 6} textAnchor="middle" className="tc-axis-tx">
          deepening intensity
        </text>

        {/* Guardrail at regret = 8% */}
        <line x1={PAD_L} x2={W - PAD_R} y1={yPos(GUARD)} y2={yPos(GUARD)} className="ia-guard" />
        <text x={W - PAD_R + 6} y={yPos(GUARD) + 3} className="tc-sub" style={{ fill: "var(--red)" }}>
          regret cap 8%
        </text>

        {/* Lines */}
        <path d={pathOf(attachPts)} className="ia-attach" />
        <path d={pathOf(regretPts)} className="ia-regret" />

        {/* User marker on attach */}
        <circle cx={xPos(intensity)} cy={yPos(atY)} r={5} className="ia-marker" />
        <circle cx={xPos(intensity)} cy={yPos(rgY)} r={4} className="ia-marker" />

        {/* Legend */}
        <g transform={`translate(${W - PAD_R + 6}, ${PAD_T + 6})`}>
          <line x1={0} x2={16} y1={0} y2={0} className="ia-attach" />
          <text x={20} y={3} className="ia-legend">attach</text>
          <line x1={0} x2={16} y1={14} y2={14} className="ia-regret" />
          <text x={20} y={17} className="ia-legend">regret</text>
        </g>
      </svg>
      <div className={`tc-commentary${breach ? " bad" : ""}`}>
        <b>▶</b> At intensity <b>{intensity}</b>, attach is <b>{(atY * 100).toFixed(1)}%</b> and regret <b>{(rgY * 100).toFixed(1)}%</b>{breach ? " — above the 8% guardrail." : "."}
      </div>
    </div>
  );
}
