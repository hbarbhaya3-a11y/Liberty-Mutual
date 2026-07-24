/* ============================================================================
   WealthAnalyzeView — Hypothesis Detail for Affluent / Wealth Attach.

   Forked from LiquidityAnalyzeView.jsx structure. Same chapters, same JSX
   class conventions (so analyse-workspace.css styles apply unchanged),
   different content + wealth-attach mini-charts.

   This is the validation screen: it argues WHY the bet is sound, pre-simulation.
   The specific wealth motion is NEVER prescribed here — only the white-space
   thesis and the evidence behind it.

   Recommended hypothesis: H-WEALTH-2026-06-29 (Convert advice-ready into
   wealth relationships).

   Sections (single scroll):
     1. Hero                         — recommended hypothesis + pre-sim KPI ranges
     2. Chapter 01 · Data + models   — 3 collapsible asset groups from wealthSensedAssets
     3. Chapter 02 · Drivers         — 5 reason cards with wealth mini-charts
     4. Footer CTAs                  — back-to-theme + Test this hypothesis
   ========================================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppShell } from "@/state/AppShell";
import { useSetPageContext } from "@/state/pageContext";
import SenseAssetCard from "@/components/SenseAssetCard";
import Icon from "@/components/Icon";
import TestModeChooser from "@/components/TestModeChooser";
import wealthSensedAssets from "@/data/wealthSensedAssets";
import {
  WEALTH_REASON_CARDS,
  JOINT_SIGNAL_BINS,
  VOLATILITY_BARS,
  PRIMACY_DECAY,
  STICKINESS_DISTRIBUTION,
  PRODUCT_DEPTH,
} from "@/data/wealthCohortInsights";
import {
  WEALTH_HYPOTHESIS_ID,
  WEALTH_PRESIM_RANGES,
  wealthHypothesis,
} from "@/data/wealthConfig";
import "@/styles/analyse-workspace.css";

const GROUPS = [
  { id: "data",       title: "data streams composed",         expandedTitle: "Data streams" },
  { id: "detection",  title: "detection + context models",    expandedTitle: "Detection and context models" },
  { id: "guardrail",  title: "guardrail + predictive models", expandedTitle: "Guardrail and predictive models" },
];

/* ----------------------------------------------------------------------------
   Mini-chart 1 · JointSignalHistogram
   Vertical bar histogram of investable-assets-held-outside $ bands. $100-250K
   and $250-500K are the actionable target bands (highlighted ok). ~110px tall.
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
                    ? `${r.freq}% of cohort — actionable investable-assets-held-outside target band`
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
        Investable assets held outside concentrate at <b>$100–500K</b> — the advice-ready core the attach motion targets.
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
   Horizontal bars by external-movement intensity band. The early/active bands
   are the actionable window.
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
                    ? `${r.pct}% of cohort — external movement underway but not yet committed`
                    : `${r.pct}% — outside the actionable external-movement window`,
                })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{r.pct}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        49% of the cohort is in <b>early–active</b> external movement — moving assets out, but not yet committed elsewhere.
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
   Per-archetype paired bars: digital-intent + surplus-balance index.
   Higher value = further along the advice-readiness progression.
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
                onMouseEnter={() => setHover({ label: `${r.archetype} · digital intent`, value: `${(r.dd*100).toFixed(0)}% advice-readiness digital-intent index` })}
                onMouseLeave={() => setHover(null)}
              />
              <div
                className={`mini-bar-h-fill${r.bp > 0.6 ? " bad" : r.bp > 0.4 ? " warn" : " ok"}`}
                style={{ width: `${r.bp * 50}%` }}
                onMouseEnter={() => setHover({ label: `${r.archetype} · surplus balance`, value: `${(r.bp*100).toFixed(0)}% surplus-balance index` })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{((r.dd + r.bp) / 2 * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        Advice-Ready Deepener shows the strongest joint intent + surplus signal — a genuine advice-need, not just a balance spike.
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
   Histogram by suitability-discriminator score. Bins below 0.55 = unsuitable /
   spoken-for households (NOT eligible). Bins above = advice-ready, activatable.
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
                    ? `${r.pct}% — unsuitable / spoken-for · NOT routed to an advisor (fair-treatment held out)`
                    : `${r.pct}% — advice-ready household · eligible for the wealth conversation`,
                })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{r.pct}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        Gate at <b>0.55</b> — 34% of cohort scores below it (unsuitable / spoken-for, held out of the offer).
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
   Horizontal bars by current banking product count. "3" is the amplified band —
   the deepest-trust core to start the wealth conversation with.
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
                    ? `${r.pct}% — deep banking relationship · highest-trust core to start the wealth conversation`
                    : `${r.pct}% — shallower banking relationship`,
                })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{r.pct}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        Deep banking relationships (3+ products) convert best — <b>55%</b> of the cohort, the highest-trust core.
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
   Chart dispatcher — keyed by WEALTH_REASON_CARDS[i].chart field
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
   WealthAnalyzeView
   ========================================================================= */
