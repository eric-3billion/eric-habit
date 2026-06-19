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

echo "done."
