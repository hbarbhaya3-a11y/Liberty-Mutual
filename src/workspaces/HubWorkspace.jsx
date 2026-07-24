/* ============================================================================
   HubWorkspace — Hypothesis Hub.

   The Decision Cockpit already shows themes; this page is the cross-theme
   hypothesis browser. All hypotheses TwinX has formed across every customer
   group are listed in a single sortable, filterable grid. Clicking a card
   sets the hypothesis in global state and opens it in Simulation Studio.

   Filters mirror the incentives-app pattern:
     - Lifecycle pill (proposed / simulated / cc_winner)
     - Theme pill (any of the 8 customer groups)
     - Direction (winner candidates / fraud / friction / NII upside)
     - Sort (NII contribution ↓, novelty ↓, lifecycle stage)

   Entry points to a hypothesis:
     1) Click a card here → loads into Simulation Studio
     2) "Create new hypothesis" → opens Simulation Studio's blank flow
   ========================================================================= */
import { useMemo, useState } from "react";
import TWINX from "@/data/bundle";
import { useAppShell } from "@/state/AppShell";
import {
  prettyHypothesisName, prettyHypothesisSentence, prettyLifecycle,
  prettyClusterName, prettyPredictedOutcome, formatRef,
} from "@/data/pretty";

const LIFECYCLE_FILTERS = [
  { id: "all",        label: "All" },
  { id: "cc_winner",  label: "Champions" },
  { id: "simulated",  label: "Simulated" },
  { id: "proposed",   label: "Proposed" },
];

const KIND_BUCKETS = {
  ceiling_lift_on_pattern_match:     { label: "Movement lift",       tone: "blue" },
  tighten_novel_counterparty:        { label: "Fraud tighten",       tone: "red" },
  coordinated_transition_response:   { label: "Life-event response", tone: "green" },
  time_of_day_modifier:              { label: "Risk window",         tone: "amber" },
  amount_band_policy:                { label: "Rate-band policy",    tone: "purple" },
  rail_specific_policy:              { label: "Rail streamline",     tone: "blue" },
};

function listHypotheses() {
  return Object.values(TWINX.hypotheses).map((h) => {
    const cluster = TWINX.clusters[h.cluster_id];
    const themeEntry = Object.entries(TWINX.themeMap).find(([, m]) => m.cluster === h.cluster_id);
    const themeId = themeEntry ? themeEntry[0] : null;
    const nii = (h.predicted_outcome && h.predicted_outcome.nii_contribution) || 0;
    const kind = h.intervention && h.intervention.kind;
    return {
      id: h.hypothesis_id,
      themeId,
      cluster,
      clusterName: cluster ? prettyClusterName(cluster) : h.cluster_id,
      lifecycle: h.lifecycle,
      highlighted: !!h.highlighted,
      name: prettyHypothesisName(h),
      sentence: prettyHypothesisSentence(h),
      outcome: prettyPredictedOutcome(h.predicted_outcome),
      niiM: nii / 100 / 1e6,
      kind,
      kindMeta: KIND_BUCKETS[kind] || { label: kind || "—", tone: "neutral" },
      raw: h,
    };
  });
}

