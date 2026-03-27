import { NextRequest, NextResponse } from "next/server";
import { findTracksOnDeezer } from "@/lib/deezer";
import { analyzeAndRecommend } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { image?: unknown };
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }

    const { analysis, songs } = await analyzeAndRecommend(image);
    const tracks = await findTracksOnDeezer(songs);

    if (tracks.length === 0) {
      return NextResponse.json(
        {
          error:
            "추천된 곡을 음원 서비스에서 찾지 못했습니다. 다른 사진으로 시도해 주세요.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ analysis, tracks });
  } catch (error) {
    console.error("Analyze and recommend failed:", error);
    return NextResponse.json(
      { error: "분석에 실패했습니다. 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
