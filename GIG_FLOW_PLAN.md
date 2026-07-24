# Gig Economy Decision-Loop — Flow Plan

**Status:** approved blueprint v2 (consolidated)
**Demo subject:** Trust-Aware Ceiling Lift on rent-day Zelle, U.S. Bank consumer gig cohort
**Scope:** end-to-end loop redesign — Cockpit → Theme → Signal → Sense → Analyse → Hypothesize → Test (5-step journey) → Stage → Deploy → Learn

---

## 1. Decision summary

| Decision | Resolution |
|---|---|
| Theme-level entry: hypotheses → **signals** | 3 signals per theme; each opens the loop with that signal as context. |
| Sidebar workspace rename | `Data & Models` → **`Analyse`**. Contains Sense → Analyse → Hypothesize as scrollable sections. |
| Test stage architecture | **5-step guided journey** — Policy → Comms → Deepening → Review → Results. Each lever group has its own page with dedicated pre-experimentation insights. |
| What-If vs Optimizer mode | **Model B** — default to What-If; upgrade to Optimizer at Review via one-click switch. No upfront mode commitment. |
| Per-step layout | **Workbench** — levers on the left (anchored), pre-experimentation visualizations on the right. |
| Pre-experimentation framing | **Constraint topography + policy design space.** Show what the policy IS and where it can SAFELY GO — never predict the simulation's outcome. |
| Simulation UX | **All-at-once cinematic** — multi-phase narrated loader (≈12s What-If / ≈10s Optimizer), then progressive results reveal in the same view. |
| Customer twins in Analyse | **Cohort distributions are the headline.** Individual twins become a collapsible spot-check drawer. |
| Sense reveal volume | **12 assets composed** (4 data streams + 6 detection/context models + 2 guardrails), revealed in 3 chapters. |
| Drill-down pattern | **Inline expansion in place.** Card grows to full grid width; surrounding cards shift down with smooth animation. |
| Drill-down depth | **Mixed** — full 5-block depth on 4 hero assets, lighter 3-block depth on the other 8. |
| Insight contribution callouts | Every insight in Sense + Analyse ends with `↳ Informs:` — explicit link to the downstream decision it shapes. |
| Drill-down initial state | **None expanded.** User explores intentionally. |
| Drill-down animation | **Push** — rows below shift down (spatially honest). |

---

## 2. The new flow

```
COCKPIT (themes treemap + signal stream)
    ↓ click Gig Economy tile
THEME page (3 signals)
    ↓ pick signal → "Open the loop"
ANALYSE workspace
    Sense → Analyse → Hypothesize (scrollable sections, anchor tabs)
    [Test the champion →]
        ↓
SIMULATION STUDIO workspace
    Step 1 Policy → Step 2 Comms → Step 3 Deepening → Step 4 Review → Step 5 Results
    (workbench layout at each step, loader + progressive reveal at Step 5)
    [⇧ Stage for Deploy]
        ↓
DEPLOYMENT PLANE (Approval / Compliance / Live Pilot)
        ↓
LEARNING PLANE (Decision fidelity / Writeback / Cycle close)
        ↺ returns to Cockpit
```

---

## 3. Information architecture (workspaces)

Sidebar groups:

| Group | Item | Path | Role |
|---|---|---|---|
| Brief | Executive Brief | `/ceo` | CXO companion |
| Sense | Decision Cockpit | `/` | Themes + live signal stream |
| Analyse | **Analyse** (was Data & Models) | `/?seed_route=analyse` | Sense → Analyse → Hypothesize |
| Simulate | Simulation Studio | `/?seed_route=simulate` | 5-step Test + Results |
| Deploy | Deployment Plane | `/?seed_route=deploy` | Staging + approval + pilot |
| Learn | Learning Plane | `/?seed_route=learn` | Measure + writeback + cycle close |

Inside `Analyse`: single scrollable page with three section anchors at top (`Sense | Analyse | Hypothesize`).

Inside `Simulation Studio`: horizontal stepper at top showing all 5 steps; user can click back to any completed step.

---

## 4. The simulation loader (multi-phase, narrated)

Plays inside **Step 5** of the Test journey, after user clicks Run at Step 4 Review. Same visual stage zone — loader takes over, then transitions to progressive results reveal.

### Visual

```
┌────────────────────────────────────────────────────────────────┐
│ ▶  SIMULATION RUNNING                                          │
├────────────────────────────────────────────────────────────────┤
│ ✓  Loading customer cohort                                     │
│    5,760 verified gig-economy customers · 21.7M transactions   │
│                                                                │
│ ✓  Sensing rent-day patterns                                   │
│    Friday payout window · 22-mo landlord recurrence            │
│                                                                │
│ ●  Running payment policy                          ▓▓▓░░░░░░  │
│    Simulating ceiling-lift impact · wk 2.3 of 4                │
│    1,000 Monte-Carlo draws / week                              │
│                                                                │
│ ○  Modeling communications cascade                             │
│ ○  Scoring deepening uplift                                    │
│ ○  Computing net outcomes                                      │
│ ○  Checking guardrails                                         │
│                                                                │
│ ━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░  ~45%                   │
└────────────────────────────────────────────────────────────────┘
```

Status glyphs: `○` queued (grey) · `●` running (amber pulsing) · `✓` done (green).

### What-If loader phases

| # | Label | Caption (live) | Duration |
|---|---|---|---|
| 1 | Loading customer cohort | `5,760 verified gig-economy customers · 21.7M transactions` | ~1.0s |
| 2 | Sensing rent-day patterns | `Friday payout window · 22-mo landlord recurrence` | ~1.5s |
| 3 | Running payment policy | `Simulating ceiling-lift impact · wk X.X of 4 · 1,000 Monte-Carlo draws/wk` | ~2.5s |
| 4 | Modeling communications cascade | `Marketing-mix response · weeks 3-6 · channel reach × frequency` | ~2.0s |
| 5 | Scoring deepening uplift | `Attach × primacy uplift · weeks 5-8` | ~2.0s |
| 6 | Computing net outcomes | `Stitching J-curve · confidence intervals tightening` | ~1.0s |
| 7 | Checking guardrails | `Verifying fraud band · fair-lending DI · suitability` | ~1.5s |
| 8 | Done | `Converged · results loading...` | instant |

**Total: ~12 seconds.**

### Optimizer loader phases

| # | Label | Caption | Duration |
|---|---|---|---|
| 1 | Setting up search space | `1,000 configurations across 7 levers` | ~1.0s |
| 2 | Running cohort simulation | `Simulating config X of 1000 · 8-week horizon` (live counter) | ~5.0s |
| 3 | Identifying Pareto frontier | `Evaluating NII × friction × fairness trade-offs` | ~2.0s |
| 4 | Ranking top 3 | `Ranking by your goal: <selected goal>` | ~1.5s |
| 5 | Building configuration map | `Mapping configuration space for visualization` | ~1.0s |
| 6 | Done | `Pareto frontier identified · top 3 ready` | instant |

**Total: ~10 seconds.**

---

## 5. Stage-by-stage layouts

### 5.1 SENSE — composed-assets reveal with inline drill-down

Three-chapter staged reveal of **12 assets** (4 data streams + 6 detection/context models + 2 guardrails).

