import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageContext } from "@/state/pageContext";
import { useAppShell } from "@/state/AppShell";
import { PAGE_KB } from "@/data/askTwinxKb";
import { llmConfigured, askLlm, buildSystemPrompt } from "@/data/askTwinxLlm";
import { AskChart } from "@/components/AskTwinxCharts";
import "@/styles/companion.css";

// Short tag helpers so knowledge-base body trees stay readable.
const B = ({ children }) => <b>{children}</b>;
const G = ({ children }) => <span className="g">{children}</span>;
const H = ({ children }) => <span className="h">{children}</span>;
const R = ({ children }) => <span className="r">{children}</span>;
const B2 = ({ children }) => <span className="b2">{children}</span>;
const I = ({ children }) => <i>{children}</i>;

const LN = { FR: "Franchise", CO: "Competitive", RR: "Risk & Reg", CA: "Capital" };

// Route table — same intent as the original PAGE map but pointing at the
// React routes we own. Theme deep-links carry a query param.
const PAGE = {
  gig: "/gig-pipeline",
  elder: "/deep-pipeline?theme=elder",
  home: "/deep-pipeline?theme=home",
  churn: "/deep-pipeline?theme=churn",
  liquidity: "/?seed_route=analyse&seed_theme=liquidity",
};

// Each KB entry: keyword score → response body, optional evidence tiles,
// optional trace breadcrumbs, optional CTA into a pipeline page.
const KB = [
  { id: "week", lens: "CA", keys: ["decide", "decision", "this week", "summary", "what did", "happened", "overview", "recap"],
    head: "Four decisions — two acted, one testing, one refused.",
    body: <>TwinX chose <B>where not to act</B>: <G>deployed</G> auto retention + claims-experience save, <H>testing</H> bundle-at-home-purchase, <R>refused</R> blanket rideshare acceptance on loss drift. Each ladders to a named USRM priority.</>,
    ev: [{ c: "g", v: "+$19.3M", l: "auto" }, { c: "g", v: "−30%", l: "claims" }, { c: "a", v: "+$87M", l: "home" }, { c: "r", v: "held", l: "rideshare" }],
    tr: ["Cockpit", "themes", "pipelines"], cta: null },
  { id: "onedollar", lens: "CA", keys: ["one more dollar", "invest", "where", "allocate", "capital", "prioritize", "priority", "roi", "best return"],
    head: "Retention first, then bundle — highest risk-adjusted return.",
    body: <>1st dollar → <H>precision auto retention</H> (Retention Ops owner, NWP protected + CAC avoided + the fair-lending teeth that make the portfolio credible). 2nd → <H>bundle-at-home-purchase</H> (7.0-yr tenure, suitability-gated). Blanket rideshare accept earns <I>negative</I> investment — hold on loss drift.</>,
    ev: [{ c: "g", v: "1st", l: "auto" }, { c: "a", v: "2nd", l: "home" }, { c: "r", v: "hold", l: "rideshare" }],
    tr: ["Value×feasibility", "Portfolio", "allocation"], cta: { t: "Retention pipeline", theme: "churn" } },
  { id: "feegap", lens: "CO", keys: ["bundle", "cross-sell", "gap", "lag", "lags", "behind", "penetration", "attach"],
    head: "Turn a renewal signal into a bundled household.",
    body: <>Bundled households retain <B2>7.0 yrs vs 5.5</B2> — the USRM President's #1 priority. <H>Bundle-at-home-purchase</H> converts a property signal into auto+home; the save moment surfaces a pre-filled home/umbrella quote. Same signal retains and cross-sells (+15–25% uplift).</>,
    ev: [{ c: "s", v: "+15–25%", l: "cross-sell" }, { c: "a", v: "+$87M", l: "home" }, { c: "v", v: "+18pp", l: "attach" }],
    tr: ["Home-purchase signals", "Home", "bundle + retention"], cta: { t: "Bundle pipeline", theme: "home" } },
  { id: "efficiency", lens: "CA", keys: ["combined ratio", "cr", "efficiency", "loss ratio", "cost", "expense", "productivity", "cost-to-serve"],
    head: "It compounds the underwriting discipline you're posting.",
    body: <>Combined ratio hit <B2>82.2%</B2> (underlying 79.9%) — best in two decades. TwinX concentrates saves in high-LTV/low-loss segments, uses selective non-renewal, and avoids CAC ($200–800/policy) — net 0.8–2.2pt sustained CR improvement while restoring growth.</>,
    ev: [{ c: "s", v: "82.2%", l: "combined ratio" }, { c: "s", v: "79.9%", l: "underlying" }, { c: "g", v: "CAC-avoided", l: "retention" }],
    tr: ["Precision retention", "All themes", "CR ↓"], cta: null },
  { id: "payments", lens: "CO", keys: ["digital", "engagement", "experience", "contentsquare", "portal", "app", "channel", "nba"],
    head: "Digital engagement is the earliest churn tell — TwinX makes it intelligent.",
    body: <>Engagement drop leads a competitor quote by 30–45 days. TwinX sits on that ContentSquare substrate: it senses a cooling high-LTV household and intervenes per-customer through the preferred channel — app or Comparion agent — as a <B2>real-time next-best-action</B2>, not a batch blast.</>,
    ev: [{ c: "b", v: "channels", l: "app·email·agent" }, { c: "g", v: "+$19.3M", l: "NWP" }, { c: "v", v: "NBA", l: "per-customer" }],
    tr: ["Engagement signals", "Retention", "NBA substrate"], cta: { t: "Retention pipeline", theme: "churn" } },
  { id: "retention", lens: "FR", keys: ["retention", "risk", "losing", "lapse", "leave", "leaving", "biggest risk", "retain", "shopping"],
    head: "Two fronts — opposite responses.",
    body: <><B>Fixed:</B> high-LTV renewals <R>shopping after a broad-brush rate action</R> — a capped rate + retention offer held them. <B>Held:</B> blanket rideshare acceptance — the loss model is <R>drifting</R>, so accepting is pricing on noise.</>,
    ev: [{ c: "g", v: "+$19.3M", l: "NWP protected" }, { c: "g", v: "−2.3pp", l: "lapse" }, { c: "r", v: "$15M", l: "rideshare forgone" }],
    tr: ["Signals", "Auto+Rideshare", "deploy vs refuse"], cta: { t: "Retention pipeline", theme: "churn" } },
  { id: "deposit", lens: "FR", keys: ["book", "nwp", "premium", "base", "franchise", "combined ratio", "retention", "how big"],
    head: "~3M policies in force — best combined ratio in two decades (82.2%).",
    body: <>That book is the engine — but auto retention collapsed <B>7.1pt to 66.4%</B> and NWP fell 6.4%. Precision repricing defends the high-LTV shoppers; bundle-attach deepens single-line households; the rideshare gap is where we held discipline not to accept mis-rated risk.</>,
    ev: [{ c: "s", v: "~3M", l: "policies" }, { c: "s", v: "82.2%", l: "combined ratio" }, { c: "g", v: "retention", l: "auto+bundle" }],
    tr: ["Renewal signals", "Themes", "NWP"], cta: null },
  { id: "churnwhy", lens: "RR", keys: ["why not", "accept", "rideshare", "broad", "gig", "loss", "refuse", "refused", "drift", "hold"],
    head: "The loss model is drifting — don't price on noise.",
    body: <>$15M looks good, but rideshare loss behaviour shifts faster than the model tracks (<R>rideshare_loss_drift</R>) — accepting risks mis-rating genuine risk + adverse selection. The gate <R>refused</R> it. The system working.</>,
    ev: [{ c: "r", v: "drift", l: "380 inj" }, { c: "r", v: "refused", l: "Model Risk" }, { c: "a", v: "$15M", l: "forgone" }],
    tr: ["Rideshare signals", "Gate", "gate refuses"], cta: { t: "See the refusal", theme: "gig" } },
  { id: "elder", lens: "RR", keys: ["claims", "claim", "experience", "nps", "settlement", "save", "service", "cycle"],
    head: "A poor claim lapses — intercept it early, proven ethically.",
    body: <>A long-cycle, low-NPS claim is <B>flagged</B> for a proactive save before renewal (~−30% claims-driven leakage). Proven by <H>stepped-wedge</H> — no claimant denied service. Guardrail is inverted: the risk is <R>over-contacting</R> a customer mid-claim.</>,
    ev: [{ c: "g", v: "−30%", l: "leakage" }, { c: "g", v: "$6.7M", l: "NWP protected" }, { c: "a", v: "ceiling", l: "harm guard" }],
    tr: ["Claims+NPS signals", "Claims", "stepped-wedge"], cta: { t: "Claims pipeline", theme: "elder" } },
  { id: "giglimit", lens: "CO", keys: ["what if", "accept", "rideshare", "limit", "limits", "all gig", "broaden", "everyone", "blanket"],
    head: "It backfires past a point.",
    body: <>Acting on a <B2>verified rideshare-endorsement need</B2> is safe; blanket acceptance without the loss gate opens adverse selection — the gate <R>hard-kills</R> it. Not more acceptance — more underwriting signal per unit of premium.</>,
    ev: [{ c: "g", v: "+premium", l: "verified" }, { c: "r", v: "breach", l: "blanket" }, { c: "b", v: "live", l: "trade-off" }],
    tr: ["Rideshare", "Simulate", "loss guardrail"], cta: { t: "Run the simulator", theme: "gig" } },
  { id: "notdoing", lens: "RR", keys: ["not doing", "not do", "restraint", "avoid", "discipline", "hold back", "choosing not", "deliberately"],
    head: "Holding the blanket rideshare acceptance — on purpose.",
    body: <>The most valuable move can be <B>nothing</B>. A ~$15M play was <R>refused</R> on loss drift — logged, Model-Risk-backed. A risk-adjusted decision, not a missed one.</>,
    ev: [{ c: "r", v: "refused", l: "rideshare" }, { c: "r", v: "drift", l: "unstable" }, { c: "g", v: "protected", l: "loss ratio+fairness" }],
    tr: ["Rideshare", "gate", "restraint"], cta: { t: "See the refusal", theme: "gig" } },
  { id: "board", lens: "CA", keys: ["board", "directors", "what will they ask", "audit committee", "downside", "wrong", "worst case"],
    head: "Growth, combined ratio, risk, capital — one frame.",
    body: <>Growth (bundle → home), combined ratio (precision saves + selective non-renewal), risk (gate teeth → NAIC 24-08), capital (tested, reversible, gate prefers 'no'). The answer the board remembers is the <R>refusal</R> — proof of judgement.</>,
    ev: [{ c: "a", v: "growth", l: "bundle" }, { c: "g", v: "CR held", l: "82.2%" }, { c: "r", v: "restraint", l: "rideshare" }],
    tr: ["Board lenses", "Portfolio", "one frame"], cta: null },
  { id: "growth", lens: "CO", keys: ["growth", "acquisition", "grow", "bundle", "new business", "upside", "where growth", "life event", "life-event", "organic"],
    head: "Life events — where a household re-decides its coverage.",
    body: <>A home purchase opens a <B2>bundle window</B2>: a pre-filled quote → <H>+$87M</H> bundle NWP, +18pp attach. Consent-aware test — a bundle offer is a recommendation.</>,
    ev: [{ c: "a", v: "+$87M", l: "bundle" }, { c: "v", v: "+18pp", l: "attach" }, { c: "v", v: "25%", l: "cross-sell" }],
    tr: ["Home-purchase signals", "Home", "consent-aware"], cta: { t: "Bundle pipeline", theme: "home" } },
];

