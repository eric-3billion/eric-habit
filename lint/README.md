# @eric/eslint-preset

`habits/` 중 **정적분석으로 판정할 수 있는 룰**을 ESLint flat config 로 강제한다.

- 룰의 "왜"는 `habits/` 에만 있다. 여기는 "무엇"을 기계로 옮긴 것이고, 모든 메시지 끝에 근거 habit 이 붙어 있다.
- 판단이 필요한 룰(아래 「lint 로 안 되는 것」)은 `eric-review` / `eric-refine` 몫으로 남는다.

## 사용

```js
// eslint.config.mjs
import { createEslintPreset } from "@eric/eslint-preset";

export default [
  ...createEslintPreset({
    effectAllowedFiles: ["src/shared/lib/external-sync/**"],
    publicApiPatterns: ["@/entities/*/*", "@/features/*/*"],
  }),
];
```

- **타입 정보를 쓰지 않는다.** 모든 룰이 문법만으로 판정하므로 `tsconfig` 연결이 필요 없고 빠르다. 동사별 반환 계약도 **적어둔 리턴 타입**만 본다.
- **예외는 config 에 모은다.** `useEffect` 허용 위치는 `effectAllowedFiles` 파일 glob 한 곳에 둔다.
- **기존 코드 소급 수정 금지(habits/01 §7)는 bulk suppressions 로 처리한다.** 도입 시 `eslint --suppress-all` 로 현재 위반을 baseline(`eslint-suppressions.json`)에 박으면 신규 코드만 강제되고, 고칠 때마다 `--prune-suppressions` 로 줄여간다.
- 순환 import 는 이 프리셋에서 검사하지 않는다 — 전체 모듈 그래프가 필요해 느리고(client 기준 lint 시간의 76%), dependency-cruiser 같은 전용 도구가 맡는다.

## 룰 ↔ habits

### 기성 룰

| habits | 룰 |
|---|---|
| 05 `as` 금지 | `@typescript-eslint/consistent-type-assertions` (`as const` 는 통과) |
| 05 `!` · `any` | `no-non-null-assertion`, `no-explicit-any` |
| 04 리턴 타입 명시 | `eric/explicit-return-type` (export 함수, 컴포넌트 제외) |
| 04 불변 | `no-param-reassign`, `let` 금지(셀렉터) |
| 04 중첩 삼항 금지 | `no-nested-ternary` |
| 01 §7 props 는 interface | `consistent-type-definitions` (판별 유니온 `type` 은 안 걸림) |
| 02 선언 = 의존성 순서 | `no-use-before-define` (`functions: false` — 상수·타입만 TDZ 순서, function 은 읽는 순서) |
| 00 `*Info`·`*Data` 타입 이름 | `naming-convention` (typeLike) |
| 01 §7 변경 이력 주석 | `no-warning-comments` (`기존엔`·`원래는` …, warn) |

### 셀렉터 (`no-restricted-imports` / `no-restricted-syntax`)

| habits | 막는 것 |
|---|---|
| 01 §3 | `useQuery`·`useQueries`·`useInfiniteQuery` import |
| 01 §3 | `useSuspenseQuery({ … })` 인라인 옵션 — 팩토리만 |
| 01 §3 | 같은 경계의 `useSuspenseQuery` 연속 호출(워터폴, **warn** — 의존 쿼리는 무시) |
| 01 §6 | `useEffect`·`useLayoutEffect` (`effectAllowedFiles` 밖) |
| 02 | `(typeof X)[number]` — 배열에서 유니온 파생 |
| 02 · 06 | 슬라이스 딥임포트 (`publicApiPatterns`) |
| 04 | 명시적 루프, `let` |
| 04 | `parse*`/`validate*` 안의 `throw` |
| 04 | `[{ test: fn, … }]` 판정 테이블 (**warn**) |
| 01 §7 | 컴포넌트의 raw `"-"` 반환 |
| 03 | `show*`/`hide*` boolean prop (**warn**) |
| 06 | src 의 `data-testid`, 테스트의 `*ByTestId`·`getComputedStyle` |

### 커스텀 룰 (`eric/*`)

| 룰 | habits | 내용 |
|---|---|---|
| `function-verb-whitelist` | 00 동사 표 | 함수를 **선언하는 자리**의 동사는 `FUNCTION_VERBS` 만. `And` 금지. 조합자(`all`·`any`)·컴포넌트 제외, 구조분해·호출 결과는 대상 아님. 테스트는 `setup`·`mock`·`expect`·`query` 추가 허용, 단독 `setup`·`wrapper` 예외 |
| `explicit-return-type` | 04 | export 함수의 리턴 타입 명시. 컴포넌트(PascalCase)는 제외 |
| `verb-return-contract` | 00 동사 표 | **적어둔 리턴 타입**(문법)으로 — `find`→`undefined` 포함, `get`→`undefined` 없음(`ReactNode` 예외), `is/has/can`→boolean, `compare`→number, `subscribe`→해제 함수, `parse/validate`→`Result` 또는 `T \| undefined`, `filter`→배열, `normalize`→첫 인자와 같은 타입 |
| `no-general-name` | 00 좁은 명사 | 변수·선언된 함수 파라미터의 `data`·`item`·`value`·`state`·`info`·`result`·`*Info`·`*Data`. 인라인 콜백 인자와 객체 키는 제외 |
| `props-inline-type-single-line` | 01 §7 | props 인라인 타입은 한 줄만 |
| `no-thin-query-hook` | 01 §3 | 쿼리만 감싼 커스텀 훅(몸통이 쿼리 호출 → 구조분해 → 반환뿐). 다른 훅과 조합하거나 가공 로직이 있으면 통과 |
| `no-sentinel-arithmetic` | 00 | `const X = -1` 을 산술 항으로 쓰기 |
| `no-single-member-container` | 00 | 멤버 하나뿐인 `*Config`·`*Options`·`*Context` (warn) |
| `discouraged-syntax` | — | warn 수준 셀렉터용 (`no-restricted-syntax` 의 warn 판) |

