/* ============================================================================
   B2BClusterView — the shared, config-driven "Analyze" step for the two
   B2B (SMB) use cases (Growth / Re-bundle and Deposit Retention via Rate).

   Renders ENTIRELY from a config object resolved by theme id — no hardcoded
   use-case content. The config shape is defined in:
     data/b2bGrowthConfig.js · data/b2bRateConfig.js · data/b2bConfigs.js

   Restyled to reuse the analyse-workspace.css classes used by
   LiquidityAnalyzeView (hero, chapters, reason cards, horizontal mini-bars),
   so the look-and-feel matches the rest of the app. The trigger rows still
   use b2b.css (b2b-trigger-*, b2b-exclusions, b2b-summary).

   Sections (single scroll, top → bottom inside .wrap):
     1. Hero            — segment/badge, name, cohort + trend + off-us KPIs + CTA
     2. Chapter 01      — the triggers defining this cluster (+ exclusions)
     3. Chapter 02      — the cohort & what they hold today (mini-bars + read)
     4. Chapter 03      — hypotheses to test (selectable; starred default)
     5. Footer CTA      — back to dashboard · configure & run
   ========================================================================= */

import { useState } from "react";
import { useNavigate as routerNavigate } from "react-router-dom";
import { useAppShell } from "@/state/AppShell";
import { getB2BConfig } from "@/data/b2bConfigs";
import "@/styles/analyse-workspace.css";
import "@/styles/b2b.css";

