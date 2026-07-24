# Decision Intelligence Demo Script

**Audience**: senior bankers · product, risk, decision sciences leaders
**Persona we're showing for**: Director / Senior PM, Money Movement (Consumer + Commercial)
**Runtime**: ~10–12 minutes
**Tone**: factual, banker-grade. Don't sell the product — show the work.

---

## Opening (30 sec) · The problem we're solving

> *Stay on the Cockpit. Don't click anything.*

A retail bank makes thousands of policy decisions a year — pricing, eligibility, channels, friction, follow-on offers. Most of them are made the same way they were ten years ago: someone notices something, a working group convenes, two months later a memo lands on a desk, three months after that a policy ships, and another quarter passes before anyone checks if it worked.

The cost of that cycle isn't the model risk — it's the **friction events that compound while no one's watching**. Customers stop using the rail. Deposits drift to the regional with the faster product. Fair-lending exposure quietly accumulates.

What you're about to see compresses that cycle. Not by replacing the humans in it, but by **changing where the work happens** — from spreadsheets and memos to a live decision surface that the bank's data, models, and guardrails all sit inside.

---

## Act 1 (2 min) · A signal becomes a hypothesis

> *Point at the Cockpit treemap. Hover the "Gig money movement" theme.*

This is the Cockpit. Every block is a theme — a coherent pattern the system has detected across customer behavior, transaction flow, contact-centre traffic, and the bank's own balance sheet. The size shows how much money's moving through; the colour shows whether it's growing, holding, or under pressure.

> *Click the gig theme.*

Inside any theme, you see specific signals. Here's one: **Friday rent-day Zelle payments are tripping a static $1,200 ceiling set in 2008**. At the time, $1,200 covered rent in 90% of U.S. metros. Today, it covers it in about 38%. Average rent in this cohort is $1,425. So every Friday after 4 PM, roughly 700 customers hit a step-up — and the median outcome is a complaint, a contact-centre call, and a missed payment.

This is not a credit problem. It's a calibration problem. And the bank doesn't currently *own* a process to detect that and re-calibrate.

> *Click into the recommended hypothesis card: "Trust-Aware Ceiling Lift."*

The card is hypothesis-first by design — what we'd actually *bet on*, not what we *observed*. The framing ("rent failing on Friday") is supporting context underneath. We want the conversation in the room to be about the bet.

**Why this matters**: the bank is not going to ship 50 hypotheses a quarter from a static cockpit. But 50 a quarter from a place where the signal, the data, the model, and the bet are all in the same view — that's a different operating tempo.

---

## Act 2 (2 min) · The hypothesis page is the receipt

> *On the Hypothesis Detail page, scroll slowly through the chapters.*

Most decision tools show you the answer. This one shows the **work that produced the answer** — because in a regulated environment, the work is the artifact.

**Chapter 1 — Data + models composed.** Nine data streams. Six models. All MRM-approved, all ECOA-compliant under the bank's current rule set. Before we get to "what's the bet," we tell the user: here's the substrate. Auditable from day one.

**Chapter 2 — Drivers.** Five weighted reasons, each with its own inline chart. The 18-month verified-payee pattern carries the most weight because it's the strongest predictor of payment reliability we've seen across this cohort. Each driver is a piece of evidence — not opinion.

**Chapter 3 — Cohort coverage.** Of 200,000 gig-segment customers, 64,000 meet the verified-history bar. That's the scope. Bigger than a pilot, smaller than a wholesale change. Visible up front.

**Chapter 4 — Fair-lending.** The disparity heatmap shows where lift × trust gate keeps us inside the 0.85 floor. This isn't a compliance check at the end — it's an inequality the optimizer has to respect from the start.

> *Scroll to the synthesis bridge.*

And then this — the synthesised hypothesis. Each row traces a chapter input directly into the formed bet. **The data composes → the drivers explain → the cohort scopes → the fairness gates → the hypothesis is what's left after all four hold.**

**Why this matters**: a banker who walks out of this room has to defend the decision to a CRO, an MRM reviewer, and a regulator. This page is the defense. The "Test this hypothesis" button isn't the start of the work — it's the start of the *test*.

---

## Act 3 (2.5 min) · Testing — the workbench

> *Click "Test this hypothesis." The modal opens.*

Three ways to test it. The default — and what we'll show first — is the **What-If workbench**. You set the policy, the system simulates the outcome.

> *Click "Open workbench."*

