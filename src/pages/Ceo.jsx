import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo, ThemeToggle } from "@/components/Logo";
import PageShell from "@/components/PageShell";
import Icon from "@/components/Icon";
import "@/styles/ceo.css";

/* ---- THEMES (left rail) ----------------------------------------------------
   Each entry: a clickable theme that seeds a "Tell me about X" question and
   a small set of contextual follow-up chips for the response that surfaces.
   Pinned themes float to the top. Recent themes shown next. The CXO scans
   the rail, picks a theme, dives in. */
/* Themes are categorised by the strategic motion they represent —
   acquisition / retention / deepening — not by deployment state. This is
   how the bank thinks about its portfolio: which themes bring in new
   relationships, which defend existing ones, which extract more value
   from them. Each category gets its own colour cascade in ceo.css.
     acquisition → blue (--acq)
     retention   → amber (--ret)
     deepening   → purple (--deep) */
const CXO_THEMES = [
  // ACQUISITION — bring in new relationships / capture new moments
  { id: "home",      name: "Life-event capture",   lob: "Consumer",   category: "acquisition", catLabel: "acquisition", seed: "How is life-event capture performing?",          pinned: false, recent: true  },
  { id: "wealth",    name: "Mass-affluent onramp", lob: "Wealth",     category: "acquisition", catLabel: "acquisition", seed: "Show me the mass-affluent onramp picture.",      pinned: false, recent: false },
  { id: "b2b",       name: "B2B deposits",         lob: "Commercial", category: "acquisition", catLabel: "acquisition", seed: "Where does the B2B deposits theme stand?",       pinned: false, recent: false },
  // RETENTION — defend the existing relationship from friction or churn
  { id: "gig",       name: "Gig money movement",   lob: "Consumer",   category: "retention",   catLabel: "retention",   seed: "What's happening in the gig money-movement theme?", pinned: true,  recent: true  },
  { id: "elder",     name: "Elder protection",     lob: "Consumer",   category: "retention",   catLabel: "retention",   seed: "Tell me about elder protection signals.",          pinned: false, recent: true  },
  { id: "churn",     name: "Rate-sensitive churn", lob: "Consumer",   category: "retention",   catLabel: "retention",   seed: "What's our position on rate-sensitive churn?",      pinned: true,  recent: false },
  // DEEPENING — extract more value from existing relationships
  { id: "retire",    name: "Retirement glidepath", lob: "Wealth",     category: "deepening",   catLabel: "deepening",   seed: "What did the retirement glidepath pilot tell us?",   pinned: false, recent: false },
  { id: "wholesale", name: "Wholesale pricing",    lob: "Commercial", category: "deepening",   catLabel: "deepening",   seed: "What is TwinX doing on wholesale pricing?",         pinned: false, recent: false },
];

/* Contextual follow-ups — three per response: drill / compare / brainstorm.
   Maps the *lens* of the response, with overrides per theme where useful.
   These appear as chips after each assistant message, so the CXO can extend
   the conversation without typing. */
const FOLLOWUPS_BY_LENS = {
  FR: [
    { kind: "drill",      text: "Show me the NII attribution behind this" },
    { kind: "compare",    text: "How does this compare to last quarter?" },
    { kind: "brainstorm", text: "What's the biggest downside if we double down?" },
  ],
  CO: [
    { kind: "drill",      text: "Where are we vs the peer average?" },
    { kind: "compare",    text: "Which competitor is closest behind?" },
    { kind: "brainstorm", text: "What's the next defensible move?" },
  ],
  RR: [
    { kind: "drill",      text: "Walk me through the guardrails" },
    { kind: "compare",    text: "Compare the risk envelope to last cycle" },
    { kind: "brainstorm", text: "If regulators tightened, where would we be exposed?" },
  ],
  CA: [
    { kind: "drill",      text: "What's the capital intensity here?" },
    { kind: "compare",    text: "Compare the return on capital across themes" },
    { kind: "brainstorm", text: "If I had one more dollar, where should it go?" },
  ],
};
const FOLLOWUPS_DEFAULT = [
  { kind: "drill",      text: "What's driving this most?" },
  { kind: "compare",    text: "Compare against the other themes" },
  { kind: "brainstorm", text: "What would you do differently?" },
];

const B = ({ children }) => <b>{children}</b>;
const G = ({ children }) => <span className="g">{children}</span>;
const H = ({ children }) => <span className="h">{children}</span>;
const R = ({ children }) => <span className="r">{children}</span>;
const B2 = ({ children }) => <span className="b2">{children}</span>;
const I = ({ children }) => <i>{children}</i>;

const Q = { eps: "$1.18", epsg: "+15%", rev: "$7.3B", revg: "+4.7%", nii: "+4.1%", fee: "+6.9%", dep: "~$515B", nim: "2.77%", eff: "58.2%", lev: "440 bps", rotce: "17%", cet1: "10.8%", assets: "$688B" };
const LENSNAME = { FR: "Franchise", CO: "Competitive", RR: "Risk & Reg", CA: "Capital" };
const THEMEPAGE = { gig: "/gig-pipeline", elder: "/deep-pipeline?theme=elder", home: "/deep-pipeline?theme=home", churn: "/deep-pipeline?theme=churn" };

const DECISIONS = [
  { theme: "gig",   st: "deployed", pr: "Retention · Payments",  t: "Money-movement retention play", v: "+$56M retention NII (illus.)",          vc: "gr", d: "A high-velocity, multi-platform earner cohort — historically unowned — defended via a friction-removal intervention. Fairness-cleared, fraud within bound." },
  { theme: "elder", st: "deployed", pr: "Efficiency · Risk",     t: "Elder financial-exploitation guardrail", v: "−1.8 bps fraud · $6.7M cost-avoided",    vc: "gr", d: "First-ever scam-pattern wires intercepted before settlement. Proven ethically via stepped-wedge — no senior denied protection." },
  { theme: "home",  st: "test",     pr: "Organic growth",        t: "Life-event primacy capture",     v: "+$87M growth NII (projected, illus.)",  vc: "am", d: "Liquidity-event window for affluent emergence. Consent-aware test — advisory offered, suitability gated." },
  { theme: "churn", st: "refused",  pr: "Margin discipline",     t: "Rate-sensitive repricing", v: "+$15M forgone — held",                vc: "rd", d: "Tempting relationship-pricing play refused at the gate: elasticity model drifting. Restraint logged for auditability." },
];

