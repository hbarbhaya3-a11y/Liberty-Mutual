# Signal Talk-Track Scripts — Retail Signal 1 · Commercial Signal 2

Banker-grade narration for two live cockpit signals. State the signal, open the
guided flow, set a sensible policy, read the result. Every number is what the
screen shows.

- **Retail Signal 1** → *Auto Retention* — "Defend at-risk auto renewals" (`retention`)
- **Commercial Signal 2** → *Small Commercial · New-Business Lead* (`smbrate`)

---

## Retail Signal 1 · Auto Retention — "Defend at-risk auto renewals"

*Personal Lines · Retention Ops / Pricing · ~3 min · Decision Loop: Signal → Analyze → Simulate*

**The signal.** From the Cockpit, this is our largest retention block — high-LTV
auto renewal shopping risk, about **$2.1B** of NWP under observation across
roughly **75,000** policies. Three signals are converging on our *best*
customers: digital engagement is cooling, competitor quote-shopping is firing,
and coverage-reduction requests are rising. Together they show up **30–45 days
before** the renewal decision. The industry backdrop is a record **57% auto
shopping** rate and sustained Progressive/GEICO rate pressure.

The trap is the obvious move — a broad-brush rate action hits everyone
uniformly, and our low-loss, mature, high-LTV customers are exactly the ones who
shop first. So the signal isn't "cut rate." It's "find the genuinely elastic and
defend only them."

**The strategy.** I open the signal. The recommended play is **Strategy A —
Defend at-risk renewals**: a **30K** eligible cohort, claims-free, actively
shopping their renewal, scoped *after* a fair-lending filter. These are the
price-elastic — not the sticky bundled majority who'd renew anyway. Two adjacent
scenarios sit alongside it: **Strategy B**, re-engage **22K** silent
pre-shoppers ~60 days out with no rate concession; and **Strategy C**, a
Comparion **agent save call** on the **3K** households with LTV over **$12K**.

**The configuration.** I run Strategy A through the loop. I hold the cohort to
the price-elastic 30K rather than the full book. The lever is the *smallest*
targeted incentive that holds the renewal — a capped rate plus a retention
offer, not a giveaway. The hard constraint is the **fairness gate at ≥0.70**:
differential renewal offers need an auditable, consistent basis, or we take on
disparate-impact exposure under NAIC Model Bulletin 24-08. The elasticity model
*is* that evidence — it proves the targeted customers are genuinely elastic, not
loyal households being discounted for no reason.

**The result.** The simulation protects **+$19.3M** in NWP a year, cutting the
lapse rate by **2.3 points**, with **+$386K** of spread protected. The fairness
margin clears the floor, so the policy is defensible. And it suppresses offers to
the customers predicted to renew regardless — no margin is spent where it isn't
needed. Pre-sim range was **+$15–25M**; the run lands inside it.

---

## Commercial Signal 2 · Small Commercial — New-Business Lead

*Small Commercial · New-business · ~3 min · Guided wizard: Signal Details → Goals, Guardrails & Levers → Intelligence*

**The signal.** This is the second commercial signal, and it's a different shape
from the growth signal — it's **lead-level**. A specific new-business submission
has landed and the account is shopping. The default lead is **Harborview
Property Mgmt** — Florida commercial real estate / property management,
**$7.4M** revenue, **BOP + GL + Umbrella**, submitted by Lockton two days ago,
**~$168K** estimated premium, **quote due in 4 days**. The lead is shopping three
carriers, expanding to a second location, no adverse loss history — a clean,
winnable account. The competitor on the table is **biBERK at $154K**, and our
indicated is **6.0%**. Lead score **0.74**.

*(Two other leads are in the picker to show the range: Summit Precision
Machining — Ohio WC+GL, quote due in 1 day, against Next Insurance; and Del Mar
Coastal Eatery — California BOP + Liquor Liability, a thinner 0.48 lead score
with two prior slip-fall claims sitting near the appetite boundary.)*

**Step 1 · Signal Details.** The wizard opens on the lead itself — who it is, why
it surfaced, the competitor and their offer, and the size. The framing is a bet:
this is a specific account worth winning *now*, priced against the insurtechs and
held to loss ratio.

**Step 2 · Goals, Guardrails & Levers.** I set the goal to **win the account**,
then work the levers. Price is expressed as **% versus filed rate** — bind
probability runs from ~90% at −5% down to ~34% at +12%. Rather than buy the deal
on price, I lean on the boosts: a **new-account onboarding credit** and
**risk-control services** each lift bind probability without cutting rate. The
guardrail is **rate adequacy** — I keep the quote at or above **−3%** so we don't
win the account into a negative-margin book; below that the adequacy flag trips.
I can also bundle a second line — **Workers Comp (+$22K NWP)** or **Cyber
(+$9K)** — to grow the account beyond the lead line.

**Step 3 · Intelligence.** The result reads the bet back: at an adequate quote
with the onboarding credit and risk-control services attached, bind probability
lands in the winnable zone while margin stays above the floor, and NWP won
combines the priced lead line with the bundled cross-sell. The takeaway is the
operating tempo — each qualifying lead runs the same guided simulation, so
new-business pricing is a repeatable, guardrailed decision instead of a
gut call under a 4-day clock.

---

*Signal → configuration → result. The retention play defends the book we already
own; the lead play wins the account before the competitor quotes it. Same
decision surface, both held to a hard constraint — fair-lending on one, loss
ratio on the other.*
