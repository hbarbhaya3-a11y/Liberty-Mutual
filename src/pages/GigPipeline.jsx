import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TWINX from "@/data/bundle";
import { PERSONAS, CONFIGS, ENGINES, TEETH } from "@/data/themeConfigs";
import { OBJ } from "@/data/themes";
import { Logo, ThemeToggle } from "@/components/Logo";
import PageShell from "@/components/PageShell";
import "@/styles/gigPipeline.css";

/* Business-language stage names for the outer ribbon — mirrors the same
   labels we use in /pipeline (see src/data/pretty.js → STAGE_INFO). The gig
   pipeline uses its own stage ids (sense/hyp/model/sim/gate/test/learn)
   so we map them here rather than reuse the prettyStageName helper. */
const STAGE_BIZ = {
  sense: { name: "Signal & customer group",       cap: "Why this customer group surfaced and what we're seeing" },
  hyp:   { name: "Hypotheses",                    cap: "Reasons, candidate interventions and fairness checks" },
  model: { name: "Model setup",                   cap: "Customer twins and behavioural models calibrated" },
  sim:   { name: "Test & optimize policy",        cap: "Tune levers, simulate outcomes, optimize against guardrails" },
  gate:  { name: "Approval review",               cap: "Decision gate, governance and approval workflow" },
  test:  { name: "Live pilot",                    cap: "Champion-challenger pilot · controlled rollout" },
  learn: { name: "Measure results & deploy",      cap: "Estimate, correct, write-back to the twins, scale" },
};

/* ============================================================================
   GIG · FORTNIGHTLY PAYMENTS — deep decision pipeline (React port)
   Ported from gig_pipeline.html. Same equations and same visual structure.
   TWINX / PERSONAS / CONFIGS / ENGINES / TEETH / OBJ imported (legacy inlined them).
   Money formatter is local — the shared themes.fmtUSD expects millions, this
   data is raw dollars; the imports above satisfy the spec without being misused.
   ============================================================================ */

// silence unused-import linters; the imports are kept as legacy `window.*`
// shims that page-level data wired into.
void TWINX; void PERSONAS; void CONFIGS; void ENGINES; void TEETH; void OBJ;

const GIG = {
  cluster: { id: "cluster_gig_economy_high_velocity", name: "Gig Economy · High Velocity", population: 200000, share: 0.115, policy: "v3", drift: "stable" },
  signals: [
    { ic: "📉", t: "Step-up friction on rent-day Zelle", d: "Outbound Zelle to recurring landlord token clusters Friday 4–8 PM and trips the static $1,200 ceiling.", v: "17.3% friction · ↑ 4.1pp QoQ" },
    { ic: "🔁", t: "Verified recurring obligation", d: "22 observed months of landlord rent-day pattern; amount within 95% of historical. A coherent, trusted cadence.", v: "22 mo · recurrence 0.81" },
    { ic: "📞", t: "Contact-centre 'payment declined / limit'", d: "Call-rate on declined-limit reason code rising in the cohort; each failed rent payment seeds a call.", v: "+11% calls QoQ" },
    { ic: "💸", t: "Multi-platform inflow, single large outflow", d: "Uber / DoorDash / Instacart / Upwork inflows accumulate, then one large rent outflow exceeds per-txn limit.", v: "velocity 0.88 · P2P out 0.73" },
    { ic: "🏠", t: "Rent-burden timing mismatch", d: "Fortnightly/monthly rent due date lands before the platform payout settles — a cash-timing, not a credit, problem.", v: "unowned cohort · attach 1.1" },
    { ic: "⚖️", t: "Fairness flag — thin-file penalty", d: "Static ceilings disproportionately fail thin-file, new-to-bank gig earners who lack long deposit history.", v: "audit requested" },
  ],
  reasons: [
    { n: "R1", t: "Volume", d: "Rent ($1,425 median) exceeds the static $1,200 per-txn Zelle ceiling. The amount is normal for the obligation, abnormal for the limit.", pct: 88, a: "ceiling vs rent gap" },
    { n: "R2", t: "Frequency / velocity", d: "High inbound velocity from multiple platforms reads as risk to a velocity rule that can't tell gig income from anomaly.", pct: 74, a: "velocity 0.88" },
    { n: "R3", t: "Channel", d: "Concentrated on Zelle/P2P rails where limits are tightest; ACH would clear but settles too slowly for rent day.", pct: 69, a: "zelle out 0.58" },
    { n: "R4", t: "Trust mis-scored", d: "A landlord paid for 22 months is still scored as a generic counterparty — trust the bank can observe but doesn't yet use.", pct: 81, a: "recurrence 0.81" },
    { n: "R5", t: "Fairness", d: "Thin-file gig earners absorb most failures: same behaviour, less history, harsher ceiling. A disparate-impact risk to remediate.", pct: 63, a: "thin-file skew 1.6×" },
  ],
  hyps: [
    {
      id: "H-2026-04-12", kind: "Raise limits for trusted earners", win: true,
      desc: "Lift the step-up ceiling by 20% when an inbound/outbound matches a verified recurring landlord rent-day pattern (≥18 months) — removing Friday-evening friction for trusted gig depositors, without opening the ceiling for everyone.",
      params: [["pattern", "recurring_landlord_rent_day"], ["ceiling_lift", "+20%"], ["min_recurrence", "18 mo"], ["rail", "zelle"], ["trust_gate", "on"]],
      out: [["friction", "−236,000", -1], ["NII", "+$56M", 1], ["cc cost", "−$16.8M", -1], ["complaints", "−3,360", -1]],
    },
    {
      id: "H-2026-05-01", kind: "Payout-Window Relax", win: false,
      desc: "Relax step-up thresholds during the Friday 4–8 PM gig payout window where verified recurring inflows cluster — a time-boxed, lower-blast-radius alternative.",
      params: [["window", "fri_16_20"], ["threshold_relax", "+15%"], ["rail", "all"]],
      out: [["friction", "−3,100", -1], ["NII", "+$0.9M", 1]],
    },
    {
      id: "H-2026-05-09", kind: "Rail Streamline", win: false,
      desc: "Streamline P2P/Zelle rail limits for high-velocity gig accounts with established counterparties — narrower than a pattern match, broader than a single window.",
      params: [["rail", "zelle"], ["threshold_relax", "+10%"], ["est_counterparty", "required"]],
      out: [["friction", "−2,200", -1], ["NII", "+$0.6M", 1], ["cc cost", "−$0.4M", -1]],
    },
  ],
  twins: [
    { id: "persona_1", init: "MC", nm: "Marcus Chen", sb: "Multi-platform earner · Friday payout cadence", tag: "verified · 22 mo", sel: true,
      fv: [["txn velocity 30d", .91], ["mobile share", .84], ["recurring strength", .86], ["zelle out", .62], ["counterparty div", .68], ["balance slope", .55]] },
    { id: "persona_7", init: "AD", nm: "Aisha Diallo", sb: "Rideshare + delivery · thin-file, new-to-bank", tag: "thin-file · 7 mo", sel: false,
      fv: [["txn velocity 30d", .84], ["mobile share", .91], ["recurring strength", .58], ["zelle out", .71], ["counterparty div", .41], ["balance slope", .34]] },
    { id: "persona_8", init: "RT", nm: "Rosa Torres", sb: "Freelance design · fortnightly client payouts", tag: "established · 16 mo", sel: false,
      fv: [["txn velocity 30d", .62], ["mobile share", .77], ["recurring strength", .74], ["zelle out", .49], ["counterparty div", .66], ["balance slope", .61]] },
  ],
  models: [
    { ic: "🔁", c: "b", t: "Recurring-pattern detector", d: "Tokenises the landlord counterparty and confirms a rent-day cadence over a 24-month window. Distinguishes obligation from one-off.", q: [["coverage", "94%"], ["precision", "0.97"]] },
    { ic: "🤝", c: "v", t: "Counterparty trust model", d: "Trust score from tenure, recurrence, reciprocity and dispute history — observable, explainable, not a protected-attribute proxy.", q: [["AUC", "0.91"], ["audited", "yes"]] },
    { ic: "🛣️", c: "c", t: "Channel-propensity model", d: "Predicts which rail (Zelle / ACH / RTP) a customer will use for a given obligation and timing, so policy meets them where they pay.", q: [["AUC", "0.88"], ["rails", "4"]] },
    { ic: "📊", c: "a", t: "Payment-limit elasticity model", d: "Failure probability as a function of ceiling, amount and velocity — the dose-response curve the simulator rides.", q: [["R²", "0.86"], ["monotone", "✓"]] },
    { ic: "🛡️", c: "g", t: "Velocity-fraud separator", d: "Tells benign multi-platform gig income from velocity-anomaly fraud, so a lift never opens a real attack surface.", q: [["AUC", "0.95"], ["FPR", "0.6%"]] },
    { ic: "📈", c: "b", t: "Cash-flow stability model", d: "Beyond payments — income regularity and runway, a behavioural creditworthiness signal that unlocks deepening offers.", q: [["coverage", "88%"], ["horizon", "90d"]] },
    { ic: "🎯", c: "v", t: "Deepening-propensity model", d: "Likelihood to adopt a relevant next product (secured card, savings, earned-wage advance) once the friction is removed and trust is returned.", q: [["AUC", "0.83"], ["uplift", "+18pp"]] },
  ],
  rct: [
    { w: 1, t: .1024, c: .1728, fired: false }, { w: 2, t: .0970, c: .1402, fired: false },
    { w: 3, t: .0997, c: .1687, fired: true }, { w: 4, t: .1025, c: .1607, fired: true },
    { w: 5, t: .1011, c: .1775, fired: true }, { w: 6, t: .0995, c: .1721, fired: true },
  ],
};

/* ---------------- math ---------------- */
const COHORT = {
  verified: { n: 3800, fail: .173, thin: .9, label: "Verified recurring" },
  all: { n: 5760, fail: .205, thin: 1.0, label: "All gig high-velocity" },
  thin: { n: 1640, fail: .262, thin: 1.6, label: "Thin-file / new-to-bank" },
};
const RAILSHARE = { zelle: .58, ach: .18, rtp: .12, wire: .04 };
const CHAINP = { a: 0.60, FRIC0: 12.0, rho: 0.75, EXP0: 55, beta: 1.60, XSmax: 22, EXPmid: 62, EXPk: 12, theta: 0.060, PRIM0: 30, lam: 0.90, spread: 0.0277, balances: 4.0e8, CHN0: 18, kappa: 1.30, gamma: 0.079 };
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function railCov(ch) { let s = 0; for (const k in ch) { if (ch[k]) s += RAILSHARE[k]; } return clamp(s / 0.92, 0, 1); }
function csat(EXP) { return 1 / (1 + Math.exp(-(EXP - CHAINP.EXPmid) / CHAINP.EXPk)); }
function chainInputs(L) {
  const co = COHORT[L.cohort];
  let REG = clamp(0.55 + 0.45 * (1 - (co.fail - 0.17) / 0.10), 0.45, 1) * (0.7 + 0.3 * (co.thin <= 1 ? 1 : 0.7));
  REG = clamp(REG, 0.45, 0.98);
  const qual = clamp(1 - (L.trustMin - 6) / 42, 0.18, 1);
  const lever = clamp(Math.tanh(L.limitFlex / 26) * (0.6 + 0.4 * qual), 0, 1);
  return { REG, SENS: L.sens, DEC: L.dec, lever, MKT: L.mkt };
}
function chain(L, p) {
  p = p || CHAINP; const I = chainInputs(L);
  const PRD = I.REG * Math.pow(I.SENS, p.a);
  const surfaced = PRD >= 0.55;
  const PERS = I.lever * PRD * I.DEC;
  const FRIC = p.FRIC0 * (1 - p.rho * PERS);
  const EXP = p.EXP0 + p.beta * (p.FRIC0 - FRIC);
  const XS = p.XSmax * csat(EXP) * (1 + p.theta * I.MKT);
  const PRIM = p.PRIM0 + p.lam * XS;
  const dPRIM = (PRIM - p.PRIM0) / 100;
  const VAL = dPRIM * p.spread * p.balances;
  const CHN = p.CHN0 * Math.exp(-p.kappa * PRIM / 100);
  return { REG: I.REG, SENS: I.SENS, DEC: I.DEC, lever: I.lever, MKT: I.MKT, PRD, surfaced, PERS, FRIC, EXP, XS, PRIM, VAL, CHN };
}
function disparateImpact(L) {
  const c = chain(L); const guard = (L.trustMin >= 12) ? 0.35 : 1.0;
  return clamp(1 - 0.55 * guard * Math.pow(c.lever, 2), 0, 1);
}
function chainAtREG(L, regOverride) {
  const p = CHAINP, I = chainInputs(L), REG = regOverride;
  const PRD = REG * Math.pow(I.SENS, p.a), PERS = I.lever * PRD * I.DEC;
  const FRIC = p.FRIC0 * (1 - p.rho * PERS), EXP = p.EXP0 + p.beta * (p.FRIC0 - FRIC);
  const XS = p.XSmax * csat(EXP) * (1 + p.theta * I.MKT), PRIM = p.PRIM0 + p.lam * XS;
  const VAL = ((PRIM - p.PRIM0) / 100) * p.spread * p.balances;
  return { PRIM, VAL };
}
function loopSteady(L, gamma) {
  const REG0 = clamp(chainInputs(L).REG - 0.30, 0.45, 0.75); let reg = REG0, val = 0;
  for (let s = 0; s < 40; s++) { const c = chainAtREG(L, reg); val = c.VAL; reg = clamp(reg + gamma * (c.PRIM / 100) - 0.25 * (reg - REG0), 0, 1); }
  return { ssREG: reg, ssVAL: val, REG0 };
}
function model(L) {
  const co = COHORT[L.cohort];
  const qual = clamp(1 - (L.trustMin - 6) / 42, 0.18, 1);
  const liftResp = Math.tanh(L.limitFlex / 26);
  const rc = railCov(L.channels);
  const cad = 0.55 + 0.45 * clamp(L.cadence / 7, 0, 1);
  const cov = L.coverage / 100;
  const addr = co.n * cov * rc * qual;
  const attempts = addr * 12;
  const baseFail = co.fail;
  const treatedFail = baseFail * (1 - 0.78 * liftResp * cad);
  const failRemoved = attempts * (baseFail - treatedFail);
  const txnsInLimit = attempts * (1 - treatedFail);
  const complaints = -failRemoved / 70;
  let nps = (failRemoved / 9000) * 9 * co.thin; nps = clamp(nps, 0, 14);
  const nii = addr * 1050 * (0.6 + 0.4 * liftResp) * (0.7 + 0.3 * qual);
  let fraud = 0.030 * L.limitFlex - 0.058 * L.trustMin - 0.15 * rc + 0.20;
  fraud = clamp(fraud, -1.2, 2.4);
  const attach = (0.10 + 0.09 * liftResp) * qual * 100;
  const primacy = (0.08 + 0.10 * liftResp) * qual * 100;
  const ccCost = -failRemoved * 145;
  const noise = 1 / Math.sqrt(clamp(cov * qual * rc, 0.05, 1));
  function ci(v, frac) { const h = Math.abs(v) * frac * noise; return [v - h, v + h]; }
  return {
    addr, attempts, txnsInLimit, baseFail, treatedFail, failRemoved, complaints, nps, nii, fraud,
    attach, primacy, ccCost,
    ciNii: ci(nii, .22),
    ciFraud: [fraud - (0.10 + 0.10 * Math.sqrt(noise)), fraud + (0.10 + 0.10 * Math.sqrt(noise))],
    ciFail: ci(failRemoved, .09),
    qual, rc, cov,
  };
}

