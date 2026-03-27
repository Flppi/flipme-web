import type { AISongRecommendation, DeezerSearchHit, DeezerTrack } from "@/types";

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

function mapRawTrack(track: DeezerRawTrack): DeezerSearchHit | null {
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

/** 문자열 유사도(정규화 후 부분 일치) */
export function isSimilar(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
  const na = normalize(a);
  const nb = normalize(b);
  if (na.length === 0 || nb.length === 0) {
    return false;
  }
  return na.includes(nb) || nb.includes(na);
}

export async function searchTracks(
  query: string,
  limit: number = 25,
): Promise<DeezerSearchHit[]> {
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

  const mapped: DeezerSearchHit[] = [];
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

/** GPT가 추천한 곡을 Deezer에서 곡명·아티스트 기준으로 매칭한다. */
export async function findTracksOnDeezer(songs: AISongRecommendation[]): Promise<DeezerTrack[]> {
  const found: DeezerTrack[] = [];
  const seenIds = new Set<number>();

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const query = `${song.artist} ${song.title}`;
    const results = await searchTracks(query, 5);

    const strict = results.find(
      (t) =>
        t.previewUrl &&
        !seenIds.has(t.id) &&
        isSimilar(t.title, song.title) &&
        isSimilar(t.artist, song.artist),
    );
    const relaxed =
      strict ??
      results.find(
        (t) =>
          t.previewUrl &&
          !seenIds.has(t.id) &&
          (isSimilar(t.title, song.title) || isSimilar(t.artist, song.artist)),
      );

    if (relaxed) {
      seenIds.add(relaxed.id);
      found.push({
        ...relaxed,
        layer: song.layer,
        reason: song.reason,
      });
    }

    if (i < songs.length - 1) {
      await delay(200);
    }
  }

  return found;
}
