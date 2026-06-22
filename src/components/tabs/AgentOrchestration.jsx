import { useState, useRef } from "react";
import { Icon, icons } from "../Icon.jsx";
import { callClaude, parseJSON, MODELS } from "../../lib/claude.js";

export default function AgentOrchestration() {
  const [task, setTask] = useState(
    "Research the best practices for implementing a multi-tenant RAG system on AWS, then create a brief implementation plan with cost estimates.",
  );
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [finalAnswer, setFinalAnswer] = useState("");
  const stopRef = useRef(false);
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

  function stopAgent() {
    stopRef.current = true;
  }

  async function runAgent() {
    setLoading(true);
    setSteps([]);
    setFinalAnswer("");
    stopRef.current = false;
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
        1000,
        MODELS.PRIMARY,
      );
      const parsed = parseJSON(result);
      // Animate steps (interruptible via the Stop button)
      for (let i = 0; i < parsed.steps.length; i++) {
        if (stopRef.current) break;
        await new Promise((r) => setTimeout(r, 600));
        if (stopRef.current) break;
        setSteps((prev) => [...prev, parsed.steps[i]]);
      }
      if (!stopRef.current) setFinalAnswer(parsed.answer);
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
    <div className="fade-in tab-grid tab-grid--agent">
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
                type="button"
                role="switch"
                aria-checked={tool.enabled}
                aria-label={`Toggle ${tool.name}`}
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
            ["Model", MODELS.PRIMARY],
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
            aria-label="Agent task"
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
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={runAgent}
              disabled={loading}
              style={{
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
            {loading && (
              <button
                type="button"
                onClick={stopAgent}
                style={{
                  padding: "10px 18px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 8,
                  color: "#F87171",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon d={icons.stop} size={14} /> Stop
              </button>
            )}
          </div>
          <p
            style={{
              fontSize: 11,
              color: "#475569",
              margin: "10px 0 0",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            // simulated ReAct trace — Claude generates the reasoning/tool
            steps; tools are not actually executed
          </p>
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
