"use client";

import Image from "next/image";
import AudioPlayer from "@/components/AudioPlayer";
import type { DeezerTrack } from "@/types";

export interface TrackCardProps {
  track: DeezerTrack;
  isSelected: boolean;
  onSelect: (track: DeezerTrack) => void;
  /** 선택된 곡은 하단 독에서만 미리듣기(오디오 엘리먼트 중복 방지) */
  hideInlinePreview?: boolean;
}

export default function TrackCard({
  track,
  isSelected,
  onSelect,
  hideInlinePreview = false,
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
        {hideInlinePreview ? (
          <p className="text-[10px] text-flip-muted">
            미리듣기는 하단 플레이어에서 재생할 수 있어요.
          </p>
        ) : (
          <AudioPlayer
            trackId={track.id}
            previewUrl={track.previewUrl}
            compact
          />
        )}
        <button
          type="button"
          onClick={() => onSelect(track)}
          className={`mt-1 w-full rounded-full px-3 py-2 text-xs font-semibold transition-opacity ${
            isSelected
              ? "bg-flip-primary text-white"
              : "bg-flip-accent text-white hover:opacity-90"
          }`}
        >
          이 곡 선택
        </button>
      </div>
    </article>
  );
}
