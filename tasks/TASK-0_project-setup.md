# TASK-0: 프로젝트 초기 설정
# 선행 태스크: 없음
# 예상 시간: 2시간
# Git 이슈 타입: FEAT

---

## 목표
Next.js 14 프로젝트를 생성하고, 전체 디렉토리 구조, 공통 타입, 환경변수, ESLint/Prettier, Tailwind 설정을 완료한다.

---

## 구현 상세

### STEP 1: 프로젝트 생성
```bash
pnpm create next-app@latest flipme-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd flipme-web
```

### STEP 2: 의존성 설치
```bash
pnpm add zustand html2canvas
pnpm add -D prettier prettier-plugin-tailwindcss @types/node
```

### STEP 3: 디렉토리 생성
DEVELOPMENT_GUIDE.md §3의 구조대로 모든 디렉토리를 생성한다.
```bash
mkdir -p src/{components/ui,lib,store,types,styles}
mkdir -p src/app/{result,card,api/{analyze,recommend,export}}
mkdir -p public/{fonts,images}
mkdir -p .github/{ISSUE_TEMPLATE,scripts}
```

### STEP 4: 공통 타입 파일 생성
DEVELOPMENT_GUIDE.md §4의 타입 정의를 `src/types/index.ts`에 작성한다.

### STEP 5: 환경변수 설정
`.env.example` 파일 생성:
```
OPENAI_API_KEY=
DEEZER_APP_ID=
DEEZER_APP_SECRET=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

`.env.local`은 `.gitignore`에 포함되어 있는지 확인.

### STEP 6: Tailwind 커스텀 설정
`tailwind.config.ts`에 FlipMe 브랜드 컬러와 폰트를 추가:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        flip: {
          primary: "#1A1A2E",    // 딥 네이비
          accent: "#E94560",     // 코랄 레드
          warm: "#FFA07A",       // 웜 살몬
          surface: "#F8F6F4",    // 오프화이트
          muted: "#6B7280",      // 뮤트 그레이
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.7" } },
      },
    },
  },
  plugins: [],
};

export default config;
```

### STEP 7: 루트 레이아웃 설정
`src/app/layout.tsx`:
- Google Fonts에서 디스플레이 폰트 + 본문 폰트 로드
- 메타데이터 설정 (title: "FlipMe — 사진이 음악이 되는 순간")
- globals.css import

### STEP 8: Zustand 스토어 초기화
`src/store/useFlipStore.ts`:
```typescript
import { create } from 'zustand';
import type { PhotoAnalysis, DeezerTrack, ShareCardConfig } from '@/types';

interface FlipStore {
  // 상태
  uploadedImage: string | null;
  analysis: PhotoAnalysis | null;
  recommendations: DeezerTrack[];
  selectedTrack: DeezerTrack | null;
  cardConfig: ShareCardConfig | null;
  isAnalyzing: boolean;
  isRecommending: boolean;

  // 액션
  setUploadedImage: (image: string | null) => void;
  setAnalysis: (analysis: PhotoAnalysis | null) => void;
  setRecommendations: (tracks: DeezerTrack[]) => void;
  setSelectedTrack: (track: DeezerTrack | null) => void;
  setCardConfig: (config: ShareCardConfig | null) => void;
  setIsAnalyzing: (value: boolean) => void;
  setIsRecommending: (value: boolean) => void;
  reset: () => void;
}
```

### STEP 9: GitHub 이슈 템플릿 복사
업로드된 이슈 템플릿 2개를 `.github/ISSUE_TEMPLATE/`에 복사한다.

### STEP 10: Git 자동화 스크립트 배치
`.github/scripts/git-task.sh`에 자동화 스크립트를 배치한다.
(별도 파일 `git-task.sh` 참조)

---

## 수용 기준 (Acceptance Criteria)

- [ ] `pnpm dev`로 로컬 서버 정상 구동 확인
- [ ] `src/types/index.ts`에 모든 공유 타입 정의 완료
- [ ] `.env.example` 파일 존재
- [ ] Tailwind 커스텀 컬러/폰트 적용 확인
- [ ] Zustand 스토어 초기화 완료
- [ ] 디렉토리 구조가 DEVELOPMENT_GUIDE.md §3과 일치
- [ ] GitHub 이슈 템플릿 2개 배치 완료

---

## Git 명령어

```bash
# 태스크 시작
./.github/scripts/git-task.sh start "FEAT" "프로젝트 초기 설정"

# 중간 커밋 (필요 시)
git add -A
git commit -m "🎉 init: Next.js 프로젝트 생성 #<이슈번호>"
git commit -m "🔧 chore: Tailwind 커스텀 설정 추가 #<이슈번호>"
git commit -m "✨ feat: Zustand 스토어 초기화 #<이슈번호>"

# 태스크 완료
./.github/scripts/git-task.sh finish "🎉 init: 프로젝트 초기 설정 완료"
```
