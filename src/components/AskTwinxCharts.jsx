/* ============================================================================
   AskTwinxCharts — the in-answer visual palette for Ask TwinX.

   Every chart renders from the LIVE page facts (never from model output — the
   model only emits a [[chart:KIND]] directive choosing WHICH visual). Kinds:
     • a metric key (netValueM, conversionPct, …) → per-policy comparison bars
     • "scorecard" → all metrics × all policies grid with per-row mini-bars
     • "tradeoff"  → value-vs-volume scatter with the efficient-frontier line
     • "funnel"    → cohort → treatment → converted funnel
     • "kpis"      → this run's key outcomes as stat tiles (What-If single config)
   Each returns null when the facts can't support it, so a stray directive is
   simply dropped rather than rendered wrong.
   ========================================================================= */

export const CHART_METRICS = {
  netValueM:           { label: "Incremental relationship value",   fmt: (v) => `+$${v}M` },
  fundedConversionPct: { label: "Funded conversion", fmt: (v) => `${v}%` },
  fundedBalancesM:     { label: "Funded balances",   fmt: (v) => `$${v}M` },
  flightReductionPp:   { label: "Leakage reduction", fmt: (v) => `${v}pp` },
  incrementalAumM:     { label: "Incremental AUM",   fmt: (v) => `+$${v}M` },
  newRelationships:    { label: "New relationships", fmt: (v) => `+${v}` },
  conversionPct:       { label: "Conversion",        fmt: (v) => `${v}%` },
  feeRevenueK:         { label: "Fee revenue",       fmt: (v) => `+$${v}K` },
};

const shortName = (n) => (n || "").split(/[\s—-]/)[0];
const num = (v) => Number(v);
const policyRows = (facts, metric) => (facts?.policies || [])
  .map((p) => ({ name: shortName(p.name), rank: p.rank, value: num(p[metric]) }))
  .filter((r) => Number.isFinite(r.value));

