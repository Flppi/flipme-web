import { NextRequest, NextResponse } from "next/server";
import { searchTracksSequential } from "@/lib/deezer";
import { buildSearchQueries } from "@/lib/mood-to-query";
import {
  dedupeByTrackId,
  filterByEnergyRange,
  interleaveTrackLists,
  rankByEnergyMatch,
  takeRecommendedSlice,
} from "@/lib/recommend-tracks";
import type { PhotoAnalysis } from "@/types";

function isPhotoAnalysis(value: unknown): value is PhotoAnalysis {
  if (!value || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.mood === "string" &&
    typeof o.scene === "string" &&
    Array.isArray(o.colors) &&
    Array.isArray(o.keywords) &&
    typeof o.energy === "number" &&
    Number.isFinite(o.energy) &&
    typeof o.description === "string"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
    }
    const analysis = (body as { analysis?: unknown }).analysis;
    if (!isPhotoAnalysis(analysis)) {
      return NextResponse.json({ error: "분석 결과가 필요합니다." }, { status: 400 });
    }

    const strategy = buildSearchQueries(analysis);
    const lists = await searchTracksSequential(strategy.queries, 30, 200);
    const merged = interleaveTrackLists(lists);
    const unique = dedupeByTrackId(merged);
    const filtered = filterByEnergyRange(unique, strategy.energyRange, 5);
    const ranked = rankByEnergyMatch(filtered, analysis.energy);
    const tracks = takeRecommendedSlice(ranked, 10);

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Recommend failed:", error);
    return NextResponse.json(
      { error: "추천을 불러오지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
