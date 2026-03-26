import MoodDisplay from "@/components/MoodDisplay";
import PhotoUploader from "@/components/PhotoUploader";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-lg flex-col gap-10">
        <header className="text-center animate-fade-in">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-flip-primary sm:text-4xl">
            FlipMe
          </h1>
          <p className="mt-2 text-sm text-flip-muted sm:text-base">
            사진 한 장으로 오늘의 플레이리스트 감성을 찾아보세요.
          </p>
        </header>
        <PhotoUploader />
        <MoodDisplay />
      </div>
    </main>
  );
}
