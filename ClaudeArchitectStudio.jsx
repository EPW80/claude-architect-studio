import { useState, useRef, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #070B14; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0D1420; }
  ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 3px; }
  .tab-btn { transition: all 0.2s; }
  .tab-btn.active { background: linear-gradient(135deg, #0EA5E9, #6366F1); }
  .tab-btn:not(.active):hover { background: rgba(14,165,233,0.1); }
  .card { background: rgba(13,20,36,0.8); border: 1px solid rgba(30,58,95,0.6); border-radius: 12px; }
  .card:hover { border-color: rgba(14,165,233,0.3); }
  .glow-blue { box-shadow: 0 0 20px rgba(14,165,233,0.15); }
  .glow-purple { box-shadow: 0 0 20px rgba(99,102,241,0.15); }
  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .fade-in { animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .agent-step { animation: slideIn 0.3s ease forwards; opacity: 0; }
  @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  .grid-bg {
    background-image: linear-gradient(rgba(14,165,233,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(14,165,233,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  textarea { resize: vertical; }
  .node-hover { transition: all 0.2s; cursor: grab; }
  .node-hover:hover rect, .node-hover:hover circle { filter: brightness(1.3); }
  .node-hover:active { cursor: grabbing; }
  .metric-card { background: linear-gradient(135deg, rgba(13,20,36,0.9), rgba(7,11,20,0.9)); }
`;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

async function callClaude(system, userMsg, maxTokens = 1000) {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "";
}

async function streamClaude(system, userMsg, maxTokens = 1000, onChunk) {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
          full += ev.delta.text;
          onChunk(full);
        }
      } catch {}
    }
  }
  return full;
}

// ─── ICONS ─────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const icons = {
  database:
    "M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zm0 18c-4.41 0-8-1.79-8-4V9.91C5.5 11.17 8.56 12 12 12s6.5-.83 8-2.09V16c0 2.21-3.59 4-8 4zm0-8c-4.41 0-8-1.79-8-4s3.59-4 8-4 8 1.79 8 4-3.59 4-8 4z",
  cpu: "M9 3H5a2 2 0 0 0-2 2v4m6-6h6m-6 0v18m6-18h4a2 2 0 0 1 2 2v4m-6-6v18m0 0H9m6 0h4a2 2 0 0 0 2-2v-4M3 9v6m18-6v6M3 15h6m12 0h-6",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  search: "M11 21a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm7-3 4 4",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0v3m0-12V3m8.66 9h-3m-13.32 0H1m15.07-5.07l-2.12 2.12M7.05 16.95l-2.12 2.12m14.14 0l-2.12-2.12M7.05 7.05L4.93 4.93",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  play: "M5 3l14 9-14 9V3z",
  stop: "M18 6H6v12h12V6z",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  refresh:
    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  arrow_right: "M5 12h14M12 5l7 7-7 7",
  external:
    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z",
  git: "M9 18c-4.51.37-5.5-2.61-7-3m14 3a5 5 0 0 0-5-5c0-2.21 1.79-4 4-4s4 1.79 4 4a5 5 0 0 0-5 5zm-9 0V6m0 6a5 5 0 0 0 5-5 5 5 0 0 0-5-5",
};

// ─── RAG PIPELINE TAB ──────────────────────────────────────────
function RAGPipeline() {
  const [docs, setDocs] = useState([
    {
      id: 1,
      name: "Enterprise AI Policy v2.pdf",
      content:
        "Our AI governance policy requires all LLM deployments to include PII filtering, audit logging, rate limiting, and human-in-the-loop for high-stakes decisions. Models must be versioned and rollback procedures documented. Data retention for prompts is 90 days maximum.",
      type: "policy",
    },
    {
      id: 2,
      name: "Claude API Best Practices.md",
      content:
        "When using Claude in production: use system prompts to define personas and constraints, implement retry logic with exponential backoff, cache frequent queries using semantic caching, monitor token usage per tenant, use streaming for latency-sensitive paths, and set appropriate max_tokens to control costs.",
      type: "technical",
    },
    {
      id: 3,
      name: "Vector DB Comparison.txt",
      content:
        "Pinecone: managed, serverless, best for production scale. Weaviate: open-source, supports multimodal, good for hybrid search. pgvector: PostgreSQL extension, great for teams already on Postgres. Chroma: lightweight, ideal for prototyping. Qdrant: Rust-based, high performance, self-hostable.",
      type: "reference",
    },
  ]);
  const [newDoc, setNewDoc] = useState({ name: "", content: "" });
  const [query, setQuery] = useState(
    "What vector database should we use for a production RAG system?",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("voyage-3");
  const [config, setConfig] = useState({ topK: 2, chunkSize: 512, overlap: 64 });
  const [activeDoc, setActiveDoc] = useState(null);

  const docTypeColors = {
    policy: "#F59E0B",
    technical: "#0EA5E9",
    reference: "#10B981",
  };

  async function runRAG() {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setStreamingAnswer("");
    try {
      const scored = docs
        .map((d) => {
          const words = query.toLowerCase().split(/\W+/);
          const score = words.reduce(
            (s, w) => s + (d.content.toLowerCase().includes(w) ? 1 : 0),
            0,
          );
          return { ...d, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, config.topK);

      const context = scored
        .map((d, i) => `[Doc ${i + 1}: ${d.name}]\n${d.content}`)
        .join("\n\n");

      // Show retrieved docs immediately while answer streams in
      setResult({ retrievedDocs: scored, answer: "" });

      const answer = await streamClaude(
        `You are an enterprise AI architecture assistant. Answer questions using ONLY the provided context documents.
         Cite which documents you used. If the context doesn't answer the question, say so clearly.
         Format your response with: **Answer**, **Sources Used**, and **Confidence Level** (High/Medium/Low).`,
        `Context Documents:\n${context}\n\nQuestion: ${query}`,
        1000,
        (partial) => setStreamingAnswer(partial),
      );
      setResult({ answer, retrievedDocs: scored });
      setStreamingAnswer("");
    } catch (e) {
      setResult({ error: e.message });
      setStreamingAnswer("");
    }
    setLoading(false);
  }

  return (
    <div
      className="fade-in"
      style={{
        display: "grid",
        gridTemplateColumns: "340px 1fr",
        gap: 20,
        height: "100%",
      }}
    >
      {/* Left Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Config */}
        <div className="card" style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <Icon d={icons.settings} size={14} color="#0EA5E9" />
            <span
              style={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Pipeline Config
            </span>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {[
              ["Top-K Docs", "topK", [1, 2, 3, 4, 5]],
              ["Chunk Size", "chunkSize", [256, 512, 1024]],
              ["Overlap", "overlap", [0, 32, 64, 128]],
            ].map(([label, key, opts]) => (
              <div
                key={key}
                style={{ gridColumn: key === "topK" ? "span 2" : undefined }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748B",
                    marginBottom: 5,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {label}
                </div>
                <select
                  value={config[key]}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, [key]: Number(e.target.value) }))
                  }
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    background: "#0D1420",
                    border: "1px solid #1E3A5F",
                    borderRadius: 6,
                    color: "#E2E8F0",
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  {opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 11,
                color: "#64748B",
                marginBottom: 5,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Vector Store
            </div>
            <select
              style={{
                width: "100%",
                padding: "7px 10px",
                background: "#0D1420",
                border: "1px solid #1E3A5F",
                borderRadius: 6,
                color: "#0EA5E9",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: "pointer",
              }}
            >
              <option>Pinecone (Serverless)</option>
              <option>pgvector (PostgreSQL)</option>
              <option>Weaviate (Hybrid)</option>
              <option>Qdrant (Self-hosted)</option>
            </select>
          </div>
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontSize: 11,
                color: "#64748B",
                marginBottom: 5,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Embedding Model
            </div>
            <select
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                background: "#0D1420",
                border: "1px solid #1E3A5F",
                borderRadius: 6,
                color: "#C084FC",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: "pointer",
              }}
            >
              <option value="voyage-3">voyage-3</option>
              <option value="voyage-3-lite">voyage-3-lite</option>
              <option value="text-embedding-3-small">text-embedding-3-small</option>
              <option value="text-embedding-3-large">text-embedding-3-large</option>
            </select>
          </div>
        </div>

        {/* Knowledge Base */}
        <div
          className="card"
          style={{
            padding: 16,
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon d={icons.database} size={14} color="#10B981" />
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Knowledge Base
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "#10B981",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {docs.length} docs
            </span>
          </div>
          <div
            style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {docs.map((doc) => (
              <div
                key={doc.id}
                onClick={() =>
                  setActiveDoc(activeDoc?.id === doc.id ? null : doc)
                }
                style={{
                  padding: "10px 12px",
                  background:
                    activeDoc?.id === doc.id
                      ? "rgba(14,165,233,0.1)"
                      : "rgba(7,11,20,0.6)",
                  border: `1px solid ${activeDoc?.id === doc.id ? "rgba(14,165,233,0.4)" : "rgba(30,58,95,0.4)"}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: docTypeColors[doc.type],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 12, color: "#CBD5E1", fontWeight: 500 }}
                  >
                    {doc.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocs((p) => p.filter((d) => d.id !== doc.id));
                    }}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      color: "#64748B",
                      cursor: "pointer",
                      padding: 2,
                      display: "flex",
                    }}
                  >
                    <Icon d={icons.x} size={11} />
                  </button>
                </div>
                {activeDoc?.id === doc.id && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#64748B",
                      margin: "6px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {doc.content.slice(0, 120)}…
                  </p>
                )}
              </div>
            ))}
          </div>
          {/* Add doc */}
          <div
            style={{
              marginTop: 12,
              borderTop: "1px solid #1E3A5F",
              paddingTop: 12,
            }}
          >
            <input
              value={newDoc.name}
              onChange={(e) =>
                setNewDoc((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Document name..."
              style={{
                width: "100%",
                padding: "7px 10px",
                background: "#0D1420",
                border: "1px solid #1E3A5F",
                borderRadius: 6,
                color: "#E2E8F0",
                fontSize: 12,
                marginBottom: 8,
              }}
            />
            <textarea
              value={newDoc.content}
              onChange={(e) =>
                setNewDoc((p) => ({ ...p, content: e.target.value }))
              }
              placeholder="Document content..."
              rows={3}
              style={{
                width: "100%",
                padding: "7px 10px",
                background: "#0D1420",
                border: "1px solid #1E3A5F",
                borderRadius: 6,
                color: "#E2E8F0",
                fontSize: 12,
                marginBottom: 8,
              }}
            />
            <button
              onClick={() => {
                if (newDoc.name && newDoc.content) {
                  setDocs((p) => [
                    ...p,
                    { ...newDoc, id: Date.now(), type: "reference" },
                  ]);
                  setNewDoc({ name: "", content: "" });
                }
              }}
              style={{
                width: "100%",
                padding: "7px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 6,
                color: "#10B981",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Icon d={icons.plus} size={12} /> Add Document
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Query */}
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 13,
              color: "#64748B",
              marginBottom: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            // RAG Query
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "#0D1420",
              border: "1px solid #1E3A5F",
              borderRadius: 8,
              color: "#E2E8F0",
              fontSize: 14,
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          />
          <button
            onClick={runRAG}
            disabled={loading}
            style={{
              marginTop: 12,
              padding: "10px 24px",
              background: loading
                ? "#1E3A5F"
                : "linear-gradient(135deg, #0EA5E9, #6366F1)",
              border: "none",
              borderRadius: 8,
              color: "#FFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <span
                  className="spin"
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#FFF",
                    borderRadius: "50%",
                  }}
                />{" "}
                {streamingAnswer ? "Streaming Answer…" : "Running Pipeline…"}
              </>
            ) : (
              <>
                <Icon d={icons.search} size={14} /> Run RAG Query
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="card fade-in" style={{ padding: 20, flex: 1 }}>
            {result.error ? (
              <div
                style={{
                  color: "#F87171",
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Error: {result.error}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {result.retrievedDocs.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "4px 10px",
                        background: "rgba(14,165,233,0.1)",
                        border: "1px solid rgba(14,165,233,0.3)",
                        borderRadius: 20,
                        fontSize: 11,
                        color: "#0EA5E9",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      ↑ {d.name.slice(0, 22)}…
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#CBD5E1",
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {streamingAnswer || result.answer}
                  {loading && streamingAnswer && (
                    <span
                      className="pulse"
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 15,
                        background: "#0EA5E9",
                        borderRadius: 1,
                        marginLeft: 2,
                        verticalAlign: "text-bottom",
                      }}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {!result && !loading && (
          <div
            className="card"
            style={{
              padding: 40,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.5,
            }}
          >
            <Icon d={icons.search} size={40} color="#1E3A5F" />
            <p
              style={{
                color: "#64748B",
                marginTop: 12,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              // awaiting_query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AGENT ORCHESTRATION TAB ───────────────────────────────────
function AgentOrchestration() {
  const [task, setTask] = useState(
    "Research the best practices for implementing a multi-tenant RAG system on AWS, then create a brief implementation plan with cost estimates.",
  );
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [tools, setTools] = useState([
    {
      id: 1,
      name: "web_search",
      enabled: true,
      desc: "Search the internet for current information",
    },
    {
      id: 2,
      name: "code_executor",
      enabled: true,
      desc: "Execute Python/JS code snippets",
    },
    {
      id: 3,
      name: "vector_db_query",
      enabled: true,
      desc: "Query internal knowledge base",
    },
    {
      id: 4,
      name: "cost_calculator",
      enabled: false,
      desc: "Calculate AWS/Azure/GCP costs",
    },
    {
      id: 5,
      name: "diagram_generator",
      enabled: false,
      desc: "Generate architecture diagrams",
    },
  ]);
  const stepColors = {
    thought: "#6366F1",
    tool_use: "#0EA5E9",
    observation: "#10B981",
    answer: "#F59E0B",
  };

  async function runAgent() {
    setLoading(true);
    setSteps([]);
    setFinalAnswer("");
    try {
      const enabledTools = tools
        .filter((t) => t.enabled)
        .map((t) => t.name)
        .join(", ");
      const result = await callClaude(
        `You are an enterprise AI agent orchestrator. Simulate a multi-step agent execution for the given task.
         Available tools: ${enabledTools}
         
         Return ONLY a JSON object (no markdown, no extra text) with this structure:
         {
           "steps": [
             {"type": "thought", "content": "..."},
             {"type": "tool_use", "tool": "tool_name", "input": "...", "content": "Calling tool_name with: ..."},
             {"type": "observation", "content": "Tool returned: ..."},
             {"type": "thought", "content": "..."}
           ],
           "answer": "Final comprehensive answer here..."
         }
         Generate 5-7 realistic steps showing the agent's reasoning and tool usage.`,
        `Task: ${task}`,
      );
      const clean = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      // Animate steps
      for (let i = 0; i < parsed.steps.length; i++) {
        await new Promise((r) => setTimeout(r, 600));
        setSteps((prev) => [...prev, parsed.steps[i]]);
      }
      setFinalAnswer(parsed.answer);
    } catch (e) {
      setSteps([{ type: "thought", content: "Agent error: " + e.message }]);
    }
    setLoading(false);
  }

  const stepIcons = {
    thought: "💭",
    tool_use: "🔧",
    observation: "👁️",
    answer: "✅",
  };

  return (
    <div
      className="fade-in"
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 20,
        height: "100%",
      }}
    >
      {/* Tools Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <Icon d={icons.zap} size={14} color="#F59E0B" />
            <span
              style={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Tool Registry
            </span>
          </div>
          {tools.map((tool) => (
            <div
              key={tool.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 12,
                padding: "10px 12px",
                background: tool.enabled
                  ? "rgba(14,165,233,0.05)"
                  : "transparent",
                border: `1px solid ${tool.enabled ? "rgba(14,165,233,0.2)" : "rgba(30,58,95,0.3)"}`,
                borderRadius: 8,
              }}
            >
              <button
                onClick={() =>
                  setTools((p) =>
                    p.map((t) =>
                      t.id === tool.id ? { ...t, enabled: !t.enabled } : t,
                    ),
                  )
                }
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: `2px solid ${tool.enabled ? "#0EA5E9" : "#1E3A5F"}`,
                  background: tool.enabled ? "#0EA5E9" : "transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                {tool.enabled && (
                  <Icon d={icons.check} size={10} color="#FFF" />
                )}
              </button>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: tool.enabled ? "#0EA5E9" : "#64748B",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 3,
                  }}
                >
                  {tool.name}
                </div>
                <div
                  style={{ fontSize: 11, color: "#475569", lineHeight: 1.4 }}
                >
                  {tool.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div
            style={{
              fontSize: 11,
              color: "#64748B",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 10,
            }}
          >
            // agent_config
          </div>
          {[
            ["Max Iterations", "8"],
            ["Memory", "Conversation Buffer"],
            ["Model", "claude-sonnet-4"],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              <span style={{ color: "#475569" }}>{k}</span>
              <span
                style={{
                  color: "#0EA5E9",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "#0D1420",
              border: "1px solid #1E3A5F",
              borderRadius: 8,
              color: "#E2E8F0",
              fontSize: 14,
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          />
          <button
            onClick={runAgent}
            disabled={loading}
            style={{
              marginTop: 12,
              padding: "10px 24px",
              background: loading
                ? "#1E3A5F"
                : "linear-gradient(135deg, #F59E0B, #EF4444)",
              border: "none",
              borderRadius: 8,
              color: "#FFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <span
                  className="spin"
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#FFF",
                    borderRadius: "50%",
                  }}
                />{" "}
                Agent Running…
              </>
            ) : (
              <>
                <Icon d={icons.play} size={14} /> Execute Agent
              </>
            )}
          </button>
        </div>

        {/* Steps */}
        {steps.length > 0 && (
          <div
            className="card"
            style={{ padding: 16, flex: 1, overflow: "auto" }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#64748B",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 14,
              }}
            >
              // execution_trace
            </div>
            {steps.map((step, i) => (
              <div
                key={i}
                className="agent-step"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  display: "flex",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: `${stepColors[step.type]}20`,
                    border: `1px solid ${stepColors[step.type]}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {stepIcons[step.type]}
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: `${stepColors[step.type]}08`,
                    border: `1px solid ${stepColors[step.type]}20`,
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: stepColors[step.type],
                      fontFamily: "'JetBrains Mono', monospace",
                      marginBottom: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    {step.type}
                    {step.tool ? ` → ${step.tool}` : ""}
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5 }}
                  >
                    {step.content}
                  </div>
                </div>
              </div>
            ))}
            {finalAnswer && (
              <div
                className="fade-in"
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#F59E0B",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 8,
                  }}
                >
                  // final_answer
                </div>
                <div
                  style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.8 }}
                >
                  {finalAnswer}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROMPT STUDIO TAB ─────────────────────────────────────────
function PromptStudio() {
  const templates = [
    {
      name: "RAG System",
      prompt:
        "You are an expert AI assistant with access to a knowledge base. Answer questions ONLY using the provided context. If the context doesn't contain enough information, explicitly state this. Always cite your sources. Maintain a professional, concise tone suitable for enterprise users.\n\nContext: {context}\n\nQuestion: {question}",
    },
    {
      name: "Code Review",
      prompt:
        "You are a senior software engineer conducting a code review. Analyze the provided code for: security vulnerabilities, performance issues, maintainability concerns, and adherence to best practices. Provide specific, actionable feedback with code examples where relevant.\n\nCode to review:\n{code}",
    },
    {
      name: "Data Extraction",
      prompt:
        "Extract the following structured data from the input text. Return ONLY a valid JSON object with no additional text or markdown. Schema: {schema}\n\nInput: {text}",
    },
  ];
  const [prompt, setPrompt] = useState(templates[0].prompt);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [abMode, setAbMode] = useState(false);
  const [promptB, setPromptB] = useState(templates[1].prompt);
  const [analysisB, setAnalysisB] = useState(null);
  const [loadingB, setLoadingB] = useState(false);
  const [guardrails, setGuardrails] = useState([
    {
      id: 1,
      name: "PII Filter",
      active: true,
      desc: "Redact emails, SSNs, phone numbers",
    },
    {
      id: 2,
      name: "Toxicity Guard",
      active: true,
      desc: "Block harmful/offensive outputs",
    },
    {
      id: 3,
      name: "Hallucination Check",
      active: false,
      desc: "Flag unsupported claims",
    },
    {
      id: 4,
      name: "Cost Guard",
      active: true,
      desc: "Enforce max_tokens limits",
    },
  ]);

  async function analyzePrompt() {
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await callClaude(
        `You are a prompt engineering expert specializing in enterprise LLM deployments. 
         Analyze prompts for clarity, security, effectiveness, and enterprise readiness.
         Return ONLY a JSON object (no markdown) with:
         {
           "score": number (0-100),
           "clarity": number (0-100),
           "security": number (0-100), 
           "efficiency": number (0-100),
           "strengths": ["...", "..."],
           "issues": ["...", "..."],
           "optimized_prompt": "improved version of the prompt",
           "estimated_tokens": number,
           "recommendations": ["...", "..."]
         }`,
        `Analyze this prompt:\n\n${prompt}`,
      );
      const clean = result.replace(/```json|```/g, "").trim();
      setAnalysis(JSON.parse(clean));
    } catch (e) {
      setAnalysis({ error: e.message });
    }
    setLoading(false);
  }

  const PROMPT_SYSTEM = `You are a prompt engineering expert specializing in enterprise LLM deployments.
         Analyze prompts for clarity, security, effectiveness, and enterprise readiness.
         Return ONLY a JSON object (no markdown) with:
         {
           "score": number (0-100),
           "clarity": number (0-100),
           "security": number (0-100),
           "efficiency": number (0-100),
           "strengths": ["...", "..."],
           "issues": ["...", "..."],
           "optimized_prompt": "improved version of the prompt",
           "estimated_tokens": number,
           "recommendations": ["...", "..."]
         }`;

  async function analyzeAll() {
    setLoading(true);
    setLoadingB(true);
    setAnalysis(null);
    setAnalysisB(null);
    const parse = (raw) => {
      const clean = raw.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    };
    const [resA, resB] = await Promise.allSettled([
      callClaude(PROMPT_SYSTEM, `Analyze this prompt:\n\n${prompt}`),
      callClaude(PROMPT_SYSTEM, `Analyze this prompt:\n\n${promptB}`),
    ]);
    setAnalysis(resA.status === "fulfilled" ? parse(resA.value) : { error: resA.reason?.message });
    setAnalysisB(resB.status === "fulfilled" ? parse(resB.value) : { error: resB.reason?.message });
    setLoading(false);
    setLoadingB(false);
  }

  const ScoreBar = ({ label, value, color }) => (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
        }}
      >
        <span style={{ fontSize: 12, color: "#94A3B8" }}>{label}</span>
        <span
          style={{
            fontSize: 12,
            color,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ height: 4, background: "#1E3A5F", borderRadius: 2 }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: color,
            borderRadius: 2,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      className="fade-in"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 20,
        height: "100%",
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Templates + A/B toggle */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {templates.map((t) => (
            <button
              key={t.name}
              onClick={() => setPrompt(t.prompt)}
              style={{
                padding: "6px 14px",
                background:
                  prompt === t.prompt
                    ? "rgba(99,102,241,0.2)"
                    : "rgba(13,20,36,0.8)",
                border: `1px solid ${prompt === t.prompt ? "rgba(99,102,241,0.5)" : "rgba(30,58,95,0.6)"}`,
                borderRadius: 20,
                color: prompt === t.prompt ? "#818CF8" : "#64748B",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {t.name}
            </button>
          ))}
          <button
            onClick={() => { setAbMode((v) => !v); setAnalysis(null); setAnalysisB(null); }}
            style={{
              marginLeft: "auto",
              padding: "6px 14px",
              background: abMode ? "rgba(245,158,11,0.15)" : "rgba(13,20,36,0.8)",
              border: `1px solid ${abMode ? "rgba(245,158,11,0.5)" : "rgba(30,58,95,0.6)"}`,
              borderRadius: 20,
              color: abMode ? "#F59E0B" : "#64748B",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            A/B Compare
          </button>
        </div>

        {/* Editor(s) */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: abMode ? "1fr 1fr" : "1fr", gap: 12 }}>
          {[
            { label: abMode ? "Prompt A" : "Prompt Editor", value: prompt, onChange: setPrompt, tokens: prompt.length, onAnalyze: analyzePrompt, isLoading: loading },
            ...(abMode ? [{ label: "Prompt B", value: promptB, onChange: setPromptB, tokens: promptB.length, onAnalyze: null, isLoading: loadingB }] : []),
          ].map(({ label, value, onChange, tokens, onAnalyze, isLoading }) => (
            <div
              key={label}
              className="card"
              style={{ padding: 16, display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon d={icons.code} size={14} color="#6366F1" />
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#94A3B8" }}>
                    {label.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                  ~{Math.ceil(tokens / 4)} tokens
                </span>
              </div>
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "#0A0F1A",
                  border: "1px solid #1E2A3A",
                  borderRadius: 8,
                  color: "#A5F3FC",
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.8,
                  minHeight: abMode ? 200 : 280,
                }}
              />
              {!abMode && (
                <button
                  onClick={onAnalyze}
                  disabled={isLoading}
                  style={{
                    marginTop: 12,
                    padding: "10px 24px",
                    background: isLoading ? "#1E3A5F" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    border: "none",
                    borderRadius: 8,
                    color: "#FFF",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isLoading ? (
                    <><span className="spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%" }} />{" "}Analyzing…</>
                  ) : (
                    <><Icon d={icons.zap} size={14} /> Analyze & Optimize</>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
        {abMode && (
          <button
            onClick={analyzeAll}
            disabled={loading || loadingB}
            style={{
              padding: "10px 24px",
              background: loading || loadingB ? "#1E3A5F" : "linear-gradient(135deg, #F59E0B, #EF4444)",
              border: "none",
              borderRadius: 8,
              color: "#FFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || loadingB ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading || loadingB ? (
              <><span className="spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%" }} />{" "}Comparing…</>
            ) : (
              <><Icon d={icons.zap} size={14} /> Compare Both Prompts</>
            )}
          </button>
        )}
      </div>

      {/* Right Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Guardrails */}
        <div className="card" style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Icon d={icons.shield} size={14} color="#10B981" />
            <span
              style={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Guardrails
            </span>
          </div>
          {guardrails.map((g) => (
            <div
              key={g.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <button
                onClick={() =>
                  setGuardrails((p) =>
                    p.map((x) =>
                      x.id === g.id ? { ...x, active: !x.active } : x,
                    ),
                  )
                }
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 9,
                  background: g.active ? "#10B981" : "#1E3A5F",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#FFF",
                    position: "absolute",
                    top: 3,
                    left: g.active ? 17 : 3,
                    transition: "left 0.2s",
                  }}
                />
              </button>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: g.active ? "#E2E8F0" : "#475569",
                  }}
                >
                  {g.name}
                </div>
                <div style={{ fontSize: 11, color: "#374151" }}>{g.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis panel(s) */}
        {[
          { label: abMode ? "A" : null, data: analysis, onApply: setPrompt },
          ...(abMode ? [{ label: "B", data: analysisB, onApply: setPromptB }] : []),
        ].map(({ label, data, onApply }) =>
          data && !data.error ? (
            <div
              key={label || "single"}
              className="card fade-in"
              style={{ padding: 16, overflow: "auto" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#94A3B8" }}>
                  {label ? `PROMPT ${label}` : "ANALYSIS"}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: data.score >= 80 ? "#10B981" : data.score >= 60 ? "#F59E0B" : "#EF4444",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {data.score}
                </span>
              </div>
              <ScoreBar label="Clarity" value={data.clarity} color="#0EA5E9" />
              <ScoreBar label="Security" value={data.security} color="#10B981" />
              <ScoreBar label="Efficiency" value={data.efficiency} color="#6366F1" />
              {data.strengths?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#10B981", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>✓ STRENGTHS</div>
                  {data.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#CBD5E1", marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid #10B98140" }}>{s}</div>
                  ))}
                </div>
              )}
              {data.issues?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#F59E0B", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>⚠ ISSUES</div>
                  {data.issues.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#CBD5E1", marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid #F59E0B40" }}>{s}</div>
                  ))}
                </div>
              )}
              {data.optimized_prompt && (
                <button
                  onClick={() => onApply(data.optimized_prompt)}
                  style={{ width: "100%", padding: "8px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, color: "#818CF8", fontSize: 12, cursor: "pointer" }}
                >
                  Apply Optimized Prompt ↑
                </button>
              )}
            </div>
          ) : data?.error ? (
            <div key={label || "err"} className="card" style={{ padding: 16, color: "#F87171", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              {label ? `Prompt ${label} — ` : ""}Error: {data.error}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─── ARCHITECTURE TAB ──────────────────────────────────────────
function ArchitecturePatterns() {
  const [activePattern, setActivePattern] = useState("rag");
  const [nodePositions, setNodePositions] = useState({});
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const nodeIcons = {
    user: icons.external, client: icons.external,
    api_gw: icons.layers, rag_svc: icons.cpu,
    embed: icons.activity, vector: icons.database,
    claude: icons.zap, cache: icons.layers,
    monitor: icons.activity, orch: icons.cpu,
    planner: icons.layers, executor: icons.play,
    critic: icons.check, tools: icons.settings,
    memory: icons.database, waf: icons.shield,
    authn: icons.shield, pii: icons.shield,
    audit: icons.file, dlp: icons.shield, siem: icons.activity,
  };

  const patterns = {
    rag: {
      name: "RAG Architecture",
      desc: "Retrieval-Augmented Generation pipeline with vector store",
      nodes: [
        {
          id: "user",
          x: 60,
          y: 180,
          w: 80,
          h: 40,
          label: "User",
          color: "#374151",
          text: "#E2E8F0",
        },
        {
          id: "api_gw",
          x: 200,
          y: 180,
          w: 90,
          h: 40,
          label: "API Gateway",
          color: "#1E3A5F",
          text: "#0EA5E9",
        },
        {
          id: "rag_svc",
          x: 360,
          y: 180,
          w: 100,
          h: 40,
          label: "RAG Service",
          color: "#1E1B4B",
          text: "#818CF8",
        },
        {
          id: "embed",
          x: 340,
          y: 280,
          w: 100,
          h: 40,
          label: "Embeddings",
          color: "#0F2D1F",
          text: "#10B981",
        },
        {
          id: "vector",
          x: 500,
          y: 280,
          w: 90,
          h: 40,
          label: "Vector DB",
          color: "#0F2D1F",
          text: "#10B981",
        },
        {
          id: "claude",
          x: 520,
          y: 180,
          w: 90,
          h: 40,
          label: "Claude API",
          color: "#2D1B4B",
          text: "#C084FC",
        },
        {
          id: "cache",
          x: 360,
          y: 80,
          w: 80,
          h: 40,
          label: "Cache",
          color: "#2D1A00",
          text: "#F59E0B",
        },
        {
          id: "monitor",
          x: 520,
          y: 80,
          w: 90,
          h: 40,
          label: "Monitoring",
          color: "#2D1A00",
          text: "#F59E0B",
        },
      ],
      edges: [
        ["user", "api_gw"],
        ["api_gw", "rag_svc"],
        ["rag_svc", "embed"],
        ["embed", "vector"],
        ["rag_svc", "claude"],
        ["api_gw", "cache"],
        ["rag_svc", "monitor"],
      ],
    },
    agent: {
      name: "Multi-Agent System",
      desc: "Orchestrated agent network with specialized sub-agents",
      nodes: [
        {
          id: "orch",
          x: 300,
          y: 50,
          w: 110,
          h: 40,
          label: "Orchestrator",
          color: "#2D1A00",
          text: "#F59E0B",
        },
        {
          id: "planner",
          x: 120,
          y: 160,
          w: 90,
          h: 40,
          label: "Planner",
          color: "#1E1B4B",
          text: "#818CF8",
        },
        {
          id: "executor",
          x: 310,
          y: 160,
          w: 90,
          h: 40,
          label: "Executor",
          color: "#1E3A5F",
          text: "#0EA5E9",
        },
        {
          id: "critic",
          x: 500,
          y: 160,
          w: 80,
          h: 40,
          label: "Critic",
          color: "#2D0F1F",
          text: "#F87171",
        },
        {
          id: "tools",
          x: 200,
          y: 270,
          w: 80,
          h: 40,
          label: "Tools",
          color: "#0F2D1F",
          text: "#10B981",
        },
        {
          id: "memory",
          x: 420,
          y: 270,
          w: 80,
          h: 40,
          label: "Memory",
          color: "#1E1B4B",
          text: "#818CF8",
        },
        {
          id: "claude",
          x: 300,
          y: 270,
          w: 90,
          h: 40,
          label: "Claude API",
          color: "#2D1B4B",
          text: "#C084FC",
        },
      ],
      edges: [
        ["orch", "planner"],
        ["orch", "executor"],
        ["orch", "critic"],
        ["planner", "claude"],
        ["executor", "tools"],
        ["executor", "claude"],
        ["critic", "memory"],
        ["memory", "orch"],
      ],
    },
    secure: {
      name: "Secure Enterprise",
      desc: "Zero-trust AI platform with governance and audit",
      nodes: [
        {
          id: "client",
          x: 50,
          y: 160,
          w: 80,
          h: 40,
          label: "Client App",
          color: "#374151",
          text: "#E2E8F0",
        },
        {
          id: "waf",
          x: 190,
          y: 160,
          w: 70,
          h: 40,
          label: "WAF/DDoS",
          color: "#2D0F1F",
          text: "#F87171",
        },
        {
          id: "authn",
          x: 320,
          y: 90,
          w: 90,
          h: 40,
          label: "Auth/IAM",
          color: "#2D1A00",
          text: "#F59E0B",
        },
        {
          id: "pii",
          x: 320,
          y: 160,
          w: 90,
          h: 40,
          label: "PII Filter",
          color: "#0F2D1F",
          text: "#10B981",
        },
        {
          id: "claude",
          x: 470,
          y: 160,
          w: 90,
          h: 40,
          label: "Claude API",
          color: "#2D1B4B",
          text: "#C084FC",
        },
        {
          id: "audit",
          x: 320,
          y: 230,
          w: 90,
          h: 40,
          label: "Audit Log",
          color: "#1E3A5F",
          text: "#0EA5E9",
        },
        {
          id: "dlp",
          x: 470,
          y: 230,
          w: 80,
          h: 40,
          label: "DLP/CASB",
          color: "#2D1A00",
          text: "#F59E0B",
        },
        {
          id: "siem",
          x: 600,
          y: 160,
          w: 70,
          h: 40,
          label: "SIEM",
          color: "#2D0F1F",
          text: "#F87171",
        },
      ],
      edges: [
        ["client", "waf"],
        ["waf", "authn"],
        ["waf", "pii"],
        ["pii", "claude"],
        ["pii", "audit"],
        ["claude", "dlp"],
        ["claude", "siem"],
        ["authn", "pii"],
      ],
    },
  };

  const pat = patterns[activePattern];

  function getNodePos(patKey, nodeId) {
    const key = `${patKey}-${nodeId}`;
    if (nodePositions[key]) return nodePositions[key];
    const node = patterns[patKey].nodes.find((n) => n.id === nodeId);
    return { x: node.x, y: node.y };
  }

  function getSVGCoords(e) {
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
  }

  function handleNodeMouseDown(e, nodeId) {
    e.preventDefault();
    const pos = getNodePos(activePattern, nodeId);
    const svgPt = getSVGCoords(e);
    dragRef.current = { nodeId, offsetX: svgPt.x - pos.x, offsetY: svgPt.y - pos.y };
  }

  function handleMouseMove(e) {
    if (!dragRef.current) return;
    const { nodeId, offsetX, offsetY } = dragRef.current;
    const svgPt = getSVGCoords(e);
    setNodePositions((p) => ({
      ...p,
      [`${activePattern}-${nodeId}`]: { x: svgPt.x - offsetX, y: svgPt.y - offsetY },
    }));
  }

  function handleMouseUp() { dragRef.current = null; }

  function exportSVG() {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgRef.current);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${activePattern}-architecture.svg`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPNG() {
    const svg = svgRef.current;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const w = svg.getBoundingClientRect().width;
      const canvas = document.createElement("canvas");
      canvas.width = w * 2; canvas.height = 380 * 2;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#070B14"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b); a.download = `${activePattern}-architecture.png`; a.click();
      });
    };
    img.src = url;
  }

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}
    >
      {/* Pattern Selector + Export */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {Object.entries(patterns).map(([k, p]) => (
          <button
            key={k}
            onClick={() => setActivePattern(k)}
            style={{
              padding: "8px 18px",
              background: activePattern === k ? "linear-gradient(135deg, #0EA5E9, #6366F1)" : "rgba(13,20,36,0.8)",
              border: `1px solid ${activePattern === k ? "transparent" : "rgba(30,58,95,0.6)"}`,
              borderRadius: 8,
              color: activePattern === k ? "#FFF" : "#64748B",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {p.name}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {[["SVG", exportSVG], ["PNG", exportPNG]].map(([fmt, fn]) => (
            <button
              key={fmt}
              onClick={fn}
              style={{
                padding: "6px 14px",
                background: "rgba(13,20,36,0.8)",
                border: "1px solid rgba(30,58,95,0.6)",
                borderRadius: 8,
                color: "#64748B",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              ↓ {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Diagram */}
      <div className="card grid-bg" style={{ flex: 1, padding: 20, position: "relative" }}>
        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>{pat.desc}</span>
          <span style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
            // drag nodes to reposition
          </span>
        </div>
        <svg
          ref={svgRef}
          width="100%"
          height={380}
          style={{ overflow: "visible" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#1E3A5F" />
            </marker>
          </defs>
          {/* Edges */}
          {pat.edges.map(([from, to], i) => {
            const fn = pat.nodes.find((n) => n.id === from);
            const tn = pat.nodes.find((n) => n.id === to);
            const fp = getNodePos(activePattern, from);
            const tp = getNodePos(activePattern, to);
            const a = { x: fp.x + fn.w / 2, y: fp.y + fn.h / 2 };
            const b = { x: tp.x + tn.w / 2, y: tp.y + tn.h / 2 };
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            return (
              <path
                key={i}
                d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`}
                stroke="#1E3A5F"
                strokeWidth="1.5"
                fill="none"
                markerEnd="url(#arrow)"
              />
            );
          })}
          {/* Nodes */}
          {pat.nodes.map((node) => {
            const pos = getNodePos(activePattern, node.id);
            const iconPath = nodeIcons[node.id] || icons.cpu;
            return (
              <g
                key={node.id}
                className="node-hover"
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                <rect x={pos.x} y={pos.y} width={node.w} height={node.h} rx={8} fill={node.color} stroke={node.text + "40"} strokeWidth="1.5" />
                {/* Service icon badge */}
                <svg x={pos.x + node.w - 14} y={pos.y + 3} width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={node.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                  <path d={iconPath} />
                </svg>
                <text
                  x={pos.x + node.w / 2}
                  y={pos.y + node.h / 2 + 5}
                  textAnchor="middle"
                  fill={node.text}
                  fontSize="12"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="500"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ position: "absolute", bottom: 20, right: 20, display: "flex", gap: 16 }}>
          {[["Service", "#0EA5E9"], ["AI/ML", "#C084FC"], ["Security", "#F87171"], ["Storage", "#10B981"]].map(([l, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c + "30", border: `1px solid ${c}60` }} />
              <span style={{ fontSize: 11, color: "#475569" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MONITORING TAB ────────────────────────────────────────────
function Monitoring() {
  const [timeRange, setTimeRange] = useState("7d");
  const tokenData = [
    { day: "Mon", input: 420, output: 180, cost: 0.82 },
    { day: "Tue", input: 680, output: 290, cost: 1.34 },
    { day: "Wed", input: 540, output: 220, cost: 1.06 },
    { day: "Thu", input: 920, output: 380, cost: 1.91 },
    { day: "Fri", input: 1100, output: 460, cost: 2.28 },
    { day: "Sat", input: 340, output: 140, cost: 0.67 },
    { day: "Sun", input: 280, output: 110, cost: 0.54 },
  ];
  const latencyData = [
    { hour: "00", p50: 180, p95: 420, p99: 890 },
    { hour: "06", p50: 145, p95: 350, p99: 720 },
    { hour: "12", p50: 290, p95: 680, p99: 1400 },
    { hour: "18", p50: 240, p95: 580, p99: 1200 },
  ];
  const models = [
    {
      name: "claude-sonnet-4",
      calls: 8420,
      tokens: "12.4M",
      cost: "$124.80",
      pct: 68,
    },
    {
      name: "claude-haiku-4",
      calls: 3210,
      tokens: "4.2M",
      cost: "$8.40",
      pct: 22,
    },
    {
      name: "claude-opus-4",
      calls: 540,
      tokens: "0.8M",
      cost: "$60.00",
      pct: 10,
    },
  ];

  const metrics = [
    {
      label: "Total API Calls",
      value: "12,170",
      delta: "+14%",
      up: true,
      color: "#0EA5E9",
    },
    {
      label: "Total Cost (7d)",
      value: "$8.62",
      delta: "+6%",
      up: true,
      color: "#F59E0B",
    },
    {
      label: "Avg Latency",
      value: "248ms",
      delta: "-12%",
      up: false,
      color: "#10B981",
    },
    {
      label: "Error Rate",
      value: "0.02%",
      delta: "-45%",
      up: false,
      color: "#10B981",
    },
  ];

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Time range */}
      <div style={{ display: "flex", gap: 8 }}>
        {["24h", "7d", "30d"].map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            style={{
              padding: "5px 14px",
              background:
                timeRange === r ? "rgba(14,165,233,0.2)" : "transparent",
              border: `1px solid ${timeRange === r ? "rgba(14,165,233,0.5)" : "rgba(30,58,95,0.4)"}`,
              borderRadius: 6,
              color: timeRange === r ? "#0EA5E9" : "#475569",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            className="card metric-card"
            style={{ padding: "16px 20px" }}
          >
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>
              {m.label}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: m.color,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {m.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: m.up ? "#F59E0B" : "#10B981",
                marginTop: 4,
              }}
            >
              {m.delta} vs last period
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Token Usage */}
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 12,
              color: "#94A3B8",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 16,
            }}
          >
            TOKEN USAGE (K)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tokenData} barSize={16}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1E2A3A"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#475569", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#475569", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0D1420",
                  border: "1px solid #1E3A5F",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="input"
                fill="#0EA5E9"
                opacity={0.8}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="output"
                fill="#6366F1"
                opacity={0.8}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latency */}
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 12,
              color: "#94A3B8",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 16,
            }}
          >
            LATENCY PERCENTILES (ms)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="p99grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="p95grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1E2A3A"
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                tick={{ fill: "#475569", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#475569", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0D1420",
                  border: "1px solid #1E3A5F",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="p99"
                stroke="#EF4444"
                fill="url(#p99grad)"
                strokeWidth={1.5}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="p95"
                stroke="#F59E0B"
                fill="url(#p95grad)"
                strokeWidth={1.5}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="p50"
                stroke="#10B981"
                fill="none"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="card" style={{ padding: 20 }}>
        <div
          style={{
            fontSize: 12,
            color: "#94A3B8",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 16,
          }}
        >
          MODEL USAGE BREAKDOWN
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {models.map((m) => (
            <div
              key={m.name}
              style={{
                padding: 16,
                background: "rgba(7,11,20,0.6)",
                border: "1px solid #1E2A3A",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#0EA5E9",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 12,
                }}
              >
                {m.name}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 11, color: "#475569" }}>
                  API Calls
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#CBD5E1",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {m.calls.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 11, color: "#475569" }}>Tokens</span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#CBD5E1",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {m.tokens}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 11, color: "#475569" }}>Cost</span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#F59E0B",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {m.cost}
                </span>
              </div>
              <div
                style={{ height: 4, background: "#1E2A3A", borderRadius: 2 }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${m.pct}%`,
                    background: "linear-gradient(90deg, #0EA5E9, #6366F1)",
                    borderRadius: 2,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  marginTop: 5,
                  textAlign: "right",
                }}
              >
                {m.pct}% of volume
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("rag");

  const tabs = [
    { id: "rag", label: "RAG Pipeline", icon: icons.database },
    { id: "agent", label: "Agent Studio", icon: icons.cpu },
    { id: "prompt", label: "Prompt Studio", icon: icons.code },
    { id: "arch", label: "Architecture", icon: icons.layers },
    { id: "monitor", label: "Monitoring", icon: icons.activity },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "#070B14",
          fontFamily: "'Space Grotesk', sans-serif",
          color: "#E2E8F0",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "1px solid rgba(30,58,95,0.5)",
            padding: "0 24px",
            background: "rgba(7,11,20,0.95)",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", height: 60 }}>
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginRight: 40,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon d={icons.zap} size={16} color="#FFF" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Claude Architect Studio
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Enterprise GenAI Platform
                </div>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`tab-btn${tab === t.id ? " active" : ""}`}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    color: tab === t.id ? "#FFF" : "#64748B",
                  }}
                >
                  <Icon
                    d={t.icon}
                    size={13}
                    color={tab === t.id ? "#FFF" : "#64748B"}
                  />
                  {t.label}
                </button>
              ))}
            </div>
            {/* Status */}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                className="pulse"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10B981",
                  display: "block",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "#10B981",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                claude-sonnet-4 · live
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
          {tab === "rag" && <RAGPipeline />}
          {tab === "agent" && <AgentOrchestration />}
          {tab === "prompt" && <PromptStudio />}
          {tab === "arch" && <ArchitecturePatterns />}
          {tab === "monitor" && <Monitoring />}
        </div>
      </div>
    </>
  );
}
