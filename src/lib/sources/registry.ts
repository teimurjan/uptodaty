import { VERTICALS, type VerticalId } from "@/lib/verticals";
import { createGitHubSource } from "./github";
import { createHackerNewsSource } from "./hackernews";
import { createRedditSource } from "./reddit";
import type { RawArticle, SourceResult } from "./types";

export async function fetchAllSourcesGlobal(
  verticalId: VerticalId,
  hnLimit = 10,
): Promise<{ results: SourceResult[]; articles: RawArticle[] }> {
  const vertical = VERTICALS[verticalId];

  const hnSource = createHackerNewsSource();
  const redditSource = createRedditSource(vertical.sources.reddit.subreddits);
  const githubSource = createGitHubSource(vertical.sources.github.topics);

  const settled = await Promise.allSettled([
    hnSource.fetch(hnLimit),
    redditSource.fetch(30),
    githubSource.fetch(30),
  ]);

  const results: SourceResult[] = settled.map((result, i) => {
    const sourceName = [hnSource, redditSource, githubSource][i].name;

    if (result.status === "fulfilled") return result.value;

    return {
      sourceName,
      articles: [],
      fetchedAt: new Date(),
      error:
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown error",
    };
  });

  const articles: RawArticle[] = [];

  for (const result of results) {
    for (const article of result.articles) {
      if (article.sourceName !== "HackerNews") {
        article.vertical = verticalId;
      }
      articles.push(article);
    }
  }

  return { results, articles };
}
