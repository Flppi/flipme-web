import type { PhotoAnalysis } from "@/types";

const ANALYZE_PROMPT = `You are a photo mood analyzer for a music recommendation service.
Analyze this photo and return JSON with:
- mood: 한국어 감성 키워드 (예: "잔잔한", "활기찬", "몽환적인", "쓸쓸한")
- scene: 장소/상황 설명 (예: "카페에서 본 노을")
- colors: 지배적 색상 hex 코드 3개
- keywords: 영문 음악 검색용 키워드 5개 (분위기, 장르, 템포 관련)
- energy: 0.0(잔잔) ~ 1.0(강렬) 에너지 레벨
- description: 이 사진의 감성을 한 문장으로 (한국어)

Return ONLY valid JSON. No markdown, no explanation.`;

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

async function callVision(
  prompt: string,
  dataUrlForApi: string,
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
      max_tokens: 500,
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
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errText}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Empty model response");
  }
  return content;
}

export async function analyzePhoto(base64Image: string): Promise<PhotoAnalysis> {
  const base64Clean = stripDataUrlPrefix(base64Image);
  const dataUrlForApi = `data:image/jpeg;base64,${base64Clean}`;

  let content = await callVision(ANALYZE_PROMPT, dataUrlForApi);
  try {
    return parseAnalysisFromContent(content);
  } catch {
    content = await callVision(ANALYZE_PROMPT + RETRY_PROMPT_SUFFIX, dataUrlForApi);
    return parseAnalysisFromContent(content);
  }
}
