# Retention Journey · Execution Plan v2 (current-state)

A single-shot executable plan for the Deposit Retention journey as a **true parallel to gig** — same end-to-end user flow (Cockpit → Theme → Analyze → Simulate → Deploy → Learn), different content.

**Companion docs:**
- `RETENTION_JOURNEY_BLUEPRINT.md` — design + FINAL DECISIONS (authoritative for content/numbers/names)
- `RETENTION_EXECUTION_PLAN.md` *(this file)* — literal build sequence

**Supersedes:** v1 of this file (which deferred workspace integration — wrong, that's the primary flow).

---

## Principles

1. **Gig files: read-only.** `GigPipeline.jsx`, `gigSignals.js`, `sensedAssets.js`, `cohortInsights.js`, `themeConfigs.js`, `bundle.js` are NOT modified.
2. **Shared files: additive-only minimal.** A handful of shared workspace files need a 1-line import + 1-line early-return OR a 1-line array spread-extend.
3. **All retention content: NEW sibling files.** Each retention data concern gets its own module.
4. **Numbers + names: from blueprint FINAL DECISIONS.** Any conflict — blueprint wins.

---

## End-to-end user flow being replicated (current gig flow, verbatim)

```
1.  Lands on /                                → Shell → CockpitWorkspace (embeds <Cockpit embedded={true}/>)
2.  Clicks retention tile (row 1, beside gig) → navigate("/theme?id=retention&mode=internal")
3.  Theme page renders                         → hardcoded retention hero + <SignalsSection signals={retentionSignals}/>
4.  Clicks Signal Card A (★ Targeted Deposit Defense)
                                                → openSignalInLoop("H-RET-2026-05-14"):
                                                   selectTheme("retention")
                                                   selectHypothesis("H-RET-2026-05-14")
                                                   pushAgentEvent({kind:"good", src:"Theme", text:"Signal adopted · H-RET-2026-05-14 on retention"})
                                                   navigate("/?seed_route=analyse")
5.  Back at / → AppShell reads ?seed_route=analyse → NAVIGATE("analyse") → Shell renders AnalyzeWorkspace
6.  AnalyzeWorkspace sees selectedThemeId === "retention" → early-return <RetentionAnalyzeView/>
       - retention hero KPI ranges (· est. range)
       - 3 collapsible asset groups from retentionSensedAssets.js (data / detection / guardrail)
       - 5 retention reason cards (joint signal precision, primacy lead, stickiness gate, etc.)
       - "Test this hypothesis →" CTA → opens TestModeChooser
7.  TestModeChooser → 3 paths (If-What recommended ★, What-If, Autopilot) → nav("simulate")
8.  SimulateWorkspace sees selectedThemeId === "retention" → early-return <RetentionSimulateView/>
       - PriorAnchorPill reads MOCK_EXPERIMENTS for H-RET-2026-05-14 → finds prior pilot exp-ret-2026-0041 → shows "PRIOR · ANCHORED · stickiness threshold 0.65 → 0.70 ..."
       - Sticky config strip: cohort + UDAAP margin + Run
       - 5 lever sections: COHORT / ELIGIBILITY / OFFER / COMMUNICATIONS / PRIMACY RE-ANCHOR FOLLOW-ON (collapsed)
       - Autopilot cinematic: T+1500 auto-run → loader → results → T+3500 auto-stage → intermezzo → nav("deploy")
       - Or guided: user clicks Run → loader → Results page (verdict, 3 ProofKpi cards, guardrail strip, 2×2 outcomes grid)
       - "Stage for Deploy" → stagePolicy({themeId:"retention", experimentType:"retention", ...}) → setIntermezzo → nav("deploy")
9.  DeployWorkspace (theme-polymorphic — no code changes here, just data)
       - User's staged retention policy shows at top with JUST STAGED
       - 1 additional MOCK retention pilot in MOCK_HISTORY (Strategy A v1, completed promoted, 49 days ago)
       - Click row → ExperimentWorkflow expands → Approval → Compliance auto-screen → READY → Go Live → 9.5s LaunchingModal → Live RCT → eventual Learnings panel
10. LearnWorkspace (theme-polymorphic — no code changes here, just data)
       - retention experiment row in MOCK_EXPERIMENTS (exp-ret-2026-0041, promoted, with modelUpdates)
       - SystemicCallouts adds retention miscalibration entry
       - Per-pilot expansion shows ModelUpdatesLedger (stickiness threshold 0.65→0.70, primacy weight 0.18→0.31, rate-elasticity weight 0.42→0.28)
       - Writeback ledger 3 lines
       - These are the EXACT writebacks PriorAnchorPill in step 8 reads — closing the loop
```

This is the journey. Below is how to build it.

---

## File inventory

### NEW files (no conflict risk — 8 files)

| | File | Purpose |
|---|---|---|
| 1 | `src/data/retentionSignals.js` | 3 signal cards rendered on Theme page |
| 2 | `src/data/retentionConfig.js` | RETENTION_CONFIG + 3 archetypes (DS/OD/AS) |
| 3 | `src/data/retentionSensedAssets.js` | 7 sensed assets (3 data / 2 detection / 2 guardrail) for AnalyzeWorkspace |
| 4 | `src/data/retentionCohortInsights.js` | Reason-card mini-chart data (balance-drift, primacy-decay, stickiness-distribution) |
| 5 | `src/data/retentionDeployHistory.js` | 1 retention pilot for DeployWorkspace MOCK_HISTORY |
| 6 | `src/data/retentionLearnExperiments.js` | 1 completed retention pilot + 1 systemic miscalibration |
| 7 | `src/workspaces/RetentionAnalyzeView.jsx` | Full retention Analyze UI (mirrors AnalyzeWorkspace structure) |
| 8 | `src/workspaces/RetentionSimulateView.jsx` | Full retention Simulate UI (mirrors SimulateWorkspace structure) |

### MODIFY files (additive-only, minimal — 6 files)

| | File | Edits | Risk |
|---|---|---|---|
| 9 | `src/data/themes.js` | 3 small edits (1 INTERNAL_FORMING + 2 footprints) on top of already-done churn→retention swap | low |
| 10 | `src/pages/Theme.jsx` | 5 additive edits (import + macroFor + gotoPipeline + render branch + retention hero) | low |
| 11 | `src/pages/Cockpit.jsx` | 1 line: pinned-aware sort comparator | trivial |
| 12 | `src/workspaces/AnalyzeWorkspace.jsx` | 1 import + 1 early-return branch at top of render | trivial |
| 13 | `src/workspaces/SimulateWorkspace.jsx` | 1 import + 1 early-return branch after entry gate | trivial |
| 14 | `src/workspaces/DeployWorkspace.jsx` | 1 import + 1 spread of MOCK_HISTORY + 1 prettyTheme entry | trivial |
| 15 | `src/workspaces/LearnWorkspace.jsx` | 1 import + 1 spread of MOCK_EXPERIMENTS + 1 spread of SYSTEMIC_MISCALIBRATIONS | trivial |

### Explicitly UNTOUCHED files

- `src/data/gigSignals.js`
- `src/data/sensedAssets.js`
- `src/data/cohortInsights.js`
- `src/data/themeConfigs.js` *(retention's config lives in retentionConfig.js)*
- `src/data/bundle.js` *(retention is hero-overridden in Theme.jsx, not bundle-bound)*
- `src/pages/GigPipeline.jsx`
- `src/Shell.jsx`
- `src/state/AppShell.jsx` *(retention uses the same workspace routing — no new actions needed)*
- `src/components/CxoCompanion.jsx` *(deferred — apply when parallel session lands)*
- `src/components/TestModeChooser.jsx` *(theme-agnostic — works as-is)*
- `src/components/StagedIntermezzo.jsx` *(theme-agnostic — works as-is)*

### Deferred (Phase 6 — after parallel session lands)
- `src/components/CxoCompanion.jsx` — refusal log KB entries for retention
- `src/pages/Ceo.jsx` — DECISIONS ledger update
- `src/pages/RetentionPipeline.jsx` — parallel standalone showcase like `/gig-pipeline` (optional — workspace flow is the primary surface)

---

## STEP 1 · Finish `themes.js` edits

The churn→retention slot swap + 2 retention signals were already done (verify with `git diff`). Three more small edits remain.

### 1.1 — Add retention INTERNAL_FORMING entry

**Find:**
```js
export const INTERNAL_FORMING = [
  { nm: "Subscription-stacking fatigue", em: "recurring-debit clustering across the under-35 base", obj: "deep" },
```

**Replace with:**
```js
export const INTERNAL_FORMING = [
  { nm: "Direct-deposit decay ahead of primacy loss", em: "payroll-inflow decline detected 60 days before rate-shopping in the operating-decliner sub-segment", obj: "ret" },
  { nm: "Subscription-stacking fatigue", em: "recurring-debit clustering across the under-35 base", obj: "deep" },
```

### 1.2 — Update MACRO_THEMES `ratecut` footprint

**Find:**
```js
footprint: "Rate-sensitive mass-affluent churn"
```

**Replace with:**
```js
footprint: "Mass-affluent deposit-drift retention"
```

### 1.3 — Update MACRO_THEMES `openbank` footprint

**Find:**
```js
footprint: "Aggregator-login churn signals"
```

**Replace with:**
```js
footprint: "Aggregator-login deposit-drift signals"
```

---

## STEP 2 · Create `src/data/retentionSignals.js`

```js
/* ============================================================================
   Deposit Retention theme · 3 signals shown on the Theme page.

   Mirrors gigSignals.js schema exactly. Strategy A is starred recommended.
   All WHO rows are cohort-level. No individual customer names.

   Numbers per FINAL DECISIONS in RETENTION_JOURNEY_BLUEPRINT.md.
   ========================================================================= */

const retentionSignals = [
  {
    id: 'A',
    status: { label: 'Active now', tone: 'amber', sub: 'accelerating' },
    title: 'Targeted Deposit Defense',
    statement: {
      who: '22K rate-sensitive mass-affluent · balance decline >10% · outbound ACH >$15K/90d · stickiness-discriminator score <0.55',
      what: 'Personalised CD or MMA offer, profitability-guardrailed, delivered via app+email for mid-value and banker for high-value · 20% holdout RCT',
      why: 'Rate sensitivity is real and measurable in this sub-segment — but the stickiness discriminator confirms these balances are genuinely elastic, not operationally anchored; a targeted offer is both defensible and auditable',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '22K',      unit: 'eligible customers',        context: 'after stickiness gate' },
      { kind: 'gate',   label: 'UDAAP gate',    value: '≥0.70',    unit: 'stickiness discriminator',  context: 'auditable basis required' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$8–13M',  unit: 'retained deposits / yr · est. range', context: '−1.7pp runoff reduction' },
    ],
    recommended: { star: true, name: 'Targeted Deposit Defense' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-14',
  },
  {
    id: 'B',
    status: { label: 'Adjacent scenario', tone: 'blue', sub: 'primacy mechanism' },
    title: 'Primacy Re-Anchoring',
    statement: {
      who: '18K operating-decliners · DDA activity −12% · direct-deposit decay detected · no rate-shopping signal yet',
      what: 'Re-capture direct deposit, reactivate bill-pay and automated transfers — pull money movement back before rate sensitivity develops; no rate concession',
      why: 'Operating-account weakening precedes rate-shopping by 60 days in this sub-segment — intervening at the primacy stage is cheaper and more durable than a rate response after the fact',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '18K',     unit: 'operating-decliners',       context: 'DDA-decay + no rate signal' },
      { kind: 'gate',   label: 'Primacy gate',  value: '≥60d',    unit: 'decay window',              context: 'must precede rate-shopping' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$4–7M',  unit: 'retained deposits / yr · est. range', context: 'no offer cost' },
    ],
    recommended: { star: false, name: 'Primacy Re-Anchoring' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-21',
  },
  {
    id: 'C',
    status: { label: 'Adjacent scenario', tone: 'violet', sub: 'high-value save' },
    title: 'Banker Save Outreach',
    statement: {
      who: '3K high-value customers · avg balance >$85K · elevated attrition decile · single-product depth',
      what: 'Banker alert with RM-scripted liquidity review conversation — no automated offer; human-touch save with personalised relationship context',
      why: 'Relationship economics make the cost-to-serve ratio for a banker conversation strongly positive at this balance tier; and the highest-value sub-segment is where stickiness is most over-estimated by single signals',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '3K',      unit: 'high-value customers',      context: '>$85K avg balance' },
      { kind: 'gate',   label: 'RM gate',       value: '≥$85K',   unit: 'balance threshold',         context: 'relationship economics' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$3–5M',  unit: 'retained deposits / yr · est. range', context: 'high value · low volume' },
    ],
    recommended: { star: false, name: 'Banker Save Outreach' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-22',
  },
];

export default retentionSignals;
```

---

## STEP 3 · Create `src/data/retentionConfig.js`

```js
/* ============================================================================
   Deposit Retention · theme config + 3 archetypes (DS / OD / AS).

   Sibling to themeConfigs.js — does NOT modify it.
   Consumed by RetentionAnalyzeView and RetentionSimulateView and Theme.jsx hero.
   ========================================================================= */

export const RETENTION_HYPOTHESIS_ID = "H-RET-2026-05-14";
export const RETENTION_HYPOTHESIS_TITLE = "Targeted Deposit Defense";

export const RETENTION_CONFIG = {
  theme: "retention",
  cluster: "cluster_mass_affluent_deposit_drift",
  name: "Mass Affluent · Deposit Drift",
  objective: "ret",
  engine: "D",                 // Deepen/defend balances
  badge: "RETENTION",
  claim: "Balance decline, outbound ACH acceleration and operating-behaviour erosion are converging in the mass-affluent cohort — three joint signals that precede rate-shopping by 60 days. The stickiness discriminator separates the actionable sub-segment from the operationally-anchored majority.",
  valueLever: "Deepen/defend balances",
  buyer: "Consumer Deposits / Treasury Pricing",
  valueBridge: {
    retainedDeposits: "+$10.5M",
    spreadProtected:  "+$210K",
    runoffReduction:  "−1.7pp",
    headline:         "retained deposits + spread protected",
  },
  bindingConstraint: {
    owner: "Compliance / Legal / MRM",
    text:  "Differential deposit offers without an auditable, consistent basis are a UDAAP risk; the stickiness discriminator is the required evidence that targeted customers are genuinely elastic, not operationally-sticky balances being re-priced away from.",
  },
  teeth: ["udaap", "drift"],
  pop: 75000,
  share: 0.095,
  macro: {
    state: "Rate-cut cycle turning + 1033 open-banking switching friction falling",
    drift: false,             // STABLE — key contrast vs old churn theme
    sub: "stable — frames the deposit-drift velocity without destabilising the model",
    field: ["rate path / deposit beta", "open-banking portability acceleration", "competitor HY promo intensity", "mass-affluent behaviour shift lag"],
  },
};

export const RETENTION_PERSONAS = {
  drifting_saver:    { id: "drifting_saver",    init: "DS", nm: "Drifting Saver",    kind: "target",   tag: "rate-sensitive · 14% balance decline",  sb: "Mass-affluent saver · multi-channel deposit · outbound ACH accelerating", moment: "An $18K outbound ACH lands as part of a 6-month balance erosion pattern in this archetype's median customer. Aggregator login activity appeared 45 days prior. The stickiness discriminator scores this archetype 0.41 — genuinely elastic, not operationally anchored.", fv: [["balance slope 90d", 0.78], ["operating-balance volatility", 0.62], ["direct-deposit decay", 0.55], ["primacy index", 0.38], ["rate-elasticity score", 0.81], ["stickiness discriminator", 0.41]] },
  operating_decliner:{ id: "operating_decliner",init: "OD", nm: "Operating Decliner",kind: "target",   tag: "DDA decay · pre-rate-shopping",          sb: "Operating account weakening before rate signal appears", moment: "DDA transaction count has fallen 18% over 90 days. Direct-deposit frequency dropped from biweekly to monthly. Bill-pay deactivated on 3 recurring payees. No aggregator activity yet — this archetype is 60 days ahead of the rate-shopping window.", fv: [["balance slope 90d", 0.42], ["operating-balance volatility", 0.79], ["direct-deposit decay", 0.84], ["primacy index", 0.28], ["rate-elasticity score", 0.31], ["stickiness discriminator", 0.52]] },
  anchored_saver:    { id: "anchored_saver",    init: "AS", nm: "Anchored Saver",    kind: "falsepos",tag: "operationally sticky · FALSE POSITIVE", sb: "Looks elastic on one signal · operationally anchored balances",            moment: "Single aggregator login and a $12K outbound transfer fire a drift alert. But this archetype's operating balance funds payroll disbursements and two standing ACH instructions. Stickiness discriminator scores 0.77 — above the 0.70 gate. Offering rate here is margin given away, and pricing the operationally-anchored majority differently is a UDAAP basis failure.", fv: [["balance slope 90d", 0.51], ["operating-balance volatility", 0.31], ["direct-deposit decay", 0.22], ["primacy index", 0.74], ["rate-elasticity score", 0.44], ["stickiness discriminator", 0.77]] },
};

export const RETENTION_ARCHETYPE_ORDER = ["drifting_saver", "operating_decliner", "anchored_saver"];

/* Numerical calibration anchors for retention's simulateOutcomes() function. */
export const RETENTION_CALIBRATION = {
  cohortTotal:           75000,
  eligibleAfterGate:     22000,
  operatingDeclinerN:    18000,
  highValueN:             3000,
  balancesUnderTestM:      620,   // $620M
  runoffBau:             0.065,   // 6.5%
  runoffWithPolicy:      0.048,   // 4.8%
  runoffReductionPp:     0.017,   // 1.7pp
  retainedDepositsAnnualM:10.5,   // $10.5M annual
  offerCostM:             0.095,  // $95K
  spreadProtectedK:        210,   // $210K
  netAnnualisedK:          115,   // $115K
  treatmentN:            17600,
  controlN:               4400,
  complaintsBaseline:       80,
  complaintsDelta:         120,   // +120 / qtr
  udaapMargin:            0.93,
  udaapFloor:             0.85,
  stickinessThreshold:    0.70,
};

/* Pre-simulation range strings for Analyze hero KPIs. */
export const RETENTION_PRESIM_RANGES = [
  { label: "Retained deposits",         value: "+$8–13M",        unit: "/ yr · est. range", tone: "g" },
  { label: "Balance runoff reduction",   value: "−1.3 to −2.0pp", unit: "/ qtr · est. range", tone: "g" },
  { label: "Spread protected",           value: "+$170–260K",     unit: "/ yr · est. range", tone: "g" },
  { label: "Customer fatigue",           value: "+90 to +160",    unit: "complaints / qtr · est. range", tone: "a" },
];

export default RETENTION_CONFIG;
```

---

## STEP 4 · Create `src/data/retentionSensedAssets.js`

Mirrors `sensedAssets.js` schema (id / group / name / subtitle / quickNumbers / informs / drillDown OR drillDownLight). 7 entries: 3 data / 2 detection / 2 guardrail.

```js
/* ============================================================================
   Deposit Retention · Sense-stage assets for RetentionAnalyzeView.

   Sibling to sensedAssets.js (does NOT modify it). 7 entries:
     · 3 data streams   (ret-1 .. ret-3)
     · 2 detection models (ret-4, ret-5)
     · 2 guardrail models (ret-6, ret-7)
   ========================================================================= */

const retentionSensedAssets = [
  // ─── DATA STREAMS ───
  {
    id: 'ret-1', group: 'data',
    name: 'Deposit-flow ledger', subtitle: 'Balance + ACH movement events',
    quickNumbers: '4.2M · 18mo',
    informs: 'balance slope + outbound ACH acceleration',
    drillDownLight: {
      provenance: { owner: 'Core Banking · Data Engineering', refresh: 'streaming · sub-second', validated: '✓ MRM-approved · daily reconciliation', qualityOrCoverage: 'coverage 100% of mass-affluent book · 18-mo retention' },
      forThisSignal: [
        { label: 'Balance observation events',  value: '4.2M over 18 months' },
        { label: 'Balance-decline events / mo',  value: '~10,500' },
        { label: 'Outbound ACH events flagged',  value: '847K over 90 days' },
        { label: 'Cohort coverage',              value: '75,000 of 75,000 (100%)' },
      ],
      compositionChain: {
        feedsInto: ['Drift-classification model', 'Primacy index', 'Profitability guardrail'],
        fedBy:     ['Posting ledger', 'ACH rails', 'Direct-deposit registry'],
      },
    },
  },
  {
    id: 'ret-2', group: 'data',
    name: 'DDA-activity stream', subtitle: 'Operating-account transaction counts',
    quickNumbers: 'DDA −12% · 90d',
    informs: 'primacy-index erosion + operating-decliner detection',
    drillDownLight: {
      provenance: { owner: 'Behavioral Analytics', refresh: 'event-driven · 5-minute batch', validated: '✓ MRM-approved', qualityOrCoverage: '21.4M DDA events / month · 100% cohort coverage' },
      forThisSignal: [
        { label: 'DDA activity decline',          value: '−12% across cohort' },
        { label: 'Direct-deposit decay flagged',   value: '~18K customers' },
        { label: 'Bill-pay deactivations 90d',     value: '~6.3K' },
        { label: 'Primacy-index window',           value: '60-day lead' },
      ],
      compositionChain: {
        feedsInto: ['Primacy index', 'Direct-deposit decay detector', 'Operating-decliner classifier'],
        fedBy:     ['Posting ledger', 'Bill-pay registry', 'Payroll-inflow stream'],
      },
    },
  },
  {
    id: 'ret-3', group: 'data',
    name: 'RM-CRM signals', subtitle: 'Banker relationship activity + notes',
    quickNumbers: '3K high-value · RM-active',
    informs: 'banker save outreach eligibility + relationship context',
    drillDownLight: {
      provenance: { owner: 'CRM · Wealth + Premier', refresh: 'nightly · event-augmented', validated: '✓ MRM-approved', qualityOrCoverage: '3,000 high-value relationships in scope' },
      forThisSignal: [
        { label: 'High-value customers in scope', value: '3,000 · avg balance $85K+' },
        { label: 'Last RM contact gap',           value: 'avg 91 days' },
        { label: 'Active liquidity-review queue',  value: '~420 / month capacity' },
      ],
      compositionChain: {
        feedsInto: ['Banker save outreach', 'RM-touch ROI model'],
        fedBy:     ['CRM activity log', 'RM calendar', 'Outreach response stream'],
      },
    },
  },

  // ─── DETECTION MODELS ───
  {
    id: 'ret-4', group: 'detection',
    name: 'Drift-classification model', subtitle: 'Stable · ≤30 injections',
    quickNumbers: 'AUC 0.88 · stable',
    informs: 'deposit-drift onset · primary signal qualifier',
    drillDown: {
      provenance: { owner: 'Quant · Deposits', refresh: 'weekly retraining · drift monitored', validated: '✓ SR 11-7 audited · model card v2.1', qualityOrCoverage: 'AUC 0.88 · 28 injections this cycle (gate 30)' },
      forThisSignal: [
        { label: 'Drift state',                     value: 'STABLE (28 inj.)' },
        { label: 'Compare: rate_sensitive_drift',   value: '380 injections · refused' },
        { label: 'Joint-signal precision',          value: '0.84 (balance + ACH out)' },
        { label: 'Eligible pool after gate',        value: '22K of 75K' },
      ],
      visualization: 'Drift-monitor stripchart — 28 injections this cycle vs 30 gate · flat trend',
      compositionChain: {
        feedsInto: ['Joint-signal qualifier', 'Eligibility gate'],
        fedBy:     ['Deposit-flow ledger', 'DDA-activity stream', 'External rate-context'],
      },
      links: ['Model card v2.1', 'MRM audit · 2026-04-18'],
    },
  },
  {
    id: 'ret-5', group: 'detection',
    name: 'Operating-balance primacy index', subtitle: 'Primacy erosion detector',
    quickNumbers: '60d lead · AUC 0.85',
    informs: 'operating-decliner sub-segment identification',
    drillDownLight: {
      provenance: { owner: 'Behavioral Analytics', refresh: 'daily', validated: '✓ MRM-approved', qualityOrCoverage: 'AUC 0.85 on 6-month forward window' },
      forThisSignal: [
        { label: 'Lead time vs rate-shopping',    value: '60 days' },
        { label: 'Operating-decliner sub-segment', value: '18K customers' },
        { label: 'DD-decay weight (prior)',       value: '0.18 → 0.31 (upgraded)' },
      ],
      compositionChain: {
        feedsInto: ['Direct-deposit decay detector', 'Operating-decliner classifier'],
        fedBy:     ['DDA-activity stream', 'Payroll-inflow stream'],
      },
    },
  },

  // ─── GUARDRAIL MODELS ───
  {
    id: 'ret-6', group: 'guardrail',
    name: 'Stickiness-vs-elasticity discriminator', subtitle: 'UDAAP safeguard · audited',
    quickNumbers: 'AUC 0.86 · threshold 0.70',
    informs: 'UDAAP basis for differential offer',
    drillDown: {
      provenance: { owner: 'Compliance Analytics', refresh: 'weekly · per-customer scored', validated: '✓ MRM-approved · Compliance signed-off', qualityOrCoverage: 'AUC 0.86 · audited basis · per-customer audit trail' },
      forThisSignal: [
        { label: 'Threshold (prior shift)',        value: '0.65 → 0.70 (tightened)' },
        { label: 'Eligible after gate',            value: '22K of cohort' },
        { label: 'False-positive guard',           value: '~1 in 4 mis-flagged protected' },
        { label: 'UDAAP basis audit-ready',         value: 'per-customer score logged' },
      ],
      visualization: 'Discriminator-score histogram — eligible cohort sits below 0.70 cleanly',
      compositionChain: {
        feedsInto: ['Differential-offer eligibility', 'UDAAP audit trail'],
        fedBy:     ['Operating-balance primacy index', 'Payroll-inflow signal', 'Tenure + product depth'],
      },
      links: ['UDAAP-basis policy doc', 'Stickiness audit · 2026-04-30'],
    },
  },
  {
    id: 'ret-7', group: 'guardrail',
    name: 'Profitability guardrail + RAROC floor', subtitle: 'Offer-ceiling enforcement',
    quickNumbers: 'RAROC floor live',
    informs: 'offer rate ceiling per customer',
    drillDownLight: {
      provenance: { owner: 'Treasury · ALM', refresh: 'daily · funds-transfer-price linked', validated: '✓ MRM-approved', qualityOrCoverage: '100% of offer customers scored at decision time' },
      forThisSignal: [
        { label: 'RAROC floor',                   value: 'enforced per-customer' },
        { label: 'Max offer ceiling',             value: '40bps above current (default)' },
        { label: 'Net annualised at defaults',     value: '+$115K' },
      ],
      compositionChain: {
        feedsInto: ['Per-customer offer ceiling', 'Net-value computation'],
        fedBy:     ['Funds-transfer price', 'Deposit-flow ledger', 'Stickiness discriminator'],
      },
    },
  },
];

export default retentionSensedAssets;
```

---

## STEP 5 · Create `src/data/retentionCohortInsights.js`

Reason-card chart data for the 5 retention reasons.

```js
/* ============================================================================
   Deposit Retention · cohort insight constants used by retention reason cards.

   Sibling to cohortInsights.js (does NOT modify it). Mini-chart data drives
   the retention reason cards in RetentionAnalyzeView.
   ========================================================================= */

export const RETENTION_REASON_CARDS = [
  { n: "R1", t: "Balance slope + outbound ACH joint signal",       d: "The joint occurrence of balance decline and ACH-out acceleration is 2.3× more predictive than either signal alone — the combination identifies genuine drift-onset, not noise.", pct: 84, a: "joint signal precision 0.84", chart: "joint-signal" },
  { n: "R2", t: "Operating-balance volatility 2.1× cohort median", d: "Month-to-month operating-balance swings exceeding 2× median are a reliable predictor of 90-day runoff in the mass-affluent segment.",                                  pct: 78, a: "volatility ratio 2.1×",       chart: "volatility-bars" },
  { n: "R3", t: "Direct-deposit + bill-pay decay joint",           d: "Direct-deposit frequency decline combined with bill-pay deactivation marks the operating-decliner sub-segment — intervening before rate-shopping develops.",            pct: 71, a: "DD+BP decay joint",          chart: "primacy-decay" },
  { n: "R4", t: "Drift distinguishable from rate-shopping",        d: "The drift classification model separates primacy-weakening (upstream behavioural) from active rate-shopping (aggregator logins + probing transfers) — different intervention windows.", pct: 66, a: "drift vs shopping separability", chart: "stickiness-distribution" },
  { n: "R5", t: "Low product depth amplifier",                     d: "Single-product customers with no secondary anchor have a 1.9× higher 12-month attrition probability — product depth is not the cause but amplifies every other signal.", pct: 62, a: "depth multiplier 1.9×",      chart: "product-depth" },
];

/* Histogram bins for the joint-signal chart (balance-decline % bands × frequency) */
export const JOINT_SIGNAL_BINS = [
  { band: "< 5%",   freq: 12 },
  { band: "5-10%",  freq: 28 },
  { band: "10-15%", freq: 41 },
  { band: "15-20%", freq: 18 },
  { band: "> 20%",  freq:  9 },
];

/* Volatility-ratio distribution bars */
export const VOLATILITY_BARS = [
  { ratio: "< 1.0×", pct:  8 },
  { ratio: "1.0-1.5×", pct: 22 },
  { ratio: "1.5-2.0×", pct: 35 },
  { ratio: "2.0-2.5×", pct: 24 },
  { ratio: "> 2.5×", pct: 11 },
];

/* Primacy-decay overlay: DD frequency + bill-pay count per archetype */
export const PRIMACY_DECAY = [
  { archetype: "Drifting Saver",     dd: 0.55, bp: 0.62 },
  { archetype: "Operating Decliner", dd: 0.84, bp: 0.78 },
  { archetype: "Anchored Saver",     dd: 0.22, bp: 0.15 },
];

/* Stickiness-score distribution — histogram bins, target gate at 0.70 */
export const STICKINESS_DISTRIBUTION = [
  { bin: "0.0-0.2", pct:  4 },
  { bin: "0.2-0.4", pct: 12 },
  { bin: "0.4-0.6", pct: 28 },
  { bin: "0.6-0.7", pct: 16 },
  { bin: "0.7-0.8", pct: 22, sticky: true },
  { bin: "0.8-1.0", pct: 18, sticky: true },
];

/* Product-depth amplifier — % of cohort by product count */
export const PRODUCT_DEPTH = [
  { products: "1",    pct: 49 },
  { products: "2",    pct: 27 },
  { products: "3",    pct: 14 },
  { products: "4+",   pct: 10 },
];
```

---

## STEP 6 · Create `src/data/retentionDeployHistory.js`

1 retention pilot for DeployWorkspace's MOCK_HISTORY (Strategy A v1, completed promoted, ~49 days ago — feeds prior-pilot writeback).

```js
/* ============================================================================
   Deposit Retention · MOCK_HISTORY entries for DeployWorkspace.

   These are merged into the existing MOCK_HISTORY array via spread in
   DeployWorkspace.jsx. Adds the prior closed retention pilot that
   PriorAnchorPill reads from in SimulateWorkspace.
   ========================================================================= */

const dayBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const RETENTION_DEPLOY_HISTORY = [
  {
    id: "mock-ret-1",
    name: "Targeted Deposit Defense · Strategy A v1",
    hypothesis: "H-RET-2026-02-10",
    cluster: "mass-affluent-deposit-drift",
    themeName: "Deposit Retention",
    themeId: "retention",
    experimentType: "retention",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(120),
    approvedAt: dayBack(118),
    complianceAt: dayBack(117),
    pilotStartedAt: dayBack(112),
    pilotEndedAt: dayBack(56),
    pilotDuration: 8,
    pilotWeek: 8,
    pilotTotal: 8,
    pilotEndReason: "duration-complete",
    treatmentN: 17600,
    controlN: 4400,
    blurb: "Personalised CD/MMA offer to rate-sensitive stickiness-gated sub-segment. 20% holdout RCT. 8-week pilot. Promoted to 80% rollout.",
    learnings: {
      headline: "Strategy A v1 landed inside CI on primary KPIs · promoted to 80% rollout · direct-deposit recovery overshot by +8pp (the surprise feeding the v2 priors)",
      actuals: [
        { k: "Retained deposits",        predicted: "+$10.5M / yr", actual: "+$10.2M", tone: "ok",   delta: "within CI" },
        { k: "Balance runoff reduction",  predicted: "−1.7pp",       actual: "−1.6pp",  tone: "ok",   delta: "within CI" },
        { k: "Direct-deposit recovery",   predicted: "+6pp",         actual: "+14pp",   tone: "warn", delta: "OVERSHOOT · +8pp beyond predicted" },
        { k: "UDAAP margin",              predicted: "0.93",         actual: "0.93",    tone: "ok",   delta: "held exact" },
        { k: "Customer fatigue",          predicted: "+120 / qtr",   actual: "+98 / qtr",tone: "ok",   delta: "better than predicted" },
      ],
      surprises: [
        "Direct-deposit recovery overshot prediction by +8pp — removing balance-drift anxiety apparently prompts a subset of treated customers to re-route primary payroll back. The rate-elasticity model did not anticipate this secondary primacy mechanism.",
        "Stickiness discriminator held cleanly at 0.65 but Compliance audit recommended tightening to 0.70 to strengthen the UDAAP basis for v2.",
      ],
      didntWork: [
        "Pure-price elasticity in the operating-decliner sub-segment came in 33% weaker than modelled — the primacy mechanism dominates rate in that slice.",
      ],
      nextMove: {
        verdict: "Promoted to 80% rollout",
        tone: "ok",
        rationale: "All primary KPIs landed inside CI · UDAAP margin held · direct-deposit recovery overshot — the operating-anchor mechanism is stronger than modelled. Strategy B (Primacy Re-Anchoring) drafted as concurrent pilot.",
      },
    },
  },
];

export default RETENTION_DEPLOY_HISTORY;
```

---

## STEP 7 · Create `src/data/retentionLearnExperiments.js`

The closed retention pilot for LearnWorkspace MOCK_EXPERIMENTS + 1 systemic miscalibration. **This is the file PriorAnchorPill reads from** to drive the closed loop.

```js
/* ============================================================================
   Deposit Retention · MOCK_EXPERIMENTS + SYSTEMIC_MISCALIBRATIONS entries
   for LearnWorkspace.

   These are merged into the existing exported arrays via spread in
   LearnWorkspace.jsx. The pilot's modelUpdates drive PriorAnchorPill in
   SimulateWorkspace — closing the loop.
   ========================================================================= */

const dayBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const RETENTION_EXPERIMENTS = [
  {
    id: "exp-ret-2026-0041",
    name: "Targeted Deposit Defense · Strategy A v1",
    hypothesis: "H-RET-2026-02-10",            // the prior version's hypothesis
    cluster: "mass-affluent-deposit-drift",
    themeName: "Deposit Retention",
    themeId: "retention",
    experimentType: "retention",
    fidelity: 0.91,
    outcome: "promoted",
    closedAt: dayBack(49),
    pilotDuration: 8,
    treatmentN: 17600,
    controlN: 4400,
    fidelityRows: [
      { k: "Retained deposits",        predicted: "+$10.5M / yr", actual: "+$10.2M",  tone: "ok"   },
      { k: "Balance runoff reduction",  predicted: "−1.7pp",       actual: "−1.6pp",   tone: "ok"   },
      { k: "Direct-deposit recovery",   predicted: "+6pp",         actual: "+14pp",    tone: "warn" },   // OVERSHOOT
      { k: "UDAAP margin",              predicted: "0.93",         actual: "0.93",     tone: "ok"   },
      { k: "Customer fatigue",          predicted: "+120 / qtr",   actual: "+98 / qtr",tone: "ok"   },
    ],
    writeback: [
      "Stickiness-discriminator threshold validated at 0.70: gate confirmed across 17,600 treated customers — no UDAAP complaint generated",
      "Rate-elasticity model downgraded for operating-decliner sub-segment; primacy-index mechanism upgraded — direct-deposit recovery overshot +8pp, confirming operating-anchor intervention is stronger than modelled",
      "Strategy B (Primacy Re-Anchoring) promoted to its own concurrent pilot — drafted as H-RET-2026-06-01",
    ],
    /* These modelUpdates drive PriorAnchorPill in SimulateWorkspace.
       The pill renders for ANY hypothesisId that links here — both
       H-RET-2026-05-14 (Strategy A v2) and H-RET-2026-06-01 (Strategy B)
       should anchor on this pilot. Cross-reference via priorPilotIds. */
    priorAnchorFor: ["H-RET-2026-05-14", "H-RET-2026-06-01"],
    modelUpdates: [
      {
        driver: "retention.stickiness_discriminator.threshold",
        before: 0.65, after: 0.70, dir: "up",
        sourceKpi: "UDAAP margin",
        note: "Threshold tightened post-pilot — 0.70 confirmed as the auditable gate after Compliance review",
      },
      {
        driver: "retention.primacy_index.dd_recovery_weight",
        before: 0.18, after: 0.31, dir: "up",
        sourceKpi: "Direct-deposit recovery",
        note: "Direct-deposit recovery overshoot (+8pp) → upgrade primacy-index contribution",
      },
      {
        driver: "retention.rate_elasticity.operating_decliner_weight",
        before: 0.42, after: 0.28, dir: "down",
        sourceKpi: "Direct-deposit recovery",
        note: "Operating-primacy mechanism stronger than rate-elasticity in this sub-segment",
      },
    ],
  },
];

export const RETENTION_SYSTEMIC = [
  {
    id: "misc-ret-001",
    theme: "Deposit Retention",
    themeId: "retention",
    tone: "good",                                  // matches gig's "UPSIDE MISS" pattern
    pattern: "Retention friction-removal under-predicts secondary primacy recovery",
    drift: "+0.13 weight",
    sources: ["exp-ret-2026-0041"],
    action: "retention.primacy_index.dd_recovery_weight 0.18 → 0.31 added to model; rate-elasticity weight downgraded 0.42 → 0.28 in operating-decliner sub-segment",
    fullText: "Strategy A's deposit-defence offer removes balance-drift anxiety, which prompts a subset of the treated cohort to re-route primary payroll back — a second-order operating-anchor recovery the rate-elasticity model did not anticipate. Effect: direct-deposit recovery overshoots predicted +6pp to actual +14pp.",
  },
];

export default RETENTION_EXPERIMENTS;
```

---

## STEP 8 · Create `src/workspaces/RetentionAnalyzeView.jsx`

Mirror of `AnalyzeWorkspace.jsx` structure, but reads from `retentionSignals.js`, `retentionConfig.js`, `retentionSensedAssets.js`, `retentionCohortInsights.js`. Same JSX primitives (`SenseAssetCard`, asset groups, reason cards with mini-charts), same chapter structure, same CTA semantics.

**Build approach:** Open `src/workspaces/AnalyzeWorkspace.jsx`, copy it to `src/workspaces/RetentionAnalyzeView.jsx`, apply these substitutions:

| Find (gig) | Replace with (retention) |
|---|---|
| `import GROUPS from "@/data/sensedAssets"` *(or equivalent)* | `import GROUPS from "@/data/retentionSensedAssets"` |
| `import { VERIFIED_PATTERN_DEPTH, FRICTION_CONCENTRATION } from "@/data/cohortInsights"` | `import { JOINT_SIGNAL_BINS, VOLATILITY_BARS, PRIMACY_DECAY, STICKINESS_DISTRIBUTION, PRODUCT_DEPTH } from "@/data/retentionCohortInsights"` |
| `const RECOMMENDED_HYPOTHESIS_ID = "H-2026-04-12"` | `const RECOMMENDED_HYPOTHESIS_ID = "H-RET-2026-05-14"` |
| Hero eyebrow `"★ Recommended hypothesis · H-2026-04-12"` | `"★ Recommended hypothesis · H-RET-2026-05-14"` |
| Hero H1 `"Verified-Landlord RTP Enablement"` | `"Targeted Deposit Defense"` |
| Hero description paragraph (gig RTP rationale) | "Mass-affluent deposit drift detected across 75K customers · 22K cohort eligible after the stickiness discriminator gate. Strategy A defends rate-sensitive balances inside profitability + UDAAP guardrails — the auditable retention play." |
| 4 hero KPI tiles | Use `RETENTION_PRESIM_RANGES` from `retentionConfig.js` |
| `REASON_CARDS` inline constant | Use `RETENTION_REASON_CARDS` from `retentionCohortInsights.js` |
| Mini-chart components (`RentHistogram`, `VerifiedPatternDepthBars`, `FrictionConcentrationBars`, `DisparityBar`) | New retention mini-charts: `JointSignalHistogram`, `VolatilityBars`, `PrimacyDecayBars`, `StickinessDistribution`, `ProductDepthBars` |
| `renderReasonChart` switch | Switch on `RETENTION_REASON_CARDS[].chart` field — values: `"joint-signal"`, `"volatility-bars"`, `"primacy-decay"`, `"stickiness-distribution"`, `"product-depth"` |
| Component export name `AnalyzeWorkspace` | `RetentionAnalyzeView` |
| `goTest()` opens TestModeChooser → on path-pick → `nav("simulate")` — keep identical | — |

**Key things to KEEP unchanged from AnalyzeWorkspace:**
- The 3-chapter layout (Chapter 01 Data + models composed / Chapter 02 Drivers)
- The 3 collapsible asset group headers (data / detection / guardrail)
- `SenseAssetCard` collapsed/expanded states
- Hero KPI tile typography + `· est. range` em-tag
- Pre-sim range explanatory paragraph
- `useAppShell()` reads + the fallback-only useEffect
- TestModeChooser invocation
- "← Back to theme" + "Test this hypothesis →" CTA pair
- All accent colors (use `var(--ret)` orange via the standard accent token)

**Mini-charts to implement** (small inline SVG components — each ~30-50 lines of JSX):
1. `JointSignalHistogram` — vertical bar histogram of `JOINT_SIGNAL_BINS`, target band `10-15%` highlighted in `--ret`
2. `VolatilityBars` — horizontal bars from `VOLATILITY_BARS`, bands `1.5-2.0×` and `2.0-2.5×` highlighted (these are the actionable bands)
3. `PrimacyDecayBars` — paired bars per archetype from `PRIMACY_DECAY` (DD frequency + BP count, side by side)
4. `StickinessDistribution` — histogram of `STICKINESS_DISTRIBUTION`, vertical gate line at 0.70, bins above marked as sticky (red overlay)
5. `ProductDepthBars` — single-row stacked bar from `PRODUCT_DEPTH`, "1-product" segment highlighted

---

## STEP 9 · Create `src/workspaces/RetentionSimulateView.jsx`

Mirror of `SimulateWorkspace.jsx` structure with retention-specific levers, calibration, and content.

**Build approach:** Open `src/workspaces/SimulateWorkspace.jsx`, copy it to `src/workspaces/RetentionSimulateView.jsx`, apply these substitutions:

### Imports
| Find | Replace with |
|---|---|
| `import { MOCK_EXPERIMENTS } from "@/workspaces/LearnWorkspace"` | Keep this line — PriorAnchorPill needs it. Also add: `import { RETENTION_EXPERIMENTS } from "@/data/retentionLearnExperiments"` |
| References to gig calibration constants | Replace with `import { RETENTION_CALIBRATION, RETENTION_HYPOTHESIS_ID, RETENTION_HYPOTHESIS_TITLE } from "@/data/retentionConfig"` |

### Constants
| Find | Replace with |
|---|---|
| `const PAGE_SUBTITLE = "Trust-Aware Ceiling Lift"` | `const PAGE_SUBTITLE = "Targeted Deposit Defense"` |
| `const RECOMMENDED = { trustGate: 18, liftPct: 20, rails: ["zelle","ach"], rolloutPct: 60, rollbackOn: true, ... }` | `const RECOMMENDED = { minBalanceK: 25, balanceDeclinePct: 10, achSpikePct: 20, offerCeilingBps: 40, channelMix: "app_email_banker", holdoutPct: 20, eligibilityWeeks: 8, primacyFollowOn: false, followOnDDReactivation: true, followOnBillPayReactivation: true, pilotDuration: 8 }` |

### simulateOutcomes() function — replace with retention math

The function shape stays identical (`(levers) => outcomes`), but the inner constants come from `RETENTION_CALIBRATION`:

```js
function simulateOutcomes(levers, hypothesisId) {
  const C = RETENTION_CALIBRATION;
  // Cohort sizing
  const eligibleN = C.eligibleAfterGate * leverModifier(levers);   // see below
  const treatmentN = Math.round(eligibleN * (1 - levers.holdoutPct/100));
  const controlN = eligibleN - treatmentN;
  // Outcome math — scales linearly off baseline runoff reduction
  const retainedM = C.retainedDepositsAnnualM * (treatmentN / C.treatmentN);
  const runoffWithPolicy = C.runoffBau - C.runoffReductionPp * (levers.offerCeilingBps / RECOMMENDED.offerCeilingBps);
  const spreadProtectedK = C.spreadProtectedK * (retainedM / C.retainedDepositsAnnualM);
  const offerCostM = C.offerCostM * (levers.offerCeilingBps / RECOMMENDED.offerCeilingBps);
  const udaapMargin = C.udaapMargin; // held constant by the stickiness gate
  const complaintsDelta = C.complaintsDelta * (treatmentN / C.treatmentN);
  // ...returns: { retainedM, runoffBau: C.runoffBau, runoffWithPolicy, spreadProtectedK, offerCostM, udaapMargin, complaintsDelta, treatmentN, controlN, eligibleN, ... }
}
```

`leverModifier` scales eligibility based on `balanceDeclinePct` and `achSpikePct` triggers (looser triggers → fewer eligible; tighter → more). Encode roughly:
```js
const leverModifier = (l) => {
  const declineFactor = 1 + 0.05 * (RECOMMENDED.balanceDeclinePct - l.balanceDeclinePct);
  const achFactor = 1 + 0.03 * (RECOMMENDED.achSpikePct - l.achSpikePct);
  return Math.max(0.4, Math.min(1.4, declineFactor * achFactor));
};
```

### PriorAnchorPill — augment to include retention pilots

Find the PriorAnchorPill prior lookup:
```js
const priorPilots = MOCK_EXPERIMENTS.filter(e => e.priorAnchorFor?.includes(hypothesisId));
```

The retention experiments need to be included. Add to the import line:
```js
const ALL_EXPERIMENTS = [...MOCK_EXPERIMENTS, ...RETENTION_EXPERIMENTS];
const priorPilots = ALL_EXPERIMENTS.filter(e => e.priorAnchorFor?.includes(hypothesisId));
```

The displayed text comes from the modelUpdates[0] entry:
```
PRIOR · ANCHORED · Using updated priors from exp-ret-2026-0041 · retention.stickiness_discriminator.threshold 0.65 → 0.70 (↑)
sub: +2 other updates from this pilot · fidelity 0.91 R²
```

### Lever sections — replace 5 sections with retention versions

**Section 1 · COHORT** (violet)
- Preset cluster cards (3): "Full cohort 75K" / "Rate-sensitive eligible 22K" (default) / "Operating-decliner 18K"
- Custom rule builder (collapsed by default) — same `<details>` pattern, replace gig feature options with: `balance_min`, `balance_decline_pct`, `ach_outflow_90d`, `dda_activity_decline_pct`, `direct_deposit_decay`, `attrition_decile`, `product_depth_count`

**Section 2 · ELIGIBILITY** (blue) — replaces gig's "PRODUCTS · RAILS"
- Min balance threshold slider ($20K–$100K, step $5K, default $25K)
- Balance-decline % trigger (5%–25%, step 1%, default 10%)
- Outbound-ACH-spike trigger (10%–40%, step 5%, default 20%)
- Stickiness gate (read-only display: `"≥0.70 · UDAAP basis · fixed"`)

**Section 3 · OFFER** (amber) — replaces gig's "POLICY"
- Offer rate ceiling bps (10bps–80bps, step 5bps, default 40bps) — with profitability guardrail real-time indicator showing "RAROC floor enforced"
- Channel mix segmented control: "App + email" / "Banker" / "Both" (default Both)
- Pilot duration (4–12 weeks, step 2, default 8) — same lever name as gig
- Auto-rollback checkbox (default ON) — same as gig
- Eligibility window weeks (4–16, step 2, default 8)

**Section 4 · COMMUNICATIONS** (green)
- Holdout % (10%–30%, step 5%, default 20%)
- RM capacity utilisation (20%–100%, step 10%, default 60%)
- Send frequency (1–3 / week, step 1, default 2)
- Communication tone select: advisory / urgency (default advisory)

**Section 5 · PRIMACY RE-ANCHOR FOLLOW-ON** (grey, `<details>` collapsed)
- Checkbox: "Include Strategy B primacy re-anchor in this test" (default off)
- If checked:
  - DD reactivation prompt (on/off, default on)
  - Bill-pay reactivation prompt (on/off, default on)
  - Follow-on trigger delay (2–8 weeks after Strategy A treatment, step 2, default 2)
- When checked, sets `experimentType: "retention+primacy"` instead of `"retention"` (mirrors gig's `includeDeepening` toggle)

### Sticky config strip

Replace gig's fair-lending pill with the UDAAP margin pill. The strip layout stays identical:
- Left: cohort name pill + `"22K eligible after stickiness gate (29% @ 0.70 threshold)"`
- Center: UDAAP margin pill (`is-safe` if margin ≥ floor): `"UDAAP margin 0.93 vs 0.85 floor"`
- Right: "Run Simulation" button

### Verdict strings

| Outcome | Headline | Sub |
|---|---|---|
| proven | SIMULATION SUPPORTS HYPOTHESIS | "All retention KPIs hit · UDAAP margin held · profitability guardrail clear" |
| mixed | PARTIAL SUPPORT · GUARDRAIL AT RISK | "Retained deposits in range · UDAAP margin held · direct-deposit recovery uncertain" |
| disproven | SIMULATION DOES NOT SUPPORT HYPOTHESIS | "Retained deposits below CI · or UDAAP basis insufficient at this offer ceiling" |

### 3 ProofKpi cards (retention)

| Card | label | with-policy | baseline | delta chip |
|---|---|---|---|---|
| 1 | Retained deposits | `+$10.5M / yr` | `$0 · BAU runoff uninterrupted` | `+$10.5M` |
| 2 | Balance runoff rate | `4.8%` | `6.5% · BAU` | `−1.7pp` |
| 3 | Direct-deposit recovery | `+6pp / qtr` | `0pp · no policy effect` | `+6pp` |

*(Note: per-instructions from blueprint, ProofKpi 3 is direct-deposit recovery — replacing gig's "Complaints prevented" — because DD recovery is the retention mechanism's most defensible secondary KPI. UDAAP margin lives in the guardrail strip below.)*

### 4 guardrail strip pills

1. `RAROC ≥ floor` — green if offer ceiling holds within profitability bound
2. `UDAAP basis evidenced` — green if stickiness discriminator threshold respected
3. `Model Risk (SR 11-7)` — green because drift_state is stable (28 inj. vs 30 gate)
4. `Fraud envelope · deposit-offer Q2 bound` — green if within seasonal bound

### 2×2 simulated-outcomes tile grid

| Position | Tile | Content |
|---|---|---|
| top-left | `ResultTileNII` reused | Retention area chart — treatment cohort balance stabilises vs control's continued decline (8-week horizon) |
| top-right | `ResultTileBars` reused | Weekly runoff rate bars · treatment drops from 6.5% baseline toward 4.8% by week 8 (rampWeeks 2) |
| bottom-left | `ResultTileBars` reused | Direct-deposit recovery weekly bars · lags by ~3 weeks (rampWeeks 4); lagInsight: `"Direct-deposit recovery lags offer acceptance by ~3 weeks — the primacy mechanism takes time to re-route payroll. The +14pp overshoot in v1 was concentrated in weeks 6-8."` |
| bottom-right | `ResultTileCohort` reused | Cohort composition donut · DS 65% / OD 24% / AS 11% in treated group |

### onStage() — same shape, different policy payload

```js
const policy = {
  ...currentLevers,
  themeId: "retention",
  cluster: "cluster_mass_affluent_deposit_drift",
  hypothesisId: "H-RET-2026-05-14",
  hypothesisTitle: "Targeted Deposit Defense",
  experimentType: levers.primacyFollowOn ? "retention+primacy" : "retention",
  stagedBy: tuneMode === "autopilot" ? "autopilot" : "user",
  status: "pending",
};
stagePolicy(policy);
// ...rest unchanged
```

### Autopilot cinematic — same timing, same flow

T+1500ms → auto-run → loader → results → T+3500ms → auto-stage → `setIntermezzo("staged-autopilot")` → 1500ms → `navWorkspace("deploy")`.

---

## STEP 10 · Edit `src/pages/Theme.jsx` (5 additive edits)

### 10.1 — Add imports

**Find:**
```js
import gigSignals from "@/data/gigSignals";
```

**Replace with:**
```js
import gigSignals from "@/data/gigSignals";
import retentionSignals from "@/data/retentionSignals";
import { RETENTION_CONFIG } from "@/data/retentionConfig";
```

### 10.2 — Add retention to `macroFor()` map

**Find:**
```js
    elder: "Elder-fraud / EFE typologies",
    wallet: "BNPL & rewards competition",
    branch: "Regional bank consolidation",
  };
```

**Replace with:**
```js
    elder: "Elder-fraud / EFE typologies",
    wallet: "BNPL & rewards competition",
    branch: "Regional bank consolidation",
    retention: "Rate-cut cycle + open-banking switching friction falling",
  };
```

### 10.3 — Add retention branch to `gotoPipeline()`

**Find:**
```js
  const gotoPipeline = (h) => {
    if (ID === "gig") { navigate("/gig-pipeline"); return; }
```

**Replace with:**
```js
  const gotoPipeline = (h) => {
    if (ID === "gig") { navigate("/gig-pipeline"); return; }
    if (ID === "retention") { navigate("/?seed_route=analyse"); return; }
```

*(Note: retention's gotoPipeline does NOT go to a standalone pipeline page — it joins the workspace loop. This is the simplest way to handle the case where someone clicks a hypothesis-card CTA on the Theme page; the workspace flow is the canonical entry point.)*

### 10.4 — Add retention render branch

**Find:**
```jsx
              {ID === "gig" ? (
                /* gig theme: signals ARE the curated hypotheses ... */
                <SignalsSection
                  signals={gigSignals}
                  accent={ACC}
                  onOpen={(hid) => openSignalInLoop(hid)}
                />
              ) : (
```

**Replace with:**
```jsx
              {ID === "gig" ? (
                /* gig theme: signals ARE the curated hypotheses ... */
                <SignalsSection
                  signals={gigSignals}
                  accent={ACC}
                  onOpen={(hid) => openSignalInLoop(hid)}
                />
              ) : ID === "retention" ? (
                /* retention theme: same SignalsSection pattern as gig.
                   Renders 3 mechanism-distinct retention hypotheses
                   (A=price, B=primacy, C=banker). Strategy A starred. */
                <SignalsSection
                  signals={retentionSignals}
                  accent={ACC}
                  onOpen={(hid) => openSignalInLoop(hid)}
                />
              ) : (
```

### 10.5 — Add retention hero/idstrip hardcoded fallback

The retention theme is not bundle-bound. We patch the missing hero by adding an early-return retention block at the top of `renderHero()`.

**Find** (start of `renderHero` function):
```js
  const renderHero = () => {
```

**Replace with:**
```js
  const renderHero = () => {
    // Retention theme: hardcoded hero (not bundle-bound; mirrors gig's
    // override pattern via retentionSignals.js + retentionConfig.js).
    if (ID === "retention") {
      const RC = RETENTION_CONFIG;
      return (
        <>
          <div className="hero">
            <div className="hero-main">
              <div className="hero-type" style={{ color: ACC }}>Deposit Retention{MODE === "macro" ? " · outside-in" : ""}</div>
              <div className="hero-name">
                <span className="odot" style={{ background: ACC, boxShadow: `0 0 13px ${ACC}` }} />
                {RC.name}
              </div>
              <div className="hero-sig">Three converging signals — balance slope, outbound ACH acceleration, and operating-balance erosion — mark a cohort whose primacy is weakening before rate-shopping begins.</div>
            </div>
            <div className="hero-side">
              <div className="hm"><span className="v ac" style={{ color: ACC }}>$2.1B</span><span className="l">deposits under observation</span></div>
              <div className="hm"><span className="v">75,000</span><span className="l">customers in cohort</span></div>
              <div className="hm"><span className="v">3</span><span className="l">hypotheses surfaced</span></div>
            </div>
          </div>
          <div className="idstrip">
            <span className="statuspill st-confirmed"><span className="ld" style={{ background: "currentColor", boxShadow: "0 0 7px currentColor" }} />Confirmed</span>
            <span className="idtag"><span className="k">objective</span> <b style={{ color: ACC }}>Retention</b></span>
            <span className="idtag"><span className="k">cluster</span> <b>{RC.cluster}</b></span>
            <span className="idtag"><span className="k">drift</span> <span className="pillv pv-ok">stable</span></span>
            <span className="idtag"><span className="k">policy</span> <b>v2</b></span>
            <span className="idtag"><span className="k">macro driver</span> <b>{macroFor("retention")}</b></span>
          </div>
        </>
      );
    }
    // (existing renderHero body continues below unchanged)
```

---

## STEP 11 · Edit `src/pages/Cockpit.jsx` (1 line)

### 11.1 — Honour `pinned` field in Treemap sort

**Find:**
```js
  const sortedThemes = [...modeData.themes]
    .map((t) => ({ t, a: area(t, sizeMetric) }))
    .sort((p, q) => order[p.t.obj] - order[q.t.obj] || q.a - p.a)
    .map((x) => x.t);
```

**Replace with:**
```js
  const sortedThemes = [...modeData.themes]
    .map((t) => ({ t, a: area(t, sizeMetric) }))
    .sort((p, q) => {
      // Pinned tiles float to the absolute top — used to keep retention
      // adjacent to gig on Cockpit row 1 for the demo.
      if (!!p.t.pinned !== !!q.t.pinned) return p.t.pinned ? -1 : 1;
      return order[p.t.obj] - order[q.t.obj] || q.a - p.a;
    })
    .map((x) => x.t);
```

---

## STEP 12 · Edit `src/workspaces/AnalyzeWorkspace.jsx` (2 additive edits)

### 12.1 — Add retention import

**Find** (with other workspace-related imports near the top):
```js
import { useAppShell } from "@/state/AppShell";
```

**Replace with:**
```js
import { useAppShell } from "@/state/AppShell";
import RetentionAnalyzeView from "@/workspaces/RetentionAnalyzeView";
```

### 12.2 — Add early-return branch

**Find** (top of the AnalyzeWorkspace component function body, just after the `useAppShell()` destructure):
```js
export default function AnalyzeWorkspace() {
  const { selectedThemeId, selectedHypothesisId, selectTheme, selectHypothesis, navigate: navWorkspace, pushAgentEvent } = useAppShell();
```

**Append immediately after** (do not modify the existing destructure):
```js
  // Retention theme: dispatch to RetentionAnalyzeView. Keeps the gig flow
  // entirely untouched. Retention's own hooks live inside that component.
  if (selectedThemeId === "retention") {
    return <RetentionAnalyzeView />;
  }
```

---

## STEP 13 · Edit `src/workspaces/SimulateWorkspace.jsx` (2 additive edits)

### 13.1 — Add retention import

**Find** (with other workspace imports):
```js
import { useAppShell } from "@/state/AppShell";
```

**Replace with:**
```js
import { useAppShell } from "@/state/AppShell";
import RetentionSimulateView from "@/workspaces/RetentionSimulateView";
```

### 13.2 — Add early-return branch

**Find** (just after the `useAppShell()` destructure at top of SimulateWorkspace component, BEFORE the entry-gate check for `selectedHypothesisId`):
```js
export default function SimulateWorkspace() {
  const { selectedHypothesisId, selectedThemeId, navigate: navWorkspace, ... } = useAppShell();
```

**Append immediately after destructure:**
```js
  // Retention theme: dispatch to RetentionSimulateView. The retention
  // workspace owns its own RECOMMENDED, simulateOutcomes, ProofKpi cards,
  // lever sections, verdict strings, and PriorAnchorPill lookup.
  if (selectedThemeId === "retention") {
    return <RetentionSimulateView />;
  }
```

---

## STEP 14 · Edit `src/workspaces/DeployWorkspace.jsx` (3 additive edits)

### 14.1 — Add retention import

**Find** (near top, with data imports):
```js
// (some line declaring MOCK_HISTORY constant)
```

**Add** above the `MOCK_HISTORY` constant declaration:
```js
import { RETENTION_DEPLOY_HISTORY } from "@/data/retentionDeployHistory";
```

### 14.2 — Spread retention history into MOCK_HISTORY render

Find where the workspace renders/iterates over `MOCK_HISTORY`. The portfolio table reads from a combined source:

**Find** (the line that builds the table data from MOCK_HISTORY, e.g.:
```js
const portfolio = useMemo(() => {
  return [...stagedPolicies, ...MOCK_HISTORY];
}, [stagedPolicies]);
```

**Replace with:**
```js
const portfolio = useMemo(() => {
  return [...stagedPolicies, ...MOCK_HISTORY, ...RETENTION_DEPLOY_HISTORY];
}, [stagedPolicies]);
```

### 14.3 — Add retention entry to prettyTheme map

**Find:**
```js
const prettyTheme = (id) => ({
  gig: "Gig money movement",
  elder: "Elder protection",
  home: "Life-event capture",
  ...
})[id] || id;
```

**Replace with:**
```js
const prettyTheme = (id) => ({
  gig: "Gig money movement",
  elder: "Elder protection",
  home: "Life-event capture",
  retention: "Deposit retention",
  ...
})[id] || id;
```

---

## STEP 15 · Edit `src/workspaces/LearnWorkspace.jsx` (3 additive edits)

### 15.1 — Add retention import

**Find** (with other data imports near top):
```js
// (declaration of MOCK_EXPERIMENTS or SYSTEMIC_MISCALIBRATIONS)
```

**Add** above those declarations:
```js
import { RETENTION_EXPERIMENTS, RETENTION_SYSTEMIC } from "@/data/retentionLearnExperiments";
```

### 15.2 — Re-export and spread MOCK_EXPERIMENTS for SimulateWorkspace consumption

The existing `MOCK_EXPERIMENTS` is **already exported** and consumed by SimulateWorkspace's PriorAnchorPill. We need to extend without breaking the export. Two approaches — pick one:

**Approach A (simpler — modify export):** Change the export line to spread:
```js
// BEFORE:
export const MOCK_EXPERIMENTS = [ /* gig + others */ ];

// AFTER:
const MOCK_EXPERIMENTS_BASE = [ /* gig + others, content unchanged */ ];
export const MOCK_EXPERIMENTS = [...MOCK_EXPERIMENTS_BASE, ...RETENTION_EXPERIMENTS];
```

**Approach B (lower-risk — add a new combined export and update consumers):** Add a parallel export and update SimulateWorkspace's import. Approach A is cleaner — recommended.

### 15.3 — Re-export and spread SYSTEMIC_MISCALIBRATIONS

Same approach:
```js
// BEFORE:
export const SYSTEMIC_MISCALIBRATIONS = [ /* gig + others */ ];

// AFTER:
const SYSTEMIC_BASE = [ /* gig + others, content unchanged */ ];
export const SYSTEMIC_MISCALIBRATIONS = [...SYSTEMIC_BASE, ...RETENTION_SYSTEMIC];
```

### 15.4 — Add retention entry to prettyTheme / outcome label map (if one exists in LearnWorkspace)

If the workspace has a `prettyTheme` or `themeLabel` map, add:
```js
retention: "Deposit retention",
```

If LearnWorkspace reads the `themeName` field directly off each experiment, no change is needed (the retention experiments already carry `themeName: "Deposit Retention"`).

---

## STEP 16 · Verification

Run after all edits applied. Block list:

### Build
- [ ] `npm run dev` starts cleanly
- [ ] No `Cannot find module` errors for any of the 8 new files
- [ ] No console errors on `/`, `/theme?id=retention`, or after clicking through a signal card

### Cockpit (`/`)
- [ ] Retention tile renders with name "Mass affluent · deposit drift"
- [ ] Retention tile is **on row 1 beside gig** (pinned-sort working)
- [ ] Old churn tile is gone
- [ ] Click retention tile → navigates to `/theme?id=retention&mode=internal`

### Theme page (`/theme?id=retention`)
- [ ] Hero shows "Deposit Retention" type chip + "Mass Affluent · Deposit Drift" name
- [ ] Side metrics: $2.1B / 75,000 / 3
- [ ] ID strip: Confirmed · Retention · cluster_mass_affluent_deposit_drift · stable · v2 · macro driver
- [ ] 3 signal cards render (Strategy A starred ★)
- [ ] WHO/WHAT/WHY rows visible on each card; all cohort-level, no names
- [ ] Click Strategy A → navigates to `/?seed_route=analyse`

### AnalyzeWorkspace (after signal click)
- [ ] AppShell route is "analyse", selectedTheme is "retention", selectedHypothesis is "H-RET-2026-05-14"
- [ ] AnalyzeWorkspace early-returns `<RetentionAnalyzeView />` (not the gig view)
- [ ] Eyebrow reads "★ Recommended hypothesis · H-RET-2026-05-14"
- [ ] H1 reads "Targeted Deposit Defense"
- [ ] 4 hero KPI tiles with `· est. range` suffix (matching RETENTION_PRESIM_RANGES)
- [ ] Pre-sim explanatory paragraph present
- [ ] 3 asset groups collapsible (3 data / 2 detection / 2 guardrail)
- [ ] 5 retention reason cards with %, title, mini-chart
- [ ] Mini-charts render (joint-signal histogram, volatility bars, primacy decay, stickiness distribution with 0.70 gate line, product depth)
- [ ] "Test this hypothesis →" opens TestModeChooser

### TestModeChooser
- [ ] 3 paths visible; If-What labelled RECOMMENDED ★
- [ ] Clicking any path closes modal and navigates to `/?seed_route=simulate` *(via nav("simulate"))*

### SimulateWorkspace
- [ ] Early-returns `<RetentionSimulateView />`
- [ ] **PriorAnchorPill renders** with text: `"PRIOR · ANCHORED · Using updated priors from exp-ret-2026-0041 · retention.stickiness_discriminator.threshold 0.65 → 0.70 (↑)"`
- [ ] Sub: `"+2 other updates from this pilot · fidelity 0.91 R²"`
- [ ] 5 lever sections render: COHORT / ELIGIBILITY / OFFER / COMMUNICATIONS / PRIMACY RE-ANCHOR FOLLOW-ON (collapsed)
- [ ] Sticky strip: cohort name + 22K eligible + UDAAP margin 0.93 pill + Run button
- [ ] (Autopilot path) T+1500ms auto-runs, loader, results
- [ ] Results: verdict pill, 3 ProofKpi cards (Retained $10.5M / Runoff 4.8%→6.5% / DD recovery +6pp), 4 guardrail pills, 2×2 outcome tile grid
- [ ] "Stage for Deploy" stages a policy with `themeId: "retention"`, `experimentType: "retention"`

### Intermezzo + Deploy
- [ ] StagedIntermezzo shows for 1.5s with "STAGED BY AUTOPILOT" or "STAGED"
- [ ] Auto-navigates to `/?seed_route=deploy` (or stays on autopilot's nav)
- [ ] DeployWorkspace portfolio table shows the just-staged retention row at top with JUST STAGED
- [ ] Also shows `mock-ret-1` row (Strategy A v1, completed, promoted) from RETENTION_DEPLOY_HISTORY
- [ ] Click retention row → ExperimentWorkflow expands
- [ ] Click Approve → approval cascade → READY state → Go Live button visible
- [ ] Click Go Live → 9.5s LaunchingModal sequence → LiveRctPage opens

### LearnWorkspace
- [ ] Sidebar Learn → navigates to `/?seed_route=learn` / LearnWorkspace
- [ ] Aggregate strip includes retention metrics in the totals
- [ ] SystemicCallouts shows the retention "Retention friction-removal under-predicts secondary primacy recovery" callout (good/green)
- [ ] `exp-ret-2026-0041` row renders with "promoted" tone
- [ ] Click row → ExperimentDetail expands → REALISED vs PREDICTED table shows DD recovery row as `warn` (overshoot)
- [ ] ModelUpdatesLedger renders 3 model-update rows (stickiness threshold up, primacy weight up, rate-elasticity down)
- [ ] Writeback ledger renders 3 lines verbatim

### Conceptual rule compliance
- [ ] No individual customer names on any user-facing surface (signal cards, Analyze hero, Simulate strip, Deploy table, Learn table)
- [ ] All pre-sim ranges carry `· est. range`
- [ ] ProofKpi cards in Simulate compare with-policy vs baseline (not vs prediction)
- [ ] PriorAnchorPill in Simulate references the prior pilot — closed loop verified

### Gig regression
- [ ] `/theme?id=gig` still renders identically
- [ ] `/gig-pipeline` still works
- [ ] Click gig tile from Cockpit → still works → still renders Signal Card A as Verified-Landlord RTP Enablement
- [ ] Click gig Signal Card A → still navigates to /?seed_route=analyse → AnalyzeWorkspace renders the gig view (not retention)
- [ ] PriorAnchorPill for gig still works (reads from MOCK_EXPERIMENTS, including the now-spread RETENTION_EXPERIMENTS — but matches only gig pilots)

---

## Deferred items (Phase 6)

- `src/components/CxoCompanion.jsx` — refusal log narrative for retention; quick-picks updates; DECISIONS ledger entry
- `src/pages/Ceo.jsx` — DECISIONS ledger update; new KB entries for retention strategic-altitude framing
- `src/pages/RetentionPipeline.jsx` — optional parallel standalone showcase like `/gig-pipeline` (not required for the workspace flow)

---

## Roll-back plan

1. `git status` — confirm exactly the 8 new + 6 modified files
2. `git restore src/data/themes.js src/pages/Theme.jsx src/pages/Cockpit.jsx src/workspaces/AnalyzeWorkspace.jsx src/workspaces/SimulateWorkspace.jsx src/workspaces/DeployWorkspace.jsx src/workspaces/LearnWorkspace.jsx`
3. `rm src/data/retentionSignals.js src/data/retentionConfig.js src/data/retentionSensedAssets.js src/data/retentionCohortInsights.js src/data/retentionDeployHistory.js src/data/retentionLearnExperiments.js src/workspaces/RetentionAnalyzeView.jsx src/workspaces/RetentionSimulateView.jsx`
4. Retention removed; gig untouched

---

## One-shot execution order

```
Step 1  · 3 themes.js edits
Step 2  · Write retentionSignals.js
Step 3  · Write retentionConfig.js
Step 4  · Write retentionSensedAssets.js
Step 5  · Write retentionCohortInsights.js
Step 6  · Write retentionDeployHistory.js
Step 7  · Write retentionLearnExperiments.js
Step 8  · Read AnalyzeWorkspace.jsx · fork to RetentionAnalyzeView.jsx with substitutions
Step 9  · Read SimulateWorkspace.jsx · fork to RetentionSimulateView.jsx with substitutions
Step 10 · 5 Theme.jsx edits
Step 11 · 1 Cockpit.jsx edit
Step 12 · 2 AnalyzeWorkspace.jsx edits
Step 13 · 2 SimulateWorkspace.jsx edits
Step 14 · 3 DeployWorkspace.jsx edits
Step 15 · 3-4 LearnWorkspace.jsx edits
Step 16 · npm run dev · walk Step 16 verification
```

Total ops: **8 file creates + 6 file modifies** = 14 file touches. None of them are gig-specific; all gig branches stay intact.
