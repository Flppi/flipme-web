"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import ExportButtons from "@/components/ExportButtons";
import { useFlipStore } from "@/store/useFlipStore";

export default function CardPageContent() {
  const router = useRouter();
  const uploadedImage = useFlipStore((s) => s.uploadedImage);
  const analysis = useFlipStore((s) => s.analysis);
  const selectedTrack = useFlipStore((s) => s.selectedTrack);
  const reset = useFlipStore((s) => s.reset);
  const trackEvent = useFlipStore((s) => s.trackEvent);

  const lastCardCreateTrackId = useRef<number | null>(null);

  useEffect(() => {
    if (!uploadedImage || !analysis || !selectedTrack) {
      return;
    }
    if (lastCardCreateTrackId.current === selectedTrack.id) {
      return;
    }
    lastCardCreateTrackId.current = selectedTrack.id;
    trackEvent({
      eventType: "card_create",
      trackId: selectedTrack.id,
      trackTitle: selectedTrack.title,
      trackArtist: selectedTrack.artist,
      layer: selectedTrack.layer,
      photoMood: analysis.mood,
      photoEnergy: analysis.energy,
    });
  }, [analysis, selectedTrack, trackEvent, uploadedImage]);

  useEffect(() => {
    if (!uploadedImage || !analysis || !selectedTrack) {
      router.replace("/");
    }
  }, [uploadedImage, analysis, selectedTrack, router]);

  if (!uploadedImage || !analysis || !selectedTrack) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
        <p className="text-sm text-flip-muted">홈으로 이동하고 있어요...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6 animate-fade-in sm:px-6 sm:py-10 lg:items-center">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6 text-center sm:mb-8 lg:text-left">
          <h1 className="font-display text-xl font-semibold text-flip-primary sm:text-2xl">
            공유 카드
          </h1>
          <p className="mt-1.5 text-sm text-flip-muted sm:mt-2">
            {selectedTrack.title} — {selectedTrack.artist}
          </p>
          <p className="mt-1 text-xs text-flip-muted">
            카드 이미지 편집(TASK-4) 전까지 미리보기 영역은 플레이스홀더입니다.
          </p>
        </header>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:items-start">
          <div className="mx-auto flex aspect-[9/16] max-h-[min(50vh,400px)] w-full max-w-xs flex-col items-center justify-center rounded-2xl border-2 border-dashed border-flip-muted/35 bg-white/80 px-6 text-center text-sm text-flip-muted sm:max-h-[min(70vh,520px)] sm:max-w-sm lg:mx-0">
            <p>카드 미리보기</p>
            <p className="mt-2 text-xs">1080×1920 스토리 비율</p>
          </div>

          <div className="flex flex-col gap-5 sm:gap-8">
            <div
              className="rounded-2xl border border-flip-muted/20 bg-flip-muted/10 px-4 py-5 text-center text-xs text-flip-muted sm:py-6"
              role="status"
              aria-label="카드 생성 준비 중"
            >
              <p className="font-medium text-flip-primary">
                감각적인 카드를 만들고 있어요...
              </p>
              <div
                className="mx-auto mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-flip-muted/25"
                aria-hidden
              >
                <div className="h-full w-2/5 animate-pulse rounded-full bg-flip-accent" />
              </div>
              <p className="mt-3">
                html2canvas 기반 보내기는 TASK-4에서 연결됩니다.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  trackEvent({
                    eventType: "card_share",
                    trackId: selectedTrack.id,
                    trackTitle: selectedTrack.title,
                    trackArtist: selectedTrack.artist,
                    layer: selectedTrack.layer,
                    photoMood: analysis.mood,
                    photoEnergy: analysis.energy,
                  });
                }}
                className="rounded-full bg-flip-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 sm:px-6 sm:py-3"
              >
                인스타에 공유 (준비 중)
              </button>
              <button
                type="button"
                onClick={() => {
                  trackEvent({
                    eventType: "card_download",
                    trackId: selectedTrack.id,
                    trackTitle: selectedTrack.title,
                    trackArtist: selectedTrack.artist,
                    layer: selectedTrack.layer,
                    photoMood: analysis.mood,
                    photoEnergy: analysis.energy,
                  });
                }}
                className="rounded-full border border-flip-muted/40 px-5 py-2.5 text-sm font-medium text-flip-primary transition-colors hover:border-flip-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 sm:px-6 sm:py-3"
              >
                이미지 저장 (준비 중)
              </button>
            </div>

            <ExportButtons track={selectedTrack} variant="full" />
            <div className="flex flex-col items-center gap-3 pb-8 sm:pb-12">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm font-medium text-flip-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 rounded-md px-2 py-1"
              >
                다른 곡 선택하기
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                  router.push("/");
                }}
                className="text-sm text-flip-muted underline-offset-4 hover:text-flip-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 rounded-md px-2 py-1"
              >
                새 사진 업로드
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
