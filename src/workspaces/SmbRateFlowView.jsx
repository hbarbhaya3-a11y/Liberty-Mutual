/* ============================================================================
   SmbRateFlowView — SECOND B2B signal (Small Commercial renewal risk).
   A DIFFERENT flow from the growth signal: a guided, RFP/Lead-level renewal
   simulation wizard rather than a portfolio-cohort Analyze→Simulate.

   Flow (4 steps): Signal Details → Goals & Guardrails → Simulation (B2B
   renewal levers + live recommendation metrics) → Intelligence Outputs
   (recommended action + hand-off into the account-intelligence tabs).
   ========================================================================= */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/commercial-intel.css";

const money = (n) => (n >= 1000 ? "$" + Math.round(n / 1000) + "K" : "$" + Math.round(n));

/* renewal RFPs / leads under decision (pick one in the wizard) */
const RFPS = [
  {
    id: "harborview", account: "Harborview Property Mgmt", industry: "Commercial real estate · property mgmt",
    classCode: "BOP 65112", state: "FL", inForce: 168000, tenure: "6 yrs", lossRatio: "0.61",
    lines: "BOP + GL + Umbrella", renewalIn: "38 days",
    signal: "Broker requested a competitor quote · digital engagement −22% · no adverse loss trend",
    competitor: { n: "biBERK", offer: 154000 }, indicated: 6.0, retentionRisk: 0.63,
  },
  {
    id: "summit", account: "Summit Precision Machining", industry: "Metal machining · manufacturing",
    classCode: "WC 3632", state: "OH", inForce: 94000, tenure: "9 yrs", lossRatio: "0.58",
    lines: "Workers Comp + GL", renewalIn: "22 days",
    signal: "Non-renewal notice modeled · payroll audit swing +14% · mod factor improving",
    competitor: { n: "Next Insurance", offer: 88000 }, indicated: 4.5, retentionRisk: 0.55,
  },
  {
    id: "delmar", account: "Del Mar Coastal Eatery Group", industry: "Restaurant · multi-unit hospitality",
    classCode: "BOP 16900", state: "CA", inForce: 61000, tenure: "3 yrs", lossRatio: "0.79",
    lines: "BOP + Liquor Liability", renewalIn: "45 days",
    signal: "Rate-shopping across 3 carriers · 2 slip-fall claims · loss ratio drifting up",
    competitor: { n: "Hiscox", offer: 66000 }, indicated: 9.0, retentionRisk: 0.71,
  },
];

/* B2B renewal levers */
const OFFERS = [
  { id: "none", label: "None" },
  { id: "loyalty", label: "Loyalty / tenure credit", boost: 6 },
  { id: "multiyear", label: "Multi-year rate lock (2-yr)", boost: 10 },
];
const NONPRICE = [
  { id: "riskctrl", label: "Risk-control services", boost: 4 },
  { id: "safety", label: "Safety / loss-prevention program", boost: 3 },
];
const CROSS = [
  { id: "none", label: "None" },
  { id: "cyber", label: "Add Cyber", nwp: 9000 },
  { id: "wc", label: "Add Workers Comp", nwp: 22000 },
];

/* retention probability vs renewal rate action (%) — anchor interpolation */
const RET_ANCHORS = [[-2, 94], [2, 88], [4.5, 82], [8, 68], [12, 50]];
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
  const labels = ["Signal Details", "Goals & Guardrails", "Simulation", "Intelligence Outputs"];
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

