import React, { useMemo } from "react";
import "@/styles/test-charts.css";

/**
 * ParetoFrontier — bubble chart of optimizer results.
 *
 *   X     : friction%  (range 8–22, less → more)
 *   Y     : NII        ($0.5M–$1.4M)
 *   color : DI         (red 0.80 → green 1.00 gradient)
 *   size  : deepening  (scaled to bubble radius 4–12)
 *
 * Pareto-frontier configs are saturated; dominated configs are dim.
 * topThree (indices into `configs`) are labelled A / B / C with chips.
 *
 * Props
 *   configs  : Array<{friction, nii, di, deepening}>  — optional; auto-generated if undefined
 *   topThree : Array<number>  — 3 indices into configs (defaults: best NII, best DI, balanced)
 */

const X_MIN = 8;
const X_MAX = 22;
const Y_MIN = 0.5;
const Y_MAX = 1.4;
const DI_MIN = 0.80;
const DI_MAX = 1.00;

// Generate ~100 synthetic configs spread across the design space.
const seedConfigs = () => {
  const out = [];
  // simple deterministic PRNG so the render is stable across mounts
  let s = 1337;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < 100; i++) {
    const friction = X_MIN + rand() * (X_MAX - X_MIN);
    // NII tends to grow with friction up to a point, then flatten with noise
    const niiBase = 0.55 + 0.045 * (friction - X_MIN) - 0.0018 * Math.pow(friction - 14, 2);
    const nii = Math.max(Y_MIN, Math.min(Y_MAX, niiBase + (rand() - 0.5) * 0.18));
    // DI: better when friction is moderate and NII is high
    const di = Math.max(DI_MIN, Math.min(DI_MAX,
      0.86 + 0.04 * (1 - Math.abs(friction - 13) / 10) + (rand() - 0.4) * 0.04
    ));
    const deepening = 0.10 + rand() * 0.20;
    out.push({ friction, nii, di, deepening });
  }
  return out;
};

// Compute Pareto frontier: max NII for each friction bucket (less friction
// also better => use 2D dominance: lower friction AND higher NII dominates).
const computeFrontier = (configs) => {
  const sorted = configs.map((c, i) => ({ ...c, _i: i })).sort((a, b) => a.friction - b.friction);
  const frontier = new Set();
  let maxNii = -Infinity;
  for (const c of sorted) {
    if (c.nii > maxNii) {
      frontier.add(c._i);
      maxNii = c.nii;
    }
  }
  return frontier;
};

// Color from DI: red at 0.80 → amber at 0.90 → green at 1.00.
const diColor = (di) => {
  const t = Math.max(0, Math.min(1, (di - DI_MIN) / (DI_MAX - DI_MIN)));
  // Two-stop gradient: red(255,122,122) → green(66,224,139) via amber
  if (t < 0.5) {
    const k = t / 0.5;
    const r = Math.round(255 + (255 - 255) * k);
    const g = Math.round(122 + (177 - 122) * k);
    const b = Math.round(122 + (90 - 122) * k);
    return `rgb(${r},${g},${b})`;
  }
  const k = (t - 0.5) / 0.5;
  const r = Math.round(255 + (66 - 255) * k);
  const g = Math.round(177 + (224 - 177) * k);
  const b = Math.round(90 + (139 - 90) * k);
  return `rgb(${r},${g},${b})`;
};

const sizeOf = (deep) => {
  // deepening ~ 0.10..0.30  →  radius 4..12
  const t = Math.max(0, Math.min(1, (deep - 0.10) / 0.20));
  return 4 + t * 8;
};

const pickTopThree = (configs, frontier) => {
  // Default: best NII, best DI (within frontier), and best deepening (within frontier)
  const fIdx = [...frontier];
  if (fIdx.length === 0) return [0, 1, 2].filter((i) => i < configs.length);
  const byNii = [...fIdx].sort((a, b) => configs[b].nii - configs[a].nii)[0];
  const byDi = [...fIdx].sort((a, b) => configs[b].di - configs[a].di)[0];
  const byDp = [...fIdx].sort((a, b) => configs[b].deepening - configs[a].deepening)[0];
  const out = [byNii];
  if (byDi !== byNii) out.push(byDi);
  if (byDp !== byNii && byDp !== byDi) out.push(byDp);
  while (out.length < 3 && fIdx.length > out.length) {
    const next = fIdx.find((i) => !out.includes(i));
    if (next === undefined) break;
    out.push(next);
  }
  return out.slice(0, 3);
};

