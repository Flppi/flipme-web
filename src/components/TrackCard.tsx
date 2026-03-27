"use client";

import Image from "next/image";
import AudioPlayer from "@/components/AudioPlayer";
import ExportButtons from "@/components/ExportButtons";
import { useFlipStore } from "@/store/useFlipStore";
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
  const analysis = useFlipStore((s) => s.analysis);
  const trackEvent = useFlipStore((s) => s.trackEvent);

  return (
    <article
      className={`flex w-full shrink-0 flex-col rounded-2xl border p-3 shadow-sm transition-colors ${
        isSelected
          ? "border-flip-accent bg-flip-accent/5 ring-2 ring-flip-accent/30"
          : "border-flip-muted/15 bg-white"
      }`}
    >
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-flip-surface">
          <Image
            src={track.albumCoverUrl}
            alt={`${track.title} 앨범 커버`}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <h3 className="truncate font-display text-sm font-semibold text-flip-primary">
            {track.title}
          </h3>
          <p className="truncate text-xs text-flip-muted">{track.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            trackEvent({
              eventType: "track_select",
              trackId: track.id,
              trackTitle: track.title,
              trackArtist: track.artist,
              layer: track.layer,
              photoMood: analysis?.mood,
              photoEnergy: analysis?.energy,
            });
            onSelect(track);
          }}
          className={`my-auto shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity ${
            isSelected
              ? "bg-flip-primary text-white"
              : "bg-flip-accent text-white hover:opacity-90"
          }`}
        >
          {isSelected ? "선택됨" : "선택"}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          {hideInlinePreview ? (
            <p className="text-[10px] text-flip-muted">
              하단 플레이어에서 재생
            </p>
          ) : (
            <AudioPlayer track={track} compact />
          )}
        </div>
        <ExportButtons track={track} variant="compact" />
      </div>
    </article>
  );
}