동사 표를 바꾸면 `index.mjs` 의 `FUNCTION_VERBS` 와 `rules/verb-return-contract.mjs` 의 `CONTRACTS` 를 함께 맞춘다.

테스트 파일은 `*ByTestId`·`getComputedStyle` 금지가 추가되고, 동사에 `setup`·`mock`·`expect`·`query` 가 허용되며, `no-general-name`·`verb-return-contract` 가 꺼진다(testing-library 어휘)(AAA 의 `result`, `renderHook` 의 `result`). `as`·`!`·`let`·루프는 테스트에도 그대로다 — 대안은 fixture 팩토리, role 쿼리 + `within`, `setup()`·`Promise.withResolvers()`, `it.each`, `vi.mocked`.

`no-use-before-define` 은 `variables: false` — 함수 몸통 안에서 파일 아래쪽 선언(styled·className 상수)을 참조하는 건 TDZ 에 안 걸리므로 허용한다.

## lint 로 안 되는 것

경계를 **긋는** 판단은 사람 몫이다(habits/02 「기계 검증과의 분업」).

- 관심사/책임 분리, 얕은 포장인지 (01 §1, 03)
- 변경의 소스 위치, SSOT 축 (02)
- 헤드리스 훅 vs 컴파운드 vs 필수 prop (03)
- 이름이 제품 공용 어휘로 읽히는지, 구체성이 소유 범위와 맞는지 (00, 02)
- 옵셔널 필드가 정말 "없을 수 있는지" (05)

## 리뷰와의 분업

같은 habit 이라도 형태는 lint, 의미는 리뷰가 잡는다. **eric-review·eric-refine 은 이 표의 lint 칸을 다시 보지 않는다** — 대상 레포에 이 프리셋이 없을 때만 전부 본다. 이 표를 바꾸면 스킬 쪽 동작도 바뀌므로 루트 README 「강제 층 분업」의 동기화 표를 따른다.

| habit | lint 가 잡는 것 | 리뷰가 잡는 것 |
|---|---|---|
| 00 동사 | 표에 있는 동사인가, `And`, 동사별 반환 계약(적어둔 리턴 타입) | `to*` vs `create*`(입력이 재료인가 설정·의존성인가), `get*`·`to*` 가 부수효과를 숨기는가, `format*` 이 판정을 숨기는가, `set*` vs `update*`·`delete*` vs `remove*`, `on*` 이 정말 prop 키인가 |
| 00 명사 | `data`·`item`·`value`·`state`·`info`·`result`, `*Info`·`*Data` | 명사가 도메인의 무엇까지 좁혀졌나, 결과 명사가 원본 도메인으로 좁혀졌나, 공용 어휘로 읽히나 |
| 00 센티넬·그릇 이름 | 센티넬 상수의 산술, 멤버 하나뿐인 `*Config` | 매직값에 의미가 드러났나 |
| 01 §3 조달 | `useQuery` 금지, 쿼리만 감싼 훅, 인라인 옵션, 연속 호출(warn) | 조달 지점이 맞는가, 쿼리를 쓰는 커스텀 훅을 나란히 불러 워터폴이 생기지 않았나, 병렬화하려고 관심사를 끌어올리지 않았나 |
| 01 §6 effect | `useEffect`·`useLayoutEffect` import, `React.useEffect` | 허용 파일 안의 거울 state, 파생을 렌더 중으로 옮길 수 있나, 외부 값이면 `useSyncExternalStore` 인가 |
| 01 §7 props·주석 | `interface`, 한 줄 인라인, raw `"-"`, 이력 주석 일부 단어 | 주석이 코드로 안 보이는 제약만 담는가 |
| 04 함수형 | 루프·`let`·중첩 삼항·`parse*` 의 throw·판정 테이블(warn) | 예상 가능한 실패인가(Result) vs 경계가 다룰 실패인가(throw), 합타입 분기에 exhaustive `never` 를 뒀나, 조합 닫힘 |
| 05 타입 | `as`·`!`·`any` | 억제 주석으로 사유를 대는 회피, 옵셔널이 땜빵인가, 하위호환을 경계에서 흡수했나 |
| 06 테스트 | `*ByTestId`·`getComputedStyle`·src 의 `data-testid` | mock 이 파라미터를 반영하나, 분기 커버리지 |

## 테스트

```bash
npm test
```

`test/fixtures/` 의 각 줄 끝 `/* expect: 룰id */` 주석과 실제 보고를 대조한다. 과소 보고(놓침)와 과대 보고(오탐)를 둘 다 잡고, `clean.tsx` 는 권장 형태를 모아 보고가 0건이어야 한다.
