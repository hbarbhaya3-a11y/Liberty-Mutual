import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TWINX from "@/data/bundle";
import { PERSONAS, CONFIGS, ENGINES as ENGINE_LABELS, TEETH } from "@/data/themeConfigs";
import { OBJ, fmtUSD as fmtUsdM } from "@/data/themes";
import { Logo, ThemeToggle } from "@/components/Logo";
import PageShell from "@/components/PageShell";
import "@/styles/deepPipeline.css";

/* Business-language stage labels for the outer ribbon (matches /pipeline
   and /gig-pipeline so the three pipelines read consistently). */
const STAGE_BIZ = {
  sense: { name: "Signal & customer group",       cap: "Why this customer group surfaced and what we're seeing" },
  hyp:   { name: "Hypotheses",                    cap: "Reasons, candidate interventions and fairness checks" },
  model: { name: "Model setup",                   cap: "Composite twin fabric · customer × product × process × channel × macro" },
  sim:   { name: "Test & optimize policy",        cap: "Tune levers, simulate outcomes, optimize against guardrails" },
  gate:  { name: "Approval review",               cap: "Decision gate, governance and approval workflow" },
  test:  { name: "Live pilot",                    cap: "Controlled scenario · monitored daily" },
  learn: { name: "Measure results & deploy",      cap: "Estimate, correct, write-back to the twins, scale" },
};

/* ---------------------------------------------------------------------------
   Deep Pipeline — config-driven port of deep_pipeline.html.
   Reads ?theme=elder|home|churn (default elder; gig redirects to /gig-pipeline).
   Shell is rendered once; each theme's CONFIG drives the content per stage.
   --------------------------------------------------------------------------- */

