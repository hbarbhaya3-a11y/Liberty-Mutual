/* ============================================================================
   Ask TwinX — live LLM layer (OpenAI), with the page KB as the deterministic
   fallback. Reads config from Vite env (set in .env.local):
     VITE_OPENAI_API_KEY   — required to go live (else everything falls back)
     VITE_OPENAI_MODEL     — optional, default gpt-4o-mini
     VITE_OPENAI_BASE      — optional, default https://api.openai.com/v1
                             (point at a proxy to keep the key off the client)
   The model/provider name is never surfaced in the UI.
   ========================================================================= */

import { buildContext, FEWSHOT, CHART_METRICS_BY_USECASE, NAMED_VISUALS } from "@/data/askTwinxContext";

const KEY   = import.meta.env.VITE_OPENAI_API_KEY || "";
const MODEL = import.meta.env.VITE_OPENAI_MODEL   || "gpt-4o";
const BASE  = (import.meta.env.VITE_OPENAI_BASE   || "https://api.openai.com/v1").replace(/\/$/, "");

export const llmConfigured = () => !!KEY;

/* System prompt — grounds the model in TwinX + the rich use-case knowledge pack
   + the live on-screen values for the current page. `useCase` is the theme id
   (liquidity / wealth / …) used to select the knowledge pack. */
export function buildSystemPrompt(pageId, facts, useCase) {
  return [
    "You are Ask TwinX, the strategic companion inside a Liberty Mutual USRM Personal Lines decision-intelligence product (TwinX). You help an executive think through the strategy, the scenarios and the decisions in front of them, and the reasoning behind them — auto/home renewal retention, precision repricing, bundling and claims-experience.",
    "STAY STRATEGIC — speak as a strategy advisor about the business: the cohorts, the scenarios, the policies, the trade-offs and the numbers themselves. NEVER refer to the interface: do not say 'screen', 'page', 'dashboard', 'view', 'tab', 'on screen', 'shown here', or 'displayed'. Talk about the decision, not the UI.",
    "ANSWER STYLE — be thorough and genuinely useful. Open with one direct sentence that answers the question, then give a structured explanation: the drivers, the relevant numbers (always prefer the LIVE values from the current analysis over the canonical pack when both exist), and the trade-offs. Use short '- ' bullets for lists and wrap the single key phrase per bullet in **double asterisks**. Favour substance and specificity over brevity, but stay scannable — no walls of text, no markdown section headings, no tables.",
    "SECOND-ORDER THINKING — don't stop at the first-order readout; reason about the knock-on consequences (what each choice implies for the NEXT decision, the capacity or risk it creates, what to watch in the live RCT, the follow-on opportunity like bundle base, loss-ratio exposure, agent capacity, shopping/lapse risk). But weave this IMPLICITLY into the relevant sentences — do NOT label it. Never write 'second-order', 'so what', 'implications', 'key drivers', 'trade-offs' or any similar section header/lead-in; the reasoning should read as a natural part of the answer, not a tagged block.",
    `VISUALS — you may add a chart, but it must EARN its place: it should add something not already in front of the user, or PINPOINT exactly what was asked. The executive already has the full three-policy comparison (a metric scorecard, per-metric comparison charts, and micro-segment tables), so do NOT add a scorecard or a generic "compare everything" chart unless explicitly asked. Good moves: [[chart:tradeoff]] when the question is about the trade-off / why three; [[chart:funnel]] for cohort-size / who's-in-scope questions; a single-metric bar ([[chart:METRIC]], where METRIC is one of ${CHART_METRICS_BY_USECASE[useCase] || "(none)"}) when weighing ONE dimension. ${NAMED_VISUALS} Usually ZERO or ONE visual is right; add a second only if it shows a genuinely different thing. Put each directive alone on its own line; never put numbers in it. Do not narrate the chart with UI words — just let it sit after the point it supports.`,
    "GROUNDING RULES — be specific and cite the actual numbers. Never invent figures beyond the live values + the knowledge pack below; if something genuinely isn't determinable from what you're given, say so briefly. Never reveal or mention which AI model or provider powers you.",
    "",
    "=== KNOWLEDGE (grounded in the live config — treat as authoritative) ===",
    buildContext(useCase, pageId, facts),
    "",
    "=== EXAMPLE of the expected depth + grounding ===",
    `Q: ${FEWSHOT.q}\nA: ${FEWSHOT.a}`,
  ].filter((s) => s !== null && s !== undefined).join("\n");
}

/* Returns the answer text, or null if not configured. Throws on network/API
   error so the caller can fall back to the deterministic KB. */
export async function askLlm({ question, system, history = [] }) {
  if (!KEY) return null;
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 900,
      messages: [{ role: "system", content: system }, ...history, { role: "user", content: question }],
    }),
  });
  if (!res.ok) throw new Error("llm_http_" + res.status);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}