```
┌─────────────────────────────────────────────────────────────────────┐
│ SENSE · what we're seeing in gig economy · rent-day Zelle friction  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ THE SIGNAL ───────────────────────────┐ ┌─ DISCOVER ──────────┐ │
│ │ 17.3% step-up friction (↑4.1pp QoQ)    │ │   ⊕                 │ │
│ │ 14,800 rent-day failures expected/yr   │ │  Pull in the data   │ │
│ │ 5,760 customers in scope               │ │  & models we have   │ │
│ │ Friday 4-8 PM payout window            │ │  for this signal    │ │
│ │ $1,425 median rent vs $1,200 ceiling   │ │     [▶ Pull →]      │ │
│ │ 22-mo verified landlord pattern        │ │                     │ │
│ └────────────────────────────────────────┘ └─────────────────────┘ │
│                                                                     │
│ (after click — 3-chapter staged reveal, ~5s total)                  │
│                                                                     │
│ Phase 1 · "Pulling data streams..."                                 │
│                                                                     │
│ ⚙ DATA STREAMS                                                       │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│ │ Transaction  │ │ Counterparty │ │ Contact ctr  │                  │
│ │ history      │ │ network      │ │ logs         │                  │
│ │ 21.7M · 24mo │ │ landlord     │ │ +11% QoQ     │                  │
│ │ ↳ failures   │ │ ↳ 22-mo pat. │ │ ↳ declined-  │                  │
│ │              │ │              │ │   limit code │                  │
│ └──────────────┘ └──────────────┘ └──────────────┘                  │
│ ┌──────────────┐                                                    │
│ │ Income/cash  │                                                    │
│ │ gig platform │                                                    │
│ │ ↳ fortnight  │                                                    │
│ └──────────────┘                                                    │
│                                                                     │
│ Phase 2 · "Composing detection + context models..."                 │
│                                                                     │
│ 🧠 DETECTION + CONTEXT MODELS                                        │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│ │ Recurring-   │ │ 7-cell       │ │ Life-event   │                  │
│ │ obligation   │ │ segmentation │ │ triggers     │                  │
│ │ ↳ pattern    │ │ ↳ cohort     │ │ ↳ Fri 4-8 PM │                  │
│ └──────────────┘ └──────────────┘ └──────────────┘                  │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│ │ Channel-     │ │ Velocity-    │ │ Cash-flow    │                  │
│ │ propensity   │ │ fraud sep.   │ │ stability    │                  │
│ │ ↳ Zelle rail │ │ ↳ benign     │ │ ↳ 0.78 score │                  │
│ └──────────────┘ └──────────────┘ └──────────────┘                  │
│                                                                     │
│ Phase 3 · "Running guardrail + predictive models..."                │
│                                                                     │
│ 🛡 GUARDRAIL + PREDICTIVE MODELS                                     │
│ ┌──────────────┐ ┌──────────────┐                                   │
│ │ Counterparty │ │ Disparate-   │                                   │
│ │ trust        │ │ impact scrnr │                                   │
│ │ ↳ 65% pass   │ │ ↳ thin-file  │                                   │
│ └──────────────┘ └──────────────┘                                   │
│                                                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ ✓ COMPOSITION READY · this lets you see:                            │
│   · the signal is real (multi-source confirmation)                  │
│   · who it affects (5,760 in scope, 65% pass trust gate)            │
│   · when it concentrates (Fri 4-8 PM payout window)                 │
│   · why it's risky (fair-lending exposure on thin-file)             │
│   · what to safeguard (fraud separator confirms benign — lift safe) │
│                                                                     │
│ ▶ Each card above is clickable. Click any to examine the asset.    │
│                                                       [Continue →]  │
└─────────────────────────────────────────────────────────────────────┘
```

#### Inline expansion (drill-down)

Click any card → it grows to span the full grid width, surrounding cards shift down with ~280ms ease-out. Click header or X to collapse.

```
🧠 DETECTION + CONTEXT MODELS
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Recurring-   │ │ ▼ 7-CELL     │ │ Life-event   │
│ obligation   │ │ segmentation │ │ triggers     │
└──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────── × ──┐
│ 🧠 detection + context model                                │
│ 7-cell customer segmentation                                │
│ Age × investable assets grid · 7 predefined segments        │
│ ─────────────────────────────────────────────────────────── │
│ ① PROVENANCE        ② FOR THIS SIGNAL                      │
│ Owner: Retail        Cell match: Cell 5 (Mass-Aff 35-50)    │
│ Refresh: monthly     Size: 5,760 high-velocity gig          │
│ Validated: ✓ MRM     % of cell: 11.4% of 50,500             │
│                                                             │
│ ③ THE GRID                                                  │
│              <100K     100-500K     500K+                   │
│   18-34      Cell 1    Cell 2       Cell 3                  │
│   35-50      Cell 4   [Cell 5] ●    Cell 6                  │
│   50+        Cell 7    --           --                      │
│                                                             │
│ ④ COMPOSITION CHAIN                                         │
│   ↑ Feeds into: Cohort scope for every downstream lever     │
│   ↓ Fed by:     Account demographics + balance feed         │
│                                                             │
│ ⑤ [→ Open in model registry]  [→ See cell definitions]     │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Channel-     │ │ Velocity-    │ │ Cash-flow    │
│ propensity   │ │ fraud sep.   │ │ stability    │
└──────────────┘ └──────────────┘ └──────────────┘
```

Behavior table:

| Action | Behavior | Timing |
|---|---|---|
| Click collapsed card | Expand to full width, content fades in | 280ms expand + 120ms fade-in |
| Click expanded header | Collapse back to grid position | 220ms |
| Click X | Same as click header | 220ms |
| Click another card while one expanded | Previous collapses, then new expands | 200ms + 280ms (chained) |
| ESC | Collapses any expanded card | 220ms |
| Scroll | Free — page scrolls; expanded card pushes content | — |

### 5.2 ANALYSE

```
┌─────────────────────────────────────────────────────────────────────┐
│ ANALYSE · why rent-day Zelle is failing — across the cohort         │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ WHY · LIKELIHOOD-WEIGHTED REASONS (each row has ↳ Informs) ──┐  │
│ │ ① Rent > static ceiling           88%  ↳ ceiling lift size     │  │
│ │ ② Trusted landlord scored as new  81%  ↳ trust gate design     │  │
│ │ ③ Gig velocity reads as risk      74%  ↳ fraud separator       │  │
│ │ ④ Zelle is only realistic rail    69%  ↳ rails selection       │  │
│ │ ⑤ Thin-file penalty               63%  ↳ fair-lending floor    │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─ COHORT-LEVEL INSIGHTS (4 distributional charts) ─────────────┐  │
│ │ Verified-pattern depth         Friction concentration          │  │
│ │ ↳ Trust gate is feasible       ↳ Policy window is narrow       │  │
│ │ Rent vs ceiling distribution   Payout-rent timing              │  │
│ │ ↳ +20% lift clears 78%         ↳ Timing mismatch is mechanic   │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─ FAIR-LENDING PRE-FLIGHT ─────────────────────────────────────┐  │
│ │ Today: 47% gap. With 18mo trust gate: 10% gap (4/5 rule ✓)    │  │
│ │ The trust gate IS the fair-lending mechanic.                  │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ▾ Spot-check 3 customer twins (collapsed) — Marcus, Aisha, Rosa     │
│                                       [← Sense]    [Continue →]    │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 HYPOTHESIZE

```
┌─────────────────────────────────────────────────────────────────────┐
│ HYPOTHESIZE · three interventions TwinX is proposing                │
├─────────────────────────────────────────────────────────────────────┤
│ Each card cites the insights from Sense + Analyse that informed it. │
│                                                                     │
│ ╔════════════════════════════════════════════════════════════════╗  │
│ ║ ★ RECOMMENDED  ·  Trust-Aware Ceiling Lift                     ║  │
│ ║ Lift Zelle ceiling +20% on verified ≥18mo landlord pattern     ║  │
│ ║ Predicted: −8,400 failures · +$4.0M NII · −$1.2M CC · −120 cmp ║  │
│ ║ Built on: reasons ① ② · 65% pass trust · gate narrows 47%→10%  ║  │
│ ║                                              [Test this →]     ║  │
│ ╚════════════════════════════════════════════════════════════════╝  │
│                                                                     │
│ ┌─ Payout-Window Relax · −3,100 fail · +$0.9M NII ──────────────┐  │
│ │ Built on: reason ③, 67% friction in window                     │  │
│ │ Why second: lower precision                  [Test this →]    │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─ Rail Streamline · −2,200 fail · +$0.6M NII · −$0.4M CC ──────┐  │
│ │ Built on: reason ④, rail-coverage analysis                     │  │
│ │ Why third: smallest cohort hit, cleanest ops [Test this →]    │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─ FAIRNESS PRE-REGISTRATION ───────────────────────────────────┐  │
│ │ • Lift gated on observable trust — never protected attributes │  │
│ │ • Remediation MUST narrow thin-file gap (47% → 10%)            │  │
│ │ • Auto-rollback if disparity widens during live pilot         │  │
│ └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.4 TEST — 5-step guided journey

