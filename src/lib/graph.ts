import { FalkorDB, type Graph } from "falkordb";
import { EMBEDDING_DIM, GRAPH_NAME, RELATED_THRESHOLD } from "./constants";
import type { NewsItem } from "./types";

let db: FalkorDB | null = null;
let graph: Graph | null = null;
let migrated = false;

export function vecLiteral(embedding: number[]): string {
  return `vecf32([${embedding.join(",")}])`;
}

async function ensureIndexes(g: Graph): Promise<void> {
  if (migrated) return;

  const indexQueries = [
    "CREATE INDEX FOR (n:NewsItem) ON (n.id)",
    "CREATE INDEX FOR (n:NewsItem) ON (n.date)",
    "CREATE INDEX FOR (d:DailyIssue) ON (d.date)",
    `CREATE VECTOR INDEX FOR (n:NewsItem) ON (n.embedding) OPTIONS {dimension:${EMBEDDING_DIM}, similarityFunction:'cosine'}`,
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

  const useTls = process.env.FALKORDB_TLS === "true";

  return FalkorDB.connect({
    socket: {
      host,
      port: port ? Number.parseInt(port, 10) : 6379,
      connectTimeout: 10000,
      reconnectStrategy: false,
      ...(useTls ? { tls: true } : {}),
    },
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  }) as unknown as FalkorDB;
}

async function getGraph(): Promise<Graph | null> {
  if (graph) {
    try {
      await graph.roQuery("RETURN 1");
      return graph;
    } catch {
      db = null;
      graph = null;
      migrated = false;
    }
  }

  const connection = createConnection();
  if (!connection) return null;

  try {
    db = await (connection as unknown as Promise<FalkorDB>);
    graph = db.selectGraph(GRAPH_NAME);
    await ensureIndexes(graph);
    return graph;
  } catch (err) {
    console.error("[graph] Connection failed:", err);
    db = null;
    graph = null;
    return null;
  }
}

export async function connectGraphDirect(): Promise<{
  db: FalkorDB;
  graph: Graph;
}> {
  const host = process.env.FALKORDB_HOST ?? "localhost";
  const port = Number.parseInt(process.env.FALKORDB_PORT ?? "6379", 10);
  const username = process.env.FALKORDB_USERNAME;
  const password = process.env.FALKORDB_PASSWORD;
  const useTls = process.env.FALKORDB_TLS === "true";

  const connection = await FalkorDB.connect({
    socket: {
      host,
      port,
      connectTimeout: 10000,
      ...(useTls ? { tls: true } : {}),
    },
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  });

  const g = connection.selectGraph(GRAPH_NAME);

  const indexQueries = [
    "CREATE INDEX FOR (n:NewsItem) ON (n.id)",
    "CREATE INDEX FOR (n:NewsItem) ON (n.date)",
    "CREATE INDEX FOR (d:DailyIssue) ON (d.date)",
    `CREATE VECTOR INDEX FOR (n:NewsItem) ON (n.embedding) OPTIONS {dimension:${EMBEDDING_DIM}, similarityFunction:'cosine'}`,
  ];
  for (const query of indexQueries) {
    try {
      await g.query(query);
    } catch {
      // already exists
    }
  }

  return { db: connection, graph: g };
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toNewsItem(
  raw: Record<string, unknown>,
  relatedIds: string[],
): NewsItem {
  const filtered = relatedIds.filter(Boolean);
  return {
    id: raw.id,
    headline: raw.headline,
    summary: raw.summary,
    ...(raw.takeaway ? { takeaway: raw.takeaway } : {}),
    category: raw.category,
    ...(raw.source ? { source: raw.source } : {}),
    ...(raw.url ? { url: raw.url } : {}),
    ...(raw.date ? { date: raw.date } : {}),
    ...(filtered.length > 0 ? { relatedTo: filtered } : {}),
  } as NewsItem;
}

export async function persistNewsItems(
  items: NewsItem[],
  embeddings?: number[][],
  options?: { graph?: Graph; date?: string; vertical?: string },
): Promise<void> {
  const g = options?.graph ?? (await getGraph());
  if (!g) return;

  const date = options?.date ?? todayDate();
  const vertical = options?.vertical ?? "ai";

  await g.query(
    `
    MATCH (old:NewsItem {date: $date, vertical: $vertical})
    DETACH DELETE old
    `,
    { params: { date, vertical } },
  );

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
      n.date      = $date,
      n.vertical  = $vertical
    MERGE (n)-[:PUBLISHED_IN]->(issue)
    `,
    {
      params: {
        date,
        vertical,
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

  if (embeddings) {
    for (let i = 0; i < items.length; i++) {
      const emb = embeddings[i];
      if (!emb) continue;
      await g.query(
        `MATCH (n:NewsItem {id: $id}) SET n.embedding = ${vecLiteral(emb)}`,
        { params: { id: items[i].id } },
      );
    }
  }

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

export async function getRecentHeadlinesFromGraph(
  days = 7,
  verticalId?: string,
  graphOverride?: Graph,
): Promise<string[]> {
  const g = graphOverride ?? (await getGraph());
  if (!g) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const verticalFilter = verticalId ? " AND n.vertical = $vertical" : "";

  const result = await g.roQuery<{ headline: string }>(
    `
    MATCH (n:NewsItem)
    WHERE n.date >= $cutoffDate AND n.date < $today${verticalFilter}
    RETURN n.headline AS headline
    `,
    { params: { cutoffDate, today: todayDate(), vertical: verticalId ?? "" } },
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

  return (result.data ?? []).map((r) =>
    toNewsItem(r.item, r.relatedIds as string[]),
  );
}

export async function createRelations(
  items: NewsItem[],
  embeddings: number[][],
  graphOverride?: Graph,
): Promise<number> {
  const g = graphOverride ?? (await getGraph());
  if (!g) return 0;

  let edgesCreated = 0;

  for (let i = 0; i < items.length; i++) {
    const emb = embeddings[i];
    if (!emb) continue;

    const result = await g.roQuery<{
      id: string;
      vertical: string;
      score: number;
    }>(
      `CALL db.idx.vector.queryNodes('NewsItem', 'embedding', 20, ${vecLiteral(emb)}) YIELD node, score RETURN node.id AS id, node.vertical AS vertical, score`,
    );

    const itemVertical = items[i].vertical ?? "ai";
    const neighbors = (result.data ?? []).filter(
      (r) =>
        r.id !== items[i].id &&
        r.vertical === itemVertical &&
        r.score <= RELATED_THRESHOLD,
    );

    for (const neighbor of neighbors) {
      await g.query(
        `
        MATCH (a:NewsItem {id: $fromId})
        MATCH (b:NewsItem {id: $toId})
        MERGE (a)-[:RELATED_TO]->(b)
        MERGE (b)-[:RELATED_TO]->(a)
        `,
        { params: { fromId: items[i].id, toId: neighbor.id } },
      );
      edgesCreated++;
    }
  }

  return edgesCreated;
}

export async function searchItems(query: string, k = 20): Promise<NewsItem[]> {
  const g = await getGraph();
  if (!g) return [];

  const result = await g.roQuery<{
    id: string;
    headline: string;
    summary: string;
    takeaway: string | null;
    category: string;
    source: string | null;
    url: string | null;
    date: string | null;
  }>(
    `
    MATCH (n:NewsItem)
    WHERE toLower(n.headline) CONTAINS toLower($query)
       OR toLower(n.summary) CONTAINS toLower($query)
    RETURN n.id AS id, n.headline AS headline, n.summary AS summary,
           n.takeaway AS takeaway, n.category AS category,
           n.source AS source, n.url AS url, n.date AS date
    ORDER BY n.date DESC
    LIMIT ${k}
    `,
    { params: { query } },
  );

  const items = (result.data ?? []).map(
    (r) =>
      ({
        id: r.id,
        headline: r.headline,
        summary: r.summary,
        ...(r.takeaway ? { takeaway: r.takeaway } : {}),
        category: r.category,
        ...(r.source ? { source: r.source } : {}),
        ...(r.url ? { url: r.url } : {}),
        ...(r.date ? { date: r.date } : {}),
      }) as NewsItem,
  );

  if (items.length < 2) return items;

  const ids = items.map((item) => item.id);
  const edgeResult = await g.roQuery<{ fromId: string; toId: string }>(
    `
    UNWIND $ids AS sourceId
    MATCH (a:NewsItem {id: sourceId})-[:RELATED_TO]->(b:NewsItem)
    WHERE b.id IN $ids
    RETURN a.id AS fromId, b.id AS toId
    `,
    { params: { ids } },
  );

  const itemMap = new Map(items.map((item) => [item.id, item]));
  for (const edge of edgeResult.data ?? []) {
    const from = itemMap.get(edge.fromId);
    if (!from) continue;
    if (!from.relatedTo) from.relatedTo = [];
    if (!from.relatedTo.includes(edge.toId)) from.relatedTo.push(edge.toId);
  }

  return items;
}

export async function getItemsByDate(
  date: string,
  verticalId?: string,
): Promise<NewsItem[]> {
  const g = await getGraph();
  if (!g) return [];

  const verticalFilter = verticalId ? " AND n.vertical = $vertical" : "";

  const result = await g.roQuery<{
    item: Record<string, unknown>;
    relatedIds: string[];
  }>(
    `
    MATCH (n:NewsItem)
    WHERE n.date = $date${verticalFilter}
    OPTIONAL MATCH (n)-[:RELATED_TO]->(related:NewsItem)
    RETURN n {
      .id, .headline, .summary, .takeaway,
      .category, .source, .url
    } AS item,
    collect(DISTINCT related.id) AS relatedIds
    `,
    { params: { date, vertical: verticalId ?? "" } },
  );

  return (result.data ?? []).map((r) =>
    toNewsItem(r.item, r.relatedIds as string[]),
  );
}
