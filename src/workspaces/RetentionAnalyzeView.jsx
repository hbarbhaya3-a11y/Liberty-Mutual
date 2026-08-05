/* ============================================================================
   RetentionAnalyzeView — Hypothesis Detail for Deposit Retention theme.

   Forked from AnalyzeWorkspace.jsx structure. Same chapters, same JSX
   class conventions (so analyse-workspace.css styles apply unchanged),
   different content + retention-specific mini-charts.

   Recommended hypothesis: H-RET-2026-05-14 (Targeted Deposit Defense).

   Sections (single scroll):
     1. Hero                         — recommended hypothesis + pre-sim KPI ranges
     2. Chapter 01 · Data + models   — 3 collapsible asset groups from retentionSensedAssets
     3. Chapter 02 · Drivers         — 5 reason cards with retention mini-charts
     4. Footer CTAs                  — back-to-theme + Test this hypothesis
   ========================================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppShell } from "@/state/AppShell";
import SenseAssetCard from "@/components/SenseAssetCard";
import Icon from "@/components/Icon";
import TestModeChooser from "@/components/TestModeChooser";
import retentionSensedAssets from "@/data/retentionSensedAssets";
import {
  RETENTION_REASON_CARDS,
  JOINT_SIGNAL_BINS,
  VOLATILITY_BARS,
  PRIMACY_DECAY,
  STICKINESS_DISTRIBUTION,
  PRODUCT_DEPTH,
} from "@/data/retentionCohortInsights";
import {
  RETENTION_HYPOTHESIS_ID,
  RETENTION_HYPOTHESIS_TITLE,
  RETENTION_PRESIM_RANGES,
} from "@/data/retentionConfig";
import "@/styles/analyse-workspace.css";

const GROUPS = [
  { id: "data",       title: "data streams composed",         expandedTitle: "Data streams" },
  { id: "detection",  title: "detection + context models",    expandedTitle: "Detection and context models" },
  { id: "guardrail",  title: "guardrail + predictive models", expandedTitle: "Guardrail and predictive models" },
];

/* ----------------------------------------------------------------------------
   Mini-chart 1 · JointSignalHistogram
   Vertical bar histogram of balance-decline % bands. 10-15% and 15-20% are
   the actionable target bands (highlighted ok). ~110px tall.
   -------------------------------------------------------------------------- */
