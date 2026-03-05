import { clearCache } from "../src/lib/cache";
import { VERTICAL_IDS } from "../src/lib/verticals";

async function main() {
  for (const verticalId of VERTICAL_IDS) {
    await clearCache(verticalId);
    console.log(`Cleared cache for ${verticalId}`);
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error("Clear cache failed:", error);
  process.exit(1);
});
