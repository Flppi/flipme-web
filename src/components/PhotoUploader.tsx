"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { resizeImage } from "@/lib/resize-image";
import { useFlipStore } from "@/store/useFlipStore";
import type { DeezerTrack, PhotoAnalysis } from "@/types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return "10MB 이하의 사진만 올릴 수 있어요.";
  }
  if (!ALLOWED_TYPES.has(file.type) && !/\.(heic|heif)$/i.test(file.name)) {
    return "JPEG, PNG, WebP, HEIC 형식의 사진만 올릴 수 있어요.";
  }
  return null;
}

export default function PhotoUploader() {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadedImage = useFlipStore((s) => s.uploadedImage);
  const setUploadedImage = useFlipStore((s) => s.setUploadedImage);
  const setAnalysis = useFlipStore((s) => s.setAnalysis);
  const setRecommendations = useFlipStore((s) => s.setRecommendations);
  const isAnalyzing = useFlipStore((s) => s.isAnalyzing);
  const setIsAnalyzing = useFlipStore((s) => s.setIsAnalyzing);

  const [processError, setProcessError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setProcessError(null);
      setAnalyzeError(null);
      const validationError = validateImageFile(file);
      if (validationError) {
        setProcessError(validationError);
        return;
      }
      try {
        const dataUrl = await resizeImage(file, 1024, 0.8);
        setUploadedImage(dataUrl);
        setAnalysis(null);
        setRecommendations([]);
      } catch {
        setProcessError(
          "잠시 문제가 생겼어요. 다른 사진으로 다시 시도해 주세요.",
        );
      }
    },
    [setAnalysis, setRecommendations, setUploadedImage],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) void processFile(file);
    },
    [processFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!uploadedImage) return;
    setAnalyzeError(null);
    setIsAnalyzing(true);
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
        setAnalyzeError(
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : "잠시 문제가 생겼어요. 다시 시도해 주세요.",
        );
        return;
      }
      if (!data.analysis || !data.tracks?.length) {
        setAnalyzeError("잠시 문제가 생겼어요. 다시 시도해 주세요.");
        return;
      }
      setAnalysis(data.analysis);
      setRecommendations(data.tracks);
      router.push("/result");
    } catch {
      setAnalyzeError("잠시 문제가 생겼어요. 다시 시도해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [router, setAnalysis, setIsAnalyzing, setRecommendations, uploadedImage]);

  const showDropZone = !uploadedImage;

  return (
    <section className="flex w-full flex-col gap-4 animate-slide-up">
      {showDropZone ? (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              galleryInputRef.current?.click();
            }
          }}
          onClick={() => galleryInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-flip-muted/40 bg-white/60 px-6 py-12 text-center transition-colors hover:border-flip-accent/60 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-flip-surface text-flip-accent"
            aria-hidden
          >
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3A1.5 1.5 0 001.5 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008H12V8.25z"
              />
            </svg>
          </span>
          <p className="font-display text-base font-semibold text-flip-primary">
            사진을 올려주세요
          </p>
          <p className="text-sm text-flip-muted">
            끌어다 놓거나 탭해서 갤러리에서 선택
          </p>
        </div>
      ) : null}

      {!showDropZone && uploadedImage ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-flip-muted/20 bg-white p-4 shadow-sm">
          <div className="relative mx-auto h-72 w-full max-w-md overflow-hidden rounded-xl bg-flip-surface">
            <Image
              src={uploadedImage}
              alt="업로드한 사진 미리보기"
              fill
              unoptimized
              className={`object-contain transition-opacity duration-300 ${isAnalyzing ? "opacity-50" : "opacity-100"}`}
              sizes="(max-width: 640px) 100vw, 28rem"
            />
            {isAnalyzing ? (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/35 backdrop-blur-md animate-pulse-soft"
                aria-live="polite"
                aria-busy="true"
              >
                <div
                  className="h-14 w-14 rounded-full bg-gradient-to-br from-flip-warm to-flip-accent opacity-90"
                  aria-hidden
                />
                <p className="px-4 text-center text-sm font-medium text-flip-primary">
                  사진의 감성을 읽고 곡을 고르고 있어요...
                </p>
              </div>
            ) : null}
          </div>
          {!isAnalyzing ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleAnalyze}
                className="rounded-full bg-flip-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 active:opacity-80"
                aria-label="사진 분위기 분석하기"
              >
                분석하기
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadedImage(null);
                  setAnalysis(null);
                  setRecommendations([]);
                  setProcessError(null);
                  setAnalyzeError(null);
                }}
                className="rounded-full border border-flip-muted/40 px-6 py-3 text-sm font-medium text-flip-muted transition-colors hover:border-flip-accent hover:text-flip-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2"
                aria-label="다른 사진으로 바꾸기"
              >
                다른 사진 선택
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          disabled={isAnalyzing}
          onClick={() => galleryInputRef.current?.click()}
          className="rounded-full border border-flip-primary/20 bg-white px-5 py-2.5 text-sm font-medium text-flip-primary shadow-sm transition-colors hover:border-flip-accent hover:text-flip-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          aria-label="갤러리에서 사진 선택"
        >
          갤러리에서 선택
        </button>
        <button
          type="button"
          disabled={isAnalyzing}
          onClick={() => cameraInputRef.current?.click()}
          className="rounded-full border border-flip-primary/20 bg-white px-5 py-2.5 text-sm font-medium text-flip-primary shadow-sm transition-colors hover:border-flip-accent hover:text-flip-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          aria-label="카메라로 사진 촬영"
        >
          카메라로 촬영
        </button>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        aria-label="갤러리에서 이미지 선택"
        onChange={onFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        capture="environment"
        className="sr-only"
        aria-label="카메라로 사진 촬영"
        onChange={onFileChange}
      />

      {processError ? (
        <p className="text-center text-sm text-flip-accent" role="alert">
          {processError}
        </p>
      ) : null}
      {analyzeError ? (
        <p className="text-center text-sm text-flip-accent" role="alert">
          {analyzeError}
        </p>
      ) : null}
    </section>
  );
}
