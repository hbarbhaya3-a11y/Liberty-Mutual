/* ============================================================================
   AnalyzeWorkspace — Hypothesis Detail (single scrollable page).

   Visual-first surface for the recommended hypothesis (Trust-Aware Ceiling
   Lift, H-2026-04-12). Every reason has an inline chart; cohort coverage and
   fairness safe-zone get their own medium panels; evidence (composed assets)
   is collapsed by default.

   Sections (all live in one scroll):
     1. Hero                       — recommended hypothesis + predicted impact
     2. Why this is happening      — 5 reasons, each with an inline chart
     3. Who's affected             — CohortWaterfall
     4. Why the trust gate works   — FairnessSafeZone heatmap
     5. What powers this insight   — 3 collapsible asset groups
     6. Footer CTAs                — back-to-theme + Test this
   ========================================================================= */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppShell, DEFAULT_THEME_ID, DEFAULT_HYPOTHESIS_ID } from "@/state/AppShell";
import RetentionAnalyzeView from "@/workspaces/RetentionAnalyzeView";
import LiquidityAnalyzeView from "@/workspaces/LiquidityAnalyzeView";
import WealthAnalyzeView from "@/workspaces/WealthAnalyzeView";
import B2BClusterView from "@/workspaces/B2BClusterView";
import SmbRateAnalyzeView from "@/workspaces/SmbRateAnalyzeView";
import SmbRateFlowView from "@/workspaces/SmbRateFlowView";
import SmbGrowthAnalyzeView from "@/workspaces/SmbGrowthAnalyzeView";
import { isB2B } from "@/data/b2bConfigs";
import SenseAssetCard from "@/components/SenseAssetCard";
import sensedAssets from "@/data/sensedAssets";
import Icon from "@/components/Icon";
import TestModeChooser from "@/components/TestModeChooser";
import RentHistogram from "@/components/charts/RentHistogram";
/* CohortWaterfall + FairnessSafeZone imports removed — those charts were
   parameterized by lever values that don't exist until the Simulate
   workbench. They live there now, not on the hypothesis-design page. */
import {
  VERIFIED_PATTERN_DEPTH,
  FRICTION_CONCENTRATION,
} from "@/data/cohortInsights";
import "@/styles/analyse-workspace.css";

const RECOMMENDED_HYPOTHESIS_ID = "H-2026-04-12";

const GROUPS = [
  { id: "data",       title: "data streams composed",          expandedTitle: "Data streams" },
  { id: "detection",  title: "detection + context models",     expandedTitle: "Detection and context models" },
  { id: "guardrail",  title: "guardrail + predictive models",  expandedTitle: "Guardrail and predictive models" },
];

/* ----------------------------------------------------------------------------
   Mini-chart 1: VerifiedPatternDepthBars
   Horizontal bars by recurrence months bucket. ~80px tall.
   -------------------------------------------------------------------------- */
