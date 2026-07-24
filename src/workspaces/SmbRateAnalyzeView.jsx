/* ============================================================================
   SmbRateAnalyzeView — Hypothesis Detail for SMB Deposit Retention via Rate.

   Forked from LiquidityAnalyzeView.jsx structure. Same hero, same chapters,
   same JSX class conventions (so analyse-workspace.css styles apply unchanged)
   and the SAME signal-card markup used on the Theme page (so the .sig-* styles
   apply unchanged). Different content + rate-specific mini-charts.

   Recommended hypothesis: H-SMB-RATE-2026-03-04 (Minimum-effective-rate).

   Sections (single scroll):
     1. Hero                         — recommended hypothesis + pre-sim KPI ranges
     2. Signals                      — 3 strategy signal cards (SMBRATE_STRATEGIES)
     3. Chapter 01 · Data + models   — compact data-stream + model groups
     4. Chapter 02 · Drivers         — reason cards with trigger-bar mini-charts
     5. Footer CTAs                  — back-to-theme + Test this hypothesis
   ========================================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppShell } from "@/state/AppShell";
import Icon from "@/components/Icon";
import TestModeChooser from "@/components/TestModeChooser";
import {
  SMBRATE_HYPOTHESIS_ID,
  SMBRATE_HYPOTHESIS_TITLE,
  SMBRATE_CONFIG,
  SMBRATE_PRESIM_RANGES,
  SMBRATE_STRATEGIES,
  SMBRATE_DRIVERS,
} from "@/data/smbRateConfig";
import "@/styles/analyse-workspace.css";

/* The compact data + model streams that sense this cohort. Brief by design —
   a short list of the streams that feed the elasticity model plus the model +
   guardrail themselves, grouped the same way the liquidity view groups them. */
const GROUPS = [
  {
    id: "data",
    title: "data streams composed",
    expandedTitle: "Data streams",
    items: [
      "Core-DDA recurring-flow ledger",
      "On-us transaction & fee telemetry",
      "Idle-balance / cash-management monitor",
    ],
  },
  {
    id: "detection",
    title: "detection + context models",
    expandedTitle: "Detection and context models",
    items: [
      "Deposit price-elasticity-of-attrition model",
    ],
  },
  {
    id: "guardrail",
    title: "guardrail + predictive models",
    expandedTitle: "Guardrail and predictive models",
    items: [
      "Margin-floor / no-overpay guardrail",
    ],
  },
];

const TOTAL_STREAMS = GROUPS.reduce((n, g) => n + g.items.length, 0);

/* ----------------------------------------------------------------------------
   SignalCard — the 3 strategy cards. Same markup + class names as the Theme
   page's SignalCard so the existing .sig-* styles apply unchanged. Clicking a
   card adopts its hypothesis and opens the test-mode chooser.
   -------------------------------------------------------------------------- */
