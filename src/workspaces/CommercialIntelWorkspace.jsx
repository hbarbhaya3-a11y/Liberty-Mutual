/* ============================================================================
   CommercialIntelWorkspace — account / RFP-level "Underwriter of the Future"
   intelligence for USRM Small Commercial. Commercial-sector only.

   Three menu items (routes), one shared account/RFP context, logical flow:
     1. quoteintel  → Quote Intelligence      (Screens 14–15 · PRD I.3–I.9, J.1–J.2/10/12)
     2. elasticity  → Elasticity & Win Prob    (Screens 16–17 · PRD J.4–J.5, K)
     3. negotiation → Negotiation Intelligence (Screens 18–19 · PRD J.6–J.8/11)

   Flow: pick a lead → Quote (generate + compare scenarios) → Elasticity
   (price it, score win prob vs competitors) → Negotiation (playbook + concession).
   Selected account persists across the three routes via localStorage.
   ========================================================================= */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/commercial-intel.css";

const ACC_KEY = "twinx-ci-account";
const go = (nav, view) => nav(`/?seed_route=${view}`);

/* ---- Sample RFP / lead-level accounts (derived from the growth cohort) ---- */
const ACCOUNTS = [
  {
    id: "ironline", name: "Ironline Fabrication LLC", industry: "Metal fabrication",
    classCode: "GL 59482", state: "TX", revenue: "$4.2M", employees: 34, tenure: "New business",
    segment: "Scaling multi-location", growth: "New 2nd location + payroll +18% YoY",
    broker: { name: "Lockton — Dallas", tier: "Elite", bindRate: "31%", book: "0.68 loss ratio" },
    triage: "auto-quote", triageWhy: "Strong appetite match · complete ACORD · no fraud flags · broker book strong",
    loss: "1 GL claim / 3 yrs · $12K · below class benchmark (0.9× ISO)",
    portfolio: "Grows target TX construction segment · concentration +0.2% (within cap) · appetite aligned",
    competitors: [{ n: "Next Insurance", p: "$18,900" }, { n: "biBERK", p: "$17,400" }, { n: "Hiscox", p: "$19,600" }],
    lines: ["BOP", "General Liability"], crossLine: ["Workers Comp (new payroll)", "Commercial Auto (2 vans)", "Umbrella"],
    quotes: [
      { id: "base", label: "Baseline", premium: "$18,200", cov: "BOP + GL · $1M/$2M", margin: "14.8%", win: 62, port: "+$18.2K NWP · neutral LR", rec: false },
      { id: "ded", label: "Deductible-optimized", premium: "$16,600", cov: "$5K → $10K deductible", margin: "16.1%", win: 71, port: "+$16.6K NWP · LR ↓", rec: true },
      { id: "cov", label: "Coverage-restructured", premium: "$19,400", cov: "+ Umbrella $1M", margin: "15.2%", win: 55, port: "+$19.4K NWP · +1 line", rec: false },
      { id: "bundle", label: "Bundle-contingent", premium: "$27,800", cov: "+ WC + Auto (2 vans)", margin: "17.4%", win: 48, port: "+$27.8K NWP · +2 lines · LR ↓", rec: false },
    ],
    winScore: 71, winCI: "±6pp",
    winFactors: [
      { k: "Broker Twin — Lockton bind rate on GL", w: 30, v: "+12" },
      { k: "Account Twin — shopping propensity (moderate)", w: 20, v: "−4" },
      { k: "Market Twin — insurtech pressure (high)", w: 20, v: "−7" },
      { k: "Historical similarity — TX fab class", w: 15, v: "+6" },
      { k: "Price position vs competitor median", w: 15, v: "+9" },
    ],
    position: "At-market (52nd pctile)",
    elasticity: { rec: "$16,600", zone: [15800, 17400],
      curve: [[14000, 88], [15000, 82], [16600, 71], [18200, 62], [20000, 47], [22000, 31]],
      dims: [{ k: "Segment", s: "Elastic" }, { k: "Broker", s: "Flexible" }, { k: "Industry", s: "Moderate" }, { k: "Competitor", s: "High" }, { k: "Coverage", s: "Low" }] },
    negotiation: {
      flex: "High — Lockton values speed + certainty over last-dollar price",
      opening: "$18,200 baseline · $1M/$2M · $5K deductible",
      counter: "Broker cites biBERK at $17,400 · asks for match + higher deductible",
      fallbacks: ["$17,400 at $10K deductible (holds adequacy)", "$16,600 + telematics/safety credit", "$16,600 floor — rate-adequacy limit"],
      nonprice: ["Faster bind (same-day COI)", "Fleet safety-program credit", "Multi-year term lock"],
      walkaway: "$16,600 — below this, GL rate falls under adequacy",
      concessions: [
        { req: "Match biBERK −$800", resp: "Counter with $10K deductible", cost: "−1.3pp margin", win: "+9pp", port: "LR neutral" },
        { req: "Waive first-year fee", resp: "Offer safety credit instead", cost: "−0.4pp margin", win: "+3pp", port: "LR ↓ (safety)" },
      ],
      alts: ["Deductible-optimized ($10K)", "Bundle-contingent (WC + Auto)", "Multi-year (2-yr rate lock)"],
    },
  },
  {
    id: "cedaroak", name: "Cedar & Oak Logistics", industry: "Regional trucking",
    classCode: "CA 01340", state: "OH", revenue: "$8.9M", employees: 61, tenure: "New business",
    segment: "Fleet / equipment-heavy", growth: "Fleet +6 units (18→24) · new lane expansion",
    broker: { name: "USI — Columbus", tier: "Preferred", bindRate: "24%", book: "0.74 loss ratio" },
    triage: "referral", triageWhy: "High severity (fleet auto) · 2 prior claims · routes to Commercial Auto specialist",
    loss: "2 auto claims / 3 yrs · $84K · at class benchmark (1.0× ISO)",
    portfolio: "Adds OH transportation exposure · concentration +0.6% (watch) · appetite: monitor",
    competitors: [{ n: "biBERK", p: "$142K" }, { n: "Progressive Commercial", p: "$138K" }, { n: "Next Insurance", p: "$151K" }],
    lines: ["Commercial Auto"], crossLine: ["Inland Marine (equipment)", "Umbrella", "General Liability"],
    quotes: [
      { id: "base", label: "Baseline", premium: "$146K", cov: "Fleet CA · $1M CSL", margin: "11.2%", win: 44, port: "+$146K NWP · LR watch", rec: false },
      { id: "ded", label: "Deductible-optimized", premium: "$134K", cov: "$2.5K → $5K deductible", margin: "12.6%", win: 53, port: "+$134K NWP · LR ↓", rec: false },
      { id: "cov", label: "Coverage + safety", premium: "$139K", cov: "+ telematics credit", margin: "13.9%", win: 58, port: "+$139K NWP · LR ↓↓", rec: true },
      { id: "bundle", label: "Bundle-contingent", premium: "$178K", cov: "+ Inland Marine + Umbrella", margin: "13.1%", win: 39, port: "+$178K NWP · +2 lines", rec: false },
    ],
    winScore: 58, winCI: "±8pp",
    winFactors: [
      { k: "Broker Twin — USI bind rate on fleet CA", w: 30, v: "+5" },
      { k: "Account Twin — shopping propensity (high)", w: 20, v: "−9" },
      { k: "Market Twin — Progressive aggressive", w: 20, v: "−10" },
      { k: "Historical similarity — OH fleet class", w: 15, v: "+4" },
      { k: "Price position (telematics credit)", w: 15, v: "+11" },
    ],
    position: "Below-market with safety credit (34th pctile)",
    elasticity: { rec: "$139K", zone: [134000, 142000],
      curve: [[120000, 79], [130000, 67], [139000, 58], [146000, 44], [155000, 30], [165000, 18]],
      dims: [{ k: "Segment", s: "Elastic" }, { k: "Broker", s: "Moderate" }, { k: "Industry", s: "High" }, { k: "Competitor", s: "High" }, { k: "Coverage", s: "Moderate" }] },
    negotiation: {
      flex: "Moderate — USI price-sensitive on fleet; safety credit is the lever",
      opening: "$146K baseline · $1M CSL · $2.5K deductible",
      counter: "Broker cites Progressive $138K · pushes for match",
      fallbacks: ["$139K with telematics safety credit (LR ↓↓)", "$134K at $5K deductible", "$134K floor — fleet CA adequacy"],
      nonprice: ["Telematics safety program", "Fleet driver-training credit", "Loss-control engineering visit"],
      walkaway: "$134K — fleet auto loss-cost adequacy floor",
      concessions: [
        { req: "Match Progressive −$8K", resp: "Offer $139K + telematics (better LR)", cost: "−1.1pp margin", win: "+14pp", port: "LR ↓↓" },
        { req: "Drop deductible", resp: "Hold — raises severity", cost: "n/a", win: "−", port: "reject (LR risk)" },
      ],
      alts: ["Coverage + safety ($139K)", "Deductible-optimized ($5K)", "Bundle (Inland Marine + Umbrella)"],
    },
  },
];

