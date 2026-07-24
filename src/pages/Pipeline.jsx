import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TWINX from "@/data/bundle";
import { OBJ, fmtUSD } from "@/data/themes";
import {
  prettyHypothesisName, prettyHypothesisSentence, prettyLifecycle,
  prettyClusterName, prettyClusterDescription, prettyDriftState,
  prettyMetricLabel, prettyMetricShort, prettyMetricValue,
  prettyPredictedOutcome, prettyLeverLabel,
  prettyStageName, prettyStageCap,
  prettyConsoleTag, AUTOPILOT_PROMPTS, formatRef,
} from "@/data/pretty";
import { Logo, ThemeToggle } from "@/components/Logo";
import PageShell from "@/components/PageShell";
import "@/styles/pipeline.css";

/* ============================================================================
   TwinX Pipeline — generic pipeline view ported from pipeline.html.
   Reads from the canonical TWINX bundle; no per-theme hardcoding.
   ========================================================================= */

const pad2 = (n) => String(n).padStart(2, "0");
const fmtTs = () => {
  const d = new Date();
  return `[${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}]`;
};
function hexToRgba(h, a) {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function fmtUSDcents(c) {
  const d = c / 100;
  const a = Math.abs(d);
  const s = d < 0 ? "-" : "";
  if (a >= 1e9) return s + "$" + (a / 1e9).toFixed(a % 1e9 === 0 ? 0 : 1) + "B";
  if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(a % 1e6 === 0 ? 0 : 1) + "M";
  if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(0) + "K";
  return s + "$" + Math.round(a);
}

/* ---------- derived metric/context for the chosen hypothesis ---------- */
export function deriveContext(HID, THEME) {
  const TX = TWINX;
  const _tm = TX.themeMap[THEME];
  const HYP =
    TX.hypotheses[HID] ||
    (_tm && _tm.highlight ? TX.hypotheses[_tm.highlight] : null) ||
    (_tm && _tm.hyps && _tm.hyps.length ? TX.hypotheses[_tm.hyps[0]] : null) ||
    TX.hypotheses["H-2026-04-12"];
  const CLUS = HYP ? TX.clusters[HYP.cluster_id] : null;
  const SIM = HYP ? TX.simulations[HYP.hypothesis_id] : null;
  const CC = HYP ? TX.championChallenger[HYP.hypothesis_id] : null;
  const metricOf = (id) => (SIM ? SIM.metrics.find((m) => m.metric_id === id) || null : null);
  const KIND = TX.kindLabel;

  function deriveObj() {
    if (!HYP) return "ret";
    const kind = HYP.intervention.kind;
    if (["tighten_novel_counterparty", "time_of_day_modifier", "amount_band_policy"].indexOf(kind) >= 0) return "ret";
    const affluentSMB = /affluent|small_business|retired|multi_banker/.test(HYP.cluster_id);
    const nii = metricOf("nii_contribution");
    if (
      nii &&
      nii.point_estimate > 0 &&
      ["ceiling_lift_on_pattern_match", "coordinated_transition_response", "rail_specific_policy"].indexOf(kind) >= 0
    )
      return affluentSMB ? "deep" : "acq";
    return "acq";
  }
  const objKey = deriveObj();
  const T = {
    obj: objKey,
    type: HYP ? KIND[HYP.intervention.kind] || "Money Movement" : "—",
    name: CLUS ? CLUS.semantic_name : THEME,
    valueM: (() => {
      const n = metricOf("nii_contribution");
      if (n) return n.point_estimate / 100 / 1e6;
      const c = metricOf("contact_centre_cost_delta");
      return c ? Math.abs(c.point_estimate) / 100 / 1e6 : 0;
    })(),
    conf: CLUS
      ? Math.round(
          (CLUS.population_share || 0.1) * 0 +
            (() => {
              if (!SIM) return 70;
              const pm = metricOf("nii_contribution") || SIM.metrics[0];
              const w = ((pm.ci_upper - pm.ci_lower) / Math.max(Math.abs(pm.point_estimate), 1e-9)) * 100;
              return Math.max(40, Math.min(97, Math.round(100 - w)));
            })(),
        )
      : 70,
  };
  T.vq = (() => {
    const t = { acq: "inflow opportunity", deep: "CLV opportunity", ret: "deposits at risk" }[T.obj];
    const fr = metricOf("friction_events_delta");
    if (T.obj === "ret" && fr && !metricOf("nii_contribution")) return "attrition exposure";
    return t;
  })();
  const O = OBJ[T.obj];
  const ACC = O.col;
  const treatment = HYP ? HYP.intervention.kind.replace(/_/g, " ") : "targeted policy";
  const claim = HYP ? HYP.intervention.description : "—";

  // N: derived metric pack
  const N = (() => {
    const nii = metricOf("nii_contribution");
    const lamM = nii ? nii.point_estimate / 100 / 1e6 : Math.abs(T.valueM);
    const lamLoM = nii ? nii.ci_lower / 100 / 1e6 : lamM * 0.8;
    const lamHiM = nii ? nii.ci_upper / 100 / 1e6 : lamM * 1.18;
    const fr = metricOf("friction_events_delta");
    const donothingM = -Math.abs(lamM) * 1.4;
    const broadM = -Math.abs(lamM) * 0.78;
    let liftPE;
    if (CC && CC.stream && CC.stream.length) {
      liftPE = +(Math.abs(CC.stream[CC.stream.length - 1].lift_point_estimate) * 100).toFixed(1);
    } else if (fr) {
      liftPE = +Math.min(40, Math.abs(fr.point_estimate) / 250).toFixed(1);
    } else {
      liftPE = 12.0;
    }
    const pop = CLUS ? CLUS.population : 50000;
    const inframe = Math.round(pop * 0.63);
    const ce = metricOf("complaint_exposure");
    const pbeat = nii ? Math.max(55, Math.min(98, Math.round(50 + (nii.ci_lower / Math.max(1, nii.ci_upper)) * 50))) : 88;
    const cvarM = lamLoM > 0 ? lamLoM * 0.6 : lamM * 0.2;
    const breach = ce ? +Math.max(0.2, Math.min(8, ce.ci_upper / 6)).toFixed(1) : 1.5;
    const clusters = CC ? CC.stream[CC.stream.length - 1].control_n : Math.max(6, Math.round(pop / 800));
    const nStr = inframe >= 1000 ? (inframe / 1000).toFixed(1) + "k" : "" + inframe;
    const flag = /retired|mass_affluent/.test(HYP ? HYP.cluster_id : "") ? "geo_proxy_cluster" : "tenure_proxy_band";
    const shrunk = +(liftPE * 0.82).toFixed(1);
    const geLamM = lamM * 0.75;
    const kind = HYP ? HYP.intervention.kind : "";
    const sobol =
      kind === "tighten_novel_counterparty"
        ? [
            ["novelty_threshold", 38],
            ["efe_language_match", 27],
            ["beneficiary_history", 18],
            ["amount_band", 11],
            ["residual", 6],
          ]
        : kind === "coordinated_transition_response"
        ? [
            ["transition_signal", 40],
            ["primacy_window", 24],
            ["rm_capacity", 18],
            ["competitor_response", 12],
            ["residual", 6],
          ]
        : [
            ["pattern_match_strength", 41],
            ["recurrence_window", 23],
            ["channel_capacity", 16],
            ["competitor_response", 13],
            ["residual", 7],
          ];
    return {
      lam: Math.round(lamM),
      lamLo: Math.round(lamLoM),
      lamHi: Math.round(lamHiM),
      donothing: Math.round(donothingM),
      broad: Math.round(broadM),
      pbeat,
      cvar: Math.round(cvarM),
      breach,
      mde: "+/-" + (liftPE * 0.18).toFixed(1) + "pp",
      power: CC ? 92 : 88,
      n: nStr,
      clusters,
      liftPE,
      late: +(liftPE + 2.7).toFixed(1),
      shrunk,
      geLam: Math.round(geLamM),
      fidelity: +(Math.abs(liftPE - shrunk) + 1.4).toFixed(1),
      fidGain: 0.7,
      inframe: inframe.toLocaleString(),
      controlR: 54.0,
      treatR: 54.0 + liftPE,
      flagFeat: flag,
      sobol,
    };
  })();

  return { TX, HYP, CLUS, SIM, CC, metricOf, KIND, T, O, ACC, treatment, claim, N };
}

/* ---------- simulation engine: leverSpec, runForward, solve ---------- */
export function buildSIMX(HYP, SIM, metricOf) {
  function leverSpec() {
    if (!HYP) return [];
    const k = HYP.intervention.kind;
    const pr = HYP.intervention.parameters;
    const L = [];
    function num(key, label, min, max, step, unit) {
      if (pr[key] === undefined) return;
      L.push({ key, label, min, max, step, unit, base: pr[key], val: pr[key] });
    }
    if (k === "ceiling_lift_on_pattern_match") {
      num("ceiling_lift_pct", "Ceiling lift", 0, 60, 5, "%");
      num("min_recurrence_months", "Min recurrence", 6, 36, 1, "mo");
      num("detection_window_months", "Detection window", 6, 36, 1, "mo");
    } else if (k === "coordinated_transition_response") {
      num("ceiling_lift_pct", "Ceiling lift", 0, 60, 5, "%");
      num("primacy_window_days", "Primacy window", 5, 45, 1, "d");
    } else if (k === "tighten_novel_counterparty") {
      L.push({
        key: "first_ever_threshold_cents",
        label: "First-ever threshold",
        min: 50000, max: 5000000, step: 50000, unit: "$",
        base: pr.first_ever_threshold_cents, val: pr.first_ever_threshold_cents,
      });
    } else if (k === "time_of_day_modifier") {
      num("threshold_relax_pct", "Threshold relax", -40, 40, 5, "%");
    } else if (k === "amount_band_policy") {
      const topBand = pr.bands && pr.bands[pr.bands.length - 1];
      if (topBand)
        L.push({
          key: "__topband_bps", label: "Top-band rate",
          min: 0, max: 75, step: 5, unit: "bps",
          base: topBand.rate_bps, val: topBand.rate_bps,
        });
    } else if (k === "rail_specific_policy") {
      num("threshold_relax_pct", "Threshold relax", 0, 40, 5, "%");
    }
    L.push({ key: "__coverage", label: "Target coverage", min: 5, max: 100, step: 5, unit: "%", base: 60, val: 60 });
    return L;
  }
  function metricKeys() { return SIM ? SIM.metrics.map((m) => m.metric_id) : []; }
  function effectMultiplier(levers) {
    let m = 1, cov = 1;
    levers.forEach((l) => {
      if (l.key === "__coverage") { cov = l.val / l.base; return; }
      const rel = l.base === 0 ? l.val / (l.max || 1) : l.val / l.base;
      const w = (l.key.indexOf("ceiling") >= 0 || l.key.indexOf("relax") >= 0 || l.key.indexOf("topband") >= 0 || l.key.indexOf("threshold") >= 0) ? 0.55 : 0.18;
      m *= 1 + w * Math.tanh((rel - 1) * 1.4);
    });
    return { gain: m, coverage: cov };
  }
  function projectMetric(mid, mult) {
    const base = metricOf(mid); if (!base) return null;
    const pt = base.point_estimate;
    let scale;
    if (mid === "nii_contribution") scale = mult.gain * mult.coverage;
    else if (mid === "fraud_rate_delta") scale = mult.gain;
    else scale = mult.gain * mult.coverage;
    const newPt = pt * scale;
    const halfBaseW = (base.ci_upper - base.ci_lower) / 2;
    const widthScale = Math.sqrt(1 / Math.max(0.05, mult.coverage));
    const half = (halfBaseW * scale * widthScale) / Math.max(0.6, mult.gain);
    return { metric_id: mid, unit: base.unit, direction: base.direction, point: newPt, lo: newPt - half, hi: newPt + half, basePt: pt };
  }
  function runForward(levers, iterations) {
    const mult = effectMultiplier(levers);
    const itScale = Math.sqrt(1000 / Math.max(50, iterations));
    return metricKeys().map((mid) => {
      const p = projectMetric(mid, mult); if (!p) return null;
      const half = ((p.hi - p.lo) / 2) * itScale; p.lo = p.point - half; p.hi = p.point + half;
      return p;
    }).filter(Boolean);
  }
  function objectiveValue(results, goal) {
    const nii = results.find((r) => r.metric_id === "nii_contribution");
    const fr = results.find((r) => r.metric_id === "friction_events_delta");
    const niiUsd = nii ? nii.point / 100 : 0;
    const friUsd = fr ? -fr.point * 35 : 0;
    if (goal === "nii") return niiUsd;
    if (goal === "friction") return friUsd;
    return 0.6 * niiUsd + 0.4 * friUsd;
  }
  function checkConstraints(results, cons) {
    const out = [];
    const ce = results.find((r) => r.metric_id === "complaint_exposure");
    const fr = results.find((r) => r.metric_id === "fraud_rate_delta");
    const nii = results.find((r) => r.metric_id === "nii_contribution");
    if (cons.complaintCap != null && ce)
      out.push({ k: "complaint_exposure ci_upper ≤ " + cons.complaintCap, pass: ce.hi <= cons.complaintCap, val: ce.hi.toFixed(1) });
    if (cons.fraudNotWorse && fr)
      out.push({ k: "fraud_rate_delta ci_upper ≤ 0", pass: fr.hi <= 0, val: fr.hi.toFixed(2) + " bps" });
    if (cons.niiPositive && nii)
      out.push({ k: "nii_contribution ci_lower > 0", pass: nii.lo > 0, val: fmtUSDcents(nii.lo) });
    return out;
  }
  function solve(levers, goal, cons, budgetIter) {
    let dims = levers.map((l) => ({ ...l }));
    const traj = [];
    let bestVal = -Infinity, bestVec = null, bestRes = null, bestFeasible = false;
    const steps = budgetIter || 40;
    for (let s = 0; s < steps; s++) {
      const di = s % dims.length;
      const d = dims[di];
      const dir = Math.random() < 0.5 ? -1 : 1;
      const trial = dims.map((x) => ({ ...x }));
      let nv = trial[di].val + dir * trial[di].step * (1 + Math.floor(Math.random() * 2));
      nv = Math.max(trial[di].min, Math.min(trial[di].max, nv));
      trial[di].val = nv;
      const res = runForward(trial, 1000);
      const val = objectiveValue(res, goal);
      const cks = checkConstraints(res, cons);
      const feasible = cks.every((c) => c.pass);
      const accept = (feasible && val > bestVal) || (!bestFeasible && feasible) || (!bestFeasible && !feasible && val > bestVal);
      if (accept) {
        dims = trial;
        if (feasible || !bestFeasible) {
          bestVal = val; bestVec = trial; bestRes = res; bestFeasible = feasible || bestFeasible;
        }
      }
      traj.push({ step: s + 1, val: objectiveValue(runForward(dims, 1000), goal), feasible });
    }
    if (!bestVec) { bestVec = dims; bestRes = runForward(dims, 1000); bestVal = objectiveValue(bestRes, goal); }
    return { pi: bestVec, value: bestVal, results: bestRes, feasible: bestFeasible, trajectory: traj };
  }
  return { leverSpec, metricKeys, runForward, objectiveValue, checkConstraints, solve };
}

/* ---------- metric meta + formatting helpers ---------- */
function metricMeta(mid) {
  const direction = {
    nii_contribution: "pos",
    friction_events_delta: "neg",
    contact_centre_cost_delta: "neg",
    complaint_exposure: "neg",
    fraud_rate_delta: "neg",
    multi_product_attach_rate_delta: "pos",
    primacy_capture_rate: "pos",
  };
  return { label: prettyMetricLabel(mid), good: direction[mid] || "pos" };
}
function fmtMetric(v, unit) {
  if (unit === "usd_cents") return fmtUSDcents(v);
  if (unit === "bps") return (v > 0 ? "+" : "") + v.toFixed(2) + " bps";
  if (unit === "pp") return (v > 0 ? "+" : "") + v.toFixed(1) + " pp";
  if (unit === "pct") return v.toFixed(1) + "%";
  return (v > 0 ? "+" : "") + Math.round(v).toLocaleString();
}
function leverDisp(l) {
  if (l.unit === "$") return "$" + (l.val / 100).toLocaleString();
  return l.val + (l.unit === "%" ? "%" : l.unit ? " " + l.unit : "");
}
function leverBase(l) {
  if (l.unit === "$") return "$" + (l.base / 100).toLocaleString();
  return l.base + (l.unit === "%" ? "%" : "");
}
function fmtObj(v) {
  const a = Math.abs(v); const s = v < 0 ? "-" : "";
  if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(0) + "K";
  return s + "$" + Math.round(a);
}

/* ---------- low-level JSX helpers (replace innerHTML builders) ---------- */
const Panel = ({ title, meta, children, np, dotColor }) => (
  <div className="panel">
    <div className="panel-h">
      <span className="pdot" style={dotColor ? { background: dotColor } : undefined} />
      <span className="pt">{title}</span>
      {meta && <span className="pm">{meta}</span>}
    </div>
    <div className={"pbody" + (np ? " np" : "")}>{children}</div>
  </div>
);
const Pill = ({ k, children }) => <span className={"pill p-" + k}>{children}</span>;
const KT = ({ v, l, s, cls }) => (
  <div className="kt">
    <div className={"v " + (cls || "")}>{v}</div>
    <div className="l">{l}</div>
    {s && <div className="s">{s}</div>}
  </div>
);
const KV = ({ rows }) => (
  <>{rows.map((r, i) => (
    <div key={i} className="kv">
      <span className="kk">{r[0]}</span>
      <span className="vv">{r[1]}</span>
    </div>
  ))}</>
);
const Bars = ({ rows, col }) => (
  <div className="bars">
    {rows.map((r, i) => (
      <div key={i} className="barrow">
        <span className="bl">{r[0]}</span>
        <span className="bt"><i style={{ width: r[1] + "%", background: col || "var(--acc)" }} /></span>
        <span className="bv">{r[1]}%</span>
      </div>
    ))}
  </div>
);
const ActionBar = ({ children, btn, hard, onClick }) => (
  <div className={"actionbar " + (hard ? "hard" : "ok")}>
    <span className="ab-ic">{hard ? "gate" : "stage passed"}</span>
    <span className="ab-tx">{children}</span>
    {btn && (
      <button className={"nextbtn" + (hard ? " amber" : "")} onClick={onClick}>{btn}</button>
    )}
  </div>
);

/* ---------- chart helpers (return JSX, not strings) ---------- */
function gpath(cx, sd, amp, W, base) {
  let p = "";
  for (let x = 0; x <= W; x += 4) {
    const y = amp * Math.exp(-((x - cx) * (x - cx)) / (2 * sd * sd));
    p += x + "," + (base - y).toFixed(1) + " ";
  }
  return p;
}
const DistChart = ({ N }) => {
  const W = 320, base = 100;
  return (
    <svg className="chart" viewBox={`0 0 ${W} 118`}>
      <line x1="0" y1={base} x2={W} y2={base} stroke="rgba(255,255,255,.1)" />
      <polyline points={gpath(55, 25, 66, W, base)} fill="rgba(255,122,122,.12)" stroke="#ff7a7a" strokeWidth="1.5" />
      <polyline points={gpath(145, 29, 58, W, base)} fill="rgba(255,177,90,.12)" stroke="#ffb15a" strokeWidth="1.5" />
      <polyline points={gpath(245, 23, 78, W, base)} fill="rgba(66,224,139,.14)" stroke="#42e08b" strokeWidth="1.7" />
      <text x="55" y="113" fill="#ff7a7a" fontSize="8" textAnchor="middle" fontFamily="monospace">{N.donothing}M</text>
      <text x="145" y="113" fill="#ffb15a" fontSize="8" textAnchor="middle" fontFamily="monospace">{N.broad}M</text>
      <text x="245" y="113" fill="#42e08b" fontSize="8" textAnchor="middle" fontFamily="monospace">+{N.lam}M</text>
    </svg>
  );
};
const FrontierChart = () => {
  const W = 320, Hh = 120; let pts = "";
  for (let x = 8; x <= W - 8; x += 6) {
    const t = (x - 8) / (W - 16);
    pts += x + "," + (Hh - 16 - 100 * (1 - Math.exp(-3.1 * t))).toFixed(1) + " ";
  }
  const kx = 8 + (W - 16) * 0.4; const ky = Hh - 16 - 100 * (1 - Math.exp(-3.1 * 0.4));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${Hh}`}>
      <line x1="8" y1={Hh - 16} x2={W - 8} y2={Hh - 16} stroke="rgba(255,255,255,.1)" />
      <line x1="8" y1="6" x2="8" y2={Hh - 16} stroke="rgba(255,255,255,.1)" />
      <polyline points={pts} fill="none" stroke="#42e08b" strokeWidth="1.7" />
      <circle cx={kx.toFixed(1)} cy={ky.toFixed(1)} r="4" fill="#ffb15a" stroke="#1c1304" strokeWidth="1.5" />
      <text x={(kx + 7).toFixed(1)} y={(ky - 3).toFixed(1)} fill="#ffb15a" fontSize="9" fontFamily="monospace">pi*</text>
      <text x={W - 8} y={Hh - 4} fill="#5c6577" fontSize="7.5" textAnchor="end">cost / spend</text>
      <text x="11" y="13" fill="#5c6577" fontSize="7.5">E[net value]</text>
    </svg>
  );
};
const Reliability = () => {
  const W = 150, Hh = 120;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${Hh}`}>
      <line x1="14" y1={Hh - 14} x2={W - 8} y2="10" stroke="rgba(255,255,255,.18)" strokeDasharray="3 3" />
      <polyline points={`14,${Hh - 14} 40,86 70,60 100,36 ${W - 8},12`} fill="none" stroke="#5b9dff" strokeWidth="1.7" />
      <text x="14" y={Hh - 2} fill="#5c6577" fontSize="7">predicted</text>
      <text x="5" y="11" fill="#5c6577" fontSize="7" transform="rotate(-90 5 11)">observed</text>
    </svg>
  );
};
const CalibChart = () => {
  const W = 150, Hh = 120;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${Hh}`}>
      <line x1="14" y1={Hh - 14} x2={W - 8} y2="10" stroke="rgba(255,255,255,.18)" strokeDasharray="3 3" />
      <circle cx="40" cy="86" r="2.6" fill="#5b9dff" />
      <circle cx="68" cy="64" r="2.6" fill="#5b9dff" />
      <circle cx="96" cy="42" r="2.6" fill="#5b9dff" />
      <circle cx="118" cy="36" r="3.2" fill="#ffb15a" />
      <text x="14" y={Hh - 2} fill="#5c6577" fontSize="7">tau sim</text>
      <text x="5" y="11" fill="#5c6577" fontSize="7" transform="rotate(-90 5 11)">tau RCT</text>
    </svg>
  );
};
const SeqChart = () => {
  const W = 300, Hh = 110; let up = "", e = "";
  for (let x = 10; x <= W - 10; x += 10) up += x + "," + (20 + 1200 / (x - 2)).toFixed(0) + " ";
  for (let i = 0; i <= 11; i++) {
    const x = 10 + i * ((W - 20) / 11); const y = Hh - 18 - Math.min(70, i * i * 0.7);
    e += x.toFixed(0) + "," + y.toFixed(0) + " ";
  }
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${Hh}`}>
      <line x1="10" y1={Hh - 18} x2={W - 10} y2={Hh - 18} stroke="rgba(255,255,255,.1)" />
      <polyline points={up} fill="none" stroke="rgba(255,122,122,.5)" strokeWidth="1.3" strokeDasharray="3 3" />
      <polyline points={e} fill="none" stroke="#42e08b" strokeWidth="1.8" />
      <text x={W - 10} y="14" fill="#ff7a7a" fontSize="7.5" textAnchor="end">reject boundary</text>
      <text x="12" y={Hh - 4} fill="#5c6577" fontSize="7.5">{"day →"}</text>
    </svg>
  );
};
const Gauge = ({ pct, lab, val }) => {
  const r = 26; const c = 2 * Math.PI * r; const off = c * (1 - pct / 100);
  return (
    <div className="gauge-wrap">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--acc)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c.toFixed(1)} strokeDashoffset={off.toFixed(1)} transform="rotate(-90 32 32)" />
        <text x="32" y="36" textAnchor="middle" fill="#e9edf4" fontSize="13" fontWeight="700" fontFamily="monospace">{val}</text>
      </svg>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700 }}>{lab}</div>
        <div style={{ fontSize: 10, color: "var(--ink-3)" }}>decision-fidelity gain this run</div>
      </div>
    </div>
  );
};
const GeBars = ({ N }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 108, padding: 4 }}>
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ height: 84, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ width: 42, height: 84, background: "linear-gradient(180deg,#42e08b,rgba(66,224,139,.3))", borderRadius: "5px 5px 0 0" }} />
      </div>
      <div className="mono" style={{ fontSize: 11, color: "#42e08b", marginTop: 5 }}>+{fmtUSD(N.lam)}</div>
      <div style={{ fontSize: 8, color: "#5c6577", textTransform: "uppercase" }}>PE pilot</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", color: "#5c6577", paddingBottom: 28 }}>{"→"}</div>
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ height: 84, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ width: 42, height: Math.round((84 * N.geLam) / N.lam) + "px", background: "linear-gradient(180deg,#5b9dff,rgba(91,157,255,.3))", borderRadius: "5px 5px 0 0" }} />
      </div>
      <div className="mono" style={{ fontSize: 11, color: "#5b9dff", marginTop: 5 }}>+{fmtUSD(N.geLam)}</div>
      <div style={{ fontSize: 8, color: "#5c6577", textTransform: "uppercase" }}>GE rollout</div>
    </div>
  </div>
);
const RctViz = ({ N, animatedHeight, animatedNum }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 120, padding: "6px 10px" }}>
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ height: 88, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ width: 48, height: Math.round((88 * N.controlR) / 100) + "px", background: "rgba(255,255,255,.13)", borderRadius: "5px 5px 0 0" }} />
      </div>
      <div className="mono" style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{N.controlR.toFixed(1)}%</div>
      <div style={{ fontSize: 8, color: "#5c6577", textTransform: "uppercase" }}>control</div>
    </div>
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ height: 88, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ width: 48, height: animatedHeight + "px", background: "linear-gradient(180deg,#42e08b,rgba(66,224,139,.35))", borderRadius: "5px 5px 0 0", transition: "height 1.4s cubic-bezier(.3,.9,.3,1)" }} />
      </div>
      <div className="mono" style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: "#42e08b" }}>{animatedNum.toFixed(1)}%</div>
      <div style={{ fontSize: 8, color: "#5c6577", textTransform: "uppercase" }}>treatment</div>
    </div>
  </div>
);

