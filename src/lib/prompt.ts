export function buildNewsPrompt(
  sourceDigest: string,
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

  return `You are a senior AI engineering news curator. Below is raw data fetched from HackerNews, Reddit, and GitHub Trending. Analyze it and curate the most important AI engineering news.

## Raw Source Data

${sourceDigest}
${dedupSection}
## Instructions

- Select the 10-15 most important items for AI engineers
- Deduplicate across sources (same story on HN and Reddit = one item)
- If a story matches anything in the "Already Covered" list above, SKIP IT entirely
- Prioritize by: score, comment count, recency, and relevance to AI engineering
- Ignore: memes, career advice, generic tech opinions, non-AI content
- Focus on: LLM releases, open-source tools, frameworks, infrastructure, funding rounds, research papers with practical impact, product launches, developer tools, regulation affecting AI engineers
- GitHub Trending: only include a repository if it is genuinely noteworthy (novel approach, significant adoption, or from a notable org) — do not include repos just because they are trending

Return ONLY a valid JSON array (no markdown, no backticks, no preamble) with items like:
{
  "id": "kebab-case-slug (unique, descriptive, e.g. claude-4-launch)",
  "headline": "Short punchy headline (max 10 words)",
  "summary": "2-3 sentence summary of what happened and why it matters for AI engineers. Be specific with numbers, model names, and technical details.",
  "takeaway": "One sentence: what should an AI engineer do or know about this?",
  "category": "One of: LLMs, Open Source, Funding, Infra, Research, Product, Regulation, Robotics, Vision, GitHub Trending, General",
  "source": "Original source name",
  "url": "URL to the original article, post, or repository",
  "relatedTo": ["other-item-id"] // optional — reference IDs of related items in THIS issue only
}

Rules for ids and relatedTo:
- Each id must be a unique kebab-case slug derived from the headline
- relatedTo references must be IDs of OTHER items in the same response
- If two items cover related topics (e.g. a model release and benchmarks for that model), link them with relatedTo in BOTH directions

Sort by importance. Be specific and technical — your audience is senior AI engineers. Today's date is ${today}.`;
}
