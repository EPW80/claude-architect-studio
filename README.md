# Claude Architect Studio

Enterprise GenAI architecture platform showcasing RAG pipelines, AI agent orchestration, prompt engineering, architecture visualization, and operational monitoring — all powered by Claude.

## Features

| Tab | Description | Status |
|-----|-------------|--------|
| **RAG Pipeline** | In-memory keyword retrieval with configurable Top-K, chunk size, and overlap. Live streaming Claude Q&A with source citations. | Phase 1 |
| **Agent Orchestration** | Toggleable tool registry with animated ReAct trace. Simulated multi-step agent execution with thought/tool/observation steps. | Phase 1 |
| **Prompt Studio** | Prompt scoring (clarity, security, efficiency), guardrail toggles, one-click optimize, and A/B comparison mode. | Phase 1 |
| **Architecture Patterns** | Interactive SVG diagrams for RAG, Multi-Agent, and Secure Enterprise patterns. Drag-to-reposition nodes with SVG/PNG export. | Phase 1 |
| **Monitoring** | Token usage, latency percentiles (p50/p95/p99), and model breakdown dashboards via Recharts. | Phase 1 |

## Tech Stack

- **Frontend:** React 18 (hooks, no build framework), Recharts
- **Fonts:** Space Grotesk (UI), JetBrains Mono (data/code)
- **API Proxy:** Vite dev proxy (local) / Vercel Edge Function (production)
- **Model:** `claude-sonnet-4-20250514`, 1000 max tokens
- **Styling:** Inline styles, dark theme (#070B14 base)

## Quick Start

```bash
# Install dependencies
npm install

# Set your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run locally
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude calls |
| `PINECONE_API_KEY` | Phase 2 | Pinecone vector DB key |
| `PINECONE_INDEX` | Phase 2 | Pinecone index name |
| `VOYAGE_API_KEY` | Phase 2 | Voyage embedding model key |
| `BRAVE_API_KEY` | Phase 2 | Brave Search API key (agent tools) |

## Project Structure

```
ClaudeArchitectStudio.jsx   Single source of truth — all 5 tabs
src/main.jsx                React entry point
api/messages.js             Vercel Edge Function proxy for Anthropic API
vite.config.js              Dev server config with API proxy
index.html                  HTML shell
CLAUDE.md                   AI assistant instructions
reference.md                Full module specs, colors, roadmap
```

## Deployment

### Vercel (Production)

```bash
# Deploy to Vercel
vercel deploy --prod
```

Set `ANTHROPIC_API_KEY` in your Vercel project environment variables. The Edge Function at `api/messages.js` proxies requests to the Anthropic API with server-side auth.

### Local Development

The Vite dev server proxies `/api/messages` to `https://api.anthropic.com/v1/messages`, injecting the API key from your `.env` file.

## Roadmap

### Phase 2 — Real Backend
- [ ] Replace keyword retrieval with Pinecone/pgvector vector similarity search
- [ ] Wire real tool execution in agent loop (web search, code sandbox)
- [ ] Extend SSE streaming to Agent and Prompt Studio tabs
- [ ] Connect Monitoring tab to Anthropic Usage API for live data

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
- [ ] Model fallback routing (Claude to GPT-4)

## License

Private — all rights reserved.
