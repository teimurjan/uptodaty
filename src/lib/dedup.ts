import { computeEmbeddings, findDuplicateGroups } from "./embeddings";
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

function deduplicateByUrl(articles: RawArticle[]): RawArticle[] {
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

export async function deduplicateArticles(
  articles: RawArticle[],
): Promise<RawArticle[]> {
  const urlDeduped = deduplicateByUrl(articles);

  if (urlDeduped.length <= 1) return urlDeduped;

  const texts = urlDeduped.map(
    (a) => `${a.title} ${a.body?.slice(0, 200) ?? ""}`,
  );
  const embeddings = await computeEmbeddings(texts);
  const mergedInto = findDuplicateGroups(embeddings);

  return urlDeduped.filter((article, index) => {
    const canonicalIndex = mergedInto.get(index);
    if (canonicalIndex === undefined) return true;
    const canonical = urlDeduped[canonicalIndex];
    return article.score > canonical.score;
  });
}

export function formatPastHeadlines(headlines: string[]): string {
  if (headlines.length === 0) return "";
  return headlines.map((h) => `- ${h}`).join("\n");
}
