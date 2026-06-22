import { useState } from "react";
import { Icon, icons } from "../Icon.jsx";
import { streamClaude, MODELS } from "../../lib/claude.js";
import { retrieve } from "../../lib/retrieval.js";

export default function RAGPipeline() {
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
  const [vectorStore, setVectorStore] = useState("Pinecone (Serverless)");
  const [config, setConfig] = useState({
    topK: 2,
    chunkSize: 512,
    overlap: 64,
  });
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
      // Real local vector-similarity retrieval: chunk docs, embed as TF
      // bag-of-words vectors, rank by cosine similarity.
      const scored = retrieve(query, docs, config);

      const context = scored
        .map(
          (d, i) =>
            `[Doc ${i + 1}: ${d.name} · chunk ${d.chunkIndex + 1}]\n${d.text}`,
        )
        .join("\n\n");

      // Show retrieved chunks immediately while answer streams in
      setResult({ retrievedDocs: scored, answer: "" });

      const answer = await streamClaude(
        `You are an enterprise AI architecture assistant. Answer questions using ONLY the provided context documents.
         Cite which documents you used. If the context doesn't answer the question, say so clearly.
         Format your response with: **Answer**, **Sources Used**, and **Confidence Level** (High/Medium/Low).`,
        `Context Documents:\n${context}\n\nQuestion: ${query}`,
        1000,
        (partial) => setStreamingAnswer(partial),
        MODELS.PRIMARY,
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
    <div className="fade-in tab-grid tab-grid--rag">
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
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "#64748B",
                    marginBottom: 5,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {label}
                  <select
                    value={config[key]}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        [key]: Number(e.target.value),
                      }))
                    }
                    style={{
                      width: "100%",
                      marginTop: 5,
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
                </label>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "#64748B",
                marginBottom: 5,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Vector Store
              <select
                value={vectorStore}
                onChange={(e) => setVectorStore(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 5,
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
            </label>
          </div>
          <div style={{ marginTop: 10 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "#64748B",
                marginBottom: 5,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Embedding Model
              <select
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 5,
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
                <option value="text-embedding-3-small">
                  text-embedding-3-small
                </option>
                <option value="text-embedding-3-large">
                  text-embedding-3-large
                </option>
              </select>
            </label>
          </div>
          <p
            style={{
              fontSize: 10,
              color: "#475569",
              lineHeight: 1.5,
              margin: "12px 0 0",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            // local cosine similarity over TF vectors. production would embed
            via {embeddingModel} into {vectorStore.split(" ")[0]}.
          </p>
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
                    type="button"
                    aria-label={`Remove ${doc.name}`}
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
              aria-label="New document name"
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
              aria-label="New document content"
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
              type="button"
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
            aria-label="RAG query"
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
            type="button"
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
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  {result.retrievedDocs.map((d, i) => (
                    <div
                      key={i}
                      title={`${d.name} · chunk ${d.chunkIndex + 1} · score ${d.score.toFixed(3)}`}
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
                      ↑ {d.name.slice(0, 18)}… · c{d.chunkIndex + 1} ·{" "}
                      {d.score.toFixed(2)}
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
