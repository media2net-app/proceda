"use client";

import { VANHAASTER_TEAM } from "@/lib/demo/vanhaaster";
import { TEAM_STATUS } from "../hooks/useVanhaasterDemo";
import { ProgressBar } from "../components/Breadcrumbs";

interface TeamViewProps {
  onOpenMember: (id: string) => void;
}

export function TeamView({ onOpenMember }: TeamViewProps) {
  const totalSaved = VANHAASTER_TEAM.reduce((sum, m) => sum + m.agentQuestionsSaved, 0);
  const avgLoad = Math.round(
    VANHAASTER_TEAM.reduce((sum, m) => sum + m.load, 0) / VANHAASTER_TEAM.length
  );

  return (
    <div className="vn-view">
      <section className="vn-kpi-hero vn-kpi-hero-3">
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Teamleden</p>
          <p className="vn-kpi-value">{VANHAASTER_TEAM.length}</p>
          <p className="vn-kpi-sub">inclusief stagiair</p>
        </article>
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Onderbrekingen voorkomen</p>
          <p className="vn-kpi-value success">{totalSaved}</p>
          <p className="vn-kpi-sub">vandaag via Knowledge</p>
        </article>
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Gem. workload</p>
          <p className="vn-kpi-value">{avgLoad}%</p>
          <p className="vn-kpi-sub">capaciteit team</p>
        </article>
      </section>

      <div className="vn-team-grid">
        {VANHAASTER_TEAM.map((member) => {
          const status = TEAM_STATUS[member.status];
          return (
            <button
              key={member.id}
              type="button"
              className="vn-team-card vn-clickable"
              onClick={() => onOpenMember(member.id)}
            >
              <div className="vn-team-head">
                <div className="vn-avatar">{member.initials}</div>
                <div className="vn-team-head-copy">
                  <p className="vn-team-name">{member.name}</p>
                  <p className="vn-team-role">{member.role}</p>
                </div>
                <span className={`vn-pill vn-pill-compact ${status.className}`}>
                  {status.label}
                </span>
              </div>

              {member.currentFocus && (
                <p className="vn-team-focus">
                  <strong>Nu:</strong> {member.currentFocus}
                </p>
              )}

              <div className="vn-team-stats">
                <div>
                  <p className="vn-team-stat-label">Projecten</p>
                  <p className="vn-team-stat-value">{member.projects}</p>
                </div>
                <div>
                  <p className="vn-team-stat-label">Load</p>
                  <ProgressBar value={member.load} showLabel={false} size="sm" />
                  <p className="vn-team-load-pct">{member.load}%</p>
                </div>
                <div>
                  <p className="vn-team-stat-label">Agent saves</p>
                  <p className="vn-team-stat-value success">{member.agentQuestionsSaved}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