const TOPIC_TAGS = ["auto", "claims", "renewal", "home", "rideshare", "rate", "bundle", "growth", "limit", "book", "combined ratio", "digital", "efficiency", "board", "capital", "invest"];

function matchKB(q) {
  q = q.toLowerCase();
  let best = null, bs = 0;
  KB.forEach((e) => {
    let s = 0;
    e.keys.forEach((k) => { if (q.indexOf(k) >= 0) s += (k.indexOf(" ") >= 0 ? 2 : 1); });
    TOPIC_TAGS.forEach((t) => { if (q.indexOf(t) >= 0 && e.keys.indexOf(t) >= 0) s += 1; });
    if (s > bs) { bs = s; best = e; }
  });
  return bs >= 2 ? best : null;
}

/* Match against the current page's contextual KB first (lower threshold — the
   presets map closely). Returns a normalized entry with a rendered node. */
function matchPageKb(pageKb, q, facts) {
  if (!pageKb) return null;
  q = q.toLowerCase();
  let best = null, bs = 0;
  pageKb.answers.forEach((a) => {
    let s = 0;
    a.keys.forEach((k) => { if (q.indexOf(k) >= 0) s += (k.indexOf(" ") >= 0 ? 2 : 1); });
    if (s > bs) { bs = s; best = a; }
  });
  if (bs < 1) return null;
  return { pageAnswer: true, head: best.head, node: typeof best.body === "function" ? best.body(facts) : best.body };
}

