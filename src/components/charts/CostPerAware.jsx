import React, { useMemo } from "react";
import "@/styles/test-charts.css";

/**
 * CostPerAware — 3-bar comparison of $ per aware-customer across mix scenarios.
 *
 *   1. Current mix  — bar fed from channelMix props
 *   2. RM-heavy alt — 40% RM, remaining 60% split across cheap digital
 *   3. Email-heavy  — 40% email, remaining 60% split similarly
 *
 * Cost-per-touch lookup (USD):
 *   inapp 0.40, push 0.20, email 0.15, sms 0.50, rm 6.00
 *
 * Reach lookup (same as funnel) drives "awareN" if no override provided.
 *
 * Props
 *   channelMix : { inapp, push, email, sms, rm } — each 0–100
 *   frequency  : 1–5
 *   awareN     : number — count of aware customers; defaults to 100 000
 */

const COST = { inapp: 0.40, push: 0.20, email: 0.15, sms: 0.50, rm: 6.00 };
const REACH = { inapp: 0.95, push: 0.70, email: 0.55, sms: 0.80, rm: 0.42 };

const normalize = (mix) => {
  const total =
    Object.values(mix).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  return Object.fromEntries(
    Object.entries(mix).map(([k, v]) => [k, (Number(v) || 0) / total])
  );
};

// Reach-weighted touches per aware customer; gives a stable $ per aware.
const costPerAware = (mix, freq, awareN) => {
  const n = normalize(mix);
  const eff = Object.keys(REACH).reduce((s, c) => s + n[c] * REACH[c], 0) || 0.01;
  const totalTouches = awareN * freq;
  const totalCost = Object.keys(COST).reduce(
    (s, c) => s + n[c] * totalTouches * COST[c],
    0
  );
  // Awareness is bounded by effective reach — adjust the denominator.
  const effectiveAware = awareN * eff;
  return totalCost / Math.max(effectiveAware, 1);
};

export default function CostPerAware({
  channelMix = { inapp: 40, push: 20, email: 15, sms: 10, rm: 15 },
  frequency = 3,
  awareN = 100000,
}) {
  const { bars, maxV } = useMemo(() => {
    const rmHeavy = { inapp: 20, push: 10, email: 20, sms: 10, rm: 40 };
    const emailHeavy = { inapp: 25, push: 15, email: 40, sms: 10, rm: 10 };

    const list = [
      { label: "Current mix", value: costPerAware(channelMix, frequency, awareN), cls: "current" },
      { label: "RM-heavy alt", value: costPerAware(rmHeavy, frequency, awareN), cls: "rm" },
      { label: "Email-heavy alt", value: costPerAware(emailHeavy, frequency, awareN), cls: "email" },
    ];
    return { bars: list, maxV: Math.max(...list.map((b) => b.value)) || 1 };
  }, [channelMix, frequency, awareN]);

  const W = 600;
  const H = 220;
  const PAD_L = 130;
  const PAD_R = 90;
  const ROW_H = 36;
  const ROW_GAP = 18;
  const maxBarW = W - PAD_L - PAD_R;

  const fmt$ = (v) => `$${v.toFixed(2)}`;

  return (
    <div className="test-chart chart-cost-aware">
      <div className="tc-title">Cost per aware — by mix scenario</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cost per aware bars">
        {bars.map((b, i) => {
          const y = 18 + i * (ROW_H + ROW_GAP);
          const w = Math.max(2, (b.value / maxV) * maxBarW);
          return (
            <g key={b.label}>
              <text x={PAD_L - 10} y={y + ROW_H / 2 + 4} textAnchor="end" className="tc-label">
                {b.label}
              </text>
              <rect x={PAD_L} y={y} width={maxBarW} height={ROW_H} rx={5} className="cc-bar-bg" />
              <rect x={PAD_L} y={y} width={w} height={ROW_H} rx={5} className={`cc-bar ${b.cls}`} />
              <text x={PAD_L + w + 10} y={y + ROW_H / 2 + 4} className="tc-num">
                {fmt$(b.value)} <tspan className="tc-sub">/aware</tspan>
              </text>
            </g>
          );
        })}
      </svg>
      <div className="tc-commentary">
        <b>▶</b> Current mix: <b>{fmt$(bars[0].value)}</b> per aware. RM-heavy would be <b>{fmt$(bars[1].value)}</b> — high quality but expensive at scale.
      </div>
    </div>
  );
}
