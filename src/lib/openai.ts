import type {
  AnalyzeAndRecommendResponse,
  AISongRecommendation,
  PhotoAnalysis,
  RecommendationLayer,
} from "@/types";

const ANALYZE_PROMPT = `You are a photo mood analyzer for a music recommendation service.
Analyze this photo and return JSON with:
- mood: 한국어 감성 키워드 (예: "잔잔한", "활기찬", "몽환적인", "쓸쓸한")
- scene: 장소/상황 설명 (예: "카페에서 본 노을")
- colors: 지배적 색상 hex 코드 3개
- keywords: 영문 음악 검색용 키워드 5개 (분위기, 장르, 템포 관련)
- energy: 0.0(잔잔) ~ 1.0(강렬) 에너지 레벨
- description: 이 사진의 감성을 한 문장으로 (한국어)

Return ONLY valid JSON. No markdown, no explanation.`;

const UNIFIED_PROMPT = `You are a music curator who recommends songs based on photos.
Analyze this photo and recommend songs. Return JSON only:

{
  "analysis": {
    "mood": "한국어 감성 키워드 (예: 잔잔한, 몽환적인, 활기찬)",
    "scene": "장소/상황 설명 (한국어)",
    "colors": ["#hex", "#hex", "#hex"],
    "keywords": ["english", "search", "keywords", "for", "display"],
    "energy": 0.0 to 1.0,
    "description": "이 사진의 감성을 한 문장으로 (한국어)"
  },
  "songs": [
    {
      "title": "exact song title",
      "artist": "exact artist name",
      "reason": "이 사진과 어울리는 이유 (한국어, 1문장)",
      "layer": "anchor"
    }
  ]
}

Song recommendation rules:
- Recommend exactly 15 songs in 3 layers (5 songs each):

  LAYER "anchor" (5 songs):
  Songs that are genre-defining or iconic for THIS SPECIFIC mood/scene.
  NOT Billboard chart hits unless they genuinely match this exact vibe.
  Think: "the obvious first picks for a playlist with this exact mood."

  LAYER "complement" (5 songs):
  Same emotional tone, but from adjacent or unexpected genres.
  The listener should think "I wouldn't have searched for this genre, but it fits perfectly."

  LAYER "discovery" (5 songs):
  Lesser-known tracks that match the mood.
  Prioritize recent releases (last 3 years) and independent artists.
  The listener should think "I've never heard this but it's perfect."

- Energy level MUST match the photo. Low energy photo = slow/calm songs only. Do NOT mix.
- If the photo has a visual aesthetic (film grain → 90s-2000s era, VSCO warm filter → 2010s indie, sharp modern → 2020s), weight song era accordingly.
- If the photo contains culturally specific elements (Korean signs, Japanese scenery, European architecture), naturally include artists from that cultural sphere.
- Include both Korean and international artists where it feels natural. Do NOT force Korean songs if the mood doesn't call for it.
- NEVER recommend: royalty-free music, stock/library music, AI-generated tracks, or songs that exist only on YouTube.
- Every song MUST be a real, commercially released track available on major streaming platforms (Spotify, Apple Music, Deezer).
- Return ONLY valid JSON. No markdown, no explanation, no wrapping.`;

const RETRY_PROMPT_SUFFIX =
  "\n\nIMPORTANT: Output a single raw JSON object only. No code fences, no markdown.";

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
  if (!Array.isArray(o.songs) || o.songs.length !== 15) return false;
  if (!o.songs.every(isAISongRecommendation)) return false;
  const layers = o.songs.map((s) => s.layer);
  for (const layer of ["anchor", "complement", "discovery"] as const) {
    if (layers.filter((l) => l === layer).length !== 5) return false;
  }
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
  return {
    analysis: {
      ...parsed.analysis,
      energy: Math.min(1, Math.max(0, parsed.analysis.energy)),
    },
    songs: parsed.songs,
  };
}

async function callVision(
  prompt: string,
  dataUrlForApi: string,
  options: { maxTokens: number; temperature?: number; timeoutMs: number },
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: options.maxTokens,
      temperature: options.temperature ?? 0.7,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: dataUrlForApi },
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(options.timeoutMs),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errText}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const msgContent = body.choices?.[0]?.message?.content;
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
    timeoutMs: 30_000,
  });
  try {
    return parseAnalysisFromContent(content);
  } catch {
    content = await callVision(ANALYZE_PROMPT + RETRY_PROMPT_SUFFIX, dataUrlForApi, {
      maxTokens: 500,
      timeoutMs: 30_000,
    });
    return parseAnalysisFromContent(content);
  }
}

export async function analyzeAndRecommend(
  base64Image: string,
): Promise<AnalyzeAndRecommendResponse> {
  const base64Clean = stripDataUrlPrefix(base64Image);
  const dataUrlForApi = `data:image/jpeg;base64,${base64Clean}`;

  let content = await callVision(UNIFIED_PROMPT, dataUrlForApi, {
    maxTokens: 2000,
    temperature: 0.9,
    timeoutMs: 45_000,
  });
  try {
    return parseAnalyzeAndRecommendFromContent(content);
  } catch {
    content = await callVision(UNIFIED_PROMPT + RETRY_PROMPT_SUFFIX, dataUrlForApi, {
      maxTokens: 2000,
      temperature: 0.9,
      timeoutMs: 45_000,
    });
    return parseAnalyzeAndRecommendFromContent(content);
  }
}
