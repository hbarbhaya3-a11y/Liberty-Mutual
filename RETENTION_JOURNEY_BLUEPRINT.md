# TwinX Decision Cockpit — Deposit Retention Journey
# Complete Architecture Blueprint (Sections A – L)

---

## ⚑ FINAL DECISIONS (user-approved 2026-05-27 — these override anything below that contradicts)

### Decision 1 · Archetype labels (Model stage personas)

Use plain-English compound-noun labels. No "The" prefix. No first names. Initials shown as small avatar badges.

| Code | Final label | Role | Replaces (earlier blueprint draft) |
|---|---|---|---|
| **DS** | Drifting Saver | Strategy A target — rate-sensitive sub-segment | "The Drifting Saver" |
| **OD** | Operating Decliner | Strategy B target — operating-account weakening | "The Operating-Account Eroder" / OE |
| **AS** | Anchored Saver | UDAAP false-positive guard — operationally sticky | "The Stickiness Edge Case" / SE |

Update every reference to these archetype codes in `themeConfigs.js PERSONAS`, `RetentionPipeline.jsx` Model stage, and any KB entries.

### Decision 2 · Calibration numbers (tuned DOWN for credibility)

These override every number in sections C, D, F, G, H below where the original blueprint used the larger figures.

| Quantity | Final value | Was (original draft) |
|---|---|---|
| Cohort under observation | 75,000 | 75,000 *(unchanged)* |
| Eligible after stickiness gate (Strategy A) | **22,000** | 30,000 |
| Operating-decliner sub-segment (Strategy B) | **18,000** | 28,000 |
| High-value sub-tier (Strategy C) | **3,000** | 5,000 |
| Balances under test (Strategy A) | **$620M** | $840M |
| BAU balance runoff | **6.5%** | 7.5% |
| Runoff with policy (Strategy A) | **4.8%** | 5.2% |
| Runoff reduction | **−1.7pp** | −2.3pp |
| Retained deposits / yr | **$10.5M** | $19.3M |
| Offer cost | **$95K** | $140K |
| Spread protected / yr (at 2%) | **$210K** | $386K |
| Net annualised value | **$115K** | $246K |
| Treatment cohort N | **17,600** | 22,400 |
| Control cohort N | **4,400** | 5,600 |
| Customer fatigue (complaints / qtr) | **+120** | +180 |
| Strategy A stakes range (signal card) | **+$8–13M / yr · est. range** | +$15–25M |
| Strategy B stakes range (signal card) | **+$4–7M / yr · est. range** | +$8–14M |
| Strategy C stakes range (signal card) | **+$3–5M / yr · est. range** | +$6–10M |
| Refused rate-match value forgone | **+$8M forgone** | +$15M forgone |
| UDAAP margin | 0.93 | 0.93 *(unchanged)* |
| Stickiness discriminator threshold | 0.70 | 0.70 *(unchanged)* |
| Stickiness threshold prior shift | 0.65 → 0.70 | unchanged |
| Primacy-index weight prior shift | 0.18 → 0.31 | unchanged |

