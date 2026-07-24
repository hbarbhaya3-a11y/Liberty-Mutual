/* ============================================================================
   Affluent / Wealth Attach · Sense-stage assets for WealthAnalyzeView.

   Sibling to liquiditySensedAssets.js (does NOT modify it). 7 entries:
     · 3 data streams     (wlth-1 .. wlth-3)
     · 2 detection models (wlth-4, wlth-5)
     · 2 guardrail models (wlth-6, wlth-7)

   Numbers are consistent with wealthConfig.js: 18,400 flagged,
   ~6,200 advice-ready after a 0.55 suitability gate, $1.1B held outside.
   ========================================================================= */

const wealthSensedAssets = [
  // ─── DATA STREAMS ───
  {
    id: 'wlth-1',
    group: 'data',
    name: 'Core banking relationship + balance ledger',
    subtitle: 'Surplus balances + product depth',
    quickNumbers: '18.4K flagged · no wealth product',
    informs: 'wealth gap + surplus-liquidity depth',
    drillDownLight: {
      provenance: {
        owner: 'Core Banking · Data Engineering',
        refresh: 'streaming · sub-second latency',
        validated: '✓ MRM-approved · daily reconciliation',
        qualityOrCoverage: 'coverage 100% of consumer book · 18-mo balance history',
      },
      forThisSignal: [
        { label: 'Mass-affluent flagged',         value: '18,400 (no US Bank wealth relationship)' },
        { label: 'Investable assets held outside', value: '$1.1B (≈$60K median held-away)' },
        { label: 'Surplus balance held 90d+',      value: '3.8K with sustained surplus signal' },
        { label: 'Multi-product banking depth',    value: '4.4K hold 3+ banking products' },
      ],
      compositionChain: {
        feedsInto: ['Advice-readiness model', 'Estimated-investable-assets model', 'Suitability gate'],
        fedBy: ['Posting ledger', 'Savings/DDA balance feed', 'Product-holding registry'],
      },
    },
  },
  {
    id: 'wlth-2',
    group: 'data',
    name: 'Money-movement external-transfer feed',
    subtitle: 'Transfers to outside investment platforms',
    quickNumbers: '1.9K movers · transfers firing',
    informs: 'external-movement onset + flight-intent pressure',
    drillDownLight: {
      provenance: {
        owner: 'Payments · Money-Movement Analytics',
        refresh: 'event-driven · 5-minute batch',
        validated: '✓ MRM-approved',
        qualityOrCoverage: 'ACH / wire / RTP coverage 100% · brokerage-destination tagging',
      },
      forThisSignal: [
        { label: 'Households moving assets out', value: '1,900 · first-ever brokerage transfers' },
        { label: 'Median outbound transfer',     value: '$38K to an external platform' },
        { label: 'Aggregator-login surge',       value: 'rising ahead of the first transfer' },
        { label: 'External pull on cohort',      value: '$1.1B held-away being courted' },
      ],
      compositionChain: {
        feedsInto: ['External-movement / flight model', 'High-AUM-mover classifier'],
        fedBy: ['ACH/wire/RTP monitor', 'Brokerage-destination tags', 'Aggregator-login monitor'],
      },
    },
  },
  {
    id: 'wlth-3',
    group: 'data',
    name: 'Digital-intent content stream',
    subtitle: 'Retirement / investing engagement',
    quickNumbers: '2.6K engaged · investing content',
    informs: 'advice-readiness intent + escalation context',
    drillDownLight: {
      provenance: {
        owner: 'Digital · Behavioral Analytics',
        refresh: 'nightly · event-augmented',
        validated: '✓ MRM-approved',
        qualityOrCoverage: '2,600 content-engaged households in scope',
      },
      forThisSignal: [
        { label: 'Retirement / investing content engaged', value: '2,600 · +26% QoQ' },
        { label: 'IRA / retirement-calculator opens 7d',    value: 'avg 1.8 / active household' },
        { label: 'Escalation-ready sub-segment',            value: '~480 / month capacity' },
      ],
      compositionChain: {
        feedsInto: ['Advice-readiness model', 'Next-best wealth-motion model'],
        fedBy: ['App-telemetry event log', 'Content-engagement stream', 'Calculator-usage log'],
      },
    },
  },

  // ─── DETECTION MODELS ───
  {
    id: 'wlth-4',
    group: 'detection',
    name: 'Advice-readiness propensity model',
    subtitle: 'Stable · ≤30 injections',
    quickNumbers: 'AUC 0.88 · stable',
    informs: 'advice-readiness · primary signal qualifier',
    drillDown: {
      provenance: {
        owner: 'Quant · Wealth',
        refresh: 'weekly retraining · drift monitored',
        validated: '✓ SR 11-7 audited · model card v2.0',
        qualityOrCoverage: 'AUC 0.88 · 26 injections this cycle (gate 30)',
      },
      forThisSignal: [
        { label: 'Drift state',                    value: 'STABLE (26 inj.)' },
        { label: 'Readiness × wealth-gap precision', value: '0.83 (intent + held-away gap)' },
        { label: 'Advice-ready after gate',        value: '6.2K of 18.4K' },
        { label: 'Lead time vs first transfer',    value: '60 days' },
      ],
      visualization: 'Drift-monitor stripchart — 26 injections this cycle vs 30 gate · flat trend',
      compositionChain: {
        feedsInto: ['Advice-ready qualifier', 'Eligibility gate'],
        fedBy: ['Digital-intent content stream', 'Core balance ledger', 'Money-movement feed'],
      },
      links: ['Model card v2.0', 'MRM audit · 2026-05-12'],
    },
  },
  {
    id: 'wlth-5',
    group: 'detection',
    name: 'Estimated-investable-assets model',
    subtitle: 'Held-away asset estimator',
    quickNumbers: '$1.1B est. · AUC 0.85',
    informs: 'investable-potential sizing + high-AUM identification',
    drillDownLight: {
      provenance: {
        owner: 'Behavioral Analytics',
        refresh: 'daily',
        validated: '✓ MRM-approved',
        qualityOrCoverage: 'AUC 0.85 · 91% coverage of flagged households',
      },
      forThisSignal: [
        { label: 'Investable held outside',      value: '$1.1B (≈$60K median)' },
        { label: 'High-AUM sub-segment ($250K+)', value: '1.9K households' },
        { label: 'Avg AUM per converted (modelled)', value: '$240K' },
      ],
      compositionChain: {
        feedsInto: ['High-AUM-mover classifier', 'Value-at-stake estimator'],
        fedBy: ['Inflow / outflow ledger', 'External-transfer feed', 'Income / life-stage proxies'],
      },
    },
  },

  // ─── GUARDRAIL MODELS ───
  {
    id: 'wlth-6',
    group: 'guardrail',
    name: 'Suitability / Reg BI model',
    subtitle: 'Fair-treatment safeguard · audited',
    quickNumbers: 'AUC 0.86 · gate 0.55',
    informs: 'suitability basis for a wealth recommendation',
    drillDown: {
      provenance: {
        owner: 'Compliance Analytics',
        refresh: 'weekly · per-customer scored',
        validated: '✓ MRM-approved · Compliance signed-off',
        qualityOrCoverage: 'AUC 0.86 · audited basis · per-customer audit trail',
      },
      forThisSignal: [
        { label: 'Gate (prior shift)',           value: '0.50 → 0.55 (tightened)' },
        { label: 'Advice-ready after gate',       value: '6.2K of 18.4K flagged' },
        { label: 'False-positive guard',          value: '~1 in 5 flags are spoken-for / unsuitable' },
        { label: 'Reg BI basis audit-ready',      value: 'per-customer score logged' },
      ],
      visualization: 'Suitability-score histogram — advice-ready surplus sits above 0.55 cleanly',
      compositionChain: {
        feedsInto: ['Wealth-offer eligibility', 'Reg BI / suitability audit trail'],
        fedBy: ['Core balance ledger', 'Money-movement feed', 'Life-stage + product depth'],
      },
      links: ['Reg BI suitability policy doc', 'Suitability audit · 2026-05-30'],
    },
  },
  {
    id: 'wlth-7',
    group: 'guardrail',
    name: 'Advisor-capacity router',
    subtitle: 'Senior-FA slot enforcement',
    quickNumbers: 'slot cap live',
    informs: 'advisor routing within finite capacity',
    drillDownLight: {
      provenance: {
        owner: 'Wealth Management · Operations',
        refresh: 'daily · capacity-linked',
        validated: '✓ MRM-approved',
        qualityOrCoverage: '100% of routed households scored at decision time',
      },
      forThisSignal: [
        { label: 'Senior-FA slot cap (pilot)',   value: '600 appointments' },
        { label: 'Routing basis',                value: 'AUM × readiness × geography' },
        { label: 'Advisor utilisation at defaults', value: '76%' },
      ],
      compositionChain: {
        feedsInto: ['Per-household motion routing', 'Capacity-feasibility computation'],
        fedBy: ['FA / senior-FA roster', 'Estimated-investable-assets model', 'Suitability model'],
      },
    },
  },
];

export default wealthSensedAssets;
