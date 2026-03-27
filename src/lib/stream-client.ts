import { useFlipStore } from "@/store/useFlipStore";
import type { DeezerTrack, PhotoAnalysis } from "@/types";

let activeAbort: AbortController | null = null;

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const raw = atob(parts[1]);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function cancelAnalyzeStream() {
  if (activeAbort) {
    activeAbort.abort();
    activeAbort = null;
  }
}

export function isStreamActive(): boolean {
  return activeAbort !== null && !activeAbort.signal.aborted;
}

/**
 * SSE 스트림을 시작하여 store를 점진적으로 업데이트한다.
 * 컴포넌트 라이프사이클과 독립적으로 동작한다.
 */
export function startAnalyzeStream(imageDataUrl: string) {
  cancelAnalyzeStream();
  const abort = new AbortController();
  activeAbort = abort;

  const s = useFlipStore.getState();
  s.setAnalysis(null);
  s.setRecommendations([]);
  s.setSelectedTrack(null);
  s.setIsRecommending(true);

  void consumeStream(imageDataUrl, abort)
    .catch(() => {})
    .finally(() => {
      if (activeAbort === abort) {
        useFlipStore.getState().setIsRecommending(false);
        activeAbort = null;
      }
    });
}

async function consumeStream(imageDataUrl: string, abort: AbortController) {
  const blob = dataUrlToBlob(imageDataUrl);
  const formData = new FormData();
  formData.append("image", blob, "photo.jpg");

  const res = await fetch("/api/analyze-and-recommend", {
    method: "POST",
    body: formData,
    signal: abort.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error("Stream request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        const data = line.slice(6);
        const store = useFlipStore.getState();

        try {
          if (currentEvent === "analysis") {
            store.setAnalysis(JSON.parse(data) as PhotoAnalysis);
          } else if (currentEvent === "track") {
            store.addRecommendation(JSON.parse(data) as DeezerTrack);
          } else if (currentEvent === "error") {
            // error는 finally에서 isRecommending=false로 처리
          }
        } catch {
          /* parse error, skip */
        }
        currentEvent = "";
      }
    }
  }
}