export default function WealthAnalyzeView() {
  const {
    selectedThemeId, selectedHypothesisId,
    selectTheme, selectHypothesis,
  } = useAppShell();
  const routerNavigate = useNavigate();
  useSetPageContext("analyze", null);

  // Fall back to recommended only if nothing is selected — don't override
  // an upstream selection (mirrors AnalyzeWorkspace's behaviour).
  useEffect(() => {
    if (!selectedThemeId) selectTheme("wealth");
    if (!selectedHypothesisId) selectHypothesis(WEALTH_HYPOTHESIS_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (id) => setExpandedGroups((cur) => ({ ...cur, [id]: !cur[id] }));

  const [expandedAssetId, setExpandedAssetId] = useState(null);
  const toggleAsset = (id) => setExpandedAssetId((cur) => (cur === id ? null : id));

  const assetsByGroup = (g) => wealthSensedAssets.filter((a) => a.group === g);

  const [testMenuOpen, setTestMenuOpen] = useState(false);
  // Resolve the clicked hypothesis (A/B/C) so each card shows its own title +
  // lead — mirrors LiquidityAnalyzeView's liquidityHypothesis() resolution.
  const detailHyp = wealthHypothesis(selectedHypothesisId || WEALTH_HYPOTHESIS_ID);
  const goTest = (hypId = detailHyp.id) => {
    selectHypothesis(hypId);
    setTestMenuOpen(true);
  };
  const goBackToTheme = () => routerNavigate("/theme?id=wealth");

  return (
    <div className="aw theme-page" style={{ "--acc": "#14b8a6", "--acc-soft": "rgba(20,184,166,.13)" }}>
      <div className="wrap">

        {/* ===================== HERO · selected hypothesis ===================== */}
        <header className="aw-hero">
          <div className="aw-hero-tag">
            {detailHyp.recommended
              ? <><span className="aw-hero-star"><Icon name="star" size={12} /></span> Recommended hypothesis · {detailHyp.id}</>
              : <>Hypothesis {detailHyp.rank} · {detailHyp.id}</>}
          </div>
          <h1 className="aw-hero-title">{detailHyp.title}</h1>
          <p className="aw-hero-desc">{detailHyp.lead}</p>
          <div className="aw-hero-kpis">
            {WEALTH_PRESIM_RANGES.map((r, i) => (
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
            <button className="aw-btn ghost" onClick={goBackToTheme}>← Back to signals</button>
            <button className="aw-btn primary" onClick={() => goTest(detailHyp.id)}>Configure scenario →</button>
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
              <span className="aw-chapter-meta">{wealthSensedAssets.length} composed</span>
              <span className="aw-chapter-meta ok">MRM-approved</span>
              <span className="aw-chapter-meta ok">Suitability-audited</span>
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
            <div className="aw-chapter-meta">5 drivers · model weight %</div>
          </div>

          <div className="reason-list">
            {WEALTH_REASON_CARDS.map((r, i) => (
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
          <button className="aw-btn ghost" onClick={goBackToTheme}><Icon name="arrowLeft" size={14} /> Back to signals</button>
          <button className="aw-btn primary" onClick={() => goTest(detailHyp.id)}>Configure scenario <Icon name="arrowRight" size={14} /></button>
        </div>

      </div>
      <TestModeChooser open={testMenuOpen} onClose={() => setTestMenuOpen(false)} eyebrow={"TESTING · " + detailHyp.title.toUpperCase()} />
    </div>
  );
}
