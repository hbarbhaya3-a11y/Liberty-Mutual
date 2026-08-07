import React from "react";

/* ----------------------------------------------------------------------------
   DualRange — two-thumb min/max slider.
   Shared between If-What and What-If simulation workspaces.
---------------------------------------------------------------------------- */
export default function DualRange({ min, max, step, low, high, onChange, unit = "", marker, markers, format }) {
  const fmt = format || ((v) => `${v}${unit}`);
  low = Number(low); high = Number(high);
  const setLow = (v) => onChange({ low: Math.min(Number(v), high - step), high });
  const setHigh = (v) => onChange({ low, high: Math.max(Number(v), low + step) });
  const range = max - min;
  const fillLeft = ((low - min) / range) * 100;
  const fillRight = ((high - min) / range) * 100;
  const thumbCenter = (pct) => `calc(11px + ${pct}% - ${(pct * 0.22).toFixed(3)}px)`;
  const lowAt  = thumbCenter(fillLeft);
  const highAt = thumbCenter(fillRight);
  const markerList = (markers && markers.length ? markers : (marker ? [marker] : []))
    .filter((m) => m && m.value != null);
  return (
    <div className="iw-dual">
      <div className="iw-dual-track" />
      <div className="iw-dual-fill" style={{ left: lowAt, right: `calc(100% - ${highAt})` }} />
      {markerList.map((m, i) => (
        <div
          key={i}
          className={"iw-dual-marker" + (m.strong ? " strong" : "")}
          style={{ left: thumbCenter(((Number(m.value) - min) / range) * 100) }}
        >
          <span className="iw-dual-marker-l" style={{ left: "50%" }}>{m.label}</span>
        </div>
      ))}
      <div className="iw-dual-thumb iw-dual-thumb-low"  style={{ left: lowAt }} />
      <div className="iw-dual-thumb iw-dual-thumb-high" style={{ left: highAt }} />
      <div className="iw-dual-bubble iw-dual-bubble-low"  style={{ left: lowAt }}>{fmt(low)}</div>
      <div className="iw-dual-bubble iw-dual-bubble-high" style={{ left: highAt }}>{fmt(high)}</div>
      <input
        type="range" min={min} max={max} step={step} value={low}
        onChange={(e) => setLow(e.target.value)}
        className="iw-dual-input iw-dual-input-low" aria-label="Minimum"
      />
      <input
        type="range" min={min} max={max} step={step} value={high}
        onChange={(e) => setHigh(e.target.value)}
        className="iw-dual-input iw-dual-input-high" aria-label="Maximum"
        /* Keep the upper thumb above the lower input so it stays grabbable —
           the lower input (z-index 3) otherwise sits on top and can swallow the
           upper thumb near the middle/upper end of the track. */
        style={{ zIndex: 4 }}
      />
    </div>
  );
}
