/* ============================================================================
   ConversionFunnel — communication-driven funnel for the Simulate config.

   The cohort waterfall sits beside this one and answers "who is in scope?"
   based on eligibility levers (trust gate, rails, rollout). This chart
   answers a different question: "of those in scope, how many do we
   actually reach and convert?" — driven by the *communication* levers
   (channel mix, touches per week, tone, send timing).

   Funnel stages, top-to-bottom:
     1. Eligible cohort     (the input — what cohort funnel hands us)
     2. Reached at least 1x (channel mix coverage × frequency cap)
     3. Aware               (reached × awareness rate from tone/timing)
     4. Engaged             (aware × engagement rate from channel quality)
     5. Lift-utilising      (engaged × actual transaction lift adoption)

   Each row is a horizontal bar whose width is proportional to the absolute
   count at that stage; a small number on the right shows the count and a
   conversion-rate chip on the left shows the % drop from the prior step.
   ========================================================================= */

/* Channel quality coefficients — how effective each channel is at moving
   a customer from "reached" to "aware" and onward. Tuned roughly to
   match the existing AwarenessSCurve / ChannelMixFunnel chart values. */
const CHANNEL_REACH = {
  inapp: 0.95,  // strongest — the customer is already in our app
  push:  0.62,  // OK if notifications are enabled
  email: 0.34,  // open rates are low
  sms:   0.78,
  rm:    0.92,
};
const CHANNEL_AWARE = {
  inapp: 0.74,
  push:  0.42,
  email: 0.28,
  sms:   0.58,
  rm:    0.82,
};

const TONE_LIFT = {
  proactive:   1.00,
  educational: 0.92,
  generic:     0.71,
};
const TIMING_LIFT = {
  "pre-payout": 1.00,
  "always-on":  0.84,
};

export default function ConversionFunnel({
  treatedCohort = 64000,
  channelMix = { inapp: 40, push: 20, email: 20, sms: 12, rm: 8 },
  frequency = 3,
  tone = "proactive",
  timing = "pre-payout",
}) {
  const total = Math.max(1, Object.values(channelMix).reduce((a, b) => a + b, 0));

  // Weighted reach probability across the chosen channel mix. Each channel's
  // weight is its share of the mix (channelMix[k] / total).
  const reachProb = Object.entries(channelMix).reduce((acc, [k, pct]) => {
    const w = pct / total;
    const reach = CHANNEL_REACH[k] ?? 0.5;
    return acc + w * reach;
  }, 0);
  const awareCoef = Object.entries(channelMix).reduce((acc, [k, pct]) => {
    const w = pct / total;
    const aware = CHANNEL_AWARE[k] ?? 0.4;
    return acc + w * aware;
  }, 0);

  // Frequency uplift — diminishing returns above ~3 touches/wk.
  const freqLift = Math.min(1.0, 0.55 + 0.18 * Math.log(1 + frequency));

  // Tone + timing modulate awareness → engagement → adoption.
  const toneLift = TONE_LIFT[tone] ?? 0.85;
  const timingLift = TIMING_LIFT[timing] ?? 0.9;

  // Stage counts — each derived from the prior. The "engaged" step bakes
  // in tone+timing; the "lift-utilising" step bakes in the transaction
  // adoption rate, which is ~24% for the gig segment.
  const eligible = Math.round(treatedCohort);
  const reached  = Math.round(eligible * reachProb * freqLift);
  const aware    = Math.round(reached * awareCoef * toneLift);
  const engaged  = Math.round(aware * 0.71 * timingLift);
  const lifting  = Math.round(engaged * 0.34);

  const stages = [
    { k: "Eligible cohort",  v: eligible, prev: null,     color: "var(--ink-3)" },
    { k: "Reached ≥1×",      v: reached,  prev: eligible, color: "var(--acq, #5b9dff)" },
    { k: "Aware",            v: aware,    prev: reached,  color: "var(--acq, #5b9dff)" },
    { k: "Engaged",          v: engaged,  prev: aware,    color: "var(--deep, #b794f6)" },
    { k: "Lift-utilising",   v: lifting,  prev: engaged,  color: "var(--live, #42e08b)" },
  ];

  const W = 320, H = stages.length * 24 + 6;
  const PL = 116, PR = 64, ROW_H = 22;
  const maxV = Math.max(...stages.map((s) => s.v), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="conv-funnel" preserveAspectRatio="none">
      {stages.map((s, i) => {
        const barW = ((W - PL - PR) * s.v) / maxV;
        const y = i * 24 + 3;
        const ratio = s.prev ? (s.prev > 0 ? (s.v / s.prev) : 0) : null;
        return (
          <g key={s.k}>
            {/* Label */}
            <text x={PL - 6} y={y + ROW_H / 2 + 3.5} textAnchor="end" fontSize="9.5"
                  fill="var(--ink-2)" fontFamily="var(--ui)" fontWeight="600">
              {s.k}
            </text>
            {/* Bar */}
            <rect x={PL} y={y} width={barW} height={ROW_H} fill={s.color} opacity="0.20" rx="3" />
            <rect x={PL} y={y} width={Math.max(2, barW * 0.94)} height={ROW_H}
                  fill={s.color} opacity="0.55" rx="3" />
            {/* Count */}
            <text x={PL + barW + 6} y={y + ROW_H / 2 + 3.5} textAnchor="start" fontSize="10"
                  fill="var(--ink)" fontFamily="var(--mono)" fontWeight="700">
              {s.v.toLocaleString()}
            </text>
            {/* Drop-off ratio (excluding first row) */}
            {ratio != null && (
              <text x={W - PR + 36} y={y + ROW_H / 2 + 3.5} textAnchor="end" fontSize="8.5"
                    fill="var(--ink-4)" fontFamily="var(--mono)">
                {(ratio * 100).toFixed(0)}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