const CHAN2 = {
  inapp: { reach: 0.95, cost: 0.40, decay: 0.60, label: "In-app" },
  push: { reach: 0.70, cost: 0.20, decay: 0.50, label: "Push" },
  email: { reach: 0.55, cost: 0.15, decay: 0.70, label: "Email" },
  sms: { reach: 0.80, cost: 0.50, decay: 0.45, label: "SMS" },
  rm: { reach: 0.42, cost: 6.0, decay: 0.88, label: "RM / branch" },
};
const CREATIVE = {
  proactive: { s: 1.00, lbl: "Proactive — “your rent clears now”" },
  educational: { s: 0.85, lbl: "Educational — how the limit works" },
  generic: { s: 0.60, lbl: "Generic — product blast" },
};
const PROD = {
  secured_card: { attach: 0.16, nii: 380, fee: 60, label: "Secured card" },
  hy_savings: { attach: 0.22, nii: 520, fee: 0, label: "High-yield savings" },
  ewa: { attach: 0.28, nii: 240, fee: 35, label: "Earned-wage advance" },
  credit_builder: { attach: 0.14, nii: 300, fee: 48, label: "Credit-builder loan" },
  dd_switch: { attach: 0.19, nii: 610, fee: 0, label: "Direct-deposit switch" },
};

function a1calc(L) {
  const co = COHORT[L.cohort];
  const qual = clamp(1 - (L.trustMin - 6) / 42, 0.18, 1);
  const liftResp = Math.tanh(L.limitFlex / 26);
  const rc = railCov(L.channels);
  const cad = 0.55 + 0.45 * clamp(L.cadence / 7, 0, 1);
  const cov = L.coverage / 100;
  const E1 = co.n * cov * rc * qual;
  const attempts = E1 * 12;
  const baseFail = co.fail;
  const treatedFail = baseFail * (1 - 0.78 * liftResp * cad);
  const failRemoved = attempts * (baseFail - treatedFail);
  const stRate = 1 - treatedFail;
  const complaints = -failRemoved / 70;
  const ccCost = -failRemoved * 145;
  const retentionNII = E1 * 640 * (0.6 + 0.4 * liftResp) * (0.7 + 0.3 * qual);
  const fraud = clamp(0.030 * L.limitFlex - 0.058 * L.trustMin - 0.15 * rc + 0.20, -1.2, 2.4);
  const noise = 1 / Math.sqrt(clamp(cov * qual * rc, 0.05, 1));
  const ciFraudUp = fraud + (0.10 + 0.10 * Math.sqrt(noise));
  const expHead = clamp((baseFail - treatedFail) / baseFail, 0, 1);
  const di = disparateImpact(L);
  return { E1, attempts, baseFail, treatedFail, stRate, failRemoved, complaints, ccCost, retentionNII, fraud, ciFraudUp, expHead, di, qual, rc };
}
function a2calc(L2, a1) {
  let effReach = 0, cpc = 0, sum = 0, k;
  for (k in CHAN2) { sum += L2.alloc[k]; }
  sum = sum || 1;
  for (k in CHAN2) { const w = L2.alloc[k] / sum; effReach += w * CHAN2[k].reach; cpc += w * CHAN2[k].cost; }
  const freqEff = 1 - Math.exp(-0.55 * L2.freq);
  const awareness = clamp(effReach * freqEff * 1.15, 0, 0.97);
  const awareN = a1.E1 * awareness;
  const cm = CREATIVE[L2.creative].s;
  const timingMult = (L2.timing === "pre_payout") ? 1.0 : 0.9;
  const sentiment = clamp((0.46 + 0.46 * a1.expHead * cm + 0.10 * awareness) * timingMult, 0, 0.95);
  const spend = awareN * cpc * L2.freq;
  const deflection = awareN * 0.045;
  const npsShift = clamp(sentiment * 7 - 1.2, -1.5, 6.5);
  const feedbackN = awareN * 0.18;
  const engage = clamp(0.18 + 0.42 * effReach - 0.03 * L2.freq, 0.05, 0.62);
  const costPerAware = spend / Math.max(1, awareN);
  const readiness = clamp(awareness * sentiment, 0, 1);
  return { awareN, awareness, sentiment, spend, deflection, npsShift, feedbackN, engage, costPerAware, readiness, effReach };
}
function a3calc(L3, a1, a2) {
  const eligFrac = clamp((a2.sentiment - L3.minSent) / (0.92 - L3.minSent), 0, 1);
  const eligN = a2.awareN * (0.35 + 0.65 * eligFrac) * (L3.coverage / 100);
  const p = PROD[L3.product];
  const chMult = ({ inapp: 1.0, rm: 1.15, lifecycle: 0.85 })[L3.offerChannel];
  const intensityMult = 1 + 0.08 * (L3.intensity - 1);
  const attachRate = clamp(p.attach * (0.5 + 0.5 * a2.readiness) * intensityMult * chMult, 0, 0.6);
  const adopters = eligN * attachRate;
  const deepeningNII = adopters * (p.nii + p.fee);
  const primacy = clamp((0.06 + 0.10 * a2.readiness) * (L3.product === "dd_switch" ? 1.4 : 1.0) * intensityMult, 0, 0.25) * 100;
  const suitability = !(L3.offerChannel === "rm" && a2.readiness < 0.40);
  const regret = clamp(0.02 + 0.05 * (L3.intensity - 1) * (1 - a2.readiness), 0, 0.14) * 100;
  return { eligN, eligFrac, attachRate, attachPP: attachRate * 100, adopters, deepeningNII, primacy, suitability, regret };
}
function a4calc(L, L2, L3) {
  const a1 = a1calc(L), a2 = a2calc(L2, a1), a3 = a3calc(L3, a1, a2);
  const netNII = a1.retentionNII + a3.deepeningNII - a2.spend + Math.abs(a1.ccCost);
  const mroi = a2.spend > 0 ? a3.deepeningNII / a2.spend : 0;
  const pass = a1.ciFraudUp <= 0 && a1.di >= 0.80 && a3.suitability && a3.regret <= 8;
  return { a1, a2, a3, netNII, mroi, pass, retentionNII: a1.retentionNII, deepeningNII: a3.deepeningNII, spend: a2.spend, ccSave: Math.abs(a1.ccCost) };
}

/* shapes */
function shapeRamp(w) { return 1 - Math.exp(-w / 1.6); }
function shapeAdstock(w) { const l = 0.55; return (1 - Math.pow(l, w)) / (1 - Math.pow(l, 4)); }
function shapeLag(w, lag) { return w <= lag ? 0 : 1 - Math.exp(-(w - lag) / 1.4); }

/* formatting — local; legacy fmtUSD operates on raw dollars, themes.fmtUSD on millions */
function fmtUSD(v) { const a = Math.abs(v); const s = v < 0 ? "−" : ""; if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(1) + "M"; if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(0) + "K"; return s + "$" + a.toFixed(0); }
function fmtN(v) { const a = Math.abs(v); const s = v < 0 ? "−" : ""; if (a >= 1e3) return s + (a / 1e3).toFixed(1) + "K"; return s + Math.round(a); }
function fmtInt(v) { return Math.round(v).toLocaleString(); }

/* ============================ stages ============================ */
const STAGES = [
  { id: "sense", n: "01", name: "Sense", sub: "Signal & theme", hil: false, run: 1100, autoMsg: "Sensing signal cluster…", action: null },
  { id: "hyp", n: "02", name: "Hypothesize", sub: "Reasons · interventions", hil: true, run: 1500, autoMsg: "Generating & ranking hypotheses…", action: "Confirm champion hypothesis & continue →", hint: "select the hypothesis to carry forward" },
  { id: "model", n: "03", name: "Model Stack", sub: "Twins & behavioral models", hil: false, run: 1700, autoMsg: "Assembling twins & behavioral models…", action: null },
  { id: "sim", n: "04", name: "Simulate & Optimize", sub: "Deep what-if levers", hil: true, run: 1100, autoMsg: "Initialising response surface…", action: "Accept simulation & send to gate →", hint: "tune the decision levers, then accept" },
  { id: "gate", n: "05", name: "Decide & Govern", sub: "Gate · approval workflow", hil: true, run: 1200, autoMsg: "Evaluating gate on current levers…", action: "Approve & promote to field test →", hint: "review the gate, then approve" },
  { id: "test", n: "06", name: "Field Test", sub: "Controlled RCT", hil: true, run: 1900, autoMsg: "Streaming champion/challenger weeks…", action: "Accept winner & deploy →", hint: "review the controlled-test result" },
  { id: "learn", n: "07", name: "Deploy & Learn", sub: "Activate · write-back", hil: false, run: 1500, autoMsg: "Promoting v4 · writing back to twins…", action: null },
];
const CAPS = {
  sense: "Signal & theme · why this surfaced",
  hyp: "Reasons · dynamic interventions · fairness",
  model: "Customer twins × behavioral models",
  sim: "Deep what-if · twin × trust × limit × channel × frequency",
  gate: "Decision gate · governance · approval workflow",
  test: "Champion / challenger · controlled rollout",
  learn: "Deploy · measure · write-back · compound",
};
const BASE_LEVERS = { trustMin: 18, limitFlex: 20, cadence: 3, coverage: 60, channels: { zelle: true, ach: true, rtp: false, wire: false }, cohort: "verified", sens: 0.90, dec: 0.85, mkt: 3 };
const BASE_A2 = { alloc: { inapp: 40, push: 20, email: 20, sms: 12, rm: 8 }, freq: 3, creative: "proactive", timing: "pre_payout" };
const BASE_A3 = { product: "hy_savings", intensity: 2, offerChannel: "inapp", minSent: 0.55, coverage: 55 };

/* ============================ small JSX helpers ============================ */
function KV({ k, v, s }) {
  return (
    <div className="kv">
      <div className="k">{k}</div>
      <div className="v">{v}{s && <> <small>{s}</small></>}</div>
    </div>
  );
}
function PanelHeader({ dotCls, title, meta }) {
  return (
    <div className="panel-h">
      <span className={`pdot ${dotCls || ""}`} />
      <span className="pt">{title}</span>
      {meta && <span className="pm">{meta}</span>}
    </div>
  );
}

