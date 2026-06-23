---
name: eric-review
description: Eric 스타일 PR 코드리뷰 하네스. 코드 습관 SSOT(../../habits)를 기반으로 6개 렌즈(의도/컴포넌트/함수형·도메인/타입/정확성/테스트)로 멀티에이전트가 흩뿌려 탐색하고, 파일을 직접 까서 적대적으로 오탐(false positive)을 검증한 뒤, 고가치 발견만 한국어 인라인 코멘트 후보로 뽑고, 자동 게시 대신 선택 UI(AskUserQuestion)로 사용자가 고른 것만 PR에 단다. "리뷰해줘", "내 스타일로 봐줘", "PR 까봐", "code review", PR URL/번호가 주어진 코드리뷰 요청에서 사용.
---

# eric-review — PR 리뷰 하네스

GitHub PR을 Eric의 코드 습관으로 리뷰한다. **습관 룰은 이 스킬에 두지 않는다 — `habits/`(SSOT)를 읽어서 적용한다.** 이 문서는 *PR 리뷰 절차*만 담는다.

핵심 흐름: **흩뿌려 찾고(멀티렌즈, 룰은 habits에서) → 파일 까서 적대적으로 검증(오탐 컷) → 고가치만 코멘트 후보로 → 사용자가 선택 UI로 고른 것만 게시.**

## 습관 SSOT

룰의 단일 출처는 이 스킬의 조상 디렉터리 `habits/`다. 스킬은 `<repo>/skills/eric-review/`에 있고 SSOT는 `<repo>/habits/`. 심링크로 설치돼 있어도 실제 파일 경로(`~/code-style/habits/`)로 읽으면 된다.

렌즈 ↔ habit 파일:
- `intent` → `00-intent.md` (최우선)
- `component` → `01-component-design.md`, `02-structure-cohesion.md`, `03-composition.md`
- `functional` → `04-functional-domain.md` (+ `canonical-examples.md`)
- `types` → `05-types.md`
- `test` → `06-testing.md`
- `correctness` → (습관 아님) 일반 정확성/React 품질

## 정직한 구분

- 렌즈의 *룰*(habits) = Eric 습관.
- *적대적 검증 / 고가치 필터 / 기존리뷰 충돌 방지* = 이 하네스의 엔지니어링(신뢰도 보강용, 스타일 룰 아님).

## 절차

1. **PR 식별** — `$ARGUMENTS`의 PR 번호/URL. 없으면 물어본다. `mode`는 기본 `report`(보고만), "댓글 달아줘"류면 `post`. **단 어느 모드든 7번 선택 UI를 거치며 자동 게시는 절대 안 한다** — `post`는 "게시할 의향"일 뿐, 무엇을 달지는 사용자가 고른다.

2. **head 스냅샷 수집** (gh-only, 로컬 repo는 안 건드린다 — worktree/checkout 불필요):
   > **오염 방지 핵심** — finder 를 로컬 repo cwd 에서 굴리면 에이전트가 본능적으로 `git diff`/`status` 를
   > 쳐서 **이 PR 과 무관한 커밋되지 않은 working tree 변경을 리뷰**해버린다(실제로 오염된 적 있음).
   > 그래서 PR head 를 `/tmp` 스냅샷으로 받아두고, 워크플로는 **경로만** 받아 에이전트가 그 스냅샷만 Read 하게 한다.
   > (본문을 args 에 인라인하지 않는다 — 수천 줄 `types.ts` 같은 파일이 끼면 args 가 비대해져 워크플로 호출로
   > 재emit 하는 게 비현실적이기 때문. 경로만 넘기면 파일 크기와 무관하게 항상 동작한다.)
   ```bash
   PR=<번호>; REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
   SHA=$(gh pr view $PR --json headRefOid -q .headRefOid)
   DEST="<scratchpad>/pr-files"; rm -rf "$DEST"; mkdir -p "$DEST"
   gh pr diff $PR > "<scratchpad>/pr.diff"
   gh pr diff $PR --name-only | while read -r f; do
     mkdir -p "$DEST/$(dirname "$f")"
     gh api "repos/$REPO/contents/$f?ref=$SHA" -H "Accept: application/vnd.github.raw" > "$DEST/$f" 2>/dev/null || echo "MISS $f"
   done
   gh pr diff $PR --name-only   # 이 목록을 워크플로 args.files (repo-relative 경로 배열)로 넘긴다
   ```

