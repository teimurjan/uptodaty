import { generateText } from "ai";
import { getRecentHeadlines, setCachedNews } from "./cache";
import { categorizeArticles } from "./categorize";
import { deduplicateArticles } from "./dedup";
import { computeEmbeddings } from "./embeddings";
import { createRelations, persistNewsItems } from "./graph";
import { resolveModel } from "./model";
import { parseNewsJson } from "./parse-news";
import { buildNewsPrompt } from "./prompt";
import { formatArticlesDigest } from "./sources/format";
import { fetchAllSourcesGlobal } from "./sources/registry";
import type { NewsItem } from "./types";
import { getVertical, type VerticalId } from "./verticals";

export async function runNewsPipeline(
  verticalId: VerticalId = "ai",
): Promise<NewsItem[]> {
  const vertical = getVertical(verticalId);

  const [{ results, articles: allArticles }, pastHeadlines] = await Promise.all(
    [fetchAllSourcesGlobal(verticalId), getRecentHeadlines(verticalId, 7)],
  );

  if (allArticles.length === 0) {
    const errors = results
      .filter((r) => r.error)
      .map((r) => `${r.sourceName}: ${r.error}`)
      .join("; ");
    throw new Error(`All sources returned empty. ${errors}`);
  }

  const dedupedArticles = await deduplicateArticles(allArticles);

  const verticalArticles = await categorizeArticles(
    dedupedArticles,
    verticalId,
  );

  if (verticalArticles.length === 0) {
    throw new Error(
      `No articles matched vertical "${verticalId}" after categorization`,
    );
  }

  const digest = formatArticlesDigest(verticalArticles);
  const model = resolveModel();

  const { text } = await generateText({
    model,
    prompt: buildNewsPrompt(digest, vertical.prompt, pastHeadlines),
  });

  const items = parseNewsJson(text);

  for (const item of items) {
    item.vertical = verticalId;
  }

  const texts = items.map((item) => `${item.headline} ${item.summary}`);
  const embeddings = await computeEmbeddings(texts);

  await persistNewsItems(items, embeddings, { vertical: verticalId });
  await createRelations(items, embeddings);
  await setCachedNews(items, verticalId);

  return items;
}