export default function HubWorkspace() {
  const { selectHypothesis, selectTheme, navigate: nav, pushAgentEvent } = useAppShell();
  const all = useMemo(() => listHypotheses(), []);
  const [lifecycle, setLifecycle] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [sortKey, setSortKey] = useState("nii");

  const themeOptions = useMemo(() => {
    const seen = new Set();
    const list = [{ id: "all", label: "All themes" }];
    all.forEach((h) => {
      if (h.themeId && !seen.has(h.themeId)) {
        seen.add(h.themeId);
        list.push({ id: h.themeId, label: h.clusterName });
      }
    });
    return list;
  }, [all]);

  const visible = useMemo(() => {
    let rows = all.slice();
    if (lifecycle !== "all") rows = rows.filter((h) => h.lifecycle === lifecycle);
    if (themeFilter !== "all") rows = rows.filter((h) => h.themeId === themeFilter);
    if (sortKey === "nii") rows.sort((a, b) => b.niiM - a.niiM);
    else if (sortKey === "lifecycle") {
      const order = { cc_winner: 0, simulated: 1, proposed: 2 };
      rows.sort((a, b) => (order[a.lifecycle] ?? 9) - (order[b.lifecycle] ?? 9));
    } else if (sortKey === "champion") {
      rows.sort((a, b) => Number(b.highlighted) - Number(a.highlighted));
    }
    return rows;
  }, [all, lifecycle, themeFilter, sortKey]);

  const totals = useMemo(() => {
    const totalNII = all.reduce((s, h) => s + Math.max(0, h.niiM), 0);
    const champions = all.filter((h) => h.lifecycle === "cc_winner").length;
    const proposed = all.filter((h) => h.lifecycle === "proposed").length;
    const simulated = all.filter((h) => h.lifecycle === "simulated").length;
    return { totalNII, champions, proposed, simulated };
  }, [all]);

  const openInStudio = (h) => {
    selectHypothesis(h.id);
    if (h.themeId) selectTheme(h.themeId);
    pushAgentEvent({ kind: "good", src: "Hub", text: `Hypothesis adopted · ${h.name}` });
    nav("simulate");
  };

  const createNew = () => {
    // Clear any selection so SimulateWorkspace lands on its blank flow.
    selectHypothesis(null);
    pushAgentEvent({ kind: "info", src: "Hub", text: "Starting new hypothesis from blank" });
    nav("simulate");
  };

  return (
    <div className="hub-ws">
      {/* ---------- HEADER ---------- */}
      <div className="hub-pulse">
        <div className="hub-pulse-l">
          <div className="hub-pulse-tag">
            <span className="hub-pulse-dot" />
            HYPOTHESIS HUB · ALL THEMES
          </div>
          <div className="hub-pulse-title">{all.length} active hypotheses</div>
          <div className="hub-pulse-sub">
            All hypotheses across {themeOptions.length - 1} customer segments.
            {" "}<b>{totals.champions}</b> promoted · <b>{totals.simulated}</b> simulated · <b>{totals.proposed}</b> proposed.
            Click any card to open it.
          </div>
        </div>
        <div className="hub-pulse-r">
          <button className="hh-new-btn" onClick={createNew} title="Create a new hypothesis">
            <span className="hh-new-glyph">+</span>
            <span className="hh-new-text">
              <span className="hh-new-lead">Create new hypothesis</span>
              <span className="hh-new-sub">Start from a blank form</span>
            </span>
          </button>
        </div>
      </div>

      {/* ---------- HEADLINE KPI ROW ---------- */}
      <div className="hub-kpis">
        <div className="hub-kpi">
          <div className="hub-kpi-k">Hypotheses</div>
          <div className="hub-kpi-v">{all.length}</div>
          <div className="hub-kpi-s">Across {themeOptions.length - 1} themes</div>
        </div>
        <div className="hub-kpi">
          <div className="hub-kpi-k">Champions</div>
          <div className="hub-kpi-v">{totals.champions}</div>
          <div className="hub-kpi-s">Won their challenger trial</div>
        </div>
        <div className="hub-kpi">
          <div className="hub-kpi-k">Simulated</div>
          <div className="hub-kpi-v">{totals.simulated}</div>
          <div className="hub-kpi-s">Ready for live pilot</div>
        </div>
        <div className="hub-kpi">
          <div className="hub-kpi-k">Proposed</div>
          <div className="hub-kpi-v">{totals.proposed}</div>
          <div className="hub-kpi-s">Pending simulation</div>
        </div>
        <div className="hub-kpi hub-kpi-accent">
          <div className="hub-kpi-k">NII at stake</div>
          <div className="hub-kpi-v">+${totals.totalNII.toFixed(1)}M</div>
          <div className="hub-kpi-s">Sum of positive predicted outcomes</div>
        </div>
      </div>

      {/* ---------- FILTER BAR ---------- */}
      <div className="hh-filters">
        <div className="hh-filter-grp">
          <div className="hh-filter-l">Lifecycle</div>
          <div className="hub-scope-pills">
            {LIFECYCLE_FILTERS.map((f) => (
              <button key={f.id}
                className={"hub-scope-pill" + (lifecycle === f.id ? " active" : "")}
                onClick={() => setLifecycle(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="hh-filter-grp">
          <div className="hh-filter-l">Theme</div>
          <select className="hh-select" value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}>
            {themeOptions.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="hh-filter-grp">
          <div className="hh-filter-l">Sort</div>
          <select className="hh-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="nii">NII contribution ↓</option>
            <option value="lifecycle">Lifecycle stage</option>
            <option value="champion">Champions first</option>
          </select>
        </div>
        <div className="hh-filter-spacer" />
        <div className="hh-filter-count">{visible.length} of {all.length}</div>
      </div>

      {/* ---------- HYPOTHESIS GRID ---------- */}
      <div className="hh-grid">
        {visible.map((h) => {
          const lc = prettyLifecycle(h.lifecycle);
          return (
            <button key={h.id} className={"hh-card" + (h.highlighted ? " champion" : "")} onClick={() => openInStudio(h)}>
              <div className="hh-card-top">
                <span className={"hh-kind hh-kind-" + h.kindMeta.tone}>{h.kindMeta.label}</span>
                <span className={"hh-lc hh-lc-" + lc.tone}>{lc.label}</span>
                {h.highlighted && <span className="hh-champion-tag">★ Champion</span>}
              </div>
              <div className="hh-card-name">{h.name}</div>
              <div className="hh-card-cluster">{h.clusterName}</div>
              <div className="hh-card-sentence">{h.sentence}</div>
              <div className="hh-card-out">{h.outcome}</div>
              <div className="hh-card-foot">
                <span className="hh-card-ref">{formatRef(h.id)}</span>
                <span className="hh-card-cta">Open in Studio →</span>
              </div>
            </button>
          );
        })}
        {visible.length === 0 && (
          <div className="hh-empty">No hypotheses match these filters. Try widening them.</div>
        )}
      </div>
    </div>
  );
}
