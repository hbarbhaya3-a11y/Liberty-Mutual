/* ============================================================================
   TwinX Decision Cockpit — runtime server.

   Two jobs in one tiny zero-dependency Node process:
     1. Serve the Vite-built SPA from ./dist (SPA fallback to index.html).
     2. Proxy POST /api/chat/completions -> OpenAI, injecting the API key
        SERVER-SIDE from env. The key (OPENAI_API_KEY) comes from a Cloud Run
        secret mounted at runtime, so it never ships in the client bundle.

   The browser bundle is built with VITE_OPENAI_BASE=/api and a dummy
   VITE_OPENAI_API_KEY=proxy (just to satisfy the client's "configured" gate);
   the real key lives only here.
   ========================================================================= */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "dist");
const PORT = Number(process.env.PORT) || 8080;

const OPENAI_KEY   = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL   || "gpt-4o-mini";
const OPENAI_BASE  = (process.env.OPENAI_BASE   || "https://api.openai.com/v1").replace(/\/$/, "");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".map":  "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".txt":  "text/plain; charset=utf-8",
};

/* Security headers — port of security_headers.conf (applied to every response). */
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; " +
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
};

const applySecurity = (res) => {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
};

function send(res, status, headers, body) {
  applySecurity(res);
  res.writeHead(status, headers);
  res.end(body);
}

/* --- LLM proxy: forward to OpenAI with the server-held key --- */
async function handleChat(req, res) {
  if (!OPENAI_KEY) return send(res, 503, { "Content-Type": "application/json" },
    JSON.stringify({ error: "llm_not_configured" }));

  let raw = "";
  req.on("data", (c) => { raw += c; if (raw.length > 1_000_000) req.destroy(); });
  req.on("end", async () => {
    let payload;
    try { payload = JSON.parse(raw || "{}"); }
    catch { return send(res, 400, { "Content-Type": "application/json" }, JSON.stringify({ error: "bad_json" })); }

    // Force model & key server-side; pass through messages/params from the client.
    const body = {
      model: OPENAI_MODEL,
      temperature: payload.temperature ?? 0.4,
      max_tokens: payload.max_tokens ?? 400,
      messages: Array.isArray(payload.messages) ? payload.messages : [],
    };

    try {
      const upstream = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify(body),
      });
      const text = await upstream.text();
      send(res, upstream.status, { "Content-Type": "application/json", "Cache-Control": "no-store" }, text);
    } catch {
      send(res, 502, { "Content-Type": "application/json" }, JSON.stringify({ error: "upstream_unreachable" }));
    }
  });
}

/* --- Static file serving with SPA fallback --- */
async function serveStatic(req, res, urlPath) {
  // Resolve safely within DIST (block path traversal).
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(DIST, clean);
  if (!filePath.startsWith(DIST)) return send(res, 403, { "Content-Type": "text/plain" }, "Forbidden");

  let info = await stat(filePath).catch(() => null);
  if (info?.isDirectory()) { filePath = join(filePath, "index.html"); info = await stat(filePath).catch(() => null); }

  const isAsset = clean.startsWith("/assets/") || clean.startsWith("assets/");

  // SPA fallback: unknown non-asset path -> index.html (client router handles it).
  if (!info) {
    if (isAsset) return send(res, 404, { "Content-Type": "text/plain" }, "Not found");
    filePath = join(DIST, "index.html");
    info = await stat(filePath).catch(() => null);
    if (!info) return send(res, 404, { "Content-Type": "text/plain" }, "Not found");
  }

  const ext = extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  // Hashed assets cache forever; the HTML shell must never be cached so deploys land instantly.
  const cache = isAsset ? "public, max-age=31536000, immutable" : "no-store, must-revalidate";
  const data = await readFile(filePath);
  send(res, 200, { "Content-Type": type, "Cache-Control": cache }, data);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;

  if (path === "/healthz") return send(res, 200, { "Content-Type": "text/plain" }, "ok");

  if (path === "/api/chat/completions") {
    if (req.method !== "POST") return send(res, 405, { "Content-Type": "text/plain" }, "Method Not Allowed");
    return handleChat(req, res);
  }

  // Block dotfiles (except /.well-known) — parity with nginx config.
  if (/\/\.(?!well-known)/.test(path)) return send(res, 403, { "Content-Type": "text/plain" }, "Forbidden");

  if (req.method !== "GET" && req.method !== "HEAD")
    return send(res, 405, { "Content-Type": "text/plain" }, "Method Not Allowed");

  serveStatic(req, res, path).catch(() =>
    send(res, 500, { "Content-Type": "text/plain" }, "Internal Server Error"));
});

server.listen(PORT, () => console.log(`TwinX server listening on :${PORT} (llm ${OPENAI_KEY ? "live" : "mock-fallback"})`));
