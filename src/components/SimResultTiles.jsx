/* ============================================================================
   SimResultTiles — the three chart components used in the 2×2 Simulated
   Outcomes grid on the What-If results page AND the If-What deep dive.

   Extracted into a shared module so both flows render the *same* tiles in
   the *same* layout. Visual coherence matters: if a user picks an If-What
   recommendation and then re-runs it as a What-If simulation, the result
   charts must look identical — same shape, same chart vocabulary, same
   numeric anchors.

   Each tile is self-contained:
     - Own header (title + subhead)
     - Own SVG (area / bars / stacked-bar — visually distinct shapes)
     - Own numeric caption row (k/v pairs that close the loop with KPIs)
     - Own business-language insight line
   ========================================================================= */
import { useState, useId } from "react";

/* Deterministic per-week noise: same `seed` always produces the same
   sequence, so the chart doesn't flicker between renders. Returns a
   multiplier in roughly [0.85, 1.15] — so steady-state bars get visible
   week-to-week texture without being chaotic. */
function weeklyNoise(seed, wk) {
  const x = Math.sin((seed * 131 + wk * 47.3)) * 10000;
  const frac = x - Math.floor(x);
  return 0.85 + frac * 0.30;
}

/* ResultTileNII — cumulative-NII filled area chart with CI band + per-week
   hover tooltip. `outcomes.NII_8wk_M` is the 8-week central estimate; CI
   band is ±27% of the central path. `progress` (0..1) animates the reveal
   so the chart "draws in" alongside the rest of the page reveal. */
export function ResultTileNII({
  outcomes,
  progress = 1,
  title = "NII accumulation",
  subhead = "cumulative · vs $0 baseline (no policy)",
  insight = "Most of the upside lands by wk 6 — running the pilot longer adds little.",
}) {
  const W = 460, H = 200, PL = 52, PR = 16, PT = 14, PB = 36;
  const Wks = 8;
  const central = outcomes.NII_8wk_M;
  const lower = central * 0.88;
  const upper = central * 1.12;
  const f = (w) => 1 - Math.exp(-w / 2.2);
  const fmax = f(Wks);
  const samples = Array.from({ length: Wks + 1 }, (_, i) => ({
    w: i,
    c: (central * f(i)) / fmax,
    l: (lower * f(i)) / fmax,
    u: (upper * f(i)) / fmax,
  }));
  const visIdx = Math.max(0, Math.floor(Wks * progress));
  const vis = samples.slice(0, visIdx + 1);

  const yMax = upper * 1.22;
  const X = (w) => PL + (w / Wks) * (W - PL - PR);
  const Y = (v) => PT + (1 - v / yMax) * (H - PT - PB);

  const upperPath = vis.map((s) => `${X(s.w).toFixed(1)},${Y(s.u).toFixed(1)}`).join(" ");
  const lowerPathReverse = vis.slice().reverse().map((s) => `${X(s.w).toFixed(1)},${Y(s.l).toFixed(1)}`).join(" ");
  const bandPoly = `${upperPath} ${lowerPathReverse}`;
  const centralPath = vis.map((s) => `${X(s.w).toFixed(1)},${Y(s.c).toFixed(1)}`).join(" ");
  const fillPoly = [
    `${X(0).toFixed(1)},${Y(0).toFixed(1)}`,
    centralPath,
    `${X(vis[vis.length - 1]?.w ?? 0).toFixed(1)},${Y(0).toFixed(1)}`,
  ].join(" ");

  const [hoverWk, setHoverWk] = useState(null);
  const hoverSample = hoverWk != null ? samples[hoverWk] : null;
  const fmt$ = (v) => `+$${v.toFixed(1)}M`;
  const fillId = useId();

  return (
    <div className="sim-result-tile">
      <div className="sim-result-tile-h">
        <span className="sim-result-tile-title">{title}</span>
        <span className="sim-result-tile-sub">{subhead}</span>
      </div>
      <div className="sim-result-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="sim-result-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id={fillId} x1="0" y1={PT} x2="0" y2={Y(0)} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--acq, #5b9dff)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--acq, #5b9dff)" stopOpacity="0.34" />
            </linearGradient>
          </defs>
          {[0, yMax * 0.5, yMax].map((v, i) => (
            <g key={i}>
              <line x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)} stroke="var(--hair)" strokeWidth="0.5" />
              <text x={PL - 6} y={Y(v) + 4} fontSize="11" fontFamily="var(--mono)" fill="var(--ink-3)" textAnchor="end">
                ${v.toFixed(v < 1 ? 1 : 0)}M
              </text>
            </g>
          ))}
          {vis.length > 1 && <polygon points={bandPoly} fill="var(--acq, #5b9dff)" opacity="0.12" />}
          {vis.length > 1 && <polygon points={fillPoly} fill={`url(#${fillId})`} />}
          {vis.length > 1 && (
            <polyline points={centralPath} fill="none" stroke="var(--acq, #5b9dff)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
            <text key={w} x={X(w)} y={H - 10} fontSize="11" fontFamily="var(--mono)" fill="var(--ink-3)" textAnchor="middle">
              wk{w}
            </text>
          ))}
          {hoverSample && (
            <g>
              <line x1={X(hoverSample.w)} y1={PT} x2={X(hoverSample.w)} y2={H - PB}
                    stroke="var(--acc, #ffb15a)" strokeWidth="1" strokeDasharray="3 3" opacity="0.85" />
              <circle cx={X(hoverSample.w)} cy={Y(hoverSample.c)} r="4"
                      fill="var(--acq, #5b9dff)" stroke="var(--panel)" strokeWidth="1.5" />
            </g>
          )}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
            <rect
              key={w}
              x={X(w) - (W - PL - PR) / Wks / 2}
              y={PT}
              width={(W - PL - PR) / Wks}
              height={H - PT - PB}
              fill="transparent"
              onMouseEnter={() => setHoverWk(w)}
              onMouseLeave={() => setHoverWk(null)}
              style={{ cursor: "crosshair" }}
            />
          ))}
        </svg>
        {hoverSample && (
          <div className="sim-result-tile-tip" style={{ left: `${(X(hoverSample.w) / W) * 100}%` }}>
            <div className="sim-result-tile-tip-h">Wk {hoverSample.w}</div>
            <div className="sim-result-tile-tip-row">
              <span className="sim-result-tile-tip-k">central</span>
              <span className="sim-result-tile-tip-v">{fmt$(hoverSample.c)}</span>
            </div>
            <div className="sim-result-tile-tip-row">
              <span className="sim-result-tile-tip-k">CI</span>
              <span className="sim-result-tile-tip-v">{fmt$(hoverSample.l)} – {fmt$(hoverSample.u)}</span>
            </div>
          </div>
        )}
      </div>
      <div className="sim-result-tile-numbers">
        <div className="sim-result-tile-num">
          <span className="sim-result-tile-num-k">at wk 8</span>
          <span className="sim-result-tile-num-v">+${(central * progress).toFixed(1)}M</span>
        </div>
        <div className="sim-result-tile-num">
          <span className="sim-result-tile-num-k">CI (95%)</span>
          <span className="sim-result-tile-num-v">${lower.toFixed(1)}M – ${upper.toFixed(1)}M</span>
        </div>
      </div>
      <div className="sim-result-tile-insight">
        <span className="sim-result-tile-insight-i">ⓘ</span>
        {insight}
      </div>
    </div>
  );
}

