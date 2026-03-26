# TASK-6: 통합 테스트 & 반응형 마무리
# 선행 태스크: TASK-0 ~ TASK-5 전체
# 예상 시간: 3시간
# Git 이슈 타입: FEAT

---

## 목표
모든 기능을 연결하여 사진 업로드 → 분석 → 추천 → 미리듣기 → 곡 선택 → 공유 카드/Export의 전체 플로우를 완성하고, 모바일/태블릿/데스크톱 반응형을 마무리한다.

---

## 구현 상세

### STEP 1: 전체 플로우 연결

**페이지 간 네비게이션:**
```
/ (메인)          →  /result (추천 결과)   →  /card (공유 카드)
사진 업로드/분석      음악 추천/선택/미리듣기     카드 생성/공유/export
```

**페이지 전환 로직:**
1. `/` → 사진 업로드 + 분석 완료 → 자동으로 `/result`로 router.push
2. `/result` → 곡 선택 + "공유 카드 만들기" 클릭 → `/card`로 router.push
3. `/card` → "다른 곡 선택하기" → `/result`로 router.back
4. `/card` → "새 사진 업로드" → `/`로 이동 + Zustand store reset

**상태 유지:**
- Zustand 스토어가 모든 페이지 간 상태를 관리
- 새로고침 시 상태 소실 → `/result`, `/card` 페이지에서 필수 데이터 없으면 `/`로 리다이렉트
- `useEffect`에서 체크:
  ```typescript
  useEffect(() => {
    if (!uploadedImage || !analysis) {
      router.replace('/');
    }
  }, []);
  ```

### STEP 2: 로딩/에러 상태 통일

**로딩 상태:**
- 사진 분석 중: "사진의 감성을 읽고 있어요..." + 이미지 위 블러 오버레이 + 펄스 애니메이션
- 음악 추천 중: "어울리는 음악을 찾고 있어요..." + 음표 로딩 아이콘
- 카드 생성 중: "감각적인 카드를 만들고 있어요..." + 프로그레스 바

**에러 상태:**
- API 실패: "잠시 문제가 생겼어요. 다시 시도해 주세요." + 재시도 버튼
- 이미지 형식 오류: "JPEG, PNG 형식의 사진만 올릴 수 있어요."
- 파일 크기 초과: "10MB 이하의 사진만 올릴 수 있어요."

### STEP 3: 반응형 레이아웃

**브레이크포인트:**
```
모바일:  < 640px  (기본, 1열 레이아웃)
태블릿:  640px+   (sm:, 2열 그리드)
데스크톱: 1024px+  (lg:, 중앙 정렬 max-w-lg)
```

**페이지별 반응형 처리:**

| 페이지 | 모바일 | 태블릿+ |
|--------|--------|---------|
| `/` (업로드) | 풀 너비, 하단 버튼 | 중앙 카드 (max-w-md) |
| `/result` (추천) | 가로 스크롤 카드 | 2열 그리드 |
| `/card` (카드) | 풀 너비 프리뷰 | 좌: 프리뷰 / 우: 옵션 패널 |

**하단 고정 플레이어:**
- 모바일: 하단 고정 (fixed bottom-0), safe-area-inset-bottom 적용
- 데스크톱: 하단 고정 (max-width 제한)

### STEP 4: 접근성 & UX 마무리

**접근성:**
- 모든 버튼에 `aria-label` 추가
- 이미지에 alt 텍스트 (분석 결과의 description 활용)
- 포커스 링 스타일: `focus-visible:ring-2 focus-visible:ring-flip-accent`
- 색상 대비 비율 4.5:1 이상

**UX 마무리:**
- 페이지 전환 시 fade-in 애니메이션
- 빈 상태(empty state) UI 디자인
- 첫 방문 시 간단한 온보딩 힌트 (tooltip 또는 캐러셀, 선택사항)
- favicon 및 OG 이미지 설정

### STEP 5: 메인 페이지 헤더/푸터

**헤더:**
- FlipMe 로고 (텍스트 로고, 디스플레이 폰트)
- 심플하게 로고만. 네비게이션 없음 (MVP)

**푸터:**
- "Made with ♪ by FlipMe" 텍스트
- 피드백 링크 (Google Form 또는 Tally)

### STEP 6: Vercel 배포 준비

- `next.config.mjs`에 이미지 도메인 허용:
  ```javascript
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.deezer.com' },
      { protocol: 'https', hostname: 'cdns-images.dzcdn.net' },
      { protocol: 'https', hostname: 'e-cdns-images.dzcdn.net' },
    ],
  },
  ```
- 환경변수 Vercel 프로젝트 설정에 등록
- `pnpm build` 성공 확인
- Preview 배포 → 테스트 → Production 배포

---

## 수용 기준

- [ ] 전체 플로우 정상 작동 (사진 → 분석 → 추천 → 선택 → 카드 → 공유)
- [ ] 모바일 (iPhone Safari, Android Chrome)에서 전체 플로우 테스트 통과
- [ ] 태블릿/데스크톱에서 레이아웃 깨지지 않음
- [ ] 모든 로딩 상태에 적절한 UI 피드백
- [ ] 모든 에러 상태에 사용자 친화적 메시지 + 재시도 옵션
- [ ] `pnpm build` 에러 없이 성공
- [ ] Vercel Preview 배포 후 정상 작동 확인
- [ ] Lighthouse 모바일 점수: Performance 70+, Accessibility 90+

---

## Git 명령어

```bash
./.github/scripts/git-task.sh start "FEAT" "전체 플로우 통합 및 반응형 마무리"

git commit -m "✨ feat: 페이지 간 네비게이션 및 상태 연결 #<이슈번호>"
git commit -m "🎨 style: 로딩/에러 상태 UI 통일 #<이슈번호>"
git commit -m "🎨 style: 반응형 레이아웃 마무리 #<이슈번호>"
git commit -m "🔧 chore: Vercel 배포 설정 #<이슈번호>"

./.github/scripts/git-task.sh finish "✨ feat: 전체 플로우 통합 및 반응형 마무리 완료"
```