export default function ParetoFrontier({ configs, topThree }) {
  const data = useMemo(() => configs ?? seedConfigs(), [configs]);
  const frontier = useMemo(() => computeFrontier(data), [data]);
  const top3 = useMemo(() => topThree ?? pickTopThree(data, frontier), [topThree, data, frontier]);

  const W = 660;
  const H = 340;
  const PAD_L = 56;
  const PAD_R = 24;
  const PAD_T = 22;
  const PAD_B = 40;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const xPos = (f) => PAD_L + ((f - X_MIN) / (X_MAX - X_MIN)) * plotW;
  const yPos = (n) => PAD_T + plotH - ((n - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

  const labels = ["A", "B", "C"];

  return (
    <div className="test-chart chart-pareto">
      <div className="tc-title">Pareto frontier — friction × NII × DI</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pareto frontier bubble chart">
        {/* Y grid (NII in $M) */}
        {[0.5, 0.75, 1.0, 1.25].map((g) => (
          <g key={g}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yPos(g)} y2={yPos(g)} className="pf-grid" />
            <text x={PAD_L - 8} y={yPos(g) + 3} textAnchor="end" className="tc-axis-tx">
              ${g.toFixed(2)}M
            </text>
          </g>
        ))}
        {/* X grid */}
        {[8, 12, 16, 20].map((g) => (
          <g key={g}>
            <line x1={xPos(g)} x2={xPos(g)} y1={PAD_T} y2={PAD_T + plotH} className="pf-grid" />
            <text x={xPos(g)} y={H - PAD_B + 16} textAnchor="middle" className="tc-axis-tx">
              {g}%
            </text>
          </g>
        ))}
        <text x={(PAD_L + W - PAD_R) / 2} y={H - 6} textAnchor="middle" className="tc-axis-tx">
          friction (less → more)
        </text>
        <text
          x={14}
          y={(PAD_T + H - PAD_B) / 2}
          textAnchor="middle"
          className="tc-axis-tx"
          transform={`rotate(-90 14 ${(PAD_T + H - PAD_B) / 2})`}
        >
          NII ($M)
        </text>

        {/* Bubbles — dominated first (dim), frontier on top (saturated) */}
        {data.map((c, i) => {
          if (frontier.has(i)) return null;
          return (
            <circle
              key={`d-${i}`}
              cx={xPos(c.friction)}
              cy={yPos(c.nii)}
              r={sizeOf(c.deepening)}
              fill={diColor(c.di)}
              className="pf-bubble dim"
            />
          );
        })}
        {data.map((c, i) => {
          if (!frontier.has(i)) return null;
          return (
            <circle
              key={`f-${i}`}
              cx={xPos(c.friction)}
              cy={yPos(c.nii)}
              r={sizeOf(c.deepening)}
              fill={diColor(c.di)}
              stroke="var(--ink)"
              strokeWidth="0.8"
              className="pf-bubble front"
            />
          );
        })}

        {/* Top three chips */}
        {top3.map((idx, j) => {
          const c = data[idx];
          if (!c) return null;
          const cx = xPos(c.friction);
          const cy = yPos(c.nii);
          return (
            <g key={`t-${idx}`}>
              <circle cx={cx} cy={cy} r={sizeOf(c.deepening) + 3} fill="none" stroke="var(--acc)" strokeWidth="1.5" />
              <rect x={cx + 9} y={cy - 17} width={22} height={16} rx={4} className="pf-chip" />
              <text x={cx + 20} y={cy - 5} textAnchor="middle" className="pf-label">{labels[j]}</text>
            </g>
          );
        })}

        {/* Legend — DI gradient */}
        <g transform={`translate(${W - PAD_R - 130}, ${PAD_T - 6})`}>
          <text x={0} y={0} className="pf-legend">DI 0.80</text>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={48 + i * 8}
              y={-9}
              width={8}
              height={9}
              fill={diColor(DI_MIN + (i / 5) * (DI_MAX - DI_MIN))}
            />
          ))}
          <text x={102} y={0} className="pf-legend">1.00</text>
        </g>
      </svg>
      <div className="tc-commentary">
        <b>▶</b> {top3.length} top configs on the Pareto frontier — <b>A</b>: friction {data[top3[0]]?.friction.toFixed(1)}% / NII ${data[top3[0]]?.nii.toFixed(2)}M. Dim bubbles are dominated.
      </div>
    </div>
  );
}
