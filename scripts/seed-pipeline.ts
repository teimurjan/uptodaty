import { generateText } from "ai";
import type { Graph } from "falkordb";
import { deduplicateArticles } from "../src/lib/dedup";
import { computeEmbeddings, detectRelations } from "../src/lib/embeddings";
import {
  connectGraphDirect,
  createCrossDayRelations,
  getRecentHeadlinesFromGraph,
  persistNewsItems,
} from "../src/lib/graph";
import { resolveModel } from "../src/lib/model";
import { parseNewsJson } from "../src/lib/parse-news";
import { buildNewsPrompt } from "../src/lib/prompt";
import { formatSourceDigest } from "../src/lib/sources/format";
import { collectArticles, fetchAllSources } from "../src/lib/sources/registry";
import type { NewsItem } from "../src/lib/types";

const DAYS = 3;

function formatDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function runDay(graph: Graph, dayNumber: number, date: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Day ${dayNumber} — ${date}`);
  console.log("=".repeat(60));

  console.log("Fetching sources...");
  const results = await fetchAllSources();

  for (const r of results) {
    const status = r.error
      ? `ERROR: ${r.error}`
      : `${r.articles.length} articles`;
    console.log(`  ${r.sourceName}: ${status}`);
  }

  const allArticles = collectArticles(results);
  console.log(`Total raw articles: ${allArticles.length}`);

  if (allArticles.length === 0) {
    console.log("No articles fetched — skipping LLM");
    return [];
  }

  const dedupedArticles = await deduplicateArticles(allArticles);
  console.log(`After dedup: ${dedupedArticles.length}`);

  const dedupedBySource = results.map((result) => ({
    ...result,
    articles: result.articles.filter((a) => dedupedArticles.includes(a)),
  }));

  const digest = formatSourceDigest(dedupedBySource);

  const pastHeadlines = await getRecentHeadlinesFromGraph(365, graph);
  console.log(`Past headlines for dedup: ${pastHeadlines.length}`);

  const model = resolveModel();
  console.log("Calling LLM...");

  const { text } = await generateText({
    model,
    prompt: buildNewsPrompt(digest, pastHeadlines),
  });

  const items = parseNewsJson(text);
  console.log(`LLM returned ${items.length} items`);

  console.log("Detecting relations via embeddings...");
  const itemTexts = items.map((item) => `${item.headline} ${item.summary}`);
  const itemEmbeddings = await computeEmbeddings(itemTexts);
  const relatedPairs = detectRelations(itemEmbeddings);
  for (const [i, j] of relatedPairs) {
    if (!items[i].relatedTo) items[i].relatedTo = [];
    if (!items[j].relatedTo) items[j].relatedTo = [];
    if (!items[i].relatedTo.includes(items[j].id))
      items[i].relatedTo.push(items[j].id);
    if (!items[j].relatedTo.includes(items[i].id))
      items[j].relatedTo.push(items[i].id);
  }

  const categories = new Map<string, number>();
  for (const item of items) {
    categories.set(item.category, (categories.get(item.category) ?? 0) + 1);
  }
  console.log(
    `Categories: ${[...categories.entries()].map(([k, v]) => `${k}(${v})`).join(", ")}`,
  );

  const withRelations = items.filter((i) => i.relatedTo?.length);
  console.log(`Items with relatedTo: ${withRelations.length}/${items.length}`);

  console.log("Persisting to graph with embeddings...");
  await persistNewsItems(items, itemEmbeddings, { graph, date });
  console.log(`Persisted ${items.length} items for ${date}`);

  console.log("Creating cross-day relations...");
  const crossDayEdges = await createCrossDayRelations(
    items,
    itemEmbeddings,
    graph,
  );
  console.log(`Cross-day relations created: ${crossDayEdges}`);

  return items;
}

async function main() {
  console.log("Connecting to FalkorDB...");
  const { db, graph } = await connectGraphDirect();
  console.log("Connected");

  console.log("Clearing existing data...");
  try {
    await graph.query("MATCH (n) DETACH DELETE n");
  } catch {
    // graph may not exist yet
  }

  const allItems: NewsItem[][] = [];

  for (let day = DAYS; day >= 1; day--) {
    const date = formatDate(day - 1);
    const items = await runDay(graph, DAYS - day + 1, date);
    allItems.push(items);

    if (day > 1) {
      console.log("\nWaiting 2s before next day...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const totalItems = allItems.reduce((sum, items) => sum + items.length, 0);
  const totalRelations = allItems
    .flat()
    .reduce((sum, item) => sum + (item.relatedTo?.length ?? 0), 0);

  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Days seeded: ${DAYS}`);
  console.log(`Total items: ${totalItems}`);
  console.log(`Total relations: ${totalRelations}`);

  const verifyResult = await graph.roQuery<{
    items: number;
    relations: number;
  }>(
    `
    MATCH (n:NewsItem)
    OPTIONAL MATCH (n)-[r:RELATED_TO]->()
    WITH count(DISTINCT n) AS items, count(r) AS relations
    RETURN items, relations
    `,
  );
  const stats = verifyResult.data?.[0];
  if (stats) {
    console.log(
      `Graph verify — nodes: ${stats.items}, edges: ${stats.relations}`,
    );
  }

  db.close();
  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Pipeline seed failed:", error);
  process.exit(1);
});
