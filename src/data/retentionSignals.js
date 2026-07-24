/* ============================================================================
   Deposit Retention theme · 3 signals shown on the Theme page.

   Three strategies for the deposit-drift cohort, each addressing a different
   likely reason for drift: rate sensitivity (A), weakening primacy (B), or
   high-value relationship thinness (C). Numbers aligned to the demo
   narrative — 30K customers tested, $19.3M retained at Strategy A defaults.

   All WHO rows in plain English — describe the customer, not the demo.
   ========================================================================= */

const retentionSignals = [
  {
    id: 'A',
    status: { label: 'Active now', tone: 'amber', sub: 'accelerating' },
    title: 'Defend at-risk savings',
    statement: {
      who: '30K mid-life affluent savers · deposits dropping · respond to rate offers.',
      what: 'Rate-sensitive cohort · defend the balance with the smallest targeted incentive that holds it.',
      why: 'Easiest drift cause to act on, with a fairness filter to keep it defensible.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '30K',       unit: 'eligible customers',                       context: 'after fairness filter' },
      { kind: 'gate',   label: 'Fairness gate', value: '≥0.70',     unit: 'anchored-customer filter',                 context: 'audit-defensible basis' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$15–25M',  unit: 'retained deposits / yr · est. range',      context: '−2.3pp deposit-leaving rate' },
    ],
    recommended: { star: true, name: 'Defend at-risk savings' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-14',
  },
  {
    id: 'B',
    status: { label: 'Adjacent scenario', tone: 'blue', sub: 'primacy mechanism' },
    title: 'Re-anchor the relationship',
    statement: {
      who: '22K customers · primary account weakening · direct deposit slowing · bill-pay tapering.',
      what: 'Operating-Decliner cohort · re-engage primary banking before the balance drifts — without a rate concession.',
      why: 'Catches drift ~60 days before rate-shopping starts. Cheaper than chasing with rate later.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '22K',     unit: 'customers showing primacy weakening',     context: 'before rate-shopping starts' },
      { kind: 'gate',   label: 'Trigger',       value: '60d',     unit: 'decay window',                            context: 'pre-rate-shopping intervention' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$8–14M', unit: 'retained deposits / yr · est. range',     context: 'no rate concession needed' },
    ],
    recommended: { star: false, name: 'Re-anchor the relationship' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-21',
  },
  {
    id: 'C',
    status: { label: 'Adjacent scenario', tone: 'violet', sub: 'high-value save' },
    title: 'Banker save call',
    statement: {
      who: '3K high-value customers · balance over $85K · top of the attrition-risk list.',
      what: 'High-value cohort · ≥$85K · protect the highest-risk relationships before they move.',
      why: 'Personal calls beat automated offers per dollar at this balance tier.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '3K',      unit: 'high-value customers',                 context: 'balance over $85K' },
      { kind: 'gate',   label: 'Balance',       value: '≥$85K',   unit: 'minimum balance',                      context: 'relationship economics work here' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$6–10M', unit: 'retained deposits / yr · est. range',  context: 'small cohort, high per-customer value' },
    ],
    recommended: { star: false, name: 'Banker save call' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-22',
  },
];

export default retentionSignals;
