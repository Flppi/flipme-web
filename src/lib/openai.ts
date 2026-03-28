import { parse as partialParse, Allow } from "partial-json";
import type {
  AnalyzeAndRecommendResponse,
  AISongRecommendation,
  PhotoAnalysis,
  RecommendationLayer,
} from "@/types";

const MODEL = "gpt-4.1-mini";

const ANALYZE_PROMPT = `You are a photo mood analyzer for a music recommendation service.
Analyze this photo and return JSON with:
- mood: 한국어 감성 키워드 (2~4단어)
- scene: 장소/상황 설명 (예: "카페에서 본 노을")
- colors: 지배적 색상 hex 코드 3개
- keywords: 영문 음악 검색용 키워드 5개 (분위기, 장르, 템포 관련)
- energy: float (아래 스케일 엄격 적용)
- description: 이 사진의 감성을 한 문장으로 (한국어)

## energy 스케일 — 반드시 아래 기준을 따를 것:
- 0.0~0.2: 매우 차분함 (명상, 고요한 풍경, 어둡고 정적인 장면)
- 0.2~0.4: 잔잔함 (카페, 일상, 석양, 비 오는 날)
- 0.4~0.6: 보통 (일반 외출, 도시 거리, 맑은 날, 산책)
- 0.6~0.8: 활기참 (운동, 야외 활동, 밝은 색감, 사람들과 함께)
- 0.8~1.0: 매우 에너지 넘침 (파티, 축제, 콘서트, 강렬한 색감)

## mood 기준:
- 차분한/편안한 계열뿐 아니라 다양한 감성을 포함할 것:
  밝고 경쾌한 / 활기차고 역동적인 / 따뜻하고 포근한 /
  시원하고 청량한 / 몽환적이고 신비로운 / 강렬하고 열정적인 /
  자유롭고 개방적인 / 센치하고 그리운 / 쓸쓸하고 고독한

중요: 밝은 색감, 동적인 구도, 사람이 많은 장면은 energy 0.5 이상이어야 한다.
에너지 값 0.0~1.0 전체 범위를 활용하라.

Return ONLY valid JSON. No markdown, no explanation.`;

const UNIFIED_PROMPT = `You are a music curator. Analyze this photo's mood and recommend 15 real songs.
Return JSON:
{"analysis":{"mood":"한국어 감성","scene":"한국어 상황","colors":["#hex","#hex","#hex"],"keywords":["eng","keywords","for","display","only"],"energy":0.0,"description":"한국어 한 문장"},"songs":[{"title":"exact title","artist":"exact artist","reason":"한국어 이유 1문장","layer":"anchor"}]}

## energy 스케일 — 반드시 아래 기준을 따를 것:
- 0.0~0.2: 매우 차분함 (명상, 고요한 풍경, 어둡고 정적인 장면)
- 0.2~0.4: 잔잔함 (카페, 일상, 석양, 비 오는 날)
- 0.4~0.6: 보통 (일반 외출, 도시 거리, 맑은 날, 산책)
- 0.6~0.8: 활기참 (운동, 야외 활동, 밝은 색감, 사람들과 함께)
- 0.8~1.0: 매우 에너지 넘침 (파티, 축제, 콘서트, 강렬한 색감)

중요: 밝은 색감, 동적인 구도, 사람이 많은 장면은 energy 0.5 이상이어야 한다.
에너지 값 0.0~1.0 전체 범위를 활용하라.

## mood 기준:
- 차분한/편안한 계열뿐 아니라 다양한 감성을 포함할 것:
  밝고 경쾌한 / 활기차고 역동적인 / 따뜻하고 포근한 /
  시원하고 청량한 / 몽환적이고 신비로운 / 강렬하고 열정적인 /
  자유롭고 개방적인 / 센치하고 그리운

15 songs, 3 layers (5 each):
- anchor: iconic songs for this exact mood/scene
- complement: same emotion, unexpected genres
- discovery: lesser-known, recent indie tracks

Rules:
- Song tempo and energy MUST match the photo energy level from the scale above
- Match song era to photo aesthetic (film grain→90s-2000s, warm filter→2010s indie, modern→2020s)
- Include culturally relevant artists if photo has cultural elements
- Mix Korean and international naturally
- ONLY real commercially released tracks on Spotify/Apple Music/Deezer
- NO royalty-free, stock, AI-generated, or YouTube-only music`;

