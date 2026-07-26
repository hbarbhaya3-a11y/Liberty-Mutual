/* ============================================================================
   Auto Renewal Retention · Sense-stage assets for RetentionAnalyzeView.

   Sibling to sensedAssets.js (does NOT modify it). 7 entries:
     · 3 data streams     (ret-1 .. ret-3)
     · 2 detection models (ret-4, ret-5)
     · 2 guardrail models (ret-6, ret-7)
   ========================================================================= */

const retentionSensedAssets = [
  // ─── DATA STREAMS ───
  {
    id: 'ret-1',
    group: 'data',
    name: 'Renewal & premium ledger',
    subtitle: 'Policy state + rate-history events',
    quickNumbers: '4.2M · 18mo',
    informs: 'rate trajectory + coverage-reduction requests',
    drillDownLight: {
      provenance: {
        owner: 'PL QUOTE EDW · Data Engineering',
        refresh: 'streaming · sub-second latency',
        validated: '✓ MRM-approved · daily reconciliation',
        qualityOrCoverage: 'coverage 100% of auto book · 18-mo renewal history',
      },
      forThisSignal: [
        { label: 'Policy observation events',    value: '4.2M over 18 months' },
        { label: 'Renewals entering window / mo', value: '~10,500' },
        { label: 'Coverage-reduction requests',   value: '847K over 90 days' },
        { label: 'Cohort coverage',               value: '75,000 of 75,000 (100%)' },
      ],
      compositionChain: {
        feedsInto: ['Shopping-risk model', 'Engagement-decay index', 'Margin guardrail'],
        fedBy: ['PL QUOTE EDW', 'CSW endorsements', 'AM-ECLIQ policy state'],
      },
    },
  },
  {
    id: 'ret-2',
    group: 'data',
    name: 'Digital-engagement stream',
    subtitle: 'ContentSquare portal + app behavior',
    quickNumbers: 'engagement −12% · 90d',
    informs: 'engagement-decay + silent-pre-shopper detection',
    drillDownLight: {
      provenance: {
        owner: 'Customer Intelligence · ContentSquare',
        refresh: 'event-driven · 5-minute batch',
        validated: '✓ MRM-approved',
        qualityOrCoverage: '21.4M portal events / month · 100% cohort coverage',
      },
      forThisSignal: [
        { label: 'Engagement decline',           value: '−12% across cohort' },
        { label: 'Paperless-open decay flagged', value: '~18K customers' },
        { label: 'Quote-page visits 90d',        value: '~6.3K' },
        { label: 'Pre-shopping lead window',     value: '60-day lead' },
      ],
      compositionChain: {
        feedsInto: ['Engagement-decay index', 'Shopping-window detector', 'Silent-pre-shopper classifier'],
        fedBy: ['ContentSquare', 'Mercury Messaging opens', 'Customer Portal logins'],
      },
    },
  },
  {
    id: 'ret-3',
    group: 'data',
    name: 'Agent / CSW signals',
    subtitle: 'Comparion agent activity + service notes',
    quickNumbers: '3K high-value · agent-active',
    informs: 'agent save-call eligibility + relationship context',
    drillDownLight: {
      provenance: {
        owner: 'CSW · Comparion + IA',
        refresh: 'nightly · event-augmented',
        validated: '✓ MRM-approved',
        qualityOrCoverage: '3,000 high-value households in scope',
      },
      forThisSignal: [
        { label: 'High-value households in scope', value: '3,000 · avg LTV $12K+' },
        { label: 'Last agent contact gap',         value: 'avg 91 days' },
        { label: 'Active save-call queue',         value: '~420 / month capacity' },
      ],
      compositionChain: {
        feedsInto: ['Agent save outreach', 'Agent-touch ROI model'],
        fedBy: ['CSW activity log', 'Agent calendar', 'Outreach response stream'],
      },
    },
  },

  // ─── DETECTION MODELS ───
  {
    id: 'ret-4',
    group: 'detection',
    name: 'Shopping-risk classification model',
    subtitle: 'Stable · ≤30 injections',
    quickNumbers: 'AUC 0.88 · stable',
    informs: 'renewal-shopping onset · primary signal qualifier',
    drillDown: {
      provenance: {
        owner: 'Actuarial · Personal Lines',
        refresh: 'weekly retraining · drift monitored',
        validated: '✓ NAIC 24-08 audited · model card v2.1',
        qualityOrCoverage: 'AUC 0.88 · 28 injections this cycle (gate 30)',
      },
      forThisSignal: [
        { label: 'Drift state',                    value: 'STABLE (28 inj.)' },
        { label: 'Compare: raw_rate_reaction',     value: '380 injections · refused' },
        { label: 'Joint-signal precision',         value: '0.84 (quote-shop + engagement)' },
        { label: 'Eligible pool after gate',       value: '22K of 75K' },
      ],
      visualization: 'Drift-monitor stripchart — 28 injections this cycle vs 30 gate · flat trend',
      compositionChain: {
        feedsInto: ['Joint-signal qualifier', 'Eligibility gate'],
        fedBy: ['Renewal & premium ledger', 'Digital-engagement stream', 'Competitor rate-context'],
      },
      links: ['Model card v2.1', 'MRM audit · 2026-04-18'],
    },
  },
  {
    id: 'ret-5',
    group: 'detection',
    name: 'Engagement-decay index',
    subtitle: 'Pre-shopping erosion detector',
    quickNumbers: '60d lead · AUC 0.85',
    informs: 'silent-pre-shopper sub-segment identification',
    drillDownLight: {
      provenance: {
        owner: 'Customer Intelligence',
        refresh: 'daily',
        validated: '✓ MRM-approved',
        qualityOrCoverage: 'AUC 0.85 on 6-month forward window',
      },
      forThisSignal: [
        { label: 'Lead time vs shopping',          value: '60 days' },
        { label: 'Silent-pre-shopper sub-segment', value: '18K customers' },
        { label: 'Engagement weight (prior)',      value: '0.18 → 0.31 (upgraded)' },
      ],
      compositionChain: {
        feedsInto: ['Shopping-window detector', 'Silent-pre-shopper classifier'],
        fedBy: ['Digital-engagement stream', 'Mercury Messaging opens'],
      },
    },
  },

  // ─── GUARDRAIL MODELS ───
  {
    id: 'ret-6',
    group: 'guardrail',
    name: 'Elasticity-vs-loyalty model',
    subtitle: 'Fair-lending safeguard · audited',
    quickNumbers: 'AUC 0.86 · threshold 0.70',
    informs: 'fair-lending basis for differential offer',
    drillDown: {
      provenance: {
        owner: 'Compliance Analytics',
        refresh: 'weekly · per-policy scored',
        validated: '✓ MRM-approved · Compliance signed-off',
        qualityOrCoverage: 'AUC 0.86 · audited basis · per-policy audit trail',
      },
      forThisSignal: [
        { label: 'Threshold (prior shift)',      value: '0.65 → 0.70 (tightened)' },
        { label: 'Eligible after gate',          value: '22K of cohort' },
        { label: 'False-positive guard',         value: '~1 in 4 mis-flagged sticky' },
        { label: 'Fair-lending basis audit-ready', value: 'per-policy score logged' },
      ],
      visualization: 'Loyalty-score histogram — eligible cohort sits below 0.70 cleanly',
      compositionChain: {
        feedsInto: ['Differential-offer eligibility', 'Fair-lending audit trail'],
        fedBy: ['Engagement-decay index', 'Bundle depth + tenure', 'Auto-pay + product depth'],
      },
      links: ['Fair-lending basis policy doc', 'Disparate-impact audit · 2026-04-30'],
    },
  },
  {
    id: 'ret-7',
    group: 'guardrail',
    name: 'Margin guardrail + combined-ratio floor',
    subtitle: 'Offer-ceiling enforcement',
    quickNumbers: 'CR floor live',
    informs: 'retention-offer ceiling per policy',
    drillDownLight: {
      provenance: {
        owner: 'Pricing · Actuarial',
        refresh: 'daily · loss-cost linked',
        validated: '✓ MRM-approved',
        qualityOrCoverage: '100% of offer policies scored at decision time',
      },
      forThisSignal: [
        { label: 'Combined-ratio floor',       value: 'enforced per-policy' },
        { label: 'Max retention offer',        value: '$150 / policy (default)' },
        { label: 'Net annualised at defaults', value: '+$115K' },
      ],
      compositionChain: {
        feedsInto: ['Per-policy offer ceiling', 'Net-value computation'],
        fedBy: ['Loss-cost trend', 'Renewal & premium ledger', 'Elasticity model'],
      },
    },
  },
];

export default retentionSensedAssets;
