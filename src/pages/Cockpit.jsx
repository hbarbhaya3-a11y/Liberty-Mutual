import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MODES, OBJ, STLAB, fmtUSD, area, ALL_THEMES } from "@/data/themes";
import { useAppShell } from "@/state/AppShell";
import { CxoCompanion } from "@/components/CxoCompanion";
import PageShell from "@/components/PageShell";
import { Logo, ThemeToggle } from "@/components/Logo";

const pad2 = (n) => String(n).padStart(2, "0");
const nowStamp = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`; };
const clockStamp = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())} · 22 May 2026`; };

function Sparkline({ theme }) {
  const o = OBJ[theme.obj];
  const pts = useMemo(() => {
    const trend = theme.status === "spiking" ? 1.4 : theme.status === "emerging" ? 0.2 : 0.8;
    let v = 9 + (theme.count % 6);
    const out = [];
    let seed = theme.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 16; i++) { v += (rand() * 5 - 2) + trend; v = Math.max(2, Math.min(24, v)); out.push(v); }
    return out;
  }, [theme.id, theme.status, theme.count]);
  const d = pts.map((p, i) => `${(i / 15 * 64).toFixed(1)},${(26 - p).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg className="t-spark" viewBox="0 0 64 26" preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke={o.col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
      <circle cx="64" cy={(26 - last).toFixed(1)} r="1.9" fill={o.col} />
    </svg>
  );
}

/* The use cases that are LIVE in this build. Every other theme tile — the
   remaining use cases (SMB) and all the ambient / macro signal themes — renders
   locked ("Coming soon"): visible so the roadmap reads, but not yet enterable.
   These three are the only ids that stay active in either radar mode. */
export const ACTIVE_USECASES = new Set(["gig", "liquidity", "retention", "wealth", "smbgrowth", "smbrate"]);

function ThemeTile({ theme, rect, sizeClass, dim, modeData, onOpen, gridMode, locked }) {
  const o = OBJ[theme.obj];
  /* gridMode: when true, the tile is laid out by a CSS grid (2/row,
     scrollable) and we drop the absolute-position style. Treemap mode
     keeps the old absolute positions so the squarify layout still works
     if anyone wants it. */
  const style = gridMode
    ? {
        "--c": o.col, "--cb": o.bd, "--cg": o.glow,
        "--cfill-1": o.fill1, "--cfill-2": o.fill2,
      }
    : {
        "--c": o.col, "--cb": o.bd, "--cg": o.glow,
        "--cfill-1": o.fill1, "--cfill-2": o.fill2,
        left: `${rect.x}px`, top: `${rect.y}px`,
        width: `${rect.w}px`, height: `${rect.h}px`,
        opacity: rect.ready ? 1 : 0,
      };
  return (
    <div
      className={`tile ${sizeClass} ${dim ? "dim" : ""}${locked ? " locked" : ""}${gridMode ? " tile-grid" : ""}`}
      data-id={theme.id}
      style={style}
      onClick={() => { if (!locked) onOpen(theme.id); }}
      title={locked ? "Unlocks in a later release" : undefined}
    >
      <span className="t-accent" />
      <div className="t-head">
        <span className="t-type">{theme.type}</span>
        {locked ? (
          <span className="t-status t-lock">🔒 Coming soon</span>
        ) : (
          <span className={`t-status st-${theme.status}`}>
            {theme.status === "spiking" && <span className="sd" />}
            {STLAB[theme.status]}
          </span>
        )}
      </div>
      <div className="t-name">{theme.name}</div>
      <div className="t-desc">{theme.desc}</div>
      <div className="t-mid">
        <div className="t-val">
          <span className="v">{fmtUSD(theme.valueM)}</span>
          <span className="vq">{theme.vq}</span>
        </div>
        <Sparkline theme={theme} />
      </div>
      <div className="t-foot">
        <span className="t-obj"><i />{o.lab}</span>
        <span className="t-kv"><b>{theme.count}</b> sig</span>
        <span className="t-kv"><b className="vel">+{theme.vel}</b>/60s</span>
        <span className="t-kv">conf <b>{theme.conf}%</b></span>
      </div>
      {/* macro-drivers footer removed per design — kept tiles cleaner so the
          name + value + status read first. Macro context still lives in the
          theme detail page for users who want it. */}
      <div className="t-strength"><i style={{ width: `${theme.conf}%` }} /></div>
    </div>
  );
}

/* Treemap → 2-column scrollable grid. The squarify-based layout had two
   real problems: (1) tiles of wildly different sizes made text overlap
   when re-laid out, especially when the size metric flipped from
   Relevance to Value; (2) too many tiles fought for space horizontally.
   A predictable 2/row grid keeps the cards readable, scrolls naturally
   when the list grows, and the order alone communicates priority. */
function Treemap({ mode, modeData, sizeMetric, activeObj, onOpen }) {
  const order = { acq: 0, deep: 1, ret: 2 };
  // Relevance mode: editorial pin + obj-group + area tiebreak.
  // Value / Velocity mode: PURE descending sort by the chosen metric —
  // no pin, no obj-grouping. The filter is then honest: every tile is
  // positioned only by the number the user asked to rank by.
  const honourPin = sizeMetric === "relevance";
  const sortedThemes = [...modeData.themes]
    .map((t) => ({ t, a: area(t, sizeMetric) }))
    .sort((p, q) => {
      if (honourPin) {
        if (!!p.t.pinned !== !!q.t.pinned) return p.t.pinned ? -1 : 1;
        if (p.t.pinned && q.t.pinned) {
          return (p.t.pinOrder ?? 99) - (q.t.pinOrder ?? 99);
        }
        return order[p.t.obj] - order[q.t.obj] || q.a - p.a;
      }
      return q.a - p.a;
    })
    .map((x) => x.t);

  return (
    <div className="themes-grid">
      {sortedThemes.map((t) => (
        <ThemeTile
          key={t.id}
          theme={t}
          rect={{ ready: true }}
          sizeClass=""
          dim={!!activeObj && t.obj !== activeObj}
          locked={!ACTIVE_USECASES.has(t.id)}
          modeData={modeData}
          onOpen={onOpen}
          gridMode
        />
      ))}
    </div>
  );
}

function SignalStream({ modeData, themesById }) {
  const [rows, setRows] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    setRows([]);
    const push = () => {
      const sigs = modeData.sigs;
      const [col, txt, src, themeId] = sigs[Math.floor(Math.random() * sigs.length)];
      const t = themesById[themeId];
      if (!t) return;
      const o = OBJ[t.obj];
      setRows((prev) => {
        const next = [{ id: ++idRef.current, col, txt, src, type: t.type, oCol: o.col, oFill: o.fill1, time: nowStamp() }, ...prev];
        // Keep a long tail so the feed always overflows its container — the
        // CSS mask fades the bottom, giving the impression of an endless
        // signal stream. 12 rows left gaps on tall viewports.
        return next.slice(0, 40);
      });
    };
    // Pre-fill on mount so the stream looks alive immediately, not empty.
    for (let i = 0; i < 18; i++) setTimeout(push, i * 60);
    const iv = setInterval(push, 1350);
    return () => clearInterval(iv);
  }, [modeData, themesById]);

  return (
    <div className="feed">
      {rows.map((r) => (
        <div key={r.id} className="srow fresh">
          <span className="stime">{r.time}</span>
          <span className="sdot" style={{ background: r.col, boxShadow: `0 0 7px ${r.col}` }} />
          <div className="sbody">
            <div className="stxt">{r.txt}</div>
            <div className="smeta">
              <span className="ssrc">{r.src}</span>
              <span className="sroute" style={{ color: r.oCol, background: r.oFill }}>{r.type}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Live category counts. The legacy layout wants `<span class="ml-1">` (total)
// INSIDE `.meter-lab` and `<div class="cats">` (8-col grid) as its SIBLING;
// nesting the grid inside the 128px-wide label container collapses the row and
// pushes the hero off-screen. So we return a small hook that supplies both
// pieces of state, and two component shells the parent can place independently.
function useCategoryTicker(modeData, version) {
  const catsRef = useRef(modeData.cats.map((c) => ({ ...c })));
  const [, force] = useState(0);

  useEffect(() => { catsRef.current = modeData.cats.map((c) => ({ ...c })); force((v) => v + 1); }, [modeData]);

  useEffect(() => {
    if (version === 0) return;
    catsRef.current.forEach((c) => { c.c += Math.floor(Math.random() * 5) - 2; if (c.c < 8) c.c = 8; });
    force((v) => v + 1);
  }, [version]);

  const cats = catsRef.current;
  const total = cats.reduce((s, c) => s + c.c, 0);
  const max = Math.max(...cats.map((c) => c.c));
  return { cats, total, max };
}

function CatsGrid({ cats, max }) {
  return (
    <div className="cats">
      {cats.map((c) => (
        <div className="cat" key={c.n}>
          <div className="ctop">
            <span className="cdot" style={{ background: c.col }} />
            <span className="cn">{c.n}</span>
          </div>
          <div className="cv" style={{ color: c.col }}>{c.c}</div>
          <div className="ctrack"><i style={{ width: `${(c.c / max) * 100}%`, background: c.col }} /></div>
        </div>
      ))}
    </div>
  );
}

function Forming({ modeData, version }) {
  const [pattern, setPattern] = useState(null);
  const [pct, setPct] = useState(0);
  const [promoted, setPromoted] = useState(false);
  const idxRef = useRef(0);
  const ivRef = useRef(null);

  useEffect(() => {
    if (ivRef.current) clearInterval(ivRef.current);
    const f = modeData.forming[idxRef.current % modeData.forming.length];
    idxRef.current++;
    setPattern(f);
    setPct(0);
    setPromoted(false);
    let p = 0;
    ivRef.current = setInterval(() => {
      p += Math.random() * 9 + 3;
      if (p >= 100) { p = 100; clearInterval(ivRef.current); setPct(100); setTimeout(() => setPromoted(true), 400); return; }
      setPct(p);
    }, 520);
    return () => ivRef.current && clearInterval(ivRef.current);
  }, [modeData, version]);

  if (!pattern) return null;
  const o = OBJ[pattern.obj];
  return (
    <div className="forming">
      <span className="fm-ic" style={{ color: o.col }}>
        <span className="dia" style={{ background: o.col, boxShadow: `0 0 10px ${o.col}` }} /> Forming
      </span>
      <span className="fm-txt">
        TwinX detected an emerging pattern — <b>{pattern.nm}</b>{" "}
        <span className="em" style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-2)", fontSize: 13 }}>· {pattern.em}</span>
      </span>
      <div className="fm-bar"><i style={{ width: `${pct}%`, background: `linear-gradient(90deg,${o.col},rgba(255,255,255,.15))`, transition: "width .5s ease" }} /></div>
      <span className="fm-pct">
        {promoted ? <span style={{ color: o.col }}>→ promoted</span> : `${Math.floor(pct)}%`}
      </span>
    </div>
  );
}

/* When `embedded={true}` the standalone chrome (.top bar with Logo/title/mode
   toggle, and the .status bar at the bottom) is suppressed so this component
   can be rendered inside the unified Shell's HubWorkspace without duplicating
   the shell's own top/sidebar/rightrail. The actual content (meter +
   signal stream + treemap + forming) renders unchanged. */
export default function Cockpit({ embedded = false, onOpenTheme }) {
  const [mode, setMode] = useState("internal");
  const [sizeMetric, setSizeMetric] = useState("relevance");
  const [activeObj, setActiveObj] = useState(null);
  const [catTick, setCatTick] = useState(0);
  /* Signals stream is collapsible — the live feed is reassuring on first
     load (the system is sensing) but adds vertical noise once the user is
     reading themes. Collapse hides the stream body but keeps the header
     visible so the user can re-open it. */
  const [streamOpen, setStreamOpen] = useState(true);
  const [formingTick, setFormingTick] = useState(0);
  const [clock, setClock] = useState(clockStamp());
  const [spm, setSpm] = useState(0);
  // Top classification strip starts collapsed — the 8 category numbers are
  // useful context but visually dense. User can expand on demand.
  const [meterOpen, setMeterOpen] = useState(false);
  const navigate = useNavigate();
  const { sector } = useAppShell();
  const baseModeData = MODES[mode];
  /* Sector switch (Retail / Commercial) scopes the Sense home: commercial
     surfaces the b2b-tagged themes (Small Commercial) + their signals;
     retail surfaces everything else. Tiles, treemap, signal stream, legend
     totals and counts all read this filtered view — so the toggle actually
     changes the experience rather than just the header chip. */
  const modeData = useMemo(() => {
    const wantCommercial = sector === "commercial";
    const themes = baseModeData.themes.filter((t) => !!t.b2b === wantCommercial);
    const ids = new Set(themes.map((t) => t.id));
    const sigs = baseModeData.sigs.filter(([, , , themeId]) => ids.has(themeId));
    return {
      ...baseModeData,
      themes: themes.length ? themes : baseModeData.themes,
      sigs: sigs.length ? sigs : baseModeData.sigs,
    };
  }, [baseModeData, sector]);
  // Resolve signal links against ALL themes (not just the rendered tiles) so the
  // macro stream — whose signals point at macro themes — still links in both modes.
  const themesById = useMemo(() => Object.fromEntries(ALL_THEMES.map((t) => [t.id, t])), []);
  const { cats: catCounts, total: catTotal, max: catMax } = useCategoryTicker(modeData, catTick);

  useEffect(() => {
    document.body.classList.toggle("macro", mode === "macro");
    return () => document.body.classList.remove("macro");
  }, [mode]);

  useEffect(() => {
    setSpm(modeData.spm + Math.floor(Math.random() * 60 - 30));
    const ivCats = setInterval(() => setCatTick((v) => v + 1), 1900);
    const ivSpm = setInterval(() => setSpm(modeData.spm + Math.floor(Math.random() * 60 - 30)), 2200);
    const ivClock = setInterval(() => setClock(clockStamp()), 30000);
    const ivForming = setInterval(() => setFormingTick((v) => v + 1), 11000);
    return () => { clearInterval(ivCats); clearInterval(ivSpm); clearInterval(ivClock); clearInterval(ivForming); };
  }, [modeData]);

  const legendTotals = useMemo(() => {
    const t = { acq: 0, deep: 0, ret: 0 };
    modeData.themes.forEach((th) => { t[th.obj] += th.valueM; });
    return t;
  }, [modeData]);

  /* In embedded mode the caller (HubWorkspace) provides a custom theme
     handler via `onOpenTheme` that updates global state and opens a drawer
     instead of doing a hard navigate. Standalone mode keeps the old URL
     navigate so /cockpit-legacy continues to work as before. */
  const openTheme = (id) => {
    if (typeof onOpenTheme === "function") { onOpenTheme(id, mode); return; }
    navigate(`/theme?id=${encodeURIComponent(id)}&mode=${encodeURIComponent(mode)}`);
  };

  const cockpitContent = (
    <div className={"app" + (embedded ? " embedded" : "")}>
      {!embedded && (
        <div className="top top-context">
          {/* Logo + title live in GlobalTopBar — this is just the page's
              functional context strip (mode toggle, chiplets). */}
          <div className="modetoggle">
            <button data-mode="internal" className={mode === "internal" ? "on" : ""} onClick={() => setMode("internal")}>
              <span className="mt-ic">▣</span> Inside-Out <span className="mt-sub">our data</span>
            </button>
            <button data-mode="macro" className={mode === "macro" ? "on" : ""} onClick={() => setMode("macro")}>
              <span className="mt-ic">◉</span> Outside-In <span className="mt-sub">macro</span>
            </button>
          </div>
          <div className="top-sp" />
          <div className="chiplet">
            <span className="live-dot" /> <span>{modeData.alwaysLead}<b>{modeData.alwaysBold}</b></span>
          </div>
          <div className="chiplet">CMO View &nbsp;▾</div>
          <a href="/ceo" className="brief-link" onClick={(e) => { e.preventDefault(); navigate("/ceo"); }}>↑ Executive Brief</a>
        </div>
      )}
      {/* In embedded mode we add a slim header strip with the mode toggle so
          users can still switch Inside-Out / Outside-In from inside Hub. */}
      {embedded && (
        <div className="top top-embedded">
          <div className="modetoggle">
            <button data-mode="internal" className={mode === "internal" ? "on" : ""} onClick={() => setMode("internal")}>
              <span className="mt-ic">▣</span> Inside-Out <span className="mt-sub">our data</span>
            </button>
            <button data-mode="macro" className={mode === "macro" ? "on" : ""} onClick={() => setMode("macro")}>
              <span className="mt-ic">◉</span> Outside-In <span className="mt-sub">macro</span>
            </button>
          </div>
          <div className="top-sp" />
          <div className="chiplet">
            <span className="live-dot" /> <span>{modeData.alwaysLead}<b>{modeData.alwaysBold}</b></span>
          </div>
        </div>
      )}

      <div className={"meter" + (meterOpen ? " meter-open" : " meter-collapsed")}>
        <button
          className="meter-lab meter-toggle"
          onClick={() => setMeterOpen((v) => !v)}
          title={meterOpen ? "Collapse classification breakdown" : "Expand classification breakdown"}
        >
          <span className="ml-0">{modeData.meterMode}</span>
          <span className="ml-1">{catTotal}</span>
          <span className="ml-2">{modeData.meterSub}</span>
          <span className="meter-chev">{meterOpen ? "▾" : "▸"}</span>
        </button>
        {meterOpen && <CatsGrid cats={catCounts} max={catMax} />}
      </div>

      {/* HERO · 2-column grid. When the signals stream is collapsed the
          stream column shrinks to a thin 40px strip (just the toggle
          chevron + rotated label) and the themes column expands
          horizontally to fill the freed space. Pure horizontal collapse,
          no vertical hiding. */}
      <div className={"hero" + (streamOpen ? "" : " hero-stream-collapsed")}>
        <div className={"stream" + (streamOpen ? "" : " stream-collapsed")}>
          {streamOpen ? (
            <>
              {/* Expanded header. Title + rate on the left; collapse
                  control at the right edge — that's where users expect
                  a collapse button. A distinct bordered button, not an
                  inline glyph fused into the title text. */}
              <div className="stream-h">
                <span className="sh-t">{modeData.streamTitle}</span>
                <span className="sh-r"><b>{spm.toLocaleString()}</b> / min · <span>{modeData.spmSuffix}</span></span>
                <button
                  type="button"
                  className="stream-collapse-btn"
                  onClick={() => setStreamOpen(false)}
                  aria-label="Collapse signal stream"
                  title="Collapse signal stream"
                >
                  ❮
                </button>
              </div>
              <SignalStream modeData={modeData} themesById={themesById} />
            </>
          ) : (
            <button
              type="button"
              className="stream-collapsed-rail"
              onClick={() => setStreamOpen(true)}
              aria-expanded={false}
              title="Expand signal stream · system is actively sensing"
            >
              <span className="stream-collapsed-chev">▸</span>
              {/* Pulsing dot — peripheral cue that the system is still
                  sensing, even when the rail itself is collapsed. */}
              <span className="stream-collapsed-pulse" aria-hidden="true" />
              <span className="stream-collapsed-label">{modeData.streamTitle}</span>
            </button>
          )}
        </div>

        <div className="themes">
          <div className="gbar">
            <span className="gt">{modeData.gt}</span>
            <div className="sizer">
              Tile size&nbsp;∝
              <div className="sz-btns">
                {["relevance", "value", "velocity"].map((m) => (
                  <button key={m} className={sizeMetric === m ? "on" : ""} onClick={() => setSizeMetric(m)}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="legend">
              {Object.keys(OBJ).map((k) => (
                <span
                  key={k}
                  className={`lg ${activeObj && activeObj !== k ? "off" : ""}`}
                  onClick={() => setActiveObj((cur) => (cur === k ? null : k))}
                >
                  <span className="lgd" style={{ background: OBJ[k].col }} />
                  {OBJ[k].lab} <b>{fmtUSD(legendTotals[k])}</b>
                </span>
              ))}
            </div>
          </div>
          <Treemap mode={mode} modeData={modeData} sizeMetric={sizeMetric} activeObj={activeObj} onOpen={openTheme} />
        </div>
      </div>

      <Forming modeData={modeData} version={formingTick} />

      {!embedded && (
        <div className="status">
          <span><b>Governance</b> active</span>
          <span>classify latency p99 <b>0.4ms</b></span>
          <span>themes live <b>{modeData.themes.length}</b> · forming <b>{modeData.forming.length}</b></span>
          <span className="sp" />
          <span>CMO · J. Rao</span>
          <span>{clock}</span>
        </div>
      )}

      {!embedded && <CxoCompanion />}
    </div>
  );

  /* In standalone mode, wrap the cockpit content in the persistent
     PageShell (sidebar + main). Embedded mode (from HubWorkspace) renders
     bare, since the unified Shell provides its own chrome.
     `noAskTwin` because Cockpit renders its own CxoCompanion above. */
  if (embedded) return cockpitContent;
  return <PageShell noAskTwin>{cockpitContent}</PageShell>;
}
