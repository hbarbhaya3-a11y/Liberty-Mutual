/* ============================================================================
   Gig Economy theme · 3 signals shown on the Theme page.

   The story is RTP-first. The friction isn't a per-txn cap on Zelle — it's
   that RTP (the only rail that settles instantly + is final) isn't enabled
   for verified high-trust gig cohorts at the velocity their pay cycle
   requires. Customers are forced onto ACH (1-day settle) and miss
   Friday-evening recurring obligations.

   The three hypotheses target different segments within gig, each with
   a different mechanism tuned to that segment.
   ========================================================================= */

const gigSignals = [
  {
    id: 'A',
    status: { label: 'Active now', tone: 'amber', sub: 'accelerating' },
    title: 'Verified-Landlord RTP Enablement',
    statement: {
      who: '64K gig renters · ≥18-mo verified landlord pattern.',
      what: 'Gig cohort · enable RTP rail · ≥18-mo verified-history gate · +20% send-limit lift · proactive in-app + push comms.',
      why: 'Largest recurring outflow · most stable pattern · trust filter contains the fraud risk the velocity gate was protecting.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '92K',      unit: 'gig renters',           context: 'verified-recurring pattern' },
      { kind: 'gate',   label: 'Trust gate',    value: '≥18 mo',   unit: 'verified counterparty', context: 'most stable signal' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$4-7M',   unit: 'NII / yr · range',      context: 'largest cohort, highest precision' },
    ],
    recommended: { star: true, name: 'Verified-Landlord RTP Enablement' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-2026-04-12',
  },

  {
    id: 'B',
    status: { label: 'Adjacent scenario', tone: 'blue', sub: 'B2B vendor' },
    title: 'Vendor-Payment Rail Optimisation',
    statement: {
      who: '38K gig freelancers · ≥12-mo recurring B2B vendor pattern.',
      what: 'Gig + SMB cohorts · enable RTP + ACH rails · ≥12-mo verified-history gate · +20% send-limit lift · educational tone.',
      why: 'B2B vendors want certainty before releasing work · same-hour settle unlocks higher single-shipment limits and supports the gig → SMB ladder.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '50K',      unit: 'gig freelancers',        context: 'recurring B2B pattern' },
      { kind: 'gate',   label: 'Trust gate',    value: '≥12 mo',   unit: 'business pattern',       context: 'shorter cycle than rent' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$2.2-3.5M', unit: 'NII / yr · range',     context: 'enables future B2B deepening' },
    ],
    recommended: { star: false, name: 'Vendor-Payment Rail Optimisation' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-2026-05-09',
  },

  {
    id: 'C',
    status: { label: 'Adjacent scenario', tone: 'violet', sub: 'family P2P' },
    title: 'Family-P2P RTP Window',
    statement: {
      who: '42K gig customers · ≥24-mo recurring personal P2P · family support, household splits.',
      what: 'Gig cohort · enable RTP rail · ≥24-mo verified-history gate · pre-payout send timing · RM channel-mix uplift.',
      why: 'Highest counterparty tenure · lowest fraud risk · keeps the relational segment from drifting to instant-pay fintechs.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '60K',      unit: 'gig family-supporters',   context: 'recurring personal P2P' },
      { kind: 'gate',   label: 'Trust gate',    value: '≥24 mo',   unit: 'personal pattern',        context: 'highest tenure bar' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$1.5-2.6M', unit: 'NII / yr · range',      context: 'retention-focused' },
    ],
    recommended: { star: false, name: 'Family-P2P RTP Window' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-2026-05-01',
  },
];

export default gigSignals;