/* retention curve mini-chart with marker */
function RetCurve({ rate, boost }) {
  const W = 520, H = 190, pad = 34, lo = -2, hi = 12;
  const sx = (x) => pad + ((x - lo) / (hi - lo)) * (W - pad - 12);
  const sy = (y) => H - pad - (y / 100) * (H - pad - 12);
  const pts = [];
  for (let r = lo; r <= hi; r += 0.5) pts.push([r, Math.min(97, interp(RET_ANCHORS, r) + boost)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
  const ry = Math.min(97, interp(RET_ANCHORS, rate) + boost);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ci-svg ci-lab-svg">
      {[25, 50, 75, 100].map((g) => <line key={g} x1={pad} y1={sy(g)} x2={W - 12} y2={sy(g)} stroke="var(--hair)" />)}
      <rect x={sx(3)} y={12} width={sx(hi) - sx(3)} height={H - pad - 12} fill="var(--green)" opacity="0.07" />
      <path d={d} fill="none" stroke="var(--acc)" strokeWidth="2.5" />
      <line x1={sx(rate)} y1={12} x2={sx(rate)} y2={H - pad} stroke="var(--acq)" strokeDasharray="4 3" />
      <circle cx={sx(rate)} cy={sy(ry)} r="6" fill="var(--acq)" stroke="var(--panel)" strokeWidth="2" />
      <text x={pad} y={sy(100) - 3} fontSize="8" fill="var(--ink-3)">retention %</text>
      <text x={sx(3) + 3} y={H - pad - 4} fontSize="8" fill="var(--green)">rate-adequate →</text>
      <text x={W - 70} y={H - pad + 14} fontSize="9" fill="var(--ink-3)">+{hi}% rate →</text>
    </svg>
  );
}

const RFP_KEY = "twinx-smbrate-rfp";

export default function SmbRateFlowView() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [rfpId, setRfpId] = useState(() => {
    try { return localStorage.getItem(RFP_KEY) || RFPS[0].id; } catch { return RFPS[0].id; }
  });
  const RFP = RFPS.find((r) => r.id === rfpId) || RFPS[0];
  const pickRfp = (v) => { setRfpId(v); setStep(1); try { localStorage.setItem(RFP_KEY, v); } catch { /* ignore */ } };
  // levers
  const [rate, setRate] = useState(4.5);
  const [offer, setOffer] = useState("loyalty");
  const [nonprice, setNonprice] = useState(["riskctrl"]);
  const [cross, setCross] = useState("none");
  const [goal, setGoal] = useState("retain");

  const offerBoost = OFFERS.find((o) => o.id === offer)?.boost || 0;
  const npBoost = nonprice.reduce((s, id) => s + (NONPRICE.find((n) => n.id === id)?.boost || 0), 0);
  const boost = offerBoost + npBoost;
  const retention = Math.min(97, interp(RET_ANCHORS, rate) + boost);
  const crossNwp = CROSS.find((c) => c.id === cross)?.nwp || 0;
  const retainedNWP = RFP.inForce * (1 + rate / 100) * (retention / 100) + crossNwp * (retention / 100);
  const adequate = rate >= 3;
  const margin = 8 + rate * 0.8;
  const linesPer = cross === "none" ? 3.0 : 3.3;

  const toggleNp = (id) => setNonprice((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);

  return (
    <div className="ci-ws">
      <header className="ci-head">
        <div>
          <h1>Renewal RFP Simulation · {RFP.account}</h1>
          <p>Small Commercial renewal risk · guided decision flow · renewal in {RFP.renewalIn}</p>
        </div>
        <Steps step={step} setStep={setStep} />
      </header>

      <div className="ci-accbar">
        <div className="ci-accbar-l">
          <span className="ci-accbar-lab">Renewal RFP</span>
          <select value={rfpId} onChange={(e) => pickRfp(e.target.value)}>
            {RFPS.map((r) => <option key={r.id} value={r.id}>{r.account}</option>)}
          </select>
        </div>
        <div className="ci-accbar-meta">
          <span>{RFP.industry}</span><i />
          <span>Class {RFP.classCode}</span><i />
          <span>{RFP.state}</span><i />
          <span>{money(RFP.inForce)} in-force</span><i />
          <span>renews in {RFP.renewalIn}</span>
        </div>
      </div>

      {/* STEP 1 · SIGNAL DETAILS */}
      {step === 1 && (
        <>
          <section className="ci-panel">
            <h3>Signal · why this RFP surfaced</h3>
            <p className="ci-sub">{RFP.signal}</p>
            <ul className="ci-kv">
              <li><b>Account</b><span>{RFP.account} · {RFP.industry}</span></li>
              <li><b>Class / State</b><span>{RFP.classCode} · {RFP.state}</span></li>
              <li><b>In-force premium</b><span>{money(RFP.inForce)} · {RFP.lines}</span></li>
              <li><b>Tenure / Loss ratio</b><span>{RFP.tenure} · {RFP.lossRatio} (healthy)</span></li>
              <li><b>Competitor pressure</b><span>{RFP.competitor.n} circling at ~{money(RFP.competitor.offer)}</span></li>
              <li><b>Retention risk</b><span>{Math.round(RFP.retentionRisk * 100)}% · shopping on rate, not distress</span></li>
              <li><b>Indicated rate</b><span>+{RFP.indicated}% (actuarial)</span></li>
            </ul>
          </section>
          <div className="ci-cta"><button className="ci-btn" onClick={() => setStep(2)}>Set goals & guardrails →</button></div>
        </>
      )}

      {/* STEP 2 · GOALS & GUARDRAILS */}
      {step === 2 && (
        <>
          <div className="ci-grid2">
            <section className="ci-panel">
              <h3>Goal</h3>
              <p className="ci-sub">What this renewal decision optimizes</p>
              <div className="sr-radios">
                {[["retain", "Maximize retention", "Hold the account at the lowest adequate rate"],
                  ["nwp", "Maximize retained NWP", "Best premium × retention within adequacy"],
                  ["margin", "Defend margin", "Protect combined ratio, accept some churn"]].map(([id, l, d]) => (
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
                <li><span className="sr-g-dot" />Rate-adequacy floor · renewal rate ≥ +3% (indicated +{RFP.indicated}%)</li>
                <li><span className="sr-g-dot" />Loss-ratio limit · hold or improve the book LR</li>
                <li><span className="sr-g-dot" />Fair-pricing · NAIC Model Bulletin 24-08 consistency</li>
                <li><span className="sr-g-dot" />Contact-frequency cap · single renewal outreach</li>
              </ul>
            </section>
          </div>
          <div className="ci-cta">
            <button className="ci-btn ghost" onClick={() => setStep(1)}>← Signal</button>
            <button className="ci-btn" onClick={() => setStep(3)}>Run simulation →</button>
          </div>
        </>
      )}

      {/* STEP 3 · SIMULATION */}
      {step === 3 && (
        <>
          <div className="ci-grid2">
            <section className="ci-panel">
              <h3>Renewal levers</h3>
              <div className="sr-lever">
                <div className="sr-lever-h"><span>Renewal rate action</span><b>{rate > 0 ? "+" : ""}{rate.toFixed(1)}%</b></div>
                <input type="range" className="ci-slider" min={-2} max={12} step={0.5} value={rate} onChange={(e) => setRate(+e.target.value)} />
                {!adequate && <div className="sr-warn">Below rate-adequacy floor (+3%) — guardrail breach</div>}
              </div>
              <div className="sr-lever">
                <div className="sr-lever-h"><span>Retention offer</span></div>
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
                <div className="sr-lever-h"><span>Cross-sell at renewal</span></div>
                <div className="sr-chips">
                  {CROSS.map((c) => <button key={c.id} className={"sr-chip" + (cross === c.id ? " on" : "")} onClick={() => setCross(c.id)}>{c.label}</button>)}
                </div>
              </div>
            </section>
            <section className="ci-panel">
              <h3>Recommendation metrics</h3>
              <div className="sr-metrics">
                <div><span>Retention probability</span><b>{retention.toFixed(0)}%</b></div>
                <div><span>In-force NWP retained</span><b>{money(retainedNWP)}</b></div>
                <div><span>Renewal margin</span><b>{margin.toFixed(1)}%</b></div>
                <div><span>Rate adequacy</span><b className={adequate ? "ok" : "bad"}>{adequate ? "adequate" : "under"}</b></div>
                <div><span>Loss-ratio impact</span><b className="ok">{adequate ? "held / ↓" : "↑ risk"}</b></div>
                <div><span>Lines per account</span><b>{linesPer.toFixed(1)}</b></div>
              </div>
            </section>
          </div>
          <section className="ci-panel">
            <h3>Retention sensitivity · probability vs renewal rate</h3>
            <p className="ci-sub">Offer + non-price value lift the curve · shaded band is rate-adequate</p>
            <RetCurve rate={rate} boost={boost} />
          </section>
          <div className="ci-cta">
            <button className="ci-btn ghost" onClick={() => setStep(2)}>← Goals</button>
            <button className="ci-btn" onClick={() => setStep(4)}>View intelligence outputs →</button>
          </div>
        </>
      )}

      {/* STEP 4 · INTELLIGENCE OUTPUTS */}
      {step === 4 && (
        <>
          <section className="ci-panel">
            <h3>TwinX recommended renewal action</h3>
            <div className="ci-winner">
              <b>+{Math.max(3, rate).toFixed(1)}% rate · {OFFERS.find((o) => o.id === offer)?.label}{nonprice.length ? " · " + nonprice.map((id) => NONPRICE.find((n) => n.id === id).label).join(" + ") : ""}</b>
              {" "}— retention {retention.toFixed(0)}%, {money(retainedNWP)} NWP retained, margin {margin.toFixed(1)}%, loss ratio held. {cross !== "none" ? "Cross-sell " + CROSS.find((c) => c.id === cross).label + " at renewal." : ""}
            </div>
          </section>
          <div className="ci-grid2">
            <section className="ci-panel">
              <h3>Ranked alternatives</h3>
              <table className="ci-conc">
                <thead><tr><th>Structure</th><th>Retention</th><th>NWP</th><th>Margin</th></tr></thead>
                <tbody>
                  <tr><td>Rate +3% + loyalty + risk-control</td><td className="up">88%</td><td>{money(RFP.inForce * 1.03 * 0.88)}</td><td>10.4%</td></tr>
                  <tr><td>Rate +4.5% + multi-year lock</td><td className="up">86%</td><td>{money(RFP.inForce * 1.045 * 0.86)}</td><td>11.6%</td></tr>
                  <tr><td>Rate +8% · no offer</td><td>68%</td><td>{money(RFP.inForce * 1.08 * 0.68)}</td><td>14.4%</td></tr>
                </tbody>
              </table>
            </section>
            <section className="ci-panel">
              <h3>Hand off to account intelligence</h3>
              <p className="ci-sub">Take this RFP into the deep intelligence workbenches</p>
              <div className="sr-links">
                <button className="ci-btn" onClick={() => nav("/?seed_route=elasticity")}>Open Elasticity & Win-Prob Lab →</button>
                <button className="ci-btn ghost" onClick={() => nav("/?seed_route=negotiation")}>Open Negotiation Playbook →</button>
                <button className="ci-btn ghost" onClick={() => nav("/?seed_route=quoteintel")}>Open Quote Intelligence →</button>
              </div>
            </section>
          </div>
          <div className="ci-cta">
            <button className="ci-btn ghost" onClick={() => setStep(3)}>← Simulation</button>
          </div>
        </>
      )}
    </div>
  );
}
