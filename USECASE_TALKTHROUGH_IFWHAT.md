# Use‑Case Talk‑Throughs — If‑What perspective (+ why the problem exists)

For each use case: **why this is happening** (the root cause) → the hypothesis →
configuration in **If‑What** (set the goal + the allowed moves + the ranges; the
optimizer finds the policy) → the result. Clear, professional, number‑backed.

**If‑What in one line:** you don't build the offer. You state the *goal* and the
*rules* (which moves are allowed, how far each can go), and the optimizer searches
the combinations and returns the best policy — with a few alternatives showing the
trade‑offs.

---

## 1 · Deposit drift — "Targeted Deposit Defense"  *(consumer)*

**Why this is happening.** For over a decade rates were near zero, so a savings
account paying almost nothing was normal — there was nowhere better to go. Now
rates have risen, competitors (especially online banks) offer materially higher
rates, and switching is nearly frictionless. Mass‑affluent savers — the largest
balances, the most attentive — notice first. The early signals (balances sliding,
transfers moving out, activity thinning) are them *testing the door*: moving some
money to a competitor before moving it all. Deposits are the bank's cheapest
funding, so losing them is costly — but repricing every account to defend them
would destroy the margin that makes deposits profitable in the first place.

**Hypothesis.** Only a subset of these ~**75,000** savers (**$2.1B**) is genuinely
rate‑driven — roughly **30,000**. Retain them with a small, targeted rate rather
than repricing the book. Estimate: **$15–25M** retained.

**Configuration (If‑What).** Goal: **maximize net interest income retained**.
Allowed moves: a money‑market / CD offer and a relationship rate — I leave "match
the competitor" off the table. Ranges: rate uplift up to **+50 bps**, minimum
balance **$25K**. The optimizer searches and returns the best policy plus a couple
of alternatives trading dollars‑retained against margin‑spent.

**Results.** The recommended policy retains **$19.3M** a year, cuts outflow from
**7.5% to 5.2%**, holds fairness at **0.93** — and pays nothing to the accounts
modeled to stay anyway.

---

## 2 · Idle cash — "Idle‑to‑Yield CD"

**Why this is happening.** (Worth slowing down on.) For years, with rates near
zero, cash parked in checking or savings earned almost nothing — and that was
fine, because nothing else paid more either. People left money sitting and never
thought about it; the bank, in turn, got that money almost for free and earned a
spread using it. Then rates jumped. Now a CD or high‑yield account pays **4–5%**,
while that parked cash still earns about **0.05%**. Customers are starting to
notice — searching "CD rates" in the app and moving money to online banks that
advertise high yields with instant transfers. So the bank faces two risks at once:
the cheap funding it relied on is now visibly underpriced *and* beginning to leave.
The catch: not all idle money is truly spare — some is what a customer needs for
rent or bills next month — and offering a high rate to everyone would erase the
spread that made the deposit valuable. So the play is narrow: move only the
genuinely surplus cash, at the smallest rate that keeps it.

**Hypothesis.** Of **388,000** customers with idle cash, ~**75,000** show strong
activation signals and ~**20,000** are yield‑responsive, genuinely surplus. Route
that surplus into the best‑fit product at a small uplift. Estimate: **$3.5–5.2M**
in incremental relationship value.

**Configuration (If‑What).** Goal: **maximize net interest income**. Allowed
offers: the 7‑month CD, high‑yield savings, money‑market. Ranges: rate uplift up to
**+40 bps**, minimum idle balance **$5K**, everyday operating cash excluded. The
optimizer finds the combination that earns the most while staying inside the
suitability rules.

**Results.** **+$4.3M** in incremental relationship value at **5.4%** funded
conversion (vs **1.9%** organic), idle outflow cut from **12% to 6.4%** (**−5.6pp**),
~**$265M** activated into yield — operating cash left untouched (suitability
**0.94**). The bank keeps a positive spread even after paying the higher rate.

---

## 3 · SMB growth — "Re‑bundle the off‑us flows"  *(small business)*

**Why this is happening.** A small business usually opens a checking account with
one bank, but its more valuable needs — a loan, a credit card, card‑processing —
come later, when it grows. At that growth moment (a new location, new equipment,
rising payroll), fintechs and rival banks move fast with pre‑approved, frictionless
offers. Because the original bank often doesn't spot the growth signal in time, the
business takes its financing and payments elsewhere — even though its checking
account stays put. The relationship quietly hollows out: the bank keeps the
low‑value account, the competitor captures the high‑value lending and payments.
Here, **61%** of these growing businesses are already doing exactly that.

**Hypothesis.** Among **38,400** growing businesses, win back the credit and
payments by leading with the one product each needs now, then attaching its
everyday banking. Estimate: conversion to **16–22%**, **+$26–37M** first‑year revenue.

**Configuration (If‑What).** Goal: **maximize cross‑sell conversion**. Allowed
offers: card win‑back, pre‑approved credit line, equipment finance, card‑processing
win‑back, the everyday‑banking bundle. Ranges: pre‑approved limit up to **$120K**,
intro pricing up to **+100 bps**. The optimizer assigns the best offer to each type
of business and returns the policy that converts the most within the credit‑risk
and price‑floor limits.

**Results.** Conversion rises from **8.4% to 19.1%** — **+$31M** first‑year revenue,
**+0.4 products** per relationship. Each segment gets its own offer: multi‑site
businesses take a credit line at **26%** (vs **9%**); off‑us financers take the card
win‑back at **22%** (vs **7%**). About **2,900** get no offer — their return doesn't
clear the cost to serve.

---

## 4 · SMB deposit defense — "Minimum‑effective‑rate"  *(small business)*

**Why this is happening.** This is the business version of the deposit‑drift
problem. Businesses hold large operating balances, and as rates rose, competitors
began courting those balances with higher rates — the same way they court consumer
savings. Owners and treasurers are rate‑aware and will move cash for a better yield
even when the business itself is perfectly healthy. So the bank sees big, cheap
operating deposits — its most valuable funding — pulled away on rate alone.
Matching every competitor offer would be enormously expensive and unnecessary,
because many operating balances are sticky (tied to payroll and vendor payments)
and won't actually move.

**Hypothesis.** Of **41,200** accounts (**$3.4B**, ~**$54M** income exposed), retain
each with the smallest rate that holds it, not a blanket match. Estimate:
**$34–46M** retained at **+32 to +44 bps** versus **+95** to match.

**Configuration (If‑What).** Goal: **maximize NII retained**. Allowed moves:
smallest‑effective rate, a relationship rate (better rate if they keep payroll with
us), fixed tiers — "fully match the competitor" stays available but the optimizer
can decline it. Ranges: uplift up to **+60 bps**, a hard ceiling of **3.75%**. It
finds the smallest blended rate that holds the most balance.

**Results.** Retains **$2.6B** of **$3.4B** and **$41M** of the **$54M** at risk, at a
blended **+38 bps** — versus **+95** to fully match, saving ~**$13M** a year. It
prices by segment (**+55 / +35 / +25 bps**), pays nothing to the ~**7,400** modeled
to stay, and declines accounts that fall below the margin floor.

---

### The thread through all four
Same root tension every time: rising rates and frictionless competitors are pulling
cheap, valuable balances (or whole relationships) away — and the bank can't afford
to defend everything. You give the system the goal and the rules; it finds the
policy that captures the most for the least, and tells you where **not** to act.
That restraint is what makes the recommended moves credible.
