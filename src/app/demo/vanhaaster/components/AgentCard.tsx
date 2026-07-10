"use client";

import type { VanhaasterAgent } from "@/lib/demo/vanhaaster";
import { STATUS_LABELS } from "../hooks/useVanhaasterDemo";

export function AgentCard({ agent }: { agent: VanhaasterAgent }) {
  const isLive = agent.phase === "live";
  const isRunning = isLive && (agent.status === "active" || agent.status === "processing");

  return (
    <article
      className={`vn-agent ${isLive ? "is-live" : "is-phase2"} ${isRunning ? "is-running" : ""}`}
    >
      <div className="vn-agent-head">
        <div>
          <p className="vn-agent-name">{agent.name}</p>
          <p className="vn-agent-tag">{agent.tag}</p>
        </div>
        <span className={`vn-status ${agent.status}`}>
          <span className="vn-status-dot" aria-hidden />
          {STATUS_LABELS[agent.status]}
        </span>
      </div>

      <p className="vn-agent-hook">{agent.hook}</p>
      <p className="vn-agent-action">{agent.lastAction}</p>

      {isLive && agent.currentTask && typeof agent.progress === "number" && (
        <div className="vn-progress-wrap">
          <div className="vn-progress-label">
            <span>{agent.currentTask}</span>
            <span>{agent.progress}%</span>
          </div>
          <div className="vn-progress-bar">
            <div className="vn-progress-fill" style={{ width: `${agent.progress}%` }} />
          </div>
        </div>
      )}

      <div className="vn-metrics">
        {agent.metrics.map((metric) => (
          <span key={metric.label} className="vn-chip">
            {metric.label}: {metric.value}
          </span>
        ))}
        {isLive && (
          <>
            <span className="vn-chip">Runs: {agent.runsToday}</span>
            <span className="vn-chip connected">Uptime {agent.uptime}</span>
          </>
        )}
        {agent.connectors.map((connector) => (
          <span key={connector} className="vn-chip connected">
            {connector} ✓
          </span>
        ))}
      </div>
    </article>
  );
}