const KB = [
  // FRANCHISE
  { id: "deposit", lens: "FR", q: "How big is the deposit franchise we're defending?", keys: ["deposit", "franchise", "base", "how big", "balances", "funding", "size of"],
    head: `~${Q.dep} in average deposits — with record consumer deposits two quarters running.`,
    body: <>That base, earning a <B2>2.77% net interest margin</B2>, is the engine. Every retention theme exists to defend it: at this scale a few basis points of retained deposit rate across half a trillion dollars moves <B>net interest income materially</B>. TwinX treats the deposit franchise as one portfolio of defendable relationships — gig and elder keep balances in-house; churn is where we showed the discipline <I>not</I> to chase the elastic tail.</>,
    ev: [{ c: "src", vv: Q.dep, ll: "avg deposits", th: "Q1’26 disclosures" }, { c: "src", vv: Q.nim, ll: "NIM", th: "Q1’26 disclosures" }, { c: "gr", vv: "retention", ll: "gig + elder", th: "TwinX" }],
    trace: ["Deposit signals", "Gig·Elder·Churn", "NII defended"], cta: { t: "See the cockpit", theme: null } },
  { id: "nii", lens: "FR", q: "How does TwinX move net interest income?", keys: ["nii", "net interest", "interest income", "move nii", "spread", "margin"],
    head: "By defending the funding base and the spread that prices it.",
    body: <>NII grew <B2>4.1% year-over-year</B2> on loan growth and record consumer deposits. The decision layer protects the deposit side of that equation: it defends high-velocity recurring-payment cohorts that would otherwise attrite over service friction, and it holds the line on mis-pricing the rate-sensitive tier where acting on a drifting model would erode margin. Retention NII is the quiet, compounding lever beneath the headline.</>,
    ev: [{ c: "src", vv: Q.nii, ll: "NII YoY", th: "Q1’26 disclosures" }, { c: "src", vv: Q.nim, ll: "NIM", th: "Q1’26 disclosures" }, { c: "gr", vv: "+$56M", ll: "gig retention (illus.)", th: "Gig" }],
    trace: ["Funding signals", "Retention themes", "NII"], cta: { t: "Gig pipeline", theme: "gig" } },
  { id: "retention", lens: "FR", q: "What's our biggest retention risk right now?", keys: ["retention", "risk", "losing", "attrition", "leave", "leaving", "biggest risk", "retain"],
    head: "Two fronts that need opposite responses.",
    body: <><B>Fixable, and fixed:</B> a high-velocity recurring-payment cohort attriting over service friction — the intervention closed the bleed and defended the relationship. <B>Held on purpose:</B> rate-sensitive balances probing competitors — tempting to reprice, but the elasticity model is <R>drifting</R>, so chasing would be pricing on noise and a UDAAP risk. Disciplined retention there means <H>watch, don't chase</H>.</>,
    ev: [{ c: "gr", vv: "+$56M", ll: "retention NII", th: "Money movement" }, { c: "rd", vv: "+$15M", ll: "forgone — by design", th: "Churn" }, { c: "vi", vv: "portfolio", ll: "act + hold", th: "Strategy" }],
    trace: ["Money-movement signals", "Retention themes", "deploy vs refuse"], cta: { t: "Open the portfolio", theme: "gig" } },
  { id: "donothing", lens: "FR", q: "What's the cost of inaction on the unmet payment-friction signal?", keys: ["nothing", "do nothing", "inaction", "cost of", "ignore", "gig", "fail", "failing", "friction"],
    head: "A slow, quiet exit of an unowned, creditworthy cohort.",
    body: <>Each blocked recurring payment is a trusted customer hitting a wall on their most important obligation of the month — seeding complaints, contact-centre cost, and silent attrition of a high-velocity, deepening-ready cohort the bank doesn't yet own. The intervention recovered the retention bleed and turned it into a <H>cross-sell opening</H> — the same money-movement signal that defended the deposit now opens the relationship.</>,
    ev: [{ c: "rd", vv: "attrition", ll: "if unfixed", th: "Money movement" }, { c: "gr", vv: "+$56M", ll: "NII recovered", th: "Money movement" }, { c: "vi", vv: "cross-sell", ll: "deepening opportunity", th: "Portfolio" }],
    trace: ["Money-movement signals", "Retention", "deployed"], cta: { t: "Open the portfolio", theme: "gig" } },
  // COMPETITIVE
  { id: "feegap", lens: "CO", q: "Our fee growth lags the industry — how does TwinX close that gap?", keys: ["fee", "fee growth", "gap", "lag", "lags", "100 basis", "behind industry", "noninterest"],
    head: "By turning money-movement signal into fee-bearing relationships at the right moment.",
    body: <>Fee income grew <B2>6.9%</B2> this quarter — strong, but the bank itself has named fee growth running roughly <B>100 bps below the industry</B>, and new products are aimed at that gap. TwinX feeds it two ways: <H>life-event capture</H> converts a liquidity moment into advisory and primacy (fee + balances), and the payments substrate deepens card/merchant engagement. The signal that retains is the same signal that cross-sells.</>,
    ev: [{ c: "src", vv: Q.fee, ll: "fee income YoY", th: "Q1’26 disclosures" }, { c: "am", vv: "+$87M", ll: "home growth NII", th: "Home" }, { c: "vi", vv: "+18pp", ll: "attach", th: "Home" }],
    trace: ["Life-event + payments signals", "Home", "fee + primacy"], cta: { t: "Life-event pipeline", theme: "home" } },
  { id: "payments", lens: "CO", q: "How does this support the payments transformation?", keys: ["payments", "payment", "transformation", "money movement", "zelle", "embedded", "interconnected", "rail"],
    head: "Money-movement is the first, most-frequent engagement — the decision layer makes it intelligent.",
    body: <>Embedded, interconnected payments are how the bank retains, deepens and grows the client base — often the first product a client touches. The decision layer sits on that money-movement substrate: it senses when a rail is failing a trusted relationship and intervenes per-decision rather than per-policy. The proof point is a payments-friction problem solved as a <B2>real-time decision</B2>, not a static rule.</>,
    ev: [{ c: "bl", vv: "rails", ll: "Zelle·ACH·RTP·Wire", th: "Money movement" }, { c: "gr", vv: "+$56M", ll: "retention NII recovered", th: "Money movement" }, { c: "vi", vv: "first product", ll: "engagement", th: "Strategy" }],
    trace: ["Money-movement signals", "Decision layer", "payments substrate"], cta: { t: "Open the portfolio", theme: "gig" } },
  { id: "affluent", lens: "CO", q: "We're shifting toward affluent customers — does TwinX help?", keys: ["affluent", "wealth", "shift", "upmarket", "premium", "mass affluent", "high-value"],
    head: "Directly — it finds the affluent moment and the affluent risk.",
    body: <>Two themes target the shift. <H>Life-event capture</H> meets young-affluent customers at a liquidity event with a consented advisory introduction — the path to wealth primacy. And the rate-sensitive theme is a <I>mass-affluent</I> retention question: who is genuinely elastic versus operationally sticky. TwinX gives the affluent strategy a decision layer, not just a segment label — and it gates the advisory on suitability so the upmarket push stays compliant.</>,
    ev: [{ c: "am", vv: "+$87M", ll: "home growth", th: "Home" }, { c: "vi", vv: "25%", ll: "primacy", th: "Home" }, { c: "rd", vv: "held", ll: "churn discipline", th: "Churn" }],
    trace: ["Equity-event signals", "Home + Churn", "affluent capture"], cta: { t: "Life-event pipeline", theme: "home" } },
  { id: "giglimit", lens: "CO", q: "Could we lift transaction limits broadly to capture more upside?", keys: ["what if", "lift", "limit", "limits", "all gig", "raise", "ceiling", "everyone", "blanket"],
    head: "Past a point it backfires — the fraud guardrail is the constraint, not the appetite.",
    body: <>Acting on a <B2>verified recurring counterparty pattern</B2> is safe and valuable. A blanket lift without the trust filter opens a real attack surface — the fraud-rate CI crosses zero and the governance gate <R>hard-kills</R> it. The strategic answer isn't 'more lift'; it's 'more trust per unit of lift'. The decision layer rides that trade-off transparently.</>,
    ev: [{ c: "gr", vv: "+$56M", ll: "with trust filter", th: "Money movement" }, { c: "rd", vv: "breach", ll: "blanket, no filter", th: "Money movement" }, { c: "bl", vv: "trade-off", ll: "trust × lift", th: "Strategy" }],
    trace: ["Money-movement", "Decision gate", "fraud guardrail"], cta: { t: "Open the portfolio", theme: "gig" } },
  { id: "fintech", lens: "CO", q: "What if a fintech out-prices us on money movement?", keys: ["fintech", "compete", "competitor", "out-price", "out-prices", "disrupt", "stablecoin", "challenger", "money movement out", "fintech money"],
    head: "We don't win on price — we win on the intelligence layer over the rail.",
    body: <>A challenger can match speed or price on a single transfer. What they can't easily match is a bank that <B>knows, per customer, when to lift, hold, or protect</B> — and does it inside the relationship, with the deposit and the trust already there. TwinX is that decision layer: the same money-movement signal becomes retention, protection and cross-sell at once. Price is a feature; the decided relationship is the moat.</>,
    ev: [{ c: "bl", vv: "substrate", ll: "money-movement", th: "TwinX" }, { c: "gr", vv: "retention", ll: "gig", th: "Gig" }, { c: "vi", vv: "deepening", ll: "cross-sell", th: "Portfolio" }],
    trace: ["Competitive signals", "Themes", "decision moat"], cta: null },
  { id: "growth", lens: "CO", q: "Where is the growth coming from?", keys: ["growth", "acquisition", "grow", "primacy", "new money", "upside", "where", "expand", "life event", "life-event", "organic"],
    head: "Life events — the windows where money decides where it lives.",
    body: <>A liquidity event opens a <B2>~14-day primacy window</B2>: meet it with a consented offer and we become primary — projected <H>+$87M</H> growth NII, +18pp attach, 25% primacy capture. It's in a consent-aware test because an advisory introduction is a recommendation (Reg BI) — we offer, not force. That discipline is what lets organic growth scale without a supervision finding.</>,
    ev: [{ c: "am", vv: "+$87M", ll: "growth NII", th: "Home" }, { c: "vi", vv: "+18pp", ll: "attach", th: "Home" }, { c: "vi", vv: "25%", ll: "primacy", th: "Home" }],
    trace: ["Liquidity-event signals", "Home", "consent-aware test"], cta: { t: "Life-event pipeline", theme: "home" } },
  // RISK & REG
  { id: "cro", lens: "RR", q: "What keeps the CRO comfortable with this?", keys: ["cro", "risk officer", "comfortable", "governance", "control", "oversight", "second line", "compliance"],
    head: "Every decision clears a gate with pre-registered teeth — or it doesn't ship.",
    body: <>TwinX never deploys on confidence; it deploys on a <B>governance gate</B> wired to the constraint that matters per theme — fairness/disparate-impact, UDAAP, model drift (SR 11-7), fraud, false-positive ceilings, Reg BI suitability, credit exposure. The gate <R>branches on the real result</R>: gig clears on fairness, elder enforces a customer-harm ceiling, churn was <R>refused</R> on drift. The second line sees the same matrix the system does.</>,
    ev: [{ c: "gr", vv: "gate", ll: "SR 11-7 logged", th: "All" }, { c: "rd", vv: "refused", ll: "churn drift", th: "Churn" }, { c: "am", vv: "ceiling", ll: "elder harm guard", th: "Elder" }],
    trace: ["Theme constraints", "Governance gate", "clear or kill"], cta: { t: "See a refusal", theme: "churn" } },
  { id: "elder", lens: "RR", q: "How are we protecting elderly customers from fraud?", keys: ["elder", "elderly", "senior", "seniors", "fraud", "protect", "protection", "scam", "exploitation", "efe", "wire"],
    head: "We intercept the scam in the moment — and we proved it without denying anyone protection.",
    body: <>A first-ever scam-language wire is <B>held</B> with trusted-contact outreach before money moves — cutting fraud ~1.8 bps. The hard part was proving it ethically: you <B>cannot</B> withhold protection from a random control of vulnerable seniors. So we used a <H>stepped-wedge</H> — every cohort gets the intervention, only the timing is randomised. The guardrail is <I>inverted</I>: the risk we watch is <R>over-acting</R> on a genuine customer (a grandparent wiring tuition).</>,
    ev: [{ c: "gr", vv: "−1.8 bps", ll: "fraud", th: "Elder" }, { c: "gr", vv: "$6.7M", ll: "cost avoided", th: "Elder" }, { c: "am", vv: "ceiling", ll: "harm guardrail", th: "Elder" }],
    trace: ["Wire + scam-language signals", "Elder", "stepped-wedge"], cta: { t: "Elder pipeline", theme: "elder" } },
  { id: "churnwhy", lens: "RR", q: "Why aren't we repricing the rate-sensitive deposits?", keys: ["why not", "reprice", "repricing", "rate-sensitive", "rate sensitive", "price", "pricing", "refuse", "refused", "drift", "hold", "not act"],
    head: "The model is drifting — and pricing on a drifting model is pricing on noise.",
    body: <>~$15M of margin looks attractive, but behaviour is shifting faster than the elasticity model can track (<R>rate_sensitive_drift</R>). Deploy on that and we'd mis-price operationally-sticky customers as flight risks — giving away margin <I>and</I> creating a UDAAP differential-pricing exposure. The gate <R>refused</R> it; Model Risk can't sign off. That refusal is the system working — and a defensible decision the bank can stand behind.</>,
    ev: [{ c: "rd", vv: "drift", ll: "rate_sensitive_drift", th: "Churn" }, { c: "rd", vv: "refused", ll: "SR 11-7", th: "Churn" }, { c: "am", vv: "+$15M", ll: "forgone by design", th: "Churn" }],
    trace: ["Aggregator signals", "Churn", "gate refuses"], cta: { t: "See the refusal", theme: "churn" } },
  { id: "notdoing", lens: "RR", q: "What are we deliberately choosing NOT to do?", keys: ["not doing", "not do", "restraint", "avoid", "discipline", "hold back", "choosing not", "walk away", "deliberately"],
    head: "We're holding the rate-sensitive repricing — on purpose.",
    body: <>The most valuable thing a decision system can do is sometimes <B>nothing</B>. A ~$15M repricing play was <R>refused</R> on drift. Acting would have looked good this quarter and cost us in mis-priced sticky customers and fairness exposure. Logging that restraint — auditable, with Model Risk unable to sign off — is a risk-adjusted decision, not a missed one. The bank that knows when not to act can be trusted to act fast when it should.</>,
    ev: [{ c: "rd", vv: "refused", ll: "churn repricing", th: "Churn" }, { c: "rd", vv: "drift", ll: "model unstable", th: "Churn" }, { c: "gr", vv: "protected", ll: "margin + fairness", th: "Portfolio" }],
    trace: ["Churn", "gate", "restraint logged"], cta: { t: "See the refusal", theme: "churn" } },
  { id: "fairness", lens: "RR", q: "Is the money-movement intervention a fair-lending risk?", keys: ["fair", "fairness", "disparate", "protected class", "proxy", "bias", "discrimination", "fair lending", "fair-lending", "fair access", "trust gate", "lending risk"],
    head: "Fairness is the first thing the governance gate tests — pre-registered.",
    body: <>A policy that helps some customers and not others is a differential-treatment question, and tenure or history signals can proxy a protected class. So the gate is pre-registered against <B>disparate impact</B>: the intervention must <I>narrow</I> the thin-file access gap, not widen it. The eligibility signal is audited against protected-class proxying before any deployment. The intervention cleared that bar; if it hadn't, the gate would have hard-killed it.</>,
    ev: [{ c: "gr", vv: "pre-registered", ll: "disparate-impact test", th: "Governance" }, { c: "gr", vv: "narrows", ll: "thin-file access gap", th: "Fair-lending" }, { c: "am", vv: "audited", ll: "no protected-class proxy", th: "Compliance" }],
    trace: ["Money-movement", "Governance gate", "fairness tooth"], cta: { t: "Open the portfolio", theme: "gig" } },
  // CAPITAL & EFFICIENCY
  { id: "efficiency", lens: "CA", q: "How does this help the efficiency ratio?", keys: ["efficiency", "efficiency ratio", "cost", "operating leverage", "expense", "productivity", "cost-to-serve"],
    head: "It compounds the operating leverage you're already posting.",
    body: <>The efficiency ratio improved to <B2>58.2%</B2> with <B>440 bps of positive operating leverage</B> this quarter. TwinX adds to that on the cost side: decisions are automated rather than manually reviewed, contact-centre volume falls as friction and fraud drop, and loss-avoidance (elder) is pure cost taken out. This is intelligence arbitrage — more correct decisions per dollar of operating cost, without adding headcount.</>,
    ev: [{ c: "src", vv: Q.eff, ll: "efficiency ratio", th: "Q1’26 disclosures" }, { c: "src", vv: Q.lev, ll: "operating leverage", th: "Q1’26 disclosures" }, { c: "gr", vv: "cost-avoided", ll: "gig + elder", th: "TwinX" }],
    trace: ["Decision automation", "All themes", "cost-to-serve ↓"], cta: null },
  { id: "onedollar", lens: "CA", q: "If I had one more dollar to invest, where would it go?", keys: ["one more dollar", "invest", "where", "allocate", "capital", "prioritize", "priority", "best return", "roi"],
    head: "Lead with protection, then growth — highest risk-adjusted return first.",
    body: <>On a risk-adjusted basis the first dollar goes to <H>elder loss-prevention</H>: a single buyer (the CRO), avoided losses plus litigation and reputational exposure, and the gate-teeth that make the whole portfolio credible to the second line. The second goes to <H>life-event capture</H> — the clearest organic-growth and fee-gap play, gated on suitability. Margin defense (churn) earns <I>negative</I> investment right now: the disciplined move is to hold until the model re-stabilises.</>,
    ev: [{ c: "gr", vv: "1st", ll: "elder · loss + teeth", th: "Elder" }, { c: "am", vv: "2nd", ll: "home · growth + fee", th: "Home" }, { c: "rd", vv: "hold", ll: "churn · drift", th: "Churn" }],
    trace: ["Value × feasibility", "Portfolio", "allocation"], cta: { t: "Elder pipeline", theme: "elder" } },
  { id: "buildbuy", lens: "CA", q: "Should we build this capability or buy it?", keys: ["build", "buy", "build or buy", "make or buy", "acquire", "vendor", "in-house", "platform"],
    head: "Neither replaces your stack — TwinX orchestrates it.",
    body: <>The bank already runs fraud, marketing-decisioning and limit systems, and it grows by interconnecting capabilities (the recent payments/healthcare acquisitions follow exactly that pattern). TwinX is the <B>decision layer over</B> those engines, not a rip-and-replace — it senses, simulates, gates and deploys across them, and writes back. The build-vs-buy question becomes 'who orchestrates', and the answer is a thin, governable layer that makes the assets you already own act in concert.</>,
    ev: [{ c: "bl", vv: "orchestrate", ll: "existing engines", th: "TwinX" }, { c: "vi", vv: "interconnect", ll: "M&A pattern", th: "Strategy" }, { c: "gr", vv: "governable", ll: "thin layer", th: "TwinX" }],
    trace: ["Existing stack", "TwinX layer", "orchestration"], cta: null },
  { id: "priorities", lens: "CA", q: "How does TwinX ladder to our three strategic priorities?", keys: ["three priorities", "strategic priorities", "ladder", "map", "organic growth payments efficiency", "tie to strategy", "strategy"],
    head: "Cleanly — every theme sits under one of the three.",
    body: <><B>Organic growth:</B> life-event capture and the affluent shift, aimed squarely at the named fee-growth gap. <B>Payments transformation:</B> the money-movement substrate under gig and embedded payments — the first, most-frequent engagement. <B>Operational efficiency:</B> automated decisions and avoided losses behind the <B2>58.2%</B2> efficiency ratio. TwinX isn't a side project; it's the execution layer for the strategy already on the page.</>,
    ev: [{ c: "am", vv: "growth", ll: "home", th: "Home" }, { c: "vi", vv: "payments", ll: "gig", th: "Gig" }, { c: "gr", vv: "efficiency", ll: "elder + all", th: "Elder" }],
    trace: ["3 priorities", "4 themes", "one strategy"], cta: null },
  { id: "urgency", lens: "CA", q: "How does this support executing with urgency and consistency?", keys: ["urgency", "consistency", "execute", "execution", "speed", "pace", "faster", "cadence"],
    head: "It collapses the decision cycle from quarters to a daily loop.",
    body: <>The bank has set the bar at executing with urgency and consistency. TwinX is the mechanism: sense → simulate → gate → test → deploy → learn, run <B2>every day</B2>, with governance built in so speed doesn't cost control. Consistency comes from the gate — the same teeth, every decision, auditable — so 'fast' and 'safe' stop being a trade-off.</>,
    ev: [{ c: "bl", vv: "daily", ll: "decision loop", th: "TwinX" }, { c: "gr", vv: "gate", ll: "consistent teeth", th: "All" }, { c: "am", vv: "auditable", ll: "SR 11-7", th: "All" }],
    trace: ["Sense→…→Learn", "run daily", "urgency + control"], cta: null },
  { id: "downside", lens: "CA", q: "What's the downside scenario if a decision is wrong?", keys: ["downside", "wrong", "risk scenario", "fail", "what could go wrong", "blow up", "worst case", "rollback"],
    head: "Bounded by design — small blast radius, fast reversal, and a gate that prefers 'no'.",
    body: <>Three protections. Decisions are <B>tested before scale</B> (holdout, stepped-wedge, or consent-aware), so a wrong call shows up small. Deployment carries <B2>one-click rollback</B2> with auto-trigger on drift. And the gate is biased toward restraint — it would rather <R>refuse</R> a good-looking play (churn) than ship an unsafe one. The downside of TwinX is a forgone gain, logged and recoverable — not an unbounded loss.</>,
    ev: [{ c: "gr", vv: "tested", ll: "before scale", th: "All" }, { c: "bl", vv: "1-click", ll: "rollback on drift", th: "All" }, { c: "rd", vv: "refuses", ll: "when unsafe", th: "Churn" }],
    trace: ["Scenario", "Gate", "rollback"], cta: null },
  // PORTFOLIO / BOARD
  { id: "week", lens: "CA", q: "What did we decide this week — and why?", keys: ["decide", "decision", "this week", "summary", "what did", "happened", "overview", "update", "recap"],
    head: "Four decisions — two acted, one testing, one refused.",
    body: <>The pattern is the point: the bank chose <B>where not to act</B>. We <G>deployed</G> a money-movement retention play (retention/payments) and an elder financial-exploitation guardrail (efficiency/risk), put life-event primacy capture into a <H>consent-aware test</H> (organic growth), and <R>refused</R> rate-sensitive repricing on model drift. Each laddered to a named strategic priority and cleared — or failed — a governance gate before anyone acted.</>,
    ev: [{ c: "gr", vv: "+$56M", ll: "gig", th: "Gig" }, { c: "gr", vv: "−1.8bps", ll: "elder", th: "Elder" }, { c: "am", vv: "+$87M", ll: "home (test)", th: "Home" }, { c: "rd", vv: "held", ll: "churn", th: "Churn" }],
    trace: ["Cockpit · 8 clusters", "4 themes", "4 pipelines"], cta: null },
  { id: "board", lens: "CA", q: "What will the board ask about this?", keys: ["board", "directors", "audit committee", "what will they ask", "governance question", "oversight question"],
    head: "Growth, efficiency, risk, capital — and TwinX answers all four in one frame.",
    body: <>Expect four questions. <B>Growth:</B> does it close the fee gap? (life-event capture). <B>Efficiency:</B> does it improve operating leverage? (automated decisions, cost-avoided). <B>Risk:</B> is the second line comfortable? (pre-registered gate teeth, SR 11-7). <B>Capital:</B> is it a contained, reversible bet? (tested before scale, one-click rollback, gate prefers 'no'). The unusual answer the board will remember is the <R>refusal</R> — proof the system has judgement.</>,
    ev: [{ c: "am", vv: "growth", ll: "fee gap", th: "Home" }, { c: "gr", vv: "efficiency", ll: "58.2%", th: "Portfolio" }, { c: "rd", vv: "restraint", ll: "churn refused", th: "Churn" }],
    trace: ["Board lenses", "Portfolio", "one frame"], cta: null },
  { id: "inflight", lens: "CA", q: "Show me everything in flight.", keys: ["in flight", "inflight", "everything", "status", "running", "active", "whats happening", "show me", "portfolio"],
    head: "Four themes, four states — acted, acted, testing, held.",
    body: <><B>Gig</B> deployed (retention secured). <B>Elder</B> deployed via stepped-wedge (seniors protected). <B>Home</B> in consent-aware test (growth pending suitability evidence). <B>Churn</B> refused on drift (held for re-stabilisation). The decision ledger on the left is live — click any decision to drop into its pipeline and see the full sense→deploy trace.</>,
    ev: [{ c: "gr", vv: "deployed", ll: "gig + elder", th: "2 themes" }, { c: "am", vv: "in test", ll: "home", th: "1 theme" }, { c: "rd", vv: "refused", ll: "churn", th: "1 theme" }],
    trace: ["Cockpit", "4 themes", "4 pipelines"], cta: null },
];

