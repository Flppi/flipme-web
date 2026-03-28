"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFlipStore } from "@/store/useFlipStore";
import type { DeezerTrack } from "@/types";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) {
    return "0:00";
  }
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AudioPlayerProps {
  track: DeezerTrack;
  compact?: boolean;
}

export default function AudioPlayer({ track, compact = false }: AudioPlayerProps) {
  const { id: trackId, previewUrl } = track;
  const audioRef = useRef<HTMLAudioElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const playIntentRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const analysis = useFlipStore((s) => s.analysis);
  const trackEvent = useFlipStore((s) => s.trackEvent);
  const currentlyPlayingId = useFlipStore((s) => s.currentlyPlayingId);
  const setCurrentlyPlayingId = useFlipStore((s) => s.setCurrentlyPlayingId);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    playIntentRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    const { currentlyPlayingId: cur, setCurrentlyPlayingId: setPlaying } =
      useFlipStore.getState();
    if (cur === trackId) {
      setPlaying(null);
    }
  }, [previewUrl, trackId]);

  useEffect(() => {
    if (currentlyPlayingId !== trackId && isPlaying) {
      audioRef.current?.pause();
      playIntentRef.current = false;
      setIsPlaying(false);
    }
  }, [currentlyPlayingId, isPlaying, trackId]);

  const onTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      setCurrentTime(a.currentTime);
    }
  }, []);

  const onLoadedMetadata = useCallback(() => {
    const a = audioRef.current;
    if (a && Number.isFinite(a.duration) && a.duration > 0) {
      setDuration(a.duration);
    }
  }, []);

  const onEnded = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    playIntentRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentlyPlayingId(null);
    trackEvent({
      eventType: "track_play_complete",
      trackId: track.id,
      trackTitle: track.title,
      trackArtist: track.artist,
      layer: track.layer,
      photoMood: analysis?.mood,
      photoEnergy: analysis?.energy,
    });
  }, [analysis?.energy, analysis?.mood, setCurrentlyPlayingId, track, trackEvent]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) {
      return;
    }
    if (isPlaying) {
      el.pause();
      setCurrentlyPlayingId(null);
      playIntentRef.current = false;
      setIsPlaying(false);
      return;
    }
    if (playIntentRef.current) {
      return;
    }
    playIntentRef.current = true;
    trackEvent({
      eventType: "track_play",
      trackId: track.id,
      trackTitle: track.title,
      trackArtist: track.artist,
      layer: track.layer,
      photoMood: analysis?.mood,
      photoEnergy: analysis?.energy,
    });
    setCurrentlyPlayingId(trackId);
    void el.play().then(
      () => {
        setIsPlaying(true);
      },
      () => {
        setCurrentlyPlayingId(null);
        playIntentRef.current = false;
        setIsPlaying(false);
      },
    );
  }, [
    analysis?.energy,
    analysis?.mood,
    isPlaying,
    setCurrentlyPlayingId,
    track,
    trackEvent,
    trackId,
  ]);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      const audio = audioRef.current;
      if (!bar || !audio || duration <= 0) {
        return;
      }
      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      audio.currentTime = ratio * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration],
  );

  const onBarPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const onBarPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) {
        return;
      }
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const onBarPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const btnClass = compact
    ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-flip-primary text-white transition-opacity hover:opacity-90"
    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-flip-primary text-white transition-opacity hover:opacity-90";

  const textCls = compact ? "text-[10px] text-flip-muted" : "text-xs text-flip-muted";

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <audio
        ref={audioRef}
        src={previewUrl}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        aria-hidden
      />
      <button
        type="button"
        onClick={togglePlay}
        className={btnClass}
        aria-label={isPlaying ? "일시정지" : "재생"}
      >
        {isPlaying ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 pl-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="재생 위치"
          onPointerDown={onBarPointerDown}
          onPointerMove={onBarPointerMove}
          onPointerUp={onBarPointerUp}
          onPointerCancel={onBarPointerUp}
          onKeyDown={(e) => {
            if (!audioRef.current || duration <= 0) {
              return;
            }
            const step = duration * 0.05;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - step);
              setCurrentTime(audioRef.current.currentTime);
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              audioRef.current.currentTime = Math.min(
                duration,
                audioRef.current.currentTime + step,
              );
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          className="cursor-pointer touch-none rounded-md py-1 outline-none focus-visible:ring-2 focus-visible:ring-flip-accent"
        >
          <svg
            className="block h-2 w-full"
            viewBox="0 0 100 4"
            preserveAspectRatio="none"
            aria-hidden
          >
            <rect x="0" y="0" width="100" height="4" rx="2" className="fill-flip-muted/25" />
            <rect
              x="0"
              y="0"
              width={progressPct}
              height="4"
              rx="2"
              className="fill-flip-accent"
            />
          </svg>
        </div>
        <div className={`flex justify-end tabular-nums ${textCls}`}>
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
