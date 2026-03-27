"use client";

import { useMemo } from "react";
import {
  buildExportLinks,
  DEFAULT_EXPORT_PLATFORMS,
} from "@/lib/export-links";
import type { DeezerTrack, ExportLink, ExportPlatform } from "@/types";

interface ExportButtonsProps {
  track: DeezerTrack;
  variant?: "compact" | "full";
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.35c-.24.36-.66.48-1.02.24a8.97 8.97 0 00-10.56-1.14c-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9a10.2 10.2 0 0111.64 1.32c.36.24.48.66.24 1.02l-.18.3zm1.44-3.3c-.3.42-.84.6-1.26.3a11.04 11.04 0 00-11.94-1.38c-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 3.36-1.02 8.52-.6 11.64 1.32.36.18.54.78.24 1.2l-.24.3zm.12-3.36c-3.72-2.28-9.6-2.52-13.08-1.38-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3h-.24z" />
    </svg>
  );
}

function AppleMusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function YoutubeMusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function DeezerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3" y="10" width="3.2" height="10" rx="0.6" />
      <rect x="8.2" y="6" width="3.2" height="14" rx="0.6" />
      <rect x="13.4" y="8" width="3.2" height="12" rx="0.6" />
      <rect x="18.6" y="4" width="3.2" height="16" rx="0.6" />
    </svg>
  );
}

function platformLabel(platform: ExportPlatform | "deezer"): string {
  switch (platform) {
    case "spotify":
      return "Spotify";
    case "apple-music":
      return "Apple Music";
    case "youtube-music":
      return "YouTube Music";
    case "deezer":
      return "Deezer";
  }
}

function PlatformGlyph({
  platform,
  className,
}: {
  platform: ExportPlatform | "deezer";
  className?: string;
}) {
  const cls = className ?? "h-5 w-5";
  switch (platform) {
    case "spotify":
      return <SpotifyIcon className={cls} />;
    case "apple-music":
      return <AppleMusicIcon className={cls} />;
    case "youtube-music":
      return <YoutubeMusicIcon className={cls} />;
    case "deezer":
      return <DeezerIcon className={cls} />;
  }
}

const BRAND_RING: Record<ExportPlatform | "deezer", string> = {
  spotify: "bg-[#1DB954] text-white focus-visible:ring-[#1DB954]",
  "apple-music": "bg-[#FA243C] text-white focus-visible:ring-[#FA243C]",
  "youtube-music": "bg-[#FF0000] text-white focus-visible:ring-[#FF0000]",
  deezer: "bg-[#121216] text-[#FEAA2D] focus-visible:ring-[#FEAA2D]",
};

export default function ExportButtons({
  track,
  variant = "full",
}: ExportButtonsProps) {
  const links: ExportLink[] = useMemo(
    () => buildExportLinks(track.title, track.artist, DEFAULT_EXPORT_PLATFORMS),
    [track.artist, track.title],
  );

  if (variant === "compact") {
    return (
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="플랫폼에서 듣기"
      >
        {links.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${BRAND_RING[link.platform]}`}
            aria-label={`${platformLabel(link.platform)}에서 열기`}
          >
            <PlatformGlyph platform={link.platform} className="h-4 w-4" />
          </a>
        ))}
        <a
          href={track.deezerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${BRAND_RING.deezer}`}
          aria-label="Deezer에서 이 곡 열기"
        >
          <PlatformGlyph platform="deezer" className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <section
      className="w-full rounded-2xl border border-flip-muted/20 bg-white p-4 shadow-sm"
      aria-labelledby="export-heading"
    >
      <h2
        id="export-heading"
        className="mb-3 text-center font-display text-sm font-semibold text-flip-primary"
      >
        이 곡을 내 플랫폼에서 듣기
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {links.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${BRAND_RING[link.platform]}`}
          >
            <PlatformGlyph platform={link.platform} className="h-5 w-5 shrink-0" />
            {platformLabel(link.platform)}
          </a>
        ))}
        <a
          href={track.deezerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${BRAND_RING.deezer}`}
        >
          <PlatformGlyph platform="deezer" className="h-5 w-5 shrink-0" />
          {platformLabel("deezer")}
        </a>
      </div>
    </section>
  );
}
