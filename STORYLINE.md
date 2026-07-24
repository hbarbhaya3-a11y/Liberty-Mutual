# Decision Cockpit · Storyline

A walkthrough of the application as a story. Built for the **Director · Money Movement (Consumer + Commercial)** persona — the person who runs payment-product decisions for the bank.

---

## The opening framing

The bank has decided to compete on the *intelligence layer over money movement*, not on price. Every customer touches payments first and most often, and every payment is a decision: lift the cap or hold it, route via Zelle or ACH, intervene on a suspicious wire or let it clear. A million of those decisions a day are made by static rules written years ago. This application is the layer that makes each one a *decided* moment.

We're walking through one quarter of work — from sensing a pattern in the deposit base, to running a controlled RCT, to deciding what to roll out.

---

## The persona

**Director · Money Movement (Consumer + Commercial)**

- Owns retention NII, fee growth on payments, and the deposit franchise health
- Doesn't write code; doesn't run regressions
- Has to defend decisions to a CRO, a Compliance lead, and quarterly to the executive committee
- Trades off speed (act on the signal) against discipline (don't ship a fairness breach)

The application's job is to **collapse that trade-off** — let the Director act faster *and* with a stronger audit trail than the current quarterly review cycle allows.

---

## The decision loop

Five stages. Each is a workspace in the app.

```
   Sense   →   Analyze   →   Simulate   →   Deploy   →   Learn
  (signal     (hypothesize    (test under     (run a       (write
   pickup)     under data)     guardrails)     pilot)       back)
```

The loop is not linear in practice — Learn writes back into Sense, drift detected in Deploy can pause a hypothesis mid-pilot, and Compliance refusals in Deploy show up as restraint logs that the CEO companion can quote on demand. But the demo walks it forward, stage by stage.

---

## 1 · Sense — the Decision Cockpit

**What the user sees:** a live themes panel — 4 emerging themes surfaced from money-movement signals across the consumer + commercial book. Each theme is sized by value, velocity, or relevance (the user can flip the sort). The signal stream on the left shows individual events feeding the themes.

**The themes today:**

| Theme | What's happening | Stake |
|---|---|---|
| **Gig money movement** | High-velocity gig customers blocked on recurring outbound payments — rent, vendor, family | Retention NII at risk · ~$56M / yr |
| **Elder protection** | First-ever scam-language wires hitting the rail; FinCEN BEC/EFE pattern | Fraud loss · litigation exposure |
| **Life-event capture** | Equity-event inflows + first-ever brokerage transfers (affluent emergence) | Growth NII · fee gap closure |
| **Rate-sensitive churn** | Aggregator-login spikes + probing transfers to competitor | Margin pressure — but elasticity model is *drifting* |

The Director picks **Gig money movement** as the theme to drill into. The themes panel scrolls (max 2 per row) — clean enough to compare at a glance, dense enough to surface the choices.

> **Why this matters:** the bank can name 4 themes that all map to one of the three named strategic priorities (organic growth, payments transformation, operational efficiency). Sense is where the link is made explicit.

---

## 2 · Three signals on the table

**What the user sees:** within the Gig theme, three mechanistically distinct hypotheses. Not three flavours of the same ceiling lift — three different intervention archetypes targeting three different customer scenarios.

| | **A: Verified-Landlord Ceiling Lift** | **B: Vendor-Payment Rail Re-Route** | **C: Family-P2P Time-Window Relax** |
|---|---|---|---|
| **WHO** | 64K gig renters · ≥18-mo verified landlord pattern | 38K gig freelancers · ≥12-mo recurring B2B vendor pattern | 42K gig family-supporters · ≥24-mo recurring personal P2P pattern |
| **WHAT** | Permanent +20% Zelle cap on the verified landlord counterparty | At Zelle decline, prompt ACH-Same-Day for verified vendor | Time-bounded cap relax on long-tenured personal counterparties |
| **WHY** | Largest segment, most stable pattern, highest precision | B2B tolerates settlement timing · supports gig→SMB ladder | Highest counterparty tenure · lowest fraud · retention-focused |
| **Stakes (est.)** | +$40–70M / yr | +$22–35M / yr | +$15–26M / yr |
| **Mechanism** | Permanent policy change | Routing alternative (no policy change) | Time-bounded policy change |

The Director picks **A — Trust-Aware Ceiling Lift** as the recommended one (it's the highest-precision, highest-stakes play).

> **Why this matters:** each card answers a different slice of the broader "Zelle friction for gig" question. Read down the WHO column to compare cohort scopes. Read down WHAT to compare mechanisms. Read down WHY to compare risk profiles. Demo flips to this layout in seconds.

---

## 3 · Analyze — design the hypothesis

**What the user sees:** the recommended hypothesis presented with **pre-simulation ranges** (not point estimates).

- **NII gain:** +$40–70M / yr · *est. range*
- **Blocked payments:** −180K to −280K / yr · *est. range*
- **Fair-lending ratio (DI):** 0.92–0.96 · *est. range*
- **Complaints:** −2,400 to −4,200 / yr · *est. range*

The footnote: *"Pre-simulation estimates from the optimizer. Running the What-If simulation tightens each range into a point estimate with CI."*

**Below the ranges:**

- **Data + Models** — the 9 streams and 6 models that compose the substrate (every one MRM-approved)
- **Drivers** — five weighted reasons, ranked by share of explained variance from the failure-prediction model:
  - 88% — Rent exceeds the current ceiling (typical $1,425 vs cap $1,200)
  - 81% — Trusted landlord scored as new (22-mo pattern on file, treated as generic counterparty)
  - 74% — Friction concentrates Fri 4–8 PM (67% of failures in the payout window)
  - 69% — Zelle is the only realistic rail (ACH too slow by rent day)
  - 63% — Thin-file customers absorb the failures (1.6× more blocks than verified peers)

**What's NOT on this page anymore:**

- Cohort waterfall charts parameterized by lever settings (those belong in Simulate where the user actually sets levers)
- Fair-lending safe-zone heatmap (same reason)
- A "Hypothesis composed from above" synthesis block (it was just restating the hero)
- Govstrip footer with sha256 hashes (technical noise)

> **Why this matters:** Analyze is hypothesis *design*, not test *execution*. Confusing the two was a coherence bug — showing parameterized charts before the user has chosen parameters made the page feel pre-decided. Ranges, not points, is the honest framing.

---

## 4 · Simulate — the What-If workbench

**What the user sees:** a single full-width column of levers organized in 5 sections, plus a sticky strip at the top showing live cohort summary + fair-lending guardrail + Run button.

**Sticky strip (live):**

> **Selected cohort** · `Gig · High-Velocity`
> **200,000** customers in scope · **64,000** *verified* (32% @ 18-mo gate)
> **Fair-lending: 0.94** · *vs 0.85 floor* ✓
> [ Run Simulation → ]

The "verified" count is dynamic — drag the verified-history slider from 18mo to 24mo, the number drops to ~38K live.

**Lever sections (color-coded left border):**

| | Section | Levers | Visual accent |
|---|---|---|---|
| 1 | **COHORT** | 4 preset cluster cards (Gig · SMB · Migrant · Young Affluent), gig pre-selected. "Add custom cohort" expander with feature-rule builder | violet |
| 2 | **PRODUCTS · RAILS** | Eligible payment rails (Zelle · ACH · RTP · Wire) | blue |
| 3 | **POLICY** | Verified-history requirement · Ceiling lift · Pilot population · Pilot duration · Auto-rollback | amber |
| 4 | **COMMUNICATIONS** | Channel mix · Frequency · Tone · Send timing | green |
| 5 | **FOLLOW-ON OFFER** (collapsed by default, marked *advanced · optional*) | Product · Offer prominence · Channel · Days before warm · Reach. With an explicit "Include follow-on offer in this test" checkbox | — |

**Custom cohort model (in-panel info banner):**

> *"A custom cohort is an additional group defined by feature rules — it gets added to the preset clusters above, not used to filter them. The customer count is unioned. Scoped to this experiment only; not saved to the global catalogue."*

**What's NOT on this page anymore:**

- The right-side context charts (Eligibility Funnel, Conversion Funnel, Fair-Lending Safe Zone) — they showed outputs during input configuration, blurring the mental model. The fair-lending signal survives as the compact pill in the sticky strip.

**Live math (key insight):** every lever feeds a single `simulateOutcomes()` function. Drag verified-history → cohort count changes → treated cohort changes → projected NII changes → fair-lending margin changes. Inputs and outputs are physically connected, so the live cohort total in the strip is *the same number* the results page will show.

> **Why this matters:** the Director is *deciding* on this page, not analyzing. Stripping output charts and surfacing one load-bearing live signal (fair-lending) lets them concentrate on input choice. The "what would happen" question moves to where it belongs — the post-simulation results page.

---

## 5 · Run simulation → Results

**Loader:** a 6-phase visual sequence showing what the sim is computing:

1. Bootstrapping baseline · cloning the cohort, seeding 1,000 parallel scenarios
2. Applying payment policy · weeks 1–4
3. Cascading marketing · weeks 3–6
4. *(Lifting attach + primacy · weeks 5–8 — only if Follow-on Offer was included)*
5. Stitching net outcomes
6. Auditing guardrails
7. Converged

**Results page — three blocks:**

**a. Verdict + Proof KPIs.** Each KPI card has the same three-row structure:

> **Net Interest Income** · *hit*
> **+$11.9M** *(/ 8wk)*
> baseline $0 · *no policy in effect*

> **Blocked payments** · *hit*
> **8,200** *(/ qtr with policy)*       `↓ −29,300 (−78%)`
> baseline 37,500 / qtr · *would have been blocked*

> **Fair-lending margin** · *hit*
> **0.94** *(with policy)*              `+0.09 above floor`
> baseline 0.85 · *deployment floor*

> **Complaints** · *hit*
> **240** *(/ qtr with policy)*         `↓ −840 (−78%)`
> baseline 1,080 / qtr · *would have been raised*

Headline = with-policy value. Baseline below it. Delta as a colored pill flush-right. **Compared against baseline, not against the optimizer's pre-sim prediction** — because the decision-relevant question is "what did the policy actually change?", not "did the optimizer guess well?"

**b. Simulated 8-week trajectories.** A grid of per-KPI trajectory tiles, each showing how that KPI evolves over the pilot horizon (treatment vs. predicted). No J-curve, no payback-shape interpretation — just the trajectory of each metric, side by side.

**c. How it got there.** 2 or 3 arena cards (Payment policy, Communications, and Deepening if the user opted into the follow-on offer). Each is clickable for a drill-down — customer-pattern breakdown for payment, per-channel performance for comms, attach-by-segment for deepening.

> **Why this matters:** the results page tells one story per KPI: *baseline X → with policy Y → delta Z*. The arenas show how the result was constructed without forcing the reader to interpret a J-curve.

---

## 6 · Deploy — the post-staging journey

The Director stages the policy. It lands in the Deploy portfolio.

**Portfolio table:** rows show every experiment in flight or recently completed, with a stage column that tells the truth at a glance:

| Experiment | Hypothesis | Theme | Stage | Closed |
|---|---|---|---|---|
| **Trust-Aware Ceiling Lift v1** *(JUST STAGED)* | H-2026-04-12 | Gig money movement | Approval | — |
| Subscription-stacking nudge | H-2026-03-22 | Subscription stacking | Live pilot · wk 6/8 | — |
| B2B wholesale ladder | H-2026-04-08 | B2B deposits | Live pilot · wk 3/8 | — |
| Mass-affluent SMA bridge | H-2026-02-19 | Wealth onramp | Compliance | — |
| Fraud-pattern Wire Hold | H-2026-02-04 | Elder protection | Completed · early stop, stat-sig | May 17 |
| Verified-Landlord Ceiling Lift (Q4'25) | H-2025-11-08 | Gig money movement | Completed · full duration | May 25 |

Click the staged row. The expansion shows the full post-staging journey:

**Stage 1 · Approval — multi-department parallel sign-off.** Three rows, each a department:

| Status | Department | Approver |
|---|---|---|
| ✓ approved | **Risk · CRO Office** | L. Okafor · Chief Risk Officer |
| ● pending | **Business Lead · Money Movement** | Sam Kayne · Director · Money Movement |
| ✓ approved | **Model Risk Management** | P. Reyes · MRM lead |

Risk and MRM cleared overnight on the pre-flight pack. The Business Lead (the Director themselves) is the human-in-the-loop. They click **Approve**.

**Stage 2 · Compliance.** Auto-checks fire — MRM model card v3.4, ECOA disparity margin 0.94, fraud envelope within Q1 bound. All three clear.

**Stage 3 · Go Live with RCT.** Compliance has cleared, but the pilot has NOT auto-launched. A new panel appears:

> **READY TO LAUNCH**
> All three departmental approvals cleared. Compliance checks passed. The policy is ready to enter a controlled RCT. Clicking Go Live below puts real customer traffic through the treatment arm — auto-rollback is armed and will trip on any guardrail breach.
>
> | Duration | Treatment cohort | Control cohort | Primary KPIs | Guardrails | First interim audit |
> | 8 weeks | 34,500 | 3,850 · matched | NII · Blocked · Complaints | Fair-lending floor · fraud envelope · auto-rollback | Wk 2 |
>
> **[ Go Live with RCT → ]**

The Director clicks. **3-second staged transition** runs through:

- Allocating treatment cohort · 34,500 customers
- Allocating control cohort · 3,850 customers · matched on cluster signature
- Routing first traffic through treatment arm…
- Arming auto-rollback sentinels · fair-lending margin + fraud envelope
- Connecting to live monitoring · interim audit at wk 2 scheduled
- RCT live ✓

Then the **Live Pilot** panel takes over at Wk 1 Day 1.

**Stage 4 · Live Pilot · RCT measurement.** A pulsing red LIVE badge, a live ticker rotating through real activity ("12,420 eligible payments processed in last hour · Wk 1 day 1 · treatment cohort active · auto-rollback armed · last sentinel sweep 18s ago"), and a 2×2 grid of KPI cards. Each card:

- Treatment cohort realised value (solid colored line)
- Control cohort realised value (solid grey line)
- Predicted treatment effect (dashed reference)
- Shaded *causal lift* polygon between treatment and control
- Hover tooltips per week with treatment / control / lift / predicted

**RCT KPIs are experiment-type-aware.** The hypothesis is friction-removal, so the tracked metrics are NII · Blocked · Complaints. *Not* Attach — that's a deepening metric and would be misleading on a friction experiment. A deepening pilot (subscription stacking) tracks NII · Adoption · Attach · Engagement instead. A loss-prevention pilot (elder protection) tracks Fraud rate · Loss avoided · False-positive holds.

**Stage 5 · Learnings — post-RCT retrospective.** When the pilot duration expires (or the stopping rule fires for stat-sig early stop), this panel renders:

> **Q4 pilot landed inside CI on all 4 KPIs · promoted to full rollout.**
>
> **Final outcomes · actual vs predicted**
>
> | KPI | Predicted (pre-RCT) | Actual (RCT realised) | Variance |
> | NII | +$9.4M / 8wk | +$9.1M | −3% vs prediction |
> | Blocked payments | −24,800 / qtr | −23,940 | within CI |
> | Complaints | −712 / qtr | −688 | within CI |
> | Fair-lending margin | 0.93 | 0.92 | +0.07 above floor |
>
> **What worked beyond prediction**
> - Verified-recurring cohort adoption hit 84% (vs predicted 78%) — customers shifted to the lifted tier faster than the simulation modelled.
> - Friday-evening Zelle volume held its 67% concentration through all 8 weeks — pattern was structurally stable.
>
> **What didn't land as modelled**
> - Follow-on attach landed flat at 12.4% (vs predicted 17.8%) — the warm-up window may need to extend past 8 weeks.
>
> **Recommended next move: Promoted**
> *"All primary KPIs landed inside CI · margin held · pilot ran full duration. Promoted to 80% rollout on the verified cohort effective wk 9."*

The Director hits Promote.

> **Why this matters:** the full lifecycle is visible in one expansion — approval governance, compliance gate, explicit human-in-the-loop go-live, live RCT measurement, and the structured retrospective. Nothing happens off-screen, nothing happens automatically that should be a human decision.

---

## 7 · Learn — the experiment portfolio

A flat table of every closed pilot, with **prediction accuracy** (R² between actual and pre-RCT predicted) as the headline metric. Aggregates at the top:

- **Prediction accuracy** · 0.90 (across 5 closed pilots)
- **Promotion rate** · 60% (3 of 5 promoted)
- **Pilots with drift** · 3 (at least one KPI outside CI)
- **Closed this quarter** · 5

Each row expands to a **Realised vs Predicted** breakdown per KPI plus a **Writeback Ledger** — what the experiment taught the underlying models:

> *"Verified-payee pattern weights updated: 18-month threshold confirmed across the cohort"*
> *"Trust-gate model fidelity now 0.94 R² on the validation window (up from 0.91 pre-pilot)"*
> *"Next move: extending the policy to 80% rollout — drafted as next hypothesis"*

The writeback is what makes the loop a loop. Every promoted experiment improves the model the next hypothesis runs against.

---

## 8 · Strategic companion — preparing for executive review

A separate workspace (CXO Companion) frames the same portfolio at executive altitude. Four lenses across the top: **Franchise · Competitive · Risk & Regulatory · Capital**. Below, a chat answers strategic questions through the chosen lens, with answers grounded in the actual decisions the bank made this week.

The companion isn't trying to do the Director's job — it's a prep tool. *"If your CEO asks how we close the fee gap, here's the three-bullet answer. If your CRO asks what keeps them comfortable, here's the gate-teeth argument. If the board asks about downside, here's the bounded-blast-radius answer."*

The chat:

- Tracks served KB entries per session — asking the same question twice returns a different angle, not the same canned response
- Falls back to topic-aware suggestions when no entry matches (gig → "I can frame this as retention, fairness, or payments strategy — pick one")
- Stays at C-suite altitude (no "we removed 236,000 friction events" — that's PM-altitude. The companion talks about "cohort retention, fee gap closure, capital allocation")

---

## The talking points

**Why this isn't a dashboard.**
A dashboard shows you what happened. This shows you what to decide next, what the consequence will be, and who has to sign off. Every screen ladders to a decision.

**Why this isn't a model.**
A model gives you an answer. This wraps the answer in the governance that makes it deployable — pre-registered fair-lending tests, multi-department approval, stat-sig stopping rules, auto-rollback sentinels. The model is *one* component; the layer around it is what makes it shippable.

**Why ranges, not points.**
A pre-RCT estimate that says "+$56M" lies about the certainty of the estimate. "+$40–70M · est. range" tells the user what we actually know. The simulation's job is to *tighten the range*, not to confirm a number.

**Why baseline, not predicted.**
Comparing simulated to predicted answers "did the optimizer guess well?" Comparing with-policy to baseline answers "what did the policy actually change?" The second is the question the Director has to defend to the executive committee.

**Why the gate prefers 'no'.**
The most valuable artifact in the system is the refusal log. Rate-sensitive churn this quarter was tempting (~$15M of margin) — the gate refused it on model drift. That refusal is what makes the rest of the portfolio credible. The CEO companion can quote it on demand.

---

## Demo timing (~12 minutes total)

| Min | Stage | What you show |
|---|---|---|
| 0–1 | Setup | Persona pill on every screen. "This is who you are." |
| 1–2 | Sense | Themes panel, 4 themes, sort flip, pick Gig |
| 2–3 | Three signals | WHO/WHAT/WHY card grid — *three different scenarios* |
| 3–4 | Analyze | Hypothesis hero with ranges. Drivers. Data + models substrate |
| 4–7 | Simulate | Cohort picker (composition, custom rule builder). Lever sections. Sticky cohort + fair-lending strip. Run |
| 7–8 | Results | Verdict, proof KPIs (baseline + delta chip), 8-wk trajectories, arenas |
| 8–10 | Deploy | Stage, expand row, multi-dept approval, Go Live with RCT (3s transition), live RCT view |
| 10–11 | Learnings | Post-RCT retrospective. Final vs predicted. What didn't work. Promote verdict |
| 11–12 | Companion + close | CEO altitude reframe. "Why this isn't a dashboard." Refusal log argument |

---

## What this isn't trying to be

- Not a recommendation engine that auto-acts (every consequential decision has a human-in-the-loop button)
- Not a real-time event-streaming dashboard (the live ticker on the RCT view is fiction — what's real is the per-decision audit trail)
- Not a replacement for fraud, marketing-decisioning, or limits systems (it's a decision *layer* over them)
- Not a forecasting tool (the simulation is calibration, not prediction; calibration tightens with each completed RCT)

---

*Sam Kayne · Director · Money Movement · Consumer + Commercial*
