import type { RawArticle } from "./types";

function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals = [
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ] as const;

  for (const { label, seconds: intervalSeconds } of intervals) {
    const count = Math.floor(seconds / intervalSeconds);
    if (count >= 1) return `${count}${label} ago`;
  }

  return "just now";
}

function formatArticle(article: RawArticle, index: number): string {
  const parts = [
    `${index}. ${article.title}`,
    `   Source: ${article.sourceName} | Score: ${article.score} | Comments: ${article.commentCount} | ${timeSince(article.publishedAt)}`,
  ];

  if (article.url) {
    parts.push(`   URL: ${article.url}`);
  }

  if (article.body) {
    const snippet = article.body.slice(0, 300).replace(/\n/g, " ");
    parts.push(`   Body: ${snippet}${article.body.length > 300 ? "..." : ""}`);
  }

  return parts.join("\n");
}

export function formatArticlesDigest(articles: RawArticle[]): string {
  const bySource = new Map<string, RawArticle[]>();
  for (const article of articles) {
    const existing = bySource.get(article.sourceName) ?? [];
    existing.push(article);
    bySource.set(article.sourceName, existing);
  }

  const sections: string[] = [];
  for (const [sourceName, sourceArticles] of bySource) {
    const sorted = [...sourceArticles].sort((a, b) => b.score - a.score);
    const formatted = sorted.map((article, i) => formatArticle(article, i + 1));
    sections.push(
      `## ${sourceName} (${sorted.length} articles)\n${formatted.join("\n\n")}`,
    );
  }

  return sections.join("\n\n---\n\n");
}
