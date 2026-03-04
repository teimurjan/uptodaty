import { FalkorDB, type Graph } from "falkordb";
import type { NewsItem } from "./types";

const GRAPH_NAME = "uptodaty";

let db: FalkorDB | null = null;
let graph: Graph | null = null;
let migrated = false;

async function ensureIndexes(g: Graph): Promise<void> {
  if (migrated) return;

  const indexQueries = [
    "CREATE INDEX FOR (n:NewsItem) ON (n.id)",
    "CREATE INDEX FOR (n:NewsItem) ON (n.date)",
    "CREATE INDEX FOR (d:DailyIssue) ON (d.date)",
  ];

  for (const query of indexQueries) {
    try {
      await g.query(query);
    } catch {
      // index already exists
    }
  }

  migrated = true;
}

function createConnection(): FalkorDB | null {
  const host = process.env.FALKORDB_HOST;
  const port = process.env.FALKORDB_PORT;
  const username = process.env.FALKORDB_USERNAME;
  const password = process.env.FALKORDB_PASSWORD;

  if (!host) return null;

  return FalkorDB.connect({
    socket: {
      host,
      port: port ? Number.parseInt(port, 10) : 6379,
    },
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  }) as unknown as FalkorDB;
}

async function getGraph(): Promise<Graph | null> {
  if (graph) return graph;

  const connection = createConnection();
  if (!connection) return null;

  db = await (connection as unknown as Promise<FalkorDB>);
  graph = db.selectGraph(GRAPH_NAME);
  await ensureIndexes(graph);
  return graph;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function persistNewsItems(items: NewsItem[]): Promise<void> {
  const g = await getGraph();
  if (!g) return;

  const date = todayDate();

  await g.query(
    `
    MERGE (issue:DailyIssue {date: $date})
    ON CREATE SET issue.createdAt = localdatetime()
    WITH issue
    UNWIND $items AS item
    MERGE (n:NewsItem {id: item.id})
    ON CREATE SET
      n.headline  = item.headline,
      n.summary   = item.summary,
      n.takeaway  = item.takeaway,
      n.category  = item.category,
      n.source    = item.source,
      n.url       = item.url,
      n.date      = $date
    MERGE (n)-[:PUBLISHED_IN]->(issue)
    `,
    {
      params: {
        date,
        items: items.map((item) => ({
          id: item.id,
          headline: item.headline,
          summary: item.summary,
          takeaway: item.takeaway ?? null,
          category: item.category,
          source: item.source ?? null,
          url: item.url ?? null,
        })),
      },
    },
  );

  const pairs: Array<{ fromId: string; toId: string }> = [];
  for (const item of items) {
    if (item.relatedTo) {
      for (const targetId of item.relatedTo) {
        pairs.push({ fromId: item.id, toId: targetId });
      }
    }
  }

  if (pairs.length > 0) {
    await g.query(
      `
      UNWIND $pairs AS pair
      MATCH (a:NewsItem {id: pair.fromId})
      MATCH (b:NewsItem {id: pair.toId})
      MERGE (a)-[:RELATED_TO]->(b)
      `,
      { params: { pairs } },
    );
  }
}

export async function getRecentHeadlinesFromGraph(days = 7): Promise<string[]> {
  const g = await getGraph();
  if (!g) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const result = await g.roQuery<{ headline: string }>(
    `
    MATCH (n:NewsItem)
    WHERE n.date >= $cutoffDate AND n.date < $today
    RETURN n.headline AS headline
    `,
    { params: { cutoffDate, today: todayDate() } },
  );

  return (result.data ?? []).map((r) => r.headline);
}

export async function getRelatedGraph(
  itemId: string,
  depth = 2,
): Promise<NewsItem[]> {
  const g = await getGraph();
  if (!g) return [];

  const result = await g.roQuery<{
    item: Record<string, unknown>;
    relatedIds: string[];
  }>(
    `
    MATCH (start:NewsItem {id: $itemId})
    MATCH path = (start)-[:RELATED_TO*1..${Math.min(depth, 4)}]-(connected:NewsItem)
    WITH DISTINCT connected
    OPTIONAL MATCH (connected)-[:RELATED_TO]->(rel:NewsItem)
    RETURN connected {
      .id, .headline, .summary, .takeaway,
      .category, .source, .url, .date
    } AS item,
    collect(DISTINCT rel.id) AS relatedIds
    `,
    { params: { itemId } },
  );

  return (result.data ?? []).map((r) => {
    const raw = r.item;
    const relatedIds = (r.relatedIds as string[]).filter(Boolean);
    return {
      id: raw.id,
      headline: raw.headline,
      summary: raw.summary,
      ...(raw.takeaway ? { takeaway: raw.takeaway } : {}),
      category: raw.category,
      ...(raw.source ? { source: raw.source } : {}),
      ...(raw.url ? { url: raw.url } : {}),
      ...(raw.date ? { date: raw.date } : {}),
      ...(relatedIds.length > 0 ? { relatedTo: relatedIds } : {}),
    } as NewsItem;
  });
}

export async function getItemsByDate(date: string): Promise<NewsItem[]> {
  const g = await getGraph();
  if (!g) return [];

  const result = await g.roQuery<{
    item: Record<string, unknown>;
    relatedIds: string[];
  }>(
    `
    MATCH (n:NewsItem {date: $date})
    OPTIONAL MATCH (n)-[:RELATED_TO]->(related:NewsItem)
    RETURN n {
      .id, .headline, .summary, .takeaway,
      .category, .source, .url
    } AS item,
    collect(DISTINCT related.id) AS relatedIds
    `,
    { params: { date } },
  );

  return (result.data ?? []).map((r) => {
    const raw = r.item;
    const relatedIds = (r.relatedIds as string[]).filter(Boolean);
    return {
      id: raw.id,
      headline: raw.headline,
      summary: raw.summary,
      ...(raw.takeaway ? { takeaway: raw.takeaway } : {}),
      category: raw.category,
      ...(raw.source ? { source: raw.source } : {}),
      ...(raw.url ? { url: raw.url } : {}),
      ...(relatedIds.length > 0 ? { relatedTo: relatedIds } : {}),
    } as NewsItem;
  });
}