Horizontal stepper at top of all 5 step pages:

```
[ 1 Policy ●][ 2 Comms ○][ 3 Deepening ○][ 4 Review ○][ 5 Results ○]
```

Active step glows. Completed steps show ✓ and are click-back-able. Future steps are dimmed.

#### 5.4.1 Step 1 — Payment Policy (workbench)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [1 Policy ●]─[2 Comms ○]─[3 Deepening ○]─[4 Review ○]─[5 Results ○]      │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌─ LEVERS (left, ~38%) ────┐ ┌─ POLICY DESIGN INSIGHTS (right) ────────┐│
│ │ Customer group  [Verified│ │ ┌──────────────┐ ┌────────────────────┐ ││
│ │ Trust gate ━━●━ 18mo     │ │ │ ① FAIRNESS   │ │ ② RENT HISTOGRAM   │ ││
│ │ Ceiling lift ━●━ 20%     │ │ │ SAFE ZONE    │ │ + ceiling lines    │ ││
│ │ Rails ☑Zelle ☑ACH        │ │ │ heatmap      │ │ ▶ clears 78%       │ ││
│ │ Rollout ━●━━ 60%         │ │ │ ● your spot  │ │                    │ ││
│ │ Rollback ☑               │ │ └──────────────┘ └────────────────────┘ ││
│ │ Fairness floor ●━ 0.85   │ │ ┌──────────────┐ ┌────────────────────┐ ││
│ │                          │ │ │ ③ COHORT     │ │ ④ ELASTICITY       │ ││
│ │                          │ │ │ WATERFALL    │ │ REFERENCE          │ ││
│ │                          │ │ │ 5,760→1,830  │ │ shape + pin        │ ││
│ │                          │ │ │ ▶ your reach │ │ ▶ past the knee    │ ││
│ │                          │ │ └──────────────┘ └────────────────────┘ ││
│ └──────────────────────────┘ └────────────────────────────────────────┘ │
│                                                  [Continue to Comms →]   │
└──────────────────────────────────────────────────────────────────────────┘
```

**The 4 insights answer:**
- Safe zone: *where can I move without breaking fair-lending?*
- Rent histogram: *which failures will my lift size catch?*
- Cohort waterfall: *who actually gets touched?*
- Elasticity ref: *am I past the knee?*

**None predicts the simulation's outcome.** All show the policy's design space and constraint topography.

#### 5.4.2 Step 2 — Communications (workbench)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [1 Policy ✓]─[2 Comms ●]─[3 Deepening ○]─[4 Review ○]─[5 Results ○]      │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌─ LEVERS ──────────────────┐ ┌─ COMMS DESIGN INSIGHTS ─────────────────┐│
│ │ Channel mix               │ │ ┌────────────────────────────────────┐  ││
│ │  In-app  ━●━━ 40%         │ │ │ ① CHANNEL-MIX FUNNEL · live        │  ││
│ │  Push    ●━━━ 20%         │ │ │   Treated cohort 1,830             │  ││
│ │  Email   ●━━━ 20%         │ │ │      ↓ reach 71%                   │  ││
│ │  SMS     ●━━━ 12%         │ │ │   Reached 1,299                    │  ││
│ │  RM      ●━━━ 8%          │ │ │      ↓ freq-adj 3×/wk              │  ││
│ │ Touches/wk ━●━ 3          │ │ │   Aware 1,164                      │  ││
│ │ Message tone [Proactive ▼]│ │ │      ↓ sentiment proactive         │  ││
│ │ Timing [Pre-payout ▼]     │ │ │   Warm 817                         │  ││
│ │                           │ │ └────────────────────────────────────┘  ││
│ │                           │ │ ┌──────────────┐ ┌────────────────────┐ ││
│ │                           │ │ │ ② AWARENESS  │ │ ③ COST PER AWARE   │ ││
│ │                           │ │ │ S-CURVE      │ │ bars by channel    │ ││
│ │                           │ │ │ wk 1-6 build │ │ ▶ $0.42/aware      │ ││
│ │                           │ │ │ ▶ peaks wk4  │ │   (cheap mix)      │ ││
│ │                           │ │ └──────────────┘ └────────────────────┘ ││
│ └───────────────────────────┘ └────────────────────────────────────────┘│
│              [← Policy]                  [Continue to Deepening →]      │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 5.4.3 Step 3 — Deepening (workbench)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [1 Policy ✓]─[2 Comms ✓]─[3 Deepening ●]─[4 Review ○]─[5 Results ○]      │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌─ LEVERS ──────────────────┐ ┌─ DEEPENING DESIGN INSIGHTS ─────────────┐│
│ │ Next-best [HY Savings ▼]  │ │ ┌────────────────────────────────────┐  ││
│ │ Intensity ━●━━ 2          │ │ │ ① PRODUCT FIT · attach × NII       │  ││
│ │ Offer channel [In-app ▼]  │ │ │ HY Savings  ●━━━━━━ 22%  $520      │  ││
│ │ Wait until ━●━━ 50%       │ │ │ EWA          ━●━━━━━ 28%  $240     │  ││
│ │ Rollout ━●━━━ 60%         │ │ │ DD Switch    ━━●━━━━ 19%  $610 ★   │  ││
│ │                           │ │ │ Secured Card ━━━●━━━ 16%  $380     │  ││
│ │                           │ │ │ Credit Bldr  ━━━●━━━ 14%  $300     │  ││
│ │                           │ │ │ ▶ Your pick: HY Savings            │  ││
│ │                           │ │ └────────────────────────────────────┘  ││
│ │                           │ │ ┌──────────────┐ ┌────────────────────┐ ││
│ │                           │ │ │ ② INTENSITY  │ │ ③ SUITABILITY      │ ││
│ │                           │ │ │ × ATTACH     │ │ MATRIX             │ ││
│ │                           │ │ │ ● your spot  │ │ ch × readiness     │ ││
│ │                           │ │ │ ▶ regret <8% │ │ ▶ safe combo       │ ││
│ │                           │ │ └──────────────┘ └────────────────────┘ ││
│ └───────────────────────────┘ └────────────────────────────────────────┘│
│              [← Comms]                       [Continue to Review →]     │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 5.4.4 Step 4 — Review (Model B mode chooser)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [1 Policy ✓]─[2 Comms ✓]─[3 Deepening ✓]─[4 Review ●]─[5 Results ○]      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─ POLICY SPEC SHEET · what you've assembled ──────────────────────────┐│
│ │ ▣ PAYMENT POLICY                                       [edit step 1]││
│ │    Cohort        Verified (3,800)                                   ││
│ │    Trust gate    18 months                                          ││
│ │    Ceiling lift  +20% ($1,200 → $1,440)                             ││
│ │    Rails         Zelle, ACH                                         ││
│ │    Rollout       60% (~1,830 customers)                             ││
│ │    Guardrails    auto-rollback on complaint spike · DI ≥ 0.85       ││
│ │                                                                      ││
│ │ ▣ COMMUNICATIONS                                       [edit step 2]││
│ │    Channel mix   In-app 40% · Push 20% · Email 20% · SMS 12% · RM 8%││
│ │    Touches/week  3 · Pre-payout · Proactive                          ││
│ │    Effective     71% reach · ~817 warm to act                        ││
│ │                                                                      ││
│ │ ▣ DEEPENING                                            [edit step 3]││
│ │    Next-best     HY Savings @ intensity 2                            ││
│ │    Channel       In-app, when 50%+ warm                              ││
│ │    Rollout       60% of warmed cohort                                ││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌─ WHAT THE SIMULATION WILL TELL YOU ─────────────────────────────────┐ │
│ │ • Net Interest Income over 8 weeks with confidence intervals         │ │
│ │ • J-curve payback dynamics                                           │ │
│ │ • Multi-arena cascade: policy → comms → deepening, with handoffs     │ │
│ │ • Fraud band tightening over time                                    │ │
│ │ • Fair-lending DI dynamics under noise                               │ │
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│            [← Tweak Deepening]      [▶ RUN WHAT-IF SIMULATION]          │
│                                                                          │
│ ┌─ ALTERNATE ─────────────────────────────────────────────────────────┐  │
│ │  ⚡ Want to scan around these values?  Switch to Optimizer mode →   │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

When user clicks `Switch to Optimizer`, Review morphs (in-place):

```
┌─ SEARCH-SPACE SPEC SHEET (values became ranges) ──────────────────────┐
│ Trust threshold       12-30 months (around 18mo)                       │
│ Ceiling lift          10-40% (around 20%)                              │
│ Rollout               30-90% (around 60%)                              │
│ Channel-mix axis      RM-leaning ↔ In-app-leaning                      │
│ Intensity             1-4                                              │
│ Wait until warm       30-70%                                           │
└────────────────────────────────────────────────────────────────────────┘

┌─ GOAL ─────────────────────────────────────────────────────────────────┐
│  ● Maximize Net Interest Income       (+$4.0M target)                  │
│  ○ Minimize rent-day failures         (14,800 baseline)                │
│  ○ Maximize fairness margin           (DI ≥ 0.95)                      │
│  ○ Balanced (NII × fairness × failures)                                │
└────────────────────────────────────────────────────────────────────────┘

┌─ CONSTRAINTS ──────────────────────────────────────────────────────────┐
│  • Fraud doesn't worsen (Δ CI ≤ 0)                                     │
│  • Fair-lending DI ≥ 0.80 (the 4/5 rule)                               │
│  • Suitability check passes                                            │
└────────────────────────────────────────────────────────────────────────┘

             [← Back to What-If]  [⚡ RUN OPTIMIZER · 1,000 configs]
```

#### 5.4.5 Step 5 — Loader → Progressive Results

Loader (Section 4) plays in this view. After ✓ converged, stepper shows `[5 Results ✓]` and progressive reveal animates in.

**Progressive reveal phases:**

| Phase | Element | Animation | Duration |
|---|---|---|---|
| A | Hero J-curve | Draw week-by-week via animated SVG path | ~3s |
| B | Inflection marker | Pulse ring at wk5 | 0.5s |
| C | Commentary | Fade in below chart | 0.4s |
| D | Outcomes table | Rows fade in, 100ms stagger | ~0.7s |
| E | Arena breakdowns | Cards slide in, 200ms stagger | ~0.6s |
| F | Action buttons | Fade in | 0.3s |

Total reveal: ~5.5s. Combined with loader (~12s) = ~17s of cinematic computation-to-insight.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [1 Policy ✓]─[2 Comms ✓]─[3 Deepening ✓]─[4 Review ✓]─[5 Results ●]      │
├──────────────────────────────────────────────────────────────────────────┤
│ ▶▶▶ RESULTS                                                              │
│                                                                          │
│ ┌─ NET RESULT OVER 8 WEEKS · the J-curve (drawing live) ────────────┐  │
│ │ $1M │                              ▲ payback at wk5 (pulse)        │  │
│ │ .5M │                          ╱                                   │  │
│ │  0  │━━━━━━━━━━━━━━━━━━━╱                                          │  │
│ │     │     ╲___________╱   ← marketing spend dip wk 3-6             │  │
│ │ -.5M│                                                              │  │
│ │      wk1   wk2   wk3   wk4   wk5  ●                                │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│  ▶ "Policy clears Friday friction wk 1-4. Comms ramp wk 3-6 builds      │
│     awareness. Deepening lands wk 5-8 — that's the inflection."         │
│                                                                          │
│ ┌─ OUTCOMES vs BASELINE ─────────────────────────────────────────────┐  │
│ │ Net Interest Income     +$0.85M    (CI $0.62-$1.08M)  ✓             │  │
│ │ Failures removed         −1,046    per quarter        ✓             │  │
│ │ Fraud impact            CI ≤ 0     within guardrail   ✓             │  │
│ │ Fair-lending DI          0.94      above 0.85 floor   ✓             │  │
│ │ Call-centre savings     −$1.2M     cost down          ✓             │  │
│ │ Marketing mROI          13.6×                          ✓             │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ▾ Arena breakdown (collapsible — mirrors Steps 1-3)                     │
│   ▾ Payment policy    E1=1,345 cleared · friction 12.4%                │
│   ▾ Communications    awareness 71% · NPS +4.3                          │
│   ▾ Deepening         attach 17.8% · primacy uplift                     │
│                                                                          │
│            [← Re-run with tweaks]         [⇧ STAGE FOR DEPLOY]          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Optimizer results variant:** Pareto bubble chart hero + 3 winning-configuration cards (each with full lever recipe + "why on the frontier" + "view full simulation →"). Same reveal phases.

---

## 6. Content catalog

### 6.1 Cockpit signal stream

Existing live stream content. No copy changes.

### 6.2 Theme page · gig

**Page title:** `Gig Economy · high-velocity money movement`

**Cohort header strip:**
- `5,760` customers in cohort
- `11.5%` of consumer book
- `Friday payout window`
- `policy v3`

**Hero subtitle:** `Verified, fast-moving gig earners whose rent-day Zelle payments are tripping a static ceiling.`

**3 signals:**

| ID | Title | One-liner | Numbers |
|---|---|---|---|
| A | Rent-day Zelle friction | 17.3% step-up friction on rent-day Zelle, ↑4.1pp QoQ | `17.3%` · `↑4.1pp QoQ` · `14,800/yr` |
| B | Payout-window timing mismatch | Rent due before platform payout settles — cash-timing, not credit | `Fri 4-8 PM` · `67% of failures` |
| C | Thin-file fairness exposure | Thin-file gig earners absorb 1.6× more failures than verified | `1.6× skew` · `1,640 thin-file` |

**CTA per card:** `Open the loop →`

### 6.3 SENSE · the 12 composed assets

**Section header:** `What we're seeing in gig economy · rent-day Zelle friction`

**Signal panel (6 lines, left of "Pull in" button):**

```
17.3% step-up friction rate (↑4.1pp QoQ)
14,800 expected rent-day failures per year
5,760 customers in scope
Friday 4-8 PM payout window
$1,425 median rent vs $1,200 ceiling
22-month verified landlord pattern
```

**Discover button states:**

- Before: `Pull in the data & models we have for this signal  [▶ Pull →]`
- During Phase 1: `Pulling data streams...`
- During Phase 2: `Composing detection + context models...`
- During Phase 3: `Running guardrail + predictive models...`
- After: `✓ Composition ready · 12 assets composed for this signal`

#### 6.3.1 The 12 assets — card content

**⚙ DATA STREAMS (4)**

| # | Name | Subtitle | Quick numbers | ↳ For this signal |
|---|---|---|---|---|
| 1 | Transaction history | Core money-movement events | `21.7M · 24mo` | failure log + counterparty patterns |
| 2 | Counterparty network | Tokenized payees | `landlord, employer, family` | 22-mo recurring landlord pattern |
| 3 | Contact center logs | Call reasons + trend | `+11% QoQ` | declined-limit reason code rising |
| 4 | Income / cash-flow | Gig platform inflows | `Uber, DoorDash, Instacart, Upwork` | fortnightly multi-platform cadence |

**🧠 DETECTION + CONTEXT MODELS (6)**

| # | Name | Subtitle | Quick numbers | ↳ For this signal |
|---|---|---|---|---|
| 5 | Recurring-obligation detector | Verified-counterparty cadence detector | `precision 0.97 · cov 94%` | 22-mo landlord pattern, recurrence 0.81 |
| 6 | 7-cell customer segmentation | Age × investable assets grid | `7 cells` | Cell 5 (Mass-Affluent 35-50) → 5,760 in scope |
| 7 | Life-event triggers | Payout, rent, life-stage cadence detection | `4 trigger types` | Fri 4-8 PM payout window detected |
| 8 | Channel-propensity model | Predicts rail for an obligation | `AUC 0.88` | Zelle is the natural rail for 73% of cohort |
| 9 | Velocity-fraud separator | Distinguishes benign vs fraud velocity | `AUC 0.95 · FPR 0.6%` | benign multi-platform income confirmed |
| 10 | Cash-flow stability model | Income regularity & runway score | `coverage 88% · 90d horizon` | stability 0.78 — solid runway |

**🛡 GUARDRAIL + PREDICTIVE MODELS (2)**

| # | Name | Subtitle | Quick numbers | ↳ For this signal |
|---|---|---|---|---|
| 11 | Counterparty trust scoring | Tenure + recurrence composite | `AUC 0.91 · audited` | 65% of cohort scores ≥ 0.81 — gate feasible |
| 12 | Disparate-impact screener | Fair-lending pre-screen | `ECOA-compliant` | thin-file 1.6× → trust gate mandatory |

**Composition synthesis footer:**

```
✓ COMPOSITION READY · this lets you see:
  · the signal is real (multi-source confirmation)
  · who it affects (5,760 in scope, 65% pass trust gate)
  · when it concentrates (Fri 4-8 PM payout window)
  · why it's risky (fair-lending exposure on thin-file)
  · what to safeguard (fraud separator confirms benign — lift safe)
```

#### 6.3.2 Drill-down content — full depth on 4 heroes

Hero assets: **Recurring-obligation detector (5), 7-cell segmentation (6), Counterparty trust scoring (11), Disparate-impact screener (12).**

##### Hero · Recurring-obligation detector (asset #5)

```
🧠 detection + context model
RECURRING-OBLIGATION DETECTOR
Tokenizes verified counterparties + cadence over 24-mo window

① PROVENANCE
   Owner       Behavioral Analytics
   Refresh     real-time event-driven re-scoring
   Validated   ✓ MRM-approved · semiannual review
   Quality     precision 0.97 · coverage 94%

② FOR THIS SIGNAL
   Pattern detected   22-mo landlord rent-day pattern
   Recurrence score   0.81 (high)
   Cohort matches     4,118 of 5,760 (71% have ≥1 verified obligation)
   Active for         landlord, utility, family, employer counterparties

③ DISTRIBUTION OF RECURRENCE SCORES IN COHORT
   0.9-1.0  ███████████████ 39%
   0.7-0.9  ██████████ 26%
   0.5-0.7  ██████ 17%
   0.3-0.5  ████ 11%
   <0.3     ███ 7%
   ────────────
   ≥0.81 threshold → 65% qualify for trust gate

④ COMPOSITION CHAIN
   ↑ Feeds into:  Counterparty trust scoring
                  Channel-propensity model
                  Trust gate lever
   ↓ Fed by:      Transaction history · Counterparty network

⑤ [→ Open in model registry]  [→ Audit log]
```

##### Hero · 7-cell customer segmentation (asset #6)

```
🧠 detection + context model
7-CELL CUSTOMER SEGMENTATION
Age × investable assets grid · 7 predefined business segments

① PROVENANCE
   Owner       Retail Analytics
   Refresh     monthly reclassification
   Validated   ✓ MRM-approved · annual review
   Coverage    99.6% of consumer book

② FOR THIS SIGNAL
   Cell match    Cell 5 · Mass-Affluent · 35-50
   Match size    5,760 high-velocity gig (subset of cell)
   % of cell     11.4% of 50,500 total in Cell 5

③ THE GRID
            <100K       100-500K       500K+
   18-34    Cell 1      Cell 2         Cell 3
   35-50    Cell 4     [Cell 5] ●      Cell 6
   50+      Cell 7      --             --

   Cohort distribution across cells
   Cell 5  ███████████████████ 5,760  ← cohort here
   Other   ░░░░ 0

④ COMPOSITION CHAIN
   ↑ Feeds into:  Cohort scope for every downstream lever
   ↓ Fed by:      Account demographics + balance feed

⑤ [→ Open in model registry]  [→ See cell definitions]
```

##### Hero · Counterparty trust scoring (asset #11)

```
🛡 guardrail + predictive model
COUNTERPARTY TRUST SCORING
Tenure + recurrence + reciprocity composite · AUC 0.91 · audited

① PROVENANCE
   Owner       Risk Analytics
   Last train  2025-Q4
   Validated   ✓ MRM-approved · ECOA-compliant
   Features    Observable only — NO protected attributes

② FOR THIS SIGNAL
   Cohort trust above 0.81    65% (3,744 of 5,760)
   At trust gate ≥18mo        these are the eligible
   Thin-file accessibility    ✓ pattern-based, not attribute-based

③ SCORING COMPONENTS
   Recurrence (months observed)    weight 0.35
   Tenure with counterparty        weight 0.25
   Reciprocity (return flow)       weight 0.20
   Dispute / chargeback history    weight 0.20

   Cohort trust distribution
   0.9-1.0  ████████████████ 45%
   0.8-0.9  ████████ 20%   ←─ trust-gate threshold
   0.6-0.8  ██████ 17%
   0.4-0.6  ████ 11%
   <0.4     ██ 7%

④ COMPOSITION CHAIN
   ↑ Feeds into:  Trust-gate lever (sets threshold)
                  Fair-lending guardrail (proof of attribute-free scoring)
   ↓ Fed by:      Counterparty network · Tx history

⑤ [→ Open model card]  [→ Audit log]  [→ ECOA brief]
```

##### Hero · Disparate-impact screener (asset #12)

```
🛡 guardrail + predictive model
DISPARATE-IMPACT SCREENER
Fair-lending pre-screen on proposed policies · ECOA-compliant

① PROVENANCE
   Owner       Compliance + Risk Analytics (joint)
   Refresh     on every policy proposal
   Validated   ✓ ECOA-compliant · 4/5 rule benchmark
   Audit       quarterly review by Compliance Council

② FOR THIS SIGNAL
   Group ratio today                  0.89 (thin-file vs verified)
   Under proposed +20% lift, no gate  drops to 0.79 ← FAILS 4/5 rule
   With +20% lift + 18mo trust gate   rises to 0.94 ← passes safely
   ↳ The trust gate IS the fairness mechanic

③ DI RATIO BY POLICY CONFIGURATION
   No lift                  0.89    ✓ above 0.80
   Lift, no gate           0.79    ✗ FAILS 4/5 rule
   Lift, 12mo gate         0.85    ✓ above 0.80
   Lift, 18mo gate         0.94    ✓ comfortably above
   Lift, 24mo gate         0.96    ✓ but reduces eligible pool
   ────────────────────────────
   4/5 rule line (0.80) ───

④ COMPOSITION CHAIN
   ↑ Feeds into:  Fairness floor lever
                  Auto-rollback trigger (if DI drops during pilot)
   ↓ Fed by:      Counterparty trust scoring · Cohort demographics

⑤ [→ Open in compliance registry]  [→ Read 4/5 rule explainer]
```

#### 6.3.3 Drill-down content — light depth on remaining 8

For the other 8 assets, drill-down shows only 3 blocks (Header + Provenance + For this signal + Composition Chain). No deep visualization block.

(Content templates for all 8 to be filled in during build; structure same as heroes but lighter.)

### 6.4 ANALYSE · why & cohort

**Section header:** `Why rent-day Zelle is failing — across the cohort`

**Reasons (5 rows with bars + ↳ Informs):**

| ID | Reason | Likelihood | Detail | ↳ Informs |
|---|---|---|---|---|
| ① | Rent > static ceiling | 88% | Rent ($1,425) exceeds the static $1,200 per-txn Zelle limit | the ceiling lift size |
| ② | Trusted landlord scored as new | 81% | 22-mo paid landlord still scored as a generic counterparty | the trust gate design |
| ③ | Gig velocity reads as risk | 74% | Multi-platform inflow looks like fraud-velocity | the velocity-fraud separator |
| ④ | Zelle is the only realistic rail | 69% | ACH too slow for rent day; RTP not enabled | the rails selection |
| ⑤ | Thin-file penalty | 63% | Thin-file earners absorb 1.6× more failures | the fair-lending floor |

**Cohort distributions (4 mini-charts):**

#### Verified-pattern depth
| Bucket | Share |
|---|---|
| 22+ mo | 65% |
| 12-21 mo | 23% |
| < 12 mo | 12% |

**↳ Informs:** `Trust gate is feasible — majority can pass`

#### Friction concentration
| Window | Share of failures |
|---|---|
| Fri 4-8 PM | 67% |
| Other times | 33% |

**↳ Informs:** `Policy window is narrow — target Fri 4-8 PM only`

#### Rent vs $1,200 ceiling
| Rent band | Share |
|---|---|
| $1.2K | trivial |
| $1.4K | major (median) |
| $1.6K | moderate |
| $1.8K | minor |

**↳ Informs:** `+20% lift ($1,440) clears 78% of failures`

#### Payout-rent timing
| Lag | Share |
|---|---|
| on-time | 4% |
| 4hr early | 18% |
| hours early | 25% |
| 4hr late | 31% |

**↳ Informs:** `Timing mismatch IS the underlying mechanic`

**Fair-lending pre-flight:**

```
Today                  47% gap (thin-file vs verified)
With trust gate ≥18mo  10% gap   ✓ within 4/5 rule
The trust gate IS the fair-lending mechanic — not an add-on.
```

**Twins drawer (collapsed default):**

```
▾ Spot-check 3 customer twins (click to expand)
   · Marcus Chen   verified, 22mo recurring landlord
   · Aisha Diallo  thin-file, 7mo (fairness case)
   · Rosa Torres   established, 16mo (fortnightly variant)
```

### 6.5 HYPOTHESIZE · three interventions

**Section header:** `Three interventions TwinX is proposing`

**Intro:** `Each card explicitly cites the insights from Sense + Analyse that informed it. None are pulled from thin air.`

**Champion card:**

```
★ RECOMMENDED · Trust-Aware Ceiling Lift

Lift the Zelle ceiling +20% when a customer is paying a
verified recurring landlord (≥18 months observed pattern).

Predicted result
  −8,400 failures/year
  +$4.0M Net Interest Income
  −$1.2M call-centre cost
  −120 complaints

Built on the analysis above:
  · 88% — Rent > static ceiling (reason ①)
  · 81% — Trusted landlord scored as new (reason ②)
  · 65% of cohort has 22+ mo verified pattern
  · +20% lift clears 78% of failures
  · trust gate narrows fair-lending gap 47% → 10%

[Test this →]
```

**Sibling 1:**

```
Payout-Window Relax — alternate path
Relax thresholds during Fri 4-8 PM payout window
Predicted: −3,100 failures · +$0.9M NII
Built on:  ③ Velocity penalty, 67% friction in that window
Why second:  lower precision — affects all Friday txns
[Test this →]
```

**Sibling 2:**

```
Rail Streamline — alternate path
Lift P2P/Zelle limits for accounts with established CPs
Predicted: −2,200 failures · +$0.6M NII · −$0.4M CC
Built on:  ④ Channel concentration, rail-coverage analysis
Why third:  smallest cohort hit, but cleanest operational
[Test this →]
```

**Fairness pre-registration:**

```
• Lift gated on OBSERVABLE TRUST — never a protected attribute
• Remediation MUST narrow the thin-file gap (47% → 10%)
• Auto-rollback if disparity widens during the live pilot
```

### 6.6 TEST · Step 1 — Payment Policy

**Page title:** `Test · Trust-Aware Ceiling Lift · Step 1 of 5 · Payment Policy`

**Levers panel:**

| Lever | Type | Options / Range | Default |
|---|---|---|---|
| Customer group | dropdown | Verified / All / Thin-file | Verified |
| Trust threshold | slider | 12 / 18 / 24 / 30 months | 18 |
| Ceiling lift | slider | 10% / 20% / 30% / 40% | 20% |
| Rails | checkboxes | Zelle / ACH / RTP / Wire | Zelle, ACH |
| Rollout | slider | 30% / 60% / 90% | 60% |
| Rollback trigger | checkbox | auto-rollback on complaint spike | on |
| Fairness floor | slider | DI 0.80 / 0.85 / 0.90 / 0.95 | DI 0.85 |

**Pre-experimentation insights (4 panels, right side):**

#### ① Fairness safe-zone heatmap
- X: ceiling lift 10-40%
- Y: trust gate 6-30 months
- Color: DI margin (■ ≥0.90 / ▓ 0.80-0.90 / ░ 0.70-0.80 / ▒ <0.70)
- `●` user's current (lift, trust-gate) position
- Commentary: `Your current settings sit safely in the green zone. Dropping the trust gate below 12mo would push you below the 4/5 rule regardless of lift size.`

#### ② Rent histogram with ceiling lines
- X: rent amount ($1.2K - $2.0K)
- Y: % of cohort
- Vertical lines: current ceiling ($1,200) + proposed ceiling (current × lift%)
- Bar coloring: already clearing / now clears (between lines) / still over
- Commentary: `This lift clears 78% of failing rent-day transactions. To clear the rest you'd need +35% or higher.`

#### ③ Cohort coverage waterfall
- Stepwise funnel showing 5,760 → cohort filter → trust gate → rails → rollout → final treated count
- Updates live as user changes cohort, trust, rails, rollout
- Commentary: `Your levers narrow 5,760 → 1,830 (32% of cohort). Loosening trust gate to 12mo would add ~500 customers.`

#### ④ Elasticity reference (shape only)
- X: ceiling lift 10-40%
- Y: friction reduction potential (shape, no numeric value)
- `●` at user's current lift position
- Commentary: `You're past the knee — most of the elasticity gain has been captured. Pushing past +30% adds little but increases fairness pressure (see safe zone above).`

**CTA:** `[Continue to Comms →]`

### 6.7 TEST · Step 2 — Communications

**Page title:** `Test · Trust-Aware Ceiling Lift · Step 2 of 5 · Communications`

**Levers panel:**

| Lever | Type | Options / Range | Default |
|---|---|---|---|
| In-app | slider | 0-100 (normalize) | 40 |
| Push | slider | 0-100 | 20 |
| Email | slider | 0-100 | 20 |
| SMS | slider | 0-100 | 12 |
| RM | slider | 0-100 | 8 |
| Touches per week | slider | 1-5 | 3 |
| Message tone | dropdown | Proactive / Educational / Generic | Proactive |
| When to land | dropdown | Pre-payout / Always-on | Pre-payout |

**Pre-experimentation insights (3 panels):**

#### ① Channel-mix funnel (hero, full width)
- Stages: Treated cohort → Reached (channel-mix-weighted) → Aware (frequency-adjusted) → Warm (sentiment-adjusted)
- Each stage shows raw count + % conversion
- Updates live as channel sliders, frequency, tone change
- Commentary: `Your mix reaches 71% of treated cohort. 1,164 become aware, 817 warm to act.`

#### ② Awareness S-curve (wk 1-6)
- X: weeks 1-6
- Y: awareness % (0-100)
- Curve shape varies by frequency and channel mix
- Commentary: `Awareness peaks at wk 4 with your current frequency. Adding a 4th touch shifts the peak earlier but adds cost.`

#### ③ Cost per aware customer
- Bar chart: cost per aware-customer at current mix
- Comparison bars: RM-heavy alternative · email-heavy alternative
- Commentary: `Current mix: $0.42 per aware. RM-heavy would be $2.10 — high quality but expensive at scale.`

**CTA:** `[← Policy]` · `[Continue to Deepening →]`

### 6.8 TEST · Step 3 — Deepening

**Page title:** `Test · Trust-Aware Ceiling Lift · Step 3 of 5 · Deepening`

**Levers panel:**

| Lever | Type | Options / Range | Default |
|---|---|---|---|
| Next-best product | dropdown | HY Savings / Secured Card / EWA / Credit Builder / DD Switch | HY Savings |
| Intensity | slider | 1-4 | 2 |
| Offer channel | dropdown | In-app / RM / Lifecycle | In-app |
| Wait until warm-up | slider | 30% / 50% / 70% | 50% |
| Rollout | slider | 30% / 60% / 90% | 60% |

**Pre-experimentation insights (3 panels):**

#### ① Product fit bars (hero, full width)
- 5 horizontal bars, one per product, showing: attach % (filled segment), $$ per adopter (number after bar)
- ★ marks the best-NII option for this cohort
- ● highlights user's currently selected product
- Commentary: `Your pick: HY Savings (22% attach × $520 = $114 expected NII per eligible). DD Switch tops total NII but lower attach.`

#### ② Intensity × attach curve (with regret overlay)
- X: intensity 1-4
- Y: attach rate (with diminishing returns)
- Overlay: regret % (rising with intensity)
- `●` user's spot · vertical line at regret = 8% (the guardrail)
- Commentary: `At intensity 2, attach is 17.8% and regret 4%. Pushing to intensity 4 lifts attach to 23% but regret crosses 9% — fails the regret guardrail.`

#### ③ Suitability matrix
- 2×2: channel (in-app / RM / lifecycle) × readiness (low / high)
- Green = suitable · red = blocked (RM + low-readiness)
- `●` user's current combo
- Commentary: `Your combo (in-app, 50% wait-until-warm) is safe. RM + low readiness combo is blocked — RM needs evidence of warm-up.`

**CTA:** `[← Comms]` · `[Continue to Review →]`

### 6.9 TEST · Step 4 — Review

**Page title:** `Test · Trust-Aware Ceiling Lift · Step 4 of 5 · Review & Run`

**Policy spec sheet** (3 panels — one per lever group — with `[edit step N]` links):

#### ▣ Payment Policy
- Cohort: Verified (3,800)
- Trust gate: 18 months
- Ceiling lift: +20% ($1,200 → $1,440)
- Rails: Zelle, ACH
- Rollout: 60% (~1,830 customers)
- Guardrails: auto-rollback on complaint spike · DI ≥ 0.85

#### ▣ Communications
- Channel mix: In-app 40% · Push 20% · Email 20% · SMS 12% · RM 8%
- Touches/week: 3 · Pre-payout · Proactive tone
- Effective: 71% reach · ~817 customers warm to act

#### ▣ Deepening
- Next-best: HY Savings @ intensity 2
- Channel: In-app, when 50%+ warm
- Rollout: 60% of warmed cohort

**What the simulation will tell you panel:**

```
• Net Interest Income outcome over 8 weeks with confidence intervals
• J-curve payback dynamics (when does the spend pay back?)
• Multi-arena cascade: policy → comms → deepening, with handoffs
• Fraud band tightening over time
• Fair-lending DI dynamics under noise
```

**Primary CTA:** `[▶ Run What-If Simulation]`

**Alternate (Optimizer upgrade panel):**

```
⚡ Want to scan around these values? Switch to Optimizer mode →
```

**On switch — Review morphs:**

- Spec sheet values → ranges (defaults ±30% around current)
- Goal radio panel (4 options): Maximize NII / Minimize failures / Maximize fairness margin / Balanced
- Constraints panel (always on): Fraud Δ CI ≤ 0 · DI ≥ 0.80 · Suitability
- Primary CTA: `[⚡ Run Optimizer · 1,000 configurations]`
- Secondary: `[← Back to What-If]`

### 6.10 TEST · Step 5 — Loader → Results

#### Loader phases

See Section 4 for full phase tables (What-If 8 phases / Optimizer 6 phases).

#### What-If Results content

**Hero chart label:** `Net result over 8 weeks · the J-curve`

**Hero commentary:**

```
▶ Policy clears Friday friction wk 1-4. Comms ramp wk 3-6 builds
   awareness. Deepening lands wk 5-8 — that's the inflection that
   pays the marketing spend back.
```

**Outcomes table (7 rows):**

| Metric | Value | Reference | Status |
|---|---|---|---|
| Net Interest Income | `+$0.85M` | `CI $0.62-$1.08M` | ✓ |
| Failures removed | `−1,046` | per quarter | ✓ |
| Fraud impact | `CI ≤ 0` | within guardrail | ✓ |
| Fair-lending DI | `0.94` | above 0.85 floor | ✓ |
| Call-centre savings | `−$1.2M` | cost down | ✓ |
| Marketing spend | `+$48K` | efficient | — |
| Marketing mROI | `13.6×` | | ✓ |

**Arena breakdown (collapsible, mirrors Steps 1-3):**

```
▾ Payment policy    E1 = 1,345 cleared · friction 12.4%
▾ Communications    awareness 71% · NPS +4.3 · readiness 0.50
▾ Deepening         attach 17.8% · primacy uplift +$30K
```

**Actions:** `[← Re-run with tweaks]` · `[⇧ STAGE FOR DEPLOY]`

#### Optimizer Results content

**Hero chart label:** `Configuration space · 1,000 scanned · 3 winners on Pareto frontier`

**Axes:** X = friction (less → more) · Y = NII at stake · Color = fairness margin DI · Bubble size = deepening NII

**Top 1 (●A) full card:**

```
Top 1 · NII-leaning
+$1.18M NII · −1,200 failures · DI 0.86

Winning configuration
  Customer group    Verified (3,800)
  Trust threshold   18 mo
  Ceiling lift      +24%
  Rollout           65%
  Channel mix       RM-heavy (40% RM, 30% in-app)
  Next-best         HY Savings @ intensity 3
  Wait until warm   50%

Why on the frontier:  highest NII while still above DI floor
Trade-off:            pushes fraud band closer to guardrail
Confidence:           CI $0.92M-$1.44M

[View full simulation →]
```

**Top 2 (●B) compact card:**

```
Top 2 · Balanced
+$1.02M NII · −1,400 failures · DI 0.91
Trust 24mo · Lift 20% · Coverage 60%
Mixed comms · DD Switch · intensity 2
Why on the frontier: best risk-adjusted return

[View full simulation →]
```

**Top 3 (●C) compact card:**

```
Top 3 · Risk-min
+$0.74M NII · −1,500 failures · DI 0.96
Trust 30mo · Lift 16% · Coverage 50%
Low-touch comms
Why on the frontier: maximum fairness margin

[View full simulation →]
```

**Actions:** `[← Run different ranges]` · `[⇧ STAGE TOP 1 FOR DEPLOY]`

---

## 7. Implementation plan

### 7.1 Files to create

| File | Purpose |
|---|---|
| `src/components/loaders/SimulationLoader.jsx` | Multi-phase narrated loader (What-If + Optimizer variants) |
| `src/components/SenseAssetCard.jsx` | The 12-asset card with inline-expansion drill-down |
| `src/components/SenseAssetDrawer.jsx` | (DEPRECATED in plan — replaced by inline expansion in SenseAssetCard) |
| `src/components/TestStepper.jsx` | Horizontal 5-step progress indicator with click-back |
| `src/components/Workbench.jsx` | Two-column layout: anchored levers left + insights right |
| `src/components/charts/FairnessSafeZone.jsx` | Heatmap with user-position pin |
| `src/components/charts/RentHistogram.jsx` | Histogram with current + proposed ceiling lines |
| `src/components/charts/CohortWaterfall.jsx` | Stepwise funnel chart |
| `src/components/charts/ElasticityReference.jsx` | Shape-only curve with pin |
| `src/components/charts/ChannelMixFunnel.jsx` | Live channel-mix conversion funnel |
| `src/components/charts/AwarenessSCurve.jsx` | Adstock S-curve over 6 weeks |
| `src/components/charts/CostPerAware.jsx` | Bar chart, current vs alternative mixes |
| `src/components/charts/ProductFitBars.jsx` | 5-product attach × NII comparison |
| `src/components/charts/IntensityAttach.jsx` | Curve with regret overlay |
| `src/components/charts/SuitabilityMatrix.jsx` | 2×2 grid, channel × readiness |
| `src/components/charts/ParetoFrontier.jsx` | Bubble chart of configuration space |
| `src/data/gigSignals.js` | The 3 signals + their lineage to hypotheses |
| `src/data/cohortInsights.js` | Distribution data for the 4 cohort charts in Analyse |
| `src/data/sensedAssets.js` | The 12 assets with light + full drill-down content |

### 7.2 Files to refactor

| File | Change |
|---|---|
| `src/pages/Theme.jsx` | Replace hypothesis cards with 3 signal cards. Each opens the loop with its context. |
| `src/pages/GigPipeline.jsx` | Restructure Stages 1-3 into Sense / Analyse / Hypothesize per Section 5. Replace old detection panel with composed-assets reveal. |
| `src/pages/GigPipeline.jsx` (Stage 4) | Restructure into 5-step guided journey: Policy → Comms → Deepening → Review → Results. Each step uses Workbench. Drop the standalone "entry choice" page. |
| `src/components/Sidebar.jsx` | Rename `Data & Models` → `Analyse`. |
| `src/workspaces/AnalyzeWorkspace.jsx` | Rename to `AnalyseWorkspace.jsx`. Replace contents with scrollable Sense → Analyse → Hypothesize sections. |
| `src/workspaces/SimulateWorkspace.jsx` | Drop the Starting Gate. Replace with the 5-step Test journey + loader + results. |

### 7.3 Files to delete

| File | Reason |
|---|---|
| `src/workspaces/HubWorkspace.jsx` | Already deprecated; remove fully. |

### 7.4 Build sequence

1. **Data + content layer** — populate `gigSignals.js`, `cohortInsights.js`, `sensedAssets.js` with content from Section 6
2. **SimulationLoader** — implement standalone (no engine wiring); verify phase animations
3. **SenseAssetCard + inline expansion** — implement the 12-card grid with click-to-expand behavior
4. **Theme page** — refactor to 3 signal cards
5. **Analyse workspace** — scrollable Sense + Analyse + Hypothesize sections; SenseAssetCard grid in Sense; cohort charts in Analyse; hypothesis cards in Hypothesize
6. **Workbench component** — two-column responsive layout
7. **Chart components** — implement the 10 pre-experimentation visualizations (5 for Step 1, 3 for Step 2, 3 for Step 3 = 11 total; -1 if we reuse one)
8. **TestStepper component** — 5-step horizontal stepper with click-back
9. **Test Step 1** (Policy) — Workbench + 4 policy charts + Continue
10. **Test Step 2** (Comms) — Workbench + 3 comms charts + Continue
11. **Test Step 3** (Deepening) — Workbench + 3 deepening charts + Continue
12. **Test Step 4** (Review) — spec sheet + Run buttons + Optimizer-mode morph
13. **Test Step 5** (Results) — wire SimulationLoader + progressive reveal + What-If and Optimizer variants
14. **Sidebar rename + workspace path updates**
15. **End-to-end QA** — walk the demo, verify each transition + content matches Section 6

---

## 8. Open questions

These are non-blocking but should be resolved before live demo:

- **Q1 — Should the 3 signals in Theme have predicted-outcome chips?** (e.g., `+$4M NII at stake`) Currently they're descriptive-only. Adding chips creates a value comparison; staying descriptive keeps it as honest observation.
- **Q2 — Should cohort distribution charts in Analyse be interactive?** (Click bar → drill into that subset.) Adds depth but complicates the spec. Static is simpler for the demo.
- **Q3 — Pareto bubble click behavior.** Modal · inline expansion · navigate to dedicated What-If results view of that config?
- **Q4 — Loader pause / rewind?** Currently just Cancel during run. Could add scrubbing for replayability.
- **Q5 — "View full simulation →" on Optimizer top-3 cards.** Modal, inline expansion, or navigate?
- **Q6 — Light-depth drill-down content for the 8 non-hero assets** (Section 6.3.3) needs to be written. Template defined; content drafting pending.

---

*End of plan v2.*
