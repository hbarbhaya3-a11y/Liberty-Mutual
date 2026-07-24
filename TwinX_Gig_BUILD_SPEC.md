# TwinX — Gig Economy Money-Movement Decision App

**Build specification for Claude Code.** Self-contained engineering contract to construct the full application from zero. Written from the TwinX product perspective: an enterprise **decision-intelligence** layer that *senses* a money-movement signal, *simulates* the fix against live guardrails, *optimizes* the policy, *proves* it, and *deploys* it — then *learns*.

> **Authoring note.** The conceptual engine (a chained behavioral model) drives every number. It lives **only as code** — the rendered UI never exposes academic constructs (no Greek letters, no "construct chain," no hypothesis IDs on screen). The visible surface speaks the bank's language: rails, ceilings, basis points, attach, primacy, disparate-impact ratio. This split is a hard requirement, not a preference. See §15.

---

## 0. How to read this spec

- **Determinism first.** Every KPI on screen must be *computed* from the engine in §6–§7, never hard-coded. A reviewer should be able to change a lever and see the math propagate.
- **Illustrative/synthetic data.** All dollar/bps figures are synthetic, per-cohort, and must never be summed across overlapping cohorts. Anchor magnitudes to the figures in this spec.
- **Build order is in §13.** Acceptance criteria (the definition of done, including exact numeric checks) are in §14. If a choice is ambiguous, the acceptance numbers are the source of truth.
- **The gig money-movement loop (§5–§7) is the depth.** Other themes are scaffolding; gig is the showcase.

---

## 1. Product thesis

A static payment ceiling — set before real-time gig income existed — fails a *trusted, recurring* obligation every rent day. The bank finds out only when the complaint arrives. TwinX flips this from reactive to **anticipatory**:

1. **Sense** the recurring-obligation pattern before the failure.
2. **Simulate** a trust-gated ceiling lift against fraud and fair-lending guardrails — risk-free.
3. **Optimize** the policy to the value frontier subject to those guardrails.
4. **Prove** it on a controlled holdout.
5. **Deploy** the winner; **learn** from realized outcomes so the next cycle starts sharper.

The product's punchline: *the same money-movement signal that defends the deposit also opens the deepening.* Retention funds share-of-wallet. The app must make that causal chain **visible, quantified, and governable**.

The single most important feature is the **simulation output**: longitudinal, shape-revealing charts (inflection points, saturation, lagged onset, J-curve payback) produced with a deliberate "computing" delay and progressive draw-in. A flat trend line is a failure condition.

---

## 2. Tech stack & runtime constraints

- **Pure static web app.** HTML + CSS + vanilla ES5-compatible JavaScript. **No framework, no build step, no bundler.**
- **Runs from `file://`.** Therefore: **no `<script src>` to local files** (blocked by file origin), **no ES modules**, **no `localStorage`/`sessionStorage`**, **no external network calls.** Everything inlined per page. State is in-memory JS only.
- **One self-contained `.html` per screen.** Shared constants may be duplicated per page rather than imported.
- **SVG for all charts** (hand-rolled; no chart library). Inline SVG strings built in JS.
- **Target**: desktop Chrome, 1500×950+ viewport. Dark theme only.
- **QA harness**: Playwright (Chromium, headless) driving `file://` URLs. No Puppeteer.

### File layout

```
/ (app root, opened as file://)
  ceo.html            Executive brief (entry, optional)
  index.html          Cockpit — portfolio of money-movement themes (treemap + this-week digest)
  theme.html          Theme detail (?id=gig) — reasons, hypotheses, routes into the pipeline
  gig_pipeline.html   THE gig 7-stage decision pipeline (the depth of this spec)
  deep_pipeline.html  Generic pipeline for other themes (?theme=elder|home|churn)
```

Routing is plain `location.href`. `index.html` holds a `PAGE` map: `{gig:"gig_pipeline.html", elder:"deep_pipeline.html?theme=elder", ...}`. `theme.html?id=gig` routes its hypothesis cards into `gig_pipeline.html`.

---

## 3. Information architecture

Four levels, each a drill-down:

