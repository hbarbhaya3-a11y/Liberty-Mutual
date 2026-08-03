/* ============================================================================
   SmbRateFlowView — SECOND B2B signal (Small Commercial · new LEAD).
   Guided lead/RFP-level new-business simulation wizard.

   Flow (3 steps + running interstitial):
     1. Signal Details    — lead, competitor pitch intel, TwinX lead insights
     2. Goals, Guardrails & Levers — objective + guardrails + full lever set
     ⟳  Simulating…       — running/loading interstitial (as in the normal flow)
     3. Intelligence      — simulation results + recommendation + all 3
                            account-intelligence workbenches
   ========================================================================= */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RangeWithBubble from "@/components/RangeWithBubble";
import "@/styles/commercial-intel.css";
import "@/styles/ifwhat.css";

const money = (n) => (n >= 1000 ? "$" + Math.round(n / 1000) + "K" : "$" + Math.round(n));

/* new-business leads under decision (pick one in the wizard) */
const LEADS = [
  {
    id: "harborview", account: "Harborview Property Mgmt", industry: "Commercial real estate · property mgmt",
    classCode: "BOP 65112", state: "FL", revenue: "$7.4M", estPremium: 168000, source: "Lockton — submitted 2 days ago",
    lines: "BOP + GL + Umbrella", leadIn: "quote due in 4 days",
    signal: "Broker submission · shopping 3 carriers · expanding to a 2nd location · no adverse loss history",
    competitor: { n: "biBERK", offer: 154000 }, indicated: 6.0, leadScore: 0.74,
    segment: "Mid-Market", lossRatio: 61, status: "ready",
    pitches: [
      { n: "biBERK", price: 154000, angle: "Aggressive digital price · minimal risk-engineering · fast bind" },
      { n: "Next Insurance", price: 161000, angle: "Instant online quote · bundled GL+BOP · thin service model" },
      { n: "Hiscox", price: 166000, angle: "Property specialist · higher limits · broker-friendly terms" },
    ],
    insights: [
      "Expansion to a 2nd location → growth account; multi-year value is high",
      "Clean 3-yr loss history → auto-quote eligible; price to win",
      "Broker Lockton (Elite) values speed + certainty over last-dollar price",
      "Cross-line white space: Umbrella + Cyber attach likely",
    ],
  },
  {
    id: "summit", account: "Summit Precision Machining", industry: "Metal machining · manufacturing",
    classCode: "WC 3632", state: "OH", revenue: "$11.2M", estPremium: 94000, source: "USI — submitted 5 days ago",
    lines: "Workers Comp + GL", leadIn: "quote due in 1 day",
    signal: "New submission · payroll +14% · mod factor improving · leaving prior carrier on service",
    competitor: { n: "Next Insurance", offer: 88000 }, indicated: 4.5, leadScore: 0.66,
    segment: "Mid-Market", lossRatio: 58, status: "negotiating",
    pitches: [
      { n: "Next Insurance", price: 88000, angle: "Digital WC · fast turnaround · limited class expertise" },
      { n: "biBERK", price: 91000, angle: "Low price · standard package · minimal loss control" },
      { n: "Travelers", price: 97000, angle: "Deep WC class expertise · safety programs · premium price" },
    ],
    insights: [
      "Improving mod factor → risk trending favorable; price competitively",
      "Payroll +14% raises WC exposure and the premium base",
      "Leaving prior carrier on service → service + risk-control is the wedge",
      "USI broker moderately price-sensitive; a safety credit is the lever",
    ],
  },
  {
    id: "delmar", account: "Del Mar Coastal Eatery Group", industry: "Restaurant · multi-unit hospitality",
    classCode: "BOP 16900", state: "CA", revenue: "$5.1M", estPremium: 61000, source: "Comparion — submitted today",
    lines: "BOP + Liquor Liability", leadIn: "quote due in 6 days",
    signal: "New submission · rate-shopping 3 carriers · 2 prior slip-fall claims · appetite-boundary risk",
    competitor: { n: "Hiscox", offer: 66000 }, indicated: 9.0, leadScore: 0.48,
    segment: "Small Group", lossRatio: 79, status: "at-risk",
    pitches: [
      { n: "Hiscox", price: 66000, angle: "Hospitality specialist · liquor liability included · mid price" },
      { n: "biBERK", price: 69000, angle: "Cheap BOP · may exclude liquor liability · thin coverage" },
      { n: "Next Insurance", price: 71000, angle: "Fast digital · limited restaurant appetite · higher price" },
    ],
    insights: [
      "2 prior slip-fall claims + 0.79 LR → appetite-boundary; price for adequacy",
      "Rate-shopping 3 carriers → high elasticity, but don't chase below the floor",
      "Liquor liability is the differentiator vs cheap BOP-only competitors",
      "Condition the quote on a slip-fall risk-control program",
    ],
  },
];

/* new-business levers */
const OFFERS = [
  { id: "none", label: "Standard package" },
  { id: "loyalty", label: "New-account onboarding credit", boost: 5 },
  { id: "multiyear", label: "Multi-year rate lock (2-yr)", boost: 9 },
];
const NONPRICE = [
  { id: "riskctrl", label: "Risk-control services", boost: 4 },
  { id: "safety", label: "Safety / loss-prevention program", boost: 3 },
];
const CROSS = [
  { id: "none", label: "Lead line only" },
  { id: "cyber", label: "Bundle Cyber", nwp: 9000 },
  { id: "wc", label: "Bundle Workers Comp", nwp: 22000 },
];
const PACKAGING = [
  { id: "standard", label: "Standard limits", boost: 0 },
  { id: "enhanced", label: "Enhanced limits", boost: 2 },
  { id: "broad", label: "Broad-form / higher limits", boost: 3 },
];
const TURNAROUND = [
  { id: "same", label: "Same-day", boost: 4 },
  { id: "3day", label: "3-day", boost: 2 },
  { id: "std", label: "Standard (5-7d)", boost: 0 },
];
const CHANNELS = [
  { id: "broker", label: "Broker / Agent" },
  { id: "digital", label: "Direct digital instant-quote" },
  { id: "referral", label: "Referral underwriter" },
];

