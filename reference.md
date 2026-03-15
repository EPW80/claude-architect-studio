# docs/reference.md — Claude Architect Studio (Deep Reference)

> This file is NOT loaded every session. Claude Code reads it on demand.
> Pitch: "For module specs, color tokens, or the job description mapping, see docs/reference.md."

---

## Module Specs

### RAGPipeline

State shape: `docs[]`, `query`, `config { topK, chunkSize, overlap }`, `result { answer, retrievedDocs[] } | { error }`

Retrieval: keyword overlap scoring — split query on `\W+`, count hits per doc, sort descending, take `topK`.

Claude system prompt pattern:
> "Answer using ONLY the provided context. Cite documents used. Format with **Answer**, **Sources Used**, **Confidence Level**."

Extend by: swapping keyword scoring for real vector similarity (Pinecone, pgvector, Weaviate). Add embedding model selector (voyage-3, text-embedding-3-small).

---

### AgentOrchestration

State: `task`, `tools[] { id, name, enabled, desc }`, `steps[]`, `finalAnswer`

Step types: `thought` (indigo), `tool_use` (blue), `observation` (green), `answer` (amber).

Steps animate in with 600ms stagger. Claude returns JSON: `{ steps: [...], answer: "..." }`.

Extend by: real tool dispatch, LangChain/Semantic Kernel adapter layer, SSE streaming for live token output.

---

### PromptStudio

State: `prompt`, `analysis { score, clarity, security, efficiency, strengths[], issues[], optimized_prompt }`, `guardrails[]`

Claude returns scored JSON. Guardrails (PII Filter ON, Toxicity Guard ON, Hallucination Check OFF, Cost Guard ON) are UI toggles — not wired to actual middleware yet.

Extend by: real pre/post processing middleware, A/B comparison mode, AWS Bedrock Guardrails integration.

---

### ArchitecturePatterns

Three SVG diagrams (no Claude API calls — static):
- `rag` — API Gateway → RAG Service → Embeddings → Vector DB → Claude API + Cache + Monitoring
- `agent` — Orchestrator → Planner / Executor / Critic → Tools / Memory → Claude API
- `secure` — Client → WAF → Auth/IAM + PII Filter → Claude API + Audit Log + DLP/SIEM

Nodes: `{ id, x, y, w, h, label, color, text }`. Edges: quadratic Bézier with SVG marker arrowheads.

Extend by: drag-to-reposition nodes, PNG/SVG export, AWS/GCP service icons.

---

### Monitoring

All data is mock (static arrays). Charts: Recharts `BarChart` (daily token input/output), `AreaChart` (hourly p50/p95/p99 latency with gradient fills), model breakdown cards.

Extend by: Anthropic Usage API, Datadog/CloudWatch, LangSmith/Langfuse trace IDs, per-tenant cost allocation.

---

## Color Palette

```
#070B14   bg-base (page)
#0D1420   bg-card (surfaces)
#1E3A5F   border-default
#0EA5E9   blue   — primary actions, services
#6366F1   indigo — secondary, agent thought steps
#10B981   green  — success, storage, security
#F59E0B   amber  — warnings, cost, agent answers
#EF4444   red    — errors, p99 latency
#C084FC   purple — AI/ML nodes
#E2E8F0   text-primary
#64748B   text-muted
#475569   text-dim
```

---

## Animation Classes

```css
.fade-in    { animation: fadeIn 0.4s ease }
.agent-step { animation: slideIn 0.3s ease forwards; opacity: 0 }
.spin       { animation: spin 1s linear infinite }
.pulse      { animation: pulse 2s infinite }
.grid-bg    { background: dot-grid at rgba(14,165,233,0.03), 40px 40px }
```

---

## Environment Variables (Phase 2+)

```env
ANTHROPIC_API_KEY=sk-ant-...
PINECONE_API_KEY=...
PINECONE_INDEX=claude-architect-kb
POSTGRES_URL=postgresql://user:pass@host:5432/dbname
LANGSMITH_API_KEY=...
NEXT_PUBLIC_APP_URL=https://claude-architect.yourdomain.com
```

---

## Full Roadmap

**Phase 1 — Done**
- [x] RAG pipeline with live Claude API
- [x] Agent orchestration with animated trace
- [x] Prompt analysis + guardrails UI
- [x] SVG architecture diagrams (3 patterns)
- [x] Monitoring charts with mock data

**Phase 2 — Real Backend**
- [ ] Pinecone/pgvector retrieval
- [ ] Real tool execution in agent loop
- [ ] SSE streaming responses
- [ ] Anthropic Usage API for monitoring

**Phase 3 — Enterprise**
- [ ] Multi-tenant auth (Auth0/Cognito)
- [ ] Per-user API key management
- [ ] Audit logging (PostgreSQL/CloudWatch)
- [ ] Cost alerts + Slack notifications
- [ ] LangSmith/Langfuse trace integration

**Phase 4 — MLOps**
- [ ] Prompt version control (git-style diff)
- [ ] A/B prompt evaluation harness
- [ ] Automated regression on prompt changes
- [ ] Model fallback routing (Claude → GPT-4)

---

## Job Description Mapping

| JD Requirement | Demonstrated In |
|---|---|
| Claude / LLM API integration | `callClaude()` helper, all tabs |
| RAG + vector DB design | RAGPipeline tab |
| AI agent frameworks | AgentOrchestration — ReAct loop |
| Prompt engineering + guardrails | PromptStudio tab |
| Architecture diagrams | ArchitecturePatterns — 3 SVG patterns |
| Cost + performance monitoring | Monitoring tab |
| Security + governance | Secure Enterprise diagram, PII/toxicity guardrails |
| Cloud (AWS/Azure/GCP) | Architecture node labels, Phase 3 roadmap |