1. **CEO brief** (`ceo.html`) — one screen: the week's four decisions (acted / testing / refused), each laddered to a named consumer priority. Links into the cockpit.
2. **Cockpit** (`index.html`) — a squarified **treemap** of money-movement themes sized by relevance and colored by disposition (deepening-amber, defend-blue, refuse-red). A natural-language "this week" digest. Clicking a tile → theme.
3. **Theme** (`theme.html?id=gig`) — the signal cluster, the diagnosis (why it's happening), the candidate interventions (hypotheses), and a CTA into the pipeline.
4. **Pipeline** (`gig_pipeline.html`) — the 7-stage decision run. This is where simulation lives.

**Header strip (every pipeline page):** `env: prod-shadow · region: us-consumer · run: run_gig_0427 · auto-refresh`. A theme ribbon: `GIG — Fortnightly rent payments are failing for high-velocity gig earners — a verified recurring obligation tripping a static ceiling.` A KPI strip: `~14,800 rent-day step-ups/yr · 17.3% step-up friction rate · +$4.0M NII at stake · 5,760 cohort`.

---

## 4. Design system

**Aesthetic target:** a top New York agency with an AI-native mindset. Confident, quantitative, generous spacing, monospaced numerics, restrained color. Outputs carry the visual weight; inputs recede into a compact rail.

### Tokens (CSS custom properties)

```css
--bg-0:#06090f; --bg-1:#0a0e16; --bg-2:#0d121c; --panel:#0e1420;
--hair:rgba(255,255,255,.075);
--ink:#e9edf4; --ink-2:#97a1b4; --ink-3:#5c6577; --ink-4:#3b4254;
--acq:#5b9dff;   /* blue — acquisition / defend */
--violet:#b794f6;/* deepening */
--acc:#ffb15a;   /* amber — value / primary accent */
--green:#42e08b; --red:#ff7a7a; --cyan:#4fd1c5;
--mono: ui-monospace, "JetBrains Mono", monospace;
```

- **Fonts:** Hanken Grotesk (UI), JetBrains Mono (`--mono`, all numerics, labels, status). Load via `<style>` `@font-face` from a CDN *or* fall back to system stacks (no local file deps).
- **Numerics are always monospace.** Big KPI values 26–34px. Labels uppercase, 8–9px, letter-spaced.
- **Panels:** 1px `--hair` border, 12px radius, subtle vertical gradient `linear-gradient(180deg,var(--bg-2),var(--bg-1))`.
- **No emojis in chrome.** Iconography is restrained glyphs (→ ✓ ◇ ▶ ⏸) only.
- **Motion:** purposeful only — the simulate draw-in, the pulsing leading point, progress fills. No decorative animation.

### Core components (build as JS string-builders)

- `panel(title, meta, bodyHTML)` — titled card with a colored status dot.
- `slider(key,label,hint,min,max,step,val,unit)` — labeled range with min/max scale and live value; fill via `--pct` custom property.
- `segRow(key,label,options,current)` — segmented single-select buttons.
- `kv(k,v,sub)` — key/value row for identity panels.
- `kpiCard(cls,label,tag,valueStr,desc,chartSVG)` — **the hero output unit**: label, a small tag (shape descriptor), a big value, one-line caption, and the chart. See §9.
- `gCard(cls,label,valueStr,desc)` — a non-time-series guardrail card (pass/fail), so binary guardrails never fake a trend.
- `lineChart(opts)` — the longitudinal SVG chart. See §9.

---

## 5. Domain model — gig money movement (the depth)

### 5.1 The cluster

```js
GIG.cluster = {
  id:"cluster_gig_economy_high_velocity",
  name:"Gig Economy · High Velocity",
  population:5760,        // customers in cohort
  share:0.115,            // of consumer book
  policy:"v3",            // current step-up ceiling policy
  drift:"stable"          // monitored; stable means admissible
};
```

The defining facts the whole app reasons about:

- Rent (median **$1,425**) exceeds the static per-transaction **$1,200 Zelle ceiling**. The amount is *normal for the obligation, abnormal for the limit.*
- The landlord counterparty has a **22-month** verified rent-day cadence; recurrence score **0.81**.
- Failures cluster **Friday 4–8 PM** (the payout window) and fortnightly cycles.
- **17.3%** step-up friction rate on rent-day Zelle, ↑4.1pp QoQ.
- Thin-file / new-to-bank gig earners absorb **1.6×** more failures than verified — the fair-lending exposure.

### 5.2 Signals (Stage 1 — Sense)

Six signal cards, each `{icon, title, detail, value}`:

1. **Step-up friction on rent-day Zelle** — outbound to recurring landlord token clusters Fri 4–8 PM trips the $1,200 ceiling. `17.3% friction · ↑4.1pp QoQ`
2. **Verified recurring obligation** — 22 observed months; amount within 95% of historical. `22 mo · recurrence 0.81`
3. **Contact-centre "payment declined / limit"** — call-rate on declined-limit reason code rising. `+11% calls QoQ`
4. **Multi-platform inflow, single large outflow** — Uber/DoorDash/Instacart/Upwork inflows accumulate, then one large rent outflow exceeds the per-txn limit. `velocity 0.88 · P2P out 0.73`
5. **Rent-burden timing mismatch** — rent due date lands before platform payout settles. A cash-timing, not a credit, problem. `unowned cohort · attach 1.1`
6. **Fairness flag — thin-file penalty** — static ceilings disproportionately fail thin-file earners. `audit requested`

### 5.3 Diagnosis (Stage 2 — reasons), likelihood-weighted

```
R1 Volume        88%  rent ($1,425) > static $1,200 per-txn ceiling
R2 Velocity      74%  multi-platform inflow reads as risk to a velocity rule
R3 Channel       69%  concentrated on Zelle/P2P where limits are tightest; ACH too slow for rent day
R4 Trust mis-scored 81%  a 22-mo-paid landlord still scored as generic counterparty
R5 Fairness      63%  thin-file earners absorb most failures (1.6× skew)
```

### 5.4 Candidate interventions (Stage 2 — hypotheses)

```
H-2026-04-12  Trust-Aware Ceiling Lift   ★ champion winner
  Lift the step-up ceiling +20% when an inbound/outbound matches a verified recurring
  landlord rent-day pattern (≥18 mo). Removes Friday friction for trusted depositors
  without opening the ceiling for everyone.
  params: pattern=recurring_landlord_rent_day, ceiling_lift=+20%, min_recurrence=18mo,
          rail=zelle, trust_gate=on
  predicted: friction −8,400 · NII +$4.0M · cc cost −$1.2M · complaints −120

H-2026-05-01  Payout-Window Relax    (rejected sibling)
  Relax thresholds during Fri 4–8 PM window. Lower blast radius, smaller value.
  predicted: friction −3,100 · NII +$0.9M

H-2026-05-09  Rail Streamline        (rejected sibling)
  Streamline P2P/Zelle limits for high-velocity accounts with established counterparties.
  predicted: friction −2,200 · NII +$0.6M · cc cost −$0.4M
```

### 5.5 Customer twins (Stage 3) — feature vectors 0–1

```
Marcus Chen   verified · 22 mo   [txn velocity .91, mobile .84, recurring .86, zelle out .62, cp div .68, bal slope .55]  (selected archetype)
Aisha Diallo  thin-file · 7 mo    [.84, .91, .58, .71, .41, .34]  (fairness case)
Rosa Torres   established · 16 mo [.62, .77, .74, .49, .66, .61]  (fortnightly-freelance variant)
```

### 5.6 Behavioral models (Stage 3) — the response surfaces

Each `{icon, class, title, detail, quality:[[k,v]...]}`. These are what the simulator rides:

1. **Recurring-obligation detector** — tokenizes the landlord counterparty, confirms rent-day cadence over 24 mo. `coverage 94% · precision 0.97`
2. **Counterparty-trust model** — trust score from tenure, recurrence, reciprocity, dispute history. Observable, explainable, not a protected-attribute proxy. `AUC 0.91 · audited yes`
3. **Channel-propensity model** — predicts the rail (Zelle/ACH/RTP) for a given obligation and timing. `AUC 0.88 · rails 4`
4. **Payment-limit elasticity model** — failure probability as a function of ceiling, amount, velocity. The dose-response curve. `R² 0.86 · monotone ✓`
5. **Velocity-fraud separator** — benign multi-platform gig income vs velocity-anomaly fraud. `AUC 0.95 · FPR 0.6%`
6. **Cash-flow stability model** — income regularity and runway; behavioral creditworthiness. `coverage 88% · horizon 90d`
7. **Deepening-propensity model** — likelihood to adopt the next product once friction clears and trust is returned. `AUC 0.83 · uplift +18pp`

### 5.7 Cohort table & rail mix (engine inputs)

```js
COHORT = {
  verified:{n:3800, fail:.173, thin:0.9, label:"Verified recurring"},
  all:     {n:5760, fail:.205, thin:1.0, label:"All gig high-velocity"},
  thin:    {n:1640, fail:.262, thin:1.6, label:"Thin-file / new-to-bank"}
};
RAILSHARE = { zelle:.58, ach:.18, rtp:.12, wire:.04 };
railCov(channels) = clamp( Σ RAILSHARE[on rails] / 0.92, 0, 1 );
```

---

## 6. The decision engine — the chained behavioral model (HIDDEN)

This is the analytic spine. **It exists only in code + comments. Never render its variable names.** It guarantees internal consistency: capabilities cap reach; policy levers drive value; guardrails are read off the same equations.

### 6.1 Two kinds of variables — a load-bearing distinction

- **Capability stocks** — `SENS` (sensing / detection coverage) and `DEC` (decisioning / real-time automation). These **mature over quarters via investment**, not on the simulation screen. They are **read-only context** for a run, rendered as "model readiness" meters. **They must never be sliders.**
- **Policy levers** — what a decision-maker sets *this cycle*: trust gate, ceiling lift, rail policy, payout-window tolerance, coverage, plus the comms and deepening levers in §7. These are the swept inputs.

Rendering a capability as a tunable lever is a **correctness bug**, not a style issue.

### 6.2 Parameters

```js
CHAINP = { a:0.60, FRIC0:12.0, rho:0.75, EXP0:55, beta:1.60, XSmax:22,
           EXPmid:62, EXPk:12, theta:0.060, PRIM0:30, lam:0.90,
           spread:0.0277, balances:4.0e8, CHN0:18, kappa:1.30, gamma:0.079 };
sat(EXP) = 1 / (1 + exp(-(EXP - EXPmid)/EXPk));   // logistic saturation
```

### 6.3 Lever → variable mapping

```js
chainInputs(L):
  co  = COHORT[L.cohort]
  REG = clamp(0.55 + 0.45*(1-(co.fail-0.17)/0.10), 0.45, 1) * (0.7 + 0.3*(co.thin<=1?1:0.7))
  REG = clamp(REG, 0.45, 0.98)              // verified ⇒ high regularity; thin-file lower
  qual  = clamp(1-(L.trustMin-6)/42, 0.18, 1)
  lever = clamp( tanh(L.limitFlex/26) * (0.6 + 0.4*qual), 0, 1 )   // personalization aggressiveness
  return { REG, SENS:L.sens, DEC:L.dec, lever, MKT:L.mkt }
```

### 6.4 The chain

```js
chain(L):
  I    = chainInputs(L)
  PRD  = I.REG * I.SENS^a                     // predictability, gated by sensing
  surfaced = PRD >= 0.55                       // below threshold ⇒ theme never surfaces
  PERS = I.lever * PRD * I.DEC                  // personalization, capped by decisioning
  FRIC = FRIC0 * (1 - rho*PERS)                // friction falls with personalization
  EXP  = EXP0 + beta*(FRIC0 - FRIC)            // experience improves as friction falls
  XS   = XSmax * sat(EXP) * (1 + theta*MKT)    // cross-sell, marketing-moderated
  PRIM = PRIM0 + lam*XS                        // primacy / share-of-wallet
  VAL  = ((PRIM-PRIM0)/100) * spread * balances// Δ annual NII
  CHN  = CHN0 * exp(-kappa*PRIM/100)           // churn falls as primacy rises
  return { REG,SENS,DEC,lever,MKT,PRD,surfaced,PERS,FRIC,EXP,XS,PRIM,VAL,CHN }
```

**Teaching behavior (must hold):** at high sensing, a verified cohort surfaces (PRD ≈ 0.9). Drop sensing to ~0.5 and PRD falls below 0.55 — *the signal exists but goes unread.* Drop decisioning and the same prediction yields a weaker personalized limit. This is the "see-but-can't-act vs act-but-blind" diagnostic.

### 6.5 Fairness frontier (boundary condition on personalization)

```js
disparateImpact(L):
  c     = chain(L)
  guard = (L.trustMin >= 12) ? 0.35 : 1.0          // the trust gate flattens the curve
  DI    = clamp( 1 - 0.55*guard*c.lever^2, 0, 1 )
  // admissible ⇔ DI >= 0.80  (the four-fifths rule)
```

Pushing personalization (`limitFlex`) high **without** the trust gate drives DI below 0.80 — the gate must hard-fail. This is the numeric expression of "personalization past the fairness frontier."

### 6.6 The compounding loop (deposit-deepening flywheel)

```js
// closed vs open steady state, illustrated from a representative mid-regularity start
loopSteady(L, gamma):
  REG0 = clamp(chainInputs(L).REG - 0.30, 0.45, 0.75)
  reg = REG0
  for s in 1..40:
    c = chainAtREG(L, reg)                       // chain with REG overridden
    val = c.VAL
    reg = clamp(reg + gamma*(c.PRIM/100) - 0.25*(reg-REG0), 0, 1)
  return { ssREG:reg, ssVAL:val, REG0 }
```

`gamma = 0.079` (fitted; instrument the primacy↔regularity link with an exogenous payout-cadence shifter to break endogeneity). Closed-loop steady-state NII exceeds open-loop (`gamma=0`) by **~4%** — *the recurring value of staying in the loop.* On the **rendered** Learn screen this is "+7.9% reinforcement per quarter," reliability "0.68 → 0.81," "+~4% vs one-time." **No γ, no H9, no "Perpetual Adaptation Loop" on screen.**

---

## 7. The three-arena simulation engine (Stage 4 — the centerpiece)

The Simulate stage is **three staggered arenas + a combined run**, mirroring the operational chain. Each arena's output is carried into the next as an input multiplier. The dependency must be *felt*: you cannot credibly market a personalized limit before payment policy makes it true, and you cannot cross-sell before communications has earned the sentiment.

### 7.1 State

```js
// Arena 1 reuses ST (payment levers)
ST = { cohort:"verified", trustMin:18, limitFlex:20,
       channels:{zelle:true,ach:true,rtp:false,wire:false}, cadence:3, coverage:60,
       sens:0.90, dec:0.85, mkt:3 }            // sens/dec are CONTEXT, not sliders

A2 = { alloc:{inapp:40,push:20,email:20,sms:12,rm:8}, freq:3,
       creative:"proactive", timing:"pre_payout" }
A3 = { product:"hy_savings", intensity:2, offerChannel:"inapp", minSent:0.55, coverage:55 }
ARENA = { a1:false, a2:false, a3:false, a4:false }   // revealed flags (gating)
```

```js
CHAN2 = {  // channel reach, per-touch cost, adstock decay
  inapp:{reach:.95,cost:.40,decay:.60}, push:{reach:.70,cost:.20,decay:.50},
  email:{reach:.55,cost:.15,decay:.70}, sms:{reach:.80,cost:.50,decay:.45},
  rm:{reach:.42,cost:6.0,decay:.88} };
CREATIVE = { proactive:1.00, educational:0.85, generic:0.60 };  // sentiment multiplier
PROD = {  // attach propensity, annual NII/adopter, fee/adopter
  secured_card:{attach:.16,nii:380,fee:60}, hy_savings:{attach:.22,nii:520,fee:0},
  ewa:{attach:.28,nii:240,fee:35}, credit_builder:{attach:.14,nii:300,fee:48},
  dd_switch:{attach:.19,nii:610,fee:0} };
```

### 7.2 Arena 1 — payment policy

```js
a1calc(L):
  co=COHORT[L.cohort]
  qual=clamp(1-(L.trustMin-6)/42,.18,1)
  liftResp=tanh(L.limitFlex/26)
  rc=railCov(L.channels)
  cad=0.55+0.45*clamp(L.cadence/7,0,1)
  cov=L.coverage/100
  E1=co.n*cov*rc*qual                         // friction-cleared eligible pool (HANDOFF →A2)
  attempts=E1*12
  baseFail=co.fail
  treatedFail=baseFail*(1-0.78*liftResp*cad)
  stRate=1-treatedFail
  failRemoved=attempts*(baseFail-treatedFail)
  complaints=-failRemoved/70
  ccCost=-failRemoved*145                      // $ saved (negative)
  retentionNII=E1*640*(0.6+0.4*liftResp)*(0.7+0.3*qual)
  fraud=clamp(0.030*L.limitFlex - 0.058*L.trustMin - 0.15*rc + 0.20, -1.2, 2.4)
  noise=1/sqrt(clamp(cov*qual*rc,0.05,1))
  ciFraudUp=fraud+(0.10+0.10*sqrt(noise))      // guardrail: must be ≤ 0
  expHead=clamp((baseFail-treatedFail)/baseFail,0,1)  // experience headroom (HANDOFF →A2)
  di=disparateImpact(L)                        // guardrail: must be ≥ 0.80
  return {E1,stRate,treatedFail,baseFail,failRemoved,complaints,ccCost,
          retentionNII,fraud,ciFraudUp,expHead,di,qual,rc}
```

### 7.3 Arena 2 — communications / marketing mix

Full channel-mix allocator (sliders summing to 100%, normalized), tagged to a campaign concept (creative). Built on Arena 1's `E1` and `expHead`.

```js
a2calc(L2, a1):
  effReach=Σ_c (alloc_c/Σalloc)*CHAN2[c].reach
  cpc=Σ_c (alloc_c/Σalloc)*CHAN2[c].cost
  freqEff=1-exp(-0.55*L2.freq)
  awareness=clamp(effReach*freqEff*1.15, 0, 0.97)          // adstock S-curve
  awareN=a1.E1*awareness                                    // (HANDOFF →A3)
  timingMult=(L2.timing=="pre_payout")?1.0:0.9
  sentiment=clamp((0.46 + 0.46*a1.expHead*CREATIVE[L2.creative] + 0.10*awareness)*timingMult, 0, 0.95)
  spend=awareN*cpc*L2.freq
  deflection=awareN*0.045
  npsShift=clamp(sentiment*7 - 1.2, -1.5, 6.5)
  feedbackN=awareN*0.18
  costPerAware=spend/max(1,awareN)
  readiness=clamp(awareness*sentiment, 0, 1)               // cross-sell multiplier (HANDOFF →A3)
  return {awareN,awareness,sentiment,spend,deflection,npsShift,feedbackN,costPerAware,readiness}
```

### 7.4 Arena 3 — deepening / cross-sell

Gated by Arena 2 readiness and a sentiment-eligibility threshold.

```js
a3calc(L3, a1, a2):
  eligFrac=clamp((a2.sentiment - L3.minSent)/(0.92 - L3.minSent), 0, 1)
  eligN=a2.awareN*(0.35 + 0.65*eligFrac)*(L3.coverage/100)
  p=PROD[L3.product]
  chMult={inapp:1.0, rm:1.15, lifecycle:0.85}[L3.offerChannel]
  intensityMult=1 + 0.08*(L3.intensity-1)
  attachRate=clamp(p.attach*(0.5+0.5*a2.readiness)*intensityMult*chMult, 0, 0.6)
  adopters=eligN*attachRate
  deepeningNII=adopters*(p.nii+p.fee)
  primacy=clamp((0.06+0.10*a2.readiness)*(L3.product=="dd_switch"?1.4:1.0)*intensityMult, 0, 0.25)*100
  suitability = !(L3.offerChannel=="rm" && a2.readiness<0.40)   // advisory needs evidence/readiness
  regret=clamp(0.02 + 0.05*(L3.intensity-1)*(1-a2.readiness), 0, 0.14)*100   // cap 8%
  return {eligN,attachRate,attachPP:attachRate*100,adopters,deepeningNII,primacy,suitability,regret}
```

### 7.5 Arena 4 — combined (sequential 8-week run)

```js
a4calc(L,L2,L3):
  a1=a1calc(L); a2=a2calc(L2,a1); a3=a3calc(L3,a1,a2)
  netNII = a1.retentionNII + a3.deepeningNII - a2.spend + |a1.ccCost|
  mroi   = a3.deepeningNII / a2.spend
  pass   = a1.ciFraudUp<=0 && a1.di>=0.80 && a3.suitability && a3.regret<=8
```

Phased timeline (the J-curve): A1 weeks 1–4, A2 weeks 3–6, A3 weeks 5–8.
```
ph(start,end,t) = t<=start?0 : t>=end?1 : shapeRamp(t-start)
net(t) = retentionNII*ph(0,4,t) + ccSave*ph(0,4,t) − spend*ph(2,6,t) + deepeningNII*ph(4,8,t)
```
Net builds (retention) → dips/flattens as marketing spend lands (wk 3–6) → accelerates past breakeven as deepening pays back (wk 5–8). **That dip-then-climb is the payback inflection and must be visible on the hero chart.**

### 7.6 Optimizer ("Solve") — coordinate ascent on the value frontier

```
maximize netNII over policy levers
subject to  ciFraudUp ≤ 0  AND  DI ≥ 0.80  AND  suitability  AND  regret ≤ 8
rule: if (fraud breaches) or (DI<0.80): raise trustMin first;
      else if limitFlex<45: raise limitFlex; else raise coverage.
```
Animate ~12 steps; it should visibly raise the trust gate until both risk and fairness clear, *then* push value. Lands near DI ≈ 0.90, fraud CI-upper ≈ 0.

---

## 8. Pipeline stages (1–7)

Seven stages in a left **run-DAG** rail. Each stage `{id,n,name,sub,hil,run,autoMsg,action,hint}`. `renderStage(i)` dispatches to `render<Stage>()`; post-render wiring hooks run (`wireSim`, `wireGate`, `drawRct`). Human-in-the-loop (HIL) stages halt the autopilot until the user acts.

```
01 Sense          hil:false  Signal & theme
02 Hypothesize    hil:true   Reasons · interventions      action: confirm champion
03 Model Stack    hil:false  Twins & behavioral models
04 Simulate       hil:true   three arenas + combined      action: accept → gate
05 Decide & Govern hil:true  gate matrix + approval flow   action: approve → field test
06 Field Test     hil:true   controlled RCT                action: accept winner → deploy
07 Deploy & Learn hil:false  activate · write-back · flywheel
```

### Stage 1 — Sense
Intro (operational, no theory): the signal cluster routed from the cockpit; trusted recurring obligations tripping a static $1,200 ceiling. A **detection panel** (kv grid) — recurring-obligation match 0.81, 22-mo history, $1,425 vs $1,200, 17.3% friction, 94% coverage, 0.6% FPR — making the point that *detection isn't the gap; a policy that acts on it is.* Then the six signal cards and the cluster-identity panel.

### Stage 2 — Hypothesize
Likelihood-weighted reasons (R1–R5, animated bars). Candidate interventions as cards (champion highlighted) with param chips and predicted-outcome chips. A trust & fairness pre-registration panel: the lift is gated on observable trust, never a protected attribute; the remediation must *narrow* the thin-file gap. HIL: confirm champion.

### Stage 3 — Model Stack
Two columns: customer twins (feature-vector bars) and the seven behavioral models (quality chips). Intro names the models as the response surfaces the simulator rides (elasticity, deepening, fraud separator) — in plain terms, no hypothesis IDs.

### Stage 4 — Simulate
See §7 and §9. Capability-context band (read-only). Four-arena accordion. HIL: accept → gate.

### Stage 5 — Decide & Govern
A live **governance-gate matrix** evaluated on current levers (six pre-registered conditions), an **approval workflow** (policy owner → model risk → fairness/compliance → consumer-banking lead). The matrix branches on the real simulated result:
```
Winner declared                fired week 3
Complaint exposure bounded      complaints ≤ cap        (from a1)
Fraud not worsened              ciFraudUp ≤ 0           (from a1)  ← can fail
NII positive at lower CI        ci_lower > 0
Fairness / disparate impact     DI ≥ 0.80 (4/5 rule)   (live)     ← can fail
Build integrity & drift         drift = stable
```

### Stage 6 — Field Test
Champion/challenger RCT, 95/5 holdout, sequential stopping rule. Weekly friction-rate bars (treatment vs control); stopping rule fires week 3 and holds. Resolution panel (MDE, power, arm sizes, lift ±CI, winner).

### Stage 7 — Deploy & Learn
Deploy card (v3→v4, staged rollout, $1,200→$1,440 effective ceiling on verified pattern, 1-click rollback on drift). The **deposit-deepening flywheel** chart (open vs closed, 7 quarters; see §6.6, rendered with no Greek). The daily loop (detect → simulate → govern → deploy → measure → recalibrate). A write-back panel. A closing "why this matters" callout.

---

## 9. Longitudinal chart engine + animation (the product's hero)

### 9.1 `lineChart(opt)` contract

```js
opt = {
  W,            // total weeks (4 or 8)
  cur,          // current fractional week being drawn (0..W)
  f,            // f(t): continuous value function over [0,W]  ← REQUIRED, drives shape
  col,          // stroke color
  ciFrac,       // optional: CI half-width = |v|*ciFrac/sqrt(t)  → band TIGHTENS over weeks
  base0,        // include 0 in y-domain (default true)
  infl,         // optional: {at: weekNumber, label: "knee"} inflection marker
  h             // height (default 120; hero 160)
}
```

Rules:
- Sample `f` at **64 points** over `[0,W]`; plot only `t ≤ cur`. This makes the curve **smooth and shape-true** (S-curve, lag, saturation) — *never* 4 straight segments.
- Y-domain computed from the **full** series (stable axis while drawing), with ~12% padding; include the CI extent.
- Render in order: zero baseline (dashed, if domain crosses 0) → week gridlines → CI band polygon (forward hi + reverse lo) → curve polyline → inflection marker (dashed vertical + ring + label) → leading point (filled) + pulsing ring while `cur < W`.
- Below the SVG: a week-axis row (`wk1…wkW`).
- `preserveAspectRatio="none"`, fixed `viewBox` 260×h, width 100%.

### 9.2 Shape functions (the non-linearity)

```js
shapeRamp(w)    = 1 - exp(-w/1.6)                 // saturating: knee then plateau
shapeAdstock(w) = (1 - 0.55^w)/(1 - 0.55^4)       // S-curve carryover build
shapeLag(w,lag) = w<=lag ? 0 : 1 - exp(-(w-lag)/1.4)  // flat, then breaks upward
ciHalf(base,w)  = base / sqrt(w)                   // CI tightens ~1/√week
```

### 9.3 Per-KPI shapes (must be distinguishable on screen)

```
Arena 1: straight-through  ramp + "knee" inflection
         failures removed  cumulative concave, CI band
         retention NII     ramp, CI band, "converges" marker
         fraud Δ           FLAT line, CI band visibly NARROWS L→R, "CI↓" marker
Arena 2: awareness         adstock S-curve, "inflection" marker
         CSAT/NPS          lagged onset (flat wk1 → climbs), "onset" marker
         spend             linear
Arena 3: attach            lagged onset wk2, "onset wk2" marker
         primacy           slow lag wk3, "wk3 onset" marker
         deepening NII     lagged, CI band
Arena 4: NET NII (hero)    J-curve, "deepening pays back" marker at wk5
```
Binary guardrails (fair-lending, suitability) render as `gCard`, **not** charts.

### 9.4 Animation driver `animateArena(id, weeks, btn, paintWeek, onDone)`

The "take time to simulate" requirement:
1. `paintWeek(0)` (empty axes).
2. Set status bar to **"initializing Monte-Carlo · sampling priors…"**, ~**820 ms** delay (no curve yet).
3. `requestAnimationFrame` loop over duration (~**3.3 s** for 4-week, ~**5.2 s** for 8-week) with `easeInOut`. Each frame: `paintWeek(easedFraction*weeks)`; status reads **"simulating week X.X / N · 1,000 draws/wk"**; progress bar fills.
4. On finish: `paintWeek(weeks)`, status **"converged · N-week horizon · CIs tightened,"** re-enable button, fire `onDone`.

The KPI value shown is `f(cur)` — so the big number counts up as the curve draws. **No instant reveal anywhere.**

### 9.5 Status bar `simbar`

```
[dot] initializing Monte-Carlo · sampling priors…           [progress ----]
[dot] simulating week 2.3 / 4 · 1,000 draws/wk              [progress ====-]
[dot] converged · 4-week horizon · CIs tightened            [progress =====]
```
Dot: grey (idle) → amber pulsing (run) → green (done).

### 9.6 Layout — outputs as hero

Arena body = `grid-template-columns: 288px 1fr`. Left: compact input rail. Right: the `simbar` + a `charts` grid (`repeat(auto-fill, minmax(258px,1fr))`). Arena 4's hero chart spans full width (`grid-column:1/-1`, height 160). Inputs recede; charts dominate.

---

## 10. Accordion gating & context handoffs (Stage 4)

- Vertical accordion, 4 sections. Arenas 2–4 start with a `locked` class (dimmed, header inert).
- On `run_aN` completion: `markDone(aN)` → `unlock(aN+1)` (render its body, wire it) → auto-open it.
- **Inbound handoff chips** (top of each output column): A2 shows "from payment policy: E1 reachable, friction down X%"; A3 shows "from communications: readiness X%, N aware & satisfied."
- **Outbound handoff chips** (after a run): A1 → "eligible pool E1 + expHead% carried into Communications"; A2 → "conversion readiness = awareness × sentiment carried into Deepening"; A3 → "primacy & balances flow to the quarter-scale flywheel at Learn."
- Locked headers must not open on click. The combined run is available only after A3.

> Note the two distinct time-scales and **do not conflate them**: within-arena dynamics are **4 weeks**; the deposit-deepening flywheel at Learn is **multi-quarter**. Different horizons, different charts.

---

## 11. Autopilot / HIL state machine

- A top **autobar**: stage dots, mode (autopilot on/off), current phase message, controls (Run/Resume, Step, Reset).
- `STATUS[]` per stage: `queued → running → (await if hil) → done`. Autopilot advances automatically through non-HIL stages and **halts** at HIL stages, surfacing the stage `action` button.
- The Simulate stage's arena values are **always computed** by the engine regardless of whether the user animated them, so the Gate and downstream always have real numbers (autopilot must reach Stage 7 with zero errors even if no arena was manually run).
- "Reset" returns to Stage 1, clears `ARENA` reveal flags and `STATUS`.

---

## 12. U.S. Bancorp context anchors (verified, public)

Use the client's own public figures; **no external analyst citations** on screen. Anchors (Q1 2026 disclosures): avg deposits ~**$515B** (record consumer), **NIM 2.77%**, EPS $1.18 (+15%), revenue $7.3B (+4.7%), efficiency ratio 58.2%, ROTCE 17%, CET1 10.8%. Three consumer priorities: **organic growth, payments transformation, operational efficiency** — gig money-movement ladders to all three. Cohort NII is computed against the 2.77% NIM. Keep the header `run_gig_0427`, `prod-shadow`, `us-consumer`.

---

## 13. Build sequence (milestones)

1. **Shell & tokens** — `gig_pipeline.html` skeleton: header strip, theme ribbon, KPI strip, run-DAG rail, canvas, autobar. Design tokens + base components (`panel`, `slider`, `segRow`, `kv`).
2. **Engine** — port §6 (chain, fairness, loop) and §7 (a1/a2/a3/a4, CHAN2/CREATIVE/PROD, shape fns). Unit-test in isolation against the numbers in §14. No UI yet.
3. **Stages 1–3** — Sense (detection panel + signals + identity), Hypothesize (reasons + interventions + fairness pre-reg), Model Stack (twins + models).
4. **Chart engine** — `lineChart`, `kpiCard`, `gCard`, `simbar`, `animateArena` (§9). Verify a single KPI draws with delay, shape, CI, inflection.
5. **Stage 4 accordion** — arena shells + gating + handoffs (§10); Arena 1 wired end-to-end with animation; then A2 (channel-mix MMM), A3, A4 (combined J-curve), optimizer.
6. **Stage 5 Gate** — live matrix from the engine (fraud + DI can fail), approval flow.
7. **Stage 6 Field Test** — RCT bars + stopping rule + resolution.
8. **Stage 7 Learn** — deploy card, flywheel chart (no Greek), daily loop, write-back.
9. **Autopilot** — state machine, HIL halts, Step/Reset.
10. **Cockpit + theme + ceo** — `index.html` treemap/digest, `theme.html?id=gig`, `ceo.html`; wire routing.
11. **Polish & QA** — run §14; fix; package.

---

## 14. Acceptance criteria (definition of done)

### 14.1 Engine numbers (base state: cohort=verified, trustMin=18, limitFlex=20, channels=zelle+ach, cadence=3, coverage=60, A2/A3 defaults)

```
chain:  PRD≈0.92 surfaced=true · DI≈0.94
a1:     E1≈1345 · stRate≈89.2% · failRemoved≈1046 · retentionNII≈$676K
        ciFraudUp≈−0.14 (≤0 pass) · expHead≈0.37
a2:     awareness≈71% · awareN≈?(E1*0.71) · sentiment≈0.70 · readiness≈0.50 · spend small
a3:     eligN≈323 · attach≈17.8pp · deepeningNII≈$30K · suitability=true · regret<8
a4:     netNII≈$0.85M · mroi≈13.6x · pass=true
```

### 14.2 Behavioral assertions

- **Sensing gate:** set `sens=0.40` ⇒ `chain.PRD` drops to ~0.57 and (for thin cohort) `surfaced=false`. Sensing/decisioning are **never** sliders.
- **Fairness frontier:** `limitFlex=60, trustMin=6` ⇒ `DI≈0.47` and the Gate fairness row **fails**.
- **Optimizer:** from base, "Solve" lands `DI≈0.90` and `ciFraudUp≈0` (raises trust gate before pushing value).
- **Combined J-curve:** Net-NII curve rises, flattens/dips during wk 3–6 (spend), accelerates wk 5–8; inflection marker present at wk5.
- **Loop:** closed-loop steady-state NII > open-loop by ~4%; rendered as +7.9%/qtr, 0.68→0.81.

### 14.3 UI / interaction (Playwright)

- Stage 4 renders **4 arenas**; arenas 2–4 start `locked`; clicking a locked header does **not** open it.
- Run Arena 1: status shows "initializing…" within the first ~500 ms, then "simulating week X.X / 4", then "converged"; ≥5 `kpiCard`s; ≥1 CI band polygon; inflection markers present. On completion A2 unlocks + auto-opens; A1 outbound handoff chip present.
- Channel-mix: 5 allocation sliders; live stacked bar; campaign-concept select.
- Combined run: hero chart with the "pays back" inflection; value bridge fills cumulatively; guardrail cards reflect pass/fail.
- **Autopilot** reaches Stage 7 with HIL halts honored and **zero console errors**.
- No academic terms in any rendered DOM text (grep `innerText` for `REG→`, `construct chain`, `H1b`, `H2b`, `γ`, `Perpetual Adaptation`, `management-science`, `three time-scale` ⇒ none).

### 14.4 QA harness

Playwright (Chromium, headless) on the `file://` URL. Walk stages via `enterStage(i)`. Capture `pageerror` + console `error` — must be empty. Screenshot Stage 4 mid-animation and the combined J-curve for visual review.

---

## 15. Conventions & non-negotiables

- **De-academicized surface.** The engine is code-only. Rendered text uses bank/regulatory language: "disparate-impact ratio," "4/5 rule," "fraud Δ bps," "straight-through rate," "attach," "primacy," "marketing mROI." **Never** render construct names, Greek letters, hypothesis IDs, "construct chain," "theoretical model," "three time-scales."
- **Capabilities are stocks, not levers.** Sensing/decisioning are read-only context that "mature over quarters via the data & engineering roadmap." Tunable capability sliders are a bug.
- **No vendor names** on any client-facing surface — functional classifications only ("recurring-obligation detector," not a product name).
- **Synthetic, non-additive.** Illustrative figures; never sum themed $ across overlapping cohorts.
- **Guardrails are load-bearing.** Fraud (`ciFraudUp ≤ 0`), fairness (`DI ≥ 0.80`), suitability (RM + low-readiness fails), regret (`≤ 8%`). The Gate must genuinely branch on these — a breached policy is held, not waved through. The "where *not* to act" story (a drift-unstable theme with an empty admissible region) is a feature, not a gap.
- **Outputs are the product.** If a simulation result renders instantly, or as a flat trend line, or without an inflection/CI where one is specified, it is not done.
- **Runtime constraints (§2) are hard:** file://, no modules, no external script files, no storage APIs, no framework.

---

*End of specification. Build order §13; truth for ambiguity is the acceptance numbers in §14.*
