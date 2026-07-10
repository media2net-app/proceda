import fs from "fs";
import path from "path";
import { fetchGitHubRepoMetadata } from "../src/lib/github-metadata";
import { scanKlantenProjects, type KlantenProject } from "../src/lib/klanten-projects";

const klantenRoot = process.env.KLANTEN_ROOT?.trim() || path.resolve(process.cwd(), "..");
const outputPath = path.join(process.cwd(), "data", "klanten-projects.json");
const githubToken = process.env.GITHUB_TOKEN;

function firstReadmeParagraph(readme: string | null | undefined): string | null {
  if (!readme?.trim()) return null;
  return readme.split("\n\n").find((part) => part.trim().length > 20)?.trim() ?? null;
}

async function enrichWithGitHub(projects: KlantenProject[]): Promise<KlantenProject[]> {
  const enriched: KlantenProject[] = [];

  for (const project of projects) {
    if (!project.githubUrl) {
      enriched.push(project);
      continue;
    }

    const metadata = await fetchGitHubRepoMetadata(project.githubUrl, githubToken);
    if (!metadata) {
      enriched.push(project);
      continue;
    }

    const readmeBody = metadata.readmeExcerpt ?? project.readmeBody;
    const githubDescription =
      metadata.description ?? firstReadmeParagraph(readmeBody) ?? project.githubDescription;

    enriched.push({
      ...project,
      description: githubDescription ?? project.description,
      githubDescription,
      githubLanguage: metadata.language,
      githubTopics: metadata.topics,
      githubUpdatedAt: metadata.updatedAt,
      githubHomepage: metadata.homepage,
      readmeBody,
    });

    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  return enriched;
}

async function main() {
  const projects = await enrichWithGitHub(scanKlantenProjects(klantenRoot));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(projects, null, 2));
  console.log(`✓ ${projects.length} projecten geschreven naar ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
