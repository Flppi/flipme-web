"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MoodDisplay from "@/components/MoodDisplay";
import SelectedTrackDock from "@/components/SelectedTrackDock";
import TrackList from "@/components/TrackList";
import {
  cancelAnalyzeStream,
  isStreamActive,
  startAnalyzeStream,
} from "@/lib/stream-client";
import { useFlipStore } from "@/store/useFlipStore";

export default function ResultView() {
  const router = useRouter();
  const uploadedImage = useFlipStore((s) => s.uploadedImage);
  const analysis = useFlipStore((s) => s.analysis);
  const recommendations = useFlipStore((s) => s.recommendations);
  const isRecommending = useFlipStore((s) => s.isRecommending);
  const selectedTrack = useFlipStore((s) => s.selectedTrack);
  const setSelectedTrack = useFlipStore((s) => s.setSelectedTrack);

  useEffect(() => {
    if (!uploadedImage) {
      router.replace("/");
    }
  }, [uploadedImage, router]);

  useEffect(() => {
    if (!uploadedImage) return;
    if (analysis || isRecommending || isStreamActive()) return;
    if (recommendations.length > 0) return;
    startAnalyzeStream(uploadedImage);
  }, [uploadedImage, analysis, isRecommending, recommendations.length]);

  if (!uploadedImage) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <p className="text-sm text-flip-muted">홈으로 이동하고 있어요...</p>
      </main>
    );
  }

  const showLoading = isRecommending && recommendations.length === 0 && !analysis;

  const gradientBg =
    analysis?.colors?.length && analysis.colors.length >= 2
      ? {
          background: `linear-gradient(135deg, ${analysis.colors[0]}12, ${analysis.colors[1]}0A, transparent 60%)`,
          backgroundSize: "200% 200%",
        }
      : undefined;

  return (
    <main
      className={`flex flex-1 flex-col px-4 py-6 animate-fade-in sm:px-6 sm:py-8 lg:items-center ${selectedTrack ? "pb-[13rem] sm:pb-56" : ""}`}
      style={gradientBg}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-8 lg:max-w-4xl">
        {analysis ? (
          <header className="text-center animate-fade-in">
            <h1 className="font-display text-xl font-semibold text-flip-primary sm:text-2xl md:text-3xl">
              당신의 분위기에 맞는 곡
            </h1>
            <p className="mt-1.5 text-sm text-flip-muted sm:mt-2">
              {analysis.mood} · {analysis.scene}
            </p>
          </header>
        ) : isRecommending ? (
          <header className="text-center">
            <div className="mx-auto mb-3 flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-flip-muted/30 border-t-flip-accent" />
            </div>
            <h1 className="font-display text-xl font-semibold text-flip-primary sm:text-2xl md:text-3xl">
              사진을 분석하고 있어요
            </h1>
            <p className="mt-1.5 text-sm text-flip-muted sm:mt-2">
              분위기와 감성을 읽는 중...
            </p>
          </header>
        ) : (
          <header className="text-center">
            <h1 className="font-display text-xl font-semibold text-flip-primary sm:text-2xl md:text-3xl">
              분석 준비 중
            </h1>
            <p className="mt-1.5 text-sm text-flip-muted sm:mt-2">
              잠시만 기다려 주세요
            </p>
          </header>
        )}

        {analysis ? <MoodDisplay /> : null}

        <section aria-label="추천 곡 목록">
          <TrackList
            tracks={recommendations}
            selectedId={selectedTrack?.id ?? null}
            onSelect={setSelectedTrack}
            isLoading={showLoading}
            isStreaming={isRecommending}
          />
        </section>

        {!isRecommending && recommendations.length === 0 && analysis ? (
          <div className="rounded-2xl border border-flip-accent/30 bg-white p-4 text-center shadow-sm sm:p-6">
            <p className="text-sm text-flip-accent" role="alert">
              추천 곡을 찾지 못했어요. 다시 시도해 주세요.
            </p>
            <button
              type="button"
              onClick={() => {
                cancelAnalyzeStream();
                if (uploadedImage) startAnalyzeStream(uploadedImage);
              }}
              className="mt-3 rounded-full bg-flip-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 sm:mt-4 sm:px-6 sm:py-2.5"
              aria-label="추천 목록 다시 불러오기"
            >
              다시 시도
            </button>
          </div>
        ) : null}

        <div className="flex justify-center pb-4 sm:pb-8">
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
