"use client";

import Image from "next/image";
import type { DeezerTrack } from "@/types";

export interface TrackCardProps {
  track: DeezerTrack;
  isSelected: boolean;
  onSelect: (track: DeezerTrack) => void;
}

export default function TrackCard({
  track,
  isSelected,
  onSelect,
}: TrackCardProps) {
  return (
    <article
      className={`flex w-[min(100%,18rem)] shrink-0 gap-3 rounded-2xl border p-4 shadow-sm transition-colors md:min-w-0 md:w-full ${
        isSelected
          ? "border-flip-accent bg-flip-accent/5 ring-2 ring-flip-accent/30"
          : "border-flip-muted/15 bg-white"
      }`}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-flip-surface">
        <Image
          src={track.albumCoverUrl}
          alt={`${track.title} 앨범 커버`}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-semibold text-flip-primary">
            {track.title}
          </h3>
          <p className="truncate text-xs text-flip-muted">{track.artist}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="rounded-full border border-flip-muted/30 px-3 py-1 text-xs text-flip-muted"
            aria-label="미리듣기는 다음 단계에서 제공됩니다"
          >
            미리듣기
          </button>
          <button
            type="button"
            onClick={() => onSelect(track)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-opacity ${
              isSelected
                ? "bg-flip-primary text-white"
                : "bg-flip-accent text-white hover:opacity-90"
            }`}
          >
            이 곡 선택
          </button>
        </div>
      </div>
    </article>
  );
}
