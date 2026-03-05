import { type NextRequest, NextResponse } from "next/server";
import { runNewsPipeline } from "@/lib/pipeline";
import { parseVerticalId } from "@/lib/verticals";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verticalId = parseVerticalId(
    request.nextUrl.searchParams.get("vertical"),
  );

  try {
    const items = await runNewsPipeline(verticalId);
    return NextResponse.json({
      ok: true,
      vertical: verticalId,
      items: items.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[cron/news:${verticalId}]`, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
