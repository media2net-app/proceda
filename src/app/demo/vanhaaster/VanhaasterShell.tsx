"use client";

import {
  PAGE_TITLES,
  getAgent,
  getProject,
  getTeamMember,
  VANHAASTER_BRAND,
} from "@/lib/demo/vanhaaster";
import { useVanhaasterDemo } from "./hooks/useVanhaasterDemo";
import { useDemoNavigation } from "./hooks/useDemoNavigation";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./views/DashboardView";
import { AgentsView } from "./views/AgentsView";
import { SkillsView } from "./views/SkillsView";
import { ProjectsView } from "./views/ProjectsView";
import { TeamView } from "./views/TeamView";
import { ActivityView } from "./views/ActivityView";
import { ConnectorsView } from "./views/ConnectorsView";
import { GovernanceView } from "./views/GovernanceView";
import { ProjectDetailView } from "./views/ProjectDetailView";
import { AgentDetailView } from "./views/AgentDetailView";
import { TeamMemberDetailView } from "./views/TeamMemberDetailView";

function detailTitle(
  projectId: string | null,
  agentId: string | null,
  teamId: string | null
): { title: string; subtitle: string } | null {
  if (projectId) {
    const project = getProject(projectId);
    if (project) {
      return {
        title: project.name,
        subtitle: `${project.id} · ${project.client}`,
      };
    }
  }
  if (agentId) {
    const agent = getAgent(agentId);
    if (agent) {
      return {
        title: agent.name,
        subtitle: agent.hook,
      };
    }
  }
  if (teamId) {
    const member = getTeamMember(teamId);
    if (member) {
      return {
        title: member.name,
        subtitle: member.role,
      };
    }
  }
  return null;
}

export function VanhaasterShell() {
  const nav = useDemoNavigation();
  const demo = useVanhaasterDemo();

  const pageMeta = PAGE_TITLES[nav.page];
  const detailMeta = detailTitle(nav.projectId, nav.agentId, nav.teamId);
  const meta = detailMeta ?? pageMeta;

  return (
    <div className="vanhaaster-demo">
      <div className="vn-app">
        <Sidebar active={nav.page} onNavigate={nav.setPage} />

        <div className="vn-main">
          <header className="vn-topbar">
            <div>
              <p className="vn-eyebrow">
                {VANHAASTER_BRAND.partner} × {VANHAASTER_BRAND.client}
              </p>
              <h1 className="vn-title">{meta.title}</h1>
              <p className="vn-subtitle">{meta.subtitle}</p>
            </div>
            <div className="vn-topbar-actions">
              <span className="vn-badge vn-badge-live">{VANHAASTER_BRAND.demoLabel}</span>
              <span className="vn-topbar-date">Vrijdag 10 jul 2026 · 14:52</span>
            </div>
          </header>

          <main className="vn-main-content">
            {nav.projectId ? (
              <ProjectDetailView
                projectId={nav.projectId}
                agents={demo.agents}
                activities={demo.activities}
                onBack={nav.closeDetail}
                onOpenAgent={nav.openAgent}
              />
            ) : nav.agentId ? (
              <AgentDetailView
                agentId={nav.agentId}
                agents={demo.agents}
                onBack={nav.closeDetail}
                onOpenProject={nav.openProject}
              />
            ) : nav.teamId ? (
              <TeamMemberDetailView
                memberId={nav.teamId}
                activities={demo.activities}
                onBack={nav.closeDetail}
                onOpenProject={nav.openProject}
              />
            ) : (
              <>
                {nav.page === "dashboard" && (
                  <DashboardView
                    agents={demo.agents}
                    stats={demo.stats}
                    activities={demo.activities}
                    totalRuns={demo.totalRuns}
                    onOpenProject={nav.openProject}
                  />
                )}
                {nav.page === "agents" && (
                  <AgentsView agents={demo.agents} onOpenAgent={nav.openAgent} />
                )}
                {nav.page === "skills" && <SkillsView />}
                {nav.page === "projects" && (
                  <ProjectsView onOpenProject={nav.openProject} />
                )}
                {nav.page === "team" && (
                  <TeamView onOpenMember={nav.openTeamMember} />
                )}
                {nav.page === "activity" && (
                  <ActivityView activities={demo.activities} />
                )}
                {nav.page === "connectors" && <ConnectorsView />}
                {nav.page === "governance" && <GovernanceView />}
              </>
            )}
          </main>

          <footer className="vn-footer">
            <span>{VANHAASTER_BRAND.tagline}</span>
            <span>Proceda — onderdeel van Media2Net</span>
            <span>Chiel van der Zee</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
