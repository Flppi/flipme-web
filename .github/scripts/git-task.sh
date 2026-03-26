#!/usr/bin/env bash
# ============================================================================
# FlipMe Git Task Automation Script
# ============================================================================
# 사용법:
#   ./.github/scripts/git-task.sh start <TYPE> <TITLE>
#   ./.github/scripts/git-task.sh finish <COMMIT_MSG>
#   ./.github/scripts/git-task.sh commit <COMMIT_MSG>
#
# 요구사항:
#   - GitHub CLI (gh) 설치 및 인증 완료: https://cli.github.com/
#   - git 설정 완료 (user.name, user.email)
#   - 원격 저장소(origin) 설정 완료
#
# 설치 (macOS):
#   brew install gh
#   gh auth login
# ============================================================================

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# gh CLI 설치 확인
check_gh() {
  if ! command -v gh &> /dev/null; then
    error "GitHub CLI(gh)가 설치되어 있지 않습니다.\n  macOS: brew install gh\n  설치 후: gh auth login"
  fi
  if ! gh auth status &> /dev/null 2>&1; then
    error "GitHub CLI 인증이 필요합니다. 'gh auth login'을 실행해주세요."
  fi
}

# 현재 브랜치명 추출
current_branch() {
  git branch --show-current
}

# .git-task 상태 파일 경로
TASK_STATE=".git-task-state"

# ============================================================================
# start: 이슈 생성 → 브랜치 생성 → 체크아웃
# ============================================================================
cmd_start() {
  local TYPE="${1:?사용법: git-task.sh start <TYPE> <TITLE>}"
  local TITLE="${2:?사용법: git-task.sh start <TYPE> <TITLE>}"

  check_gh

  # TYPE 유효성 검사
  local VALID_TYPES=("FEAT" "FIX" "CHORE" "DOCS" "REFACTOR" "MODIFY")
  local TYPE_UPPER
  TYPE_UPPER=$(echo "$TYPE" | tr '[:lower:]' '[:upper:]')
  local FOUND=false
  for vt in "${VALID_TYPES[@]}"; do
    [[ "$vt" == "$TYPE_UPPER" ]] && FOUND=true && break
  done
  [[ "$FOUND" == false ]] && error "유효하지 않은 타입: $TYPE\n  허용: ${VALID_TYPES[*]}"

  # 라벨 매핑
  local LABEL="enhancement"
  case "$TYPE_UPPER" in
    FEAT)     LABEL="enhancement" ;;
    FIX)      LABEL="bug" ;;
    CHORE)    LABEL="chore" ;;
    DOCS)     LABEL="documentation" ;;
    REFACTOR) LABEL="refactor" ;;
    MODIFY)   LABEL="enhancement" ;;
  esac

  # 이슈 제목 구성
  local ISSUE_TITLE="[${TYPE_UPPER}] ${TITLE}"

  info "이슈 생성 중: ${ISSUE_TITLE}"

  # GitHub 이슈 생성 (gh CLI)
  local ISSUE_URL
  ISSUE_URL=$(gh issue create \
    --title "$ISSUE_TITLE" \
    --body "## ✨ 이슈 내용

- ${TITLE}

## ✅ 체크리스트

- [ ] 구현 완료
- [ ] 테스트 완료
- [ ] 코드 리뷰 완료" \
    --label "$LABEL" 2>&1) || error "이슈 생성 실패: $ISSUE_URL"

  # 이슈 번호 추출
  local ISSUE_NUM
  ISSUE_NUM=$(echo "$ISSUE_URL" | grep -oE '[0-9]+$')
  ok "이슈 #${ISSUE_NUM} 생성 완료: ${ISSUE_URL}"

  # 브랜치명 생성 (한글 → 영문 변환은 수동, 슬러그화)
  local SLUG
  SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9가-힣]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-40)
  local BRANCH_PREFIX
  case "$TYPE_UPPER" in
    FEAT)     BRANCH_PREFIX="feature" ;;
    FIX)      BRANCH_PREFIX="fix" ;;
    REFACTOR) BRANCH_PREFIX="refactor" ;;
    *)        BRANCH_PREFIX="feature" ;;
  esac
  local BRANCH_NAME="${BRANCH_PREFIX}/#${ISSUE_NUM}-${SLUG}"

  # develop 브랜치에서 새 브랜치 생성
  info "브랜치 생성 중: ${BRANCH_NAME}"
  git checkout develop 2>/dev/null || git checkout -b develop
  git pull origin develop 2>/dev/null || true
  git checkout -b "$BRANCH_NAME"
  ok "브랜치 '${BRANCH_NAME}' 생성 및 체크아웃 완료"

  # 상태 저장
  echo "ISSUE_NUM=${ISSUE_NUM}" > "$TASK_STATE"
  echo "BRANCH_NAME=${BRANCH_NAME}" >> "$TASK_STATE"
  echo "TYPE=${TYPE_UPPER}" >> "$TASK_STATE"
  echo "TITLE=${TITLE}" >> "$TASK_STATE"

  echo ""
  ok "===== 태스크 시작 완료 ====="
  info "이슈:   #${ISSUE_NUM}"
  info "브랜치: ${BRANCH_NAME}"
  info ""
  info "커밋 시: ./.github/scripts/git-task.sh commit \"✨ feat: 설명 #${ISSUE_NUM}\""
  info "완료 시: ./.github/scripts/git-task.sh finish \"✨ feat: 설명\""
}

