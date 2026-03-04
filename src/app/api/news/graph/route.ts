import { type NextRequest, NextResponse } from "next/server";
import { getRelatedGraph } from "@/lib/graph";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const itemId = request.nextUrl.searchParams.get("id");
  const depthParam = request.nextUrl.searchParams.get("depth");

  if (!itemId) {
    return NextResponse.json(
      { error: "Missing required parameter: id" },
      { status: 400 },
    );
  }

  const depth = Math.min(Number(depthParam) || 2, 4);

  try {
    const related = await getRelatedGraph(itemId, depth);
    return NextResponse.json({ items: related });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
