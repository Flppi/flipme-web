"use client";

import { useId } from "react";
import { useFlipStore } from "@/store/useFlipStore";

function tagLabel(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return t.startsWith("#") ? t : `#${t}`;
}

export default function MoodDisplay() {
  const analysis = useFlipStore((s) => s.analysis);
  const gradId = useId().replace(/:/g, "");

  if (!analysis) {
    return null;
  }

  const chipTexts = [
    analysis.mood,
    analysis.scene,
    ...analysis.keywords.slice(0, 3),
  ].filter(Boolean);

  const barW = Math.min(100, Math.max(0, analysis.energy * 100));

  return (
    <section className="w-full animate-fade-in rounded-2xl border border-flip-muted/20 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-flip-primary">
        분석 결과
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {chipTexts.map((text, index) => (
          <span
            key={`${index}-${text}`}
            className="rounded-full bg-flip-surface px-3 py-1 text-xs font-medium text-flip-primary ring-1 ring-flip-muted/20"
          >
            {tagLabel(text)}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-flip-muted">에너지</p>
        <svg
          className="mt-2 h-3 w-full"
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
          role="img"
          aria-label={`에너지 레벨 ${Math.round(analysis.energy * 100)}%`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFA07A" />
              <stop offset="100%" stopColor="#E94560" />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y="0"
            width="100"
            height="8"
            rx="4"
            className="fill-flip-primary/10"
          />
          <rect
            x="0"
            y="0"
            width={barW}
            height="8"
            rx="4"
            fill={`url(#${gradId})`}
          />
        </svg>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-flip-muted">컬러 팔레트</p>
        <ul className="mt-2 flex gap-3" aria-label="추출된 색상">
          {analysis.colors.map((hex) => (
            <li key={hex}>
              <svg
                viewBox="0 0 40 40"
                className="h-10 w-10 drop-shadow-sm"
                role="img"
                aria-label={hex}
              >
                <circle
                  cx="20"
                  cy="20"
                  r="19"
                  fill={hex}
                  stroke="#6B7280"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                />
              </svg>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-flip-primary">
        {analysis.description}
      </p>
    </section>
  );
}
