import { generateText } from "ai";
import { getRecentHeadlines, setCachedNews } from "./cache";
import { deduplicateArticles } from "./dedup";
import { computeEmbeddings, detectRelations } from "./embeddings";
import { createCrossDayRelations, persistNewsItems } from "./graph";
import { resolveModel } from "./model";
import { parseNewsJson } from "./parse-news";
import { buildNewsPrompt } from "./prompt";
import { formatSourceDigest } from "./sources/format";
import { collectArticles, fetchAllSources } from "./sources/registry";
import type { NewsItem } from "./types";

function linkRelatedItems(items: NewsItem[], pairs: Array<[number, number]>) {
  for (const [i, j] of pairs) {
    const a = items[i];
    const b = items[j];
    if (!a.relatedTo) a.relatedTo = [];
    if (!b.relatedTo) b.relatedTo = [];
    if (!a.relatedTo.includes(b.id)) a.relatedTo.push(b.id);
    if (!b.relatedTo.includes(a.id)) b.relatedTo.push(a.id);
  }
}

export async function runNewsPipeline(): Promise<NewsItem[]> {
  const [results, pastHeadlines] = await Promise.all([
    fetchAllSources(),
    getRecentHeadlines(7),
  ]);

  const allArticles = collectArticles(results);

  if (allArticles.length === 0) {
    const errors = results
      .filter((r) => r.error)
      .map((r) => `${r.sourceName}: ${r.error}`)
      .join("; ");
    throw new Error(`All sources returned empty. ${errors}`);
  }

  const dedupedArticles = await deduplicateArticles(allArticles);

  const dedupedBySource = results.map((result) => ({
    ...result,
    articles: result.articles.filter((a) => dedupedArticles.includes(a)),
  }));

  const digest = formatSourceDigest(dedupedBySource);
  const model = resolveModel();

  const { text } = await generateText({
    model,
    prompt: buildNewsPrompt(digest, pastHeadlines),
  });

  const items = parseNewsJson(text);

  const texts = items.map((item) => `${item.headline} ${item.summary}`);
  const embeddings = await computeEmbeddings(texts);
  const relatedPairs = detectRelations(embeddings);
  linkRelatedItems(items, relatedPairs);

  await persistNewsItems(items, embeddings);
  const crossDayEdges = await createCrossDayRelations(items, embeddings);
  if (crossDayEdges > 0) {
    console.log(`[pipeline] Created ${crossDayEdges} cross-day relations`);
  }

  await setCachedNews(items);

  return items;
}
