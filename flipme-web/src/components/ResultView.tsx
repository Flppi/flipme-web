"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import MoodDisplay from "@/components/MoodDisplay";
import SelectedTrackDock from "@/components/SelectedTrackDock";
import TrackList from "@/components/TrackList";
import { useFlipStore } from "@/store/useFlipStore";
import type { DeezerTrack, PhotoAnalysis } from "@/types";

export default function ResultView() {
  const router = useRouter();
  const uploadedImage = useFlipStore((s) => s.uploadedImage);
  const analysis = useFlipStore((s) => s.analysis);
  const recommendations = useFlipStore((s) => s.recommendations);
  const setAnalysis = useFlipStore((s) => s.setAnalysis);
  const setRecommendations = useFlipStore((s) => s.setRecommendations);
  const isRecommending = useFlipStore((s) => s.isRecommending);
  const setIsRecommending = useFlipStore((s) => s.setIsRecommending);
  const selectedTrack = useFlipStore((s) => s.selectedTrack);
  const setSelectedTrack = useFlipStore((s) => s.setSelectedTrack);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadedImage || !analysis) {
      router.replace("/");
    }
  }, [uploadedImage, analysis, router]);

  const load = useCallback(async () => {
    if (!uploadedImage || !analysis) {
      return;
    }
    setError(null);
    setIsRecommending(true);
    try {
      const res = await fetch("/api/analyze-and-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadedImage }),
      });
      const data = (await res.json()) as {
        analysis?: PhotoAnalysis;
        tracks?: DeezerTrack[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : "recommend-fail",
        );
      }
      if (!data.analysis || !data.tracks?.length) {
        throw new Error("empty-tracks");
      }
      setAnalysis(data.analysis);
      setRecommendations(data.tracks);
    } catch {
      setError("잠시 문제가 생겼어요. 다시 시도해 주세요.");
      setRecommendations([]);
    } finally {
      setIsRecommending(false);
    }
  }, [
    analysis,
    uploadedImage,
    setAnalysis,
    setIsRecommending,
    setRecommendations,
  ]);

  useEffect(() => {
    if (!analysis || !uploadedImage) {
      return;
    }
    if (recommendations.length > 0) {
      return;
    }
    void load();
  }, [analysis, uploadedImage, recommendations.length, load]);

  if (!uploadedImage || !analysis) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <p className="text-sm text-flip-muted">홈으로 이동하고 있어요...</p>
      </main>
    );
  }

  return (
    <main
      className={`flex flex-1 flex-col px-4 py-8 animate-fade-in sm:px-6 lg:items-center ${selectedTrack ? "pb-52" : ""}`}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 lg:max-w-4xl">
        <header className="text-center">
          <h1 className="font-display text-2xl font-semibold text-flip-primary sm:text-3xl">
            당신의 분위기에 맞는 곡
          </h1>
          <p className="mt-2 text-sm text-flip-muted">
            {analysis.mood} · {analysis.scene}
          </p>
        </header>

        <MoodDisplay />

        {error ? (
          <div className="rounded-2xl border border-flip-accent/30 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-flip-accent" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setRecommendations([]);
                void load();
              }}
              className="mt-4 rounded-full bg-flip-primary px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2"
              aria-label="추천 목록 다시 불러오기"
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
            className="text-sm font-medium text-flip-muted underline-offset-4 transition-colors hover:text-flip-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 rounded-md"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
      <SelectedTrackDock />
    </main>
  );
}
