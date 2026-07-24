import React, { useMemo } from "react";
import "@/styles/test-charts.css";

/**
 * ChannelMixFunnel — 4-stage funnel for the Test stage / Communications panel.
 *
 * Stages (top → bottom):
 *   1. Treated cohort (input)
 *   2. Reached = treatedCohort × effective reach (weighted by mix × channel reach)
 *   3. Aware   = Reached × frequency effect (adstock saturation)
 *   4. Warm    = Aware × sentiment multiplier (proactive / educational / generic)
 *
 * Math is synthetic, deterministic from props. No animation / chart lib.
 *
 * Props
 *   treatedCohort : number  — population entering the funnel (e.g. 250 000)
 *   channelMix    : { inapp, push, email, sms, rm }  — each 0–100, share of touches
 *   frequency     : 1–5     — touches per period
 *   tone          : 'proactive' | 'educational' | 'generic'
 */

const REACH = { inapp: 0.95, push: 0.70, email: 0.55, sms: 0.80, rm: 0.42 };
const SENTIMENT_MULT = { proactive: 1.0, educational: 0.85, generic: 0.60 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const fmt = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return Math.round(n).toLocaleString();
};

export default function ChannelMixFunnel({
  treatedCohort = 250000,
  channelMix = { inapp: 40, push: 20, email: 15, sms: 10, rm: 15 },
  frequency = 3,
  tone = "proactive",
}) {
  const { stages, conversions } = useMemo(() => {
    // Normalize mix to fractions summing to 1 (defensive — UI sends 0–100).
    const mixTotal =
      Object.values(channelMix).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
    const mix = Object.fromEntries(
      Object.entries(channelMix).map(([k, v]) => [k, (Number(v) || 0) / mixTotal])
    );

    // Weighted effective reach across the chosen channel mix.
    const effReach = Object.keys(REACH).reduce(
      (sum, c) => sum + (mix[c] || 0) * REACH[c],
      0
    );

    // Frequency effect — adstock saturation.
    const freqEff = 1 - Math.exp(-0.55 * frequency);

    // Sentiment / tone multiplier — caps how much "warm" you can land.
    const sMult = SENTIMENT_MULT[tone] ?? 1.0;
    const sentiment = clamp(0.46 + 0.46 * 0.4 * sMult, 0, 0.95);

    const reached = treatedCohort * effReach;
    const aware = reached * freqEff;
    const warm = aware * sentiment;

    const list = [
      { label: "Treated cohort", value: treatedCohort, cls: "s1" },
      { label: "Reached", value: reached, cls: "s2" },
      { label: "Aware", value: aware, cls: "s3" },
      { label: "Warm", value: warm, cls: "s4" },
    ];

    const conv = [effReach, freqEff, sentiment].map((r) =>
      Math.round(r * 100)
    );
    return { stages: list, conversions: conv };
  }, [treatedCohort, channelMix, frequency, tone]);

  // Layout
  const W = 600;
  const H = 260;
  const PAD_L = 130;
  const PAD_R = 110;
  const ROW_H = 38;
  const ROW_GAP = 22;
  const maxBarW = W - PAD_L - PAD_R;
  const maxVal = stages[0].value || 1;

  return (
    <div className="test-chart chart-channel-funnel">
      <div className="tc-title">Channel-mix funnel — treated → warm</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Channel mix funnel">
        {stages.map((s, i) => {
          const y = 14 + i * (ROW_H + ROW_GAP);
          const barW = Math.max(2, (s.value / maxVal) * maxBarW);
          // Centered bar for funnel symmetry
          const x = PAD_L + (maxBarW - barW) / 2;
          return (
            <g key={s.label} className="cf-stage">
              <text x={PAD_L - 10} y={y + ROW_H / 2 + 4} textAnchor="end" className="tc-label">
                {s.label}
              </text>
              <rect
                x={PAD_L}
                y={y}
                width={maxBarW}
                height={ROW_H}
                rx={5}
                className="cf-bar-bg"
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={ROW_H}
                rx={5}
                className={`cf-bar-fill ${s.cls}`}
              />
              <text
                x={PAD_L + maxBarW + 10}
                y={y + ROW_H / 2 + 4}
                className="tc-num"
              >
                {fmt(s.value)}
              </text>
              {i < stages.length - 1 && (
                <text
                  x={W / 2}
                  y={y + ROW_H + ROW_GAP / 2 + 4}
                  textAnchor="middle"
                  className="cf-arrow"
                >
                  ↓ {conversions[i]}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="tc-commentary">
        <b>▶</b> {fmt(stages[3].value)} warm — {Math.round((stages[3].value / treatedCohort) * 100)}% of treated cohort lands warm at tone <b>{tone}</b>, freq <b>{frequency}</b>.
      </div>
    </div>
  );
}
