import type { PhotoAnalysis } from "@/types";

export interface QueryStrategy {
  queries: string[];
  genreHints: string[];
  energyRange: [number, number];
}

const moodToGenre: Record<string, string[]> = {
  잔잔한: ["acoustic", "indie folk", "ambient"],
  활기찬: ["pop", "dance", "upbeat"],
  몽환적인: ["dream pop", "shoegaze", "chillwave"],
  쓸쓸한: ["indie", "lo-fi", "ballad"],
  따뜻한: ["bossa nova", "jazz", "acoustic"],
  도시적인: ["r&b", "neo soul", "city pop"],
  자유로운: ["surf rock", "indie pop", "tropical"],
  고요한: ["classical", "piano", "ambient"],
};

function resolveMoodGenres(mood: string): string[] {
  const m = mood.trim();
  if (moodToGenre[m]) {
    return moodToGenre[m];
  }
  for (const key of Object.keys(moodToGenre)) {
    if (m.includes(key)) {
      return moodToGenre[key];
    }
  }
  return ["indie", "alternative", "pop"];
}

function pushUniqueQuery(list: string[], q: string): void {
  const normalized = q.replace(/\s+/g, " ").trim();
  if (!normalized || list.includes(normalized)) {
    return;
  }
  list.push(normalized);
}

export function buildSearchQueries(analysis: PhotoAnalysis): QueryStrategy {
  const genres = resolveMoodGenres(analysis.mood);
  const tempoHint =
    analysis.energy < 0.3 ? "slow" : analysis.energy < 0.6 ? "medium" : "upbeat";

  const kw = analysis.keywords.map((k) => k.trim()).filter(Boolean);
  const g0 = genres[0] ?? "indie";
  const g1 = genres[1] ?? g0;
  const g2 = genres[2] ?? g0;

  const queries: string[] = [];

  pushUniqueQuery(
    queries,
    [kw[0], kw[1], g0, tempoHint].filter(Boolean).join(" "),
  );
  pushUniqueQuery(
    queries,
    [kw[2] ?? kw[0], kw[3] ?? kw[1], g1].filter(Boolean).join(" "),
  );
  pushUniqueQuery(
    queries,
    [kw[4] ?? kw[2] ?? kw[0], g2, tempoHint].filter(Boolean).join(" "),
  );

  if (queries.length < 2) {
    pushUniqueQuery(queries, [kw[0] || "chill", g0, "music"].join(" "));
  }
  if (queries.length < 2) {
    pushUniqueQuery(queries, [g1, "relax", "playlist"].join(" "));
  }

  const spread = 0.4;
  const energyRange: [number, number] = [
    Math.max(0, analysis.energy - spread),
    Math.min(1, analysis.energy + spread),
  ];

  return {
    queries: queries.slice(0, 3),
    genreHints: genres,
    energyRange,
  };
}
