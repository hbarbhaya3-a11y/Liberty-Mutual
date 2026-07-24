/* ============================================================================
   IF-WHAT OBJECTIVES — aligned 1:1 with the Hero (Proof) KPIs the results
   page actually surfaces. The optimizer maximizes (or minimizes) ONE primary
   objective at a time, subject to always-on guardrails (fair-lending,
   fraud, MRM). The user picks the objective in IfWhatConfig; the optimizer
   returns the top recommendations under that goal.

   Why these three: the What-If results page reports three hero outcomes —
   NII gain, payments saved (failures avoided), and complaints prevented.
   The If-What objectives need to share that vocabulary, otherwise the user
   gets a result against a goal they can't trace back to the proof strip.
   ========================================================================= */

export const CX_OBJECTIVES = [
  {
    id: 'nii-recovered',
    label: 'NII recovered',
    kind: 'max',
    unit: '$M / yr',
    hint: 'Maximize the franchise-side NII recovered from defended relationships and converted primacy. Anchored to the hero NII KPI.',
  },
  {
    id: 'payments-saved',
    label: 'Payments saved',
    kind: 'max',
    unit: 'first-try clears / qtr',
    hint: 'Maximize the volume of recurring outbound payments that clear on the first attempt instead of falling through to ACH or being blocked. Anchored to the hero Payments-Saved KPI.',
  },
  {
    id: 'complaints-prevented',
    label: 'Complaints prevented',
    kind: 'max',
    unit: 'complaints avoided / qtr',
    hint: 'Maximize the count of complaint calls avoided by removing the friction events that drive them. Anchored to the hero Complaints-Prevented KPI.',
  },
];

/* Constraints applied to EVERY optimization — not user-picked. */
export const ALWAYS_ON_CONSTRAINTS = [
  { id: 'fair-lending',   label: 'Fair-lending margin ≥ 0.85',                                   kind: 'hard' },
  { id: 'fraud-envelope', label: 'Fraud exposure within Q1 envelope',                            kind: 'hard' },
  { id: 'mrm-validity',   label: 'MRM model-card validity',                                      kind: 'hard' },
  { id: 'no-proxy',       label: 'Eligibility signal audited against protected-class proxying',  kind: 'hard' },
];
