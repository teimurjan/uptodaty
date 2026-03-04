import type { RawArticle, Source } from "./types";

interface GitHubRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  owner: { login: string };
  created_at: string;
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
}

const AI_TOPICS = [
  "machine-learning",
  "large-language-models",
  "artificial-intelligence",
  "deep-learning",
  "llm",
  "generative-ai",
];

function weekAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
}

async function fetchTopicRepos(
  topic: string,
  perTopic: number,
): Promise<GitHubRepo[]> {
  const query = `topic:${topic}+created:>${weekAgo()}+stars:>50`;
  const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=${perTopic}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "uptodaty/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API: ${response.status}`);
  }

  const data: GitHubSearchResponse = await response.json();
  return data.items;
}

function deduplicateRepos(repos: GitHubRepo[]): GitHubRepo[] {
  const byName = new Map<string, GitHubRepo>();
  for (const repo of repos) {
    const existing = byName.get(repo.full_name);
    if (!existing || repo.stargazers_count > existing.stargazers_count) {
      byName.set(repo.full_name, repo);
    }
  }
  return [...byName.values()].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  );
}

async function searchRepos(limit: number): Promise<GitHubRepo[]> {
  const perTopic = Math.ceil(limit / AI_TOPICS.length) + 2;
  const results = await Promise.all(
    AI_TOPICS.map((topic) => fetchTopicRepos(topic, perTopic)),
  );
  return deduplicateRepos(results.flat()).slice(0, limit);
}

function toRawArticle(repo: GitHubRepo): RawArticle {
  return {
    title: repo.full_name,
    url: repo.html_url,
    score: repo.stargazers_count,
    commentCount: repo.forks_count,
    author: repo.owner.login,
    publishedAt: new Date(repo.created_at),
    body: repo.description,
    sourceName: "GitHub Trending",
    sourceUrl: repo.html_url,
  };
}

export function createGitHubSource(): Source {
  return {
    name: "GitHub Trending",
    async fetch(limit) {
      const repos = await searchRepos(limit);
      return {
        sourceName: "GitHub Trending",
        articles: repos.map(toRawArticle),
        fetchedAt: new Date(),
        error: null,
      };
    },
  };
}