/* ---- shared account state via localStorage ---- */
function useAccount() {
  const [id, setId] = useState(() => {
    try { return localStorage.getItem(ACC_KEY) || ACCOUNTS[0].id; } catch { return ACCOUNTS[0].id; }
  });
  const set = (v) => { setId(v); try { localStorage.setItem(ACC_KEY, v); } catch { /* ignore */ } };
  return [ACCOUNTS.find((a) => a.id === id) || ACCOUNTS[0], set];
}

function AccountBar({ acc, onPick }) {
  return (
    <div className="ci-accbar">
      <div className="ci-accbar-l">
        <span className="ci-accbar-lab">RFP / Lead</span>
        <select value={acc.id} onChange={(e) => onPick(e.target.value)}>
          {ACCOUNTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="ci-accbar-meta">
        <span>{acc.industry}</span><i />
        <span>Class {acc.classCode}</span><i />
        <span>{acc.state}</span><i />
        <span>{acc.revenue} · {acc.employees} emp</span><i />
        <span className={"ci-triage ci-triage-" + acc.triage}>{acc.triage.replace("-", " ")}</span>
      </div>
    </div>
  );
}

function FlowNav({ view, nav }) {
  const steps = [["quoteintel", "Quote"], ["elasticity", "Elasticity & Win-Prob"], ["negotiation", "Negotiation"]];
  return (
    <div className="ci-flow">
      {steps.map(([v, l], i) => (
        <button key={v} className={"ci-flow-step" + (v === view ? " on" : "")} onClick={() => go(nav, v)}>
          <span className="ci-flow-n">{i + 1}</span>{l}
        </button>
      ))}
    </div>
  );
}

/* ---------- 1 · QUOTE INTELLIGENCE ---------- */
function QuoteView({ acc, nav }) {
  const winner = acc.quotes.find((q) => q.rec);
  return (
    <>
      <div className="ci-grid2">
        <section className="panel ci-panel">
          <h3>Account intelligence</h3>
          <ul className="ci-kv">
            <li><b>Growth signal</b><span>{acc.growth}</span></li>
            <li><b>Loss history</b><span>{acc.loss}</span></li>
            <li><b>Broker</b><span>{acc.broker.name} · {acc.broker.tier} · bind {acc.broker.bindRate} · {acc.broker.book}</span></li>
            <li><b>Portfolio fit</b><span>{acc.portfolio}</span></li>
            <li><b>Cross-line white space</b><span>{acc.crossLine.join(" · ")}</span></li>
          </ul>
          <div className="ci-triage-box">
            <span className={"ci-triage ci-triage-" + acc.triage}>{acc.triage.replace("-", " ")}</span>
            <span className="ci-triage-why">{acc.triageWhy}</span>
          </div>
        </section>
        <section className="panel ci-panel">
          <h3>Competitive intelligence</h3>
          <p className="ci-sub">Estimated competitor quotes for this account</p>
          <ul className="ci-comp">
            {acc.competitors.map((c) => <li key={c.n}><span>{c.n}</span><b>{c.p}</b></li>)}
          </ul>
          <p className="ci-pos">Liberty position · <b>{acc.position}</b></p>
        </section>
      </div>

      <section className="panel ci-panel">
        <h3>Multi-scenario quote generator</h3>
        <p className="ci-sub">Pre-generated structures · each with premium, coverage, margin, win probability, portfolio impact</p>
        <div className="ci-quotes">
          {acc.quotes.map((q) => (
            <div key={q.id} className={"ci-quote" + (q.rec ? " rec" : "")}>
              {q.rec && <span className="ci-badge">Recommended</span>}
              <div className="ci-quote-h">{q.label}</div>
              <div className="ci-quote-prem">{q.premium}</div>
              <div className="ci-quote-cov">{q.cov}</div>
              <div className="ci-quote-metrics">
                <span>Win <b>{q.win}%</b></span>
                <span>Margin <b>{q.margin}</b></span>
              </div>
              <div className="ci-quote-port">{q.port}</div>
            </div>
          ))}
        </div>
        <div className="ci-winner">
          <b>TwinX pick · {winner.label}</b> — best balance of win probability ({winner.win}%) and margin ({winner.margin}), held to loss ratio.
        </div>
      </section>

      <div className="ci-cta">
        <button className="ci-btn" onClick={() => go(nav, "elasticity")}>Price it → Elasticity & Win-Probability</button>
      </div>
    </>
  );
}

/* ---------- 2 · ELASTICITY & WIN PROBABILITY ---------- */
function ElasticityCurve({ e }) {
  const xs = e.curve.map((p) => p[0]), ys = e.curve.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const W = 520, H = 200, pad = 34;
  const sx = (x) => pad + ((x - x0) / (x1 - x0)) * (W - pad - 10);
  const sy = (y) => H - pad - (y / 100) * (H - pad - 10);
  const d = e.curve.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
  const zx0 = sx(e.zone[0]), zx1 = sx(e.zone[1]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ci-curve">
      <rect x={zx0} y={pad - 6} width={zx1 - zx0} height={H - pad} fill="var(--acc,#4fd1c5)" opacity="0.12" />
      <line x1={pad} y1={H - pad} x2={W - 10} y2={H - pad} stroke="var(--ink-3,#556)" strokeWidth="1" />
      <path d={d} fill="none" stroke="var(--acc,#4fd1c5)" strokeWidth="2.5" />
      {e.curve.map((p, i) => <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="2.6" fill="var(--acc,#4fd1c5)" />)}
      <text x={pad} y={H - 8} fontSize="9" fill="var(--ink-3,#889)">${(x0 / 1000).toFixed(0)}K</text>
      <text x={W - 40} y={H - 8} fontSize="9" fill="var(--ink-3,#889)">${(x1 / 1000).toFixed(0)}K premium →</text>
      <text x={(zx0 + zx1) / 2} y={pad + 4} fontSize="9" fill="var(--acc,#4fd1c5)" textAnchor="middle">rec zone</text>
    </svg>
  );
}
function ElasticityView({ acc, nav }) {
  return (
    <>
      <div className="ci-grid2">
        <section className="panel ci-panel">
          <h3>Win probability · {acc.winScore}% <span className="ci-ci">{acc.winCI}</span></h3>
          <p className="ci-sub">Composite of the twins + price position · signal weights shown</p>
          <ul className="ci-factors">
            {acc.winFactors.map((f) => (
              <li key={f.k}>
                <span className="ci-f-k">{f.k}</span>
                <span className="ci-f-w">w{f.w}</span>
                <span className={"ci-f-v " + (f.v.startsWith("+") ? "up" : "dn")}>{f.v}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel ci-panel">
          <h3>Competitive positioning</h3>
          <ul className="ci-comp">
            {acc.competitors.map((c) => <li key={c.n}><span>{c.n}</span><b>{c.p}</b></li>)}
          </ul>
          <p className="ci-pos">Liberty · <b>{acc.position}</b></p>
          <div className="ci-dims">
            {acc.elasticity.dims.map((d) => <span key={d.k} className="ci-dim">{d.k}: <b>{d.s}</b></span>)}
          </div>
        </section>
      </div>

      <section className="panel ci-panel">
        <h3>Price elasticity · bind probability vs premium</h3>
        <p className="ci-sub">Recommended price point <b>{acc.elasticity.rec}</b> · shaded zone maximizes bind × margin within adequacy</p>
        <ElasticityCurve e={acc.elasticity} />
      </section>

      <div className="ci-cta">
        <button className="ci-btn ghost" onClick={() => go(nav, "quoteintel")}>← Quote</button>
        <button className="ci-btn" onClick={() => go(nav, "negotiation")}>Prepare negotiation →</button>
      </div>
    </>
  );
}

/* ---------- 3 · NEGOTIATION INTELLIGENCE ---------- */
function NegotiationView({ acc, nav }) {
  const n = acc.negotiation;
  return (
    <>
      <section className="panel ci-panel">
        <h3>Broker negotiation context</h3>
        <ul className="ci-kv">
          <li><b>Broker</b><span>{acc.broker.name} · {acc.broker.tier} · bind {acc.broker.bindRate}</span></li>
          <li><b>Flexibility</b><span>{n.flex}</span></li>
        </ul>
      </section>

      <section className="panel ci-panel">
        <h3>Negotiation playbook</h3>
        <div className="ci-play">
          <div><span className="ci-play-k">Opening</span>{n.opening}</div>
          <div><span className="ci-play-k">Anticipated counter</span>{n.counter}</div>
          <div><span className="ci-play-k">Fallbacks</span>
            <ol className="ci-fb">{n.fallbacks.map((f, i) => <li key={i}>{f}</li>)}</ol>
          </div>
          <div><span className="ci-play-k">Non-price levers</span>{n.nonprice.join(" · ")}</div>
          <div className="ci-walk"><span className="ci-play-k">Walk-away</span>{n.walkaway}</div>
        </div>
      </section>

      <section className="panel ci-panel">
        <h3>Concession optimizer</h3>
        <table className="ci-conc">
          <thead><tr><th>Broker asks</th><th>Recommended response</th><th>Margin cost</th><th>Win Δ</th><th>Portfolio</th></tr></thead>
          <tbody>
            {n.concessions.map((c, i) => (
              <tr key={i}><td>{c.req}</td><td>{c.resp}</td><td>{c.cost}</td><td className="up">{c.win}</td><td>{c.port}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="ci-sub">Alternative structures if price stalls: {n.alts.join(" · ")}</p>
      </section>

      <div className="ci-cta">
        <button className="ci-btn ghost" onClick={() => go(nav, "elasticity")}>← Elasticity & Win-Prob</button>
      </div>
    </>
  );
}

const TITLES = {
  quoteintel: ["Quote Intelligence", "Multi-scenario quote generation · account / RFP level"],
  elasticity: ["Elasticity & Win Probability", "Price the account against the competitive set"],
  negotiation: ["Negotiation Intelligence", "Playbook + concession strategy per broker"],
};

export default function CommercialIntelWorkspace({ view = "quoteintel" }) {
  const [acc, setAcc] = useAccount();
  const nav = useNavigate();
  const [title, sub] = TITLES[view] || TITLES.quoteintel;
  return (
    <div className="ci-ws">
      <header className="ci-head">
        <div>
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
        <FlowNav view={view} nav={nav} />
      </header>
      <AccountBar acc={acc} onPick={setAcc} />
      {view === "elasticity" ? <ElasticityView acc={acc} nav={nav} />
        : view === "negotiation" ? <NegotiationView acc={acc} nav={nav} />
        : <QuoteView acc={acc} nav={nav} />}
    </div>
  );
}
