import fs from "fs";
import path from "path";

export type KlantenProject = {
  slug: string;
  title: string;
  description: string;
  githubUrl: string | null;
  githubDescription: string | null;
  githubLanguage: string | null;
  githubTopics: string[];
  githubUpdatedAt: string | null;
  githubHomepage: string | null;
  readmeBody: string | null;
  stack: string[];
};

function formatTitle(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function readGitHubRemote(projectPath: string): string | null {
  const gitConfigPath = path.join(projectPath, ".git", "config");
  if (!fs.existsSync(gitConfigPath)) return null;

  const config = fs.readFileSync(gitConfigPath, "utf8");
  const match = config.match(/url\s*=\s*(.+)/);
  if (!match) return null;

  const remote = match[1].trim();
  if (remote.startsWith("git@github.com:")) {
    return `https://github.com/${remote.replace("git@github.com:", "").replace(/\.git$/, "")}`;
  }
  if (remote.includes("github.com")) {
    return remote.replace(/\.git$/, "");
  }
  return null;
}

function cleanReadmeMarkdown(content: string): string {
  return content
    .replace(/^#+\s+.+\n+/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readReadmeBody(projectPath: string): string | null {
  for (const name of ["README.md", "readme.md", "Readme.md"]) {
    const readmePath = path.join(projectPath, name);
    if (!fs.existsSync(readmePath)) continue;

    const cleaned = cleanReadmeMarkdown(fs.readFileSync(readmePath, "utf8"));
    if (!cleaned) return null;
    return cleaned.slice(0, 2000);
  }
  return null;
}

function readReadmeSummary(projectPath: string): string | null {
  const body = readReadmeBody(projectPath);
  if (!body) return null;
  const paragraph = body.split("\n\n").find((part) => part.trim().length > 0);
  return paragraph?.slice(0, 160) ?? null;
}

function readStack(projectPath: string): string[] {
  const packagePath = path.join(projectPath, "package.json");
  const packageJson = readJsonFile<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
    packagePath,
  );
  if (!packageJson) return [];

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const priority = ["next", "react", "vue", "nuxt", "prisma", "tailwindcss", "typescript", "express", "fastify"];

  const found = priority.filter((dep) => dep in deps);
  const rest = Object.keys(deps)
    .filter((dep) => !dep.startsWith("@types/") && !found.includes(dep))
    .slice(0, 4);

  return [...found, ...rest].slice(0, 6);
}

function readPackageDescription(projectPath: string): string | null {
  const packageJson = readJsonFile<{ description?: string }>(path.join(projectPath, "package.json"));
  return packageJson?.description?.trim() || null;
}

function readShortDescription(projectPath: string, slug: string): string {
  return (
    readPackageDescription(projectPath) ??
    readReadmeSummary(projectPath) ??
    `Project in map klanten/${slug}`
  );
}

function emptyGitHubFields(): Pick<
  KlantenProject,
  "githubDescription" | "githubLanguage" | "githubTopics" | "githubUpdatedAt" | "githubHomepage"
> {
  return {
    githubDescription: null,
    githubLanguage: null,
    githubTopics: [],
    githubUpdatedAt: null,
    githubHomepage: null,
  };
}

export function scanKlantenProjects(klantenRoot: string): KlantenProject[] {
  if (!fs.existsSync(klantenRoot)) return [];

  return fs
    .readdirSync(klantenRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => {
      const slug = entry.name;
      const projectPath = path.join(klantenRoot, slug);

      return {
        slug,
        title: formatTitle(slug),
        description: readShortDescription(projectPath, slug),
        githubUrl: readGitHubRemote(projectPath),
        ...emptyGitHubFields(),
        readmeBody: readReadmeBody(projectPath),
        stack: readStack(projectPath),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "nl"));
}

function firstReadmeParagraph(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  return text.split("\n\n").find((part) => part.trim().length > 20)?.trim() ?? null;
}

function withResolvedDescription(project: KlantenProject): KlantenProject {
  const githubDescription =
    project.githubDescription ?? firstReadmeParagraph(project.readmeBody);
  const description = githubDescription ?? project.description;

  return { ...project, githubDescription, description };
}

function mergeWithCache(local: KlantenProject[], cached: KlantenProject[]): KlantenProject[] {
  const cacheBySlug = new Map(cached.map((project) => [project.slug, project]));

  return local.map((project) => {
    const cachedProject = cacheBySlug.get(project.slug);
    if (!cachedProject) return withResolvedDescription(project);

    return withResolvedDescription({
      ...project,
      githubDescription: cachedProject.githubDescription ?? project.githubDescription,
      githubLanguage: cachedProject.githubLanguage ?? project.githubLanguage,
      githubTopics: cachedProject.githubTopics.length > 0 ? cachedProject.githubTopics : project.githubTopics,
      githubUpdatedAt: cachedProject.githubUpdatedAt ?? project.githubUpdatedAt,
      githubHomepage: cachedProject.githubHomepage ?? project.githubHomepage,
      readmeBody: cachedProject.readmeBody ?? project.readmeBody,
    });
  });
}

export function getKlantenProjects(): KlantenProject[] {
  const jsonPath = path.join(process.cwd(), "data", "klanten-projects.json");
  const klantenRoot = process.env.KLANTEN_ROOT?.trim() || path.resolve(process.cwd(), "..");
  const cached = readJsonFile<KlantenProject[]>(jsonPath) ?? [];

  const scanned = scanKlantenProjects(klantenRoot);
  if (scanned.length > 0) return mergeWithCache(scanned, cached);

  return cached.map(withResolvedDescription);
}
