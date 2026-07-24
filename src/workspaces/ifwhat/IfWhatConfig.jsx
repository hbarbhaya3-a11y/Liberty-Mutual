/* ============================================================================
   IfWhatConfig — configuration screen for If-What exploration.

   Lever fidelity matches the What-If workbench, expressed as the optimizer's
   search surface:
     - Range parameters (continuous)   → dual-thumb min/max sliders
     - Discrete parameters (rails,
       tones, timings)                 → multi-select chips ("try these")
     - Toggles (auto-rollback,
       include follow-on)              → single switches

   Same visual grammar as What-If: panel-h shell, sim-lever-section bands,
   lever-row anatomy. The semantic difference is that every input scopes the
   optimizer's search space rather than setting a single value.
   ========================================================================= */
import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import RangeWithBubble from "@/components/RangeWithBubble";
import { CX_OBJECTIVES } from "@/workspaces/ifwhat/objectives";
import "@/styles/ifwhat.css";

/* Objective list — sourced from objectives.js so the trio stays aligned with
   the hero KPIs the results page actually surfaces. */
const OBJECTIVES = CX_OBJECTIVES.map((o) => ({
  id: o.id,
  label: `${o.kind === "max" ? "Maximize" : "Minimize"} ${o.label.toLowerCase()}`,
  sub: o.hint,
}));

/* Enum catalogues — same vocabulary as What-If's lever fields so a user
   moving between the two modes recognizes the choices. */
const RAILS = [
  { id: "rtp",   label: "RTP" },
  { id: "ach",   label: "ACH" },
  { id: "zelle", label: "Zelle" },
  { id: "wire",  label: "Wire" },
];
/* Cohort catalogue — same shape as What-If's CLUSTERS array so the labels
   and counts read identically across the two modes. `n` is the cluster
   size; the optimizer treats picked clusters as an additive scope. */
const COHORTS = [
  { id: "gig",     label: "Gig · High-Velocity",      n: 200000, sub: "Friday rent-day cadence · 73% instant-rail outbound" },
  { id: "smb",     label: "Small Business · Seasonal", n: 153000, sub: "Supplier payments · seasonal velocity peaks" },
  { id: "migrant", label: "Mono-Product · Migrant",    n: 147000, sub: "Cross-border corridors · thin-file" },
  { id: "young",   label: "Young Affluent · Emergent", n: 138000, sub: "Equity-event inflections · primacy-ready" },
];
const STYLES = [
  { id: "proactive",   label: "Proactive" },
  { id: "educational", label: "Educational" },
  { id: "generic",     label: "Generic" },
];
const TIMINGS = [
  { id: "pre-payout", label: "Pre-payday" },
  { id: "always-on",  label: "Always-on" },
];

/* DualRange — two-thumb min/max slider. Two native <input>s sit absolutely
   on the same track; the visible track is base-line + selected-segment fill
   + two thumbs. Track + thumbs are sized for readability (8px / 22px) so
   the control reads as a designed input, not a default range slider. */
function DualRange({ min, max, step, low, high, onChange, unit = "" }) {
  const lowRef = useRef(null);
  const highRef = useRef(null);

  const setLow = (v) => {
    const next = Math.min(Number(v), high - step);
    onChange({ low: next, high });
  };
  const setHigh = (v) => {
    const next = Math.max(Number(v), low + step);
    onChange({ low, high: next });
  };

  const range = max - min;
  const fillLeft = ((low - min) / range) * 100;
  const fillRight = ((high - min) / range) * 100;
  /* Match Chrome's native thumb position (clamped to [thumbWidth/2, W-thumbWidth/2]).
     Custom thumb divs sit at the same location as the invisible native thumbs. */
  const thumbCenter = (pct) => `calc(11px + ${pct}% - ${(pct * 0.22).toFixed(3)}px)`;
  const lowAt  = thumbCenter(fillLeft);
  const highAt = thumbCenter(fillRight);

  return (
    <div className="iw-dual">
      <div className="iw-dual-track" />
      <div className="iw-dual-fill" style={{ left: lowAt, right: `calc(100% - ${highAt})` }} />
      <div className="iw-dual-thumb iw-dual-thumb-low"  style={{ left: lowAt }} />
      <div className="iw-dual-thumb iw-dual-thumb-high" style={{ left: highAt }} />
      <div className="iw-dual-bubble iw-dual-bubble-low"  style={{ left: lowAt }}>{low}{unit}</div>
      <div className="iw-dual-bubble iw-dual-bubble-high" style={{ left: highAt }}>{high}{unit}</div>
      <input
        ref={lowRef}
        type="range" min={min} max={max} step={step}
        value={low}
        onChange={(e) => setLow(e.target.value)}
        className="iw-dual-input iw-dual-input-low"
        aria-label="Minimum"
      />
      <input
        ref={highRef}
        type="range" min={min} max={max} step={step}
        value={high}
        onChange={(e) => setHigh(e.target.value)}
        className="iw-dual-input iw-dual-input-high"
        aria-label="Maximum"
      />
    </div>
  );
}

