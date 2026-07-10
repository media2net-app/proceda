"use client";

import { ChevronRight } from "lucide-react";
import type { VanhaasterProject } from "@/lib/demo/vanhaaster";
import { PROJECT_STATUS } from "../hooks/useVanhaasterDemo";
import { ProgressBar } from "./Breadcrumbs";

interface ProjectCardProps {
  project: VanhaasterProject;
  onClick: () => void;
  compact?: boolean;
}

export function ProjectCard({ project, onClick, compact }: ProjectCardProps) {
  const status = PROJECT_STATUS[project.status];

  return (
    <button type="button" className={`vn-project-card vn-clickable ${compact ? "is-compact" : ""}`} onClick={onClick}>
      <div className="vn-project-card-head">
        <div className="vn-project-card-copy">
          <p className="vn-project-id">{project.id}</p>
          <p className="vn-project-name">{project.name}</p>
          <p className="vn-project-client">{project.client}</p>
        </div>
        <span className={`vn-pill vn-pill-compact ${status.className}`}>{status.label}</span>
      </div>

      <ProgressBar value={project.progress} label="Voortgang" />

      <div className="vn-project-card-foot">
        <span>Lead: {project.lead}</span>
        <span>Deadline: {project.deadline}</span>
        <ChevronRight className="vn-card-chevron" aria-hidden />
      </div>
    </button>
  );
}
