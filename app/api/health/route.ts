import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const full = request.nextUrl.searchParams.get("full") === "1";

  if (!full) {
    return NextResponse.json({ status: "ok" });
  }

  try {
    const { agent } = await import("@/agent/graph");
    const result = await agent.invoke({
      messages: [{ role: "user", content: "Reply with the single word: ok" }],
    });
    const lastMessage = result.messages.at(-1);
    const reply =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content);

    return NextResponse.json({ status: "ok", reply });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
