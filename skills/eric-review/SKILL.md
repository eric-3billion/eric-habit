---
name: eric-review
description: Eric 스타일 PR 코드리뷰 하네스. 코드 습관 SSOT(../../habits)를 기반으로 6개 렌즈(의도/컴포넌트/함수형·도메인/타입/정확성/테스트)로 PR 변경분을 직접 훑고, 스냅샷 코드로 적대적으로 오탐(false positive)을 자기검증한 뒤, 고가치 발견만 한국어 인라인 코멘트 후보로 뽑고, 자동 게시 대신 선택 UI(AskUserQuestion)로 사용자가 고른 것만 PR에 단다. "리뷰해줘", "내 스타일로 봐줘", "PR 까봐", "code review", PR URL/번호가 주어진 코드리뷰 요청에서 사용.
---

# eric-review — PR 리뷰 하네스

GitHub PR을 Eric의 코드 습관으로 리뷰한다. **습관 룰은 이 스킬에 두지 않는다 — `habits/`(SSOT)를 읽어서 적용한다.** 이 문서는 *PR 리뷰 절차*만 담는다.

핵심 흐름: **메인 루프가 직접 멀티렌즈로 훑고(룰은 habits에서) → 스냅샷 코드로 적대적 자기검증(오탐 컷) → 고가치만 코멘트 후보로 → 사용자가 선택 UI로 고른 것만 게시.**

> **메인 루프가 직접 한다 — 서브에이전트/워크플로 안 쓴다.** 과거에 6렌즈 멀티에이전트 워크플로를 썼으나, (1) cwd 의 dirty working tree 를 git 으로 긁어 오염, (2) 큰 파일 본문 인라인 시 args 비대, (3) verifier 가 스냅샷을 못 읽어 전부 기각 — 세 번 깨지고 토큰만 먹었다. 작은~중간 PR 은 메인 루프가 직접 읽고 판단하는 게 더 빠르고 안정적이라 워크플로를 제거했다. 되살리지 말 것.

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
- *적대적 자기검증 / 고가치 필터 / 기존리뷰 충돌 방지* = 이 하네스의 엔지니어링(신뢰도 보강용, 스타일 룰 아님).

## 절차

1. **PR 식별** — `$ARGUMENTS`의 PR 번호/URL. 없으면 물어본다. `mode`는 기본 `report`(보고만), "댓글 달아줘"류면 `post`. **단 어느 모드든 7번 선택 UI를 거치며 자동 게시는 절대 안 한다** — `post`는 "게시할 의향"일 뿐, 무엇을 달지는 사용자가 고른다.

2. **head 스냅샷 수집** (gh-only):
   > **왜 스냅샷인가** — 로컬 working tree 엔 이 PR 과 무관한 커밋되지 않은 변경이 섞여 있다(실제로 그걸 리뷰해 오염된 적 있음). 리뷰는 **항상 `/tmp` 스냅샷 + `pr.diff` 만** 근거로 한다. `git diff`/`status`/working tree 를 리뷰 근거로 쓰지 말 것.
   ```bash
   PR=<번호>; REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
   SHA=$(gh pr view $PR --json headRefOid -q .headRefOid)
   DEST="<scratchpad>/pr-files"; rm -rf "$DEST"; mkdir -p "$DEST"
   gh pr diff $PR > "<scratchpad>/pr.diff"
   gh pr diff $PR --name-only | while read -r f; do
     mkdir -p "$DEST/$(dirname "$f")"
     gh api "repos/$REPO/contents/$f?ref=$SHA" -H "Accept: application/vnd.github.raw" > "$DEST/$f" 2>/dev/null || echo "MISS $f"
   done
   ```

3. **기존 리뷰 수집** (충돌 방지) — `gh api repos/$REPO/pulls/$PR/comments` 로 이미 달린 인라인 코멘트의 (path,line) 집합 확보.

