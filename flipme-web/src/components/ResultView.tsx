"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import SelectedTrackDock from "@/components/SelectedTrackDock";
import TrackList from "@/components/TrackList";
import { useFlipStore } from "@/store/useFlipStore";
import type { DeezerTrack } from "@/types";

export default function ResultView() {
  const analysis = useFlipStore((s) => s.analysis);
  const recommendations = useFlipStore((s) => s.recommendations);
  const setRecommendations = useFlipStore((s) => s.setRecommendations);
  const isRecommending = useFlipStore((s) => s.isRecommending);
  const setIsRecommending = useFlipStore((s) => s.setIsRecommending);
  const selectedTrack = useFlipStore((s) => s.selectedTrack);
  const setSelectedTrack = useFlipStore((s) => s.setSelectedTrack);

  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!analysis) {
      return;
    }
    setError(null);
    setIsRecommending(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });
      const data = (await res.json()) as { tracks?: DeezerTrack[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "추천 요청에 실패했습니다.");
      }
      setRecommendations(data.tracks ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "추천을 불러오지 못했습니다. 다시 시도해주세요.";
      setError(message);
      setRecommendations([]);
    } finally {
      setIsRecommending(false);
    }
  }, [analysis, setIsRecommending, setRecommendations]);

  useEffect(() => {
    if (!analysis) {
      return;
    }
    void load();
  }, [analysis, load]);

  if (!analysis) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">
        <p className="text-center font-display text-xl font-semibold text-flip-primary">
          분석 결과가 없습니다
        </p>
        <p className="max-w-sm text-center text-sm text-flip-muted">
          홈에서 사진을 업로드하고 분석한 뒤 이 페이지로 이동해주세요.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-flip-accent underline-offset-4 hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen px-4 py-8 sm:px-6 ${selectedTrack ? "pb-52" : ""}`}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="text-center">
          <h1 className="font-display text-2xl font-semibold text-flip-primary sm:text-3xl">
            당신의 분위기에 맞는 곡
          </h1>
          <p className="mt-2 text-sm text-flip-muted">
            {analysis.mood} · {analysis.scene}
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-flip-accent/30 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-flip-accent" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded-full bg-flip-primary px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              다시 시도
            </button>
          </div>
        ) : null}

        {!error ? (
          <section aria-label="추천 곡 목록">
            <TrackList
              tracks={recommendations}
              selectedId={selectedTrack?.id ?? null}
              onSelect={setSelectedTrack}
              isLoading={isRecommending}
            />
          </section>
        ) : null}

        <div className="flex justify-center pb-8">
          <Link
            href="/"
            className="text-sm font-medium text-flip-muted underline-offset-4 hover:text-flip-accent hover:underline"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
      <SelectedTrackDock />
    </main>
  );
}
