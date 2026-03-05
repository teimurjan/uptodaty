import { connectGraphDirect } from "../src/lib/graph";

async function main() {
  console.log("Connecting to FalkorDB...");
  const { db, graph } = await connectGraphDirect();
  console.log("Connected");

  console.log("Clearing graph data...");
  try {
    await graph.query("MATCH (n) DETACH DELETE n");
    console.log("Graph cleared.");
  } catch {
    console.log("Graph was already empty.");
  }

  db.close();
  console.log("Done.");
}

main().catch((error) => {
  console.error("Clear failed:", error);
  process.exit(1);
});
