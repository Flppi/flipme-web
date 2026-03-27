"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { resizeImage } from "@/lib/resize-image";
import {
  cancelAnalyzeStream,
  isStreamActive,
  startAnalyzeStream,
} from "@/lib/stream-client";
import { useFlipStore } from "@/store/useFlipStore";

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const uploadedImage = useFlipStore((s) => s.uploadedImage);
  const setUploadedImage = useFlipStore((s) => s.setUploadedImage);
  const setAnalysis = useFlipStore((s) => s.setAnalysis);
  const setRecommendations = useFlipStore((s) => s.setRecommendations);
  const analysis = useFlipStore((s) => s.analysis);
  const isRecommending = useFlipStore((s) => s.isRecommending);

  const [processError, setProcessError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean | null>(null);
  const [navigating, setNavigating] = useState(false);

  // ── Camera lifecycle ──────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (uploadedImage) {
      stopCamera();
      return;
    }
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraReady(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      } catch {
        if (!cancelled) setCameraReady(false);
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [uploadedImage, stopCamera]);

  const videoCallbackRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (el && streamRef.current) {
        el.srcObject = streamRef.current;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (cameraReady && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraReady]);

  // ── Image handling (triggers stream) ───────────────────────────────

  const setImage = useCallback(
    (dataUrl: string) => {
      setUploadedImage(dataUrl);
      setAnalysis(null);
      setRecommendations([]);
      setProcessError(null);
      setAnalyzeError(null);
      startAnalyzeStream(dataUrl);
    },
    [setUploadedImage, setAnalysis, setRecommendations],
  );

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
        const dataUrl = await resizeImage(file, 512, 0.6);
        setImage(dataUrl);
      } catch {
        setProcessError(
          "잠시 문제가 생겼어요. 다른 사진으로 다시 시도해 주세요.",
        );
      }
    },
    [setImage],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) void processFile(file);
    },
    [processFile],
  );

  const captureFromCamera = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const sw = video.videoWidth;
    const sh = video.videoHeight;
    const maxDim = 512;
    const ratio = Math.min(maxDim / sw, maxDim / sh, 1);
    const dw = Math.round(sw * ratio);
    const dh = Math.round(sh * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, dw, dh);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    setImage(dataUrl);
  }, [setImage]);

  // ── Navigate to results ────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!uploadedImage) return;

    if (analysis) {
      router.push("/result");
      return;
    }

    setNavigating(true);
    setAnalyzeError(null);

    if (!isStreamActive()) {
      startAnalyzeStream(uploadedImage);
    }

    await new Promise<void>((resolve) => {
      const unsub = useFlipStore.subscribe((state) => {
        if (state.analysis || !state.isRecommending) {
          unsub();
          resolve();
        }
      });
      setTimeout(() => {
        unsub();
        resolve();
      }, 20_000);
    });

    setNavigating(false);
    const s = useFlipStore.getState();
    if (s.analysis) {
      router.push("/result");
    } else {
      setAnalyzeError("분석에 실패했습니다. 다시 시도해 주세요.");
    }
  }, [analysis, router, uploadedImage]);

  // ── D&D handlers ──────────────────────────────────────────────────

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

  // ── Main button ───────────────────────────────────────────────────

  const isWorking = navigating;

  const handleMainButton = useCallback(() => {
    if (isWorking) return;
    if (uploadedImage) {
      void handleAnalyze();
    } else if (cameraReady && streamRef.current) {
      captureFromCamera();
    } else {
      cameraInputRef.current?.click();
    }
  }, [isWorking, uploadedImage, cameraReady, captureFromCamera, handleAnalyze]);

  const handleReset = useCallback(() => {
    cancelAnalyzeStream();
    setUploadedImage(null);
    setAnalysis(null);
    setRecommendations([]);
    setProcessError(null);
    setAnalyzeError(null);
    setCameraReady(null);
    setNavigating(false);
  }, [setUploadedImage, setAnalysis, setRecommendations]);

  const analysisReady = !!analysis && !navigating;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <section className="flex w-full flex-col gap-4 animate-slide-up">
      {/* ── Viewfinder / Preview / Fallback ── */}
      <div
        className="relative mx-auto h-64 w-full max-w-md overflow-hidden rounded-2xl border border-flip-muted/20 bg-black shadow-sm sm:h-80"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {uploadedImage ? (
          <>
            <Image
              src={uploadedImage}
              alt="업로드한 사진 미리보기"
              fill
              unoptimized
              className={`object-contain transition-opacity duration-300 ${isWorking ? "opacity-50" : "opacity-100"}`}
              sizes="(max-width: 640px) 100vw, 28rem"
            />
            {isWorking ? (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-md animate-pulse-soft"
                style={
                  analysis?.colors?.length
                    ? {
                        background: `linear-gradient(135deg, ${analysis.colors[0]}99, ${analysis.colors[1] ?? analysis.colors[0]}66, ${analysis.colors[2] ?? analysis.colors[0]}99)`,
                        backgroundSize: "200% 200%",
                        animation: "gradientShift 6s ease-in-out infinite, pulseSoft 2s ease-in-out infinite",
                      }
                    : { backgroundColor: "rgba(0,0,0,0.3)" }
                }
                aria-live="polite"
                aria-busy="true"
              >
                {analysis?.colors?.length ? (
                  <div className="flex gap-1.5" aria-hidden>
                    {analysis.colors.map((hex) => (
                      <div
                        key={hex}
                        className="h-4 w-4 rounded-full ring-1 ring-white/40"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="h-14 w-14 rounded-full bg-gradient-to-br from-flip-warm to-flip-accent opacity-90"
                    aria-hidden
                  />
                )}
                <p className="px-4 text-center text-sm font-medium text-white drop-shadow-sm">
                  {analysis
                    ? `"${analysis.mood}" 감성의 곡을 고르고 있어요...`
                    : "사진의 감성을 읽고 곡을 고르고 있어요..."}
                </p>
                {analysis?.scene ? (
                  <p className="px-6 text-center text-xs text-white/70 drop-shadow-sm">
                    {analysis.scene}
                  </p>
                ) : null}
              </div>
            ) : null}
            {/* 프리페치 중 컬러 그라디언트 프로그레스 바 */}
            {isRecommending && !isWorking ? (
              <div
                className="absolute bottom-3 left-3 right-3 overflow-hidden rounded-full backdrop-blur-sm"
                style={
                  analysis?.colors?.length
                    ? {
                        background: `linear-gradient(90deg, ${analysis.colors.join(", ")})`,
                        backgroundSize: "200% 100%",
                        animation: "gradientShift 3s ease-in-out infinite",
                        padding: "2px",
                      }
                    : { backgroundColor: "rgba(255,255,255,0.2)" }
                }
              >
                {analysis?.colors?.length ? null : (
                  <div className="h-1 animate-prefetch-bar rounded-full bg-flip-accent/80" />
                )}
              </div>
            ) : null}
          </>
        ) : cameraReady ? (
          <video
            ref={videoCallbackRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : cameraReady === false ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-flip-surface px-6 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-flip-accent"
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
              아래 버튼으로 촬영하거나 + 버튼으로 갤러리에서 선택
            </p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-flip-surface">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-flip-muted/30 border-t-flip-accent" />
          </div>
        )}
      </div>

      {/* ── Status messages ── */}
      {uploadedImage && isRecommending && !analysis && !isWorking ? (
        <p className="text-center text-xs text-flip-muted animate-fade-in">
          어울리는 곡을 미리 찾고 있어요...
        </p>
      ) : null}
      {uploadedImage && isRecommending && analysis && !isWorking ? (
        <p className="text-center text-xs text-flip-muted animate-fade-in">
          &quot;{analysis.mood}&quot; 감성에 맞는 곡을 찾고 있어요...
        </p>
      ) : null}
      {analysisReady && !isRecommending ? (
        <p className="text-center text-xs font-medium text-flip-primary animate-fade-in">
          준비 완료! 아래 체크 버튼을 눌러 결과를 확인하세요
        </p>
      ) : null}

      {/* ── "다른 사진 선택" ── */}
      {uploadedImage && !isWorking ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-flip-muted/40 px-5 py-2 text-sm font-medium text-flip-muted transition-colors hover:border-flip-accent hover:text-flip-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2"
            aria-label="다른 사진으로 바꾸기"
          >
            다른 사진 선택
          </button>
        </div>
      ) : null}

      {/* ── Action buttons: Main (camera/check) centered + Gallery (+) right ── */}
      <div className="relative flex items-center justify-center py-1">
        <button
          type="button"
          onClick={handleMainButton}
          disabled={isWorking}
          className={`flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${
            isWorking
              ? "bg-flip-primary text-white"
              : uploadedImage
                ? analysisReady
                  ? "bg-emerald-500 text-white shadow-emerald-500/30 focus-visible:ring-emerald-500 animate-pulse-soft"
                  : "bg-flip-primary text-white focus-visible:ring-flip-primary"
                : "border-2 border-flip-muted/30 bg-white text-flip-primary hover:border-flip-accent hover:text-flip-accent focus-visible:ring-flip-accent"
          }`}
          aria-label={
            isWorking
              ? "분석 중..."
              : uploadedImage
                ? "결과 보기"
                : "사진 촬영"
          }
        >
          {isWorking ? (
            <svg
              className="h-6 w-6 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : uploadedImage ? (
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          ) : (
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isWorking}
          className="absolute left-[calc(50%+2.75rem)] flex h-11 w-11 items-center justify-center rounded-full border-2 border-flip-muted/30 bg-white text-flip-primary shadow-sm transition-colors hover:border-flip-accent hover:text-flip-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 disabled:opacity-50"
          aria-label="갤러리에서 사진 선택"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>

      {/* ── Hidden file inputs ── */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
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
