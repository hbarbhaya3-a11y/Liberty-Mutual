# TwinX — Decision Intelligence for Consumer Banking

### A whitepaper on deciding the right action at the moment each customer signal fires

---

## What this is

Retail banking is being decided **in motion**. The primary relationship —
checking, the paycheck, bill pay — is no longer won once and held for a decade. It
is won and lost at life events and rate moments: a move, a new job, a bonus, a
competitor advertising 4% while the customer's cash earns almost nothing. Roughly
72% of additional and replacement accounts now open at a *different* provider, and
more than half of those become the customer's new primary bank. The money moves
first; primacy follows the paycheck.

Banks have spent a decade getting good at **prediction** — propensity scores,
attrition models, next-best-offer engines. A score tells you *who* is likely to
act. But a score is a lookup, not a decision. It doesn't tell you **what to do**,
**how much to spend**, **through which channel**, **at what moment**, or **what the
competitor will do back** — and it doesn't tell you the one thing a
margin-conscious, compliance-governed bank most needs to know: **where *not* to
act.** Blanket responses to a good score — reprice the whole book, offer everyone a
CD, chase every growing relationship — destroy the very margin that made the
balance worth defending.

**Decision intelligence** is the discipline that closes this gap. It moves the
question from *"who is likely to act?"* to *"the paycheck just landed at a
competitor — what treatment moves it back, what will it cost, and what will the
competitor do in response?"* It treats every recommendation as a **decision to be
simulated before it ships**, not a score to be acted on after the fact.

This paper describes **TwinX**, a decision-intelligence layer for consumer banking
built on that principle, and grounds it in a concrete engagement: *The Consumer
Decision Roadmap* — 11 prioritized decision plays representing ~$105M in addressable
annual value across a large bank's consumer book, of which two are worked here in
full detail (Idle-Cash Liquidity Activation and Wealth Attach).

---

## The approach — decisions simulated on digital twins

TwinX's core move is to **build a simulatable model of each decision subject — a
digital twin — and test the decision on the twin before committing a dollar in the
real world.** A twin is not a dashboard or a segment; it is a behavioural model you
can run forward under different treatments and see what happens, including how a
competitor responds.

**Three kinds of twin** cover the consumer franchise:

| Twin | Subject | Powers |
|---|---|---|
| **Prospect twin** | A household that does not yet bank here — built from permissioned external data | **Acquisition** — who to pursue, with what, to win the primary relationship |
| **Customer twin** | An existing customer/household — built from internal behaviour + external context | **Deepening & retention** — the next-best action for the relationship |
| **Product twin** | A product or price — a rate, a card tier, a loan — tested across the whole book before it is changed | **Pricing, inside both** — solves the offer that holds the balance without over-paying |

Every decision runs through a four-step loop:

```
SENSE  →  DECIDE  →  ACT  →  LEARN
```

- **Sense** — internal and permissioned external data answer *who* and *when*. The
  score is the *input* here, not the product.
- **Decide** — the twin tests each candidate treatment, budget and channel, and the
  competitor's reaction, before anything moves. This is the engine.
- **Act** — the chosen action is dispatched to the right channel and offer, at the
  moment the trigger fires.
- **Learn** — outcomes feed back; decision quality is recalibrated; the gap between
  what was committed and what actually worked closes over time.

### Inside the decision — hypothesis, what-if, if-what

The DECIDE step is itself four moves, and this is what makes a TwinX recommendation
an *argument* rather than a lookup:

```
Hypothesis generation → What-if simulation → If-what optimization → Recommendation + 3/6/12-mo trajectory
```

- **Hypothesis generation** — propose the candidate interventions worth testing:
  offers, rates, channels, timings.
- **What-if simulation** — *you build the offer.* Forward-simulate a specific policy,
  with competitor response: **"If we do X, what happens?"** You set each lever to an
  exact value and read the outcome.
- **If-what optimization** — *you state the goal; the optimizer builds the offer.*
  Invert the problem: **"To hit outcome Y, what is the optimal X?"** You give it the
  objective, the allowed moves, and the ranges (with hard ceilings); it searches the
  combinations and returns the best policy plus alternatives showing the trade-off
  between value captured and margin spent. Crucially, expensive moves like "match the
  competitor" can be left on the table — the optimizer is allowed to *decline* them.
- **Recommendation + trajectory** — the action to take now, with its outcome
  simulated over 3, 6 and 12 months, and an explicit statement of who was
  deliberately left alone.

### Governance is part of the decision, not a review after it

Because a recommendation is simulated, the constraints that make it *defensible* can
be enforced *inside* the simulation rather than bolted on afterward. Every TwinX
decision carries:

- A **binding constraint** owned by Compliance / Legal / Model Risk (suitability,
  Reg BI best-interest, fair-lending) that caps what the optimizer is allowed to do.
- A **suitability / fairness margin** checked against a hard floor — a policy that
  fails the floor is not shipped.