/* 1 ─ Per-policy comparison bars for one metric. */
function MetricBars({ facts, metric }) {
  const m = CHART_METRICS[metric];
  if (!m) return null;
  const rows = policyRows(facts, metric);
  if (rows.length < 2) return null;
  const max = Math.max(...rows.map((r) => Math.abs(r.value))) || 1;
  return (
    <div className="tc-chart">
      <div className="tc-chart-h">{m.label} · by policy</div>
      {rows.map((r, i) => (
        <div key={i} className={"tc-chart-row" + (r.rank === 1 ? " rec" : "")}>
          <span className="tc-chart-name">{r.name}{r.rank === 1 ? " ★" : ""}</span>
          <span className="tc-chart-track"><span className="tc-chart-fill" style={{ width: `${Math.max(4, (Math.abs(r.value) / max) * 100)}%` }} /></span>
          <span className="tc-chart-val">{m.fmt(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* 2 ─ Scorecard: every metric across every policy, winner highlighted. */
function Scorecard({ facts }) {
  const policies = facts?.policies;
  if (!Array.isArray(policies) || policies.length < 2) return null;
  const metrics = Object.keys(CHART_METRICS).filter((k) => policies.some((p) => Number.isFinite(num(p[k]))));
  if (!metrics.length) return null;
  return (
    <div className="tc-chart">
      <div className="tc-chart-h">Scorecard · all metrics</div>
      <div className="tc-sc">
        <div className="tc-sc-row tc-sc-head">
          <span className="tc-sc-lab" />
          {policies.map((p, i) => <span key={i} className={"tc-sc-pol" + (p.rank === 1 ? " rec" : "")}>{shortName(p.name)}{p.rank === 1 ? " ★" : ""}</span>)}
        </div>
        {metrics.map((mk) => {
          const m = CHART_METRICS[mk];
          const vals = policies.map((p) => num(p[mk]));
          const max = Math.max(...vals.map((v) => Math.abs(v) || 0)) || 1;
          const best = Math.max(...vals.filter(Number.isFinite));
          return (
            <div key={mk} className="tc-sc-row">
              <span className="tc-sc-lab">{m.label}</span>
              {policies.map((p, i) => {
                const v = num(p[mk]);
                if (!Number.isFinite(v)) return <span key={i} className="tc-sc-cell" />;
                return (
                  <span key={i} className={"tc-sc-cell" + (v === best ? " win" : "")}>
                    <span className="tc-sc-bar" style={{ width: `${Math.max(6, (Math.abs(v) / max) * 100)}%` }} />
                    <span className="tc-sc-v">{m.fmt(v)}</span>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 3 ─ Trade-off scatter: value (y) vs volume (x) with the frontier line. */
function Tradeoff({ facts }) {
  const policies = facts?.policies;
  if (!Array.isArray(policies) || policies.length < 2) return null;
  const yKey = Number.isFinite(num(policies[0].netValueM)) ? "netValueM" : "incrementalAumM";
  const xKey = Number.isFinite(num(policies[0].fundedConversionPct)) ? "fundedConversionPct"
    : Number.isFinite(num(policies[0].newRelationships)) ? "newRelationships" : "conversionPct";
  const ym = CHART_METRICS[yKey], xm = CHART_METRICS[xKey];
  const pts = policies
    .map((p) => ({ name: shortName(p.name), rank: p.rank, x: num(p[xKey]), y: num(p[yKey]) }))
    .filter((q) => Number.isFinite(q.x) && Number.isFinite(q.y));
  if (pts.length < 2) return null;
  const W = 280, H = 156, pad = 30;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (v) => pad + (x1 === x0 ? 0.5 : (v - x0) / (x1 - x0)) * (W - pad - 14);
  const Y = (v) => H - pad - (y1 === y0 ? 0.5 : (v - y0) / (y1 - y0)) * (H - pad - 18);
  const front = [...pts].sort((a, b) => a.x - b.x);
  return (
    <div className="tc-chart">
      <div className="tc-chart-h">Trade-off · {ym.label} vs {xm.label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="tc-scatter" preserveAspectRatio="xMidYMid meet">
        <line x1={pad} y1={H - pad} x2={W - 8} y2={H - pad} className="tc-ax-l" />
        <line x1={pad} y1={10} x2={pad} y2={H - pad} className="tc-ax-l" />
        <polyline points={front.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")} className="tc-front" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={X(p.x)} cy={Y(p.y)} r={p.rank === 1 ? 5 : 4} className={"tc-dot" + (p.rank === 1 ? " rec" : "")} />
            <text x={X(p.x)} y={Y(p.y) - 9} className="tc-dot-lab" textAnchor="middle">{p.name}</text>
          </g>
        ))}
        <text x={pad + (W - pad) / 2} y={H - 5} className="tc-ax-t" textAnchor="middle">{xm.label} →</text>
        <text x={9} y={16} className="tc-ax-t">↑ {ym.label}</text>
      </svg>
    </div>
  );
}

/* 4 ─ Cohort funnel: eligible → in-treatment → converted. */
function Funnel({ facts }) {
  const c = facts?.kpis || facts?.cohort || {};
  const rec = facts?.policies?.[0];
  const eligible = num(c.eligibleN);
  const treated = num(c.treatmentN);
  const convPct = num(c.fundedConversionPct ?? c.conversionPct ?? rec?.fundedConversionPct ?? rec?.conversionPct);
  if (!Number.isFinite(eligible) || !Number.isFinite(treated)) return null;
  const converted = Number.isFinite(convPct) ? Math.round((treated * convPct) / 100) : null;
  const stages = [
    { l: "Eligible", v: eligible },
    { l: "In treatment", v: treated },
    converted != null ? { l: "Converted", v: converted } : null,
  ].filter(Boolean);
  const max = stages[0].v || 1;
  return (
    <div className="tc-chart">
      <div className="tc-chart-h">Cohort funnel</div>
      {stages.map((s, i) => (
        <div key={i} className="tc-fn-row">
          <span className="tc-fn-lab">{s.l}</span>
          <span className="tc-fn-track"><span className="tc-fn-fill" style={{ width: `${Math.max(5, (s.v / max) * 100)}%` }} /></span>
          <span className="tc-fn-v">{s.v.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* 5 ─ KPI tiles for a single configuration (What-If results). */
function KpiTiles({ facts }) {
  const kp = facts?.kpis;
  if (!kp || typeof kp !== "object") return null;
  const order = ["netValueM", "incrementalAumM", "newRelationships", "fundedConversionPct", "conversionPct", "fundedBalancesM", "feeRevenueK", "flightReductionPp"];
  const tiles = order.filter((k) => CHART_METRICS[k] && Number.isFinite(num(kp[k]))).map((k) => ({ m: CHART_METRICS[k], v: num(kp[k]) }));
  if (!tiles.length) return null;
  return (
    <div className="tc-chart">
      <div className="tc-chart-h">This run · key outcomes</div>
      <div className="tc-tiles">
        {tiles.map((t, i) => (
          <div key={i} className="tc-tile">
            <span className="tc-tile-v">{t.m.fmt(t.v)}</span>
            <span className="tc-tile-l">{t.m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Dispatcher — picks the visual by directive kind. */
export function AskChart({ facts, kind }) {
  if (CHART_METRICS[kind]) return <MetricBars facts={facts} metric={kind} />;
  if (kind === "scorecard") return <Scorecard facts={facts} />;
  if (kind === "tradeoff") return <Tradeoff facts={facts} />;
  if (kind === "funnel") return <Funnel facts={facts} />;
  if (kind === "kpis") return <KpiTiles facts={facts} />;
  return null;
}
