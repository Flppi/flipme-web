import PhotoUploader from "@/components/PhotoUploader";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:items-center lg:py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 animate-fade-in lg:max-w-lg">
        <p className="text-center text-sm text-flip-muted sm:text-base">
          사진 한 장으로 오늘의 플레이리스트 감성을 찾아보세요.
        </p>
        <PhotoUploader />
      </div>
    </main>
  );
}
