# @eric/oxlint-preset

`habits/` 에 적힌 코드 습관 중에서 **기계가 코드만 보고 판단할 수 있는 것**을 lint 로 자동 검사하는 설정 묶음이다. lint 도구는 [oxlint](https://oxc.rs/docs/guide/usage/linter) 를 쓴다.

- **왜 이 룰인지**의 원칙은 `habits/` 에 있다. 규칙 하나하나가 무엇을 잡고, 왜 문제이고, 지키면 무엇을 얻는지는 [RULES.md](RULES.md) 에 규칙 id 하나에 섹션 하나로 있다. lint 메시지 끝에 근거가 되는 habit 이 붙어 있다(예: `(habits/01 §3)`).
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
| `andJoinedTerms` | `[]` | 이름에 `And` 가 들어가도 되는 도메인 용어(#1). 예: `"TermsAndConditions"` |
| `apiFiles` | `[]` | 서버 엔드포인트를 부르는 API 파일 경로(#1). 함수 이름이 엔드포인트를 따르므로(`approveAccessRequest`) 동사 검사를 하지 않는다. 예: `["src/**/api/**"]` |
| `domainVerbs` | `[]` | **인앱** 도메인 동작 동사(#1) — 서버 엔드포인트가 아니라 앱 안의 동작인데 표의 동사로 바꾸면 뜻이 뭉개지는 것만(`signOut`). 항목마다 `verb`·`contract`(계약 한 문장)를 적는다. 예: `[{ verb: "signOut", contract: "세션을 끝내는 쓰기 — 토큰 폐기 + 로컬 세션 제거" }]`. 등록 불가 동사이거나 계약이 비면 config 를 만들 때 throw 한다 |

### 알아둘 것

- **oxlint 가 기본으로 켜는 룰(`correctness` 분류)은 그대로 둔다.** 이 프리셋은 habits 룰만 추가한다. 기본 룰을 끄거나 더 켜고 싶으면 `{ ...createOxlintConfig(), categories: { … } }` 처럼 덮어쓴다.
- **`useQuery` 조건부 판정(#6)은 호출 자리만 본다.** `skipToken` 을 팩토리 안에 넣으면 조건부 조회인지 보이지 않아 경고가 난다. 조건은 호출하는 자리에 둔다(`useQuery({ ...orderQueries.detail(id), enabled })`).
- **설정 파일은 `.mjs`(JavaScript)여야 한다.** 옵션을 받아 설정을 만드는 함수라서 JSON 파일로는 쓸 수 없다. oxlint 에서 JS 설정 파일은 아직 실험 기능이고, Node.js 로 실행해야 동작한다.
- **룰 이름 없는 한 줄 억제는 못 잡는다.** #40 은 `/* oxlint-disable */` 블록만 잡고 `// oxlint-disable-next-line`(룰 이름 없음)은 놓친다. 리뷰에서 본다.
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
| 1 | 00 | 동사 목록에 없는 동사로 시작하는 함수 이름, 이름 속 `And` | [`eric/function-verb-whitelist`](RULES.md#ericfunction-verb-whitelist) |
| 2 | 00 | 동사가 약속한 것과 다른 리턴 타입(예: `find*` 가 `null` 없이 반환, 없음을 `undefined` 로 반환) | [`eric/verb-return-contract`](RULES.md#ericverb-return-contract) |
| 3 | 00 | `data`·`item`·`value` 같은 두루뭉술한 변수·파라미터 이름 | [`eric/no-general-name`](RULES.md#ericno-general-name) |
| 4 | 00 | `OrderInfo`·`UserData` 처럼 `Info`·`Data` 로 끝나는 타입 이름 | [`eric/no-general-name`](RULES.md#ericno-general-name) |
| 5 | 00 | "없음"을 뜻하는 `-1` 상수를 계산에 섞기 | [`eric/no-sentinel-arithmetic`](RULES.md#ericno-sentinel-arithmetic) |
| 6 | 01 §3 | 조건부 조회가 아닌데 `useQuery` 쓰기, `useQueries`·`useInfiniteQuery` import | [`eric/restricted-syntax`](RULES.md#ericrestricted-syntax), [`no-restricted-imports`](RULES.md#no-restricted-imports) |
| 7 | 01 §6 | `useEffect`·`useLayoutEffect` import | [`no-restricted-imports`](RULES.md#no-restricted-imports) |
| 8 | 01 §6 | `React.useEffect(…)` 로 우회하기 | [`eric/restricted-syntax`](RULES.md#ericrestricted-syntax) |
| 9 | 01 §3 | 쿼리 하나만 감싸고 하는 일이 없는 커스텀 훅 | [`eric/no-thin-query-hook`](RULES.md#ericno-thin-query-hook) |
| 10 | 01 §3 | 쿼리 팩토리를 펼친 뒤 옵션을 덧붙이기(통째로 인라인은 #48) | [`eric/restricted-syntax`](RULES.md#ericrestricted-syntax) |
| 11 | 01 §3 | 쿼리를 연달아 불러 순서대로 기다리게 만들기 (warn) | [`eric/discouraged-syntax`](RULES.md#ericdiscouraged-syntax) |
| 12 | 01 §7 | 객체 모양 타입을 `type` 으로 선언 | [`typescript/consistent-type-definitions`](RULES.md#typescriptconsistent-type-definitions) |
| 13 | 01 §7 | 여러 줄짜리 props 타입을 파라미터에 직접 적기 | [`eric/props-inline-type-single-line`](RULES.md#ericprops-inline-type-single-line) |
| 14 | 01 §7 | "기존엔 ~였다" 같은 변경 이력 주석 (warn) | [`no-warning-comments`](RULES.md#no-warning-comments) |
| 15 | 02 | 선언하기 전에 쓰기 | [`no-use-before-define`](RULES.md#no-use-before-define) |
| 16 | 03 | `showXxx`·`hideXxx` boolean prop (warn) | [`eric/discouraged-syntax`](RULES.md#ericdiscouraged-syntax) |
| 17 | 04 | `for`·`while` 루프 | [`eric/restricted-syntax`](RULES.md#ericrestricted-syntax) |
| 18 | 04 | `let` | [`eric/restricted-syntax`](RULES.md#ericrestricted-syntax) |
| 19 | 04 | 파라미터에 다시 값 넣기 | [`no-param-reassign`](RULES.md#no-param-reassign) |
| 20 | 04 | 삼항 연산자 안에 삼항 연산자 | [`no-nested-ternary`](RULES.md#no-nested-ternary) |
| 21 | 04 | `parse*`/`validate*` 함수 안의 `throw` | [`eric/restricted-syntax`](RULES.md#ericrestricted-syntax) |
| 22 | 04 | 리턴 타입을 안 적은 export 함수 | [`eric/explicit-return-type`](RULES.md#ericexplicit-return-type) |
| 23 | 05 | `as` 타입 단언 | [`typescript/consistent-type-assertions`](RULES.md#typescriptconsistent-type-assertions) |
| 24 | 05 | `!` non-null 단언 | [`typescript/no-non-null-assertion`](RULES.md#typescriptno-non-null-assertion) |
| 25 | 05 | `any` | [`typescript/no-explicit-any`](RULES.md#typescriptno-explicit-any) |
| 26 | 06 | 제품 코드의 `data-testid` 속성 | [`eric/restricted-syntax`](RULES.md#ericrestricted-syntax) |
| 27 | 06 | 테스트의 `getByTestId` | [`eric/restricted-syntax`](RULES.md#ericrestricted-syntax) |
| 28 | 00 | kebab-case 가 아닌 파일 이름 | [`unicorn/filename-case`](RULES.md#unicornfilename-case) |
| 29 | 00 | 일부러 넘기거나 반환하는 `undefined`(없음은 `null`) | [`unicorn/no-useless-undefined`](RULES.md#unicornno-useless-undefined) |
| 30 | 01 §2 | 세 단을 넘는 블록 중첩 | [`max-depth`](RULES.md#max-depth) |
| 31 | 01 §1 | 다섯 개 이상의 파라미터 | [`max-params`](RULES.md#max-params) |
| 32 | 00 | `if (!x) … else …`, `!x ? a : b` 처럼 부정으로 시작하는 양갈래 분기 | [`unicorn/no-negated-condition`](RULES.md#unicornno-negated-condition) |
| 33 | 02 | 바깥 스코프를 안 쓰는데 함수 안에 선언한 함수 | [`unicorn/consistent-function-scoping`](RULES.md#unicornconsistent-function-scoping) |
| 34 | 04 | `forEach` | [`unicorn/no-array-for-each`](RULES.md#unicornno-array-for-each) |
| 35 | 00 | `const [open, setVisible]` 처럼 짝이 안 맞는 `useState` 이름 | [`react/hook-use-state`](RULES.md#reacthook-use-state) |
| 36 | 01 §7 | 화살표 함수로 선언한 이름 있는 컴포넌트 | [`react/function-component-definition`](RULES.md#reactfunction-component-definition) |
| 37 | 03 | 컴포넌트 안에서 선언한 컴포넌트(렌더마다 리마운트) | [`react/no-unstable-nested-components`](RULES.md#reactno-unstable-nested-components) |
| 38 | 04 | 원본을 바꾸는 `sort()`·`reverse()` | [`unicorn/no-array-sort`](RULES.md#unicornno-array-sort), [`unicorn/no-array-reverse`](RULES.md#unicornno-array-reverse) |
| 39 | 05 | `@ts-ignore`·`@ts-expect-error`·`@ts-nocheck` (테스트는 설명이 붙은 `@ts-expect-error` 허용) | [`typescript/ban-ts-comment`](RULES.md#typescriptban-ts-comment) |
| 40 | 05 | 룰 이름 없이 통째로 끄는 `/* oxlint-disable */` | [`unicorn/no-abusive-eslint-disable`](RULES.md#unicornno-abusive-eslint-disable) |
| 41 | 04 | `{ [key: string]: V }` 인덱스 시그니처(→ `Record`) | [`typescript/consistent-indexed-object-style`](RULES.md#typescriptconsistent-indexed-object-style) |
| 42 | 04 | `delete obj[key]` | [`typescript/no-dynamic-delete`](RULES.md#typescriptno-dynamic-delete) |
| 43 | 03 | `cloneElement`·`Children.map` 으로 children 고치기 | [`react/no-clone-element`](RULES.md#reactno-clone-element), [`react/no-react-children`](RULES.md#reactno-react-children) |
| 44 | 03 | `= []`·`= {}` 같은 객체 기본값 prop | [`react/no-object-type-as-default-prop`](RULES.md#reactno-object-type-as-default-prop) |
| 45 | 03 | 렌더마다 새로 만드는 context value | [`react/jsx-no-constructed-context-values`](RULES.md#reactjsx-no-constructed-context-values) |
| 46 | - | `console.warn`·`console.error` 가 아닌 `console.*` | [`no-console`](RULES.md#no-console) |
| 47 | 04 | `reduce` 안에서 누적값을 매번 펼치기(O(n²)) | [`oxc/no-accumulating-spread`](RULES.md#oxcno-accumulating-spread) |
| 48 | 01 §3 | `queryKey` 에 빠진 `queryFn` 의존값, 인라인 쿼리 옵션, 결과 객체 rest 구조분해 등 | [`@tanstack/query/*`](RULES.md#tanstackqueryexhaustive-deps) 7개 |
| 49 | 06 | 테스트 안의 분기·단언 없는 테스트·메시지 없는 `toThrow()` 등 | [`vitest/*`](RULES.md#vitestno-conditional-expect) 8개 |
| 50 | 06 | DOM 구조 접근, `render` 결과 쿼리, `fireEvent`, 비동기 쿼리 미대기 등 | [`testing-library/*`](RULES.md#testing-libraryno-node-access) 14개 |

규칙마다 **잡는 것·왜·효과·예시**는 [RULES.md](RULES.md) 에 규칙 id 하나에 섹션 하나로 있다. lint 경고도 그 섹션으로 링크된다.

## 테스트 파일에서 달라지는 것

**테스트 파일로 보는 경로**(옵션 `testFiles` 기본값)
- `*.test.*`, `*.spec.*`
- `fixtures/`·`mocks/`·`__tests__/`·`__mocks__/` 폴더 안
- 파일 이름에 `fixture`·`mock`·`test-helper`·`test-utils` 가 들어간 것

**달라지는 점**

| | 내용 |
|---|---|
| 더 허용 | #1 동사에 [`setup`](RULES.md#setup)·[`mock`](RULES.md#mock)·[`expect`](RULES.md#expect)·[`query`](RULES.md#query) 추가, 단독 `setup()`·[`wrapper`](RULES.md#wrapper) 허용 |
| 꺼짐 | #2 리턴 타입 약속(testing-library 의 [`find`](RULES.md#find)·[`query`](RULES.md#query) 뜻이 다름), #3·#4 두루뭉술한 이름(테스트의 [`result`](RULES.md#result) 관용구) |
| 바뀜 | #26 대신 #27 이 적용된다 |
| 그대로 | 나머지 전부. [`as`](RULES.md#as)·`!`·[`let`](RULES.md#let)·루프(`for…of` 는 허용)도 테스트에 그대로 적용된다 |

테스트에서 `as`·`!`·`let`·루프를 안 쓰는 방법

| 막히는 것 | 대신 쓰는 것 |
|---|---|
| `(useX as Mock).mockReturnValue(…)` | `vi.mocked(useX).mockReturnValue(…)` |
| `{ id: "1" } as Order` | 기본값을 채워주는 팩토리 `createOrderFixture({ id: "1" })` |
| `getByText("A").parentElement!` | `getByRole(…)` + `within(…)` |
| `let client; beforeEach(() => { client = … })` | 테스트마다 부르는 `setup()` 함수 |
| `for (const x of cases) test(…)` (lint 는 막지 않는다. 리뷰에서 본다) | `it.each(cases)(…)` |

## 검사하지 않는 것 (다른 곳이 맡는다)

| 검사 | 맡는 곳 | 이유 |
|---|---|---|
| 순환 import | dependency-cruiser | 모든 파일의 import 관계를 다 따라가야 해서 느리다(ESLint 시절 전체 검사 시간의 76%) |
| effect 안에서 setState | #7 | [`useEffect`](RULES.md#useeffect) import 자체를 막으니 필요 없다 |
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
| 00 동사 | 목록에 있는 동사인가, `And`(도메인 용어 예외 제외), 적어둔 리턴 타입이 동사 약속과 맞는가 | `to*` 와 `create*` 중 맞는 쪽인가(입력을 변환하는지, 설정을 받아 새로 만드는지), `get*`·`to*` 가 몰래 부수효과를 내지 않는가, `format*` 이 판정을 숨기지 않는가, `set*[`/`](RULES.md#)update*`·`delete*[`/`](RULES.md#)remove*` 중 맞는 쪽인가, `on*` 이 정말 prop 이름으로 쓰이는가 |
| 00 명사 | `data`·`item`·`value`·`state`·`info`·`result`, `*Info`·`*Data` | 명사가 무엇인지 충분히 좁혀졌나, 이 제품의 말로 읽히나 |
| 00 특수값·그릇 이름 | "없음" 상수의 계산 | 특수값의 의미가 드러났나, 내용이 하나뿐인데 `*Config`·`*Options` 같은 그릇 이름을 쓰지 않았나 |
| 01 §3 데이터 조회 | 조건부 조회가 아닌 `useQuery`, 쿼리만 감싼 훅, 설정 직접 적기, 연달아 부르기(warn) | 조회 위치가 맞나, 쿼리를 쓰는 커스텀 훅 둘을 나란히 불러 순서대로 기다리게 되지 않았나, 병렬로 부르려고 상태를 위로 끌어올리지 않았나 |
| 01 §6 effect | `useEffect`·`useLayoutEffect` import, `React.useEffect` | 허용 파일 안에서 state 를 복제하지 않았나, 렌더 중 계산으로 바꿀 수 있나, 외부 값이면 [`useSyncExternalStore`](RULES.md#usesyncexternalstore) 인가 |
| 01 §7 props·주석 | `interface`, 한 줄 props 타입, 이력 주석 일부 단어 | 컴포넌트가 `"-"` 같은 문자열 대신 [`ReactNode`](RULES.md#reactnode) 로 일관 반환하나, 주석이 코드로는 안 보이는 제약만 담고 있나 |
| 02 구조 | 선언 전 사용 | 다른 모듈의 내부 파일을 직접 import 하지 않았나(공개 입구로만), 유한한 이름 집합을 배열이 아니라 유니온 타입을 원본으로 뒀나 |
| 04 함수형 | 루프·`let`·중첩 삼항·`parse*` 의 throw | 호출하는 쪽이 처리할 실패([`Result`](RULES.md#result))인지 경계가 처리할 실패(throw)인지, 유니온 분기에서 빠진 경우를 [`never`](RULES.md#never) 로 막았나, 판정 규칙을 배열로 박지 않았나 |
| 05 타입 | `as`·`!`·`any` | lint 끄는 주석으로 피하지 않았나, 옵셔널이 땜빵이 아닌가, 옛 데이터 형식 처리를 데이터가 들어오는 한 곳에서 했나 |
| 06 테스트 | `*ByTestId`·제품 코드의 `data-testid` | mock 이 파라미터를 실제로 반영하나, 분기·예외 경로를 다 테스트했나 |

## 구현

### 의존성

oxlint(1.86 이상)를 쓰고, ESLint 플러그인 `eslint-plugin-testing-library`·`@tanstack/eslint-plugin-query` 를 oxlint jsPlugins 로 불러온다. 두 플러그인은 소비처가 peerDependency 로 설치한다(둘 다 `eslint` 를, Query 플러그인은 `typescript` 도 peer 로 요구한다). oxlint 가 네이티브 룰을 돌리고, 이 프리셋의 JS 플러그인(`eric`)도 불러서 같이 실행한다.

### 파일

```
index.mjs            createOxlintConfig — 옵션을 받아 oxlint 설정 객체를 만든다
                     FUNCTION_VERBS·BANNED_VERBS(habits/00 에서 읽음) · RESTRICTED_SYNTAX(error 셀렉터 목록) · DISCOURAGED_SYNTAX(warn 셀렉터 목록)
habit-lists.mjs      habits/00 의 동사 표·등록 불가 동사 표를 읽는다 — 이 프리셋이 habits/ 와 같은 레포에 있어야 한다
plugin.mjs           JS 플러그인 eric — rules/ 의 룰을 이름에 연결한다
rules/               직접 만든 룰 — 파일 하나에 룰 하나
test/
  oxlint.config.mjs  테스트용 설정 — 프리셋 + oxlint 기본 룰은 끔
  preset.test.mjs    samples/ 를 oxlint 로 검사하고 expect 주석과 비교
  samples/           clean.tsx(경고 0건이어야 함) · violations.tsx · order-panel.test.tsx · external-sync/ · api/
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
| habits/00 동사 표·등록 불가 동사 표 | 동사 목록은 lint 가 직접 읽으므로 없음. 동사의 반환 계약을 바꿨을 때만 `rules/verb-return-contract.mjs` 의 [`CONTRACTS`](RULES.md#contracts) 와 이 README 의 #2 |
| 룰 추가·완화·삭제 | 해당 habit 문구, [`test/samples`](RULES.md#testsamples) 의 [`expect`](RULES.md#expect) 주석, 이 README 의 「한눈에」·상세 설명·「리뷰와의 분업」 |
| 룰 파일 새로 만들기 | [`rules/`](RULES.md#rules) 에 파일 추가, `plugin.mjs` 에 등록, `index.mjs` 에서 켜기 |
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
