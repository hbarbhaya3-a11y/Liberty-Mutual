import React, { useMemo, useState } from "react";
import "@/styles/test-charts.css";

/**
 * Rent histogram with current + proposed ceiling lines.
 *
 * Bars are rent-amount bands ($1.2K, $1.4K, $1.6K, $1.8K, $2.0K).
 * Bar height = % of cohort with rent in that band (synthetic but consistent).
 * Color by status relative to (current, proposed) ceilings.
 *
 * Props:
 *   - currentCeiling: number (default 1200)
 *   - liftPct: number — proposed ceiling = current × (1 + liftPct/100)
 *   - compact: boolean — renders smaller (~80px tall) for inline use
 */
export default function RentHistogram({ currentCeiling = 1200, liftPct = 20, compact = false }) {
  // Bands: midpoint $ and synthetic share % of failing-rent-day cohort.
  const bands = [
    { mid: 1200, share: 3 },
    { mid: 1400, share: 28 },
    { mid: 1600, share: 31 },
    { mid: 1800, share: 22 },
    { mid: 2000, share: 16 },
  ];
  const maxShare = Math.max(...bands.map((b) => b.share));
  const proposedCeiling = currentCeiling * (1 + liftPct / 100);

  // Geometry — compact strips axes & labels.
  const VB_W = compact ? 380 : 540;
  const VB_H = compact ? 110 : 260;
  const PAD = compact
    ? { l: 8, r: 8, t: 18, b: 18 }
    : { l: 44, r: 24, t: 22, b: 50 };
  const plotW = VB_W - PAD.l - PAD.r;
  const plotH = VB_H - PAD.t - PAD.b;

  const xMin = 1100;
  const xMax = 2100;
  const xToPx = (x) => PAD.l + ((x - xMin) / (xMax - xMin)) * plotW;
  const barWPx = plotW / bands.length - (compact ? 6 : 14);

  const statusFor = (mid) => {
    if (mid < currentCeiling) return "neutral";
    if (mid <= proposedCeiling) return "clears";
    return "over";
  };

  const totalShare = bands.reduce((s, b) => s + b.share, 0);
  const clearedShare = bands.filter((b) => statusFor(b.mid) === "clears").reduce((s, b) => s + b.share, 0);
  const clearedPct = Math.round((clearedShare / totalShare) * 100);
  const maxFailingMid = Math.max(...bands.map((b) => b.mid));
  const neededLift = Math.ceil(((maxFailingMid / currentCeiling) - 1) * 100 / 5) * 5;

  const commentary = useMemo(() => {
    if (clearedPct >= 95) {
      return `This lift clears ${clearedPct}% of failing rent-day transactions — effectively the full cohort. Going larger adds fairness pressure without clearing more.`;
    }
    if (clearedPct <= 5) {
      return `This lift clears only ${clearedPct}% of failing rent-day transactions. You'd need at least +${neededLift}% to materially reduce overdrafts.`;
    }
    return `This lift clears ${clearedPct}% of failing rent-day transactions. To clear the rest you'd need +${neededLift}% or higher.`;
  }, [clearedPct, neededLift]);

  // Tooltip state — {label, value, cx, top} | null
  const [hover, setHover] = useState(null);

  return (
    <div className={`chart-rent-histogram${compact ? " compact" : ""}`}>
      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Rent histogram with ceiling lines">
          {/* Y grid (not in compact) */}
          {!compact && [0.25, 0.5, 0.75, 1].map((f) => {
            const y = PAD.t + plotH - f * plotH;
            return (
              <line key={f} x1={PAD.l} x2={VB_W - PAD.r} y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth={1} />
            );
          })}

          {/* Bars */}
          {bands.map((b) => {
            const cx = xToPx(b.mid);
            const x = cx - barWPx / 2;
            const h = (b.share / maxShare) * plotH;
            const y = PAD.t + plotH - h;
            const status = statusFor(b.mid);
            const statusLabel = status === "clears" ? "now clears" : status === "over" ? "still over" : "already clears";
            return (
              <g key={b.mid}>
                <rect
                  className={`bar ${status}`}
                  x={x}
                  y={y}
                  width={barWPx}
                  height={h}
                  rx={2}
                  onMouseEnter={() => setHover({
                    label: `$${(b.mid / 1000).toFixed(1)}K band`,
                    value: `${b.share}% of failing cohort · ${statusLabel}`,
                    cx: (cx / VB_W) * 100,
                    top: ((y - 6) / VB_H) * 100,
                  })}
                  onMouseLeave={() => setHover(null)}
                />
                {!compact && (
                  <>
                    <text className="chart-tick" x={cx} y={y - 6} textAnchor="middle">{b.share}%</text>
                    <text className="chart-tick" x={cx} y={VB_H - PAD.b + 14} textAnchor="middle">${(b.mid / 1000).toFixed(1)}K</text>
                  </>
                )}
                {compact && (
                  <text className="chart-tick" x={cx} y={VB_H - 4} textAnchor="middle" style={{ fontSize: 8 }}>
                    ${(b.mid / 1000).toFixed(1)}K
                  </text>
                )}
              </g>
            );
          })}

          {/* Current ceiling line */}
          <line className="ceiling-line" x1={xToPx(currentCeiling)} x2={xToPx(currentCeiling)} y1={PAD.t - 6} y2={VB_H - PAD.b} />
          {!compact && (
            <text className="ceiling-label" x={xToPx(currentCeiling) - 4} y={PAD.t - 10} textAnchor="end">
              current ${currentCeiling.toLocaleString()}
            </text>
          )}

          {/* Proposed ceiling line */}
          <line className="ceiling-line proposed" x1={xToPx(proposedCeiling)} x2={xToPx(proposedCeiling)} y1={PAD.t - 6} y2={VB_H - PAD.b} />
          {!compact && (
            <text className="ceiling-label proposed" x={xToPx(proposedCeiling) + 4} y={PAD.t - 10} textAnchor="start">
              proposed ${Math.round(proposedCeiling).toLocaleString()} (+{liftPct}%)
            </text>
          )}

          {!compact && (
            <>
              <text className="chart-axis-label" x={PAD.l + plotW / 2} y={VB_H - 10} textAnchor="middle">rent amount (USD)</text>
              <text className="chart-axis-label" transform={`rotate(-90 14 ${PAD.t + plotH / 2})`} x={14} y={PAD.t + plotH / 2} textAnchor="middle">% of failing cohort</text>
            </>
          )}

          {compact && (
            <>
              <text x={xToPx(currentCeiling) - 2} y={PAD.t - 6} textAnchor="end" style={{ fontSize: 8 }} fill="var(--chart-ink-3)" fontFamily="var(--mono)">
                cap ${currentCeiling}
              </text>
              <text x={xToPx(proposedCeiling) + 2} y={PAD.t - 6} textAnchor="start" style={{ fontSize: 8 }} fill="var(--chart-acc)" fontFamily="var(--mono)" fontWeight={700}>
                +{liftPct}%
              </text>
            </>
          )}
        </svg>

        {hover && (
          <div
            className="chart-tooltip"
            style={{ left: `${hover.cx}%`, top: `${hover.top}%` }}
          >
            <div className="chart-tooltip-l">{hover.label}</div>
            <div className="chart-tooltip-v">{hover.value}</div>
          </div>
        )}
      </div>

      {!compact && (
        <>
          <div className="chart-legend">
            <span className="lg-item"><span className="lg-swatch neutral" /> already clearing</span>
            <span className="lg-item"><span className="lg-swatch g" /> now clears</span>
            <span className="lg-item"><span className="lg-swatch r" /> still over</span>
          </div>
          <div className="chart-commentary">▶ {commentary}</div>
        </>
      )}
    </div>
  );
}
