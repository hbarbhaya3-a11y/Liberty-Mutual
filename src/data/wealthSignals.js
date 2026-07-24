/* ============================================================================
   Wealth Attach theme · 3 strategy cards shown on the Theme page.

   Three ways into the SAME opportunity — the broad advice-ready cohort (A,
   recommended), the high-AUM movers whose assets are already leaving (B), and
   the digitally-curious starter cohort (C). The specific motion (portfolio
   review, senior FA, …) is NEVER named here — it is one allowed move the
   optimizer picks downstream, and only appears in the simulation output.

   All WHO rows in plain English — describe the customer, not the demo.
   ========================================================================= */

const wealthSignals = [
  {
    id: 'A',
    status: { label: 'Active now', tone: 'amber', sub: 'advice-ready' },
    title: 'Convert the advice-ready',
    statement: {
      who: '6.2K advice-ready mass-affluent households banking with us with no wealth relationship.',
      what: 'Advice-ready cohort · convert everyday banking trust into a wealth relationship at the customers who genuinely need the advice.',
      why: 'They show readiness, a clear wealth gap and existing trust — a relevant conversation converts where generic education only informs.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '6.2K',    unit: 'advice-ready households',          context: 'after suitability gate' },
      { kind: 'gate',   label: 'Fairness gate', value: 'suitability', unit: 'leave the unready alone',      context: 'fair-treatment enforced' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+267',    unit: 'new relationships / yr · est.',     context: '+$64M AUM attached' },
    ],
    recommended: { star: true, name: 'Convert the advice-ready' },
    ctaLabel: 'Test this hypothesis →',
    championHypothesis: 'H-WEALTH-2026-06-29',
  },
  {
    id: 'B',
    status: { label: 'Adjacent scenario', tone: 'blue', sub: 'transfers firing now' },
    title: 'Catch the movers',
    statement: {
      who: '~1.9K high-AUM households whose investable assets are actively transferring to an outside platform now.',
      what: 'High-AUM-mover cohort · reach them in the window before the assets commit elsewhere.',
      why: '$250K+ already in motion — the highest-conviction, most time-boxed slice of the opportunity.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '1.9K',    unit: 'high-AUM movers',                  context: 'external transfers firing' },
      { kind: 'gate',   label: 'Constraint',    value: 'capacity', unit: 'scarce senior-advisor time',      context: 'capacity-bound' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '$22M',    unit: 'AUM at stake · est.',               context: 'highest conversion / contact' },
    ],
    recommended: { star: false, name: 'Catch the movers' },
    ctaLabel: 'Test this hypothesis →',
    championHypothesis: 'H-WEALTH-2026-06-29-B',
  },
  {
    id: 'C',
    status: { label: 'Adjacent scenario', tone: 'violet', sub: 'content-engaged' },
    title: 'Nurture the digital-first',
    statement: {
      who: '~2.6K digitally-engaged planners clicking retirement and investing content in-app.',
      what: 'Digital-first cohort · meet the curiosity where it already is and escalate only the customers who lean in.',
      why: 'Low-cost reach at scale — spend an advisor only where the customer signals real intent.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '2.6K',    unit: 'digital planners',                 context: 'retirement / investing clicks' },
      { kind: 'gate',   label: 'Timing',        value: 'on-intent', unit: 'fire at the engagement signal',  context: 'engagement-triggered' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '$9M',     unit: 'AUM at stake · est.',               context: 'lowest cost to reach' },
    ],
    recommended: { star: false, name: 'Nurture the digital-first' },
    ctaLabel: 'Test this hypothesis →',
    championHypothesis: 'H-WEALTH-2026-06-29-C',
  },
];

export default wealthSignals;
