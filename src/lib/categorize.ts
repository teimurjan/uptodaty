import { generateObject } from "ai";
import { z } from "zod";
import { resolveCategorizationModel } from "./model";
import type { RawArticle } from "./sources/types";
import { VERTICAL_IDS, VERTICALS, type VerticalId } from "./verticals";

const verticalIdSchema = z.enum(["ai", "software-engineering", "web3", "none"]);

function buildCategorizationPrompt(article: RawArticle): string {
  const verticalDescriptions = VERTICAL_IDS.map(
    (id) => `- "${id}": ${VERTICALS[id].description}`,
  ).join("\n");

  const snippet = article.body?.slice(0, 300) ?? "";

  return `Classify this article into exactly one vertical or "none" if it doesn't fit.

Verticals:
${verticalDescriptions}

Article:
Title: ${article.title}
${snippet ? `Body: ${snippet}` : ""}

Respond with the vertical ID that best matches, or "none" if it doesn't fit any.`;
}

export async function categorizeArticles(
  articles: RawArticle[],
  targetVertical: VerticalId,
): Promise<RawArticle[]> {
  const uncategorized = articles.filter((a) => !a.vertical);
  const alreadyTagged = articles.filter((a) => a.vertical);

  if (uncategorized.length === 0) return alreadyTagged;

  const model = resolveCategorizationModel();

  const classified = await Promise.all(
    uncategorized.map(async (article) => {
      const { object } = await generateObject({
        model,
        schema: z.object({ vertical: verticalIdSchema }),
        prompt: buildCategorizationPrompt(article),
      });

      if (object.vertical === "none" || object.vertical !== targetVertical) {
        return null;
      }

      article.vertical = object.vertical;
      return article;
    }),
  );

  const matchingHN = classified.filter((a): a is RawArticle => a !== null);

  return [...alreadyTagged, ...matchingHN];
}
