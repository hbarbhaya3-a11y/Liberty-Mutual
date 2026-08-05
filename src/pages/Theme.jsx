import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TWINX from "@/data/bundle";
import gigSignals from "@/data/gigSignals";
import retentionSignals from "@/data/retentionSignals";
import liquiditySignals from "@/data/liquiditySignals";
import wealthSignals from "@/data/wealthSignals";
import { RETENTION_CONFIG } from "@/data/retentionConfig";
import { isB2B } from "@/data/b2bConfigs";
import { Logo, ThemeToggle } from "@/components/Logo";
import PageShell from "@/components/PageShell";
import { useAppShell } from "@/state/AppShell";
import "@/styles/theme.css";

/* ---- helpers (ported verbatim from theme.html, lines 545-693) ---- */
const OBJ = {
  acq: { lab: "Acquisition", col: "#5b9dff" },
  deep: { lab: "Deepening", col: "#b794f6" },
  ret: { lab: "Retention", col: "#ffb15a" },
};

const STLAB = { emerging: "Emerging", strengthening: "Strengthening", confirmed: "Confirmed", spiking: "Spiking" };

function fmtUSDc(c) {
  const d = c / 100;
  const a = Math.abs(d);
  const s = d < 0 ? "-" : "";
  if (a >= 1e9) return s + "$" + (a / 1e9).toFixed(a % 1e9 === 0 ? 0 : 1) + "B";
  if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(a % 1e6 === 0 ? 0 : 1) + "M";
  if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(0) + "K";
  return s + "$" + Math.round(a);
}

