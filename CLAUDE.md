# CLAUDE.md — Claude Architect Studio

## Project

Single-file React artifact (`ClaudeArchitectStudio.jsx`) demonstrating enterprise GenAI architecture patterns for a Claude Architect portfolio application. Runs directly in the Claude.ai artifact viewer — no build step.

## Stack

- React (hooks, no build), Recharts, Anthropic `/v1/messages` API
- Fonts: Space Grotesk (UI), JetBrains Mono (data/code)
- Model: `claude-sonnet-4-6`, `max_tokens: 1000`

## File Structure

```
ClaudeArchitectStudio.jsx   Single source of truth — all 5 tabs live here
CLAUDE.md                   This file
docs/reference.md           Full module specs, colors, roadmap (read on demand)
```

## Commands

```bash
# Standalone React (Phase 2+):
npx create-react-app claude-architect-studio
cp ClaudeArchitectStudio.jsx src/App.jsx
npm install recharts && npm start

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

## Phase 2 Priorities

- [ ] Replace simulated RAG retrieval with real Pinecone/pgvector calls
- [ ] Wire real tool execution in agent loop (web search, code sandbox)
- [ ] Stream responses via SSE (`stream: true`) instead of awaiting full completion
- [ ] Connect Monitoring tab to Anthropic Usage API for live data

## Reference

For full module specs, color palette, animation classes, prompt patterns, and job description mapping, see `docs/reference.md`.
