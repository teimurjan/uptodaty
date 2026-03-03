import type { RawArticle, SourceResult } from "./types";

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

export function formatSourceDigest(results: SourceResult[]): string {
  const sections: string[] = [];

  for (const result of results) {
    if (result.error && result.articles.length === 0) {
      sections.push(`## ${result.sourceName}\n[Error: ${result.error}]`);
      continue;
    }

    const sorted = [...result.articles].sort((a, b) => b.score - a.score);
    const formatted = sorted.map((article, i) => formatArticle(article, i + 1));

    let header = `## ${result.sourceName} (${sorted.length} articles)`;
    if (result.error) {
      header += ` [partial — ${result.error}]`;
    }

    sections.push(`${header}\n${formatted.join("\n\n")}`);
  }

  return sections.join("\n\n---\n\n");
}