This is the operating cockpit a PM lives in. Three banded sections — Policy, Communications, Follow-on offer. Eleven tunable levers. The right side shows three live charts that respond to whatever you do.

> *Drag the "Ceiling lift" slider from +20% to +30%. Pause. Drag it back.*

When the lift moves, three things happen at once. The **eligibility funnel** updates — who's still in scope. The **conversion funnel** updates — who we actually reach and convert across our channel mix. And the **fair-lending safe zone** updates — whether the new policy still sits above the 0.85 disparity floor.

The point isn't that we have sliders. The point is **what would normally be three separate meetings — Product, Marketing, Compliance — is now one surface, in real time, before anyone runs anything**.

> *Click "Run Simulation."*

Eight-week horizon, all six KPIs, all guardrails respected, parallel sweep. Two seconds.

> *Results land.*

And here's the receipt. Top of page — the verdict. *Simulation supports hypothesis.* Underneath: the four proof KPIs with their predicted-vs-simulated chips. **+$11.9M NII against a $56M annual prediction. −29,300 failures removed per quarter against a target of −236,000 per year. Fair-lending margin lands at 0.94 — comfortably above the floor.**

Below that, the J-Curve. **Cumulative NII crosses zero at week 5 — the payback inflection.** That dip-then-climb shape is the marketing-spend payback. For a CFO, that's the moment of interest.

> *Click any of the three arena cards underneath — Payment policy, Communications, Deepening. The drill opens beneath.*

And this is where it stops being a dashboard and starts being a decision tool. When the headline says "17.8% attach on the warmed group," that's a Tuesday-morning number, not an answer. **A PM needs to know *which* customer segments are taking *which* product.**

> *Click the Deepening arena.*

There it is. Young high-earners attach into HY Savings at 24%. Volatile-income gig workers attach into earned-wage access at 21% — different need, same trust signal. Low-balance churn risks under-attach at 9% across the board — revisit segmentation before scaling.

Every arena card has the same depth. Friction events broken down by customer pattern. Channel performance broken down by share / cost-per-aware / NPS lift. **The detail isn't a feature — it's the difference between "the policy worked" and "the policy worked, and here's what to ship next."**

---

## Act 4 (2 min) · If-What — when you have a goal, not a policy

> *Click "Tune and re-run." Back to the test-mode modal.*

What-If presupposes you already know roughly what you want to do. Half the time at this scale, **the bank has a goal, not a policy** — *"reduce blocked rent payments by 50% without breaching fair-lending."* You don't know what configuration of levers gets you there. That's a search problem.

> *Click "Open optimizer."*

Same workbench shape, different inputs. You don't set a policy — you set a **goal** (primary objective + guardrails) and a **search space** (ranges per lever). The optimizer sweeps that volume — for these ranges, roughly 24,000 candidate policies in parallel.

> *Click "Run optimizer."*

What comes back isn't a single answer. It's a **Pareto frontier** — the set of non-dominated policies in (NII × fair-lending) space. Every point is a policy. The frontier line connects the ones where no other option is strictly better on both axes. The shaded region below is dominated. The red dot at the bottom-right — high NII, 0.82 fair-lending — sits below the floor, marked infeasible. The optimizer found it and ruled it out automatically.

> *Scroll down to the top-3 cards. Click rank #2.*

Below the chart, the top three recommendations as ranked cards. Click any one and you get the same depth of detail you'd get from a What-If run — verdict, proof KPIs, configuration, **the same J-Curve, the same KPI trajectories, the same arena drill-downs** — but for this specific candidate. So you can compare rank-1 to rank-2 to rank-3 with the same lens.

**Why this matters**: A PM no longer has to choose between "I know what I want" and "I want the system to find it." Both flows produce the same artifact — a simulated policy with its tradeoffs visible. The bank gets a **goal-seeking capability** without losing the directed-work capability.

---

## Act 5 (1.5 min) · Autopilot — when Twin can drive

> *Back to the test-mode modal.*

There's a third option below the line — **Run on Autopilot**. This is for when the recommended policy is solid and you'd rather watch the system execute end-to-end than tune it.

> *Click "Start →" on Autopilot.*

Twin opens the workbench, narrates its lever choices, runs the simulation, lands the verdict, and stages the policy for Deploy review. The whole thing takes about 16 seconds. The user is an audience, not an operator.

> *Let the cinematic run. Stop talking. Let the screen do it.*

