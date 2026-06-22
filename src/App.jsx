import { useState } from "react";
import { Icon, icons } from "./components/Icon.jsx";
import { MODELS } from "./lib/claude.js";
import RAGPipeline from "./components/tabs/RAGPipeline.jsx";
import AgentOrchestration from "./components/tabs/AgentOrchestration.jsx";
import PromptStudio from "./components/tabs/PromptStudio.jsx";
import ArchitecturePatterns from "./components/tabs/ArchitecturePatterns.jsx";
import Monitoring from "./components/tabs/Monitoring.jsx";

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
        <div style={{ display: "flex", alignItems: "center", height: 60, gap: 16 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Claude Architect Studio
              </div>
              <div style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                Enterprise GenAI Platform
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div className="tab-bar">
            {tabs.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
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
                  whiteSpace: "nowrap",
                  color: tab === t.id ? "#FFF" : "#64748B",
                }}
              >
                <Icon d={t.icon} size={13} color={tab === t.id ? "#FFF" : "#64748B"} />
                {t.label}
              </button>
            ))}
          </div>
          {/* Status */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span
              className="pulse"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "block" }}
            />
            <span style={{ fontSize: 11, color: "#10B981", fontFamily: "'JetBrains Mono', monospace" }}>
              {MODELS.PRIMARY}
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
  );
}
