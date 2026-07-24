/* ============================================================================
   ParetoFrontier — interactive 2D scatter that visualises the trade-off
   between two competing policy objectives. Used inside the If-What flow
   on TestModeChooser.

   Why a Pareto frontier (vs a single recommended policy)?
     A goal like "lift NII without breaching fair-lending" has no single
     answer — it's a *region* in (NII, fair-lending margin) space. Different
     policies dominate on different axes. The frontier is the line of
     non-dominated policies: pick any point, and no other policy is strictly
     better on both axes. The user chooses their preferred trade-off; the
     system doesn't.

   What you see:
     - Each candidate policy is a point in 2D space.
     - The non-dominated set (the "frontier") is connected by a line.
     - Hover a point: see the policy name + numerics.
     - Click a point: it becomes selected; "Adopt" opens it in the
       What-If workbench.

   Axes (configurable later — these are the demo defaults):
     - X: Net Interest Income (gain, $M/yr)
     - Y: Fair-lending margin (higher = safer)

   The Trust-Aware Ceiling Lift is one of these points. In a real product
   the list would come from the model; for the demo it's hardcoded with
   realistic values that produce a believable frontier shape.
   ========================================================================= */
import { useMemo, useState } from "react";

/* Named anchor candidates — these are the policies surfaced as the Top 3
   recommendations in IfWhatResults. IDs MUST match the TOP_3 ids in
   IfWhatResults.jsx so clicking a labeled dot selects the right rec. */
const ANCHORS = [
  {
    id: "balanced",
    name: "Verified-Pattern · Balanced",
    sub: "18-mo verified · +20% lift · proactive comms",
    nii: 5.6,
    fair: 0.94,
    isRecommended: true,
  },
  {
    id: "tight-gate",
    name: "Tight-Gate · Conservative",
    sub: "24-mo verified · +15% lift · educational comms",
    nii: 3.0,
    fair: 0.965,
  },
  {
    id: "cross-cohort",
    name: "Cross-Cohort · Expansion",
    sub: "Gig + SMB · +18% lift · 3-rail",
    nii: 8.2,
    fair: 0.885,
  },
];

/* Generate a synthetic cloud of candidate policies. The optimizer in this
   demo claims to have sampled ~3K scenarios — showing 6 dots would lie
   about that. We procedurally generate ~240 candidates clustered along a
   realistic NII × fair-lending trade-off curve, with deterministic noise
   so the cloud looks the same every render.

   The shape: most policies sit *below* the frontier (dominated), since
   the optimizer's job is to *find* the non-dominated set within a much
   larger sampled population. Higher NII generally costs fair-lending
   margin, so the cloud has a convex upper boundary that the frontier
   line traces. A long tail of infeasible policies sits below the 0.85
   floor (rendered greyed-out). */
function generateSyntheticCandidates(count = 240) {
  const points = [];
  for (let i = 0; i < count; i++) {
    /* Deterministic pseudo-random — same seed → same cloud across renders. */
    const r1 = Math.abs(Math.sin(i * 137.3 + 11.7)) % 1;
    const r2 = Math.abs(Math.sin(i * 91.1 + 23.9)) % 1;
    const r3 = Math.abs(Math.sin(i * 47.5 + 7.3)) % 1;

    /* NII spread across the sampled range. Slight bias toward the middle
       (most sampled policies cluster around moderate lifts), thin tails
       toward extremes. */
    const niiRaw = Math.pow(r1, 0.85);            // [0, 1) with slight middle bias
    const nii = 0.5 + niiRaw * 9.5;               // $0.5M–$10M

    /* Fair-lending margin: convex trade-off curve + scatter. Higher NII
       generally costs margin, so the upper boundary slopes down. */
    /* Coefficients scaled 10× and 100× respectively so the (nii, fair)
       curve shape is preserved after the 1/10 scale of nii. */
    const frontierFair = 1.005 - 0.021 * nii - 0.0005 * nii * nii;
    /* Scatter below the frontier. Use a beta-ish distribution so most
       points sit a moderate distance below; few are pathologically far. */
    const distBelow = Math.pow(r2, 1.4) * 0.18;   // [0, 0.18) — most small
    /* A small fraction (~12%) end up below the 0.85 floor — infeasible. */
    const isInfeasible = r3 < 0.12;
    const extraPenalty = isInfeasible ? 0.08 + r2 * 0.06 : 0;
    const fair = Math.max(0.74, Math.min(0.99, frontierFair - distBelow - extraPenalty));

    points.push({
      id: `syn-${i}`,
      synthetic: true,
      nii,
      fair,
    });
  }
  return points;
}

/* The frontier is the set of points where no other point strictly dominates
   on both x (NII, higher better) and y (fair-lending margin, higher better).
   Returns the frontier sorted by x ascending so the connecting line draws
   cleanly. */