**Theme card valueM**: keep at **2100** (= $2.1B deposits *under observation* — that's the cohort scope, not retained value, so the larger figure is still correct on the Cockpit tile).

### Decision 3 · Bundle binding

Hardcoded retention hero in `Theme.jsx` (mirrors how gig overrides via `gigSignals.js`). Do NOT add a synthetic cluster to the TWINX bundle. Theme.jsx adds explicit `ID === "retention"` branches for hero strings, ID-strip pills, and side metrics.

### Decision 4 · Implementation orchestration

Phase-by-phase build. After each phase the `pr-review-toolkit:code-reviewer` agent reviews the diff against this blueprint. Fidelity drift gets fixed before moving on.

### Decision 5 · Pre-simulation range strings (Analyze hero) — tuned down accordingly

```
Retained deposits         +$8–13M / yr · est. range
Balance runoff reduction  −1.3 to −2.0pp · est. range
Spread protected          +$170–260K / yr · est. range
Customer fatigue          +90 to +160 complaints / qtr · est. range
```

---

## A · Theme Placement (Sense / Cockpit)

### A1. Replacement entry for `churn` in `INTERNAL_THEMES` (`src/data/themes.js`)

Replace the existing `churn` object (line 29) with:

```js
{
  id: "retention",
  type: "Deposit Retention",
  name: "Mass Affluent · Deposit Drift",
  obj: "ret",
  status: "confirmed",
  valueM: 2100,
  vq: "deposits under observation",
  count: 241,
  vel: 7,
  conf: 87,
  urg: 0.80,
  desc: "Balance decline, outbound ACH acceleration and weakened operating behaviour — three joint signals marking a cohort whose deposit primacy is eroding before it shops for rate.",
  macro: "Rate-cut cycle + open-banking switching friction falling",
  pinned: true,
}
```

**Status justification:** `"confirmed"` — all four signal categories (deposit, money-movement, engagement, risk/model) are corroborated simultaneously, and a prior closed RCT (Strategy A v1) has already validated the drift classification model. The cluster is not `"spiking"` because drift_state is stable (this is the demo's key contrast with the old churn theme). It is not `"strengthening"` because the prior pilot shipped and its priors are now ingested. `"confirmed"` is earned.

**valueM = 2100:** The user narrative states $2.1B deposits under observation. `valueM` in themes.js is expressed in millions. 2100 = $2.1B, which sorts the retention tile above elder/mobile/wallet (all < $100M) but below the branch ($1.9B) and gig ($1.4B) acquisition themes — placing retention prominently in the "ret" color band. The tile communicates $2.1B defensible base.

**pinned: true** is a new field added only to this entry (and optionally later to gig if desired). The sort logic must honor it.

### A2. Treemap sort tweak (`src/pages/Cockpit.jsx`, `Treemap` function)

In the `sortedThemes` declaration (current line ~98–100):

```js
// BEFORE:
.sort((p, q) => order[p.t.obj] - order[q.t.obj] || q.a - p.a)

// AFTER:
.sort((p, q) => {
  // pinned tiles always precede non-pinned within their obj-group
  if (p.t.obj === q.t.obj) {
    if (!!p.t.pinned !== !!q.t.pinned) return p.t.pinned ? -1 : 1;
  }
  return order[p.t.obj] - order[q.t.obj] || q.a - p.a;
})
```

This keeps the inter-group `acq → deep → ret` order intact but within the `ret` group the pinned retention tile renders first, followed by mobile, wallet, elder by area.

### A3. New `INTERNAL_SIGS` entries (add to existing array in `themes.js`)

```js
["#ffb15a", "Balance decline −14% · mass-affluent cohort", "deposit-ledger", "retention"],
["#ffb15a", "Outbound ACH spike +21% · 90d rolling", "ach-monitor", "retention"],
["#ff6b6b", "Attrition decile elevated · scoring engine", "risk-model", "retention"],
["#4fd1c5", "DDA activity −12% · operating-balance erosion", "core-dda", "retention"],
```

### A4. New `INTERNAL_FORMING` entry (add to existing array)

```js
{ nm: "Direct-deposit decay ahead of primacy loss", em: "payroll-inflow decline detected 60 days before rate-shopping in the operating-balance eroder sub-segment", obj: "ret" },
```

### A5. `MACRO_THEMES` update

The existing `ratecut` entry (`id: "ratecut"`) carries `footprint: "Rate-sensitive mass-affluent churn"`. This string is now stale because the retention theme replaces churn. **Update that field only:**

```js
// In the ratecut entry, change:
footprint: "Rate-sensitive mass-affluent churn"
// To:
footprint: "Mass-affluent deposit-drift retention theme"
```

No other macro entry requires changes — `openbank` (`footprint: "Aggregator-login churn signals"`) should be updated to `"Aggregator-login deposit-drift signals"` for consistency, but it is not strictly load-bearing.

### A6. Theme routing entry in `Theme.jsx` `macroFor()` helper (line ~48)

Add:
```js
retention: "Rate-cut cycle + open-banking switching friction falling",
```

---

## B · Theme Page Rendering (`Theme.jsx` branch)

### B1. SignalsSection branch — required

The retention theme must use the `SignalsSection` path, identical to how gig does. Rationale: retention has three mechanism-distinct hypotheses (A=price-guardrailed deposit defence, B=operating primacy re-anchor, C=banker-touch save), and the signal card format (WHO/WHAT/WHY + three KPI tiles) is precisely the right surface for a cohort-level narrative. The `renderHypotheses()` + `renderPersonas()` branch is unsuitable because it requires a bundle-bound cluster and reads from TWINX.hypotheses — the retention journey is parameterized via retentionSignals.js, not the TWINX bundle.

### B2. Routing in `gotoPipeline()` and `openSignalInLoop()`

In `Theme.jsx` `gotoPipeline()` (current line ~487–491), add a retention branch:

```js
const gotoPipeline = (h) => {
  if (ID === "gig") { navigate("/gig-pipeline"); return; }
  if (ID === "retention") { navigate("/retention-pipeline"); return; }
  if (ID === "elder" || ID === "home") { navigate("/deep-pipeline?theme=" + encodeURIComponent(ID)); return; }
  navigate("/pipeline?theme=" + encodeURIComponent(ID) + "&mode=" + encodeURIComponent(MODE) + "&h=" + encodeURIComponent(h));
};
```

The `openSignalInLoop()` function already works generically — it calls `selectTheme(ID)` then routes to `/?seed_route=analyse`, which is correct for retention too. No change needed to `openSignalInLoop` itself.

### B3. Render assembly in `Theme.jsx`

In the `bound` branch that currently checks `ID === "gig"` (line ~938–966), extend:

```jsx
{(ID === "gig" || ID === "retention") ? (
  <SignalsSection
    signals={ID === "gig" ? gigSignals : retentionSignals}
    accent={ACC}
    onOpen={(hid) => openSignalInLoop(hid)}
  />
) : (
  <>
    {renderHypotheses()}
    {/* ... fingerprint + anchor + drift panels ... */}
  </>
)}
```

`retentionSignals` must be imported at the top of `Theme.jsx` alongside `gigSignals`:

```js
import retentionSignals from "@/data/retentionSignals";
```

### B4. `macroFor()` update

The retention theme's `ID` will be `"retention"`. Add to the `m` map in `macroFor()`:

```js
retention: "Rate-cut cycle + open-banking switching friction falling",
```

### B5. Hero / breadcrumb / ID strip strings

Because the retention theme is **not bundle-bound** (no TWINX cluster entry exists for it — it runs from retentionSignals.js just as gig does), the `bound` flag will be false. This means the hero renders the "External Context" fallback. Two options exist:

**Recommended approach:** Treat retention like gig — add a synthetic cluster entry to the TWINX bundle (complex), **OR** handle retention as a special case in Theme.jsx where `ID === "retention"` renders a hardcoded hero that matches the existing hero structure. The latter is lower-risk and consistent with the gig precedent (gig is bundle-bound but its signals are entirely overridden by gigSignals.js).

The implementation agent should add a small hardcoded hero block for retention in Theme.jsx's `renderHero()`:

```
hero-type:   "Deposit Retention"
hero-name:   "Mass Affluent · Deposit Drift"
hero-sig:    "Three converging signals — balance slope, outbound ACH acceleration, and operating-balance erosion — mark a cohort whose primacy is weakening before rate-shopping begins."
```

ID strip pills (retention-specific hardcoded values when `ID === "retention"`):
- status pill: `"confirmed"` (st-confirmed class, with live dot)
- objective: `"Retention"` (in --ret orange)
- cluster: `"cluster_mass_affluent_deposit_drift"` (the logical cluster id, even if not in TWINX bundle)
- drift: `"stable"` (st-ok pill — this is the critical contrast vs old churn theme)
- policy: `"v2"` (Strategy A v2 — the one consuming prior RCT priors)
- macro driver: `"Rate-cut cycle + open-banking switching friction falling"`

Side metrics:
- `$2.1B` deposits under observation
- `75,000` customers in cohort
- `3` hypotheses surfaced

---

## C · Three Signal Cards (`src/data/retentionSignals.js` — new file)

```js
/* ============================================================================
   Deposit Retention theme · 3 signals shown on the Theme page.

   The story is deposit primacy defence. The mechanism varies per signal:
   A = rate-guardrailed targeted deposit defence (price)
   B = operating-account primacy re-anchoring (behavioural)
   C = banker-save outreach for high-value at-risk (human touch)

   All WHO rows are cohort-level. No individual names.
   =========================================================================== */

const retentionSignals = [
  {
    id: 'A',
    status: { label: 'Active now', tone: 'amber', sub: 'accelerating' },
    title: 'Targeted Deposit Defense',
    statement: {
      who: '30K rate-sensitive mass-affluent · balance decline >10% · outbound ACH >$15K/90d · stickiness-discriminator score <0.55',
      what: 'Personalised CD or MMA offer, profitability-guardrailed, delivered via app+email for mid-value and banker for high-value · 20% holdout RCT',
      why: 'Rate sensitivity is real and measurable in this sub-segment — but the stickiness discriminator confirms these balances are genuinely elastic, not operationally anchored; a targeted offer is both defensible and auditable',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '30K',         unit: 'eligible customers',       context: 'after stickiness gate' },
      { kind: 'gate',   label: 'UDAAP gate',    value: '≥0.70',       unit: 'stickiness discriminator', context: 'auditable basis required' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$15–25M',    unit: 'retained deposits / yr · est. range', context: 'at 5.2% runoff rate' },
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
      who: '28K operating-account eroders · DDA activity −12% · direct-deposit decay detected · no rate-shopping signal yet',
      what: 'Re-capture direct deposit, reactivate bill-pay and automated transfers — pull money movement back before rate sensitivity develops; no rate concession',
      why: 'Operating-account weakening precedes rate-shopping by 60 days in this sub-segment — intervening at the primacy stage is cheaper and more durable than a rate response after the fact',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '28K',         unit: 'operating eroders',        context: 'DDA-decay + no rate signal' },
      { kind: 'gate',   label: 'Primacy gate',  value: '≥60d',        unit: 'decay window',             context: 'must precede rate-shopping' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$8–14M',     unit: 'retained deposits / yr · est. range', context: 'no offer cost' },
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
      who: '5K high-value customers · avg balance >$85K · elevated attrition decile · single-product depth',
      what: 'Banker alert with RM-scripted liquidity review conversation — no automated offer; human-touch save with personalised relationship context',
      why: 'Relationship economics make the cost-to-serve ratio for a banker conversation strongly positive at this balance tier; and the highest-value sub-segment is where stickiness is most over-estimated by single signals',
    },
    kpis: [
      { kind: 'scale',  label: 'Scope',         value: '5K',          unit: 'high-value customers',     context: '>$85K avg balance' },
      { kind: 'gate',   label: 'RM gate',       value: '≥$85K',       unit: 'balance threshold',        context: 'relationship economics' },
      { kind: 'stakes', label: 'Stakes (est.)', value: '+$6–10M',     unit: 'retained deposits / yr · est. range', context: 'high value · low volume' },
    ],
    recommended: { star: false, name: 'Banker Save Outreach' },
    ctaLabel: 'Open the Decision Loop →',
    championHypothesis: 'H-RET-2026-05-22',
  },
];

export default retentionSignals;
```

---

## D · Theme Config (`src/data/themeConfigs.js` — replace `churn` entry)

### D1. Remove `churn` from `CONFIGS`, add `retention`

```js
retention: {
  theme: "retention",
  cluster: "cluster_mass_affluent_deposit_drift",
  name: "Mass Affluent · Deposit Drift",
  objective: "ret",
  engine: "D",           // Deepen/defend balances
  inverted: false,
  experiment: "holdout", // 20% holdout RCT — Strategy A is the primary test
  badge: "RETENTION",
  claim: "Balance decline, outbound ACH acceleration and operating-behaviour erosion are converging in the mass-affluent cohort — three joint signals that precede rate-shopping by 60 days. The stickiness discriminator separates the actionable sub-segment from the operationally-anchored majority.",
  valueLever: "Deepen/defend balances",
  buyer: "Consumer Deposits / Treasury Pricing",
  valueBridge: {
    retainedDeposits: "+$19.3M",
    spreadProtected: "+$386K",
    runoffReduction: "−2.3pp",
    headline: "retained deposits + spread protected",
  },
  bindingConstraint: {
    owner: "Compliance / Legal / MRM",
    text: "Differential deposit offers without an auditable, consistent basis are a UDAAP risk; the stickiness discriminator is the required evidence that targeted customers are genuinely elastic, not operationally-sticky balances being re-priced away from.",
  },
  teeth: ["udaap", "drift"],
  pop: 75000,
  share: 0.095,
  personas: ["drift_saver", "operating_eroder", "stickiness_edge"],
  twins: {
    product: {
      nm: "Deposit pricing and offer economics",
      sub: "margin math + offer cost",
      hero: false,
      sim: "Holds the CD/MMA offer economics — what each rate band does to retained balances, spread protected and offer cost net. The profitability guardrail caps the offer ceiling so each retained dollar is margin-positive.",
      fid: [["band model", "tiered"], ["profitability guardrail", "active"], ["margin floor", "RAROC-calibrated"]],
    },
    process: {
      nm: "UDAAP review + stickiness-discriminator audit",
      sub: "fairness checkpoint",
      hero: false,
      sim: "Models the differential-offer review — confirming the stickiness discriminator is the auditable, consistent basis that makes the offer UDAAP-defensible. Every targeted customer must score <0.70 on the stickiness scale.",
      fid: [["UDAAP basis", "discriminator score"], ["audit trail", "per-customer"], ["review", "pre-deploy"]],
    },
    channel: {
      nm: "App + email (mid-value) / Banker (high-value)",
      sub: "channel ladder",
      hero: true,
      sim: "Governs how the offer reaches the customer: app+email for mid-value (cost-effective scale), banker outreach for high-value (relationship-tier economics). The channel ladder is what determines customer fatigue and RM capacity utilisation.",
      fid: [["mid-value", "app+email"], ["high-value", "banker"], ["fatigue ceiling", "modelled"]],
    },
  },
  macro: {
    state: "Rate-cut cycle turning + 1033 open-banking switching friction falling",
    drift: false,          // STABLE — this is the key contrast vs old churn theme
    sub: "stable — frames the deposit-drift velocity without destabilising the model",
    field: ["rate path / deposit beta", "open-banking portability acceleration", "competitor HY promo intensity", "mass-affluent behaviour shift lag"],
  },
  // cautionNote and driftState are intentionally removed — the retention
  // theme's drift_state is STABLE. Those fields existed on churn specifically
  // to signal the gate-refusal beat. For retention the refusal beat lives
  // inside the refused sub-strategy (see Section I). No caution on the
  // primary retention theme.
  //
  // content sub-tree not populated — retention mirrors gig's approach of
  // driving everything from retentionSignals.js rather than the content
  // block. This keeps the Theme.jsx render path clean and avoids a
  // half-populated content object that conflicts with SignalsSection.
},
```

---

## E · Personas / Archetypes (`PERSONAS` map in `themeConfigs.js`)

### E1. Remove `walter` and `beatrice` from `PERSONAS`

Both entries are cluster-scoped to `"churn"` (walter's `cluster: "churn"`, beatrice's `cluster: "churn"`). Remove them entirely. The refusal beat they previously illustrated is preserved via the refused sub-strategy design in Section I.

### E2. Three retention archetypes (cohort-descriptor labels — no first names)

```js
drift_saver: {
  id: "drift_saver",
  init: "DS",
  nm: "The Drifting Saver",
  cluster: "retention",
  tag: "rate-sensitive · 14% balance decline",
  kind: "target",
  sb: "Mass-affluent saver · multi-channel deposit · outbound ACH accelerating",
  moment: "A $18K outbound ACH lands as part of a 6-month balance erosion pattern in this archetype's median customer. Aggregator login activity appeared 45 days prior. The stickiness discriminator scores this archetype 0.41 — genuinely elastic, not operationally anchored.",
  fv: [
    ["balance slope 90d",          0.78],  // high = steep decline
    ["operating-balance volatility", 0.62],
    ["direct-deposit decay",        0.55],
    ["primacy index",               0.38],  // low = weakening primacy
    ["rate-elasticity score",       0.81],
    ["stickiness discriminator",    0.41],  // low = elastic
  ],
},
operating_eroder: {
  id: "operating_eroder",
  init: "OE",
  nm: "The Operating-Account Eroder",
  cluster: "retention",
  tag: "DDA decay · pre-rate-shopping",
  kind: "target",
  sb: "Operating account weakening before rate signal appears",
  moment: "DDA transaction count has fallen 18% over 90 days. Direct-deposit frequency dropped from biweekly to monthly. Bill-pay deactivated on 3 recurring payees. No aggregator activity yet — this archetype is 60 days ahead of the rate-shopping window.",
  fv: [
    ["balance slope 90d",          0.42],  // modest balance decline — not the leading signal
    ["operating-balance volatility", 0.79],
    ["direct-deposit decay",        0.84],  // high = severe decay
    ["primacy index",               0.28],  // very low — primacy already eroded
    ["rate-elasticity score",       0.31],  // not yet rate-shopping
    ["stickiness discriminator",    0.52],
  ],
},
stickiness_edge: {
  id: "stickiness_edge",
  init: "SE",
  nm: "The Stickiness Edge Case",
  cluster: "retention",
  tag: "operationally sticky · FALSE POSITIVE",
  kind: "falsepos",
  sb: "Looks elastic on one signal · operationally anchored balances",
  moment: "Single aggregator login and a $12K outbound transfer fire a drift alert. But this archetype's operating balance funds payroll disbursements and two standing ACH instructions. Stickiness discriminator scores 0.77 — above the 0.70 gate. Offering rate here is margin given away, and pricing the operationally-anchored majority differently is a UDAAP basis failure.",
  fv: [
    ["balance slope 90d",          0.51],
    ["operating-balance volatility", 0.31],
    ["direct-deposit decay",        0.22],
    ["primacy index",               0.74],  // high — still operationally primary
    ["rate-elasticity score",       0.44],
    ["stickiness discriminator",    0.77],  // high = sticky — this is the gate that protects
  ],
},
```

---

## F · Pipeline Route (`src/pages/RetentionPipeline.jsx` — new file)

### F1. Reuse vs. retention-specific

RetentionPipeline.jsx is a **forked copy of GigPipeline.jsx** with these elements reused verbatim:
- Stage scaffold: STAGES array structure (same 7 IDs: sense/hyp/model/sim/gate/test/learn)
- All JSX primitives: `KV`, `PanelHeader`, `Slider`, `SegRow`, `LineChart`, `KpiCard`, `GCard`, `SimBar`, `useAnimateArena`
- Stage navigation shell, progress ribbon, auto-advance logic
- CSS import: same `gigPipeline.css` (no new stylesheet required for MVP)

These must be **replaced with retention-specific content**:
- All `GIG` data object references → `RET` data object
- All math functions (`a1calc`, `chain`, `disparateImpact`, etc.) → retention equivalents
- All `COHORT` / `RAILSHARE` constants → retention equivalents
- `BASE_LEVERS` → retention-appropriate default lever values
- `SimBar` animation strings

### F2. `RET` data object (top-level constants)

```js
const RET = {
  cluster: {
    id: "cluster_mass_affluent_deposit_drift",
    name: "Mass Affluent · Deposit Drift",
    population: 75000,
    share: 0.095,
    policy: "v2",
    drift: "stable",   // THE KEY CONTRAST
  },
  signals: [
    { ic: "📉", t: "Balance decline − 14% · 90d rolling",         d: "Aggregate deposit balance slope across cohort — steady erosion, not volatile, pointing to a structural drift rather than a seasonal pattern.",         v: "−14% · 90d slope" },
    { ic: "📤", t: "Outbound ACH spike +21% · 90d rolling",        d: "Acceleration in outbound ACH volume to external destinations — both large periodic transfers and accumulating smaller ones.",                            v: "+21% ACH out · 90d" },
    { ic: "🏦", t: "Operating-balance drop − DDA activity −12%",   d: "DDA transaction count and operating-balance utilisation declining — the primary account is being used less, not just holding less.",                    v: "DDA −12% · primacy index 0.38" },
    { ic: "📊", t: "Low product depth 49% single-product",         d: "Just under half the cohort holds only one product — an amplifier that raises runoff probability when any single signal deteriorates.",                  v: "49% single-product" },
    { ic: "🔁", t: "Direct-deposit decay detected · 60d lead",     d: "Payroll inflow frequency declining ahead of observable rate-shopping — the operating-account eroder archetype's leading indicator.",                   v: "DD decay · 60d lead" },
    { ic: "⚖️", t: "Stickiness-vs-elasticity gap · UDAAP safeguard", d: "1 in 4 flagged customers scores above 0.70 on the stickiness discriminator — operationally anchored balances that must not receive a differential price.", v: "sticky 1 in 4 · UDAAP gate" },
  ],
  reasons: [
    { n: "R1", t: "Balance slope + outbound ACH joint signal",       d: "The joint occurrence of balance decline and ACH-out acceleration is 2.3× more predictive than either signal alone — the combination identifies genuine drift-onset.",  pct: 84, a: "joint signal precision 0.84" },
    { n: "R2", t: "Operating-balance volatility 2.1× cohort median", d: "Month-to-month operating-balance swings exceeding 2× median are a reliable predictor of 90-day runoff in the mass-affluent segment.",                             pct: 78, a: "volatility ratio 2.1×" },
    { n: "R3", t: "Direct-deposit + bill-pay decay joint",           d: "Direct-deposit frequency decline combined with bill-pay deactivation marks the operating-account eroder sub-segment — intervening before rate-shopping develops.",     pct: 71, a: "DD+BP decay joint" },
    { n: "R4", t: "Drift distinguishable from rate-shopping onset",  d: "The drift classification model separates primacy-weakening (upstream behavioural) from active rate-shopping (aggregator logins + probing transfers) — they are different intervention windows.", pct: 66, a: "drift vs shopping separability" },
    { n: "R5", t: "Low product depth amplifier",                     d: "Single-product customers with no secondary anchor have a 1.9× higher 12-month attrition probability — product depth is not the cause but amplifies every other signal.", pct: 62, a: "depth multiplier 1.9×" },
  ],
  hyps: [
    { id: "H-RET-2026-05-14", kind: "Targeted Deposit Defense", win: true,
      desc: "Personalised CD/MMA offer to the rate-sensitive, stickiness-discriminator-confirmed sub-segment. Profitability-guardrailed offer ceiling. App+email for mid-value, banker-touch for high-value. 20% holdout.",
      params: [["stickiness gate", "<0.70"], ["offer ceiling", "profitability-guardrailed"], ["channel", "app+email / banker"], ["holdout", "20%"]],
      out: [["retained deposits", "+$19.3M", 1], ["runoff", "5.2% (was 7.5%)", -1], ["spread protected", "+$386K", 1], ["offer cost", "−$140K", -1]],
    },
    { id: "H-RET-2026-05-21", kind: "Primacy Re-Anchoring", win: false,
      desc: "Re-capture direct deposit and bill-pay for the operating-account eroder sub-segment. No rate concession — pull the operating anchor back, not the rate lever.",
      params: [["trigger", "DD_decay_60d"], ["action", "re-capture DD + bill-pay"], ["rate concession", "none"]],
      out: [["primacy index", "+0.18 pp", 1], ["DDA activity", "+9%", 1], ["offer cost", "$0", 1]],
    },
    { id: "H-RET-2026-05-22", kind: "Banker Save Outreach", win: false,
      desc: "RM alert with liquidity-review script for the high-value sub-tier. Human-touch, no automated offer. Relationship economics make this positive at >$85K balance.",
      params: [["trigger", "attrition_decile_top_10"], ["threshold", ">$85K balance"], ["channel", "banker"], ["script", "liquidity review"]],
      out: [["retained deposits", "+$6–10M", 1], ["RM cost", "+$48K", -1], ["NPS delta", "+2.1", 1]],
    },
    // Refused sub-strategy — the refusal log beat
    { id: "H-RET-2026-REFUSED", kind: "Pure-Price Rate Match", win: false, fail: "drift",
      desc: "Blanket rate match for the entire drift-flagged cohort — no stickiness gate, no offer ceiling, no sub-segment targeting. Tempting at ~$15M, but the rate-sensitive drift sub-segment's model is unstable.",
      params: [["scope", "full cohort"], ["stickiness gate", "none"], ["offer ceiling", "none"]],
      out: [["margin risk", "+$15M gross but model unstable", -1], ["UDAAP", "basis not established ⛔", -1], ["drift", "rate_sensitive_drift_sub ⛔", -1]],
    },
  ],
};
```

### F3. Appbar / subbar content (retention-specific)

```
sb-badge:  "RETENTION"
sb-claim:  "75K mass-affluent customers · balance erosion and primacy weakening detectable 60 days before rate-shopping begins — Strategy A confirmed."
sb-chips:  population "75,000 customers" · drift "stable" · policy "v2"
```

### F4. Stage-by-stage content brief

**Stage 1 — Sense:**
- Cluster KV grid: population 75,000 / share 9.5% / policy v2 / drift STABLE / balance slope −14% / outbound ACH +21%
- 6 signal chips (from `RET.signals`)
- 5 reason cards with likelihood bars (from `RET.reasons`)
- `chain()` animated output line: `"Joint signal confirmed · 84% precision · eligible pool 30K after stickiness gate"`

**Stage 2 — Hypothesize:**
Three hypothesis cards from `RET.hyps`. Strategy A starred as champion. Refused sub-strategy displayed but visually marked `REFUSED · drift` in amber/red — same treatment as gig's non-winner hypotheses but with an explicit fail indicator.

**Stage 3 — Model:**
Left panel — 3 retention archetypes (DS / OE / SE) with feature-vector bars as in GigPipeline twin layout. Note reads: `"DS is the primary target; OE is the primacy-mechanism case; SE is the UDAAP stickiness safeguard. The simulator runs against whichever archetype/cohort is selected."` Right panel — 7 retention models:
1. `"Drift-classification model"` — status: stable, ≤30 injections (key contrast: gig's churn model had 380 injections)
2. `"Operating-balance primacy index"` — measures how much of a customer's financial life runs through the account
3. `"Direct-deposit decay detector"` — 60-day lead indicator for operating-account erosion
4. `"Stickiness-vs-elasticity discriminator"` — the UDAAP safeguard, AUC 0.86, audited
5. `"Outflow propensity CATE on retention offers"` — conditional average treatment effect model
6. `"RM-touch ROI model"` — prices the banker save conversation against expected balance retention
7. `"Profitability guardrail model"` — caps offer rate so each retained dollar earns above RAROC floor

Capability bar: `"7 models · drift-state STABLE · UDAAP discriminator audited · prior priors ingested from Strategy A v1 RCT"`

**Stage 4 — Simulate:**
7 lever sliders:
1. Min balance threshold (cohort gate, $20K–$100K, step $5K, default $25K)
2. Balance-decline % trigger (5%–25%, step 1%, default 10%)
3. Outbound ACH spike trigger (10%–40%, step 5%, default 20%)
4. Offer rate ceiling (bps above current rate, 10–80bps, step 5bps, default 40bps with profitability guardrail active)
5. Channel mix (segmented control: app+email / banker / both)
6. Holdout % (10%–30%, step 5%, default 20%)
7. Eligibility window weeks (4–16 weeks, step 2, default 8)

Cohort selector (3 preset cards): Full cohort 75K / Rate-sensitive eligible 30K (default) / Operating-eroder sub-segment 28K. Run button.

3-column outcome cards:
- Retained deposits ($19.3M at defaults)
- Balance runoff reduction (7.5% → 5.2%, −2.3pp)
- Spread protected ($386K at defaults)

Guardrail row: `UDAAP basis evidenced ✓` / `Stickiness discriminator engaged (≥0.70 gate) ✓` / `RAROC ≥ floor ✓`

**Stage 5 — Gate:**
4 approval rows:
- **PO** (Policy Owner) — `"Sam Kayne · Director · Money Movement"` — pending → approve
- **MR** (Model Risk) — `"P. Reyes · MRM lead"` — **PASSES** because drift_state is STABLE (≤30 injections). Note explicitly: `"Drift state STABLE · prior RCT priors ingested · discriminator audited. MRM approved."` This is the demo beat.
- **FC** (Fairness / Compliance) — `"J. Torres · Fair Banking"` — passes on UDAAP basis evidenced by stickiness discriminator
- **CB** (Commercial Banking lead) — `"L. Okafor · Deposits Business"` — approves on profitability guardrail confirmed

The MRM row note is critical: `"Previously refused: rate_sensitive_drift sub-segment (380 injections). This cohort: stable drift classification (28 injections) — different model, different verdict."`

**Stage 6 — Test:**
Champion/challenger bar chart, 6 weekly groups, treatment in `--ret` orange vs control grey. Week 5 fires WINNER label.

Resolution KV:
- `"Retained deposits lift"`: treatment 5.2% runoff vs control 7.5% runoff
- `"Lift CI"`: −2.1pp to −2.5pp (95%)
- `"UDAAP margin"`: 0.93 (vs 0.85 floor)
- `"Stickiness gate compliance"`: 100% of treated customers scored <0.70

**Stage 7 — Learn:**
Loop diagram showing writeback: retention RCT → updates drift-classification model priors + primacy-index weights + stickiness-discriminator threshold.

3 writeback ledger lines (exact final copy):
1. `"Stickiness-discriminator threshold validated at 0.70: across 22,400 treated customers, the gate cleanly separated elastic from anchored balances — no UDAAP complaint generated"`
2. `"Rate-elasticity model downgraded for operating-account-eroder sub-segment; primacy-index mechanism upgraded — operating behaviour precedes rate response and is the more reliable intervention trigger"`
3. `"Strategy B (Primacy Re-Anchoring) promoted to its own concurrent pilot — direct-deposit recovery overshot prediction by +8pp, confirming the operating-anchor mechanism is stronger than modelled; drafted as H-RET-2026-06-01"`

### F5. SimBar animation strings (replace gig strings)

```js
// In useAnimateArena (retention version):
onState({ cls: "run", txt: `simulating week ${wk.toFixed(1)} / ${weeks} · 800 deposit scenarios/wk` }, ...)
// On completion:
onState({ cls: "done", txt: `converged · ${weeks}-week horizon · runoff CI tightened` }, 100)
```

---

## G · Workspaces

### G1. Confirmation: retention uses both paths

Retention mirrors gig exactly: the signal card CTA fires `openSignalInLoop()` → navigates to `/?seed_route=analyse` → enters the workspace flow. The standalone `/retention-pipeline` page also exists for users who drill through from the theme tile's `gotoPipeline()` path. Both paths are live.

### G2. AnalyzeWorkspace for retention

The AnalyzeWorkspace is currently hypothesis-scoped (it reads `selectedHypothesis` from AppShell). When `selectedTheme === "retention"`, the workspace should render retention-specific content. The implementation approach is to extend the existing theme-branch logic that already distinguishes gig from other themes.

**Hero KPI ranges (pre-simulation, with `· est. range` suffix):**
```
Retained deposits         +$15–25M / yr · est. range
Balance runoff reduction  −1.8 to −2.8pp · est. range
Spread protected          +$300–500K / yr · est. range
Customer fatigue          +120 to +280 complaints / qtr · est. range
```

**5 reason cards (same content as RetentionPipeline Stage 1, exact strings):**
- R1: "Balance slope + outbound ACH joint signal" · 84% · `joint signal precision 0.84`
- R2: "Operating-balance volatility 2.1× cohort median" · 78% · `volatility ratio 2.1×`
- R3: "Direct-deposit + bill-pay decay joint" · 71% · `DD+BP decay joint`
- R4: "Drift distinguishable from rate-shopping onset" · 66% · `drift vs shopping separability`
- R5: "Low product depth amplifier" · 62% · `depth multiplier 1.9×`

**3 SenseAssetCard group entries to add to `src/data/sensedAssets.js`:**

Group `data` — 3 new entries (ids 13–15):
```
13: "Deposit-flow ledger"
    subtitle: "Balance + ACH movement events"
    quickNumbers: "4.2M · 18mo"
    informs: "balance slope + outbound ACH acceleration"
    provenance: owner "Core Banking · Data Engineering" · refresh "streaming · sub-second" · validated "MRM-approved"
    forThisSignal: [
      { label: "Balance observation events", value: "4.2M over 18 months" },
      { label: "Cohort balance decline events", value: "~10,500 / month" },
      { label: "Outbound ACH events flagged", value: "847K over 90 days" },
      { label: "Cohort coverage", value: "75,000 of 75,000 (100%)" },
    ]
    compositionChain: feedsInto [drift-classification model, primacy index, profitability guardrail]

14: "DDA-activity stream"
    subtitle: "Operating account transaction counts"
    quickNumbers: "DDA −12% · 90d"
    informs: "primacy-index erosion + operating eroder detection"

15: "RM-CRM signals"
    subtitle: "Banker relationship activity + notes"
    quickNumbers: "5K high-value · RM-active"
    informs: "banker save outreach eligibility + relationship context"
```

Group `detection` — 2 new entries (ids 16–17):
```
16: "Drift-classification model"
    subtitle: "Stable · ≤30 injections"
    quickNumbers: "AUC 0.88 · stable"
    informs: "deposit-drift onset · primary signal qualifier"

17: "Operating-balance primacy index"
    subtitle: "Primacy erosion detector"
    quickNumbers: "60d lead · AUC 0.85"
    informs: "operating eroder sub-segment identification"
```

Group `guardrail` — 2 new entries (ids 18–19):
```
18: "Stickiness-vs-elasticity discriminator"
    subtitle: "UDAAP safeguard · audited"
    quickNumbers: "AUC 0.86 · threshold 0.70"
    informs: "UDAAP basis for differential offer"

19: "Profitability guardrail + RAROC floor model"
    subtitle: "Offer-ceiling enforcement"
    quickNumbers: "RAROC floor live"
    informs: "offer rate ceiling per customer"
```

### G3. SimulateWorkspace for retention

**RECOMMENDED lever defaults (autopilot anchor):**
```js
const RECOMMENDED_RETENTION = {
  minBalanceK: 25,
  balanceDeclinePct: 10,
  achSpikePct: 20,
  offerCeilingBps: 40,
  channelMix: "app_email_banker",   // app+email for <$85K, banker for ≥$85K
  holdoutPct: 20,
  eligibilityWeeks: 8,
  // primacy re-anchor follow-on toggle (Section lever 5):
  primacyFollowOn: false,
  followOnDDReactivation: true,
  followOnBillPayReactivation: true,
};
```

**simulateOutcomes() calibration anchors for retention:**
```
cohortTotal             = 75,000
eligibleAfterGate       = 28,000  (Strategy A stickiness-gate eligible)
retainedDeposits_8wk_M  = calibrate to yield $19.3M annual at defaults
retainedDeposits_annual_M = 19.3
balanceRunoffBaseline   = 0.075   (7.5%)
balanceRunoffWithPolicy = 0.052   (5.2%)
complaintsDelta         = +180    (customer fatigue, per qtr)
UDAAP_margin            = 0.93
treatmentN              = 22,400  (80% of 28K eligible)
controlN                = 5,600   (20% holdout)
offerCost_M             = 0.140   ($140K)
spreadProtected_K       = 386
```

**5 lever section bands:**

| Band | Color | Levers |
|---|---|---|
| COHORT | violet | Min balance threshold (slider) · Population segment (3-way: full 75K / rate-sensitive 30K / operating eroder 28K) |
| ELIGIBILITY | amber | Balance decline % trigger · Outbound ACH spike trigger · Stickiness discriminator gate (read-only display: 0.70 fixed — the UDAAP basis; label it "UDAAP gate · fixed at 0.70") |
| OFFER | blue | Offer rate ceiling bps (with profitability guardrail indicator showing RAROC floor in real time) · Channel mix (segmented control) |
| COMMUNICATIONS | green | Holdout % · Eligibility window weeks · RM capacity utilisation (slider: 20%–100%, step 10%) |
| PRIMACY RE-ANCHOR FOLLOW-ON | grey/collapsed | Toggle "Include Strategy B primacy re-anchor in this test" (checkbox, default off) · If on: DD-reactivation prompt (on/off) · Bill-pay reactivation prompt (on/off) · Follow-on trigger delay (weeks after Strategy A treatment: 2–8 weeks, step 2) |

**3 ProofKpi cards:**

Card 1 — Retained Deposits:
```
label:     "Retained Deposits"
with-policy: "$19.3M / 12wk"
baseline:  "$0 · BAU runoff uninterrupted"
delta pill: "+$19.3M"
```

Card 2 — Balance Runoff Reduction:
```
label:       "Balance Runoff Rate"
with-policy: "5.2%"
baseline:    "7.5% · BAU"
delta pill:  "−2.3pp"
```

Card 3 — UDAAP Margin:
```
label:       "UDAAP Margin"
with-policy: "0.93"
baseline:    "0.85 floor · deployment minimum"
delta pill:  "+0.08 above floor"
```

**4 guardrail strip pills:**
1. `RAROC ≥ floor` (profitability guardrail — green if offer ceiling holds)
2. `UDAAP basis evidenced` (stickiness discriminator gate — green if threshold respected)
3. `Fraud envelope within Q2 bound` (deposit-offer fraud check)
4. `Model risk SR 11-7 · drift stable` (MRM gate — green because drift_state is stable)

**2×2 simulated-outcomes tile grid:**
- top-left: Balance retention area chart (treatment cohort balance slope vs control, treatment stabilizes)
- top-right: Weekly runoff rate bar chart per week (treatment arm runoff declining from 7.5% toward 5.2%)
- bottom-left: Direct-deposit recovery bar (weekly DD inflow frequency — with `lagInsight` string: `"Direct-deposit recovery lags offer acceptance by ~3 weeks — the primacy mechanism takes time to re-route payroll"`)
- bottom-right: Cohort composition donut by archetype (DS / OE / SE proportions in treated group)

**Verdict strings:**
```
proven:     "Targeted Deposit Defense · confirmed. Strategy A lands inside CI on all primary KPIs · UDAAP margin held · pilot ran full duration. Promoted to full rollout effective week 9."
mixed:      "Retained deposits within CI · UDAAP margin held · direct-deposit recovery outside predicted range (overshoot). Primary KPIs pass; secondary mechanism stronger than modelled."
disproven:  "Retained deposits outside CI · policy did not materially reduce runoff at this offer ceiling. Recommend raising offer ceiling within profitability guardrail or narrowing to high-value sub-tier only."
```

### G4. DeployWorkspace for retention

**New portfolio row entry:**
```js
{
  id: "mock-ret-1",
  name: "Targeted Deposit Defense · Strategy A v2",
  hypothesis: "H-RET-2026-05-14",
  cluster: "mass-affluent-deposit-drift",
  themeName: "Deposit Retention",
  stage: "approval",
  stagedBy: "user",
  stagedAt: "2026-05-27",
  approverName: "Sam Kayne",
  approverRole: "Director · Money Movement",
  blurb: "Personalised CD/MMA offer to rate-sensitive, stickiness-gated sub-segment. 20% holdout RCT. 8-week pilot.",
}
```

**ExperimentWorkflow 5-stage panels:**

Stage 1 — Approval (3 approvers):
- Risk · CRO: `"L. Okafor · Chief Risk Officer"` — approved (overnight on pre-flight)
- MRM: `"P. Reyes · MRM lead"` — approved · `"Drift state STABLE · prior RCT priors ingested · stickiness discriminator audited · SR 11-7 compliant"`
- Business Lead: `"Sam Kayne · Director · Money Movement"` — **pending** (the human-in-the-loop click)

Stage 2 — Compliance (auto-checks):
- MRM model card v2.1 ✓
- UDAAP stickiness basis evidenced (discriminator AUC 0.86, threshold 0.70) ✓
- RAROC guardrail within bound ✓
- Fraud envelope (deposit-offer type) within Q2 bound ✓

Stage 3 — Go Live with RCT:
```
Duration:          8 weeks
Treatment cohort:  22,400 · stickiness-discriminator confirmed
Control cohort:    5,600 · matched on deposit-drift decile
Primary KPIs:      Retained deposits · Balance runoff % · Direct-deposit recovery · UDAAP margin
Guardrails:        RAROC floor · UDAAP basis · fraud envelope · auto-rollback armed
First interim audit: Wk 2
```

Go-Live transition phrases (5-line sequence):
```
"Allocating treatment cohort · 22,400 customers · stickiness score <0.70"
"Allocating control cohort · 5,600 customers · matched on balance-drift decile"
"Routing first treatment arm · offer delivery via app+email and banker queue"
"Arming auto-rollback sentinels · UDAAP margin + RAROC floor + fraud envelope"
"Connecting to live monitoring · interim audit at wk 2 scheduled"
"RCT live ✓"
```

Stage 4 — Live Pilot KPI grid (4 cards):
1. Retained deposits: treatment cohort balance slope vs control
2. Balance runoff %: treatment vs control weekly
3. Direct-deposit recovery: treatment vs control (lags by ~3 weeks — the kicker)
4. UDAAP margin: maintained throughout (0.93 steady)

Stage 5 — Learnings (final outcomes table):

```
KPI                        Predicted (pre-RCT)    Actual (RCT realised)    Variance
Retained deposits          +$19.3M / yr           +$18.8M                  within CI
Balance runoff reduction   −2.3pp                 −2.2pp                   within CI
Direct-deposit recovery    +6pp                   +14pp                    OVERSHOOTS ⚡
UDAAP margin               0.93                   0.93                     held exact
```

The overshoot on direct-deposit recovery is the kicker: removing a deposit-drift signal apparently prompts a re-routing of primary payroll that the model did not anticipate. This writeback drives the Section G5 prior anchor and Section H closed-loop story.

**Retention-specific RCT KPIs** (experiment-type-to-KPI map entry):
```
type: "deepen_defend_deposits"
kpis: ["retained_deposits", "balance_runoff_pct", "direct_deposit_recovery", "udaap_margin"]
```

### G5. LearnWorkspace for retention

**New `MOCK_EXPERIMENTS` entry** (add to the array — retention pilot closed last quarter):

```js
{
  id: "exp-ret-2026-0041",
  name: "Targeted Deposit Defense · Strategy A v1",
  hypothesis: "H-RET-2026-02-10",
  cluster: "mass-affluent-deposit-drift",
  themeName: "Deposit Retention",
  fidelity: 0.91,
  outcome: "promoted",
  closedAt: dayBack(49),
  fidelityRows: [
    { k: "Retained deposits",        predicted: "+$18.6M / yr",  actual: "+$18.8M",     tone: "ok" },
    { k: "Balance runoff reduction",  predicted: "−2.2pp",        actual: "−2.2pp",      tone: "ok" },
    { k: "Direct-deposit recovery",   predicted: "+6pp",          actual: "+14pp",       tone: "warn" },  // OVERSHOOT
    { k: "UDAAP margin",              predicted: "0.93",          actual: "0.93",        tone: "ok" },
    { k: "Customer fatigue",          predicted: "+210 / qtr",    actual: "+198 / qtr",  tone: "ok" },
  ],
  writeback: [
    "Stickiness-discriminator threshold validated at 0.70: gate confirmed across 22,400 treated customers — no UDAAP complaint generated",
    "Rate-elasticity model downgraded for operating-account-eroder sub-segment; primacy-index mechanism upgraded — direct-deposit recovery overshot +8pp, confirming operating-anchor intervention is stronger than modelled",
    "Strategy B (Primacy Re-Anchoring) promoted to its own concurrent pilot — drafted as H-RET-2026-06-01",
  ],
  modelUpdates: [
    { driver: "retention.stickiness_discriminator.threshold", before: 0.65, after: 0.70, dir: "up",   sourceKpi: "UDAAP margin",              note: "Threshold tightened post-pilot — 0.70 confirmed as the auditable gate" },
    { driver: "retention.rate_elasticity.operating_eroder_weight", before: 0.42, after: 0.28, dir: "down", sourceKpi: "Direct-deposit recovery", note: "Operating-primacy mechanism stronger than rate-elasticity in this sub-segment" },
    { driver: "retention.primacy_index.dd_recovery_weight",   before: 0.18, after: 0.31, dir: "up",   sourceKpi: "Direct-deposit recovery",   note: "Direct-deposit recovery overshoot (+8pp) → upgrade primacy-index contribution" },
  ],
},
```

**New `SYSTEMIC_MISCALIBRATIONS` entry:**
```js
{
  id: "misc-ret-001",
  theme: "Deposit Retention",
  description: "Retention friction-removal under-predicts secondary primacy recovery",
  mechanism: "Strategy A's deposit-defence offer removes balance-drift anxiety, which prompts a subset of the treated cohort to re-route their primary payroll back — a second-order operating-anchor recovery the rate-elasticity model did not model. Effect: direct-deposit recovery overshoots by +8pp.",
  update: "Primacy-index contribution weight upgraded from 0.18 → 0.31 in the retention model stack. Rate-elasticity weight for the operating-eroder sub-segment downgraded 0.42 → 0.28.",
  nextAction: "Strategy B (Primacy Re-Anchoring) promoted to concurrent pilot to isolate and amplify the primacy mechanism independently of the rate-offer.",
}
```

---

## H · Closed-Loop Writeback Story (Rule 6 — Prior Anchor)

### H1. Prior anchor pill text

```
"PRIOR · ANCHORED · Using updated priors from exp-ret-2026-0041 · 
 stickiness threshold 0.65 → 0.70 · primacy-index weight 0.18 → 0.31"
```

### H2. Three model weight shifts that materially changed RECOMMENDED lever values

| Model weight | Before (Strategy A v1) | After (Strategy A v2) | Effect on levers |
|---|---|---|---|
| `stickiness_discriminator.threshold` | 0.65 | 0.70 | Eligibility gate tightened — eligible pool shrinks from ~32K to ~28K; treatment N shrinks proportionally. RECOMMENDED lever defaults now reflect the tighter gate. |
| `primacy_index.dd_recovery_weight` | 0.18 | 0.31 | Direct-deposit recovery now drives a larger share of the value estimate — the pre-sim range shifts upward (+3M on the upper bound of the retained-deposits range) |
| `rate_elasticity.operating_eroder_weight` | 0.42 | 0.28 | Operating-eroder sub-segment de-rated on pure rate elasticity — their default channel shifts from "app+email only" toward "app+email + DD-reactivation prompt" in the RECOMMENDED config |

### H3. Narrative arc

Yesterday's Strategy A v1 RCT (closed 49 days ago) returned two surprises: the stickiness discriminator held cleanly at 0.65 but auditors requested it be tightened to 0.70 for a stronger UDAAP basis, and direct-deposit recovery overshot by +8pp — the operating-anchor mechanism is more powerful than the rate-elasticity mechanism in a meaningful sub-segment.

Today's Strategy A v2 RECOMMENDED lever set reflects both: the offer ceiling is calibrated against the 0.70 gate (fewer customers eligible, each more confidently elastic), and the pre-sim range for retained deposits is slightly wider on the upper bound because the primacy-recovery effect is now costed in. The PriorAnchorPill in SimulateWorkspace surfaces this provenance at the top of the config section, before the user touches any lever.

---

## I · CXO Companion / Refusal Log

### I1. Recommendation: preserve via the refused-sub-strategy approach

The refusal beat is preserved as the `H-RET-2026-REFUSED` sub-strategy ("Pure-Price Rate Match") within the retention theme. This approach is superior to relocating to another theme for three reasons: (1) the refusal is mechanistically part of the retention story — the bank identified the drift sub-segment and chose not to act on it while acting on the stable sub-segment; (2) the contrast between "refused on drift" (the rate-matching play) and "cleared MRM on stable drift" (Strategy A) is the most compelling governance narrative in the demo; (3) relocating it to elder or home would break their narrative coherence.

### I2. Updated `PAGE` map in `CxoCompanion.jsx`

```js
// Replace:
churn: "/deep-pipeline?theme=churn",
// With:
retention: "/retention-pipeline",
```

### I3. Updated KB entries

**Entry id `"retention"` — replace existing:**
```js
{ id: "retention", lens: "FR", keys: ["retention", "risk", "losing", "attrition", "leave", "leaving", "biggest risk", "retain", "deposit drift", "deposit retention", "balance decline"],
  head: "Two sub-stories — one shipped, one deliberately refused.",
  body: <><B>Shipped:</B> Targeted Deposit Defense on the stable sub-segment — <G>$19.3M retained deposits</G>, stickiness discriminator confirmed, UDAAP basis auditable. <B>Refused:</B> rate matching on the drift sub-segment — <R>rate_sensitive_drift</R> on that slice, model unstable. The refusal is what makes the deployment credible.</>,
  ev: [{ c: "g", v: "+$19.3M", l: "retained" }, { c: "g", v: "−2.3pp", l: "runoff" }, { c: "r", v: "held", l: "drift sub-seg" }],
  tr: ["Retention signals", "Strategy A shipped", "rate-match refused"], cta: { t: "Retention pipeline", theme: "retention" } },
```

**Entry id `"churnwhy"` — replace with `"retnwhy"` (new id, same keyword cluster):**
```js
{ id: "retnwhy", lens: "RR", keys: ["why not", "reprice", "repricing", "rate-sensitive", "rate sensitive", "price", "pricing", "refuse", "refused", "drift", "hold", "rate war", "rate match"],
  head: "The rate-matching play was refused — deliberately.",
  body: <>~$15M of pure-price rate-matching looked attractive but lives in the drift sub-segment — <R>rate_sensitive_drift</R>. The gate refused it. The retention play we did ship — Targeted Deposit Defense on the stable sub-segment — cleared MRM and UDAAP because the stickiness discriminator is auditable. The refusal is what makes the deployment credible.</>,
  ev: [{ c: "r", v: "drift", l: "rate-match sub-seg" }, { c: "r", v: "refused", l: "SR 11-7" }, { c: "g", v: "+$19.3M", l: "Strategy A" }],
  tr: ["Retention signals", "Refusal log", "Strategy A approved"], cta: { t: "See the refusal", theme: "retention" } },
```

**Entry id `"notdoing"` — update body:**
```js
{ id: "notdoing", lens: "RR", keys: ["not doing", "not do", "restraint", "avoid", "discipline", "hold back", "choosing not", "deliberately"],
  head: "Holding the rate-matching play — on purpose.",
  body: <>The most valuable move can be <B>nothing</B>. Rate-matching the full cohort was ~$15M gross — <R>refused</R> on drift, logged, MRM-backed. A risk-adjusted decision, not a missed one. The $19.3M shipped play is smaller and credible; the $15M refused play is noise.</>,
  ev: [{ c: "r", v: "refused", l: "rate-match" }, { c: "r", v: "drift", l: "unstable sub-seg" }, { c: "g", v: "+$19.3M", l: "shipped" }],
  tr: ["Retention", "gate", "restraint"], cta: { t: "See the refusal", theme: "retention" } },
```

**New entry — `"depositretention"`:**
```js
{ id: "depositretention", lens: "FR", keys: ["what are we doing about deposit retention", "deposit retention", "what about deposits", "protecting deposits", "defend deposits"],
  head: "Strategy A shipped — $19.3M retained, UDAAP-auditable.",
  body: <>Mass-affluent deposit drift is confirmed: balance decline, ACH acceleration, operating erosion converging. We shipped a stickiness-discriminator-gated targeted offer. Retained <G>$19.3M deposits</G>, reduced runoff <G>−2.3pp</G>. The rate-matching play on the drift sub-segment was <R>refused</R> — unstable model, no auditable basis. That restraint is the governance story.</>,
  ev: [{ c: "g", v: "+$19.3M", l: "deposits" }, { c: "g", v: "−2.3pp", l: "runoff" }, { c: "r", v: "held", l: "rate-match" }],
  tr: ["Deposit drift signals", "Strategy A", "refusal log"], cta: { t: "Retention pipeline", theme: "retention" } },
```

**New entry — `"notratewar"`:**
```js
{ id: "notratewar", lens: "RR", keys: ["rate war", "not a rate war", "rate competition", "competing on rate", "pricing war", "repricing war"],
  head: "Precision, not a rate war.",
  body: <>A rate war is <R>blanket repricing</R> — no basis, no guardrail, every elastic customer gets margin given away. Strategy A is the opposite: <B2>stickiness-discriminator-gated</B2> targeted offers, only where elasticity is auditable, only where profitability holds above RAROC floor. The refused $15M play was the rate-war path — held deliberately.</>,
  ev: [{ c: "r", v: "refused", l: "blanket" }, { c: "g", v: "0.70", l: "stickiness gate" }, { c: "g", v: "RAROC", l: "profitability floor" }],
  tr: ["Retention", "discriminator", "precision vs war"], cta: { t: "Retention pipeline", theme: "retention" } },
```

### I4. `DECISIONS` ledger update

The existing `DECISIONS` map (if one exists in CxoCompanion or AppShell) previously held:
```js
churn: { status: "refused", value: "+$15M forgone" }
```

Replace with two entries:
```js
retention_shipped:  { status: "promoted",  value: "+$19.3M retained deposits · Strategy A" },
retention_refused:  { status: "refused",   value: "+$15M forgone · rate_sensitive_drift sub-segment" },
```

### I5. Updated `"week"` KB entry

```js
// Update ev and body to reflect retention replacing churn:
ev: [{ c: "g", v: "+$56M", l: "gig" }, { c: "g", v: "−1.8bps", l: "elder" }, { c: "a", v: "+$87M", l: "home" }, { c: "g", v: "+$19.3M", l: "retention" }, { c: "r", v: "held", l: "rate-match" }],
body: <>TwinX chose <B>where not to act</B>: <G>deployed</G> gig + elder + retention (Strategy A), <H>testing</H> life-event capture, <R>refused</R> rate-matching on drift sub-segment. Each ladders to a named priority.</>,
```

### I6. `QUICK_PICKS` updates

Add two new quick-pick strings and remove the now-stale churn one:
```
"What are we doing about deposit retention?"
"Why isn't this a rate war?"
```

Remove: `"Why aren't we repricing rate-sensitive deposits?"` — replace with `"Why did we refuse the rate-matching play?"`

---

## J · Conceptual Rule Compliance Checklist

**Rule 1 — Cohort-level language only, no individual names:**
Retention honours this on every user-facing surface. The three archetypes use cohort-descriptor labels ("The Drifting Saver", "The Operating-Account Eroder", "The Stickiness Edge Case") with initials DS/OE/SE. WHO rows in signal cards say "30K rate-sensitive mass-affluent · stickiness-discriminator score <0.55" — a filter, not a name. All KPI strings reference cohort aggregates. Compare gig's `"64K gig renters · ≥18-mo verified landlord pattern"` — same pattern, same register.

**Rule 2 — Pre-sim = ranges, post-sim = points with CI:**
Pre-sim: `"+$15–25M / yr · est. range"`. Post-sim: `"+$18.8M (CI: $17.2M–$20.4M)"`. Stakes KPI tiles in signal cards carry `"· est. range"` suffix verbatim. Compare gig's `"+$40-70M · NII / yr · range"`.

**Rule 3 — Compare to baseline, not to optimizer's prediction:**
ProofKpi cards: headline = with-policy value, baseline = BAU below it, delta pill = difference. Retained deposits: `"$19.3M / 12wk"` vs `"$0 · BAU runoff uninterrupted"`. Balance runoff: `"5.2%"` vs `"7.5% · BAU"`. Not "vs model predicted $18.6M" — vs what would have happened without policy.

**Rule 4 — Experiment-type-aware RCT KPIs:**
Retention is `deepen_defend_deposits` mechanism. Tracked KPIs: Retained deposits · Balance runoff % · Direct-deposit recovery · UDAAP margin. Not NII contribution (that's a friction-removal metric) and not fraud rate (that's loss-prevention). Same mechanism-specificity as gig (friction-removal → NII + Blocked + Complaints, not Fraud or Attach).

**Rule 5 — Refusal log must exist:**
The refused sub-strategy `H-RET-2026-REFUSED` ("Pure-Price Rate Match") carries the refusal narrative explicitly in Stage 2 of RetentionPipeline and in CxoCompanion KB entry `"retnwhy"`. The refusal text: `"~$15M of pure-price rate-matching looked attractive but lives in the drifting sub-segment — the gate refused it. The model on that slice is unstable (rate_sensitive_drift). The retention play we did ship — Targeted Deposit Defense on the stable sub-segment — cleared MRM and UDAAP because the stickiness discriminator is auditable. The refusal is what makes the deployment credible."` This is a verbatim-quality expansion of the gig Atlas's refusal quote.

**Rule 6 — Closed loop (Learn → Simulate via PriorAnchorPill):**
`exp-ret-2026-0041` (Strategy A v1) is a closed promoted experiment in `MOCK_EXPERIMENTS`. Its `modelUpdates` drive the prior shift. PriorAnchorPill in SimulateWorkspace reads: `"PRIOR · ANCHORED · Using updated priors from exp-ret-2026-0041 · stickiness threshold 0.65 → 0.70 · primacy-index weight 0.18 → 0.31"`. This is structurally identical to how gig's prior would work: a closed experiment's modelUpdates feed back into the live simulation's RECOMMENDED values.

**Rule 7 — Literary register (terse, mechanism-precise, no softness):**
Compare gig: `"Rent is the largest recurring outflow · pattern is the most stable · trust filter contains the fraud risk"` vs retention: `"Operating-account weakening precedes rate-shopping by 60 days in this sub-segment — intervening at the primacy stage is cheaper and more durable than a rate response after the fact"`. Both are mechanism-precise, causally-directed, stripped of marketing tone. The retention WHY rows name the mechanism and the trade-off in a single sentence, no filler.

---

## K · Build Sequence

### Phase 1 — Data layer (lowest risk, enables all downstream) · Complexity: LOW

| Step | File | Operation | Change |
|---|---|---|---|
| 1.1 | `/src/data/themes.js` | MODIFY | Replace `churn` entry with `retention` entry (Section A1) · add 4 INTERNAL_SIGS (A3) · add 1 INTERNAL_FORMING (A4) · update MACRO_THEMES ratecut footprint (A5) |
| 1.2 | `/src/data/retentionSignals.js` | CREATE | Full file content from Section C |
| 1.3 | `/src/data/themeConfigs.js` | MODIFY | Remove `walter` and `beatrice` from PERSONAS (E1) · add 3 retention archetypes (E2) · remove `churn` from CONFIGS · add `retention` (D1) |
| 1.4 | `/src/data/sensedAssets.js` | MODIFY | Add 7 new asset entries for retention (G2 data/detection/guardrail groups, ids 13–19) |

### Phase 2 — Cockpit sort (one-line change) · Complexity: TRIVIAL

| Step | File | Operation | Change |
|---|---|---|---|
| 2.1 | `/src/pages/Cockpit.jsx` | MODIFY | Update `Treemap` sort comparator to honour `pinned` field (Section A2) |

### Phase 3 — Theme page branching · Complexity: LOW

| Step | File | Operation | Change |
|---|---|---|---|
| 3.1 | `/src/pages/Theme.jsx` | MODIFY | Import `retentionSignals` · add `retention` to `macroFor()` · extend `gotoPipeline()` with retention branch · extend render assembly `ID === "gig" || ID === "retention"` branch · add hardcoded retention hero block (Section B) |

### Phase 4 — RetentionPipeline page · Complexity: HIGH

| Step | File | Operation | Change |
|---|---|---|---|
| 4.1 | `/src/pages/RetentionPipeline.jsx` | CREATE | Fork of GigPipeline.jsx with RET data object, retention-specific `a1calc` / `simulateOutcomes` math, 7 lever sliders, retention stage content (Section F) |
| 4.2 | `/src/App.jsx` (or router file) | MODIFY | Add route `path="/retention-pipeline"` → `<RetentionPipeline />` |

### Phase 5 — Workspaces · Complexity: MEDIUM

| Step | File | Operation | Change |
|---|---|---|---|
| 5.1 | `/src/workspaces/AnalyzeWorkspace.jsx` | MODIFY | Add retention branch when `selectedTheme === "retention"`: hero KPI ranges, 5 reason cards, retention asset groups reference (Section G2) |
| 5.2 | `/src/workspaces/SimulateWorkspace.jsx` | MODIFY | Add retention RECOMMENDED constants, retention `simulateOutcomes()` calibration, 5 lever section bands, 3 ProofKpi cards, 4 guardrail pills, 2×2 tile grid, PriorAnchorPill (Section G3) |
| 5.3 | `/src/workspaces/DeployWorkspace.jsx` | MODIFY | Add retention portfolio row to `MOCK_HISTORY`, ExperimentWorkflow content for retention (Section G4) |
| 5.4 | `/src/workspaces/LearnWorkspace.jsx` | MODIFY | Add retention pilot to `MOCK_EXPERIMENTS`, add `SYSTEMIC_MISCALIBRATIONS` entry (Section G5) |

### Phase 6 — CXO Companion · Complexity: LOW

| Step | File | Operation | Change |
|---|---|---|---|
| 6.1 | `/src/components/CxoCompanion.jsx` | MODIFY | Update `PAGE` map · replace `"retention"` KB entry · replace `"churnwhy"` with `"retnwhy"` · update `"notdoing"` · update `"week"` · add `"depositretention"` and `"notratewar"` · update QUICK_PICKS · update DECISIONS (Section I) |

---

## L · Open Questions for the User

**L1. Archetype label format — most important decision for the user to confirm**

The blueprint proposes strict cohort-descriptor labels: `"The Drifting Saver"`, `"The Operating-Account Eroder"`, `"The Stickiness Edge Case"`. These carry no first names. The gig journey uses pseudo-names (Marcus / Aisha / Rosa) — the user's instruction was "no individual names anywhere on user-facing surfaces." The cohort-descriptor format is strictly compliant.

If the user wishes to mirror gig's warmer presentation style, the safe compromise is: `"Cohort A · The Drifting Saver"`, `"Cohort B · The Operating-Account Eroder"`, `"Cohort C · The Stickiness Edge Case"` — cohort prefix makes it explicitly non-individual. The blueprint as written uses the strict form. **User should confirm: strict cohort descriptors (as written), or cohort-prefixed pseudo-labels?**

**L2. Calibration numbers — use as written or tune for demo effect?**

The blueprint uses the user's supplied numbers verbatim: retained deposits $19.3M, runoff 7.5% → 5.2%, offer cost $140K, spread protected $386K. These are relatively modest compared to the gig theme's $56M NII figure. For a demo, the contrast is actually a feature — retention is a precision play, not a volume play, and the numbers reflect that. However if the user wishes to tune upward for demo dramatic effect (e.g., $25M retained, −2.5pp runoff), the blueprint's math scaffolding supports that; just change the calibration anchors in simulateOutcomes(). **User should confirm: use $19.3M as supplied, or tune?**

**L3. `retentionSignals.js` import in non-bundle-bound path**

The retention theme as designed is not bundle-bound to the TWINX synthetic cluster data. This means `map.cluster` will be null and `bound` will be false in Theme.jsx — which triggers the "External Context" fallback hero. The blueprint instructs the implementation agent to handle this with a hardcoded retention hero block (analogous to how gig overrides its bundle rendering with gigSignals.js). This is the correct approach but requires the implementation agent to add an explicit `ID === "retention"` branch in multiple places in Theme.jsx. Confirm: acceptable, or should a synthetic cluster entry for retention be added to the TWINX bundle to make it fully bundle-bound?

**L4. Router file location**

The blueprint references `src/App.jsx` for the new `/retention-pipeline` route. The implementation agent should confirm the router definition location before Phase 4 Step 4.2. If routes are defined elsewhere (e.g., a dedicated `router.jsx`), the route addition moves there.

**L5. PriorAnchorPill component**

The blueprint references a `PriorAnchorPill` component in SimulateWorkspace. If this component does not yet exist (it is referenced in STORYLINE.md conceptually but may not be implemented), the implementation agent should create a minimal version: a narrow banner strip at the top of the config section with the exact text from Section H1, collapsible, styled in `--ret` orange.

---

## Summary: Files to Create/Modify

**CREATE (2 files):**
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/data/retentionSignals.js`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/pages/RetentionPipeline.jsx`

**MODIFY (9 files):**
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/data/themes.js`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/data/themeConfigs.js`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/data/sensedAssets.js`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/pages/Theme.jsx`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/pages/Cockpit.jsx`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/workspaces/AnalyzeWorkspace.jsx`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/workspaces/SimulateWorkspace.jsx`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/workspaces/DeployWorkspace.jsx`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/workspaces/LearnWorkspace.jsx`
- `/Users/sreekarsaripalli/Desktop/AI Projects/USB_latest_TwinX_gig_demo/src/components/CxoCompanion.jsx`
- App router file (confirm path)
