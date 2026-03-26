# TASK-5: 플랫폼 Export
# 선행 태스크: TASK-2
# 예상 시간: 2시간
# Git 이슈 타입: FEAT

---

## 목표
추천된 곡을 Spotify, Apple Music, YouTube Music에서 열 수 있는 딥링크/검색 URL을 생성한다.

---

## 구현 상세

### STEP 1: Export API Route
`src/app/api/export/route.ts`

각 플랫폼별로 곡 제목 + 아티스트를 기반으로 링크를 생성한다.

```typescript
import { NextRequest, NextResponse } from 'next/server';

interface ExportRequest {
  title: string;
  artist: string;
  platforms: ('spotify' | 'apple-music' | 'youtube-music')[];
}

function buildExportLinks(title: string, artist: string, platforms: string[]) {
  const query = encodeURIComponent(`${title} ${artist}`);
  const links: Record<string, string> = {};

  if (platforms.includes('spotify')) {
    // Spotify 검색 딥링크 (앱 설치 시 앱에서 열림)
    links.spotify = `https://open.spotify.com/search/${query}`;
  }

  if (platforms.includes('apple-music')) {
    // Apple Music 검색
    links['apple-music'] = `https://music.apple.com/search?term=${query}`;
  }

  if (platforms.includes('youtube-music')) {
    // YouTube Music 검색
    links['youtube-music'] = `https://music.youtube.com/search?q=${query}`;
  }

  return links;
}
```

**참고:** MVP에서는 각 플랫폼의 정확한 곡 매칭(ISRC 기반)까지는 구현하지 않는다. 검색 URL로 충분하다. 사용자가 해당 플랫폼에서 곡을 직접 확인하고 저장하는 플로우를 사용한다.

### STEP 2: ExportButtons 컴포넌트
`src/components/ExportButtons.tsx`

**UI:**
```
  ┌─────────────────────────────────┐
  │  이 곡을 내 플랫폼에서 듣기     │
  │                                 │
  │  [🟢 Spotify]  [🍎 Apple Music] │
  │                                 │
  │  [▶ YouTube Music]  [🎵 Deezer] │
  └─────────────────────────────────┘
```

**요구사항:**
- 각 플랫폼 아이콘 + 브랜드 컬러 버튼
- 클릭 시 새 탭에서 해당 플랫폼 검색 결과 열림 (`target="_blank"`)
- Deezer 링크는 DeezerTrack.deezerUrl 직접 사용 (정확한 곡 매칭)
- 각 버튼에 플랫폼 로고 표시 (SVG 아이콘 직접 작성, 외부 라이브러리 미사용)

### STEP 3: 배치 위치
ExportButtons는 2곳에 배치한다:

1. **추천 결과 페이지** (`/result`): 각 TrackCard 내부에 작은 아이콘 버튼으로
2. **공유 카드 페이지** (`/card`): ShareCardEditor 하단에 전체 크기 버튼으로

---

## 수용 기준

- [ ] Spotify 링크 클릭 → Spotify 검색 결과 새 탭 열림
- [ ] Apple Music 링크 클릭 → Apple Music 검색 결과 새 탭 열림
- [ ] YouTube Music 링크 클릭 → YouTube Music 검색 결과 새 탭 열림
- [ ] Deezer 링크 클릭 → 정확한 곡 페이지 열림
- [ ] 모바일에서 앱 설치 시 앱으로 자동 연결 (딥링크)
- [ ] 버튼에 각 플랫폼 브랜드 컬러 적용

---

## Git 명령어

```bash
./.github/scripts/git-task.sh start "FEAT" "플랫폼 Export 기능 구현"

git commit -m "✨ feat: Export API Route 및 링크 생성 로직 #<이슈번호>"
git commit -m "✨ feat: ExportButtons 컴포넌트 구현 #<이슈번호>"

./.github/scripts/git-task.sh finish "✨ feat: 플랫폼 Export 기능 구현 완료"
```
