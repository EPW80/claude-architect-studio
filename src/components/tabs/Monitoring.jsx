import { useState } from "react";
import {
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

export default function Monitoring() {
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
    { name: "claude-sonnet-4-6", calls: 8420, tokens: "12.4M", cost: "$124.80", pct: 68 },
    { name: "claude-haiku-4-5", calls: 3210, tokens: "4.2M", cost: "$8.40", pct: 22 },
    { name: "claude-opus-4-8", calls: 540, tokens: "0.8M", cost: "$60.00", pct: 10 },
  ];

  const metrics = [
    { label: "Total API Calls", value: "12,170", delta: "+14%", up: true, color: "#0EA5E9" },
    { label: "Total Cost (7d)", value: "$8.62", delta: "+6%", up: true, color: "#F59E0B" },
    { label: "Avg Latency", value: "248ms", delta: "-12%", up: false, color: "#10B981" },
    { label: "Error Rate", value: "0.02%", delta: "-45%", up: false, color: "#10B981" },
  ];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Time range + demo-data badge */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {["24h", "7d", "30d"].map((r) => (
          <button
            type="button"
            key={r}
            onClick={() => setTimeRange(r)}
            style={{
              padding: "5px 14px",
              background: timeRange === r ? "rgba(14,165,233,0.2)" : "transparent",
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
        <span
          style={{
            marginLeft: "auto",
            padding: "4px 10px",
            borderRadius: 6,
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.4)",
            color: "#F59E0B",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
          }}
          title="Charts use static sample data. Phase 2.4 wires this to the Anthropic Usage API."
        >
          ● Demo data — not live telemetry
        </span>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="card metric-card" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>{m.label}</div>
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
            <div style={{ fontSize: 11, color: m.up ? "#F59E0B" : "#10B981", marginTop: 4 }}>
              {m.delta} vs last period
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        {/* Token Usage */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>
            TOKEN USAGE (K)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tokenData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid #1E3A5F", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="input" fill="#0EA5E9" opacity={0.8} radius={[2, 2, 0, 0]} />
              <Bar dataKey="output" fill="#6366F1" opacity={0.8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latency */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid #1E3A5F", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="p99" stroke="#EF4444" fill="url(#p99grad)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="p95" stroke="#F59E0B" fill="url(#p95grad)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="p50" stroke="#10B981" fill="none" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>
          MODEL USAGE BREAKDOWN
        </div>
        <div className="models-grid">
          {models.map((m) => (
            <div key={m.name} style={{ padding: 16, background: "rgba(7,11,20,0.6)", border: "1px solid #1E2A3A", borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: "#0EA5E9", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
                {m.name}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#475569" }}>API Calls</span>
                <span style={{ fontSize: 12, color: "#CBD5E1", fontFamily: "'JetBrains Mono', monospace" }}>
                  {m.calls.toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#475569" }}>Tokens</span>
                <span style={{ fontSize: 12, color: "#CBD5E1", fontFamily: "'JetBrains Mono', monospace" }}>
                  {m.tokens}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: "#475569" }}>Cost</span>
                <span style={{ fontSize: 12, color: "#F59E0B", fontFamily: "'JetBrains Mono', monospace" }}>
                  {m.cost}
                </span>
              </div>
              <div style={{ height: 4, background: "#1E2A3A", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${m.pct}%`, background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 5, textAlign: "right" }}>
                {m.pct}% of volume
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
