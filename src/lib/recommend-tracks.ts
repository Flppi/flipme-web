import type { DeezerTrack } from "@/types";

export function dedupeByTrackId(tracks: DeezerTrack[]): DeezerTrack[] {
  const seen = new Set<number>();
  return tracks.filter((t) => {
    if (seen.has(t.id)) {
      return false;
    }
    seen.add(t.id);
    return true;
  });
}

export function interleaveTrackLists(lists: DeezerTrack[][]): DeezerTrack[] {
  const out: DeezerTrack[] = [];
  const maxLen = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      const item = list[i];
      if (item) {
        out.push(item);
      }
    }
  }
  return out;
}

/** 곡 길이 기반 에너지 추정 (MVP 휴리스틱). */
export function estimateTrackEnergy(durationSec: number): number {
  if (durationSec <= 150) {
    return 0.82;
  }
  if (durationSec <= 200) {
    return 0.65;
  }
  if (durationSec <= 260) {
    return 0.45;
  }
  return 0.28;
}

export function rankByEnergyMatch(
  tracks: DeezerTrack[],
  targetEnergy: number,
): DeezerTrack[] {
  return [...tracks].sort(
    (a, b) =>
      Math.abs(estimateTrackEnergy(a.duration) - targetEnergy) -
      Math.abs(estimateTrackEnergy(b.duration) - targetEnergy),
  );
}

export function filterByEnergyRange(
  tracks: DeezerTrack[],
  range: [number, number],
  minKeep: number,
): DeezerTrack[] {
  const [lo, hi] = range;
  const filtered = tracks.filter((t) => {
    const e = estimateTrackEnergy(t.duration);
    return e >= lo && e <= hi;
  });
  return filtered.length >= minKeep ? filtered : tracks;
}

export function takeRecommendedSlice(
  tracks: DeezerTrack[],
  maxCount: number,
): DeezerTrack[] {
  return tracks.slice(0, Math.min(maxCount, tracks.length));
}
