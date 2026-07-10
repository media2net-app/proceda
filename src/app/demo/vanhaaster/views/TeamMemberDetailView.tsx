"use client";

import {
  getTeamMember,
  getTeamMemberProjects,
  type VanhaasterActivity,
} from "@/lib/demo/vanhaaster";
import { TEAM_STATUS } from "../hooks/useVanhaasterDemo";
import { Breadcrumbs, ProgressBar } from "../components/Breadcrumbs";
import { ProjectCard } from "../components/ProjectCard";
import { ActivityFeed } from "../components/DemoWidgets";

interface TeamMemberDetailViewProps {
  memberId: string;
  activities: VanhaasterActivity[];
  onBack: () => void;
  onOpenProject: (id: string) => void;
}

export function TeamMemberDetailView({
  memberId,
  activities,
  onBack,
  onOpenProject,
}: TeamMemberDetailViewProps) {
  const member = getTeamMember(memberId);

  if (!member) {
    return (
      <div className="vn-empty">
        <p>Teamlid niet gevonden.</p>
        <button type="button" className="vn-btn" onClick={onBack}>
          Terug naar team
        </button>
      </div>
    );
  }

  const status = TEAM_STATUS[member.status];
  const projects = getTeamMemberProjects(member.name);
  const memberActivities = activities.slice(0, 4);

  return (
    <div className="vn-view">
      <Breadcrumbs
        items={[
          { label: "Team", onClick: onBack },
          { label: member.name },
        ]}
      />

      <section className="vn-detail-hero vn-detail-hero-team">
        <div className="vn-avatar vn-avatar-lg">{member.initials}</div>
        <div className="vn-detail-hero-copy">
          <h2 className="vn-detail-title">{member.name}</h2>
          <p className="vn-detail-subtitle">{member.role}</p>
          <div className="vn-detail-meta-row">
            <span className={`vn-pill vn-pill-compact ${status.className}`}>{status.label}</span>
            <span className="vn-detail-meta">{member.projects} projecten</span>
            <span className="vn-detail-meta vn-detail-meta-success">
              {member.agentQuestionsSaved}× onderbroken door agents voorkomen
            </span>
          </div>
          {member.currentFocus && (
            <p className="vn-team-focus" style={{ marginTop: 12 }}>
              <strong>Nu:</strong> {member.currentFocus}
            </p>
          )}
        </div>
        <div className="vn-detail-hero-progress">
          <p className="vn-kpi-label">Workload</p>
          <p className="vn-detail-progress-value">{member.load}%</p>
          <ProgressBar value={member.load} showLabel={false} />
        </div>
      </section>

      <div className="vn-grid vn-grid-2">
        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Projecten als lead</h2></div>
          {projects.length === 0 ? (
            <p className="vn-panel-desc">Geen actieve projecten als lead.</p>
          ) : (
            <div className="vn-projects-grid vn-projects-grid-1">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  compact
                  onClick={() => onOpenProject(project.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="vn-panel">
          <div className="vn-panel-title"><h2>Impact via agents</h2></div>
          <div className="vn-stats vn-stats-2">
            <article className="vn-stat">
              <p className="vn-stat-label">Vragen beantwoord</p>
              <p className="vn-stat-value success">{member.agentQuestionsSaved}</p>
              <p className="vn-stat-sub">zonder jou te storen</p>
            </article>
            <article className="vn-stat">
              <p className="vn-stat-label">Actieve projecten</p>
              <p className="vn-stat-value">{member.projects}</p>
            </article>
          </div>
          <div className="vn-panel-title" style={{ marginTop: 16 }}>
            <h2>Recente agent-activiteit</h2>
          </div>
          <ActivityFeed items={memberActivities} limit={4} />
        </section>
      </div>
    </div>
  );
}
