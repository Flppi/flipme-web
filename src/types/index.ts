/** 이미지 분석 결과 — keywords는 UI 표시용(검색에는 미사용) */
export interface PhotoAnalysis {
  mood: string;
  scene: string;
  colors: string[];
  keywords: string[];
  energy: number;
  description: string;
}

/** 추천 레이어 */
export type RecommendationLayer = "anchor" | "complement" | "discovery";

/** GPT-4o가 반환하는 곡 추천 (Deezer 매칭 전) */
export interface AISongRecommendation {
  title: string;
  artist: string;
  reason: string;
  layer: RecommendationLayer;
}

/** GPT-4o 통합 응답 */
export interface AnalyzeAndRecommendResponse {
  analysis: PhotoAnalysis;
  songs: AISongRecommendation[];
}

/** Deezer 매칭 완료된 트랙 */
export interface DeezerTrack {
  id: number;
  title: string;
  artist: string;
  album: string;
  albumCoverUrl: string;
  previewUrl: string;
  deezerUrl: string;
  duration: number;
  layer: RecommendationLayer;
  reason: string;
}

/** Deezer 검색 결과(레이어·사유 없음) — 매칭 후 DeezerTrack으로 확장 */
export type DeezerSearchHit = Omit<DeezerTrack, "layer" | "reason">;

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

/** 통계 이벤트 타입 */
export type AnalyticsEventType =
  | "track_play"
  | "track_play_complete"
  | "track_select"
  | "card_create"
  | "card_share"
  | "card_download"
  | "export_click";

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  trackId: number;
  trackTitle: string;
  trackArtist: string;
  layer: RecommendationLayer;
  sessionId: string;
  photoMood?: string;
  photoEnergy?: number;
  timestamp: string;
  platform?: ExportPlatform;
}
