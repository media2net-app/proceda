"use client";

import { INITIAL_EXCEPTIONS, KPI_HERO, VANHAASTER_PROJECTS, VANHAASTER_TEAM, type VanhaasterAgent, type VanhaasterActivity, type VanhaasterStat } from "@/lib/demo/vanhaaster";
import { toneClass } from "../hooks/useVanhaasterDemo";
import { AgentCard } from "../components/AgentCard";
import { ActivityFeed, ExceptionQueue, MiniSparkline } from "../components/DemoWidgets";
import { ProjectCard } from "../components/ProjectCard";

interface DashboardViewProps {
  agents: VanhaasterAgent[];
  stats: VanhaasterStat[];
  activities: VanhaasterActivity[];
  totalRuns: number;
  onOpenProject?: (id: string) => void;
}

export function DashboardView({
  agents,
  stats,
  activities,
  totalRuns,
  onOpenProject,
}: DashboardViewProps) {
  const liveAgents = agents.filter((a) => a.phase === "live");
  const activeProjects = VANHAASTER_PROJECTS.filter((p) => p.status !== "review").length;
  const atRisk = VANHAASTER_PROJECTS.filter((p) => p.status === "at-risk").length;
  const teamSaved = VANHAASTER_TEAM.reduce((sum, m) => sum + m.agentQuestionsSaved, 0);

  return (
    <div className="vn-view">
      <section className="vn-kpi-hero" aria-label="KPI overzicht">
        {KPI_HERO.map((kpi) => (
          <article key={kpi.id} className="vn-kpi-card">
            <p className="vn-kpi-label">{kpi.label}</p>
            <div className="vn-kpi-row">
              <p className="vn-kpi-value">{kpi.id === "automations" ? totalRuns : kpi.value}</p>
              <span className={`vn-kpi-change ${kpi.positive ? "up" : "down"}`}>
                {kpi.change}
              </span>
            </div>
            <MiniSparkline values={kpi.spark} />
          </article>
        ))}
      </section>

      <section className="vn-stats vn-stats-6" aria-label="Kerncijfers">
        <article className="vn-stat">
          <p className="vn-stat-label">Actieve projecten</p>
          <p className="vn-stat-value accent">{activeProjects}</p>
          <p className="vn-stat-sub">{atRisk} met risico</p>
        </article>
        <article className="vn-stat">
          <p className="vn-stat-label">Teamleden online</p>
          <p className="vn-stat-value success">
            {VANHAASTER_TEAM.filter((m) => m.status !== "offline").length}
          </p>
          <p className="vn-stat-sub">van {VANHAASTER_TEAM.length}</p>
        </article>
        {stats.map((stat) => (
          <article key={stat.id} className="vn-stat">
            <p className="vn-stat-label">{stat.label}</p>
            <p className={`vn-stat-value ${toneClass(stat.tone)}`}>{stat.value}</p>
            {stat.sub && <p className="vn-stat-sub">{stat.sub}</p>}
          </article>
        ))}
        <article className="vn-stat">
          <p className="vn-stat-label">Onderbrekingen voorkomen</p>
          <p className="vn-stat-value success">{teamSaved}</p>
          <p className="vn-stat-sub">via Knowledge Agent</p>
        </article>
      </section>

      <div className="vn-grid vn-grid-dashboard">
        <section className="vn-panel">
          <div className="vn-panel-title">
            <h2>Agents live</h2>
            <span className="vn-badge vn-badge-live">3 actief</span>
          </div>
          <div className="vn-agents">
            {liveAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        <div className="vn-stack">
          <section className="vn-panel">
            <div className="vn-panel-title">
              <h2>Open beslissingen</h2>
            </div>
            <ExceptionQueue items={INITIAL_EXCEPTIONS.slice(0, 5)} />
          </section>

          <section className="vn-panel">
            <div className="vn-panel-title">
              <h2>Live activiteit</h2>
              <span className="vn-badge vn-badge-live">Sync</span>
            </div>
            <ActivityFeed items={activities} limit={5} />
          </section>
        </div>
      </div>

      {onOpenProject && (
        <section className="vn-panel">
          <div className="vn-panel-title">
            <h2>Projecten die aandacht vragen</h2>
            <span className="vn-panel-hint">Klik voor details</span>
          </div>
          <div className="vn-projects-grid vn-projects-grid-3">
            {VANHAASTER_PROJECTS.filter(
              (p) => p.status === "at-risk" || p.status === "waiting" || p.status === "review"
            ).map((project) => (
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
