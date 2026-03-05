import { after, type NextRequest, NextResponse } from "next/server";
import { getCachedNews } from "@/lib/cache";
import { runNewsPipeline } from "@/lib/pipeline";
import { parseVerticalId } from "@/lib/verticals";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const verticalId = parseVerticalId(
    request.nextUrl.searchParams.get("vertical"),
  );

  try {
    const cached = await getCachedNews(verticalId);
    if (cached) {
      return NextResponse.json({ items: cached });
    }

    after(async () => {
      try {
        await runNewsPipeline(verticalId);
      } catch (error) {
        console.error(
          `[news:${verticalId}] background pipeline failed:`,
          error,
        );
      }
    });

    return NextResponse.json({ items: null, pending: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
