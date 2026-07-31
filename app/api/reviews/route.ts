import { NextResponse } from "next/server";
import { getThreadSummaries } from "@/lib/reviews";

export async function GET() {
  try {
    const threads = await getThreadSummaries();
    return NextResponse.json({ threads });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
