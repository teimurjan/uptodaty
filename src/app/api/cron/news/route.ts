import { NextResponse } from "next/server";
import { runNewsPipeline } from "@/lib/pipeline";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await runNewsPipeline();
    return NextResponse.json({
      ok: true,
      items: items.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/news]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
