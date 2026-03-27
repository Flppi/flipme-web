import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Deprecated. Use /api/analyze-and-recommend instead." },
    { status: 410 },
  );
}
