"use client";

import {
  getAgent,
  getAgentProjects,
  VANHAASTER_SKILLS,
  type VanhaasterAgent,
} from "@/lib/demo/vanhaaster";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { AgentCard } from "../components/AgentCard";
import { ProjectCard } from "../components/ProjectCard";

interface AgentDetailViewProps {
  agentId: string;
  agents: VanhaasterAgent[];
  onBack: () => void;
  onOpenProject: (id: string) => void;
}

export function AgentDetailView({
  agentId,
  agents,
  onBack,
  onOpenProject,
}: AgentDetailViewProps) {
  const agent = getAgent(agentId) ?? agents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <div className="vn-empty">
        <p>Agent niet gevonden.</p>
        <button type="button" className="vn-btn" onClick={onBack}>
          Terug naar agents
        </button>
      </div>
    );
  }

  const skills = VANHAASTER_SKILLS.filter((s) => s.agentId === agent.id);
  const projects = getAgentProjects(agent.id);

  return (
    <div className="vn-view">
      <Breadcrumbs
        items={[
          { label: "Agents", onClick: onBack },
          { label: agent.name },
        ]}
      />

      <AgentCard agent={agent} />

      <div className="vn-grid vn-grid-2">
        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Skills</h2></div>
          <div className="vn-table-wrap">
            <table className="vn-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Runs</th>
                  <th>Success</th>
                  <th>Duur</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id}>
                    <td><strong>{skill.name}</strong></td>
                    <td className="vn-num">{skill.runs || "—"}</td>
                    <td className="vn-num">{skill.successRate ? `${skill.successRate}%` : "—"}</td>
                    <td className="vn-num">{skill.avgDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Connectors</h2></div>
          <div className="vn-chip-row" style={{ marginBottom: 16 }}>
            {agent.connectors.map((c) => (
              <span key={c} className="vn-chip connected">
                {c} ✓
              </span>
            ))}
          </div>
          <div className="vn-panel-title"><h2>Metrics vandaag</h2></div>
          <div className="vn-stats vn-stats-2">
            {agent.metrics.map((m) => (
              <article key={m.label} className="vn-stat">
                <p className="vn-stat-label">{m.label}</p>
                <p className="vn-stat-value">{m.value}</p>
              </article>
            ))}
            {agent.phase === "live" && (
              <>
                <article className="vn-stat">
                  <p className="vn-stat-label">Runs</p>
                  <p className="vn-stat-value accent">{agent.runsToday}</p>
                </article>
                <article className="vn-stat">
                  <p className="vn-stat-label">Uptime</p>
                  <p className="vn-stat-value success">{agent.uptime}</p>
                </article>
              </>
            )}
          </div>
        </section>
      </div>

      {projects.length > 0 && (
        <section className="vn-panel">
          <div className="vn-panel-title">
            <h2>Actieve projecten</h2>
            <span className="vn-badge">{projects.length}</span>
          </div>
          <div className="vn-projects-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                compact
                onClick={() => onOpenProject(project.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