const QUICK_PICKS = [
  "If I had one more dollar to invest, where?",
  "How do we close the bundle-penetration gap?",
  "Why aren't we accepting rideshare risk broadly?",
  "What are we deliberately NOT doing?",
];

function Evidence({ items }) {
  return (
    <div className="tc-ev">
      {items.map((x, i) => (
        <div key={i} className={`tc-evc ${x.c}`}>
          <span className="v">{x.v}</span>
          <span className="l">{x.l}</span>
        </div>
      ))}
    </div>
  );
}

function Trace({ steps }) {
  return (
    <div className="tc-tr">
      {steps.map((k, i) => (
        <span key={i}>{i ? "→" : ""}<span className="k">{k}</span></span>
      ))}
    </div>
  );
}

const GENERAL_SEED = (
  <>I can walk you through the strategy in play — the customer cohorts, the scenarios and the policies on the table, and what the numbers mean for the business. Ask me anything, or start with a question below.</>
);

/* Light formatter for live answers: **bold**, '- ' bullets, short paragraphs. */
function fmtInline(s) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p
  );
}

/* Ask TwinX mark — an AI "sparkle" cluster, inherits currentColor. */
function TwinXMark({ size = 15, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M10 1 L12.6 6.4 18 9 12.6 11.6 10 17 7.4 11.6 2 9 7.4 6.4 Z" />
      <path d="M18.5 14 L19.6 16.4 22 17.5 19.6 18.6 18.5 21 17.4 18.6 15 17.5 17.4 16.4 Z" opacity="0.6" />
    </svg>
  );
}

