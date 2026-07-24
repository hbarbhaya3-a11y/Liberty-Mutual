/* ============================================================================
   Deposit Retention · Sense-stage assets for RetentionAnalyzeView.

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
    name: 'Deposit-flow ledger',
    subtitle: 'Balance + ACH movement events',
    quickNumbers: '4.2M · 18mo',
    informs: 'balance slope + outbound ACH acceleration',
    drillDownLight: {
      provenance: {
        owner: 'Core Banking · Data Engineering',
        refresh: 'streaming · sub-second latency',
        validated: '✓ MRM-approved · daily reconciliation',
        qualityOrCoverage: 'coverage 100% of mass-affluent book · 18-mo retention',
      },
      forThisSignal: [
        { label: 'Balance observation events',  value: '4.2M over 18 months' },
        { label: 'Balance-decline events / mo',  value: '~10,500' },
        { label: 'Outbound ACH events flagged',  value: '847K over 90 days' },
        { label: 'Cohort coverage',              value: '75,000 of 75,000 (100%)' },
      ],
      compositionChain: {
        feedsInto: ['Drift-classification model', 'Primacy index', 'Profitability guardrail'],
        fedBy: ['Posting ledger', 'ACH rails', 'Direct-deposit registry'],
      },
    },
  },
  {
    id: 'ret-2',
    group: 'data',
    name: 'DDA-activity stream',
    subtitle: 'Operating-account transaction counts',
    quickNumbers: 'DDA −12% · 90d',
    informs: 'primacy-index erosion + operating-decliner detection',
    drillDownLight: {
      provenance: {
        owner: 'Behavioral Analytics',
        refresh: 'event-driven · 5-minute batch',
        validated: '✓ MRM-approved',
        qualityOrCoverage: '21.4M DDA events / month · 100% cohort coverage',
      },
      forThisSignal: [
        { label: 'DDA activity decline',         value: '−12% across cohort' },
        { label: 'Direct-deposit decay flagged', value: '~18K customers' },
        { label: 'Bill-pay deactivations 90d',   value: '~6.3K' },
        { label: 'Primacy-index window',         value: '60-day lead' },
      ],
      compositionChain: {
        feedsInto: ['Primacy index', 'Direct-deposit decay detector', 'Operating-decliner classifier'],
        fedBy: ['Posting ledger', 'Bill-pay registry', 'Payroll-inflow stream'],
      },
    },
  },
  {
    id: 'ret-3',
    group: 'data',
    name: 'RM-CRM signals',
    subtitle: 'Banker relationship activity + notes',
    quickNumbers: '3K high-value · RM-active',
    informs: 'banker save outreach eligibility + relationship context',
    drillDownLight: {
      provenance: {
        owner: 'CRM · Wealth + Premier',
        refresh: 'nightly · event-augmented',
        validated: '✓ MRM-approved',
        qualityOrCoverage: '3,000 high-value relationships in scope',
      },
      forThisSignal: [
        { label: 'High-value customers in scope', value: '3,000 · avg balance $85K+' },
        { label: 'Last RM contact gap',           value: 'avg 91 days' },
        { label: 'Active liquidity-review queue', value: '~420 / month capacity' },
      ],
      compositionChain: {
        feedsInto: ['Banker save outreach', 'RM-touch ROI model'],
        fedBy: ['CRM activity log', 'RM calendar', 'Outreach response stream'],
      },
    },
  },

  // ─── DETECTION MODELS ───
  {
    id: 'ret-4',
    group: 'detection',
    name: 'Drift-classification model',
    subtitle: 'Stable · ≤30 injections',
    quickNumbers: 'AUC 0.88 · stable',
    informs: 'deposit-drift onset · primary signal qualifier',
    drillDown: {
      provenance: {
        owner: 'Quant · Deposits',
        refresh: 'weekly retraining · drift monitored',
        validated: '✓ SR 11-7 audited · model card v2.1',
        qualityOrCoverage: 'AUC 0.88 · 28 injections this cycle (gate 30)',
      },
      forThisSignal: [
        { label: 'Drift state',                   value: 'STABLE (28 inj.)' },
        { label: 'Compare: rate_sensitive_drift', value: '380 injections · refused' },
        { label: 'Joint-signal precision',        value: '0.84 (balance + ACH out)' },
        { label: 'Eligible pool after gate',      value: '22K of 75K' },
      ],
      visualization: 'Drift-monitor stripchart — 28 injections this cycle vs 30 gate · flat trend',
      compositionChain: {
        feedsInto: ['Joint-signal qualifier', 'Eligibility gate'],
        fedBy: ['Deposit-flow ledger', 'DDA-activity stream', 'External rate-context'],
      },
      links: ['Model card v2.1', 'MRM audit · 2026-04-18'],
    },
  },
  {
    id: 'ret-5',
    group: 'detection',
    name: 'Operating-balance primacy index',
    subtitle: 'Primacy erosion detector',
    quickNumbers: '60d lead · AUC 0.85',
    informs: 'operating-decliner sub-segment identification',
    drillDownLight: {
      provenance: {
        owner: 'Behavioral Analytics',
        refresh: 'daily',
        validated: '✓ MRM-approved',
        qualityOrCoverage: 'AUC 0.85 on 6-month forward window',
      },
      forThisSignal: [
        { label: 'Lead time vs rate-shopping',    value: '60 days' },
        { label: 'Operating-decliner sub-segment', value: '18K customers' },
        { label: 'DD-decay weight (prior)',        value: '0.18 → 0.31 (upgraded)' },
      ],
      compositionChain: {
        feedsInto: ['Direct-deposit decay detector', 'Operating-decliner classifier'],
        fedBy: ['DDA-activity stream', 'Payroll-inflow stream'],
      },
    },
  },

  // ─── GUARDRAIL MODELS ───
  {
    id: 'ret-6',
    group: 'guardrail',
    name: 'Stickiness-vs-elasticity model',
    subtitle: 'UDAAP safeguard · audited',
    quickNumbers: 'AUC 0.86 · threshold 0.70',
    informs: 'UDAAP basis for differential offer',
    drillDown: {
      provenance: {
        owner: 'Compliance Analytics',
        refresh: 'weekly · per-customer scored',
        validated: '✓ MRM-approved · Compliance signed-off',
        qualityOrCoverage: 'AUC 0.86 · audited basis · per-customer audit trail',
      },
      forThisSignal: [
        { label: 'Threshold (prior shift)',  value: '0.65 → 0.70 (tightened)' },
        { label: 'Eligible after gate',      value: '22K of cohort' },
        { label: 'False-positive guard',     value: '~1 in 4 mis-flagged protected' },
        { label: 'UDAAP basis audit-ready',  value: 'per-customer score logged' },
      ],
      visualization: 'Stickiness-score histogram — eligible cohort sits below 0.70 cleanly',
      compositionChain: {
        feedsInto: ['Differential-offer eligibility', 'UDAAP audit trail'],
        fedBy: ['Operating-balance primacy index', 'Payroll-inflow signal', 'Tenure + product depth'],
      },
      links: ['UDAAP-basis policy doc', 'Stickiness audit · 2026-04-30'],
    },
  },
  {
    id: 'ret-7',
    group: 'guardrail',
    name: 'Profitability guardrail + RAROC floor',
    subtitle: 'Offer-ceiling enforcement',
    quickNumbers: 'RAROC floor live',
    informs: 'offer rate ceiling per customer',
    drillDownLight: {
      provenance: {
        owner: 'Treasury · ALM',
        refresh: 'daily · funds-transfer-price linked',
        validated: '✓ MRM-approved',
        qualityOrCoverage: '100% of offer customers scored at decision time',
      },
      forThisSignal: [
        { label: 'RAROC floor',                value: 'enforced per-customer' },
        { label: 'Max offer ceiling',          value: '40bps above current (default)' },
        { label: 'Net annualised at defaults', value: '+$115K' },
      ],
      compositionChain: {
        feedsInto: ['Per-customer offer ceiling', 'Net-value computation'],
        fedBy: ['Funds-transfer price', 'Deposit-flow ledger', 'Stickiness model'],
      },
    },
  },
];

export default retentionSensedAssets;
