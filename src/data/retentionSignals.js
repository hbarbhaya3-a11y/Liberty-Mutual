/* ============================================================================
   Auto Renewal Retention theme · 3 signals shown on the Theme page.

   Three strategies for the renewal-shopping cohort, each addressing a different
   likely reason for churn: price elasticity (A), engagement decay (B), or
   high-value thinness (C). Numbers aligned to the demo narrative — 550K at-risk
   customers, 220K eligible policies, $6.7M NWP protected at Strategy A defaults.

   All WHO rows in plain English — describe the customer, not the demo.
   ========================================================================= */

const retentionSignals = [
  {
    id: 'A',
    status: { label: 'Active now', tone: 'amber', sub: 'accelerating' },
    title: 'Defend at-risk renewals',
    statement: {
      who: '550K high-LTV auto customers at risk · claims-free · shopping their renewal.',
      what: 'Price-elastic cohort · hold the renewal with the smallest targeted incentive that works (capped rate + retention offer).',
      why: 'Highest-leverage churn cause to act on, with a fair-lending filter to keep it defensible.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '220K',      unit: 'eligible policies',                        context: 'after fair-lending filter' },
      { kind: 'gate',   label: 'Fairness gate', value: '≥0.70',     unit: 'sticky-bundled filter',                    context: 'audit-defensible basis' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$5–8M',    unit: 'NWP protected / yr · est. range',          context: '−2.3pp lapse rate' },
    ],
    recommended: { star: true, name: 'Defend at-risk renewals' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-14',
  },
  {
    id: 'B',
    status: { label: 'Adjacent scenario', tone: 'blue', sub: 'engagement mechanism' },
    title: 'Re-engage before shopping',
    statement: {
      who: '161K customers · digital engagement weakening · coverage questions rising · not yet shopping.',
      what: 'Silent-Pre-Shopper cohort · re-engage on value and service before the shopping window opens — without a rate concession.',
      why: 'Catches churn ~60 days before competitor quote-shopping starts. Cheaper than saving with a discount later.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '161K',    unit: 'customers showing engagement decay',      context: 'before shopping starts' },
      { kind: 'gate',   label: 'Trigger',       value: '60d',     unit: 'decay window',                            context: 'pre-shopping intervention' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$4–7M',  unit: 'NWP protected / yr · est. range',         context: 'no rate concession needed' },
    ],
    recommended: { star: false, name: 'Re-engage before shopping' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-21',
  },
  {
    id: 'C',
    status: { label: 'Adjacent scenario', tone: 'violet', sub: 'high-value save' },
    title: 'Agent save call',
    statement: {
      who: '22K high-value households · LTV over $12K · top of the shopping-risk list.',
      what: 'High-value cohort · ≥$12K LTV · protect the highest-risk relationships with a Comparion agent call + bundle offer.',
      why: 'Personal agent calls beat automated offers per dollar at this value tier.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '22K',     unit: 'high-value households',                context: 'LTV over $12K' },
      { kind: 'gate',   label: 'LTV',           value: '≥$12K',   unit: 'minimum household LTV',                context: 'relationship economics work here' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$2–4M',  unit: 'NWP protected / yr · est. range',      context: 'small cohort, high per-household value' },
    ],
    recommended: { star: false, name: 'Agent save call' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-22',
  },
];

export default retentionSignals;
