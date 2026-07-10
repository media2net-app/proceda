"use client";

import { VANHAASTER_PROJECTS, getAgentName } from "@/lib/demo/vanhaaster";
import { PROJECT_STATUS } from "../hooks/useVanhaasterDemo";
import { ProjectCard } from "../components/ProjectCard";

interface ProjectsViewProps {
  onOpenProject: (id: string) => void;
}

export function ProjectsView({ onOpenProject }: ProjectsViewProps) {
  const onTrack = VANHAASTER_PROJECTS.filter((p) => p.status === "on-track").length;
  const atRisk = VANHAASTER_PROJECTS.filter((p) => p.status === "at-risk").length;
  const waiting = VANHAASTER_PROJECTS.filter(
    (p) => p.status === "waiting" || p.status === "review"
  ).length;

  return (
    <div className="vn-view">
      <section className="vn-kpi-hero vn-kpi-hero-4">
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Lopende projecten</p>
          <p className="vn-kpi-value">{VANHAASTER_PROJECTS.length}</p>
        </article>
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Op schema</p>
          <p className="vn-kpi-value success">{onTrack}</p>
        </article>
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Met risico</p>
          <p className="vn-kpi-value warning">{atRisk}</p>
        </article>
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Wacht op beslissing</p>
          <p className="vn-kpi-value accent">{waiting}</p>
        </article>
      </section>

      <section className="vn-panel">
        <div className="vn-panel-title">
          <h2>Alle projecten</h2>
          <span className="vn-panel-hint">Klik voor details</span>
        </div>
        <div className="vn-projects-grid">
          {VANHAASTER_PROJECTS.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onOpenProject(project.id)}
            />
          ))}
        </div>
      </section>

      <section className="vn-panel">
        <div className="vn-panel-title">
          <h2>Tabelweergave</h2>
        </div>
        <div className="vn-table-wrap">
          <table className="vn-table vn-table-clickable">
            <thead>
              <tr>
                <th>Project</th>
                <th>Klant</th>
                <th>Lead</th>
                <th>Deadline</th>
                <th>Voortgang</th>
                <th>Status</th>
                <th>Agents</th>
              </tr>
            </thead>
            <tbody>
              {VANHAASTER_PROJECTS.map((project) => {
                const status = PROJECT_STATUS[project.status];
                return (
                  <tr
                    key={project.id}
                    className="vn-table-row-clickable"
                    onClick={() => onOpenProject(project.id)}
                  >
                    <td>
                      <strong>{project.name}</strong>
                      <span className="vn-table-mono">{project.id}</span>
                    </td>
                    <td>{project.client}</td>
                    <td>{project.lead}</td>
                    <td className="vn-num">{project.deadline}</td>
                    <td className="vn-num">{project.progress}%</td>
                    <td>
                      <span className={`vn-pill vn-pill-compact ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <div className="vn-chip-row">
                        {project.agentSupport.map((id) => (
                          <span key={id} className="vn-chip connected">
                            {getAgentName(id).split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