export default function B2BClusterView() {
  const { selectedThemeId, selectHypothesis, navigate: navWorkspace } = useAppShell();
  const navigate = routerNavigate();

  const cfg = getB2BConfig(selectedThemeId);

  // Default the selected hypothesis to the starred one (else the first).
  const defaultHypId = cfg
    ? (cfg.hypotheses.find((h) => h.star) || cfg.hypotheses[0]).id
    : null;
  const [selectedHyp, setSelectedHyp] = useState(defaultHypId);

  if (!cfg) return null;

  const triggerTotal = cfg.triggers.reduce((sum, t) => sum + (t.count || 0), 0);

  const back = () => navigate("/theme?id=" + selectedThemeId);
  const configureRun = () => {
    selectHypothesis(cfg.hypothesisId);
    navWorkspace("simulate");
  };

  return (
    <div
      className="aw theme-page"
      style={{ "--acc": cfg.accent, "--acc-soft": cfg.accent + "22" }}
    >
      <div className="wrap">

        {/* ============================ HERO ============================ */}
        <header className="aw-hero">
          <div className="aw-hero-tag">
            <span className="aw-hero-star">●</span> {cfg.segment} · {cfg.badge}
          </div>
          <h1 className="aw-hero-title">{cfg.name}</h1>
          <p className="aw-hero-desc">{cfg.card.cohortLine + " · " + cfg.card.value}</p>
          <div className="aw-hero-kpis">
            <div className="aw-hero-kpi">
              <span className="aw-hero-kpi-v">{cfg.card.cohort.toLocaleString()}</span>
              <span className="aw-hero-kpi-l">SMBs in cohort</span>
            </div>
            <div className="aw-hero-kpi">
              <span className="aw-hero-kpi-v">{cfg.card.trend}</span>
              <span className="aw-hero-kpi-l">vs last month</span>
            </div>
            <div className="aw-hero-kpi">
              <span className="aw-hero-kpi-v">{cfg.card.offUs + "%"}</span>
              <span className="aw-hero-kpi-l">{cfg.card.offUsLine || "off-us"}</span>
            </div>
          </div>
          <div className="aw-hero-cta-row">
            <button className="aw-btn ghost" onClick={back}>← Back to dashboard</button>
            <button className="aw-btn primary" onClick={configureRun}>Configure &amp; run →</button>
          </div>
        </header>

        {/* ============== CHAPTER 01 · TRIGGERS ============== */}
        <section className="aw-chapter">
          <div className="aw-chapter-h">
            <div className="aw-chapter-num">01</div>
            <div className="aw-chapter-accent" />
            <div className="aw-chapter-text">
              <div className="aw-chapter-title">The triggers defining this cluster</div>
              <div className="aw-chapter-sub">plain-language signals · live counts</div>
            </div>
            <div className="aw-chapter-meta-row">
              <span className="aw-chapter-meta">{triggerTotal.toLocaleString()} SMBs</span>
            </div>
          </div>

          <div className="b2b-trigger-list">
            {cfg.triggers.map((t) => (
              <div key={t.id} className={`b2b-trigger-row${t.urgency ? " urgent" : ""}`}>
                <div className="b2b-trigger-main">
                  <span className="b2b-trigger-label">
                    {t.label}
                    {t.urgency && <span className="b2b-trigger-flag">URGENCY</span>}
                  </span>
                  <span className="b2b-trigger-plain">{t.plain}</span>
                </div>
                <span className="b2b-trigger-count">{t.count.toLocaleString() + " SMBs"}</span>
              </div>
            ))}
            {cfg.exclusions && (
              <div className="b2b-exclusions">
                Must be absent:{" "}
                {cfg.exclusions.map((ex) => (
                  <span key={ex} className="b2b-excl-chip">{ex}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============== CHAPTER 02 · COHORT & HOLDINGS ============== */}
        <section className="aw-chapter">
          <div className="aw-chapter-h">
            <div className="aw-chapter-num">02</div>
            <div className="aw-chapter-accent" />
            <div className="aw-chapter-text">
              <div className="aw-chapter-title">The cohort &amp; what they hold today</div>
              <div className="aw-chapter-sub">who they are, and where the white space is</div>
            </div>
            <div className="aw-chapter-meta-row">
              <span className="aw-chapter-meta">{cfg.cohort.count.toLocaleString()} SMBs</span>
            </div>
          </div>

          <div className="b2b-cohort-body">
            <div className="b2b-summary">
              {cfg.cohort.summary.map((item) => (
                <div key={item.k} className="b2b-summary-item">
                  <span className="b2b-summary-v">{item.v}</span>
                  <span className="b2b-summary-k">{item.k}</span>
                </div>
              ))}
            </div>
            {cfg.cohort.holdingsLabel && (
              <div className="aw-chapter-sub">{cfg.cohort.holdingsLabel}</div>
            )}
            <div className="mini-bars-h">
              {cfg.cohort.holdings.map((h) => (
                <div className="mini-bar-h-row" key={h.p}>
                  <span className="mini-bar-h-label">{h.p}</span>
                  <div className="mini-bar-h-track">
                    <div className="mini-bar-h-fill" style={{ width: h.pct + "%" }} />
                  </div>
                  <span className="mini-bar-h-val">{h.pct}%</span>
                </div>
              ))}
            </div>
            <div className="aw-hero-rangenote">{cfg.cohort.read}</div>
          </div>
        </section>

        {/* ============== CHAPTER 03 · HYPOTHESES ============== */}
        <section className="aw-chapter">
          <div className="aw-chapter-h">
            <div className="aw-chapter-num">03</div>
            <div className="aw-chapter-accent" />
            <div className="aw-chapter-text">
              <div className="aw-chapter-title">Hypotheses to test</div>
              <div className="aw-chapter-sub">pick one to carry forward</div>
            </div>
            <div className="aw-chapter-meta-row">
              <span className="aw-chapter-meta">{cfg.hypotheses.length} options</span>
            </div>
          </div>

          <div className="reason-list">
            {cfg.hypotheses.map((h) => (
              <button
                key={h.id}
                type="button"
                className={"reason-card" + (selectedHyp === h.id ? " sel" : "")}
                onClick={() => setSelectedHyp(h.id)}
              >
                <div className="reason-body">
                  <div className="reason-title">
                    {h.name}
                    {h.star && <span className="b2b-hyp-rec">★ Recommended</span>}
                  </div>
                  <div className="reason-detail">{h.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ============== FOOTER CTA ============== */}
        <div className="aw-footer-cta">
          <button className="aw-btn ghost" onClick={back}>← Back to dashboard</button>
          <button className="aw-btn primary" onClick={configureRun}>Configure &amp; run →</button>
        </div>

      </div>
    </div>
  );
}
