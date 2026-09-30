# code-style — Eric의 코드 습관 SSOT

내 코드 습관(설계 원칙·스타일·도메인 패턴)의 **단일 출처(single source of truth)**. 흩어진 룰/메모리/리뷰 하네스를 여기로 모은다. 룰 텍스트는 `habits/`에만 존재하고, 리뷰 스킬·`~/.claude/rules`는 이걸 **참조/심링크**한다.

## 구조

```
habits/                       # SSOT — 관심사별 1파일 (단일 관심사)
  00-intent.md                # 의도 드러남 / 예측가능성 (최우선)
  01-component-design.md      # 분기 상단화·단방향·중간핸들러·단일관심사·태그드유니온·props·주석·JSX=UI
  02-structure-cohesion.md    # SSOT(하드코딩/임시 단일모듈)·응집·선언=의존성순서
  03-composition.md           # compound/render-props/슬롯 > drilling · 변경 전파 최소화(blast radius)
  04-functional-domain.md     # 함수형 · 도메인룰=순수함수
  05-types.md                 # 땜빵 옵셔널 강혐 · 타입 일관성
  06-testing.md               # within 스코프 · mock 충실 · 커버리지 · fixture
  canonical-examples.md       # 실제 코드 예시(도메인 중립): 의도 드러내는 폴백·순수함수 도메인 룰·branded key
skills/eric-review/           # PR 리뷰 스킬 — habits를 참조, 절차만 보유
  SKILL.md                    # 메인 루프가 직접 멀티렌즈 리뷰 (워크플로/서브에이전트 없음)
lint/                         # habits 중 정적분석 가능한 룰의 ESLint 프리셋 (lint/README.md)
install.sh                    # ~/.claude 로 심링크
```

## 원칙 (이 repo 자체에 적용)

- **SSOT**: 룰 텍스트는 `habits/`에만. 스킬/rules/메모리는 중복 보관 금지, 참조만.
- **단일 관심사**: 한 habit 파일 = 한 관심사.
- **계속 업데이트**: 새 습관은 해당 habit 파일에 추가 → 스킬·rules에 자동 반영(심링크).

## 강제 층 분업 — 한쪽을 바꾸면 다른 쪽도

같은 룰이 세 층에 걸쳐 강제된다. 룰 **텍스트**는 여전히 `habits/` 에만 있고, 나머지 층은 그 룰을 **어떻게 잡는지**만 갖는다.

| 층 | 소유 | 잡는 것 |
|---|---|---|
| `habits/` | 룰의 왜·무엇 (SSOT) | — |
| `lint/` | 기계로 판정 가능한 무엇 — 형태·목록·타입 계약 | [lint/README](lint/README.md) 「룰 ↔ habits」 |
| `skills/eric-review`·`eric-refine` | 판단이 필요한 무엇 — 의미·경계·축 | [lint/README](lint/README.md) 「lint 로 안 되는 것」·「리뷰와의 분업」 |

**어느 층이 무엇을 잡는지는 `lint/README` 한 곳에만 적는다.** 스킬은 그 표를 읽고 lint 몫을 건너뛴다.

| 바꾼 것 | 같이 바꿀 것 |
|---|---|
| lint 가 강제하는 habit 문구 | `lint/` 설정·커스텀 룰·`test/fixtures`, `lint/README` 표 |
| 00 동사 표 | `lint/index.mjs` `FUNCTION_VERBS`, `lint/rules/verb-return-contract.mjs` `CONTRACTS`, fixtures |
| 새 habit 추가 | 정적분석으로 판정 가능한지 먼저 본다 → 가능하면 lint 룰 추가 + `lint/README` 「룰 ↔ habits」, 아니면 「lint 로 안 되는 것」에 한 줄 |
| lint 룰 추가·완화·삭제 | 대응 habit 문구(완화 사유가 룰의 경계면 habit 에도), `lint/README` 두 표 — 리뷰가 다시 봐야 하는 항목이 생기면 「lint 로 안 되는 것」으로 옮긴다 |
| 리뷰에서 lint 가 잡았어야 할 위반을 발견 | lint 커버리지 구멍 — lint 개선 후보로 보고한다 |

## 설치

```bash
bash install.sh
```
install.sh가 하는 일(멱등):
- `~/.claude/skills/eric-review` → `skills/eric-review` 심링크
- `~/.claude/rules/*` → `habits/*` 심링크
- `~/.claude/CLAUDE.md`에 `@rules/*` import 블록 추가 (마커로 감싸 갱신, 기존 내용 보존)

> `~/.claude/rules`는 Claude Code가 자동 로드하지 않는다. 전역 자동 로드 경로는 `~/.claude/CLAUDE.md` 뿐이라, 여기서 habits를 `@import`해야 모든 프로젝트에서 매 세션 자동 적용된다. 이 import 블록은 `# >>> eric-code-habit >>>` 마커로 관리되므로 수동 편집하지 말 것.

> 응답 톤 등 개인 설정(`interaction.md`)은 이 repo에 포함하지 않고 `~/.claude/rules`에 로컬로만 둔다(코드 습관과 별개 관심사).

## 사용

- 리뷰: `/eric-review <PR번호|URL>`
- 습관 갱신: `habits/<file>.md` 편집 → 커밋. (심링크라 즉시 반영)
