/* ============================================================================
   projectedRct — shared helpers that make the downstream journey (Deploy
   live-RCT + Learn portfolio) CONTEXTUAL to the staged experiment.

   A policy staged from Simulate / If-What carries a `projected` object:
     {
       cohortLabel, eligibleN, treatmentN, controlN, pilotWeeks,
       valueAtStakeM,                       // headline $ value (annual run-rate)
       kpis: [{ key, label, unit, value, tau?, drift? }]
     }
   When that's present, the live-RCT KPI curves, the cohort split, the
   NII/value-at-stake aggregate, and the Learn realised-vs-predicted grid all
   derive from it. When it's absent (the historical mock rows), every consumer
   falls back to its existing behaviour — so nothing pre-existing changes.
   ========================================================================= */

/* Format a numeric effect size by its unit, with a signed prefix. */
export function fmtUnit(v, unit) {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v >= 0 ? "+" : "−";
  const a = Math.abs(v);
  switch (unit) {
    case "$M": return `${sign}$${a >= 100 ? a.toFixed(0) : a.toFixed(1)}M`;
    case "$K": return `${sign}$${Math.round(a).toLocaleString()}K`;
    case "pp": return `${sign}${a.toFixed(1)} pp`;
    case "#":  return `${sign}${Math.round(a).toLocaleString()}`;
    case "%":  return `${a.toFixed(1)}%`;
    case "R²": return v.toFixed(2);
    default:    return `${sign}${a.toFixed(1)}`;
  }
}

/* Deterministic pseudo-random in [0,1), seeded by a string id + slot index.
   Keeps realised-vs-predicted variance STABLE per policy (same pilot always
   reads the same way) while differing across pilots. */
export function seeded(str, n) {
  const base = (str || "x").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const x = Math.sin(base * 131.7 + n * 47.31) * 10000;
  return x - Math.floor(x);
}

/* Turn a staged policy's projection into a completed-experiment row for the
   Learn portfolio: realised = predicted × deterministic ±variance; fidelity
   and the promote/mixed/did-not-support verdict follow from how tightly the
   realised values tracked the projection. Returns null if no projection. */
export function deriveLearnRow(p, themeName) {
  const proj = p?.projected;
  if (!proj?.kpis?.length) return null;

  let absVarSum = 0;
  const fidelityRows = proj.kpis.map((k, i) => {
    const variance = (seeded(p.id, i) - 0.5) * 0.16;     // ±8% realised vs predicted
    absVarSum += Math.abs(variance);
    const actualV = k.value * (1 + variance);
    const tone = Math.abs(variance) < 0.05 ? "ok" : Math.abs(variance) < 0.11 ? "warn" : "bad";
    return { k: k.label, predicted: fmtUnit(k.value, k.unit), actual: fmtUnit(actualV, k.unit), tone };
  });

  const avgAbsVar = absVarSum / proj.kpis.length;
  const fidelity = Math.max(0.74, Math.min(0.98, 0.99 - avgAbsVar * 1.6));
  const drift = fidelityRows.some((r) => r.tone !== "ok");
  const outcome = fidelity >= 0.9 && !drift ? "promoted"
    : drift && fidelity < 0.82 ? "did-not-support"
    : "mixed";

  return {
    id: `exp-live-${p.id}`,
    name: p.name || "Staged pilot",
    hypothesis: p.hypothesis || "—",
    cluster: p.cluster || "",
    themeName: themeName || "—",
    fidelity,
    outcome,
    closedAt: p.stagedAt || null,
    live: true,                              // the user's own just-completed run
    fidelityRows,
    writeback: [
      `Realised outcomes landed within ~${Math.round(avgAbsVar * 100)}pp of the pre-RCT projection across ${proj.kpis.length} KPIs.`,
      `Treatment ${(proj.treatmentN ?? 0).toLocaleString()} · control ${(proj.controlN ?? 0).toLocaleString()} · ${proj.pilotWeeks || 8}-week pilot on ${proj.cohortLabel || "the staged cohort"}.`,
      outcome === "promoted"
        ? "All KPIs tracked inside the confidence interval — recommended for rollout."
        : "One or more KPIs drifted from prediction — flagged for a prior update before scale-up.",
    ],
  };
}
