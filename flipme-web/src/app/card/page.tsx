import Link from "next/link";

export default function CardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">
      <h1 className="text-center font-display text-xl font-semibold text-flip-primary">
        공유 카드
      </h1>
      <p className="max-w-sm text-center text-sm text-flip-muted">
        다음 단계에서 카드 에디터가 이 페이지에 연결됩니다.
      </p>
      <Link
        href="/result"
        className="text-sm font-medium text-flip-accent underline-offset-4 hover:underline"
      >
        추천 목록으로
      </Link>
    </main>
  );
}