function VerifiedPatternDepthBars() {
  const rows = VERIFIED_PATTERN_DEPTH.buckets;
  const max = Math.max(...rows.map((r) => r.share));
  const [hover, setHover] = useState(null);
  const labels = {
    "22+ mo":   "long-history landlords (would pass 18mo trust gate)",
    "12-21 mo": "mid-history landlords (pass at lower gate)",
    "<12 mo":   "short-history landlords (would not pass yet)",
  };
  return (
    <div className="mini-chart">
      <div className="mini-bars-h">
        {rows.map((r, i) => {
          const isOver = r.bucket === "22+ mo";
          return (
            <div className="mini-bar-h-row" key={i}>
              <span className="mini-bar-h-label">{r.bucket}</span>
              <div className="mini-bar-h-track">
                <div
                  className={`mini-bar-h-fill${isOver ? " ok" : ""}`}
                  style={{ width: `${(r.share / max) * 100}%` }}
                  onMouseEnter={() => setHover({ label: r.bucket, value: `${r.share}% — ${labels[r.bucket]}` })}
                  onMouseLeave={() => setHover(null)}
                />
              </div>
              <span className="mini-bar-h-val">{r.share}%</span>
            </div>
          );
        })}
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
   Mini-chart 2: FrictionConcentrationBars
   Two stacked horizontal bars: Fri 4-8 PM vs other times. ~80px tall.
   -------------------------------------------------------------------------- */
function FrictionConcentrationBars() {
  const rows = FRICTION_CONCENTRATION.windows;
  const max = Math.max(...rows.map((r) => r.share));
  const [hover, setHover] = useState(null);
  return (
    <div className="mini-chart">
      <div className="mini-bars-h">
        {rows.map((r, i) => {
          const isWindow = r.window === "Fri 4-8 PM";
          return (
            <div className="mini-bar-h-row" key={i}>
              <span className="mini-bar-h-label">{r.window}</span>
              <div className="mini-bar-h-track">
                <div
                  className={`mini-bar-h-fill${isWindow ? " warn" : ""}`}
                  style={{ width: `${(r.share / max) * 100}%` }}
                  onMouseEnter={() => setHover({
                    label: r.window,
                    value: isWindow
                      ? `${r.share}% of all failures — the policy window`
                      : `${r.share}% — every other hour of the week combined`,
                  })}
                  onMouseLeave={() => setHover(null)}
                />
              </div>
              <span className="mini-bar-h-val">{r.share}%</span>
            </div>
          );
        })}
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
   Mini-chart 3: DisparityBar
   Side-by-side bars: verified 17.3% vs thin-file 26.2%. 1.6× ratio callout.
   -------------------------------------------------------------------------- */
function DisparityBar() {
  const rows = [
    { label: "Verified file", rate: 17.3, kind: "ok" },
    { label: "Thin file",     rate: 26.2, kind: "bad" },
  ];
  const max = Math.max(...rows.map((r) => r.rate));
  const [hover, setHover] = useState(null);
  return (
    <div className="mini-chart">
      <div className="mini-bars-h">
        {rows.map((r, i) => (
          <div className="mini-bar-h-row" key={i}>
            <span className="mini-bar-h-label">{r.label}</span>
            <div className="mini-bar-h-track">
              <div
                className={`mini-bar-h-fill ${r.kind}`}
                style={{ width: `${(r.rate / max) * 100}%` }}
                onMouseEnter={() => setHover({
                  label: r.label,
                  value: `${r.rate}% of rent-day payments blocked`,
                })}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            <span className="mini-bar-h-val">{r.rate}%</span>
          </div>
        ))}
      </div>
      <div className="mini-chart-foot">
        Thin-file customers absorb <b>1.6×</b> more blocked payments than verified peers.
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
   Reason rows
   -------------------------------------------------------------------------- */
const REASON_CARDS = [
  {
    pct: 88,
    title: "Rent payments fail the velocity gate",
    detail: "Typical rent is $1,425 · the current RTP velocity gate stops payments above $1,200 for accounts without an established pattern with the counterparty.",
    chart: "rent",
  },
  {
    pct: 81,
    title: "Trusted landlord is scored as new",
    detail: "22-month recurring payment pattern is on file, but the system still treats this landlord as a generic counterparty when the RTP gate evaluates.",
    chart: "depth",
  },
  {
    pct: 74,
    title: "Friction concentrates Fri 4–8 PM",
    detail: "Two-thirds of failed rent-day payments happen inside the payout window — the only window where same-hour settle (RTP) is required, not preferred.",
    chart: "friction",
  },
  {
    pct: 69,
    title: "ACH is the fallback — and it's too slow",
    detail: "When RTP blocks, customers fall through to ACH (next-day settle). ACH clears too late for Friday-evening rent.",
    chart: null,
  },
  {
    pct: 63,
    title: "Thin-file customers absorb the failures",
    detail: "Customers without a long verified history are blocked 1.6× more often than peers with the same income — the RTP gate has nothing to weigh them against.",
    chart: "disparity",
  },
];

function renderReasonChart(kind) {
  if (kind === "rent")     return <RentHistogram currentCeiling={1200} liftPct={20} compact />;
  if (kind === "depth")    return <VerifiedPatternDepthBars />;
  if (kind === "friction") return <FrictionConcentrationBars />;
  if (kind === "disparity") return <DisparityBar />;
  return null;
}

export default function AnalyzeWorkspace() {
  const {
    selectedThemeId, selectedHypothesisId,
    navigate: shellNavigate, selectTheme, selectHypothesis,
  } = useAppShell();
  const routerNavigate = useNavigate();

  // Respect whatever theme/hypothesis the user picked upstream. Only fall
  // back to the recommended defaults if NOTHING is selected — otherwise the
  // page silently snaps users back to the trust-aware lift after they
  // clicked a different signal.
  useEffect(() => {
    if (!selectedThemeId) selectTheme(DEFAULT_THEME_ID);
    if (!selectedHypothesisId) selectHypothesis(RECOMMENDED_HYPOTHESIS_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (id) => setExpandedGroups((cur) => ({ ...cur, [id]: !cur[id] }));

  const [expandedAssetId, setExpandedAssetId] = useState(null);
  const toggleAsset = (id) => setExpandedAssetId((cur) => (cur === id ? null : id));

  const assetsByGroup = (g) => sensedAssets.filter((a) => a.group === g);

  // Pressing "Test this hypothesis" opens a modal where the user picks
  // Autopilot or Guided — both modes pre-select the hypothesis and drive
  // SimulateWorkspace's behaviour on mount.
  const [testMenuOpen, setTestMenuOpen] = useState(false);
  const goTest = () => {
    selectHypothesis(RECOMMENDED_HYPOTHESIS_ID);
    setTestMenuOpen(true);
  };
  const goBackToTheme = () => routerNavigate("/theme?id=gig");

  // Retention theme: dispatch to RetentionAnalyzeView. Placed AFTER all
  // hook declarations to satisfy the Rules of Hooks — early-return before
  // hooks would crash on any theme switch (different hook count per render).
  if (selectedThemeId === "retention") {
    return <RetentionAnalyzeView />;
  }
  if (selectedThemeId === "liquidity") {
    return <LiquidityAnalyzeView />;
  }
  if (selectedThemeId === "wealth") {
    return <WealthAnalyzeView />;
  }
  if (selectedThemeId === "smbrate") {
    return <SmbRateFlowView />;
  }
  if (selectedThemeId === "smbgrowth") {
    return <SmbGrowthAnalyzeView />;
  }
  if (isB2B(selectedThemeId)) {
    return <B2BClusterView />;
  }

  return (
    <div className="aw theme-page">
      <div className="wrap">

        {/* ============================ HERO ============================ */}
        <header className="aw-hero">
          <div className="aw-hero-tag">
            <span className="aw-hero-star"><Icon name="star" size={12} /></span> Recommended hypothesis · H-2026-04-12
          </div>
          <h1 className="aw-hero-title">Verified-Landlord RTP Enablement</h1>
          <p className="aw-hero-desc">
            We believe that enabling RTP for customers with an 18-month verified
            recurring-counterparty pattern will let rent-day payments settle
            same-hour instead of falling through to next-day ACH — reducing
            blocked outbound payments without breaching the 0.85 fair-lending
            floor or increasing fraud loss.
          </p>
          {/* Pre-sim ranges — these are estimator output, not point
              predictions. The whole point of running the What-If simulation
              is to tighten this range into a CI. */}
          <div className="aw-hero-kpis">
            <div className="aw-hero-kpi">
              <span className="aw-hero-kpi-v">+$4–7M</span>
              <span className="aw-hero-kpi-l">Net Interest Income / yr <em>· est. range</em></span>
            </div>
            <div className="aw-hero-kpi">
              <span className="aw-hero-kpi-v">−180K to −280K</span>
              <span className="aw-hero-kpi-l">blocked payments / yr <em>· est. range</em></span>
            </div>
            <div className="aw-hero-kpi">
              <span className="aw-hero-kpi-v">0.92–0.96</span>
              <span className="aw-hero-kpi-l">fair-lending ratio (DI) <em>· est. range</em></span>
            </div>
            <div className="aw-hero-kpi">
              <span className="aw-hero-kpi-v">−2,400 to −4,200</span>
              <span className="aw-hero-kpi-l">complaints / yr <em>· est. range</em></span>
            </div>
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

        {/* ============== DATA + MODELS (first — substrate of the analysis)
            The storyline reads: here is the data + models composed →
            here are the insights derived → here is the hypothesis we
            landed on. Data leading the page sells the credibility of
            what follows; the chapters after read as analysis, not opinion. */}
        <section className="aw-chapter" id="aw-chapter-data">
          <div className="aw-chapter-h">
            <div className="aw-chapter-num">01</div>
            <div className="aw-chapter-accent" />
            <div className="aw-chapter-text">
              <div className="aw-chapter-title">Data + models composed</div>
            </div>
            <div className="aw-chapter-meta-row">
              <span className="aw-chapter-meta">{sensedAssets.length} composed</span>
              <span className="aw-chapter-meta ok">MRM-approved</span>
              <span className="aw-chapter-meta ok">ECOA-compliant</span>
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

        {/* ============== DRIVERS (insights derived from the data above) ==== */}
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
            {REASON_CARDS.map((r, i) => (
              <article className="reason-card" key={i}>
                <div className="reason-pct">{r.pct}<span className="reason-pct-pct">%</span></div>
                <div className="reason-body">
                  <div className="reason-title">{r.title}</div>
                  <div className="reason-detail">{r.detail}</div>
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

        {/* Cohort coverage + Fair-lending chapters removed — both charts
            (CohortWaterfall, FairnessSafeZone) were rendered with hardcoded
            lever values (trustGate=18, rolloutPct=60, liftPct=20). Those
            are test-design choices the user makes downstream in Simulate;
            showing them on the hypothesis-design page conflated design
            with testing. Cohort size already appears in the hero KPIs.

            Hypothesis Synthesis section removed — it restated what the
            Data + Drivers chapters already said. The hero at the top of
            the page IS the hypothesis; a second "synthesised hypothesis"
            block underneath was duplicate restatement. */}

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
