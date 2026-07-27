/* ============================================================================
   SmbRateFlowView — SECOND B2B signal (Small Commercial · new LEAD).
   A different flow from the growth signal: a guided, lead/RFP-level new-business
   simulation wizard. A specific lead has come in; we simulate how to win it.

   Flow (3 steps):
     1. Signal Details    — the lead (who, why it surfaced, competitor, size)
     2. Goals, Guardrails & Levers — objective + hard constraints + the levers
     3. Intelligence      — simulation results + recommendation + all 3
                            account-intelligence workbenches (Quote / Elasticity /
                            Negotiation)
   ========================================================================= */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/commercial-intel.css";

const money = (n) => (n >= 1000 ? "$" + Math.round(n / 1000) + "K" : "$" + Math.round(n));

/* new-business leads under decision (pick one in the wizard) */
const LEADS = [
  {
    id: "harborview", account: "Harborview Property Mgmt", industry: "Commercial real estate · property mgmt",
    classCode: "BOP 65112", state: "FL", revenue: "$7.4M", estPremium: 168000, source: "Lockton — submitted 2 days ago",
    lines: "BOP + GL + Umbrella", leadIn: "quote due in 4 days",
    signal: "Broker submission · shopping 3 carriers · expanding to a 2nd location · no adverse loss history",
    competitor: { n: "biBERK", offer: 154000 }, indicated: 6.0, leadScore: 0.74,
  },
  {
    id: "summit", account: "Summit Precision Machining", industry: "Metal machining · manufacturing",
    classCode: "WC 3632", state: "OH", revenue: "$11.2M", estPremium: 94000, source: "USI — submitted 5 days ago",
    lines: "Workers Comp + GL", leadIn: "quote due in 1 day",
    signal: "New submission · payroll +14% · mod factor improving · leaving prior carrier on service",
    competitor: { n: "Next Insurance", offer: 88000 }, indicated: 4.5, leadScore: 0.66,
  },
  {
    id: "delmar", account: "Del Mar Coastal Eatery Group", industry: "Restaurant · multi-unit hospitality",
    classCode: "BOP 16900", state: "CA", revenue: "$5.1M", estPremium: 61000, source: "Comparion — submitted today",
    lines: "BOP + Liquor Liability", leadIn: "quote due in 6 days",
    signal: "New submission · rate-shopping 3 carriers · 2 prior slip-fall claims · appetite-boundary risk",
    competitor: { n: "Hiscox", offer: 66000 }, indicated: 9.0, leadScore: 0.48,
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

export default function SmbRateFlowView() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [leadId, setLeadId] = useState(() => {
    try { return localStorage.getItem(LEAD_KEY) || LEADS[0].id; } catch { return LEADS[0].id; }
  });
  const LEAD = LEADS.find((r) => r.id === leadId) || LEADS[0];
  const pickLead = (v) => { setLeadId(v); setStep(1); try { localStorage.setItem(LEAD_KEY, v); } catch { /* ignore */ } };
  // goal + levers
  const [goal, setGoal] = useState("win");
  const [price, setPrice] = useState(0);
  const [offer, setOffer] = useState("loyalty");
  const [nonprice, setNonprice] = useState(["riskctrl"]);
  const [cross, setCross] = useState("none");

  const offerBoost = OFFERS.find((o) => o.id === offer)?.boost || 0;
  const npBoost = nonprice.reduce((s, id) => s + (NONPRICE.find((n) => n.id === id)?.boost || 0), 0);
  const boost = offerBoost + npBoost;
  const bind = Math.min(96, interp(BIND_ANCHORS, price) + boost);
  const crossNwp = CROSS.find((c) => c.id === cross)?.nwp || 0;
  const nwpWon = LEAD.estPremium * (1 + price / 100) * (bind / 100) + crossNwp * (bind / 100);
  const adequate = price >= -3;
  const margin = 11 + price * 0.8;
  const linesPer = cross === "none" ? 3.0 : 3.3;

  const toggleNp = (id) => setNonprice((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);

  return (
    <div className="ci-ws">
      <header className="ci-head">
        <div>
          <h1>New Lead Simulation · {LEAD.account}</h1>
          <p>Small Commercial · new-business lead · guided decision flow · {LEAD.leadIn}</p>
        </div>
        <Steps step={step} setStep={setStep} />
      </header>

      <div className="ci-accbar">
        <div className="ci-accbar-l">
          <span className="ci-accbar-lab">Lead</span>
          <select value={leadId} onChange={(e) => pickLead(e.target.value)}>
            {LEADS.map((r) => <option key={r.id} value={r.id}>{r.account}</option>)}
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

      {/* STEP 1 · SIGNAL DETAILS (the lead) */}
      {step === 1 && (
        <>
          <section className="ci-panel">
            <h3>Signal · why this lead surfaced</h3>
            <p className="ci-sub">{LEAD.signal}</p>
            <ul className="ci-kv">
              <li><b>Lead</b><span>{LEAD.account} · {LEAD.industry}</span></li>
              <li><b>Class / State</b><span>{LEAD.classCode} · {LEAD.state}</span></li>
              <li><b>Source</b><span>{LEAD.source}</span></li>
              <li><b>Est. premium</b><span>{money(LEAD.estPremium)} · {LEAD.lines} · revenue {LEAD.revenue}</span></li>
              <li><b>Competitor pressure</b><span>{LEAD.competitor.n} circling at ~{money(LEAD.competitor.offer)}</span></li>
              <li><b>Lead score</b><span>{Math.round(LEAD.leadScore * 100)}% win-likelihood (pre-sim)</span></li>
              <li><b>Indicated rate</b><span>+{LEAD.indicated}% vs filed (actuarial)</span></li>
            </ul>
          </section>
          <div className="ci-cta"><button className="ci-btn" onClick={() => setStep(2)}>Set goals, guardrails & levers →</button></div>
        </>
      )}

      {/* STEP 2 · GOALS, GUARDRAILS & LEVERS */}
      {step === 2 && (
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
            <p className="ci-sub">Tune the offer — results compute live in the Intelligence step</p>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Quote price vs filed rate</span><b>{price > 0 ? "+" : ""}{price.toFixed(1)}%</b></div>
              <input type="range" className="ci-slider" min={-5} max={12} step={0.5} value={price} onChange={(e) => setPrice(+e.target.value)} />
              {!adequate && <div className="sr-warn">Below rate-adequacy floor (−3%) — guardrail breach</div>}
            </div>
            <div className="sr-lever">
              <div className="sr-lever-h"><span>Offer structure</span></div>
              <div className="sr-chips">
                {OFFERS.map((o) => <button key={o.id} className={"sr-chip" + (offer === o.id ? " on" : "")} onClick={() => setOffer(o.id)}>{o.label}</button>)}
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
          </section>

          <div className="ci-cta">
            <button className="ci-btn ghost" onClick={() => setStep(1)}>← Signal</button>
            <button className="ci-btn" onClick={() => setStep(3)}>Run → Intelligence →</button>
          </div>
        </>
      )}

      {/* STEP 3 · INTELLIGENCE — simulation results + recommendation + 3 workbenches */}
      {step === 3 && (
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
