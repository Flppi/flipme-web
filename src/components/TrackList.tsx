"use client";

import TrackCard from "@/components/TrackCard";
import type { DeezerTrack, RecommendationLayer } from "@/types";

interface TrackListProps {
  tracks: DeezerTrack[];
  selectedId: number | null;
  onSelect: (track: DeezerTrack) => void;
  isLoading: boolean;
}

const LAYERS: { key: RecommendationLayer; label: string; icon: string }[] = [
  { key: "anchor", label: "이 분위기의 대표곡", icon: "🎯" },
  { key: "complement", label: "의외의 조합", icon: "🎨" },
  { key: "discovery", label: "숨은 보석", icon: "💎" },
];

function TrackCardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl border border-flip-muted/15 bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-flip-muted/20" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <div className="h-4 w-3/4 animate-pulse rounded bg-flip-muted/20" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-flip-muted/15" />
        </div>
        <div className="my-auto h-7 w-14 animate-pulse rounded-full bg-flip-muted/15" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-flip-muted/15" />
        <div className="h-2 flex-1 animate-pulse rounded-full bg-flip-muted/15" />
        <div className="flex shrink-0 gap-1">
          {Array.from({ length: 4 }, (_, j) => (
            <div key={j} className="h-7 w-7 animate-pulse rounded-full bg-flip-muted/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TrackList({
  tracks,
  selectedId,
  onSelect,
  isLoading,
}: TrackListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <p
          className="flex items-center justify-center gap-3 text-sm font-medium text-flip-primary"
          aria-live="polite"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-flip-accent/15 text-flip-accent"
            aria-hidden
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </span>
          어울리는 음악을 찾고 있어요...
        </p>
        <div
          className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4"
          aria-busy="true"
          aria-label="추천 곡을 불러오는 중"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <TrackCardSkeleton key={`sk-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-flip-muted">
        미리듣기가 있는 추천 곡을 찾지 못했습니다. 홈에서 다시 분석해 보세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {LAYERS.map(({ key, label, icon }) => {
        const layerTracks = tracks.filter((t) => t.layer === key);
        if (layerTracks.length === 0) {
          return null;
        }
        return (
          <section key={key} aria-label={label}>
            <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-flip-primary">
              <span aria-hidden>{icon}</span>
              {label}
            </h3>
            <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
              {layerTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isSelected={selectedId === track.id}
                  onSelect={onSelect}
                  hideInlinePreview={selectedId === track.id}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
