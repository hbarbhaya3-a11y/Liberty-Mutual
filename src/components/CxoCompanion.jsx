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
    body: <>TwinX chose <B>where not to act</B>: <G>deployed</G> gig + elder, <H>testing</H> life-event capture, <R>refused</R> rate repricing on drift. Each ladders to a named priority.</>,
    ev: [{ c: "g", v: "+$56M", l: "gig" }, { c: "g", v: "−1.8bps", l: "elder" }, { c: "a", v: "+$87M", l: "home" }, { c: "r", v: "held", l: "churn" }],
    tr: ["Cockpit", "4 themes", "4 pipelines"], cta: null },
  { id: "onedollar", lens: "CA", keys: ["one more dollar", "invest", "where", "allocate", "capital", "prioritize", "priority", "roi", "best return"],
    head: "Protection first, then growth — highest risk-adjusted return.",
    body: <>1st dollar → <H>elder loss-prevention</H> (CRO buyer, avoided loss + the gate-teeth that make the portfolio credible). 2nd → <H>life-event capture</H> (growth + fee gap, suitability-gated). Churn earns <I>negative</I> investment — hold on drift.</>,
    ev: [{ c: "g", v: "1st", l: "elder" }, { c: "a", v: "2nd", l: "home" }, { c: "r", v: "hold", l: "churn" }],
    tr: ["Value×feasibility", "Portfolio", "allocation"], cta: { t: "Elder pipeline", theme: "elder" } },
  { id: "feegap", lens: "CO", keys: ["fee", "fee growth", "gap", "lag", "lags", "behind industry", "100 basis", "noninterest"],
    head: "Turn money-movement signal into fee-bearing relationships.",
    body: <>Fee income grew <B2>6.9%</B2>, but the bank names it ~100bps below industry. <H>Life-event capture</H> converts a liquidity moment into advisory + primacy; payments deepens card/merchant. Same signal retains and cross-sells.</>,
    ev: [{ c: "s", v: "+6.9%", l: "fee YoY" }, { c: "a", v: "+$87M", l: "home" }, { c: "v", v: "+18pp", l: "attach" }],
    tr: ["Life-event signals", "Home", "fee + primacy"], cta: { t: "Life-event pipeline", theme: "home" } },
  { id: "efficiency", lens: "CA", keys: ["efficiency", "efficiency ratio", "cost", "operating leverage", "expense", "productivity", "cost-to-serve"],
    head: "It compounds the operating leverage you're posting.",
    body: <>Efficiency improved to <B2>58.2%</B2> on 440bps positive operating leverage. TwinX automates decisions, drops contact-centre + fraud cost, and takes loss out (elder) — intelligence arbitrage, no added headcount.</>,
    ev: [{ c: "s", v: "58.2%", l: "efficiency" }, { c: "s", v: "440bps", l: "op. leverage" }, { c: "g", v: "cost", l: "gig+elder" }],
    tr: ["Automation", "All themes", "cost ↓"], cta: null },
  { id: "payments", lens: "CO", keys: ["payments", "payment", "transformation", "money movement", "zelle", "embedded", "interconnected", "rail"],
    head: "Money-movement is the first engagement — TwinX makes it intelligent.",
    body: <>Embedded payments are how the bank retains/deepens/grows. TwinX sits on that substrate: it senses a failing rail and intervenes per-decision. Gig is the proof — payments friction solved as a <B2>real-time decision</B2>.</>,
    ev: [{ c: "b", v: "rails", l: "Zelle·ACH·RTP" }, { c: "g", v: "−236,000", l: "friction" }, { c: "v", v: "first", l: "engagement" }],
    tr: ["Money-movement", "Gig", "substrate"], cta: { t: "Gig pipeline", theme: "gig" } },
  { id: "retention", lens: "FR", keys: ["retention", "risk", "losing", "attrition", "leave", "leaving", "biggest risk", "retain"],
    head: "Two fronts — opposite responses.",
    body: <><B>Fixed:</B> gig rent <R>failing on a static ceiling</R> — lift removed ~236,000 frictions. <B>Held:</B> rate-sensitive balances — the model is <R>drifting</R>, so chasing is pricing on noise.</>,
    ev: [{ c: "g", v: "+$56M", l: "gig NII" }, { c: "g", v: "−236,000", l: "failures" }, { c: "r", v: "+$15M", l: "churn forgone" }],
    tr: ["Signals", "Gig+Churn", "deploy vs refuse"], cta: { t: "Gig pipeline", theme: "gig" } },
  { id: "deposit", lens: "FR", keys: ["deposit", "nii", "balance", "base", "franchise", "funding", "margin", "interest", "how big"],
    head: "~$515B in deposits — record consumer, at a 2.77% margin.",
    body: <>That base is the engine. At this scale a few bps of retained rate across half a trillion moves <B>NII materially</B>. Retention themes defend it; churn is where we held discipline not to chase the elastic tail.</>,
    ev: [{ c: "s", v: "~$515B", l: "deposits" }, { c: "s", v: "2.77%", l: "NIM" }, { c: "g", v: "retention", l: "gig+elder" }],
    tr: ["Deposit signals", "Themes", "NII"], cta: null },
  { id: "churnwhy", lens: "RR", keys: ["why not", "reprice", "repricing", "rate-sensitive", "rate sensitive", "price", "pricing", "refuse", "refused", "drift", "hold"],
    head: "The model is drifting — don't price on noise.",
    body: <>~$15M looks good, but behaviour shifts faster than the model tracks (<R>rate_sensitive_drift</R>) — deploying risks mis-pricing sticky customers + UDAAP. The gate <R>refused</R> it. The system working.</>,
    ev: [{ c: "r", v: "drift", l: "380 inj" }, { c: "r", v: "refused", l: "SR 11-7" }, { c: "a", v: "+$15M", l: "forgone" }],
    tr: ["Aggregator signals", "Churn", "gate refuses"], cta: { t: "See the refusal", theme: "churn" } },
  { id: "elder", lens: "RR", keys: ["elder", "elderly", "senior", "seniors", "fraud", "protect", "protection", "scam", "exploitation", "efe", "wire", "cro"],
    head: "Intercept the scam in the moment — proven ethically.",
    body: <>A first-ever scam-language wire is <B>held</B> with trusted-contact outreach (~−1.8bps fraud). Proven by <H>stepped-wedge</H> — no senior denied protection. Guardrail is inverted: the risk is <R>over-acting</R> on a genuine customer.</>,
    ev: [{ c: "g", v: "−1.8bps", l: "fraud" }, { c: "g", v: "$6.7M", l: "cost avoided" }, { c: "a", v: "ceiling", l: "harm guard" }],
    tr: ["Wire+scam signals", "Elder", "stepped-wedge"], cta: { t: "Elder pipeline", theme: "elder" } },
  { id: "giglimit", lens: "CO", keys: ["what if", "lift", "limit", "limits", "all gig", "raise", "ceiling", "everyone", "blanket"],
    head: "It backfires past a point.",
    body: <>Lifting on a <B2>verified pattern</B2> is safe; lifting for everyone without the trust gate opens fraud — the gate <R>hard-kills</R> it. Not more lift — more trust per unit of lift.</>,
    ev: [{ c: "g", v: "+$56M", l: "verified" }, { c: "r", v: "breach", l: "blanket" }, { c: "b", v: "live", l: "trade-off" }],
    tr: ["Gig", "Simulate", "fraud guardrail"], cta: { t: "Run the simulator", theme: "gig" } },
  { id: "notdoing", lens: "RR", keys: ["not doing", "not do", "restraint", "avoid", "discipline", "hold back", "choosing not", "deliberately"],
    head: "Holding the rate-sensitive repricing — on purpose.",
    body: <>The most valuable move can be <B>nothing</B>. A ~$15M play was <R>refused</R> on drift — logged, Model-Risk-backed. A risk-adjusted decision, not a missed one.</>,
    ev: [{ c: "r", v: "refused", l: "churn" }, { c: "r", v: "drift", l: "unstable" }, { c: "g", v: "protected", l: "margin+fairness" }],
    tr: ["Churn", "gate", "restraint"], cta: { t: "See the refusal", theme: "churn" } },
  { id: "board", lens: "CA", keys: ["board", "directors", "what will they ask", "audit committee", "downside", "wrong", "worst case"],
    head: "Growth, efficiency, risk, capital — one frame.",
    body: <>Growth (fee gap → home), efficiency (op. leverage → automation), risk (gate teeth → SR 11-7), capital (tested, reversible, gate prefers 'no'). The answer the board remembers is the <R>refusal</R> — proof of judgement.</>,
    ev: [{ c: "a", v: "growth", l: "home" }, { c: "g", v: "efficiency", l: "58.2%" }, { c: "r", v: "restraint", l: "churn" }],
    tr: ["Board lenses", "Portfolio", "one frame"], cta: null },
  { id: "growth", lens: "CO", keys: ["growth", "acquisition", "grow", "primacy", "new money", "upside", "where growth", "life event", "life-event", "organic", "affluent"],
    head: "Life events — where money decides where it lives.",
    body: <>A liquidity event opens a <B2>~14-day primacy window</B2>: a consented offer → <H>+$87M</H> growth NII, +18pp attach. Consent-aware test — advisory is a recommendation (Reg BI).</>,
    ev: [{ c: "a", v: "+$87M", l: "growth" }, { c: "v", v: "+18pp", l: "attach" }, { c: "v", v: "25%", l: "primacy" }],
    tr: ["Liquidity signals", "Home", "consent-aware"], cta: { t: "Life-event pipeline", theme: "home" } },
];

const TOPIC_TAGS = ["gig", "elder", "senior", "home", "churn", "rate", "fraud", "growth", "limit", "deposit", "fee", "payments", "efficiency", "board", "capital", "invest"];

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
  "How do we close the fee-growth gap?",
  "Why aren't we repricing rate-sensitive deposits?",
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