- An **explicit no-offer group** on every run: the customers modeled to stay anyway,
  the households not yet ready, the false positives. Naming where *not* to act is
  what makes the moves TwinX *does* recommend credible — and it protects margin,
  because pricing only the genuine flight risk means the rate give-up *is* the
  profit, not a rate-sheet drain across the whole book.

---

## The catalogue — a portfolio of decision plays

TwinX is delivered as a **catalogue of decision plays**, not a single feature. Each
play is a behavioural trigger → a decision → a simulated, governed action, and each
runs on one or more twins. The catalogue is deliberately structured so that plays
share the same flow, the same configuration shape, and the same governance spine —
which means **activating a new play is a fill-in-the-template exercise, not a
rebuild.** The bank turns on more of the catalogue over time as data access and
appetite grow.

The reference engagement consolidated **31 behavioural signals into 11 decision
plays**, spanning the three things a bank does with a relationship — **acquire,
deepen, defend** — for ~$105M in addressable annual value:

| Pillar | Plays | Pool | Twins |
|---|---|---|---|
| **Acquisition** | A1 Life-event new-household ($12.2M) · A2 Primary-attach at money moment ($12.4M) | ~$25M | Prospect |
| **Deepening** | **D1 Liquidity activation ($17.6M)** · D2 Card growth & upgrade ($6.1M) · D3 Next-best lending + rider ($9.3M) · **D4 Wealth attach ($5.9M)** · D5 Mono-line → primary ($6.3M) | ~$45M | Customer + product |
| **Retention** | R1 Deposit & rate-shopping defense ($13.4M) · R2 Distress & disengagement save ($9.3M) · R3 Affluent attrition defense ($3.6M) · R4 Card-attrition save ($3.0M) | ~$29M | Customer |

The plays are **sequenced into waves**, each gated on a validated,
control-group-measured result before the next is funded — value compounding from a
quarter out:

- **Wave 1 — the no-regrets core (~$47M).** D1, R1, D5, R2. Runs on **internal data
  alone**, on customer twins — the fastest path to a first validated win, and the
  "wedge" that earns the right to the rest.
- **Wave 2 — fast-follow & deepen (+~$28M).** D3, D4, D2, plus R3/R4 built as
  *branches* of existing twins ("branches, not builds"). Adds lending and wealth
  depth.
- **Wave 3 — acquisition (+~$25M).** A1, A2 on prospect twins, once external data is
  permissioned.

Of the eleven, **two are worked here to full depth** — one from the deepening core
and one from the wealth wave: **D1 Liquidity Activation** and **D4 Wealth Attach**.
The rest of the catalogue is real and sized, and activatable along the same
template. The two below show what "fully activated" looks like.

---

## Fleshed play #1 — Idle-Cash Liquidity Activation (D1)

*Deepening · customer + product twin · Wave 1, internal-data-only — the largest
internal-only pool in the catalogue.*

### The situation
A decade of near-zero rates made parked cash normal: cheap funding for the bank, no
reason for the customer to move it. Rates then jumped. Now a CD or high-yield account
pays 4–5% while parked cash still earns ~0.05% — and customers are noticing, searching
"CD rates" in-app and moving balances to online banks with instant transfers. The
bank faces two risks at once: its cheapest funding is visibly underpriced *and*
beginning to leave.

### The decision
Not all idle money is spare — some is next month's rent. So the play is narrow:
**route only the genuinely surplus cash into the best-fit yield product — high-yield
savings, money-market, or a short CD — at the minimum rate that holds it, and leave
everyday operating cash untouched.** The customer twin identifies *whose* balance is
truly surplus; the product twin solves *which rate* holds it without over-paying.

### The economics (simulated funnel)
```
388,000 flagged (idle ≥ $5K, dormant 60d+)   →  $9.3B idle cash in scope
  → ~75,000 show strong activation signals    →  treat 67,500 (90/10 RCT holdout)
  → best-fit product policy, +30 bps blended  →  5.4% funded conversion
  → 3,645 funded relationships · $265M funded balances
  → +$4.3M incremental relationship value · idle leakage 12% → 6.4% (−5.6pp)
```
Two numbers, two meanings: **$17.6M** is the play's *addressable annual pool*;
**+$4.3M** is the *simulated result on the tested cohort* at the recommended policy.

### Who the model sees
- **Idle Retiree** — $42K in savings at 0.05%, two in-app searches for "7-month CD
  rates". Suitability 0.79 → **target**.
- **Bonus Holder** — $9.4K bonus idle 60 days, aggregator login fired. Suitability
  0.71 → **target** (elastic; leaves within weeks if not captured).
- **Operating Buffer** — $26K that *looks* dormant but funds quarterly taxes and two
  standing ACH instructions. Suitability 0.31, below the 0.55 gate → **false positive,
  left alone.** Locking this into a term product would be a liquidity-risk and
  suitability failure. This is where the play *refuses* to act.

### What a banker can decide and test
- **Pick the bet:** route per-segment to best-fit (recommended); or convert liquid
  balances to HYS/MMA keeping full liquidity; or move only stable surplus into a CD or
  ladder.
- **What-if levers:** exact product mix and basis points, minimum idle balance ($5K),
  channel by value tier (app / email / banker), dormancy window (60d), holdout (20%).
