import React, { useMemo } from "react";
import "@/styles/test-charts.css";

/**
 * SuitabilityMatrix — 2×2 (channel × readiness) safety grid.
 *
 *   Y axis: 3 channels (inapp, rm, lifecycle)
 *   X axis: readiness — low (waitUntilWarm < 50) | high (waitUntilWarm >= 50)
 *
 * Blocked cell: (rm, low). All others are safe.
 *
 * Props
 *   offerChannel   : 'inapp' | 'rm' | 'lifecycle'
 *   waitUntilWarm  : 30 | 50 | 70  (any number — bucketed as low/high at 50)
 */

const CHANNELS = ["inapp", "rm", "lifecycle"];
const CHANNEL_LABEL = { inapp: "In-app", rm: "RM", lifecycle: "Lifecycle" };
const READINESS = ["low", "high"];
const READINESS_LABEL = { low: "Low readiness", high: "High readiness" };

const isBlocked = (ch, rd) => ch === "rm" && rd === "low";

export default function SuitabilityMatrix({
  offerChannel = "inapp",
  waitUntilWarm = 50,
}) {
  const { userRd, blocked } = useMemo(() => {
    const r = waitUntilWarm >= 50 ? "high" : "low";
    return { userRd: r, blocked: isBlocked(offerChannel, r) };
  }, [offerChannel, waitUntilWarm]);

  const W = 520;
  const H = 260;
  const PAD_L = 110;
  const PAD_R = 20;
  const PAD_T = 38;
  const PAD_B = 28;
  const cellW = (W - PAD_L - PAD_R) / READINESS.length;
  const cellH = (H - PAD_T - PAD_B) / CHANNELS.length;

  const cellX = (r) => PAD_L + READINESS.indexOf(r) * cellW;
  const cellY = (c) => PAD_T + CHANNELS.indexOf(c) * cellH;

  return (
    <div className="test-chart chart-suitability-matrix">
      <div className="tc-title">Channel × readiness — suitability matrix</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Suitability matrix">
        {/* Column headers */}
        {READINESS.map((r) => (
          <text
            key={r}
            x={cellX(r) + cellW / 2}
            y={PAD_T - 12}
            textAnchor="middle"
            className="tc-label"
          >
            {READINESS_LABEL[r]}
          </text>
        ))}
        {/* Row labels */}
        {CHANNELS.map((c) => (
          <text
            key={c}
            x={PAD_L - 12}
            y={cellY(c) + cellH / 2 + 4}
            textAnchor="end"
            className="tc-label"
          >
            {CHANNEL_LABEL[c]}
          </text>
        ))}

        {/* Cells */}
        {CHANNELS.flatMap((c) =>
          READINESS.map((r) => {
            const bad = isBlocked(c, r);
            const cls = bad ? "bad" : "ok";
            return (
              <g key={`${c}-${r}`}>
                <rect
                  x={cellX(r) + 4}
                  y={cellY(c) + 4}
                  width={cellW - 8}
                  height={cellH - 8}
                  rx={8}
                  className={`sm-cell ${cls}`}
                />
                <text
                  x={cellX(r) + cellW / 2}
                  y={cellY(c) + cellH / 2 + 4}
                  textAnchor="middle"
                  className={`sm-celltx ${cls}`}
                >
                  {bad ? "BLOCKED" : "SAFE"}
                </text>
              </g>
            );
          })
        )}

        {/* User marker */}
        <circle
          cx={cellX(userRd) + cellW / 2}
          cy={cellY(offerChannel) + cellH / 2 - 12}
          r={6}
          className="sm-user"
        />
        <text
          x={cellX(userRd) + cellW / 2}
          y={cellY(offerChannel) + cellH / 2 - 22}
          textAnchor="middle"
          className="tc-sub"
        >
          you
        </text>

        {/* Axis labels */}
        <text x={W / 2} y={H - 6} textAnchor="middle" className="tc-axis-tx">
          waitUntilWarm threshold ({waitUntilWarm}%) → readiness bucket
        </text>
      </svg>
      <div className={`tc-commentary${blocked ? " bad" : ""}`}>
        {blocked ? (
          <><b>⚠</b> RM + low readiness is blocked — RM needs evidence of warm-up.</>
        ) : (
          <><b>▶</b> Your combo (<b>{CHANNEL_LABEL[offerChannel]}</b>, waitUntilWarm <b>{waitUntilWarm}%</b>) is safe.</>
        )}
      </div>
    </div>
  );
}
