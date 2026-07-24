// Sense stage · 12 composed assets revealed in 3 chapters.
// Source: GIG_FLOW_PLAN.md Sections 6.3.1, 6.3.2, 6.3.3
//
// Groups:
//   - data       (4 streams)
//   - detection  (6 detection / context models)
//   - guardrail  (2 guardrail / predictive models)
//
// Drill-down depth:
//   - 4 heroes (#5, #6, #11, #12) carry full 5-block `drillDown`.
//   - 8 others carry lighter 3-block `drillDownLight`
//     (provenance + forThisSignal + compositionChain).

const sensedAssets = [
  // ─────────────────────────── DATA STREAMS (4) ───────────────────────────
  {
    id: 1,
    group: 'data',
    name: 'Transaction history',
    subtitle: 'Core money-movement events',
    quickNumbers: '21.7M · 24mo',
    informs: 'failure log + counterparty patterns',
    drillDownLight: {
      provenance: {
        owner: 'Core Banking · Data Engineering',
        refresh: 'streaming · sub-second latency',
        validated: '✓ MRM-approved · daily reconciliation',
        qualityOrCoverage: 'coverage 100% of consumer book · 24-mo retention',
      },
      forThisSignal: [
        { label: 'Events ingested', value: '21.7M over 24 months' },
        { label: 'Rent-day failures observed', value: '236,000 last 12 mo' },
        { label: 'Counterparty token quality', value: '99.2% match rate' },
        { label: 'Cohort coverage', value: '200,000 of 200,000 (100%)' },
      ],
      compositionChain: {
        feedsInto: [
          'Recurring-obligation detector',
          'Counterparty network',
          'Cash-flow stability model',
        ],
        fedBy: ['Card auth stream', 'Zelle/ACH/Wire rails', 'Posting ledger'],
      },
    },
  },

  {
    id: 2,
    group: 'data',
    name: 'Counterparty network',
    subtitle: 'Tokenized payees',
    quickNumbers: 'landlord · employer · family',
    informs: '22-mo recurring landlord pattern',
    drillDownLight: {
      provenance: {
        owner: 'Behavioral Analytics',
        refresh: 'nightly graph refresh · event-driven edges',
        validated: '✓ MRM-approved · PII-tokenized',
        qualityOrCoverage: '24.3M tokenized counterparties · graph density 0.42',
      },
      forThisSignal: [
        { label: 'Verified landlords identified', value: '142,000 of 200,000' },
        { label: 'Median tenure with landlord', value: '22 months' },
        { label: 'Tokenization audit', value: 'ECOA + GLBA reviewed' },
        { label: 'Network depth', value: '3-hop reciprocity available' },
      ],
      compositionChain: {
        feedsInto: [
          'Recurring-obligation detector',
          'Counterparty trust scoring',
          'Channel-propensity model',
        ],
        fedBy: ['Transaction history', 'Bill-pay registry', 'Zelle directory'],
      },
    },
  },

  {
    id: 3,
    group: 'data',
    name: 'Contact center logs',
    subtitle: 'Call reasons + trend',
    quickNumbers: '+11% QoQ',
    informs: 'declined-limit reason code rising',
    drillDownLight: {
      provenance: {
        owner: 'Customer Experience Analytics',
        refresh: 'hourly · NLP-tagged at intake',
        validated: '✓ MRM-approved · agent-tag audited quarterly',
        qualityOrCoverage: 'tagging precision 0.93 · 100% of inbound calls',
      },
      forThisSignal: [
        { label: 'Declined-limit call volume', value: '+11% QoQ' },
        { label: 'Calls from cohort', value: '1,420 last quarter' },
        { label: 'Avg handle time', value: '6m 14s (above book avg)' },
        { label: 'Sentiment trend', value: '-0.18 (frustration rising)' },
      ],
      compositionChain: {
        feedsInto: [
          'Life-event triggers',
          'Friction concentration analysis',
          'Complaint-spike rollback trigger',
        ],
        fedBy: ['IVR routing', 'Agent-desktop CRM', 'Voice analytics'],
      },
    },
  },

  {
    id: 4,
    group: 'data',
    name: 'Income / cash-flow',
    subtitle: 'Gig platform inflows',
    quickNumbers: 'Uber · DoorDash · Instacart · Upwork',
    informs: 'fortnightly multi-platform cadence',
    drillDownLight: {
      provenance: {
        owner: 'Retail Analytics',
        refresh: 'event-driven on each ACH/RTP credit',
        validated: '✓ MRM-approved · employer-tagger audited',
        qualityOrCoverage: 'coverage 88% of cohort · 90-day forward horizon',
      },
      forThisSignal: [
        { label: 'Platforms recognized', value: '14 (Uber, DoorDash, Instacart, Upwork, etc.)' },
        { label: 'Median platforms per customer', value: '2.3' },
        { label: 'Cadence detected', value: 'fortnightly (78% of cohort)' },
        { label: 'Income stability', value: 'CV 0.22 — moderately regular' },
      ],
      compositionChain: {
        feedsInto: [
          'Cash-flow stability model',
          'Velocity-fraud separator',
          '7-cell customer segmentation (refresh signal)',
        ],
        fedBy: ['ACH credit stream', 'RTP credit stream', 'Employer registry'],
      },
    },
  },

  // ─────────────────── DETECTION + CONTEXT MODELS (6) ───────────────────

  // HERO #1 · Recurring-obligation detector
  {
    id: 5,
    group: 'detection',
    name: 'Recurring-obligation detector',
    subtitle: 'Verified-counterparty cadence detector',
    quickNumbers: 'precision 0.97 · cov 94%',
    informs: '22-mo landlord pattern, recurrence 0.81',
    drillDown: {
      provenance: {
        owner: 'Behavioral Analytics',
        refresh: 'real-time event-driven re-scoring',
        validated: '✓ MRM-approved · semiannual review',
        qualityOrCoverage: 'precision 0.97 · coverage 94%',
      },
      forThisSignal: [
        { label: 'Pattern detected', value: '22-mo landlord rent-day pattern' },
        { label: 'Recurrence score', value: '0.81 (high)' },
        { label: 'Cohort matches', value: '142,000 of 200,000 (71% have ≥1 verified obligation)' },
        { label: 'Active for', value: 'landlord, utility, family, employer counterparties' },
      ],
      visualization: {
        type: 'distribution',
        data: {
          title: 'Distribution of recurrence scores in cohort',
          buckets: [
            { label: '0.9-1.0', share: 39 },
            { label: '0.7-0.9', share: 26, marker: 'threshold-above' },
            { label: '0.5-0.7', share: 17 },
            { label: '0.3-0.5', share: 11 },
            { label: '<0.3', share: 7 },
          ],
          marker: {
            value: 0.81,
            label: '≥0.81 threshold → 65% qualify for trust gate',
          },
        },
      },
      compositionChain: {
        feedsInto: [
          'Counterparty trust scoring',
          'Channel-propensity model',
          'Trust gate lever',
        ],
        fedBy: ['Transaction history', 'Counterparty network'],
      },
      links: [
        { label: 'Open in model registry', href: '#/registry/recurring-obligation-detector' },
        { label: 'Audit log', href: '#/audit/recurring-obligation-detector' },
      ],
    },
  },

  // HERO #2 · 7-cell customer segmentation
  {
    id: 6,
    group: 'detection',
    name: '7-cell customer segmentation',
    subtitle: 'Age × investable assets grid · 7 predefined business segments',
    quickNumbers: '7 cells',
    informs: 'Cell 5 (Mass-Affluent 35-50) → 200,000 in scope',
    drillDown: {
      provenance: {
        owner: 'Retail Analytics',
        refresh: 'monthly reclassification',
        validated: '✓ MRM-approved · annual review',
        qualityOrCoverage: 'coverage 99.6% of consumer book',
      },
      forThisSignal: [
        { label: 'Cell match', value: 'Cell 5 · Mass-Affluent · 35-50' },
        { label: 'Match size', value: '200,000 high-velocity gig (subset of cell)' },
        { label: '% of cell', value: '11.4% of 1,754,000 total in Cell 5' },
        { label: 'Cohort concentration', value: '100% in Cell 5 — clean cohort scope' },
      ],
      visualization: {
        type: 'grid',
        data: {
          title: 'The 7-cell grid',
          cols: ['<100K', '100-500K', '500K+'],
          rows: ['18-34', '35-50', '50+'],
          cells: [
            [
              { label: 'Cell 1' },
              { label: 'Cell 2' },
              { label: 'Cell 3' },
            ],
            [
              { label: 'Cell 4' },
              { label: 'Cell 5', marker: 'cohort-here' },
              { label: 'Cell 6' },
            ],
            [
              { label: 'Cell 7' },
              { label: '—' },
              { label: '—' },
            ],
          ],
          cohortDistribution: [
            { cell: 'Cell 5', count: 200000, marker: 'cohort-here' },
            { cell: 'Other', count: 0 },
          ],
        },
      },
      compositionChain: {
        feedsInto: ['Cohort scope for every downstream lever'],
        fedBy: ['Account demographics', 'Balance feed'],
      },
      links: [
        { label: 'Open in model registry', href: '#/registry/seven-cell-segmentation' },
        { label: 'See cell definitions', href: '#/docs/seven-cell-definitions' },
      ],
    },
  },

  {
    id: 7,
    group: 'detection',
    name: 'Life-event triggers',
    subtitle: 'Payout, rent, life-stage cadence detection',
    quickNumbers: '4 trigger types',
    informs: 'Fri 4-8 PM payout window detected',
    drillDownLight: {
      provenance: {
        owner: 'Behavioral Analytics',
        refresh: 'real-time event firing',
        validated: '✓ MRM-approved · precision audited quarterly',
        qualityOrCoverage: 'precision 0.91 · 4 trigger families in production',
      },
      forThisSignal: [
        { label: 'Active triggers for cohort', value: 'payout-day, rent-debit, paycheck-gap, platform-onboard' },
        { label: 'Payout window detected', value: 'Friday 4-8 PM (gig platforms)' },
        { label: 'Coverage of cohort', value: '194,000 of 200,000 (97%)' },
        { label: 'Latency p95', value: '420ms from event to trigger' },
      ],
      compositionChain: {
        feedsInto: [
          'Comms timing lever (pre-payout)',
          'Friction concentration analysis',
          'Auto-rollback monitoring',
        ],
        fedBy: ['Income / cash-flow', 'Transaction history', 'Recurring-obligation detector'],
      },
    },
  },

  {
    id: 8,
    group: 'detection',
    name: 'Channel-propensity model',
    subtitle: 'Predicts rail for an obligation',
    quickNumbers: 'AUC 0.88',
    informs: 'Zelle is the natural rail for 73% of cohort',
    drillDownLight: {
      provenance: {
        owner: 'Behavioral Analytics',
        refresh: 'weekly retrain · nightly score refresh',
        validated: '✓ MRM-approved · AUC 0.88 holdout',
        qualityOrCoverage: 'coverage 96% of obligations · calibration drift checked weekly',
      },
      forThisSignal: [
        { label: 'Predicted rail for rent', value: 'Zelle for 73% of cohort' },
        { label: 'ACH preference', value: '18% (usually older tenure)' },
        { label: 'Wire/RTP preference', value: '<1% combined' },
        { label: 'Model lift over base', value: '2.4× vs prior-rail baseline' },
      ],
      compositionChain: {
        feedsInto: ['Rails selection lever', 'Comms channel mix'],
        fedBy: ['Transaction history', 'Counterparty network', 'Recurring-obligation detector'],
      },
    },
  },

  {
    id: 9,
    group: 'detection',
    name: 'Velocity-fraud separator',
    subtitle: 'Distinguishes benign vs fraud velocity',
    quickNumbers: 'AUC 0.95 · FPR 0.6%',
    informs: 'benign multi-platform income confirmed',
    drillDownLight: {
      provenance: {
        owner: 'Risk Analytics · Fraud',
        refresh: 'real-time scoring per inbound credit',
        validated: '✓ MRM-approved · BSA/AML reviewed semiannually',
        qualityOrCoverage: 'AUC 0.95 · FPR 0.6% at production threshold',
      },
      forThisSignal: [
        { label: 'Cohort flagged as fraud-velocity', value: '0.4% (800 of 200,000)' },
        { label: 'Verdict for cohort', value: 'benign multi-platform gig income' },
        { label: 'False-positive rate', value: '0.6% at chosen threshold' },
        { label: 'Why benign', value: 'platform-employer signatures + cadence regularity' },
      ],
      compositionChain: {
        feedsInto: ['Fraud guardrail in policy review', 'Ceiling-lift safety'],
        fedBy: ['Income / cash-flow', 'Transaction history', 'Device + session telemetry'],
      },
    },
  },

  {
    id: 10,
    group: 'detection',
    name: 'Cash-flow stability model',
    subtitle: 'Income regularity & runway score',
    quickNumbers: 'coverage 88% · 90d horizon',
    informs: 'stability 0.78 — solid runway',
    drillDownLight: {
      provenance: {
        owner: 'Risk Analytics',
        refresh: 'nightly score · weekly retrain',
        validated: '✓ MRM-approved · annual model card',
        qualityOrCoverage: 'coverage 88% of cohort · 90-day forecast horizon',
      },
      forThisSignal: [
        { label: 'Median stability score', value: '0.78 (solid runway)' },
        { label: '90-day shortfall risk', value: '7.2% of cohort' },
        { label: 'Income CV', value: '0.22 (moderately regular)' },
        { label: 'Buffer median', value: '$840 (covers ~6 days of avg spend)' },
      ],
      compositionChain: {
        feedsInto: [
          'Suitability matrix (deepening)',
          'Auto-rollback if stability degrades',
        ],
        fedBy: ['Income / cash-flow', 'Transaction history', 'Account balances'],
      },
    },
  },

  // ─────────────────── GUARDRAIL + PREDICTIVE MODELS (2) ───────────────────

  // HERO #3 · Counterparty trust scoring
  {
    id: 11,
    group: 'guardrail',
    name: 'Counterparty trust scoring',
    subtitle: 'Tenure + recurrence + reciprocity composite · AUC 0.91 · audited',
    quickNumbers: 'AUC 0.91 · audited',
    informs: '65% of cohort scores ≥ 0.81 — gate feasible',
    drillDown: {
      provenance: {
        owner: 'Risk Analytics',
        refresh: 'real-time recompute on event · weekly retrain',
        validated: '✓ MRM-approved · ECOA-compliant · last train 2025-Q4',
        qualityOrCoverage: 'Features: observable only — NO protected attributes',
      },
      forThisSignal: [
        { label: 'Cohort trust above 0.81', value: '65% (130,000 of 200,000)' },
        { label: 'At trust gate ≥18mo', value: 'these are the eligible' },
        { label: 'Thin-file accessibility', value: '✓ pattern-based, not attribute-based' },
        { label: 'Audit cadence', value: 'quarterly Compliance Council review' },
      ],
      visualization: {
        type: 'components',
        data: {
          title: 'Scoring components & cohort distribution',
          components: [
            { name: 'Recurrence (months observed)', weight: 0.35 },
            { name: 'Tenure with counterparty', weight: 0.25 },
            { name: 'Reciprocity (return flow)', weight: 0.20 },
            { name: 'Dispute / chargeback history', weight: 0.20 },
          ],
          distribution: [
            { label: '0.9-1.0', share: 45 },
            { label: '0.8-0.9', share: 20, marker: 'trust-gate-threshold' },
            { label: '0.6-0.8', share: 17 },
            { label: '0.4-0.6', share: 11 },
            { label: '<0.4', share: 7 },
          ],
        },
      },
      compositionChain: {
        feedsInto: [
          'Trust-gate lever (sets threshold)',
          'Fair-lending guardrail (proof of attribute-free scoring)',
        ],
        fedBy: ['Counterparty network', 'Transaction history'],
      },
      links: [
        { label: 'Open model card', href: '#/registry/counterparty-trust-scoring' },
        { label: 'Audit log', href: '#/audit/counterparty-trust-scoring' },
        { label: 'ECOA brief', href: '#/docs/ecoa-brief-counterparty-trust' },
      ],
    },
  },

  // HERO #4 · Disparate-impact screener
  {
    id: 12,
    group: 'guardrail',
    name: 'Disparate-impact screener',
    subtitle: 'Fair-lending pre-screen on proposed policies · ECOA-compliant',
    quickNumbers: 'ECOA-compliant',
    informs: 'thin-file 1.6× → trust gate mandatory',
    drillDown: {
      provenance: {
        owner: 'Compliance + Risk Analytics (joint)',
        refresh: 'on every policy proposal',
        validated: '✓ ECOA-compliant · 4/5 rule benchmark',
        qualityOrCoverage: 'audit: quarterly review by Compliance Council',
      },
      forThisSignal: [
        { label: 'Group ratio today', value: '0.89 (thin-file vs verified)' },
        { label: 'Under proposed +20% lift, no gate', value: 'drops to 0.79 — FAILS 4/5 rule' },
        { label: 'With +20% lift + 18mo trust gate', value: 'rises to 0.94 — passes safely' },
        { label: 'Implication', value: 'The trust gate IS the fairness mechanic' },
      ],
      visualization: {
        type: 'distribution',
        data: {
          title: 'DI ratio by policy configuration',
          buckets: [
            { label: 'No lift', share: 0.89, marker: 'pass' },
            { label: 'Lift, no gate', share: 0.79, marker: 'fail' },
            { label: 'Lift, 12mo gate', share: 0.85, marker: 'pass' },
            { label: 'Lift, 18mo gate', share: 0.94, marker: 'pass-recommended' },
            { label: 'Lift, 24mo gate', share: 0.96, marker: 'pass-but-narrows-pool' },
          ],
          marker: {
            value: 0.80,
            label: '4/5 rule line (0.80)',
          },
        },
      },
      compositionChain: {
        feedsInto: [
          'Fairness floor lever',
          'Auto-rollback trigger (if DI drops during pilot)',
        ],
        fedBy: ['Counterparty trust scoring', 'Cohort demographics'],
      },
      links: [
        { label: 'Open in compliance registry', href: '#/compliance/di-screener' },
        { label: 'Read 4/5 rule explainer', href: '#/docs/four-fifths-rule' },
      ],
    },
  },
];

export default sensedAssets;