/* ============================ Sense ============================ */
function SenseStage() {
  return (
    <>
      <div className="sec-intro">
        A money-movement signal cluster surfaced on the cockpit and routed here: <b>gig-economy high-velocity earners whose recurring rent payments are failing</b>. These are not credit-risk customers — they are trusted, recurring obligations tripping a <b>static $1,200 Zelle ceiling</b> set before real-time gig income existed. The recurring-obligation model flags the pattern <b>before the complaint</b>, not after.
      </div>
      <div className="panel" style={{ marginBottom: 14 }}>
        <PanelHeader dotCls="am" title="Detection — what the model already sees" meta="recurring-obligation + counterparty-trust models" />
        <div className="pbody">
          <div className="kvs">
            <KV k="Recurring-obligation match" v="0.81" s="rent-day cadence score" />
            <KV k="Verified history" v="22 mo" s="landlord counterparty" />
            <KV k="Rent vs ceiling" v="$1,425 / $1,200" s={<>median rent &gt; cap</>} />
            <KV k="Step-up friction" v="17.3%" s="of rent-day Zelle, ↑4.1pp QoQ" />
            <KV k="Detection coverage" v="94%" s="of cohort obligations" />
            <KV k="False-positive rate" v="0.6%" s="velocity-fraud separator" />
          </div>
          <div className="note">
            The signal is observable today: a landlord paid for 22 months on a fixed cadence, with rent exceeding the static ceiling. What’s missing is not detection — it’s a <span className="hl">policy that acts on it</span>. That is what Stage 4 simulates.
          </div>
        </div>
      </div>
      <div className="panel">
        <PanelHeader dotCls="bl" title="Signals on this line" meta="8-category meter · cluster-scoped" />
        <div className="pbody">
          <div className="sigrow">
            {GIG.signals.map((s, i) => (
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
        <PanelHeader title="Cluster identity" meta={GIG.cluster.id} />
        <div className="pbody">
          <div className="kvs">
            <KV k="Cohort population" v={fmtInt(GIG.cluster.population)} s="of consumer book" />
            <KV k="Population share" v={(GIG.cluster.share * 100).toFixed(1) + "%"} s="high-velocity" />
            <KV k="Current policy" v="v3" s="step-up ceiling" />
            <KV k="Drift state" v={GIG.cluster.drift} s="stable, monitored" />
            <KV k="Defining cadence" v="Fri 4–8 PM" s="payout window" />
            <KV k="Recurring strength" v="0.81" s="landlord rent-day" />
          </div>
          <div className="note">
            Squarified treemap on the cockpit sized this tile by relevance and colored it <span className="hl">deepening-amber</span> — an unowned cohort with attach 1.1 and clear primacy headroom.
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================ Hypothesize ============================ */
function HypStage() {
  return (
    <>
      <div className="sec-intro">
        Clicking the theme asks TwinX to <b>generate and rank hypotheses</b>: first <b>why</b> the payments fail — across volume, frequency, channel, trust and fairness — then <b>what dynamic rule</b> would fix it, given those reasons, and what the rule is worth. Every hypothesis is a testable intervention with a predicted, bounded outcome.
      </div>
      <div className="panel">
        <PanelHeader dotCls="bl" title="Why are the rent payments failing?" meta="diagnosis · likelihood-weighted" />
        <div className="pbody">
          <div className="reasons">
            {GIG.reasons.map((r) => (
              <div className="reason" key={r.n}>
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
        <PanelHeader title="Candidate interventions — dynamic rules" meta="trust × frequency × payment-mode aware" />
        <div className="pbody">
          {GIG.hyps.map((h) => (
            <div className={`hyp${h.win ? " win" : ""}`} key={h.id}>
              <div className="hyp-h">
                <span className="hyp-id">{h.id}</span>
                <span className="hyp-kind">{h.kind}</span>
                {h.win && <span className="hyp-win">★ champion winner</span>}
              </div>
              <div className="hyp-b">
                <div className="hyp-desc">{h.desc}</div>
                <div className="chips" style={{ marginBottom: 9 }}>
                  {h.params.map((p, i) => <span className="chip" key={i}><b>{p[0]}</b> {p[1]}</span>)}
                </div>
                <div className="chips">
                  {h.out.map((o, i) => <span className={`chip ${o[2] < 0 ? "gr" : "bl"}`} key={i}>{o[0]} {o[1]}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <PanelHeader dotCls="vi" title="Trust & fairness check" meta="pre-registered, before any lift" />
        <div className="pbody">
          <div className="lead">
            The lift is <b>gated on observable trust</b> — a 22-month recurring landlord pattern — never on a protected attribute or its proxy. Because thin-file gig earners absorb <b>1.6× more failures</b> today, the intervention is explicitly tested for <b>disparate impact</b>: the remediation must narrow the thin-file gap, not widen it. This pre-registration is what lets the governance gate clear later without a fairness objection.
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================ Model Stack ============================ */
function ModelStage() {
  return (
    <>
      <div className="sec-intro">
        TwinX assembles a <b>model stack</b> around the cohort: high-fidelity <b>customer twins</b> and the <b>behavioral models</b> that score them — deliberately reaching <b>beyond payment behaviour</b> into counterparty trust, channel propensity, cash-flow stability and deepening propensity. The limit-elasticity and velocity-fraud models are the response surfaces the simulator rides; the trust and deepening models are what let a lift on one customer generalise safely to the cohort.
      </div>
      <div className="mstack">
        <div>
          <div className="panel">
            <PanelHeader dotCls="bl" title="Customer twins" meta="3 of 200,000 · feature vectors" />
            <div className="pbody">
              {GIG.twins.map((t) => (
                <div className={`twin${t.sel ? " sel" : ""}`} key={t.id}>
                  <div className="twin-h">
                    <div className="tw-av">{t.init}</div>
                    <div>
                      <div className="tw-nm">{t.nm}</div>
                      <div className="tw-sb">{t.sb}</div>
                    </div>
                    <span className="tw-tag">{t.tag}</span>
                  </div>
                  <div className="fvec">
                    {t.fv.map((f, i) => (
                      <div className="fv" key={i}>
                        <span className="fl">{f[0]}</span>
                        <span className="fb"><i style={{ width: (f[1] * 100) + "%" }} /></span>
                        <span className="fn">{f[1].toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="note">Marcus is the verified archetype; Aisha is the thin-file fairness case; Rosa is the fortnightly-freelance variant. The simulator runs against whichever twin/cohort you select.</div>
            </div>
          </div>
        </div>
        <div>
          <div className="panel">
            <PanelHeader dotCls="vi" title="Behavioral models generated" meta="trust × channel × limit composition" />
            <div className="pbody">
              {GIG.models.map((m, i) => (
                <div className="model" key={i}>
                  <div className={`mi ${m.c}`}>{m.ic}</div>
                  <div>
                    <div className="mt">{m.t}</div>
                    <div className="md">{m.d}</div>
                    <div className="mq">{m.q.map((x, j) => <span key={j}>{x[0]} <b>{x[1]}</b></span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================ Slider / Seg primitives ============================ */
function Slider({ label, q, min, max, step, value, unit, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="lv">
      <div className="lv-h">
        <span className="lv-l">{label} {q && <span className="q">· {q}</span>}</span>
        <span className="lv-v">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} style={{ "--pct": pct + "%" }} />
      <div className="lv-scale"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );
}
function SegRow({ label, opts, value, onChange, warnFor }) {
  return (
    <div className="lv">
      <div className="lv-h"><span className="lv-l">{label}</span></div>
      <div className="seg">
        {opts.map((o) => {
          const on = value === o[0];
          const warn = warnFor && warnFor.indexOf(o[0]) >= 0;
          return (
            <span key={o[0]} className={`segb ${warn ? "warn " : ""}${on ? "on" : ""}`} onClick={() => onChange(o[0])}>{o[1]}</span>
          );
        })}
      </div>
    </div>
  );
}
function ChanRow({ channels, onToggle }) {
  const rails = [["zelle", "Zelle"], ["ach", "ACH"], ["rtp", "RTP"], ["wire", "Wire"]];
  return (
    <div className="lv">
      <div className="lv-h"><span className="lv-l">Channel / rail policy <span className="q">· where the lift applies</span></span></div>
      <div className="seg">
        {rails.map((r) => {
          const on = channels[r[0]];
          return <span key={r[0]} className={`segb ${r[0] === "wire" ? "warn " : ""}${on ? "on" : ""}`} onClick={() => onToggle(r[0])}>{r[1]}</span>;
        })}
      </div>
    </div>
  );
}

/* ============================ Longitudinal Chart ============================ */
function LineChart({ W, cur, f, col = "#5b9dff", h = 120, ciFrac = 0, base0 = true, infl }) {
  const PL = 8, PR = 10, PT = 10, PB = 4, Wd = 260;
  const N = 64;
  const samp = []; for (let i = 0; i <= N; i++) { const t = i / N * W; samp.push({ t, v: f(t) }); }
  const vis = samp.filter((s) => s.t <= cur + 1e-6); if (vis.length < 1) vis.push({ t: 0, v: f(0) });
  const vs = samp.map((s) => s.v);
  const ciHiAll = samp.map((s) => s.v + (ciFrac ? Math.abs(s.v) * ciFrac / Math.sqrt(Math.max(0.4, s.t)) : 0));
  const ciLoAll = samp.map((s) => s.v - (ciFrac ? Math.abs(s.v) * ciFrac / Math.sqrt(Math.max(0.4, s.t)) : 0));
  let mx = Math.max(...ciHiAll, ...vs), mn = Math.min(...ciLoAll, ...vs);
  if (base0) { mx = Math.max(mx, 0); mn = Math.min(mn, 0); }
  if (mx === mn) { mx += 1; mn -= 1; }
  const pad = (mx - mn) * 0.12; mx += pad; mn -= pad;
  const X = (t) => PL + (t / W) * (Wd - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (h - PT - PB);
  const els = [];
  let key = 0;
  if (mn < 0 && mx > 0) {
    els.push(<line key={key++} x1={PL} y1={Y(0).toFixed(1)} x2={Wd - PR} y2={Y(0).toFixed(1)} stroke="var(--ink-4)" strokeWidth=".7" strokeDasharray="2 3" opacity=".5" />);
  }
  for (let w = 1; w <= W; w++) {
    const gx = X(w);
    els.push(<line key={key++} x1={gx.toFixed(1)} y1={PT} x2={gx.toFixed(1)} y2={h - PB} stroke="var(--hair)" strokeWidth=".6" opacity=".5" />);
  }
  if (ciFrac) {
    const up = [], lo = [];
    vis.forEach((s) => { const hw = Math.abs(s.v) * ciFrac / Math.sqrt(Math.max(0.4, s.t)); up.push(X(s.t).toFixed(1) + "," + Y(s.v + hw).toFixed(1)); lo.unshift(X(s.t).toFixed(1) + "," + Y(s.v - hw).toFixed(1)); });
    els.push(<polygon key={key++} points={up.concat(lo).join(" ")} fill={col} opacity=".11" />);
  }
  const pts = vis.map((s) => X(s.t).toFixed(1) + "," + Y(s.v).toFixed(1)).join(" ");
  els.push(<polyline key={key++} points={pts} fill="none" stroke={col} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />);
  if (infl && cur >= infl.at - 1e-6) {
    const ix = X(infl.at), iy = Y(f(infl.at));
    els.push(<line key={key++} x1={ix.toFixed(1)} y1={PT} x2={ix.toFixed(1)} y2={h - PB} stroke={col} strokeWidth=".8" strokeDasharray="3 3" opacity=".5" />);
    els.push(<circle key={key++} cx={ix.toFixed(1)} cy={iy.toFixed(1)} r="3.4" fill="var(--bg-1)" stroke={col} strokeWidth="1.6" />);
    els.push(<text key={key++} x={(ix + 4).toFixed(1)} y={PT + 9} fontSize="7.5" fill={col} fontFamily="var(--mono)">{infl.label}</text>);
  }
  const last = vis[vis.length - 1];
  els.push(<circle key={key++} cx={X(last.t).toFixed(1)} cy={Y(last.v).toFixed(1)} r="3" fill={col} />);
  if (cur < W) {
    els.push(
      <circle key={key++} cx={X(last.t).toFixed(1)} cy={Y(last.v).toFixed(1)} r="3" fill="none" stroke={col} strokeWidth="1.5" opacity=".5">
        <animate attributeName="r" from="3" to="8" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" from=".5" to="0" dur="1s" repeatCount="indefinite" />
      </circle>
    );
  }
  return (
    <>
      <svg className="chart-svg" viewBox={`0 0 ${Wd} ${h}`} preserveAspectRatio="none" height={h}>{els}</svg>
      <div className="chart-x">{Array.from({ length: W }, (_, i) => <span key={i}>wk{i + 1}</span>)}</div>
    </>
  );
}
function KpiCard({ cls, label, tag, valStr, desc, children }) {
  return (
    <div className={`chart-card ${cls || ""}`}>
      <div className="cc-h"><span className="cc-l">{label}</span>{tag && <span className="cc-tag">{tag}</span>}</div>
      <div className="cc-v">{valStr}</div>
      <div className="cc-d">{desc}</div>
      {children}
    </div>
  );
}
function GCard({ cls, label, valStr, desc }) {
  return (
    <div className="gcard">
      <span className="cc-l">{label}</span>
      <div className={`gv ${cls === "bad" ? "gd-fail" : "gd-pass"}`}>{valStr}</div>
      <div className="gd">{desc}</div>
    </div>
  );
}

/* ============================ Sim Bar ============================ */
function SimBar({ state, prog }) {
  return (
    <div className={`simbar${state.cls ? " " + state.cls : ""}`}>
      <span className="sb-dot" />
      <span className="sb-txt">{state.txt}</span>
      <span className="sb-prog"><i style={{ width: (prog || 0) + "%" }} /></span>
    </div>
  );
}

/* ============================ Animation hook ============================ */
function useAnimateArena() {
  const rafRef = useRef(null); const timRef = useRef(null);
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); clearTimeout(timRef.current); }, []);
  return useCallback(({ weeks, onTick, onState, onDone }) => {
    cancelAnimationFrame(rafRef.current); clearTimeout(timRef.current);
    onTick(0);
    onState({ cls: "run", txt: "initializing Monte-Carlo · sampling priors…" }, 4);
    timRef.current = setTimeout(() => {
      const dur = weeks <= 4 ? 3300 : 5200; let t0 = null;
      const ease = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const frame = (now) => {
        if (t0 === null) t0 = now;
        const p = Math.min(1, (now - t0) / dur), e = ease(p), wk = e * weeks;
        onTick(wk);
        onState({ cls: "run", txt: `simulating week ${wk.toFixed(1)} / ${weeks} · 1,000 draws/wk` }, Math.round(p * 100));
        if (p < 1) rafRef.current = requestAnimationFrame(frame);
        else { onTick(weeks); onState({ cls: "done", txt: `converged · ${weeks}-week horizon · CIs tightened` }, 100); onDone && onDone(); }
      };
      rafRef.current = requestAnimationFrame(frame);
    }, 820);
  }, []);
}

/* ============================ Arena 1 (payment policy) ============================ */
function ArenaA1({ levers, setLevers, onComplete }) {
  const [cur, setCur] = useState(4); // freshly-rendered shows full picture
  const [bar, setBar] = useState({ state: { txt: "ready — press simulate to run the 4-week response" }, prog: 0 });
  const [done, setDone] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const animate = useAnimateArena();

  const r = a1calc(levers);
  const W = 4;
  const dFail = r.baseFail - r.treatedFail;
  const fST = (t) => 100 * (1 - (r.baseFail - dFail * shapeRamp(t)));
  const fFail = (t) => -r.failRemoved * shapeRamp(t);
  const fRet = (t) => r.retentionNII * shapeRamp(t);
  const fCC = (t) => r.ccCost * shapeRamp(t);
  const fFraud = () => r.fraud;
  const cw = Math.max(0, cur);

  const onRun = () => {
    setBtnDisabled(true); setDone(false);
    animate({
      weeks: 4,
      onTick: setCur,
      onState: (s, p) => setBar({ state: s, prog: p }),
      onDone: () => { setBtnDisabled(false); setDone(true); onComplete && onComplete(); },
    });
  };

  const update = (k, v) => setLevers((L) => ({ ...L, [k]: v }));
  const toggleChan = (c) => setLevers((L) => ({ ...L, channels: { ...L.channels, [c]: !L.channels[c] } }));

  return (
    <div className="arena-grid">
      <div className="pbody levers" style={{ padding: 0 }}>
        <SegRow label="Cohort segment" opts={[["verified", "Verified recurring"], ["all", "All gig HV"], ["thin", "Thin-file"]]} value={levers.cohort} onChange={(v) => update("cohort", v)} />
        <Slider label="Recurring-pattern gate" q="min months verified cadence" min={6} max={36} step={1} value={levers.trustMin} unit="mo" onChange={(v) => update("trustMin", v)} />
        <Slider label="Ceiling lift" q="on a matched recurring obligation" min={0} max={60} step={5} value={levers.limitFlex} unit="%" onChange={(v) => update("limitFlex", v)} />
        <ChanRow channels={levers.channels} onToggle={toggleChan} />
        <Slider label="Payout-window tolerance" q="days around Fri 4–8 PM / fortnight" min={0} max={7} step={1} value={levers.cadence} unit="d" onChange={(v) => update("cadence", v)} />
        <Slider label="Cohort coverage" q="share of segment" min={5} max={100} step={5} value={levers.coverage} unit="%" onChange={(v) => update("coverage", v)} />
        <button className="arena-run" disabled={btnDisabled} onClick={onRun}>▶ Simulate payment policy · 4 weeks</button>
      </div>
      <div>
        <SimBar state={bar.state} prog={bar.prog} />
        <div className="charts">
          <KpiCard cls="good" label="Straight-through rate" tag="saturating" valStr={fST(cw).toFixed(1) + "%"} desc="rent-day payments clearing — knee then plateau">
            <LineChart W={W} cur={cw} f={fST} col="#42e08b" base0={false} infl={{ at: 1.2, label: "knee" }} />
          </KpiCard>
          <KpiCard cls="good" label="Failures removed" tag="cumulative" valStr={"−" + fmtInt(-fFail(cw))} desc="step-up frictions eliminated / yr">
            <LineChart W={W} cur={cw} f={fFail} col="#42e08b" ciFrac={0.18} base0 />
          </KpiCard>
          <KpiCard cls="am" label="Retention NII" tag="saturating" valStr={fmtUSD(fRet(cw))} desc="balances defended, annualised">
            <LineChart W={W} cur={cw} f={fRet} col="#ffb15a" ciFrac={0.30} base0 infl={{ at: 1.4, label: "converges" }} />
          </KpiCard>
          <KpiCard cls="good" label="Contact-centre cost" tag="tracks fails" valStr={fmtUSD(fCC(cw))} desc="calls avoided, annualised">
            <LineChart W={W} cur={cw} f={fCC} col="#42e08b" base0 />
          </KpiCard>
          <KpiCard cls={r.ciFraudUp <= 0 ? "bl" : "bad"} label="Fraud Δ · CI tightens" tag="1/√wk" valStr={r.fraud.toFixed(2) + "bps"} desc={r.ciFraudUp <= 0 ? "CI upper ≤ 0 — within guardrail" : "CI upper > 0 — breach"}>
            <LineChart W={W} cur={cw} f={fFraud} col="#5b9dff" ciFrac={1.6} base0 infl={{ at: 2, label: "CI↓" }} />
          </KpiCard>
          <GCard cls={r.di >= 0.80 ? "" : "bad"} label="Fair-lending" valStr={r.di.toFixed(2)} desc={r.di >= 0.80 ? "DI ≥ 0.80 · 4/5 rule · pass" : "DI < 0.80 · breach"} />
        </div>
        {done && (
          <div className="handoff" style={{ marginTop: 10 }}>
            <span className="ho-ic">→</span>
            <span>Friction-cleared eligible pool <b>{fmtInt(r.E1)}</b> customers and <b>{(r.expHead * 100).toFixed(0)}%</b> experience headroom carried into <b>Communications</b>.</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ Arena 2 (comms / MMM) ============================ */
function ArenaA2({ levers, a2, setA2, onComplete }) {
  const [cur, setCur] = useState(4);
  const [bar, setBar] = useState({ state: { txt: "ready — simulate the awareness build" }, prog: 0 });
  const [done, setDone] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const animate = useAnimateArena();

  const a1 = a1calc(levers);
  const r = a2calc(a2, a1);
  const W = 4;
  const fAware = (t) => r.awareness * 100 * shapeAdstock(t);
  const fAwareN = (t) => r.awareN * shapeAdstock(t);
  const fNPS = (t) => r.npsShift * shapeLag(t, 1);
  const fFB = (t) => r.feedbackN * shapeAdstock(t);
  const fSpend = (t) => r.spend * (t / W);
  const cw = Math.max(0, cur);

  const updateAlloc = (k, v) => setA2((A) => ({ ...A, alloc: { ...A.alloc, [k]: v } }));
  const cmKeys = ["inapp", "push", "email", "sms", "rm"];
  const cols = { inapp: "#5b9dff", push: "#4fd1c5", email: "#b794f6", sms: "#ffb15a", rm: "#42e08b" };
  const sum = cmKeys.reduce((a, k) => a + a2.alloc[k], 0);

  const onRun = () => {
    setBtnDisabled(true); setDone(false);
    animate({ weeks: 4, onTick: setCur, onState: (s, p) => setBar({ state: s, prog: p }), onDone: () => { setBtnDisabled(false); setDone(true); onComplete && onComplete(); } });
  };

  return (
    <div className="arena-grid">
      <div className="pbody levers" style={{ padding: 0 }}>
        <div className="lv">
          <div className="lv-h"><span className="lv-l">Channel mix <span className="q">· MMM allocation</span></span></div>
          <div className="cmix">
            {[["inapp", "In-app"], ["push", "Push"], ["email", "Email"], ["sms", "SMS"], ["rm", "RM / branch"]].map((r) => (
              <div className="cmrow" key={r[0]}>
                <span className="cml">{r[1]}</span>
                <input type="range" min="0" max="100" step="5" value={a2.alloc[r[0]]} onChange={(e) => updateAlloc(r[0], +e.target.value)} />
                <span className="cmv">{a2.alloc[r[0]]}%</span>
              </div>
            ))}
          </div>
          <div className="cmbar">
            {cmKeys.map((k) => <i key={k} style={{ width: (sum ? a2.alloc[k] / sum * 100 : 0) + "%", background: cols[k] }} />)}
          </div>
          <div className={`cmtotal${sum !== 100 ? " bad" : ""}`}>allocation total {sum}%{sum !== 100 ? " · normalised" : ""}</div>
        </div>
        <div className="lv">
          <div className="lv-h"><span className="lv-l">Campaign concept / message</span></div>
          <div className="seg" style={{ flexWrap: "wrap" }}>
            {Object.keys(CREATIVE).map((k) => (
              <span key={k} className={`segb ${k === a2.creative ? "on" : ""}`} onClick={() => setA2((A) => ({ ...A, creative: k }))}>
                {CREATIVE[k].lbl.split(" — ")[0]}
              </span>
            ))}
          </div>
        </div>
        <Slider label="Touch frequency" q="per customer / week (freq-capped)" min={0} max={8} step={1} value={a2.freq} unit="" onChange={(v) => setA2((A) => ({ ...A, freq: v }))} />
        <SegRow label="Send timing" opts={[["pre_payout", "Pre-payout"], ["post_recovery", "Post-recovery"]]} value={a2.timing} onChange={(v) => setA2((A) => ({ ...A, timing: v }))} />
        <button className="arena-run" disabled={btnDisabled} onClick={onRun}>▶ Simulate communications · 4 weeks</button>
      </div>
      <div>
        <div className="handoff">
          <span className="ho-ic">←</span>
          <span>From payment policy: <b>{fmtInt(a1.E1)}</b> reachable customers, friction down <b>{(a1.expHead * 100).toFixed(0)}%</b>.</span>
        </div>
        <SimBar state={bar.state} prog={bar.prog} />
        <div className="charts">
          <KpiCard cls="bl" label="Awareness" tag="S-curve adstock" valStr={fAware(cw).toFixed(0) + "%"} desc="of reachable pool — carryover build, accelerating">
            <LineChart W={W} cur={cw} f={fAware} col="#5b9dff" base0 infl={{ at: 1.6, label: "inflection" }} />
          </KpiCard>
          <KpiCard cls="bl" label="Customers aware" tag="cumulative" valStr={fmtInt(fAwareN(cw))} desc="reached across the channel mix">
            <LineChart W={W} cur={cw} f={fAwareN} col="#5b9dff" base0 />
          </KpiCard>
          <KpiCard cls="good" label="CSAT / NPS shift" tag="lags ~1 wk" valStr={"+" + fNPS(cw).toFixed(1)} desc="flat until awareness lands, then climbs">
            <LineChart W={W} cur={cw} f={fNPS} col="#42e08b" base0 infl={{ at: 1, label: "onset" }} />
          </KpiCard>
          <KpiCard cls="vi" label="Positive feedback" tag="adstock" valStr={fmtInt(fFB(cw))} desc={`responses · sentiment ${r.sentiment.toFixed(2)}`}>
            <LineChart W={W} cur={cw} f={fFB} col="#b794f6" base0 />
          </KpiCard>
          <KpiCard cls="am" label="Marketing spend" tag="linear" valStr={fmtUSD(fSpend(cw))} desc={`cumulative · $${r.costPerAware.toFixed(2)} / aware`}>
            <LineChart W={W} cur={cw} f={fSpend} col="#ffb15a" base0 />
          </KpiCard>
          <GCard label="Conversion readiness" valStr={(r.readiness * 100).toFixed(0) + "%"} desc="awareness × sentiment → Arena 3 multiplier" />
        </div>
        {done && (
          <div className="handoff in" style={{ marginTop: 10 }}>
            <span className="ho-ic">→</span>
            <span>Conversion readiness <b>{(r.readiness * 100).toFixed(0)}%</b> (awareness {(r.awareness * 100).toFixed(0)}% × sentiment {r.sentiment.toFixed(2)}) carried into <b>Deepening</b> as the cross-sell multiplier.</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ Arena 3 (deepening) ============================ */
function ArenaA3({ levers, a2, a3, setA3, onComplete }) {
  const [cur, setCur] = useState(4);
  const [bar, setBar] = useState({ state: { txt: "ready — simulate the deepening conversion" }, prog: 0 });
  const [done, setDone] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const animate = useAnimateArena();

  const a1 = a1calc(levers);
  const a2r = a2calc(a2, a1);
  const r = a3calc(a3, a1, a2r);
  const W = 4;
  const fAttach = (t) => r.attachPP * shapeLag(t, 1);
  const fAdopt = (t) => r.adopters * shapeLag(t, 1);
  const fDeep = (t) => r.deepeningNII * shapeLag(t, 1);
  const fPrim = (t) => r.primacy * shapeLag(t, 2);
  const cw = Math.max(0, cur);

  const onRun = () => {
    setBtnDisabled(true); setDone(false);
    animate({ weeks: 4, onTick: setCur, onState: (s, p) => setBar({ state: s, prog: p }), onDone: () => { setBtnDisabled(false); setDone(true); onComplete && onComplete(); } });
  };

  return (
    <div className="arena-grid">
      <div className="pbody levers" style={{ padding: 0 }}>
        <div className="lv">
          <div className="lv-h"><span className="lv-l">Product to deepen into</span></div>
          <div className="seg" style={{ flexWrap: "wrap" }}>
            {Object.keys(PROD).map((k) => (
              <span key={k} className={`segb ${k === a3.product ? "on" : ""}`} onClick={() => setA3((A) => ({ ...A, product: k }))}>{PROD[k].label}</span>
            ))}
          </div>
        </div>
        <SegRow label="Offer channel" opts={[["inapp", "In-app pre-approved"], ["rm", "RM-led"], ["lifecycle", "Lifecycle"]]} value={a3.offerChannel} onChange={(v) => setA3((A) => ({ ...A, offerChannel: v }))} />
        <Slider label="Offer intensity" q="curated offers in sequence" min={1} max={3} step={1} value={a3.intensity} unit="" onChange={(v) => setA3((A) => ({ ...A, intensity: v }))} />
        <Slider label="Sentiment eligibility gate" q="min positive-feedback score to offer" min={40} max={90} step={5} value={Math.round(a3.minSent * 100)} unit="%" onChange={(v) => setA3((A) => ({ ...A, minSent: v / 100 }))} />
        <Slider label="Coverage of eligible pool" q="share of aware+satisfied" min={5} max={100} step={5} value={a3.coverage} unit="%" onChange={(v) => setA3((A) => ({ ...A, coverage: v }))} />
        <button className="arena-run" disabled={btnDisabled} onClick={onRun}>▶ Simulate deepening · 4 weeks</button>
      </div>
      <div>
        <div className="handoff in">
          <span className="ho-ic">←</span>
          <span>From communications: readiness <b>{(a2r.readiness * 100).toFixed(0)}%</b>, <b>{fmtInt(a2r.awareN)}</b> aware &amp; satisfied.</span>
        </div>
        <SimBar state={bar.state} prog={bar.prog} />
        <div className="charts">
          <KpiCard cls="vi" label="Multi-product attach" tag="lagged onset" valStr={"+" + fAttach(cw).toFixed(1) + "pp"} desc={`${PROD[a3.product].label} — flat, then breaks upward`}>
            <LineChart W={W} cur={cw} f={fAttach} col="#b794f6" base0 infl={{ at: 1, label: "onset wk2" }} />
          </KpiCard>
          <KpiCard cls="vi" label="Adopters" tag="cumulative" valStr={fmtInt(fAdopt(cw))} desc={`of ${fmtInt(r.eligN)} eligible`}>
            <LineChart W={W} cur={cw} f={fAdopt} col="#b794f6" base0 />
          </KpiCard>
          <KpiCard cls="am" label="Deepening NII" tag="lagged" valStr={fmtUSD(fDeep(cw))} desc="incl. fee, annualised">
            <LineChart W={W} cur={cw} f={fDeep} col="#ffb15a" ciFrac={0.22} base0 />
          </KpiCard>
          <KpiCard cls="vi" label="Primacy capture" tag="slow lag" valStr={"+" + fPrim(cw).toFixed(1) + "%"} desc="cohort becoming primary — builds last">
            <LineChart W={W} cur={cw} f={fPrim} col="#b794f6" base0 infl={{ at: 2, label: "wk3 onset" }} />
          </KpiCard>
          <GCard cls={r.suitability ? "" : "bad"} label="Suitability" valStr={r.suitability ? "PASS" : "FAIL"} desc={r.suitability ? "offer fits readiness" : "advisory w/o evidence"} />
          <GCard cls={r.regret <= 8 ? "" : "bad"} label="Regret / complaint" valStr={r.regret.toFixed(1) + "%"} desc={r.regret <= 8 ? "within cap" : "over cap — back off intensity"} />
        </div>
        {done && (
          <div className="handoff" style={{ marginTop: 10 }}>
            <span className="ho-ic">→</span>
            <span>Primacy and balances flow to the quarter-scale <b>deposit-deepening flywheel</b> at Deploy &amp; Learn.</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ Arena 4 (combined) ============================ */
function ArenaA4({ levers, a2, a3, onComplete }) {
  const [cur, setCur] = useState(0);
  const [bar, setBar] = useState({ state: { txt: "ready — play the full 8-week sequence" }, prog: 0 });
  const [done, setDone] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const animate = useAnimateArena();

  const R = a4calc(levers, a2, a3);
  const W = 8;
  function ph(start, end, t) { if (t <= start) return 0; if (t >= end) return 1; return shapeRamp(t - start); }
  function comp(t) {
    const ret = R.retentionNII * ph(0, 4, t);
    const cc = R.ccSave * ph(0, 4, t);
    const spend = R.spend * ph(2, 6, t);
    const deep = R.deepeningNII * ph(4, 8, t);
    return { ret, cc, spend, deep, net: ret + cc - spend + deep };
  }
  const fNet = (t) => comp(t).net;
  const cw = Math.max(0, cur), c = comp(cw);

  const onRun = () => {
    setBtnDisabled(true); setDone(false);
    animate({ weeks: 8, onTick: setCur, onState: (s, p) => setBar({ state: s, prog: p }), onDone: () => { setBtnDisabled(false); setDone(true); onComplete && onComplete(); } });
  };

  const cn = (cls, label, val, sub) => (
    <div className={`cnode ${cls || ""}`}>
      <div className="cl">{label}</div>
      <div className="cv">{val}</div>
      <div className="cs">{sub}</div>
    </div>
  );
  const arr = <div className="carrow">→</div>;

  return (
    <div style={{ paddingTop: 4 }}>
      <div className="lead" style={{ marginBottom: 10 }}>
        Runs all three arenas in sequence over an 8-week horizon — payment policy (wk 1–4), communications building once friction clears (wk 3–6), deepening once sentiment lands (wk 5–8). Net NII = retention + deepening − marketing spend + contact-centre savings, subject to the fraud and fair-lending guardrails holding across the whole sequence.
      </div>
      <button className="arena-run" style={{ maxWidth: 340 }} disabled={btnDisabled} onClick={onRun}>▶ Run combined sequence · 8 weeks</button>
      <SimBar state={bar.state} prog={bar.prog} />
      <div className="combine-bridge" style={{ marginTop: 6 }}>
        {cn("", "Retention NII", fmtUSD(c.ret), "wk1-4")}{arr}
        {cn("", "CC savings", fmtUSD(c.cc), "calls avoided")}{arr}
        {cn("", "− Marketing", fmtUSD(-c.spend), "wk3-6")}{arr}
        {cn("", "+ Deepening", fmtUSD(c.deep), "wk5-8")}{arr}
        {cn("out", "Net NII", fmtUSD(c.net), `wk ${cw.toFixed(1)}/8`)}
      </div>
      <div className="charts" style={{ marginTop: 14 }}>
        <div className="chart-card hero am">
          <div className="cc-h"><span className="cc-l">Net NII · 8-week sequential P&amp;L</span><span className="cc-tag">J-curve · invest then compound</span></div>
          <div className="cc-v">{fmtUSD(c.net)}</div>
          <div className="cc-d">retention builds (wk1-4) → marketing spend drags net (wk3-6) → deepening accelerates past breakeven (wk5-8). The dip-then-climb is the payback inflection.</div>
          <LineChart W={W} cur={cw} f={fNet} col="#ffb15a" base0 h={160} infl={{ at: 5, label: "deepening pays back" }} />
        </div>
        <GCard label="Marketing mROI" valStr={R.mroi.toFixed(1) + "x"} desc="deepening NII ÷ marketing spend" />
        <GCard label="Primacy capture" valStr={"+" + (R.a3.primacy * ph(4, 8, cw)).toFixed(1) + "%"} desc="cohort becoming primary" />
        <GCard cls={R.pass ? "" : "bad"} label="Guardrails" valStr={R.pass ? "ALL PASS" : "BREACH"} desc={R.pass ? "fraud · fairness · suitability hold across run" : "a tooth failed — gate will hold"} />
      </div>
      {done && (
        <div className="handoff" style={{ marginTop: 10 }}>
          <span className="ho-ic">✓</span>
          <span>Combined policy net <b>{fmtUSD(c.net)}</b> at <b>{R.mroi.toFixed(1)}x</b> marketing mROI, all guardrails {R.pass ? "clear" : <span style={{ color: "var(--red)" }}>breached</span>}. Accept to send to the governance gate.</span>
        </div>
      )}
    </div>
  );
}

/* ============================ Arena Accordion shell ============================ */
function ArenaShell({ n, id, title, sub, locked, done, active, open, onToggle, children }) {
  const tag = locked ? "locked" : done ? "simulated" : "ready";
  const tagCls = locked ? "lk" : done ? "dn" : "rd";
  const cls = `arena${locked ? " locked" : ""}${done ? " done" : ""}${active ? " active" : ""}${open ? " open" : ""}`;
  return (
    <div className={cls}>
      <div className="arena-h" onClick={() => !locked && onToggle(id)}>
        <div className="arena-n">{n}</div>
        <div>
          <div className="arena-t">{title}</div>
          <div className="arena-s">{sub}</div>
        </div>
        <span className={`arena-tag ${tagCls}`}>{tag}</span>
      </div>
      <div className="arena-body">{children}</div>
    </div>
  );
}

/* ============================ Sim stage container ============================ */
function SimStage({ levers, setLevers, a2, setA2, a3, setA3 }) {
  const [unlocked, setUnlocked] = useState({ a1: true, a2: false, a3: false, a4: false });
  const [doneFlags, setDoneFlags] = useState({ a1: false, a2: false, a3: false, a4: false });
  const [open, setOpen] = useState("a1");

  const toggleOpen = (id) => setOpen(id);

  return (
    <>
      <div className="sec-intro">
        Tune the money-movement decision across <b>three staggered arenas</b> — payment policy, then communications, then deepening. Each arena’s result is carried into the next: removing rent-day friction creates a population you can credibly reach; reaching them builds the sentiment that lets you cross-sell. Each runs as a <b>4-week longitudinal simulation</b> (1,000 Monte-Carlo draws/week, bootstrap CIs); the combined run plays the full sequence end-to-end.
      </div>
      <div className="capbar">
        <span className="cbk">model readiness · fixed for this run</span>
        <div className="cbcell">
          <span className="cbl">recurring-obligation coverage</span>
          <span className="cbv">
            <span className="cbmeter"><i style={{ width: Math.round(levers.sens * 100) + "%" }} /></span>
            <span className="cbn">{Math.round(levers.sens * 100)}%</span>
          </span>
        </div>
        <div className="cbcell">
          <span className="cbl">real-time decision automation</span>
          <span className="cbv">
            <span className="cbmeter"><i style={{ width: Math.round(levers.dec * 100) + "%" }} /></span>
            <span className="cbn">{Math.round(levers.dec * 100)}%</span>
          </span>
        </div>
        <span className="cbnote">Detection coverage and decision-automation maturity are <b>platform capabilities</b> — they advance over quarters via the data &amp; engineering roadmap, not on this screen. They cap how far the policy below can reach today.</span>
      </div>

      <ArenaShell n={1} id="a1" title="Payment policy" sub="sub-group × product × rail — remove rent-day friction" locked={false} done={doneFlags.a1} active={!doneFlags.a1} open={open === "a1"} onToggle={toggleOpen}>
        <ArenaA1 levers={levers} setLevers={setLevers} onComplete={() => { setDoneFlags((f) => ({ ...f, a1: true })); setUnlocked((u) => ({ ...u, a2: true })); setOpen("a2"); }} />
      </ArenaShell>
      <ArenaShell n={2} id="a2" title="Communications · marketing mix" sub="raise awareness of the personalized limit, gather feedback" locked={!unlocked.a2} done={doneFlags.a2} active={unlocked.a2 && !doneFlags.a2} open={open === "a2"} onToggle={toggleOpen}>
        {unlocked.a2 && <ArenaA2 levers={levers} a2={a2} setA2={setA2} onComplete={() => { setDoneFlags((f) => ({ ...f, a2: true })); setUnlocked((u) => ({ ...u, a3: true })); setOpen("a3"); }} />}
      </ArenaShell>
      <ArenaShell n={3} id="a3" title="Deepening" sub="on positive feedback, cross-sell toward primacy" locked={!unlocked.a3} done={doneFlags.a3} active={unlocked.a3 && !doneFlags.a3} open={open === "a3"} onToggle={toggleOpen}>
        {unlocked.a3 && <ArenaA3 levers={levers} a2={a2} a3={a3} setA3={setA3} onComplete={() => { setDoneFlags((f) => ({ ...f, a3: true })); setUnlocked((u) => ({ ...u, a4: true })); setOpen("a4"); }} />}
      </ArenaShell>
      <ArenaShell n={4} id="a4" title="Combined run" sub="all three arenas in sequence — net P&amp;L over 8 weeks" locked={!unlocked.a4} done={doneFlags.a4} active={unlocked.a4 && !doneFlags.a4} open={open === "a4"} onToggle={toggleOpen}>
        {unlocked.a4 && <ArenaA4 levers={levers} a2={a2} a3={a3} onComplete={() => setDoneFlags((f) => ({ ...f, a4: true }))} />}
      </ArenaShell>
    </>
  );
}

/* ============================================================================
   GIG SIM SHELL — 7-step guided flow that wraps the existing SimStage.
   Steps mirror /pipeline (Autopilot · Recent performance · Hypotheses ·
   Tune · Rollout & guardrails · Simulate · Verify & promote). The gig-
   specific math/arenas in SimStage stay untouched — they live inside
   step 4 ("Tune the policy").
   ========================================================================= */
const GIG_SIM_STEPS = [
  { key: "autopilot", label: "Autopilot",               hint: "Recommended",   autopilot: true },
  { key: "baseline",  label: "Recent performance",      hint: "Insight" },
  { key: "hyps",      label: "Hypotheses",              hint: "Insight" },
  { key: "levers",    label: "Tune the policy",         hint: "Decision" },
  { key: "rollout",   label: "Rollout & guardrails",    hint: "Decision" },
  { key: "simulate",  label: "Simulate & see outcomes", hint: "Run" },
  { key: "verify",    label: "Verify & promote",        hint: "Hand-off" },
];

function GigSimStepStrip({ current, completed, onSelect }) {
  const idx = GIG_SIM_STEPS.findIndex((s) => s.key === current);
  return (
    <div className="simstrip">
      {GIG_SIM_STEPS.map((s, i) => {
        const isActive = s.key === current;
        const isDone = i < idx || completed[s.key];
        const cls = "simchip"
          + (s.autopilot ? " auto" : "")
          + (isActive ? " active" : "")
          + (isDone && !isActive ? " done" : "")
          + (!isActive && !isDone ? " queued" : "");
        return (
          <button key={s.key} className={cls} onClick={() => onSelect(s.key)}>
            <span className="simchip-n">
              {s.autopilot ? "∫" : isDone && !isActive ? "✓" : i}
            </span>
            <span className="simchip-l">
              <span className="simchip-t">{s.label}</span>
              <span className="simchip-h">{s.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function GigPolicySummary({ adoptedHyp, approvedSiblings, levers, currentStep, simResult }) {
  const idx = GIG_SIM_STEPS.findIndex((s) => s.key === currentStep);
  const earnedAt = { hyp: 0, combine: 2, levers: 3, rollout: 4, sim: 5 };
  const isLocked = (factIdx) => idx > factIdx;
  // Count gig "tuned" levers as those deviating from BASE_LEVERS reference
  const tunedCount =
    (levers.trustMin !== BASE_LEVERS.trustMin ? 1 : 0) +
    (levers.limitFlex !== BASE_LEVERS.limitFlex ? 1 : 0) +
    (levers.cadence !== BASE_LEVERS.cadence ? 1 : 0) +
    (levers.coverage !== BASE_LEVERS.coverage ? 1 : 0);
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
          adoptedHyp ? adoptedHyp.kind : "—",
          adoptedHyp ? (isLocked(earnedAt.hyp) ? "locked" : "set") : "empty"
        )}
        {pill("combine", "Combined ideas",
          approvedSiblings.length > 0 ? `+${approvedSiblings.length}` : "none",
          isLocked(earnedAt.combine) ? "locked" : (approvedSiblings.length > 0 ? "set" : "empty")
        )}
        {pill("levers", "Settings",
          tunedCount === 0 ? "4 at default" : `${tunedCount} of 4 tuned`,
          isLocked(earnedAt.levers) ? "locked" : (tunedCount > 0 ? "set" : "empty")
        )}
        {pill("rollout", "Rollout",
          `${levers.coverage}%`,
          isLocked(earnedAt.rollout) ? "locked" : "set"
        )}
        {pill("sim", "Expected outcome",
          simResult ? simResult : "not simulated yet",
          simResult ? (isLocked(earnedAt.sim) ? "locked" : "set") : "empty"
        )}
      </div>
    </div>
  );
}

function GigStepNav({ stepIndex, stepTotal, canBack, canNext, onBack, onNext, nextLabel, hint, secondary }) {
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

function GigSimShell({ levers, setLevers, a2, setA2, a3, setA3, onPromote }) {
  const [step, setStep] = useState("autopilot");
  const [completed, setCompleted] = useState({});
  const [adoptedHyp, setAdoptedHyp] = useState(null);
  const [approvedSiblings, setApprovedSiblings] = useState([]);
  const [simResult, setSimResult] = useState(null);

  const indexOf = (k) => GIG_SIM_STEPS.findIndex((s) => s.key === k);
  const goNext = () => {
    const i = indexOf(step);
    if (i < GIG_SIM_STEPS.length - 1) {
      setCompleted((c) => ({ ...c, [step]: true }));
      setStep(GIG_SIM_STEPS[i + 1].key);
    }
  };
  const goBack = () => {
    const i = indexOf(step);
    if (i > 0) setStep(GIG_SIM_STEPS[i - 1].key);
  };

  const adoptHypothesis = (h) => {
    setAdoptedHyp(h);
    setCompleted((c) => ({ ...c, autopilot: true }));
    setStep("baseline");
  };
  const skipAutopilot = () => {
    setCompleted((c) => ({ ...c, autopilot: true }));
    setStep("baseline");
  };

  const toggleSibling = (id) =>
    setApprovedSiblings((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);

  // The simulation result for the policy strip — derived from the gig model
  // once user gets to the Simulate step. Re-uses the existing math.
  const recomputeSimResult = () => {
    try {
      const r = model(levers);
      setSimResult(`${fmtUSD(r.nii)} NII · ${fmtN(Math.abs(r.friction))} fewer blocks`);
    } catch { /* model unavailable */ }
  };

  const activeHyp = adoptedHyp || GIG.hyps[0];
  const otherHyps = GIG.hyps.filter((h) => h.id !== activeHyp.id);

  return (
    <div className="simshell">
      <GigSimStepStrip current={step} completed={completed} onSelect={setStep} />
      {step !== "autopilot" && (
        <GigPolicySummary
          adoptedHyp={activeHyp}
          approvedSiblings={approvedSiblings}
          levers={levers}
          currentStep={step}
          simResult={simResult}
        />
      )}

      {step === "autopilot" && (
        <div className="simstep-body">
          <div className="autopilot-hero">
            <div>
              <div className="ap-tag">AUTOPILOT</div>
              <div className="ap-title">Describe the outcome you want — get a ranked policy recommendation.</div>
              <div className="ap-sub">{GIG.hyps.length} candidate approaches considered for the gig-worker segment. Adopt one, or skip and tune manually.</div>
            </div>
            <div className="ap-stat">
              <div><b>{GIG.hyps.length}</b><span>candidates</span></div>
              <div><b>1.2k</b><span>scenarios</span></div>
              <div><b>6.2s</b><span>compute</span></div>
            </div>
          </div>
          <div className="autopilot-results">
            <div className="ar-head">{GIG.hyps.length} hypotheses worth a look · ranked by NII impact</div>
            {GIG.hyps.map((h, i) => (
              <div key={h.id} className={"ap-card" + (i === 0 ? " rec" : "")}>
                <div className="ap-card-h">
                  {i === 0 && <span className="ap-rec">★ Recommended</span>}
                  <span className="ap-card-name">{h.kind}</span>
                  <span className="ap-card-ref">ref: {h.id}</span>
                </div>
                <div className="ap-card-desc">{h.desc}</div>
                <div className="ap-card-outcomes">
                  {h.out.map(([k, v], j) => <span key={j}>{v} {k}{j < h.out.length - 1 ? " · " : ""}</span>)}
                </div>
                <div className="ap-card-cta">
                  <button className="ap-adopt" onClick={() => adoptHypothesis(h)}>Adopt this hypothesis →</button>
                </div>
              </div>
            ))}
          </div>
          <GigStepNav stepIndex={0} stepTotal={7}
            canBack={false} canNext={false}
            secondary={{ label: "Skip — I'll tune the policy myself →", onClick: skipAutopilot }}
            hint="Adopt the recommended hypothesis (above), or skip and walk through the steps yourself." />
        </div>
      )}

      {step === "baseline" && (
        <div className="simstep-body">
          <div className="step-intro">
            <h3>Recent performance · Gig-worker customers
              <span className="step-intro-pop">about {fmtInt(GIG.cluster.population)} accounts</span>
            </h3>
            <p>
              {adoptedHyp
                ? <>You adopted <b>{adoptedHyp.kind}</b>. Before tuning it, here's how this group has been performing — so the policy sits on real history, not assumptions.</>
                : <>Before you tune a policy for this group, here's how they've been performing — to ground your decisions in real history.</>
              }
            </p>
          </div>
          <div className="grid g3">
            <div className="panel">
              <div className="panel-h"><span className="pdot" /><span className="pt">Last month</span></div>
              <div className="pbody">
                <div className="period-row"><span>Blocked-payment rate</span><b>17.3%</b></div>
                <div className="period-row"><span>Contact-center cost</span><b>$0.35M</b></div>
                <div className="period-row"><span>Complaints</span><b>{Math.round(GIG.cluster.population * 0.008).toLocaleString()}</b></div>
                <div className="period-row"><span>Customer behavior</span><b className="drift-good">Behavior is steady</b></div>
              </div>
            </div>
            <div className="panel">
              <div className="panel-h"><span className="pdot" /><span className="pt">Last quarter</span></div>
              <div className="pbody">
                <div className="period-row"><span>Blocked-payment rate</span><b>16.4%</b></div>
                <div className="period-row"><span>Contact-center cost</span><b>$1.1M</b></div>
                <div className="period-row"><span>Complaints</span><b>{Math.round(GIG.cluster.population * 0.024).toLocaleString()}</b></div>
                <div className="period-row"><span>Customer behavior</span><b className="drift-good">Behavior is steady</b></div>
              </div>
            </div>
            <div className="panel">
              <div className="panel-h"><span className="pdot" /><span className="pt">Last year</span></div>
              <div className="pbody">
                <div className="period-row"><span>Blocked-payment rate</span><b>15.9%</b></div>
                <div className="period-row"><span>Contact-center cost</span><b>$4.2M</b></div>
                <div className="period-row"><span>Complaints</span><b>{Math.round(GIG.cluster.population * 0.096).toLocaleString()}</b></div>
                <div className="period-row"><span>Customer behavior</span><b className="drift-good">Behavior is steady</b></div>
              </div>
            </div>
          </div>
          <div className="panel" style={{ marginTop: 14 }}>
            <div className="panel-h">
              <span className="pdot" />
              <span className="pt">How the small live pilot has been performing (last 6 weeks)</span>
              <span className="pm">Hit confidence threshold week 3 · the new policy clearly wins</span>
            </div>
            <div className="pbody">
              <svg className="chart" viewBox="0 0 640 110" preserveAspectRatio="none" style={{ height: 110 }}>
                <line x1="32" y1="88" x2="624" y2="88" stroke="rgba(255,255,255,.08)" />
                <polyline
                  points={GIG.rct.map((w, i) => `${32 + i * 118.4},${(20 + (1 - w.c / 0.20) * 60).toFixed(1)}`).join(" ")}
                  fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.6" strokeDasharray="4 3"
                />
                <polyline
                  points={GIG.rct.map((w, i) => `${32 + i * 118.4},${(20 + (1 - w.t / 0.20) * 60).toFixed(1)}`).join(" ")}
                  fill="none" stroke="#42e08b" strokeWidth="2.2"
                />
                {GIG.rct.map((w, i) => (
                  <g key={i}>
                    <circle cx={32 + i * 118.4} cy={20 + (1 - w.t / 0.20) * 60} r="2.6" fill={w.fired ? "#42e08b" : "rgba(66,224,139,.55)"} />
                    <text x={32 + i * 118.4} y="104" fill="#5c6577" fontSize="9" textAnchor="middle">wk {w.w}</text>
                  </g>
                ))}
              </svg>
              <div className="pilot-legend">
                <span className="pl-treat">■ Customers on the new policy (treatment)</span>
                <span className="pl-ctrl">■ Customers on the current policy (control)</span>
              </div>
              <div className="step-defining">
                <b>Why this group:</b> Irregular multi-platform inflows with a Friday-evening payout cadence, strong recurring landlord rent patterns, and heavy person-to-person outbound activity.
              </div>
            </div>
          </div>
          <GigStepNav stepIndex={1} stepTotal={7} canBack canNext onBack={goBack} onNext={goNext}
            nextLabel="See alternative hypotheses →"
            hint="Pure context — no decisions made here. Press Enter or click Continue when ready." />
        </div>
      )}

      {step === "hyps" && (
        <div className="simstep-body">
          <div className="step-intro">
            <h3>Hypotheses for Gig-worker customers</h3>
            <p>
              {adoptedHyp
                ? <>You have <b>{adoptedHyp.kind}</b> in flight from Autopilot. TwinX considered <b>{otherHyps.length} alternative {otherHyps.length === 1 ? "approach" : "approaches"}</b> too — approve any to combine into your final policy.</>
                : <>TwinX generated {GIG.hyps.length} hypotheses for this group. The first is the recommended starting point. Approve any others to combine them into your policy.</>
              }
            </p>
          </div>
          <div className="hyp-card active">
            <div className="hyp-h">
              <span className="hyp-active">▶ Currently selected</span>
              <span className="hyp-name">{activeHyp.kind}</span>
              {activeHyp.win && <span className="hyp-star">★ Top performer in pilot</span>}
              <span className="hyp-ref">ref: {activeHyp.id}</span>
            </div>
            <div className="hyp-desc">{activeHyp.desc}</div>
            <div className="hyp-out">{activeHyp.out.map(([k, v], j) => <span key={j}>{v} {k}{j < activeHyp.out.length - 1 ? " · " : ""}</span>)}</div>
          </div>
          {otherHyps.map((h) => {
            const isApproved = approvedSiblings.includes(h.id);
            return (
              <div key={h.id} className={"hyp-card" + (isApproved ? " approved" : "")}>
                <div className="hyp-h">
                  <span className="hyp-name">{h.kind}</span>
                  <span className="hyp-lifecycle">Simulated only</span>
                  <span className="hyp-ref">ref: {h.id}</span>
                </div>
                <div className="hyp-desc">{h.desc}</div>
                <div className="hyp-out">{h.out.map(([k, v], j) => <span key={j}>{v} {k}{j < h.out.length - 1 ? " · " : ""}</span>)}</div>
                <div className="hyp-cta">
                  <button className={"hyp-btn approve" + (isApproved ? " on" : "")} onClick={() => toggleSibling(h.id)}>
                    {isApproved ? "✓ Combined into policy" : "Combine into policy"}
                  </button>
                  {isApproved && <button className="hyp-btn skip" onClick={() => toggleSibling(h.id)}>Remove</button>}
                </div>
              </div>
            );
          })}
          <GigStepNav stepIndex={2} stepTotal={7} canBack canNext onBack={goBack} onNext={goNext}
            nextLabel={approvedSiblings.length > 0
              ? `Tune the policy (${approvedSiblings.length} combined) →`
              : "Tune the policy →"}
            hint={approvedSiblings.length > 0
              ? `${approvedSiblings.length} alternative ${approvedSiblings.length === 1 ? "hypothesis" : "hypotheses"} will be folded into your final policy.`
              : "You can combine alternatives with the Combine buttons, or move on to tune the current one."} />
        </div>
      )}

      {step === "levers" && (
        <div className="simstep-body">
          <div className="step-intro">
            <h3>Tune the policy</h3>
            <p>
              The settings below come from <b>{activeHyp.kind}</b>{approvedSiblings.length > 0 && <>, blended with {approvedSiblings.length} other {approvedSiblings.length === 1 ? "hypothesis" : "hypotheses"} you approved</>}. The gig pipeline tunes payment policy, communications, deepening and the combined run as four staggered arenas.
            </p>
          </div>
          <SimStage levers={levers} setLevers={setLevers} a2={a2} setA2={setA2} a3={a3} setA3={setA3} />
          <GigStepNav stepIndex={3} stepTotal={7} canBack canNext onBack={goBack}
            onNext={() => { recomputeSimResult(); goNext(); }}
            nextLabel="Set rollout →"
            hint="Tune levers in the 4 staggered arenas above. Preview updates live." />
        </div>
      )}

      {step === "rollout" && (
        <div className="simstep-body">
          <div className="step-intro">
            <h3>Rollout &amp; guardrails</h3>
            <p>
              You've tuned <b>{activeHyp.kind}</b>. Now decide what share of the gig-worker group sees the new policy, and confirm the non-negotiable risk limits.
            </p>
          </div>
          <div className="grid g2">
            <div className="panel">
              <div className="panel-h"><span className="pdot" /><span className="pt">Rollout scope</span></div>
              <div className="pbody">
                <div className="dosage-h">
                  <span>Customers reached</span>
                  <b>{levers.coverage}%</b>
                </div>
                <input
                  className="lvr-s" type="range" min="20" max="100" step="5"
                  value={levers.coverage} onChange={(e) => setLevers((L) => ({ ...L, coverage: +e.target.value }))}
                  style={{ "--p": ((levers.coverage - 20) / 80) * 100 + "%" }}
                />
                <div className="dosage-meta">
                  <div><span>Reached:</span> <b>{Math.round(GIG.cluster.population * (levers.coverage / 100)).toLocaleString()}</b> of {fmtInt(GIG.cluster.population)} accounts</div>
                  <div><span>Held out (control):</span> <b>{Math.round(GIG.cluster.population * (1 - levers.coverage / 100)).toLocaleString()}</b></div>
                  <div><span>Trial length:</span> <b>6 weeks</b></div>
                </div>
                <div className="dosage-note">We'll declare a winner when the result is well outside chance (95% confidence).</div>
              </div>
            </div>
            <div className="panel">
              <div className="panel-h"><span className="pdot" /><span className="pt">Non-negotiable guardrails</span></div>
              <div className="pbody">
                {evalGate(levers).map((g, i) => (
                  <div key={i} className="cset">
                    <span className={"cono-i " + (g.pass ? "ok" : "no")}>{g.pass ? "✓" : "✕"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "var(--ink-2)", fontWeight: 600 }}>{g.c}</div>
                      <div style={{ fontSize: 10, color: "var(--ink-4)" }}>{g.m}</div>
                    </div>
                  </div>
                ))}
                <div className="dosage-note">TwinX checks these limits on every simulation. Any policy that breaks one is rejected by the gate.</div>
              </div>
            </div>
          </div>
          <GigStepNav stepIndex={4} stepTotal={7} canBack canNext onBack={goBack} onNext={goNext}
            nextLabel="Simulate the policy →"
            hint={`Will roll out to ${Math.round(GIG.cluster.population * (levers.coverage / 100)).toLocaleString()} accounts (${levers.coverage}%) under the guardrails on the right.`} />
        </div>
      )}

      {step === "simulate" && (
        <div className="simstep-body">
          <div className="step-intro">
            <h3>Simulate &amp; see outcomes</h3>
            <p>
              <b>{activeHyp.kind}</b> tuned · rollout {levers.coverage}% · ready to test. The four arenas inside step 4 ran their own simulations; here's the rolled-up policy outcome.
            </p>
          </div>
          {(() => {
            const r = model(levers);
            return (
              <div className="grid g2">
                <div className="panel">
                  <div className="panel-h"><span className="pdot gr" /><span className="pt">Predicted outcomes</span><span className="pm">policy at current settings</span></div>
                  <div className="pbody">
                    <div className="period-row"><span>Net Interest Income</span><b style={{ color: r.nii >= 0 ? "var(--green)" : "var(--red)" }}>{fmtUSD(r.nii)}</b></div>
                    <div className="period-row"><span>Blocked-payment reduction</span><b style={{ color: "var(--green)" }}>{fmtN(Math.abs(r.friction))} fewer</b></div>
                    <div className="period-row"><span>Complaint risk</span><b style={{ color: r.complaints <= 0 ? "var(--green)" : "var(--red)" }}>{fmtN(r.complaints)}</b></div>
                    <div className="period-row"><span>Fraud-rate change (worst case)</span><b style={{ color: r.ciFraud[1] <= 0 ? "var(--green)" : "var(--red)" }}>{r.ciFraud[1].toFixed(2)} bps</b></div>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-h"><span className="pdot" /><span className="pt">Guardrail check</span></div>
                  <div className="pbody">
                    {evalGate(levers).map((g, i) => (
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
          <GigStepNav stepIndex={5} stepTotal={7} canBack canNext onBack={goBack}
            onNext={() => { recomputeSimResult(); goNext(); }}
            nextLabel="Verify the policy →"
            hint="Predicted outcomes for the gig policy at current settings." />
        </div>
      )}

      {step === "verify" && (
        <div className="simstep-body">
          <div className="step-intro">
            <h3>Verify &amp; promote</h3>
            <p>
              Final check before sending to <b>Approval review</b>. The policy below — <b>{activeHyp.kind}</b>{approvedSiblings.length > 0 && <> + {approvedSiblings.length}</>}, tuned and stress-tested — is what TwinX will hand off.
            </p>
          </div>
          <div className="panel">
            <div className="panel-h"><span className="pdot" /><span className="pt">Final policy settings</span><span className="pm">{activeHyp.kind}</span></div>
            <div className="pbody">
              <div className="period-row"><span>Minimum trust score</span><b>{levers.trustMin}</b></div>
              <div className="period-row"><span>Limit-raise amount</span><b>+{levers.limitFlex}%</b></div>
              <div className="period-row"><span>Cadence (months of history)</span><b>{levers.cadence}</b></div>
              <div className="period-row"><span>Customers reached</span><b>{levers.coverage}%</b></div>
            </div>
          </div>
          <div className="panel" style={{ marginTop: 12 }}>
            <div className="panel-h"><span className="pdot" /><span className="pt">Final guardrail check</span></div>
            <div className="pbody">
              {evalGate(levers).map((g, i) => (
                <div key={i} className="cono">
                  <span className={"cono-i " + (g.pass ? "ok" : "no")}>{g.pass ? "✓" : "✕"}</span>
                  <span className="cono-k">{g.c}</span>
                  <span className="cono-v">{g.pass ? "pass" : "fail"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={"actbar " + (evalGate(levers).every((g) => g.pass) ? "" : "blocked")}>
            <div className="ab-i">{evalGate(levers).every((g) => g.pass) ? "✓" : "⛔"}</div>
            <div className="ab-tx">
              <b>{evalGate(levers).every((g) => g.pass) ? "Policy ready" : "Policy blocked"}</b> — {evalGate(levers).every((g) => g.pass)
                ? <>TwinX has tuned and stress-tested. Approval review evaluates downside risk and the live-pilot design.</>
                : <>One or more guardrails are failing. Return to Tune the policy and adjust.</>}
            </div>
            <button className="ab-btn" disabled={!evalGate(levers).every((g) => g.pass)} onClick={onPromote}>
              Promote to Approval review
            </button>
          </div>
          <GigStepNav stepIndex={6} stepTotal={7} canBack canNext={false} onBack={goBack}
            hint="Use the green Promote button above when you're ready to hand off." />
        </div>
      )}
    </div>
  );
}

/* ============================ Gate ============================ */
function evalGate(L) {
  const r = model(L); const di = disparateImpact(L);
  return [
    { c: "Winner declared", m: "champion/challenger stopping rule fired (week 3)", pass: true },
    { c: "Complaint exposure bounded", m: "complaints " + fmtN(r.complaints) + " (reduction) ≤ cap", pass: r.complaints <= 0 },
    { c: "Fraud not worsened", m: "fraud_rate_delta ci_upper " + r.ciFraud[1].toFixed(2) + " bps ≤ 0", pass: r.ciFraud[1] <= 0 },
    { c: "NII positive at lower CI", m: "nii ci_lower " + fmtUSD(r.ciNii[0]) + " > 0", pass: r.ciNii[0] > 0 },
    { c: "Fairness / disparate impact", m: "DI ratio " + di.toFixed(2) + " ≥ 0.80 (4/5 rule) · personalization within fairness frontier", pass: di >= 0.80 },
    { c: "Build integrity & drift", m: "cluster drift_state = stable; model build hash verified", pass: true },
  ];
}
function GateStage({ levers }) {
  const [flow, setFlow] = useState([
    { av: "PO", nm: "Policy Owner", ro: "Consumer Money Movement", st: "approved", c: "“Trust-gated, pattern-verified. This is the rent-day fix we've wanted.”" },
    { av: "MR", nm: "Model Risk", ro: "SR 11-7 review", st: "approved", c: "“Response surface monotone & explainable; fraud separator AUC 0.95. Cleared.”" },
    { av: "FC", nm: "Fairness / Compliance", ro: "Disparate-impact audit", st: "pending", c: "Reviewing thin-file remediation evidence from the simulator…" },
    { av: "CB", nm: "Consumer Banking Lead", ro: "Final sign-off", st: "waiting", c: "Awaiting compliance clearance." },
  ]);
  const [btnState, setBtnState] = useState({ text: "Record compliance clearance →", disabled: false });

  const g = evalGate(levers); const allPass = g.every((x) => x.pass);

  const onApprove = () => {
    setFlow((f) => {
      const next = [...f];
      next[2] = { ...next[2], st: "approved", c: "“Thin-file gap narrows 1.6×→1.1×. Disparate-impact concern resolved.”" };
      next[3] = { ...next[3], st: "approved", c: "“Cleared for controlled rollout at 95/5 treatment/holdout.”" };
      return next;
    });
    setBtnState({ text: "✓ Approved — promoted to Field Test", disabled: true });
  };

  return (
    <>
      <div className="sec-intro">
        The simulated policy is routed through the <b>decision gate</b> (is the effect real, bounded, and downside-safe?), the <b>governance gate</b> (six pre-registered conditions, evaluated on your current levers), and a human <b>approval workflow</b>. The gate <b>branches on the real result</b> — if the fraud guardrail breached in the simulator, it hard-kills here rather than clearing.
      </div>
      <div className="panel">
        <PanelHeader dotCls={allPass ? "gr" : ""} title="Governance gate matrix" meta="live on current levers" />
        <div className="pbody np">
          <table className="gmat">
            <thead><tr><th>Condition</th><th>Evaluation</th><th>Verdict</th></tr></thead>
            <tbody>
              {g.map((x, i) => (
                <tr key={i}>
                  <td className="cn">{x.c}</td>
                  <td className="mono">{x.m}</td>
                  <td><span className={`verdict ${x.pass ? "pass" : "fail"}`}>{x.pass ? "pass" : "fail"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <PanelHeader dotCls={allPass ? "gr" : ""} title="Gate verdict" />
        <div className="pbody">
          <div className={`guard ${allPass ? "ok" : "breach"}`}>
            {allPass ? "✓  ALL CONDITIONS PASS — policy cleared to controlled field test." : "⚠  HARD KILL — a guardrail failed on the current levers. Return to Simulate, raise the trust gate or lower the lift, and re-evaluate."}
          </div>
        </div>
      </div>
      <div className="panel">
        <PanelHeader dotCls="bl" title="Approval workflow" meta="auditable · SR 11-7 record attached" />
        <div className="pbody">
          <div className="flow">
            {flow.map((f, i) => (
              <div className="fstep" key={i}>
                <div className="fr">
                  <div className="fav">{f.av}</div>
                  <div><div className="fnm">{f.nm}</div><div className="fro">{f.ro}</div></div>
                </div>
                <span className={`fst ${f.st}`}>{f.st}</span>
                <div className="fc">{f.c}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", marginTop: 6 }}>
            <button className="runbtn" style={{ width: "auto", display: "inline-block", padding: "9px 18px" }} disabled={btnState.disabled} onClick={onApprove}>{btnState.text}</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================ Field Test ============================ */
function TestStage() {
  // animate bars after render
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const id = setTimeout(() => {
      const bars = root.querySelectorAll(".bar");
      bars.forEach((b) => { b.style.height = b.dataset.h + "%"; });
    }, 60);
    return () => clearTimeout(id);
  }, []);
  const max = 0.20;
  return (
    <>
      <div className="sec-intro">
        Approval is not proof. The cleared policy goes to a <b>controlled randomized test</b> — 95% treatment, 5% held-out control — with a <b>sequential stopping rule</b>. TwinX streams the friction-rate gap weekly; the rule fires the moment the lift is real and durable, not when the calendar says so.
      </div>
      <div className="panel">
        <PanelHeader title="Champion / challenger — step-up friction rate" meta="treatment vs control · 6 weeks" />
        <div className="pbody">
          <div className="rctchart" ref={ref}>
            {GIG.rct.map((w) => {
              const th = (w.t / max) * 100, ch = (w.c / max) * 100;
              return (
                <div className={`wk${w.fired ? " fired" : ""}`} key={w.w}>
                  <div className="bars">
                    <div className="bar t" style={{ height: 0 }} data-h={th} />
                    <div className="bar c" style={{ height: 0 }} data-h={ch} />
                  </div>
                  <div className="wl">wk {w.w}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>
            <span><i style={{ display: "inline-block", width: 9, height: 9, background: "var(--acq)", borderRadius: 2, marginRight: 5 }} />treatment</span>
            <span><i style={{ display: "inline-block", width: 9, height: 9, background: "var(--ink-4)", borderRadius: 2, marginRight: 5 }} />control (holdout)</span>
          </div>
        </div>
      </div>
      <div className="panel">
        <PanelHeader dotCls="gr" title="Test resolution" />
        <div className="pbody">
          <div className="kvs">
            <KV k="Treatment fraction" v="95%" s="5% holdout" />
            <KV k="Weeks simulated" v="6" s="sequential" />
            <KV k="Stopping rule" v="week 3" s="fired · winner" />
            <KV k="Lift at decision" v="−6.9pp" s="friction rate" />
            <KV k="Lift 95% CI" v="−11.7 … −2.4pp" s="excludes 0" />
            <KV k="Resolution" v="WINNER" s="durable" />
          </div>
          <div className="guard ok" style={{ marginTop: 12 }}>
            ✓  Stopping rule fired at <b>week 3</b> and held through week 6 — treatment friction ~10% vs control ~17%. The lift is real; promote to deploy.
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================ Learn ============================ */
function LoopCurveSVG({ levers }) {
  const REG0 = clamp(chainInputs(levers).REG - 0.30, 0.45, 0.75);
  function traj(gamma) { let reg = REG0; const a = []; for (let s = 0; s < 28; s++) { const c = chainAtREG(levers, reg); a.push(c.VAL); reg = clamp(reg + gamma * (c.PRIM / 100) - 0.25 * (reg - REG0), 0, 1); } return a; }
  const open = traj(0), closed = traj(CHAINP.gamma);
  const all = open.concat(closed); let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo) * 0.15 || 1; lo -= pad; hi += pad;
  const W = 520, H = 150, L0 = 8, R = 8, T = 8, B = 8;
  const pts = (a) => a.map((v, i) => { const x = L0 + i / (a.length - 1) * (W - L0 - R); const y = T + (1 - (v - lo) / (hi - lo)) * (H - T - B); return x.toFixed(1) + "," + y.toFixed(1); }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 150 }}>
      <polyline fill="none" stroke="#5c6577" strokeWidth="1.6" strokeDasharray="5 4" points={pts(open)} />
      <polyline fill="none" stroke="#ffb15a" strokeWidth="2.2" points={pts(closed)} />
    </svg>
  );
}
function LearnStage({ levers }) {
  const loop = [["Detect", "new failures"], ["Simulate", "re-tune policy"], ["Govern", "clear gate"], ["Deploy", "what cleared"], ["Measure", "live vs predicted"], ["Recalibrate", "sharper models"]];
  const cl = loopSteady(levers, CHAINP.gamma), op = loopSteady(levers, 0);
  const lift = 100 * (cl.ssVAL - op.ssVAL) / op.ssVAL;
  return (
    <>
      <div className="sec-intro">
        The winning policy deploys as <b>v4</b> for the gig cohort. The value isn&apos;t one-and-done: as rent-day reliability builds, the cohort routes more income through the bank, deepens, and becomes more predictable — so each quarter&apos;s decision is made on a sharper book and earns more than the last. The chart quantifies that <b>compounding</b>.
      </div>
      <div className="panel">
        <PanelHeader dotCls="gr" title="Deploy" meta="policy promotion" />
        <div className="pbody">
          <div className="kvs">
            <KV k="Policy version" v="v3 → v4" s="gig cohort" />
            <KV k="Rollout" v="staged" s="95% → 100%" />
            <KV k="Effective ceiling" v="$1,200 → $1,440" s="on verified pattern" />
            <KV k="Rollback" v="1-click" s="auto on drift" />
          </div>
        </div>
      </div>
      <div className="panel">
        <PanelHeader dotCls="am" title="Deposit-deepening flywheel · cohort NII over 7 quarters" meta="with vs without compounding" />
        <div className="pbody">
          <LoopCurveSVG levers={levers} />
          <div style={{ display: "flex", gap: 16, margin: "8px 0 4px", fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>
            <span><i style={{ display: "inline-block", width: 14, height: 0, borderTop: "2px dashed #5c6577", verticalAlign: "middle", marginRight: 5 }} />one-time fix (no compounding)</span>
            <span><i style={{ display: "inline-block", width: 14, height: 0, borderTop: "2px solid var(--acc)", verticalAlign: "middle", marginRight: 5 }} />with deepening flywheel</span>
          </div>
          <div className="kvs" style={{ marginTop: 10 }}>
            <KV k="Reinforcement / quarter" v="+7.9%" s="of primary-share, fed back" />
            <KV k="Cohort reliability" v="0.68 → 0.81" s="income routed to bank" />
            <KV k="Year-1 NII" v={fmtUSD(op.ssVAL)} s="one-time fix" />
            <KV k="Steady-state NII" v={fmtUSD(cl.ssVAL)} s={`+${lift.toFixed(1)}% vs one-time`} />
          </div>
          <div className="note">
            The reinforcement rate is estimated from a cohort panel, isolating the deepening effect from payout-cadence shifts (employer / platform schedules) so it isn’t confounded by income timing. The gap between the lines is the <span className="hl">recurring value of staying in the loop</span> rather than shipping a static rule and walking away.
          </div>
        </div>
      </div>
      <div className="panel">
        <PanelHeader title="The loop, run every day" meta="detect → simulate → govern → deploy → measure → recalibrate" />
        <div className="pbody">
          <div className="loopd">
            {loop.map((x, i) => (
              <span key={i} style={{ display: "contents" }}>
                <div className="lnode"><div className="ln">{x[0]}</div><div className="ld">{x[1]}</div></div>
                {i < loop.length - 1 && <span className="larrow">→</span>}
              </span>
            ))}
          </div>
          <div className="note">Each realised rent-day outcome updates the recurring-pattern and counterparty-trust scores — so next cycle&apos;s simulation starts from a sharper prior. A drift in the friction rate auto-seeds a re-simulation.</div>
        </div>
      </div>
      <div className="panel">
        <PanelHeader dotCls="cy" title="Write-back & continuous learning" />
        <div className="pbody">
          <div className="lead">
            The simulated lift is reconciled against the field result, shrunk toward the realised effect, and the <b>policy updated the same day</b> — not in a monthly batch. The trust and limit-elasticity models relearn from realised outcomes, and the deepening models inherit the freshly-trusted relationships.
          </div>
          <div style={{ marginTop: 14, padding: "14px 16px", border: "1px solid rgba(255,177,90,.3)", borderRadius: 10, background: "rgba(255,177,90,.05)" }}>
            <div style={{ fontSize: 12, color: "var(--ink)" }}>
              <span className="hl">Why this matters:</span> a static ceiling failed a trusted customer every rent day, and the bank learned only when the complaint arrived. TwinX <span className="hlb">detected</span> the pattern, <span className="hlb">simulated</span> the fix against fraud and fair-lending guardrails, <span className="hlb">solved</span> for the best policy, <span className="hlb">proved</span> it on a holdout, <span className="hlb">deployed</span> the winner, and <span className="hlb">keeps learning</span> — so the same money-movement signal that defended the deposit now compounds into deepening. That is the anticipatory bank.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================ Main page ============================ */
export default function GigPipeline() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Allow ?stage=N (1..7) to deep-link directly to a stage — useful for
  // demos, screenshots and bug triage. Defaults to stage 1 (Sense).
  const stageParam = Math.max(0, Math.min(STAGES.length - 1, (parseInt(params.get("stage") || "1", 10) || 1) - 1));
  const [levers, setLevers] = useState(BASE_LEVERS);
  const [a2, setA2] = useState(BASE_A2);
  const [a3, setA3] = useState(BASE_A3);
  const [status, setStatus] = useState(() => STAGES.map((_, i) => i < stageParam ? "done" : "queued"));
  const [active, setActive] = useState(stageParam);
  const [auto, setAuto] = useState(false);
  // autoRef mirrors `auto` so timer callbacks always see the current value.
  // Without this, useCallback closures captured the stale `auto=false` from
  // the render BEFORE setAuto(true) flushed — autopilot would fire one stage
  // then halt because the `if (auto)` branch read the stale closure value.
  const autoRef = useRef(false);
  useEffect(() => { autoRef.current = auto; }, [auto]);
  const leversRef = useRef(levers);
  useEffect(() => { leversRef.current = levers; }, [levers]);

  const [actionState, setActionState] = useState(null); // null | { kind: "act"|"blocked", stage }
  const timerRef = useRef(null);

  // body bg cleanup (preventive)
  useEffect(() => {
    const prev = document.body.style.background;
    return () => { document.body.style.background = prev; };
  }, []);

  const enterStage = useCallback((i) => {
    clearTimeout(timerRef.current);
    setActive(i);
    setActionState(null);
    setStatus((S) => { const N = [...S]; N[i] = "running"; return N; });
    const delay = autoRef.current ? STAGES[i].run : 520;
    timerRef.current = setTimeout(() => {
      const s = STAGES[i];
      if (s.hil) {
        setStatus((S) => { const N = [...S]; N[i] = "await"; return N; });
        if (s.id === "gate") {
          const allPass = evalGate(leversRef.current).every((x) => x.pass);
          setActionState({ kind: allPass ? "act" : "blocked", stage: s });
        } else {
          setActionState({ kind: "act", stage: s });
        }
      } else {
        setStatus((S) => { const N = [...S]; N[i] = "done"; return N; });
        if (autoRef.current) {
          timerRef.current = setTimeout(() => {
            if (i < STAGES.length - 1) enterStage(i + 1);
            else setAuto(false);
          }, 650);
        }
      }
    }, delay);
  }, []);

  // initial mount: kick off the initial stage (defaults to Sense, unless
  // ?stage=N deep-linked further in).
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    enterStage(stageParam);
  }, [enterStage, stageParam]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const pause = () => {
    autoRef.current = false;
    setAuto(false);
    clearTimeout(timerRef.current);
  };
  const play = () => {
    // Sync the ref BEFORE calling enterStage — setAuto is async, so without
    // this line enterStage's setTimeout callback reads autoRef.current=false.
    autoRef.current = true;
    setAuto(true);
    const stt = status[active];
    if (stt === "await") return;
    if (stt === "done") {
      if (active < STAGES.length - 1) enterStage(active + 1);
      else { autoRef.current = false; setAuto(false); }
      return;
    }
    enterStage(active);
  };
  const step = () => {
    const stt = status[active];
    if (stt === "await") {
      const s = STAGES[active];
      if (s.id === "gate" && !evalGate(levers).every((x) => x.pass)) { enterStage(3); return; }
      completeHIL();
      return;
    }
    if (stt === "running") return;
    if (active < STAGES.length - 1) enterStage(active + 1);
  };
  const resetRun = () => { pause(); setStatus(STAGES.map(() => "queued")); enterStage(0); };

  const completeHIL = () => {
    setActionState(null);
    setStatus((S) => { const N = [...S]; N[active] = "done"; return N; });
    if (autoRef.current) {
      timerRef.current = setTimeout(() => {
        if (active < STAGES.length - 1) enterStage(active + 1);
        else { autoRef.current = false; setAuto(false); }
      }, 600);
    }
  };
  const onAction = () => {
    if (actionState && actionState.kind === "blocked") { pause(); enterStage(3); return; }
    completeHIL();
  };

  const onRailClick = (i) => { pause(); enterStage(i); };

  // header
  const s = STAGES[active], stt = status[active];
  const headerStatusMap = { running: ["run", "running"], await: ["hold", "awaiting input"], done: ["done", "complete"], queued: ["", "queued"] };

  // autobar
  const phase = stt === "running" ? (auto ? s.autoMsg : "running " + s.name + "…")
    : stt === "await" ? "awaiting human · " + s.hint
    : stt === "done" ? s.name + " complete"
    : "ready";

  const canvasContent = useMemo(() => {
    switch (s.id) {
      case "sense": return <SenseStage />;
      case "hyp": return <HypStage />;
      case "model": return <ModelStage />;
      // Sim is now a 7-step guided shell that wraps the existing 4-arena
      // SimStage as its "Tune the policy" step. onPromote advances the OUTER
      // pipeline ribbon to stage 4 (Approval review).
      case "sim": return <GigSimShell
        levers={levers} setLevers={setLevers}
        a2={a2} setA2={setA2} a3={a3} setA3={setA3}
        onPromote={() => enterStage(4)}
      />;
      case "gate": return <GateStage levers={levers} />;
      case "test": return <TestStage />;
      case "learn": return <LearnStage levers={levers} />;
      default: return null;
    }
  }, [s.id, levers, a2, a3, enterStage]);

  return (
    <PageShell>
    <div className="gig-pipeline">
      <div className="app">
        <div className="appbar appbar-crumb">
          {/* Breadcrumb only — Logo + env + ThemeToggle live in GlobalTopBar. */}
          <div className="ab-crumb">
            <a onClick={() => navigate("/")}>Hypothesis Hub</a>
            <span className="sep">›</span>
            <a onClick={() => navigate("/theme?id=gig&mode=inside_out")}>Gig · fortnightly rent failing</a>
            <span className="sep">›</span>
            <span className="cur">Decision Pipeline</span>
          </div>
          <div className="ab-sp" />
          <div className="ab-chip"><span className="k">run</span> <b>run_gig_0427</b></div>
          <div className="ab-chip"><span className="ab-spin" /> auto-refresh</div>
        </div>
        <div className="subbar">
          <span className="sb-badge">Gig-worker customers</span>
          <span className="sb-claim"><b>Recurring rent payments are failing</b> — verified landlord obligations are tripping a static transaction limit.</span>
          <div className="sb-sp" />
          <div className="sb-chip"><span className="v rd">~236,000</span><span className="l">rent-day blocks / yr</span></div>
          <div className="sb-chip"><span className="v ac">17.3%</span><span className="l">blocked-payment rate</span></div>
          <div className="sb-chip"><span className="v gr">+$56M</span><span className="l">expected NII impact</span></div>
          <div className="sb-chip"><span className="v bl">200,000</span><span className="l">customers in scope</span></div>
        </div>

        {/* Outer horizontal stage ribbon (replaces the old left rail) */}
        <div className="outerribbon">
          {STAGES.map((st, i) => {
            const stt2 = status[i];
            const cls = "outerchip"
              + (i === active ? " active" : "")
              + (stt2 === "done" ? " done" : "")
              + (stt2 === "running" ? " running" : "")
              + (stt2 === "await" ? " await" : "")
              + (stt2 === "queued" ? " queued" : "");
            const nodeTxt = stt2 === "done" ? "✓" : stt2 === "await" ? "!" : (i + 1);
            const biz = STAGE_BIZ[st.id] || { name: st.name, cap: st.sub };
            const subTxt = stt2 === "running" ? "Running…"
              : stt2 === "await" ? "Awaiting your input"
              : stt2 === "done" ? "Done"
              : "Queued";
            return (
              <button key={st.id} className={cls} onClick={() => onRailClick(i)} title={biz.cap}>
                <span className="outerchip-n">{nodeTxt}</span>
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
              <span className="wh-n">{s.n}</span>
              <div>
                <div className="wh-t">{(STAGE_BIZ[s.id] || {}).name || s.name}</div>
                <div className="wh-cap">{(STAGE_BIZ[s.id] || {}).cap || CAPS[s.id]}</div>
              </div>
              <div className="wh-sp" />
              <span className={`wh-status ${headerStatusMap[stt][0]}`}><span className="wh-dot" />{headerStatusMap[stt][1]}</span>
            </div>
            <div className="autobar">
              <div className="ap-dots">
                {STAGES.map((st, i) => {
                  const dotCls = "apd " + status[i] + (i === active ? " cur" : "");
                  return (
                    <span key={st.id} style={{ display: "contents" }}>
                      <span className={dotCls} title={st.name} />
                      {i < STAGES.length - 1 && <span className="apline" />}
                    </span>
                  );
                })}
              </div>
              <div className="ap-phase">
                <span className={`apmode${auto ? " on" : ""}`}>{auto ? "● AUTOPILOT" : "autopilot off"}</span>
                <span className="ap-stage">Stage {active + 1} / 7</span>
                <span className={`ap-msg${stt === "running" ? " run" : ""}${stt === "await" ? " hold" : ""}`}>{phase}</span>
              </div>
              <div className="ap-ctl">
                {auto
                  ? <button className="apbtn" onClick={pause}>⏸ Pause</button>
                  : <button className="apbtn primary" onClick={play}>▶ {status.every((x) => x === "queued") ? "Run autopilot" : "Resume"}</button>}
                <button className="apbtn" onClick={step} title="Advance one stage">Next →</button>
                <button className="apbtn" onClick={resetRun}>↺ Reset</button>
              </div>
            </div>
            <div className="canvas">
              {actionState && (
                actionState.kind === "blocked"
                  ? (
                    <div className="actbar blocked">
                      <div className="ab-i">⛔</div>
                      <div className="ab-tx"><b>Gate hard-killed on the current levers.</b> A guardrail failed — autopilot is halted. Return to Simulate, raise the trust gate or lower the lift, then re-run.</div>
                      <button className="ab-btn red" onClick={onAction}>← Return to Simulate</button>
                    </div>
                  )
                  : (
                    <div className="actbar">
                      <div className="ab-i">✋</div>
                      <div className="ab-tx"><b>Human in the loop — {actionState.stage.hint}.</b> Autopilot is paused at <b>{actionState.stage.name}</b> until you act.</div>
                      <button className="ab-btn" onClick={onAction}>{actionState.stage.action}</button>
                    </div>
                  )
              )}
              {canvasContent}
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageShell>
  );
}
