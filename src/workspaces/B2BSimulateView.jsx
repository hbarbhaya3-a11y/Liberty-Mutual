/* ============================================================================
   B2BSimulateView — the shared, config-driven "Configure → Run → Micro-segment
   results → Stage" Simulate workbench for the two B2B (SMB) use cases (Growth /
   Re-bundle and Deposit Retention via Rate).

   Renders ENTIRELY from a config object resolved by theme id — no hardcoded
   use-case content. The config shape is defined in:
     data/b2bGrowthConfig.js · data/b2bRateConfig.js · data/b2bConfigs.js

   Outer chrome + run/stage mechanics mirror LiquiditySimulateView so the shared
   analyse-workspace.css applies unchanged; the body uses b2b.css.

   State machine: mode = "config" | "running" | "results".
     - config   : hero + typed configSections + sticky Run bar
     - running  : SimulationLoader overlay (optimizer variant)
     - results  : MicroSegmentResults + governance trace + sticky Stage bar
   ========================================================================= */

import React, { useState, useMemo, useCallback } from "react";
import { useAppShell } from "@/state/AppShell";
import SimulationLoader from "@/components/loaders/SimulationLoader";
import Icon from "@/components/Icon";
import MicroSegmentResults from "@/components/MicroSegmentResults";
import { getB2BConfig } from "@/data/b2bConfigs";
import "@/styles/analyse-workspace.css";
import "@/styles/b2b.css";