function stripDataUrlPrefix(base64Image: string): string {
  const match = /^data:image\/[a-zA-Z+.-]+;base64,(.+)$/.exec(base64Image.trim());
  return match ? match[1] : base64Image.replace(/\s/g, "");
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return candidate;
  }
  return candidate.slice(start, end + 1);
}

function isPhotoAnalysis(data: unknown): data is PhotoAnalysis {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.mood === "string" &&
    typeof o.scene === "string" &&
    Array.isArray(o.colors) &&
    o.colors.length > 0 &&
    o.colors.every((c) => typeof c === "string") &&
    Array.isArray(o.keywords) &&
    o.keywords.length > 0 &&
    o.keywords.every((k) => typeof k === "string") &&
    typeof o.energy === "number" &&
    Number.isFinite(o.energy) &&
    typeof o.description === "string"
  );
}

function isRecommendationLayer(x: unknown): x is RecommendationLayer {
  return x === "anchor" || x === "complement" || x === "discovery";
}

function isAISongRecommendation(data: unknown): data is AISongRecommendation {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    o.title.length > 0 &&
    typeof o.artist === "string" &&
    o.artist.length > 0 &&
    typeof o.reason === "string" &&
    o.reason.length > 0 &&
    isRecommendationLayer(o.layer)
  );
}

function isAnalyzeAndRecommendResponse(data: unknown): data is AnalyzeAndRecommendResponse {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (!isPhotoAnalysis(o.analysis)) return false;
  if (!Array.isArray(o.songs) || o.songs.length === 0) return false;
  const valid = o.songs.filter(isAISongRecommendation);
  if (valid.length < 5) return false;
  return true;
}

function parseAnalysisFromContent(content: string): PhotoAnalysis {
  const jsonStr = extractJsonObject(content);
  const parsed: unknown = JSON.parse(jsonStr);
  if (!isPhotoAnalysis(parsed)) {
    throw new Error("Invalid analysis shape");
  }
  return {
    ...parsed,
    energy: Math.min(1, Math.max(0, parsed.energy)),
  };
}

function parseAnalyzeAndRecommendFromContent(content: string): AnalyzeAndRecommendResponse {
  const jsonStr = extractJsonObject(content);
  const parsed: unknown = JSON.parse(jsonStr);
  if (!isAnalyzeAndRecommendResponse(parsed)) {
    throw new Error("Invalid analyze-and-recommend shape");
  }
  const validSongs = (parsed as { songs: unknown[] }).songs.filter(
    isAISongRecommendation,
  ) as AISongRecommendation[];
  return {
    analysis: {
      ...(parsed as AnalyzeAndRecommendResponse).analysis,
      energy: Math.min(
        1,
        Math.max(0, (parsed as AnalyzeAndRecommendResponse).analysis.energy),
      ),
    },
    songs: validSongs,
  };
}

interface CallVisionOptions {
  maxTokens: number;
  temperature?: number;
  timeoutMs: number;
  jsonMode?: boolean;
  detail?: "low" | "high" | "auto";
}

