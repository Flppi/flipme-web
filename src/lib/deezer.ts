import type { AISongRecommendation, DeezerSearchHit, DeezerTrack } from "@/types";

const DEEZER_BASE = "https://api.deezer.com";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ── In-memory search cache ───────────────────────────────────────────

interface CacheEntry {
  hits: DeezerSearchHit[];
  ts: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

function getCached(key: string): DeezerSearchHit[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return entry.hits;
}

function setCache(key: string, hits: DeezerSearchHit[]) {
  if (searchCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = searchCache.keys().next().value;
    if (oldest) searchCache.delete(oldest);
  }
  searchCache.set(key, { hits, ts: Date.now() });
}

// ── Deezer API helpers ───────────────────────────────────────────────

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
  const cacheKey = `${query}::${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

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

  setCache(cacheKey, mapped);
  return mapped;
}

/** 한 곡을 Deezer에서 검색·매칭 (내부 헬퍼) */
async function matchSingle(
  song: AISongRecommendation,
): Promise<{ hit: DeezerSearchHit; song: AISongRecommendation } | null> {
  const query = `${song.artist} ${song.title}`;
  const results = await searchTracks(query, 5);

  const strict = results.find(
    (t) =>
      t.previewUrl &&
      isSimilar(t.title, song.title) &&
      isSimilar(t.artist, song.artist),
  );
  const relaxed =
    strict ??
    results.find(
      (t) =>
        t.previewUrl &&
        (isSimilar(t.title, song.title) || isSimilar(t.artist, song.artist)),
    );

  return relaxed ? { hit: relaxed, song } : null;
}

/** 스트리밍 API에서 사용: 단일 곡 Deezer 매칭 후 DeezerTrack 반환 */
export async function matchSongOnDeezer(song: AISongRecommendation): Promise<DeezerTrack | null> {
  const result = await matchSingle(song);
  if (!result) return null;
  return {
    ...result.hit,
    layer: song.layer,
    reason: song.reason,
  };
}

/** GPT가 추천한 곡을 Deezer에서 곡명·아티스트 기준으로 전체 병렬 매칭한다. */
export async function findTracksOnDeezer(songs: AISongRecommendation[]): Promise<DeezerTrack[]> {
  const results = await Promise.allSettled(songs.map(matchSingle));

  const found: DeezerTrack[] = [];
  const seenIds = new Set<number>();

  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) {
      continue;
    }
    const { hit, song } = r.value;
    if (seenIds.has(hit.id)) {
      continue;
    }
    seenIds.add(hit.id);
    found.push({
      ...hit,
      layer: song.layer,
      reason: song.reason,
    });
  }

  return found;
}
