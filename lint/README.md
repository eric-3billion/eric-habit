# @eric/eslint-preset

`habits/` 중 **정적분석으로 판정할 수 있는 룰**을 ESLint flat config 로 강제한다.

- 룰의 "왜"는 `habits/` 에만 있다. 여기는 "무엇"을 기계로 옮긴 것이고, 모든 lint 메시지 끝에 근거 habit(예: `(habits/01 §3)`)이 붙어 있다.
- 판단이 필요한 룰은 `eric-review` / `eric-refine` 몫이다 — 아래 「lint 로 안 되는 것」·「리뷰와의 분업」.
- **검사 32개**, 전부 **타입 정보 없이 문법만으로** 판정한다. 파일 5,454개 레포 기준 전체 lint 약 12초.

## 사용

```js
// eslint.config.mjs
import { createEslintPreset } from "@eric/eslint-preset";

export default [
  ...createEslintPreset({
    effectAllowedFiles: ["src/shared/lib/external-sync/**"],
    publicApiPatterns: ["@entities/*/*", "@features/*/*"],
  }),
];
```

| 옵션 | 기본값 | 용도 |
|---|---|---|
| `files` | `["**/*.{ts,tsx}"]` | 대상 파일 |
| `effectAllowedFiles` | `[]` | `useEffect` 를 허용할 위치(#8·#9 예외). 외부 동기화 전용 파일만 둔다 |
| `publicApiPatterns` | `[]` | 딥임포트를 막을 경로 패턴(#18). 비우면 #18 이 꺼진다 |
| `testFiles` | 아래 「테스트 파일에서 달라지는 것」 | 테스트 override 대상 |
| `resultTypeNames` | `["Result"]` | `parse*`/`validate*` 가 반환해야 하는 Result 타입 이름(#2) |

- **예외는 config 에 모은다.** 인라인 억제 주석 대신 `effectAllowedFiles` 같은 파일 glob 한 곳에 둔다.
- **기존 코드는 소급 수정하지 않는다(habits/01 §7).** 도입 시 `eslint --suppress-all` 로 현재 위반을 baseline(`eslint-suppressions.json`)에 박으면 새 코드만 강제되고, 고칠 때마다 `--prune-suppressions` 로 줄여간다. 또는 PR 에서 **추가된 줄의 위반만** 보여주는 diff CI 로 운영한다.

## 룰 ↔ habits

심각도 표시가 없으면 **error**, (warn) 은 경고다. "구현" 은 코드 위치 — `index.mjs` 의 `RESTRICTED_SYNTAX`·`DISCOURAGED_SYNTAX` 는 셀렉터 목록, `rules/*.mjs` 는 커스텀 룰이다.

### 한눈에

| # | habit | 잡는 것 | 룰 |
|---|---|---|---|
| 1 | 00 | 동사 표에 없는 함수 동사, 이름의 `And` | `eric/function-verb-whitelist` |
| 2 | 00 | 동사가 약속한 반환과 다른 리턴 타입 | `eric/verb-return-contract` |
| 3 | 00 | 제너럴 명사 변수·파라미터 | `eric/no-general-name` |
| 4 | 00 | 타입 이름의 `*Info`·`*Data` | `naming-convention` |
| 5 | 00 | 센티넬 상수의 산술 | `eric/no-sentinel-arithmetic` |
| 6 | 00 | 멤버 하나뿐인 `*Config`·`*Options`·`*Context` (warn) | `eric/no-single-member-container` |
| 7 | 01 §3 | `useQuery` 계열 import | `no-restricted-imports` |
| 8 | 01 §6 | `useEffect`·`useLayoutEffect` import | `no-restricted-imports` |
| 9 | 01 §6 | `React.useEffect` | 셀렉터 |
| 10 | 01 §3 | 쿼리만 감싼 커스텀 훅 | `eric/no-thin-query-hook` |
| 11 | 01 §3 | 쿼리 옵션 인라인 | 셀렉터 |
| 12 | 01 §3 | 연속 `useSuspenseQuery`(워터폴) (warn) | `eric/discouraged-syntax` |
| 13 | 01 §7 | 객체 타입을 `type` 으로 선언 | `consistent-type-definitions` |
| 14 | 01 §7 | 한 줄 넘는 props 인라인 타입 | `eric/props-inline-type-single-line` |
| 15 | 01 §7 | raw `"-"` 반환 | 셀렉터 |
| 16 | 01 §7 | 변경 이력 주석 (warn) | `no-warning-comments` |
| 17 | 02 | 선언 전 사용(TDZ) | `no-use-before-define` |
| 18 | 02 | 슬라이스 딥임포트 | `no-restricted-imports` |
| 19 | 02 | `(typeof X)[number]` | 셀렉터 |
| 20 | 03 | `show*`/`hide*` boolean prop (warn) | `eric/discouraged-syntax` |
| 21 | 04 | 명시적 루프 | 셀렉터 |
| 22 | 04 | `let` | 셀렉터 |
| 23 | 04 | 파라미터 재할당 | `no-param-reassign` |
| 24 | 04 | 중첩 삼항 | `no-nested-ternary` |
| 25 | 04 | `parse*`/`validate*` 안의 `throw` | 셀렉터 |
| 26 | 04 | 판정 테이블 (warn) | `eric/discouraged-syntax` |
| 27 | 04 | 리턴 타입 없는 export 함수 | `eric/explicit-return-type` |
| 28 | 05 | `as` | `consistent-type-assertions` |
| 29 | 05 | `!` | `no-non-null-assertion` |
| 30 | 05 | `any` | `no-explicit-any` |
| 31 | 06 | src 의 `data-testid` | 셀렉터 |
| 32 | 06 | 테스트의 `*ByTestId`·`getComputedStyle` | 셀렉터 |

### 00 이름

#### 1. 동사 화이트리스트 — `eric/function-verb-whitelist`

함수를 **선언하는 자리**의 이름은 동사 표의 동사로 시작해야 한다. 이름에 `And` 가 붙으면 한 함수가 두 일을 한다는 신호라 막는다.

- **대상**: `function x()`, `const x = () => …`, `const x = function () {}`
- **대상 아님**: 구조분해로 받은 이름(`const { refetch } = …`), 호출 결과(`const navigate = useNavigate()`) — 이름을 선언처가 정한다. 컴포넌트(PascalCase), 조합자(`all`·`any`)
- **허용 동사** (`index.mjs` `FUNCTION_VERBS`)
  - 조회 `get` `find` `list` · 판정 `is` `has` `can`
  - 변환·계산 `to` `format` `normalize` `calculate` `clamp` `compare` `filter` `group`
  - 검증 `parse` `validate`
  - 쓰기 `create` `update` `delete` `add` `remove` `reset` `set`
  - UI `open` `close` `render` · 기타 `subscribe` `use` `handle` `on`
- **테스트 파일**: `setup`·`mock`·`expect`·`query` 추가 허용, 단독 `setup`·`wrapper` 허용

```ts
function resolveOrder(id) {}            // ❌ resolve 는 표에 없다
function getCartAndResetCoupons() {}    // ❌ And
const mapBndDtoToBnd = (dto) => …       // ❌ map → to
function toBnd(bndDto: BndDto): Bnd {}  // ✅
```

구현: `rules/function-verb-whitelist.mjs`

#### 2. 동사별 반환 계약 — `eric/verb-return-contract`

**적어둔 리턴 타입**이 동사가 약속한 반환과 맞는지 본다. 리턴 타입을 안 적은 함수는 검사하지 않는다(export 함수는 #27 이 리턴 타입을 강제한다). `Promise<T>` 는 `T` 로 벗겨서 본다.

| 동사 | 리턴 타입이 이래야 한다 |
|---|---|
| `find*` | `undefined` 포함 |
| `get*` | `undefined`/`null` 없음. `ReactNode` 는 예외(원래 null 을 포함하는 렌더 조각) |
| `is*`·`has*`·`can*` | `boolean` 또는 타입 가드(`x is T`) |
| `compare*` | `number` |
| `subscribe*` | 함수 타입(해제 함수) |
| `parse*`·`validate*` | `Result`(`resultTypeNames`) 또는 `T \| undefined` |
| `filter*` | 배열(`T[]`·`readonly T[]`·`Array<T>`·튜플) |
| `normalize*` | 첫 파라미터와 같은 타입(타입 텍스트 비교) |

```ts
function getOrder(id): Order | undefined   // ❌ 없을 수 있으면 find
function isReady(o): string                // ❌
function parsePort(s): number              // ❌ 실패가 타입에 없다
function parsePort(s): number | undefined  // ✅
```

- **한계**: 타입 별칭(`type Maybe<T> = T | undefined`)은 풀지 못한다.
- **테스트 파일**: 꺼진다 — testing-library 의 `find*`(비동기·없으면 throw)·`query*`(없으면 `null`) 어휘와 충돌한다.

구현: `rules/verb-return-contract.mjs` `CONTRACTS`

#### 3. 제너럴 명사 — `eric/no-general-name`

변수와 **선언된 함수의 파라미터**에 `data`·`item`·`value`·`state`·`info`·`result`, 또는 `*Info`·`*Data` 로 끝나는 이름을 쓰면 걸린다. 구조분해(`{ data }`, `[value, setValue]`)도 풀어서 본다.

- **대상 아님**: 인라인 콜백 인자(`.map((item) => …)`, `cell: info => …` — 라이브러리 어휘이고 스코프가 한 줄), 객체 키(외부 계약)
- **테스트 파일**: 꺼진다 — AAA 패턴의 `result`, `renderHook` 의 `result`

```ts
const { data } = useSuspenseQuery(orderQueries.detail(id));          // ❌
const { data: order } = useSuspenseQuery(orderQueries.detail(id));   // ✅
function toTotal(value: number) {}                                   // ❌
orders.map((item) => item.id);                                       // ✅ 인라인 콜백
```

구현: `rules/no-general-name.mjs`

#### 4. 타입 이름의 `*Info`·`*Data` — `naming-convention`

`interface OrderInfo`, `type UserData` 처럼 타입 이름이 `Info`·`Data` 로 끝나면 걸린다. 변수 쪽은 #3 이 잡는다.

구현: `index.mjs` — `@typescript-eslint/naming-convention` 의 `typeLike` selector 설정

#### 5. 센티넬 산술 — `eric/no-sentinel-arithmetic`

`const X = -1` 로 선언한 상수를 `+ - * / %` 의 항으로 쓰면 걸린다. 비교(`=== X`)는 통과한다. 센티넬 값은 룰 옵션 `sentinels`(기본 `[-1]`).

```ts
const NO_FILLED_STEP = -1;
return NO_FILLED_STEP + filledStepCount;   // ❌ "없음"이 오프셋이 된다
if (index === NO_FILLED_STEP) …            // ✅
```

구현: `rules/no-sentinel-arithmetic.mjs` — ESLint scope 분석으로 그 상수의 참조를 전부 추적한다.

#### 6. 멤버 하나뿐인 그릇 이름 — `eric/no-single-member-container` (warn)

`*Config`·`*Options`·`*Context` 인데 멤버가 하나뿐이면 걸린다. 대상은 `interface`, 객체 리터럴 `type`, 그리고 이름이 그릇 접미사로 끝나고 리턴 타입이 멤버 하나짜리 객체 리터럴인 함수.

```ts
createOrderStepConfig(): { schema: ZodType }   // ⚠ → createOrderStepValidators
```

구현: `rules/no-single-member-container.mjs`

### 01 컴포넌트

#### 7. `useQuery` 계열 import — `no-restricted-imports`

`@tanstack/react-query` 에서 `useQuery`·`useQueries`·`useInfiniteQuery` 를 import 하면 걸린다. `useSuspenseQuery`·`useSuspenseQueries` 를 쓴다 — 경계 안은 성공만.

#### 8. `useEffect` import — `no-restricted-imports`

`react` 에서 `useEffect`·`useLayoutEffect` 를 import 하면 걸린다. 파생은 렌더 중에, 외부 값은 `useSyncExternalStore` 로. **`effectAllowedFiles` 안의 파일만 예외**다. effect 안의 setState(거울 state)는 import 단계에서 이미 막히므로 따로 검사하지 않는다.

#### 9. `React.useEffect` — 셀렉터

import 를 우회하는 `React.useEffect(…)`·`React.useLayoutEffect(…)` 를 막는다. #8 과 같은 예외.

구현: `index.mjs` `REACT_MEMBER_EFFECT`

#### 10. 쿼리만 감싼 커스텀 훅 — `eric/no-thin-query-hook`

`use*` 훅의 몸통이 "suspense 쿼리 호출 → (구조분해) → 반환" 뿐이면 걸린다. 하는 일이 없으면 소비처가 `queryOptions` 팩토리를 직접 써야 `useSuspenseQueries` 로 묶을 수 있다. **다른 훅과 조합하거나 가공 로직이 있으면 통과**한다 — 로직을 공유하는 훅은 팩토리 위에 얹으면 된다(TkDodo 「Creating Query Abstractions」).

```ts
function useUnreadCount(): number {                             // ❌ 쿼리만 감쌌다
  const { data } = useSuspenseQuery(unreadCountQueries.total());
  return data.unreadCount;
}
const useOrders = () => useSuspenseQuery(orderQueries.list());   // ❌
function useSelectableOrder(id: string) {                        // ✅ useState 와 조합
  const { data: order } = useSuspenseQuery(orderQueries.detail(id));
  const [isSelected, setIsSelected] = useState(false);
  return { order, isSelected, setIsSelected };
}
```

구현: `rules/no-thin-query-hook.mjs`

#### 11. 쿼리 옵션 인라인 — 셀렉터

`useSuspenseQuery({ queryKey, queryFn })`, `useSuspenseQueries({ queries: [{ … }] })` 처럼 옵션 객체를 직접 쓰면 걸린다. `orderQueries.detail(id)` 같은 `queryOptions` 팩토리를 넘기고, 신선도 정책(`refetchOnMount` 등)도 팩토리에 둔다. 이 룰이 있어서 팩토리가 항상 존재하고, #10 을 통과한 훅도 소비처가 우회해 묶을 수 있다.

구현: `index.mjs` `RESTRICTED_SYNTAX`

#### 12. 워터폴 — `eric/discouraged-syntax` (warn)

같은 블록에서 `useSuspenseQuery` 를 담은 변수 선언이 연달아 나오면 경고한다. suspense 경계 안에서 선언 순서는 병렬성을 만들지 못한다 — 독립 조달이면 `useSuspenseQueries` 로 묶는다. 뒤 쿼리가 앞 결과를 쓰는 **의존 쿼리도 걸려서 warn** 이다.

구현: `index.mjs` `DISCOURAGED_SYNTAX`

#### 13. 객체 타입은 `interface` — `consistent-type-definitions`

`type Props = { … }` 처럼 객체 리터럴을 `type` 으로 선언하면 걸린다. 판별 유니온(`type ViewState = { … } | { … }`)은 `interface` 로 못 쓰므로 걸리지 않는다.

#### 14. props 인라인 타입은 한 줄만 — `eric/props-inline-type-single-line`

컴포넌트 첫 파라미터의 타입 리터럴이 여러 줄에 걸치면 걸린다. 대상은 PascalCase 함수·화살표 함수와 `VariantForm.error = …` 같은 정적 프로퍼티 컴포넌트.

```tsx
function Badge({ label }: { label: string }) {}   // ✅ 한 줄
function Header({ title, showSearch }: {          // ❌ → HeaderProps 로 뺀다
  title: string;
  showSearch: boolean;
}) {}
```

구현: `rules/props-inline-type-single-line.mjs`

#### 15. raw `"-"` 반환 — 셀렉터

`return "-"` 를 막는다. 컴포넌트는 `ReactNode` 로 일관 반환한다.

#### 16. 변경 이력 주석 — `no-warning-comments` (warn)

주석에 `기존엔`·`기존에는`·`원래는`·`예전엔` 이 나오면 경고한다. 이력은 PR 본문에 쓰고 코드에 남기지 않는다. 단어 기반이라 일부만 잡힌다 — 나머지는 리뷰.

### 02 구조

#### 17. 선언 순서 — `no-use-before-define`

모듈 최상위에서 아직 선언되지 않은 상수를 쓰거나(TDZ 위반), 타입을 선언보다 먼저 참조하면 걸린다.

- **통과**: 함수 몸통 안에서 파일 아래쪽 상수(styled·className)를 참조하는 것 — 실행 시점엔 이미 선언돼 있어 TDZ 에 안 걸린다(`variables: false`). `function` 선언은 호이스팅되므로 순서 자유(`functions: false`) — 진입점을 위에 두는 배치(habits/01 §4)를 허용한다.

#### 18. 슬라이스 딥임포트 — `no-restricted-imports` (패턴)

`publicApiPatterns` 로 넘긴 패턴(예: `@entities/*/*`)으로 import 하면 걸린다. 슬라이스는 public API(index)로만 가져온다.

#### 19. 배열에서 유니온 파생 — 셀렉터

`type StepName = (typeof STEPS)[number]` 를 막는다. 유니온 타입이 원본이고 배열은 `satisfies readonly StepName[]` 로 묶는다 — 배열이 원본이면 요소를 빠뜨려도 아무도 모른다.

### 03 조합

#### 20. `show*`/`hide*` boolean prop — `eric/discouraged-syntax` (warn)

JSX 에 `showSearch`·`hideAvatar` 같은 prop 이 있으면 경고한다. 화면 조각은 슬롯(`right={<SearchButton />}`)으로 드러낸다.

### 04 함수형

#### 21. 명시적 루프 — 셀렉터

`for`·`for…of`·`for…in`·`while`·`do…while` 을 막는다. `map`/`filter`/`reduce`, 테스트는 `it.each`.

#### 22. `let` — 셀렉터

재할당 대신 섀도잉·새 값 반환. 테스트는 `setup()` 팩토리, 지연 resolve 는 `Promise.withResolvers()`.

#### 23. 파라미터 재할당 — `no-param-reassign` (`props: true`)

파라미터 자체와 파라미터 속성(`order.total = 0`) 재할당을 막는다.

#### 24. 중첩 삼항 — `no-nested-ternary`

`a ? x : b ? y : z` 를 막는다. 조기 반환(`if … return`)으로 편다.

#### 25. `parse*`/`validate*` 안의 `throw` — 셀렉터

이름이 `parse`·`validate` 로 시작하는 함수 안의 `throw` 를 막는다. 예상 가능한 실패는 `Result` 나 `T | undefined` 로 반환한다.

#### 26. 판정 테이블 — `eric/discouraged-syntax` (warn)

`[{ test: (s) => …, message: "…" }]` 처럼 배열 안 객체에 `test`·`when`·`predicate`·`condition` 함수가 있으면 경고한다. 판정은 유니온을 반환하는 함수로, `Record` 는 판정이 끝난 값의 매핑에만.

#### 27. export 함수의 리턴 타입 — `eric/explicit-return-type`

`export function`, `export const x = () =>`, `export default function` 에 리턴 타입이 없으면 걸린다. **컴포넌트(PascalCase)는 제외**. #2 의 커버리지를 이 룰이 받친다.

구현: `rules/explicit-return-type.mjs`

### 05 타입

#### 28. `as` — `consistent-type-assertions` (`assertionStyle: "never"`)

`x as T`, `x as unknown as T` 를 막는다. `as const` 는 허용. 테스트 mock 은 `vi.mocked(x)`, 부분 fixture 는 fixture 팩토리로.

#### 29. `!` — `no-non-null-assertion`

존재 보장은 조달 구조(Suspense 경계)나 좁히기로 한다.

#### 30. `any` — `no-explicit-any`

### 06 테스트

#### 31. src 의 `data-testid` — 셀렉터 (테스트 외 파일)

JSX 의 `data-testid` 속성을 막는다. 테스트는 role·접근성 쿼리로 찾는다.

#### 32. `*ByTestId`·`getComputedStyle` — 셀렉터 (테스트 파일)

`getByTestId` 계열은 role 쿼리 + `within` 스코프로. `getComputedStyle` 은 jsdom 이 styled 중첩 CSS 를 못 읽으니 `toHaveStyle` 로.

## 테스트 파일에서 달라지는 것

- **대상(`testFiles` 기본값)**: `*.test.*`·`*.spec.*`, `fixtures/`·`mocks/`·`__tests__/`·`__mocks__/` 아래, `*fixture*`·`*mock*`·`*test-helper*`·`*test-utils*`
- **추가 허용**: 동사 `setup`·`mock`·`expect`·`query`, 단독 `setup`·`wrapper` (#1)
- **꺼짐**: #2 반환 계약(testing-library 어휘), #3 제너럴 명사(AAA 의 `result`)
- **추가**: #32. 반대로 #31 은 빠진다
- **그대로**: 나머지 전부 — `as`·`!`·`let`·루프도 테스트에 적용된다. 대안은 fixture 팩토리, role 쿼리 + `within`, `setup()`·`Promise.withResolvers()`, `it.each`, `vi.mocked`

## 검사하지 않는 것 (다른 곳이 맡는다)

| 검사 | 맡는 곳 | 이유 |
|---|---|---|
| 순환 import | dependency-cruiser | 전체 모듈 그래프가 필요해 느리다(검사 시간의 76%) |
| effect 안 setState | #8 | import 단계에서 이미 막힌다 |
| 인라인 억제 주석 | 리뷰 | 사유가 타당한지는 사람이 본다 |
| 유니온 switch 누락 | tsc(`never` 패턴) · 리뷰 | diff CI 에선 안 바뀐 줄에 찍혀 걸러진다 |
| 옵셔널이 땜빵인지 | 리뷰 | 정당성은 판단 영역 |

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

## 구현

### 의존성

| 라이브러리 | 역할 |
|---|---|
| ESLint (9.24+ / 10) | 엔진. 기본 룰 `no-restricted-syntax`·`no-restricted-imports`·`no-nested-ternary`·`no-param-reassign`·`no-warning-comments` |
| typescript-eslint | TS 파서, `consistent-type-assertions`·`no-non-null-assertion`·`no-explicit-any`·`consistent-type-definitions`·`no-use-before-define`·`naming-convention` |

### 파일

```
index.mjs          createEslintPreset — config 배열을 조립한다
                   FUNCTION_VERBS(동사 표) · RESTRICTED_SYNTAX(error 셀렉터) · DISCOURAGED_SYNTAX(warn 셀렉터)
rules/             커스텀 플러그인 `eric` 의 룰 — 파일 하나 = 룰 하나
test/
  preset.test.mjs  fixture 를 lint 해 expect 주석과 대조
  fixtures/        clean.tsx(0건이어야 함) · violations.tsx · order-panel.test.tsx · external-sync/
```

`createEslintPreset` 이 돌려주는 config 는 순서대로 ① 전체 룰, ② `effectAllowedFiles` override(#8·#9 해제), ③ 테스트 override 다.

### 룰을 구현하는 세 가지 방식

1. **기성 룰에 옵션만 준다** — 예: `consistent-type-assertions: { assertionStyle: "never" }`.
2. **AST 셀렉터로 금지한다** — `no-restricted-syntax` 에 esquery 셀렉터(CSS 셀렉터와 비슷한 문법)를 넘긴다. 새 룰을 짜지 않고 패턴만 적는다.
   ```js
   // (typeof STEPS)[number]
   "TSIndexedAccessType[objectType.type='TSTypeQuery'][indexType.type='TSNumberKeyword']"
   ```
   `no-restricted-syntax` 는 룰 하나에 심각도가 하나라서, warn 으로 둘 셀렉터는 `eric/discouraged-syntax` 가 같은 형식으로 받는다.
3. **커스텀 룰을 짠다** — `rules/*.mjs`. ESLint 룰은 `{ meta, create(context) }` 객체이고, `create` 가 "이 AST 노드를 만나면 이걸 실행해" 라는 visitor 맵을 돌려준다. 셀렉터로 표현이 안 될 때만 쓴다(구조분해 재귀, 몸통 모양 판정, scope 추적 등).

## 룰을 바꿀 때

| 바꾸는 것 | 같이 바꿀 것 |
|---|---|
| 동사 표(habits/00) | `index.mjs` `FUNCTION_VERBS`, `rules/verb-return-contract.mjs` `CONTRACTS`, 이 README #1·#2 |
| 룰 추가·완화·삭제 | 대응 habit 문구, fixture 의 `expect` 주석, 이 README 의 「한눈에」·상세·「리뷰와의 분업」 |
| 전체 원칙 | 루트 README 「강제 층 분업」 |

## 테스트

```bash
npm install
npm test
```

`test/fixtures/` 각 줄 끝의 `/* expect: 룰id */` 주석과 실제 보고를 **줄 단위로** 대조한다. 놓친 것(과소 보고)과 오탐(과대 보고)을 둘 다 잡는다. `clean.tsx` 는 habits 가 권장하는 형태를 모은 파일이라 보고가 0건이어야 한다. 새 룰을 추가하면 `violations.tsx` 에 걸리는 예시를, `clean.tsx` 에 통과해야 하는 예시를 함께 넣는다.
