# @eric/oxlint-preset

`habits/` 에 적힌 코드 습관 중에서 **기계가 코드만 보고 판단할 수 있는 것**을 lint 로 자동 검사하는 설정 묶음이다. lint 도구는 [oxlint](https://oxc.rs/docs/guide/usage/linter) 를 쓴다.

- **왜 이 룰인지**는 `habits/` 에 있다. 이 README 는 **무엇을 어떻게 잡는지**만 설명한다. lint 메시지 끝에 근거가 되는 habit 이 붙어 있다(예: `(habits/01 §3)`).
- 사람이 판단해야 하는 것(설계가 맞는지, 이름이 적절한지 등)은 lint 가 아니라 리뷰(`eric-review`·`eric-refine`) 몫이다. → 「lint 로 안 되는 것」·「리뷰와의 분업」
- 검사는 **27개**. 파일 5,454개짜리 레포 전체를 **약 2초**에 검사한다.

## 용어 풀이

이 문서에 나오는 용어를 먼저 정리한다.

| 용어 | 뜻 |
|---|---|
| lint / 정적분석 | 코드를 **실행하지 않고** 코드의 모양만 보고 규칙 위반을 찾는 것 |
| 네이티브 룰 | oxlint 안에 원래 들어 있는 룰. Rust 로 짜여 있어 빠르다. 옵션만 주면 된다 |
| JS 플러그인 | 우리가 JavaScript 로 직접 짠 룰 묶음. oxlint 가 불러서 같이 실행한다. 이 프리셋의 플러그인 이름은 `eric` |
| AST | 코드를 트리 구조로 분해한 것. lint 는 이 트리를 훑으며 검사한다 |
| 셀렉터 | AST 에서 특정 모양을 골라내는 질의. CSS 셀렉터가 HTML 요소를 고르듯, `VariableDeclaration[kind='let']` 은 "`let` 선언"을 고른다 |
| 타입 정보 없이 문법만으로 | TypeScript 컴파일러를 돌려 타입을 계산하지 않고, **코드에 적힌 글자·구조만** 본다는 뜻. 빠른 대신 "추론된 타입"은 모른다 |
| override | 특정 파일에만 다르게 적용하는 설정. 예: 테스트 파일에서는 일부 룰을 끈다 |
| glob | 파일 경로 패턴. `**/*.test.ts` 는 "모든 폴더의 `.test.ts` 파일" |
| diff CI | PR 에서 **새로 추가된 줄**의 경고만 보여주는 CI. 기존 코드의 위반은 안 보여준다 |
| baseline | 지금 있는 위반을 목록으로 저장해 두고 **새 위반만** 에러로 만드는 기능. oxlint 에는 없다 |

## 사용

프로젝트 루트에 `oxlint.config.mjs` 를 만든다.

```js
// oxlint.config.mjs
import { createOxlintConfig } from "@eric/oxlint-preset";

export default createOxlintConfig({
  effectAllowedFiles: ["src/shared/lib/external-sync/**"],
});
```

```bash
oxlint -c oxlint.config.mjs src
```

### 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `effectAllowedFiles` | `[]` | `useEffect` 를 **써도 되는 파일**의 경로 패턴. 이 프리셋은 `useEffect` 를 막는데(#7), 브라우저 이벤트 구독처럼 정말 필요한 코드는 전용 폴더에 모아두고 여기에 적는다 |
| `testFiles` | 아래 「테스트 파일에서 달라지는 것」 | 테스트 파일로 취급할 경로 패턴. 여기 해당하는 파일은 룰이 일부 달라진다 |
| `resultTypeNames` | `["Result"]` | 실패를 담는 결과 타입의 이름(#2). 팀에서 `Result` 대신 `Either` 같은 이름을 쓰면 여기에 넣는다 |

### 알아둘 것

- **oxlint 가 기본으로 켜는 룰(`correctness` 분류)은 그대로 둔다.** 이 프리셋은 habits 룰만 추가한다. 기본 룰을 끄거나 더 켜고 싶으면 `{ ...createOxlintConfig(), categories: { … } }` 처럼 덮어쓴다.
- **설정 파일은 `.mjs`(JavaScript)여야 한다.** 옵션을 받아 설정을 만드는 함수라서 JSON 파일로는 쓸 수 없다. oxlint 에서 JS 설정 파일은 아직 실험 기능이고, Node.js 로 실행해야 동작한다.
- **예외는 설정 파일에만 둔다.** 코드에 `// oxlint-disable` 같은 주석을 달아 룰을 끄지 말고, `effectAllowedFiles` 같은 옵션에 경로를 적어 한 곳에서 관리한다.
- **기존 코드는 고치라고 하지 않는다.** oxlint 에는 baseline 기능이 없어서, 도입하면 기존 코드의 위반이 한꺼번에 쏟아진다. 그래서 **diff CI** 로 PR 에서 새로 추가된 줄의 경고만 보여주고, CI 를 실패시키지 않는 방식으로 운영한다(habits/01 §7).

## 룰 ↔ habits

- 심각도 표시가 없으면 **error**, **(warn)** 은 경고다. warn 은 가끔 정당한 경우가 있어서 막지 않고 알려만 주는 룰이다.
- 룰 이름은 oxlint 설정에 쓰는 이름 그대로다.
  - 접두사 없음(`no-nested-ternary`): oxlint 네이티브 룰
  - `typescript/`: oxlint 네이티브 TypeScript 룰
  - `eric/`: 이 프리셋이 직접 만든 JS 플러그인 룰
- `eric/restricted-syntax`(error)와 `eric/discouraged-syntax`(warn)는 **셀렉터 목록으로 금지하는 룰**이다. 어떤 모양을 금지할지는 `index.mjs` 의 `RESTRICTED_SYNTAX`·`DISCOURAGED_SYNTAX` 목록에 있다. → 「구현」

### 한눈에

| # | habit | 잡는 것 | 룰 |
|---|---|---|---|
| 1 | 00 | 동사 목록에 없는 동사로 시작하는 함수 이름, 이름 속 `And` | `eric/function-verb-whitelist` |
| 2 | 00 | 동사가 약속한 것과 다른 리턴 타입(예: `get*` 인데 `null` 반환, 없음을 `undefined` 로 반환) | `eric/verb-return-contract` |
| 3 | 00 | `data`·`item`·`value` 같은 두루뭉술한 변수·파라미터 이름 | `eric/no-general-name` |
| 4 | 00 | `OrderInfo`·`UserData` 처럼 `Info`·`Data` 로 끝나는 타입 이름 | `eric/no-general-name` |
| 5 | 00 | "없음"을 뜻하는 `-1` 상수를 계산에 섞기 | `eric/no-sentinel-arithmetic` |
| 6 | 01 §3 | 조건부 조회가 아닌데 `useQuery` 쓰기, `useQueries`·`useInfiniteQuery` import | `eric/restricted-syntax`, `no-restricted-imports` |
| 7 | 01 §6 | `useEffect`·`useLayoutEffect` import | `no-restricted-imports` |
| 8 | 01 §6 | `React.useEffect(…)` 로 우회하기 | `eric/restricted-syntax` |
| 9 | 01 §3 | 쿼리 하나만 감싸고 하는 일이 없는 커스텀 훅 | `eric/no-thin-query-hook` |
| 10 | 01 §3 | 쿼리 설정을 호출하는 자리에 직접 적기 | `eric/restricted-syntax` |
| 11 | 01 §3 | 쿼리를 연달아 불러 순서대로 기다리게 만들기 (warn) | `eric/discouraged-syntax` |
| 12 | 01 §7 | 객체 모양 타입을 `type` 으로 선언 | `typescript/consistent-type-definitions` |
| 13 | 01 §7 | 여러 줄짜리 props 타입을 파라미터에 직접 적기 | `eric/props-inline-type-single-line` |
| 14 | 01 §7 | "기존엔 ~였다" 같은 변경 이력 주석 (warn) | `no-warning-comments` |
| 15 | 02 | 선언하기 전에 쓰기 | `no-use-before-define` |
| 16 | 03 | `showXxx`·`hideXxx` boolean prop (warn) | `eric/discouraged-syntax` |
| 17 | 04 | `for`·`while` 루프 | `eric/restricted-syntax` |
| 18 | 04 | `let` | `eric/restricted-syntax` |
| 19 | 04 | 파라미터에 다시 값 넣기 | `no-param-reassign` |
| 20 | 04 | 삼항 연산자 안에 삼항 연산자 | `no-nested-ternary` |
| 21 | 04 | `parse*`/`validate*` 함수 안의 `throw` | `eric/restricted-syntax` |
| 22 | 04 | 리턴 타입을 안 적은 export 함수 | `eric/explicit-return-type` |
| 23 | 05 | `as` 타입 단언 | `typescript/consistent-type-assertions` |
| 24 | 05 | `!` non-null 단언 | `typescript/no-non-null-assertion` |
| 25 | 05 | `any` | `typescript/no-explicit-any` |
| 26 | 06 | 제품 코드의 `data-testid` 속성 | `eric/restricted-syntax` |
| 27 | 06 | 테스트의 `getByTestId`·`getComputedStyle` | `eric/restricted-syntax` |

### 00 이름

#### 1. 함수 이름은 정해진 동사로 시작 — `eric/function-verb-whitelist`

**잡는 것**: 함수를 **만드는 자리**의 이름이 허용된 동사로 시작하지 않으면 걸린다. 이름에 `And` 가 들어가도 걸린다. 단 `TermsAndConditions` 처럼 `And` 가 든 도메인 용어는 `createOxlintConfig({ andJoinedTerms })` 에 올리면 통과한다.

**왜**: 동사마다 "이 함수는 이런 걸 돌려준다"는 약속이 있다(`find` 는 없을 수 있음, `get` 은 반드시 있음 등). 목록 밖의 동사(`resolve`·`process`·`manage`)는 그 약속이 없어서 이름만 보고 동작을 예측할 수 없다. `And` 는 함수 하나가 일을 두 개 한다는 신호다. `And` 뒤가 동사인지는 동사 목록으로 가릴 수 없어서(`sort`·`advance` 처럼 목록 밖의 동사가 끝없다) 전부 막고, 도메인 용어만 예외로 연다.

**허용 동사** (`index.mjs` 의 `FUNCTION_VERBS`)

| 분류 | 동사 |
|---|---|
| 조회 | `get` `find` `list` |
| 판정 | `is` `has` `can` |
| 변환·계산 | `to` `format` `normalize` `calculate` `clamp` `compare` `filter` `group` |
| 검증 | `parse` `validate` |
| 쓰기 | `create` `update` `delete` `add` `remove` `reset` `set` |
| UI | `open` `close` `render` |
| 기타 | `subscribe` `use`(훅) `handle`(이벤트 핸들러) `on`(prop 이름 그대로 쓸 때) |

각 동사의 뜻은 habits/00 동사 표에 있다.

```ts
function resolveOrder(id) {}            // ❌ resolve 는 목록에 없다
function getCartAndResetCoupons() {}    // ❌ And — 두 함수로 쪼갠다
function filterAndSortOrders() {}       // ❌ sort 가 목록에 없어도 And 는 두 동작이다
function findPendingTermsAndConditions() {} // ✅ andJoinedTerms 에 "TermsAndConditions" 를 올린 경우
const mapBndDtoToBnd = (dto) => …       // ❌ map 대신 to
function toBnd(bndDto: BndDto): Bnd {}  // ✅
```

**괜찮은 경우**
- 남이 이름을 정한 경우: `const { refetch } = useQuery(…)`(꺼내 쓴 이름), `const navigate = useNavigate()`(함수가 돌려준 값)
- 컴포넌트(대문자로 시작하는 이름)
- `all`·`any` 처럼 함수를 조합하는 함수(habits/04 「조합 닫힘」)
- 테스트 파일에서는 `setup`·`mock`·`expect`·`query` 동사와 단독 `setup()`·`wrapper` 도 허용

코드: `rules/function-verb-whitelist.mjs`

#### 2. 동사가 약속한 리턴 타입 — `eric/verb-return-contract`

**잡는 것**: 함수에 **적어둔 리턴 타입**이 동사의 약속과 다르면 걸린다.

**왜**: 이름은 `get` 인데 `null` 을 돌려주면, 호출하는 쪽은 이름을 믿고 없는 경우를 처리하지 않다가 버그가 난다. #1 은 "목록에 있는 동사인가"만 보고, 이 룰은 "그 동사의 약속을 지키는가"를 본다.

| 동사 | 리턴 타입이 이래야 한다 |
|---|---|
| `find*` | `null` 이 포함되고 `undefined` 는 없다 (없을 수 있다. 없음은 `null` 하나로 표현한다) |
| `get*` | `undefined`·`null` 이 없다 (반드시 있다). 단 `ReactNode` 는 원래 `null` 을 포함하는 타입이라 예외. `apiHandlerFiles` 로 지정한 API 핸들러에서는 `null` 만 허용한다(HTTP GET 의 404) |
| `is*`·`has*`·`can*` | `boolean`, 또는 `x is Order` 같은 타입 가드 |
| `compare*` | `number` (정렬 함수에 넘기는 비교 함수) |
| `subscribe*` | 함수 (구독을 해제하는 함수를 돌려준다) |
| `parse*`·`validate*` | `Result` 또는 `T \| null` (실패할 수 있다는 게 타입에 드러난다. `undefined` 는 쓰지 않는다) |
| `filter*` | 배열 |
| `normalize*` | 첫 파라미터와 같은 타입 |

```ts
function getOrder(id): Order | null        // ❌ 없을 수 있으면 find 로
function findOrder(id): Order | undefined  // ❌ 없음은 null 로
function isReady(o): string                // ❌ is 는 boolean
function parsePort(s): number              // ❌ 실패하면 어떻게 되는지 타입에 없다
function parsePort(s): number | null       // ✅
```

**알아둘 것**
- `Promise<Order>` 는 `Order` 로 보고 검사한다.
- **리턴 타입을 안 적은 함수는 검사하지 않는다.** 타입을 계산하지 않고 적힌 글자만 보기 때문이다. 대신 export 함수는 #22 가 리턴 타입을 적게 만든다.
- `type Maybe<T> = T | null` 처럼 별명을 붙인 타입은 안을 풀어보지 못한다. `Maybe<Order>` 를 돌려주는 `find*` 는 "`null` 이 없다"로 잘못 걸린다.
- API 핸들러 파일은 `createOxlintConfig({ apiHandlerFiles })` 로 지정한다. 그 파일에서만 `get*` 이 `T | null` 을 반환해도 통과한다.
- **테스트 파일에서는 꺼진다.** 테스트 라이브러리(testing-library)에서는 `findBy*` 가 "기다렸다가 찾고 없으면 에러", `queryBy*` 가 "없으면 `null`" 이라 뜻이 다르기 때문이다.

코드: `rules/verb-return-contract.mjs` 의 `CONTRACTS`

#### 3. 두루뭉술한 이름 — `eric/no-general-name`

**잡는 것**: 변수나 함수 파라미터 이름이 `data`·`item`·`value`·`state`·`info`·`result` 이거나, `Info`·`Data` 로 끝나면 걸린다. `const { data } = …` 처럼 꺼내 쓰는 이름도 본다.

**왜**: 이런 이름은 무엇이든 가리킬 수 있어서 코드를 읽는 사람이 결국 안을 열어봐야 한다. `order`·`invoice` 처럼 무엇인지 드러나는 이름을 쓴다.

```ts
const { data } = useSuspenseQuery(orderQueries.detail(id));          // ❌
const { data: order } = useSuspenseQuery(orderQueries.detail(id));   // ✅ 이름을 바꿔 꺼낸다
function toTotal(value: number) {}                                   // ❌
orders.map((item) => item.id);                                       // ✅ 한 줄짜리 콜백은 괜찮다
```

**괜찮은 경우**
- `.map((item) => …)`, `cell: (info) => …` 처럼 **다른 함수에 바로 넘기는 한 줄짜리 콜백의 인자**. 라이브러리가 쓰는 관용 이름이고, 한 줄 안에서만 쓰여 헷갈릴 일이 적다.
- 객체의 키(`{ data: … }`). API 응답처럼 바깥에서 정한 모양일 수 있다.
- **테스트 파일에서는 꺼진다.** 테스트에서는 `const result = fn()` 이 "실제 결과"를 뜻하는 관용구이고, `renderHook` 이 돌려주는 값 이름도 `result` 다.

코드: `rules/no-general-name.mjs`

#### 4. `Info`·`Data` 로 끝나는 타입 이름 — `eric/no-general-name`

**잡는 것**: `interface OrderInfo`, `type UserData` 처럼 타입 이름이 `Info`·`Data` 로 끝나면 걸린다. #3 과 같은 룰이 interface·type·class·enum 이름을 본다.

**왜**: #3 과 같다. "주문에 관한 무언가"가 아니라 `OrderSummary`·`UserProfile` 처럼 무엇인지 이름에 드러낸다.

#### 5. "없음" 상수를 계산에 섞기 — `eric/no-sentinel-arithmetic`

**잡는 것**: `const X = -1` 로 만든 상수를 `+ - * / %` 계산에 쓰면 걸린다.

**왜**: `-1` 같은 특수값에 `NO_FILLED_STEP`("채운 단계 없음") 같은 이름을 붙였다면, 그 이름은 "없음"만 뜻해야 한다. 그걸 `NO_FILLED_STEP + count` 처럼 계산에 쓰면 이름이 거짓말이 된다. 이런 계산이 필요해졌다면 애초에 `-1` 대신 개수(`0` = 없음)로 표현하는 게 맞다는 신호다.

```ts
const NO_FILLED_STEP = -1;
return NO_FILLED_STEP + filledStepCount;   // ❌ "없음"이 계산 재료가 됐다
if (index === NO_FILLED_STEP) …            // ✅ 비교는 괜찮다
```

어떤 값을 "없음 상수"로 볼지는 룰 옵션 `sentinels` 로 바꿀 수 있다(기본 `[-1]`).

코드: `rules/no-sentinel-arithmetic.mjs` — 상수가 파일 어디에서 쓰이는지 전부 추적해서 계산에 쓰인 곳만 보고한다.

### 01 컴포넌트

#### 6. `useQuery` 는 조건부 조회에만 — `eric/restricted-syntax`, `no-restricted-imports`

**잡는 것**
- `useQuery(…)` 를 부르는데 옵션에 `enabled` 도 `skipToken` 도 없으면 걸린다.
- `useQueries`·`useInfiniteQuery` 는 import 자체가 걸린다. `useSuspenseQueries`·`useSuspenseInfiniteQuery` 를 쓴다.

**왜**: 조회는 `useSuspenseQuery` 가 기본이다. 로딩·에러를 바깥의 `<Suspense>`·`<ErrorBoundary>` 가 처리해 주고, 컴포넌트 안에서는 "데이터가 항상 있다"고 가정할 수 있다. `useQuery` 를 쓰면 컴포넌트마다 `isLoading`·`data?.` 처리가 번진다. 다만 **suspense 쿼리는 끌 수 없어서**, "검색어가 비었으면 조회하지 않는다" 같은 조건부 조회만은 `useQuery` 가 필요하다.

```ts
const { data } = useQuery(orderQueries.detail(id));                                             // ❌ 조건이 없다 → useSuspenseQuery
const { data: order } = useQuery({ ...orderQueries.detail(keyword), enabled: keyword !== "" }); // ✅ 조건부 조회
const { data: order } = useQuery({ queryKey, queryFn: id === undefined ? skipToken : fetchOrder }); // ✅ skipToken
```

**`useQuery` 를 쓰기 전에** suspense 로 풀 수 있는지 먼저 본다(habits/01 §3).
- 조건을 위에서 판정해 **쿼리를 쓰는 컴포넌트 자체를 조건부로 렌더**할 수 있으면 그게 낫다.
- 앞 결과가 필요한 의존 쿼리는 suspense 로 순서대로 부르면 된다.

**한계**: 호출하는 자리에 `enabled`·`skipToken` 이 **보여야** 통과한다. 쿼리 팩토리 안에 `enabled` 를 넣어두면 lint 는 모른다 — 조건은 호출하는 쪽에 드러나게 쓴다.

코드: `index.mjs` 의 `RESTRICTED_SYNTAX`(호출 검사)와 `createRestrictedImports`(import 검사)

#### 7. `useEffect` 금지 — `no-restricted-imports`

**잡는 것**: `react` 에서 `useEffect`·`useLayoutEffect` 를 import 하면 걸린다.

**왜**: `useEffect` 로 "A 가 바뀌면 B state 를 맞춘다"는 식의 동기화를 하면 흐름이 꼬이고 한 프레임 늦게 반영된다. 다른 값에서 계산할 수 있는 건 렌더 중에 계산하고, 창 크기 같은 외부 값은 `useSyncExternalStore` 로 읽는다.

**괜찮은 경우**: 옵션 `effectAllowedFiles` 에 적은 파일(외부 시스템과 동기화하는 전용 위치)에서는 허용한다.

#### 8. `React.useEffect` 로 우회 — `eric/restricted-syntax`

**잡는 것**: import 하지 않고 `React.useEffect(…)`·`React.useLayoutEffect(…)` 로 부르면 걸린다. #7 의 빈틈을 막는 룰이고, 예외도 #7 과 같다.

코드: `index.mjs` 의 `REACT_MEMBER_EFFECT`

#### 9. 쿼리만 감싼 커스텀 훅 — `eric/no-thin-query-hook`

**잡는 것**: `use*` 훅이 **쿼리 하나를 부르고 그 결과를 돌려주는 것 말고는 아무것도 안 하면** 걸린다.

**왜**: 이런 훅은 하는 일 없이 한 겹 감싸기만 한다. 게다가 훅으로만 쿼리를 쓸 수 있으면, 쿼리 여러 개를 `useSuspenseQueries` 로 **한 번에 병렬로** 불러야 할 때 묶을 수가 없다. 쿼리 설정은 `orderQueries.detail(id)` 같은 함수(쿼리 팩토리)로 공개하고, 쓰는 쪽이 그걸 직접 쓴다.

```ts
function useUnreadCount(): number {                             // ❌ 쿼리를 부르고 값 하나 꺼낼 뿐이다
  const { data } = useSuspenseQuery(unreadCountQueries.total());
  return data.unreadCount;
}
const useOrders = () => useSuspenseQuery(orderQueries.list());   // ❌
```

**괜찮은 경우**: 다른 훅과 조합하거나(`useState` 등) 결과를 가공하는 훅은 로직을 공유하는 훅이라 통과한다.

```ts
function useSelectableOrder(id: string) {                        // ✅ useState 와 조합한다
  const { data: order } = useSuspenseQuery(orderQueries.detail(id));
  const [isSelected, setIsSelected] = useState(false);
  return { order, isSelected, setIsSelected };
}
```

근거: TkDodo 「Creating Query Abstractions」 — 설정 공유는 `queryOptions`, 로직 공유는 그 위의 훅.

코드: `rules/no-thin-query-hook.mjs`

#### 10. 쿼리 설정을 호출하는 자리에 직접 적기 — `eric/restricted-syntax`

**잡는 것**: `useSuspenseQuery({ queryKey, queryFn })` 처럼 쿼리 설정 객체를 그 자리에 직접 쓰면 걸린다. `useSuspenseQueries({ queries: [{ … }] })` 안도 마찬가지다.

**왜**: 설정이 호출하는 곳마다 흩어지면 같은 쿼리의 키나 캐시 정책이 조금씩 달라진다. `orderQueries.detail(id)` 처럼 쿼리 설정을 만드는 함수에 모아두고, 캐시 정책(`refetchOnMount` 등)도 거기에 둔다. 이 룰 덕분에 쿼리 팩토리가 항상 존재하므로, #9 를 통과한 훅이 있어도 쓰는 쪽이 필요하면 팩토리를 직접 쓸 수 있다.

코드: `index.mjs` 의 `RESTRICTED_SYNTAX`

#### 11. 쿼리를 연달아 부르기 — `eric/discouraged-syntax` (warn)

**잡는 것**: 같은 블록 안에서 `useSuspenseQuery` 를 담은 변수 선언이 연달아 나오면 경고한다.

**왜**: suspense 쿼리는 데이터가 올 때까지 컴포넌트를 멈춘다. 그래서 두 개를 연달아 적으면 첫 번째가 끝나야 두 번째가 **시작**된다(워터폴). 서로 상관없는 쿼리라면 `useSuspenseQueries` 로 묶어 동시에 시작한다.

```ts
const order = useSuspenseQuery(orderQueries.detail(id));
const catalog = useSuspenseQuery(productQueries.list());   // ⚠ order 가 끝난 뒤에야 시작한다
const [order, catalog] = useSuspenseQueries({ queries: [orderQueries.detail(id), productQueries.list()] });  // ✅
```

**warn 인 이유**: 두 번째 쿼리가 첫 번째 결과를 써야 하는 경우(의존 쿼리)도 같이 걸린다. 그때는 순서대로 부를 수밖에 없으니 무시한다.

코드: `index.mjs` 의 `DISCOURAGED_SYNTAX`

#### 12. 객체 타입은 `interface` 로 — `typescript/consistent-type-definitions`

**잡는 것**: `type Props = { … }` 처럼 객체 모양의 타입을 `type` 으로 선언하면 걸린다. `interface Props { … }` 로 쓴다.

**괜찮은 경우**: `type ViewState = { type: "a" } | { type: "b" }` 처럼 여러 모양 중 하나인 타입(판별 유니온)은 `interface` 로 쓸 수 없으니 걸리지 않는다.

#### 13. props 타입은 한 줄일 때만 직접 적기 — `eric/props-inline-type-single-line`

**잡는 것**: 컴포넌트 파라미터에 직접 적은 props 타입이 여러 줄로 넘어가면 걸린다.

**왜**: 짧으면 그 자리에 적는 게 읽기 편하지만, 길어지면 시그니처가 지저분해진다. 그때는 `XxxProps` interface 로 뺀다.

```tsx
function Badge({ label }: { label: string }) {}   // ✅ 한 줄
function Header({ title, showSearch }: {          // ❌ HeaderProps 로 뺀다
  title: string;
  showSearch: boolean;
}) {}
```

대문자로 시작하는 함수(컴포넌트)와 `VariantForm.error = (…) => …` 처럼 컴포넌트에 붙이는 함수를 본다.

코드: `rules/props-inline-type-single-line.mjs`

#### 14. 변경 이력 주석 — `no-warning-comments` (warn)

**잡는 것**: 주석에 `기존엔`·`기존에는`·`원래는`·`예전엔` 이 들어 있으면 경고한다.

**왜**: "기존엔 이렇게 했는데 바꿨다" 같은 설명은 PR 설명에 쓸 내용이다. 코드를 나중에 읽는 사람에게 "기존 코드"는 존재하지 않는다. 단어로만 찾기 때문에 일부만 잡히고, 나머지는 리뷰에서 본다.

### 02 구조

#### 15. 선언하기 전에 쓰기 — `no-use-before-define`

**잡는 것**: 파일 최상위에서 아직 선언되지 않은 상수를 쓰거나, 타입을 선언보다 먼저 쓰면 걸린다.

**왜**: `const`·`let` 은 선언된 줄보다 먼저 쓰면 실행할 때 에러가 난다(이 구간을 TDZ 라고 부른다).

```ts
export const earlyRate = LATE_RATE * 2;   // ❌ 파일을 읽는 순간 실행되는데 LATE_RATE 가 아직 없다
const LATE_RATE = 3;
```

**괜찮은 경우**
- **함수 안에서** 파일 아래쪽 상수를 쓰는 것. 함수는 나중에 호출되고, 그때는 상수가 이미 선언돼 있어서 에러가 안 난다. 그래서 styled 컴포넌트나 className 상수를 파일 맨 아래에 두는 배치는 괜찮다.
- `function` 으로 선언한 함수. `function` 은 파일 어디에 있어도 맨 위로 끌어올려진 것처럼 동작해서(호이스팅) 순서가 상관없다. 그래서 "호출하는 쪽(진입점)을 위에, 쓰이는 조각을 아래에" 두는 배치(habits/01 §4)가 가능하다.

### 03 조합

#### 16. `showXxx`·`hideXxx` prop — `eric/discouraged-syntax` (warn)

**잡는 것**: JSX 에 `showSearch`·`hideAvatar` 같은 prop 이 있으면 경고한다.

**왜**: "검색 버튼 보여줄까 말까"를 boolean 으로 조종하면 화면에 뭐가 나오는지가 컴포넌트 안에 숨는다. 보여줄 조각 자체를 prop 으로 넘기면(`right={<SearchButton />}`) JSX 만 봐도 화면이 보인다.

### 04 함수형

#### 17. `for`·`while` 루프 — `eric/restricted-syntax`

**잡는 것**: `for`·`for…of`·`for…in`·`while`·`do…while` 을 막는다.

**왜**: 루프는 보통 바깥 변수를 바꾸면서 결과를 쌓는다. `map`·`filter`·`reduce` 로 쓰면 "무엇을 만드는지"가 드러나고 값을 바꾸지 않는다. 테스트에서 같은 테스트를 여러 입력으로 돌리려면 `it.each` 를 쓴다.

#### 18. `let` — `eric/restricted-syntax`

**잡는 것**: `let` 선언을 막는다.

**왜**: 값을 나중에 바꾸면 어느 시점에 무슨 값인지 따라가야 한다. 새 값이 필요하면 새 `const` 를 만든다. 테스트에서 `beforeEach` 로 채우던 `let` 은 `setup()` 함수로, 나중에 resolve 할 Promise 는 `Promise.withResolvers()` 로 바꾼다.

#### 19. 파라미터에 다시 값 넣기 — `no-param-reassign`

**잡는 것**: 받은 파라미터에 다시 값을 넣거나(`order = …`), 파라미터 객체의 속성을 바꾸면(`order.total = 0`) 걸린다.

**왜**: 호출한 쪽의 객체가 몰래 바뀐다. 바뀐 값이 필요하면 새 객체를 만들어 돌려준다.

#### 20. 삼항 안의 삼항 — `no-nested-ternary`

**잡는 것**: `a ? x : b ? y : z` 를 막는다.

**왜**: 조건이 늘수록 어느 조건이 어느 값인지 읽기 어렵다. `if (…) return …;` 를 줄마다 하나씩 쓴다.

#### 21. `parse*`/`validate*` 안의 `throw` — `eric/restricted-syntax`

**잡는 것**: 이름이 `parse`·`validate` 로 시작하는 함수 안에서 `throw` 하면 걸린다.

**왜**: 입력이 잘못될 수 있다는 건 예상 가능한 실패다. `throw` 하면 호출하는 쪽이 시그니처만 보고는 실패 가능성을 모른다. `Result` 나 `T | null` 로 돌려주면 호출하는 쪽이 반드시 처리하게 된다.

#### 22. export 함수의 리턴 타입 — `eric/explicit-return-type`

**잡는 것**: `export function`, `export const x = () =>`, `export default function` 에 리턴 타입이 없으면 걸린다.

**왜**: 바깥에 공개하는 함수는 시그니처가 약속이다. 리턴 타입을 적어두면 이름이 약속한 것과 맞는지(#2)도 검사할 수 있다.

**괜찮은 경우**: 컴포넌트(대문자로 시작하는 이름)는 제외한다.

코드: `rules/explicit-return-type.mjs`

### 05 타입

#### 23. `as` — `typescript/consistent-type-assertions`

**잡는 것**: `x as Order`, `x as unknown as Order` 를 막는다. `as const` 는 허용한다.

**왜**: `as` 는 "내가 맞다고 보장할게"라며 TypeScript 검사를 끈다. 틀려도 컴파일러가 못 잡는다. 테스트에서 mock 타입을 맞출 때는 `vi.mocked(x)` 를, 일부 필드만 있는 테스트 데이터는 기본값을 채워주는 팩토리 함수를 쓴다.

#### 24. `!` — `typescript/no-non-null-assertion`

**잡는 것**: `order!.total` 처럼 "절대 null 이 아니다"라고 단언하는 `!` 를 막는다.

**왜**: `as` 와 같은 이유다. 값이 반드시 있다는 건 `!` 가 아니라 코드 구조(예: Suspense 안에서 `useSuspenseQuery` 로 받기)로 보장한다.

#### 25. `any` — `typescript/no-explicit-any`

**잡는 것**: `any` 타입을 막는다. `any` 는 타입 검사를 통째로 끈다.

### 06 테스트

#### 26. 제품 코드의 `data-testid` — `eric/restricted-syntax`

**잡는 것**: 테스트가 아닌 파일의 JSX 에 `data-testid` 속성이 있으면 걸린다.

**왜**: 테스트는 사용자가 보는 방식(버튼 이름, 역할)으로 요소를 찾아야 화면이 실제로 맞는지 검증된다. 테스트 전용 id 를 박으면 화면이 깨져도 테스트는 통과할 수 있다.

#### 27. 테스트의 `getByTestId`·`getComputedStyle` — `eric/restricted-syntax`

**잡는 것**: 테스트 파일에서 `getByTestId` 계열과 `getComputedStyle` 을 쓰면 걸린다.

**왜**
- `getByTestId` 는 #26 과 같은 이유다. `getByRole` 같은 쿼리와, 범위를 좁히는 `within` 을 쓴다.
- `getComputedStyle` 은 테스트 환경(jsdom)이 styled-components 의 중첩 CSS 를 계산하지 못해 틀린 값을 준다. `toHaveStyle` 매처를 쓴다.

## 테스트 파일에서 달라지는 것

**테스트 파일로 보는 경로**(옵션 `testFiles` 기본값)
- `*.test.*`, `*.spec.*`
- `fixtures/`·`mocks/`·`__tests__/`·`__mocks__/` 폴더 안
- 파일 이름에 `fixture`·`mock`·`test-helper`·`test-utils` 가 들어간 것

**달라지는 점**

| | 내용 |
|---|---|
| 더 허용 | #1 동사에 `setup`·`mock`·`expect`·`query` 추가, 단독 `setup()`·`wrapper` 허용 |
| 꺼짐 | #2 리턴 타입 약속(testing-library 의 `find`·`query` 뜻이 다름), #3·#4 두루뭉술한 이름(테스트의 `result` 관용구) |
| 바뀜 | #26 대신 #27 이 적용된다 |
| 그대로 | 나머지 전부. `as`·`!`·`let`·루프도 테스트에 그대로 적용된다 |

테스트에서 `as`·`!`·`let`·루프를 안 쓰는 방법

| 막히는 것 | 대신 쓰는 것 |
|---|---|
| `(useX as Mock).mockReturnValue(…)` | `vi.mocked(useX).mockReturnValue(…)` |
| `{ id: "1" } as Order` | 기본값을 채워주는 팩토리 `createOrderFixture({ id: "1" })` |
| `getByText("A").parentElement!` | `getByRole(…)` + `within(…)` |
| `let client; beforeEach(() => { client = … })` | 테스트마다 부르는 `setup()` 함수 |
| `for (const x of cases) test(…)` | `it.each(cases)(…)` |

## 검사하지 않는 것 (다른 곳이 맡는다)

| 검사 | 맡는 곳 | 이유 |
|---|---|---|
| 순환 import | dependency-cruiser | 모든 파일의 import 관계를 다 따라가야 해서 느리다(ESLint 시절 전체 검사 시간의 76%) |
| effect 안에서 setState | #7 | `useEffect` import 자체를 막으니 필요 없다 |
| lint 끄는 주석(`// oxlint-disable`) | 리뷰 | 끈 이유가 타당한지는 사람이 본다 |
| 유니온 switch 에서 빠진 경우 | TypeScript(`never` 패턴)·리뷰 | 유니온에 값을 추가하면 **안 바뀐 기존 switch 줄**에서 경고가 나서, diff CI 에서는 걸러져 보이지 않는다 |
| 옵셔널 필드(`?`)가 땜빵인지 | 리뷰 | 정말 없을 수 있는 값인지는 판단의 문제다 |
| 다른 모듈의 내부 파일 import | import 경계 전용 도구(dependency-cruiser 등)·리뷰 | 레포마다 폴더 구조와 별칭이 달라 이 프리셋이 일반화하기 어렵다 |
| 그릇 이름·`"-"` 반환·배열에서 유니온 뽑기·판정 배열 | 리뷰 | 걸리는 양이 적거나 정당한 경우가 섞여 있어 lint 로 막을 실익이 작다 |

## lint 로 안 되는 것

lint 는 "모양"만 볼 수 있다. 설계가 맞는지는 사람이 판단한다(habits/02 「기계 검증과의 분업」).

- 컴포넌트·훅을 알맞게 나눴는지, 하는 일 없이 감싸기만 한 건 아닌지 (01 §1, 03)
- 상태를 어디에 두는 게 맞는지, 한 곳에 모을 것과 나눌 것을 제대로 갈랐는지 (02)
- 공유 UI 를 훅으로 줄지, 컴포넌트로 줄지, 필수 prop 으로 받을지 (03)
- 이름이 이 제품에서 쓰는 말로 자연스럽게 읽히는지, 너무 넓거나 좁지 않은지 (00, 02)
- 옵셔널 필드가 정말 "없을 수 있는" 값인지 (05)

## 리뷰와의 분업

같은 habit 이라도 **모양은 lint 가, 의미는 리뷰가** 잡는다. `eric-review`·`eric-refine` 은 이 표의 **lint 칸은 다시 보지 않는다**. 대상 레포에 이 프리셋이 없을 때만 전부 본다. 이 표를 바꾸면 스킬 동작도 바뀌므로, 루트 README 「강제 층 분업」의 동기화 표를 따른다.

| habit | lint 가 잡는 것 | 리뷰가 잡는 것 |
|---|---|---|
| 00 동사 | 목록에 있는 동사인가, `And`(도메인 용어 예외 제외), 적어둔 리턴 타입이 동사 약속과 맞는가 | `to*` 와 `create*` 중 맞는 쪽인가(입력을 변환하는지, 설정을 받아 새로 만드는지), `get*`·`to*` 가 몰래 부수효과를 내지 않는가, `format*` 이 판정을 숨기지 않는가, `set*`/`update*`·`delete*`/`remove*` 중 맞는 쪽인가, `on*` 이 정말 prop 이름으로 쓰이는가 |
| 00 명사 | `data`·`item`·`value`·`state`·`info`·`result`, `*Info`·`*Data` | 명사가 무엇인지 충분히 좁혀졌나, 이 제품의 말로 읽히나 |
| 00 특수값·그릇 이름 | "없음" 상수의 계산 | 특수값의 의미가 드러났나, 내용이 하나뿐인데 `*Config`·`*Options` 같은 그릇 이름을 쓰지 않았나 |
| 01 §3 데이터 조회 | 조건부 조회가 아닌 `useQuery`, 쿼리만 감싼 훅, 설정 직접 적기, 연달아 부르기(warn) | 조회 위치가 맞나, 쿼리를 쓰는 커스텀 훅 둘을 나란히 불러 순서대로 기다리게 되지 않았나, 병렬로 부르려고 상태를 위로 끌어올리지 않았나 |
| 01 §6 effect | `useEffect`·`useLayoutEffect` import, `React.useEffect` | 허용 파일 안에서 state 를 복제하지 않았나, 렌더 중 계산으로 바꿀 수 있나, 외부 값이면 `useSyncExternalStore` 인가 |
| 01 §7 props·주석 | `interface`, 한 줄 props 타입, 이력 주석 일부 단어 | 컴포넌트가 `"-"` 같은 문자열 대신 `ReactNode` 로 일관 반환하나, 주석이 코드로는 안 보이는 제약만 담고 있나 |
| 02 구조 | 선언 전 사용 | 다른 모듈의 내부 파일을 직접 import 하지 않았나(공개 입구로만), 유한한 이름 집합을 배열이 아니라 유니온 타입을 원본으로 뒀나 |
| 04 함수형 | 루프·`let`·중첩 삼항·`parse*` 의 throw | 호출하는 쪽이 처리할 실패(`Result`)인지 경계가 처리할 실패(throw)인지, 유니온 분기에서 빠진 경우를 `never` 로 막았나, 판정 규칙을 배열로 박지 않았나 |
| 05 타입 | `as`·`!`·`any` | lint 끄는 주석으로 피하지 않았나, 옵셔널이 땜빵이 아닌가, 옛 데이터 형식 처리를 데이터가 들어오는 한 곳에서 했나 |
| 06 테스트 | `*ByTestId`·`getComputedStyle`·제품 코드의 `data-testid` | mock 이 파라미터를 실제로 반영하나, 분기·예외 경로를 다 테스트했나 |

## 구현

### 의존성

oxlint(1.86 이상) 하나만 쓴다. oxlint 가 네이티브 룰을 돌리고, 이 프리셋의 JS 플러그인(`eric`)도 불러서 같이 실행한다.

### 파일

```
index.mjs            createOxlintConfig — 옵션을 받아 oxlint 설정 객체를 만든다
                     FUNCTION_VERBS(허용 동사) · RESTRICTED_SYNTAX(error 셀렉터 목록) · DISCOURAGED_SYNTAX(warn 셀렉터 목록)
plugin.mjs           JS 플러그인 eric — rules/ 의 룰을 이름에 연결한다
rules/               직접 만든 룰 — 파일 하나에 룰 하나
test/
  oxlint.config.mjs  테스트용 설정 — 프리셋 + oxlint 기본 룰은 끔
  preset.test.mjs    samples/ 를 oxlint 로 검사하고 expect 주석과 비교
  samples/           clean.tsx(경고 0건이어야 함) · violations.tsx · order-panel.test.tsx · external-sync/
```

`createOxlintConfig` 가 만드는 설정은 세 부분이다.
1. `jsPlugins`: 플러그인 파일(`plugin.mjs`)의 위치
2. `rules`: 32개 검사의 기본 설정
3. `overrides`: 특정 파일에만 다르게 적용하는 설정 두 개 — `effectAllowedFiles` 에서는 #7·#8 을 풀고, 테스트 파일에서는 「테스트 파일에서 달라지는 것」대로 바꾼다

### 룰을 만드는 세 가지 방법

1. **oxlint 네이티브 룰에 옵션만 준다.** 예: `typescript/consistent-type-assertions: { assertionStyle: "never" }`. 가장 빠르고 쉽다. 가능하면 이걸 쓴다.
2. **셀렉터 목록에 한 줄 추가한다.** "이런 모양의 코드는 금지"를 셀렉터 한 줄로 적는다. 새 룰 파일을 만들 필요가 없다.
   ```js
   // "(typeof STEPS)[number]" 모양을 고르는 셀렉터
   "TSIndexedAccessType[objectType.type='TSTypeQuery'][indexType.type='TSNumberKeyword']"
   ```
   원래 ESLint 에는 이걸 해주는 `no-restricted-syntax` 룰이 있는데 oxlint 에는 없다. 그래서 같은 일을 하는 룰(`rules/syntax-selectors.mjs`)을 직접 만들어 두 이름으로 등록했다. error 로 막을 건 `RESTRICTED_SYNTAX` 에, warn 으로 알릴 건 `DISCOURAGED_SYNTAX` 에 넣는다.
3. **룰 파일을 직접 짠다.** 셀렉터 한 줄로 표현이 안 될 때만 쓴다. 예: 꺼내 쓴 이름을 재귀로 다 보기, 훅 몸통이 "쿼리만 부르고 끝"인지 판정하기, 상수가 쓰인 곳을 전부 추적하기. 형식은 ESLint 룰과 같은 `{ meta, create(context) }` 이고, `create` 가 "이런 코드 조각을 만나면 이렇게 검사해" 라는 함수 목록을 돌려준다.

## 룰을 바꿀 때

| 바꾸는 것 | 같이 바꿀 것 |
|---|---|
| habits/00 동사 표 | `index.mjs` 의 `FUNCTION_VERBS`, `rules/verb-return-contract.mjs` 의 `CONTRACTS`, 이 README 의 #1·#2 |
| 룰 추가·완화·삭제 | 해당 habit 문구, `test/samples` 의 `expect` 주석, 이 README 의 「한눈에」·상세 설명·「리뷰와의 분업」 |
| 룰 파일 새로 만들기 | `rules/` 에 파일 추가, `plugin.mjs` 에 등록, `index.mjs` 에서 켜기 |
| 전체 원칙 | 루트 README 「강제 층 분업」 |

## 테스트

```bash
npm install
npm test
```

`test/samples/` 파일의 각 줄 끝에 `/* expect: 룰이름 */` 처럼 **그 줄에서 나와야 하는 경고**를 적어두고, oxlint 가 실제로 낸 경고와 줄마다 비교한다. 나와야 할 게 안 나와도(놓침), 안 나와야 할 게 나와도(오탐) 테스트가 실패한다.

- `clean.tsx` 는 habits 가 권하는 코드를 모은 파일이라 경고가 **0건**이어야 한다.
- 룰을 추가하면 `violations.tsx` 에 **걸려야 하는 예시**를, `clean.tsx` 에 **통과해야 하는 예시**를 같이 넣는다.

**주의할 점**
- 샘플 폴더 이름을 `fixtures/` 로 하면 안 된다. 테스트 파일 경로 패턴(`**/fixtures/**`)에 걸려서 테스트 파일용 설정이 적용돼 버린다.
- `expect` 표식은 검사 대상 주석과 **다른 주석**으로 둔다. oxlint 는 주석 안에 룰 이름(`no-warning-comments`)이 적혀 있으면 그 주석을 검사하지 않는다.