- **If-what levers:** goal = *maximize net interest income*; allowed offers = short CD,
  HYS, MMA, CD ladder; ranges = uplift up to +40–45 bps; operating cash **excluded** as
  a hard rule. The optimizer finds, e.g., that +20 bps holds the balance where +35
  over-pays and +10 loses it — and the product twin prices that across the book.

### What comes back
A recommended policy reporting incremental relationship value, funded conversion vs.
the ~1.9% organic baseline, balances activated into yield, leakage reduction, a
**suitability margin of 0.94** (above the 0.85 floor), and the explicit no-offer group
— the operating-buffer accounts the model will not touch.

---

## Fleshed play #2 — Wealth Attach (D4)

*Deepening · customer twin · Wave 2 — deepens the mass-affluent franchise, the
segment where incumbents still lead the neobanks.*

### The situation
Mass-affluent households bank here every day — checking, mortgage, card — but hold
their investable assets *somewhere else*. In the reference book, 18,400 such
households hold ~$1.1B of investable assets outside the bank, and some of that money
has already begun to move to external wealth platforms. The everyday trust exists;
the wealth relationship was simply never started.

### The decision — and its one hard rule
**Advice-readiness is detectable**, and the right wealth motion for each household
converts that everyday trust into a real relationship. The governing rule, from the
brief: the optimization objective is **new wealth-relationship conversion** — AUM and
fee revenue are *downstream* value, never the headline goal. And the specific motion
— portfolio review, senior-advisor conversation, banker handoff, or a guided digital
journey — is **never prescribed up front.** It is one allowed move the optimizer
picks per household; its name appears only in the *output*. A wealth recommendation is
a recommendation: Reg BI best-interest and suitability apply, so the unready and the
unsuitable must be left out or the conversion is a fair-treatment failure.

### The economics (simulated funnel)
```
18,400 flagged (mass-affluent, no wealth relationship)  →  $1.1B investable held outside
  → advice-readiness gate (≥ 0.55)   →  6,200 advice-ready
  → reachable / consent-eligible     →  5,400
  → best-fit, suitability-matched motion  →  4.3% conversion (vs ~1.8% baseline)
  → 267 new wealth relationships · +$64M AUM ($240K avg)
  → 62% funded · 710 appointments · +$320K annual fee revenue (downstream)
  → 76% advisor-capacity utilisation · $410 cost per converted relationship
```
Horizon convention: an 8-week test window, projected to 12 months.

### Who the model sees
- **Advice-Ready Deepener** — 14-year customer, mortgage + card, ~$180K to invest, no
  wealth product, opened three retirement articles in-app. Suitability 0.82 →
  **target** — a genuine advice-need the bank simply never acted on.
- **High-AUM Mover** — $250K+ investable, first-ever $38K brokerage transfer fired
  yesterday. Suitability 0.78 → **target**, time-boxed: this relationship is decided in
  weeks, not months.
- **Aspirational Saver** — $220K that *looks* affluent but is an inheritance earmarked
  for a home purchase closing in 90 days. Suitability 0.34, below the gate → **false
  positive, left alone.** Recommending a managed portfolio here would be a Reg BI and
  fair-treatment failure.

### What a banker can decide and test
- **Pick the bet:** convert the advice-ready with the optimizer routing each household
  to its best-fit motion (recommended); or catch the ~1,900 active movers with a
  priority advisor conversation before their transfer completes; or nurture the ~2,600
  digitally-engaged planners with a low-cost guided journey and escalate only those who
  lean in.
- **If-what levers:** goal = *maximize new wealth-relationship conversion*; allowed
  moves = portfolio review / senior-advisor / banker handoff / education / digital
  starter; constraints = suitability gate ≥ 0.55, a scarce senior-advisor slot cap
  (~600), and an advisor-capacity ceiling. The optimizer assigns a *different motion*
  per household and reports where the scarce advisor time went.

### What comes back
A recommended policy reporting conversion vs. the ~1.8% baseline, new wealth
relationships, incremental AUM attached, funded-account rate, downstream annual
advisory fee revenue, external-flight reduction (−4.5pp), a **suitability /
fair-treatment margin of 0.94**, and the explicit no-offer group — the unready and the
unsuitable.

---

## Why it holds together

The two worked plays are the same object re-domained — same configuration shape, same
governance spine, different economics. Each is defined by five parts: a **config**
(the play, its value lever, its binding constraint); **three personas** including a
deliberate **false positive** below the suitability gate; a **calibrated funnel** from
flagged cohort through gate, holdout, and conversion to value; **pre-simulation ranges**
that tighten to point estimates on run; and **three hypotheses** — a recommended,
optimizer-routed bet plus two narrower ones. Any other play in the catalogue is
activated by filling that same shape.

The through-line is the same every time: sense the trigger in the bank's own data,
decide the action by simulating it on a twin before a dollar moves, price only the
genuine risk or opportunity, and say plainly where *not* to act. That last discipline
— the restraint — is what turns a model's output into a decision a bank can actually
ship.
