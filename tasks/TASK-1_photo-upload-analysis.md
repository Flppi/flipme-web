# TASK-1: 사진 업로드 & AI 분석
# 선행 태스크: TASK-0
# 예상 시간: 4시간
# Git 이슈 타입: FEAT

---

## 목표
사용자가 사진을 업로드(촬영/갤러리 선택)하면 OpenAI Vision API로 분위기를 분석하고 결과를 화면에 표시한다.

---

## 구현 상세

### STEP 1: PhotoUploader 컴포넌트
`src/components/PhotoUploader.tsx`

**요구사항:**
- 드래그 앤 드롭 + 클릭 업로드 지원
- 모바일: `<input accept="image/*" capture="environment">` 로 카메라 직접 촬영 지원
- 지원 포맷: JPEG, PNG, HEIC, WebP
- 최대 파일 크기: 10MB
- 업로드 전 클라이언트 사이드 리사이징 (장변 1024px, 품질 0.8)
  - Canvas API로 리사이징 후 base64 변환
- 업로드된 이미지 미리보기 표시
- Zustand 스토어에 base64 이미지 저장

**리사이징 유틸 함수:**
```typescript
// src/lib/resize-image.ts
export async function resizeImage(file: File, maxDim: number = 1024, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
```

**UI 디자인 방향:**
- 중앙 정렬, 세로형 레이아웃 (모바일 퍼스트)
- 업로드 영역: 점선 테두리, 아이콘 + "사진을 올려주세요" 텍스트
- 업로드 후: 이미지 미리보기 + "분석하기" 버튼
- 분석 중: 로딩 애니메이션 (pulse-soft) + "사진의 감성을 읽고 있어요..."

### STEP 2: 이미지 분석 API Route
`src/app/api/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analyzePhoto } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 });
    }

    const analysis = await analyzePhoto(image);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Image analysis failed:', error);
    return NextResponse.json(
      { error: '이미지 분석에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
```

### STEP 3: OpenAI Vision 래퍼
`src/lib/openai.ts`

**구현 사항:**
- `analyzePhoto(base64Image: string): Promise<PhotoAnalysis>` 함수 구현
- DEVELOPMENT_GUIDE.md §5의 프롬프트 사용
- 응답을 JSON으로 파싱 (`JSON.parse`)
- 파싱 실패 시 재시도 1회 (프롬프트에 "Return ONLY valid JSON" 강조)
- 타임아웃: 30초
- base64 이미지에서 `data:image/...;base64,` prefix 제거 후 전송

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: ANALYZE_PROMPT },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Clean}` } }
      ]
    }]
  }),
  signal: AbortSignal.timeout(30000),
});
```

### STEP 4: MoodDisplay 컴포넌트
`src/components/MoodDisplay.tsx`

**분석 결과 표시:**
- 분위기 키워드를 태그 칩으로 표시 (예: #잔잔한 #노을 #따뜻한)
- 에너지 레벨을 그라디언트 바로 시각화
- 추출된 색상을 원형 팔레트로 표시
- AI가 생성한 한 줄 설명 표시
- "음악 추천받기" CTA 버튼

---

## 수용 기준

- [ ] 모바일에서 카메라 촬영 → 업로드 정상 작동
- [ ] 갤러리에서 이미지 선택 → 업로드 정상 작동
- [ ] 10MB 초과 파일 업로드 시 에러 메시지 표시
- [ ] 이미지 리사이징 후 base64 크기가 원본 대비 감소 확인
- [ ] OpenAI API 호출 후 PhotoAnalysis 타입의 JSON 정상 반환
- [ ] 분석 결과(mood, scene, colors, keywords, energy)가 UI에 표시
- [ ] 분석 중 로딩 상태 표시
- [ ] API 실패 시 에러 메시지 표시 + 재시도 가능

---

## Git 명령어

```bash
./.github/scripts/git-task.sh start "FEAT" "사진 업로드 및 AI 분석 기능 구현"

# 커밋 단위
git commit -m "✨ feat: PhotoUploader 컴포넌트 구현 #<이슈번호>"
git commit -m "✨ feat: 이미지 리사이징 유틸 구현 #<이슈번호>"
git commit -m "✨ feat: OpenAI Vision API 연동 #<이슈번호>"
git commit -m "✨ feat: MoodDisplay 분석 결과 UI 구현 #<이슈번호>"

./.github/scripts/git-task.sh finish "✨ feat: 사진 업로드 및 AI 분석 기능 구현 완료"
```
