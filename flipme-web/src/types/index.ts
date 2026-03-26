/** 이미지 분석 결과 */
export interface PhotoAnalysis {
  mood: string;
  scene: string;
  colors: string[];
  keywords: string[];
  energy: number;
  description: string;
}

/** Deezer 트랙 */
export interface DeezerTrack {
  id: number;
  title: string;
  artist: string;
  album: string;
  albumCoverUrl: string;
  previewUrl: string;
  deezerUrl: string;
  duration: number;
}

/** 추천 결과 */
export interface RecommendationResult {
  analysis: PhotoAnalysis;
  tracks: DeezerTrack[];
  playlist?: {
    name: string;
    description: string;
    tracks: DeezerTrack[];
  };
}

/** 공유 카드 설정 */
export interface ShareCardConfig {
  photoUrl: string;
  track: DeezerTrack;
  frameStyle: "minimal" | "polaroid" | "gradient" | "vinyl";
  showLyrics: boolean;
  customText?: string;
}

/** 플랫폼 Export */
export type ExportPlatform = "spotify" | "apple-music" | "youtube-music";

export interface ExportLink {
  platform: ExportPlatform;
  url: string;
  available: boolean;
}