/* ResultTileBars — vertical bars per week + dashed baseline + thin whiskers
   + hover tooltip. `rampWeeks` controls how many weeks it takes to reach
   steady-state (Failures ramp in 1 wk, Complaints lag and ramp over 2-3
   wks — different shapes naturally fall out of this). `seed` parameterises
   the per-week noise so two bar charts on the same page have visibly
   different week-to-week textures. */
export function ResultTileBars({
  title,
  subhead,
  steady,
  baselinePerWk,
  progress = 1,
  format,
  insight,
  accent,
  rampWeeks = 1,
  seed = 7,
  numbers = [],
}) {
  const W = 460, H = 200, PL = 56, PR = 16, PT = 14, PB = 36;
  const Wks = 8;

  const rawWeekly = Array.from({ length: Wks }, (_, i) => {
    const wk = i + 1;
    const rampFactor = wk <= rampWeeks
      ? 0.40 + 0.60 * (wk / (rampWeeks + 1))
      : 1.0;
    return steady * rampFactor * weeklyNoise(seed, wk);
  });

  const yMax = Math.max(baselinePerWk * 1.15, steady * 1.55);
  const X = (w) => PL + ((w - 0.5) / Wks) * (W - PL - PR);
  const Y = (v) => PT + (1 - v / yMax) * (H - PT - PB);
  const visMax = Math.max(0, Math.floor(Wks * progress));
  const barW = (W - PL - PR) / Wks * 0.58;

  const [hoverWk, setHoverWk] = useState(null);
  const hoverV = hoverWk != null ? rawWeekly[hoverWk - 1] : null;

  return (
    <div className="sim-result-tile">
      <div className="sim-result-tile-h">
        <span className="sim-result-tile-title">{title}</span>
        <span className="sim-result-tile-sub">{subhead}</span>
      </div>
      <div className="sim-result-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="sim-result-svg" preserveAspectRatio="none">
          {[0, baselinePerWk * 0.5, baselinePerWk].map((v, i) => (
            <g key={i}>
              <line x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)} stroke="var(--hair)" strokeWidth="0.5" />
              <text x={PL - 6} y={Y(v) + 4} fontSize="11" fontFamily="var(--mono)" fill="var(--ink-3)" textAnchor="end">
                {format(v)}
              </text>
            </g>
          ))}
          <line
            x1={PL} y1={Y(baselinePerWk)} x2={W - PR} y2={Y(baselinePerWk)}
            stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 3" opacity="0.75"
          />
          <text x={W - PR - 4} y={Y(baselinePerWk) - 5} fontSize="10.5" fontFamily="var(--mono)"
                fill="var(--ink-3)" textAnchor="end">
            baseline · {format(baselinePerWk)}
          </text>
          {rawWeekly.map((v, i) => {
            if (i >= visMax) return null;
            const top = Y(v);
            const bottom = Y(0);
            const cx = X(i + 1);
            const ciHalfWidth = barW * 0.20;
            const whiskerTop = Y(v * 1.12);
            const whiskerBottom = Y(v * 0.88);
            const isHovered = hoverWk === i + 1;
            return (
              <g key={i}>
                <rect
                  x={cx - barW / 2}
                  y={top}
                  width={barW}
                  height={Math.max(1, bottom - top)}
                  fill={accent}
                  opacity={isHovered ? 1.0 : 0.85}
                  rx="2"
                />
                <line x1={cx} y1={whiskerTop} x2={cx} y2={whiskerBottom}
                      stroke="var(--ink)" strokeWidth="0.9" opacity="0.55" />
                <line x1={cx - ciHalfWidth} y1={whiskerTop} x2={cx + ciHalfWidth} y2={whiskerTop}
                      stroke="var(--ink)" strokeWidth="0.9" opacity="0.55" />
                <line x1={cx - ciHalfWidth} y1={whiskerBottom} x2={cx + ciHalfWidth} y2={whiskerBottom}
                      stroke="var(--ink)" strokeWidth="0.9" opacity="0.55" />
              </g>
            );
          })}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
            <text key={w} x={X(w)} y={H - 10} fontSize="11" fontFamily="var(--mono)" fill="var(--ink-3)" textAnchor="middle">
              wk{w}
            </text>
          ))}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
            <rect
              key={w}
              x={X(w) - (W - PL - PR) / Wks / 2}
              y={PT}
              width={(W - PL - PR) / Wks}
              height={H - PT - PB}
              fill="transparent"
              onMouseEnter={() => setHoverWk(w)}
              onMouseLeave={() => setHoverWk(null)}
              style={{ cursor: "crosshair" }}
            />
          ))}
        </svg>
        {hoverV != null && (
          <div className="sim-result-tile-tip" style={{ left: `${(X(hoverWk) / W) * 100}%` }}>
            <div className="sim-result-tile-tip-h">Wk {hoverWk}</div>
            <div className="sim-result-tile-tip-row">
              <span className="sim-result-tile-tip-k">this wk</span>
              <span className="sim-result-tile-tip-v">{format(hoverV)}</span>
            </div>
            <div className="sim-result-tile-tip-row">
              <span className="sim-result-tile-tip-k">CI ±12%</span>
              <span className="sim-result-tile-tip-v">{format(hoverV * 0.88)} – {format(hoverV * 1.12)}</span>
            </div>
          </div>
        )}
      </div>
      <div className="sim-result-tile-numbers">
        {numbers.map((n, i) => (
          <div key={i} className="sim-result-tile-num">
            <span className="sim-result-tile-num-k">{n.k}</span>
            <span className="sim-result-tile-num-v">{n.v}</span>
          </div>
        ))}
      </div>
      <div className="sim-result-tile-insight">
        <span className="sim-result-tile-insight-i">ⓘ</span>
        {insight}
      </div>
    </div>
  );
}

