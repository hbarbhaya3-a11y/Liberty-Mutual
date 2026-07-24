import React from "react";

/* RangeWithBubble — single-thumb slider that renders the SAME visual treatment
   as the DualRange (.iw-dual track + section-accent thumb + fill + hover value
   bubble), so every single slider in the app matches the two-thumb sliders.
   Keeps a drop-in API: `value`, `onChange`, `min`, `max`, `step`, plus `unit`
   for a label suffix and `formatter` for custom display (dollars / bps / etc.).
   `marker`/`markers` render reference ticks (e.g. today's / market rate). */
export default function RangeWithBubble({
  value, min, max, step, unit = "", formatter, marker, markers,
  className = "", disabled, ...rest
}) {
  const v = Number(value), mn = Number(min), mx = Number(max);
  const pctOf = (n) => (mx > mn ? ((Number(n) - mn) / (mx - mn)) * 100 : 0);
  /* Match the native thumb center (inset thumbWidth/2 from each edge) so the
     visible thumb/fill/bubble line up exactly with where drag registers. */
  const thumbCenter = (p) => `calc(11px + ${p}% - ${(p * 0.22).toFixed(3)}px)`;
  const at = thumbCenter(pctOf(v));
  const display = formatter ? formatter(v) : `${v}${unit}`;
  const markerList = (markers && markers.length ? markers : (marker ? [marker] : []))
    .filter((m) => m && m.value != null);
  return (
    <div className={"iw-dual range-single" + (disabled ? " is-disabled" : "")}>
      <div className="iw-dual-track" />
      <div className="iw-dual-fill" style={{ left: thumbCenter(0), right: `calc(100% - ${at})` }} />
      {markerList.map((m, i) => (
        <div
          key={i}
          className={"iw-dual-marker" + (m.strong ? " strong" : "")}
          style={{ left: thumbCenter(pctOf(m.value)) }}
        >
          <span className="iw-dual-marker-l" style={{ left: "50%" }}>{m.label}</span>
        </div>
      ))}
      <div className="iw-dual-thumb" style={{ left: at }} />
      <div className="iw-dual-bubble" style={{ left: at }}>{display}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        className={("iw-dual-input iw-dual-input-low " + className).trim()}
        {...rest}
      />
    </div>
  );
}
