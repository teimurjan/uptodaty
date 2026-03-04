import { RELATED_THRESHOLD } from "../src/lib/constants";
import { computeEmbeddings } from "../src/lib/embeddings";
import { connectGraphDirect, vecLiteral } from "../src/lib/graph";

const BATCH_SIZE = 20;

async function main() {
  console.log("Connecting to FalkorDB...");
  const { db, graph } = await connectGraphDirect();
  console.log("Connected");

  console.log("Dropping existing RELATED_TO edges...");
  const dropResult = await graph.query<{ deleted: number }>(
    "MATCH ()-[r:RELATED_TO]->() DELETE r RETURN count(r) AS deleted",
  );
  const deleted = dropResult.data?.[0]?.deleted ?? 0;
  console.log(`Dropped ${deleted} edges`);

  const countResult = await graph.roQuery<{ total: number; missing: number }>(
    `
    MATCH (n:NewsItem)
    WITH count(n) AS total
    OPTIONAL MATCH (m:NewsItem) WHERE m.embedding IS NULL
    RETURN total, count(m) AS missing
    `,
  );

  const stats = countResult.data?.[0];
  if (!stats) {
    console.log("No NewsItem nodes found");
    db.close();
    return;
  }

  console.log(
    `Total nodes: ${stats.total}, missing embeddings: ${stats.missing}`,
  );

  if (stats.missing > 0) {
    const nodesResult = await graph.roQuery<{
      id: string;
      headline: string;
      summary: string;
    }>(
      `
      MATCH (n:NewsItem) WHERE n.embedding IS NULL
      RETURN n.id AS id, n.headline AS headline, n.summary AS summary
      `,
    );

    const nodes = nodesResult.data ?? [];
    console.log(
      `Processing ${nodes.length} nodes in batches of ${BATCH_SIZE}...`,
    );

    for (let offset = 0; offset < nodes.length; offset += BATCH_SIZE) {
      const batch = nodes.slice(offset, offset + BATCH_SIZE);
      const texts = batch.map((n) => `${n.headline} ${n.summary ?? ""}`);
      const embeddings = await computeEmbeddings(texts);

      for (let i = 0; i < batch.length; i++) {
        const emb = embeddings[i];
        if (!emb) continue;
        await graph.query(
          `MATCH (n:NewsItem {id: $id}) SET n.embedding = ${vecLiteral(emb)}`,
          { params: { id: batch[i].id } },
        );
      }

      console.log(
        `  Batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(nodes.length / BATCH_SIZE)}: ${batch.length} nodes embedded`,
      );
    }
  } else {
    console.log("All nodes already have embeddings");
  }

  console.log("\nCreating cross-day relations...");
  let edgesCreated = 0;

  const allNodes = await graph.roQuery<{ id: string }>(
    "MATCH (n:NewsItem) RETURN n.id AS id",
  );
  const allIds = (allNodes.data ?? []).map((n) => n.id);

  for (let offset = 0; offset < allIds.length; offset += BATCH_SIZE) {
    const batchIds = allIds.slice(offset, offset + BATCH_SIZE);

    for (const nodeId of batchIds) {
      const embResult = await graph.roQuery<{ emb: number[] }>(
        "MATCH (n:NewsItem {id: $id}) RETURN n.embedding AS emb",
        { params: { id: nodeId } },
      );

      const emb = embResult.data?.[0]?.emb;
      if (!emb) continue;

      const similarResult = await graph.roQuery<{
        id: string;
        score: number;
      }>(
        `CALL db.idx.vector.queryNodes('NewsItem', 'embedding', 10, ${vecLiteral(emb)}) YIELD node, score RETURN node.id AS id, score`,
      );

      const neighbors = (similarResult.data ?? []).filter(
        (r) => r.id !== nodeId && r.score >= RELATED_THRESHOLD,
      );

      for (const neighbor of neighbors) {
        await graph.query(
          `
          MATCH (a:NewsItem {id: $fromId})
          MATCH (b:NewsItem {id: $toId})
          MERGE (a)-[:RELATED_TO]->(b)
          MERGE (b)-[:RELATED_TO]->(a)
          `,
          { params: { fromId: nodeId, toId: neighbor.id } },
        );
        edgesCreated++;
      }
    }

    console.log(
      `  Processed ${Math.min(offset + BATCH_SIZE, allIds.length)}/${allIds.length} nodes`,
    );
  }

  console.log(`\nCreated ${edgesCreated} cross-day relation edges`);

  const verifyResult = await graph.roQuery<{
    withEmb: number;
    relations: number;
  }>(
    `
    MATCH (n:NewsItem) WHERE n.embedding IS NOT NULL
    WITH count(n) AS withEmb
    OPTIONAL MATCH ()-[r:RELATED_TO]->()
    RETURN withEmb, count(r) AS relations
    `,
  );

  const verify = verifyResult.data?.[0];
  if (verify) {
    console.log(
      `Verification — nodes with embeddings: ${verify.withEmb}, total RELATED_TO edges: ${verify.relations}`,
    );
  }

  db.close();
  console.log("Done.");
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
