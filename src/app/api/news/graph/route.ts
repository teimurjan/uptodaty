import { type NextRequest, NextResponse } from "next/server";
import { getRelatedGraph, searchItems } from "@/lib/graph";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const mode = request.nextUrl.searchParams.get("mode") ?? "neighborhood";

  try {
    if (mode === "search") {
      const query = request.nextUrl.searchParams.get("q");
      if (!query) {
        return NextResponse.json(
          { error: "Missing required parameter: q" },
          { status: 400 },
        );
      }

      const k = Math.min(
        Number(request.nextUrl.searchParams.get("k")) || 20,
        50,
      );
      const results = await searchItems(query, k);
      return NextResponse.json({ items: results });
    }

    const itemId = request.nextUrl.searchParams.get("id");
    if (!itemId) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 },
      );
    }

    const depth = Math.min(
      Number(request.nextUrl.searchParams.get("depth")) || 2,
      4,
    );
    const related = await getRelatedGraph(itemId, depth);
    return NextResponse.json({ items: related });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
