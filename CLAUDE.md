# CLAUDE.md — Claude Architect Studio

## Project

Single-file React app (`ClaudeArchitectStudio.jsx`) demonstrating enterprise GenAI architecture patterns for a Claude Architect portfolio application. Runs via Vite dev server locally and deploys to Vercel with an Edge Function proxy (`api/messages.js`) for the Anthropic API.

## Stack

- React (hooks, no build), Recharts, Anthropic `/v1/messages` API
- Fonts: Space Grotesk (UI), JetBrains Mono (data/code)
- Model: `claude-sonnet-4-6`, `max_tokens: 1000`

## File Structure

```
ClaudeArchitectStudio.jsx   Single source of truth — all 5 tabs live here
src/main.jsx                React entry point
api/messages.js             Vercel Edge Function proxy for Anthropic API
vite.config.js              Dev server config with API proxy
index.html                  HTML shell
CLAUDE.md                   This file
reference.md                Full module specs, colors, roadmap (read on demand)
README.md                   Project documentation
```

## Commands

```bash
# Local dev:
npm install
npm run dev              # Vite dev server at localhost:5173

# Production deploy:
vercel deploy --prod     # Set ANTHROPIC_API_KEY in Vercel env vars

# Phase 2 deps:
npm install @pinecone-database/pinecone @anthropic-ai/sdk langchain
pip install anthropic pinecone-client pgvector langchain --break-system-packages
```

## Tabs (in order)

1. **RAGPipeline** — in-memory keyword retrieval, configurable Top-K/chunk/overlap, live Claude Q&A
2. **AgentOrchestration** — toggleable tool registry, animated ReAct trace (600ms/step reveal)
3. **PromptStudio** — prompt scoring (clarity/security/efficiency), guardrails toggles, one-click optimize
4. **ArchitecturePatterns** — SVG diagrams: RAG, Multi-Agent, Secure Enterprise
5. **Monitoring** — mock token/latency/cost charts via Recharts BarChart + AreaChart

## Conventions

- Don't add new tabs — extend existing ones with sub-views or config options.
- Don't split into multiple files — keep everything in `ClaudeArchitectStudio.jsx`.
- Don't use localStorage — all state lives in React `useState`.
- Don't import external UI libraries — inline styles only, no new dependencies.
- All Claude API calls MUST go through the shared `callClaude(system, userMsg, maxTokens)` helper.
- Structured outputs: request JSON in system prompt, strip backtick fences, then `JSON.parse()`.
- Don't hardcode API keys — the artifact runtime injects them automatically.
- Don't modify the dark theme color palette without reading `docs/reference.md` first.

## Current Status

**Phase 1 — Complete.** All 5 tabs functional with real Claude API integration. Key limitations:
- RAG uses keyword-matching retrieval (not real vector similarity)
- Agent tools are simulated (Claude generates fake tool calls, no real execution)
- Guardrails are UI toggles only (not enforced)
- Monitoring data is entirely hardcoded/mock
- Only RAG tab uses SSE streaming; Agent and PromptStudio await full responses

## Implementation Plan

### Phase 2 — Real Backend

#### 2.1 Vector Retrieval in RAG Pipeline

- Replace keyword-matching scorer with real embedding + Pinecone vector similarity
- New backend: `api/embed.js` (Voyage/OpenAI embeddings), `api/search.js` (Pinecone query)
- Wire embedding model dropdown and vector store dropdown to actual config
- Env vars: `PINECONE_API_KEY`, `PINECONE_INDEX`, `VOYAGE_API_KEY`

#### 2.2 Real Tool Execution in Agent Orchestration

- Refactor agent loop to use Claude's native `tool_use` API instead of simulated JSON
- Add `executeToolCall(toolName, input)` dispatcher
- Implement real tools: `web_search` (Brave/Tavily), `code_executor` (sandboxed), `vector_db_query` (reuse 2.1)
- New backend: `api/search-web.js` (search API proxy)
- Env vars: `BRAVE_API_KEY` or `TAVILY_API_KEY`
- Depends on: 2.1

#### 2.3 SSE Streaming for Agent + Prompt Tabs

- Extend `streamClaude()` usage to AgentOrchestration and PromptStudio
- For JSON responses: accumulate stream, parse on completion, render progressively
- Depends on: 2.2

#### 2.4 Anthropic Usage API for Monitoring

- Replace hardcoded mock data with real usage metrics
- New backend: `api/usage.js` (Anthropic Admin API)
- Add loading states and auto-refresh to Monitoring tab
- Env vars: `ANTHROPIC_ADMIN_KEY`
- Independent of 2.1-2.3 (can be done in parallel)

### Phase 3 — Enterprise

- [ ] Multi-tenant auth (Auth0/Cognito)
- [ ] Per-user API key management
- [ ] Audit logging (PostgreSQL/CloudWatch)
- [ ] Cost alerts + Slack notifications
- [ ] LangSmith/Langfuse trace integration

### Phase 4 — MLOps

- [ ] Prompt version control (git-style diff)
- [ ] A/B prompt evaluation harness
- [ ] Automated regression on prompt changes
- [ ] Model fallback routing (Claude → GPT-4)

### Implementation Order

```text
2.1 Vector Retrieval  ──┐
                        ├──→ 2.2 Real Agent Tools ──→ 2.3 Streaming Extensions
2.4 Usage API Monitoring (parallel, independent)

Then: Phase 3 (3.1 Auth → 3.2 Keys → 3.3 Audit → 3.4 Alerts → 3.5 Traces)
Then: Phase 4 (4.1 Versioning → 4.2 A/B → 4.3 Regression → 4.4 Fallback)
```

## Reference

For full module specs, color palette, animation classes, prompt patterns, and job description mapping, see `reference.md`.
