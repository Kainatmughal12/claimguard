import { NextRequest, NextResponse } from "next/server";
import { getThread } from "@/lib/reviews";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const thread = await getThread(id);
    return NextResponse.json(thread);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
