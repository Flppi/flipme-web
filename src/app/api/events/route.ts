import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { AnalyticsEventType, ExportPlatform, RecommendationLayer } from "@/types";

const LAYERS = new Set<RecommendationLayer>(["anchor", "complement", "discovery"]);

const EVENT_TYPES = new Set<AnalyticsEventType>([
  "track_play",
  "track_play_complete",
  "track_select",
  "card_create",
  "card_share",
  "card_download",
  "export_click",
]);

const EXPORT_PLATFORMS = new Set<ExportPlatform>([
  "spotify",
  "apple-music",
  "youtube-music",
]);

function isValidEventBody(body: unknown): body is {
  eventType: AnalyticsEventType;
  trackId: number;
  trackTitle: string;
  trackArtist: string;
  layer: RecommendationLayer;
  sessionId: string;
  photoMood?: string;
  photoEnergy?: number;
  timestamp?: string;
  platform?: ExportPlatform;
} {
  if (!body || typeof body !== "object") {
    return false;
  }
  const o = body as Record<string, unknown>;
  if (typeof o.eventType !== "string" || !EVENT_TYPES.has(o.eventType as AnalyticsEventType)) {
    return false;
  }
  if (typeof o.trackId !== "number" || !Number.isFinite(o.trackId)) {
    return false;
  }
  if (typeof o.trackTitle !== "string" || typeof o.trackArtist !== "string") {
    return false;
  }
  if (typeof o.layer !== "string" || !LAYERS.has(o.layer as RecommendationLayer)) {
    return false;
  }
  if (typeof o.sessionId !== "string" || o.sessionId.length === 0) {
    return false;
  }
  if (o.platform !== undefined) {
    if (typeof o.platform !== "string" || !EXPORT_PLATFORMS.has(o.platform as ExportPlatform)) {
      return false;
    }
  }
  if (o.photoEnergy !== undefined && (typeof o.photoEnergy !== "number" || !Number.isFinite(o.photoEnergy))) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const event: unknown = await req.json();

    if (!isValidEventBody(event)) {
      return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (event.eventType === "track_play") {
      const { data: recent } = await supabase
        .from("analytics_events")
        .select("created_at")
        .eq("event_type", "track_play")
        .eq("session_id", event.sessionId)
        .eq("track_id", event.trackId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recent && recent.length > 0) {
        const lastTime = new Date(recent[0].created_at).getTime();
        if (Date.now() - lastTime < 3_000) {
          return NextResponse.json({ ok: true, deduplicated: true });
        }
      }
    }

    const { error } = await supabase.from("analytics_events").insert({
      event_type: event.eventType,
      track_id: event.trackId,
      track_title: event.trackTitle,
      track_artist: event.trackArtist,
      layer: event.layer,
      session_id: event.sessionId,
      photo_mood: event.photoMood ?? null,
      photo_energy: event.photoEnergy ?? null,
      platform: event.platform ?? null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Event logging failed:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