The point of Autopilot isn't speed. **It's that the bank can decide where it wants to spend human judgment**. The 80% of policies that are well-understood and pattern-matched can run on Autopilot with humans gating Deploy. The 20% that need debate — fair-lending edge cases, novel cohorts, board-visible bets — get the workbench and the deliberation.

That's an organisational lever, not a UI feature. **It's how a bank scales decisions from hundreds a year to tens of thousands without diluting accountability.** The Stage / Deploy / Learn gates stay human; the analysis underneath them gets automated.

---

## Act 6 (1.5 min) · The portfolio is the institutional capability

> *Click into the Deploy workspace.*

One hypothesis is interesting. The portfolio is the actual product.

This is the Deploy queue. Every policy the bank is currently routing through Approval, Compliance, or Live Pilot — across themes, across business lines. Filterable by stage. **Subscription stacking pilot at week 6 of 8. Wholesale ladder at week 3. Mass-affluent SMA bridge in compliance. Conservative ceiling lift, just approved.** Four active experiments, four different LOBs, all visible in one view.

> *Click any row.*

Each row expands inline to the actual review tabs — Approval, Compliance, Pilot. The same surface the operators have been using; just contextualised by the portfolio it sits in.

> *Switch to Learn.*

And here's the institutional memory. Twelve completed pilots, average fidelity 0.94 R², 80% promotion rate. Click any one to see the realised-vs-predicted numbers. The Trust-Aware Lift we just simulated will land here when it completes its pilot, with realised numbers next to the predicted ones we showed earlier.

**Why this matters**: most banks lose the learning between experiments. The post-mortem sits in a deck on someone's laptop. **Here it's a row in a table** — searchable, comparable, joinable to the next hypothesis. The model that recommended the trust-aware lift gets retrained on its own realised outcomes. The next hypothesis benefits from the learning of the last one.

The bank doesn't just run more experiments. It **gets compounding returns on experiments**. That's a different P&L line.

---

## Act 7 (1 min) · The CXO Companion

> *Click "Executive Brief" in the sidebar.*

Last view. This is the same engine, addressed to a different reader.

The Brief carries the bank's quarterly numbers up top. Underneath, the themes — colour-coded by strategic motion: blue for acquisition, amber for retention, purple for deepening. **At a glance, a CXO sees how the bank's $688B is being worked: where new relationships are being captured, where existing ones are being defended, where the deepening lever is being pulled.**

> *Click the "Gig money movement" theme card.*

The companion picks up the question, answers through the lens that matters — franchise, competitive, risk & regulatory, capital. Under every answer, follow-up prompts that extend the conversation: *drill (here's the NII attribution), compare (against last quarter), brainstorm (if we doubled down).*

The CXO isn't running the workbench. **The CXO is asking the company "what should we believe about retention this quarter?" — and getting an answer grounded in the same simulations the PM is running three layers down.** Same evidence, executive frame.

That's the alignment piece. The board narrative and the operator's bet — *one source of truth*, two presentation layers.

---

## Close (30 sec) · The institutional value

So — to put numbers on the story:

- **Decisions tested per quarter**: from ~12 (the current memo-driven cadence) to **3,000+** (the optimizer search alone) with humans gating the ship.
- **Time from signal to staged policy**: from ~120 days to **~16 seconds** for the well-understood cases, **2–4 hours** for the deliberate ones.
- **Compliance posture**: from "checked at the end" to **embedded as a guardrail the optimizer respects** — fair-lending, fraud envelope, ECOA all parameterised into the search itself.
- **Institutional memory**: from "the PM remembered the last test" to **a portfolio of measured realised-vs-predicted outcomes** the next hypothesis is trained on.

The bank is not buying a simulation tool. **It's buying an operating cadence** — one where the people who currently sit between "we have a signal" and "we have a policy" are equipped to ship that journey at the rhythm the customer's expectation has already moved to.

That's the product.

> *End on the Cockpit view — same screen we opened on. Pause for questions.*

---

# Notes for the presenter

- **Pace**: each Act is meant to land one specific business-value beat. If you find yourself describing UI elements ("this is a button that..."), step back and re-state the business idea.
- **The dollar figures** are deliberate. Don't soften them ("a few million dollars") — name the numbers. Banking audiences expect specificity.
- **Sit silently during Autopilot.** The cinematic is the point. If you keep talking over it, it becomes a demo. If you let it run, it becomes the moment people remember.
- **Don't oversell the AI.** This is "the bank made its own decisions faster and with more evidence," not "the bank handed decisions to AI."
- **Save the close for the questions.** "100x more decisions tested" hits harder after the demo than at the start.