export default function B2BSimulateView() {
  const {
    selectedThemeId,
    navigate: navWorkspace,
    stagePolicy,
    pushAgentEvent,
    setIntermezzo,
  } = useAppShell();

  const cfg = getB2BConfig(selectedThemeId);

  // Mode state machine.
  const [mode, setMode] = useState("config"); // 'config' | 'running' | 'results'

  // ---- Per-section config state ----------------------------------------
  // Build the initial state for every typed section from the config defaults,
  // so the controls stay theme-agnostic.
  const initialState = useMemo(() => {
    if (!cfg) return {};
    const out = {};
    for (const section of cfg.configSections) {
      if (section.type === "single") {
        const def = section.options.find((o) => o.default) || section.options[0];
        out[section.id] = def ? def.id : null;
      } else if (section.type === "multi") {
        out[section.id] = new Set(
          section.options.filter((o) => o.default).map((o) => o.id)
        );
      } else if (section.type === "toggle-rows") {
        const rows = {};
        for (const row of section.rows) rows[row.id] = row.default || "a";
        out[section.id] = rows;
      } else if (section.type === "slider") {
        out[section.id] = section.default;
      }
      // checklist is read-only — no state
    }
    return out;
  }, [cfg]);

  const [cfgState, setCfgState] = useState(initialState);

  const setSingle = useCallback((sectionId, optId) => {
    setCfgState((cur) => ({ ...cur, [sectionId]: optId }));
  }, []);

  const toggleMulti = useCallback((sectionId, optId) => {
    setCfgState((cur) => {
      const next = new Set(cur[sectionId]);
      if (next.has(optId)) next.delete(optId);
      else next.add(optId);
      return { ...cur, [sectionId]: next };
    });
  }, []);

  const setToggleRow = useCallback((sectionId, rowId, ab) => {
    setCfgState((cur) => ({
      ...cur,
      [sectionId]: { ...cur[sectionId], [rowId]: ab },
    }));
  }, []);

  const setSlider = useCallback((sectionId, value) => {
    setCfgState((cur) => ({ ...cur, [sectionId]: value }));
  }, []);

  // ---- Run / Stage handlers --------------------------------------------
  const onRun = useCallback(() => setMode("running"), []);
  const onLoaderComplete = useCallback(() => setMode("results"), []);
  const onLoaderCancel = useCallback(() => setMode("config"), []);

  const onStage = useCallback(() => {
    if (!cfg) return;
    const cohort = (cfg.card && cfg.card.cohort) || 0;
    const policy = {
      id: "p-" + Date.now(),
      name: cfg.hypothesisTitle,
      hypothesis: cfg.hypothesisId,
      cluster: cfg.theme,
      themeId: cfg.theme,
      themeName: cfg.badge,
      experimentType: cfg.theme,
      stagedBy: "user",
      status: "pending",
      stagedAt: new Date().toISOString(),
      pilotDuration: 8,
      treatmentN: Math.round(cohort * 0.9),
      controlN: Math.round(cohort * 0.1),
      blurb: "Staged from B2B simulate · per-segment policy · 10% holdout",
    };
    stagePolicy(policy);
    pushAgentEvent &&
      pushAgentEvent({
        kind: "good",
        src: "Simulate",
        text: `Staged ${cfg.hypothesisTitle} for deploy`,
      });
    setIntermezzo("staged-guided");
    setTimeout(() => {
      setIntermezzo(null);
      navWorkspace("deploy");
    }, 1500);
  }, [cfg, stagePolicy, pushAgentEvent, setIntermezzo, navWorkspace]);

  // GUARD — after hooks so hook order stays stable.
  if (!cfg) return null;

  // ---- typed section renderer ------------------------------------------
  // Each config section renders with the template's LEVER pattern so it
  // matches LiquiditySimulateView's workbench grammar. The typed control
  // (chips / toggles / slider / checklist) sits inside .lever-control.
  const renderSection = (section) => (
    <div key={section.id} className="lever-row">
      <div className="lever-head">
        <span className="lever-name">{section.label}</span>
      </div>
      {section.help && <div className="lever-caption">{section.help}</div>}
      <div className="lever-control">{renderControl(section)}</div>
    </div>
  );

  const renderControl = (section) => {
    switch (section.type) {
      case "single": {
        const sel = cfgState[section.id];
        return (
          <div className="b2b-opts">
            {section.options.map((o) => {
              const on = sel === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={"b2b-opt radio" + (on ? " on" : "")}
                  onClick={() => setSingle(section.id, o.id)}
                >
                  <span className="b2b-opt-box" />
                  {o.label}
                </button>
              );
            })}
          </div>
        );
      }
      case "multi": {
        const set = cfgState[section.id] || new Set();
        return (
          <div className="b2b-opts">
            {section.options.map((o) => {
              const on = set.has(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  className={"b2b-opt" + (on ? " on" : "")}
                  onClick={() => toggleMulti(section.id, o.id)}
                >
                  <span className="b2b-opt-box">{on ? "✓" : ""}</span>
                  {o.label}
                </button>
              );
            })}
          </div>
        );
      }
      case "toggle-rows": {
        const rows = cfgState[section.id] || {};
        return (
          <>
            {section.rows.map((row) => {
              const sel = rows[row.id] || "a";
              return (
                <div key={row.id} className="b2b-toggle-row">
                  <span className="b2b-cfg-label">{row.label || ""}</span>
                  <div className="b2b-toggle-pair">
                    <button
                      type="button"
                      className={"b2b-toggle-opt" + (sel === "a" ? " on" : "")}
                      onClick={() => setToggleRow(section.id, row.id, "a")}
                    >
                      {row.a}
                    </button>
                    <button
                      type="button"
                      className={"b2b-toggle-opt" + (sel === "b" ? " on" : "")}
                      onClick={() => setToggleRow(section.id, row.id, "b")}
                    >
                      {row.b}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        );
      }
      case "slider": {
        const val = cfgState[section.id];
        return (
          <div className="b2b-slider-wrap">
            <input
              type="range"
              className="b2b-slider"
              min={section.min}
              max={section.max}
              step={section.step}
              value={val}
              onChange={(e) => setSlider(section.id, Number(e.target.value))}
            />
            <span className="b2b-slider-val">
              {val}
              {section.unit}
            </span>
          </div>
        );
      }
      case "checklist": {
        return (
          <div className="b2b-checklist">
            {section.items.map((item, i) => (
              <div key={i} className="b2b-guard">
                {item}
              </div>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      className="aw theme-page"
      style={{ "--acc": cfg.accent, "--acc-soft": cfg.accent + "22" }}
    >
      <div className="wrap">

        {/* ===================== CONFIG MODE ===================== */}
        {mode === "config" && (
          <>
            <header className="aw-hero">
              <div className="aw-hero-tag">
                <span className="aw-hero-star">●</span> {cfg.segment + " · " + cfg.badge}
              </div>
              <h1 className="aw-hero-title">{cfg.hypothesisTitle}</h1>
              <p className="aw-hero-desc">
                Configure the scenario, then run the optimizer — it returns a
                per-segment policy.
              </p>
            </header>

            <section className="aw-chapter">
              <div className="aw-chapter-h">
                <div className="aw-chapter-accent" />
                <div className="aw-chapter-text">
                  <div className="aw-chapter-title">Configure the scenario</div>
                  <div className="aw-chapter-sub">
                    levers · guardrails enforced as hard constraints
                  </div>
                </div>
              </div>
              {cfg.configSections.map((section) => renderSection(section))}
            </section>

            <div className="b2b-actionbar">
              <button
                type="button"
                className="aw-btn ghost"
                onClick={() => navWorkspace("analyse")}
              >
                ← Back
              </button>
              <span className="b2b-actionbar-hint">
                All guardrails enforced as hard constraints
              </span>
              <button type="button" className="aw-btn primary" onClick={onRun}>
                Run simulation →
              </button>
            </div>
          </>
        )}

        {/* ===================== RUNNING MODE ===================== */}
        {mode === "running" && (
          <div className="sim-overlay" role="dialog" aria-modal="true" aria-label="Simulation running">
            <div className="sim-overlay-backdrop" />
            <div className="sim-overlay-card">
              <SimulationLoader
                variant="optimizer"
                onComplete={onLoaderComplete}
                onCancel={onLoaderCancel}
              />
            </div>
          </div>
        )}

        {/* ===================== RESULTS MODE ===================== */}
        {mode === "results" && (
          <>
            <MicroSegmentResults cfg={cfg} accent={cfg.accent} />

            <section className="aw-chapter">
              <div className="aw-chapter-h">
                <div className="aw-chapter-accent" />
                <div className="aw-chapter-text">
                  <div className="aw-chapter-title">
                    Send to governance → activation
                  </div>
                  <div className="aw-chapter-sub">
                    every guardrail traced before the policy is staged
                  </div>
                </div>
              </div>
              <div className="b2b-gov-trace">
                {cfg.governance.trace.map((t, i) => (
                  <div key={i} className="b2b-gov-item">{t}</div>
                ))}
                <div className="b2b-gov-item">
                  10% holdout reserved · lift measured against do-nothing
                </div>
              </div>
              <div className="b2b-gov-note">{cfg.governance.note}</div>
            </section>

            <div className="b2b-actionbar">
              <button
                type="button"
                className="aw-btn ghost"
                onClick={() => setMode("config")}
              >
                ← Re-configure
              </button>
              <span className="b2b-actionbar-hint">
                Holdout untouched so lift is measurable
              </span>
              <button type="button" className="aw-btn primary" onClick={onStage}>
                Stage for Deploy →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