function JointSignalHistogram() {
  const rows = JOINT_SIGNAL_BINS;
  const max = Math.max(...rows.map((r) => r.freq));
  const [hover, setHover] = useState(null);
  return (
    <div className="mini-chart">
      <div className="mini-bars-h">
        {rows.map((r, i) => (
          <div className="mini-bar-h-row" key={i}>
            <span className="mini-bar-h-label">{r.band}</span>
            <div className="mini-bar-h-track">
              <div
                className={`mini-bar-h-fill${r.target ? " ok" : ""}`}
                style={{ width: `${(r.freq / max) * 100}%` }}
                onMouseEnter={() => setHover({
                  label: r.band,
                  value: r.target
                    ? `${r.freq}% of cohort — actionable joint-signal target band`
                    : `${r.freq}% of cohort — outside the actionable band`,
                })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{r.freq}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        Joint occurrence of engagement drop + competitor quote-shopping concentrates at <b>10–20%</b> engagement decline — the Strategy A target.
      </div>
      {hover && (
        <div className="mini-chart-tip">
          <span className="mini-chart-tip-l">{hover.label}</span>
          <span className="mini-chart-tip-v">{hover.value}</span>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Mini-chart 2 · VolatilityBars
   Horizontal bars by operating-balance volatility ratio. Bands 1.5-2.5× are
   actionable.
   -------------------------------------------------------------------------- */
function VolatilityBars() {
  const rows = VOLATILITY_BARS;
  const max = Math.max(...rows.map((r) => r.pct));
  const [hover, setHover] = useState(null);
  return (
    <div className="mini-chart">
      <div className="mini-bars-h">
        {rows.map((r, i) => (
          <div className="mini-bar-h-row" key={i}>
            <span className="mini-bar-h-label">{r.ratio}</span>
            <div className="mini-bar-h-track">
              <div
                className={`mini-bar-h-fill${r.target ? " warn" : ""}`}
                style={{ width: `${(r.pct / max) * 100}%` }}
                onMouseEnter={() => setHover({
                  label: r.ratio,
                  value: r.target
                    ? `${r.pct}% of cohort — above the 2× median volatility threshold`
                    : `${r.pct}% — outside the volatility window`,
                })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{r.pct}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        59% of the cohort runs at <b>1.5×–2.5×</b> median volatility — the runoff-predictive band.
      </div>
      {hover && (
        <div className="mini-chart-tip">
          <span className="mini-chart-tip-l">{hover.label}</span>
          <span className="mini-chart-tip-v">{hover.value}</span>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Mini-chart 3 · PrimacyDecayBars
   Per-archetype paired bars: direct-deposit decay + bill-pay decay.
   Higher value = worse primacy (more decayed).
   -------------------------------------------------------------------------- */
function PrimacyDecayBars() {
  const rows = PRIMACY_DECAY;
  const [hover, setHover] = useState(null);
  return (
    <div className="mini-chart">
      <div className="mini-bars-h">
        {rows.map((r, i) => (
          <div className="mini-bar-h-row" key={i}>
            <span className="mini-bar-h-label">{r.archetype}</span>
            <div className="mini-bar-h-track" style={{ display: "flex", gap: "3px" }}>
              <div
                className={`mini-bar-h-fill${r.dd > 0.6 ? " bad" : r.dd > 0.4 ? " warn" : " ok"}`}
                style={{ width: `${r.dd * 50}%` }}
                onMouseEnter={() => setHover({ label: `${r.archetype} · engagement decay`, value: `${(r.dd*100).toFixed(0)}% engagement-decay score` })}
                onMouseLeave={() => setHover(null)}
              />
              <div
                className={`mini-bar-h-fill${r.bp > 0.6 ? " bad" : r.bp > 0.4 ? " warn" : " ok"}`}
                style={{ width: `${r.bp * 50}%` }}
                onMouseEnter={() => setHover({ label: `${r.archetype} · paperless decay`, value: `${(r.bp*100).toFixed(0)}% paperless-open decay score` })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{((r.dd + r.bp) / 2 * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        Silent Pre-Shopper shows the strongest joint decay — the Strategy B target before competitor shopping develops.
      </div>
      {hover && (
        <div className="mini-chart-tip">
          <span className="mini-chart-tip-l">{hover.label}</span>
          <span className="mini-chart-tip-v">{hover.value}</span>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Mini-chart 4 · StickinessDistribution
   Histogram by stickiness-discriminator score. Bins above 0.70 = sticky
   (UDAAP-protected, not eligible). Bins below = elastic (eligible).
   -------------------------------------------------------------------------- */
function StickinessDistribution() {
  const rows = STICKINESS_DISTRIBUTION;
  const max = Math.max(...rows.map((r) => r.pct));
  const [hover, setHover] = useState(null);
  return (
    <div className="mini-chart">
      <div className="mini-bars-h">
        {rows.map((r, i) => (
          <div className="mini-bar-h-row" key={i}>
            <span className="mini-bar-h-label">{r.bin}</span>
            <div className="mini-bar-h-track">
              <div
                className={`mini-bar-h-fill${r.sticky ? " bad" : " ok"}`}
                style={{ width: `${(r.pct / max) * 100}%` }}
                onMouseEnter={() => setHover({
                  label: r.bin,
                  value: r.sticky
                    ? `${r.pct}% — operationally sticky · NOT offered the rate (UDAAP-protected)`
                    : `${r.pct}% — genuinely elastic · eligible for Strategy A`,
                })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{r.pct}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        Gate at <b>0.70</b> — 40% of cohort scores above it (operationally anchored, protected from differential offer).
      </div>
      {hover && (
        <div className="mini-chart-tip">
          <span className="mini-chart-tip-l">{hover.label}</span>
          <span className="mini-chart-tip-v">{hover.value}</span>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Mini-chart 5 · ProductDepthBars
   Horizontal bars by product count. "1" is the amplified band — 49% of
   cohort, the structural amplifier of every other signal.
   -------------------------------------------------------------------------- */
function ProductDepthBars() {
  const rows = PRODUCT_DEPTH;
  const max = Math.max(...rows.map((r) => r.pct));
  const [hover, setHover] = useState(null);
  return (
    <div className="mini-chart">
      <div className="mini-bars-h">
        {rows.map((r, i) => (
          <div className="mini-bar-h-row" key={i}>
            <span className="mini-bar-h-label">{r.products} product{r.products === "1" ? "" : "s"}</span>
            <div className="mini-bar-h-track">
              <div
                className={`mini-bar-h-fill${r.amplified ? " bad" : ""}`}
                style={{ width: `${(r.pct / max) * 100}%` }}
                onMouseEnter={() => setHover({
                  label: `${r.products} product${r.products === "1" ? "" : "s"}`,
                  value: r.amplified
                    ? `${r.pct}% — single-line (unbundled) customers · 1.9× lapse amplifier`
                    : `${r.pct}% — multi-product anchor`,
                })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{r.pct}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        Single-product depth amplifies every other drift signal by <b>1.9×</b>.
      </div>
      {hover && (
        <div className="mini-chart-tip">
          <span className="mini-chart-tip-l">{hover.label}</span>
          <span className="mini-chart-tip-v">{hover.value}</span>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Chart dispatcher — keyed by RETENTION_REASON_CARDS[i].chart field
   -------------------------------------------------------------------------- */
function renderReasonChart(kind) {
  if (kind === "joint-signal")            return <JointSignalHistogram />;
  if (kind === "volatility-bars")          return <VolatilityBars />;
  if (kind === "primacy-decay")            return <PrimacyDecayBars />;
  if (kind === "stickiness-distribution")  return <StickinessDistribution />;
  if (kind === "product-depth")            return <ProductDepthBars />;
  return null;
}

/* ============================================================================
   RetentionAnalyzeView
   ========================================================================= */
export default function RetentionAnalyzeView() {
  const {
    selectedThemeId, selectedHypothesisId,
    selectTheme, selectHypothesis,
  } = useAppShell();
  const routerNavigate = useNavigate();

  // Fall back to recommended only if nothing is selected — don't override
  // an upstream selection (mirrors AnalyzeWorkspace's behaviour).
  useEffect(() => {
    if (!selectedThemeId) selectTheme("retention");
    if (!selectedHypothesisId) selectHypothesis(RETENTION_HYPOTHESIS_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [expandedGroups, setExpandedGroups] = useState({ data: true });
  const toggleGroup = (id) => setExpandedGroups((cur) => ({ ...cur, [id]: !cur[id] }));

  const [expandedAssetId, setExpandedAssetId] = useState(null);
  const toggleAsset = (id) => setExpandedAssetId((cur) => (cur === id ? null : id));

  const assetsByGroup = (g) => retentionSensedAssets.filter((a) => a.group === g);

  const [testMenuOpen, setTestMenuOpen] = useState(false);
  const goTest = () => {
    selectHypothesis(RETENTION_HYPOTHESIS_ID);
    setTestMenuOpen(true);
  };
  const goBackToTheme = () => routerNavigate("/theme?id=retention");

  return (
    <div className="aw theme-page" style={{ "--acc": "#ffb15a", "--acc-soft": "rgba(255,177,90,.13)" }}>
      <div className="wrap" style={{ padding: "12px 22px 30px" }}>

        {/* ============================ HERO ============================ */}
        <header className="aw-hero" style={{ padding: "16px 20px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 6 }}>
            <div>
              <div className="aw-hero-tag" style={{ marginBottom: 4 }}>
                <span className="aw-hero-star"><Icon name="star" size={12} /></span> Recommended hypothesis · {RETENTION_HYPOTHESIS_ID}
              </div>
              <h1 className="aw-hero-title" style={{ fontSize: 24, margin: "0 0 4px", lineHeight: 1.2 }}>{RETENTION_HYPOTHESIS_TITLE}</h1>
            </div>
            <div className="aw-hero-cta-row" style={{ marginTop: 2 }}>
              <button className="aw-btn ghost" onClick={goBackToTheme} style={{ padding: "6px 12px", fontSize: 12 }}>← Back to theme</button>
              <button className="aw-btn primary" onClick={goTest} style={{ padding: "6px 14px", fontSize: 12 }}>Test this hypothesis →</button>
            </div>
          </div>

          <p className="aw-hero-desc" style={{ fontSize: 12.5, margin: "0 0 10px", lineHeight: 1.45, maxWidth: 960 }}>
            <b>550,000 high-LTV auto customers · claims-free · competitor quote-shopping detected ~45 days before renewal.</b>{" "}
            Hold genuinely price-elastic customers using the smallest targeted incentive that works (capped renewal rate + retention offer) — backed by an audit-defensible fair-lending elasticity gate (<b>≥0.70 stickiness threshold</b>) to protect margin and prevent unnecessary discounting of deeply-bundled households.
          </p>

          {/* Pre-sim ranges */}
          <div className="aw-hero-kpis" style={{ padding: "8px 0", margin: "0 0 6px" }}>
            {RETENTION_PRESIM_RANGES.map((r, i) => (
              <div className="aw-hero-kpi" key={i} style={{ padding: "0 12px" }}>
                <span className="aw-hero-kpi-v" style={{ fontSize: 18 }}>{r.value}</span>
                <span className="aw-hero-kpi-l" style={{ fontSize: 9.5 }}>{r.label} {r.unit ? <em>{r.unit.includes("/") ? r.unit : `· ${r.unit}`}</em> : null}</span>
              </div>
            ))}
          </div>

          <div className="aw-hero-rangenote" style={{ marginTop: 2, paddingTop: 4, fontSize: 10.5 }}>
            Pre-simulation estimates from the optimizer. Running What-If simulation tightens each range into a point estimate with CI.
          </div>
        </header>

        {/* ============== CHAPTER 01 · DATA + MODELS ============== */}
        <section className="aw-chapter" id="aw-chapter-data">
          <div className="aw-chapter-h">
            <div className="aw-chapter-num">01</div>
            <div className="aw-chapter-accent" />
            <div className="aw-chapter-text">
              <div className="aw-chapter-title">Data + models composed</div>
            </div>
            <div className="aw-chapter-meta-row">
              <span className="aw-chapter-meta">{retentionSensedAssets.length} composed</span>
              <span className="aw-chapter-meta ok">MRM-approved</span>
              <span className="aw-chapter-meta ok">UDAAP-audited</span>
            </div>
          </div>

          <div className="aw-groups">
            {GROUPS.map((g) => {
              const assets = assetsByGroup(g.id);
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
                    <span className="aw-group-count">{assets.length}</span>
                    <span className="aw-group-title">
                      {open ? g.expandedTitle : g.title}
                    </span>
                    {!open && <span className="aw-group-hint">click to expand</span>}
                  </button>
                  {open && (
                    <div className="aw-group-body">
                      <div className="aw-sense-grid">
                        {assets.map((asset) => (
                          <SenseAssetCard
                            key={asset.id}
                            asset={asset}
                            isExpanded={expandedAssetId === asset.id}
                            onToggle={() => toggleAsset(asset.id)}
                          />
                        ))}
                      </div>
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
            <div className="aw-chapter-meta">5 weighted</div>
          </div>

          <div className="reason-list">
            {RETENTION_REASON_CARDS.map((r, i) => (
              <article className="reason-card" key={i}>
                <div className="reason-pct">{r.pct}<span className="reason-pct-pct">%</span></div>
                <div className="reason-body">
                  <div className="reason-title">{r.t}</div>
                  <div className="reason-detail">{r.d}</div>
                  {r.chart && (
                    <div className="reason-chart">
                      {renderReasonChart(r.chart)}
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
      <TestModeChooser open={testMenuOpen} onClose={() => setTestMenuOpen(false)} />
    </div>
  );
}