/* bind probability vs quote price (% vs filed rate) — anchor interpolation */
const BIND_ANCHORS = [[-5, 90], [0, 78], [3, 68], [8, 50], [12, 34]];
function interp(anchors, x) {
  if (x <= anchors[0][0]) return anchors[0][1];
  if (x >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];
  for (let i = 1; i < anchors.length; i++) {
    const [x0, y0] = anchors[i - 1], [x1, y1] = anchors[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return anchors[anchors.length - 1][1];
}

function Steps({ step, setStep }) {
  const labels = ["Signal Details", "Goals, Guardrails & Levers", "Intelligence"];
  return (
    <div className="ci-flow">
      {labels.map((l, i) => (
        <button key={l} className={"ci-flow-step" + (i + 1 === step ? " on" : "")}
          onClick={() => setStep(i + 1)} disabled={i + 1 > step}>
          <span className="ci-flow-n">{i + 1}</span>{l}
        </button>
      ))}
    </div>
  );
}

/* running / loading interstitial — mirrors the normal simulate flow */
function RunLoader() {
  const msgs = [
    "Pulling submission + loss history…",
    "Scoring appetite & rate adequacy…",
    "Running win-probability model…",
    "Simulating price elasticity vs competitor pitches…",
    "Checking guardrails · assembling recommendation…",
  ];
  const [pct, setPct] = useState(4);
  const [mi, setMi] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPct((p) => Math.min(100, p + Math.random() * 13 + 6)), 190);
    const mv = setInterval(() => setMi((m) => Math.min(msgs.length - 1, m + 1)), 380);
    return () => { clearInterval(iv); clearInterval(mv); };
  }, []);
  return (
    <section className="ci-panel sr-loader">
      <div className="sr-spinner" />
      <div className="sr-load-title">Simulating the lead…</div>
      <div className="sr-load-msg">{msgs[mi]}</div>
      <div className="sr-load-track"><i style={{ width: `${pct}%` }} /></div>
      <div className="sr-load-pct">{Math.round(pct)}%</div>
    </section>
  );
}

