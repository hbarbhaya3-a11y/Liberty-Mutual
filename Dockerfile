# syntax=docker/dockerfile:1.7

# --- Stage 1: build the static bundle ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Non-secret build-time config: the client talks to the SAME-ORIGIN proxy (/api),
# not OpenAI directly. VITE_OPENAI_API_KEY is a dummy placeholder that only flips
# the client's "configured" gate — the REAL key lives on the server at runtime
# (OPENAI_API_KEY from a Cloud Run secret) and is never inlined into the bundle.
ENV VITE_OPENAI_BASE=/api \
    VITE_OPENAI_API_KEY=proxy \
    VITE_OPENAI_MODEL=gpt-4o-mini
RUN npm run build

# --- Stage 2: serve the SPA + proxy the LLM call with a tiny Node server ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY server.js ./server.js

USER node
EXPOSE 8080
CMD ["node", "server.js"]