function hexA(h, a) {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function metric(hid, id) {
  return (TWINX.simulations[hid] && TWINX.simulations[hid].metrics.find((m) => m.metric_id === id)) || null;
}

function shortH(h) {
  return h.replace("H-2026-", "H-");
}

function humanKind(k) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function macroFor(id) {
  const m = {
    gig: "Fintech deposit disintermediation",
    churn: "Rate-cut cycle + competitor HY",
    home: "Equity-event / housing turnover",
    sweep: "Falling-rate yield competition",
    limits: "FedNow / real-time payments",
    mobile: "Rising digital-service expectations",
    newcomer: "Immigration & remittance growth",
    elder: "Elder-fraud / EFE typologies",
    wallet: "BNPL & rewards competition",
    branch: "Regional bank consolidation",
    retention: "Rate-cut cycle + open-banking switching friction falling",
  };
  return m[id] || "—";
}

/* ---- small JSX primitives ---- */
function SecHeader({ tag, title, desc, extra }) {
  return (
    <div className="sec-h">
      <span className="stag">{tag}</span>
      <span className="stt">{title}</span>
      {desc ? <span className="sd">{desc}</span> : null}
      {extra ? <span className="sx">{extra}</span> : null}
    </div>
  );
}

/* ============================================================================
   SignalsSection — gig-theme-only. Renders the 3 hand-curated signals from
   src/data/gigSignals.js as a horizontal grid of prominent cards. Each card
   is the primary entry point into the Decision Loop for the gig theme:
   click → gotoPipeline(signal.championHypothesis).

   DESIGN CHOICE: for the gig theme we REPLACE the existing hypothesis list
   with these 3 signal cards. Rationale: the signals ARE the curated entry
   points for the demo; the raw hypothesis list duplicates that surface and
   competes for attention. Other themes still render renderHypotheses() as
   before. (See call-site in render assembly below.)
   ========================================================================= */
/* SignalsSection — rich signal cards rendered above the cohort sections.
   Each card has 5 vertical zones:
     1. Top row: signal badge (A/B/C) + tone-colored status pill
     2. Headline + body (business-friendly framing)
     3. KPI tiles (3 across) — each tile color-coded by `kind`
     4. "TwinX recommends" preview chip — surfaces the champion intervention
     5. CTA into the Decision Loop
*/
function SignalsSection({ signals, accent, onOpen }) {
  return (
    <div className="sec">
      <div className="sec-h">
        <span className="stag">HYPOTHESES</span>
        <span className="stt">Three hypotheses on the table</span>
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

/* Hypothesis-first card layout. The HEADLINE is the recommended hypothesis
   name + sub (the bet we'd run). Underneath: KPI tiles (the evidence). Then
   the signal/scenario framing as a small "because" caption — explaining why
   this hypothesis surfaced. Inverted from the older signal-first design
   where the hypothesis was buried in 12px footer text. */
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

      {/* HEADLINE — hypothesis name only. The subtitle and "Because:" body
          were both removed because the WHO/WHAT/WHY statement below covers
          the same ground in a single, structured, scannable block. */}
      <div className="sig-hyp-name">{s.recommended.name}</div>

      {/* WHO/WHAT/WHY — one tight line each. Differentiates the three
          cards in <2s without scrolling: read down all three WHO rows,
          then all three WHAT rows, then all three WHY rows. */}
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

/* ============================================================================
   HypothesesSection — gig-theme-only. Three hand-curated hypotheses TwinX has
   generated for the gig cohort, rendered as flat cards directly below the
   signal cards. Visual treatment mirrors the existing .hcard pattern (hair
   border, 3px accent left rail, mono badge, outcome chips at the bottom) — no
   glass surfaces, no gradients, no big radii.
   ========================================================================= */
const GIG_HYPOTHESES = [
  {
    id: "H-2026-04-12",
    star: true,
    title: "Trust-Aware Ceiling Lift",
    body: "Raise the Zelle limit when the customer is paying a verified landlord they've paid for 18+ months.",
    chips: [
      { label: "NII", value: "+$5.6M", tone: "g" },
      { label: "failures", value: "-236,000", tone: "g" },
      { label: "complaints", value: "-3,360", tone: "g" },
      { label: "call-centre cost", value: "-$1.68M", tone: "g" },
    ],
  },
  {
    id: "H-2026-05-01",
    star: false,
    title: "Payout-Window Relax",
    body: "Loosen the limit briefly on Friday 4-8 PM — when payday earnings haven't quite settled yet.",
    chips: [
      { label: "NII", value: "+$90K", tone: "g" },
      { label: "failures", value: "-3,100", tone: "g" },
    ],
  },
  {
    id: "H-2026-05-09",
    star: false,
    title: "Rail Streamline",
    body: "Ease P2P/Zelle limits for accounts with long-established trusted payees.",
    chips: [
      { label: "NII", value: "+$60K", tone: "g" },
      { label: "failures", value: "-2,200", tone: "g" },
      { label: "call-centre cost", value: "-$40K", tone: "g" },
    ],
  },
];

function HypothesesSection({ accent, onOpen }) {
  return (
    <div className="sec">
      <div className="sec-h">
        <span className="stt">Hypotheses TwinX has generated</span>
        <span className="sd">three candidate moves shaped from the signals above</span>
        <span className="sx">{GIG_HYPOTHESES.length} ready</span>
      </div>
      <div className="sec-body">
        <div className="hyp-grid">
          {GIG_HYPOTHESES.map((h) => (
            <HypothesisCard key={h.id} hyp={h} accent={accent} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HypothesisCard({ hyp, accent, onOpen }) {
  return (
    <div
      className="hyp-card"
      style={{ borderLeftColor: accent }}
      onClick={() => onOpen(hyp.id)}
    >
      <div className="hyp-top">
        <span className="hyp-badge" style={{ color: accent }}>{shortH(hyp.id)}</span>
        {hyp.star && <span className="hyp-star" title="recommended">★</span>}
        {hyp.star && <span className="hyp-rec-lbl">recommended</span>}
      </div>
      <div className="hyp-title">{hyp.title}</div>
      <div className="hyp-body">{hyp.body}</div>
      <div className="hyp-chips">
        {hyp.chips.map((c, i) => (
          <div key={i} className="ochip">
            <span className={"ov " + c.tone}>{c.value}</span>
            <span className="ol">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="hyp-cta">
        <span
          className="hyp-open"
          style={{ color: accent, borderColor: hexA(accent, 0.3) }}
          onClick={(e) => { e.stopPropagation(); onOpen(hyp.id); }}
        >
          Dive in →
        </span>
      </div>
    </div>
  );
}

function Section({ tag, title, desc, extra, empty, children }) {
  return (
    <div className={"sec" + (empty ? " empty" : "")}>
      <SecHeader tag={tag} title={title} desc={desc} extra={extra} />
      <div className="sec-body">{children}</div>
    </div>
  );
}

function Panel({ title, meta, children, np }) {
  return (
    <div className="panel">
      <div className="panel-h">
        <span className="pdot" />
        <span className="pt">{title}</span>
        {meta ? <span className="pm">{meta}</span> : null}
      </div>
      <div className={"pbody" + (np ? " np" : "")}>{children}</div>
    </div>
  );
}

function LifePill({ lc }) {
  const m = {
    generated: ["Emerging", "st-emerging"],
    simulated: ["Strengthening", "st-strengthening"],
    cc_winner: ["Confirmed", "st-confirmed"],
  };
  const x = m[lc] || ["Active", "st-emerging"];
  return <span className={"statuspill " + x[1]}>{x[0]}</span>;
}

function ParamTags({ pr }) {
  return (
    <>
      {Object.keys(pr).map((k) => {
        const v = pr[k];
        if (Array.isArray(v)) {
          return (
            <span key={k} className="kvtag">
              {k} <b>{v.length} bands</b>
            </span>
          );
        }
        if (typeof v === "boolean") {
          if (!v) return null;
          return (
            <span key={k} className="kvtag">
              <b>{k.replace(/_/g, " ")}</b>
            </span>
          );
        }
        return (
          <span key={k} className="kvtag">
            {k.replace(/_/g, " ")} <b>{String(v)}</b>
          </span>
        );
      })}
    </>
  );
}

function OutcomeChips({ po }) {
  const defs = [
    ["friction_events_delta", "count", "neg"],
    ["fraud_rate_delta", "bps", "neg"],
    ["contact_centre_cost_delta", "$", "neg"],
    ["nii_contribution", "$", "pos"],
    ["complaint_exposure", "count", "neg"],
    ["multi_product_attach_rate_delta", "pp", "pos"],
    ["primacy_capture_rate", "%", "posonly"],
  ];
  return (
    <>
      {defs.map((d) => {
        const key = d[0];
        if (po[key] === undefined) return null;
        const val = po[key];
        const unit = d[1];
        const dir = d[2];
        let disp;
        if (unit === "$") disp = fmtUSDc(val);
        else if (unit === "bps") disp = (val > 0 ? "+" : "") + val + " bps";
        else if (unit === "pp") disp = (val > 0 ? "+" : "") + val + " pp";
        else if (unit === "%") disp = val + "%";
        else disp = (val > 0 ? "+" : "") + val.toLocaleString();
        let good;
        if (dir === "neg") good = val < 0;
        else if (dir === "pos") good = val > 0;
        else good = true;
        const lbl = key.replace(/_delta$/, "").replace(/_/g, " ");
        return (
          <div key={key} className="ochip">
            <span className={"ov " + (good ? "g" : "r")}>{disp}</span>
            <span className="ol">{lbl}</span>
          </div>
        );
      })}
    </>
  );
}

/* =========================================================================
   Main component
   ========================================================================= */
export default function Theme() {
  const navigate = useNavigate();
  const { selectTheme, selectHypothesis, pushAgentEvent } = useAppShell();
  const [sp] = useSearchParams();
  const ID = sp.get("id") || "gig";
  const MODE = sp.get("mode") || "internal";

  // B2B (SMB) themes skip the B2C theme page and route straight into the
  // cluster-detail workspace flow (Screen 0 card → Screen 1 cluster).
  const b2bTheme = isB2B(ID);
  useEffect(() => {
    if (b2bTheme) {
      selectTheme(ID);
      navigate("/?seed_route=analyse&seed_theme=" + encodeURIComponent(ID), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b2bTheme, ID]);

  const map = TWINX.themeMap[ID] || { cluster: null, hyps: [], highlight: null };
  const bound = !!map.cluster;
  const C = bound ? TWINX.clusters[map.cluster] : null;
  const HYPS = useMemo(() => map.hyps.map((h) => TWINX.hypotheses[h]), [map]);

  /* Objective derivation. A friction-removal policy on existing customers
     (gig, SMB, multi-banker) is RETENTION — we're defending relationships,
     not winning new ones. Acquisition only applies to genuinely new-to-bank
     clusters (cold-start, migrant). Life-event capture is DEEPENING. */
  const obj = useMemo(() => {
    if (!bound) return "ret";
    const h0 = HYPS.find((h) => h.highlighted) || HYPS[0];
    const kind = h0.intervention.kind;
    /* Loss-prevention, fraud, rate-policy moves = retention. */
    if (["tighten_novel_counterparty", "time_of_day_modifier", "amount_band_policy"].indexOf(kind) >= 0) return "ret";
    /* Life-event capture = deepening (new product attach inside an
       existing relationship — primacy, attach, cross-sell). */
    if (kind === "coordinated_transition_response") return "deep";
    /* Genuinely new-to-bank clusters = acquisition. */
    if (/cold_start|migrant/.test(map.cluster)) return "acq";
    /* Everything else (ceiling lift, rail policy) on existing-customer
       clusters = retention via friction removal. */
    return "ret";
  }, [bound, HYPS, map.cluster]);

  const O = OBJ[obj];
  const ACC = O.col;
  const ACC_SOFT = hexA(ACC, 0.13);

  const valueM = useMemo(() => {
    if (!bound) return 0;
    const hs = map.highlight ? [map.highlight] : map.hyps;
    let s = 0;
    let used = false;
    hs.forEach((h) => {
      const m = metric(h, "nii_contribution");
      if (m) {
        s += m.point_estimate;
        used = true;
      }
    });
    if (!used || s === 0) {
      hs.forEach((h) => {
        const m = metric(h, "contact_centre_cost_delta");
        if (m) s += Math.abs(m.point_estimate);
      });
    }
    return s / 100 / 1e6;
  }, [bound, map]);

  const type = useMemo(() => {
    if (!bound) return "External Context";
    const h0 = HYPS.find((h) => h.highlighted) || HYPS[0];
    return TWINX.kindLabel[h0.intervention.kind] || "Money Movement";
  }, [bound, HYPS]);

  const status = useMemo(() => {
    if (!bound) return "emerging";
    const drift = (TWINX.driftInjections.byCluster[map.cluster] || 0) + (TWINX.fraudInjections.byCluster[map.cluster] || 0);
    if (C.drift_state !== "stable" || drift > 0) return "spiking";
    const anyCC = HYPS.some((h) => TWINX.championChallenger[h.hypothesis_id]);
    if (anyCC && HYPS.some((h) => {
      const cc = TWINX.championChallenger[h.hypothesis_id];
      return cc && cc.stopping_rule_resolution === "winner";
    })) return "confirmed";
    const anySim = HYPS.some((h) => TWINX.simulations[h.hypothesis_id]);
    return anySim ? "strengthening" : "emerging";
  }, [bound, C, HYPS, map.cluster]);

  const vq = useMemo(() => {
    const t = { acq: "inflow opportunity", deep: "CLV opportunity", ret: "deposits at risk" }[obj];
    if (obj === "ret") {
      const lead = HYPS[0] && metric(HYPS[0].hypothesis_id, "friction_events_delta");
      if (lead && !metric(HYPS[0].hypothesis_id, "nii_contribution")) return "attrition exposure";
    }
    return t;
  }, [obj, HYPS]);

  /* body background side-effect — accent-tinted gradient */
  useEffect(() => {
    const prev = document.body.style.backgroundImage;
    document.body.style.backgroundImage = `radial-gradient(900px 520px at 84% -10%, ${hexA(ACC, 0.10)}, transparent 60%), linear-gradient(180deg, var(--bg-1), var(--bg-0))`;
    return () => { document.body.style.backgroundImage = prev; };
  }, [ACC]);

  /* nav */
  const gotoPipeline = (h) => {
    if (ID === "gig") { navigate("/gig-pipeline"); return; }
    if (ID === "retention") { navigate("/?seed_route=analyse"); return; }
    if (ID === "liquidity") { selectTheme(ID); navigate("/?seed_route=analyse&seed_theme=" + encodeURIComponent(ID)); return; }
    if (ID === "wealth") { selectTheme(ID); navigate("/?seed_route=analyse&seed_theme=" + encodeURIComponent(ID)); return; }
    if (ID === "elder" || ID === "home" || ID === "churn") { navigate("/deep-pipeline?theme=" + encodeURIComponent(ID)); return; }
    navigate("/pipeline?theme=" + encodeURIComponent(ID) + "&mode=" + encodeURIComponent(MODE) + "&h=" + encodeURIComponent(h));
  };

  /* openSignalInLoop — the new flow for gig-theme signal cards.
     Sets the global selection (so AnalyseWorkspace + SimulateWorkspace can
     pick up the context) and routes to the Analyse workspace where the user
     enters Sense → Analyse → Hypothesize → Test. Replaces the previous
     direct-jump to the legacy /gig-pipeline page from the signal cards. */
  const openSignalInLoop = (hypothesisId) => {
    selectTheme(ID);
    if (hypothesisId) selectHypothesis(hypothesisId);
    pushAgentEvent({
      kind: "good",
      src: "Theme",
      text: `Signal adopted · ${hypothesisId || "champion"} on ${ID}`,
    });
    navigate("/?seed_route=analyse");
  };

  /* fingerprint toggle */
  const [fpMore, setFpMore] = useState(false);

  /* ============ Sub-render functions ============ */
  const renderHero = () => {
    // Retention theme: hardcoded hero (not bundle-bound; mirrors gig's
    // override pattern). Side metrics + ID strip pills come from
    // retentionConfig.js. Returns early before the bundle-bound code below.
    if (ID === "retention") {
      const RC = RETENTION_CONFIG;
      return (
        <>
          <div className="hero">
            <div className="hero-main">
              <div className="hero-type" style={{ color: ACC }}>Deposit Retention{MODE === "macro" ? " · outside-in" : ""}</div>
              <div className="hero-name">
                <span className="odot" style={{ background: ACC, boxShadow: `0 0 13px ${ACC}` }} />
                {RC.name}
              </div>
              <div className="hero-sig">Three converging signals — digital-engagement decline, competitor quote-shopping, and coverage-reduction requests — mark a cohort of high-LTV auto customers whose renewal is at risk ~45 days before they shop for rate.</div>
            </div>
            <div className="hero-side">
              <div className="hm"><span className="v ac" style={{ color: ACC }}>$0.9B</span><span className="l">NWP under observation</span></div>
              <div className="hm"><span className="v">550,849</span><span className="l">customers at risk</span></div>
              <div className="hm"><span className="v">$1,650</span><span className="l">avg annual premium</span></div>
              <div className="hm"><span className="v">3</span><span className="l">hypotheses surfaced</span></div>
            </div>
          </div>
          <div className="idstrip">
            <span className="statuspill st-confirmed"><span className="ld" style={{ background: "currentColor", boxShadow: "0 0 7px currentColor" }} />Confirmed</span>
            <span className="idtag"><span className="k">objective</span> <b style={{ color: ACC }}>Retention</b></span>
            <span className="idtag"><span className="k">cluster</span> <b>{RC.cluster}</b></span>
            <span className="idtag"><span className="k">drift</span> <span className="pillv pv-ok">stable</span></span>
            <span className="idtag"><span className="k">policy</span> <b>v2</b></span>
            <span className="idtag"><span className="k">macro driver</span> <b>{macroFor("retention")}</b></span>
          </div>
        </>
      );
    }

    // Liquidity Activation theme: hardcoded hero (not bundle-bound; mirrors
    // the retention pattern). Returns early before the bundle-bound code.
    if (ID === "liquidity") {
      return (
        <>
          <div className="hero">
            <div className="hero-main">
              <div className="hero-type" style={{ color: ACC }}>Liquidity Activation{MODE === "macro" ? " · outside-in" : ""}</div>
              <div className="hero-name">
                <span className="odot" style={{ background: ACC, boxShadow: `0 0 13px ${ACC}` }} />
                Idle-cash liquidity activation
              </div>
              <div className="hero-sig">Idle cash is sitting at near-zero yield while high-yield competitors pull — route it into the right product at the minimum rate that holds it, before it leaves.</div>
            </div>
            <div className="hero-side">
              <div className="hm"><span className="v ac" style={{ color: ACC }}>$9.3B</span><span className="l">idle balances in scope</span></div>
              <div className="hm"><span className="v">388,000</span><span className="l">customers idle 60d+</span></div>
              <div className="hm"><span className="v">$24K</span><span className="l">median idle balance</span></div>
              <div className="hm"><span className="v">3</span><span className="l">strategies surfaced</span></div>
            </div>
          </div>
          <div className="idstrip">
            <span className="statuspill st-confirmed"><span className="ld" style={{ background: "currentColor", boxShadow: "0 0 7px currentColor" }} />Strengthening</span>
            <span className="idtag"><span className="k">objective</span> <b style={{ color: ACC }}>Deepening</b></span>
            <span className="idtag"><span className="k">cluster</span> <b>cluster_idle_liquidity</b></span>
            <span className="idtag"><span className="k">drift</span> <span className="pillv pv-ok">stable</span></span>
            <span className="idtag"><span className="k">policy</span> <b>v1</b></span>
            <span className="idtag"><span className="k">macro driver</span> <b>Falling-rate cycle · high-yield competition</b></span>
          </div>
        </>
      );
    }

    // Wealth Attach theme: hardcoded hero (not bundle-bound; mirrors the
    // liquidity pattern). Returns early before the bundle-bound code.
    if (ID === "wealth") {
      return (
        <>
          <div className="hero">
            <div className="hero-main">
              <div className="hero-type" style={{ color: ACC }}>Wealth Attach · White-Space{MODE === "macro" ? " · outside-in" : ""}</div>
              <div className="hero-name">
                <span className="odot" style={{ background: ACC, boxShadow: `0 0 13px ${ACC}` }} />
                Mass-affluent banking, investing elsewhere
              </div>
              <div className="hero-sig">Mass-affluent households bank with us but invest elsewhere — and some of that money has started to move out. Convert the everyday trust into a wealth relationship with the right motion, at the customers who genuinely need the advice.</div>
            </div>
            <div className="hero-side">
              <div className="hm"><span className="v ac" style={{ color: ACC }}>$1.1B</span><span className="l">investable held outside</span></div>
              <div className="hm"><span className="v">18,400</span><span className="l">households · no wealth relationship</span></div>
              <div className="hm"><span className="v">$60K</span><span className="l">avg held outside / household</span></div>
              <div className="hm"><span className="v">3</span><span className="l">strategies surfaced</span></div>
            </div>
          </div>
          <div className="idstrip">
            <span className="statuspill st-confirmed"><span className="ld" style={{ background: "currentColor", boxShadow: "0 0 7px currentColor" }} />Strengthening</span>
            <span className="idtag"><span className="k">objective</span> <b style={{ color: ACC }}>Deepening</b></span>
            <span className="idtag"><span className="k">cluster</span> <b>cluster_wealth_attach</b></span>
            <span className="idtag"><span className="k">drift</span> <span className="pillv pv-ok">stable</span></span>
            <span className="idtag"><span className="k">policy</span> <b>v1</b></span>
            <span className="idtag"><span className="k">macro driver</span> <b>Wealth-platform disintermediation · retirement demographic wave</b></span>
          </div>
        </>
      );
    }

    /* Hero side metrics — kept concrete and unambiguous. The previous
       "% of consumer-deposits book" line forced a tangent about which
       book is the denominator; removed in favour of just the customer
       count, which is concrete and connects to every downstream chart. */
    const side = bound ? (
      <div className="hero-side">
        <div className="hm">
          <span className="v ac" style={{ color: ACC }}>{"$" + valueM.toFixed(1) + "M"}</span>
          <span className="l">{vq}</span>
        </div>
        <div className="hm">
          <span className="v">{C.population.toLocaleString()}</span>
          <span className="l">customers in cohort</span>
        </div>
        <div className="hm">
          <span className="v">{HYPS.length}</span>
          <span className="l">hypotheses surfaced</span>
        </div>
      </div>
    ) : null;

    const driftPill = bound && (C.drift_state === "stable"
      ? <span className="pillv pv-ok">stable</span>
      : <span className="pillv pv-drift">{C.drift_state.replace(/_/g, " ")}</span>);

    return (
      <>
        <div className="hero">
          <div className="hero-main">
            <div className="hero-type" style={{ color: ACC }}>{type}{MODE === "macro" ? " · outside-in" : ""}</div>
            <div className="hero-name">
              <span className="odot" style={{ background: ACC, boxShadow: `0 0 13px ${ACC}` }} />
              {bound ? C.semantic_name : (ID.charAt(0).toUpperCase() + ID.slice(1))}
            </div>
            {bound
              ? <div className="hero-sig">{C.defining_signature}</div>
              : <div className="hero-sig">External context — no money-movement bundle binding for this theme.</div>}
          </div>
          {side}
        </div>
        {bound && (
          <div className="idstrip">
            <span className={"statuspill st-" + status}>
              {(status === "spiking" || status === "confirmed") && (
                <span className="ld" style={{ background: "currentColor", boxShadow: "0 0 7px currentColor" }} />
              )}
              {STLAB[status]}
            </span>
            <span className="idtag"><span className="k">objective</span> <b style={{ color: ACC }}>{O.lab}</b></span>
            <span className="idtag"><span className="k">cluster</span> <b>{map.cluster}</b></span>
            <span className="idtag"><span className="k">drift</span> {driftPill}</span>
            <span className="idtag"><span className="k">policy</span> <b>{C.current_policy_version}</b></span>
            <span className="idtag"><span className="k">macro driver</span> <b>{macroFor(ID)}</b></span>
          </div>
        )}
      </>
    );
  };

  const renderHypotheses = () => {
    if (!bound) {
      return (
        <Section title="Hypotheses" empty>
          <div className="empty-note">No bundle binding — no hypotheses for this theme. Showing prototype context only.</div>
        </Section>
      );
    }
    const sorted = HYPS.slice().sort((a, b) => {
      if (a.highlighted !== b.highlighted) return a.highlighted ? -1 : 1;
      const na = Math.abs((metric(a.hypothesis_id, "nii_contribution") || { point_estimate: 0 }).point_estimate);
      const nb = Math.abs((metric(b.hypothesis_id, "nii_contribution") || { point_estimate: 0 }).point_estimate);
      if (na !== nb) return nb - na;
      return a.hypothesis_id < b.hypothesis_id ? -1 : 1;
    });
    return (
      <Section title="Hypotheses" desc="ranked by predicted outcome" extra={`${HYPS.length} bound · sort: highlighted, |NII|, id`}>
        <div className="grid g2">
          {sorted.map((h) => (
            <div
              key={h.hypothesis_id}
              className="hcard"
              style={{ borderLeftColor: ACC }}
              onClick={() => gotoPipeline(h.hypothesis_id)}
            >
              <div className="hc-top">
                <span className="hc-badge" style={{ color: ACC, background: ACC_SOFT }}>{shortH(h.hypothesis_id)}</span>
                {h.highlighted && <span className="hc-star">★</span>}
                <span className="hc-kind">{TWINX.kindLabel[h.intervention.kind]}</span>
                <span className="hc-life"><LifePill lc={h.lifecycle} /></span>
              </div>
              <div className="hc-title">{humanKind(h.intervention.kind)} · {C.semantic_name.split(" · ")[0]}</div>
              <div className="hc-desc">{h.intervention.description}</div>
              <div className="hc-params"><ParamTags pr={h.intervention.parameters} /></div>
              <div className="chips"><OutcomeChips po={h.predicted_outcome} /></div>
              <div className="hc-cta">
                <span
                  className="hc-open"
                  style={{ color: ACC, borderColor: hexA(ACC, 0.3) }}
                  onClick={(e) => { e.stopPropagation(); gotoPipeline(h.hypothesis_id); }}
                >
                  Open pipeline →
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    );
  };

  const renderFingerprintBody = () => {
    if (!bound) return null;
    const primary = TWINX.FEAT.slice(); // 22 axes, same ordering
    const idx = {};
    TWINX.FEAT.forEach((f, i) => { idx[f] = i; });
    const renderRow = (f) => {
      const v = C.centroid[idx[f]];
      if (v === undefined) return null;
      let disp, w;
      if (f === "avg_transaction_amount_cents") {
        disp = "$" + (v / 100).toLocaleString();
        w = Math.min(100, (v / 100) / 8000 * 100);
      } else if (f === "balance_trajectory_slope_90d") {
        disp = (v >= 0 ? "+" : "") + v.toFixed(2);
        w = Math.min(100, Math.abs(v) * 100 * 2.5);
      } else {
        disp = v.toFixed(2);
        w = Math.max(2, Math.min(100, v * 100));
      }
      return (
        <div key={f} className="fprow">
          <span className="fl">{f}</span>
          <span className="ft"><i style={{ width: `${w}%`, background: ACC }} /></span>
          <span className="fv">{disp}</span>
        </div>
      );
    };
    const first = primary.slice(0, 12).map(renderRow);
    const rest = primary.slice(12).map(renderRow);
    return (
      <Panel title="Centroid vector" meta="normalized 0–1 + raw">
        <div className="fp">{first}</div>
        <div className="fp" style={{ display: fpMore ? "" : "none", marginTop: 6 }}>{rest}</div>
        <div className="fpmore" onClick={() => setFpMore((x) => !x)}>
          {fpMore ? "show fewer ▴" : "show all 22 axes ▾"}
        </div>
      </Panel>
    );
  };

  const renderAnchorsBody = () => {
    if (!bound) return null;
    return (
      <Panel title="Counterparty anchors" meta="total_customers">
        <div className="anchorgrid">
          {TWINX.counterpartyAnchors.map((a) => (
            <div key={a.node} className="anchor">
              <div className="an">{a.node}</div>
              <div className="ak">{a.kind.replace(/_/g, " ")}</div>
              <div className="av" style={{ color: ACC }}>{a.total_customers.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "9.5px", color: "var(--ink-4)", marginTop: 9, fontStyle: "italic" }}>
          Six counterparty anchors are shared across clusters.
        </div>
      </Panel>
    );
  };

  const renderDriftFraudBody = () => {
    if (!bound) return null;
    const d = TWINX.driftInjections.byCluster[map.cluster] || 0;
    const f = TWINX.fraudInjections.byCluster[map.cluster] || 0;
    return (
      <Panel title="Injection counters" meta="resolved via cluster_placements">
        <div className="watch">
          <div className={"watchcard" + (d > 0 ? " hot" : "")}>
            <div className="wv">{d}</div>
            <div className="wl">Drift watch</div>
            <div className="ws">{d > 0 ? TWINX.driftInjections.pattern : "no drift in cluster"}</div>
          </div>
          <div className={"watchcard" + (f > 0 ? " hot" : "")}>
            <div className="wv">{f}</div>
            <div className="wl">Fraud watch</div>
            <div className="ws">{f > 0 ? TWINX.fraudInjections.pattern : "no fraud in cluster"}</div>
          </div>
        </div>
        {(d > 0 || f > 0)
          ? <div style={{ fontSize: "9.5px", color: "#ff8a5a", marginTop: 9, fontFamily: "var(--mono)" }}>
              → injected population drives the cockpit "spiking" flip for this theme.
            </div>
          : <div style={{ fontSize: "9.5px", color: "var(--ink-4)", marginTop: 9, fontStyle: "italic" }}>
              No flagged populations in this cluster.
            </div>}
      </Panel>
    );
  };

  const renderSim = () => {
    if (!bound) return null;
    const hd = TWINX.simHeader;
    return (
      <Section title="Simulation Summary" desc="predicted outcomes with confidence bounds" extra="per-hypothesis">
        <div className={"grid " + (HYPS.length > 1 ? "g2" : "")}>
          {HYPS.map((h) => {
            const sim = TWINX.simulations[h.hypothesis_id];
            if (!sim) return null;
            return (
              <Panel
                key={h.hypothesis_id}
                title={`${shortH(h.hypothesis_id)} · ${sim.metrics.length} metric${sim.metrics.length > 1 ? "s" : ""}`}
                meta="95% bootstrap CI"
              >
                <div className="forest">
                  {sim.metrics.map((m) => {
                    const lo = m.ci_lower;
                    const hi = m.ci_upper;
                    const pt = m.point_estimate;
                    const span = Math.max(Math.abs(lo), Math.abs(hi), Math.abs(pt)) * 1.15 || 1;
                    const x = (v) => (v / span * 50 + 50);
                    const bandLo = Math.min(x(lo), x(hi));
                    const bandHi = Math.max(x(lo), x(hi));
                    const good = m.direction === "negative_good" ? pt < 0 : pt > 0;
                    const col = good ? "var(--green)" : "var(--red)";
                    let dispPt, dispCI;
                    if (m.unit === "usd_cents") { dispPt = fmtUSDc(pt); dispCI = fmtUSDc(lo) + " – " + fmtUSDc(hi); }
                    else if (m.unit === "bps") { dispPt = (pt > 0 ? "+" : "") + pt + " bps"; dispCI = lo + " – " + hi; }
                    else if (m.unit === "pp") { dispPt = (pt > 0 ? "+" : "") + pt + " pp"; dispCI = lo + " – " + hi; }
                    else if (m.unit === "pct") { dispPt = pt + "%"; dispCI = lo + " – " + hi; }
                    else { dispPt = (pt > 0 ? "+" : "") + pt.toLocaleString(); dispCI = lo + " – " + hi; }
                    return (
                      <div key={m.metric_id} className="metricrow">
                        <span className="mname">{m.metric_id}</span>
                        <span className="ci">
                          <span className="axis" />
                          <span className="zero" style={{ left: "50%" }} />
                          <span
                            className="band"
                            style={{
                              left: `${bandLo.toFixed(1)}%`,
                              width: `${(bandHi - bandLo).toFixed(1)}%`,
                              background: hexA(good ? "#42e08b" : "#ff7a7a", 0.35),
                            }}
                          />
                          <span
                            className="pt"
                            style={{ left: `${x(pt).toFixed(1)}%`, background: col }}
                          />
                        </span>
                        <span className="mval">
                          {dispPt}
                          <span className="ci-txt">{dispCI}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            );
          })}
        </div>
        <div className="simconst">
          <span className="sc">bootstrap_iterations <b>{hd.bootstrap_iterations}</b></span>
          <span className="sc">ci_level <b>{hd.ci_level}</b></span>
          <span className="sc">random_seed <b>{hd.random_seed}</b></span>
          <span className="sc">cluster_sample_size <b>{hd.cluster_sample_size}</b></span>
        </div>
      </Section>
    );
  };

  const renderCC = () => {
    if (!bound) return null;
    const ccH = HYPS.find((h) => TWINX.championChallenger[h.hypothesis_id]);
    if (!ccH) {
      return (
        <Section title="Live trial results" desc="weekly results" empty>
          <div className="empty-note">No live trial yet for this theme&apos;s hypotheses.</div>
        </Section>
      );
    }
    const cc = TWINX.championChallenger[ccH.hypothesis_id];
    return (
      <Section
        title="Live trial results"
        desc={`weekly results · ${shortH(ccH.hypothesis_id)}`}
        extra={`winner @ week ${cc.fires_at_week}`}
      >
        <Panel title="Sequential test stream" meta="step-up friction rate">
          <table className="cctable">
            <thead>
              <tr>
                <th>week</th><th>treat n</th><th>ctrl n</th><th>treat fric</th><th>ctrl fric</th><th>lift (95% CI)</th><th>stop</th>
              </tr>
            </thead>
            <tbody>
              {cc.stream.map((w) => {
                const fired = w.stopping_rule_resolution === "winner";
                return (
                  <tr key={w.week} className={fired ? "fired" : ""}>
                    <td>{w.week}</td>
                    <td>{w.treatment_n.toLocaleString()}</td>
                    <td>{w.control_n}</td>
                    <td>{(w.treatment_friction_rate * 100).toFixed(2) + "%"}</td>
                    <td>{(w.control_friction_rate * 100).toFixed(2) + "%"}</td>
                    <td>{`${(w.lift_point_estimate * 100).toFixed(2)}% (${(w.lift_ci_lower * 100).toFixed(1)}, ${(w.lift_ci_upper * 100).toFixed(1)})`}</td>
                    <td className={fired ? "winner" : "pending"}>{w.stopping_rule_resolution}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="simconst">
            <span className="sc">primary_metric <b>{cc.primary_metric}</b></span>
            <span className="sc">treatment_fraction <b>{cc.treatment_fraction}</b></span>
            <span className="sc">weeks_simulated <b>{cc.weeks_simulated}</b></span>
            <span className="sc">fires_at_week <b>{cc.fires_at_week}</b></span>
          </div>
        </Panel>
      </Section>
    );
  };

  const renderPersonas = () => {
    if (!bound) return null;
    const ps = TWINX.personas.filter((p) => p.cluster_id === map.cluster);
    if (!ps.length) {
      return (
        <Section title="Personas" desc="customer examples" empty>
          <div className="empty-note">No persona bound to this cluster — 6 of 8 clusters have no persona in the bundle.</div>
        </Section>
      );
    }
    return (
      <Section title="Personas" desc="customer examples" extra={`${ps.length} bound to cluster`}>
        <div className="pcards">
          {ps.map((p) => {
            const init = p.name.split(" ").map((x) => x[0]).join("");
            // Bold $-amount tokens inside the summary, render as JSX (no innerHTML).
            const parts = p.demo_moment.summary.split(/(\$[\d,]+)/g);
            return (
              <div key={p.persona_id} className="persona">
                <div className="persona-h">
                  <div className="pav">{init}</div>
                  <div>
                    <div className="pname">{p.name}</div>
                    <div className="psub">{p.subtitle}</div>
                  </div>
                  <span className="ptag">{p.tagline}</span>
                  <span className="platency">
                    latency<br />
                    {p.expected_latency_band_ms[0]}–{p.expected_latency_band_ms[1]} ms
                  </span>
                </div>
                <div className="persona-b">
                  <div className="pmoment">
                    <div className="pmlabel">Demo moment · segment {p.demo_moment.segment}</div>
                    <div className="pmsum">
                      {parts.map((t, i) =>
                        /^\$[\d,]+$/.test(t) ? <b key={i} style={{ color: ACC }}>{t}</b> : <span key={i}>{t}</span>
                      )}
                    </div>
                    {p.demo_moment.facts.map((f, i) => (
                      <div key={i} className="pfact"><span className="fk">✓</span><span>{f}</span></div>
                    ))}
                  </div>
                  <div className="ptrace">
                    <div className="pmlabel">Decision trace</div>
                    <div className="trace">
                      {p.trace.map((t, i) => (
                        <div key={i}>
                          <span className="ts">{t.step}</span>
                          {t.lines.map((l, j) => <span key={j} className="tl">{l}</span>)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="persona-cta">
                  <span
                    className="pplay"
                    style={{ color: ACC, borderColor: hexA(ACC, 0.3) }}
                    onClick={() => gotoPipeline(p.bound_hypothesis)}
                  >
                    Play in pipeline → {shortH(p.bound_hypothesis)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    );
  };

  /* renderGov() — the schema/sha256 technical footer used to render here.
     Removed entirely; not for user-facing surfaces. */

  /* ============ assemble ============ */
  const pageStyle = { "--acc": ACC, "--acc-soft": ACC_SOFT };
  const cbName = bound ? C.semantic_name : (ID.charAt(0).toUpperCase() + ID.slice(1));

  // B2B themes are redirecting (effect above) — render nothing meanwhile.
  if (b2bTheme) return null;

  return (
    <PageShell>
    <div className="theme-page" style={pageStyle}>
      <div className="appbar appbar-crumb">
        {/* Breadcrumb only — Logo + ThemeToggle live in GlobalTopBar. */}
        <div className="ab-crumb">
          <a onClick={() => navigate("/")}>Hypothesis Hub</a>
          <span className="sep">/</span>
          <span className="cur">{MODE === "macro" ? "Outside-In" : "Inside-Out"}</span>
          <span className="sep">/</span>
          <span className="cur" style={{ color: ACC }}>{cbName}</span>
        </div>
        <div className="ab-sp" />
        <span className="ab-chip"><span className="k">ref</span> <b>{TWINX.manifest.reference_date}</b></span>
        <span className="ab-chip"><span className="k">seed</span> <b>42</b></span>
      </div>
      <div className="scroll">
        <div className="wrap">
          {renderHero()}
          {ID === "retention" ? (
            /* retention theme: NOT bundle-bound (no TWINX.themeMap entry),
               so it falls outside the `bound` branch below. Hoisted here to
               render its SignalsSection directly. Mirrors gig's signal-card
               pattern: 3 mechanism-distinct hypotheses (A=price, B=primacy,
               C=banker). Strategy A starred. */
            <SignalsSection
              signals={retentionSignals}
              accent={ACC}
              onOpen={(hid) => openSignalInLoop(hid)}
            />
          ) : ID === "liquidity" ? (
            /* liquidity theme: NOT bundle-bound; renders its own 3 signal
               cards and opens into the workspaces decision loop (same flow as
               retention: Analyze → TestModeChooser popup → Simulate → Deploy). */
            <SignalsSection
              signals={liquiditySignals}
              accent={ACC}
              onOpen={(hid) => openSignalInLoop(hid)}
            />
          ) : ID === "wealth" ? (
            /* wealth theme: NOT bundle-bound; renders its own 3 strategy cards
               (advice-ready / movers / digital) and opens into the workspaces
               decision loop. The motion is never named here — only the goal. */
            <SignalsSection
              signals={wealthSignals}
              accent={ACC}
              onOpen={(hid) => openSignalInLoop(hid)}
            />
          ) : bound ? (
            <>
              {ID === "gig" ? (
                /* gig theme: signals ARE the curated hypotheses (each card
                   embeds "TwinX recommends: …"). No separate hypothesis
                   section — would just duplicate the same entry surface. */
                <SignalsSection
                  signals={gigSignals}
                  accent={ACC}
                  onOpen={(hid) => openSignalInLoop(hid)}
                />
              ) : (
                <>
                  {renderHypotheses()}
                  <div className="grid g23" style={{ marginTop: 20 }}>
                    <div>
                      <Section title="Segment Fingerprint" desc="cluster behavioral signature" extra={map.cluster}>
                        {renderFingerprintBody()}
                      </Section>
                    </div>
                    <div>
                      <Section title="Anchor Structure" desc="counterparty graph" extra="6 counterparty types">
                        {renderAnchorsBody()}
                      </Section>
                      <Section title="Drift & Fraud Watch" desc="flagged populations" extra="cluster-scoped">
                        {renderDriftFraudBody()}
                      </Section>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            renderHypotheses()
          )}
          {/* renderGov() — technical schema/sha256 footer removed; not for
              user-facing surfaces. Kept the function in place in case we
              need a dev-only debug toggle later. */}
        </div>
      </div>
    </div>
    </PageShell>
  );
}
