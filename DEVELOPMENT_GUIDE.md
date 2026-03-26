# FlipMe MVP — 개발 지침서
# 목적: Cursor AI가 각 태스크를 수행할 때 참조하는 마스터 가이드
# 작성일: 2026-03-26

---

## §1. 프로젝트 개요

### 서비스 정의
FlipMe는 사진을 업로드하면 AI가 공간/피사체의 분위기를 분석하여 어울리는 음악을 추천하고, 사진+앨범 커버를 결합한 인스타그램 공유 카드를 생성하는 서비스이다.

### 핵심 사용자 플로우
```
사진 촬영/업로드 → AI 분위기 분석 → 음악 추천(미리듣기) → 곡 선택 → 공유 카드 생성 or 플랫폼 export
```

### 타겟 사용자
- 인스타그램 주 3회 이상 업로드하는 20대
- 사진 감성에 맞는 BGM을 원하지만 직접 찾기 어려운 사용자

### MVP 범위
- 플랫폼: 웹 (모바일 우선 반응형)
- 배포 규모: 100명 이내 클로즈드 베타
- 최종 목표: React Native 앱 전환 (MVP 검증 후)

---

## §2. 기술 스택

| 레이어 | 기술 | 근거 |
|--------|------|------|
| **프레임워크** | Next.js 14 (App Router) | SSR/SSG, API Routes 내장, Vercel 배포 용이 |
| **언어** | TypeScript | 타입 안정성, AI 코딩 시 오류 감소 |
| **스타일링** | Tailwind CSS | 유틸리티 기반, 빠른 프로토타이핑 |
| **이미지 분석** | OpenAI Vision API (gpt-4o) | 공간/피사체/분위기를 자연어로 추출 |
| **음악 API (1차)** | Deezer API | 인증 불필요, 30초 미리듣기 URL 직접 제공 |
| **음악 API (Fallback)** | Spotify Web API | 카탈로그 규모 크나 OAuth 필요, preview_url null 가능 |
| **공유 카드 생성** | html2canvas + Canvas API | 클라이언트 사이드 이미지 생성 |
| **배포** | Vercel | Next.js 네이티브 지원, 무료 티어로 100명 충분 |
| **상태 관리** | Zustand | 경량, 보일러플레이트 최소 |
| **패키지 매니저** | pnpm | 디스크 효율, 빠른 설치 |

### API 키 관리
- 모든 API 키는 `.env.local`에 저장
- 클라이언트에 노출되면 안 되는 키는 반드시 API Route에서만 사용
- `.env.example` 파일에 필요한 환경변수 목록 유지

```
OPENAI_API_KEY=
DEEZER_APP_ID=
DEEZER_APP_SECRET=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

---

## §3. 프로젝트 디렉토리 구조

```
flipme-web/
├── .cursorrules                  # Cursor AI 규칙
├── .env.local                    # 환경변수 (git 무시)
├── .env.example                  # 환경변수 템플릿
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md            # 기능 추가 이슈 템플릿
│   │   └── bug.md                # 버그 이슈 템플릿
│   └── scripts/
│       └── git-task.sh           # Git 자동화 스크립트
├── public/
│   ├── fonts/
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 루트 레이아웃
│   │   ├── page.tsx              # 메인 페이지 (사진 업로드)
│   │   ├── result/
│   │   │   └── page.tsx          # 추천 결과 페이지
│   │   ├── card/
│   │   │   └── page.tsx          # 공유 카드 생성 페이지
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts      # 이미지 분석 API
│   │       ├── recommend/
│   │       │   └── route.ts      # 음악 추천 API
│   │       └── export/
│   │           └── route.ts      # 플랫폼 export API
│   ├── components/
│   │   ├── ui/                   # 공통 UI 컴포넌트
│   │   ├── PhotoUploader.tsx     # 사진 업로드 컴포넌트
│   │   ├── MoodDisplay.tsx       # 분석 결과 표시
│   │   ├── TrackCard.tsx         # 곡 카드 (미리듣기 포함)
│   │   ├── TrackList.tsx         # 추천 곡 목록
│   │   ├── AudioPlayer.tsx       # 미리듣기 플레이어
│   │   ├── ShareCardEditor.tsx   # 공유 카드 에디터
│   │   └── ExportButtons.tsx     # 플랫폼 export 버튼
│   ├── lib/
│   │   ├── openai.ts             # OpenAI Vision API 래퍼
│   │   ├── deezer.ts             # Deezer API 래퍼
│   │   ├── spotify.ts            # Spotify API 래퍼 (fallback)
│   │   ├── mood-to-query.ts      # 분위기 → 검색 쿼리 변환 로직
│   │   └── share-card.ts         # 공유 카드 생성 유틸
│   ├── store/
│   │   └── useFlipStore.ts       # Zustand 스토어
│   ├── types/
│   │   └── index.ts              # 공유 타입 정의
│   └── styles/
│       └── globals.css           # 글로벌 스타일
├── tasks/                        # 태스크별 개발 지침 (이 폴더)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## §4. 핵심 타입 정의

