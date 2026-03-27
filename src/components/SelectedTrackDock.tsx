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
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-flip-surface sm:h-14 sm:w-14">
            <Image
              src={selectedTrack.albumCoverUrl}
              alt={`${selectedTrack.title} 앨범 커버`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 44px, 56px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xs font-semibold text-flip-primary sm:text-sm">
              {selectedTrack.title}
            </p>
            <p className="truncate text-[11px] text-flip-muted sm:text-xs">{selectedTrack.artist}</p>
          </div>
        </div>
        <AudioPlayer track={selectedTrack} compact={false} />
        <Link
          href="/card"
          className="block w-full rounded-full bg-flip-accent py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:py-3"
          aria-label="공유 카드 페이지로 이동"
        >
          공유 카드 만들기 →
        </Link>
      </div>
    </div>
  );
}
