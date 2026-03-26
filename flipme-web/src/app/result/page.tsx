import Link from "next/link";

export default function ResultPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">
      <p className="text-center font-display text-xl font-semibold text-flip-primary">
        음악 추천
      </p>
      <p className="max-w-sm text-center text-sm text-flip-muted">
        다음 단계에서 이 화면에 추천 곡이 표시됩니다.
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
