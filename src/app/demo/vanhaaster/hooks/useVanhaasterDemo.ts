"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ACTIVITY_POOL,
  AGENT_TASK_ROTATIONS,
  INITIAL_AGENTS,
  INITIAL_STATS,
  type VanhaasterActivity,
  type VanhaasterAgent,
  type VanhaasterStat,
} from "@/lib/demo/vanhaaster";

export function useVanhaasterDemo() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [activities, setActivities] = useState<VanhaasterActivity[]>(() =>
    ACTIVITY_POOL.slice(0, 8).map((item, index) => ({
      ...item,
      id: `seed-${index}`,
    }))
  );
  const [tick, setTick] = useState(0);
  const [activityIndex, setActivityIndex] = useState(8);
  const [totalRuns, setTotalRuns] = useState(147);

  const rotateAgentTasks = useCallback(() => {
    setAgents((current) =>
      current.map((agent) => {
        if (agent.phase !== "live") return agent;

        const rotations = AGENT_TASK_ROTATIONS[agent.id];
        if (!rotations?.length) return agent;

        const rotationIndex = tick % rotations.length;
        const rotation = rotations[rotationIndex];
        const statuses: VanhaasterAgent["status"][] = ["processing", "active", "active"];
        const status = statuses[rotationIndex % statuses.length];

        return {
          ...agent,
          status,
          currentTask: rotation.task,
          lastAction: rotation.action,
          progress: rotation.progress,
          runsToday: agent.runsToday + Math.floor(Math.random() * 2),
        };
      })
    );
  }, [tick]);

  const pushActivity = useCallback(() => {
    const next = ACTIVITY_POOL[activityIndex % ACTIVITY_POOL.length];
    setActivityIndex((value) => value + 1);
    setTotalRuns((value) => value + 1);
    setActivities((current) => [
      {
        ...next,
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
      ...current.slice(0, 24),
    ]);

    if (next.agentId === "knowledge" && next.tone === "success") {
      setStats((current) =>
        current.map((stat) =>
          stat.id === "answered" ? { ...stat, value: stat.value + 1 } : stat
        )
      );
    }
  }, [activityIndex]);

  useEffect(() => {
    rotateAgentTasks();
  }, [rotateAgentTasks]);

  useEffect(() => {
    const taskTimer = window.setInterval(() => setTick((v) => v + 1), 4500);
    const activityTimer = window.setInterval(() => pushActivity(), 3200);
    const statTimer = window.setInterval(() => {
      setStats((current) =>
        current.map((stat) => {
          if (stat.id === "answered") return stat;
          const delta = Math.random() > 0.65 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          return { ...stat, value: Math.max(0, stat.value + delta) };
        })
      );
    }, 8000);

    return () => {
      window.clearInterval(taskTimer);
      window.clearInterval(activityTimer);
      window.clearInterval(statTimer);
    };
  }, [pushActivity]);

  return { agents, stats, activities, totalRuns };
}

export function toneClass(tone?: VanhaasterStat["tone"]) {
  if (tone === "warning") return "warning";
  if (tone === "accent") return "accent";
  if (tone === "success") return "success";
  return "";
}

export function priorityLabel(priority: "action" | "review" | "info") {
  if (priority === "action") return "Actie";
  if (priority === "review") return "Review";
  return "Info";
}

export const STATUS_LABELS: Record<VanhaasterAgent["status"], string> = {
  idle: "Standby",
  active: "Actief",
  processing: "Bezig",
  waiting: "Wacht op review",
};

export const PROJECT_STATUS: Record<
  string,
  { label: string; className: string }
> = {
  "on-track": { label: "Op schema", className: "success" },
  "at-risk": { label: "Risico", className: "warning" },
  waiting: { label: "Wacht", className: "accent" },
  review: { label: "Review", className: "accent" },
};

export const TEAM_STATUS: Record<string, { label: string; className: string }> = {
  available: { label: "Beschikbaar", className: "success" },
  busy: { label: "Bezig", className: "accent" },
  "in-meeting": { label: "In meeting", className: "warning" },
  offline: { label: "Offline", className: "muted" },
};
