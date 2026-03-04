import type { RawArticle } from "./sources/types";

function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = "";
    for (const param of [...url.searchParams.keys()]) {
      if (param.startsWith("utm_")) url.searchParams.delete(param);
    }
    return url.href.replace(/\/+$/, "");
  } catch {
    return raw;
  }
}

export function deduplicateArticles(articles: RawArticle[]): RawArticle[] {
  const byUrl = new Map<string, RawArticle>();
  const byTitle = new Map<string, RawArticle>();
  const result: RawArticle[] = [];

  for (const article of articles) {
    if (article.url) {
      const key = normalizeUrl(article.url);
      const existing = byUrl.get(key);
      if (existing) {
        if (article.score > existing.score) {
          byUrl.set(key, article);
          const idx = result.indexOf(existing);
          if (idx !== -1) result[idx] = article;
        }
        continue;
      }
      byUrl.set(key, article);
    } else {
      const key = article.title.toLowerCase().trim();
      if (byTitle.has(key)) continue;
      byTitle.set(key, article);
    }

    result.push(article);
  }

  return result;
}

export function formatPastHeadlines(headlines: string[]): string {
  if (headlines.length === 0) return "";
  return headlines.map((h) => `- ${h}`).join("\n");
}
