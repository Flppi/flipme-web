import type { DeezerTrack } from "@/types";

const DEEZER_BASE = "https://api.deezer.com";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface DeezerErrorBody {
  error?: { type?: string; message?: string; code?: number };
}

interface DeezerRawTrack {
  id: number;
  title: string;
  duration: number;
  preview?: string;
  link: string;
  artist?: { name?: string };
  album?: { title?: string; cover_big?: string };
}

interface DeezerSearchSuccess {
  data?: DeezerRawTrack[];
}

function mapRawTrack(track: DeezerRawTrack): DeezerTrack | null {
  const preview = track.preview;
  const artistName = track.artist?.name;
  const albumTitle = track.album?.title;
  const cover = track.album?.cover_big;
  if (
    !preview ||
    !artistName ||
    !albumTitle ||
    !cover ||
    typeof track.id !== "number" ||
    typeof track.title !== "string" ||
    typeof track.duration !== "number" ||
    typeof track.link !== "string"
  ) {
    return null;
  }
  return {
    id: track.id,
    title: track.title,
    artist: artistName,
    album: albumTitle,
    albumCoverUrl: cover,
    previewUrl: preview,
    deezerUrl: track.link,
    duration: track.duration,
  };
}

async function fetchDeezerSearch(url: string): Promise<Response> {
  let res = await fetch(url, { next: { revalidate: 3600 } });
  if (res.status === 429) {
    await delay(2000);
    res = await fetch(url, { next: { revalidate: 3600 } });
  }
  return res;
}

export async function searchTracks(
  query: string,
  limit: number = 25,
): Promise<DeezerTrack[]> {
  const url = `${DEEZER_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetchDeezerSearch(url);

  const json = (await res.json()) as DeezerSearchSuccess & DeezerErrorBody;

  if (!res.ok || json.error) {
    const msg = json.error?.message ?? res.statusText;
    throw new Error(`Deezer API error: ${res.status} ${msg}`);
  }

  const rows = json.data;
  if (!rows || !Array.isArray(rows)) {
    return [];
  }

  const mapped: DeezerTrack[] = [];
  for (const row of rows) {
    if (row.preview) {
      const t = mapRawTrack(row);
      if (t) {
        mapped.push(t);
      }
    }
  }
  return mapped;
}

export async function searchTracksSequential(
  queries: string[],
  limit: number,
  delayBetweenMs: number,
): Promise<DeezerTrack[][]> {
  const out: DeezerTrack[][] = [];
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) {
      await delay(delayBetweenMs);
    }
    out.push(await searchTracks(queries[i], limit));
  }
  return out;
}
