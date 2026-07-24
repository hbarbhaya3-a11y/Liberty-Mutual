/* ============================================================================
   Idle-Cash Liquidity Activation · Sense-stage assets for LiquidityAnalyzeView.

   Sibling to retentionSensedAssets.js (does NOT modify it). 7 entries:
     · 3 data streams     (liq-1 .. liq-3)
     · 2 detection models (liq-4, liq-5)
     · 2 guardrail models (liq-6, liq-7)

   Numbers are consistent with liquidityConfig.js: 388,000 flagged,
   ~20,000 actionable after a 0.55 suitability gate, ~$1.2B under test.
   ========================================================================= */

const liquiditySensedAssets = [
  // ─── DATA STREAMS ───
  {
    id: 'liq-1',
    group: 'data',
    name: 'Core-DDA idle-balance ledger',
    subtitle: 'Idle + dormant balance events',
    quickNumbers: '388K idle · 60d+',
    informs: 'idle-balance depth + dormancy progression',
    drillDownLight: {
      provenance: {
        owner: 'Core Banking · Data Engineering',
        refresh: 'streaming · sub-second latency',
        validated: '✓ MRM-approved · daily reconciliation',
        qualityOrCoverage: 'coverage 100% of consumer deposit book · 18-mo idle history',
      },
      forThisSignal: [
        { label: 'Idle balances flagged',         value: '388,000 (idle ≥ $5K, dormant 60d+)' },
        { label: 'Idle cash in scope',            value: '$9.3B (≈$24K median)' },
        { label: 'Dormancy window observed',      value: '60-90+ days untouched' },
        { label: 'Cohort coverage',               value: '388,000 of 388,000 (100%)' },
      ],
      compositionChain: {
        feedsInto: ['Suitability model', 'Idle-cash response model', 'Profitability guardrail'],
        fedBy: ['Posting ledger', 'Savings/MMA registry', 'DDA balance feed'],
      },
    },
  },
  {
    id: 'liq-2',
    group: 'data',
    name: 'Savings/MMA yield ledger',
    subtitle: 'Held-rate vs external market spread',
    quickNumbers: '~0.05% held · 4%+ mkt',
    informs: 'yield-gap exposure + flight-intent pressure',
    drillDownLight: {
      provenance: {
        owner: 'Treasury Pricing · Analytics',
        refresh: 'event-driven · 5-minute batch',
        validated: '✓ MRM-approved',
        qualityOrCoverage: 'held-rate on 100% of idle book · external rate feed daily',
      },
      forThisSignal: [
        { label: 'Avg held rate on idle cash',    value: '~0.05% APY' },
        { label: 'Best external high-yield rate', value: '4%+ APY (challenger promo)' },
        { label: 'Yield gap on cohort',           value: '≈4.0pp' },
        { label: 'Gap-exposed balances',          value: '$9.3B in scope' },
      ],
      compositionChain: {
        feedsInto: ['Rate-elasticity model', 'Idle-cash response model', 'Profitability guardrail'],
        fedBy: ['Posting ledger', 'External rate-context feed', 'Promo-intensity monitor'],
      },
    },
  },
  {
    id: 'liq-3',
    group: 'data',
    name: 'App-telemetry high-yield search log',
    subtitle: 'In-app yield-shopping activity',
    quickNumbers: '3K high-value · search-active',
    informs: 'high-yield search intent + activation-readiness context',
    drillDownLight: {
      provenance: {
        owner: 'Digital · Behavioral Analytics',
        refresh: 'nightly · event-augmented',
        validated: '✓ MRM-approved',
        qualityOrCoverage: '3,000 high-value idle holders in scope',
      },
      forThisSignal: [
        { label: 'High-value idle holders in scope', value: '3,000 · avg balance $85K+' },
        { label: 'In-app high-yield searches 7d',    value: 'avg 2.1 / active holder' },
        { label: 'Aggregator-login surge queue',     value: '~420 / month capacity' },
      ],
      compositionChain: {
        feedsInto: ['Idle-cash response model', 'Activation-readiness ROI model'],
        fedBy: ['App-telemetry event log', 'Search-query stream', 'Aggregator-login monitor'],
      },
    },
  },

  // ─── DETECTION MODELS ───
  {
    id: 'liq-4',
    group: 'detection',
    name: 'Deposit-beta / rate-elasticity model',
    subtitle: 'Stable · ≤30 injections',
    quickNumbers: 'AUC 0.88 · stable',
    informs: 'idle-flight elasticity · primary signal qualifier',
    drillDown: {
      provenance: {
        owner: 'Quant · Deposits',
        refresh: 'weekly retraining · drift monitored',
        validated: '✓ SR 11-7 audited · model card v2.1',
        qualityOrCoverage: 'AUC 0.88 · 28 injections this cycle (gate 30)',
      },
      forThisSignal: [
        { label: 'Drift state',                   value: 'STABLE (28 inj.)' },
        { label: 'Compare: promo_chasing_drift',  value: '380 injections · refused' },
        { label: 'Yield-gap × outbound precision', value: '0.84 (gap + ACH-out pull)' },
        { label: 'Rate-elastic signal pool',      value: '75K of 388K' },
      ],
      visualization: 'Drift-monitor stripchart — 28 injections this cycle vs 30 gate · flat trend',
      compositionChain: {
        feedsInto: ['Idle-flight qualifier', 'Eligibility gate'],
        fedBy: ['Savings/MMA yield ledger', 'Core-DDA idle-balance ledger', 'External rate-context'],
      },
      links: ['Model card v2.1', 'MRM audit · 2026-04-18'],
    },
  },
  {
    id: 'liq-5',
    group: 'detection',
    name: 'Idle-cash response model',
    subtitle: 'Dormancy-progression detector',
    quickNumbers: '60d lead · AUC 0.85',
    informs: 'idle-flight onset sub-segment identification',
    drillDownLight: {
      provenance: {
        owner: 'Behavioral Analytics',
        refresh: 'daily',
        validated: '✓ MRM-approved',
        qualityOrCoverage: 'AUC 0.85 on 6-month forward window',
      },
      forThisSignal: [
        { label: 'Lead time vs first outbound pull', value: '60 days' },
        { label: 'Active-search sub-segment',         value: '18K customers' },
        { label: 'Search-intent weight (prior)',      value: '0.18 → 0.31 (upgraded)' },
      ],
      compositionChain: {
        feedsInto: ['High-yield search detector', 'Idle-flight onset classifier'],
        fedBy: ['App-telemetry high-yield search log', 'Outbound ACH/wire monitor'],
      },
    },
  },

  // ─── GUARDRAIL MODELS ───
  {
    id: 'liq-6',
    group: 'guardrail',
    name: 'Suitability-scoring model',
    subtitle: 'Suitability safeguard · audited',
    quickNumbers: 'AUC 0.86 · gate 0.55',
    informs: 'suitability basis for term-product offer',
    drillDown: {
      provenance: {
        owner: 'Compliance Analytics',
        refresh: 'weekly · per-customer scored',
        validated: '✓ MRM-approved · Compliance signed-off',
        qualityOrCoverage: 'AUC 0.86 · audited basis · per-customer audit trail',
      },
      forThisSignal: [
        { label: 'Gate (prior shift)',         value: '0.50 → 0.55 (tightened)' },
        { label: 'Actionable after gate',      value: '20K of 388K flagged' },
        { label: 'False-positive guard',       value: '~1 in 4 idle flags are buffers' },
        { label: 'Suitability basis audit-ready', value: 'per-customer score logged' },
      ],
      visualization: 'Suitability-score histogram — activatable surplus sits above 0.55 cleanly',
      compositionChain: {
        feedsInto: ['Term-product offer eligibility', 'Suitability audit trail'],
        fedBy: ['Core-DDA idle-balance ledger', 'Outbound ACH/wire monitor', 'Tenure + product depth'],
      },
      links: ['Suitability-basis policy doc', 'Suitability audit · 2026-04-30'],
    },
  },
  {
    id: 'liq-7',
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
        { label: 'Max offer ceiling',          value: '20bps above current (default)' },
        { label: 'Net annualised at defaults', value: '+$412K' },
      ],
      compositionChain: {
        feedsInto: ['Per-customer offer ceiling', 'Net-value computation'],
        fedBy: ['Funds-transfer price', 'Savings/MMA yield ledger', 'Suitability model'],
      },
    },
  },
];

export default liquiditySensedAssets;