/* ============================================================================
   STAGE RENDERERS
   ========================================================================= */

export function StageData({ N, twinName, onNext }) {
  return (
    <>
      <div className="grid g23">
        <Panel title="Customer feature store" meta="15.3M customer records · refreshed 2 min ago" np>
          <table className="dtable">
            <thead><tr>
              <th>Feature</th><th className="m">Type</th><th>Source system</th><th className="m">Fresh</th><th className="m">Missing</th><th className="m">Rows</th>
            </tr></thead>
            <tbody>
              {[
                ["90-day balance trajectory", "series", "Core Deposits", "2m", "0.0%", "15.3M"],
                ["Competitor rate gap", "number", "Rate Board", "5m", "0.1%", "15.3M"],
                ["Aggregator logins (30d)", "number", "Aggregator Scan", "8m", "1.2%", "9.1M"],
                ["Probing transfer signal", "flag", "Transfer Monitor", "1m", "0.0%", "15.3M"],
                ["Customer tenure (months)", "number", "Core Deposits", "1d", "0.0%", "15.3M"],
                ["Products held", "number", "Customer 360", "1h", "0.3%", "15.3M"],
                ["Relationship segment", "category", "CRM", "1d", "2.1%", "4.2M"],
                ["Prior offer response", "category", "Campaign Manager", "1h", "4.0%", "11.8M"],
              ].map((r, i) => (
                <tr key={i}>
                  <td><b>{r[0]}</b></td>
                  <td className="m">{r[1]}</td>
                  <td>{r[2]}</td>
                  <td className="m">{r[3]}</td>
                  <td className="m">{r[4]}</td>
                  <td className="m">{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="What TwinX is solving for" meta="Estimand · v3">
          <KV rows={[
            ["Net value goal", "Outcomes gained − cost of policy"],
            ["Personalization", "Effect varies by customer profile"],
            ["Primary outcome", "Balance retained at 90 days"],
            ["Secondary outcome", "Time until customer leaves"],
            ["Hard constraint", "Net Interest Income ≥ guardrail"],
            ["Test unit", twinName.slice(0, -1)],
          ]} />
        </Panel>
      </div>
      <div className="grid g23" style={{ marginTop: 12 }}>
        <Panel title="Twin records · sample of customers in scope" meta={"each row = one " + twinName.slice(0, -1)} np>
          <table className="dtable">
            <thead><tr>
              <th className="m">Twin</th><th>Segment</th><th className="m">90-day balance</th><th className="m">Rate gap</th>
              <th className="m">Logins (30d)</th><th className="m">Tenure</th><th>Status</th>
            </tr></thead>
            <tbody>
              {[
                ["twin_8a3f1c", "Mass-affluent", "$214k", "+55 bps", "9", "142 mo", <Pill k="ok">In scope</Pill>],
                ["twin_4d92e0", "Mass-affluent", "$408k", "+61 bps", "14", "77 mo", <Pill k="ok">In scope</Pill>],
                ["twin_b17a55", "Affluent", "$96k", "+12 bps", "1", "203 mo", <Pill k="warn">Sticky</Pill>],
                ["twin_e6630d", "Mass-affluent", "$321k", "+58 bps", "11", "54 mo", <Pill k="ok">In scope</Pill>],
                ["twin_2f88ab", "Affluent", "$152k", "+49 bps", "6", "118 mo", <Pill k="ok">In scope</Pill>],
              ].map((r, i) => (
                <tr key={i}>
                  <td className="m">{r[0]}</td><td>{r[1]}</td><td className="m">{r[2]}</td>
                  <td className="m">{r[3]}</td><td className="m">{r[4]}</td><td className="m">{r[5]}</td><td>{r[6]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Customer coverage & data quality">
          <div className="kpi k2" style={{ marginBottom: 10 }}>
            <KT v="15.3M" l="Total customers" />
            <KT v={N.inframe} l="In scope" s="impact-eligible" cls="ac" />
          </div>
          <KV rows={[
            ["Leakage scan", "0 post-outcome features"],
            ["Pre-trend match", <Pill k="ok">pass</Pill>],
            ["Placebo window", <Pill k="ok">clean</Pill>],
            ["Baseline forecast", "Variance-reduced"],
          ]} />
        </Panel>
      </div>
      <ActionBar btn="Promote to Model setup" onClick={onNext}>
        Goal registered · customer features fresh · <b>8/8 sources green</b>
      </ActionBar>
    </>
  );
}

export function StageModel({ onNext }) {
  return (
    <>
      <div className="grid g23">
        <Panel title="Model stack" meta="5 champions · 1 challenger" np>
          <table className="dtable">
            <thead><tr><th>Model</th><th className="m">Version</th><th>Method</th><th className="m">How well it performs</th><th>Status</th></tr></thead>
            <tbody>
              {[
                ["Customer eligibility scorer", "v4.2", "Gradient-boosted trees", "Highly discriminative", <Pill k="champion">champion</Pill>],
                ["Personalized-impact estimator", "v2.1", "Causal forest", "94% coverage", <Pill k="champion">champion</Pill>],
                ["Customer-flight risk model", "v1.3", "Survival model", "Strong ranking", <Pill k="champion">champion</Pill>],
                ["Demand-elasticity model", "v3.0", "Instrumented estimator", "Strong identification", <Pill k="champion">champion</Pill>],
                ["Net Interest Income margin", "v5.1", "Internal asset-liability model", "3.0% avg error", <Pill k="mapped">mapped</Pill>],
                ["Personalized-impact estimator", "v2.2", "Doubly-robust learner", "95% coverage", <Pill k="shadow">challenger</Pill>],
              ].map((r, i) => (
                <tr key={i}>
                  <td><b>{r[0]}</b></td><td className="m">{r[1]}</td><td>{r[2]}</td><td className="m">{r[3]}</td><td>{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="What's driving the predictions" meta="Personalized-impact model">
          <Bars rows={[
            ["Competitor rate gap", 34],
            ["Aggregator logins", 21],
            ["Balance volatility", 16],
            ["Customer tenure", 12],
            ["Products held", 9],
            ["Other features", 8],
          ]} col="var(--blue)" />
        </Panel>
      </div>
      <div className="grid g23" style={{ marginTop: 12 }}>
        <Panel title="Causal-identification diagnostics" meta="checks that the model isn't fooling itself">
          <KV rows={[
            ["Instrument strength", <>42.1 <Pill k="ok">{">10"}</Pill></>],
            ["Over-identification test", <>p = 0.34 <Pill k="ok">ok</Pill></>],
            ["Placebo outcome", <>null effect <Pill k="ok">pass</Pill></>],
            ["Negative control", <>pass <Pill k="ok">ok</Pill></>],
            ["Historical back-test", <>within range <Pill k="ok">ok</Pill></>],
            ["Calibration error", "2.1%"],
          ]} />
        </Panel>
        <Panel title="Reliability curve" meta="how predicted vs observed track"><Reliability /></Panel>
      </div>
      <ActionBar btn="Promote to Test &amp; optimize policy" onClick={onNext}>
        Champions calibrated · falsification checks passed · <b>SR 11-7 model risk registered</b>
      </ActionBar>
    </>
  );
}

/* ---------- Forward results renderer (used by What-If) ---------- */
function ForwardResults({ results, isPreview }) {
  if (!results.length) return <div className="empty-sim">No outcomes available for this hypothesis</div>;
  return (
    <>
      <div className="fres-head">
        <span />
        <span className="fres-axis-l">◀ worse &nbsp; today ◇ &nbsp; better ▶</span>
        <span className="fres-vh">expected · likely range</span>
      </div>
      {results.map((r, idx) => {
        const mm = metricMeta(r.metric_id);
        const span = Math.max(Math.abs(r.lo), Math.abs(r.hi), Math.abs(r.point), Math.abs(r.basePt)) * 1.2 || 1;
        const x = (v) => (v / span) * 50 + 50;
        const good = mm.good === "neg" ? r.point < 0 : r.point > 0;
        const col = good ? "#42e08b" : "#ff7a7a";
        const bandLo = Math.min(x(r.lo), x(r.hi));
        const bandHi = Math.max(x(r.lo), x(r.hi));
        const basePos = x(r.basePt);
        return (
          <div className="fres" key={idx}>
            <span className="fres-l">{mm.label}</span>
            <span className="fres-ci">
              <span className="axis" />
              <span className="zero" style={{ left: "50%" }} />
              <span className="baseM" style={{ left: basePos.toFixed(1) + "%" }} />
              <span className="band" style={{ left: bandLo.toFixed(1) + "%", width: (bandHi - bandLo).toFixed(1) + "%", background: hexToRgba(good ? "#42e08b" : "#ff7a7a", 0.32) }} />
              <span className="pt2" style={{ left: x(r.point).toFixed(1) + "%", background: col }} />
            </span>
            <span className="fres-v" style={{ color: col }}>
              {fmtMetric(r.point, r.unit)}
              <span className="fres-ci-t">{fmtMetric(r.lo, r.unit)} – {fmtMetric(r.hi, r.unit)}</span>
            </span>
          </div>
        );
      })}
    </>
  );
}

function prettyConstraintLabel(raw) {
  if (raw.indexOf("complaint_exposure") === 0)
    return "Complaint risk stays within cap";
  if (raw.indexOf("fraud_rate_delta") === 0)
    return "Fraud rate does not get worse";
  if (raw.indexOf("nii_contribution") === 0)
    return "Net Interest Income stays positive";
  return raw;
}

function ConstraintReadout({ SIMX, levers, iterations, cons }) {
  const res = SIMX.runForward(levers, iterations);
  const cks = SIMX.checkConstraints(res, cons);
  if (!cks.length) return null;
  const allPass = cks.every((c) => c.pass);
  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <div className="panel-h">
        <span className="pdot" style={{ background: allPass ? "#42e08b" : "#ff7a7a" }} />
        <span className="pt">Guardrail check at this configuration</span>
        <span className="pm">all must pass to promote</span>
      </div>
      <div className="pbody">
        {cks.map((c, i) => (
          <div className="cono" key={i}>
            <span className={"cono-i " + (c.pass ? "ok" : "no")}>{c.pass ? "✓" : "✕"}</span>
            <span className="cono-k">{prettyConstraintLabel(c.k)}</span>
            <span className="cono-v">{c.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- What-If panel (sliders + live results) ---------- */
function WhatIf({ ctx, SIMX, levers, setLevers, controls, setControls, pushLog }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null); // {cur, target}
  const [results, setResults] = useState(() => SIMX.runForward(levers, controls.iterations));
  const ivRef = useRef(null);

  // Re-derive results when levers/iters change (preview)
  useEffect(() => {
    if (running) return;
    setResults(SIMX.runForward(levers, controls.iterations));
  }, [levers, controls.iterations, SIMX, running]);

  useEffect(() => () => { if (ivRef.current) clearInterval(ivRef.current); }, []);

  const runForwardAnimated = () => {
    setRunning(true);
    const target = controls.iterations;
    let cur = 0;
    pushLog(<><span className="sv">{prettyConsoleTag("sim_engine")}</span> Simulating policy · {target.toLocaleString()} scenarios · {controls.horizon}-day horizon</>);
    ivRef.current = setInterval(() => {
      cur += Math.max(20, Math.floor(target / 22));
      if (cur >= target) cur = target;
      const partial = SIMX.runForward(levers, Math.max(50, cur));
      setResults(partial);
      setProgress({ cur, target });
      if (cur >= target) {
        clearInterval(ivRef.current);
        setRunning(false);
        pushLog(<><span className="sv">{prettyConsoleTag("sim_engine")}</span> <span className="ok">complete</span> · outcomes converged</>);
      }
    }, 70);
  };

  const onLeverChange = (i, v) => {
    setLevers((prev) => prev.map((l, idx) => (idx === i ? { ...l, val: +v } : l)));
  };

  const fwdStatus = running && progress
    ? `Simulating · ${progress.cur.toLocaleString()} / ${progress.target.toLocaleString()} scenarios`
    : (progress && progress.cur === progress.target)
      ? `Simulation complete · ${progress.target.toLocaleString()} scenarios`
      : "Live preview · updates as you adjust settings";

  return (
    <>
      <div className="simgrid">
        <div className="simcol-setup">
          <div className="panel">
            <div className="panel-h"><span className="pdot" /><span className="pt">Policy settings</span><span className="pm">{prettyHypothesisName(ctx.HYP)}</span></div>
            <div className="pbody">
              {levers.map((l, i) => {
                const pct = ((l.val - l.min) / (l.max - l.min)) * 100;
                const changed = l.val !== l.base;
                return (
                  <div className="lvr" key={l.key + i}>
                    <div className="lvr-h">
                      <span className="lvr-l">{prettyLeverLabel(l)}</span>
                      <span className={"lvr-v" + (changed ? " chg" : "")}>
                        {leverDisp(l)}{changed && <span className="lvr-base">was {leverBase(l)}</span>}
                      </span>
                    </div>
                    <input
                      className="lvr-s"
                      type="range"
                      min={l.min} max={l.max} step={l.step}
                      value={l.val}
                      onChange={(e) => onLeverChange(i, e.target.value)}
                      style={{ "--p": pct + "%" }}
                    />
                  </div>
                );
              })}
              <div className="lvr-note">Settings start at the hypothesis's recommended values. Drag to tune; the live preview on the right updates as you go.</div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h"><span className="pdot" /><span className="pt">Simulation settings</span></div>
            <div className="pbody">
              <div className="ctrls">
                <div className="ctrl"><span className="cl">Time horizon</span>
                  <div className="seg">
                    {[30, 90, 180].map((h) => (
                      <button key={h} className={controls.horizon === h ? "on" : ""} onClick={() => setControls((c) => ({ ...c, horizon: h }))}>{h}d</button>
                    ))}
                  </div>
                </div>
                <div className="ctrl"><span className="cl">Number of scenarios</span>
                  <div className="seg">
                    {[200, 1000, 5000].map((n) => (
                      <button key={n} className={controls.iterations === n ? "on" : ""} onClick={() => setControls((c) => ({ ...c, iterations: n }))}>{n >= 1000 ? n / 1000 + "k" : n}</button>
                    ))}
                  </div>
                </div>
                <div className="ctrl"><span className="cl">Model competitor response</span>
                  <div className="seg">
                    <button className={controls.competitorResponse ? "on" : ""} onClick={() => setControls((c) => ({ ...c, competitorResponse: true }))}>on</button>
                    <button className={!controls.competitorResponse ? "on" : ""} onClick={() => setControls((c) => ({ ...c, competitorResponse: false }))}>off</button>
                  </div>
                </div>
              </div>
              <button className="runbtn" disabled={running} onClick={runForwardAnimated}>{running ? "Simulating…" : "▶ Simulate this policy"}</button>
            </div>
          </div>
        </div>
        <div className="simcol-out">
          <div className="panel">
            <div className="panel-h"><span className="pdot" /><span className="pt">Expected outcomes</span><span className="pm">{fwdStatus}</span></div>
            <div className="pbody np"><ForwardResults results={results} /></div>
          </div>
          <ConstraintReadout SIMX={SIMX} levers={levers} iterations={controls.iterations} cons={ctx.SIMcons} />
        </div>
      </div>
    </>
  );
}

const GOAL_LABEL = {
  nii: "maximize Net Interest Income",
  friction: "maximize friction reduction",
  blend: "balanced goal",
};

/* ---------- If-What panel (solver) ---------- */
function IfWhat({ ctx, SIMX, levers, setLevers, goal, setGoal, cons, setCons, setTab, pushLog }) {
  const [solving, setSolving] = useState(false);
  const [trajIdx, setTrajIdx] = useState(0);
  const [sol, setSol] = useState(null);
  const ivRef = useRef(null);
  useEffect(() => () => { if (ivRef.current) clearInterval(ivRef.current); }, []);

  const hasCE = !!ctx.metricOf("complaint_exposure");
  const hasFR = !!ctx.metricOf("fraud_rate_delta");
  const hasNII = !!ctx.metricOf("nii_contribution");

  const runSolve = () => {
    const s = SIMX.solve(levers, goal, cons, 44);
    setSol(s); setTrajIdx(0); setSolving(true);
    pushLog(<><span className="sv">{prettyConsoleTag("optimizer")}</span> searching · {GOAL_LABEL[goal]} · {levers.length} settings</>);
    ivRef.current = setInterval(() => {
      setTrajIdx((i) => {
        const ni = i + 1;
        if (ni >= s.trajectory.length) {
          clearInterval(ivRef.current);
          setSolving(false);
          pushLog(<><span className="sv">{prettyConsoleTag("optimizer")}</span> <span className="ok">complete</span> · optimized policy {s.feasible ? "meets all guardrails" : "best-effort (some guardrails unmet)"}</>);
        }
        return ni;
      });
    }, 55);
  };

  const sendPiToWhatif = () => {
    setLevers(sol.pi.map((l) => ({ ...l })));
    setTab("whatif");
    pushLog(<><span className="sv">{prettyConsoleTag("workbench")}</span> Optimized policy loaded for stress-test</>);
  };

  const goalBtns = [
    ["nii", "Maximize Net Interest Income"],
    ["friction", "Maximize friction reduction"],
    ["blend", "Balanced (60% NII / 40% friction)"],
  ];

  // Trajectory drawing
  const trajSvg = (() => {
    if (!sol) return null;
    const traj = sol.trajectory.slice(0, Math.max(1, trajIdx));
    const vals = sol.trajectory.map((t) => t.val);
    const mn = Math.min.apply(null, vals); const mx = Math.max.apply(null, vals); const rng = (mx - mn) || 1;
    const pts = traj.map((t, k) => {
      const x = 8 + (k / (sol.trajectory.length - 1)) * 304;
      const y = 98 - ((t.val - mn) / rng) * 86;
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    return (
      <svg id="convSvg" viewBox="0 0 320 110" className="chart">
        <line x1="8" y1="98" x2="312" y2="98" stroke="rgba(255,255,255,.1)" />
        <polyline points={pts} fill="none" stroke={ctx.O.col} strokeWidth="1.4" />
        {traj.map((t, k) => {
          const x = 8 + (k / (sol.trajectory.length - 1)) * 304;
          const y = 98 - ((t.val - mn) / rng) * 86;
          return <circle key={k} cx={x.toFixed(1)} cy={y.toFixed(1)} r="1.6" fill={t.feasible ? "#42e08b" : "#ff7a7a"} />;
        })}
        <text x="312" y="12" fill="#5c6577" fontSize="7.5" textAnchor="end">value ↑</text>
      </svg>
    );
  })();

  const showPiStar = sol && !solving && trajIdx >= sol.trajectory.length;
  const cksAtPi = showPiStar ? SIMX.checkConstraints(sol.results, cons) : [];

  return (
    <div className="simgrid">
      <div className="simcol-setup">
        <Panel title="What outcome should TwinX optimize for?">
          <div className="goals">
            {goalBtns.map((g) => (
              <button key={g[0]} className={"goalb" + (goal === g[0] ? " on" : "")} onClick={() => setGoal(g[0])}>{g[1]}</button>
            ))}
          </div>
        </Panel>
        <Panel title="Non-negotiable guardrails" meta="every option must respect these">
          {hasCE && (
            <div className="cset">
              <label className="ck">
                <input type="checkbox" checked={cons.complaintCap != null} onChange={(e) => setCons((c) => ({ ...c, complaintCap: e.target.checked ? 30 : null }))} />
                Complaint risk no worse than
              </label>
              <input className="cnum" type="number" value={cons.complaintCap == null ? 30 : cons.complaintCap} min="0" max="200" onChange={(e) => setCons((c) => ({ ...c, complaintCap: +e.target.value }))} />
            </div>
          )}
          {hasFR && (
            <div className="cset"><label className="ck"><input type="checkbox" checked={!!cons.fraudNotWorse} onChange={(e) => setCons((c) => ({ ...c, fraudNotWorse: e.target.checked }))} /> Fraud rate must not get worse</label></div>
          )}
          {hasNII && (
            <div className="cset"><label className="ck"><input type="checkbox" checked={!!cons.niiPositive} onChange={(e) => setCons((c) => ({ ...c, niiPositive: e.target.checked }))} /> Net Interest Income must stay positive</label></div>
          )}
          <div className="cset"><label className="ck"><input type="checkbox" checked disabled /> Customer behavior is predictable ({prettyDriftState(ctx.CLUS ? ctx.CLUS.drift_state : "").label})</label></div>
        </Panel>
        <Panel title="Settings TwinX can tune" meta={levers.length + " settings"}>
          {levers.map((l, i) => (
            <div className="ss-row" key={i}>
              <span className="ss-l">{prettyLeverLabel(l)}</span>
              <span className="ss-r">[{l.unit === "$" ? "$" + (l.min / 100).toLocaleString() : l.min} … {l.unit === "$" ? "$" + (l.max / 100).toLocaleString() : l.max}{l.unit && l.unit !== "$" ? " " + l.unit : ""}]</span>
            </div>
          ))}
          <button className="runbtn" disabled={solving} onClick={runSolve}>{solving ? "Optimizing…" : "◆ Find the optimized policy"}</button>
        </Panel>
      </div>
      <div className="simcol-out">
        <Panel title="TwinX optimizer" meta={solving ? `step ${trajIdx}/${sol ? sol.trajectory.length : "?"}` : (sol ? "complete" : "ready")} np>
          {!sol && (
            <div className="solve-idle">Pick the outcome to optimize for and the guardrails, then click <b>Find the optimized policy</b>. TwinX will search every combination of policy settings and return the one that delivers the most value while respecting every guardrail.</div>
          )}
          {sol && !showPiStar && (
            <div className="solve-live">
              <div className="conv">{trajSvg}</div>
              <div className="solve-meta">
                step <b>{trajIdx}/{sol.trajectory.length}</b> · current value <b>{sol.trajectory[Math.max(0, trajIdx - 1)] ? fmtObj(sol.trajectory[Math.max(0, trajIdx - 1)].val) : "—"}</b> · {sol.trajectory[Math.max(0, trajIdx - 1)] && sol.trajectory[Math.max(0, trajIdx - 1)].feasible ? <span style={{ color: "#42e08b" }}>guardrails OK</span> : <span style={{ color: "#ff7a7a" }}>guardrails breached</span>}
              </div>
            </div>
          )}
          {showPiStar && (
            <>
              <div className="pis">
                <div className="pis-head">
                  <span className="pis-tag">Optimized policy {sol.feasible ? <span className="feas">all guardrails met</span> : <span className="infeas">best-effort (some guardrails missed)</span>}</span>
                  <span className="pis-obj">value <b>{fmtObj(sol.value)}</b></span>
                </div>
                <div className="pis-levers">
                  {sol.pi.map((l, i) => {
                    const moved = l.val !== l.base;
                    return (
                      <div className="pis-row" key={i}>
                        <span className="pis-l">{prettyLeverLabel(l)}</span>
                        <span className={"pis-v" + (moved ? " moved" : "")}>{leverDisp(l)}</span>
                        <span className="pis-base">{moved ? "was " + leverBase(l) : "unchanged"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="pis-sec">Expected outcomes from optimized policy</div>
              <div className="np"><ForwardResults results={sol.results} /></div>
              <div className="pis-sec">Guardrail check</div>
              {cksAtPi.map((c, i) => (
                <div className="cono" key={i}>
                  <span className={"cono-i " + (c.pass ? "ok" : "no")}>{c.pass ? "✓" : "✕"}</span>
                  <span className="cono-k">{prettyConstraintLabel(c.k)}</span>
                  <span className="cono-v">{c.val}</span>
                </div>
              ))}
              <div className="pis-cta"><button className="sendbtn" onClick={sendPiToWhatif}>Stress-test this optimized policy →</button></div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================================
   SIM STAGE — 7-step guided flow (mirrors the incentives Simulation Studio)
     1. Autopilot           — let TwinX recommend candidate hypotheses
     2. Recent performance  — last M/Q/Y of this customer group (insight only)
     3. Hypotheses          — what TwinX considered for this group + approve
     4. Tune the policy     — adjust the levers (existing WhatIf left column)
     5. Rollout & guardrails — treatment % + hard guardrails
     6. Simulate & see outcomes — run forward + (optional) optimize π*
     7. Verify & promote    — stress-test optimized policy and hand off to Gate
   ========================================================================= */
const SIM_STEPS = [
  { key: "autopilot",  label: "Autopilot",                 hint: "Recommended",            autopilot: true },
  { key: "baseline",   label: "Recent performance",        hint: "Insight" },
  { key: "hyps",       label: "Hypotheses",                hint: "Insight" },
  { key: "levers",     label: "Tune the policy",           hint: "Decision" },
  { key: "rollout",    label: "Rollout & guardrails",      hint: "Decision" },
  { key: "simulate",   label: "Simulate & see outcomes",   hint: "Run" },
  { key: "verify",     label: "Verify & promote",          hint: "Hand-off" },
];

function SimStepStrip({ current, completed, onSelect }) {
  const idx = SIM_STEPS.findIndex((s) => s.key === current);
  return (
    <div className="simstrip">
      {SIM_STEPS.map((s, i) => {
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

/* ---------- StepNav — sticky bottom-of-canvas navigator ------------------
   Always-visible footer with: step counter (left), "Back" (secondary), and
   the contextual "Next →" (primary). Optional secondaryAction lets a step
   surface a second prominent path (e.g. "Skip — I'll tune manually").

   Props:
     stepIndex / stepTotal     — drives the "Step N of 7" counter
     canBack, canNext          — enables/disables the buttons
     onBack, onNext            — handlers
     nextLabel                 — contextual label on the primary action
     hint                      — small grey text explaining what Next will do
                                 (or *why* Next is disabled when canNext=false)
     secondary                 — { label, onClick } for a second prominent path
                                 rendered just before Next, with secondary style.
   ========================================================================= */
function StepNav({ stepIndex, stepTotal, canBack, canNext, onBack, onNext, nextLabel, hint, secondary }) {
  // Enter advances to next, Backspace/Esc goes back — but only when the
  // user isn't typing into an input/textarea/contenteditable.
  useEffect(() => {
    const isEditable = (el) =>
      el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
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
      <div className="stepnav-hint">{hint || (canNext ? "" : "")}</div>
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

/* ---------- Step 1: Autopilot — derives candidate policies from sibling
   hypotheses on the same cluster and ranks them by predicted NII. -------- */
function siblingHypotheses(ctx) {
  if (!ctx.HYP || !ctx.CLUS) return [];
  const all = Object.values(TWINX.hypotheses);
  const same = all.filter((h) => h.cluster_id === ctx.HYP.cluster_id);
  const active = same.find((h) => h.hypothesis_id === ctx.HYP.hypothesis_id);
  const others = same.filter((h) => h.hypothesis_id !== ctx.HYP.hypothesis_id);
  return [active, ...others].filter(Boolean);
}

function StepAutopilot({ ctx, onAdopt, onSkip }) {
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [shown, setShown] = useState(true);
  const candidates = useMemo(() => siblingHypotheses(ctx).slice(0, 4), [ctx]);
  const ranked = useMemo(() => {
    return candidates
      .map((h) => {
        const nii = h.predicted_outcome && h.predicted_outcome.nii_contribution
          ? h.predicted_outcome.nii_contribution / 100 / 1e6 : 0;
        return { h, niiM: nii };
      })
      .sort((a, b) => b.niiM - a.niiM);
  }, [candidates]);

  const run = (q) => {
    if (!q) q = AUTOPILOT_PROMPTS[0];
    setPrompt(q);
    setThinking(true);
    setShown(false);
    setTimeout(() => { setThinking(false); setShown(true); }, 1100);
  };

  return (
    <div className="simstep-body">
      <div className="autopilot-hero">
        <div>
          <div className="ap-tag">AUTOPILOT</div>
          <div className="ap-title">Describe the outcome you want — get a ranked policy recommendation.</div>
          <div className="ap-sub">State a business goal · scenarios run across candidate policies · ranked hypotheses returned for adoption.</div>
        </div>
        <div className="ap-stat">
          <div><b>{ranked.length}</b><span>candidates</span></div>
          <div><b>1.2k</b><span>scenarios</span></div>
          <div><b>6.2s</b><span>compute</span></div>
        </div>
      </div>

      <div className="autopilot-input">
        <input
          type="text"
          placeholder={AUTOPILOT_PROMPTS[0]}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") run(prompt); }}
        />
        <button onClick={() => run(prompt)} disabled={thinking}>{thinking ? "Thinking…" : "Run Autopilot"}</button>
      </div>
      <div className="autopilot-suggestions">
        {AUTOPILOT_PROMPTS.map((p) => (
          <button key={p} className="ap-sugg" onClick={() => run(p)}>{p}</button>
        ))}
      </div>

      {shown && (
        <div className="autopilot-results">
          <div className="ar-head">{ranked.length} hypotheses worth a look · ranked by Net Interest Income impact</div>
          {ranked.map(({ h, niiM }, i) => {
            const isRec = i === 0;
            return (
              <div key={h.hypothesis_id} className={"ap-card" + (isRec ? " rec" : "")}>
                <div className="ap-card-h">
                  {isRec && <span className="ap-rec">★ Recommended</span>}
                  <span className="ap-card-name">{prettyHypothesisName(h)}</span>
                  <span className="ap-card-ref">{formatRef(h.hypothesis_id)}</span>
                </div>
                <div className="ap-card-desc">{prettyHypothesisSentence(h)}</div>
                <div className="ap-card-outcomes">{prettyPredictedOutcome(h.predicted_outcome)}</div>
                <div className="ap-card-cta">
                  <button className="ap-adopt" onClick={() => onAdopt(h)}>Adopt this hypothesis →</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* The Autopilot step has no Back (it's the first step) and a non-
          standard "Next" — there's nothing to advance to without first
          adopting or explicitly skipping. We surface that as a secondary
          footer action so the path forward is never hidden. */}
      <StepNav stepIndex={0} stepTotal={7}
        canBack={false} canNext={false}
        secondary={{ label: "Skip — I'll tune the policy myself →", onClick: onSkip }}
        hint="Adopt the recommended hypothesis (above), or skip and walk through the steps yourself." />
    </div>
  );
}

/* ---------- Step 2: Recent performance — past M/Q/Y of this customer group
   Derives from CC stream (real 6-week champion/challenger data). ---------- */
function StepBaseline({ ctx, adopted, autopilotUsed, onNext, onBack }) {
  const clus = ctx.CLUS;
  const CC = ctx.CC;
  const pop = clus ? clus.population : 0;
  // Synthesize M/Q/Y headlines from the CC stream + cluster size.
  const lastWeek = CC && CC.stream ? CC.stream[CC.stream.length - 1] : null;
  const ctrlRate = lastWeek ? +(lastWeek.control_friction_rate * 100).toFixed(1) : 17;
  const treatRate = lastWeek ? +(lastWeek.treatment_friction_rate * 100).toFixed(1) : 10;
  const monthly = {
    blocked: ctrlRate,
    contact: Math.round(pop * 0.08 * 75),
    complaints: Math.round(pop * 0.008),
  };
  const quarterly = {
    blocked: +(ctrlRate * 0.96).toFixed(1),
    contact: monthly.contact * 3,
    complaints: monthly.complaints * 3,
  };
  const yearly = {
    blocked: +(ctrlRate * 0.93).toFixed(1),
    contact: monthly.contact * 12,
    complaints: monthly.complaints * 12,
  };
  const drift = prettyDriftState(clus ? clus.drift_state : "stable");

  // 6-week sparkline series from CC stream if available.
  const series = useMemo(() => {
    if (CC && CC.stream && CC.stream.length) {
      return CC.stream.map((w) => ({
        wk: w.week,
        treat: +(w.treatment_friction_rate * 100).toFixed(1),
        ctrl: +(w.control_friction_rate * 100).toFixed(1),
        winner: w.stopping_rule_resolution === "winner",
      }));
    }
    return Array.from({ length: 6 }, (_, i) => ({
      wk: i + 1, treat: 10 - i * 0.1, ctrl: 17 - i * 0.05, winner: i >= 2,
    }));
  }, [CC]);
  const firedAt = series.find((w) => w.winner)?.wk;

  return (
    <div className="simstep-body">
      <div className="step-intro">
        <h3>Recent performance · {prettyClusterName(clus)}
          <span className="step-intro-pop">about {pop.toLocaleString()} accounts</span>
        </h3>
        <p>
          {autopilotUsed
            ? <>You adopted <b>{prettyHypothesisName(adopted)}</b>. Before tuning it, here's how this customer group has been performing — so the policy sits on top of real history, not assumptions.</>
            : <>Before you tune a policy for this group, here's how they've been performing — so your decisions sit on top of real history.</>
          }
        </p>
      </div>

      <div className="grid g3">
        <PeriodCard title="Last month"   blocked={monthly.blocked}   contact={monthly.contact}   complaints={monthly.complaints}   drift={drift} />
        <PeriodCard title="Last quarter" blocked={quarterly.blocked} contact={quarterly.contact} complaints={quarterly.complaints} drift={drift} />
        <PeriodCard title="Last year"    blocked={yearly.blocked}    contact={yearly.contact}    complaints={yearly.complaints}    drift={drift} />
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-h">
          <span className="pdot" />
          <span className="pt">How the small live pilot has been performing (last 6 weeks)</span>
          {firedAt && <span className="pm">Hit confidence threshold week {firedAt} · the new policy clearly wins</span>}
        </div>
        <div className="pbody">
          <PilotSparkline series={series} />
          <div className="pilot-legend">
            <span className="pl-treat">■ Customers on the new policy (treatment)</span>
            <span className="pl-ctrl">■ Customers on the current policy (control)</span>
          </div>
          <div className="step-defining">
            <b>Why this group:</b> {prettyClusterDescription(clus)}
          </div>
        </div>
      </div>

      <StepNav stepIndex={1} stepTotal={7} canBack canNext onBack={onBack} onNext={onNext}
        nextLabel="See alternative hypotheses →"
        hint="Pure context — no decisions made here. Press Enter or click Continue when ready." />
    </div>
  );
}

function PeriodCard({ title, blocked, contact, complaints, drift }) {
  return (
    <div className="panel">
      <div className="panel-h"><span className="pdot" /><span className="pt">{title}</span></div>
      <div className="pbody">
        <div className="period-row"><span>Blocked-payment rate</span><b>{blocked}%</b></div>
        <div className="period-row"><span>Contact-center cost</span><b>${(contact / 1e6).toFixed(1)}M</b></div>
        <div className="period-row"><span>Complaints</span><b>{complaints.toLocaleString()}</b></div>
        <div className="period-row"><span>Customer behavior</span><b className={"drift-" + drift.tone}>{drift.label}</b></div>
      </div>
    </div>
  );
}

function PilotSparkline({ series }) {
  const W = 640, H = 110, padL = 32, padR = 16, padT = 12, padB = 22;
  const ys = series.flatMap((d) => [d.treat, d.ctrl]);
  const yMax = Math.max(...ys) * 1.1;
  const yMin = Math.max(0, Math.min(...ys) * 0.85);
  const xs = series.map((_, i) => padL + (i * (W - padL - padR)) / (series.length - 1));
  const yFn = (v) => padT + ((yMax - v) / (yMax - yMin)) * (H - padT - padB);
  const treatPts = series.map((d, i) => `${xs[i]},${yFn(d.treat).toFixed(1)}`).join(" ");
  const ctrlPts  = series.map((d, i) => `${xs[i]},${yFn(d.ctrl).toFixed(1)}`).join(" ");
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: H }}>
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="rgba(255,255,255,.08)" />
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="rgba(255,255,255,.08)" />
      <polyline points={ctrlPts} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.6" strokeDasharray="4 3" />
      <polyline points={treatPts} fill="none" stroke="#42e08b" strokeWidth="2.2" />
      {series.map((d, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={yFn(d.treat)} r="2.6" fill={d.winner ? "#42e08b" : "rgba(66,224,139,.55)"} />
          <circle cx={xs[i]} cy={yFn(d.ctrl)}  r="2.2" fill="rgba(255,255,255,.45)" />
          <text x={xs[i]} y={H - 6} fill="#5c6577" fontSize="9" textAnchor="middle">wk {d.wk}</text>
        </g>
      ))}
      <text x={padL - 6} y={padT + 4} fill="#5c6577" fontSize="9" textAnchor="end">{yMax.toFixed(0)}%</text>
      <text x={padL - 6} y={H - padB} fill="#5c6577" fontSize="9" textAnchor="end">{yMin.toFixed(0)}%</text>
    </svg>
  );
}

/* ---------- Step 3: Hypotheses — active hypothesis + sibling cards
   Approving a sibling biases lever defaults on Step 4. ---------------------- */
function StepHypIntel({ ctx, adopted, autopilotUsed, approved, setApproved, onNext, onBack }) {
  const sibs = useMemo(() => siblingHypotheses(ctx), [ctx]);
  // If user adopted via Autopilot, that's the "current" hypothesis at the top.
  // Otherwise fall back to the URL-bound hypothesis (sibs[0]).
  const activeId = adopted ? adopted.hypothesis_id : sibs[0]?.hypothesis_id;
  const active = sibs.find((h) => h.hypothesis_id === activeId) || sibs[0];
  const others = sibs.filter((h) => h.hypothesis_id !== activeId);
  const toggle = (id) =>
    setApproved((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);

  return (
    <div className="simstep-body">
      <div className="step-intro">
        <h3>Hypotheses for {prettyClusterName(ctx.CLUS)}</h3>
        <p>
          {autopilotUsed
            ? <>You have <b>{prettyHypothesisName(active)}</b> in flight from Autopilot. TwinX considered <b>{others.length} alternative {others.length === 1 ? "approach" : "approaches"}</b> too — approve any to combine into your final policy.</>
            : <>TwinX generated {sibs.length} hypotheses for this group. The first is the recommended starting point. Approve any others to combine them into your policy.</>
          }
        </p>
      </div>

      {active && (
        <div className="hyp-card active">
          <div className="hyp-h">
            <span className="hyp-active">▶ Currently selected</span>
            <span className="hyp-name">{prettyHypothesisName(active)}</span>
            {active.lifecycle === "cc_winner" && <span className="hyp-star">★ {prettyLifecycle("cc_winner").label}</span>}
            <span className="hyp-ref">{formatRef(active.hypothesis_id)}</span>
          </div>
          <div className="hyp-desc">{prettyHypothesisSentence(active)}</div>
          <div className="hyp-out">{prettyPredictedOutcome(active.predicted_outcome)}</div>
        </div>
      )}

      {others.map((h) => {
        const isApproved = approved.includes(h.hypothesis_id);
        return (
          <div key={h.hypothesis_id} className={"hyp-card" + (isApproved ? " approved" : "")}>
            <div className="hyp-h">
              <span className="hyp-name">{prettyHypothesisName(h)}</span>
              <span className="hyp-lifecycle">{prettyLifecycle(h.lifecycle).label}</span>
              <span className="hyp-ref">{formatRef(h.hypothesis_id)}</span>
            </div>
            <div className="hyp-desc">{prettyHypothesisSentence(h)}</div>
            <div className="hyp-out">{prettyPredictedOutcome(h.predicted_outcome)}</div>
            <div className="hyp-cta">
              <button className={"hyp-btn approve" + (isApproved ? " on" : "")} onClick={() => toggle(h.hypothesis_id)}>
                {isApproved ? "✓ Combined into policy" : "Combine into policy"}
              </button>
              {isApproved && <button className="hyp-btn skip" onClick={() => toggle(h.hypothesis_id)}>Remove</button>}
            </div>
          </div>
        );
      })}

      <StepNav stepIndex={2} stepTotal={7} canBack canNext onBack={onBack} onNext={onNext}
        nextLabel={approved.length > 0
          ? `Tune the policy (${approved.length} combined) →`
          : "Tune the policy →"}
        hint={approved.length > 0
          ? `${approved.length} alternative ${approved.length === 1 ? "hypothesis" : "hypotheses"} will be folded into your final policy.`
          : "You can combine alternative hypotheses with the Combine buttons, or move on to tune the current one."} />
    </div>
  );
}

/* ---------- Step 5: Rollout & guardrails ---------- */
function StepRollout({ dosage, setDosage, ctx, adopted, cons, setCons, onNext, onBack }) {
  const pop = ctx.CLUS ? ctx.CLUS.population : 0;
  const reached = Math.round(pop * (dosage / 100));
  const control = pop - reached;
  return (
    <div className="simstep-body">
      <div className="step-intro">
        <h3>Rollout &amp; guardrails</h3>
        <p>
          You've tuned <b>{prettyHypothesisName(adopted)}</b>. Now decide who in <b>{prettyClusterName(ctx.CLUS)}</b> sees it, and confirm the risk limits TwinX must never break.
        </p>
      </div>

      <div className="grid g2">
        <div className="panel">
          <div className="panel-h"><span className="pdot" /><span className="pt">Rollout scope</span></div>
          <div className="pbody">
            <div className="dosage-h">
              <span>Customers reached</span>
              <b>{dosage}%</b>
            </div>
            <input
              className="lvr-s" type="range" min="20" max="100" step="5"
              value={dosage} onChange={(e) => setDosage(+e.target.value)}
              style={{ "--p": ((dosage - 20) / 80) * 100 + "%" }}
            />
            <div className="dosage-meta">
              <div><span>Reached:</span> <b>{reached.toLocaleString()}</b> of {pop.toLocaleString()} accounts</div>
              <div><span>Held out (control):</span> <b>{control.toLocaleString()}</b></div>
              <div><span>Trial length:</span> <b>6 weeks</b></div>
            </div>
            <div className="dosage-note">We'll declare a winner when the result is well outside chance (95% confidence).</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-h"><span className="pdot" /><span className="pt">Non-negotiable guardrails</span></div>
          <div className="pbody">
            <div className="cset">
              <label className="ck">
                <input type="checkbox" checked={cons.complaintCap != null}
                  onChange={(e) => setCons((c) => ({ ...c, complaintCap: e.target.checked ? 30 : null }))} />
                Complaint risk no worse than
              </label>
              <input className="cnum" type="number" value={cons.complaintCap == null ? 30 : cons.complaintCap}
                min="0" max="200" onChange={(e) => setCons((c) => ({ ...c, complaintCap: +e.target.value }))} />
            </div>
            <div className="cset"><label className="ck">
              <input type="checkbox" checked={!!cons.fraudNotWorse}
                onChange={(e) => setCons((c) => ({ ...c, fraudNotWorse: e.target.checked }))} />
              Fraud rate must not get worse
            </label></div>
            <div className="cset"><label className="ck">
              <input type="checkbox" checked={!!cons.niiPositive}
                onChange={(e) => setCons((c) => ({ ...c, niiPositive: e.target.checked }))} />
              Net Interest Income must stay positive
            </label></div>
            <div className="cset"><label className="ck">
              <input type="checkbox" checked disabled />
              Customer behavior must stay predictable ({prettyDriftState(ctx.CLUS && ctx.CLUS.drift_state).label})
            </label></div>
            <div className="dosage-note">TwinX checks these limits on every simulation. Any policy that breaks one is rejected.</div>
          </div>
        </div>
      </div>

      <StepNav stepIndex={4} stepTotal={7} canBack canNext onBack={onBack} onNext={onNext}
        nextLabel="Simulate the policy →"
        hint={`Will roll out to ${reached.toLocaleString()} accounts (${dosage}%) under the guardrails on the right.`} />
    </div>
  );
}

/* ---------- PolicySummary — the running "what you've built so far" strip ----
   Shown on every sim step (except Autopilot). Updates as the user advances.
   Each pill stays in one of three states: empty (—), in-progress (working
   value, neutral), or locked (a step downstream of where the user is now). */
function PolicySummary({ adoptedHyp, autopilotUsed, approvedSiblings, levers, dosage, cons, lastSim, currentStep }) {
  const idx = SIM_STEPS.findIndex((s) => s.key === currentStep);
  // Which sim step is each fact "earned" at? Earlier = locked-in by now.
  const earnedAt = { hyp: 0, combine: 2, levers: 3, rollout: 4, guards: 4, sim: 5 };
  const isLocked = (factIdx) => idx > factIdx;

  const tuned = levers.filter((l) => l.val !== l.base).length;
  const total = levers.length;
  const guardrailsSet =
    (cons.complaintCap != null ? 1 : 0) +
    (cons.fraudNotWorse ? 1 : 0) +
    (cons.niiPositive ? 1 : 0) +
    1; // drift constraint is always on
  const niiR = lastSim && lastSim.find((r) => r.metric_id === "nii_contribution");
  const fricR = lastSim && lastSim.find((r) => r.metric_id === "friction_events_delta");

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
          adoptedHyp ? prettyHypothesisName(adoptedHyp) : "—",
          adoptedHyp ? (isLocked(earnedAt.hyp) ? "locked" : "set") : "empty"
        )}
        {pill("combine", "Combined ideas",
          approvedSiblings.length > 0 ? `+${approvedSiblings.length}` : "none",
          isLocked(earnedAt.combine) ? "locked" : (approvedSiblings.length > 0 ? "set" : "empty")
        )}
        {pill("levers", "Settings",
          tuned === 0 ? `${total} at default` : `${tuned} of ${total} tuned`,
          isLocked(earnedAt.levers) ? "locked" : (tuned > 0 ? "set" : "empty")
        )}
        {pill("rollout", "Rollout",
          `${dosage}%`,
          isLocked(earnedAt.rollout) ? "locked" : "set"
        )}
        {pill("guards", "Guardrails",
          `${guardrailsSet} of 4 on`,
          isLocked(earnedAt.guards) ? "locked" : "set"
        )}
        {pill("sim", "Expected outcome",
          niiR
            ? `${prettyMetricValue("nii_contribution", niiR.point, "usd_cents")} NII · ${fricR ? Math.abs(Math.round(fricR.point)).toLocaleString() + " fewer blocks" : "—"}`
            : "not simulated yet",
          niiR ? (isLocked(earnedAt.sim) ? "locked" : "set") : "empty"
        )}
      </div>
    </div>
  );
}

/* ---------- StageSim — orchestrates the 7-step shell ---------- */
export function StageSim({ ctx, pushLog, onPromote, preAdopted = false }) {
  const SIMX = useMemo(() => buildSIMX(ctx.HYP, ctx.SIM, ctx.metricOf), [ctx.HYP, ctx.SIM, ctx.metricOf]);
  // `preAdopted` = the caller (e.g. SimulateWorkspace from the new shell) is
  // telling us the user has already picked a hypothesis upstream (in Hub).
  // Skip Autopilot + Recent performance + Hypotheses steps and start on
  // Tune the policy. The skipped steps are still navigable via chip clicks.
  const initialStep = preAdopted ? "levers" : "autopilot";
  const initialCompleted = preAdopted ? { autopilot: true, baseline: true, hyps: true } : {};
  const [step, setStep] = useState(initialStep);
  const [completed, setCompleted] = useState(initialCompleted);
  const [levers, setLevers] = useState(() => SIMX.leverSpec());
  const [controls, setControls] = useState({ horizon: 90, iterations: 1000, coverageOn: true, competitorResponse: true });
  const [goal, setGoal] = useState("blend");
  const [cons, setCons] = useState({ complaintCap: 30, fraudNotWorse: true, niiPositive: true });
  const [dosage, setDosage] = useState(95);
  const [approvedSiblings, setApprovedSiblings] = useState([]);
  const [simSubTab, setSimSubTab] = useState("whatif");
  // Carry-forward state: which hypothesis the user adopted (or skipped to default),
  // and the most recent simulation results. Both feed the PolicySummary strip
  // so each step shows what the running policy looks like.
  // If preAdopted, mark ctx.HYP as the adopted hypothesis from the start.
  const [adoptedHyp, setAdoptedHyp] = useState(preAdopted ? ctx.HYP : null);
  const [lastSim, setLastSim] = useState(null);
  const [promoting, setPromoting] = useState(false);
  ctx.SIMcons = cons;

  if (!ctx.HYP) return <div className="empty-sim">No hypothesis selected for this customer group.</div>;

  const activeHyp = adoptedHyp || ctx.HYP;

  const completeAndAdvance = (currentKey, nextKey) => {
    setCompleted((c) => ({ ...c, [currentKey]: true }));
    setStep(nextKey);
    const cs = document.querySelector(".pipeline-page .canvas");
    if (cs) cs.scrollTop = 0;
  };

  const indexOf = (k) => SIM_STEPS.findIndex((s) => s.key === k);
  const goNext = () => {
    const i = indexOf(step);
    if (i < SIM_STEPS.length - 1) completeAndAdvance(step, SIM_STEPS[i + 1].key);
  };
  const goBack = () => {
    const i = indexOf(step);
    if (i > 0) setStep(SIM_STEPS[i - 1].key);
  };

  const adoptHypothesis = (h) => {
    // Re-derive levers for the adopted hypothesis (uses its parameters as base).
    const newSIMX = buildSIMX(h, TWINX.simulations[h.hypothesis_id], (mid) => {
      const sim = TWINX.simulations[h.hypothesis_id];
      return sim ? sim.metrics.find((m) => m.metric_id === mid) || null : null;
    });
    setLevers(newSIMX.leverSpec());
    setAdoptedHyp(h);
    pushLog(<><span className="sv">Autopilot</span> adopted <span className="ok">{prettyHypothesisName(h)}</span> · walking through the journey</>);
    // Walk through the insight steps (2, 3) before reaching Tune — so the user
    // sees WHY this hypothesis fits this customer group, not just the levers.
    completeAndAdvance("autopilot", "baseline");
  };
  const skipAutopilot = () => {
    pushLog(<><span className="sv">Autopilot</span> skipped · walking through guided steps</>);
    completeAndAdvance("autopilot", "baseline");
  };

  // Promote: log it, show a brief "handing off" moment, then advance outer stage.
  const handlePromote = () => {
    if (promoting) return;
    setPromoting(true);
    pushLog(<><span className="ok">Policy promoted</span> to Approval review · stage 4 of 7</>);
    setTimeout(() => { setPromoting(false); onPromote(); }, 600);
  };

  // Run a forward sim "best effort" preview to populate the PolicySummary's
  // last-simulation badge whenever the user is past the Simulate step.
  const summaryProps = {
    adoptedHyp: activeHyp,
    autopilotUsed: adoptedHyp != null,
    approvedSiblings,
    levers,
    dosage,
    cons,
    lastSim,
    currentStep: step,
  };

  // Capture latest sim into lastSim so the summary picks it up.
  // Cheap: runForward is already memo-fast on the existing engine.
  const refreshLastSim = () => {
    try { setLastSim(SIMX.runForward(levers, controls.iterations)); }
    catch { /* engine unavailable; leave previous lastSim */ }
  };

  return (
    <div className="simshell">
      <SimStepStrip current={step} completed={completed} onSelect={setStep} />

      {/* Persistent "what you've built so far" strip. Hidden on Autopilot
          because nothing is built yet — appears the moment the user enters
          the guided walkthrough. */}
      {step !== "autopilot" && <PolicySummary {...summaryProps} />}

      {step === "autopilot" && (
        <StepAutopilot ctx={ctx} onAdopt={adoptHypothesis} onSkip={skipAutopilot} />
      )}

      {step === "baseline" && (
        <StepBaseline ctx={ctx} adopted={activeHyp} autopilotUsed={!!adoptedHyp}
          onNext={goNext} onBack={goBack} />
      )}

      {step === "hyps" && (
        <StepHypIntel ctx={ctx} adopted={activeHyp} autopilotUsed={!!adoptedHyp}
          approved={approvedSiblings} setApproved={setApprovedSiblings}
          onNext={goNext} onBack={goBack} />
      )}

      {step === "levers" && (
        <div className="simstep-body">
          <div className="step-intro">
            <h3>Tune the policy</h3>
            <p>
              The settings below come from <b>{prettyHypothesisName(activeHyp)}</b>{approvedSiblings.length > 0 && <>, blended with {approvedSiblings.length} other {approvedSiblings.length === 1 ? "hypothesis" : "hypotheses"} you approved</>}. Adjust them and the expected outcomes on the right update live.
            </p>
          </div>
          <WhatIf ctx={ctx} SIMX={SIMX} levers={levers} setLevers={setLevers}
            controls={controls} setControls={setControls} pushLog={pushLog} />
          <StepNav stepIndex={3} stepTotal={7} canBack canNext
            onBack={goBack} onNext={() => { refreshLastSim(); goNext(); }}
            nextLabel="Set rollout →"
            hint="Adjust the policy settings on the left. Preview on the right updates live." />
        </div>
      )}

      {step === "rollout" && (
        <StepRollout dosage={dosage} setDosage={setDosage} ctx={ctx} adopted={activeHyp}
          cons={cons} setCons={setCons} onNext={goNext} onBack={goBack} />
      )}

      {step === "simulate" && (
        <div className="simstep-body">
          <div className="step-intro">
            <h3>Simulate &amp; see outcomes</h3>
            <p>
              <b>{prettyHypothesisName(activeHyp)}</b> tuned · rollout {dosage}% · ready to test. Run a full simulation across {controls.iterations.toLocaleString()} scenarios, or ask TwinX to find an even better policy that respects every guardrail.
            </p>
          </div>
          <div className="simsub-tabs">
            <button className={"simsub" + (simSubTab === "whatif" ? " on" : "")} onClick={() => setSimSubTab("whatif")}>
              <b>Simulate this policy</b><span>1,000 scenarios · forward run</span>
            </button>
            <button className={"simsub" + (simSubTab === "ifwhat" ? " on" : "")} onClick={() => setSimSubTab("ifwhat")}>
              <b>Find a better policy</b><span>TwinX optimizer · respects guardrails</span>
            </button>
          </div>
          {simSubTab === "whatif"
            ? <WhatIf ctx={ctx} SIMX={SIMX} levers={levers} setLevers={setLevers}
                controls={controls} setControls={setControls} pushLog={pushLog} />
            : <IfWhat ctx={ctx} SIMX={SIMX} levers={levers} setLevers={setLevers}
                goal={goal} setGoal={setGoal} cons={cons} setCons={setCons}
                setTab={setSimSubTab} pushLog={pushLog} />
          }
          <StepNav stepIndex={5} stepTotal={7} canBack canNext onBack={goBack}
            onNext={() => { refreshLastSim(); goNext(); }}
            nextLabel="Verify the policy →"
            hint="Run a simulation (left tab) or have TwinX find a better one (right tab)." />
        </div>
      )}

      {step === "verify" && (
        <div className="simstep-body">
          <div className="step-intro">
            <h3>Verify &amp; promote</h3>
            <p>
              Final check before sending to <b>Approval review</b>. The policy below — <b>{prettyHypothesisName(activeHyp)}</b>{approvedSiblings.length > 0 && <> + {approvedSiblings.length}</>}, tuned and stress-tested — is what TwinX will hand off.
            </p>
          </div>
          <div className="panel">
            <div className="panel-h"><span className="pdot" /><span className="pt">Final policy settings</span><span className="pm">{prettyHypothesisName(activeHyp)}</span></div>
            <div className="pbody">
              {levers.map((l, i) => {
                const moved = l.val !== l.base;
                return (
                  <div key={l.key + i} className="pis-row">
                    <span className="pis-l">{prettyLeverLabel(l)}</span>
                    <span className={"pis-v" + (moved ? " moved" : "")}>{leverDisp(l)}</span>
                    <span className="pis-base">{moved ? "was " + leverBase(l) : "unchanged"}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="panel" style={{ marginTop: 12 }}>
            <div className="panel-h"><span className="pdot" /><span className="pt">Expected outcomes after stress-test</span></div>
            <div className="pbody np"><ForwardResults results={SIMX.runForward(levers, controls.iterations)} /></div>
          </div>
          <ConstraintReadout SIMX={SIMX} levers={levers} iterations={controls.iterations} cons={cons} />
          <ActionBar btn={promoting ? "Handing off…" : "Promote to Approval review"} onClick={handlePromote}>
            <b>Policy ready</b> — TwinX has simulated, optimized and stress-tested. Approval review evaluates downside risk and the live-pilot design.
          </ActionBar>
          <StepNav stepIndex={6} stepTotal={7} canBack canNext={false} onBack={goBack}
            hint={promoting
              ? "Handing off to Approval review…"
              : "Use the green Promote button above when you're ready to hand off."} />
        </div>
      )}
    </div>
  );
}

/* ---------- Decision Gate ---------- */
export function StageGate({ ctx, onNext }) {
  const N = ctx.N;
  return (
    <>
      <div className="grid g2">
        <Panel title="How the optimized policy is expected to perform" meta="across 1,000 simulated scenarios">
          <div className="kpi k4">
            <KT v={N.pbeat + "%"} l="Chance this beats the next-best alternative" cls="gr" />
            <KT v={"+" + fmtUSD(N.lam)} l="Expected Net Interest Income" s={"Range " + fmtUSD(N.lamLo) + "–" + fmtUSD(N.lamHi)} cls="ac" />
            <KT v={"+" + fmtUSD(N.cvar)} l="Worst-case downside (5%)" s="still positive" cls="gr" />
            <KT v={N.breach + "%"} l="Chance NII misses guardrail" cls="rd" />
          </div>
        </Panel>
        <Panel title="Routing decision" meta={formatRef("decision-tx-0047")}>
          <KV rows={[
            ["Verdict", <span style={{ color: "var(--amber)", fontWeight: 700 }}>REQUIRES LIVE PILOT</span>],
            ["Why", "High-stakes call · simulation alone isn't enough"],
            ["Best-conservative policy", ctx.treatment],
            ["Can ship from simulation?", "No — pilot required"],
          ]} />
        </Panel>
      </div>
      <div className="grid g2" style={{ marginTop: 12 }}>
        <Panel title="What the live pilot needs to pin down" meta="ranked by impact on the decision">
          <Bars rows={N.sobol.map((s) => [humanizeFactor(s[0]), s[1]])} col="var(--acc)" />
        </Panel>
        <Panel title="Pre-registered pilot design" meta={"locked · " + formatRef("prereg-0047")}>
          <div className="yaml">
            <span className="yk">Primary outcome</span>: <span className="yv">Balance retained at 90 days</span><br />
            <span className="yk">Test unit</span>: <span className="yv">Branch / geography cluster</span><br />
            <span className="yk">Design</span>: <span className="yv">Two-stage saturation rollout</span><br />
            <span className="yk">Smallest effect detectable</span>: <span className="yv">{N.mde}</span><br />
            <span className="yk">Statistical confidence</span>: <span className="yv">{N.power}%</span><br />
            <span className="yk">Customer segments</span>: <span className="yv">Grouped by likely-impact tier</span><br />
            <span className="yk">Test method</span>: <span className="yv">Always-valid (can stop early)</span><br />
            <span className="yk">Stopping rule</span>: <span className="yv">Strong evidence reached OR day 21</span>
          </div>
        </Panel>
      </div>
      <ActionBar btn="Submit to Compliance review" onClick={onNext}>
        Routed to live pilot · pre-registration <b>locked</b> · analysis plan frozen
      </ActionBar>
    </>
  );
}

function humanizeFactor(k) {
  const m = {
    novelty_threshold: "Novel-counterparty threshold",
    efe_language_match: "Fraud-language match",
    beneficiary_history: "Recipient history",
    amount_band: "Amount tier",
    residual: "Other factors",
    transition_signal: "Life-event signal strength",
    primacy_window: "Primacy capture window",
    rm_capacity: "Relationship-manager capacity",
    competitor_response: "Competitor response",
    pattern_match_strength: "Pattern-match strength",
    recurrence_window: "Look-back window",
    channel_capacity: "Channel capacity",
  };
  return m[k] || k.replace(/_/g, " ");
}

/* ---------- Governance Gate (animated) ---------- */
const GATE_THRESHOLDS = { complaint_ci_upper_max: 30, fraud_ci_upper_max: 0, nii_ci_lower_min: 0, winner_consecutive_weeks: 2 };
function evalGateMatrix(ctx) {
  const { metricOf, CC, CLUS, TX } = ctx;
  const rows = [];
  const ce = metricOf("complaint_exposure"); const fr = metricOf("fraud_rate_delta"); const nii = metricOf("nii_contribution");
  let winStreak = 0, maxStreak = 0;
  if (CC && CC.stream) {
    CC.stream.forEach((w) => {
      if (w.stopping_rule_resolution === "winner") { winStreak++; maxStreak = Math.max(maxStreak, winStreak); }
      else winStreak = 0;
    });
  }
  rows.push({ k: "Winner declared", rule: "≥ " + GATE_THRESHOLDS.winner_consecutive_weeks + " consecutive winner weeks", applies: !!CC, pass: maxStreak >= GATE_THRESHOLDS.winner_consecutive_weeks, val: CC ? maxStreak + " wks @ week " + CC.fires_at_week : "no CC stream" });
  rows.push({ k: "Complaint exposure bounded", rule: "ci_upper ≤ " + GATE_THRESHOLDS.complaint_ci_upper_max, applies: !!ce, pass: !ce || ce.ci_upper <= GATE_THRESHOLDS.complaint_ci_upper_max, val: ce ? ce.ci_upper.toFixed(1) : "n/a" });
  rows.push({ k: "Fraud not worsened", rule: "ci_upper ≤ 0 (where applicable)", applies: !!fr, pass: !fr || fr.ci_upper <= GATE_THRESHOLDS.fraud_ci_upper_max, val: fr ? fr.ci_upper.toFixed(2) + " bps" : "n/a" });
  rows.push({ k: "NII positive at lower CI", rule: "ci_lower > 0 (where applicable)", applies: !!nii, pass: !nii || nii.ci_lower > GATE_THRESHOLDS.nii_ci_lower_min, val: nii ? fmtUSDcents(nii.ci_lower) : "n/a" });
  const sh = TX.manifest;
  const shaOk = !!(sh.sha256 && sh.clusters_sha256 && sh.hypotheses_sha256 && sh.simulations_sha256 && sh.cc_sha256);
  rows.push({ k: "Build integrity", rule: "all sha256 present & matched", applies: true, pass: shaOk, val: shaOk ? "5/5 hashes" : "missing" });
  rows.push({ k: "Drift-state acceptable", rule: 'cluster drift_state == "stable"', applies: !!CLUS, pass: !CLUS || CLUS.drift_state === "stable", val: CLUS ? CLUS.drift_state : "n/a" });
  const applicable = rows.filter((r) => r.applies);
  const allPass = applicable.every((r) => r.pass);
  const failing = applicable.filter((r) => !r.pass);
  return { rows, pass: allPass, failing };
}

function prettyGateCondition(k) {
  const m = {
    "Winner declared": "Winner declared in pilot",
    "Complaint exposure bounded": "Complaint risk within cap",
    "Fraud not worsened": "Fraud rate has not gotten worse",
    "NII positive at lower CI": "Net Interest Income still positive in worst case",
    "Build integrity": "Build integrity (all evidence signed)",
    "Drift-state acceptable": "Customer behavior is predictable",
  };
  return m[k] || k;
}
function prettyGateRule(r) {
  return r
    .replace(/ci_upper/gi, "worst case")
    .replace(/ci_lower/gi, "best case")
    .replace(/cluster drift_state == "stable"/i, 'must be "stable"')
    .replace(/all sha256 present & matched/i, "all signatures present and matched")
    .replace(/≥ /g, "at least ");
}

export function StageGov({ ctx, pushLog, onNext }) {
  const N = ctx.N;
  const gate = useMemo(() => evalGateMatrix(ctx), [ctx]);
  // animated gate sequence state
  const [step, setStep] = useState(0); // 0..4
  const timers = useRef([]);
  useEffect(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    const t = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    if (gate.pass) {
      t(500, () => { setStep(1); pushLog(<><span className="er">{prettyConsoleTag("fair_audit")} FAIL</span> protected group B at 71% of standard (threshold 80%)</>); });
      t(1500, () => { setStep(2); pushLog(<><span className="er">{prettyConsoleTag("governance")}</span> Policy halted · remediation in progress</>); });
      t(2500, () => { setStep(3); pushLog(<><span className="wn">{prettyConsoleTag("remediation")}</span> Drop {N.flagFeat} from features · rebalance the model</>); });
      t(3400, () => { setStep(4); pushLog(<><span className="ok">{prettyConsoleTag("gate")} PASSED</span> 6/6 fair-lending conditions met · SR 11-7 approved</>); });
    } else {
      const f = gate.failing.map((x) => prettyGateCondition(x.k) + " (" + x.val + ")").join("; ");
      t(500, () => { setStep(1); pushLog(<><span className="er">{prettyConsoleTag("gate")} FAILED</span> {f}</>); });
      t(1500, () => { setStep(2); pushLog(<><span className="er">{prettyConsoleTag("governance")}</span> Policy terminated · evidence does not meet fair-lending bar</>); });
      t(2500, () => { setStep(3); pushLog(<><span className="er">{prettyConsoleTag("remediation")}</span> None available — defect is in the evidence, not a feature</>); });
      t(3300, () => { setStep(4); pushLog(<><span className="er">{prettyConsoleTag("gate")}</span> Still red — returned to hypothesis backlog</>); });
    }
    return () => timers.current.forEach((t) => clearTimeout(t));
  }, [gate, pushLog, N.flagFeat]);

  // gate-seq cell content/state
  const v1 = gate.pass
    ? { st: "Fairness audit (1st)", v: step >= 1 ? "Ratio 0.71" : "Scanning…", cls: step >= 1 ? "halt" : "" }
    : { st: "Fairness audit (1st)", v: step >= 1 ? gate.failing.length + " conditions failed" : "Scanning…", cls: step >= 1 ? "halt" : "" };
  const h = gate.pass
    ? { st: "Verdict", v: step >= 2 ? "Policy halted" : "—", cls: step >= 2 ? "halt" : "" }
    : { st: "Verdict", v: step >= 2 ? "Policy terminated" : "—", cls: step >= 2 ? "halt" : "" };
  const r = gate.pass
    ? { st: "Remediation", v: step >= 3 ? "Drop proxy feature" : "—", cls: "", style: step >= 3 ? { borderColor: "rgba(91,157,255,.4)" } : undefined }
    : { st: "Remediation", v: step >= 3 ? "None available" : "—", cls: step >= 3 ? "halt" : "" };
  const v2 = gate.pass
    ? { st: "Re-audit (2nd)", v: step >= 4 ? "All conditions pass" : "—", cls: step >= 4 ? "clear" : "" }
    : { st: "Re-audit (2nd)", v: step >= 4 ? "Blocked" : "—", cls: step >= 4 ? "halt" : "" };

  return (
    <>
      <Panel title="Fair-lending review · 6 conditions" meta={gate.pass ? <span style={{ color: "var(--green)" }}>ALL PASS</span> : <span style={{ color: "var(--red)" }}>{gate.failing.length} FAILING</span>} np>
        <table className="dtable">
          <thead><tr><th>Condition</th><th>Rule</th><th className="m">Value</th><th>Status</th></tr></thead>
          <tbody>
            {gate.rows.map((row, i) => {
              const st = !row.applies ? <Pill k="warn">n/a</Pill> : (row.pass ? <Pill k="ok">pass</Pill> : <Pill k="flag">fail</Pill>);
              const style = row.applies && !row.pass ? { background: "rgba(255,122,122,.07)" } : undefined;
              return (
                <tr key={i} style={style}>
                  <td><b>{prettyGateCondition(row.k)}</b></td><td>{prettyGateRule(row.rule)}</td><td className="m">{row.val}</td><td>{st}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <div className="gateseq" style={{ marginTop: 12 }}>
        <div className={"gs " + v1.cls}><div className="gs-st">{v1.st}</div><div className="gs-v">{v1.v}</div></div>
        <div className="gsa">→</div>
        <div className={"gs " + h.cls}><div className="gs-st">{h.st}</div><div className="gs-v">{h.v}</div></div>
        <div className="gsa">→</div>
        <div className={"gs " + r.cls} style={r.style}><div className="gs-st">{r.st}</div><div className="gs-v">{r.v}</div></div>
        <div className="gsa">→</div>
        <div className={"gs " + v2.cls}><div className="gs-st">{v2.st}</div><div className="gs-v">{v2.v}</div></div>
      </div>
      <div className="grid g23" style={{ marginTop: 12 }}>
        <Panel title="Disparate-impact audit" meta={"4/5ths rule · " + formatRef("fair-audit-0047")} np>
          <table className="dtable">
            <thead><tr><th>Customer group</th><th className="m">Selection rate</th><th className="m">Ratio</th><th>1st audit</th><th>2nd audit</th></tr></thead>
            <tbody>
              {[
                ["Reference group", "31.2%", "1.00", <Pill k="ok">ref</Pill>, <Pill k="ok">ref</Pill>],
                ["Protected group A", "29.0%", "0.93", <Pill k="ok">pass</Pill>, <Pill k="ok">pass</Pill>],
                ["Protected group B", "22.1%", "0.71", <Pill k="flag">flag</Pill>, <Pill k="ok">0.86</Pill>],
                ["Age 62 and over", "27.5%", "0.88", <Pill k="ok">pass</Pill>, <Pill k="ok">pass</Pill>],
              ].map((row, i) => (
                <tr key={i}>
                  <td>{row[0]}</td><td className="m">{row[1]}</td><td className="m">{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Model risk record · SR 11-7" meta={formatRef("mr-2026-0047")}>
          <KV rows={[
            ["Risk tier", "Tier 1"],
            ["1st audit status", <span style={{ color: "var(--red)", fontWeight: 700 }}>BLOCKED</span>],
            ["Root cause", "Feature acts as proxy for protected class"],
            ["Remediation", "Drop feature · rebalance model"],
            ["Explainability", "Attached"],
            ["Approver", "Model Risk Management · ticket MRM-3318"],
            ["Final status", <span style={{ color: "var(--green)", fontWeight: 700 }}>APPROVED</span>],
          ]} />
        </Panel>
      </div>
      <div className="grid" style={{ marginTop: 12 }}>
        <Panel title="Remediation log">
          <div className="con-body" style={{ padding: 0, fontSize: 10 }}>
            <div className="logline"><span className="ts">[1st]</span> <span className="er">FAIL</span> protected group B at ratio 0.71 (threshold 0.80)</div>
            <div className="logline"><span className="wn">Drop</span> proxy feature from model</div>
            <div className="logline"><span className="sv">TwinX</span> re-fit targeting policy · 1.2s</div>
            <div className="logline"><span className="sv">Re-audit</span> all customer groups</div>
            <div className="logline"><span className="ts">[2nd]</span> <span className="ok">PASS</span> minimum ratio 0.86 (above 0.80)</div>
          </div>
        </Panel>
      </div>
      {step >= 2 && gate.pass && step < 4 && (
        <ActionBar hard>
          <b>Policy halted</b> — fair-lending flag on protected group B (ratio 0.71). A +{fmtUSD(N.lam)} policy is stopped until fixed.
        </ActionBar>
      )}
      {step >= 4 && gate.pass && (
        <ActionBar btn="Deploy live pilot" onClick={onNext}>
          <b>Cleared after remediation</b> · all 6 fair-lending conditions pass · SR 11-7 sign-off recorded.
        </ActionBar>
      )}
      {step >= 2 && !gate.pass && (
        <ActionBar hard>
          <b>Policy terminated</b> — {gate.failing.length} fair-lending condition(s) failed. This hypothesis cannot proceed regardless of expected value.
        </ActionBar>
      )}
    </>
  );
}

/* ---------- Live Pilot ---------- */
export function StageRct({ ctx, pushLog, onNext }) {
  const N = ctx.N;
  const target = N.treatR;
  const [animH, setAnimH] = useState(0);
  const [animN, setAnimN] = useState(0);
  const ivRef = useRef(null);
  const tRef = useRef(null);
  useEffect(() => {
    tRef.current = setTimeout(() => {
      setAnimH(Math.round((88 * target) / 100));
      let c = 0;
      ivRef.current = setInterval(() => {
        c += target / 28;
        if (c >= target) { c = target; clearInterval(ivRef.current); }
        setAnimN(c);
      }, 45);
      pushLog(<><span className="sv">{prettyConsoleTag("exp-2026-0047")}</span> Day 11 readout · treatment group at {target.toFixed(1)}%</>);
    }, 250);
    return () => { clearTimeout(tRef.current); clearInterval(ivRef.current); };
  }, [target, pushLog]);

  return (
    <>
      <div className="grid g23">
        <Panel title="Pilot groups · live results" meta={"randomized · " + N.clusters + " branch clusters"} np>
          <table className="dtable">
            <thead><tr>
              <th>Group</th><th className="m">Customers</th><th className="m">Share</th>
              <th className="m">{ctx.T.obj === "ret" ? "Retention" : "Conversion"}</th>
              <th className="m">Lift</th><th className="m">95% range</th>
            </tr></thead>
            <tbody>
              <tr>
                <td><b>Current policy (control)</b></td><td className="m">{N.n}</td><td className="m">50%</td>
                <td className="m">{N.controlR.toFixed(1)}%</td><td className="m">—</td><td className="m">—</td>
              </tr>
              <tr className="hl">
                <td><b>New policy (treatment)</b></td><td className="m">{N.n}</td><td className="m">50%</td>
                <td className="m"><b>{N.treatR.toFixed(1)}%</b></td>
                <td className="m"><b>+{N.liftPE} pp</b></td>
                <td className="m">[{(N.liftPE - 3.4).toFixed(1)}, {(N.liftPE + 3.4).toFixed(1)}]</td>
              </tr>
              <tr>
                <td>Saturation check</td><td className="m">—</td><td className="m">—</td>
                <td className="m">—</td><td className="m">spillover +1.2 pp</td><td className="m">—</td>
              </tr>
            </tbody>
          </table>
        </Panel>
        <Panel title="Guardrails — live monitoring" meta="updated daily">
          <div className="kpi k2" style={{ gap: 8 }}>
            <KT v="−1.1 bps" l="NII impact" s="within guardrail" cls="gr" />
            <KT v="0.86" l="Fairness ratio" s="above 0.80 threshold" cls="gr" />
            <KT v="+0.2%" l="Complaint rate" s="within guardrail" cls="gr" />
            <KT v="1.2 pp" l="Spillover" s="estimated" cls="ac" />
          </div>
        </Panel>
      </div>
      <div className="grid g23" style={{ marginTop: 12 }}>
        <Panel title="Live readout" meta={<><span className="ld" /> day 11 of 21</>}>
          <RctViz N={N} animatedHeight={animH} animatedNum={animN} />
          <div style={{ textAlign: "center", fontSize: 10, color: "var(--ink-3)" }} className="mono">
            lift <b style={{ color: "#42e08b" }}>+{N.liftPE} pp</b> · evidence strength 24× · all customers (intent-to-treat) · among those who actually used the policy: +{N.late} pp
          </div>
        </Panel>
        <Panel title="Evidence trajectory · always-valid test" meta="can stop early when evidence is strong"><SeqChart /></Panel>
      </div>
      <ActionBar btn="Promote to Measure results" onClick={onNext}>
        Stopping rule hit (evidence 24× threshold) · guardrails &amp; fairness intact
      </ActionBar>
    </>
  );
}

/* ---------- Measure & Learn ---------- */
export function StageLearn({ ctx, onNext }) {
  const N = ctx.N;
  return (
    <>
      <div className="grid g23">
        <Panel title="What the pilot actually proved" meta={formatRef("measure-0047")} np>
          <table className="dtable">
            <thead><tr><th>Measure</th><th className="m">Value</th><th className="m">95% range</th><th>Method</th></tr></thead>
            <tbody>
              {[
                [<b>Everyone offered the policy</b>, "+" + N.liftPE + " pp", "[" + (N.liftPE - 3.4).toFixed(1) + ", " + (N.liftPE + 3.4).toFixed(1) + "]", "Regression (variance-reduced)"],
                [<><b>Customers who actually used it</b></>, "+" + N.late + " pp", "[" + (N.late - 4).toFixed(1) + ", " + (N.late + 4).toFixed(1) + "]", "Two-stage estimator"],
                [<>Winner's-curse correction</>, "+" + N.shrunk + " pp", "—", "Empirical Bayes"],
                [<>Historical cross-check</>, "+" + (N.liftPE - 1.1).toFixed(1) + " pp", "—", "Holdout comparison"],
              ].map((row, i) => (
                <tr key={i}>
                  <td>{row[0]}</td><td className="m">{row[1]}</td><td className="m">{row[2]}</td><td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="How TwinX's prediction held up" meta="pilot result vs simulation">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div><CalibChart /></div>
            <div style={{ flex: 1 }}>
              <Gauge pct={72} lab={<>Gap = {N.fidelity} pp</>} val={"+" + N.fidGain} />
              <div style={{ fontSize: 9.5, color: "var(--ink-3)", marginTop: 8 }} className="mono">
                Beliefs updated → personalized-impact model upgraded to <span style={{ color: "var(--green)" }}>v2.2</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
      <div className="grid g23" style={{ marginTop: 12 }}>
        <Panel title="Realistic-rollout corrections" meta="adjusts for selection & competitor reaction">
          <div style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 6 }} className="mono">
            Headline lift: +{N.liftPE} pp → <span style={{ color: "var(--ink)" }}>+{N.shrunk} pp</span> after correction
          </div>
          <GeBars N={N} />
          <div style={{ fontSize: 9.5, color: "var(--ink-3)", marginTop: 4 }}>Pilot estimate → realistic-rollout estimate (accounts for competitor response and saturation)</div>
        </Panel>
        <Panel title="Rollout decision" meta={formatRef("roll-0047")}>
          <KV rows={[
            ["Decision", <span style={{ color: "var(--green)", fontWeight: 700 }}>SCALE</span>],
            ["Expected value at scale", "+" + fmtUSD(N.geLam)],
            ["Rollout scope", N.clusters + " regions → national, phased"],
            ["Business owner", "Consumer Deposits"],
            ["Effective from", "Next cycle"],
            ["Write-back", "Model registry + twin records"],
          ]} />
        </Panel>
      </div>
      <ActionBar btn="Close loop · learn from this run" onClick={onNext}>
        Scaled at <b>+{fmtUSD(N.geLam)}</b> after realistic-rollout adjustments · learnings written back to the twins
      </ActionBar>
    </>
  );
}

/* ============================================================================
   MAIN PAGE
   ========================================================================= */
const STAGES = [
  { loop: "prep",  dur: "42s",        thru: "",            gate: false, hard: false, running: false },
  { loop: "model", dur: "3m 18s",     thru: "",            gate: false, hard: false, running: false },
  { loop: "sim",   dur: "in progress", thru: "",           gate: false, hard: false, running: true  },
  { loop: "gate",  dur: "6s",         thru: "",            gate: true,  hard: false, running: false },
  { loop: "gov",   dur: "audit",      thru: "",            gate: true,  hard: true,  running: false },
  { loop: "rct",   dur: "day 11 / 21", thru: "live",       gate: false, hard: false, running: true  },
  { loop: "learn", dur: "28s",        thru: "",            gate: false, hard: false, running: false },
].map((s) => ({ ...s, name: prettyStageName(s.loop), cap: prettyStageCap(s.loop) }));

export default function Pipeline() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const THEME = params.get("theme") || "gig";
  const MODE = params.get("mode") || "internal";
  const HID = params.get("h") || "H-2026-04-12";
  const stageParam = parseInt(params.get("stage") || "1", 10);

  const ctx = useMemo(() => deriveContext(HID, THEME), [HID, THEME]);
  const [active, setActive] = useState(() => Math.min(STAGES.length - 1, Math.max(0, (isNaN(stageParam) ? 1 : stageParam) - 1)));

  // run id (stable per mount)
  const RID = useMemo(() => "run-" + Math.random().toString(16).slice(2, 8), []);

  // Body-bg lock + accent vars on document root (with cleanup)
  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevOverflow = document.body.style.overflow;
    document.body.style.background = "var(--bg-0)";
    document.body.style.overflow = "hidden";
    const root = document.documentElement;
    const prevAcc = root.style.getPropertyValue("--acc");
    const prevAccSoft = root.style.getPropertyValue("--acc-soft");
    root.style.setProperty("--acc", ctx.ACC);
    root.style.setProperty("--acc-soft", hexToRgba(ctx.ACC, 0.13));
    return () => {
      document.body.style.background = prevBg;
      document.body.style.overflow = prevOverflow;
      if (prevAcc) root.style.setProperty("--acc", prevAcc); else root.style.removeProperty("--acc");
      if (prevAccSoft) root.style.setProperty("--acc-soft", prevAccSoft); else root.style.removeProperty("--acc-soft");
    };
  }, [ctx.ACC]);

  // run log
  const [logs, setLogs] = useState([]);
  const pushLog = useCallback((html) => {
    setLogs((prev) => {
      const next = [{ ts: fmtTs(), node: html, id: Math.random().toString(36).slice(2) }, ...prev];
      return next.slice(0, 5);
    });
  }, []);

  // status bar motion
  const [proc, setProc] = useState(247000);
  const [rate, setRate] = useState(61000);
  const GENLOG = useMemo(() => [
    <><span className="sv">{prettyConsoleTag("feature_store")}</span> refreshed</>,
    <><span className="sv">{prettyConsoleTag("cate_drifter")}</span> scored in-scope customers</>,
    <><span className="sv">{prettyConsoleTag("rate_board")}</span> updated · <span className="ok">+0.55%</span></>,
    <><span className="sv">{prettyConsoleTag("sim_engine")}</span> simulation checkpoint saved</>,
    <><span className="sv">{prettyConsoleTag("guardrail")}</span> NII impact within band <span className="ok">ok</span></>,
    <><span className="sv">{prettyConsoleTag("aggregator_scan")}</span> ingested login events</>,
    <><span className="sv">{prettyConsoleTag("registry")}</span> champion models healthy</>,
    <><span className="sv">{prettyConsoleTag("ach_monitor")}</span> outbound transfer signals processed</>,
  ], []);

  useEffect(() => {
    // initial burst of log lines
    for (let i = 0; i < 4; i++) {
      setTimeout(() => pushLog(GENLOG[Math.floor(Math.random() * GENLOG.length)]), i * 150);
    }
    const iv = setInterval(() => {
      setProc((p) => p + Math.floor(Math.random() * 8000 + 3000));
      setRate(58000 + Math.floor(Math.random() * 8000));
      if (Math.random() < 0.85) pushLog(GENLOG[Math.floor(Math.random() * GENLOG.length)]);
    }, 1300);
    return () => clearInterval(iv);
  }, [GENLOG, pushLog]);

  // open stage log
  useEffect(() => {
    const s = STAGES[active];
    pushLog(<><span className="sv">{s.name}</span> stage opened</>);
  }, [active, pushLog]);

  const next = useCallback(() => {
    if (active < STAGES.length - 1) setActive((a) => a + 1);
    // Final stage's "Close loop" returns to the Decision Cockpit — the
    // user's starting point. Closing the loop literally: from sense to
    // measure and back to sense for the next cycle.
    else navigate("/cockpit");
  }, [active, navigate]);

  const refreshStage = useCallback(() => {
    pushLog(<><span className="sv">{prettyConsoleTag("ui")}</span> manual refresh</>);
    setActive((a) => a); // no-op re-render trigger
  }, [pushLog]);

  const railStatus = (i) => (i < active ? "done" : i === active ? "run" : "queued");
  const s = STAGES[active];
  const whStatusCls = s.hard ? "hard" : s.running ? "run" : "done";
  const whStatusTxt = s.hard ? "HARD GATE" : s.running ? "RUNNING" : "COMPLETED";

  // Render current stage
  const stageBody = (() => {
    const twinName = ctx.CLUS ? ctx.CLUS.semantic_name.split(" · ")[0].toLowerCase() + " twins" : "entity twins";
    switch (active) {
      case 0: return <StageData N={ctx.N} twinName={twinName} onNext={next} />;
      case 1: return <StageModel onNext={next} />;
      case 2: return <StageSim ctx={ctx} pushLog={pushLog} onPromote={next} />;
      case 3: return <StageGate ctx={ctx} onNext={next} />;
      case 4: return <StageGov ctx={ctx} pushLog={pushLog} onNext={next} />;
      case 5: return <StageRct ctx={ctx} pushLog={pushLog} onNext={next} />;
      case 6: return <StageLearn ctx={ctx} onNext={next} />;
      default: return null;
    }
  })();

  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.scrollTop = 0;
  }, [active]);

  return (
    <PageShell>
      <div className="pipeline-page">
      <div className="app">
        <div className="appbar appbar-crumb">
          {/* Breadcrumb only — Logo + env/region/run chips + ThemeToggle live
              in GlobalTopBar above. */}
          <div className="ab-crumb">
            <a onClick={() => navigate("/")}>Hypothesis Hub</a>
            <span className="sep">/</span>
            <a onClick={() => navigate(`/theme?id=${encodeURIComponent(THEME)}&mode=${encodeURIComponent(MODE)}`)}>Theme</a>
            <span className="sep">/</span>
            <span className="cur">Pipeline</span>
            <span className="sep">/</span>
            <span className="cur">{prettyHypothesisName(ctx.HYP)}</span>
          </div>
          <div className="ab-sp" />
          <span className="ab-chip"><span className="k">run</span> <b>{RID}</b></span>
          <span className="ab-run"><span className="ld" style={{ background: "var(--run)", boxShadow: "0 0 7px var(--run)" }} />RUNNING</span>
        </div>

        <div className="subbar">
          <span className="sb-badge" style={{ color: ctx.ACC, background: hexToRgba(ctx.ACC, 0.13) }}>{prettyHypothesisName(ctx.HYP)}</span>
          <span className="sb-claim">{prettyHypothesisSentence(ctx.HYP)}</span>
          <span className="sb-sp" />
          <span className="sb-chip"><span className="v gr">+{fmtUSD(ctx.N.lam)}</span><span className="l">Expected NII impact</span></span>
          <span className="sb-chip"><span className="v ac" style={{ color: ctx.ACC }}>{fmtUSD(ctx.T.valueM)}</span><span className="l">{ctx.T.vq}</span></span>
          <span className="sb-chip"><span className="v">{ctx.T.conf}%</span><span className="l">Model confidence</span></span>
        </div>

        <div className="outerribbon">
          {STAGES.map((sg, i) => {
            const st = railStatus(i);
            const cls = "outerchip"
              + (i === active ? " active" : "")
              + (st === "done" ? " done" : "")
              + (st === "queued" ? " queued" : "")
              + (sg.hard ? " hard" : "");
            const node = st === "done" ? "✓" : i + 1;
            return (
              <button key={i} className={cls} onClick={() => setActive(i)} title={sg.cap}>
                <span className="outerchip-n">{node}</span>
                <span className="outerchip-l">
                  <span className="outerchip-t">{sg.name}</span>
                  <span className="outerchip-c">{st === "queued" ? "Queued" : st === "done" ? "Done" : sg.dur}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="body body-full">
          <div className="work">
            <div className="workh">
              <span className="wh-n">{pad2(active + 1)}</span>
              <div>
                <div className="wh-title">{s.name}</div>
                <div className="wh-cap">{s.cap}</div>
              </div>
              <span className={"wh-status " + whStatusCls}>{whStatusTxt}</span>
              <span className="wh-sp" />
              <span className="wh-meta">
                <span>Stage <b>{active + 1} / 7</b></span>
                <span>{formatRef(RID)}</span>
              </span>
              <span className="wh-act" onClick={refreshStage}>↻ refresh</span>
            </div>
            <div className="canvas" ref={canvasRef}>
              {stageBody}
            </div>
            <div className="console">
              <div className="con-h"><span className="ct">Activity log</span><span className="cstat">streaming · {formatRef(RID)}</span></div>
              <div className="con-body">
                {logs.map((l) => (
                  <div className="logline" key={l.id}>
                    <span className="ts">{l.ts}</span> {l.node}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="statusbar">
          <span><b>Governance</b> active</span>
          <span>Throughput <b>{rate.toLocaleString()}</b> records/sec</span>
          <span>Processed <b>{proc.toLocaleString()}</b></span>
          <span className="sp" />
          <span>Stage {active + 1} of 7 · {s.name}</span>
          <span>Owner <b>kbhattacharya</b></span>
        </div>
      </div>
      </div>
    </PageShell>
  );
}