```typescript
// src/types/index.ts

/** 이미지 분석 결과 */
interface PhotoAnalysis {
  mood: string;           // "잔잔한", "활기찬", "몽환적인" 등
  scene: string;          // "도시 야경", "카페 내부", "한강 노을" 등
  colors: string[];       // ["#FF6B35", "#2E4057", "#FFA07A"]
  keywords: string[];     // ["sunset", "warm", "peaceful", "golden hour"]
  energy: number;         // 0.0 ~ 1.0 (잔잔함 ~ 강렬함)
  description: string;    // AI가 생성한 1줄 분위기 설명
}

/** Deezer 트랙 */
interface DeezerTrack {
  id: number;
  title: string;
  artist: string;
  album: string;
  albumCoverUrl: string;  // 앨범 커버 이미지 URL
  previewUrl: string;     // 30초 미리듣기 MP3 URL
  deezerUrl: string;      // Deezer 곡 링크
  duration: number;       // 전체 곡 길이 (초)
}

/** 추천 결과 */
interface RecommendationResult {
  analysis: PhotoAnalysis;
  tracks: DeezerTrack[];          // 추천 곡 목록 (5~10곡)
  playlist?: {
    name: string;
    description: string;
    tracks: DeezerTrack[];
  };
}

/** 공유 카드 설정 */
interface ShareCardConfig {
  photoUrl: string;               // 업로드한 사진 URL
  track: DeezerTrack;             // 선택한 곡
  frameStyle: 'minimal' | 'polaroid' | 'gradient' | 'vinyl';
  showLyrics: boolean;
  customText?: string;
}

/** 플랫폼 Export */
type ExportPlatform = 'spotify' | 'apple-music' | 'youtube-music';

interface ExportLink {
  platform: ExportPlatform;
  url: string;
  available: boolean;
}
```

---

## §5. API 엔드포인트 명세

### POST /api/analyze
이미지를 받아 분위기를 분석한다.

```
Request:  { image: base64 string }
Response: { analysis: PhotoAnalysis }
```

**OpenAI Vision 프롬프트 (핵심):**
```
You are a photo mood analyzer for a music recommendation service.
Analyze this photo and return JSON with:
- mood: 한국어 감성 키워드 (예: "잔잔한", "활기찬", "몽환적인", "쓸쓸한")
- scene: 장소/상황 설명 (예: "카페에서 본 노을")
- colors: 지배적 색상 hex 코드 3개
- keywords: 영문 음악 검색용 키워드 5개 (분위기, 장르, 템포 관련)
- energy: 0.0(잔잔) ~ 1.0(강렬) 에너지 레벨
- description: 이 사진의 감성을 한 문장으로 (한국어)

Return ONLY valid JSON. No markdown, no explanation.
```

### POST /api/recommend
분석 결과를 받아 음악을 추천한다.

```
Request:  { analysis: PhotoAnalysis }
Response: { tracks: DeezerTrack[], playlist?: {...} }
```

**로직:**
1. `mood-to-query.ts`에서 PhotoAnalysis → Deezer 검색 쿼리 변환
2. Deezer Search API 호출 (keywords 조합)
3. energy 값으로 결과 필터링/정렬
4. preview_url이 있는 트랙만 반환
5. 5~10곡 추천

### POST /api/export
곡 정보를 받아 각 플랫폼 링크를 생성한다.

```
Request:  { track: { title: string, artist: string }, platforms: ExportPlatform[] }
Response: { links: ExportLink[] }
```

---

## §6. 코딩 컨벤션

### 파일 네이밍
- 컴포넌트: `PascalCase.tsx` (예: `PhotoUploader.tsx`)
- 유틸/라이브러리: `kebab-case.ts` (예: `mood-to-query.ts`)
- API 라우트: `route.ts`
- 타입: `index.ts` (types 디렉토리)

### 컴포넌트 규칙
- 함수형 컴포넌트만 사용 (`function` 키워드)
- Props 인터페이스는 컴포넌트 파일 상단에 정의
- `'use client'` 지시어는 필요한 컴포넌트에만 명시적으로 추가
- 상태가 필요 없는 컴포넌트는 Server Component로 유지

### 에러 처리
- API Route: try-catch로 감싸고, 실패 시 `NextResponse.json({ error: message }, { status: code })` 반환
- 클라이언트: 모든 fetch에 에러 핸들링 + 사용자에게 toast 알림
- 외부 API 실패 시 fallback 로직 구현 (Deezer 실패 → Spotify)