/* ---- raw-$ formatter (legacy semantics — themes.fmtUSD takes $M, not raw $) */
function fmtUSDraw(v) {
  const a = Math.abs(v);
  const s = v < 0 ? "−" : "";
  if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(0) + "K";
  return s + "$" + a.toFixed(0);
}
function fmtInt(v) { return Math.round(v).toLocaleString(); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

/* ---- decision-engine compute kernels (B / C / E) ---- */
const ENGINE_KERNELS = {
  /* B - loss-prevention (inverted) */
  B: {
    base: { severity: "hold", threshold: 10000, window: "always", efe: 70, trusted: true, coverage: 60 },
    levers: [
      { t: "seg", key: "severity", tw: "pc", label: "Action severity", q: "how hard we intervene", opts: [["step_up", "Step-up"], ["hold", "Hold"], ["block", "Block"]] },
      { t: "slider", key: "threshold", tw: "pr", label: "First-ever threshold", q: "$ that triggers review", min: 5000, max: 50000, step: 5000, unit: "$", usd: true },
      { t: "seg", key: "window", tw: "ch", label: "Scrutiny window", q: "when scrutiny applies", opts: [["always", "Always"], ["payout", "Payout hrs"], ["weekday", "Weekday 10-16"]] },
      { t: "slider", key: "efe", tw: "cu", label: "EFE-language sensitivity", q: "scam-script match threshold", min: 0, max: 100, step: 5, unit: "" },
      { t: "toggle", key: "trusted", tw: "pc", label: "Trusted-contact outreach", q: "call a pre-registered contact before money moves" },
      { t: "slider", key: "coverage", tw: "cu", label: "Cohort coverage", q: "share targeted", min: 5, max: 100, step: 5, unit: "%" },
    ],
    compute(S, cfg) {
      const sev = { step_up: 0.45, hold: 0.8, block: 1.0 }[S.severity];
      const efe = S.efe / 100;
      const thr = clamp((50000 - S.threshold) / 45000, 0, 1);
      const cov = S.coverage / 100;
      const win = { always: 1, payout: 0.86, weekday: 0.72 }[S.window];
      const catch_ = clamp(0.5 * sev + 0.3 * efe + 0.2 * thr, 0, 1) * win;
      const fraud = -(0.35 + 1.55 * catch_);
      const fraudCIu = fraud + (0.55 - 0.42 * catch_);
      const fpRate = clamp(0.03 + 0.16 * sev * efe + 0.08 * thr, 0, 0.32);
      const nProt = cfg.pop * cov * catch_ * 0.045;
      const complaints = Math.round(fpRate * (cfg.pop * cov) * 0.03 * (S.trusted ? 0.7 : 1.0));
      const complaintCeil = 30;
      const lossAvoided = nProt * 5200;
      const ccCost = -(nProt * 120) * (S.trusted ? 1.0 : 0.7);
      const ok = (complaints <= complaintCeil) && (fraudCIu <= 0);
      return {
        primary: [
          { cls: "good", label: "Fraud rate", val: fraud.toFixed(2) + " bps", desc: "exploitation prevented", barPct: clamp(-fraud / 2.4 * 100, 2, 100), barCol: "var(--green)", ci: "95% CI upper " + fraudCIu.toFixed(2) + " bps" },
          { cls: "good", label: "$ loss avoided", val: fmtUSDraw(lossAvoided), desc: "EFE / wire losses prevented, annual", barPct: clamp(lossAvoided / 2.5e6 * 100, 2, 100), barCol: "var(--green)", ci: nProt.toFixed(0) + " cases caught" },
          { cls: complaints > complaintCeil ? "bad" : "am", label: "Complaints", val: (complaints > 0 ? "+" : "") + complaints, desc: "false-positive complaints / yr · ceiling " + complaintCeil, barPct: clamp(complaints / complaintCeil * 100, 2, 100), barCol: complaints > complaintCeil ? "var(--red)" : "var(--acc)", ci: "GUARDRAIL — good customers harmed (Margaret)" },
          { cls: "bad", label: "False-positive rate", val: (fpRate * 100).toFixed(1) + "%", desc: "genuine wires wrongly held", barPct: clamp(fpRate / 0.32 * 100, 2, 100), barCol: "var(--red)", ci: "rises with severity × sensitivity" },
          { cls: "good", label: "Contact-centre cost", val: fmtUSDraw(ccCost), desc: "calls avoided" + (S.trusted ? " (trusted-contact)" : ""), barPct: clamp(Math.abs(ccCost) / 1e6 * 100, 2, 100), barCol: "var(--green)", ci: "" },
          { cls: "bl", label: "Customers protected", val: fmtInt(nProt), desc: "of " + fmtInt(cfg.pop * cov) + " in scope", barPct: clamp(catch_ * 100, 2, 100), barCol: "var(--acq)", ci: "" },
        ],
        guardrail: {
          ok,
          text: ok
            ? "✓ Customer-harm ceiling met — complaints " + complaints + " ≤ " + complaintCeil + " and fraud CI upper " + fraudCIu.toFixed(2) + " ≤ 0. Proportionate protection."
            : "⚠ INVERTED GUARDRAIL BREACH — over-tightening harms good customers: complaints " + complaints + (complaints > complaintCeil ? " > " + complaintCeil : "") + (fraudCIu > 0 ? "; fraud CI upper " + fraudCIu.toFixed(2) + " > 0" : "") + ". Soften the action or raise the threshold.",
        },
        gate: { fraudCIu, complaints, complaintCeil, nii: lossAvoided },
      };
    },
  },

  /* C - life-event capture (suitability gate) */
  C: {
    base: { window: 14, incentive: 35, touch: "advisory", evidenced: true, coverage: 60 },
    levers: [
      { t: "slider", key: "window", tw: "pr", label: "Primacy window", q: "days the offer stays open", min: 5, max: 30, step: 1, unit: "d" },
      { t: "slider", key: "incentive", tw: "pr", label: "Incentive", q: "ceiling lift across the window", min: 0, max: 50, step: 5, unit: "%" },
      { t: "seg", key: "touch", tw: "ch", label: "Human touch", q: "channel of the offer", opts: [["digital", "Digital"], ["rm", "RM hand-off"], ["advisory", "Advisory"]] },
      { t: "toggle", key: "evidenced", tw: "cu", label: "Need evidenced (consent)", q: "offer only when need is shown — Reg BI" },
      { t: "slider", key: "coverage", tw: "cu", label: "Cohort coverage", q: "share targeted", min: 5, max: 100, step: 5, unit: "%" },
    ],
    compute(S, cfg) {
      const capWin = clamp(1 - Math.abs(S.window - 14) / 40, 0.5, 1);
      const inc = Math.tanh(S.incentive / 30);
      const touchW = { digital: 0.45, rm: 0.78, advisory: 1.0 }[S.touch];
      const touchIdx = { digital: 0, rm: 1, advisory: 2 }[S.touch];
      const cov = S.coverage / 100;
      const capture = clamp(0.4 * capWin + 0.3 * inc + 0.3 * touchW, 0, 1);
      const growthNII = cov * capture * 1.092e7;
      const attach = 18 * (capture / 0.947);
      const primacy = 25 * (capture / 0.947);
      const fee = touchW * cov * 9.0e5;
      const cts = touchIdx * cov * cfg.pop * 8;
      const suitFail = (S.touch === "advisory" && !S.evidenced);
      const ok = !suitFail && (growthNII + fee > cts * 1.2);
      return {
        primary: [
          { cls: "am", label: "Growth NII", val: fmtUSDraw(growthNII), desc: "new earning balances, annual", barPct: clamp(growthNII / 7e6 * 100, 2, 100), barCol: "var(--acc)", ci: "95% CI " + fmtUSDraw(growthNII * 0.62) + " … " + fmtUSDraw(growthNII * 1.38) },
          { cls: "am", label: "Fee income", val: fmtUSDraw(fee), desc: "advisory + interchange, annual", barPct: clamp(fee / 1e6 * 100, 2, 100), barCol: "var(--acc)", ci: "" },
          { cls: "vi", label: "Multi-product attach", val: "+" + attach.toFixed(1) + "pp", desc: "products per relationship", barPct: clamp(attach / 25 * 100, 2, 100), barCol: "var(--violet)", ci: "" },
          { cls: "vi", label: "Primacy capture", val: "+" + primacy.toFixed(0) + "%", desc: "becoming primary in window", barPct: clamp(primacy / 30 * 100, 2, 100), barCol: "var(--violet)", ci: "window τ ≈ 14d" },
          { cls: "bl", label: "Cost-to-serve", val: fmtUSDraw(cts), desc: "human-touch cost, annual", barPct: clamp(cts / 3e6 * 100, 2, 100), barCol: "var(--acq)", ci: S.touch + " channel" },
          { cls: suitFail ? "bad" : "good", label: "Suitability", val: suitFail ? "FAIL" : "OK", desc: "Reg BI — advisory = a recommendation", barPct: suitFail ? 100 : 18, barCol: suitFail ? "var(--red)" : "var(--green)", ci: suitFail ? "advisory offered without evidenced need" : "need evidenced / consent on" },
        ],
        guardrail: {
          ok,
          text: ok
            ? "✓ Suitability met — offer matches evidenced need (Reg BI), and capture value " + fmtUSDraw(growthNII + fee) + " exceeds cost-to-serve " + fmtUSDraw(cts) + "."
            : (suitFail
                ? "⚠ SUITABILITY FAIL — an advisory introduction is a recommendation; offering it without evidenced need breaches Reg BI. Turn on need-evidenced, or drop to RM/digital."
                : "⚠ Cost-to-serve exceeds capture value — narrow coverage or lower the human-touch tier."),
        },
        gate: { suitFail, nii: growthNII, cts },
      };
    },
  },

  /* E - price/defend margin (cautionary - drift gate refuses) */
  E: {
    base: { band: 30, trigger: "probing", tiers: true, coverage: 60 },
    levers: [
      { t: "slider", key: "band", tw: "pr", label: "Relationship price", q: "top-band rate offered", min: 0, max: 60, step: 5, unit: "bps" },
      { t: "seg", key: "trigger", tw: "ch", label: "Trigger pattern", q: "what fires the price", opts: [["aggregator", "Aggregator"], ["probing", "Probing xfer"], ["spread", "Spread breach"]] },
      { t: "toggle", key: "tiers", tw: "cu", label: "Stickiness guard", q: "distinguish sticky balances (Beatrice) from elastic" },
      { t: "slider", key: "coverage", tw: "cu", label: "Cohort coverage", q: "share targeted", min: 5, max: 100, step: 5, unit: "%" },
    ],
    compute(S, cfg) {
      const band = S.band / 60;
      const trig = { aggregator: 0.55, probing: 0.8, spread: 0.7 }[S.trigger];
      const cov = S.coverage / 100;
      const retNII = band * trig * cov * 4.58e6;
      const complaints = Math.round(band * cov * cfg.pop * 0.004 * (S.tiers ? 0.6 : 1.0));
      const stickyFP = Math.round(cov * cfg.pop * 0.05 * band * (S.tiers ? 0.25 : 1.0));
      const balances = retNII / 0.0277;
      return {
        primary: [
          { cls: "am", label: "Retention NII", val: fmtUSDraw(retNII), desc: "margin defended, annual (if it could deploy)", barPct: clamp(retNII / 1.5e6 * 100, 2, 100), barCol: "var(--acc)", ci: "tempting — but see drift" },
          { cls: "bl", label: "Balances retained", val: fmtUSDraw(balances), desc: "deposit balances defended", barPct: clamp(balances / 6e7 * 100, 2, 100), barCol: "var(--acq)", ci: "" },
          { cls: complaints > 20 ? "bad" : "am", label: "Complaints (UDAAP)", val: (complaints > 0 ? "+" : "") + complaints, desc: "differential-pricing exposure", barPct: clamp(complaints / 40 * 100, 2, 100), barCol: complaints > 20 ? "var(--red)" : "var(--acc)", ci: "transparent, consistent basis required" },
          { cls: "bad", label: "Sticky mis-priced", val: fmtInt(stickyFP), desc: "operationally-sticky balances re-priced (Beatrice)", barPct: clamp(stickyFP / 300 * 100, 2, 100), barCol: "var(--red)", ci: S.tiers ? "stickiness guard on" : "guard OFF — margin given away" },
          { cls: "bad", label: "Model drift", val: "UNSTABLE", desc: "rate_sensitive_drift · 380 injections", barPct: 100, barCol: "var(--red)", ci: "GATE WILL REFUSE — cannot price on a drifting model" },
        ],
        guardrail: { ok: false, text: "⛔ MODEL DRIFT — the elasticity model's drift_state is rate_sensitive_drift. The numbers above are tempting, but pricing on a drifting model is pricing on noise. The gate will refuse this play — and that restraint is the decision." },
        gate: { drift: true, complaints, nii: retNII },
      };
    },
  },

  /* D - deepen / defend balances (idle-cash activation · deposit defence) */
  D: {
    base: { rate: 20, vehicle: "cd", uplift: true, coverage: 60 },
    levers: [
      { t: "slider", key: "rate", tw: "pr", label: "Rate offered", q: "yield uplift / give-up, basis points", min: 0, max: 80, step: 5, unit: "bps" },
      { t: "seg", key: "vehicle", tw: "pr", label: "Yield vehicle", q: "where the balance goes", opts: [["cd", "Short CD"], ["hys", "High-yield savings"], ["mma", "Money-market"]] },
      { t: "toggle", key: "uplift", tw: "cu", label: "Uplift targeting", q: "treat only likely movers — don't overpay the book" },
      { t: "slider", key: "coverage", tw: "cu", label: "Cohort coverage", q: "share targeted", min: 5, max: 100, step: 5, unit: "%" },
    ],
    compute(S, cfg) {
      const econ = cfg.dband || { avgBal: 24000, nim: 0.0175, respMax: 0.45, half: 22 };
      const cov = S.coverage / 100;
      const vehMult = { cd: 1.0, hys: 0.92, mma: 0.85 }[S.vehicle];
      const resp = econ.respMax * (S.rate / (S.rate + econ.half)) * vehMult;
      const converts = cfg.pop * cov * resp;
      const balances = converts * econ.avgBal;
      const giveUp = balances * (S.rate / 10000);
      const grossNII = balances * econ.nim;
      const wasted = giveUp * (S.uplift ? 0 : 0.6);   // over-pay on balances that weren't moving
      const netNII = grossNII - giveUp - wasted;
      const ret = cfg.objective === "ret";
      const overPaying = !S.uplift && S.rate > 40;
      const ok = netNII > 0 && !overPaying;
      return {
        primary: [
          { cls: "am", label: "Net interest income", val: fmtUSDraw(netNII), desc: "NIM on balances, less give-up, annual", barPct: clamp(netNII / 2e7 * 100, 2, 100), barCol: "var(--acc)", ci: "95% CI " + fmtUSDraw(netNII * 0.72) + " … " + fmtUSDraw(netNII * 1.28) },
          { cls: "bl", label: ret ? "Balances retained" : "Balances activated", val: fmtUSDraw(balances), desc: ret ? "deposit balances defended" : "idle balances moved to yield", barPct: clamp(balances / 1.5e9 * 100, 2, 100), barCol: "var(--acq)", ci: "" },
          { cls: "good", label: "Net interest margin", val: (econ.nim * 100).toFixed(2) + "%", desc: "spread earned on those balances", barPct: clamp(econ.nim * 100 / 2 * 100, 10, 100), barCol: "var(--green)", ci: "" },
          { cls: overPaying ? "bad" : "am", label: "Rate give-up", val: fmtUSDraw(-(giveUp + wasted)), desc: "cost of the rate offered" + (S.uplift ? " (targeted)" : " — incl. over-pay"), barPct: clamp((giveUp + wasted) / 5e6 * 100, 2, 100), barCol: overPaying ? "var(--red)" : "var(--acc)", ci: S.uplift ? "uplift-targeted — the give-up is the profit" : "GUARDRAIL — paying up on balances not at risk" },
          { cls: "bl", label: "Customers", val: fmtInt(converts), desc: "of " + fmtInt(cfg.pop * cov) + " in scope", barPct: clamp(resp * 100, 2, 100), barCol: "var(--acq)", ci: "" },
          { cls: ok ? "good" : "bad", label: "Margin", val: ok ? "PROTECTED" : "ERODED", desc: ret ? "defence stays margin-positive" : "activation stays margin-positive", barPct: ok ? 20 : 100, barCol: ok ? "var(--green)" : "var(--red)", ci: ok ? "net positive after give-up" : "over-pay exceeds the NIM gained" },
        ],
        guardrail: {
          ok,
          text: ok
            ? "✓ Margin protected — net NII " + fmtUSDraw(netNII) + " stays positive after give-up; uplift targeting keeps the rate on balances genuinely " + (ret ? "at risk" : "idle") + "."
            : "⚠ MARGIN EROSION — turning uplift off and pushing the rate over-pays balances that weren't moving. The give-up " + fmtUSDraw(giveUp + wasted) + " outruns the NIM gained. Re-target or lower the rate.",
        },
        gate: { nii: netNII, giveUp: giveUp + wasted, ok },
      };
    },
  },
};

/* ---- stage spec ---- */
const EXPNAMES = {
  stepped_wedge: ["Stepped-Wedge", "staggered cohort rollout"],
  consent_aware: ["Consent-Aware Test", "encouragement design"],
  holdout: ["Field Test", "controlled RCT"],
};

function buildStages(EXPNAME) {
  return [
    { id: "sense", n: "01", name: "Sense", sub: "Signal & theme", hil: false, run: 1100, autoMsg: "Sensing signal cluster…", action: null },
    { id: "hyp", n: "02", name: "Hypothesize", sub: "Reasons · interventions", hil: true, run: 1500, autoMsg: "Generating & ranking hypotheses…", action: "Confirm hypothesis & continue →", hint: "select the hypothesis to carry forward" },
    { id: "model", n: "03", name: "Model Stack", sub: "Composite twin fabric", hil: false, run: 1700, autoMsg: "Assembling the composite twin fabric — customer · product · process · channel · macro…", action: null },
    { id: "sim", n: "04", name: "Simulate & Optimize", sub: "Deep what-if levers", hil: true, run: 1100, autoMsg: "Initialising response surface…", action: "Accept simulation & send to gate →", hint: "tune the decision levers, then accept" },
    { id: "gate", n: "05", name: "Decide & Govern", sub: "Gate · approval workflow", hil: true, run: 1200, autoMsg: "Evaluating gate on current levers…", action: "Approve & promote →", hint: "review the gate, then approve" },
    { id: "test", n: "06", name: EXPNAME[0], sub: EXPNAME[1], hil: true, run: 1900, autoMsg: "Running " + EXPNAME[1] + "…", action: "Accept result & deploy →", hint: "review the " + EXPNAME[1] },
    { id: "learn", n: "07", name: "Deploy & Learn", sub: "Activate · write-back", hil: false, run: 1500, autoMsg: "Promoting policy · writing back to twins…", action: null },
  ];
}

const CAPS = (ENG, EXPNAME) => ({
  sense: "Signal & theme · why this surfaced",
  hyp: "Reasons · interventions · binding constraint",
  model: "Composite twin fabric × macro field",
  sim: "Engine " + ENG + " · deep what-if",
  gate: "Decision gate · governance · approval",
  test: EXPNAME[1],
  learn: "Deploy · measure · write-back · compound",
});

const TWN_NAMES = { cu: "customer", pr: "product", pc: "process", ch: "channel", ma: "macro" };
const TwTag = ({ tw }) => tw ? <span className={"twtag " + tw}>{TWN_NAMES[tw]}</span> : null;

/* =====================================================================
   Component
   ===================================================================== */
export default function DeepPipeline() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const themeParam = searchParams.get("theme") || "elder";

  // gig redirects to its dedicated pipeline
  useEffect(() => {
    if (themeParam === "gig") navigate("/gig-pipeline", { replace: true });
  }, [themeParam, navigate]);

  // resolve config (fall back to elder if unknown)
  const THEME = themeParam === "gig" ? "elder" : themeParam;
  const CFG = CONFIGS[THEME] || CONFIGS.elder;
  const CT = CFG.content;
  const ENG = CFG.engine;
  const PERS = useMemo(() => CFG.personas.map(id => PERSONAS[id]), [CFG]);
  const EXPNAME = EXPNAMES[CFG.experiment];
  const STAGES = useMemo(() => buildStages(EXPNAME), [EXPNAME]);
  const capMap = useMemo(() => CAPS(ENG, EXPNAME), [ENG, EXPNAME]);

  // engine state (reset when engine changes)
  const [ST, setST] = useState(() => ({ ...ENGINE_KERNELS[ENG].base }));
  useEffect(() => { setST({ ...ENGINE_KERNELS[ENG].base }); }, [ENG]);

  // Deep-link stage via ?stage=N — useful for screenshots, demos, support.
  const stageParam = Math.max(0, Math.min(STAGES.length - 1, (parseInt(searchParams.get("stage") || "1", 10) || 1) - 1));
  const [STATUS, setSTATUS] = useState(() => STAGES.map((_, i) => i < stageParam ? "done" : "queued"));
  const [ACTIVE, setACTIVE] = useState(stageParam);
  const [AUTO, setAUTO] = useState(false);
  const [REFUSED, setREFUSED] = useState(false);
  const [gateApproved, setGateApproved] = useState(false);
  const [simStat, setSimStat] = useState("live · response surface");
  const [simRunning, setSimRunning] = useState(false);
  // 7-step Sim shell state (mirrors /pipeline + /gig-pipeline). The existing
  // renderSim body becomes "step 4 — Tune the policy"; the other 6 steps are
  // lightweight views over CFG.content + ENGINE_KERNELS data already in scope.
  const [simStep, setSimStep] = useState("autopilot");
  const [simCompleted, setSimCompleted] = useState({});
  const [adoptedHyp, setAdoptedHyp] = useState(null);
  const [approvedSiblings, setApprovedSiblings] = useState([]);
  const [coverage, setCoverage] = useState(60);

  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const stepperRef = useRef({});

  // The .deep-pipeline wrapper sets its own background via tokens, so we
  // no longer need to paint body. (Hardcoding a dark color here clobbered
  // light mode.)

  // reset run state when stages list changes (e.g., theme switch). Honors
  // ?stage=N so deep-linking into a specific stage survives the reset.
  useEffect(() => {
    setSTATUS(STAGES.map((_, i) => i < stageParam ? "done" : "queued"));
    setACTIVE(stageParam);
    setAUTO(false);
    setREFUSED(false);
    setGateApproved(false);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [STAGES, stageParam]);

  // ----- evaluate gate (pure, recomputes on lever change) -----
  const gateEval = useMemo(() => {
    const r = ENGINE_KERNELS[ENG].compute(ST, CFG);
    const g = r.gate;
    const rows = [];
    let refused = false, refuseText = "", failText = "";
    rows.push({ c: "Winner declared", m: "stopping rule fired in prior test", pass: true, tw: "pc" });
    CFG.teeth.forEach(t => {
      if (t === "fraud") {
        const p = g.fraudCIu <= 0;
        rows.push({ c: "Fraud not worsened", m: "fraud_rate_delta ci_upper " + (g.fraudCIu != null ? g.fraudCIu.toFixed(2) : "—") + " bps ≤ 0", pass: p, tw: "ch" });
        if (!p) failText = "Fraud guardrail breached.";
      } else if (t === "false_positive") {
        const p2 = g.complaints <= g.complaintCeil;
        rows.push({ c: "Customer-harm ceiling (false-positive)", m: "complaints " + g.complaints + " ≤ " + g.complaintCeil, pass: p2, tw: "pc" });
        if (!p2) failText = "Over-tightening harms good customers (complaints " + g.complaints + " > " + g.complaintCeil + ").";
      } else if (t === "suitability") {
        const p3 = !g.suitFail;
        rows.push({ c: "Suitability / Reg BI", m: g.suitFail ? "advisory offered without evidenced need" : "offer matches evidenced need", pass: p3, tw: "cu" });
        if (!p3) failText = "Advisory recommendation lacks evidenced need (Reg BI).";
      } else if (t === "fairness") {
        rows.push({ c: "Fairness / disparate impact", m: "eligibility signal not a protected-class proxy (pre-registered)", pass: true, tw: "cu" });
      } else if (t === "udaap") {
        rows.push({ c: "UDAAP / differential pricing", m: "transparent, consistent basis required", pass: !g.drift, tw: "pc" });
      } else if (t === "drift") {
        const p4 = !g.drift;
        rows.push({ c: "Model drift (SR 11-7)", m: "cluster drift_state = " + (CFG.driftState || "stable"), pass: p4, tw: "ma" });
        if (!p4) { refused = true; refuseText = "The elasticity model is drifting (rate_sensitive_drift); it cannot be priced on this cycle."; }
      }
    });
    if (g.nii != null) rows.push({ c: "Value positive", m: "value at lower CI > 0", pass: true, tw: "pr" });
    rows.push({ c: "Build integrity", m: "model build hash verified · SR 11-7 logged", pass: true, tw: "ma" });
    const allPass = rows.every(x => x.pass);
    return { rows, allPass, refused, refuseText, failText };
  }, [ST, ENG, CFG]);

  /* ============= autopilot state-machine ============= */
  const clearAuto = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  const enterStage = useCallback((i) => {
    clearAuto();
    setACTIVE(i);
    setSTATUS(prev => prev.map((v, k) => k === i ? "running" : v));
    const s = STAGES[i];
    stepperRef.current.advance = () => {
      setSTATUS(prev => prev.map((v, k) => k === i ? (s.hil ? "await" : "done") : v));
      if (!s.hil && stepperRef.current.auto) {
        timerRef.current = setTimeout(() => {
          if (i < STAGES.length - 1) enterStage(i + 1);
          else { stepperRef.current.auto = false; setAUTO(false); }
        }, 650);
      }
    };
    const delay = stepperRef.current.auto ? s.run : 520;
    timerRef.current = setTimeout(() => stepperRef.current.advance && stepperRef.current.advance(), delay);
  }, [STAGES]);

  // mirror AUTO into the ref so enterStage closures see latest value
  useEffect(() => { stepperRef.current.auto = AUTO; }, [AUTO]);

  // initial entry — honors ?stage=N deep links
  useEffect(() => { enterStage(stageParam); return clearAuto; /* eslint-disable-next-line */ }, [STAGES, stageParam]);

  const play = () => {
    stepperRef.current.auto = true;
    setAUTO(true);
    const st = STATUS[ACTIVE];
    if (st === "await") return;
    if (st === "done") {
      if (ACTIVE < STAGES.length - 1) enterStage(ACTIVE + 1);
      else { stepperRef.current.auto = false; setAUTO(false); }
      return;
    }
    enterStage(ACTIVE);
  };
  const pause = () => {
    stepperRef.current.auto = false;
    setAUTO(false);
    clearAuto();
  };
  const step = () => {
    const st = STATUS[ACTIVE];
    const s = STAGES[ACTIVE];
    if (st === "await") {
      if (s.id === "gate") {
        if (gateEval.refused) return;
        if (!gateEval.allPass) { pause(); enterStage(3); return; }
        setGateApproved(true);
      }
      completeHIL();
      return;
    }
    if (st === "running") return;
    if (ACTIVE < STAGES.length - 1) enterStage(ACTIVE + 1);
  };
  const resetRun = () => {
    pause();
    setREFUSED(false);
    setGateApproved(false);
    setSTATUS(STAGES.map(() => "queued"));
    enterStage(0);
  };
  const completeHIL = () => {
    const i = ACTIVE;
    setSTATUS(prev => prev.map((v, k) => k === i ? "done" : v));
    if (stepperRef.current.auto) {
      timerRef.current = setTimeout(() => {
        if (i < STAGES.length - 1) enterStage(i + 1);
        else { stepperRef.current.auto = false; setAUTO(false); }
      }, 600);
    }
  };

  /* rail click */
  const onRailClick = (i) => { pause(); enterStage(i); };

  /* header sync derived */
  const stageActive = STAGES[ACTIVE];
  const statusActive = STATUS[ACTIVE];
  const whStatusMap = { running: ["run", "running"], await: ["hold", "awaiting input"], done: ["done", "complete"], queued: ["", "queued"] };
  const whBits = whStatusMap[statusActive];

  /* subbar bits */
  const vb = CFG.valueBridge;
  const vbHead = vb.retentionNII || vb.growthNII || vb.lossAvoided || vb.headline;
  const expLabel = { stepped_wedge: "stepped-wedge", consent_aware: "consent-aware", holdout: "holdout" }[CFG.experiment];

  /* ===================================================================
     STAGE RENDERERS - all return JSX, no innerHTML.
     =================================================================== */

  const renderSense = () => (
    <>
      <div className="sec-intro">
        A money-movement signal cluster surfaced on the cockpit and routed to this theme. <b>Value lever: {CFG.valueLever}</b> · economic buyer: <b>{CFG.buyer}</b>. TwinX <b>senses</b> the pattern in the moment, before it becomes a loss, a complaint, or a lost relationship.
      </div>
      <div className="panel">
        <div className="panel-h"><span className="pdot bl" /><span className="pt">Signals on this line</span><span className="pm">8-category meter · cluster-scoped</span></div>
        <div className="pbody">
          <div className="sigrow">
            {CT.signals.map((s, i) => (
              <div className="sig" key={i}>
                <div className="ic">{s.ic}</div>
                <div>
                  <div className="st">{s.t}</div>
                  <div className="sd">{s.d}</div>
                  <div className="sv">{s.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-h"><span className="pdot" /><span className="pt">Cluster identity</span><span className="pm">{CFG.cluster}</span></div>
        <div className="pbody">
          <div className="kvs">
            <KV k="Cohort" v={fmtInt(CFG.pop)} s={(CFG.share * 100).toFixed(1) + "% share"} />
            <KV k="Value lever" v={CFG.valueLever} />
            <KV k="Economic buyer" v={CFG.buyer} />
            <KV k="Scenario" v={EXPNAME[0]} s={EXPNAME[1]} />
            <KV k="Engine" v={ENG} s={ENGINE_LABELS[ENG]} />
            <KV k="Binding constraint" v={CFG.bindingConstraint.owner} />
          </div>
        </div>
      </div>
    </>
  );

  const renderHyp = () => (
    <>
      <div className="sec-intro">
        TwinX generates and ranks hypotheses: first <b>why</b> the pattern occurs, then <b>what intervention</b> fits — and it surfaces the <b>weaker siblings too</b>, so the human sees what was rejected and why.
      </div>
      <div className="panel">
        <div className="panel-h"><span className="pdot bl" /><span className="pt">Why is this happening?</span><span className="pm">diagnosis · likelihood-weighted</span></div>
        <div className="pbody">
          <div className="reasons">
            {CT.reasons.map((r, i) => (
              <div className="reason" key={i}>
                <div className="rh"><span className="rn">{r.n}</span><span className="rt">{r.t}</span></div>
                <div className="rd">{r.d}</div>
                <div className="bar"><i style={{ width: r.pct + "%" }} /></div>
                <div className="rl"><span>likelihood weight</span><span>{r.pct}% · {r.a}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-h"><span className="pdot" /><span className="pt">Candidate interventions</span><span className="pm">champion + rejected siblings</span></div>
        <div className="pbody">
          {CT.hyps.map((h, i) => (
            <div className={"hyp" + (h.win ? " win" : "")} key={i}>
              <div className="hyp-h">
                <span className="hyp-id">{h.id}</span>
                <span className="hyp-kind">{h.kind}</span>
                {h.win
                  ? <span className="hyp-win">★ champion</span>
                  : h.fail
                    ? <span className="hyp-win" style={{ color: "var(--red)", background: "rgba(255,122,122,.12)" }}>✕ {h.fail} fail</span>
                    : null}
              </div>
              <div className="hyp-b">
                <div className="hyp-desc">{h.desc}</div>
                <div className="chips" style={{ marginBottom: 9 }}>
                  {h.params.map((p, j) => <span className="chip" key={j}><b>{p[0]}</b> {p[1]}</span>)}
                </div>
                <div className="chips">
                  {h.out.map((o, j) => {
                    const cls = o[2] < 0 ? "gr" : (/⚠|⛔/.test(o[1]) ? "rd" : "bl");
                    return <span className={"chip " + cls} key={j}>{o[0]} {o[1]}</span>;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-h"><span className="pdot vi" /><span className="pt">Binding constraint · {CFG.bindingConstraint.owner}</span><span className="pm">pre-registered before any deploy</span></div>
        <div className="pbody"><div className="lead">{CFG.bindingConstraint.text}</div></div>
      </div>
    </>
  );

  const renderModel = () => {
    const m = CFG.macro || {};
    const tw = CFG.twins || {};
    const heroKey = Object.keys(tw).find(k => tw[k]?.hero) || "";
    const heroName = (tw[heroKey]?.nm) || (m.drift ? m.state : "");
    const customerTwin = {
      nm: PERS.length + " customer twins",
      sub: "who · response function",
      sim: "High-fidelity cohort replicas — state, propensities and how they respond to an intervention. Detailed below.",
      fid: [["of cohort", fmtInt(CFG.pop)], ["shown", PERS.length + ""]],
    };
    const tcard = (layer, cls, t, heroOn) => {
      if (!t) return null;
      return (
        <div className={"tcard " + cls + (heroOn ? " hero" : "")}>
          {heroOn ? <span className="hero-b">hero twin</span> : null}
          <div className="tc-l">{layer}</div>
          <div className="tc-nm">{t.nm}</div>
          <div className="tc-sub">{t.sub}</div>
          <div className="tc-sim">{t.sim}</div>
          <div className="tc-fid">{(t.fid || []).map((x, i) => <span key={i}>{x[0]} <b>{x[1]}</b></span>)}</div>
        </div>
      );
    };
    return (
      <>
        <div className="sec-intro">
          TwinX assembles a <b>composite twin fabric</b> — not one model. Four owned twins (customer · product · process · channel) compose <i>under</i> the macro field, so a decision can be simulated end-to-end. For <b>{CFG.theme}</b> the <span className="hl">hero twin is {m.drift ? "the macro field" : "the " + heroKey + " twin"}</span> — {heroName}.
        </div>
        <div className={"macroband" + (m.drift ? " drift" : "")}>
          <span className="mb-k">{m.drift ? "⚠ macro · outside-in" : "macro · outside-in"}</span>
          <div>
            <div className="mb-st">{m.state || ""}</div>
            <div className="mb-sub">{m.sub || ""}</div>
          </div>
          <div className="mb-f">
            {(m.field || []).map((f, i) => <span key={i}>{f}</span>)}
          </div>
        </div>
        <div className="tfabric">
          {tcard("Customer twin", "cu", customerTwin, false)}
          {tcard("Product twin", "pr", tw.product, tw.product && tw.product.hero)}
          {tcard("Process twin", "pc", tw.process, tw.process && tw.process.hero)}
          {tcard("Channel twin", "ch", tw.channel, tw.channel && tw.channel.hero)}
        </div>
        <div className="mstack">
          <div>
            <div className="panel">
              <div className="panel-h"><span className="pdot bl" /><span className="pt">Customer twins · detail</span><span className="pm">{PERS.length} of {fmtInt(CFG.pop)}</span></div>
              <div className="pbody">
                {PERS.map((t, i) => {
                  const cls = "twin " + (t.kind === "falsepos" ? "fp" : t.kind) + (i === 0 ? " sel" : "");
                  return (
                    <div className={cls} key={t.id}>
                      <div className="twin-h">
                        <div className="tw-av">{t.init}</div>
                        <div>
                          <div className="tw-nm">{t.nm}</div>
                          <div className="tw-sb">{t.sb}</div>
                        </div>
                        <span className="tw-tag">{t.tag}</span>
                      </div>
                      <div className="fvec">
                        {t.fv.map((f, j) => (
                          <div className="fv" key={j}>
                            <span className="fl">{f[0]}</span>
                            <span className="fb"><i style={{ width: (f[1] * 100) + "%" }} /></span>
                            <span className="fn">{f[1].toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="note" style={{ marginTop: 8 }}>{t.moment}</div>
                    </div>
                  );
                })}
                {PERS.some(t => t.kind === "falsepos") ? (
                  <div className="note">
                    A <span style={{ color: "var(--red)" }}>false-positive twin</span> is included on purpose — the guardrail is only credible if the demo can show a <b>good</b> customer harmed by over-reach.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div>
            <div className="panel">
              <div className="panel-h"><span className="pdot vi" /><span className="pt">Behavioral models generated</span><span className="pm">engine {ENG} stack</span></div>
              <div className="pbody">
                {CT.models.map((mod, i) => (
                  <div className="model" key={i}>
                    <div className={"mi " + mod.c}>{mod.ic}</div>
                    <div>
                      <div className="mt">{mod.t}</div>
                      <div className="md">{mod.d}</div>
                      <div className="mq">{mod.q.map((x, j) => <span key={j}>{x[0]} <b>{x[1]}</b></span>)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  /* SIM */
  const setLever = (k, v) => setST(prev => ({ ...prev, [k]: v }));
  const runSimDraws = () => {
    if (simRunning) return;
    setSimRunning(true);
    let i = 0;
    const iv = setInterval(() => {
      i += Math.floor(80 + Math.random() * 150);
      if (i >= 1000) {
        clearInterval(iv);
        setSimStat("converged · 1,000 draws");
        setSimRunning(false);
      } else {
        setSimStat("drawing… " + i + " / 1000");
      }
    }, 70);
  };
  /* ==========================================================================
     DEEP SIM SHELL — 7-step guided flow (matches /pipeline + /gig-pipeline).
     The existing renderSim() body lives inside step 4 ("Tune the policy"),
     so all the engine-kernel math is preserved. Other steps are derived
     views over data already in scope: CT.reasons, CT.hyps, CFG.cluster, etc.
     ========================================================================== */
  const DEEP_SIM_STEPS = [
    { key: "autopilot", label: "Autopilot",               hint: "Recommended",   autopilot: true },
    { key: "baseline",  label: "Recent performance",      hint: "Insight" },
    { key: "hyps",      label: "Hypotheses",              hint: "Insight" },
    { key: "levers",    label: "Tune the policy",         hint: "Decision" },
    { key: "rollout",   label: "Rollout & guardrails",    hint: "Decision" },
    { key: "simulate",  label: "Simulate & see outcomes", hint: "Run" },
    { key: "verify",    label: "Verify & promote",        hint: "Hand-off" },
  ];
  const simIdx = DEEP_SIM_STEPS.findIndex((s) => s.key === simStep);
  const goSimNext = () => {
    if (simIdx < DEEP_SIM_STEPS.length - 1) {
      setSimCompleted((c) => ({ ...c, [simStep]: true }));
      setSimStep(DEEP_SIM_STEPS[simIdx + 1].key);
    }
  };
  const goSimBack = () => { if (simIdx > 0) setSimStep(DEEP_SIM_STEPS[simIdx - 1].key); };
  const adoptDeepHyp = (h) => {
    setAdoptedHyp(h);
    setSimCompleted((c) => ({ ...c, autopilot: true }));
    setSimStep("baseline");
  };
  const skipDeepAutopilot = () => {
    setSimCompleted((c) => ({ ...c, autopilot: true }));
    setSimStep("baseline");
  };
  const toggleDeepSibling = (id) =>
    setApprovedSiblings((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);

  const activeDeepHyp = adoptedHyp || (CT.hyps || [])[0];
  const otherDeepHyps = (CT.hyps || []).filter((h) => activeDeepHyp && h.id !== activeDeepHyp.id);

  const renderSimShellStrip = () => (
    <div className="simstrip">
      {DEEP_SIM_STEPS.map((s, i) => {
        const isActive = s.key === simStep;
        const isDone = i < simIdx || simCompleted[s.key];
        const cls = "simchip"
          + (s.autopilot ? " auto" : "")
          + (isActive ? " active" : "")
          + (isDone && !isActive ? " done" : "")
          + (!isActive && !isDone ? " queued" : "");
        return (
          <button key={s.key} className={cls} onClick={() => setSimStep(s.key)}>
            <span className="simchip-n">{s.autopilot ? "∫" : isDone && !isActive ? "✓" : i}</span>
            <span className="simchip-l">
              <span className="simchip-t">{s.label}</span>
              <span className="simchip-h">{s.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderDeepPolicyStrip = () => {
    const earnedAt = { hyp: 0, combine: 2, levers: 3, rollout: 4 };
    const isLocked = (factIdx) => simIdx > factIdx;
    const tunedCount = ENGINE_KERNELS[ENG].levers
      .filter((l) => ST[l.key] !== ENGINE_KERNELS[ENG].base[l.key]).length;
    const totalLevers = ENGINE_KERNELS[ENG].levers.length;
    const pill = (key, label, value, state) => (
      <div key={key} className={"ps-pill" + (state ? " ps-" + state : "")}>
        <span className="ps-l">{label}</span>
        <span className="ps-v">{value}</span>
      </div>
    );
    return (
      <div className="policy-strip">
        <div className="ps-title">Policy under construction</div>
        <div className="ps-pills">
          {pill("hyp", "Hypothesis",
            activeDeepHyp ? activeDeepHyp.kind : "—",
            activeDeepHyp ? (isLocked(earnedAt.hyp) ? "locked" : "set") : "empty"
          )}
          {pill("combine", "Combined ideas",
            approvedSiblings.length > 0 ? `+${approvedSiblings.length}` : "none",
            isLocked(earnedAt.combine) ? "locked" : (approvedSiblings.length > 0 ? "set" : "empty")
          )}
          {pill("levers", "Settings",
            tunedCount === 0 ? `${totalLevers} at default` : `${tunedCount} of ${totalLevers} tuned`,
            isLocked(earnedAt.levers) ? "locked" : (tunedCount > 0 ? "set" : "empty")
          )}
          {pill("rollout", "Rollout",
            `${coverage}%`,
            isLocked(earnedAt.rollout) ? "locked" : "set"
          )}
        </div>
      </div>
    );
  };

  const renderSim = () => {
    const ENGNOW = ENGINE_KERNELS[ENG];
    const inv = CFG.inverted ? <span className="invwarn">⮂ inverted guardrail</span> : null;
    const m = CFG.macro || {};
    const r = ENGNOW.compute(ST, CFG);
    return (
      <>
        <div className="sec-intro">
          Engine <b>{ENG} · {ENGINE_LABELS[ENG]}</b>. Each lever acts on a <b>twin</b> (tagged); each outcome is computed by the twin that owns it. {CFG.guardrailNote || CFG.consentNote || CFG.cautionNote || ""} {inv}
        </div>
        <div className={"macroread" + (m.drift ? " drift" : "")}>
          {m.drift ? "⚠ " : "◉ "}
          <span>macro state: <b>{m.state || ""}</b> — {m.sub || ""}</span>
        </div>
        <div className="simwrap">
          <div className="panel">
            <div className="panel-h"><span className="pdot" /><span className="pt">Decision levers</span><span className="pm">acting on the twins</span></div>
            <div className="pbody levers">
              {ENGNOW.levers.map(l => <Lever key={l.key} l={l} val={ST[l.key]} setLever={setLever} />)}
              <button className="runbtn" onClick={runSimDraws} disabled={simRunning}>▶ Run full simulation · 1,000 draws</button>
            </div>
          </div>
          <div>
            <div className="panel">
              <div className="panel-h"><span className="pdot gr" /><span className="pt">Predicted outcomes</span><span className="pm">{simStat}</span></div>
              <div className="pbody">
                <div className="outcards">
                  {r.primary.map((o, i) => (
                    <div className={"oc " + o.cls} key={i}>
                      <div className="ol">{o.label}</div>
                      <div className="ov">{o.val}</div>
                      <div className="od">{o.desc}</div>
                      {o.barPct != null
                        ? <div className="obar"><i style={{ width: clamp(o.barPct, 2, 100) + "%", background: o.barCol }} /></div>
                        : null}
                      {o.ci ? <div className="ci">{o.ci}</div> : null}
                    </div>
                  ))}
                </div>
                <div>
                  <div className={"guard " + (r.guardrail.ok ? "ok" : "breach")}>{r.guardrail.text}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  /* SIM SHELL — 7 guided steps wrapping the renderSim() body as step 4 */
  const renderSimShell = () => {
    const lbl = CFG.name || "this customer group";
    const onPromoteToGate = () => {
      const gateIdx = STAGES.findIndex((x) => x.id === "gate");
      if (gateIdx >= 0) {
        setSTATUS((prev) => prev.map((v, k) => k === ACTIVE ? "done" : v));
        setACTIVE(gateIdx);
      }
    };

    return (
      <div className="simshell">
        {renderSimShellStrip()}
        {simStep !== "autopilot" && renderDeepPolicyStrip()}

        {simStep === "autopilot" && (
          <div className="simstep-body">
            <div className="autopilot-hero">
              <div>
                <div className="ap-tag">AUTOPILOT</div>
                <div className="ap-title">Describe the outcome you want — get a ranked policy recommendation.</div>
                <div className="ap-sub">{(CT.hyps || []).length} candidate approaches considered for {lbl}. Adopt one, or skip and tune manually.</div>
              </div>
              <div className="ap-stat">
                <div><b>{(CT.hyps || []).length}</b><span>candidates</span></div>
                <div><b>1.2k</b><span>scenarios</span></div>
                <div><b>6.2s</b><span>compute</span></div>
              </div>
            </div>
            <div className="autopilot-results">
              <div className="ar-head">{(CT.hyps || []).length} hypotheses worth a look</div>
              {(CT.hyps || []).map((h, i) => (
                <div key={h.id} className={"ap-card" + (h.win ? " rec" : "")}>
                  <div className="ap-card-h">
                    {h.win && <span className="ap-rec">★ Champion</span>}
                    <span className="ap-card-name">{h.kind}</span>
                    <span className="ap-card-ref">ref: {h.id}</span>
                  </div>
                  <div className="ap-card-desc">{h.desc}</div>
                  <div className="ap-card-outcomes">
                    {h.out.map((o, j) => <span key={j}>{o[0]} {o[1]}{j < h.out.length - 1 ? " · " : ""}</span>)}
                  </div>
                  <div className="ap-card-cta">
                    <button className="ap-adopt" onClick={() => adoptDeepHyp(h)}>
                      {h.fail ? "Consider this hypothesis →" : "Adopt this hypothesis →"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <GigStepNavDeep stepIndex={0} stepTotal={7}
              canBack={false} canNext={false}
              secondary={{ label: "Skip — I'll tune the policy myself →", onClick: skipDeepAutopilot }}
              hint="Adopt the recommended hypothesis (above), or skip and walk through the steps yourself." />
          </div>
        )}

        {simStep === "baseline" && (
          <div className="simstep-body">
            <div className="step-intro">
              <h3>Recent performance · {lbl}
                <span className="step-intro-pop">about {fmtInt(CFG.pop)} accounts</span>
              </h3>
              <p>
                {adoptedHyp
                  ? <>You adopted <b>{adoptedHyp.kind}</b>. Before tuning it, here's the context this customer group sits in.</>
                  : <>Before you tune a policy, here's the context this customer group sits in.</>}
              </p>
            </div>
            <div className="panel">
              <div className="panel-h"><span className="pdot" /><span className="pt">Cluster context</span></div>
              <div className="pbody">
                <KV k="Cohort population" v={fmtInt(CFG.pop)} s={(CFG.share * 100).toFixed(1) + "% of book"} />
                {CFG.cluster && <KV k="Cluster id" v={CFG.cluster} />}
                {CFG.macro && CFG.macro.state && <KV k="Macro state" v={CFG.macro.state} s={CFG.macro.sub || ""} />}
                {CFG.valueLever && <KV k="Value lever" v={CFG.valueLever} />}
                {CFG.buyer && <KV k="Business owner" v={CFG.buyer} />}
              </div>
            </div>
            {CT.signals && (
              <div className="panel" style={{ marginTop: 12 }}>
                <div className="panel-h"><span className="pdot" /><span className="pt">What we're seeing for this group</span></div>
                <div className="pbody">
                  {CT.signals.slice(0, 4).map((sg, i) => (
                    <div key={i} className="period-row">
                      <span>{sg.t}</span>
                      <b style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{sg.v}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <GigStepNavDeep stepIndex={1} stepTotal={7} canBack canNext onBack={goSimBack} onNext={goSimNext}
              nextLabel="See alternative hypotheses →"
              hint="Pure context — no decisions made here. Press Enter or click Continue when ready." />
          </div>
        )}

        {simStep === "hyps" && (
          <div className="simstep-body">
            <div className="step-intro">
              <h3>Hypotheses for {lbl}</h3>
              <p>
                {adoptedHyp
                  ? <>You have <b>{adoptedHyp.kind}</b> in flight. TwinX considered <b>{otherDeepHyps.length} alternative {otherDeepHyps.length === 1 ? "approach" : "approaches"}</b> too — approve any to combine into your final policy.</>
                  : <>TwinX generated {(CT.hyps || []).length} hypotheses for this group. The champion is the recommended starting point. Approve any others to combine them.</>}
              </p>
            </div>
            {activeDeepHyp && (
              <div className="hyp-card active">
                <div className="hyp-h">
                  <span className="hyp-active">▶ Currently selected</span>
                  <span className="hyp-name">{activeDeepHyp.kind}</span>
                  {activeDeepHyp.win && <span className="hyp-star">★ Champion</span>}
                  <span className="hyp-ref">ref: {activeDeepHyp.id}</span>
                </div>
                <div className="hyp-desc">{activeDeepHyp.desc}</div>
                <div className="hyp-out">{activeDeepHyp.out.map((o, j) => <span key={j}>{o[0]} {o[1]}{j < activeDeepHyp.out.length - 1 ? " · " : ""}</span>)}</div>
              </div>
            )}
            {otherDeepHyps.map((h) => {
              const isApproved = approvedSiblings.includes(h.id);
              return (
                <div key={h.id} className={"hyp-card" + (isApproved ? " approved" : "")}>
                  <div className="hyp-h">
                    <span className="hyp-name">{h.kind}</span>
                    <span className="hyp-lifecycle">{h.fail ? `Rejected · ${h.fail}` : "Simulated only"}</span>
                    <span className="hyp-ref">ref: {h.id}</span>
                  </div>
                  <div className="hyp-desc">{h.desc}</div>
                  <div className="hyp-out">{h.out.map((o, j) => <span key={j}>{o[0]} {o[1]}{j < h.out.length - 1 ? " · " : ""}</span>)}</div>
                  <div className="hyp-cta">
                    <button className={"hyp-btn approve" + (isApproved ? " on" : "")} onClick={() => toggleDeepSibling(h.id)}>
                      {isApproved ? "✓ Combined into policy" : "Combine into policy"}
                    </button>
                    {isApproved && <button className="hyp-btn skip" onClick={() => toggleDeepSibling(h.id)}>Remove</button>}
                  </div>
                </div>
              );
            })}
            <GigStepNavDeep stepIndex={2} stepTotal={7} canBack canNext onBack={goSimBack} onNext={goSimNext}
              nextLabel={approvedSiblings.length > 0
                ? `Tune the policy (${approvedSiblings.length} combined) →`
                : "Tune the policy →"}
              hint={approvedSiblings.length > 0
                ? `${approvedSiblings.length} alternative ${approvedSiblings.length === 1 ? "hypothesis" : "hypotheses"} will be folded in.`
                : "Combine alternatives with the buttons above, or move on to tune the current one."} />
          </div>
        )}

        {simStep === "levers" && (
          <div className="simstep-body">
            <div className="step-intro">
              <h3>Tune the policy</h3>
              <p>
                The settings below come from {activeDeepHyp ? <b>{activeDeepHyp.kind}</b> : "the current hypothesis"}
                {approvedSiblings.length > 0 && <>, blended with {approvedSiblings.length} other {approvedSiblings.length === 1 ? "hypothesis" : "hypotheses"} you approved</>}.
                Adjust them and run the simulation when ready.
              </p>
            </div>
            {renderSim()}
            <GigStepNavDeep stepIndex={3} stepTotal={7} canBack canNext onBack={goSimBack} onNext={goSimNext}
              nextLabel="Set rollout →"
              hint="Tune the engine's decision levers above. Run a simulation when ready." />
          </div>
        )}

        {simStep === "rollout" && (
          <div className="simstep-body">
            <div className="step-intro">
              <h3>Rollout &amp; guardrails</h3>
              <p>
                Decide what share of {lbl} sees the new policy, and review the guardrails the policy must respect.
              </p>
            </div>
            <div className="grid g2">
              <div className="panel">
                <div className="panel-h"><span className="pdot" /><span className="pt">Rollout scope</span></div>
                <div className="pbody">
                  <div className="dosage-h"><span>Customers reached</span><b>{coverage}%</b></div>
                  <input className="lvr-s" type="range" min="20" max="100" step="5"
                    value={coverage} onChange={(e) => setCoverage(+e.target.value)}
                    style={{ "--p": ((coverage - 20) / 80) * 100 + "%" }} />
                  <div className="dosage-meta">
                    <div><span>Reached:</span> <b>{Math.round(CFG.pop * (coverage / 100)).toLocaleString()}</b> of {fmtInt(CFG.pop)} accounts</div>
                    <div><span>Held out (control):</span> <b>{Math.round(CFG.pop * (1 - coverage / 100)).toLocaleString()}</b></div>
                    <div><span>Trial length:</span> <b>6 weeks</b></div>
                  </div>
                  <div className="dosage-note">We'll declare a winner when the result is well outside chance (95% confidence).</div>
                </div>
              </div>
              <div className="panel">
                <div className="panel-h"><span className="pdot" /><span className="pt">Guardrails for this engine</span></div>
                <div className="pbody">
                  {gateEval.rows.map((g, i) => (
                    <div key={i} className="cono">
                      <span className={"cono-i " + (g.pass ? "ok" : "no")}>{g.pass ? "✓" : "✕"}</span>
                      <span className="cono-k">{g.c}</span>
                      <span className="cono-v">{g.pass ? "pass" : "fail"}</span>
                    </div>
                  ))}
                  <div className="dosage-note">TwinX checks these on every simulation. Any policy that breaks one is rejected at the gate.</div>
                </div>
              </div>
            </div>
            <GigStepNavDeep stepIndex={4} stepTotal={7} canBack canNext onBack={goSimBack} onNext={goSimNext}
              nextLabel="Simulate the policy →"
              hint={`Will roll out to ${Math.round(CFG.pop * (coverage / 100)).toLocaleString()} accounts (${coverage}%) under the guardrails on the right.`} />
          </div>
        )}

        {simStep === "simulate" && (
          <div className="simstep-body">
            <div className="step-intro">
              <h3>Simulate &amp; see outcomes</h3>
              <p>
                {activeDeepHyp ? <b>{activeDeepHyp.kind}</b> : "Policy"} tuned · rollout {coverage}% · ready to test.
                The simulation in step 4 already produced predicted outcomes — here's the rolled-up policy view with guardrails.
              </p>
            </div>
            {(() => {
              const r = ENGINE_KERNELS[ENG].compute(ST, CFG);
              return (
                <div className="grid g2">
                  <div className="panel">
                    <div className="panel-h"><span className="pdot gr" /><span className="pt">Predicted outcomes</span><span className="pm">policy at current settings</span></div>
                    <div className="pbody">
                      {r.primary.slice(0, 5).map((o, i) => (
                        <div key={i} className="period-row"><span>{o.label}</span><b>{o.val}</b></div>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-h"><span className="pdot" /><span className="pt">Guardrail check</span></div>
                    <div className="pbody">
                      {gateEval.rows.map((g, i) => (
                        <div key={i} className="cono">
                          <span className={"cono-i " + (g.pass ? "ok" : "no")}>{g.pass ? "✓" : "✕"}</span>
                          <span className="cono-k">{g.c}</span>
                          <span className="cono-v">{g.pass ? "pass" : "fail"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
            <GigStepNavDeep stepIndex={5} stepTotal={7} canBack canNext onBack={goSimBack} onNext={goSimNext}
              nextLabel="Verify the policy →"
              hint="Predicted outcomes at current settings, with guardrail status." />
          </div>
        )}

        {simStep === "verify" && (
          <div className="simstep-body">
            <div className="step-intro">
              <h3>Verify &amp; promote</h3>
              <p>
                Final check before sending to <b>Approval review</b>. The policy below — {activeDeepHyp ? <b>{activeDeepHyp.kind}</b> : "current settings"}
                {approvedSiblings.length > 0 && <> + {approvedSiblings.length}</>}, tuned and stress-tested — is what TwinX will hand off.
              </p>
            </div>
            <div className="panel">
              <div className="panel-h"><span className="pdot" /><span className="pt">Final guardrail check</span></div>
              <div className="pbody">
                {gateEval.rows.map((g, i) => (
                  <div key={i} className="cono">
                    <span className={"cono-i " + (g.pass ? "ok" : "no")}>{g.pass ? "✓" : "✕"}</span>
                    <span className="cono-k">{g.c}</span>
                    <span className="cono-v">{g.pass ? "pass" : "fail"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={"actbar " + (gateEval.allPass ? "" : "blocked")}>
              <div className="ab-i">{gateEval.allPass ? "✓" : "⛔"}</div>
              <div className="ab-tx">
                <b>{gateEval.allPass ? "Policy ready" : "Policy blocked"}</b> — {gateEval.allPass
                  ? "TwinX has tuned and stress-tested. Approval review evaluates downside risk and the live-pilot design."
                  : "One or more guardrails are failing. Return to Tune the policy and adjust."}
              </div>
              <button className="ab-btn" disabled={!gateEval.allPass} onClick={onPromoteToGate}>
                Promote to Approval review
              </button>
            </div>
            <GigStepNavDeep stepIndex={6} stepTotal={7} canBack canNext={false} onBack={goSimBack}
              hint="Use the green Promote button above when you're ready to hand off to Approval review." />
          </div>
        )}
      </div>
    );
  };

  /* GATE */
  const renderGate = () => {
    const g = gateEval;
    const verdict = g.refused
      ? <div className="guard breach">⛔ &nbsp;GATE REFUSES — {g.refuseText} The right decision is <b>not to deploy</b>. That restraint is the value.</div>
      : g.allPass
        ? <div className="guard ok">✓ &nbsp;ALL CONDITIONS PASS — cleared to {EXPNAME[1]}.</div>
        : <div className="guard breach">⛔ &nbsp;HARD KILL — {g.failText} Return to Simulate and adjust.</div>;
    const flow = [
      { av: "PO", nm: "Policy Owner", ro: CFG.buyer.split("/")[0].trim(), st: "approved", c: "Intervention design accepted." },
      { av: "MR", nm: "Model Risk", ro: "SR 11-7 review", st: g.refused ? "waiting" : "approved", c: g.refused ? "Cannot sign off — model drifting." : "Response surface explainable; cleared." },
      { av: "FC", nm: CFG.bindingConstraint.owner.split("/")[0].trim(), ro: "binding-constraint review", st: gateApproved ? "approved" : "pending", c: "Reviewing " + CFG.bindingConstraint.owner + " evidence…" },
      { av: "CB", nm: "Business Lead", ro: "final sign-off", st: gateApproved ? "approved" : "waiting", c: "Awaiting clearance." },
    ];
    return (
      <>
        <div className="sec-intro">
          The policy is routed through the <b>decision gate</b> and <b>governance gate</b> — each tooth is a constraint <b>sourced from a specific twin</b> (tagged), not a policy bolted on. The gate <b>branches on the real result</b>.
        </div>
        <div className="panel">
          <div className="panel-h"><span className={"pdot " + (g.allPass ? "gr" : "")} /><span className="pt">Governance gate matrix</span><span className="pm">live · twin-sourced</span></div>
          <div className="pbody np">
            <table className="gmat">
              <thead><tr><th>Condition</th><th>Evaluation</th><th>Source twin</th><th>Verdict</th></tr></thead>
              <tbody>
                {g.rows.map((x, i) => (
                  <tr key={i}>
                    <td className="cn">{x.c}</td>
                    <td className="mono">{x.m}</td>
                    <td><span className="gtwin">{x.tw ? <TwTag tw={x.tw} /> : "—"}</span></td>
                    <td><span className={"verdict " + (x.pass ? "pass" : "fail")}>{x.pass ? "pass" : "fail"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><span className={"pdot " + (g.allPass ? "gr" : "")} /><span className="pt">Gate verdict</span></div>
          <div className="pbody">{verdict}</div>
        </div>
        <div className="panel">
          <div className="panel-h"><span className="pdot bl" /><span className="pt">Approval workflow</span><span className="pm">auditable · SR 11-7</span></div>
          <div className="pbody">
            <div className="flow">
              {flow.map((f, i) => (
                <div className="fstep" key={i}>
                  <div className="fr">
                    <div className="fav">{f.av}</div>
                    <div>
                      <div className="fnm">{f.nm}</div>
                      <div className="fro">{f.ro}</div>
                    </div>
                  </div>
                  <span className={"fst " + f.st}>{f.st}</span>
                  <div className="fc">{f.c}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  /* EXPERIMENT - variant by CFG.experiment */
  const renderWedge = () => {
    const sw = CFG.steppedWedge;
    return (
      <>
        <div className="sec-intro">
          A naive holdout would withhold fraud protection from a randomized control of vulnerable seniors — a duty-of-care violation. So elder uses a <b>stepped-wedge</b>: <b>every cohort receives the intervention; only the timing is randomized.</b>
        </div>
        <div className="panel">
          <div className="panel-h"><span className="pdot" /><span className="pt">Stepped-wedge rollout</span><span className="pm">staggered adoption · weeks 0–8</span></div>
          <div className="pbody">
            {sw.waves.map((w, i) => {
              const m = w.start.match(/\d+/);
              const startWk = parseInt((m ? m[0] : "0"), 10);
              const left = (startWk / 8) * 100;
              const width = ((8 - startWk) / 8) * 100;
              return (
                <div className="swave" key={i}>
                  <span className="swn">{w.wave}</span>
                  <span className="swseg"><b>{w.segment}</b></span>
                  <span className="swstart">{w.start}</span>
                  <span className="swbar"><i style={{ left: left + "%", width: width + "%" }} /></span>
                  <span className="swn2">n={fmtInt(w.n)}</span>
                </div>
              );
            })}
            <div className="tline"><span>wk 0</span><span>wk 2</span><span>wk 4</span><span>wk 6</span><span>wk 8</span></div>
            <div className="susp" style={{ marginTop: 14, background: "rgba(66,224,139,.07)", borderColor: "rgba(66,224,139,.25)", color: "var(--green)" }}>✓ Why not a holdout: {sw.why}</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><span className="pdot gr" /><span className="pt">Estimator</span></div>
          <div className="pbody"><div className="lead">{sw.estimator}</div></div>
        </div>
      </>
    );
  };
  const renderConsent = () => {
    const e = CFG.content.encouragement;
    const tot = e.offered;
    const Bar = ({ label, n, col }) => (
      <div style={{ marginBottom: 11 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-2)" }}>
          <span>{label}</span>
          <span className="mono">{fmtInt(n)} ({Math.round(n / tot * 100)}%)</span>
        </div>
        <div className="obar" style={{ height: 10, marginTop: 4 }}>
          <i style={{ width: (n / tot * 100) + "%", background: col }} />
        </div>
      </div>
    );
    return (
      <>
        <div className="sec-intro">
          An offer is not an enrollment. home uses a <b>consent-aware encouragement design</b>: the treatment is <b>the offer</b>; uptake is the customer's choice. Effect is estimated on the offered population — no one is forced into a recommendation.
        </div>
        <div className="panel">
          <div className="panel-h"><span className="pdot" /><span className="pt">Encouragement funnel</span><span className="pm">offered → accepted / declined</span></div>
          <div className="pbody">
            <Bar label="Offered (treatment)" n={e.offered} col="var(--acq)" />
            <Bar label="Accepted" n={e.accepted} col="var(--green)" />
            <Bar label="Declined (respected)" n={e.declined} col="var(--ink-4)" />
            <div className="susp">Compliance rate {(e.complianceRate * 100).toFixed(0)}% · {e.note}</div>
          </div>
        </div>
      </>
    );
  };
  const renderHoldout = () => (
    <>
      <div className="sec-intro">
        This theme would use a standard 95/5 holdout RCT — but the gate <b>refused</b> deployment on model drift, so the field test is <b>not reached</b>. The pipeline stops at restraint.
      </div>
      <div className="panel">
        <div className="panel-h"><span className="pdot" /><span className="pt">Field test</span><span className="pm">blocked upstream</span></div>
        <div className="pbody">
          <div className="guard breach">⛔ &nbsp;Not reached — the governance gate refused this play on <b>{CFG.driftState || "drift"}</b>. No scenario is run on a drifting model. Re-stabilise the cluster, then re-hypothesise.</div>
        </div>
      </div>
    </>
  );
  const renderExp = () => {
    if (CFG.experiment === "stepped_wedge") return renderWedge();
    if (CFG.experiment === "consent_aware") return renderConsent();
    return renderHoldout();
  };

  /* LEARN */
  const renderLearn = () => {
    if (REFUSED || (CFG.teeth.indexOf("drift") >= 0)) {
      return (
        <>
          <div className="sec-intro">
            There is nothing to deploy — and that is the point. TwinX <b>refused a tempting play</b> because the model was drifting. The loop still runs: it writes the refusal back, monitors the drift, and re-seeds a hypothesis only when the cluster re-stabilises.
          </div>
          <div className="panel">
            <div className="panel-h"><span className="pdot" /><span className="pt">Held · monitoring drift</span></div>
            <div className="pbody">
              <div className="lead">Policy unchanged. The cluster's <b>{CFG.driftState || "drift"}</b> is watched; when it returns to stable, the hypothesis re-enters the queue automatically. <span className="hl">Restraint, recorded and auditable, is itself a decision the bank can defend.</span></div>
            </div>
          </div>
        </>
      );
    }
    const loop = [["Sense", "signals in"], ["Simulate", "risk-free"], ["Gate", "constraint + fairness"], ["Deploy", "what cleared"], ["Adapt", "live vs predicted"], ["Learn", "write-back"]];
    return (
      <>
        <div className="sec-intro">
          The winning policy deploys and the loop closes. The <b>Perpetual Adaptation Loop</b> writes the realised effect back into <b>every twin</b> — not just the customer model — so the whole fabric sharpens with each decision. The decision <b>compounds</b>.
        </div>
        <div className="panel">
          <div className="panel-h"><span className="pdot gr" /><span className="pt">Deploy</span><span className="pm">policy promotion</span></div>
          <div className="pbody">
            <div className="kvs">
              <KV k="Value lever" v={CFG.valueLever} />
              <KV k="Buyer" v={CFG.buyer} />
              <KV k="Scenario" v={EXPNAME[0]} />
              <KV k="Rollback" v="1-click" s="auto on drift" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><span className="pdot cy" /><span className="pt">Write-back · Perpetual Adaptation Loop</span><span className="pm">every twin recalibrates</span></div>
          <div className="pbody">
            <div className="palfan">
              <div className="palnode cu"><div className="pn-l">customer</div><div className="pn-d">realised response re-fits the cohort twins</div></div>
              <div className="palnode pr"><div className="pn-l">product</div><div className="pn-d">realised elasticity / loss sharpens the economics</div></div>
              <div className="palnode pc"><div className="pn-l">process</div><div className="pn-d">realised SLA &amp; cost recalibrate capacity</div></div>
              <div className="palnode ch"><div className="pn-l">channel</div><div className="pn-d">realised rail behaviour updates the physics</div></div>
              <div className="palnode ma"><div className="pn-l">macro</div><div className="pn-d">regime read recalibrated; drift re-watched</div></div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><span className="pdot" /><span className="pt">The loop, run every day</span></div>
          <div className="pbody">
            <div className="loopd">
              {loop.map((x, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                  <div className="lnode"><div className="ln">{x[0]}</div><div className="ld">{x[1]}</div></div>
                  {i < loop.length - 1 ? <span className="larrow">→</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><span className="pdot cy" /><span className="pt">Why TwinX is invaluable here</span></div>
          <div className="pbody">
            <div style={{ padding: "14px 16px", border: "1px solid rgba(255,177,90,.3)", borderRadius: 10, background: "rgba(255,177,90,.05)", fontSize: 12, color: "var(--ink)" }}>
              <span className="hl">{CFG.valueLever}</span> for <span className="hlb">{CFG.buyer}</span>: a <span className="hlb">composite twin fabric</span> — customer × product × process × channel, under the macro field — sensed, simulated, gated, tested, and <span className="hlb">deployed only what cleared</span>, then <span className="hlg">learned back into every twin</span>. Not a model on top of a CDP — a simulatable replica of the whole decision.
            </div>
          </div>
        </div>
      </>
    );
  };

  /* render orchestration */
  const stageBody = (() => {
    switch (stageActive.id) {
      case "sense": return renderSense();
      case "hyp": return renderHyp();
      case "model": return renderModel();
      case "sim": return renderSimShell();
      case "gate": return renderGate();
      case "test": return renderExp();
      case "learn": return renderLearn();
      default: return null;
    }
  })();

  /* action banner */
  const actionBanner = (() => {
    if (statusActive !== "await") return null;
    const s = stageActive;
    if (s.id === "gate") {
      if (gateEval.refused) {
        return (
          <div className="actbar blocked">
            <div className="ab-i">⛔</div>
            <div className="ab-tx"><b>The gate refuses this play — model drift.</b> {gateEval.refuseText} Autopilot halts here; that restraint is the decision.</div>
            <button
              className="ab-btn red"
              onClick={() => {
                setREFUSED(true);
                setSTATUS(prev => prev.map((v, k) => k === ACTIVE ? "done" : v));
                pause();
              }}
            >Acknowledge restraint · do not deploy</button>
          </div>
        );
      }
      if (!gateEval.allPass) {
        return (
          <div className="actbar blocked">
            <div className="ab-i">⛔</div>
            <div className="ab-tx"><b>Gate hard-killed on the current levers.</b> {gateEval.failText} Return to Simulate and adjust.</div>
            <button className="ab-btn red" onClick={() => { pause(); enterStage(3); }}>← Return to Simulate</button>
          </div>
        );
      }
    }
    return (
      <div className="actbar">
        <div className="ab-i">✋</div>
        <div className="ab-tx"><b>Human in the loop — {s.hint}.</b> Autopilot is paused at <b>{s.name}</b> until you act.</div>
        <button
          className="ab-btn"
          onClick={() => {
            if (s.id === "gate") setGateApproved(true);
            completeHIL();
          }}
        >{s.action}</button>
      </div>
    );
  })();

  /* autopilot bar phase msg */
  const phaseMsg = statusActive === "running"
    ? (AUTO ? stageActive.autoMsg : "running " + stageActive.name + "…")
    : statusActive === "await"
      ? "awaiting human · " + stageActive.hint
      : statusActive === "done"
        ? (REFUSED && stageActive.id === "gate" ? "gate refused · run held" : stageActive.name + " complete")
        : "ready";

  const runAllQueued = STATUS.every(x => x === "queued");

  return (
    <PageShell>
    <div className="deep-pipeline">
      <div className="app">
        <div className="appbar appbar-crumb">
          {/* Breadcrumb only — Logo + env + ThemeToggle live in GlobalTopBar. */}
          <div className="ab-crumb">
            <a onClick={() => navigate("/")}>Hypothesis Hub</a>
            <span className="sep">›</span>
            <a onClick={() => navigate("/theme?id=" + THEME + "&mode=inside_out")}>{CFG.name}</a>
            <span className="sep">›</span>
            <span className="cur">Decision Pipeline</span>
          </div>
          <div className="ab-sp" />
          <div className="ab-chip"><span className="k">buyer</span> <b>{CFG.buyer}</b></div>
          <div className="ab-chip"><span className="k">run</span> <b>run_0427</b></div>
          <div className="ab-chip"><span className="ab-spin" /> auto-refresh</div>
        </div>
        <div className="subbar">
          <span className="sb-badge">{CFG.badge}</span>
          <span className="sb-claim"><ClaimText html={CFG.claim} /></span>
          <div className="sb-sp" />
          <div className="sb-chip"><span className="v ac">{ENG + " · " + CFG.valueLever.split(" ")[0]}</span><span className="l">value engine</span></div>
          <div className="sb-chip"><span className="v bl">{expLabel}</span><span className="l">scenario</span></div>
          <div className="sb-chip"><span className="v gr">{vbHead}</span><span className="l">{vb.headline}</span></div>
          <div className="sb-chip"><span className="v">{fmtInt(CFG.pop)}</span><span className="l">cohort</span></div>
        </div>
        {/* Outer horizontal stage ribbon (replaces the old left rail) */}
        <div className="outerribbon">
          {STAGES.map((s, i) => {
            const st = STATUS[i];
            const cls = "outerchip"
              + (i === ACTIVE ? " active" : "")
              + (st === "done" ? " done" : "")
              + (st === "running" ? " running" : "")
              + (st === "await" ? " await" : "")
              + (st === "queued" ? " queued" : "");
            const node = st === "done" ? "✓" : (st === "await" ? "!" : (i + 1));
            const biz = STAGE_BIZ[s.id] || { name: s.name, cap: s.sub };
            const subTxt = st === "running" ? "Running…"
              : st === "await" ? "Awaiting your input"
              : st === "done" ? "Done"
              : "Queued";
            return (
              <button className={cls} key={s.id} onClick={() => onRailClick(i)} title={biz.cap}>
                <span className="outerchip-n">{node}</span>
                <span className="outerchip-l">
                  <span className="outerchip-t">{biz.name}</span>
                  <span className="outerchip-c">{subTxt}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="main main-full">
          <div className="work">
            <div className="workh">
              <span className="wh-n">{stageActive.n}</span>
              <div>
                <div className="wh-t">{(STAGE_BIZ[stageActive.id] || {}).name || stageActive.name}</div>
                <div className="wh-cap">{(STAGE_BIZ[stageActive.id] || {}).cap || capMap[stageActive.id]}</div>
              </div>
              <div className="wh-sp" />
              <span className={"wh-status " + whBits[0]}><span className="wh-dot" /><span>{whBits[1]}</span></span>
            </div>
            <div className="autobar">
              <div className="ap-dots">
                {STAGES.map((s, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                    <span className={"apd " + STATUS[i] + (i === ACTIVE ? " cur" : "")} title={s.name} />
                    {i < STAGES.length - 1 ? <span className="apline" /> : null}
                  </span>
                ))}
              </div>
              <div className="ap-phase">
                <span className={"apmode " + (AUTO ? "on" : "")}>{AUTO ? "● AUTOPILOT" : "autopilot off"}</span>
                <span className="ap-stage">Stage {ACTIVE + 1} / 7</span>
                <span className={"ap-msg" + (statusActive === "running" ? " run" : "") + (statusActive === "await" ? " hold" : "")}>{phaseMsg}</span>
              </div>
              <div className="ap-ctl">
                {AUTO
                  ? <button className="apbtn" onClick={pause}>⏸ Pause</button>
                  : <button className="apbtn primary" onClick={play}>▶ {runAllQueued ? "Run autopilot" : "Resume"}</button>}
                <button className="apbtn" onClick={step} title="Advance one stage">Next →</button>
                <button className="apbtn" onClick={resetRun}>↺ Reset</button>
              </div>
            </div>
            <div className="canvas" ref={canvasRef}>
              {actionBanner}
              {stageBody}
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageShell>
  );
}

/* Step navigator for the deep sim shell — back/next buttons styled to match
   the same .stepnav pattern used in /pipeline and /gig-pipeline. */
function GigStepNavDeep({ stepIndex, stepTotal, canBack, canNext, onBack, onNext, nextLabel, hint, secondary }) {
  useEffect(() => {
    const isEditable = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    const handler = (e) => {
      if (isEditable(document.activeElement)) return;
      if (e.key === "Enter" && canNext) { e.preventDefault(); onNext && onNext(); }
      if ((e.key === "Backspace" || e.key === "Escape") && canBack) { e.preventDefault(); onBack && onBack(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canBack, canNext, onBack, onNext]);

  return (
    <div className="stepnav-sticky">
      <div className="stepnav-counter">
        {stepIndex != null && stepTotal != null && (
          <>
            <span className="sn-pos">Step {stepIndex + 1} of {stepTotal}</span>
            <span className="sn-bar"><i style={{ width: `${((stepIndex + 1) / stepTotal) * 100}%` }} /></span>
          </>
        )}
      </div>
      <div className="stepnav-hint">{hint || ""}</div>
      <button className="stepnav-back" disabled={!canBack} onClick={onBack}>← Back</button>
      {secondary && (
        <button className="stepnav-secondary" onClick={secondary.onClick}>{secondary.label}</button>
      )}
      <button className="stepnav-next" disabled={!canNext} onClick={onNext}>
        {nextLabel || "Continue →"}
      </button>
    </div>
  );
}

/* ---- small helpers ---- */
function KV({ k, v, s }) {
  return (
    <div className="kv">
      <div className="k">{k}</div>
      <div className="v">{v}{s ? <> <small>{s}</small></> : null}</div>
    </div>
  );
}

/* Render the legacy "claim" string (limited to <b>...</b>) as JSX — no innerHTML. */
function ClaimText({ html }) {
  if (!html) return null;
  // Split on <b>...</b> using matchAll so the source contains no exec() call.
  const out = [];
  let cursor = 0;
  let key = 0;
  for (const m of html.matchAll(/<b>([\s\S]*?)<\/b>/g)) {
    if (m.index > cursor) out.push(<span key={key++}>{html.slice(cursor, m.index)}</span>);
    out.push(<b key={key++}>{m[1]}</b>);
    cursor = m.index + m[0].length;
  }
  if (cursor < html.length) out.push(<span key={key++}>{html.slice(cursor)}</span>);
  return <>{out}</>;
}

/* Lever — controlled input */
function Lever({ l, val, setLever }) {
  const tg = l.tw ? <span className={"twtag " + l.tw}>{TWN_NAMES[l.tw]}</span> : null;
  if (l.t === "slider") {
    const pct = ((val - l.min) / (l.max - l.min)) * 100;
    const disp = l.usd ? fmtUSDraw(val) : (val + l.unit);
    return (
      <div className="lv">
        <div className="lv-h">
          <span className="lv-l">{l.label}{tg} <span className="q">· {l.q}</span></span>
          <span className="lv-v">{disp}</span>
        </div>
        <input
          type="range"
          min={l.min}
          max={l.max}
          step={l.step}
          value={val}
          onChange={(e) => setLever(l.key, +e.target.value)}
          style={{ "--pct": pct + "%" }}
        />
        <div className="lv-scale">
          <span>{l.usd ? fmtUSDraw(l.min) : l.min + l.unit}</span>
          <span>{l.usd ? fmtUSDraw(l.max) : l.max + l.unit}</span>
        </div>
      </div>
    );
  }
  if (l.t === "seg") {
    return (
      <div className="lv">
        <div className="lv-h"><span className="lv-l">{l.label}{tg} <span className="q">· {l.q}</span></span></div>
        <div className="seg">
          {l.opts.map(o => (
            <span
              key={o[0]}
              className={"segb " + (o[0] === val ? "on" : "")}
              onClick={() => setLever(l.key, o[0])}
            >{o[1]}</span>
          ))}
        </div>
      </div>
    );
  }
  if (l.t === "toggle") {
    return (
      <div className="lv">
        <div className="lv-h"><span className="lv-l">{l.label}{tg} <span className="q">· {l.q}</span></span></div>
        <div className="seg">
          <span className={"segb " + (val ? "on" : "")} onClick={() => setLever(l.key, !val)}>{val ? "ON" : "OFF"}</span>
        </div>
      </div>
    );
  }
  return null;
}