# ============================================================================
# commit: 중간 커밋 (이슈 번호 자동 삽입)
# ============================================================================
cmd_commit() {
  local MSG="${1:?사용법: git-task.sh commit <COMMIT_MSG>}"

  # 상태 파일에서 이슈 번호 읽기
  if [[ ! -f "$TASK_STATE" ]]; then
    error "태스크가 시작되지 않았습니다. 먼저 'git-task.sh start'를 실행하세요."
  fi
  source "$TASK_STATE"

  # 이슈 번호가 메시지에 이미 포함되어 있는지 확인
  if [[ "$MSG" != *"#${ISSUE_NUM}"* ]]; then
    MSG="${MSG} #${ISSUE_NUM}"
  fi

  git add -A
  GIT_COMMITTER_NAME="$(git config user.name)" git commit --no-signoff -m "$MSG"
  ok "커밋 완료: ${MSG}"
}

# ============================================================================
# finish: 최종 커밋 → Push → PR 생성
# ============================================================================
cmd_finish() {
  local MSG="${1:?사용법: git-task.sh finish <COMMIT_MSG>}"

  check_gh

  # 상태 파일에서 정보 읽기
  if [[ ! -f "$TASK_STATE" ]]; then
    error "태스크가 시작되지 않았습니다. 먼저 'git-task.sh start'를 실행하세요."
  fi
  source "$TASK_STATE"

  # 이슈 번호 삽입
  if [[ "$MSG" != *"#${ISSUE_NUM}"* ]]; then
    MSG="${MSG} #${ISSUE_NUM}"
  fi

  # 커밋되지 않은 변경사항이 있으면 커밋
  if [[ -n $(git status --porcelain) ]]; then
    git add -A
    GIT_COMMITTER_NAME="$(git config user.name)" git commit --no-signoff -m "$MSG"
    ok "최종 커밋 완료: ${MSG}"
  else
    info "커밋할 변경사항 없음 (이미 커밋됨)"
  fi

  # Push
  info "원격 저장소에 Push 중..."
  git push -u origin "$BRANCH_NAME"
  ok "Push 완료"

  # PR 생성
  info "Pull Request 생성 중..."
  local PR_BODY="## 📋 관련 이슈
- closes #${ISSUE_NUM}

## 📝 작업 내용
- ${TITLE}

## ✅ 체크리스트
- [ ] 수용 기준 충족
- [ ] 모바일 테스트 완료
- [ ] 빌드 에러 없음"

  local PR_URL
  PR_URL=$(gh pr create \
    --title "[${TYPE}] ${TITLE}" \
    --body "$PR_BODY" \
    --base develop \
    --head "$BRANCH_NAME" 2>&1) || error "PR 생성 실패: $PR_URL"

  ok "PR 생성 완료: ${PR_URL}"

  # 상태 파일 정리
  rm -f "$TASK_STATE"

  echo ""
  ok "===== 태스크 완료 ====="
  info "이슈:   #${ISSUE_NUM} (자동 close 예정)"
  info "PR:     ${PR_URL}"
  info "브랜치: ${BRANCH_NAME} → develop"
}

# ============================================================================
# status: 현재 태스크 상태 확인
# ============================================================================
cmd_status() {
  if [[ ! -f "$TASK_STATE" ]]; then
    info "진행 중인 태스크가 없습니다."
    return
  fi
  source "$TASK_STATE"
  echo ""
  info "===== 현재 태스크 ====="
  info "이슈:   #${ISSUE_NUM}"
  info "브랜치: ${BRANCH_NAME}"
  info "타입:   ${TYPE}"
  info "제목:   ${TITLE}"
  info "현재:   $(current_branch)"
}

# ============================================================================
# 메인 라우터
# ============================================================================
case "${1:-help}" in
  start)   shift; cmd_start "$@" ;;
  commit)  shift; cmd_commit "$@" ;;
  finish)  shift; cmd_finish "$@" ;;
  status)  cmd_status ;;
  *)
    echo "FlipMe Git Task Automation"
    echo ""
    echo "사용법:"
    echo "  $0 start <TYPE> <TITLE>    # 이슈 생성 + 브랜치 생성"
    echo "  $0 commit <MSG>            # 중간 커밋 (이슈 번호 자동 삽입)"
    echo "  $0 finish <MSG>            # 커밋 + Push + PR 생성"
    echo "  $0 status                  # 현재 태스크 상태 확인"
    echo ""
    echo "TYPE: FEAT | FIX | CHORE | DOCS | REFACTOR | MODIFY"
    echo ""
    echo "예시:"
    echo "  $0 start FEAT '사진 업로드 컴포넌트 구현'"
    echo "  $0 commit '✨ feat: 드래그앤드롭 업로드 구현'"
    echo "  $0 finish '✨ feat: 사진 업로드 컴포넌트 구현 완료'"
    ;;
esac
