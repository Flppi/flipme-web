import { NextRequest, NextResponse } from "next/server";
import { analyzePhoto } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { image?: unknown };
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }

    const analysis = await analyzePhoto(image);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Image analysis failed:", error);
    return NextResponse.json(
      { error: "이미지 분석에 실패했습니다. 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