function RangeRow({ label, caption, unit, min, max, step, low, high, onChange, ticks }) {
  return (
    <div className="lever-row">
      <div className="lever-head">
        <span className="lever-name">{label}</span>
        <span className="iw-range-pill">
          {low}{unit} <span className="iw-range-sep">–</span> {high}{unit}
        </span>
      </div>
      {caption && <div className="lever-caption">{caption}</div>}
      <div className="lever-control">
        <DualRange
          min={min} max={max} step={step}
          low={low} high={high}
          onChange={onChange}
          unit={unit}
        />
        <div className="iw-range-scale">
          {(ticks || [min, Math.round((min + max) / 2), max]).map((t, i) => (
            <span key={i}>{t}{unit}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* CohortChipRow — multi-select choice surface for customer clusters. Same
   semantic as ChipRow but renders a denser card per option since the
   cluster description and customer-count are load-bearing for the user's
   choice (you pick "who" before everything else). */
function CohortChipRow({ options, selected, onToggle }) {
  const totalN = selected.reduce((s, id) => s + (options.find((o) => o.id === id)?.n || 0), 0);
  return (
    <div className="lever-row">
      <div className="lever-head">
        <span className="lever-name">Customer cohort</span>
        <span className="iw-chips-count">
          {selected.length} cluster{selected.length === 1 ? "" : "s"} · {(totalN / 1000).toFixed(0)}K customers in scope
        </span>
      </div>
      <div className="lever-caption">
        Which customer clusters the optimizer may target. Gig is the primary cohort for the active hypothesis — adding clusters widens scope so the optimizer can find policies that work across multiple segments.
      </div>
      <div className="iw-cohort-list">
        {options.map((o) => {
          const on = selected.includes(o.id);
          const isPrimary = o.id === "gig";
          return (
            <button
              key={o.id}
              type="button"
              className={"iw-cohort" + (on ? " is-on" : "") + (isPrimary ? " is-primary" : "")}
              onClick={() => onToggle(o.id)}
            >
              <span className="iw-cohort-mark">
                {on && <Icon name="check" size={10} strokeWidth={3} />}
              </span>
              <span className="iw-cohort-body">
                <span className="iw-cohort-l">
                  {o.label}
                  {isPrimary && <span className="iw-cohort-primary">primary</span>}
                </span>
                <span className="iw-cohort-counts">
                  <b>{(o.n / 1000).toFixed(0)}K</b> customers · {o.sub}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ChipRow — multi-select choice surface. The optimizer's allowed values for
   a discrete-choice parameter (rails, tones, timings). One chip per option;
   active = included in the sweep. */
function ChipRow({ label, caption, options, selected, onToggle }) {
  return (
    <div className="lever-row">
      <div className="lever-head">
        <span className="lever-name">{label}</span>
        <span className="iw-chips-count">{selected.length} selected</span>
      </div>
      {caption && <div className="lever-caption">{caption}</div>}
      <div className="iw-chip-list">
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className={"iw-chip" + (on ? " is-on" : "")}
              onClick={() => onToggle(o.id)}
            >
              <span className="iw-chip-mark">
                {on && <Icon name="check" size={9} strokeWidth={3} />}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* SwitchRow — single boolean. Used for guardrails-style toggles like
   auto-rollback (fixed-on by default) and follow-on inclusion. */
function SwitchRow({ label, caption, on, onChange, disabled }) {
  return (
    <div className={"lever-row" + (disabled ? " is-disabled" : "")}>
      <div className="lever-head">
        <span className="lever-name">{label}</span>
        <button
          type="button"
          className={"iw-switch" + (on ? " is-on" : "")}
          onClick={() => !disabled && onChange(!on)}
          disabled={disabled}
          aria-pressed={on}
        >
          <span className="iw-switch-knob" />
        </button>
      </div>
      {caption && <div className="lever-caption">{caption}</div>}
    </div>
  );
}

/* Compute scenario count from the open ranges + discrete-choice cardinalities.
   The optimizer doesn't do a naive grid — it samples adaptively — but the
   *theoretical* size of the policy space is the product of cardinalities
   across all dimensions. We report that as the candidate-space size; the
   sampler explores a tractable subset (~hundreds of thousands) within it.
   The number swells fast as enum sets and ranges widen — exactly the user
   feedback we want when they relax a constraint. */
function computeScenarioCount(ranges, enums) {
  /* Per-range cardinality at the lever's step size. e.g. trustGate 15-24 at
     step 3 = (24-15)/3 + 1 = 4 grid points. */
  const card = {
    trustGate:     Math.max(1, Math.round((ranges.trustGate.high     - ranges.trustGate.low)     / 3 + 1)),
    liftPct:       Math.max(1, Math.round((ranges.liftPct.high       - ranges.liftPct.low)       / 5 + 1)),
    frequency:     Math.max(1, Math.round((ranges.frequency.high     - ranges.frequency.low)     / 1 + 1)),
    waitUntilWarm: Math.max(1, Math.round((ranges.waitUntilWarm.high - ranges.waitUntilWarm.low) / 5 + 1)),
    deepRollout:   Math.max(1, Math.round((ranges.deepRollout.high   - ranges.deepRollout.low)   / 10 + 1)),
    offerProm:     Math.max(1, Math.round((ranges.offerProm.high     - ranges.offerProm.low)     / 1 + 1)),
  };
  /* Multi-select rails: number of non-empty subsets = 2^n - 1. */
  const cohortSubsets = Math.max(1, Math.pow(2, enums.cohorts.length) - 1) || 1;
  const railSubsets = Math.max(1, Math.pow(2, enums.rails.length) - 1) || 1;
  const styleSubsets = Math.max(1, Math.pow(2, enums.styles.length) - 1) || 1;
  const timingSubsets = Math.max(1, Math.pow(2, enums.timings.length) - 1) || 1;

  /* Follow-on dimensions only fold in if the user opted in. */
  const followOnFactor = enums.includeDeepening
    ? card.waitUntilWarm * card.deepRollout * card.offerProm
    : 1;

  /* Cohort × Policy × Rails × Comms × Follow-on. Cohort is up front
     because picking which customer set the policy runs on multiplies all
     downstream dimensions. Pilot population is excluded — it's a deploy-
     time decision, not part of the policy-design search. */
  const policy = card.trustGate * card.liftPct;
  const comms  = card.frequency * styleSubsets * timingSubsets;
  const total  = cohortSubsets * policy * railSubsets * comms * followOnFactor;
  return Math.max(1, total);
}

export default function IfWhatConfig({
  objective, setObjective,
  ranges, setRanges,
  enums, setEnums,
  onRun, isAutopilot,
  takeOver,
}) {
  /* Simulation duration — single configurable value (not a range). Default
     8wk matches the calibration anchor every result tile is scored against. */
  const [simWeeks, setSimWeeks] = useState(8);

  /* Custom-segment rule builder — local UI affordance for layering an
     additional rule-defined cohort on top of the preset clusters. */
  const [customOpen, setCustomOpen] = useState(false);
  const [customRules, setCustomRules] = useState([]);
  const addRule    = () => setCustomRules((cur) => [...cur, { feature: "balance_min", op: "gte", value: 5000 }]);
  const updateRule = (i, patch) => setCustomRules((cur) => cur.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const removeRule = (i) => setCustomRules((cur) => cur.filter((_, idx) => idx !== i));

  const setRange = (key) => (next) => setRanges({ ...ranges, [key]: next });
  const toggleEnum = (key) => (id) => {
    const cur = enums[key];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    /* Don't let the user empty a multi-select — the optimizer needs at
       least one value to consider for the dimension. */
    if (next.length === 0) return;
    setEnums({ ...enums, [key]: next });
  };
  const setBool = (key) => (v) => setEnums({ ...enums, [key]: v });

  const scenarioCount = computeScenarioCount(ranges, enums);
  /* Sampler explores a sub-fraction of the full policy space — show that as
     the "explored" number to convey it's a meaningful sweep, not exhaustive
     grid search. ~3% of the candidate space, capped for readability. */
  const explored = Math.min(scenarioCount, Math.max(5000, Math.round(scenarioCount * 0.03)));

  return (
    <div className="sim-workspace iw-workspace">
      <header className="sim-ws-header">
        <div className="sim-ws-header-title">
          <div className="test-journey-eyebrow">TESTING · IF-WHAT OPTIMIZER</div>
          <h1 className="test-journey-title">Define the goal · range the parameters</h1>
          <p className="test-journey-sub">
            Pick the objective and the search ranges. The optimizer sweeps the
            policy space inside your bounds and returns the Pareto frontier.
          </p>
        </div>
        <div className="sim-ws-header-mode">
          {isAutopilot ? (
            <>
              <div className="sim-mode-pill sim-mode-pill-autopilot">
                <span className="sim-mode-pill-dot" />
                <span className="sim-mode-pill-l">AUTOPILOT</span>
                <span className="sim-mode-pill-sub">Twin set the objective and ranges</span>
              </div>
              <button className="sim-mode-takeover" onClick={takeOver}>
                <Icon name="arrowLeft" size={11} /> Take over
              </button>
            </>
          ) : (
            <div className="sim-mode-pill sim-mode-pill-guided">
              <span className="sim-mode-pill-l">IF-WHAT · GUIDED</span>
              <span className="sim-mode-pill-sub">You set the goal and the search ranges</span>
            </div>
          )}
        </div>
      </header>

      <div className="sim-ws-body">
        <section className="panel sim-ws-col sim-ws-levers">
          <div className="panel-h">
            <span className="stag">SEARCH SPACE</span>
            <span className="stt">
              {isAutopilot ? "Read-only · Twin set the bounds" : "Define what the optimizer is allowed to explore"}
            </span>
          </div>
          <div className="panel-body sim-ws-col-scroll">
            <fieldset
              className={"sim-lever-fieldset" + (isAutopilot ? " is-autopilot" : "")}
              disabled={isAutopilot}
            >
              {/* 1 · OBJECTIVE */}
              <div className="sim-lever-section">
                <div className="sim-lever-section-band">
                  <span className="sim-lever-section-num">1</span>
                  <span className="sim-lever-section-name">OBJECTIVE</span>
                  <span className="sim-lever-section-meta">What the optimizer maximizes</span>
                </div>
                <div className="iw-objectives">
                  {OBJECTIVES.map((o) => (
                    <label
                      key={o.id}
                      className={"iw-objective" + (objective === o.id ? " is-selected" : "")}
                    >
                      <input
                        type="radio"
                        name="iw-objective"
                        value={o.id}
                        checked={objective === o.id}
                        onChange={() => setObjective(o.id)}
                      />
                      <span className="iw-objective-body">
                        <span className="iw-objective-l">{o.label}</span>
                        <span className="iw-objective-d">{o.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2 · COHORT — multi-select of clusters the optimizer may
                  target + optional rule-builder for an additional custom
                  segment defined by feature rules. */}
              <div className="sim-lever-section">
                <div className="sim-lever-section-band">
                  <span className="sim-lever-section-num">2</span>
                  <span className="sim-lever-section-name">COHORT</span>
                  <span className="sim-lever-section-meta">Which customer clusters the optimizer may target</span>
                </div>
                <div className="sim-lever-list">
                  <CohortChipRow
                    options={COHORTS}
                    selected={enums.cohorts}
                    onToggle={toggleEnum("cohorts")}
                  />
                  <div className={"sim-cohort-custom" + (customOpen ? " is-open" : "")}>
                    <button
                      type="button"
                      className="sim-cohort-custom-toggle"
                      onClick={() => setCustomOpen((v) => !v)}
                    >
                      <Icon name={customOpen ? "chevronDown" : "chevronRight"} size={12} />
                      Add a custom segment (rule-defined)
                      {customRules.length > 0 && (
                        <span className="sim-cohort-custom-count">
                          {customRules.length} rule{customRules.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </button>
                    {customOpen && (
                      <div className="sim-cohort-custom-body">
                        <div className="sim-cohort-custom-model">
                          <b>How this works:</b> a custom segment is an <em>additional</em> group defined by feature rules — added to the preset clusters above, not used to filter them. Scoped to this scenario only.
                        </div>
                        {customRules.length === 0 ? (
                          <div className="sim-cohort-custom-empty">
                            No rules yet. Click "Add rule" to start building.
                          </div>
                        ) : (
                          <div className="sim-cohort-custom-rules">
                            {customRules.map((r, i) => (
                              <div key={i} className="sim-cohort-custom-rule">
                                <select
                                  value={r.feature}
                                  onChange={(e) => updateRule(i, { feature: e.target.value })}
                                >
                                  <option value="balance_min">Avg balance</option>
                                  <option value="velocity_30d">Txn velocity (30d)</option>
                                  <option value="zelle_share">Zelle outbound share</option>
                                  <option value="recurring_strength">Recurring-pattern strength</option>
                                  <option value="counterparty_diversity">Counterparty diversity</option>
                                  <option value="tenure_months">Tenure (months)</option>
                                </select>
                                <select
                                  value={r.op}
                                  onChange={(e) => updateRule(i, { op: e.target.value })}
                                >
                                  <option value="gte">≥</option>
                                  <option value="lte">≤</option>
                                  <option value="eq">=</option>
                                  <option value="between">between</option>
                                </select>
                                <input
                                  type="number"
                                  value={r.value}
                                  onChange={(e) => updateRule(i, { value: Number(e.target.value) })}
                                />
                                <button
                                  type="button"
                                  className="sim-cohort-custom-rm"
                                  onClick={() => removeRule(i)}
                                  aria-label="Remove rule"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          className="sim-cohort-custom-add"
                          onClick={addRule}
                        >
                          + Add rule
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 · PRODUCTS · RAILS */}
              <div className="sim-lever-section">
                <div className="sim-lever-section-band">
                  <span className="sim-lever-section-num">3</span>
                  <span className="sim-lever-section-name">PRODUCTS · RAILS</span>
                  <span className="sim-lever-section-meta">Which rails the optimizer is allowed to enable</span>
                </div>
                <div className="sim-lever-list">
                  <ChipRow
                    label="Eligible payment rails"
                    caption="Optimizer explores combinations of these. RTP is the primary rail being enabled; the others widen scope."
                    options={RAILS}
                    selected={enums.rails}
                    onToggle={toggleEnum("rails")}
                  />
                </div>
              </div>

              {/* 5 · POLICY */}
              <div className="sim-lever-section">
                <div className="sim-lever-section-band">
                  <span className="sim-lever-section-num">4</span>
                  <span className="sim-lever-section-name">POLICY</span>
                  <span className="sim-lever-section-meta">The rules being changed — search ranges</span>
                </div>
                <div className="sim-lever-list">
                  <RangeRow
                    label="Verified-history requirement"
                    caption="Months of recurring payments to the same payee a customer must show before they qualify."
                    unit=" mo" min={12} max={30} step={3}
                    ticks={[12, 18, 24, 30]}
                    low={ranges.trustGate.low} high={ranges.trustGate.high}
                    onChange={setRange("trustGate")}
                  />
                  <RangeRow
                    label="RTP send-limit lift"
                    caption="How much the per-transaction RTP send limit is raised for payments to a verified counterparty."
                    unit="%" min={10} max={40} step={5}
                    ticks={[10, 20, 30, 40]}
                    low={ranges.liftPct.low} high={ranges.liftPct.high}
                    onChange={setRange("liftPct")}
                  />
                  <SwitchRow
                    label="Auto-rollback"
                    caption="Automatically suspend if any guardrail breaches during pilot. Locked on — this is a hard constraint, not a search dimension."
                    on={enums.autoRollback}
                    onChange={setBool("autoRollback")}
                    disabled
                  />
                </div>
              </div>

              {/* 6 · COMMUNICATIONS */}
              <div className="sim-lever-section">
                <div className="sim-lever-section-band">
                  <span className="sim-lever-section-num">5</span>
                  <span className="sim-lever-section-name">COMMUNICATIONS</span>
                  <span className="sim-lever-section-meta">How customers hear about the change</span>
                </div>
                <div className="sim-lever-list">
                  <RangeRow
                    label="Announcement frequency"
                    caption="Customer communications per week during the rollout period."
                    unit=" /wk" min={1} max={5} step={1}
                    ticks={[1, 3, 5]}
                    low={ranges.frequency.low} high={ranges.frequency.high}
                    onChange={setRange("frequency")}
                  />
                  <ChipRow
                    label="Communication style"
                    caption="Tones the optimizer may try."
                    options={STYLES}
                    selected={enums.styles}
                    onToggle={toggleEnum("styles")}
                  />
                  <ChipRow
                    label="Send timing"
                    caption="Delivery windows the optimizer may try."
                    options={TIMINGS}
                    selected={enums.timings}
                    onToggle={toggleEnum("timings")}
                  />
                </div>
              </div>

              {/* 6 · SIMULATION DURATION — single-thumb slider; model
                  horizon every candidate is scored over. Sits as its own
                  section just above the collapsed FOLLOW-ON + GUARDRAILS
                  so the experience matches retention If-What's layout. */}
              <div className="sim-lever-section">
                <div className="sim-lever-section-band">
                  <span className="sim-lever-section-num">6</span>
                  <span className="sim-lever-section-name">SIMULATION DURATION</span>
                  <span className="sim-lever-section-meta">Model horizon every candidate is scored over</span>
                </div>
                <div className="lever-row">
                  <div className="lever-head">
                    <span className="lever-name">Weeks</span>
                    <span className="iw-range-pill">{simWeeks} weeks</span>
                  </div>
                  <div className="lever-caption">The pilot RCT length is set separately in Deploy.</div>
                  <div className="lever-control">
                    <RangeWithBubble
                      min={4} max={12} step={2}
                      value={simWeeks}
                      onChange={(e) => setSimWeeks(+e.target.value)}
                      formatter={(v) => `${v} weeks`}
                    />
                    <div className="iw-range-scale"><span>4w</span><span>8w</span><span>12w</span></div>
                  </div>
                </div>
              </div>

              {/* 7 · FOLLOW-ON OFFER */}
              <details className="sim-lever-section sim-lever-advanced">
                <summary className="sim-lever-section-h sim-lever-section-h-advanced">
                  <span>7 · FOLLOW-ON OFFER</span>
                  <span className="sim-lever-advanced-tag">advanced · optional</span>
                </summary>
                <div className="sim-lever-advanced-note">
                  Cross-sell parameters — only relevant if you want the optimizer to also explore attaching a follow-on offer.
                </div>
                <SwitchRow
                  label="Include follow-on offer in search"
                  caption="When off, the optimizer keeps scope to friction-removal only."
                  on={enums.includeDeepening}
                  onChange={setBool("includeDeepening")}
                />
                <fieldset
                  className={"sim-lever-list" + (enums.includeDeepening ? "" : " is-excluded")}
                  disabled={!enums.includeDeepening}
                >
                  <RangeRow
                    label="Offer prominence"
                    caption="How prominently the follow-on product is shown (1 = subtle, 4 = top-of-app)."
                    unit="" min={1} max={4} step={1}
                    ticks={[1, 2, 3, 4]}
                    low={ranges.offerProm.low} high={ranges.offerProm.high}
                    onChange={setRange("offerProm")}
                  />
                  <RangeRow
                    label="Days before follow-on offer"
                    caption="Percent of pilot period that elapses before the offer begins."
                    unit="%" min={30} max={70} step={5}
                    ticks={[30, 50, 70]}
                    low={ranges.waitUntilWarm.low} high={ranges.waitUntilWarm.high}
                    onChange={setRange("waitUntilWarm")}
                  />
                  <RangeRow
                    label="Follow-on offer reach"
                    caption="Percent of qualifying customers shown the follow-on offer."
                    unit="%" min={30} max={90} step={10}
                    ticks={[30, 60, 90]}
                    low={ranges.deepRollout.low} high={ranges.deepRollout.high}
                    onChange={setRange("deepRollout")}
                  />
                </fieldset>
              </details>

              {/* 8 · GUARDRAILS — moved to the bottom + collapsed. They're
                  always-on hard constraints, not user-tunable, so they
                  shouldn't compete with the search levers for attention. */}
              <details className="sim-lever-section sim-lever-advanced">
                <summary className="sim-lever-section-h sim-lever-section-h-advanced">
                  <span>8 · GUARDRAILS</span>
                  <span className="sim-lever-advanced-tag">always on · enforced on every candidate</span>
                </summary>
                <ul className="iw-guards">
                  <li><Icon name="check" size={11} strokeWidth={2.5} /> Fair-lending margin must stay ≥ 0.85 (ECOA)</li>
                  <li><Icon name="check" size={11} strokeWidth={2.5} /> Fraud impact must stay within current quarter envelope</li>
                  <li><Icon name="check" size={11} strokeWidth={2.5} /> Model Risk (SR 11-7) model-card validity</li>
                  <li><Icon name="check" size={11} strokeWidth={2.5} /> Eligibility signal audited against protected-class proxying</li>
                </ul>
              </details>
            </fieldset>
          </div>
        </section>

        {/* RIGHT — search-space coverage summary */}
        <section className="panel sim-ws-col sim-ws-context">
          <div className="panel-h">
            <span className="stag">SEARCH COVERAGE</span>
            <span className="stt">What the optimizer will try</span>
          </div>
          <div className="panel-body sim-ws-col-scroll sim-ws-context-body">
            <div className="iw-coverage">
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">Objective</span>
                <span className="iw-coverage-v">
                  {OBJECTIVES.find((o) => o.id === objective)?.label || objective}
                </span>
              </div>
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">Cohort</span>
                <span className="iw-coverage-v">
                  {enums.cohorts
                    .map((c) => COHORTS.find((x) => x.id === c)?.label.split(" · ")[0] || c)
                    .join(" · ")}
                </span>
              </div>
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">Rails</span>
                <span className="iw-coverage-v iw-mono">
                  {enums.rails.map((r) => RAILS.find((x) => x.id === r)?.label || r).join(" · ")}
                </span>
              </div>
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">Verified history</span>
                <span className="iw-coverage-v iw-mono">{ranges.trustGate.low}–{ranges.trustGate.high} mo</span>
              </div>
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">RTP send-limit lift</span>
                <span className="iw-coverage-v iw-mono">+{ranges.liftPct.low}% – +{ranges.liftPct.high}%</span>
              </div>
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">Simulation duration</span>
                <span className="iw-coverage-v iw-mono">{simWeeks} weeks</span>
              </div>
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">Comms frequency</span>
                <span className="iw-coverage-v iw-mono">{ranges.frequency.low}–{ranges.frequency.high} / wk</span>
              </div>
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">Comms styles</span>
                <span className="iw-coverage-v">{enums.styles.length} variant{enums.styles.length === 1 ? "" : "s"}</span>
              </div>
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">Send timings</span>
                <span className="iw-coverage-v">{enums.timings.length} variant{enums.timings.length === 1 ? "" : "s"}</span>
              </div>
              <div className="iw-coverage-row">
                <span className="iw-coverage-k">Follow-on offer</span>
                <span className="iw-coverage-v">{enums.includeDeepening ? "in scope" : "excluded"}</span>
              </div>
              <div className="iw-coverage-row iw-coverage-total">
                <span className="iw-coverage-k">Candidate policy space</span>
                <span className="iw-coverage-v iw-mono">≈ {scenarioCount.toLocaleString()}</span>
              </div>
              <div className="iw-coverage-row iw-coverage-explored">
                <span className="iw-coverage-k">Sampled by optimizer</span>
                <span className="iw-coverage-v iw-mono">≈ {explored.toLocaleString()} · adaptive</span>
              </div>
            </div>
          </div>

          <div className="sim-context-footer">
            <button
              className="tj-btn tj-btn-primary tj-btn-lg sim-run-btn iw-run-btn"
              onClick={onRun}
            >
              <Icon name="play" size={14} /> Run optimizer
            </button>
            <div className="sim-context-footer-note">
              {scenarioCount.toLocaleString()} candidate policies · {explored.toLocaleString()} sampled · 8-week horizon · all guardrails respected
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