const TOPIC_TAGS = ["gig", "elder", "senior", "home", "churn", "rate", "fraud", "growth", "limit", "deposit", "fee", "payments", "efficiency", "fairness", "board", "capital", "invest"];

/* answer() — keyword-matches the query against the KB and returns the best
   entry. Takes a `served` Set of entry IDs that the user has already seen
   this session — those get a recency penalty so the same query doesn't
   keep firing the same canned response. If no entry crosses the match
   threshold, returns a {fallback: true} object so the chat can render a
   varied no-match prompt (instead of the same canned stub every time). */
function answer(q, served = new Set(), fallbackCount = 0) {
  const qLow = q.toLowerCase();
  const ranked = KB.map((e) => {
    let s = 0;
    e.keys.forEach((k) => { if (qLow.indexOf(k) >= 0) s += (k.indexOf(" ") >= 0 ? 2 : 1); });
    TOPIC_TAGS.forEach((t) => { if (qLow.indexOf(t) >= 0 && e.keys.indexOf(t) >= 0) s += 1; });
    const recencyPenalty = served.has(e.id) ? 4 : 0;
    return { e, raw: s, adj: s - recencyPenalty };
  }).filter((r) => r.raw >= 2)
    .sort((a, b) => b.adj - a.adj);

  if (ranked.length > 0) {
    const top = ranked[0];
    return { ...top.e, seenBefore: served.has(top.e.id) };
  }

  /* No KB entry crossed the threshold. Try to pick a topic-aware fallback
     so the user feels heard — and rotate through variants so repeating
     the same unmatched query doesn't return verbatim copy. */
  const detected = detectTopic(qLow);
  const variants = FALLBACK_VARIANTS[detected] || FALLBACK_VARIANTS.generic;
  const text = variants[fallbackCount % variants.length];
  return { fallback: true, head: text.head, body: text.body, picks: text.picks || [] };
}

