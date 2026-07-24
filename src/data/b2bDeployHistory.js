/* ============================================================================
   B2B (SMB) · MOCK_HISTORY entries for DeployWorkspace — one prior closed pilot
   per B2B use case. Merged into the Deploy portfolio via spread.
   ========================================================================= */

const dayBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const B2B_DEPLOY_HISTORY = [
  {
    id: "mock-smbgrowth-1",
    name: "Re-bundle the off-us flows · v1",
    hypothesis: "H-SMB-GROWTH-2026-01-15",
    cluster: "smb-growth-expansion",
    themeName: "Growth Signal",
    themeId: "smbgrowth",
    experimentType: "smbgrowth",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(110),
    approvedAt: dayBack(108),
    complianceAt: dayBack(107),
    pilotStartedAt: dayBack(101),
    pilotEndedAt: dayBack(45),
    pilotDuration: 8,
    pilotWeek: 8,
    pilotTotal: 8,
    pilotEndReason: "duration-complete",
    treatmentN: 34560,
    controlN: 3840,
    blurb: "Per-segment re-bundle (line + card win-back + merchant) routed by channel · 10% holdout · 8-week pilot. Promoted to full rollout.",
    learnings: {
      headline: "Cross-sell conversion landed inside CI (8.4% → 18.6% vs 19.1% modeled) · off-us card win-back overshot · promoted to full rollout",
      actuals: [
        { k: "Cross-sell conversion", predicted: "→19.1%",   actual: "→18.6%",  tone: "ok",   delta: "within CI" },
        { k: "Incremental Yr-1 rev",  predicted: "+$31M",     actual: "+$29.4M", tone: "ok",   delta: "within CI" },
        { k: "Off-us card win-back",  predicted: "22% conv",  actual: "27% conv", tone: "warn", delta: "OVERSHOOT · +5pp" },
        { k: "Products / relationship", predicted: "+0.4",    actual: "+0.4",    tone: "ok",   delta: "held exact" },
      ],
      surprises: [
        "Off-us financers converted +5pp above model — showing a pre-approved card in-app the moment the acquirer-change signal fires beats the modeled latency assumption.",
      ],
      didntWork: [
        "Equipment-heavy RM conversion came in 3pp light — the asset-finance term sheet needs to lead the conversation, not follow it.",
      ],
      nextMove: { verdict: "Promoted to full rollout", tone: "ok", rationale: "Conversion + revenue inside CI, guardrails green, off-us win-back stronger than modeled. Whole-relationship deepening drafted as the follow-on play." },
    },
  },
  {
    id: "mock-smbrate-1",
    name: "Minimum-effective-rate · v1",
    hypothesis: "H-SMB-RATE-2026-01-20",
    cluster: "smb-deposit-rate-defense",
    themeName: "Deposit Risk",
    themeId: "smbrate",
    experimentType: "smbrate",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(96),
    approvedAt: dayBack(94),
    complianceAt: dayBack(93),
    pilotStartedAt: dayBack(87),
    pilotEndedAt: dayBack(31),
    pilotDuration: 8,
    pilotWeek: 8,
    pilotTotal: 8,
    pilotEndReason: "duration-complete",
    treatmentN: 37080,
    controlN: 4120,
    blurb: "Per-segment minimum-effective reprice at +38 bps blended (vs +95 to match) · no-overpay + margin-floor enforced · 10% holdout. Promoted.",
    learnings: {
      headline: "Retained $2.5B of $3.4B at +39 bps blended · $12.4M more NII than a blanket match · no-overpay segment held with zero spend",
      actuals: [
        { k: "NII retained",          predicted: "+$41M",   actual: "+$39.6M", tone: "ok",   delta: "within CI" },
        { k: "Blended rate given",    predicted: "+38 bps", actual: "+39 bps", tone: "ok",   delta: "within CI" },
        { k: "vs competitor-match",   predicted: "+$13M",   actual: "+$12.4M", tone: "ok",   delta: "within CI" },
        { k: "Over-pay rate",         predicted: "0%",      actual: "0%",      tone: "ok",   delta: "no-overpay held" },
      ],
      surprises: [
        "The relationship-rate segment re-bundled better than modeled — conditioning the rate on keeping payroll on-us pulled 6% of partial-outflow accounts back to full primacy.",
      ],
      didntWork: [
        "A thin slice of the will-stay segment churned anyway on a competitor's branch-led pitch — elasticity model under-weighted relationship-manager poaching.",
      ],
      nextMove: { verdict: "Promoted to full rollout", tone: "ok", rationale: "NII retained inside CI, margin floor + no-overpay held, +$12.4M over a blanket match. Reprice-vs-rebundle drafted to test treasury anchoring on the high-balance slice." },
    },
  },
  {
    id: "mock-smbgrowth-2",
    name: "Pre-approved financing on the spend signal · v2",
    hypothesis: "H-SMB-GROWTH-2025-11-05",
    cluster: "smb-growth-expansion",
    themeName: "Growth Signal",
    themeId: "smbgrowth",
    experimentType: "smbgrowth",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(216),
    approvedAt: dayBack(214),
    complianceAt: dayBack(213),
    pilotStartedAt: dayBack(206),
    pilotEndedAt: dayBack(150),
    pilotDuration: 8,
    pilotWeek: 8,
    pilotTotal: 8,
    pilotEndReason: "duration-complete",
    treatmentN: 28800,
    controlN: 3200,
    blurb: "Pre-approved line + equipment-finance offer fired on the cash-flow/expansion spend signal · in-app the moment the signal trips · 10% holdout · 8-week pilot. Promoted to full rollout.",
    learnings: {
      headline: "Cross-sell conversion landed inside CI (7.9% → 16.8% vs 17.2% modeled) · pre-approved line take-up overshot · promoted to full rollout",
      actuals: [
        { k: "Cross-sell conversion", predicted: "→17.2%",   actual: "→16.8%",  tone: "ok",   delta: "within CI" },
        { k: "Incremental Yr-1 rev",  predicted: "+$27M",     actual: "+$26.1M", tone: "ok",   delta: "within CI" },
        { k: "Pre-approved take-up",  predicted: "19% conv",  actual: "24% conv", tone: "warn", delta: "OVERSHOOT · +5pp" },
        { k: "Products / relationship", predicted: "+0.3",    actual: "+0.3",    tone: "ok",   delta: "held exact" },
      ],
      surprises: [
        "Pre-approved line take-up beat model by +5pp — surfacing a ready-to-draw limit the instant the expansion-spend signal fires converts far better than a generic 'apply now' on the same accounts. Pre-clearing the credit decision was the lever.",
      ],
      didntWork: [
        "Equipment-finance attach lagged 2pp light — the term-sheet hand-off to the asset-finance desk still adds friction at exactly the moment intent is highest.",
      ],
      nextMove: { verdict: "Promoted to full rollout", tone: "ok", rationale: "Conversion + revenue inside CI, guardrails green, pre-approved take-up stronger than modeled. Inline equipment-finance term sheet drafted to close the attach gap." },
    },
  },
  {
    id: "mock-smbrate-2",
    name: "Relationship-rate for multi-product accounts · v2",
    hypothesis: "H-SMB-RATE-2025-11-18",
    cluster: "smb-deposit-rate-defense",
    themeName: "Deposit Risk",
    themeId: "smbrate",
    experimentType: "smbrate",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(202),
    approvedAt: dayBack(200),
    complianceAt: dayBack(199),
    pilotStartedAt: dayBack(192),
    pilotEndedAt: dayBack(136),
    pilotDuration: 8,
    pilotWeek: 8,
    pilotTotal: 8,
    pilotEndReason: "duration-complete",
    treatmentN: 33840,
    controlN: 3760,
    blurb: "Relationship-rate conditioned on multi-product depth (payroll + card + line on-us) at +34 bps blended · no-overpay + margin-floor enforced · 10% holdout. Promoted.",
    learnings: {
      headline: "Retained $2.1B of $2.9B at +35 bps blended · $10.8M more NII than a blanket match · relationship-rate held the multi-product base with no overpay",
      actuals: [
        { k: "NII retained",          predicted: "+$36M",   actual: "+$34.7M", tone: "ok",   delta: "within CI" },
        { k: "Blended rate given",    predicted: "+34 bps", actual: "+35 bps", tone: "ok",   delta: "within CI" },
        { k: "vs competitor-match",   predicted: "+$11M",   actual: "+$10.8M", tone: "ok",   delta: "within CI" },
        { k: "Over-pay rate",         predicted: "0%",      actual: "0%",      tone: "ok",   delta: "no-overpay held" },
      ],
      surprises: [
        "Conditioning the rate on three-product depth pulled 8% of the multi-product base off any shopping behavior entirely — the relationship discount read as a loyalty reward, not a defensive match, so they stopped comparing.",
      ],
      didntWork: [
        "Single-product accounts in the segment under-responded — there is no relationship to anchor to, so the conditional rate has nothing to bind, and that slice still needs the flat minimum-effective reprice.",
      ],
      nextMove: { verdict: "Promoted to full rollout", tone: "ok", rationale: "NII retained inside CI, margin floor + no-overpay held, +$10.8M over a blanket match. Relationship-rate (v2) routes the multi-product base; minimum-effective (v1) handles the single-product tail." },
    },
  },
];

export default B2B_DEPLOY_HISTORY;
