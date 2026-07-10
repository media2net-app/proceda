"use client";

import {
  getAgentName,
  getProject,
  getProjectActivities,
  getProjectDetail,
  getProjectExceptions,
  type VanhaasterActivity,
  type VanhaasterAgent,
} from "@/lib/demo/vanhaaster";
import { PROJECT_STATUS } from "../hooks/useVanhaasterDemo";
import { Breadcrumbs, ProgressBar } from "../components/Breadcrumbs";
import { ActivityFeed } from "../components/DemoWidgets";
import { AgentCard } from "../components/AgentCard";

interface ProjectDetailViewProps {
  projectId: string;
  agents: VanhaasterAgent[];
  activities: VanhaasterActivity[];
  onBack: () => void;
  onOpenAgent: (id: string) => void;
}

export function ProjectDetailView({
  projectId,
  agents,
  activities,
  onBack,
  onOpenAgent,
}: ProjectDetailViewProps) {
  const project = getProject(projectId);
  const detail = getProjectDetail(projectId);

  if (!project || !detail) {
    return (
      <div className="vn-empty">
        <p>Project niet gevonden.</p>
        <button type="button" className="vn-btn" onClick={onBack}>
          Terug naar projecten
        </button>
      </div>
    );
  }

  const status = PROJECT_STATUS[project.status];
  const projectAgents = agents.filter((a) => project.agentSupport.includes(a.id));
  const projectExceptions = getProjectExceptions(projectId);
  const seededActivities = [
    ...activities.filter((a) => a.projectId === projectId),
    ...getProjectActivities(projectId).map((a, i) => ({
      ...a,
      id: `detail-${projectId}-${i}`,
    })),
  ].slice(0, 8);

  return (
    <div className="vn-view">
      <Breadcrumbs
        items={[
          { label: "Projecten", onClick: onBack },
          { label: project.id },
          { label: project.name },
        ]}
      />

      <section className="vn-detail-hero">
        <div className="vn-detail-hero-copy">
          <p className="vn-project-id">{project.id}</p>
          <h2 className="vn-detail-title">{project.name}</h2>
          <p className="vn-detail-subtitle">
            {project.client} · {project.type}
          </p>
          <div className="vn-detail-meta-row">
            <span className={`vn-pill vn-pill-compact ${status.className}`}>{status.label}</span>
            <span className="vn-detail-meta">Lead: {project.lead}</span>
            <span className="vn-detail-meta">Deadline: {project.deadline}</span>
            {detail.budget && <span className="vn-detail-meta">Budget: {detail.budget}</span>}
          </div>
        </div>
        <div className="vn-detail-hero-progress">
          <p className="vn-kpi-label">Voortgang</p>
          <p className="vn-detail-progress-value">{project.progress}%</p>
          <ProgressBar value={project.progress} showLabel={false} />
        </div>
      </section>

      <div className="vn-grid vn-grid-2">
        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Briefing</h2></div>
          <p className="vn-panel-desc">{detail.briefing}</p>
          <div className="vn-panel-title" style={{ marginTop: 16 }}>
            <h2>Deliverables</h2>
          </div>
          <ul className="vn-list">
            {detail.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Milestones</h2></div>
          <div className="vn-milestones">
            {detail.milestones.map((milestone) => (
              <div
                key={milestone.label}
                className={`vn-milestone ${milestone.done ? "is-done" : ""}`}
              >
                <span className="vn-milestone-check" aria-hidden>
                  {milestone.done ? "✓" : "○"}
                </span>
                <div>
                  <p className="vn-milestone-label">{milestone.label}</p>
                  {milestone.date && <p className="vn-milestone-date">{milestone.date}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="vn-grid vn-grid-3">
        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Blockers</h2></div>
          {detail.blockers.length === 0 ? (
            <p className="vn-panel-desc">Geen blockers — project loopt op schema.</p>
          ) : (
            <ul className="vn-blocker-list">
              {detail.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Assets</h2></div>
          <div className="vn-assets">
            {detail.assets.map((asset) => (
              <div key={asset.name} className="vn-asset-row">
                <span>{asset.name}</span>
                <span className={`vn-pill vn-pill-compact ${assetStatusClass(asset.status)}`}>
                  {assetStatusLabel(asset.status)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Team</h2></div>
          <div className="vn-chip-row">
            {detail.team.map((name) => (
              <span key={name} className="vn-chip">
                {name}
              </span>
            ))}
          </div>
          <p className="vn-detail-meta" style={{ marginTop: 12 }}>
            Gestart: {detail.started}
          </p>
        </section>
      </div>

      <section className="vn-panel">
        <div className="vn-panel-title">
          <h2>Agents op dit project</h2>
        </div>
        <div className="vn-agents vn-agents-grid-3">
          {projectAgents.map((agent) => (
            <div key={agent.id} className="vn-detail-agent-wrap">
              <AgentCard agent={agent} />
              <button
                type="button"
                className="vn-btn vn-btn-ghost vn-btn-sm"
                onClick={() => onOpenAgent(agent.id)}
              >
                Agent details →
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="vn-grid vn-grid-2">
        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Agent-activiteit</h2></div>
          <ActivityFeed items={seededActivities} limit={6} />
        </section>
        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Open beslissingen</h2></div>
          {projectExceptions.length === 0 ? (
            <p className="vn-panel-desc">Geen open beslissingen voor dit project.</p>
          ) : (
            <ul className="vn-blocker-list">
              {projectExceptions.map((ex) => (
                <li key={ex.id}>
                  <strong>{ex.title}</strong> — {ex.detail}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function assetStatusLabel(status: "ok" | "missing" | "review") {
  if (status === "ok") return "OK";
  if (status === "missing") return "Ontbreekt";
  return "Review";
}

function assetStatusClass(status: "ok" | "missing" | "review") {
  if (status === "ok") return "success";
  if (status === "missing") return "warning";
  return "review";
}
