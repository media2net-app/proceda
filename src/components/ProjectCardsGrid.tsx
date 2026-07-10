"use client";

import { ExpandableCard } from "@/components/ui/expandable-card";
import type { KlantenProject } from "@/lib/klanten-projects";

type ProjectCardsGridProps = {
  projects: KlantenProject[];
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function firstReadmeParagraph(text: string | null): string | null {
  if (!text?.trim()) return null;
  return text.split("\n\n").find((part) => part.trim().length > 20)?.trim() ?? null;
}

function renderParagraphs(text: string) {
  return text.split("\n\n").map((paragraph) => (
    <p key={paragraph.slice(0, 40)} className="leading-relaxed">
      {paragraph.trim()}
    </p>
  ));
}

function ProjectCardDetails({ project }: { project: KlantenProject }) {
  const updated = formatDate(project.githubUpdatedAt);
  const intro = project.githubDescription ?? firstReadmeParagraph(project.readmeBody);
  const readmeRest =
    project.readmeBody && intro && project.readmeBody.startsWith(intro)
      ? project.readmeBody.slice(intro.length).trim()
      : project.readmeBody;

  return (
    <>
      {intro ? (
        <>
          <h4>Omschrijving</h4>
          <p className="text-base leading-relaxed text-zinc-200">{intro}</p>
        </>
      ) : null}

      {readmeRest ? (
        <>
          <h4>README</h4>
          <div className="space-y-3">{renderParagraphs(readmeRest)}</div>
        </>
      ) : null}

      {(project.githubLanguage || project.githubTopics.length > 0 || updated) && (
        <>
          <h4>Repository</h4>
          <ul className="space-y-1 text-sm">
            {project.githubLanguage ? <li>Taal: {project.githubLanguage}</li> : null}
            {updated ? <li>Laatste push: {updated}</li> : null}
            {project.githubTopics.length > 0 ? (
              <li>Thema&apos;s: {project.githubTopics.join(", ")}</li>
            ) : null}
            <li>
              Map: <span className="text-zinc-300">klanten/{project.slug}</span>
            </li>
          </ul>
        </>
      )}

      {project.stack.length > 0 ? (
        <>
          <h4>Stack</h4>
          <p>{project.stack.join(" · ")}</p>
        </>
      ) : null}

      {project.githubUrl ? (
        <>
          <h4>GitHub</h4>
          <div className="flex flex-col gap-2">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#a78bfa] underline underline-offset-2 hover:text-[#c4b5fd]"
              onClick={(event) => event.stopPropagation()}
            >
              {project.githubUrl}
            </a>
            {project.githubHomepage ? (
              <a
                href={project.githubHomepage}
                target="_blank"
                rel="noreferrer"
                className="text-[#a78bfa] underline underline-offset-2 hover:text-[#c4b5fd]"
                onClick={(event) => event.stopPropagation()}
              >
                {project.githubHomepage}
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}

export default function ProjectCardsGrid({ projects }: ProjectCardsGridProps) {
  if (projects.length === 0) {
    return (
      <p className="text-center text-sm text-white/60">
        Geen projecten gevonden in map klanten.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ExpandableCard
          key={project.slug}
          title={project.title}
          description={project.githubDescription ?? firstReadmeParagraph(project.readmeBody) ?? project.description}
          classNameExpanded="[&_h4]:font-medium [&_h4]:text-white"
        >
          <ProjectCardDetails project={project} />
        </ExpandableCard>
      ))}
    </div>
  );
}