3. **기존 리뷰 수집** (충돌 방지) — `gh api repos/$REPO/pulls/$PR/comments` 로 이미 달린 인라인 코멘트의 (path,line) 집합 확보.

4. **워크플로 실행** — 경로/목록만 넘긴다(본문 인라인 X). `files` 는 2번 `--name-only` 의 repo-relative 경로 배열:
   ```
   Workflow({ scriptPath: "<이 스킬 폴더>/workflow.js",
              args: { pr: PR, habitsDir: "~/code-style/habits",
                      baseDir: "<DEST>", diffPath: "<scratchpad>/pr.diff",
                      files: ["src/.../a.tsx", "src/.../b.ts", ...] } })
   ```
   각 렌즈 finder 는 habit 룰 + **`baseDir` 스냅샷 파일 + `diffPath`** 만 Read 해 검토 → 발견별 적대적 검증(불확실하면 기각) → 확정/조정만 반환. **finder/verifier 는 Explore 가 아니며 git/Bash/로컬 repo 접근이 금지**된다(diff 는 `diffPath` 파일로 제공되므로 git 을 칠 이유가 없다).

5. **직접 재검증** — confirmed 중 의심스러운 정확성 주장(레이스/미사용/매핑 등)은 메인 루프가 원본을 직접 읽어 한 번 더 깎는다. 검증자도 틀린다.

6. **보고** — 심각도(blocker/high/medium/low/nit)×렌즈로 묶어 `파일:라인` 마크다운 링크로. 기각된 오탐도 투명하게 요약. 기존 리뷰와 교차검증 명시.

7. **코멘트 후보 리스트업 + 선택 UI** — `report`/`post` 무관하게 **자동 게시 금지. 항상 사용자가 고른다.**
   1. 6번 confirmed/adjusted 중 **게시 가치 있는 것만** 코멘트 후보로 추린다(이론적 nit/노이즈 제외). 각 후보를 바로 붙일 수 있게 초안:
      - `path`, `line`(side `RIGHT`; 수정 파일은 diff 헌크 안의 라인만), 한국어 `body`(근거 코드 + 처방).
      - 3번 기존 코멘트 집합과 (path,line) 중복·내용 모순이면 후보에서 **제외**.
      - **라인 정확성**: head 스냅샷에서 해당 라인을 grep 으로 재확인(어긋나면 리뷰 전체가 422 거부).
   2. 후보를 본문에 번호 매긴 리스트(`파일:라인` 링크 · 심각도 · 한 줄 요지)로 먼저 보여준다.
   3. **AskUserQuestion 으로 무엇을 게시할지 고르게 한다** (절대 자동 게시하지 말 것):
      - 후보 1건 = 옵션 1개, `multiSelect: true`. 옵션 `label`=`파일:라인 — 제목`(≤간결), `description`=`심각도·렌즈`, `preview`=게시될 코멘트 **본문 전문**(사용자가 옵션 훑으며 실제 댓글을 미리 봄).
      - 질문당 옵션 최대 4개 → 후보 5건↑이면 질문을 나눠(최대 4질문) 파일/주제별로 그룹핑. 그래도 넘치면 상위 심각도순으로 추리고 누락분은 보고에 명시.
      - 후보 0건이면 이 단계 건너뛰고 "달 만한 것 없음"으로 끝낸다.

8. **선택분만 게시** — 사용자가 고른 후보만:
   - `gh api repos/$REPO/pulls/$PR/reviews --input review.json` (event: `COMMENT`), `comments: [{path, line, side:"RIGHT", body}]` (선택된 것만).
   - 고른 게 없으면 게시하지 않고 끝. 게시 후 PR 리뷰 URL 회신.

9. 작업 성격에 맞는 마무리 멘트(전역 룰 따름).

## 강도 조절

- 빠른 점검: 렌즈 intent/component + 단일 검증. "철저히/audit": 6렌즈 전부 + 검증 다표결.
- 함수형 비중은 대상에 맞춰 — 순수 로직/유틸이면 `functional` 강하게, 컴포넌트 트리면 `intent`/`component` 강하게.
