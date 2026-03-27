import type { ExportLink, ExportPlatform } from "@/types";

export const DEFAULT_EXPORT_PLATFORMS: ExportPlatform[] = [
  "spotify",
  "apple-music",
  "youtube-music",
];

export function buildExportLink(
  platform: ExportPlatform,
  title: string,
  artist: string,
): ExportLink {
  const q = encodeURIComponent(`${title} ${artist}`);
  let url: string;
  switch (platform) {
    case "spotify":
      url = `https://open.spotify.com/search/${q}`;
      break;
    case "apple-music":
      url = `https://music.apple.com/search?term=${q}`;
      break;
    case "youtube-music":
      url = `https://music.youtube.com/search?q=${q}`;
      break;
    default:
      url = "";
  }
  return { platform, url, available: url.length > 0 };
}

export function buildExportLinks(
  title: string,
  artist: string,
  platforms: ExportPlatform[],
): ExportLink[] {
  return platforms.map((p) => buildExportLink(p, title, artist));
}

export function isExportPlatform(value: string): value is ExportPlatform {
  return (
    value === "spotify" ||
    value === "apple-music" ||
    value === "youtube-music"
  );
}
