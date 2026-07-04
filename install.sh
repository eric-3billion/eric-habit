#!/usr/bin/env bash
# code-style SSOT를 ~/.claude로 심링크한다. 멱등.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE="$HOME/.claude"
RULES="$CLAUDE/rules"
SKILLS="$CLAUDE/skills"
TS="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$RULES" "$SKILLS"

backup() { # $1: path to back up if it's a real file/dir (not our symlink)
  if [ -e "$1" ] && [ ! -L "$1" ]; then
    mv "$1" "$1.bak-$TS"
    echo "  backed up: $1 -> $1.bak-$TS"
  elif [ -L "$1" ]; then
    rm "$1"
  fi
}

echo "== skill =="
backup "$SKILLS/eric-review"
ln -s "$REPO/skills/eric-review" "$SKILLS/eric-review"
echo "  linked: $SKILLS/eric-review -> $REPO/skills/eric-review"

echo "== rules (habits 전역 로드) =="
# 기존 분산 룰 파일은 내용이 habits로 흡수됨 → 백업 후 제거
backup "$RULES/upper-branch-rule.md"
backup "$RULES/functional-code.md"

# habits만 심링크. interaction.md(개인 톤 설정)는 이 repo에 없으며 ~/.claude/rules의 로컬 파일로 유지.
for f in "$REPO"/habits/*.md; do
  name="$(basename "$f")"
  backup "$RULES/$name"
  ln -s "$f" "$RULES/$name"
  echo "  linked: $RULES/$name"
done

echo "== CLAUDE.md @import (rules 전역 자동 로드) =="
# ~/.claude/rules 는 Claude Code 가 자동 로드하지 않는다.
# 전역 자동 로드 경로는 ~/.claude/CLAUDE.md 뿐이므로 여기서 habits 를 @import 한다.
# 마커 블록으로 감싸 멱등하게 갱신한다(사용자의 기존 CLAUDE.md 내용은 보존).
GLOBAL_MD="$CLAUDE/CLAUDE.md"
MARK_START="# >>> eric-code-habit (auto-managed) >>>"
MARK_END="# <<< eric-code-habit <<<"

block="$MARK_START
# 코드 습관 SSOT: $REPO/habits — install.sh 가 관리한다(수동 편집 금지).
"
for f in "$REPO"/habits/*.md; do
  block="$block@rules/$(basename "$f")
"
done
block="$block$MARK_END"

touch "$GLOBAL_MD"
if grep -qF "$MARK_START" "$GLOBAL_MD"; then
  # 기존 마커 블록 교체
  tmp="$GLOBAL_MD.tmp-$TS"
  awk -v s="$MARK_START" -v e="$MARK_END" '
    $0==s {skip=1} !skip {print} $0==e {skip=0}
  ' "$GLOBAL_MD" > "$tmp"
  printf '%s\n' "$block" >> "$tmp"
  mv "$tmp" "$GLOBAL_MD"
  echo "  updated block in: $GLOBAL_MD"
else
  # 최초 추가
  { [ -s "$GLOBAL_MD" ] && echo ""; printf '%s\n' "$block"; } >> "$GLOBAL_MD"
  echo "  appended block to: $GLOBAL_MD"
fi

echo "done."
