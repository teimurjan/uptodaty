import { generateText } from "ai";
import type { Graph } from "falkordb";
import { categorizeArticles } from "../src/lib/categorize";
import { deduplicateArticles } from "../src/lib/dedup";
import { computeEmbeddings } from "../src/lib/embeddings";
import {
  connectGraphDirect,
  createRelations,
  getRecentHeadlinesFromGraph,
  persistNewsItems,
} from "../src/lib/graph";
import { resolveModel } from "../src/lib/model";
import { parseNewsJson } from "../src/lib/parse-news";
import { buildNewsPrompt } from "../src/lib/prompt";
import { formatArticlesDigest } from "../src/lib/sources/format";
import { fetchAllSourcesGlobal } from "../src/lib/sources/registry";
import type { NewsItem } from "../src/lib/types";
import { VERTICAL_IDS, VERTICALS, type VerticalId } from "../src/lib/verticals";

const DAYS = 3;

function formatDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function runVerticalDay(
  graph: Graph,
  verticalId: VerticalId,
  date: string,
): Promise<NewsItem[]> {
  const vertical = VERTICALS[verticalId];

  console.log(`\n  [${vertical.label}]`);
  console.log("  Fetching sources...");

  const { results, articles: allArticles } =
    await fetchAllSourcesGlobal(verticalId);

  for (const r of results) {
    const status = r.error
      ? `ERROR: ${r.error}`
      : `${r.articles.length} articles`;
    console.log(`    ${r.sourceName}: ${status}`);
  }

  if (allArticles.length === 0) {
    console.log("  No articles fetched — skipping LLM");
    return [];
  }

  const dedupedArticles = await deduplicateArticles(allArticles);
  console.log(`  After dedup: ${dedupedArticles.length}`);

  const verticalArticles = await categorizeArticles(
    dedupedArticles,
    verticalId,
  );
  console.log(
    `  After categorization: ${verticalArticles.length} for ${verticalId}`,
  );

  if (verticalArticles.length === 0) {
    console.log("  No articles matched this vertical — skipping LLM");
    return [];
  }

  const digest = formatArticlesDigest(verticalArticles);

  const pastHeadlines = await getRecentHeadlinesFromGraph(
    365,
    verticalId,
    graph,
  );
  console.log(`  Past headlines for dedup: ${pastHeadlines.length}`);

  const model = resolveModel();
  console.log("  Calling LLM...");

  const { text } = await generateText({
    model,
    prompt: buildNewsPrompt(digest, vertical.prompt, pastHeadlines),
  });

  const items = parseNewsJson(text);
  for (const item of items) {
    item.vertical = verticalId;
  }
  console.log(`  LLM returned ${items.length} items`);

  const itemTexts = items.map((item) => `${item.headline} ${item.summary}`);
  const itemEmbeddings = await computeEmbeddings(itemTexts);

  console.log("  Persisting to graph...");
  await persistNewsItems(items, itemEmbeddings, {
    graph,
    date,
    vertical: verticalId,
  });

  console.log("  Creating cross-day relations...");
  const crossDayEdges = await createRelations(items, itemEmbeddings, graph);
  console.log(`  Cross-day relations: ${crossDayEdges}`);

  return items;
}

async function runDay(graph: Graph, dayNumber: number, date: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Day ${dayNumber} — ${date}`);
  console.log("=".repeat(60));

  const dayItems: NewsItem[] = [];

  for (const verticalId of VERTICAL_IDS) {
    const items = await runVerticalDay(graph, verticalId, date);
    dayItems.push(...items);

    if (verticalId !== VERTICAL_IDS[VERTICAL_IDS.length - 1]) {
      console.log("\n  Waiting 2s before next vertical...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return dayItems;
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

  const allItems: NewsItem[] = [];

  for (let day = DAYS; day >= 1; day--) {
    const date = formatDate(day - 1);
    const items = await runDay(graph, DAYS - day + 1, date);
    allItems.push(...items);

    if (day > 1) {
      console.log("\nWaiting 2s before next day...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Days seeded: ${DAYS}`);
  console.log(`Verticals: ${VERTICAL_IDS.join(", ")}`);
  console.log(`Total items: ${allItems.length}`);

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
