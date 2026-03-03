export function buildNewsPrompt(sourceDigest: string): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are a senior AI engineering news curator. Below is raw data fetched from HackerNews and Reddit. Analyze it and curate the most important AI engineering news.

## Raw Source Data

${sourceDigest}

## Instructions

- Select the 10-15 most important items for AI engineers
- Deduplicate across sources (same story on HN and Reddit = one item)
- Prioritize by: score, comment count, recency, and relevance to AI engineering
- Ignore: memes, career advice, generic tech opinions, non-AI content
- Focus on: LLM releases, open-source tools, frameworks, infrastructure, funding rounds, research papers with practical impact, product launches, developer tools, regulation affecting AI engineers

Return ONLY a valid JSON array (no markdown, no backticks, no preamble) with items like:
{
  "headline": "Short punchy headline (max 10 words)",
  "summary": "2-3 sentence summary of what happened and why it matters for AI engineers. Be specific with numbers, model names, and technical details.",
  "takeaway": "One sentence: what should an AI engineer do or know about this?",
  "category": "One of: LLMs, Open Source, Funding, Infra, Research, Product, Regulation, Robotics, Vision, General",
  "source": "Original source name",
  "impact": "HIGH or MEDIUM or LOW"
}

Sort by importance. Be specific and technical — your audience is senior AI engineers. Today's date is ${today}.`;
}