### 스타일 규칙
- Tailwind 유틸리티 클래스 우선
- 복잡한 애니메이션만 globals.css에 @keyframes 정의
- 다크모드: MVP에서는 제외 (라이트 모드 전용)
- 모바일 퍼스트: `sm:`, `md:`, `lg:` 순서로 반응형 작성

---

## §7. Git 워크플로우 (자동화)

### 브랜치 전략
```
master ─── 배포 전용
  └── develop ─── 개발 통합
        ├── feature/#1-project-setup
        ├── feature/#2-photo-analysis
        ├── feature/#3-music-recommendation
        ├── feature/#4-preview-player
        ├── feature/#5-share-card
        ├── feature/#6-platform-export
        └── feature/#7-integration-polish
```

### 커밋 컨벤션
```
<이모지> <타입>: <설명> #이슈번호

예시:
🎉 init: 프로젝트 초기 설정 #1
✨ feat: 사진 업로드 컴포넌트 구현 #2
🐛 bugfix: 이미지 분석 타임아웃 수정 #3
♻️ refactor: Deezer API 래퍼 구조 개선 #4
📝 docs: README 업데이트 #5
🔧 chore: ESLint 설정 추가 #1
```

### 자동화 스크립트 사용법
각 태스크 시작 시 아래 스크립트를 실행하면 이슈 생성 → 브랜치 생성 → 작업 후 Push → PR 생성까지 자동으로 처리된다.

```bash
# 태스크 시작 (이슈 + 브랜치 생성)
./.github/scripts/git-task.sh start "FEAT" "사진 업로드 컴포넌트 구현"

# 태스크 완료 (커밋 + Push + PR 생성)
./.github/scripts/git-task.sh finish "✨ feat: 사진 업로드 컴포넌트 구현"
```

상세 사용법은 `.github/scripts/git-task.sh` 파일 참조.

---

## §8. 태스크 목록 및 진행 순서

| 순서 | 태스크 ID | 제목 | 지침 파일 | 예상 시간 |
|------|-----------|------|-----------|-----------|
| 1 | TASK-0 | 프로젝트 초기 설정 | `tasks/TASK-0_project-setup.md` | 2시간 |
| 2 | TASK-1 | 사진 업로드 & AI 분석 | `tasks/TASK-1_photo-upload-analysis.md` | 4시간 |
| 3 | TASK-2 | 음악 추천 엔진 | `tasks/TASK-2_music-recommendation.md` | 4시간 |
| 4 | TASK-3 | 미리듣기 플레이어 | `tasks/TASK-3_music-preview-player.md` | 3시간 |
| 5 | TASK-4 | 인스타 공유 카드 생성 | `tasks/TASK-4_share-card-generator.md` | 4시간 |
| 6 | TASK-5 | 플랫폼 Export | `tasks/TASK-5_platform-export.md` | 2시간 |
| 7 | TASK-6 | 통합 & 반응형 마무리 | `tasks/TASK-6_integration-polish.md` | 3시간 |

**규칙:**
- 각 태스크는 반드시 순서대로 진행한다.
- 하나의 태스크가 완료되면 새 Cursor 채팅을 열고 다음 태스크 파일을 로드한다.
- 각 태스크 파일에는 해당 태스크의 목표, 구현 상세, 수용 기준, Git 명령어가 포함되어 있다.

---

## §9. 외부 API 레퍼런스

### Deezer API
- Base URL: `https://api.deezer.com`
- 검색: `GET /search?q={query}&limit=25`
- 트랙 상세: `GET /track/{id}`
- 미리듣기: 검색 결과의 `preview` 필드 (30초 MP3 URL, 인증 불필요)
- Rate Limit: 50 requests / 5초
- 문서: https://developers.deezer.com/api

### OpenAI Vision API
- 모델: `gpt-4o`
- 이미지 입력: base64 인코딩
- max_tokens: 500 (분석 결과는 짧으므로 충분)
- 문서: https://platform.openai.com/docs/guides/vision

### Spotify Web API (Fallback)
- 검색: `GET /v1/search?q={query}&type=track&limit=25`
- 인증: Client Credentials Flow (OAuth 2.0)
- preview_url: 30초 미리듣기 (일부 트랙에서 null 반환 가능)
- 문서: https://developer.spotify.com/documentation/web-api

---

## §10. MVP 성공 지표 (참고)

| 지표 | 목표 |
|------|------|
| 사진 → 추천 완료율 | 90% 이상 (에러 없이 결과 도달) |
| 추천 곡 미리듣기 재생률 | 70% 이상 |
| 공유 카드 생성률 | 30% 이상 (추천 받은 사용자 중) |
| D+7 재방문율 | 20% 이상 |
| 평균 세션 시간 | 2분 이상 |
