"use client";

import Image from "next/image";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import { useFlipStore } from "@/store/useFlipStore";

export default function SelectedTrackDock() {
  const selectedTrack = useFlipStore((s) => s.selectedTrack);

  if (!selectedTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-flip-muted/20 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(26,26,46,0.08)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-flip-surface">
            <Image
              src={selectedTrack.albumCoverUrl}
              alt={`${selectedTrack.title} 앨범 커버`}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-flip-primary">
              {selectedTrack.title}
            </p>
            <p className="truncate text-xs text-flip-muted">{selectedTrack.artist}</p>
          </div>
        </div>
        <AudioPlayer
          trackId={selectedTrack.id}
          previewUrl={selectedTrack.previewUrl}
          compact={false}
        />
        <Link
          href="/card"
          className="block w-full rounded-full bg-flip-accent py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          공유 카드 만들기 →
        </Link>
      </div>
    </div>
  );
}
