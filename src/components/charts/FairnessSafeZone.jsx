import React, { useMemo, useState } from "react";
import "@/styles/test-charts.css";

/**
 * Fairness safe-zone heatmap.
 */
export default function FairnessSafeZone({ liftPct = 20, trustGateMonths = 18 }) {
  const liftDomain = [10, 15, 20, 25, 30, 33, 36, 40];
  const trustDomain = [6, 12, 18, 24, 30];
  const rowDomain = [...trustDomain].reverse();

  const VB_W = 540;
  const VB_H = 280;
  const PAD = { l: 56, r: 18, t: 16, b: 46 };
  const plotW = VB_W - PAD.l - PAD.r;
  const plotH = VB_H - PAD.t - PAD.b;
  const cellW = plotW / liftDomain.length;
  const cellH = plotH / trustDomain.length;

  const di = (lift, trust) => {
    const raw = 1 - 0.55 * (1 / (trust / 6)) * Math.pow(lift / 30, 2);
    return Math.max(0, Math.min(1, raw));
  };

  const cellColor = (v) => {
    if (v >= 0.9) return "var(--chart-green)";
    if (v >= 0.8) return "var(--chart-amber)";
    if (v >= 0.7) return "var(--chart-orange)";
    return "var(--chart-red)";
  };

  const cells = useMemo(() => {
    const out = [];
    rowDomain.forEach((trust, ry) => {
      liftDomain.forEach((lift, cx) => {
        const v = di(lift, trust);
        out.push({
          x: PAD.l + cx * cellW,
          y: PAD.t + ry * cellH,
          w: cellW,
          h: cellH,
          v,
          lift,
          trust,
          fill: cellColor(v),
          key: `${lift}-${trust}`,
        });
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contourPts = useMemo(() => {
    const samples = 60;
    const [minL, maxL] = [liftDomain[0], liftDomain[liftDomain.length - 1]];
    const [minT, maxT] = [trustDomain[0], trustDomain[trustDomain.length - 1]];
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const lift = minL + ((maxL - minL) * i) / samples;
      const trust = (0.55 * 6 * Math.pow(lift / 30, 2)) / 0.2;
      if (trust < minT || trust > maxT) continue;
      const x = PAD.l + ((lift - minL) / (maxL - minL)) * plotW;
      const y = PAD.t + ((maxT - trust) / (maxT - minT)) * plotH;
      pts.push([x, y]);
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const contourD = contourPts.length
    ? contourPts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
    : "";

  const [minL, maxL] = [liftDomain[0], liftDomain[liftDomain.length - 1]];
  const [minT, maxT] = [trustDomain[0], trustDomain[trustDomain.length - 1]];
  const userClampedL = Math.max(minL, Math.min(maxL, liftPct));
  const userClampedT = Math.max(minT, Math.min(maxT, trustGateMonths));
  const ux = PAD.l + ((userClampedL - minL) / (maxL - minL)) * plotW;
  const uy = PAD.t + ((maxT - userClampedT) / (maxT - minT)) * plotH;
  const userDI = di(userClampedL, userClampedT);
  const inGreen = userDI >= 0.9;
  const inAmber = userDI >= 0.8 && userDI < 0.9;

  const commentary = inGreen
    ? `Your current settings sit safely in the green zone. Dropping the trust gate below 12mo would push you below the 4/5 rule regardless of lift size.`
    : inAmber
    ? `You're in the amber band — above the 4/5 rule but close to the line. A larger lift or shorter trust gate will push DI below 0.80.`
    : `You're below the 4/5 rule. Either trim the lift to ~+${Math.max(10, Math.round(liftPct - 10))}% or extend the trust gate to clear the green zone.`;

  const [hover, setHover] = useState(null);

  return (
    <div className="chart-fairness-safezone">
      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Fairness safe-zone heatmap">
          {cells.map((c) => {
            const band = c.v >= 0.9 ? "safe (≥0.90)" : c.v >= 0.8 ? "borderline (0.80-0.90)" : c.v >= 0.7 ? "at risk (0.70-0.80)" : "fails 4/5 rule";
            return (
              <rect
                key={c.key}
                className="heatmap-cell"
                x={c.x}
                y={c.y}
                width={c.w}
                height={c.h}
                fill={c.fill}
                fillOpacity={0.72}
                onMouseEnter={() => setHover({
                  label: `Lift +${c.lift}% · trust ${c.trust}mo`,
                  value: `DI ${c.v.toFixed(2)} — ${band}`,
                  cx: ((c.x + c.w / 2) / VB_W) * 100,
                  top: ((c.y - 4) / VB_H) * 100,
                })}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}

          {contourD && <path className="contour" d={contourD} />}

          <circle className="user-marker" cx={ux} cy={uy} r={6} />
          <text className="chart-marker-label" x={ux + 9} y={uy + 3} textAnchor="start">
            you · DI {userDI.toFixed(2)}
          </text>

          {liftDomain.map((lift, i) => (
            <text key={`x-${lift}`} className="chart-tick" x={PAD.l + i * cellW + cellW / 2} y={VB_H - PAD.b + 14} textAnchor="middle">
              {lift}
            </text>
          ))}
          {rowDomain.map((trust, ry) => (
            <text key={`y-${trust}`} className="chart-tick" x={PAD.l - 8} y={PAD.t + ry * cellH + cellH / 2 + 3} textAnchor="end">
              {trust}mo
            </text>
          ))}

          <text className="chart-axis-label" x={PAD.l + plotW / 2} y={VB_H - 8} textAnchor="middle">ceiling lift %</text>
          <text className="chart-axis-label" transform={`rotate(-90 14 ${PAD.t + plotH / 2})`} x={14} y={PAD.t + plotH / 2} textAnchor="middle">trust gate (months)</text>

          <text className="chart-tick" x={VB_W - PAD.r - 4} y={PAD.t + 12} textAnchor="end" style={{ fontStyle: "italic" }}>
            4/5 rule (DI = 0.80)
          </text>
        </svg>

        {hover && (
          <div className="chart-tooltip" style={{ left: `${hover.cx}%`, top: `${hover.top}%` }}>
            <div className="chart-tooltip-l">{hover.label}</div>
            <div className="chart-tooltip-v">{hover.value}</div>
          </div>
        )}
      </div>

      <div className="chart-legend">
        <span className="lg-item"><span className="lg-swatch g" /> DI ≥ 0.90</span>
        <span className="lg-item"><span className="lg-swatch y" /> 0.80 – 0.90</span>
        <span className="lg-item"><span className="lg-swatch o" /> 0.70 – 0.80</span>
        <span className="lg-item"><span className="lg-swatch r" /> &lt; 0.70</span>
        <span className="lg-item">● your settings</span>
      </div>

      <div className="chart-commentary">▶ {commentary}</div>
    </div>
  );
}
