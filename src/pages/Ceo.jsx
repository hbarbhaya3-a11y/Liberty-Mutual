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
  { id: "home",      name: "Bundle at home-purchase", lob: "Personal",   category: "acquisition", catLabel: "acquisition", seed: "How is bundle-at-home-purchase performing?",     pinned: false, recent: true  },
  { id: "wealth",    name: "Bundle white-space",      lob: "Personal",   category: "acquisition", catLabel: "acquisition", seed: "Show me the auto-only bundle white-space.",      pinned: false, recent: false },
  { id: "b2b",       name: "Commercial auto",         lob: "Commercial", category: "acquisition", catLabel: "acquisition", seed: "Where does the commercial-auto theme stand?",    pinned: false, recent: false },
  // RETENTION — defend the existing relationship from shopping or churn
  { id: "churn",     name: "Auto renewal retention",  lob: "Personal",   category: "retention",   catLabel: "retention",   seed: "What's our position on auto renewal retention?", pinned: true,  recent: true  },
  { id: "gig",       name: "Rideshare coverage gap",  lob: "Personal",   category: "retention",   catLabel: "retention",   seed: "What's happening in the rideshare coverage-gap theme?", pinned: true, recent: true },
  { id: "elder",     name: "Claims-experience save",  lob: "Personal",   category: "retention",   catLabel: "retention",   seed: "Tell me about claims-experience churn signals.", pinned: false, recent: true  },
  // DEEPENING — extract more value from existing relationships
  { id: "retire",    name: "Umbrella glidepath",      lob: "Personal",   category: "deepening",   catLabel: "deepening",   seed: "What did the umbrella cross-sell pilot tell us?", pinned: false, recent: false },
  { id: "wholesale", name: "Telematics pricing",      lob: "Personal",   category: "deepening",   catLabel: "deepening",   seed: "What is TwinX doing on telematics pricing?",     pinned: false, recent: false },
];

/* Contextual follow-ups — three per response: drill / compare / brainstorm.
   Maps the *lens* of the response, with overrides per theme where useful.
   These appear as chips after each assistant message, so the CXO can extend
   the conversation without typing. */