/* ResultTileCohort — horizontal stacked bar showing cohort segment
   composition. The bar's total width represents the cohort reached; each
   segment's width is its share. Labels include both percentage and
   absolute count so the reader never has to do the math. */
export function ResultTileCohort({
  segments,
  treatedN,
  caption,
  insight = "Four-in-five customers helped are renters paying one or two landlords — the simpler patterns drive most of the value.",
}) {
  const totalPct = segments.reduce((s, x) => s + x.pct, 0) || 100;
  const defaultCaption = `${segments[0].label} + ${segments[1].label} account for ${segments[0].pct + segments[1].pct}% · the two largest patterns`;
  return (
    <div className="sim-result-tile">
      <div className="sim-result-tile-h">
        <span className="sim-result-tile-title">Cohort composition</span>
        <span className="sim-result-tile-sub">{treatedN.toLocaleString()} reached</span>
      </div>
      <div className="sim-cohort-stack">
        <div className="sim-cohort-bar">
          {segments.map((s) => (
            <div
              key={s.id}
              className="sim-cohort-bar-seg"
              style={{ width: `${(s.pct / totalPct) * 100}%`, background: s.color }}
              title={`${s.label} · ${s.pct}% · ${Math.round(treatedN * s.pct / 100).toLocaleString()}`}
            />
          ))}
        </div>
        <div className="sim-cohort-labels">
          {segments.map((s) => (
            <div key={s.id} className="sim-cohort-label" style={{ width: `${(s.pct / totalPct) * 100}%` }}>
              <span className="sim-cohort-label-sw" style={{ background: s.color }} />
              <span className="sim-cohort-label-pct">{s.pct}%</span>
              <span className="sim-cohort-label-l">{s.label}</span>
              <span className="sim-cohort-label-n">({(treatedN * s.pct / 100 / 1000).toFixed(1)}K)</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sim-result-tile-caption">{caption || defaultCaption}</div>
      <div className="sim-result-tile-insight">
        <span className="sim-result-tile-insight-i">ⓘ</span>
        {insight}
      </div>
    </div>
  );
}
