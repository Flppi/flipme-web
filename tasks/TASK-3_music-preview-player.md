# TASK-3: 미리듣기 플레이어
# 선행 태스크: TASK-2
# 예상 시간: 3시간
# Git 이슈 타입: FEAT

---

## 목표
추천된 곡의 30초 미리듣기를 재생/정지할 수 있는 오디오 플레이어를 구현한다. 한 번에 하나의 곡만 재생되어야 한다.

---

## 구현 상세

### STEP 1: AudioPlayer 컴포넌트
`src/components/AudioPlayer.tsx`

**기능 요구사항:**
- HTML5 `<audio>` 엘리먼트 기반
- 재생/일시정지 토글 버튼
- 프로그레스 바 (현재 재생 위치 / 전체 길이)
- 프로그레스 바 클릭으로 재생 위치 이동
- 곡 전환 시 이전 곡 자동 정지
- 자동 재생 금지 (사용자 인터랙션 후에만 재생)
- 30초 미리듣기 종료 시 자동 정지 + 처음으로 돌아감

**전역 오디오 관리:**
한 번에 하나의 곡만 재생되어야 한다. Zustand 스토어에 현재 재생 중인 trackId를 저장한다.

```typescript
// useFlipStore에 추가
currentlyPlayingId: number | null;
setCurrentlyPlayingId: (id: number | null) => void;
```

**AudioPlayer 핵심 로직:**
```typescript
'use client';

import { useRef, useState, useEffect } from 'react';
import { useFlipStore } from '@/store/useFlipStore';

interface AudioPlayerProps {
  trackId: number;
  previewUrl: string;
  compact?: boolean; // TrackCard 내부 인라인 모드
}

export function AudioPlayer({ trackId, previewUrl, compact = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const { currentlyPlayingId, setCurrentlyPlayingId } = useFlipStore();

  // 다른 곡이 재생 시작되면 이 플레이어 정지
  useEffect(() => {
    if (currentlyPlayingId !== trackId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [currentlyPlayingId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setCurrentlyPlayingId(null);
    } else {
      audioRef.current.play();
      setCurrentlyPlayingId(trackId);
    }
    setIsPlaying(!isPlaying);
  };

  // timeupdate 이벤트로 프로그레스 업데이트
  // ended 이벤트로 재생 완료 처리
}
```

### STEP 2: TrackCard에 AudioPlayer 통합
TASK-2에서 만든 TrackCard에 compact 모드 AudioPlayer를 삽입한다.

**TrackCard 최종 레이아웃:**
```
┌─────────────────────────────────┐
│  [앨범커버]  곡 제목            │
│             아티스트명          │
│  ▶ ━━━━━━━━━━━━━ 0:15/0:30    │
│           [이 곡 선택]          │
└─────────────────────────────────┘
```

### STEP 3: 하단 고정 플레이어 (선택된 곡)
곡을 선택하면 화면 하단에 고정 미니 플레이어가 표시된다.

```
┌─────────────────────────────────┐
│ [커버] 곡제목 - 아티스트  ▶ ━━ │
│        [공유 카드 만들기 →]     │
└─────────────────────────────────┘
```

이 고정 플레이어에서 "공유 카드 만들기" 버튼을 누르면 `/card` 페이지로 이동한다.

---

## 수용 기준

- [ ] 미리듣기 URL 재생/정지 정상 작동
- [ ] 한 번에 하나의 곡만 재생됨 (다른 곡 재생 시 이전 곡 정지)
- [ ] 프로그레스 바가 실시간으로 업데이트됨
- [ ] 프로그레스 바 클릭으로 재생 위치 이동 가능
- [ ] 30초 미리듣기 종료 시 자동 정지
- [ ] 모바일에서 오디오 재생 정상 작동 (iOS Safari 포함)
- [ ] 곡 선택 시 하단 고정 플레이어 표시
- [ ] 고정 플레이어에서 "공유 카드 만들기" 클릭 → /card 이동

---

## 주의사항

### iOS Safari 오디오 제한
- iOS에서는 사용자 인터랙션(탭/클릭) 없이 오디오 재생 불가
- `audioRef.current.play()`는 반드시 click 이벤트 핸들러 내부에서 호출
- 자동 재생 시도 시 에러 발생 → catch로 처리

### CORS
- Deezer preview URL은 CORS 허용됨 (직접 `<audio src>` 가능)
- 별도 프록시 불필요

---

## Git 명령어

```bash
./.github/scripts/git-task.sh start "FEAT" "미리듣기 플레이어 구현"

git commit -m "✨ feat: AudioPlayer 컴포넌트 구현 #<이슈번호>"
git commit -m "✨ feat: TrackCard에 인라인 플레이어 통합 #<이슈번호>"
git commit -m "✨ feat: 하단 고정 미니 플레이어 구현 #<이슈번호>"

./.github/scripts/git-task.sh finish "✨ feat: 미리듣기 플레이어 구현 완료"
```
