# TASK-2: 음악 추천 엔진
# 선행 태스크: TASK-1
# 예상 시간: 4시간
# Git 이슈 타입: FEAT

---

## 목표
PhotoAnalysis 결과를 기반으로 Deezer API에서 분위기에 맞는 음악을 검색하고, 에너지/분위기 기반으로 필터링하여 5~10곡을 추천한다.

---

## 구현 상세

### STEP 1: mood-to-query 변환 로직
`src/lib/mood-to-query.ts`

PhotoAnalysis의 keywords, mood, energy를 조합하여 Deezer 검색 쿼리를 생성한다.

```typescript
interface QueryStrategy {
  queries: string[];      // 여러 검색 쿼리 (다양성 확보)
  genreHints: string[];   // 장르 힌트
  energyRange: [number, number]; // 필터링용 에너지 범위
}

export function buildSearchQueries(analysis: PhotoAnalysis): QueryStrategy {
  // 규칙 기반 매핑 테이블
  const moodToGenre: Record<string, string[]> = {
    '잔잔한': ['acoustic', 'indie folk', 'ambient'],
    '활기찬': ['pop', 'dance', 'upbeat'],
    '몽환적인': ['dream pop', 'shoegaze', 'chillwave'],
    '쓸쓸한': ['indie', 'lo-fi', 'ballad'],
    '따뜻한': ['bossa nova', 'jazz', 'acoustic'],
    '도시적인': ['r&b', 'neo soul', 'city pop'],
    '자유로운': ['surf rock', 'indie pop', 'tropical'],
    '고요한': ['classical', 'piano', 'ambient'],
  };

  // energy에 따른 템포 힌트
  const tempoHint = analysis.energy < 0.3 ? 'slow'
    : analysis.energy < 0.6 ? 'medium'
    : 'upbeat';

  // keywords와 장르 힌트를 조합하여 2~3개 검색 쿼리 생성
  // 예: ["sunset acoustic chill", "golden hour indie folk", "warm evening bossa nova"]
}
```

**핵심 설계 원칙:**
- 하나의 쿼리로 끝내지 않는다. 2~3개 쿼리를 만들어 결과의 다양성을 확보한다.
- Deezer 검색은 영문 키워드가 정확도가 높다. keywords 필드를 우선 활용한다.
- mood(한국어)는 장르 매핑에만 사용하고, 실제 검색은 영문으로 한다.

### STEP 2: Deezer API 래퍼
`src/lib/deezer.ts`

```typescript
const DEEZER_BASE = 'https://api.deezer.com';

export async function searchTracks(query: string, limit: number = 25): Promise<DeezerTrack[]> {
  const res = await fetch(
    `${DEEZER_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { next: { revalidate: 3600 } } // 1시간 캐시
  );

  if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);

  const data = await res.json();

  return data.data
    .filter((track: any) => track.preview) // preview URL이 있는 트랙만
    .map((track: any): DeezerTrack => ({
      id: track.id,
      title: track.title,
      artist: track.artist.name,
      album: track.album.title,
      albumCoverUrl: track.album.cover_big, // 500x500
      previewUrl: track.preview,            // 30초 MP3
      deezerUrl: track.link,
      duration: track.duration,
    }));
}
```

**Rate Limit 처리:**
- Deezer: 50 req / 5초
- 2~3개 쿼리를 순차 실행하되, 쿼리 사이에 200ms 딜레이 삽입
- 429 에러 시 2초 대기 후 1회 재시도

### STEP 3: 추천 API Route
`src/app/api/recommend/route.ts`

**로직 순서:**
1. `buildSearchQueries(analysis)` → 2~3개 쿼리 생성
2. 각 쿼리로 `searchTracks()` 호출
3. 결과 합산 → 중복 제거 (track.id 기준)
4. energy 기반 정렬: analysis.energy와 트랙 분위기가 유사한 순서
5. 상위 5~10곡 반환

**중복 제거 로직:**
```typescript
const seen = new Set<number>();
const unique = allTracks.filter(track => {
  if (seen.has(track.id)) return false;
  seen.add(track.id);
  return true;
});
```

### STEP 4: TrackList 및 TrackCard 컴포넌트
`src/components/TrackList.tsx`, `src/components/TrackCard.tsx`

**TrackCard 표시 정보:**
- 앨범 커버 이미지 (정사각형, 라운드 코너)
- 곡 제목 (1줄 truncate)
- 아티스트명
- 미리듣기 재생 버튼 (TASK-3에서 구현, 여기서는 placeholder)
- "이 곡 선택" 버튼

**TrackList:**
- 가로 스크롤 카드 목록 (모바일 최적화)
- 또는 세로 리스트 (2열 그리드, 태블릿 이상)
- 선택된 곡 하이라이트 표시

---

## 수용 기준

- [ ] PhotoAnalysis → Deezer 검색 쿼리 변환이 일관적으로 작동
- [ ] Deezer API에서 preview URL이 있는 트랙만 반환
- [ ] 최소 5곡, 최대 10곡 추천 결과 표시
- [ ] 곡 선택 시 Zustand 스토어에 selectedTrack 저장
- [ ] Deezer API 실패 시 에러 메시지 표시
- [ ] 중복 트랙 없음
- [ ] 추천 결과 로딩 중 스켈레톤 UI 표시

---

## Git 명령어

```bash
./.github/scripts/git-task.sh start "FEAT" "음악 추천 엔진 구현"

git commit -m "✨ feat: mood-to-query 변환 로직 구현 #<이슈번호>"
git commit -m "✨ feat: Deezer API 래퍼 구현 #<이슈번호>"
git commit -m "✨ feat: 추천 API Route 구현 #<이슈번호>"
git commit -m "✨ feat: TrackList/TrackCard 컴포넌트 구현 #<이슈번호>"

./.github/scripts/git-task.sh finish "✨ feat: 음악 추천 엔진 구현 완료"
```