function computeFrontier(points) {
  // Filter out points that fall below the 0.85 fair-lending floor — those
  // are infeasible policies, not part of the choosable frontier.
  const feasible = points.filter((p) => p.fair >= 0.85);
  return feasible.filter((p) => {
    return !feasible.some((q) => {
      if (q.id === p.id) return false;
      // q dominates p if it's >= on both AND strictly > on at least one.
      const geq = q.nii >= p.nii && q.fair >= p.fair;
      const strict = q.nii > p.nii || q.fair > p.fair;
      return geq && strict;
    });
  }).sort((a, b) => a.nii - b.nii);
}

/* The Pareto chart is pure visualization. Selection comes from the parent
   (recommendation cards are the source of truth); hover stays local. */
export default function ParetoFrontier({ selectedId: selectedIdProp, onSelect }) {
  const [hoverId, setHoverId] = useState(null);
  const selectedId = selectedIdProp || "balanced";
  const setSelectedId = onSelect || (() => {});

  const W = 540, H = 320, PL = 56, PR = 22, PT = 24, PB = 46;

  // Floor of fair-lending margin fixed at 0.74 so the infeasible cloud
  // below 0.85 has room to render visibly.
  const xMin = 0, xMax = 10;
  const yMin = 0.74, yMax = 1.00;

  const X = (v) => PL + ((v - xMin) / (xMax - xMin)) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - yMin) / (yMax - yMin)) * (H - PT - PB);

  /* Build the full candidate cloud: synthetic samples + named anchors.
     Memoize so the random scatter is stable across renders. The anchors
     sit on the frontier (they're our hand-picked recs); the synthetics
     populate the rest of the space so the chart visually reflects the
     scale of the optimizer's sweep. */
  const allCandidates = useMemo(() => {
    return [...generateSyntheticCandidates(240), ...ANCHORS];
  }, []);
  const frontier = computeFrontier(allCandidates);
  const frontierIds = new Set(frontier.map((f) => f.id));
  const anchorIds = new Set(ANCHORS.map((a) => a.id));
  const frontierPath = frontier.map((p) => `${X(p.nii)},${Y(p.fair)}`).join(" ");

  // selected/hovered are now only used for in-chart highlighting; the
  // detail panel that used to render on the right is gone (deep-dive
  // happens via the recommendation cards below the chart in the parent).

  return (
    <div className="pareto">
      <div className="pareto-h">
        <div>
          <div className="pareto-eyebrow">IF-WHAT · PARETO FRONTIER</div>
          <div className="pareto-title">{allCandidates.length} sampled policies · trade-off between NII gain and fair-lending margin</div>
        </div>
        <div className="pareto-legend">
          <span className="pareto-legend-item"><span className="pareto-dot pareto-dot-front" /> On frontier</span>
          <span className="pareto-legend-item"><span className="pareto-dot pareto-dot-dom" /> Dominated</span>
          <span className="pareto-legend-item"><span className="pareto-dot pareto-dot-infeasible" /> Below floor</span>
        </div>
      </div>

      <div className="pareto-body pareto-body-chart-only">
        {/* Chart */}
        <div className="pareto-chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="pareto-svg" preserveAspectRatio="xMidYMid meet">
            {/* Plot frame */}
            <rect
              x={PL} y={PT}
              width={W - PL - PR} height={H - PT - PB}
              fill="none" stroke="var(--hair)" strokeWidth="0.5"
            />

            {/* Y-axis ticks (fair-lending margin) */}
            {[0.85, 0.90, 0.95, 1.00].map((v) => (
              <g key={`y-${v}`}>
                <line
                  x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)}
                  stroke="var(--hair)" strokeWidth="0.5"
                  strokeDasharray={v === 0.85 ? "0" : "2 3"}
                  opacity={v === 0.85 ? "0.9" : "0.5"}
                />
                <text
                  x={PL - 8} y={Y(v) + 3}
                  textAnchor="end" fontSize="9"
                  fontFamily="var(--mono)"
                  fill={v === 0.85 ? "var(--red, #ef4444)" : "var(--ink-4)"}
                >
                  {v.toFixed(2)}
                </text>
              </g>
            ))}
            <text
              x={PL - 8} y={Y(0.85) - 6}
              textAnchor="end" fontSize="8.5"
              fontFamily="var(--mono)"
              fill="var(--red, #ef4444)"
            >0.85 floor</text>

            {/* X-axis ticks (NII gain) */}
            {[0, 2, 4, 6, 8, 10].map((v) => (
              <g key={`x-${v}`}>
                <line
                  x1={X(v)} y1={H - PB} x2={X(v)} y2={H - PB + 4}
                  stroke="var(--ink-4)" strokeWidth="0.5"
                />
                <text
                  x={X(v)} y={H - PB + 14}
                  textAnchor="middle" fontSize="9"
                  fontFamily="var(--mono)"
                  fill="var(--ink-4)"
                >
                  ${v}M
                </text>
              </g>
            ))}

            {/* Axis labels */}
            <text
              x={(PL + W - PR) / 2} y={H - 10}
              textAnchor="middle" fontSize="9.5"
              fontFamily="var(--mono)"
              fill="var(--ink-3)"
            >
              NII gain · $M / yr →
            </text>
            <text
              x={-((PT + H - PB) / 2)} y={14}
              textAnchor="middle" fontSize="9.5"
              fontFamily="var(--mono)"
              fill="var(--ink-3)"
              transform={`rotate(-90, ${-((PT + H - PB) / 2)}, 14)`}
              style={{ transformOrigin: "0 0" }}
            >
              ← Fair-lending margin
            </text>

            {/* Frontier shaded region — everything south of the frontier */}
            {frontier.length >= 2 && (
              <polygon
                points={`${X(xMin)},${Y(yMin)} ${frontier.map((p) => `${X(p.nii)},${Y(p.fair)}`).join(" ")} ${X(frontier[frontier.length - 1].nii)},${Y(yMin)}`}
                fill="var(--violet, #b794f6)"
                opacity="0.05"
              />
            )}

            {/* Synthetic candidate cloud — small low-opacity dots for the
                hundreds of policies the optimizer sampled but rejected.
                Dominated (above 0.85) in grey; infeasible (below 0.85)
                in red. Rendered first so anchors paint on top. No
                interactivity — these are just visual context. */}
            {allCandidates.map((c) => {
              if (anchorIds.has(c.id)) return null; // anchors render later, on top
              const isInfeasible = c.fair < 0.85;
              const onFrontier = frontierIds.has(c.id);
              return (
                <circle
                  key={c.id}
                  cx={X(c.nii)} cy={Y(c.fair)}
                  r={onFrontier ? 2.6 : 2}
                  fill={isInfeasible ? "var(--red, #ef4444)" : (onFrontier ? "var(--violet, #b794f6)" : "var(--ink-3)")}
                  opacity={isInfeasible ? 0.45 : (onFrontier ? 0.75 : 0.35)}
                />
              );
            })}

            {/* Frontier line — connects non-dominated points. Drawn AFTER
                the cloud so it's visible on top of the dot scatter. */}
            {frontier.length >= 2 && (
              <polyline
                points={frontierPath}
                fill="none"
                stroke="var(--violet, #b794f6)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity="0.75"
              />
            )}

            {/* Named anchors — the Top-3 recommendations. Larger dots with
                always-on labels so the user can map "Balanced / Tight-Gate
                / Cross-Cohort" onto positions in the chart. These are the
                clickable points. */}
            {ANCHORS.map((c) => {
              const isSelected = c.id === selectedId;
              const isHovered = c.id === hoverId;
              const r = isSelected ? 9 : isHovered ? 8 : 7;
              return (
                <g key={c.id} style={{ cursor: "pointer" }}
                   onMouseEnter={() => setHoverId(c.id)}
                   onMouseLeave={() => setHoverId(null)}
                   onClick={() => setSelectedId(c.id)}>
                  {/* Generous hit area */}
                  <circle cx={X(c.nii)} cy={Y(c.fair)} r="14" fill="transparent" />
                  {/* Halo when selected/hovered for stronger visual lock */}
                  {(isSelected || isHovered) && (
                    <circle cx={X(c.nii)} cy={Y(c.fair)} r={r + 5}
                            fill="var(--violet, #b794f6)" opacity={isSelected ? 0.22 : 0.12} />
                  )}
                  <circle
                    cx={X(c.nii)} cy={Y(c.fair)} r={r}
                    fill={c.isRecommended ? "var(--acc, #ffb15a)" : "var(--violet, #b794f6)"}
                    stroke="var(--panel)"
                    strokeWidth={isSelected ? 2.4 : 1.6}
                  />
                  {/* Always-visible label so anchors are identifiable */}
                  <text
                    x={X(c.nii) + 12} y={Y(c.fair) - 6}
                    fontSize="10.5"
                    fontFamily="var(--ui)"
                    fontWeight={isSelected ? "800" : "700"}
                    fill={isSelected ? "var(--ink)" : "var(--ink-2)"}
                  >
                    {c.name}
                  </text>
                  <text
                    x={X(c.nii) + 12} y={Y(c.fair) + 6}
                    fontSize="9"
                    fontFamily="var(--mono)"
                    fill="var(--ink-3)"
                  >
                    ${c.nii.toFixed(1)}M · margin {c.fair.toFixed(2)}
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