function SignalCard({ signal: s, accent, onOpen }) {
  return (
    <div
      className={"sig-card sig-tone-" + s.status.tone}
      onClick={() => onOpen(s.championHypothesis)}
    >
      {/* Top row — short id + status, plus star pip if recommended */}
      <div className="sig-top">
        <span className="sig-badge" style={{ color: accent, borderColor: accent }}>
          {s.recommended.id || s.id}
        </span>
        {s.recommended.star && (
          <span className="sig-rec-pill">
            <span className="sig-rec-star">★</span> Recommended
          </span>
        )}
        <span className="sig-sp" />
        <span className="sig-status">
          <span className="sig-status-dot" />
          <span className="sig-status-l">{s.status.label}</span>
          {s.status.sub && <span className="sig-status-s">· {s.status.sub}</span>}
        </span>
      </div>

      {/* HEADLINE — hypothesis name */}
      <div className="sig-hyp-name">{s.recommended.name}</div>

      {/* WHO/WHAT/WHY — one tight line each */}
      {s.statement && (
        <div className="sig-statement">
          <div className="sig-statement-row">
            <span className="sig-statement-k">WHO</span>
            <span className="sig-statement-v">{s.statement.who}</span>
          </div>
          <div className="sig-statement-row">
            <span className="sig-statement-k">WHAT</span>
            <span className="sig-statement-v">{s.statement.what}</span>
          </div>
          <div className="sig-statement-row">
            <span className="sig-statement-k">WHY</span>
            <span className="sig-statement-v">{s.statement.why}</span>
          </div>
        </div>
      )}

      {/* EVIDENCE — KPI tiles */}
      <div className="sig-kpis">
        {s.kpis.map((k, i) => (
          <div className={"sig-kpi sig-kpi-" + k.kind} key={i}>
            <div className="sig-kpi-label">{k.label}</div>
            <div className="sig-kpi-value">{k.value}</div>
            <div className="sig-kpi-unit">{k.unit}</div>
            <div className="sig-kpi-context">{k.context}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        className="sig-cta"
        style={{ background: accent }}
        onClick={(e) => { e.stopPropagation(); onOpen(s.championHypothesis); }}
      >
        {s.ctaLabel}
      </button>
    </div>
  );
}

/* SignalsSection — 3 strategy cards rendered as a grid. Same wrapper markup as
   the Theme page so the .sec / .sig-grid styles apply unchanged. */
function SignalsSection({ signals, accent, onOpen }) {
  return (
    <div className="sec">
      <div className="sec-h">
        <span className="stag">SIGNALS</span>
        <span className="stt">Three signals on the table</span>
        <span className="sd">pick one to dive in</span>
        <span className="sx">{signals.length} surfaced</span>
      </div>
      <div className="sec-body">
        <div className="sig-grid">
          {signals.map((s) => (
            <SignalCard key={s.id} signal={s} accent={accent} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Mini-chart · TriggerBars
   Horizontal bars of the at-risk account count per trigger. Each bar is sized
   by its count relative to the largest driver. Reuses the mini-bars-h markup.
   -------------------------------------------------------------------------- */
function TriggerBars({ driver, max }) {
  const [hover, setHover] = useState(false);
  const fmt = (n) => n.toLocaleString();
  return (
    <div className="mini-chart">
      <div className="mini-bars-h">
        <div className="mini-bar-h-row">
          <span className="mini-bar-h-label">{driver.t}</span>
          <div className="mini-bar-h-track">
            <div
              className="mini-bar-h-fill warn"
              style={{ width: `${(driver.pct / max) * 100}%` }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            />
          </div>
          <span className="mini-bar-h-val">{fmt(driver.pct)}</span>
        </div>
      </div>
      <div className="mini-chart-foot">
        <b>{fmt(driver.pct)} {driver.unit}</b> showing this trigger across the at-risk book.
      </div>
      {hover && (
        <div className="mini-chart-tip">
          <span className="mini-chart-tip-l">{driver.t}</span>
          <span className="mini-chart-tip-v">{fmt(driver.pct)} {driver.unit} flagged</span>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   SmbRateAnalyzeView
   ========================================================================= */
export default function SmbRateAnalyzeView() {
  const {
    selectedThemeId, selectedHypothesisId,
    selectTheme, selectHypothesis,
  } = useAppShell();
  const routerNavigate = useNavigate();

  // Fall back to recommended only if nothing is selected — don't override an
  // upstream selection (mirrors the liquidity view's behaviour).
  useEffect(() => {
    if (!selectedThemeId) selectTheme("smbrate");
    if (!selectedHypothesisId) selectHypothesis(SMBRATE_HYPOTHESIS_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (id) => setExpandedGroups((cur) => ({ ...cur, [id]: !cur[id] }));

  const [testMenuOpen, setTestMenuOpen] = useState(false);
  const goTest = () => {
    selectHypothesis(SMBRATE_HYPOTHESIS_ID);
    setTestMenuOpen(true);
  };
  const goBackToTheme = () => routerNavigate("/theme?id=smbrate");

  // Signal-card open — adopt the hypothesis, then open the chooser (the chooser
  // routes into the simulate flow). Mirrors goTest for the strategy cards.
  const openSignalInLoop = (hid) => {
    selectHypothesis(hid || SMBRATE_HYPOTHESIS_ID);
    setTestMenuOpen(true);
  };

  const accent = SMBRATE_CONFIG.accent;
  const maxDriver = Math.max(...SMBRATE_DRIVERS.map((d) => d.pct));

  return (
    <div className="aw theme-page" style={{ "--acc": accent, "--acc-soft": accent + "22" }}>
      <div className="wrap">

        {/* ============================ HERO ============================ */}
        <header className="aw-hero">
          <div className="aw-hero-tag">
            <span className="aw-hero-star"><Icon name="star" size={12} /></span> Recommended hypothesis · {SMBRATE_HYPOTHESIS_ID}
          </div>
          <h1 className="aw-hero-title">{SMBRATE_HYPOTHESIS_TITLE}</h1>
          <p className="aw-hero-desc">{SMBRATE_CONFIG.claim}</p>
          {/* Pre-sim ranges — estimator output, not point predictions. Running
              the What-If simulation tightens each range into a CI. */}
          <div className="aw-hero-kpis">
            {SMBRATE_PRESIM_RANGES.map((r, i) => (
              <div className="aw-hero-kpi" key={i}>
                <span className="aw-hero-kpi-v">{r.value}</span>
                <span className="aw-hero-kpi-l">{r.label} {r.unit ? <em>{r.unit.includes("/") ? r.unit : `· ${r.unit}`}</em> : null}</span>
              </div>
            ))}
          </div>
          <div className="aw-hero-rangenote">
            Pre-simulation estimates from the optimizer. Running the What-If
            simulation tightens each range into a point estimate with CI.
          </div>
          <div className="aw-hero-cta-row">
            <button className="aw-btn ghost" onClick={goBackToTheme}>← Back to theme</button>
            <button className="aw-btn primary" onClick={goTest}>Test this hypothesis →</button>
          </div>
        </header>

        {/* ============== SIGNALS · 3 strategies ============== */}
        <SignalsSection
          signals={SMBRATE_STRATEGIES}
          accent={accent}
          onOpen={(hid) => openSignalInLoop(hid)}
        />

        {/* ============== CHAPTER 01 · DATA + MODELS ============== */}
        <section className="aw-chapter" id="aw-chapter-data">
          <div className="aw-chapter-h">
            <div className="aw-chapter-num">01</div>
            <div className="aw-chapter-accent" />
            <div className="aw-chapter-text">
              <div className="aw-chapter-title">Data + models composed</div>
            </div>
            <div className="aw-chapter-meta-row">
              <span className="aw-chapter-meta">{TOTAL_STREAMS} composed</span>
              <span className="aw-chapter-meta ok">MRM-approved</span>
              <span className="aw-chapter-meta ok">Pricing-consistency audited</span>
            </div>
          </div>

          <div className="aw-groups">
            {GROUPS.map((g) => {
              const open = !!expandedGroups[g.id];
              return (
                <div key={g.id} className={`aw-group${open ? " open" : ""}`}>
                  <button
                    type="button"
                    className="aw-group-h"
                    onClick={() => toggleGroup(g.id)}
                    aria-expanded={open}
                  >
                    <span className="aw-group-chev">{open ? "▾" : "▸"}</span>
                    <span className="aw-group-count">{g.items.length}</span>
                    <span className="aw-group-title">
                      {open ? g.expandedTitle : g.title}
                    </span>
                    {!open && <span className="aw-group-hint">click to expand</span>}
                  </button>
                  {open && (
                    <div className="aw-group-body">
                      <ul className="aw-stream-list">
                        {g.items.map((item) => (
                          <li className="aw-stream-item" key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============== CHAPTER 02 · DRIVERS ============== */}
        <section className="aw-chapter">
          <div className="aw-chapter-h">
            <div className="aw-chapter-num">02</div>
            <div className="aw-chapter-accent" />
            <div className="aw-chapter-text">
              <div className="aw-chapter-title">Drivers</div>
            </div>
            <div className="aw-chapter-meta">{SMBRATE_DRIVERS.length} weighted</div>
          </div>

          <div className="reason-list">
            {SMBRATE_DRIVERS.map((r, i) => (
              <article className="reason-card" key={i}>
                <div className="reason-pct">{r.pct.toLocaleString()}<span className="reason-pct-pct"> {r.unit}</span></div>
                <div className="reason-body">
                  <div className="reason-title">{r.t}</div>
                  <div className="reason-detail">{r.d}</div>
                  {r.chart && (
                    <div className="reason-chart">
                      <TriggerBars driver={r} max={maxDriver} />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ============== FOOTER CTAs ============== */}
        <div className="aw-footer-cta">
          <button className="aw-btn ghost" onClick={goBackToTheme}><Icon name="arrowLeft" size={14} /> Back to theme</button>
          <button className="aw-btn primary" onClick={goTest}>Test this hypothesis <Icon name="arrowRight" size={14} /></button>
        </div>

      </div>
      <TestModeChooser open={testMenuOpen} onClose={() => setTestMenuOpen(false)} eyebrow={"TESTING · " + SMBRATE_HYPOTHESIS_TITLE.toUpperCase()} />
    </div>
  );
}
