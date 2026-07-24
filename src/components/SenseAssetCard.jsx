import React, { useEffect, useRef, useState } from "react";

/* ============================================================================
   SenseAssetCard
   ----------------------------------------------------------------------------
   The composed-asset card from SENSE.

   Collapsed: ~140px tall, group glyph + name + subtitle + quick numbers +
   "↳ Informs" line.

   Expanded: grows to span the full grid row (the parent grid handles the
   row-span via CSS — this card emits .sense-asset-expanded which sets
   `grid-column: 1 / -1`). Surrounding cards push down naturally.

   Content blocks (5 for full drillDown, 3 for drillDownLight):
     ① Provenance (KV grid)
     ② For this signal (KV grid, bigger values)
     ③ Visualization — type-driven: 'distribution' | 'grid' | 'components'
     ④ Composition chain (↑ Feeds into / ↓ Fed by)
     ⑤ Links (chips)

   Props
     asset       composed-asset data object
     isExpanded  boolean
     onToggle    () => void
   ========================================================================== */

const GROUP_GLYPHS = {
  data: "⚙",
  detection: "🧠",
  guardrail: "🛡",
};

const GROUP_LABELS = {
  data: "data stream",
  detection: "detection + context model",
  guardrail: "guardrail + predictive model",
};

function KVGrid({ kv, size = "sm" }) {
  if (!kv) return null;
  // Accepts either an array of [k,v] tuples, an array of {k,v} objects,
  // or a plain object. Normalize to entries.
  const entries = Array.isArray(kv)
    ? kv.map((row) =>
        Array.isArray(row) ? row : [row.k ?? row.label, row.v ?? row.value]
      )
    : Object.entries(kv);
  return (
    <dl className={`sense-asset-kv sense-asset-kv-${size}`}>
      {entries.map(([k, v], i) => (
        <React.Fragment key={i}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/* Adapter: the data layer (sensedAssets.js) writes the richer "data" shape:
     distribution → { data: { title, buckets: [{label, share, marker?}], marker } }
     grid         → { data: { title, cols, rows, cells: [[...]], cohortDistribution } }
     components   → { data: { title, components: [{name, weight}], distribution } }
   This component expects the flat shape: { type, title, rows, cols, footnote }.
   Normalize before render. */
function normalizeViz(viz) {
  if (!viz) return null;
  if (!viz.data) return viz; // already flat
  const { type, data } = viz;
  const title = data.title || viz.title;
  if (type === "distribution") {
    return {
      type, title,
      rows: (data.buckets || []).map((b) => ({
        label: b.label,
        pct: b.share,
        note: b.marker ? "←" : undefined,
      })),
      footnote: data.marker ? data.marker.label : undefined,
    };
  }
  if (type === "grid") {
    const cells2D = data.cells || [];
    return {
      type, title,
      cols: data.cols || [],
      rows: (data.rows || []).map((rowLabel, ri) => ({
        label: rowLabel,
        cells: (cells2D[ri] || []).map((c) => ({
          text: c.label,
          highlight: !!c.marker,
        })),
      })),
      footnote: data.cohortDistribution
        ? `Cohort concentrates in: ${data.cohortDistribution
            .filter((d) => d.count > 0)
            .map((d) => `${d.cell} (${d.count.toLocaleString()})`)
            .join(", ")}`
        : undefined,
    };
  }
  if (type === "components") {
    // Components data has both scoring components AND a distribution.
    // We render the components as the primary; distribution as footnote text.
    return {
      type, title,
      rows: (data.components || []).map((c) => ({
        label: c.name,
        weight: Math.round((c.weight || 0) * 100),
      })),
      footnote: data.distribution
        ? `Cohort distribution: ${data.distribution
            .map((b) => `${b.label} ${b.share}%${b.marker ? " ← threshold" : ""}`)
            .join(" · ")}`
        : undefined,
    };
  }
  return viz;
}

function Visualization({ viz: rawViz }) {
  const viz = normalizeViz(rawViz);
  if (!viz) return null;
  const { type, title } = viz;

  if (type === "distribution") {
    // Horizontal bars. rows: [{ label, pct, note? }]
    const rows = viz.rows || [];
    const max = rows.reduce((m, r) => Math.max(m, r.pct || 0), 0) || 1;
    return (
      <div className="sense-asset-viz sense-asset-viz-distribution">
        {title && <div className="sense-asset-viz-title">{title}</div>}
        <div className="sense-asset-bars">
          {rows.map((r, i) => (
            <div className="sense-asset-bar-row" key={i}>
              <span className="sense-asset-bar-label">{r.label}</span>
              <div className="sense-asset-bar-track">
                <div
                  className="sense-asset-bar-fill"
                  style={{ width: `${((r.pct || 0) / max) * 100}%` }}
                />
              </div>
              <span className="sense-asset-bar-val">
                {r.pct != null ? `${r.pct}%` : ""}
              </span>
              {r.note && <span className="sense-asset-bar-note">{r.note}</span>}
            </div>
          ))}
        </div>
        {viz.footnote && (
          <div className="sense-asset-viz-foot">{viz.footnote}</div>
        )}
      </div>
    );
  }

  if (type === "grid") {
    // 2D matrix. cols: [labels], rows: [{ label, cells: [{ text, highlight? }] }]
    const cols = viz.cols || [];
    const rows = viz.rows || [];
    return (
      <div className="sense-asset-viz sense-asset-viz-grid">
        {title && <div className="sense-asset-viz-title">{title}</div>}
        <div
          className="sense-asset-matrix"
          style={{ gridTemplateColumns: `auto repeat(${cols.length}, 1fr)` }}
        >
          <div className="sense-asset-matrix-corner" />
          {cols.map((c, i) => (
            <div key={`c${i}`} className="sense-asset-matrix-col">
              {c}
            </div>
          ))}
          {rows.map((r, ri) => (
            <React.Fragment key={`r${ri}`}>
              <div className="sense-asset-matrix-row-h">{r.label}</div>
              {r.cells.map((cell, ci) => (
                <div
                  key={`cell-${ri}-${ci}`}
                  className={`sense-asset-matrix-cell${
                    cell.highlight ? " sense-asset-matrix-cell-hl" : ""
                  }`}
                >
                  {cell.text}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        {viz.footnote && (
          <div className="sense-asset-viz-foot">{viz.footnote}</div>
        )}
      </div>
    );
  }

  if (type === "components") {
    // Labeled weighted bar list. rows: [{ label, weight, note? }]
    const rows = viz.rows || [];
    const max = rows.reduce((m, r) => Math.max(m, r.weight || 0), 0) || 1;
    return (
      <div className="sense-asset-viz sense-asset-viz-components">
        {title && <div className="sense-asset-viz-title">{title}</div>}
        <div className="sense-asset-components">
          {rows.map((r, i) => (
            <div className="sense-asset-component-row" key={i}>
              <span className="sense-asset-component-label">{r.label}</span>
              <div className="sense-asset-component-track">
                <div
                  className="sense-asset-component-fill"
                  style={{ width: `${((r.weight || 0) / max) * 100}%` }}
                />
              </div>
              <span className="sense-asset-component-val">
                {r.weight != null ? r.weight : ""}
              </span>
              {r.note && (
                <span className="sense-asset-component-note">{r.note}</span>
              )}
            </div>
          ))}
        </div>
        {viz.footnote && (
          <div className="sense-asset-viz-foot">{viz.footnote}</div>
        )}
      </div>
    );
  }

  return null;
}

function CompositionChain({ chain }) {
  if (!chain) return null;
  const feedsInto = chain.feedsInto || [];
  const fedBy = chain.fedBy || [];
  return (
    <div className="sense-asset-chain">
      <div className="sense-asset-chain-row">
        <span className="sense-asset-chain-arrow sense-asset-chain-up">↑</span>
        <span className="sense-asset-chain-label">Feeds into:</span>
        <ul className="sense-asset-chain-list">
          {feedsInto.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </div>
      <div className="sense-asset-chain-row">
        <span className="sense-asset-chain-arrow sense-asset-chain-down">↓</span>
        <span className="sense-asset-chain-label">Fed by:</span>
        <ul className="sense-asset-chain-list">
          {fedBy.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Links({ links }) {
  if (!links || links.length === 0) return null;
  return (
    <div className="sense-asset-links">
      {links.map((l, i) => {
        const label = typeof l === "string" ? l : l.label;
        const href = typeof l === "string" ? null : l.href;
        if (href) {
          return (
            <a key={i} href={href} className="sense-asset-link-chip">
              → {label}
            </a>
          );
        }
        return (
          <span key={i} className="sense-asset-link-chip">
            → {label}
          </span>
        );
      })}
    </div>
  );
}

export default function SenseAssetCard({ asset, isExpanded, onToggle }) {
  if (!asset) return null;
  const { group, name, subtitle, quickNumbers, informs } = asset;
  const drill = asset.drillDown || asset.drillDownLight || null;
  const isLight = !asset.drillDown && !!asset.drillDownLight;
  const glyph = GROUP_GLYPHS[group] || "◆";
  const groupLabel = GROUP_LABELS[group] || "asset";

  // Animate content fade-in shortly after expansion begins so the width
  // animation reads as "expand → reveal" rather than a single pop.
  const [showContent, setShowContent] = useState(isExpanded);
  const fadeTimerRef = useRef(null);
  useEffect(() => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (isExpanded) {
      fadeTimerRef.current = setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(false);
    }
    return () => fadeTimerRef.current && clearTimeout(fadeTimerRef.current);
  }, [isExpanded]);

  // ESC closes any expanded card.
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e) => {
      if (e.key === "Escape" && onToggle) onToggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isExpanded, onToggle]);

  if (!isExpanded) {
    return (
      <button
        type="button"
        className={`sense-asset sense-asset-group-${group}`}
        onClick={onToggle}
        aria-expanded="false"
        aria-label={`Expand ${name}`}
      >
        <div className="sense-asset-glyph-row">
          <span className="sense-asset-glyph" aria-hidden="true">
            {glyph}
          </span>
        </div>
        <div className="sense-asset-name">{name}</div>
        {subtitle && <div className="sense-asset-sub">{subtitle}</div>}
        {quickNumbers && (
          <div className="sense-asset-quick">{quickNumbers}</div>
        )}
        {informs && (
          <div className="sense-asset-informs">↳ {informs}</div>
        )}
      </button>
    );
  }

  // Expanded: header + content blocks.
  return (
    <div
      className={`sense-asset sense-asset-expanded sense-asset-group-${group}`}
      role="region"
      aria-expanded="true"
      aria-label={name}
    >
      <header className="sense-asset-x-header">
        <span className="sense-asset-x-glyph" aria-hidden="true">
          {glyph}
        </span>
        <div className="sense-asset-x-title">
          <div className="sense-asset-x-group">{groupLabel}</div>
          <div className="sense-asset-x-name">{name}</div>
          {subtitle && <div className="sense-asset-x-sub">{subtitle}</div>}
        </div>
        <button
          type="button"
          className="sense-asset-x-close"
          onClick={onToggle}
          aria-label="Collapse"
        >
          ×
        </button>
      </header>

      <div
        className={`sense-asset-x-body${
          showContent ? " sense-asset-x-body-visible" : ""
        }`}
      >
        <div className="sense-asset-x-row sense-asset-x-row-2">
          {drill?.provenance && (
            <div className="sense-asset-block">
              <div className="sense-asset-block-h">
                <span className="sense-asset-block-n">①</span> Provenance
              </div>
              <KVGrid kv={drill.provenance} size="sm" />
            </div>
          )}
          {drill?.forThisSignal && (
            <div className="sense-asset-block">
              <div className="sense-asset-block-h">
                <span className="sense-asset-block-n">②</span> For this signal
              </div>
              <KVGrid kv={drill.forThisSignal} size="lg" />
            </div>
          )}
        </div>

        {drill?.visualization && (
          <div className="sense-asset-block sense-asset-block-wide">
            <div className="sense-asset-block-h">
              <span className="sense-asset-block-n">③</span>{" "}
              {drill.visualization.title || "Visualization"}
            </div>
            <Visualization viz={drill.visualization} />
          </div>
        )}

        {drill?.compositionChain && (
          <div className="sense-asset-block sense-asset-block-wide">
            <div className="sense-asset-block-h">
              <span className="sense-asset-block-n">
                {isLight ? "③" : "④"}
              </span>{" "}
              Composition chain
            </div>
            <CompositionChain chain={drill.compositionChain} />
          </div>
        )}

        {drill?.links && drill.links.length > 0 && (
          <div className="sense-asset-block sense-asset-block-wide">
            <div className="sense-asset-block-h">
              <span className="sense-asset-block-n">⑤</span> Links
            </div>
            <Links links={drill.links} />
          </div>
        )}
      </div>
    </div>
  );
}