const FOLLOWUPS_BY_LENS = {
  FR: [
    { kind: "drill",      text: "Show me the NWP attribution behind this" },
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

const Q = { eps: "$2.14", epsg: "+12%", rev: "$11.2B", revg: "−6.4%", nii: "66.4%", fee: "+15–25%", dep: "~3M policies", nim: "82.2%", eff: "79.9%", lev: "−7.1 pt", rotce: "17%", cet1: "88.4%", assets: "$43B NWP" };
const LENSNAME = { FR: "Franchise", CO: "Competitive", RR: "Risk & Reg", CA: "Capital" };
const THEMEPAGE = { gig: "/gig-pipeline", elder: "/deep-pipeline?theme=elder", home: "/deep-pipeline?theme=home", churn: "/deep-pipeline?theme=churn" };

const DECISIONS = [
  { theme: "churn", st: "deployed", pr: "Retention · Growth",    t: "Precision renewal repricing", v: "+$19.3M NWP protected (illus.)",       vc: "gr", d: "High-LTV, claims-free auto customers shopping their renewal — held with a capped rate + retention offer. Fair-lending-cleared, combined-ratio floor within bound." },
  { theme: "elder", st: "deployed", pr: "Retention · Service",   t: "Claims-experience save play", v: "−30% claims-driven leakage · $6.7M protected", vc: "gr", d: "Long-cycle, low-NPS claims intercepted with a proactive save before renewal. Proven ethically via stepped-wedge — no customer denied service." },
  { theme: "home",  st: "test",     pr: "Bundle growth",         t: "Bundle attach at home-purchase", v: "+$87M bundle NWP (projected, illus.)", vc: "am", d: "Home-purchase window for auto-only households. Consent-aware test — bundle quote offered, suitability gated." },
  { theme: "gig",   st: "refused",  pr: "Loss discipline",       t: "Blanket rideshare acceptance", v: "$15M forgone — held",                 vc: "rd", d: "Tempting blanket-accept play refused at the gate: rideshare loss model drifting. Restraint logged for auditability." },
];

const KB = [
  // FRANCHISE
  { id: "deposit", lens: "FR", q: "How big is the book we're defending?", keys: ["book", "franchise", "base", "how big", "policies", "premium", "size of", "nwp"],
    head: `~${Q.dep} in force — with the best combined ratio in two decades (${Q.nim}).`,
    body: <>That book, running an <B2>82.2% combined ratio</B2>, is the engine — but auto retention has collapsed <B>7.1 points to 66.4%</B> and NWP contracted every quarter of 2025. TwinX treats the personal-lines book as one portfolio of defendable renewals: precision repricing holds the high-LTV shoppers, bundle-attach deepens single-line households, and the gig/rideshare gap is where we showed the discipline <I>not</I> to accept mis-rated risk.</>,
    ev: [{ c: "src", vv: Q.dep, ll: "policies in force", th: "Q1’26 disclosures" }, { c: "src", vv: Q.nim, ll: "combined ratio", th: "Q1’26 disclosures" }, { c: "gr", vv: "retention", ll: "auto + bundle", th: "TwinX" }],
    trace: ["Renewal signals", "Auto·Bundle·Claims", "NWP defended"], cta: { t: "See the cockpit", theme: null } },
  { id: "nii", lens: "FR", q: "How does TwinX move net written premium?", keys: ["nwp", "premium", "net written", "move nwp", "growth", "retention"],
    head: "By defending the renewal base and the retention that compounds it.",
    body: <>NWP fell <B2>6.4% year-over-year</B2> while Travelers grew — the whole gap is retention. The decision layer protects it: it holds high-LTV, claims-free customers shopping their renewal with a capped rate + retention offer, and it refuses mis-rated risk where accepting on a drifting loss model would erode margin. Retention NWP is the quiet, compounding lever beneath the combined-ratio headline.</>,
    ev: [{ c: "src", vv: Q.revg, ll: "NWP YoY", th: "Q1’26 disclosures" }, { c: "src", vv: Q.nim, ll: "combined ratio", th: "Q1’26 disclosures" }, { c: "gr", vv: "+$19.3M", ll: "auto retention (illus.)", th: "Churn" }],
    trace: ["Renewal signals", "Retention themes", "NWP"], cta: { t: "Retention pipeline", theme: "churn" } },
  { id: "retention", lens: "FR", q: "What's our biggest retention risk right now?", keys: ["retention", "risk", "losing", "lapse", "leave", "leaving", "biggest risk", "retain", "shopping"],
    head: "Two fronts that need opposite responses.",
    body: <><B>Fixable, and fixed:</B> high-LTV, claims-free customers shopping their renewal — the capped-rate + retention offer closed the bleed and held the relationship. <B>Held on purpose:</B> mis-rated rideshare risk tempting to blanket-accept, but the loss model is <R>drifting</R>, so accepting would be pricing on noise and a loss-ratio risk. Disciplined retention there means <H>watch, don't chase</H>.</>,
    ev: [{ c: "gr", vv: "+$19.3M", ll: "NWP protected", th: "Auto retention" }, { c: "rd", vv: "$15M", ll: "forgone — by design", th: "Rideshare" }, { c: "vi", vv: "portfolio", ll: "act + hold", th: "Strategy" }],
    trace: ["Renewal signals", "Retention themes", "deploy vs refuse"], cta: { t: "Open the portfolio", theme: "churn" } },
  { id: "donothing", lens: "FR", q: "What's the cost of inaction on the renewal-shopping signal?", keys: ["nothing", "do nothing", "inaction", "cost of", "ignore", "shopping", "fail", "failing", "lapse"],
    head: "A slow, quiet lapse of the most profitable cohort.",
    body: <>Each broad-brush rate action hits the best customers — low-loss, high-LTV, mature — uniformly, so they shop first and adverse selection concentrates churn in the profitable tail. The precision intervention held the renewal and turned it into a <H>bundle opening</H> — the same shopping signal that defended the auto policy now opens the home conversation.</>,
    ev: [{ c: "rd", vv: "adverse selection", ll: "if unfixed", th: "Renewal" }, { c: "gr", vv: "+$19.3M", ll: "NWP recovered", th: "Auto retention" }, { c: "vi", vv: "bundle", ll: "cross-sell opportunity", th: "Portfolio" }],
    trace: ["Renewal signals", "Retention", "deployed"], cta: { t: "Open the portfolio", theme: "churn" } },
  // COMPETITIVE
  { id: "feegap", lens: "CO", q: "How does TwinX close the bundle-penetration gap?", keys: ["bundle", "cross-sell", "gap", "lag", "lags", "penetration", "behind", "attach"],
    head: "By turning a renewal signal into a bundled household at the right moment.",
    body: <>Bundled households retain <B2>7.0 years vs 5.5</B2> for single-line — bundling is Mirza's #1 stated priority. TwinX feeds it two ways: <H>bundle-at-home-purchase</H> converts a property signal into an auto+home household, and the save moment surfaces the home/umbrella quote pre-filled from household data. The signal that retains is the same signal that cross-sells — expected <B>+15–25%</B> uplift at the renewal touchpoint.</>,
    ev: [{ c: "src", vv: Q.fee, ll: "cross-sell uplift", th: "TwinX est." }, { c: "am", vv: "+$87M", ll: "bundle NWP", th: "Home" }, { c: "vi", vv: "+18pp", ll: "attach", th: "Home" }],
    trace: ["Home-purchase + renewal signals", "Home", "bundle + retention"], cta: { t: "Bundle pipeline", theme: "home" } },
  { id: "payments", lens: "CO", q: "How does this support the digital-experience transformation?", keys: ["digital", "experience", "transformation", "contentsquare", "portal", "app", "channel"],
    head: "Digital engagement is the earliest churn tell — the decision layer makes it intelligent.",
    body: <>Engagement drop is the first shopping signal, 30–45 days ahead of a competitor quote. The decision layer sits on that ContentSquare substrate: it senses when a high-LTV household is cooling and intervenes per-customer through the preferred channel — app for digital-first, Comparion agent for relationship-first — rather than a batch email blast. The proof point is a renewal-shopping problem solved as a <B2>real-time next-best-action</B2>, not a static campaign.</>,
    ev: [{ c: "bl", vv: "channels", ll: "app·email·SMS·agent", th: "Channel Twin" }, { c: "gr", vv: "+$19.3M", ll: "NWP recovered", th: "Auto retention" }, { c: "vi", vv: "NBA", ll: "per-customer", th: "Strategy" }],
    trace: ["Engagement signals", "Decision layer", "NBA substrate"], cta: { t: "Open the portfolio", theme: "churn" } },
  { id: "affluent", lens: "CO", q: "We want to defend high-value households — does TwinX help?", keys: ["affluent", "high-value", "shift", "premium", "high ltv", "wealthy", "loyal"],
    head: "Directly — it finds the high-value moment and the high-value risk.",
    body: <>Two themes target the tier. <H>Bundle-at-home-purchase</H> meets high-value households at a property event with a pre-filled bundle quote. And auto retention is a <I>high-LTV</I> question: who is genuinely price-elastic versus operationally loyal (deeply bundled, auto-pay). TwinX gives the strategy a decision layer, not just a segment label — and it gates the offer on fair-lending so the differential-pricing stays compliant.</>,
    ev: [{ c: "am", vv: "+$87M", ll: "bundle growth", th: "Home" }, { c: "vi", vv: "25%", ll: "attach", th: "Home" }, { c: "rd", vv: "held", ll: "loyalty discipline", th: "Rideshare" }],
    trace: ["Household signals", "Home + Retention", "high-value capture"], cta: { t: "Bundle pipeline", theme: "home" } },
  { id: "giglimit", lens: "CO", q: "Could we accept rideshare risk broadly to capture more premium?", keys: ["what if", "accept", "rideshare", "limit", "limits", "all gig", "broaden", "everyone", "blanket"],
    head: "Past a point it backfires — the loss guardrail is the constraint, not the appetite.",
    body: <>Acting on a <B2>verified rideshare-endorsement need</B2> is safe and valuable. A blanket accept without the loss filter opens a real adverse-selection surface — the loss-ratio CI crosses the floor and the governance gate <R>hard-kills</R> it. The strategic answer isn't 'more acceptance'; it's 'more underwriting signal per unit of premium'. The decision layer rides that trade-off transparently.</>,
    ev: [{ c: "gr", vv: "+premium", ll: "with loss filter", th: "Rideshare" }, { c: "rd", vv: "breach", ll: "blanket, no filter", th: "Rideshare" }, { c: "bl", vv: "trade-off", ll: "signal × premium", th: "Strategy" }],
    trace: ["Rideshare", "Decision gate", "loss guardrail"], cta: { t: "Open the portfolio", theme: "gig" } },
  { id: "fintech", lens: "CO", q: "What if Progressive out-prices us on telematics?", keys: ["progressive", "geico", "compete", "competitor", "out-price", "out-prices", "telematics", "snapshot", "challenger"],
    head: "We don't win on price alone — we win on the intelligence layer over the renewal.",
    body: <>A competitor can match a headline rate on a single quote. What they can't easily match is a carrier that <B>knows, per household, when to cap, hold, or bundle</B> — and does it inside the relationship, with the tenure and the claims history already there. TwinX is that decision layer: the same shopping signal becomes retention, telematics enrollment and cross-sell at once. Price is a feature; the decided relationship is the moat.</>,
    ev: [{ c: "bl", vv: "substrate", ll: "renewal decisioning", th: "TwinX" }, { c: "gr", vv: "retention", ll: "auto", th: "Churn" }, { c: "vi", vv: "bundle", ll: "cross-sell", th: "Portfolio" }],
    trace: ["Competitive signals", "Themes", "decision moat"], cta: null },
  { id: "growth", lens: "CO", q: "Where is the growth coming from?", keys: ["growth", "acquisition", "grow", "bundle", "new business", "upside", "where", "expand", "life event", "life-event", "organic"],
    head: "Life events — the windows where a household re-decides its coverage.",
    body: <>A home purchase opens a <B2>bundle window</B2>: meet it with a pre-filled quote and we win the household — projected <H>+$87M</H> bundle NWP, +18pp attach, 25% cross-sell capture. It's in a consent-aware test because a bundle offer is a recommendation — we offer, not force. That discipline is what lets growth scale without a market-conduct finding.</>,
    ev: [{ c: "am", vv: "+$87M", ll: "bundle NWP", th: "Home" }, { c: "vi", vv: "+18pp", ll: "attach", th: "Home" }, { c: "vi", vv: "25%", ll: "cross-sell", th: "Home" }],
    trace: ["Home-purchase signals", "Home", "consent-aware test"], cta: { t: "Bundle pipeline", theme: "home" } },
  // RISK & REG
  { id: "cro", lens: "RR", q: "What keeps the Chief Actuary comfortable with this?", keys: ["cro", "actuary", "chief actuary", "comfortable", "governance", "control", "oversight", "second line", "compliance"],
    head: "Every decision clears a gate with pre-registered teeth — or it doesn't ship.",
    body: <>TwinX never deploys on confidence; it deploys on a <B>governance gate</B> wired to the constraint that matters per theme — fair-lending / disparate-impact, model drift, combined-ratio floor, loss-ratio ceiling, DOI filing status, NAIC Model Bulletin 24-08 auditability. The gate <R>branches on the real result</R>: auto retention clears on fair-lending, claims-save enforces a customer-harm ceiling, rideshare was <R>refused</R> on loss drift. The second line sees the same matrix the system does.</>,
    ev: [{ c: "gr", vv: "gate", ll: "NAIC 24-08 logged", th: "All" }, { c: "rd", vv: "refused", ll: "rideshare drift", th: "Rideshare" }, { c: "am", vv: "ceiling", ll: "claims harm guard", th: "Claims" }],
    trace: ["Theme constraints", "Governance gate", "clear or kill"], cta: { t: "See a refusal", theme: "gig" } },
  { id: "elder", lens: "RR", q: "How does claims experience drive retention?", keys: ["elder", "claims", "claim", "experience", "nps", "settlement", "save", "service", "cycle"],
    head: "A smooth claim renews; a poor one lapses — we intercept the poor experience early.",
    body: <>A long-cycle, low-NPS claim is <B>flagged</B> for a proactive save before renewal — cutting claims-driven leakage ~30%. The hard part was proving it fairly: you <B>cannot</B> withhold service from a random control of claimants. So we used a <H>stepped-wedge</H> — every cohort gets the intervention, only the timing is randomised. The guardrail is <I>inverted</I>: the risk we watch is <R>over-contacting</R> a customer mid-claim (the anti-recommendation: don't push cross-sell during a claim call).</>,
    ev: [{ c: "gr", vv: "−30%", ll: "claims leakage", th: "Claims" }, { c: "gr", vv: "$6.7M", ll: "NWP protected", th: "Claims" }, { c: "am", vv: "ceiling", ll: "harm guardrail", th: "Claims" }],
    trace: ["Claims + NPS signals", "Claims", "stepped-wedge"], cta: { t: "Claims pipeline", theme: "elder" } },
  { id: "churnwhy", lens: "RR", q: "Why aren't we accepting the rideshare risk broadly?", keys: ["why not", "accept", "rideshare", "broad", "gig", "loss", "refuse", "refused", "drift", "hold", "not act"],
    head: "The loss model is drifting — and accepting on a drifting model is pricing on noise.",
    body: <>$15M of premium looks attractive, but rideshare loss behaviour is shifting faster than the model can track (<R>rideshare_loss_drift</R>). Accept on that and we'd mis-rate genuine risk <I>and</I> create adverse-selection exposure. The gate <R>refused</R> it; Model Risk can't sign off. That refusal is the system working — and a defensible decision the carrier can stand behind.</>,
    ev: [{ c: "rd", vv: "drift", ll: "rideshare_loss_drift", th: "Rideshare" }, { c: "rd", vv: "refused", ll: "Model Risk", th: "Rideshare" }, { c: "am", vv: "$15M", ll: "forgone by design", th: "Rideshare" }],
    trace: ["Rideshare signals", "Gate", "gate refuses"], cta: { t: "See the refusal", theme: "gig" } },
  { id: "notdoing", lens: "RR", q: "What are we deliberately choosing NOT to do?", keys: ["not doing", "not do", "restraint", "avoid", "discipline", "hold back", "choosing not", "walk away", "deliberately"],
    head: "We're holding the blanket rideshare acceptance — on purpose.",
    body: <>The most valuable thing a decision system can do is sometimes <B>nothing</B>. A ~$15M acceptance play was <R>refused</R> on loss drift. Acting would have looked good this quarter and cost us in mis-rated risk and loss-ratio exposure. Logging that restraint — auditable, with Model Risk unable to sign off — is a risk-adjusted decision, not a missed one. The carrier that knows when not to act can be trusted to act fast when it should.</>,
    ev: [{ c: "rd", vv: "refused", ll: "rideshare accept", th: "Rideshare" }, { c: "rd", vv: "drift", ll: "model unstable", th: "Rideshare" }, { c: "gr", vv: "protected", ll: "loss ratio + fairness", th: "Portfolio" }],
    trace: ["Rideshare", "gate", "restraint logged"], cta: { t: "See the refusal", theme: "gig" } },
  { id: "fairness", lens: "RR", q: "Is the differential renewal offer a fair-lending risk?", keys: ["fair", "fairness", "disparate", "protected class", "proxy", "bias", "discrimination", "fair lending", "fair-lending", "naic", "24-08", "lending risk"],
    head: "Fairness is the first thing the governance gate tests — pre-registered.",
    body: <>An offer that helps some customers and not others is a differential-treatment question, and tenure or credit signals can proxy a protected class. So the gate is pre-registered against <B>disparate impact</B> under NAIC Model Bulletin 24-08: the elasticity model must be the audited evidence that targeted customers are genuinely price-elastic, not loyal households priced away. Every score is logged per-policy before deployment. The intervention cleared that bar; if it hadn't, the gate would have hard-killed it.</>,
    ev: [{ c: "gr", vv: "pre-registered", ll: "disparate-impact test", th: "Governance" }, { c: "gr", vv: "audited basis", ll: "elasticity evidence", th: "Fair-lending" }, { c: "am", vv: "NAIC 24-08", ll: "per-policy logged", th: "Compliance" }],
    trace: ["Renewal offer", "Governance gate", "fairness tooth"], cta: { t: "Open the portfolio", theme: "churn" } },
  // CAPITAL & EFFICIENCY
  { id: "efficiency", lens: "CA", q: "How does this help the combined ratio?", keys: ["combined ratio", "cr", "efficiency", "loss ratio", "expense", "cost", "productivity", "cost-to-serve"],
    head: "It compounds the underwriting discipline you're already posting.",
    body: <>The combined ratio hit <B2>82.2%</B2> (underlying <B>79.9%</B>) — best in two decades. TwinX protects it while restoring growth: precision retention concentrates saves in high-LTV/low-loss segments, selective non-renewal improves the loss ratio, and CAC avoidance (each retained policy skips a $200–800 replacement) takes cost out. Net effect: <B2>0.8–2.2 pts</B2> sustained CR improvement without sacrificing the profit fix.</>,
    ev: [{ c: "src", vv: Q.nim, ll: "combined ratio", th: "Q1’26 disclosures" }, { c: "src", vv: Q.eff, ll: "underlying CR", th: "Q1’26 disclosures" }, { c: "gr", vv: "CAC-avoided", ll: "retention", th: "TwinX" }],
    trace: ["Precision retention", "All themes", "combined ratio ↓"], cta: null },
  { id: "onedollar", lens: "CA", q: "If I had one more dollar to invest, where would it go?", keys: ["one more dollar", "invest", "where", "allocate", "capital", "prioritize", "priority", "best return", "roi"],
    head: "Lead with retention, then bundle — highest risk-adjusted return first.",
    body: <>On a risk-adjusted basis the first dollar goes to <H>precision auto retention</H>: a single owner (Retention Ops), $19.3M NWP protected plus CAC avoided, and the fair-lending teeth that make the whole portfolio credible to the second line. The second goes to <H>bundle-at-home-purchase</H> — the clearest cross-sell and 7.0-yr-tenure play, gated on suitability. Blanket rideshare acceptance earns <I>negative</I> investment right now: the disciplined move is to hold until the loss model re-stabilises.</>,
    ev: [{ c: "gr", vv: "1st", ll: "auto · NWP + teeth", th: "Churn" }, { c: "am", vv: "2nd", ll: "home · bundle", th: "Home" }, { c: "rd", vv: "hold", ll: "rideshare · drift", th: "Rideshare" }],
    trace: ["Value × feasibility", "Portfolio", "allocation"], cta: { t: "Retention pipeline", theme: "churn" } },
  { id: "buildbuy", lens: "CA", q: "Should we build this capability or buy it?", keys: ["build", "buy", "build or buy", "make or buy", "acquire", "vendor", "in-house", "platform"],
    head: "Neither replaces your estate — TwinX orchestrates it.",
    body: <>USRM already runs PL QUOTE EDW, AM-ECLIQ, NAVIGATOR, CSW, eService, Mercury and ContentSquare, plus ~50 point-AI use cases. TwinX is the <B>decision layer over</B> those systems, not a rip-and-replace — it senses, simulates, gates and deploys across them via non-intrusive APIs, and writes back. The build-vs-buy question becomes 'who orchestrates', and the answer is a thin, governable layer that makes the estate you already own act in concert — riding the USRM vendor-consolidation mandate.</>,
    ev: [{ c: "bl", vv: "orchestrate", ll: "existing estate", th: "TwinX" }, { c: "vi", vv: "non-intrusive", ll: "API overlay", th: "Strategy" }, { c: "gr", vv: "governable", ll: "thin layer", th: "TwinX" }],
    trace: ["Existing estate", "TwinX layer", "orchestration"], cta: null },
  { id: "priorities", lens: "CA", q: "How does TwinX ladder to USRM's priorities?", keys: ["priorities", "strategic priorities", "ladder", "map", "mirza", "sweeney", "tie to strategy", "strategy"],
    head: "Cleanly — every theme sits under a named priority.",
    body: <><B>Regain growth:</B> precision retention + bundle-attach, aimed squarely at the NWP contraction. <B>Boost retention & bundling:</B> Mirza's #1 priority — the retention loop and the 7.0-yr bundled household. <B>Data/AI at scale:</B> automated, governed decisions behind the <B2>82.2%</B2> combined ratio. TwinX isn't a side project; it's the execution layer for the 'fixing → building' mandate already on the page.</>,
    ev: [{ c: "am", vv: "growth", ll: "bundle", th: "Home" }, { c: "vi", vv: "retention", ll: "auto", th: "Churn" }, { c: "gr", vv: "CR held", ll: "all", th: "Portfolio" }],
    trace: ["USRM priorities", "themes", "one strategy"], cta: null },
  { id: "urgency", lens: "CA", q: "How does this support executing with urgency and consistency?", keys: ["urgency", "consistency", "execute", "execution", "speed", "pace", "faster", "cadence"],
    head: "It collapses the decision cycle from a rate cycle to a daily loop.",
    body: <>Today profitability analytics lag 60–90 days and correction waits for the next rate cycle. TwinX is the mechanism: sense → simulate → gate → test → deploy → learn, run <B2>every day</B2>, with governance built in so speed doesn't cost control. Consistency comes from the gate — the same teeth, every decision, auditable — so 'fast' and 'compliant' stop being a trade-off.</>,
    ev: [{ c: "bl", vv: "daily", ll: "decision loop", th: "TwinX" }, { c: "gr", vv: "gate", ll: "consistent teeth", th: "All" }, { c: "am", vv: "auditable", ll: "NAIC 24-08", th: "All" }],
    trace: ["Sense→…→Learn", "run daily", "urgency + control"], cta: null },
  { id: "downside", lens: "CA", q: "What's the downside scenario if a decision is wrong?", keys: ["downside", "wrong", "risk scenario", "fail", "what could go wrong", "blow up", "worst case", "rollback"],
    head: "Bounded by design — small blast radius, fast reversal, and a gate that prefers 'no'.",
    body: <>Three protections. Decisions are <B>tested before scale</B> (holdout, stepped-wedge, or consent-aware), so a wrong call shows up small. Deployment carries <B2>one-click rollback</B2> with auto-trigger on drift. And the gate is biased toward restraint — it would rather <R>refuse</R> a good-looking play (rideshare) than ship an unsafe one. The downside of TwinX is a forgone gain, logged and recoverable — not an unbounded loss.</>,
    ev: [{ c: "gr", vv: "tested", ll: "before scale", th: "All" }, { c: "bl", vv: "1-click", ll: "rollback on drift", th: "All" }, { c: "rd", vv: "refuses", ll: "when unsafe", th: "Rideshare" }],
    trace: ["Scenario", "Gate", "rollback"], cta: null },
  // PORTFOLIO / BOARD
  { id: "week", lens: "CA", q: "What did we decide this week — and why?", keys: ["decide", "decision", "this week", "summary", "what did", "happened", "overview", "update", "recap"],
    head: "Four decisions — two acted, one testing, one refused.",
    body: <>The pattern is the point: the carrier chose <B>where not to act</B>. We <G>deployed</G> precision auto renewal repricing (retention/growth) and a claims-experience save play (retention/service), put bundle-at-home-purchase into a <H>consent-aware test</H> (bundle growth), and <R>refused</R> blanket rideshare acceptance on loss drift. Each laddered to a named USRM priority and cleared — or failed — a governance gate before anyone acted.</>,
    ev: [{ c: "gr", vv: "+$19.3M", ll: "auto", th: "Churn" }, { c: "gr", vv: "−30%", ll: "claims", th: "Claims" }, { c: "am", vv: "+$87M", ll: "home (test)", th: "Home" }, { c: "rd", vv: "held", ll: "rideshare", th: "Rideshare" }],
    trace: ["Cockpit · clusters", "themes", "pipelines"], cta: null },
  { id: "board", lens: "CA", q: "What will the board ask about this?", keys: ["board", "directors", "audit committee", "what will they ask", "governance question", "oversight question"],
    head: "Growth, combined ratio, risk, capital — and TwinX answers all four in one frame.",
    body: <>Expect four questions. <B>Growth:</B> does it restore NWP and bundling? (retention + bundle-attach). <B>Combined ratio:</B> does it hold the profit fix? (precision saves, selective non-renewal). <B>Risk:</B> is the second line comfortable? (pre-registered gate teeth, NAIC 24-08). <B>Capital:</B> is it a contained, reversible bet? (tested before scale, one-click rollback, gate prefers 'no'). The unusual answer the board will remember is the <R>refusal</R> — proof the system has judgement.</>,
    ev: [{ c: "am", vv: "growth", ll: "bundle", th: "Home" }, { c: "gr", vv: "CR held", ll: "82.2%", th: "Portfolio" }, { c: "rd", vv: "restraint", ll: "rideshare refused", th: "Rideshare" }],
    trace: ["Board lenses", "Portfolio", "one frame"], cta: null },
  { id: "inflight", lens: "CA", q: "Show me everything in flight.", keys: ["in flight", "inflight", "everything", "status", "running", "active", "whats happening", "show me", "portfolio"],
    head: "Four themes, four states — acted, acted, testing, held.",
    body: <><B>Auto retention</B> deployed (NWP secured). <B>Claims-experience save</B> deployed via stepped-wedge (leakage cut). <B>Bundle-at-home-purchase</B> in consent-aware test (growth pending suitability evidence). <B>Rideshare acceptance</B> refused on loss drift (held for re-stabilisation). The decision ledger on the left is live — click any decision to drop into its pipeline and see the full sense→deploy trace.</>,
    ev: [{ c: "gr", vv: "deployed", ll: "auto + claims", th: "2 themes" }, { c: "am", vv: "in test", ll: "home", th: "1 theme" }, { c: "rd", vv: "refused", ll: "rideshare", th: "1 theme" }],
    trace: ["Cockpit", "themes", "pipelines"], cta: null },
];

const TOPIC_TAGS = ["auto", "claims", "renewal", "home", "rideshare", "rate", "bundle", "growth", "limit", "book", "cross-sell", "digital", "combined ratio", "fairness", "board", "capital", "invest"];

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
  if (/home|life.event|bundle|property|attach|purchase/.test(qLow)) return "home";
  if (/churn|repric|rate.sensitive|drift|aggregator/.test(qLow)) return "churn";
  if (/cost|efficiency|operating|ratio|expense/.test(qLow)) return "efficiency";
  if (/board|director|audit|governance|second.line/.test(qLow)) return "board";
  if (/capital|allocate|invest|cet1|rotce/.test(qLow)) return "capital";
  if (/bundle|growth|book|combined|nwp|premium/.test(qLow)) return "franchise";
  return "generic";
}

/* Fallback variants per topic. Each is a {head, body, picks} object — the
   chat surfaces these when no KB entry matches. Picks become clickable
   chips that steer the user toward a real KB entry. */
const FALLBACK_VARIANTS = {
  gig: [
    {
      head: "I have three angles on this — pick the one that's closest:",
      body: <>The renewal-repricing intervention can be read as <b>retention</b> (defending high-LTV renewals), as <b>fairness</b> (the disparate-impact audit that gated it), or as <b>bundle strategy</b> (the cross-sell it opens).</>,
      picks: [
        "What's our biggest retention risk right now?",
        "Is the differential renewal offer a fair-lending risk?",
        "How does this support the payments transformation?",
      ],
    },
    {
      head: "Same theme, different lens — which one's useful?",
      body: <>I can frame this as <b>cost of inaction</b> (what happens if we don't fix the bleed), or as a <b>governance</b> question (how the gate cleared it), or as <b>capital allocation</b> (is the dollar best spent here vs. elsewhere).</>,
      picks: [
        "What's the cost of inaction on the unmet payment-friction signal?",
        "What keeps the Chief Actuary comfortable with this?",
        "If I had one more dollar to invest, where would it go?",
      ],
    },
  ],
  elder: [
    {
      head: "The claims play has two sides — which lens matters?",
      body: <>Its a <b>leakage-prevention</b> result on the book side and a <b>duty-of-care + ethics</b> question on the risk side — the stepped-wedge design is what made it deployable.</>,
      picks: [
        "How does claims experience drive retention?",
        "What keeps the Chief Actuary comfortable with this?",
      ],
    },
  ],
  home: [
    {
      head: "Life-event capture is the growth lever — what angle?",
      body: <>I can speak to the <b>bundle-gap closure</b>, the <b>home-purchase bundle window</b>, or the <b>NAIC 24-08</b> guardrails the test is registered against.</>,
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
        "Why arent we accepting the rideshare risk broadly?",
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
        "How does this help the combined ratio?",
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
      body: <>I can speak to the <b>book</b> were defending, how the decision layer moves <b>NWP</b>, or what closes the <b>bundle-penetration gap</b> USRM has named.</>,
      picks: [
        "How big is the book were defending?",
        "How does this move net written premium?",
        "Our fee growth lags the industry — how does this close that gap?",
      ],
    },
  ],
  generic: [
    {
      head: "Help me steer — which lens are we using?",
      body: <>Four lenses anchor this: <b>franchise</b>, <b>competitive</b>, <b>risk & regulatory</b>, <b>capital</b>. Pick one or push on the book, bundle gap, or what we chose <b>not</b> to do.</>,
      picks: [
        "What did we decide this week — and why?",
        "If I had one more dollar to invest, where?",
        "What are we deliberately NOT doing?",
      ],
    },
    {
      head: "Give me a hook and I can ladder to a strategic priority.",
      body: <>Try a theme (auto retention, claims-experience save, bundle-at-home-purchase, rideshare gap) or a number (policies, NWP, combined ratio, bundle rate). I'll trace it to the decision portfolio.</>,
      picks: [
        "What's our biggest retention risk right now?",
        "Where is the growth coming from?",
        "How does this help the combined ratio?",
      ],
    },
    {
      head: "Not catching that — try one of these.",
      body: <>The most useful starting points are usually around <b>retention</b>, <b>growth</b>, or <b>restraint</b>.</>,
      picks: [
        "What keeps the Chief Actuary comfortable with this?",
        "What will the board ask about this?",
        "What's the downside scenario if a decision is wrong?",
      ],
    },
  ],
};

const LENS_PICKS = {
  all: ["What did we decide this week — and why?", "If I had one more dollar to invest, where?", "Our fee growth lags the industry — how does TwinX close it?", "What are we deliberately NOT doing?"],
  FR: ["How big is the book were defending?", "What's our biggest retention risk right now?", "How does TwinX move net written premium?"],
  CO: ["Our fee growth lags the industry — how does TwinX close it?", "How does this support the payments transformation?", "We're shifting toward affluent customers — does TwinX help?", "Where is the growth coming from?"],
  RR: ["What keeps the Chief Actuary comfortable with this?", "Why arent we accepting rideshare risk broadly?", "Is the differential renewal offer a fair-lending risk?", "How does claims experience drive retention?"],
  CA: ["If I had one more dollar to invest, where?", "How does this help the combined ratio?", "Should we build this capability or buy it?", "What's the downside scenario if a decision is wrong?", "What will the board ask about this?"],
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
        <div className="qc"><div className="v gr">{Q.nii}</div><div className="l">auto retention</div></div>
        <div className="qc"><div className="v bl">{Q.fee}</div><div className="l">cross-sell uplift</div></div>
        <div className="qc"><div className="v am">{Q.eff}</div><div className="l">efficiency</div></div>
        <div className="qc"><div className="v bl">{Q.dep}</div><div className="l">policies in force</div></div>
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
          <div className="pm">Digital engagement as the earliest churn tell — the substrate under retention &amp; bundle NBAs.</div>
        </a>
        <a className="prc" onClick={() => go("elder")}>
          <div className="pt"><span className="pd" style={{ background: "var(--ret)" }} />Operational efficiency</div>
          <div className="pm">Decisions automated &amp; selective non-renewal — precision behind the <b>{Q.nim}</b> combined ratio.</div>
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
        Latest quarter posted a <b>{Q.nim}</b> combined ratio (best in two decades) — but NWP fell <b>{Q.revg}</b> and auto retention collapsed <b>{Q.lev}</b> to <b>{Q.nii}</b>. Against that, overnight the carrier <span className="g">deployed two decisions</span>, put <span className="h">one into a controlled test</span>, and <span className="r">refused one</span> — each laddered to regain-growth, boost-retention-&-bundling, or loss discipline. Push on capital allocation, the bundle gap, or the downside scenarios.
        <div className="ev">
          <div className="evc src"><span className="vv">{Q.eps}</span><span className="ll">EPS {Q.epsg}</span><span className="th">Q1’26 disclosures</span></div>
          <div className="evc src"><span className="vv">{Q.dep}</span><span className="ll">policies in force</span><span className="th">USRM book</span></div>
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
                        Four lenses anchor the strategic conversation: <b>franchise, competitive, risk &amp; regulatory, capital</b>. Pick a lens below, or ask about the bundle-penetration gap, the book, capital allocation, or what we chose <b>not</b> to do.
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
