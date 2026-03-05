import type { VerticalPromptConfig } from "./verticals";

export function buildNewsPrompt(
  sourceDigest: string,
  verticalPrompt: VerticalPromptConfig,
  pastHeadlines?: string[],
): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dedupSection =
    pastHeadlines && pastHeadlines.length > 0
      ? `\n## Already Covered (past 7 days — DO NOT repeat these stories)\n\n${pastHeadlines.map((h) => `- ${h}`).join("\n")}\n`
      : "";

  const categoryList = verticalPrompt.categories.join(", ");
  const focusList = verticalPrompt.focusAreas.join(", ");
  const ignoreList = verticalPrompt.ignoreList.join(", ");

  return `You are a senior ${verticalPrompt.audience} news curator. Below is raw data fetched from HackerNews, Reddit, and GitHub Trending. All articles have been pre-filtered to be relevant to your vertical. Analyze and curate the most important news.

## Raw Source Data

${sourceDigest}
${dedupSection}
## Instructions

- Select the 10-15 most important items for ${verticalPrompt.audience}
- Deduplicate across sources (same story on HN and Reddit = one item)
- If a story matches anything in the "Already Covered" list above, SKIP IT entirely
- Prioritize by: score, comment count, recency, and relevance
- Ignore: ${ignoreList}
- Focus on: ${focusList}
- GitHub Trending: only include a repository if it is genuinely noteworthy (novel approach, significant adoption, or from a notable org) — do not include repos just because they are trending

Return ONLY a valid JSON array (no markdown, no backticks, no preamble) with items like:
{
  "id": "kebab-case-slug (unique, descriptive, e.g. claude-4-launch)",
  "headline": "Short punchy headline (max 10 words)",
  "summary": "2-3 sentence summary of what happened and why it matters. Be specific with numbers, names, and technical details.",
  "takeaway": "One sentence: what should the reader do or know about this?",
  "category": "One of: ${categoryList}",
  "source": "Original source name",
  "url": "URL to the original article, post, or repository"
}

Each id must be a unique kebab-case slug derived from the headline.

Sort by importance. Be specific and technical — your audience is ${verticalPrompt.audience}. Today's date is ${today}.`;
}
