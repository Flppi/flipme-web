import { NextRequest } from "next/server";
import { matchSongOnDeezer } from "@/lib/deezer";
import { streamAnalyzeAndRecommend } from "@/lib/openai";

export const runtime = "nodejs";
export const preferredRegion = "iad1";

export async function POST(req: NextRequest) {
  let base64Image: string;

  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return Response.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    base64Image = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
  } else {
    const body = (await req.json()) as { image?: unknown };
    if (!body.image || typeof body.image !== "string") {
      return Response.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }
    base64Image = body.image as string;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const deezerPromises: Promise<void>[] = [];
      const seenIds = new Set<number>();

      try {
        await streamAnalyzeAndRecommend(base64Image, {
          onAnalysis: (analysis) => {
            send("analysis", analysis);
          },
          onSong: (song) => {
            const p = matchSongOnDeezer(song)
              .then((track) => {
                if (track && !seenIds.has(track.id)) {
                  seenIds.add(track.id);
                  send("track", track);
                }
              })
              .catch(() => {});
            deezerPromises.push(p);
          },
        });

        await Promise.allSettled(deezerPromises);
        send("done", {});
      } catch (error) {
        console.error("Stream analyze failed:", error);
        send("error", { message: "분석에 실패했습니다. 다시 시도해 주세요." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
