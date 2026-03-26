"use client";

import TrackCard from "@/components/TrackCard";
import type { DeezerTrack } from "@/types";

interface TrackListProps {
  tracks: DeezerTrack[];
  selectedId: number | null;
  onSelect: (track: DeezerTrack) => void;
  isLoading: boolean;
}

function TrackCardSkeleton() {
  return (
    <div className="flex w-[min(100%,18rem)] shrink-0 gap-3 rounded-2xl border border-flip-muted/15 bg-white p-4 shadow-sm md:min-w-0 md:w-full">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-flip-muted/20" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-4 w-[75%] animate-pulse rounded bg-flip-muted/20" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-flip-muted/15" />
        <div className="mt-2 flex gap-2">
          <div className="h-7 w-16 animate-pulse rounded-full bg-flip-muted/15" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-flip-muted/15" />
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
      <div
        className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:snap-none"
        aria-busy="true"
        aria-label="추천 곡을 불러오는 중"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <TrackCardSkeleton key={i} />
        ))}
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
    <div className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:snap-none">
      {tracks.map((track) => (
        <div key={track.id} className="snap-start md:snap-none">
          <TrackCard
            track={track}
            isSelected={selectedId === track.id}
            onSelect={onSelect}
            hideInlinePreview={selectedId === track.id}
          />
        </div>
      ))}
    </div>
  );
}
