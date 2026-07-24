/* ============================================================================
   Liquidity Activation theme · 3 hypothesis cards shown on the Theme page.

   Three strategies for the idle-cash cohort, each a different route to yield:
   best-fit routing (A, recommended), a high-yield-savings migration (B), and a
   CD / ladder for stable surplus (C). Each card's CTA tests that hypothesis;
   championHypothesis routes to the matching detail page.

   All WHO rows in plain English — describe the customer, not the demo.
   ========================================================================= */

const liquiditySignals = [
  {
    id: 'A',
    status: { label: 'Active now', tone: 'amber', sub: 'idle 60d+' },
    title: 'Route idle cash to best-fit liquidity product',
    statement: {
      who: '~75K activation-ready customers with idle cash above $5K for 60+ days in low-yield accounts.',
      what: 'Route surplus cash to the most suitable product: high-yield savings, MMA, short-term CD, or CD ladder.',
      why: 'The customer has deployable liquidity, but the right product depends on balance stability, liquidity need, and conversion propensity.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',           value: '~75K',                          unit: 'activation-ready',     context: 'of 388K idle flagged' },
      { kind: 'gate',   label: 'Product path',    value: 'Savings / MMA / CD / split-balance', unit: 'best-fit per segment', context: 'routed by the optimizer' },
      { kind: 'stakes', label: 'Projected value', value: '+$3.5–5.2M',                    unit: '/ yr · est.',          context: 'NIM less rate give-up' },
    ],
    recommended: { star: true, name: 'Route idle cash to best-fit liquidity product' },
    ctaLabel: 'Test this hypothesis →',
    championHypothesis: 'H-LIQ-2026-03-12',
  },
  {
    id: 'B',
    status: { label: 'Adjacent scenario', tone: 'blue', sub: 'large idle balances' },
    title: 'Convert liquid balances to HYS / MMA',
    statement: {
      who: '~35K customers with large idle balances and likely ongoing liquidity needs.',
      what: 'Move accessible surplus cash into high-yield savings or MMA.',
      why: 'Customers can earn more while keeping liquidity, and the bank deepens the deposit relationship before balances leak externally.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',           value: '~35K',      unit: 'liquid-balance customers',     context: 'ongoing liquidity need' },
      { kind: 'gate',   label: 'Product path',    value: 'HYS / MMA', unit: 'liquid, no lock-up',           context: 'deepen before leakage' },
      { kind: 'stakes', label: 'Projected value', value: '+$1.8–2.8M', unit: '/ yr · est.',                 context: 'activated balance value' },
    ],
    recommended: { star: false, name: 'Convert liquid balances to HYS / MMA' },
    ctaLabel: 'Test this hypothesis →',
    championHypothesis: 'H-LIQ-2026-03-12-B',
  },
  {
    id: 'C',
    status: { label: 'Adjacent scenario', tone: 'violet', sub: 'stable surplus' },
    title: 'Move stable surplus cash to CD / ladder',
    statement: {
      who: '~20K customers with stable idle balances and low near-term liquidity need.',
      what: 'Offer a short-term CD or ladder for the portion of cash that appears stable and investable.',
      why: 'Stable idle cash can be converted into committed deposits, improving customer yield and strengthening balance retention.',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',           value: '~20K',        unit: 'stable-surplus customers', context: 'low near-term liquidity need' },
      { kind: 'gate',   label: 'Product path',    value: 'CD / ladder', unit: 'committed term',           context: 'investable surplus' },
      { kind: 'stakes', label: 'Projected value', value: '+$1.2–2.0M',  unit: '/ yr · est.',              context: 'committed deposits' },
    ],
    recommended: { star: false, name: 'Move stable surplus cash to CD / ladder' },
    ctaLabel: 'Test this hypothesis →',
    championHypothesis: 'H-LIQ-2026-03-12-C',
  },
];

export default liquiditySignals;
