import { create } from "zustand";
import type { AnalyticsEvent, DeezerTrack, PhotoAnalysis, ShareCardConfig } from "@/types";

interface FlipStore {
  sessionId: string;
  uploadedImage: string | null;
  analysis: PhotoAnalysis | null;
  recommendations: DeezerTrack[];
  selectedTrack: DeezerTrack | null;
  cardConfig: ShareCardConfig | null;
  isAnalyzing: boolean;
  isRecommending: boolean;
  currentlyPlayingId: number | null;

  trackEvent: (event: Omit<AnalyticsEvent, "sessionId" | "timestamp">) => void;
  setUploadedImage: (image: string | null) => void;
  setAnalysis: (analysis: PhotoAnalysis | null) => void;
  setRecommendations: (tracks: DeezerTrack[]) => void;
  addRecommendation: (track: DeezerTrack) => void;
  setSelectedTrack: (track: DeezerTrack | null) => void;
  setCardConfig: (config: ShareCardConfig | null) => void;
  setIsAnalyzing: (value: boolean) => void;
  setIsRecommending: (value: boolean) => void;
  setCurrentlyPlayingId: (id: number | null) => void;
  reset: () => void;
}

function newSessionId(): string {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return "";
}

const DEDUP_WINDOW_MS = 3_000;

let lastTrackPlayEvent: { trackId: number; timestamp: number } | null = null;

const initialState = {
  sessionId: "" as string,
  uploadedImage: null as string | null,
  analysis: null as PhotoAnalysis | null,
  recommendations: [] as DeezerTrack[],
  selectedTrack: null as DeezerTrack | null,
  cardConfig: null as ShareCardConfig | null,
  isAnalyzing: false,
  isRecommending: false,
  currentlyPlayingId: null as number | null,
};

export const useFlipStore = create<FlipStore>((set, get) => ({
  ...initialState,
  trackEvent: (event) => {
    if (event.eventType === "track_play") {
      const now = Date.now();
      if (
        lastTrackPlayEvent &&
        lastTrackPlayEvent.trackId === event.trackId &&
        now - lastTrackPlayEvent.timestamp < DEDUP_WINDOW_MS
      ) {
        return;
      }
      lastTrackPlayEvent = { trackId: event.trackId, timestamp: now };
    }

    let sessionId = get().sessionId;
    if (!sessionId) {
      sessionId = newSessionId();
      if (sessionId) {
        set({ sessionId });
      }
    }
    const sid = sessionId || "unknown";
    const fullEvent: AnalyticsEvent = {
      ...event,
      sessionId: sid,
      timestamp: new Date().toISOString(),
    };
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullEvent),
    }).catch((err) => {
      console.error(err);
    });
  },
  setUploadedImage: (image) => set({ uploadedImage: image }),
  setAnalysis: (analysis) => set({ analysis }),
  setRecommendations: (tracks) => set({ recommendations: tracks }),
  addRecommendation: (track) =>
    set((state) => {
      if (state.recommendations.some((t) => t.id === track.id)) return state;
      return { recommendations: [...state.recommendations, track] };
    }),
  setSelectedTrack: (track) => set({ selectedTrack: track }),
  setCardConfig: (config) => set({ cardConfig: config }),
  setIsAnalyzing: (value) => set({ isAnalyzing: value }),
  setIsRecommending: (value) => set({ isRecommending: value }),
  setCurrentlyPlayingId: (id) => set({ currentlyPlayingId: id }),
  reset: () =>
    set({
      ...initialState,
      sessionId: newSessionId(),
    }),
}));
