import { createHackerNewsSource } from "./hackernews";
import { createRedditSource } from "./reddit";
import type { RawArticle, Source, SourceResult } from "./types";

const DEFAULT_SOURCES: Source[] = [
  createHackerNewsSource(),
  createRedditSource(),
];

export async function fetchAllSources(
  sources: Source[] = DEFAULT_SOURCES,
  limitPerSource = 30,
): Promise<SourceResult[]> {
  const results = await Promise.allSettled(
    sources.map((source) => source.fetch(limitPerSource)),
  );

  return results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;

    return {
      sourceName: sources[i].name,
      articles: [],
      fetchedAt: new Date(),
      error:
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown error",
    };
  });
}

export function collectArticles(results: SourceResult[]): RawArticle[] {
  return results.flatMap((result) => result.articles);
}
