import React, { useMemo, useState } from "react";
import "@/styles/test-charts.css";

/**
 * Cohort coverage waterfall — stepwise narrowing from total cohort → actually treated.
 */
export default function CohortWaterfall({
  cohortFilter = "verified",
  trustGateMonths = 18,
  rails = ["zelle", "ach"],
  rolloutPct = 60,
}) {
  const TOTAL = 200000;

  const cohortShare = cohortFilter === "all" ? 1.0 : cohortFilter === "thin" ? 0.18 : 0.62;
  const cohortLabel =
    cohortFilter === "all" ? "All applicants" : cohortFilter === "thin" ? "Thin-file subset" : "Verified subset";

  const trustPass = useMemo(() => {
    const anchors = [
      [6, 0.96],
      [12, 0.91],
      [18, 0.84],
      [24, 0.74],
      [30, 0.62],
    ];
    const t = Math.max(6, Math.min(30, trustGateMonths));
    for (let i = 0; i < anchors.length - 1; i++) {
      const [a, va] = anchors[i];
      const [b, vb] = anchors[i + 1];
      if (t >= a && t <= b) {
        const r = (t - a) / (b - a);
        return va + (vb - va) * r;
      }
    }
    return 0.84;
  }, [trustGateMonths]);

  const railShare = useMemo(() => {
    const r = (rails || []).map((s) => s.toLowerCase());
    let v = 0;
    if (r.includes("zelle")) v += 0.78;
    if (r.includes("ach")) v += 0.18;
    if (r.includes("rtp")) v += 0.04;
    if (r.includes("wire")) v += 0.02;
    return Math.max(0.05, Math.min(0.99, v));
  }, [rails]);

  const rollout = Math.max(0, Math.min(1, rolloutPct / 100));

  const stages = useMemo(() => {
    const a = TOTAL;
    const b = Math.round(a * cohortShare);
    const c = Math.round(b * trustPass);
    const d = Math.round(c * railShare);
    const e = Math.round(d * rollout);
    return [
      { key: "total", label: "Total gig cohort", count: a, drop: null },
      { key: "cohort", label: cohortLabel, count: b, drop: a - b },
      { key: "trust", label: `Pass trust gate (${trustGateMonths}mo)`, count: c, drop: b - c },
      { key: "rails", label: `Reachable by policy rails (${(rails || []).join(", ").toUpperCase() || "none"})`, count: d, dim: true, drop: c - d },
      { key: "treated", label: `Actually treated (${rolloutPct}% rollout)`, count: e, final: true, drop: d - e },
    ];
  }, [TOTAL, cohortShare, trustPass, railShare, rollout, cohortLabel, trustGateMonths, rails, rolloutPct]);

  const loosenGain = useMemo(() => {
    if (trustGateMonths <= 12) return 0;
    const newPass = 0.91;
    const newC = Math.round(TOTAL * cohortShare * newPass);
    const newE = Math.round(newC * railShare * rollout);
    return Math.max(0, newE - stages[stages.length - 1].count);
  }, [trustGateMonths, cohortShare, railShare, rollout, stages]);

  const VB_W = 540;
  const ROW_H = 38;
  const ROW_GAP = 8;
  const PAD = { l: 200, r: 80, t: 12, b: 14 };
  const plotW = VB_W - PAD.l - PAD.r;
  const VB_H = PAD.t + PAD.b + stages.length * ROW_H + (stages.length - 1) * ROW_GAP;

  const finalCount = stages[stages.length - 1].count;
  const finalPct = Math.round((finalCount / TOTAL) * 100);
  const commentary =
    loosenGain > 0
      ? `Your levers narrow ${TOTAL.toLocaleString()} → ${finalCount.toLocaleString()} (${finalPct}% of cohort). Loosening trust gate to 12mo would add ~${Math.round(loosenGain / 50) * 50} customers.`
      : `Your levers narrow ${TOTAL.toLocaleString()} → ${finalCount.toLocaleString()} (${finalPct}% of cohort). Trust gate is already at the loose end — bigger gains come from broader rails or rollout.`;

  const [hover, setHover] = useState(null);

  return (
    <div className="chart-cohort-waterfall">
      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cohort coverage waterfall">
          {stages.map((s, i) => {
            const y = PAD.t + i * (ROW_H + ROW_GAP);
            const w = (s.count / TOTAL) * plotW;
            const barCls = s.final ? "wf-bar final" : s.dim ? "wf-bar dim" : "wf-bar";
            const pct = Math.round((s.count / TOTAL) * 100);

            return (
              <g key={s.key}>
                <text className="wf-label" x={PAD.l - 10} y={y + ROW_H / 2 + 4} textAnchor="end">
                  {s.label}
                </text>
                <rect className="wf-track" x={PAD.l} y={y + ROW_H * 0.18} width={plotW} height={ROW_H * 0.64} rx={4} />
                <rect
                  className={barCls}
                  x={PAD.l}
                  y={y + ROW_H * 0.18}
                  width={Math.max(2, w)}
                  height={ROW_H * 0.64}
                  rx={4}
                  onMouseEnter={() => setHover({
                    label: s.label,
                    value: `${s.count.toLocaleString()} customers · ${pct}% of total${s.drop ? ` · drops ${s.drop.toLocaleString()}` : ""}`,
                    cx: ((PAD.l + Math.max(2, w) / 2) / VB_W) * 100,
                    top: ((y - 4) / VB_H) * 100,
                  })}
                  onMouseLeave={() => setHover(null)}
                />
                <text className="wf-count" x={PAD.l + plotW + 8} y={y + ROW_H / 2 + 4} textAnchor="start">
                  {s.count.toLocaleString()}
                </text>
                {i < stages.length - 1 && (
                  <path
                    className="wf-arrow"
                    d={`M${PAD.l + Math.max(2, w) - 6} ${y + ROW_H * 0.82 + 1} L${PAD.l + Math.max(2, w) - 6} ${y + ROW_H + ROW_GAP - 2}`}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {hover && (
          <div className="chart-tooltip" style={{ left: `${hover.cx}%`, top: `${hover.top}%` }}>
            <div className="chart-tooltip-l">{hover.label}</div>
            <div className="chart-tooltip-v">{hover.value}</div>
          </div>
        )}
      </div>

      <div className="chart-commentary">▶ {commentary}</div>
    </div>
  );
}
