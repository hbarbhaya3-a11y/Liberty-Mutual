import React, { useMemo } from "react";
import "@/styles/test-charts.css";

/**
 * Elasticity reference (shape only).
 *
 * Smooth descending curve y = 20 * exp(-x / 15) over x ∈ [10, 40].
 * Y axis intentionally unitless ("friction reduction (shape only)") — no numbers.
 * A pin marks the user's current liftPct.
 *
 * Props:
 *   - liftPct: number (10..40)
 */
export default function ElasticityReference({ liftPct = 20 }) {
  // Domain
  const X_MIN = 10;
  const X_MAX = 40;
  const f = (x) => 20 * Math.exp(-x / 15); // shape: ~10.27 at x=10, ~1.36 at x=40
  const yMax = f(X_MIN);
  const yMin = f(X_MAX);

  // Layout
  const VB_W = 540;
  const VB_H = 240;
  const PAD = { l: 56, r: 24, t: 18, b: 46 };
  const plotW = VB_W - PAD.l - PAD.r;
  const plotH = VB_H - PAD.t - PAD.b;

  const xToPx = (x) => PAD.l + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  const yToPx = (y) => PAD.t + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  // Curve path samples.
  const { curveD, fillD } = useMemo(() => {
    const samples = 80;
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / samples;
      pts.push([xToPx(x), yToPx(f(x))]);
    }
    const curve = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const fill =
      curve +
      ` L${pts[pts.length - 1][0].toFixed(1)},${(PAD.t + plotH).toFixed(1)}` +
      ` L${pts[0][0].toFixed(1)},${(PAD.t + plotH).toFixed(1)} Z`;
    return { curveD: curve, fillD: fill };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // User pin
  const clampedLift = Math.max(X_MIN, Math.min(X_MAX, liftPct));
  const px = xToPx(clampedLift);
  const py = yToPx(f(clampedLift));

  // Knee marker — first derivative dy/dx = -20/15 * exp(-x/15). Knee where slope's magnitude
  // crosses ≈ 0.4 (visually the elbow). Solve: 20/15 * exp(-x/15) = 0.4 → exp(-x/15) = 0.3
  // → x = -15 * ln(0.3) ≈ 18.06. Show a faint vertical line at the knee for orientation.
  const kneeX = -15 * Math.log(0.3);
  const kneePx = xToPx(kneeX);

  const pastKnee = clampedLift >= kneeX;
  const wayPast = clampedLift >= 30;
  const commentary = wayPast
    ? `You're well past the knee — most of the elasticity gain has been captured. Pushing past +30% adds little but increases fairness pressure (see safe zone above).`
    : pastKnee
    ? `You're past the knee — most of the elasticity gain has been captured. Pushing past +30% adds little but increases fairness pressure (see safe zone above).`
    : `You're below the knee — there's still meaningful friction-reduction headroom. Moving from +${clampedLift}% to ~+${Math.round(kneeX)}% captures most remaining gain.`;

  // X tick positions
  const xTicks = [10, 15, 20, 25, 30, 35, 40];

  return (
    <div className="chart-elasticity-reference">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Elasticity reference curve (shape only)">
        <defs>
          <linearGradient id="elasticity-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-acc)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--chart-acc)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Plot frame baseline */}
        <line
          x1={PAD.l}
          x2={VB_W - PAD.r}
          y1={PAD.t + plotH}
          y2={PAD.t + plotH}
          stroke="var(--chart-grid)"
          strokeWidth={1}
        />
        <line
          x1={PAD.l}
          x2={PAD.l}
          y1={PAD.t}
          y2={PAD.t + plotH}
          stroke="var(--chart-grid)"
          strokeWidth={1}
        />

        {/* Curve fill + line */}
        <path className="curve-shadow" d={fillD} />
        <path className="curve" d={curveD} />

        {/* Knee orientation marker */}
        <line className="knee-marker" x1={kneePx} x2={kneePx} y1={PAD.t} y2={PAD.t + plotH} />
        <text
          className="chart-tick"
          x={kneePx}
          y={PAD.t + 11}
          textAnchor="middle"
          style={{ fontStyle: "italic" }}
        >
          knee
        </text>

        {/* User pin */}
        <line className="pin-line" x1={px} x2={px} y1={py} y2={PAD.t + plotH} />
        <circle className="pin-dot" cx={px} cy={py} r={5} />
        <text
          className="chart-marker-label"
          x={px + 9}
          y={py - 4}
          textAnchor="start"
        >
          you · +{liftPct}%
        </text>

        {/* X ticks */}
        {xTicks.map((t) => (
          <text
            key={t}
            className="chart-tick"
            x={xToPx(t)}
            y={PAD.t + plotH + 14}
            textAnchor="middle"
          >
            {t}
          </text>
        ))}

        {/* Axis labels */}
        <text
          className="chart-axis-label"
          x={PAD.l + plotW / 2}
          y={VB_H - 10}
          textAnchor="middle"
        >
          ceiling lift %
        </text>
        <text
          className="chart-axis-label"
          transform={`rotate(-90 14 ${PAD.t + plotH / 2})`}
          x={14}
          y={PAD.t + plotH / 2}
          textAnchor="middle"
        >
          friction reduction (shape only)
        </text>
      </svg>

      <div className="chart-commentary">▶ {commentary}</div>
    </div>
  );
}
