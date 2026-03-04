import { cosineSimilarity, embedMany } from "ai";
import { DEDUP_THRESHOLD, RELATED_THRESHOLD } from "./constants";
import { resolveEmbeddingModel } from "./model";

export async function computeEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const { embeddings } = await embedMany({
    model: resolveEmbeddingModel(),
    values: texts,
  });

  return embeddings;
}

export function findDuplicateGroups(
  embeddings: number[][],
): Map<number, number> {
  const mergedInto = new Map<number, number>();

  for (let i = 0; i < embeddings.length; i++) {
    if (mergedInto.has(i)) continue;
    for (let j = i + 1; j < embeddings.length; j++) {
      if (mergedInto.has(j)) continue;
      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
      if (similarity >= DEDUP_THRESHOLD) {
        mergedInto.set(j, i);
      }
    }
  }

  return mergedInto;
}

export function detectRelations(
  embeddings: number[][],
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];

  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
      if (similarity >= RELATED_THRESHOLD) {
        pairs.push([i, j]);
      }
    }
  }

  return pairs;
}