4. **직접 멀티렌즈 리뷰** (메인 루프가 직접 — 워크플로/서브에이전트 X):
   - 먼저 해당 렌즈의 habit 파일(`~/code-style/habits/00~06`)을 Read 해 룰을 기준으로 삼는다.
   - `pr.diff` 를 Read 해 무엇이 어떻게 바뀌었는지 파악하고, 맥락이 필요한 파일은 `<DEST>/` 스냅샷 본문을 Read 한다.
   - 6렌즈(intent/component/functional/types/correctness/test)로 변경분을 훑어 발견을 모은다. 대상 성격에 맞춰 비중 조절(아래 강도 조절).
   - **근거는 오직 스냅샷 + `pr.diff`.** git/working tree/다른 경로 탐색 금지.

5. **적대적 자기검증** (오탐 컷) — 발견마다 스냅샷의 해당 라인을 **다시 열어 코드로 확인**한다. 추측·환각이거나 "미사용 같지만 맵 통해 쓰임 / race 같지만 격리 state / 타입 미스매치 같지만 동일 타입" 류면 버린다. 정확성 발견은 실패 시나리오를 구성해보고 실제로 못 터지면 버린다. 라인 번호도 스냅샷으로 확정(추측 금지).

6. **보고** — 심각도(blocker/high/medium/low/nit)×렌즈로 묶어 `파일:라인` 마크다운 링크로. 버린 오탐도 투명하게 한 줄 요약. 기존 리뷰와 교차(중복/모순 회피) 명시. 잘한 점도 짧게.

7. **코멘트 후보 리스트업 + 선택 UI** — `report`/`post` 무관하게 **자동 게시 금지. 항상 사용자가 고른다.**
   1. 6번 발견 중 **게시 가치 있는 것만** 코멘트 후보로 추린다(이론적 nit/노이즈 제외). 각 후보를 바로 붙일 수 있게 초안:
      - `path`, `line`(side `RIGHT`; 수정 파일은 diff 헌크 안의 라인만), 한국어 `body`(근거 코드 + 처방).
      - 3번 기존 코멘트 집합과 (path,line) 중복·내용 모순이면 후보에서 **제외**.
      - **라인 정확성**: head 스냅샷에서 해당 라인을 grep 으로 재확인(어긋나면 리뷰 전체가 422 거부).
   2. 후보를 본문에 번호 매긴 리스트(`파일:라인` 링크 · 심각도 · 한 줄 요지)로 먼저 보여준다.
   3. **AskUserQuestion 으로 무엇을 게시할지 고르게 한다** (절대 자동 게시하지 말 것):
      - 후보 1건 = 옵션 1개, `multiSelect: true`. 옵션 `label`=`파일:라인 — 제목`(간결), `description`=`심각도·렌즈`, `preview`=게시될 코멘트 **본문 전문**(사용자가 옵션 훑으며 실제 댓글을 미리 봄).
      - 질문당 옵션 최대 4개 → 후보 5건↑이면 질문을 나눠(최대 4질문) 파일/주제별로 그룹핑. 그래도 넘치면 상위 심각도순으로 추리고 누락분은 보고에 명시.
      - 후보 0건이면 이 단계 건너뛰고 "달 만한 것 없음"으로 끝낸다.

8. **선택분만 게시** — 사용자가 고른 후보만:
   - `gh api repos/$REPO/pulls/$PR/reviews --input review.json` (event: `COMMENT`), `comments: [{path, line, side:"RIGHT", body}]` (선택된 것만).
   - 고른 게 없으면 게시하지 않고 끝. 게시 후 PR 리뷰 URL 회신.

9. 작업 성격에 맞는 마무리 멘트(전역 룰 따름).

## 강도 조절

- 빠른 점검: intent/component 위주로 가볍게. "철저히/audit": 6렌즈 전부 + 5번 자기검증을 더 꼼꼼히(발견마다 코드 재확인 + 실패 시나리오 구성).
- 함수형 비중은 대상에 맞춰 — 순수 로직/유틸이면 `functional` 강하게, 컴포넌트 트리면 `intent`/`component` 강하게.
- PR이 아주 크면(수십 파일) 렌즈/파일을 나눠 여러 패스로 훑되, 각 패스도 메인 루프가 직접 한다.
