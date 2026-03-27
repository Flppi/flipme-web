import { NextRequest, NextResponse } from "next/server";
import { buildExportLinks, isExportPlatform } from "@/lib/export-links";
import type { ExportPlatform } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
    }
    const { track, platforms } = body as {
      track?: { title?: string; artist?: string };
      platforms?: unknown;
    };

    if (
      !track ||
      typeof track.title !== "string" ||
      typeof track.artist !== "string"
    ) {
      return NextResponse.json({ error: "곡 정보가 필요합니다." }, { status: 400 });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: "플랫폼을 선택해주세요." }, { status: 400 });
    }

    const resolved: ExportPlatform[] = [];
    for (const p of platforms) {
      if (typeof p === "string" && isExportPlatform(p)) {
        resolved.push(p);
      }
    }

    if (resolved.length === 0) {
      return NextResponse.json({ error: "유효한 플랫폼이 없습니다." }, { status: 400 });
    }

    const links = buildExportLinks(track.title, track.artist, resolved);
    return NextResponse.json({ links });
  } catch (error) {
    console.error("Export route failed:", error);
    return NextResponse.json(
      { error: "링크를 만들지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
