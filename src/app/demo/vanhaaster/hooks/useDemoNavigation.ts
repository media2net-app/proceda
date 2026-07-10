"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { VanhaasterPage } from "@/lib/demo/vanhaaster";

const DEFAULT_PAGE: VanhaasterPage = "dashboard";

function parsePage(value: string | null): VanhaasterPage {
  const pages: VanhaasterPage[] = [
    "dashboard",
    "agents",
    "skills",
    "projects",
    "team",
    "activity",
    "connectors",
    "governance",
  ];
  if (value && pages.includes(value as VanhaasterPage)) {
    return value as VanhaasterPage;
  }
  return DEFAULT_PAGE;
}

export function useDemoNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get("tab"));
  const projectId = searchParams.get("project");
  const agentId = searchParams.get("agent");
  const teamId = searchParams.get("team");

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setPage = useCallback(
    (tab: VanhaasterPage) => {
      push({ tab, project: null, agent: null, team: null });
    },
    [push]
  );

  const openProject = useCallback(
    (id: string) => {
      push({ tab: "projects", project: id, agent: null, team: null });
    },
    [push]
  );

  const openAgent = useCallback(
    (id: string) => {
      push({ tab: "agents", agent: id, project: null, team: null });
    },
    [push]
  );

  const openTeamMember = useCallback(
    (id: string) => {
      push({ tab: "team", team: id, project: null, agent: null });
    },
    [push]
  );

  const closeDetail = useCallback(() => {
    push({ project: null, agent: null, team: null });
  }, [push]);

  return {
    page,
    projectId,
    agentId,
    teamId,
    setPage,
    openProject,
    openAgent,
    openTeamMember,
    closeDetail,
    isDetail: Boolean(projectId || agentId || teamId),
  };
}
