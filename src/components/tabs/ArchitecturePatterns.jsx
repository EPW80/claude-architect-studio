import { useState, useRef } from "react";
import { Icon, icons } from "../Icon.jsx";

export default function ArchitecturePatterns() {
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
        { id: "user", x: 60, y: 180, w: 80, h: 40, label: "User", color: "#374151", text: "#E2E8F0" },
        { id: "api_gw", x: 200, y: 180, w: 90, h: 40, label: "API Gateway", color: "#1E3A5F", text: "#0EA5E9" },
        { id: "rag_svc", x: 360, y: 180, w: 100, h: 40, label: "RAG Service", color: "#1E1B4B", text: "#818CF8" },
        { id: "embed", x: 340, y: 280, w: 100, h: 40, label: "Embeddings", color: "#0F2D1F", text: "#10B981" },
        { id: "vector", x: 500, y: 280, w: 90, h: 40, label: "Vector DB", color: "#0F2D1F", text: "#10B981" },
        { id: "claude", x: 520, y: 180, w: 90, h: 40, label: "Claude API", color: "#2D1B4B", text: "#C084FC" },
        { id: "cache", x: 360, y: 80, w: 80, h: 40, label: "Cache", color: "#2D1A00", text: "#F59E0B" },
        { id: "monitor", x: 520, y: 80, w: 90, h: 40, label: "Monitoring", color: "#2D1A00", text: "#F59E0B" },
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
        { id: "orch", x: 300, y: 50, w: 110, h: 40, label: "Orchestrator", color: "#2D1A00", text: "#F59E0B" },
        { id: "planner", x: 120, y: 160, w: 90, h: 40, label: "Planner", color: "#1E1B4B", text: "#818CF8" },
        { id: "executor", x: 310, y: 160, w: 90, h: 40, label: "Executor", color: "#1E3A5F", text: "#0EA5E9" },
        { id: "critic", x: 500, y: 160, w: 80, h: 40, label: "Critic", color: "#2D0F1F", text: "#F87171" },
        { id: "tools", x: 200, y: 270, w: 80, h: 40, label: "Tools", color: "#0F2D1F", text: "#10B981" },
        { id: "memory", x: 420, y: 270, w: 80, h: 40, label: "Memory", color: "#1E1B4B", text: "#818CF8" },
        { id: "claude", x: 300, y: 270, w: 90, h: 40, label: "Claude API", color: "#2D1B4B", text: "#C084FC" },
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
        { id: "client", x: 50, y: 160, w: 80, h: 40, label: "Client App", color: "#374151", text: "#E2E8F0" },
        { id: "waf", x: 190, y: 160, w: 70, h: 40, label: "WAF/DDoS", color: "#2D0F1F", text: "#F87171" },
        { id: "authn", x: 320, y: 90, w: 90, h: 40, label: "Auth/IAM", color: "#2D1A00", text: "#F59E0B" },
        { id: "pii", x: 320, y: 160, w: 90, h: 40, label: "PII Filter", color: "#0F2D1F", text: "#10B981" },
        { id: "claude", x: 470, y: 160, w: 90, h: 40, label: "Claude API", color: "#2D1B4B", text: "#C084FC" },
        { id: "audit", x: 320, y: 230, w: 90, h: 40, label: "Audit Log", color: "#1E3A5F", text: "#0EA5E9" },
        { id: "dlp", x: 470, y: 230, w: 80, h: 40, label: "DLP/CASB", color: "#2D1A00", text: "#F59E0B" },
        { id: "siem", x: 600, y: 160, w: 70, h: 40, label: "SIEM", color: "#2D0F1F", text: "#F87171" },
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
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {Object.entries(patterns).map(([k, p]) => (
          <button
            type="button"
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
              type="button"
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
        <div style={{ position: "absolute", bottom: 20, right: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
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
