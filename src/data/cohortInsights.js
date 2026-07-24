// Analyse stage · likelihood-weighted reasons + 4 cohort distributions
// Source: GIG_FLOW_PLAN.md Section 6.4

// Why rent-day Zelle is failing across the cohort.
// Each reason carries the downstream lever it informs.
export const REASONS = [
  {
    id: 'R1',
    title: 'Rent > static ceiling',
    likelihood: 88,
    detail: 'Rent ($1,425) exceeds the static $1,200 per-txn Zelle limit.',
    informs: 'the ceiling lift size',
  },
  {
    id: 'R2',
    title: 'Trusted landlord scored as new',
    likelihood: 81,
    detail: '22-mo paid landlord still scored as a generic counterparty.',
    informs: 'the trust gate design',
  },
  {
    id: 'R3',
    title: 'Gig velocity reads as risk',
    likelihood: 74,
    detail: 'Multi-platform inflow looks like fraud-velocity.',
    informs: 'the velocity-fraud separator',
  },
  {
    id: 'R4',
    title: 'Zelle is the only realistic rail',
    likelihood: 69,
    detail: 'ACH too slow for rent day; RTP not enabled.',
    informs: 'the rails selection',
  },
  {
    id: 'R5',
    title: 'Thin-file penalty',
    likelihood: 63,
    detail: 'Thin-file earners absorb 1.6× more failures.',
    informs: 'the fair-lending floor',
  },
];

// Verified-pattern depth (months of observed landlord recurrence).
// Three-bucket histogram.
export const VERIFIED_PATTERN_DEPTH = {
  buckets: [
    { bucket: '22+ mo', share: 65 },
    { bucket: '12-21 mo', share: 23 },
    { bucket: '<12 mo', share: 12 },
  ],
  meta: {
    informs: 'Trust gate is feasible — majority can pass',
  },
};

// Friction concentration · when failures actually happen.
export const FRICTION_CONCENTRATION = {
  windows: [
    { window: 'Fri 4-8 PM', share: 67 },
    { window: 'Other times', share: 33 },
  ],
  meta: {
    informs: 'Policy window is narrow — target Fri 4-8 PM only',
  },
};

// Rent vs $1,200 ceiling distribution. Bands are positions on the rent axis;
// `label` describes the failure severity at that band.
export const RENT_BANDS = {
  bands: [
    { band: '$1.2K', share: 8, label: 'trivial' },
    { band: '$1.4K', share: 34, label: 'major (median)' },
    { band: '$1.6K', share: 28, label: 'moderate' },
    { band: '$1.8K', share: 18, label: 'minor' },
    { band: '$2.0K+', share: 12, label: 'tail' },
  ],
  meta: {
    informs: '+20% lift ($1,440) clears 78% of failures',
  },
};

// Payout-rent timing · lag between platform payout settlement and rent debit.
export const PAYOUT_RENT_TIMING = {
  lags: [
    { lag: 'on-time', share: 4 },
    { lag: '4hr early', share: 18 },
    { lag: 'hours early', share: 25 },
    { lag: '4hr late', share: 31 },
  ],
  meta: {
    informs: 'Timing mismatch IS the underlying mechanic',
  },
};
