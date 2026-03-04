import { generateText } from "ai";
import { NextResponse } from "next/server";
import { getCachedNews, getRecentHeadlines, setCachedNews } from "@/lib/cache";
import { deduplicateArticles } from "@/lib/dedup";
import { resolveModel } from "@/lib/model";
import { parseNewsJson } from "@/lib/parse-news";
import { buildNewsPrompt } from "@/lib/prompt";
import { formatSourceDigest } from "@/lib/sources/format";
import { collectArticles, fetchAllSources } from "@/lib/sources/registry";

export async function GET(): Promise<NextResponse> {
  try {
    const cached = await getCachedNews();
    if (cached) {
      return NextResponse.json({ items: cached });
    }

    const [results, pastHeadlines] = await Promise.all([
      fetchAllSources(),
      getRecentHeadlines(7),
    ]);

    const allArticles = collectArticles(results);

    if (allArticles.length === 0) {
      const errors = results
        .filter((r) => r.error)
        .map((r) => `${r.sourceName}: ${r.error}`)
        .join("; ");
      return NextResponse.json(
        { error: `All sources returned empty. ${errors}` },
        { status: 502 },
      );
    }

    const dedupedArticles = deduplicateArticles(allArticles);

    const dedupedBySource = results.map((result) => ({
      ...result,
      articles: result.articles.filter((a) => dedupedArticles.includes(a)),
    }));

    const digest = formatSourceDigest(dedupedBySource);
    const model = resolveModel();

    const { text } = await generateText({
      model,
      prompt: buildNewsPrompt(digest, pastHeadlines),
    });

    const items = parseNewsJson(text);
    await setCachedNews(items);
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
