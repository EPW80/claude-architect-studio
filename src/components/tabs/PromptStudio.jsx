import { useState } from "react";
import { Icon, icons } from "../Icon.jsx";
import { callClaude, parseJSON, MODELS } from "../../lib/claude.js";
import {
  applyPIIFilter,
  maxTokensFor,
  decorateSystemPrompt,
  isActive,
} from "../../lib/guardrails.js";

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

export default function PromptStudio() {
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

  // Run analysis applying the active guardrails: model-side guards extend the
  // system prompt, Cost Guard caps max_tokens, PII Filter redacts the result.
  async function analyze(text) {
    const system = decorateSystemPrompt(PROMPT_SYSTEM, guardrails);
    const raw = await callClaude(
      system,
      `Analyze this prompt:\n\n${text}`,
      maxTokensFor(guardrails, 1000),
      MODELS.FAST,
    );
    const parsed = parseJSON(raw);
    return isActive(guardrails, "PII Filter") ? applyPIIFilter(parsed) : parsed;
  }

  async function analyzePrompt() {
    setLoading(true);
    setAnalysis(null);
    try {
      setAnalysis(await analyze(prompt));
    } catch (e) {
      setAnalysis({ error: e.message });
    }
    setLoading(false);
  }

  async function analyzeAll() {
    setLoading(true);
    setLoadingB(true);
    setAnalysis(null);
    setAnalysisB(null);
    const [resA, resB] = await Promise.allSettled([analyze(prompt), analyze(promptB)]);
    setAnalysis(resA.status === "fulfilled" ? resA.value : { error: resA.reason?.message });
    setAnalysisB(resB.status === "fulfilled" ? resB.value : { error: resB.reason?.message });
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
    <div className="fade-in tab-grid tab-grid--prompt">
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Templates + A/B toggle */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {templates.map((t) => (
            <button
              type="button"
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
            type="button"
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
                aria-label={label}
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
                  type="button"
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
            type="button"
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
                type="button"
                role="switch"
                aria-checked={g.active}
                aria-label={`Toggle ${g.name}`}
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
          <p
            style={{
              fontSize: 10,
              color: "#475569",
              lineHeight: 1.5,
              margin: "4px 0 0",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            // PII Filter & Cost Guard enforced client-side; Hallucination/Toxicity guards added to the system prompt
          </p>
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
                  type="button"
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