function LlmAnswer({ text, facts }) {
  const lines = text.split(/\n/);
  const blocks = [];
  let bullets = [];
  const flush = () => { if (bullets.length) { blocks.push({ t: "ul", items: bullets }); bullets = []; } };
  lines.forEach((raw) => {
    const l = raw.trim();
    if (!l) { flush(); return; }
    const chart = l.match(/^\[\[chart:(\w+)\]\]$/i);
    if (chart) { flush(); blocks.push({ t: "chart", metric: chart[1] }); return; }
    if (/^[-•*]\s+/.test(l)) { bullets.push(l.replace(/^[-•*]\s+/, "")); return; }
    flush(); blocks.push({ t: "p", text: l });
  });
  flush();
  return (
    <>
      {blocks.map((bk, i) =>
        bk.t === "ul" ? <ul className="tc-ul" key={i}>{bk.items.map((it, j) => <li key={j}>{fmtInline(it)}</li>)}</ul>
        : bk.t === "chart" ? <AskChart key={i} facts={facts} kind={bk.metric} />
        : <div className="tc-p" key={i}>{fmtInline(bk.text)}</div>
      )}
    </>
  );
}

export function CxoCompanion() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [tracing, setTracing] = useState(false);
  const [input, setInput] = useState("");
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { page } = usePageContext();
  const { selectedThemeId } = useAppShell();
  const useCase = page?.facts?.useCase || selectedThemeId;
  const pageKb = page?.id ? PAGE_KB[page.id] : null;
  const presets = pageKb?.presets || QUICK_PICKS;
  const seedNode = pageKb ? pageKb.seed(page.facts) : GENERAL_SEED;

  // Each page is a fresh contextual session — clear the thread when the page changes.
  useEffect(() => { setMessages([]); }, [page?.id]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, tracing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const followCta = (theme) => {
    const route = PAGE[theme];
    if (!route) return;
    setOpen(false);
    navigate(route);
  };

  // Deterministic fallback — used when the live model is off or errors.
  const answerFromKb = (q) => {
    const e = matchPageKb(pageKb, q, page?.facts) || matchKB(q);
    setMessages((prev) => [...prev, { kind: "tx", entry: e }]);
  };

  const ask = async (q) => {
    if (!q.trim()) return;
    const prior = messages;
    setMessages((prev) => [...prev, { kind: "ceo", text: q }]);
    setTracing(true);
    // Live answer, grounded in the current page context. KB is the fallback.
    if (llmConfigured()) {
      try {
        const history = prior
          .map((m) => m.kind === "ceo"
            ? { role: "user", content: m.text }
            : { role: "assistant", content: m.entry?.text || m.entry?.head || "" })
          .filter((m) => m.content)
          .slice(-6);
        const text = await askLlm({ question: q, system: buildSystemPrompt(page?.id, page?.facts, useCase), history });
        setTracing(false);
        if (text) { setMessages((prev) => [...prev, { kind: "tx", entry: { llm: true, text, facts: page?.facts } }]); return; }
        answerFromKb(q);
        return;
      } catch (err) {
        setTracing(false);
        answerFromKb(q);
        return;
      }
    }
    setTimeout(() => { setTracing(false); answerFromKb(q); }, 600 + Math.random() * 300);
  };

  const onSend = () => {
    if (!input.trim()) return;
    const q = input;
    setInput("");
    ask(q);
  };

  return (
    <>
      <button id="tc-launch" onClick={() => setOpen(true)}>
        <span className="tc-pulse" /> <TwinXMark size={15} className="tc-launch-mark" /> Ask TwinX
      </button>
      <div id="tc-back" className={open ? "on" : ""} onClick={() => setOpen(false)} />
      <div id="tc-drawer" className={(open ? "on" : "") + (expanded ? " expanded" : "")}>
        <div className="tc-h">
          <div className="tc-row">
            <div className="tc-av"><TwinXMark size={16} /></div>
            <div>
              <div className="tc-t">Ask TwinX</div>
              <div className="tc-s">your strategic companion{pageKb ? ` · ${pageKb.label}` : ""}</div>
            </div>
            <button
              className="tc-expand"
              title={expanded ? "Minimise" : "Maximise"}
              aria-label={expanded ? "Minimise" : "Maximise"}
              onClick={() => setExpanded((v) => !v)}
            >{expanded ? "⤡" : "⤢"}</button>
            <button className="tc-x" onClick={() => setOpen(false)}>×</button>
          </div>
        </div>

        <div className="tc-thread" ref={threadRef}>
          {/* Greeting + contextual orientation — always reflects the current page */}
          <div className="tc-msg tx">
            <div className="tc-ax tx"><TwinXMark size={13} /></div>
            <div className="tc-bub">
              <div className="tc-greet">Hi, I'm the <b>TwinX AI companion</b> — here to help you think through the strategy and the decisions behind it.</div>
              {seedNode}
            </div>
          </div>

          {messages.map((m, i) => {
            if (m.kind === "ceo") {
              return (
                <div key={i} className="tc-msg tc-ceo">
                  <div className="tc-ax ce">You</div>
                  <div className="tc-bub">{m.text}</div>
                </div>
              );
            }
            const e = m.entry;
            return (
              <div key={i} className="tc-msg tx">
                <div className="tc-ax tx"><TwinXMark size={13} /></div>
                <div className="tc-bub">
                  {e && e.llm ? (
                    <LlmAnswer text={e.text} facts={e.facts || page?.facts} />
                  ) : e && e.pageAnswer ? (
                    <>
                      <div className="head">{e.head}</div>
                      {e.node}
                    </>
                  ) : e ? (
                    <>
                      <span className="tc-lt">{LN[e.lens]} lens</span>
                      <div className="head">{e.head}</div>
                      {e.body}
                      {e.ev && <Evidence items={e.ev} />}
                      {e.tr && <Trace steps={e.tr} />}
                      {e.cta && (
                        <a className="tc-cta" onClick={() => followCta(e.cta.theme)}>↳ {e.cta.t}</a>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="head">Let me think about that.</div>
                      I can explain what's on this page, what drove it, and the trade-offs. Try one of the suggestions below, or ask a follow-up.
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {tracing && (
            <div className="tc-msg tx">
              <div className="tc-ax tx"><TwinXMark size={13} /></div>
              <div className="tc-bub"><span className="tc-spin" />reading the page + tracing the decision…</div>
            </div>
          )}
        </div>

        <div className="tc-comp">
          <div className="tc-chips">
            {presets.map((p) => (
              <span key={p} className="tc-chip" onClick={() => ask(p)}>{p}</span>
            ))}
          </div>
          <div className="tc-in">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
              placeholder={pageKb ? "Ask about this page…" : "Ask anything…"}
              autoComplete="off"
            />
            <button className="tc-send" onClick={onSend}>↑</button>
          </div>
          <div className="tc-seam">{llmConfigured() ? "● " : ""}{pageKb ? `${llmConfigured() ? "Live · contextual" : "Contextual"} to ${pageKb.label.toLowerCase()}` : (llmConfigured() ? "Live · grounded in Q1 2026 disclosures" : "Grounded in Q1 2026 disclosures · full sourcing in the companion")}</div>
        </div>
      </div>
    </>
  );
}
