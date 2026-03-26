import { create } from "zustand";
import type { DeezerTrack, PhotoAnalysis, ShareCardConfig } from "@/types";

interface FlipStore {
  uploadedImage: string | null;
  analysis: PhotoAnalysis | null;
  recommendations: DeezerTrack[];
  selectedTrack: DeezerTrack | null;
  cardConfig: ShareCardConfig | null;
  isAnalyzing: boolean;
  isRecommending: boolean;
  currentlyPlayingId: number | null;

  setUploadedImage: (image: string | null) => void;
  setAnalysis: (analysis: PhotoAnalysis | null) => void;
  setRecommendations: (tracks: DeezerTrack[]) => void;
  setSelectedTrack: (track: DeezerTrack | null) => void;
  setCardConfig: (config: ShareCardConfig | null) => void;
  setIsAnalyzing: (value: boolean) => void;
  setIsRecommending: (value: boolean) => void;
  setCurrentlyPlayingId: (id: number | null) => void;
  reset: () => void;
}

const initialState = {
  uploadedImage: null as string | null,
  analysis: null as PhotoAnalysis | null,
  recommendations: [] as DeezerTrack[],
  selectedTrack: null as DeezerTrack | null,
  cardConfig: null as ShareCardConfig | null,
  isAnalyzing: false,
  isRecommending: false,
  currentlyPlayingId: null as number | null,
};

export const useFlipStore = create<FlipStore>((set) => ({
  ...initialState,
  setUploadedImage: (image) => set({ uploadedImage: image }),
  setAnalysis: (analysis) => set({ analysis }),
  setRecommendations: (tracks) => set({ recommendations: tracks }),
  setSelectedTrack: (track) => set({ selectedTrack: track }),
  setCardConfig: (config) => set({ cardConfig: config }),
  setIsAnalyzing: (value) => set({ isAnalyzing: value }),
  setIsRecommending: (value) => set({ isRecommending: value }),
  setCurrentlyPlayingId: (id) => set({ currentlyPlayingId: id }),
  reset: () => set(initialState),
}));
