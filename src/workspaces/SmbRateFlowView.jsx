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
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
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

function LeadWizard({ onBack }) {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [running, setRunning] = useState(false);
  const [uploaded, setUploaded] = useState([]);
  const [leadId, setLeadId] = useState(() => {
    try { return localStorage.getItem(LEAD_KEY) || LEADS[0].id; } catch { return LEADS[0].id; }
  });
  const allLeads = [...uploaded, ...LEADS];
  const LEAD = allLeads.find((r) => r.id === leadId) || allLeads[0];
  const pickLead = (v) => { setLeadId(v); setStep(1); try { localStorage.setItem(LEAD_KEY, v); } catch { /* ignore */ } };
  const onUpload = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const lead = leadFromFile(f);
    setUploaded((u) => [lead, ...u]);
    setLeadId(lead.id);
    setStep(1);
    e.target.value = "";
  };
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
          <label className="ci-btn ghost ci-upload">
            ⬆ Upload lead / RFP
            <input type="file" accept=".pdf,.doc,.docx,.csv,.xlsx,.acord,.json,.txt" onChange={onUpload} hidden />
          </label>
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
                slug(LEAD.account) + "_Price_Sheet.txt",
                `PRICE SHEET — ${LEAD.account}\nClass ${LEAD.classCode} · ${LEAD.state}\n\nQuote: ${price >= 0 ? "+" : ""}${price.toFixed(1)}% vs filed\nEst. premium: ${money(LEAD.estPremium)}\nBind probability: ${bind.toFixed(0)}%\nNWP won: ${money(nwpWon)}\nMargin: ${margin.toFixed(1)}%\nRate adequacy: ${adequate ? "adequate" : "under floor"}\n\n(Illustrative dummy document.)`
              )}>⬇ Price sheet</button>
              <button className="ci-btn" onClick={() => downloadDummy(
                slug(LEAD.account) + "_Term_Sheet.txt",
                `TERM SHEET — ${LEAD.account}\n${LEAD.industry}\nLines: ${LEAD.lines}\n\nStructure: Quote ${price >= 0 ? "+" : ""}${price.toFixed(1)}% vs filed · ${OFFERS.find((o) => o.id === offer)?.label} · ${PACKAGING.find((p) => p.id === pkg)?.label}\nDeductible: $${ded}K\nBind: ${bind.toFixed(0)}% · NWP won: ${money(nwpWon)} · Margin: ${margin.toFixed(1)}%\nGuardrails: rate-adequacy floor · loss-ratio limit · NAIC 24-08\n\n(Illustrative dummy document.)`
              )}>⬇ Term sheet</button>
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

function BookCockpit({ onOpen }) {
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
        <button className="ci-btn">⚡ Run prediction model</button>
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
  const open = (id) => { try { localStorage.setItem(LEAD_KEY, id); } catch { /* ignore */ } setOpened(true); };
  if (!opened) return <BookCockpit onOpen={open} />;
  return <LeadWizard key="lead" onBack={() => setOpened(false)} />;
}
