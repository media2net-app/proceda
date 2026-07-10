export type GitHubRepoMetadata = {
  description: string | null;
  language: string | null;
  topics: string[];
  homepage: string | null;
  updatedAt: string | null;
  readmeExcerpt: string | null;
};

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

function decodeReadme(content: string): string {
  return content
    .replace(/^#+\s+.+\n+/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 2000);
}

export async function fetchGitHubRepoMetadata(
  githubUrl: string,
  token?: string,
): Promise<GitHubRepoMetadata | null> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) return null;

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "proceda-klanten-sync",
  };
  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  try {
    const repoResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers, next: { revalidate: 0 } },
    );
    if (!repoResponse.ok) return null;

    const repo = (await repoResponse.json()) as {
      description?: string | null;
      language?: string | null;
      topics?: string[];
      homepage?: string | null;
      pushed_at?: string | null;
    };

    let readmeExcerpt: string | null = null;
    const readmeResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`,
      { headers, next: { revalidate: 0 } },
    );

    if (readmeResponse.ok) {
      const readme = (await readmeResponse.json()) as { content?: string; encoding?: string };
      if (readme.content && readme.encoding === "base64") {
        const raw = Buffer.from(readme.content, "base64").toString("utf8");
        readmeExcerpt = decodeReadme(raw);
      }
    }

    return {
      description: repo.description?.trim() || null,
      language: repo.language ?? null,
      topics: repo.topics ?? [],
      homepage: repo.homepage?.trim() || null,
      updatedAt: repo.pushed_at ?? null,
      readmeExcerpt,
    };
  } catch {
    return null;
  }
}