/* Lightweight topic detector — checks the query against a few topic
   buckets so the fallback can be relevant to what the user asked about,
   not a generic catch-all every time. */
function detectTopic(qLow) {
  if (/gig|rent|landlord|zelle|friction|recurring/.test(qLow)) return "gig";
  if (/elder|senior|fraud|scam|wire|exploitation/.test(qLow)) return "elder";
  if (/home|life.event|primacy|affluent|attach|brokerage/.test(qLow)) return "home";
  if (/churn|repric|rate.sensitive|drift|aggregator/.test(qLow)) return "churn";
  if (/cost|efficiency|operating|ratio|expense/.test(qLow)) return "efficiency";
  if (/board|director|audit|governance|second.line/.test(qLow)) return "board";
  if (/capital|allocate|invest|cet1|rotce/.test(qLow)) return "capital";
  if (/fee|growth|deposit|nim|nii/.test(qLow)) return "franchise";
  return "generic";
}

/* Fallback variants per topic. Each is a {head, body, picks} object — the
   chat surfaces these when no KB entry matches. Picks become clickable
   chips that steer the user toward a real KB entry. */
const FALLBACK_VARIANTS = {
  gig: [
    {
      head: "I have three angles on this — pick the one that's closest:",
      body: <>The money-movement intervention can be read as <b>retention</b> (defending high-velocity relationships), as <b>fairness</b> (the disparate-impact audit that gated it), or as <b>payments strategy</b> (the substrate it runs on).</>,
      picks: [
        "What's our biggest retention risk right now?",
        "Is the money-movement intervention a fair-lending risk?",
        "How does this support the payments transformation?",
      ],
    },
    {
      head: "Same theme, different lens — which one's useful?",
      body: <>I can frame this as <b>cost of inaction</b> (what happens if we don't fix the bleed), or as a <b>governance</b> question (how the gate cleared it), or as <b>capital allocation</b> (is the dollar best spent here vs. elsewhere).</>,
      picks: [
        "What's the cost of inaction on the unmet payment-friction signal?",
        "What keeps the CRO comfortable with this?",
        "If I had one more dollar to invest, where would it go?",
      ],
    },
  ],
  elder: [
    {
      head: "The elder play has two sides — which lens matters?",
      body: <>It's a <b>loss-prevention</b> result on the franchise side and a <b>duty-of-care + ethics</b> question on the risk side — the stepped-wedge design is what made it deployable.</>,
      picks: [
        "How are we protecting elderly customers from fraud?",
        "What keeps the CRO comfortable with this?",
      ],
    },
  ],
  home: [
    {
      head: "Life-event capture is the growth lever — what angle?",
      body: <>I can speak to the <b>fee-gap closure</b>, the <b>~14-day primacy window</b>, or the <b>Reg BI</b> guardrails the test is registered against.</>,
      picks: [
        "Our fee growth lags the industry — how does this close that gap?",
        "Where is the growth coming from?",
        "We're shifting toward affluent customers — does this help?",
      ],
    },
  ],
  churn: [
    {
      head: "Churn is the one we deliberately didn't act on — which angle?",
      body: <>The model is <b>drifting</b>; that's why we refused the play. I can frame this as <b>restraint discipline</b>, as a <b>UDAAP exposure</b> question, or as a <b>capital protection</b> argument.</>,
      picks: [
        "Why aren't we repricing the rate-sensitive deposits?",
        "What are we deliberately choosing NOT to do?",
        "What's the downside scenario if a decision is wrong?",
      ],
    },
  ],
  efficiency: [
    {
      head: "Efficiency lands in two places — operating leverage or cost-to-serve.",
      body: <>The decision layer compounds the operating leverage you're already posting and removes contact-centre + loss cost.</>,
      picks: [
        "How does this help the efficiency ratio?",
        "Should we build this capability or buy it?",
      ],
    },
  ],
  board: [
    {
      head: "What the board asks usually splits four ways.",
      body: <>Growth, efficiency, risk, capital — I can take any one in isolation, or frame the answer as a single four-quadrant brief.</>,
      picks: [
        "What will the board ask about this?",
        "What's the downside scenario if a decision is wrong?",
      ],
    },
  ],
  capital: [
    {
      head: "Capital is a portfolio question — which slice?",
      body: <>I can sequence the <b>one-more-dollar</b> allocation (which theme first), unpack the <b>build-vs-buy</b> economics, or pressure-test the <b>downside</b> if a decision is wrong.</>,
      picks: [
        "If I had one more dollar to invest, where would it go?",
        "Should we build this capability or buy it?",
        "What's the downside scenario if a decision is wrong?",
      ],
    },
  ],
  franchise: [
    {
      head: "Franchise math lives in three buckets.",
      body: <>I can speak to the <b>deposit base</b> we're defending, how the decision layer moves <b>NII</b>, or what closes the <b>fee-growth gap</b> the bank has named.</>,
      picks: [
        "How big is the deposit franchise we're defending?",
        "How does this move net interest income?",
        "Our fee growth lags the industry — how does this close that gap?",
      ],
    },
  ],
  generic: [
    {
      head: "Help me steer — which lens are we using?",
      body: <>Four lenses anchor this: <b>franchise</b>, <b>competitive</b>, <b>risk & regulatory</b>, <b>capital</b>. Pick one or push on the deposit base, fee gap, or what we chose <b>not</b> to do.</>,
      picks: [
        "What did we decide this week — and why?",
        "If I had one more dollar to invest, where?",
        "What are we deliberately NOT doing?",
      ],
    },
    {
      head: "Give me a hook and I can ladder to a strategic priority.",
      body: <>Try a theme (gig money-movement, elder protection, life-event capture, rate-sensitive churn) or a number (deposits, NII, fee income, efficiency). I'll trace it to the decision portfolio.</>,
      picks: [
        "What's our biggest retention risk right now?",
        "Where is the growth coming from?",
        "How does this help the efficiency ratio?",
      ],
    },
    {
      head: "Not catching that — try one of these.",
      body: <>The most useful starting points are usually around <b>retention</b>, <b>growth</b>, or <b>restraint</b>.</>,
      picks: [
        "What keeps the CRO comfortable with this?",
        "What will the board ask about this?",
        "What's the downside scenario if a decision is wrong?",
      ],
    },
  ],
};

const LENS_PICKS = {
  all: ["What did we decide this week — and why?", "If I had one more dollar to invest, where?", "Our fee growth lags the industry — how does TwinX close it?", "What are we deliberately NOT doing?"],
  FR: ["How big is the deposit franchise we're defending?", "What's our biggest retention risk right now?", "How does TwinX move net interest income?"],
  CO: ["Our fee growth lags the industry — how does TwinX close it?", "How does this support the payments transformation?", "We're shifting toward affluent customers — does TwinX help?", "Where is the growth coming from?"],
  RR: ["What keeps the CRO comfortable with this?", "Why aren't we repricing rate-sensitive deposits?", "Is the money-movement intervention a fair-lending risk?", "How are we protecting elderly customers from fraud?"],
  CA: ["If I had one more dollar to invest, where?", "How does this help the efficiency ratio?", "Should we build this capability or buy it?", "What's the downside scenario if a decision is wrong?", "What will the board ask about this?"],
};
const LENS_LABELS = { all: "All", FR: "Franchise", CO: "Competitive", RR: "Risk & Reg", CA: "Capital" };

function Brief({ onAskTheme }) {
  const navigate = useNavigate();
  const go = (theme) => navigate(THEMEPAGE[theme]);
  return (
    <div className="brief">
      <div className="bh">This quarter <span className="src">Q1 2026, disclosed</span></div>
      <div className="qtr">
        <div className="qc"><div className="v gr">{Q.eps}</div><div className="l">EPS {Q.epsg}</div></div>
        <div className="qc"><div className="v bl">{Q.rev}</div><div className="l">revenue {Q.revg}</div></div>
        <div className="qc"><div className="v am">{Q.nim}</div><div className="l">NIM</div></div>
        <div className="qc"><div className="v gr">{Q.nii}</div><div className="l">NII YoY</div></div>
        <div className="qc"><div className="v bl">{Q.fee}</div><div className="l">fee income</div></div>
        <div className="qc"><div className="v am">{Q.eff}</div><div className="l">efficiency</div></div>
        <div className="qc"><div className="v bl">{Q.dep}</div><div className="l">avg deposits</div></div>
        <div className="qc"><div className="v gr">{Q.rotce}</div><div className="l">ROTCE</div></div>
        <div className="qc"><div className="v am">{Q.cet1}</div><div className="l">CET1</div></div>
      </div>
      <div className="qnote">Reported figures. TwinX theme values below are illustrative and per-theme — never summed (cohorts overlap).</div>

      {/* STRATEGIC MOTIONS — portfolio of decision-areas you're stewarding
          on the bank's behalf. Reframed from "Themes you can dive into"
          (too operational) to "Strategic motions in scope" — the cards
          name the strategic motion, not the tactical theme. Tactical
          chat-seed prompts removed; the question to ask is at the lens
          + question-strip below. */}
      <div className="bh">Strategic motions in scope</div>
      {CXO_THEMES.map((t) => (
        <a
          key={t.id}
          className={`dec dec-theme cat-${t.category}`}
          onClick={() => onAskTheme && onAskTheme(t)}
        >
          <div className="dr">
            <span className={`cat-pill cat-pill-${t.category}`}>{t.catLabel}</span>
            <span className="pr2">{t.lob}</span>
            {t.pinned && <span className="dec-pin">★ pinned</span>}
          </div>
          <div className="dt">{t.name}</div>
        </a>
      ))}

      <div className="bh">Three strategic priorities → TwinX</div>
      <div className="prio">
        <a className="prc" onClick={() => go("home")}>
          <div className="pt"><span className="pd" style={{ background: "var(--acq)" }} />Organic growth</div>
          <div className="pm">Life-event capture &amp; the affluent shift — addressing the <b>~100 bps fee-growth gap</b> the bank has named.</div>
        </a>
        <a className="prc" onClick={() => go("gig")}>
          <div className="pt"><span className="pd" style={{ background: "#b794f6" }} />Payments transformation</div>
          <div className="pm">Money-movement as the first, most-frequent engagement — the substrate under gig &amp; embedded payments.</div>
        </a>
        <a className="prc" onClick={() => go("elder")}>
          <div className="pt"><span className="pd" style={{ background: "var(--ret)" }} />Operational efficiency</div>
          <div className="pm">Decisions automated &amp; risk losses avoided — intelligence arbitrage behind the <b>{Q.eff}</b> efficiency ratio.</div>
        </a>
      </div>

      <div className="bh">Decision ledger · this week</div>
      {DECISIONS.map((d) => (
        <a key={d.theme} className={`dec ${d.st}`} onClick={() => go(d.theme)}>
          <div className="dr">
            <span className={`st ${d.st}`}>{d.st}</span>
            <span className="pr2">{d.pr}</span>
          </div>
          <div className="dt">{d.t}</div>
          <div className="dd">{d.d}</div>
          <div className={`dv ${d.vc}`}>{d.v}</div>
        </a>
      ))}
    </div>
  );
}

export default function Ceo() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => [{
    kind: "seed",
    node: (
      <>
        <div className="head">Good morning. The book is executing against all three priorities.</div>
        Latest quarter posted EPS <b>{Q.eps}</b> ({Q.epsg}), revenue <b>{Q.rev}</b>, fee income <b>{Q.fee}</b>, efficiency <b>{Q.eff}</b> on {Q.lev} of positive operating leverage. Against that, overnight the bank <span className="g">deployed two decisions</span>, put <span className="h">one into a controlled test</span>, and <span className="r">refused one</span> — each laddered to organic growth, payments, or efficiency. Push on capital allocation, the fee gap, or the downside scenarios.
        <div className="ev">
          <div className="evc src"><span className="vv">{Q.eps}</span><span className="ll">EPS {Q.epsg}</span><span className="th">Q1’26 disclosures</span></div>
          <div className="evc src"><span className="vv">{Q.dep}</span><span className="ll">avg deposits</span><span className="th">record consumer</span></div>
          <div className="evc gr"><span className="vv">2 / 1 / 1</span><span className="ll">deployed / test / refused</span><span className="th">TwinX</span></div>
        </div>
        <div className="trace"><span className="tk"><b>Q1 disclosures</b></span><span className="ar">+</span><span className="tk"><b>Cockpit</b> signals</span><span className="ar">→</span><span className="tk"><b>4 themes</b></span><span className="ar">→</span><span className="tk"><b>4 pipelines</b></span></div>
      </>
    ),
  }]);
  const [tracing, setTracing] = useState(false);
  const [lens, setLens] = useState("all");
  const [input, setInput] = useState("");
  const threadRef = useRef(null);
  /* Session-scoped record of which KB entries have been served. Lets the
     conversation actually progress — repeating the same query no longer
     returns the same canned response. */
  const [servedIds, setServedIds] = useState(() => new Set());
  /* Counter for unmatched queries — rotates through the FALLBACK_VARIANTS
     so the no-match stub doesn't fire verbatim every time. */
  const [fallbackCount, setFallbackCount] = useState(0);
  /* Lightweight history of recent user queries so the conversation can
     thread ("earlier you asked…"). Capped at 6 to keep the chip useful
     without becoming a wall of recall. */
  const [history, setHistory] = useState([]);

  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [messages, tracing]);

  const ask = (q) => {
    if (!q.trim()) return;
    setMessages((prev) => [...prev, { kind: "ceo", text: q }]);
    setHistory((prev) => [...prev.slice(-5), q]);
    setTracing(true);
    setTimeout(() => {
      setTracing(false);
      const entry = answer(q, servedIds, fallbackCount);
      if (entry && entry.id) {
        /* Real KB match — track as served. */
        setServedIds((prev) => {
          const next = new Set(prev);
          next.add(entry.id);
          return next;
        });
      } else if (entry && entry.fallback) {
        /* Unmatched query — advance the fallback rotation so the next
           unmatched query gets a different variant. */
        setFallbackCount((c) => c + 1);
      }
      setMessages((prev) => [...prev, { kind: "tx", entry }]);
    }, 850 + Math.random() * 350);
  };

  const onSend = () => { if (!input.trim()) return; const q = input; setInput(""); ask(q); };

  const followCta = (theme) => {
    if (!theme) { navigate("/"); return; }
    navigate(THEMEPAGE[theme]);
  };

  return (
    <PageShell>
    <div className="ceo-page">
      {/* Breadcrumb-only header. The in-page "Chairman & CEO" profile and
          the "Strategic companion · preparing for executive review" label
          were both removed — those were duplicate persona surfaces. The
          topbar row-1 persona pill is now the single source of truth for
          who's on this page and what altitude they're operating at. */}
      <div className="ceo-top ceo-top-crumb">
        <div className="lvlnav">
          <a className="cur">Executive Brief</a>
          <a onClick={() => navigate("/")}>Cockpit</a>
        </div>
        <div className="ceo-sp" />
      </div>
      <div className="ceo-main">
        <Brief onAskTheme={(t) => ask(t.seed)} />
        <div className="chatwrap">
          <div className="ch-h">
            <div className="t">Ask TwinX — strategic companion</div>
            <div className="s">Causal &amp; strategic questions, answered through four lenses — franchise · competitive · risk &amp; regulatory · capital — and traced to the live decision portfolio.</div>
          </div>
          <div className="thread-ceo" ref={threadRef}>
            {messages.map((m, i) => {
              if (m.kind === "ceo") {
                return (
                  <div key={i} className="msg ceo"><div className="av-x ce">GK</div><div className="bub">{m.text}</div></div>
                );
              }
              if (m.kind === "seed") {
                return (
                  <div key={i} className="msg tx"><div className="av-x tx">TX</div><div className="bub">{m.node}</div></div>
                );
              }
              const e = m.entry;
              const isFallback = e && e.fallback;
              return (
                <div key={i} className="msg tx">
                  <div className="av-x tx">TX</div>
                  <div className="bub">
                    {e && !isFallback ? (
                      <>
                        <span className={`lenstag ${e.lens}`}>{LENSNAME[e.lens]} lens</span>
                        {e.seenBefore && (
                          <div className="seen-before">
                            We covered this earlier. Same lens, fresh framing:
                          </div>
                        )}
                        <div className="head">{e.head}</div>
                        {e.body}
                        {e.ev && (
                          <div className="ev">
                            {e.ev.map((x, j) => (
                              <div key={j} className={`evc ${x.c}`}>
                                <span className="vv">{x.vv}</span><span className="ll">{x.ll}</span><span className="th">{x.th}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {e.trace && (
                          <div className="trace">
                            {e.trace.map((k, j) => (
                              <span key={j}>{j ? <span className="ar">→</span> : null}<span className="tk">{k}</span></span>
                            ))}
                          </div>
                        )}
                        {e.cta && <a className="cta" onClick={() => followCta(e.cta.theme)}>↳ {e.cta.t}</a>}
                        <FollowupChips entry={e} onAsk={ask} />
                      </>
                    ) : isFallback ? (
                      <>
                        <div className="head">{e.head}</div>
                        <div>{e.body}</div>
                        {e.picks && e.picks.length > 0 && (
                          <div className="fallback-picks">
                            {e.picks.map((p, j) => (
                              <span key={j} className="qchip" onClick={() => ask(p)}>{p}</span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="head">Let me trace that across the portfolio.</div>
                        Four lenses anchor the strategic conversation: <b>franchise, competitive, risk &amp; regulatory, capital</b>. Pick a lens below, or ask about the fee-growth gap, the deposit base, capital allocation, or what we chose <b>not</b> to do.
                        <FollowupChips entry={null} onAsk={ask} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {tracing && (
              <div className="msg tx">
                <div className="av-x tx">TX</div>
                <div className="bub"><div className="tracing-row"><span className="spin" /> Tracing — Q1 disclosures + cockpit signals → theme models → pipeline decisions…</div></div>
              </div>
            )}
          </div>
          <div className="composer-ceo">
            <div className="lenses">
              <span className="ll0">Lens</span>
              {["all", "FR", "CO", "RR", "CA"].map((k) => (
                <span key={k} className={`lensb ${lens === k ? "on" : ""}`} onClick={() => setLens(k)}>{LENS_LABELS[k]}</span>
              ))}
            </div>
            <div className="chips-ceo">
              {LENS_PICKS[lens].map((p) => (
                <span key={p} className="qchip" onClick={() => ask(p)}>{p}</span>
              ))}
            </div>
            <div className="inbar">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
                placeholder='Ask strategically — "if I had one more dollar to invest, where?"'
                autoComplete="off"
              />
              <button className="send-ceo" onClick={onSend}>↑</button>
            </div>
            <div className="seam-ceo">Grounded in Q1 2026 public disclosures &amp; stated strategic priorities. In production, the companion retrieves and cites live filings and approved research.</div>
          </div>
        </div>
      </div>
    </div>
    </PageShell>
  );
}

/* Follow-up chips — three per response, hand-curated by lens for the demo
   so each turn offers a believable drill / compare / brainstorm path. */
function FollowupChips({ entry, onAsk }) {
  const set = (entry && entry.lens && FOLLOWUPS_BY_LENS[entry.lens]) || FOLLOWUPS_DEFAULT;
  return (
    <div className="cxo-followups">
      {set.map((f, i) => (
        <button
          key={i}
          className={"cxo-followup cxo-followup-" + f.kind}
          onClick={() => onAsk(f.text)}
        >
          {f.text}
        </button>
      ))}
    </div>
  );
}