async function callVision(
  prompt: string,
  dataUrlForApi: string,
  options: CallVisionOptions,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: options.maxTokens,
    temperature: options.temperature ?? 0.7,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: dataUrlForApi,
              detail: options.detail ?? "auto",
            },
          },
        ],
      },
    ],
  };

  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(options.timeoutMs),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errText}`);
  }

  const resBody = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const msgContent = resBody.choices?.[0]?.message?.content;
  if (!msgContent || typeof msgContent !== "string") {
    throw new Error("Empty model response");
  }
  return msgContent;
}

export async function analyzePhoto(base64Image: string): Promise<PhotoAnalysis> {
  const base64Clean = stripDataUrlPrefix(base64Image);
  const dataUrlForApi = `data:image/jpeg;base64,${base64Clean}`;

  let content = await callVision(ANALYZE_PROMPT, dataUrlForApi, {
    maxTokens: 500,
    timeoutMs: 20_000,
    jsonMode: true,
    detail: "low",
  });
  try {
    return parseAnalysisFromContent(content);
  } catch {
    content = await callVision(ANALYZE_PROMPT, dataUrlForApi, {
      maxTokens: 500,
      timeoutMs: 20_000,
      jsonMode: true,
      detail: "low",
    });
    return parseAnalysisFromContent(content);
  }
}

/** Non-streaming fallback */
export async function analyzeAndRecommend(
  base64Image: string,
): Promise<AnalyzeAndRecommendResponse> {
  const base64Clean = stripDataUrlPrefix(base64Image);
  const dataUrlForApi = `data:image/jpeg;base64,${base64Clean}`;

  let content = await callVision(UNIFIED_PROMPT, dataUrlForApi, {
    maxTokens: 1500,
    temperature: 0.7,
    timeoutMs: 30_000,
    jsonMode: true,
    detail: "low",
  });
  try {
    return parseAnalyzeAndRecommendFromContent(content);
  } catch {
    content = await callVision(UNIFIED_PROMPT, dataUrlForApi, {
      maxTokens: 1500,
      temperature: 0.7,
      timeoutMs: 30_000,
      jsonMode: true,
      detail: "low",
    });
    return parseAnalyzeAndRecommendFromContent(content);
  }
}

// ── Streaming ────────────────────────────────────────────────────────

export interface StreamCallbacks {
  onAnalysis: (analysis: PhotoAnalysis) => void;
  onSong: (song: AISongRecommendation) => void;
}

/**
 * GPT 응답을 스트리밍으로 수신하면서 analysis와 개별 song을 즉시 콜백으로 전달.
 * analysis 필드가 먼저 파싱되어 전달되고, songs 배열의 각 항목이 완성될 때마다 onSong 호출.
 */
export async function streamAnalyzeAndRecommend(
  base64Image: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const base64Clean = stripDataUrlPrefix(base64Image);
  const dataUrlForApi = `data:image/jpeg;base64,${base64Clean}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      temperature: 0.7,
      stream: true,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: UNIFIED_PROMPT },
            { type: "image_url", image_url: { url: dataUrlForApi, detail: "low" } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errText}`);
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let analysisEmitted = false;
  let emittedSongCount = 0;
  let sseBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    sseBuffer += decoder.decode(value, { stream: true });
    const lines = sseBuffer.split("\n");
    sseBuffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      try {
        const chunk = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = chunk.choices?.[0]?.delta?.content;
        if (!delta) continue;

        accumulated += delta;

        try {
          const partial = partialParse(accumulated, Allow.ALL) as Record<string, unknown>;

          if (!analysisEmitted && partial.analysis && isPhotoAnalysis(partial.analysis)) {
            callbacks.onAnalysis({
              ...partial.analysis,
              energy: Math.min(1, Math.max(0, partial.analysis.energy)),
            });
            analysisEmitted = true;
          }

          if (Array.isArray(partial.songs)) {
            const complete = partial.songs.filter(isAISongRecommendation);
            while (emittedSongCount < complete.length) {
              callbacks.onSong(complete[emittedSongCount]);
              emittedSongCount++;
            }
          }
        } catch {
          /* partial parse not yet possible */
        }
      } catch {
        /* invalid SSE chunk */
      }
    }
  }
}
