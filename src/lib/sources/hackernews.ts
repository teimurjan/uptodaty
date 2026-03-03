import type { RawArticle, Source } from "./types";

const BASE_URL = "https://hacker-news.firebaseio.com/v0";

interface HNItem {
  id: number;
  type: string;
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  by?: string;
  time?: number;
  descendants?: number;
}

async function fetchStoryIds(): Promise<number[]> {
  const response = await fetch(`${BASE_URL}/topstories.json`);
  if (!response.ok) throw new Error(`HN topstories: ${response.status}`);
  return response.json();
}

async function fetchItem(id: number): Promise<HNItem> {
  const response = await fetch(`${BASE_URL}/item/${id}.json`);
  if (!response.ok) throw new Error(`HN item ${id}: ${response.status}`);
  return response.json();
}

async function fetchItemsBatched(
  ids: number[],
  concurrency = 10,
): Promise<HNItem[]> {
  const items: HNItem[] = [];

  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    const results = await Promise.allSettled(chunk.map(fetchItem));

    for (const result of results) {
      if (result.status === "fulfilled") {
        items.push(result.value);
      }
    }
  }

  return items;
}

function toRawArticle(item: HNItem): RawArticle {
  return {
    title: item.title ?? "",
    url: item.url ?? null,
    score: item.score ?? 0,
    commentCount: item.descendants ?? 0,
    author: item.by ?? "unknown",
    publishedAt: new Date((item.time ?? 0) * 1000),
    body: item.text ?? null,
    sourceName: "HackerNews",
    sourceUrl: `https://news.ycombinator.com/item?id=${item.id}`,
  };
}

export function createHackerNewsSource(): Source {
  return {
    name: "HackerNews",
    async fetch(limit) {
      const ids = await fetchStoryIds();
      const items = await fetchItemsBatched(ids.slice(0, limit));
      const articles = items
        .filter((item) => item.type === "story")
        .map(toRawArticle);

      return {
        sourceName: "HackerNews",
        articles,
        fetchedAt: new Date(),
        error: null,
      };
    },
  };
}