/* bind-probability curve with marker */
function BindCurve({ price, boost }) {
  const W = 520, H = 190, pad = 34, lo = -5, hi = 12;
  const sx = (x) => pad + ((x - lo) / (hi - lo)) * (W - pad - 12);
  const sy = (y) => H - pad - (y / 100) * (H - pad - 12);
  const pts = [];
  for (let r = lo; r <= hi; r += 0.5) pts.push([r, Math.min(96, interp(BIND_ANCHORS, r) + boost)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
  const ry = Math.min(96, interp(BIND_ANCHORS, price) + boost);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ci-svg ci-lab-svg">
      {[25, 50, 75, 100].map((g) => <line key={g} x1={pad} y1={sy(g)} x2={W - 12} y2={sy(g)} stroke="var(--hair)" />)}
      <rect x={sx(-3)} y={12} width={sx(hi) - sx(-3)} height={H - pad - 12} fill="var(--green)" opacity="0.07" />
      <path d={d} fill="none" stroke="var(--acc)" strokeWidth="2.5" />
      <line x1={sx(price)} y1={12} x2={sx(price)} y2={H - pad} stroke="var(--acq)" strokeDasharray="4 3" />
      <circle cx={sx(price)} cy={sy(ry)} r="6" fill="var(--acq)" stroke="var(--panel)" strokeWidth="2" />
      <text x={pad} y={sy(100) - 3} fontSize="8" fill="var(--ink-3)">bind %</text>
      <text x={sx(-3) + 3} y={H - pad - 4} fontSize="8" fill="var(--green)">rate-adequate →</text>
      <text x={W - 96} y={H - pad + 14} fontSize="9" fill="var(--ink-3)">price vs filed → +{hi}%</text>
    </svg>
  );
}

const LEAD_KEY = "twinx-smbrate-lead";

/* trigger a browser download of a dummy text file with a proper name */
const slug = (s) => (s || "lead").replace(/[^\w]+/g, "_").replace(/^_|_$/g, "");
function downloadDummy(filename, body) {
  const rows = String(body).split("\n");
  const blob = makePdf(rows[0] || filename, rows.slice(1));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* build a lead record from an uploaded RFP/lead file (name derived from file) */
function leadFromFile(file) {
  const nm = file.name.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: "up-" + Date.now(), account: nm || "Uploaded Lead",
    industry: "Uploaded RFP · pending triage", classCode: "—", state: "—", revenue: "—",
    estPremium: 120000, source: "Uploaded · " + file.name, lines: "BOP + GL",
    leadIn: "quote due in 5 days",
    signal: "Uploaded lead / RFP · parsed from " + file.name + " · shopping · awaiting appetite triage",
    competitor: { n: "—", offer: 0 }, indicated: 6.0, leadScore: 0.6,
    segment: "Uploaded", lossRatio: 65, status: "ready",
    pitches: [
      { n: "Incumbent carrier", price: 125000, angle: "Renewal quote on file · standard terms" },
      { n: "Insurtech", price: 118000, angle: "Fast digital price · thin service model" },
    ],
    insights: [
      "Parsed from the uploaded submission — verify class code & exposures",
      "Price to win within the rate-adequacy floor",
      "Cross-line white space likely — confirm on the ACORD",
    ],
  };
}

/* derive a granular, multi-perspective B2B RFP detail set from a lead */
/* Deep, analysis-rich RFP breakdown across five underwriting perspectives.
   Each tab carries: metric tiles, granular key/value rows (with optional tone),
   an underwriting-analysis narrative, and color-coded risk flags. */
function rfpDetail(L) {
  const rev = parseFloat(String(L.revenue).replace(/[^0-9.]/g, "")) || 5;
  const m = (n) => (n >= 1 ? "$" + n.toFixed(1) + "M" : "$" + Math.round(n * 1000) + "K");
  const emp = Math.max(8, Math.round(rev * 4));
  const lr = L.lossRatio || 61;
  const isFL = L.state === "FL";
  const hasAuto = /auto|fleet/i.test(L.lines || "");
  const hasLiquor = /liquor/i.test(L.lines || "");
  const inApp = L.leadScore >= 0.5;
  const lines = String(L.lines || "BOP + GL").split(/\s*\+\s*/).map((s) => s.trim());
  const tiv = rev * 1.4, payroll = rev * 0.32;
  const limitFor = (ln) => /umbrella/i.test(ln) ? "$5M each-occ / aggregate · $10K SIR · follow-form"
    : /gl/i.test(ln) ? "$1M each-occ / $2M aggregate · $2M prod-comp-ops · occurrence"
    : /bop/i.test(ln) ? "$1M / $2M liability · building & BPP special form · $5K ded · RC valuation"
    : /liquor/i.test(ln) ? "$1M / $2M liquor liability · assault & battery included"
    : /work|wc/i.test(ln) ? "WC statutory · Employers Liability $1M / $1M / $1M"
    : "per submission · quote to filed rate";
  return {
    tabs: [
      {
        id: "firmo", label: "Firmographics",
        metrics: [
          { k: "Years in business", v: (6 + (emp % 9)) + " yrs" },
          { k: "Employees", v: "~" + emp },
          { k: "Locations", v: "2" },
        ],
        rows: [
          ["Named insured", L.account],
          ["DBA / trade name", L.account.replace(/\s+(LLC|Group|Inc|Mgmt)$/i, "")],
          ["Entity type · ownership", "LLC · single parent · owner-operated"],
          ["FEIN (masked)", "**-***" + String(1000 + emp).slice(-4)],
          ["Industry · NAICS", `${L.industry} · ${531311 + (emp % 900)}`],
          ["Governing class code", L.classCode, inApp ? "good" : "warn"],
          ["Secondary class exposure", hasAuto ? "Hired & non-owned auto" : "Blanket premises/ops"],
          ["Years in business · tenure grade", (6 + (emp % 9)) + " yrs · established (A)"],
          ["HQ · risk state", `${L.state} · ${L.segment} account`],
          ["Additional locations", "1 new (expansion) · same state"],
          ["Operations description", `${L.industry} — owner-managed, ${emp} staff`],
          ["Website · digital footprint", L.account.toLowerCase().replace(/[^a-z]/g, "") + ".com · active"],
        ],
        analysis: `Established owner-operated ${L.industry.toLowerCase()} in ${L.state}, ${6 + (emp % 9)} years in business across two locations. Governing class ${L.classCode} is ${inApp ? "squarely in appetite" : "on the appetite boundary and warrants UW review"}; ownership structure is clean and owner-aligned, supporting a stable submission.`,
        flags: [
          { tone: "good", text: "Established > 5 yrs" },
          { tone: "good", text: "Owner-operated · aligned" },
          { tone: inApp ? "good" : "risk", text: inApp ? "In-appetite class" : "Appetite-boundary class" },
        ],
      },
      {
        id: "exposure", label: "Exposure & Risk",
        metrics: [
          { k: "TIV", v: m(tiv) },
          { k: "Payroll", v: m(payroll) },
          { k: "Revenue", v: L.revenue },
        ],
        rows: [
          ["Annual revenue / receipts", L.revenue],
          ["Estimated payroll", m(payroll)],
          ["Total insured value (TIV)", m(tiv)],
          ["Building value · BPP", `${m(rev * 0.9)} · ${m(rev * 0.5)}`],
          ["Occupancy · square footage", "Owner-occupied · ~" + (8 + emp * 2) + "K sq ft"],
          ["Construction · protection class", "Masonry non-combustible · PC 3", "good"],
          ["Sprinklered · alarm", "Yes · central-station fire + burglar", "good"],
          ["Roof age · updates", "8 yrs · electrical/plumbing updated", "good"],
          ["CAT / territory exposure", isFL ? "Named-storm / wind zone · flood zone X" : "Standard territory · low CAT", isFL ? "warn" : "good"],
          ["Fleet / auto units", hasAuto ? "6 units · hired & non-owned exposure" : "None on this submission", hasAuto ? "warn" : "good"],
          ["Radius of operations", hasAuto ? "Regional · < 300 mi" : "Local · < 50 mi"],
          ["Subcontractor / delegated use", "Minimal · certificates on file"],
        ],
        analysis: `TIV of ${m(tiv)} is concentrated in owner-occupied masonry non-combustible construction (PC 3, fully sprinklered), which holds property severity moderate. ${isFL ? "Florida named-storm and wind exposure is the primary CAT driver — confirm wind deductible and secondary-water-resistance credits." : "CAT exposure is low for the territory."} ${hasAuto ? "Hired & non-owned auto adds a liability tail that should be priced explicitly." : "No owned-auto exposure on this submission."}`,
        flags: [
          { tone: "good", text: "Sprinklered · PC 3" },
          ...(isFL ? [{ tone: "warn", text: "FL named-storm exposure" }] : [{ tone: "good", text: "Low CAT territory" }]),
          ...(hasAuto ? [{ tone: "warn", text: "HNOA liability tail" }] : []),
        ],
      },
      {
        id: "coverage", label: "Coverage & Limits",
        metrics: [
          { k: "Lines requested", v: String(lines.length) },
          { k: "Umbrella", v: /umbrella/i.test(L.lines || "") ? "$5M" : "—" },
          { k: "Deductible", v: "$5K" },
        ],
        rows: [
          ...lines.map((ln) => [ln, limitFor(ln)]),
          ["Aggregate basis", "Per location · not shared"],
          ["Additional coverages", "Equipment breakdown · $50K cyber endorsement (optional)"],
          ["Deductible / SIR", "$5K property · $2.5K liability"],
          ["Valuation basis", "Replacement cost · agreed value on building", "good"],
          ["Key endorsements", "Blanket additional insured · waiver of subrogation · primary & non-contributory", "good"],
          ["Effective / expiry", "30 days out · 12-month term"],
          ["Retro date / prior acts", "Full prior acts requested"],
          ["Coinsurance", "90% · agreed value waives coinsurance"],
          ...(hasLiquor ? [["Liquor liability", "$1M / $2M · required for appetite", "warn"]] : []),
        ],
        analysis: `Requested tower (${lines.join(" + ")}) with blanket AI, waiver of subrogation and primary/non-contributory matches broker and contractual expectations. ${/umbrella/i.test(L.lines || "") ? "Umbrella attaches over the $1M/$2M GL and follows form." : "No umbrella on this submission — cross-sell opportunity."} Replacement-cost/agreed-value settlement keeps the property structure clean.${hasLiquor ? " Liquor liability is mandatory for this class and is the coverage differentiator vs. BOP-only competitors." : ""}`,
        flags: [
          { tone: "good", text: "ACORD 125/126/140 complete" },
          { tone: "good", text: "Prior acts · full" },
          ...(hasLiquor ? [{ tone: "warn", text: "Liquor liability required" }] : []),
          ...(!/umbrella/i.test(L.lines || "") ? [{ tone: "good", text: "Umbrella cross-sell open" }] : []),
        ],
      },
      {
        id: "loss", label: "Loss History & UW",
        metrics: [
          { k: "Loss ratio", v: lr + "%" },
          { k: "Exp. mod", v: "0.92" },
          { k: "Open claims", v: lr > 70 ? "1" : "0" },
        ],
        rows: [
          ["3-yr loss runs", lr < 70 ? "Clean · below class benchmark (0.9× ISO)" : "2 reported claims · at/above benchmark", lr < 70 ? "good" : "risk"],
          ["5-yr incurred · paid", `${money(Math.round(L.estPremium * 0.18))} incurred · ${money(Math.round(L.estPremium * 0.14))} paid`],
          ["Claim frequency (5-yr)", lr < 70 ? "0.4 / yr · low" : "1.2 / yr · watch", lr < 70 ? "good" : "warn"],
          ["Largest single claim", money(Math.round(L.estPremium * 0.09)) + " · closed"],
          ["Open claims · reserves", lr > 70 ? "1 open · reserves under review" : "0 open", lr > 70 ? "warn" : "good"],
          ["Severity trend", "Flat · no shock losses"],
          ["Loss ratio (submitted) vs class", `${lr}% vs ${lr < 70 ? "68% class avg — favorable" : "68% class avg — adverse"}`, lr < 70 ? "good" : "risk"],
          ["Experience modification", "0.92 · credit mod · A-preferred", "good"],
          ["Prior cancellations / non-renewals", "None · left prior carrier on rate", "good"],
          ["Inspection / loss control", "Pre-bind survey scheduled · loss-control eligible"],
          ["MVR / CAB / verification", hasAuto ? "MVRs ordered · CAB pulled" : "N/A — no auto"],
          ["Appetite score · referral", inApp ? "Auto-quote eligible · no referral" : "Refer to UW · appetite boundary", inApp ? "good" : "risk"],
        ],
        analysis: `Submitted loss ratio of ${lr}% is ${lr < 70 ? "below the ~68% class benchmark with a favorable 0.92 experience mod and no shock losses — a clean, price-to-win risk." : "at/above the ~68% class benchmark; frequency and the open claim push this to the appetite boundary and a UW referral."} No prior cancellations or non-renewals; a pre-bind survey is recommended to confirm the ${isFL ? "wind/property" : "premises"} exposure before binding.`,
        flags: [
          { tone: lr < 70 ? "good" : "risk", text: lr < 70 ? "Clean 3-yr loss runs" : "Adverse loss history" },
          { tone: "good", text: "Mod 0.92 · credit" },
          ...(inApp ? [] : [{ tone: "risk", text: "Appetite-boundary · refer" }]),
        ],
      },
      {
        id: "financial", label: "Financials & Distribution",
        metrics: [
          { k: "Expiring", v: money(Math.round(L.estPremium * 0.94)) },
          { k: "Target", v: money(L.estPremium) },
          { k: "Rate need", v: "+" + L.indicated + "%" },
        ],
        rows: [
          ["Revenue trend", "+" + (8 + (emp % 12)) + "% YoY · expanding", "good"],
          ["Financial / credit grade", "B+ · stable · no liens or judgments", "good"],
          ["Expiring premium", money(Math.round(L.estPremium * 0.94))],
          ["Target premium · indicated", `${money(L.estPremium)} · +${L.indicated}% vs filed`],
          ["Price sensitivity", L.leadScore >= 0.65 ? "Moderate — values service + certainty" : "High — actively rate-shopping", L.leadScore >= 0.65 ? "good" : "warn"],
          ["Producing broker / agency", L.source],
          ["Broker tier · bind rate", "Elite · 31% bind on this class", "good"],
          ["Commission", "15% new business · standard schedule"],
          ["Competing carriers", (L.pitches || []).map((p) => p.n).join(" · ") || "n/a"],
          ["Lowest competitor quote", L.competitor && L.competitor.offer ? money(L.competitor.offer) + " · " + L.competitor.n : "—", "warn"],
          ["Submission completeness", "ACORD 125/126/140 complete · loss runs attached", "good"],
          ["Quote due · win probability", `${L.leadIn} · ${Math.round(L.leadScore * 100)}% pre-sim`, inApp ? "good" : "warn"],
        ],
        analysis: `Expanding ${L.industry.toLowerCase()} (+${8 + (emp % 12)}% YoY) with a stable B+ financial profile and no liens. ${(L.pitches || []).length} carriers are shopping, low at ${L.competitor && L.competitor.n ? `${L.competitor.n} (${money(L.competitor.offer)})` : "a digital insurtech"}. The ${"Elite"}-tier broker values speed and certainty over last-dollar price; pricing to win within the rate-adequacy floor captures ${money(L.estPremium)} of target premium while holding margin.`,
        flags: [
          { tone: "good", text: "ACORD complete" },
          { tone: "good", text: "Elite broker" },
          { tone: "warn", text: (L.pitches || []).length + " competing quotes" },
        ],
      },
    ],
  };
}

function rfpDetailLegacy(L) {
  const revNum = parseFloat(String(L.revenue).replace(/[^0-9.]/g, "")) || 5;
  const m = (n) => (n >= 1 ? "$" + n.toFixed(1) + "M" : "$" + Math.round(n * 1000) + "K");
  const emp = Math.max(8, Math.round(revNum * 4));
  const lines = String(L.lines || "BOP + GL").split(/\s*\+\s*/).map((s) => s.trim());
  const limitFor = (ln) => ln.match(/umbrella/i) ? "$5M each occ / aggregate · $10K SIR"
    : ln.match(/gl/i) ? "$1M each occ / $2M aggregate · $2M prod-comp/ops · occurrence"
    : ln.match(/bop/i) ? "$1M / $2M liability · property special form · $5K deductible"
    : ln.match(/liquor/i) ? "$1M / $2M liquor liability · assault & battery incl."
    : ln.match(/work|wc/i) ? "WC statutory · Employers Liability $1M/$1M/$1M"
    : "per submission · quote to filed rate";
  return {
    tabs: [
      { id: "firmo", label: "Firmographics", rows: [
        ["Named insured", L.account],
        ["DBA / trade name", L.account.replace(/\s+(LLC|Group|Inc|Mgmt)$/i, "")],
        ["Entity type", "LLC · single parent · owner-operated"],
        ["FEIN (masked)", "**-***" + String(1000 + emp).slice(-4)],
        ["Industry · NAICS", `${L.industry} · ${531311 + (emp % 900)}`],
        ["Governing class code", L.classCode],
        ["Years in business", (6 + (emp % 9)) + " yrs · established"],
        ["HQ · risk state", `${L.state} · ${L.segment} account`],
        ["# locations · employees", `2 · ~${emp}`],
      ] },
      { id: "exposure", label: "Exposure & Risk", rows: [
        ["Annual revenue / receipts", L.revenue],
        ["Estimated payroll", m(revNum * 0.32)],
        ["Total insured value (TIV)", m(revNum * 1.4)],
        ["Building value · BPP", `${m(revNum * 0.9)} · ${m(revNum * 0.5)}`],
        ["Occupancy · sq ft", "Owner-occupied · ~" + (8 + emp * 2) + "K sq ft"],
        ["Construction · protection class", "Masonry non-comb · PC 3 · sprinklered"],
        ["CAT / territory exposure", L.state === "FL" ? "Wind/named-storm zone · flood X" : "Standard territory"],
        ["Fleet / auto units", lines.some((x) => /auto|fleet/i.test(x)) ? "6 units · hired & non-owned" : "None on this submission"],
      ] },
      { id: "coverage", label: "Coverage & Limits", rows: [
        ...lines.map((ln) => [ln, limitFor(ln)]),
        ["Requested effective date", "30 days out · new business"],
        ["Deductible / SIR", "$5K property · $2.5K liability"],
        ["Key endorsements", "Additional insured (blanket) · waiver of subro · primary & non-contributory"],
        ["Retro / prior acts", "Full prior acts requested"],
      ] },
      { id: "loss", label: "Loss History & UW", rows: [
        ["3-yr loss runs", "Clean · below class benchmark (0.9× ISO)"],
        ["5-yr incurred · paid", `${money(Math.round(L.estPremium * 0.18))} incurred · ${money(Math.round(L.estPremium * 0.14))} paid`],
        ["Largest single claim", money(Math.round(L.estPremium * 0.09)) + " · closed"],
        ["Open claims · reserves", L.lossRatio > 70 ? "1 open · reserves under review" : "0 open"],
        ["Loss ratio (submitted)", (L.lossRatio || 61) + "% · " + ((L.lossRatio || 61) < 70 ? "within appetite" : "appetite-boundary")],
        ["Experience mod · grade", "0.92 · A-preferred"],
        ["Prior cancellations / non-renewals", "None · left prior carrier on rate"],
        ["Inspections / loss control", "Recommended · pre-bind survey scheduled"],
      ] },
      { id: "financial", label: "Financials & Distribution", rows: [
        ["Revenue trend", "+" + (8 + (emp % 12)) + "% YoY · expanding"],
        ["Financial / credit grade", "B+ · stable · no liens"],
        ["Expiring premium", money(Math.round(L.estPremium * 0.94))],
        ["Target premium · indicated", `${money(L.estPremium)} · +${L.indicated}% vs filed`],
        ["Broker / source", L.source],
        ["Broker tier · bind rate", "Elite · 31% on this class"],
        ["Competing carriers", (L.pitches || []).map((p) => p.n).join(" · ") || "n/a"],
        ["Quote due · completeness", `${L.leadIn} · ACORD complete`],
        ["Appetite triage", L.leadScore >= 0.5 ? "In-appetite · auto-quote eligible" : "Appetite-boundary · refer to UW"],
      ] },
    ],
  };
}

/* build a minimal, valid single-page PDF from a title + text lines */
function makePdf(title, textLines) {
  const esc = (s) => String(s).replace(/([\\()])/g, "\\$1");
  const body = ["BT", "/F1 16 Tf", "54 748 Td", `(${esc(title)}) Tj`, "/F1 10 Tf", "0 -24 TD", "13 TL"];
  textLines.forEach((l, i) => body.push((i ? "T* " : "") + `(${esc(l)}) Tj`));
  body.push("ET");
  const stream = body.join("\n");
  const objs = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>",
    `<</Length ${stream.length}>>\nstream\n${stream}\nendstream`,
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
  ];
  let pdf = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  off.forEach((o) => { pdf += String(o).padStart(10, "0") + " 00000 n \n"; });
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function LeadWizard({ onBack, uploaded = [] }) {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [running, setRunning] = useState(false);
  const [leadId, setLeadId] = useState(() => {
    try { return localStorage.getItem(LEAD_KEY) || LEADS[0].id; } catch { return LEADS[0].id; }
  });
  const allLeads = [...uploaded, ...LEADS];
  const LEAD = allLeads.find((r) => r.id === leadId) || allLeads[0];
  const pickLead = (v) => { setLeadId(v); setStep(1); try { localStorage.setItem(LEAD_KEY, v); } catch { /* ignore */ } };
  const rfp = rfpDetail(LEAD);
  const [rfpTab, setRfpTab] = useState(0);
  // goal + levers
  const [goal, setGoal] = useState("win");
  const [price, setPrice] = useState(0);
  const [offer, setOffer] = useState("loyalty");
  const [nonprice, setNonprice] = useState(["riskctrl"]);
  const [cross, setCross] = useState("none");
  const [pkg, setPkg] = useState("standard");
  const [turn, setTurn] = useState("3day");
  const [channels, setChannels] = useState(["broker"]);
  const [ded, setDed] = useState(5);

  const offerBoost = OFFERS.find((o) => o.id === offer)?.boost || 0;
  const npBoost = nonprice.reduce((s, id) => s + (NONPRICE.find((n) => n.id === id)?.boost || 0), 0);
  const pkgBoost = PACKAGING.find((p) => p.id === pkg)?.boost || 0;
  const turnBoost = TURNAROUND.find((t) => t.id === turn)?.boost || 0;
  const boost = offerBoost + npBoost + pkgBoost + turnBoost;
  const bind = Math.min(96, interp(BIND_ANCHORS, price) + boost);
  const crossNwp = CROSS.find((c) => c.id === cross)?.nwp || 0;
  const nwpWon = LEAD.estPremium * (1 + price / 100) * (bind / 100) + crossNwp * (bind / 100);
  const adequate = price >= -3;
  const margin = 11 + price * 0.8 + ded * 0.12;
  const linesPer = cross === "none" ? 3.0 : 3.3;

  const toggleNp = (id) => setNonprice((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);
  const toggleCh = (id) => setChannels((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);

  // Run: show the loading interstitial, then reveal the Intelligence step.
  const runSim = () => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setStep(3); }, 1900);
  };

  return (
    <div className="ci-ws">
      <header className="ci-head">
        <div>
          <h1>New Lead Simulation · {LEAD.account}</h1>
          <p><button className="ci-linkback" onClick={onBack}>← Renewal book</button> · Small Commercial · guided decision flow · {LEAD.leadIn}</p>
        </div>
        <Steps step={step} setStep={setStep} />
      </header>

      <div className="ci-accbar">
        <div className="ci-accbar-l">
          <span className="ci-accbar-lab">Lead</span>
          <select value={leadId} onChange={(e) => pickLead(e.target.value)}>
            {allLeads.map((r) => <option key={r.id} value={r.id}>{r.account}</option>)}
          </select>
        </div>
        <div className="ci-accbar-meta">
          <span>{LEAD.industry}</span><i />
          <span>Class {LEAD.classCode}</span><i />
          <span>{LEAD.state}</span><i />
          <span>{money(LEAD.estPremium)} est. premium</span><i />
          <span>{LEAD.leadIn}</span>
        </div>
      </div>

      {/* RUNNING INTERSTITIAL */}
      {running && <RunLoader />}

      {/* STEP 1 · SIGNAL DETAILS (the lead) */}
      {!running && step === 1 && (
        <>
          <section className="ci-panel">
            <h3>Signal · why this lead surfaced</h3>
            <p className="ci-sub">{LEAD.signal}</p>
            <ul className="ci-kv">
              <li><b>Lead</b><span>{LEAD.account} · {LEAD.industry}</span></li>
              <li><b>Class / State</b><span>{LEAD.classCode} · {LEAD.state}</span></li>
              <li><b>Source</b><span>{LEAD.source}</span></li>
              <li><b>Est. premium</b><span>{money(LEAD.estPremium)} · {LEAD.lines} · revenue {LEAD.revenue}</span></li>
              <li><b>Lead score</b><span>{Math.round(LEAD.leadScore * 100)}% win-likelihood (pre-sim)</span></li>
              <li><b>Indicated rate</b><span>+{LEAD.indicated}% vs filed (actuarial)</span></li>
            </ul>
          </section>

          <section className="ci-panel">
            <h3>RFP analysis · granular underwriting view</h3>
            <p className="ci-sub">Full submission across five underwriting perspectives — select a tab</p>
            <div className="sr-rfp-tabs" role="tablist">
              {rfp.tabs.map((t, i) => (
                <button key={t.id} type="button" role="tab" aria-selected={rfpTab === i}
                  className={"sr-rfp-tab" + (rfpTab === i ? " on" : "")} onClick={() => setRfpTab(i)}>
                  {t.label}
                </button>
              ))}
            </div>
            {(() => {
              const t = rfp.tabs[rfpTab];
              const lr = LEAD.lossRatio || 61, isFL = LEAD.state === "FL", hasAuto = /auto|fleet/i.test(LEAD.lines || "");
              const inApp = LEAD.leadScore >= 0.5, wp = Math.round(LEAD.leadScore * 100);
              const bars = ({
                firmo: [
                  { k: "Tenure vs class norm", pct: 75, tone: "good", note: "above avg" },
                  { k: "Ownership stability", pct: 90, tone: "good", note: "owner-operated" },
                  { k: "Class appetite fit", pct: inApp ? 85 : 45, tone: inApp ? "good" : "risk", note: inApp ? "in-appetite" : "boundary" },
                ],
                exposure: [
                  { k: "Property severity control", pct: 82, tone: "good", note: "PC 3 · sprinklered" },
                  { k: "CAT exposure", pct: isFL ? 70 : 25, tone: isFL ? "warn" : "good", note: isFL ? "named-storm" : "low" },
                  { k: "Liability tail", pct: hasAuto ? 60 : 30, tone: hasAuto ? "warn" : "good", note: hasAuto ? "HNOA" : "contained" },
                ],
                coverage: [
                  { k: "Coverage completeness", pct: 88, tone: "good", note: "ACORD complete" },
                  { k: "Limit adequacy vs exposure", pct: 80, tone: "good", note: "matched" },
                  { k: "Endorsement match", pct: 90, tone: "good", note: "AI · WOS · P&NC" },
                ],
                loss: [
                  { k: "Loss ratio vs 68% benchmark", pct: Math.min(100, Math.round((lr / 68) * 100)), tone: lr < 70 ? "good" : "risk", note: lr + "% vs 68%" },
                  { k: "Claim frequency", pct: lr < 70 ? 25 : 70, tone: lr < 70 ? "good" : "warn", note: lr < 70 ? "low" : "watch" },
                  { k: "Experience-mod credit", pct: 80, tone: "good", note: "0.92" },
                ],
                financial: [
                  { k: "Price position vs market", pct: 60, tone: "good", note: "at / below market" },
                  { k: "Broker strength", pct: 85, tone: "good", note: "Elite · 31% bind" },
                  { k: "Win probability", pct: wp, tone: LEAD.leadScore >= 0.65 ? "good" : "warn", note: wp + "%" },
                ],
              })[t.id] || [];
              return (
                <div className="sr-rfp-panel">
                  <div className="sr-rfp-metrics">
                    {t.metrics.map((mtr, i) => (
                      <div key={i} className="sr-rfp-metric"><span>{mtr.k}</span><b>{mtr.v}</b></div>
                    ))}
                  </div>
                  <div className="sr-rfp-bars">
                    {bars.map((bar, i) => (
                      <div key={i} className="sr-bar-row">
                        <span className="sr-bar-k">{bar.k}</span>
                        <div className="sr-bar-track"><i className={"sr-bar-fill sr-bar-" + bar.tone} style={{ width: bar.pct + "%" }} /></div>
                        <span className={"sr-bar-note sr-tone-" + bar.tone}>{bar.note}</span>
                      </div>
                    ))}
                  </div>
                  <ul className="ci-kv sr-rfp-kv">
                    {t.rows.map(([k, v, tone], i) => (
                      <li key={i}><b>{k}</b><span className={tone ? "sr-tone-" + tone : ""}>{v}</span></li>
                    ))}
                  </ul>
                  <div className="sr-rfp-analysis">
                    <div className="sr-rfp-h">Underwriting analysis</div>
                    <p>{t.analysis}</p>
                    <div className="sr-rfp-flags">
                      {t.flags.map((f, i) => <span key={i} className={"sr-flag sr-flag-" + f.tone}>{f.text}</span>)}
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>

          <div className="ci-grid2">
            <section className="ci-panel">
              <h3>Competitor pitch intelligence</h3>
              <p className="ci-sub">What the competition is likely putting in front of this lead</p>
              <div className="sr-pitches">
                {LEAD.pitches.map((c) => (
                  <div key={c.n} className="sr-pitch">
                    <div className="sr-pitch-h"><span>{c.n}</span><b>{money(c.price)}</b></div>
                    <div className="sr-pitch-a">{c.angle}</div>
                  </div>
                ))}
              </div>
            </section>
            <section className="ci-panel">
              <h3>TwinX lead insights</h3>
              <p className="ci-sub">What matters for winning this account</p>
              <ul className="sr-insights">
                {LEAD.insights.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </section>
          </div>

          <div className="ci-cta"><button className="ci-btn" onClick={() => setStep(2)}>Set goals, guardrails & levers →</button></div>
        </>
      )}

      {/* STEP 2 · GOALS, GUARDRAILS & LEVERS */}
      {!running && step === 2 && (
        <>
          <div className="ci-grid2">
            <section className="ci-panel">
              <h3>Goal</h3>
              <p className="ci-sub">What winning this lead optimizes</p>
              <div className="sr-radios">
                {[["win", "Maximize win probability", "Bind the lead at the lowest adequate price"],
                  ["nwp", "Maximize NWP won", "Best premium × bind within adequacy"],
                  ["margin", "Defend margin", "Protect combined ratio, accept lower bind"]].map(([id, l, d]) => (
                  <label key={id} className={"sr-radio" + (goal === id ? " on" : "")}>
                    <input type="radio" checked={goal === id} onChange={() => setGoal(id)} />
                    <span><b>{l}</b><i>{d}</i></span>
                  </label>
                ))}
              </div>
            </section>
            <section className="ci-panel">
              <h3>Guardrails · always enforced</h3>
              <p className="ci-sub">Hard constraints the simulation cannot violate</p>
              <ul className="sr-guards">
                <li><span className="sr-g-dot" />Rate-adequacy floor · quote ≥ −3% vs filed (indicated +{LEAD.indicated}%)</li>
                <li><span className="sr-g-dot" />Loss-ratio limit · new business must hold target LR</li>
                <li><span className="sr-g-dot" />Appetite fit · within class / state appetite</li>
                <li><span className="sr-g-dot" />Fair-pricing · NAIC Model Bulletin 24-08 consistency</li>
              </ul>
            </section>
          </div>

          <section className="ci-panel">
            <h3>Levers</h3>
            <p className="ci-sub">Tune the offer — results compute after the simulation runs</p>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Quote price vs filed rate</span><b>{price > 0 ? "+" : ""}{price.toFixed(1)}%</b></div>
              <RangeWithBubble min={-5} max={12} step={0.5} value={price}
                onChange={(e) => setPrice(+e.target.value)}
                formatter={(v) => `${v > 0 ? "+" : ""}${v}%`} />
              {!adequate && <div className="sr-warn">Below rate-adequacy floor (−3%) — guardrail breach</div>}
            </div>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Deductible</span><b>${ded}K</b></div>
              <RangeWithBubble min={1} max={25} step={1} value={ded}
                onChange={(e) => setDed(+e.target.value)}
                formatter={(v) => `$${v}K`} />
            </div>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Offer structure</span></div>
              <div className="sr-chips">
                {OFFERS.map((o) => <button key={o.id} className={"sr-chip" + (offer === o.id ? " on" : "")} onClick={() => setOffer(o.id)}>{o.label}</button>)}
              </div>
            </div>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Coverage / packaging</span></div>
              <div className="sr-chips">
                {PACKAGING.map((o) => <button key={o.id} className={"sr-chip" + (pkg === o.id ? " on" : "")} onClick={() => setPkg(o.id)}>{o.label}</button>)}
              </div>
            </div>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Non-price value</span></div>
              <div className="sr-chips">
                {NONPRICE.map((n) => <button key={n.id} className={"sr-chip" + (nonprice.includes(n.id) ? " on" : "")} onClick={() => toggleNp(n.id)}>{n.label}</button>)}
              </div>
            </div>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Cross-line bundle</span></div>
              <div className="sr-chips">
                {CROSS.map((c) => <button key={c.id} className={"sr-chip" + (cross === c.id ? " on" : "")} onClick={() => setCross(c.id)}>{c.label}</button>)}
              </div>
            </div>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Quote turnaround</span></div>
              <div className="sr-chips">
                {TURNAROUND.map((t) => <button key={t.id} className={"sr-chip" + (turn === t.id ? " on" : "")} onClick={() => setTurn(t.id)}>{t.label}</button>)}
              </div>
            </div>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Delivery channel</span></div>
              <div className="sr-chips">
                {CHANNELS.map((c) => <button key={c.id} className={"sr-chip" + (channels.includes(c.id) ? " on" : "")} onClick={() => toggleCh(c.id)}>{c.label}</button>)}
              </div>
            </div>
          </section>

          <div className="ci-cta">
            <button className="ci-btn ghost" onClick={() => setStep(1)}>← Signal</button>
            <button className="ci-btn" onClick={runSim}>Run simulation →</button>
          </div>
        </>
      )}

      {/* STEP 3 · INTELLIGENCE — results + recommendation + 3 workbenches */}
      {!running && step === 3 && (
        <>
          <div className="ci-grid2">
            <section className="ci-panel">
              <h3>Simulation results</h3>
              <div className="sr-metrics">
                <div><span>Bind probability</span><b>{bind.toFixed(0)}%</b></div>
                <div><span>NWP won</span><b>{money(nwpWon)}</b></div>
                <div><span>Margin</span><b>{margin.toFixed(1)}%</b></div>
                <div><span>Rate adequacy</span><b className={adequate ? "ok" : "bad"}>{adequate ? "adequate" : "under"}</b></div>
                <div><span>Loss-ratio impact</span><b className="ok">{adequate ? "held / ↓" : "↑ risk"}</b></div>
                <div><span>Lines per account</span><b>{linesPer.toFixed(1)}</b></div>
              </div>
            </section>
            <section className="ci-panel">
              <h3>Bind probability vs quote price</h3>
              <p className="ci-sub">Offer + non-price value lift the curve · shaded band is rate-adequate</p>
              <BindCurve price={price} boost={boost} />
            </section>
          </div>

          <section className="ci-panel">
            <h3>TwinX recommendation</h3>
            <div className="ci-winner">
              <b>Quote {price >= 0 ? "+" : ""}{price.toFixed(1)}% vs filed · {OFFERS.find((o) => o.id === offer)?.label}{nonprice.length ? " · " + nonprice.map((id) => NONPRICE.find((n) => n.id === id).label).join(" + ") : ""}</b>
              {" "}— bind {bind.toFixed(0)}%, {money(nwpWon)} NWP won, margin {margin.toFixed(1)}%, loss ratio held. {cross !== "none" ? "Bundle " + CROSS.find((c) => c.id === cross).label + "." : ""}
            </div>
            <table className="ci-conc" style={{ marginTop: 12 }}>
              <thead><tr><th>Structure</th><th>Bind</th><th>NWP won</th><th>Margin</th></tr></thead>
              <tbody>
                <tr><td>−3% + onboarding credit + risk-control</td><td className="up">88%</td><td>{money(LEAD.estPremium * 0.97 * 0.88)}</td><td>8.6%</td></tr>
                <tr><td>Filed rate + multi-year lock</td><td className="up">83%</td><td>{money(LEAD.estPremium * 0.83)}</td><td>11.0%</td></tr>
                <tr><td>+5% · standard</td><td>60%</td><td>{money(LEAD.estPremium * 1.05 * 0.60)}</td><td>15.0%</td></tr>
              </tbody>
            </table>
            <div className="ci-cta" style={{ justifyContent: "flex-start", marginTop: 14 }}>
              <button className="ci-btn" onClick={() => downloadDummy(
                slug(LEAD.account) + "_Price_Sheet.pdf",
                `PRICE SHEET — ${LEAD.account}\nClass ${LEAD.classCode} · ${LEAD.state}\n\nQuote: ${price >= 0 ? "+" : ""}${price.toFixed(1)}% vs filed\nEst. premium: ${money(LEAD.estPremium)}\nBind probability: ${bind.toFixed(0)}%\nNWP won: ${money(nwpWon)}\nMargin: ${margin.toFixed(1)}%\nRate adequacy: ${adequate ? "adequate" : "under floor"}\n\n(Illustrative dummy document.)`
              )}>⬇ Price sheet (PDF)</button>
              <button className="ci-btn" onClick={() => downloadDummy(
                slug(LEAD.account) + "_Term_Sheet.pdf",
                `TERM SHEET — ${LEAD.account}\n${LEAD.industry}\nLines: ${LEAD.lines}\n\nStructure: Quote ${price >= 0 ? "+" : ""}${price.toFixed(1)}% vs filed · ${OFFERS.find((o) => o.id === offer)?.label} · ${PACKAGING.find((p) => p.id === pkg)?.label}\nDeductible: $${ded}K\nBind: ${bind.toFixed(0)}% · NWP won: ${money(nwpWon)} · Margin: ${margin.toFixed(1)}%\nGuardrails: rate-adequacy floor · loss-ratio limit · NAIC 24-08\n\n(Illustrative dummy document.)`
              )}>⬇ Term sheet (PDF)</button>
            </div>
          </section>

          <section className="ci-panel">
            <h3>Account intelligence · all three workbenches</h3>
            <p className="ci-sub">Take this lead deeper into each intelligence surface</p>
            <div className="ci-grid3">
              <div className="ci-intel-card">
                <h4>Quote Intelligence</h4>
                <p>Multi-scenario quote structures with win probability, margin and portfolio impact.</p>
                <button className="ci-btn" onClick={() => nav("/?seed_route=quoteintel")}>Open →</button>
              </div>
              <div className="ci-intel-card">
                <h4>Elasticity &amp; Win-Prob</h4>
                <p>Sensitivity Lab, win-probability decomposition and competitive positioning.</p>
                <button className="ci-btn" onClick={() => nav("/?seed_route=elasticity")}>Open →</button>
              </div>
              <div className="ci-intel-card">
                <h4>Negotiation</h4>
                <p>Broker playbook, concession optimizer and alternative structures.</p>
                <button className="ci-btn" onClick={() => nav("/?seed_route=negotiation")}>Open →</button>
              </div>
            </div>
          </section>

          <div className="ci-cta">
            <button className="ci-btn ghost" onClick={() => setStep(2)}>← Goals, Guardrails & Levers</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---- Renewal Book Cockpit — book-level view; click a case → the wizard ---- */
const STATUS_LABEL = { ready: "Ready", negotiating: "Negotiating", "at-risk": "At risk" };
function statusCls(s) { return "sr-status sr-status-" + s; }

function BookCockpit({ onOpen, onUpload }) {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("All");
  const segs = ["All", ...Array.from(new Set(LEADS.map((l) => l.segment)))];
  const rows = LEADS.filter((l) =>
    (seg === "All" || l.segment === seg) &&
    (q === "" || l.account.toLowerCase().includes(q.toLowerCase())));
  const maxLR = 100;
  return (
    <div className="ci-ws">
      <header className="ci-head">
        <div>
          <h1>Renewal Strategy Cockpit</h1>
          <p>Small Commercial · book-level view of renewal & new-business cases and negotiation readiness</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <label className="ci-btn ghost ci-upload">
            ⬆ Upload lead / RFP
            <input type="file" accept=".pdf,.doc,.docx,.csv,.xlsx,.acord,.json,.txt" onChange={onUpload} hidden />
          </label>
          <button className="ci-btn">⚡ Run prediction model</button>
        </div>
      </header>

      <div className="ci-kpis ci-kpis-4">
        {[["Cases in book", "142", "↑ 8%"], ["Avg. rate ask", "+6.4%", "↑ 1.2%"], ["Avg. win / retention", "63%", "↓ 2%"], ["At-risk cases", "18", "↑ 5%"]].map(([l, v, d]) => (
          <div key={l} className="ci-kpi">
            <div className="ci-kpi-h"><span>{l}</span><em>{d}</em></div>
            <div className="ci-kpi-v">{v}</div>
          </div>
        ))}
      </div>

      <div className="ci-grid2 sr-cockpit-grid">
        <section className="ci-panel sr-alert">
          <div className="sr-alert-h">⚠ Predictive risk alert</div>
          <p>TwinX flags <b>3 cases</b> with rising loss ratios (&gt; 75%) and heavy competitor pressure.</p>
          <div className="sr-alert-bar"><span>Portfolio churn risk</span><b>Elevated</b></div>
          <div className="sr-alert-track"><i style={{ width: "72%" }} /></div>
          <p className="ci-sub" style={{ marginTop: 10 }}>Select a case to run its guided simulation.</p>
        </section>
        <section className="ci-panel">
          <div className="sr-book-tools">
            <input className="sr-search" placeholder="Search cases…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={seg} onChange={(e) => setSeg(e.target.value)}>
              {segs.map((s) => <option key={s} value={s}>{s === "All" ? "Segment: All" : s}</option>)}
            </select>
          </div>
          <div className="sr-book-scroll">
          <table className="sr-book">
            <thead><tr><th>Case</th><th>Est. premium</th><th>Rate ask</th><th>Loss ratio</th><th>Win prob.</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} onClick={() => onOpen(l.id)}>
                  <td><b>{l.account}</b><div className="sr-book-seg">{l.segment}</div></td>
                  <td>{money(l.estPremium)}</td>
                  <td><span className="sr-ask">+{l.indicated}%</span></td>
                  <td>{l.lossRatio}%</td>
                  <td>
                    <div className="sr-winbar"><i style={{ width: Math.round(l.leadScore * 100) + "%",
                      background: l.leadScore >= 0.65 ? "var(--green)" : l.leadScore >= 0.5 ? "var(--ret)" : "var(--red)" }} /></div>
                    <span className="sr-winpct">{Math.round(l.leadScore * 100)}%</span>
                  </td>
                  <td><span className={statusCls(l.status)}>{STATUS_LABEL[l.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      </div>

      <section className="ci-panel">
        <h3>Loss ratio vs win probability</h3>
        <div className="sr-lrbars">
          {LEADS.map((l) => (
            <div key={l.id} className="sr-lrbar">
              <div className="sr-lrbar-cols">
                <i className="lr" style={{ height: (l.lossRatio / maxLR * 100) + "%" }} title={"LR " + l.lossRatio + "%"} />
                <i className="win" style={{ height: (l.leadScore * 100) + "%" }} title={"Win " + Math.round(l.leadScore * 100) + "%"} />
              </div>
              <span>{l.account.split(" ")[0]}</span>
            </div>
          ))}
        </div>
        <div className="sr-lrlegend"><span><i className="lr" /> Loss ratio</span><span><i className="win" /> Win prob.</span></div>
      </section>
    </div>
  );
}

export default function SmbRateFlowView() {
  const [opened, setOpened] = useState(false);
  const [uploaded, setUploaded] = useState([]);
  const open = (id) => { try { localStorage.setItem(LEAD_KEY, id); } catch { /* ignore */ } setOpened(true); };
  const onUpload = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const lead = leadFromFile(f);
    setUploaded((u) => [lead, ...u]);
    open(lead.id);
    e.target.value = "";
  };
  if (!opened) return <BookCockpit onOpen={open} onUpload={onUpload} />;
  return <LeadWizard key="lead" uploaded={uploaded} onBack={() => setOpened(false)} />;
}
