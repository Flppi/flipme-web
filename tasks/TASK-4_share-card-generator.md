# TASK-4: 인스타그램 공유 카드 생성
# 선행 태스크: TASK-3
# 예상 시간: 4시간
# Git 이슈 타입: FEAT

---

## 목표
사용자가 찍은 사진 + 선택한 곡의 앨범 커버를 결합하여 인스타그램 스토리/피드용 감각적인 공유 카드 이미지를 생성한다.

---

## 구현 상세

### STEP 1: 프레임 스타일 정의
4가지 고정 프레임 스타일을 제공한다.

| 스타일 | 설명 | 레이아웃 |
|--------|------|----------|
| `minimal` | 깔끔한 화이트 프레임 | 사진 상단 70% + 하단에 곡 정보 + 앨범 커버 작게 |
| `polaroid` | 폴라로이드 느낌 | 사진 중앙 + 하단 여백에 곡 제목 손글씨체 |
| `gradient` | 사진 색상 기반 그라디언트 | 사진 좌측 60% + 우측에 그라디언트 배경 위 곡 정보 |
| `vinyl` | LP 레코드 컨셉 | 앨범 커버 원형 + 사진 배경 블러 + 곡 정보 오버레이 |

### STEP 2: ShareCardEditor 컴포넌트
`src/components/ShareCardEditor.tsx`

**기능:**
- 4가지 프레임 스타일 선택 (하단 가로 스크롤 썸네일)
- 실시간 프리뷰 (선택 즉시 카드 미리보기 업데이트)
- 커스텀 텍스트 입력 (선택사항, 최대 50자)
- "저장하기" 버튼 → 이미지 다운로드
- "인스타 스토리에 공유" 버튼 → Web Share API 활용

**카드 생성 기술:**
```typescript
// src/lib/share-card.ts
import html2canvas from 'html2canvas';

export async function generateShareCard(
  cardElement: HTMLElement
): Promise<Blob> {
  const canvas = await html2canvas(cardElement, {
    scale: 2,                    // 레티나 대응
    useCORS: true,               // 외부 이미지 (앨범 커버) CORS 허용
    backgroundColor: null,       // 투명 배경
    width: 1080,                 // 인스타 스토리 권장 너비
    height: 1920,                // 인스타 스토리 권장 높이 (9:16)
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
  });
}
```

### STEP 3: 각 프레임 스타일 구현

**Minimal 프레임:**
```
┌──────────────────────┐
│                      │
│    [사용자 사진]      │
│    (70% 높이)        │
│                      │
├──────────────────────┤
│ [앨범커버] 곡제목     │
│  (48px)   아티스트    │
│           커스텀텍스트 │
│                      │
│      flipme ♪        │
└──────────────────────┘
```

**Polaroid 프레임:**
```
┌──────────────────────┐
│  ┌────────────────┐  │
│  │                │  │
│  │  [사용자 사진]  │  │
│  │                │  │
│  └────────────────┘  │
│                      │
│  "곡 제목"           │
│   — 아티스트          │
│                      │
│  [앨범커버]  flipme  │
└──────────────────────┘
```

**Gradient 프레임:**
```
┌──────────────────────┐
│         │            │
│ [사진]  │ [그라디언트]│
│  60%    │  배경       │
│         │            │
│         │  곡 제목    │
│         │  아티스트    │
│         │ [앨범커버]  │
│         │            │
│         │  flipme ♪  │
└──────────────────────┘
```
- 그라디언트 색상: PhotoAnalysis.colors에서 추출

**Vinyl 프레임:**
```
┌──────────────────────┐
│  [사진 배경 블러]     │
│                      │
│     ┌──────┐         │
│     │앨범  │  ← 원형  │
│     │커버  │         │
│     └──────┘         │
│                      │
│     곡 제목           │
│     아티스트          │
│     flipme ♪         │
└──────────────────────┘
```

### STEP 4: 이미지 다운로드 & 공유

**다운로드:**
```typescript
const downloadCard = async () => {
  const blob = await generateShareCard(cardRef.current!);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flipme-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Web Share API (인스타 스토리 공유):**
```typescript
const shareToInstagram = async () => {
  const blob = await generateShareCard(cardRef.current!);
  const file = new File([blob], 'flipme-card.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'FlipMe',
      text: `${selectedTrack.title} — ${selectedTrack.artist}`,
    });
  } else {
    // Web Share API 미지원 시 다운로드로 fallback
    downloadCard();
  }
};
```

### STEP 5: /card 페이지
`src/app/card/page.tsx`

- Zustand에서 uploadedImage, selectedTrack, analysis 가져오기
- 데이터 없으면 메인 페이지로 리다이렉트
- ShareCardEditor 렌더링
- 하단에 "플랫폼에서 듣기" 버튼 (TASK-5 연결)

---

## 수용 기준

- [ ] 4가지 프레임 스타일 모두 정상 렌더링
- [ ] 프레임 선택 시 실시간 프리뷰 업데이트
- [ ] 생성된 이미지 해상도: 1080x1920 (인스타 스토리 규격)
- [ ] 앨범 커버 이미지가 카드에 정상 포함 (CORS 문제 없음)
- [ ] "저장하기" → PNG 다운로드 정상 작동
- [ ] 모바일에서 Web Share API로 공유 가능 (지원 기기)
- [ ] Web Share API 미지원 시 자동으로 다운로드 fallback
- [ ] 커스텀 텍스트 입력 반영
- [ ] FlipMe 워터마크/로고 포함

---

## 주의사항

### html2canvas CORS 이슈
- Deezer 앨범 커버 URL은 외부 도메인이므로 `useCORS: true` 필수
- 일부 CDN에서 CORS 헤더가 없을 수 있음 → API Route에서 이미지를 프록시하는 fallback 필요
  ```typescript
  // src/app/api/proxy-image/route.ts
  // 외부 이미지를 가져와 base64로 변환 후 반환
  ```

### 인스타그램 스토리 규격
- 권장 해상도: 1080x1920 (9:16)
- 안전 영역: 상하 250px 여백 (UI 요소와 겹치지 않도록)

---

## Git 명령어

```bash
./.github/scripts/git-task.sh start "FEAT" "인스타그램 공유 카드 생성 기능 구현"

git commit -m "✨ feat: ShareCardEditor 컴포넌트 기본 구조 #<이슈번호>"
git commit -m "✨ feat: Minimal/Polaroid 프레임 구현 #<이슈번호>"
git commit -m "✨ feat: Gradient/Vinyl 프레임 구현 #<이슈번호>"
git commit -m "✨ feat: 카드 이미지 다운로드 및 Web Share API 연동 #<이슈번호>"

./.github/scripts/git-task.sh finish "✨ feat: 인스타그램 공유 카드 생성 기능 구현 완료"
```
