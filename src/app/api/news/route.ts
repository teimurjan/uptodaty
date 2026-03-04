import { NextResponse } from "next/server";
import { getCachedNews } from "@/lib/cache";
import { runNewsPipeline } from "@/lib/pipeline";

export async function GET(): Promise<NextResponse> {
  try {
    const cached = await getCachedNews();
    if (cached) {
      return NextResponse.json({ items: cached });
    }

    const items = await runNewsPipeline();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
