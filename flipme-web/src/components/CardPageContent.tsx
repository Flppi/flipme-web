"use client";

import Link from "next/link";
import ExportButtons from "@/components/ExportButtons";
import { useFlipStore } from "@/store/useFlipStore";

export default function CardPageContent() {
  const selectedTrack = useFlipStore((s) => s.selectedTrack);

  if (!selectedTrack) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">
        <h1 className="text-center font-display text-xl font-semibold text-flip-primary">
          공유 카드
        </h1>
        <p className="max-w-sm text-center text-sm text-flip-muted">
          먼저 추천 목록에서 곡을 선택한 뒤 다시 와주세요. (카드 에디터는 곧
          추가됩니다.)
        </p>
        <Link
          href="/result"
          className="text-sm font-medium text-flip-accent underline-offset-4 hover:underline"
        >
          추천 목록으로
        </Link>
        <Link
          href="/"
          className="text-sm text-flip-muted underline-offset-4 hover:text-flip-accent hover:underline"
        >
          홈으로
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <header className="text-center">
          <h1 className="font-display text-2xl font-semibold text-flip-primary">
            공유 카드
          </h1>
          <p className="mt-2 text-sm text-flip-muted">
            {selectedTrack.title} — {selectedTrack.artist}
          </p>
          <p className="mt-1 text-xs text-flip-muted">
            카드 이미지 편집은 다음 작업에서 이 페이지에 붙습니다.
          </p>
        </header>
        <ExportButtons track={selectedTrack} variant="full" />
        <div className="flex flex-col items-center gap-3 pb-12">
          <Link
            href="/result"
            className="text-sm font-medium text-flip-accent underline-offset-4 hover:underline"
          >
            다른 곡 선택하기
          </Link>
          <Link
            href="/"
            className="text-sm text-flip-muted underline-offset-4 hover:text-flip-primary hover:underline"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
