"use client";

import type { VanhaasterAgent } from "@/lib/demo/vanhaaster";
import { AgentCard } from "../components/AgentCard";

interface AgentsViewProps {
  agents: VanhaasterAgent[];
  onOpenAgent: (id: string) => void;
}

export function AgentsView({ agents, onOpenAgent }: AgentsViewProps) {
  const live = agents.filter((a) => a.phase === "live");
  const phase2 = agents.filter((a) => a.phase === "phase2");
  const totalRuns = live.reduce((sum, a) => sum + a.runsToday, 0);

  return (
    <div className="vn-view">
      <section className="vn-stats vn-stats-4">
        <article className="vn-stat">
          <p className="vn-stat-label">Fase 1 agents</p>
          <p className="vn-stat-value accent">{live.length}</p>
          <p className="vn-stat-sub">live in productie</p>
        </article>
        <article className="vn-stat">
          <p className="vn-stat-label">Runs vandaag</p>
          <p className="vn-stat-value">{totalRuns}</p>
          <p className="vn-stat-sub">alle agents</p>
        </article>
        <article className="vn-stat">
          <p className="vn-stat-label">Gem. uptime</p>
          <p className="vn-stat-value success">99.8%</p>
          <p className="vn-stat-sub">afgelopen 7 dagen</p>
        </article>
        <article className="vn-stat">
          <p className="vn-stat-label">Fase 2 gepland</p>
          <p className="vn-stat-value">{phase2.length}</p>
          <p className="vn-stat-sub">QA · Social · Portfolio</p>
        </article>
      </section>

      <section className="vn-panel">
        <div className="vn-panel-title">
          <h2>Fase 1 — Operationeel</h2>
          <span className="vn-panel-hint">Klik voor details</span>
        </div>
        <div className="vn-agents vn-agents-spaced">
          {live.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className="vn-agent-clickable"
              onClick={() => onOpenAgent(agent.id)}
            >
              <AgentCard agent={agent} />
            </button>
          ))}
        </div>
      </section>

      <section className="vn-panel vn-panel-muted">
        <div className="vn-panel-title">
          <h2>Fase 2 — Uitbreiding</h2>
          <span className="vn-badge">Gepland</span>
        </div>
        <p className="vn-panel-desc">
          Creative QA, Social &amp; Content en Portfolio bouwen we op hetzelfde fundament — apart
          geoffreerd zodra Fase 1 draait.
        </p>
        <div className="vn-agents vn-agents-grid-3">
          {phase2.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className="vn-agent-clickable"
              onClick={() => onOpenAgent(agent.id)}
            >
              <AgentCard agent={agent} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
