# 규칙별 설명

이 프리셋이 켜는 규칙을 **규칙 id 하나에 섹션 하나**로 설명한다. lint 경고가 이 문서의 해당 섹션으로 링크된다.

- 섹션 제목은 oxlint 설정에 쓰는 규칙 id 그대로다. 제목을 바꾸면 경고의 링크가 끊기므로 바꾸지 않는다.
- 각 섹션은 **잡는 것**(어떤 코드가 걸리나), **왜**(무엇이 문제인가), **효과**(지키면 무엇을 얻나), **예시** 순서다. 근거가 되는 habit 문서를 첫 줄에 링크한다.
- `eric/restricted-syntax`·`eric/discouraged-syntax` 는 셀렉터마다 경고 문구가 달라서 셀렉터마다 하위 섹션을 둔다. 하위 섹션의 **메시지** 줄은 경고 문구와 글자까지 같아야 한다(테스트가 확인한다).
- 설정 방법, 테스트 파일에서 달라지는 것, 리뷰와의 분업은 [README](README.md) 에 있다.

**목차**

- [00 이름](#00-이름): [eric/function-verb-whitelist](#ericfunction-verb-whitelist) · [eric/verb-return-contract](#ericverb-return-contract) · [eric/no-general-name](#ericno-general-name) · [eric/no-sentinel-arithmetic](#ericno-sentinel-arithmetic) · [unicorn/filename-case](#unicornfilename-case) · [unicorn/no-useless-undefined](#unicornno-useless-undefined) · [react/hook-use-state](#reacthook-use-state) · [no-console](#no-console)
- [01 컴포넌트](#01-컴포넌트): [no-restricted-imports](#no-restricted-imports) · [eric/no-thin-query-hook](#ericno-thin-query-hook) · [eric/no-suspense-query-waterfall](#ericno-suspense-query-waterfall) · [@tanstack/query/*](#tanstackqueryexhaustive-deps) · [typescript/consistent-type-definitions](#typescriptconsistent-type-definitions) · [eric/props-inline-type-single-line](#ericprops-inline-type-single-line) · [no-warning-comments](#no-warning-comments) · [react/function-component-definition](#reactfunction-component-definition) · [react/no-object-type-as-default-prop](#reactno-object-type-as-default-prop) · [react/jsx-no-constructed-context-values](#reactjsx-no-constructed-context-values) · [max-depth](#max-depth) · [max-params](#max-params) · [unicorn/no-negated-condition](#unicornno-negated-condition) · [unicorn/consistent-function-scoping](#unicornconsistent-function-scoping)
- [02 구조](#02-구조): [no-use-before-define](#no-use-before-define)
- [03 조합](#03-조합): [react/no-unstable-nested-components](#reactno-unstable-nested-components) · [react/no-clone-element](#reactno-clone-element) · [react/no-react-children](#reactno-react-children)
- [04 함수형](#04-함수형): [no-param-reassign](#no-param-reassign) · [no-nested-ternary](#no-nested-ternary) · [eric/explicit-return-type](#ericexplicit-return-type) · [typescript/consistent-indexed-object-style](#typescriptconsistent-indexed-object-style) · [typescript/no-dynamic-delete](#typescriptno-dynamic-delete) · [unicorn/no-array-for-each](#unicornno-array-for-each) · [oxc/no-accumulating-spread](#oxcno-accumulating-spread) · [unicorn/no-array-sort](#unicornno-array-sort) · [unicorn/no-array-reverse](#unicornno-array-reverse)
- [05 타입](#05-타입): [typescript/consistent-type-assertions](#typescriptconsistent-type-assertions) · [typescript/no-non-null-assertion](#typescriptno-non-null-assertion) · [typescript/no-explicit-any](#typescriptno-explicit-any) · [typescript/ban-ts-comment](#typescriptban-ts-comment) · [unicorn/no-abusive-eslint-disable](#unicornno-abusive-eslint-disable)
- [셀렉터 규칙](#셀렉터-규칙): [eric/restricted-syntax](#ericrestricted-syntax) · [eric/discouraged-syntax](#ericdiscouraged-syntax)
- [06 테스트](#06-테스트): [vitest/*](#vitestno-conditional-expect) · [testing-library/*](#testing-libraryno-node-access)

---

# 00 이름

## eric/function-verb-whitelist

근거: [habits/00 「함수 이름 = 좁은 동사 + 좁은 명사」](../habits/00-intent.md#함수-이름--좁은-동사--좁은-명사)

**잡는 것**: 함수를 **만드는 자리**의 이름이 허용된 동사로 시작하지 않으면 걸린다. 이름에 `And` 가 들어가도 걸린다. 경고는 두 갈래다.

| 상황 | 푸는 법 |
|---|---|
| 표에도 `domainVerbs` 에도 없는 동사(`confirmOrder`) | 표의 동사로 개명한다. 표의 동사로 바꾸면 뜻이 뭉개지는 인앱 도메인 동작이면 config 의 `domainVerbs` 에 계약 한 문장과 함께 등록한다 |
| habits/00 「등록 불가 동사」(`resolveOrder`, `loadPanel`, `postOrder`) | 개명하거나 쪼갠다. `domainVerbs` 에 올리면 config 가 throw 한다 |

허용 동사는 habits/00 동사 표를 `habit-lists.mjs` 가 직접 읽는다. 동사를 더하거나 빼려면 그 표만 고친다.

**왜**: 표의 동사에는 "무엇을 돌려주고, 실패하면 어떻게 되고, 부수효과가 있는가"라는 약속이 있다(`find` 는 없을 수 있다, `is` 는 boolean 이다). `resolve`·`process`·`manage` 같은 넓은 동사는 그 약속이 없어서 몸통을 열어 봐야 동작을 안다. `And` 는 함수 하나가 일을 둘 한다는 신호다.

**효과**: 함수 이름만 보고 반환·실패·부수효과를 예측할 수 있다. 새 동사가 생기면 config diff 로 드러나서, 팀이 쓰는 동사 어휘가 몰래 넓어지지 않는다. `And` 를 쪼개면 호출하는 쪽에서 두 동작의 순서와 조합이 보인다.

```ts
function resolveOrder(id) {}             // ❌ resolve 는 등록 불가 동사 → findOrder / getOrder / toOrder
function getCartAndResetCoupons() {}     // ❌ 두 함수로 쪼갠다
const mapBndDtoToBnd = (dto) => …        // ❌ map 대신 to
function toBnd(bndDto: BndDto): Bnd {}   // ✅
```

**괜찮은 경우**
- 남이 이름을 정한 경우: `const { refetch } = useQuery(…)`, `const navigate = useNavigate()`
- 컴포넌트(대문자로 시작하는 이름), `all`·`any` 같은 조합자
- 테스트 파일의 `setup`·`mock`·`expect`·`query` 동사와 단독 `setup()`·`wrapper`
- `apiFiles` 에 적은 API 파일(이름이 서버 엔드포인트를 따른다)
- `andJoinedTerms` 에 올린 도메인 용어(`findPendingTermsAndConditions`)

코드: `rules/function-verb-whitelist.mjs`

## eric/verb-return-contract

근거: [habits/00 「함수 이름 = 좁은 동사 + 좁은 명사」](../habits/00-intent.md#함수-이름--좁은-동사--좁은-명사)

**잡는 것**: 함수에 **적어 둔 리턴 타입**이 동사의 약속과 다르면 걸린다.

| 동사 | 리턴 타입 |
|---|---|
| `find*` | `null` 이 포함되고 `undefined` 는 없다 |
| `get*` | `undefined` 가 없다. 없을 수 있으면 `T \| null` |
| `is*`·`has*`·`can*` | `boolean` 또는 타입 가드(`x is Order`) |
| `compare*` | `number` |
| `subscribe*` | 함수(구독 해제 함수) |
| `parse*`·`validate*` | `Result` 또는 `T \| null` |
| `filter*` | 배열 |
| `normalize*` | 첫 파라미터와 같은 타입 |

**왜**: 이름은 `find` 인데 항상 값을 돌려주거나, 없음을 `undefined` 로 돌려주면 이름과 타입이 서로 다른 말을 한다. 없음을 `null` 하나로 모아야 `??`·`=== null` 처리가 갈라지지 않는다.

**효과**: 이름이 약속한 것을 타입이 보증한다. 호출하는 쪽은 `find*` 를 보면 `null` 처리를, `parse*` 를 보면 실패 처리를 해야 한다는 걸 컴파일러가 강제한다. [eric/function-verb-whitelist](#ericfunction-verb-whitelist) 가 "목록에 있는 동사인가"를 보고, 이 규칙이 "그 약속을 지키는가"를 본다.

```ts
function findOrder(id): Order | undefined  // ❌ 없음은 null
function findOrder(id): Order              // ❌ 못 찾을 수 있다
function isReady(o): string                // ❌ is 는 boolean
function parsePort(s): number | null       // ✅
```

**한계**: 리턴 타입을 적지 않은 함수, `type Maybe<T> = T | null` 같은 별명은 풀어 보지 못한다. 테스트 파일에서는 꺼진다(testing-library 의 `findBy*`·`queryBy*` 는 뜻이 다르다).

코드: `rules/verb-return-contract.mjs` 의 `CONTRACTS`

## eric/no-general-name

근거: [habits/00 「함수 이름 = 좁은 동사 + 좁은 명사」](../habits/00-intent.md#함수-이름--좁은-동사--좁은-명사)

**잡는 것**: 변수·파라미터 이름이 `data`·`item`·`value`·`state`·`info`·`result` 이거나 `Info`·`Data` 로 끝나면 걸린다. `interface OrderInfo`, `type UserData` 같은 타입 이름도 본다. `const { data } = …` 처럼 꺼내 쓰는 이름도 본다.

**왜**: 이런 이름은 무엇이든 가리킬 수 있어서 아무것도 가리키지 않는다. 읽는 사람이 안을 열어 봐야 무엇인지 알고, 그런 이름 하나마다 머리에 들고 다닐 것이 하나 는다.

**효과**: 변수 이름만 읽어도 도메인의 무엇인지(`order`, `invoice`, `OrderSummary`) 보인다. `data` 가 서너 개 겹치는 컴포넌트에서 어느 쿼리의 결과인지 헷갈릴 일이 없어진다.

```ts
const { data } = useSuspenseQuery(orderQueries.detail(id));          // ❌
const { data: order } = useSuspenseQuery(orderQueries.detail(id));   // ✅
interface OrderInfo {}                                               // ❌ → OrderSummary
orders.map((item) => item.id);                                       // ✅ 한 줄짜리 콜백 인자는 괜찮다
```

**괜찮은 경우**: 다른 함수에 바로 넘기는 한 줄짜리 콜백의 인자, 객체의 키(`{ data: … }`). 테스트 파일에서는 꺼진다(`const result = fn()` 관용구).

코드: `rules/no-general-name.mjs`

## eric/no-sentinel-arithmetic

근거: [habits/00 「센티넬에 이름을 붙였으면 그 이름은 "없음" 하나만 뜻한다」](../habits/00-intent.md#센티넬에-이름을-붙였으면-그-이름은-없음-하나만-뜻한다)

**잡는 것**: `const X = -1` 로 만든 "없음" 상수를 `+ - * / %` 계산에 쓰면 걸린다. 비교(`=== X`)는 괜찮다.

**왜**: `NO_FILLED_STEP` 이라는 이름은 "채운 단계 없음"만 뜻해야 한다. `NO_FILLED_STEP + count` 로 계산에 섞으면 그 순간 이름이 거짓이 되어, 상수로 뽑은 것이 매직넘버보다 나빠진다.

**효과**: 이런 계산이 필요해졌다는 건 표현이 틀렸다는 신호다. 개수(`0` = 없음)처럼 센티넬이 필요 없는 표현으로 바꾸면 상수와 특수 분기가 같이 사라진다.

```ts
const NO_FILLED_STEP = -1;
return NO_FILLED_STEP + filledStepCount;   // ❌
return filledStepCount;                    // ✅ 0 = 아직 없음
```

어떤 값을 센티넬로 볼지는 룰 옵션 `sentinels` 로 바꾼다(기본 `[-1]`).

코드: `rules/no-sentinel-arithmetic.mjs`

## unicorn/filename-case

근거: [habits/00](../habits/00-intent.md)

**잡는 것**: 파일 이름이 kebab-case(`order-panel.ts`)가 아니면 걸린다.

**왜**: `OrderPanel.ts`·`orderPanel.ts`·`order-panel.ts` 가 섞이면 import 경로를 매번 확인해야 하고, 대소문자를 구분하지 않는 파일 시스템(macOS 기본)에서 이름만 바꾼 커밋이 CI(Linux)에서 깨진다.

**효과**: 파일 이름을 추측해서 바로 찾을 수 있고, 대소문자 차이로 생기는 OS 간 빌드 차이가 없어진다.

```
OrderPanel.ts      ❌
order-panel.ts     ✅
```

## unicorn/no-useless-undefined

근거: [habits/00 「함수 이름」 표의 `find*`](../habits/00-intent.md#함수-이름--좁은-동사--좁은-명사)

**잡는 것**: `return undefined`, `fn(undefined)`, `useState(undefined)` 처럼 `undefined` 를 일부러 넘기거나 반환하면 걸린다.

**왜**: 없음을 `undefined` 와 `null` 두 가지로 표현하면 호출하는 쪽이 둘 다 처리해야 한다. `undefined` 는 "아직 안 정함"(옵셔널, 미초기화)과도 섞이고, TanStack `queryFn` 은 `undefined` 를 반환하지 못한다.

**효과**: "값이 없다"는 뜻은 `null` 하나로 모인다. 생략으로 충분한 곳은 생략해서 코드가 짧아진다.

```ts
return undefined;          // ❌ → return; 또는 없음이면 return null;
setSelected(undefined);    // ❌ → setSelected(null)
```

## react/hook-use-state

근거: [habits/00](../habits/00-intent.md)

**잡는 것**: `useState` 결과를 `[값, 세터]` 로 구조 분해하지 않거나, 두 이름이 `[thing, setThing]` 짝을 이루지 않으면 걸린다.

**왜**: `const [open, setVisible]` 처럼 짝이 어긋나면 세터가 어느 값을 바꾸는지 따라가야 한다. `const counter = useState(0)` 처럼 통째로 받으면 `counter[0]`·`counter[1]` 이 무엇인지 이름이 말하지 않는다.

**효과**: 세터 이름만 보고 어떤 상태를 바꾸는지 안다. 같은 상태를 다루는 코드를 이름으로 검색할 수 있다.

```ts
const [open, setVisible] = useState(false);   // ❌
const counter = useState(0);                  // ❌
const [isOpen, setIsOpen] = useState(false);  // ✅
```

## no-console

근거: 없음(운영 위생)

**잡는 것**: `console.warn`·`console.error` 가 아닌 `console.*` 호출이 걸린다.

**왜**: 디버깅용 `console.log` 가 운영 콘솔에 남으면 사용자 브라우저에서 내부 데이터(응답 본문, 식별자)가 그대로 보이고, 의도한 경고·오류 보고가 잡음에 묻힌다.

**효과**: 운영 콘솔에는 의도한 경고와 오류만 남는다. 민감한 데이터가 디버그 출력으로 새는 경로가 막힌다.

```ts
console.log(order);                  // ❌ 지운다
console.error("주문 조회 실패", err); // ✅
```

---

# 01 컴포넌트

## no-restricted-imports

근거: [habits/01 §3](../habits/01-component-design.md#3-compound-pattern--suspense), [habits/01 §6](../habits/01-component-design.md#6-단방향-흐름--useeffect)

**잡는 것**
- `react` 의 `useEffect`·`useLayoutEffect` import. `effectAllowedFiles` 에 적은 파일에서는 허용한다.
- `@tanstack/react-query` 의 `useQueries`·`useInfiniteQuery` import. `useSuspenseQueries`·`useSuspenseInfiniteQuery` 를 쓴다.

**왜**
- `useEffect` 로 "A 가 바뀌면 B state 를 맞춘다"는 동기화를 하면 한 프레임 늦게 반영되고, 상태가 두 벌이 되어 어긋난다. 다른 값에서 계산할 수 있는 건 렌더 중에 계산하고, 창 크기 같은 외부 값은 `useSyncExternalStore` 로 읽는다.
- suspense 가 아닌 조회는 컴포넌트마다 `isLoading`·`data?.` 처리를 퍼뜨린다.

**효과**: 상태 동기화 버그(깜빡임, 무한 렌더, 늦게 반영되는 값)가 생길 자리가 줄어든다. effect 가 꼭 필요한 코드는 `effectAllowedFiles` 한 곳에 모여 리뷰하기 쉽다. 조회 컴포넌트는 "데이터가 항상 있다"고 가정하고 성공 화면만 그린다.

```ts
import { useEffect } from "react";                         // ❌
import { useQueries } from "@tanstack/react-query";        // ❌ → useSuspenseQueries
const width = useSyncExternalStore(subscribeResize, getWidth); // ✅ 외부 값
```

`React.useEffect(…)` 로 import 를 우회하면 [eric/restricted-syntax 「React.useEffect 로 우회」](#reactuseeffect-로-우회) 가 잡는다.

## eric/no-thin-query-hook

근거: [habits/01 「조달은 팩토리로 노출하고, 둘 이상이면 병렬로 묶는다」](../habits/01-component-design.md#조달은-팩토리로-노출하고-둘-이상이면-병렬로-묶는다), [habits/03 「얕은 포장 금지」](../habits/03-composition.md#추상화는-실제-로직이-정당화할-때만-얕은-포장-금지)

**잡는 것**: `use*` 훅이 쿼리 하나를 부르고 그 결과(또는 결과의 필드 하나)를 돌려주는 것 말고는 아무것도 하지 않으면 걸린다.

**왜**: 이런 훅은 이름만 바꿔 한 겹 감쌀 뿐이다. 게다가 훅이 쿼리의 유일한 입구가 되면, 쿼리 여러 개를 `useSuspenseQueries` 로 한 번에 병렬로 불러야 할 때 묶을 수가 없어 워터폴이 굳는다.

**효과**: 쿼리 설정은 `orderQueries.detail(id)` 같은 팩토리 한 곳에 모이고, 쓰는 쪽이 필요하면 여러 팩토리를 병렬로 묶는다. 파일과 간접 레이어가 줄어든다.

```ts
const useOrders = () => useSuspenseQuery(orderQueries.list());   // ❌
const { data: orders } = useSuspenseQuery(orderQueries.list());   // ✅ 팩토리를 직접 쓴다
function useSelectableOrder(id: string) {                         // ✅ useState 와 조합하는 훅은 괜찮다
  const { data: order } = useSuspenseQuery(orderQueries.detail(id));
  const [isSelected, setIsSelected] = useState(false);
  return { order, isSelected, setIsSelected };
}
```

코드: `rules/no-thin-query-hook.mjs`

## eric/no-suspense-query-waterfall

근거: [habits/01 「조달은 팩토리로 노출하고, 둘 이상이면 병렬로 묶는다」](../habits/01-component-design.md#조달은-팩토리로-노출하고-둘-이상이면-병렬로-묶는다)

warn 이다. 의존이 이름에 드러나지 않는 경우가 있어서 막지 않고 알려만 준다.

**잡는 것**: 같은 블록에서 앞에 suspense 쿼리(`useSuspenseQuery`·`useSuspenseQueries`) 선언이 있는데, 그 결과를 쓰지 않는 `useSuspenseQuery` 선언.
앞 쿼리 결과를 담은 이름이나, 그 이름에서 파생한 선언(`const parentId = order.parentId`)을 인자에서 쓰면 의존 쿼리로 보고 넘어간다.

**왜**: suspense 쿼리는 데이터가 올 때까지 컴포넌트를 멈춘다. 연달아 적으면 첫 번째가 끝나야 두 번째가 시작되어(워터폴) 대기 시간이 합쳐진다.
앞 결과로 키를 만드는 의존 쿼리는 원래 순서대로 불러야 하므로 걸지 않는다.

**효과**: 서로 상관없는 쿼리를 `useSuspenseQueries` 로 묶으면 동시에 시작해서 가장 느린 쿼리 하나만큼만 기다린다.
의존 쿼리에는 경고가 나지 않아 경고가 곧 묶을 자리다.

```ts
const { data: order } = useSuspenseQuery(orderQueries.detail(id));
const { data: catalog } = useSuspenseQuery(productQueries.list());                // ⚠ order 를 안 쓰는데 order 가 끝난 뒤에야 시작
const [order, catalog] = useSuspenseQueries({ queries: [orderQueries.detail(id), productQueries.list()] });  // ✅
const { data: customer } = useSuspenseQuery(customerQueries.detail(order.customerId)); // ✅ 앞 결과가 있어야 키를 만든다
```

이름만 비교하고 스코프는 보지 않는다. 의존이 이름을 거치지 않는 경우(앞 쿼리가 채운 store 를 읽는 등)는 잘못 걸리니 리뷰에서 본다.

코드: `rules/no-suspense-query-waterfall.mjs`

## @tanstack/query/exhaustive-deps

근거: [habits/01 §3](../habits/01-component-design.md#3-compound-pattern--suspense)

**잡는 것**: `queryFn` 안에서 쓰는 바깥 값이 `queryKey` 에 없으면 걸린다.

**왜**: TanStack Query 는 `queryKey` 로 캐시를 찾는다. `queryFn` 이 `orderId` 를 쓰는데 키에 없으면, `orderId` 가 바뀌어도 같은 키라서 이전 주문의 결과를 캐시에서 돌려준다.

**효과**: 다른 조건의 데이터가 화면에 나오는 캐시 버그가 컴파일 전에 잡힌다.

```ts
queryOptions({ queryKey: ["order"], queryFn: () => getOrder(orderId) });           // ❌
queryOptions({ queryKey: ["order", orderId], queryFn: () => getOrder(orderId) });  // ✅
```

## @tanstack/query/prefer-query-options

근거: [habits/01 「조달은 팩토리로 노출하고, 둘 이상이면 병렬로 묶는다」](../habits/01-component-design.md#조달은-팩토리로-노출하고-둘-이상이면-병렬로-묶는다)

**잡는 것**
- `useSuspenseQuery({ queryKey, queryFn })` 처럼 쿼리 옵션을 호출하는 자리에 직접 쓰면 걸린다.
- `invalidateQueries({ queryKey: ["orders", id] })` 처럼 쿼리 키를 손으로 다시 쓰면 걸린다.

**왜**: 키와 `queryFn` 이 호출하는 곳마다 흩어지면 같은 쿼리의 키가 조금씩 달라지고, 무효화할 때 손으로 쓴 키가 실제 키와 어긋나 캐시가 갱신되지 않는다.

**효과**: 쿼리의 키·조회 함수·캐시 정책이 `queryOptions` 팩토리 한 곳에 모인다. 무효화는 `orderQueries.detail(id).queryKey` 를 참조해서, 키 모양이 바뀌어도 함께 따라간다.

```ts
useSuspenseQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });  // ❌
useSuspenseQuery(orderQueries.detail(id));                                  // ✅
queryClient.invalidateQueries({ queryKey: orderQueries.detail(id).queryKey }); // ✅
```

## @tanstack/query/no-rest-destructuring

근거: [habits/01 §3](../habits/01-component-design.md#3-compound-pattern--suspense)

**잡는 것**: 쿼리 결과를 `const { data, ...rest } = useSuspenseQuery(…)` 처럼 rest 로 구조 분해하면 걸린다.

**왜**: TanStack Query 는 컴포넌트가 실제로 읽은 필드만 추적해서 그 필드가 바뀔 때만 다시 렌더한다. rest 로 펼치면 모든 필드를 읽은 것으로 보아 `isFetching` 같은 필드가 바뀔 때마다 리렌더된다.

**효과**: 백그라운드 재조회 때마다 생기는 불필요한 리렌더가 사라진다.

```ts
const { data: order, ...orderQuery } = useSuspenseQuery(orderQueries.detail(id));  // ❌
const { data: order, isFetching } = useSuspenseQuery(orderQueries.detail(id));     // ✅
```

## @tanstack/query/stable-query-client

근거: [habits/01 §3](../habits/01-component-design.md#3-compound-pattern--suspense)

**잡는 것**: 컴포넌트 안에서 `new QueryClient()` 를 렌더마다 만들면 걸린다.

**왜**: `QueryClient` 는 캐시 그 자체다. 렌더마다 새로 만들면 렌더할 때마다 캐시가 비어 모든 쿼리를 다시 부른다.

**효과**: 캐시가 앱이 살아 있는 동안 유지되고, 같은 데이터를 반복 조회하지 않는다.

```tsx
function App() { const queryClient = new QueryClient(); … }        // ❌
const queryClient = new QueryClient();                             // ✅ 모듈 최상위
function App() { const [queryClient] = useState(() => new QueryClient()); … }  // ✅
```

## @tanstack/query/no-unstable-deps

근거: [habits/01 §3](../habits/01-component-design.md#3-compound-pattern--suspense)

**잡는 것**: `useMutation`·`useQuery` 등의 결과 객체를 통째로 `useCallback`·`useMemo`·`useEffect` 의 deps 에 넣으면 걸린다.

**왜**: 쿼리 훅의 결과 객체는 렌더마다 새 참조다. 통째로 deps 에 넣으면 매 렌더 바뀐 것으로 보아 메모가 아무 효과가 없다.

**효과**: `mutate`·`data` 처럼 안정된 필드만 deps 에 들어가 메모와 콜백이 의도대로 유지된다.

```ts
const mutation = useMutation(…);
useCallback(() => mutation.mutate(), [mutation]);   // ❌
const { mutate } = useMutation(…);
useCallback(() => mutate(), [mutate]);              // ✅
```

## @tanstack/query/infinite-query-property-order

근거: [habits/01 §3](../habits/01-component-design.md#3-compound-pattern--suspense)

**잡는 것**: infinite query 옵션을 `queryFn` → `getPreviousPageParam` → `getNextPageParam` 순서로 쓰지 않으면 걸린다.

**왜**: TypeScript 는 객체 속성을 위에서부터 추론한다. `getNextPageParam` 이 `queryFn` 보다 앞에 있으면 페이지 타입을 아직 모르는 상태에서 추론해 `unknown` 이 된다.

**효과**: 페이지 파라미터와 페이지 데이터의 타입이 제대로 추론되어 타입 단언이 필요 없다.

```ts
infiniteQueryOptions({ queryKey, getNextPageParam, queryFn, initialPageParam: 0 });  // ❌
infiniteQueryOptions({ queryKey, queryFn, initialPageParam: 0, getNextPageParam });  // ✅
```

## @tanstack/query/mutation-property-order

근거: [habits/01 §3](../habits/01-component-design.md#3-compound-pattern--suspense)

**잡는 것**: mutation 옵션을 `onMutate` → `onError` → `onSettled` 순서로 쓰지 않으면 걸린다.

**왜**: `onError`·`onSettled` 가 받는 `context` 의 타입은 `onMutate` 의 반환값에서 추론된다. 순서가 바뀌면 `context` 가 `unknown` 이 된다.

**효과**: 낙관적 업데이트의 롤백 값(`context.previous`)을 타입 단언 없이 쓴다.

```ts
useMutation({ mutationFn, onError: (_, __, context) => …, onMutate: () => ({ previous }) });  // ❌
useMutation({ mutationFn, onMutate: () => ({ previous }), onError: (_, __, context) => … });  // ✅
```

## typescript/consistent-type-definitions

근거: [habits/01 §7](../habits/01-component-design.md#7-props--태그드-유니온--주석)

**잡는 것**: `type Props = { … }` 처럼 객체 모양의 타입을 `type` 으로 선언하면 걸린다.

**왜**: 같은 일을 하는 선언 방식이 두 가지면 파일마다 섞인다. `interface` 는 확장(`extends`)이 명시적이고, 타입 에러 메시지에 이름이 그대로 남는다.

**효과**: 객체 타입은 `interface`, 유니온·조합 타입은 `type` 으로 갈려서, 선언 키워드만 보고 "모양인가, 선택지인가"를 안다.

```ts
type OrderShape = { id: string };                            // ❌
interface OrderShape { id: string }                          // ✅
type ViewState = { type: "a" } | { type: "b" };              // ✅ 유니온은 type
```

## eric/props-inline-type-single-line

근거: [habits/01 §7](../habits/01-component-design.md#7-props--태그드-유니온--주석)

**잡는 것**: 컴포넌트 파라미터에 직접 적은 props 타입이 여러 줄로 넘어가면 걸린다. `VariantForm.error = (…) => …` 처럼 컴포넌트에 붙이는 함수도 본다.

**왜**: 짧은 타입은 그 자리에 있는 게 읽기 편하지만, 길어지면 시그니처가 화면을 차지하고 같은 props 를 다른 곳에서 재사용할 수 없다.

**효과**: 여러 줄짜리 props 는 `XxxProps` 이름을 얻어 검색과 재사용이 되고, 컴포넌트 선언부가 한눈에 들어온다.

```tsx
function Badge({ label }: { label: string }) {}   // ✅
function Header({ title, onClose }: {             // ❌ → HeaderProps
  title: string;
  onClose: () => void;
}) {}
```

코드: `rules/props-inline-type-single-line.mjs`

## no-warning-comments

근거: [habits/01 §7](../habits/01-component-design.md#7-props--태그드-유니온--주석)

**잡는 것**: 주석에 `기존엔`·`기존에는`·`원래는`·`예전엔` 이 들어 있으면 걸린다.

**왜**: "기존엔 이렇게 했는데 바꿨다"는 PR 본문에 쓸 내용이다. 나중에 읽는 사람에게 "기존 코드"는 존재하지 않으므로, 이런 주석은 비교 대상 없는 설명으로 남는다.

**효과**: 주석에는 코드로 안 보이는 제약만 남고, 변경 이유는 PR 과 커밋 이력에서 찾는다. 단어로만 찾으므로 일부만 잡히고 나머지는 리뷰에서 본다.

```ts
// 기존엔 여기서 직접 계산했다   ❌
```

## react/function-component-definition

근거: [habits/01](../habits/01-component-design.md)

**잡는 것**: 이름 있는 컴포넌트를 화살표 함수로 선언하면 걸린다. 반대로 이름 없는 컴포넌트(render prop 등)를 `function` 표현식으로 쓰면 걸린다.

**왜**: 컴포넌트 선언 방식이 섞이면 파일마다 모양이 달라진다. `function` 선언은 호이스팅되어 진입점 컴포넌트를 파일 위에, 쓰이는 조각을 아래에 둘 수 있다.

**효과**: 모든 컴포넌트가 같은 모양이라 파일을 훑을 때 컴포넌트가 바로 보이고, "위에서 아래로 흐르는" 배치(habits/01 §4)가 가능하다.

```tsx
const OrderBadge = ({ id }: OrderBadgeProps) => <span>{id}</span>;   // ❌
function OrderBadge({ id }: OrderBadgeProps) { return <span>{id}</span>; }  // ✅
```

## react/no-object-type-as-default-prop

근거: [habits/01](../habits/01-component-design.md)

**잡는 것**: props 기본값에 배열·객체 리터럴, 함수, JSX 요소를 쓰면 걸린다(`filters = []`, `onSelect = () => {}`).

**왜**: 기본값은 렌더마다 새로 만들어진다. 그 값이 `useMemo`·`useEffect` deps 나 `memo` 컴포넌트 props 로 가면 매번 바뀐 것으로 보아 메모가 깨진다.

**효과**: 기본값이 모듈 최상위 상수 하나로 고정되어 참조가 안정된다.

```tsx
function OrderList({ filters = [] }: OrderListProps) {}   // ❌
const NO_FILTERS: string[] = [];
function OrderList({ filters = NO_FILTERS }: OrderListProps) {}  // ✅
```

## react/jsx-no-constructed-context-values

근거: [habits/01](../habits/01-component-design.md)

**잡는 것**: `<Context.Provider value={{ orderId }}>` 처럼 Provider 의 `value` 를 렌더 중에 새 객체·배열·함수로 만들면 걸린다.

**왜**: Provider 가 렌더될 때마다 `value` 가 새 참조가 되어, 그 context 를 쓰는 모든 컴포넌트가 값이 같아도 다시 렌더된다.

**효과**: context 소비처는 값이 실제로 바뀔 때만 다시 렌더된다.

```tsx
<OrderContext.Provider value={{ orderId }}>   // ❌
<OrderContext.Provider value={orderId}>       // ✅ 값 하나면 그대로 넘긴다
```

## max-depth

근거: [habits/01 §2](../habits/01-component-design.md#2-분기는-상위로-끌어올리기-시점이동)

**잡는 것**: `if`·`for` 등의 블록이 3단을 넘게 중첩되면 걸린다.

**왜**: 중첩이 깊으면 지금 줄이 어떤 조건들 아래에 있는지 머리에 쌓아 두고 읽어야 한다. 대개 분기를 위에서 미리 정리하지 않았거나 함수 하나가 여러 일을 한다는 신호다.

**효과**: 조기 반환으로 펴면 조건 하나에 처리 하나가 한 줄씩 읽힌다. 분기를 상위로 올리면 하위 코드는 자기 케이스만 다룬다.

```ts
if (a) { if (b) { if (c) { if (d) { … } } } }   // ❌
if (!a || !b) return;                           // ✅ 조기 반환으로 편다
```

## max-params

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

**잡는 것**: 파라미터가 5개 이상인 함수가 걸린다.

**왜**: 인자가 많으면 호출하는 쪽에서 순서를 틀리기 쉽고(같은 타입이 나란하면 컴파일러도 못 잡는다), 대개 함수가 너무 많은 것을 알거나 설정과 런타임 인자가 섞여 있다는 신호다.

**효과**: 관련 인자를 객체 하나로 묶으면 호출부에 이름이 붙어 읽힌다. 설정과 런타임 인자를 커링으로 나누면 설정은 한 번만 넘긴다.

```ts
createOrderLine(order, product, quantity, price, discount);          // ❌
createOrderLine({ order, product, quantity, price, discount });      // ✅
```

## unicorn/no-negated-condition

근거: [habits/01 §2](../habits/01-component-design.md#2-분기는-상위로-끌어올리기-시점이동)

**잡는 것**: `if (!x) … else …`, `x !== y ? a : b` 처럼 부정 조건으로 시작하는 양갈래 분기가 걸린다. `else` 가 없는 `if (!x) return` 은 괜찮다.

**왜**: 부정 조건의 `else` 는 "아니지 않으면"이라 한 번 더 뒤집어 읽어야 한다.

**효과**: 조건을 뒤집고 두 분기를 바꾸면 긍정 조건으로 바로 읽힌다.

```ts
const label = !open ? "닫힘" : "열림";   // ❌
const label = open ? "열림" : "닫힘";    // ✅
```

## unicorn/consistent-function-scoping

근거: [habits/01](../habits/01-component-design.md), [habits/04 「도메인 룰 = 이름 붙은 순수함수」](../habits/04-functional-domain.md#도메인-룰--이름-붙은-순수함수)

**잡는 것**: 바깥 함수의 변수를 하나도 쓰지 않는데 함수 안에 선언한 함수가 걸린다.

**왜**: 컴포넌트 안에 선언한 함수는 렌더마다 새로 만들어진다. 바깥 값을 쓰지 않는 함수라면 그 자리에 있을 이유가 없고, 안에 있으면 컴포넌트 상태에 기대는 함수처럼 보인다.

**효과**: 모듈 최상위로 빼면 순수함수라는 사실이 위치로 드러나고, 따로 테스트할 수 있고, 렌더마다 다시 만들지 않는다.

```tsx
function OrderTable() {
  const toOrderLabel = (order: Order) => `#${order.id}`;   // ❌ 바깥 값을 안 쓴다
}
const toOrderLabel = (order: Order): string => `#${order.id}`;  // ✅ 모듈 최상위
```

---

# 02 구조

## no-use-before-define

근거: [habits/02 「응집 · 선언 = 의존성 순서」](../habits/02-structure-cohesion.md#응집--선언--의존성-순서)

**잡는 것**: 파일 최상위에서 아직 선언되지 않은 상수를 쓰거나, 타입을 선언보다 먼저 쓰면 걸린다.

**왜**: `const` 는 선언된 줄보다 먼저 쓰면 실행 중에 에러가 난다(TDZ). 모듈을 읽는 순간 실행되는 최상위 코드는 순서가 곧 정확성이다.

**효과**: 모듈 로드 시점의 `ReferenceError` 가 lint 단계에서 잡힌다. 쓰이는 것이 쓰는 것보다 위에 있어 의존 방향이 위에서 아래로 읽힌다.

```ts
export const earlyRate = LATE_RATE * 2;   // ❌
const LATE_RATE = 3;
```

**괜찮은 경우**: 함수 몸통 안에서 파일 아래쪽 상수를 쓰는 것(호출될 때는 이미 선언돼 있다), `function` 선언(호이스팅된다).

---

# 03 조합

## react/no-unstable-nested-components

근거: [habits/03 「조합 우선」](../habits/03-composition.md#조합-우선-compound--render-props--명시적-슬롯--prop-드릴링)

**잡는 것**: 컴포넌트 안에서 다른 컴포넌트를 선언하면 걸린다. `ErrorBoundary` 의 `fallback` 처럼 prop 으로 넘기는 render prop 은 허용한다.

**왜**: 안쪽 컴포넌트는 렌더마다 새 함수라서 React 는 매번 다른 컴포넌트로 본다. 그래서 렌더마다 언마운트·마운트되어 상태가 사라지고 입력 포커스가 풀린다.

**효과**: 상태와 포커스가 유지되고, 필요 없는 마운트 비용이 없어진다. 데이터를 props 로 받게 되면서 컴포넌트의 입력이 시그니처에 드러난다.

```tsx
function OrderTable() {
  const OrderCell = () => <td />;   // ❌
  return <OrderCell />;
}
function OrderCell(): ReactNode { return <td />; }   // ✅ 모듈 최상위
```

## react/no-clone-element

근거: [habits/03 「조합 우선」](../habits/03-composition.md#조합-우선-compound--render-props--명시적-슬롯--prop-드릴링)

**잡는 것**: `cloneElement` 호출이 걸린다.

**왜**: 부모가 받은 children 을 복제해 props 를 몰래 끼워 넣으면, children 을 쓰는 쪽의 JSX 만 봐서는 실제로 어떤 props 가 들어가는지 보이지 않는다.

**효과**: 필요한 값을 슬롯 prop 이나 컴파운드 컴포넌트(context)로 넘기면, 화면 구조와 데이터 흐름이 JSX 에 그대로 드러난다.

```tsx
cloneElement(child, { selected: true });                  // ❌
<Tabs.Item selected={selected}>…</Tabs.Item>               // ✅
```

## react/no-react-children

근거: [habits/03 「조합 우선」](../habits/03-composition.md#조합-우선-compound--render-props--명시적-슬롯--prop-드릴링)

**잡는 것**: `Children.map`·`Children.count` 등 `React.Children` API 가 걸린다.

**왜**: children 을 세거나 뜯어 보는 코드는 children 이 특정 모양이라고 가정한다. Fragment 로 감싸거나 조건부 렌더만 해도 개수와 모양이 바뀌어 조용히 깨진다.

**효과**: 슬롯 prop 이나 컴파운드로 바꾸면 컴포넌트가 children 의 내부 모양에 기대지 않는다.

```tsx
Children.map(children, (child) => …);   // ❌
<List items={orders} renderItem={(order) => <OrderRow order={order} />} />  // ✅
```

---

# 04 함수형

## no-param-reassign

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

**잡는 것**: 받은 파라미터에 다시 값을 넣거나(`order = …`), 파라미터 객체의 속성을 바꾸면(`draft.total = 0`) 걸린다.

**왜**: 파라미터 객체의 속성을 바꾸면 호출한 쪽의 객체가 몰래 바뀐다. 파라미터에 재할당하면 같은 이름이 함수 중간부터 다른 값을 가리킨다.

**효과**: 함수가 입력을 바꾸지 않는다는 것이 보장되어, 호출한 뒤에도 넘긴 값을 믿고 쓸 수 있다.

```ts
function applyDiscount(order: Order) { order.total = 0; }                      // ❌
function applyDiscount(order: Order): Order { return { ...order, total: 0 }; }  // ✅
```

## no-nested-ternary

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

**잡는 것**: `a ? x : b ? y : z` 처럼 삼항 안에 삼항이 있으면 걸린다.

**왜**: 조건이 늘수록 어느 조건이 어느 값으로 가는지 읽기 어렵다.

**효과**: 조기 반환으로 펴면 조건 하나에 값 하나가 한 줄씩 대응한다.

```ts
const tier = score > 90 ? "gold" : score > 70 ? "silver" : "bronze";   // ❌
function calculateTier(score: number): Tier {                          // ✅
  if (score > 90) return "gold";
  if (score > 70) return "silver";
  return "bronze";
}
```

## eric/explicit-return-type

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

**잡는 것**: `export function`, `export const x = () =>`, `export default function` 에 리턴 타입이 없으면 걸린다. 컴포넌트는 제외한다.

**왜**: 바깥에 공개하는 함수는 시그니처가 약속이다. 리턴 타입이 추론에 맡겨져 있으면 몸통을 고칠 때 공개 타입이 조용히 바뀐다.

**효과**: 몸통이 바뀌어 반환 타입이 달라지면 그 함수에서 바로 에러가 난다. 리턴 타입이 적혀 있어야 [eric/verb-return-contract](#ericverb-return-contract) 가 이름의 약속을 검사할 수 있다.

```ts
export function toOrderLabel(order: Order) { … }           // ❌
export function toOrderLabel(order: Order): string { … }   // ✅
```

코드: `rules/explicit-return-type.mjs`

## typescript/consistent-indexed-object-style

근거: [habits/04 「판정은 함수, Record 는 매핑」](../habits/04-functional-domain.md#판정은-함수-record-는-매핑--규칙을-데이터로-박아두지-마라)

**잡는 것**: `{ [key: string]: V }` 인덱스 시그니처가 걸린다.

**왜**: 같은 뜻을 두 문법으로 쓰면 섞인다. `Record<K, V>` 는 키를 유니온으로 좁히기 쉬워서, 유한한 키 매핑을 표현하는 기본형이다.

**효과**: `Record<Status, string>` 처럼 키를 유니온으로 두면 케이스가 빠졌을 때 컴파일러가 잡는다.

```ts
interface Labels { [key: string]: string }        // ❌
type Labels = Record<Status, string>;             // ✅
```

## typescript/no-dynamic-delete

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

**잡는 것**: `delete obj[key]` 처럼 계산된 키로 속성을 지우면 걸린다.

**왜**: 원본 객체를 바꾸고, 키가 런타임에 정해져서 어떤 속성이 사라지는지 타입이 추적하지 못한다.

**효과**: rest 구조 분해로 그 키를 뺀 새 객체를 만들면 원본이 그대로 남고 결과 타입이 정확하다. 키가 정말 동적이면 `Map` 으로 표현이 정직해진다.

```ts
delete filters[key];                                  // ❌
const { [key]: _removed, ...restFilters } = filters;  // ✅
```

## unicorn/no-array-for-each

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

**잡는 것**: `Array#forEach` 호출이 걸린다.

**왜**: `forEach` 는 값을 돌려주지 않으므로 바깥 변수를 바꾸는 데 쓰인다. `await` 를 기다리지 않고, 중간에 멈출 수도 없다.

**효과**: 값을 만들면 `map`·`filter`·`reduce` 로 "무엇을 만드는지"가 드러나고, 순차 부수효과만 있으면 `for…of` 로 `await`·`break` 가 제대로 동작한다.

```ts
let total = 0; items.forEach((item) => { total += item.price; });   // ❌
const total = items.reduce((sum, item) => sum + item.price, 0);      // ✅
```

## oxc/no-accumulating-spread

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

**잡는 것**: `reduce` 안에서 누적값을 매번 펼치면(`{ ...acc, [k]: v }`, `[...acc, x]`) 걸린다.

**왜**: 펼치기는 누적값 전체를 복사한다. 원소마다 복사하므로 원소 n 개면 O(n²) 이 되어, 수천 개부터 눈에 띄게 느려진다.

**효과**: `Object.fromEntries`, `Map.groupBy`, `flatMap` 처럼 한 번에 만드는 API 로 바꾸면 O(n) 이 되고 의도도 이름으로 드러난다.

```ts
orders.reduce((acc, order) => ({ ...acc, [order.id]: order }), {});   // ❌
Object.fromEntries(orders.map((order) => [order.id, order]));        // ✅
```

## unicorn/no-array-sort

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

**잡는 것**: `Array#sort()` 가 걸린다.

**왜**: `sort()` 는 원본 배열을 바꾼다. props 나 쿼리 캐시에서 받은 배열을 정렬하면 다른 컴포넌트가 보는 데이터까지 순서가 바뀐다.

**효과**: `toSorted()` 는 새 배열을 돌려주므로 원본이 그대로이고, 정렬 결과에 이름을 붙여 쓸 수 있다.

```ts
orders.sort(compareOrdersByDate);                         // ❌
const sortedOrders = orders.toSorted(compareOrdersByDate); // ✅
```

## unicorn/no-array-reverse

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

**잡는 것**: `Array#reverse()` 가 걸린다.

**왜**: [unicorn/no-array-sort](#unicornno-array-sort) 와 같다. `reverse()` 는 원본 배열을 뒤집는다.

**효과**: `toReversed()` 로 원본을 지킨다.

```ts
steps.reverse();                          // ❌
const latestFirst = steps.toReversed();   // ✅
```

---

# 05 타입

## typescript/consistent-type-assertions

근거: [habits/05 「타입 일관성」](../habits/05-types.md#타입-일관성)

**잡는 것**: `x as Order`, `x as unknown as Order` 를 막는다. `as const` 는 허용한다.

**왜**: `as` 는 "내가 맞다고 보장할게"라며 타입 검사를 끈다. 틀려도 컴파일러가 못 잡고, 런타임에 `undefined` 접근으로 터진다.

**효과**: 값의 타입이 실제 데이터에서 나온다. 타입이 안 맞으면 단언으로 덮는 대신 경계(API 매퍼, 타입 가드)를 고치게 된다.

```ts
const order = response as Order;                   // ❌
const order: Order = toOrder(response);            // ✅ 경계에서 변환
const config = { retries: 3 } satisfies Config;    // ✅
```

테스트에서는 mock 에 `vi.mocked(x)`, 일부 필드만 있는 데이터에 기본값을 채우는 팩토리 함수를 쓴다.

## typescript/no-non-null-assertion

근거: [habits/05 「타입 일관성」](../habits/05-types.md#타입-일관성)

**잡는 것**: `order!.total` 처럼 "절대 null 이 아니다"라고 단언하는 `!` 를 막는다.

**왜**: `as` 와 같다. 가정이 깨지는 리팩터(Suspense 경계 밖으로 옮기기 등)를 컴파일러가 잡지 못한다.

**효과**: 값이 반드시 있다는 사실을 코드 구조가 보장한다(Suspense 안의 `useSuspenseQuery`, 경계 매퍼의 필수 필드). 그 구조가 깨지면 컴파일 에러가 난다.

```ts
const total = order!.total;                                              // ❌
const { data: order } = useSuspenseQuery(orderQueries.detail(id));       // ✅ 경계 안: 항상 존재
```

## typescript/no-explicit-any

근거: [habits/05 「타입 일관성」](../habits/05-types.md#타입-일관성)

**잡는 것**: `any` 타입을 막는다.

**왜**: `any` 는 그 값에서 시작하는 모든 타입 검사를 끄고, 다른 값으로 전염된다.

**효과**: 모르는 값은 `unknown` 으로 받아 좁힐 때까지 쓰지 못하게 되어, 잘못된 접근이 컴파일 단계에서 잡힌다.

```ts
function toOrder(response: any) {}       // ❌
function toOrder(response: unknown) {}   // ✅ 검사하고 좁힌다
```

## typescript/ban-ts-comment

근거: [habits/05 「타입 일관성」](../habits/05-types.md#타입-일관성)

**잡는 것**: `@ts-ignore`·`@ts-expect-error`·`@ts-nocheck` 주석을 막는다. 테스트 파일에서는 설명이 붙은 `@ts-expect-error` 만 허용한다.

**왜**: 억제 주석은 그 줄의 타입 에러를 덮는다. 사유가 그럴듯해도 타입이 그 사실을 표현하지 못한다는 뜻이고, 다음 사람은 그 가정을 검증할 수 없다.

**효과**: 타입 에러는 덮이지 않고 고쳐진다. 테스트에서 "잘못된 타입이 거부되는가"를 확인할 때만 `@ts-expect-error` 가 단언 역할을 하고, 설명이 왜 틀린지 남긴다.

```ts
// @ts-ignore                                  ❌
// @ts-expect-error 숫자 id 는 거부돼야 한다     ✅ 테스트 파일에서만
```

## unicorn/no-abusive-eslint-disable

근거: [habits/05 「타입 일관성」](../habits/05-types.md#타입-일관성)

**잡는 것**: 규칙 이름 없이 통째로 끄는 `/* eslint-disable */`·`/* oxlint-disable */` 블록이 걸린다. 규칙 이름 없는 한 줄 억제(`// oxlint-disable-next-line`)는 놓친다.

**왜**: 규칙을 통째로 끄면 의도한 규칙 말고 다른 규칙의 위반까지 함께 숨는다.

**효과**: 억제하더라도 무엇을 끄는지 드러나서 리뷰에서 그 사유를 따질 수 있다.

```ts
/* eslint-disable */                                   // ❌
// oxlint-disable-next-line no-console -- 사유        // △ 규칙을 적되, 되도록 코드를 고친다
```

---

# 셀렉터 규칙

oxlint 에는 ESLint 의 `no-restricted-syntax` 가 없어서, 같은 일을 하는 규칙을 직접 만들어 두 이름으로 등록했다. `eric/restricted-syntax` 는 error, `eric/discouraged-syntax` 는 warn 이다. 어떤 모양을 막을지는 `index.mjs` 의 `RESTRICTED_SYNTAX`·`DISCOURAGED_SYNTAX` 목록에 있다.

## eric/restricted-syntax

막는 코드 모양마다 아래 하위 섹션이 하나씩 있다.

### 명시적 루프

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

메시지: `명시적 루프 금지 → map/filter/reduce, 순회가 꼭 필요하면 for...of (habits/04)`

**잡는 것**: `for`·`for…in`·`while`·`do…while`.

**왜**: 인덱스 루프는 경계 실수(off-by-one)가 생기고, 대개 바깥 변수를 바꾸며 결과를 쌓는다. `for…in` 은 프로토타입 키까지 돈다.

**효과**: `map`·`filter`·`reduce` 로 쓰면 "무엇을 만드는지"가 이름으로 드러나고 값을 바꾸지 않는다. 순차 `await`·조기 `break` 가 필요한 순회만 `for…of` 로 남는다.

```ts
for (let i = 0; i < orders.length; i++) { … }   // ❌
const orderIds = orders.map((order) => order.id); // ✅
```

### for...of 로 쌓기

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

메시지: `for...of 로 컬렉션에 값을 쌓지 않는다 → map/filter/reduce, Object.groupBy, new Map(entries) (habits/04)`

**잡는 것**: `for…of` 본문에서 `push`·`unshift`·`set`·`add` 로 컬렉션에 값을 쌓는 코드.

**왜**: `for…of` 를 허용한 이유는 순차 `await`·조기 반환이지 누산이 아니다. 쌓는 코드는 루프 금지를 `for…of` 로 우회한 것과 같다.

**효과**: 결과 컬렉션이 한 표현식(`map`, `Object.groupBy`, `new Map(entries)`)으로 만들어져, 중간 상태 없이 완성된 값만 존재한다.

```ts
const ids = []; for (const order of orders) ids.push(order.id);   // ❌
const ids = orders.map((order) => order.id);                      // ✅
```

**한계**: 셀렉터는 스코프를 모르므로 루프 안에서 만든 지역 객체(`url.searchParams.set`)의 변경도 걸린다. 그런 자리는 규칙 이름을 적은 억제 주석을 달고 리뷰에서 본다.

### let

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

메시지: `재할당 대신 섀도잉·새 값 반환 (habits/04)`

**잡는 것**: `let` 선언.

**왜**: 값을 나중에 바꾸면 어느 시점에 무슨 값인지 따라가야 한다.

**효과**: 모든 이름이 선언한 순간의 값 하나만 가리켜, 코드를 어느 줄부터 읽어도 그 값이 맞다. 새 값이 필요하면 새 `const` 나 함수 반환으로 만든다.

```ts
let total = 0; total += fee;            // ❌
const totalWithFee = total + fee;       // ✅
```

테스트의 `beforeEach` 로 채우던 `let` 은 `setup()` 함수로, 나중에 resolve 할 Promise 는 `Promise.withResolvers()` 로 바꾼다.

### 팩토리 펼친 뒤 옵션 덧붙이기

근거: [habits/01 「조달은 팩토리로 노출하고, 둘 이상이면 병렬로 묶는다」](../habits/01-component-design.md#조달은-팩토리로-노출하고-둘-이상이면-병렬로-묶는다)

메시지: `팩토리를 펼친 뒤 옵션을 덧붙이지 않는다 — 신선도 정책도 xxxQueries.detail() 팩토리에 둔다 (habits/01 §3)`

**잡는 것**: `useSuspenseQuery({ ...orderQueries.detail(id), staleTime: 0 })` 처럼 팩토리를 펼치고 옵션을 덧붙이는 코드. `useSuspenseQueries` 의 `queries` 안도 본다.

**왜**: 같은 쿼리인데 호출하는 곳마다 신선도 정책이 달라지면, 어느 화면이 언제 다시 조회하는지 팩토리만 봐서는 알 수 없다.

**효과**: 쿼리의 정책이 팩토리 이름(`orderQueries.detailFresh(id)`)으로 드러나고 한 곳에서 바뀐다.

```ts
useSuspenseQuery({ ...orderQueries.detail(id), staleTime: 0 });   // ❌
useSuspenseQuery(orderQueries.detailFresh(id));                   // ✅
```

### 조건 없는 useQuery

근거: [habits/01 §3](../habits/01-component-design.md#3-compound-pattern--suspense)

메시지: `useQuery 는 조건부 조회(enabled·skipToken)가 필요할 때만 쓴다 — 그 외에는 useSuspenseQuery (habits/01 §3)`

**잡는 것**: 호출하는 자리에 `enabled` 도 `skipToken` 도 없는 `useQuery(…)`.

**왜**: `useQuery` 는 로딩·에러를 컴포넌트가 직접 처리하게 해서 `isLoading`·`data?.` 분기가 번진다. suspense 쿼리는 끌 수 없으니 조건부 조회만 `useQuery` 가 필요하다.

**효과**: 조회 컴포넌트는 성공 화면만 그리고, 로딩·에러는 바깥 `Suspense`·`ErrorBoundary` 가 맡는다.

```ts
const { data } = useQuery(orderQueries.detail(id));                                       // ❌
const { data: order } = useSuspenseQuery(orderQueries.detail(id));                        // ✅
const { data: orders } = useQuery({ ...orderQueries.search(keyword), enabled: keyword !== "" });  // ✅ 조건부
```

**한계**: 조건이 호출 자리에 보여야 통과한다. 팩토리 안에 `enabled` 를 넣으면 lint 가 모른다.

### parse·validate 안의 throw

근거: [habits/04 「함수형 원칙」](../habits/04-functional-domain.md#함수형-원칙)

메시지: `parse*/validate* 는 throw 대신 Result 로 실패를 반환한다 (habits/04)`

**잡는 것**: 이름이 `parse`·`validate` 로 시작하는 함수 안의 `throw`.

**왜**: 입력이 잘못될 수 있다는 건 예상 가능한 실패다. `throw` 는 시그니처에 드러나지 않아 호출하는 쪽이 처리를 잊는다.

**효과**: 실패가 반환 타입(`Result`, `T | null`)에 드러나서 호출하는 쪽이 반드시 처리한다.

```ts
function parsePort(s: string): number { if (…) throw new Error(); }   // ❌
function parsePort(s: string): Result<number, "NaN"> { … }            // ✅
```

### React.useEffect 로 우회

근거: [habits/01 §6](../habits/01-component-design.md#6-단방향-흐름--useeffect)

메시지: `effect 는 최후 수단 — 파생은 렌더 중, 외부 값은 useSyncExternalStore. 허용 위치는 config 의 effectAllowedFiles 에만 (habits/01 §6)`

**잡는 것**: import 없이 `React.useEffect(…)`·`React.useLayoutEffect(…)` 로 부르는 코드. `effectAllowedFiles` 에서는 허용한다.

**왜·효과**: [no-restricted-imports](#no-restricted-imports) 의 effect 금지와 같다. import 금지의 빈틈을 막는다.

```ts
React.useEffect(() => { … }, []);   // ❌
```

### 제품 코드의 data-testid

근거: [habits/06](../habits/06-testing.md)

메시지: `data-testid 결합 대신 role/접근성 쿼리로 찾는다 (habits/06)`

**잡는 것**: 테스트가 아닌 파일의 JSX 에 있는 `data-testid` 속성.

**왜**: 테스트가 테스트 전용 id 로 요소를 찾으면, 버튼 이름이 사라지거나 역할이 바뀌어 화면이 깨져도 테스트는 통과한다.

**효과**: 테스트가 사용자와 같은 방식(역할, 이름)으로 요소를 찾아서 접근성까지 함께 검증되고, 제품 마크업에 테스트용 속성이 남지 않는다.

```tsx
<button data-testid="save-button">저장</button>   // ❌
<button>저장</button>                             // ✅ getByRole("button", { name: "저장" })
```

### 테스트의 *ByTestId

근거: [habits/06](../habits/06-testing.md)

메시지: `*ByTestId 대신 role/접근성 쿼리 + within 스코프 (habits/06)`

**잡는 것**: 테스트 파일의 `getByTestId`·`queryByTestId`·`findByTestId` 계열.

**왜·효과**: [제품 코드의 data-testid](#제품-코드의-data-testid) 와 같다. 범위를 좁혀야 하면 `within(행)` 으로 스코프를 잡는다.

```ts
screen.getByTestId("order-panel");                                     // ❌
within(screen.getByRole("region", { name: "주문" })).getByRole("button"); // ✅
```

## eric/discouraged-syntax

warn 이다. 정당한 경우가 섞여 있어서 막지 않고 알려만 준다.

### show·hide boolean prop

근거: [habits/03 「조합 우선」](../habits/03-composition.md#조합-우선-compound--render-props--명시적-슬롯--prop-드릴링)

메시지: `show*/hide* boolean prop 대신 슬롯으로 화면을 JSX 에 드러낸다 (habits/03)`

**잡는 것**: JSX 의 `showSearch`·`hideAvatar` 같은 prop.

**왜**: "보여줄까 말까"를 boolean 으로 조종하면 화면에 무엇이 나오는지가 컴포넌트 안에 숨고, 옵션이 늘 때마다 prop 이 번식한다.

**효과**: 보여줄 조각 자체를 슬롯으로 넘기면 JSX 만 봐도 화면 구조가 보이고, 컴포넌트는 조각의 내용을 몰라도 된다.

```tsx
<Header showSearch />                       // ⚠
<Header right={<SearchButton />} />         // ✅
```

---

# 06 테스트

아래 규칙은 테스트 파일(`*.test.*`, `fixtures/`·`mocks/` 폴더 등)에만 켜진다. 근거는 모두 [habits/06](../habits/06-testing.md) 이다.

## vitest/no-conditional-expect

**잡는 것**: `if`·`catch`·삼항 안에서 부르는 `expect`.

**왜**: 조건에 따라 단언이 아예 돌지 않아도 테스트는 통과한다. 기능이 깨졌는데 초록불이 뜬다.

**효과**: 모든 단언이 매번 실행되어, 테스트가 통과했다는 것이 단언이 참이었다는 뜻이 된다.

```ts
if (row !== null) expect(row).toBeInTheDocument();   // ❌
expect(screen.getByRole("row")).toBeInTheDocument(); // ✅
```

## vitest/no-conditional-in-test

**잡는 것**: 테스트 본문 안의 `if`·`switch`·삼항.

**왜**: 테스트 안의 분기는 한 테스트가 여러 시나리오를 섞어 검증한다는 뜻이다. 어느 경로가 실제로 실행됐는지 결과만 보고는 모른다.

**효과**: 분기마다 테스트를 따로 두면 실패했을 때 어느 시나리오가 깨졌는지 테스트 이름이 말해 준다.

```ts
it("상태별 라벨", () => { if (status === "open") … else … });   // ❌
it.each([["open", "열림"], ["closed", "닫힘"]])("%s 면 %s", …);  // ✅
```

## vitest/expect-expect

**잡는 것**: `expect` 가 하나도 없는 테스트.

**왜**: 단언이 없는 테스트는 예외만 안 나면 통과한다. 화면이 틀려도 초록불이다.

**효과**: 모든 테스트가 기능이 깨지면 실패하는 단언을 하나 이상 갖는다.

```ts
it("단언이 없다", () => { render(<OrderList />); });    // ❌
```

## vitest/no-standalone-expect

**잡는 것**: `test`·`it` 블록 밖(describe 본문, 모듈 최상위)의 `expect`.

**왜**: 블록 밖의 단언은 테스트로 집계되지 않거나 수집 단계에서 실행되어, 실패해도 어느 테스트가 깨졌는지 보고되지 않는다.

**효과**: 모든 단언이 이름 있는 테스트 안에서 실행되고 결과에 잡힌다.

```ts
expect(1).toBe(1);   // ❌ 모듈 최상위
```

## vitest/valid-expect

**잡는 것**: 매처 없이 끝난 `expect(x)`, `await` 하지 않은 `resolves`·`rejects` 등 잘못 쓴 `expect`.

**왜**: `expect(x)` 만 있고 매처가 없으면 아무것도 검사하지 않는다. 비동기 매처를 `await` 하지 않으면 테스트가 끝난 뒤에 단언이 돈다.

**효과**: 적어 둔 단언이 실제로 검사된다.

```ts
expect(screen.getByRole("button"));                 // ❌ 매처가 없다
await expect(saveOrder()).rejects.toThrow("권한");  // ✅
```

## vitest/no-identical-title

**잡는 것**: 같은 `describe` 안에서 제목이 같은 테스트.

**왜**: 실패 보고에서 어느 테스트인지 구분할 수 없고, 대개 복사한 뒤 제목을 안 고친 것이다.

**효과**: 테스트 제목만으로 무엇을 검증하는지, 무엇이 깨졌는지 안다.

## vitest/no-commented-out-tests

**잡는 것**: 주석 처리된 `it(…)`·`test(…)`.

**왜**: 주석 처리된 테스트는 아무도 다시 살리지 않고, 커버리지가 있는 것처럼 보이게 한다.

**효과**: 필요 없으면 지우고, 필요하면 고쳐서 살린다. 테스트 파일에 실제로 도는 테스트만 남는다.

## vitest/require-to-throw-message

**잡는 것**: 인자 없는 `toThrow()`·`toThrowError()`.

**왜**: 인자가 없으면 아무 에러나 통과한다. 의도한 검증 실패가 아니라 오타로 난 `TypeError` 여도 초록불이다.

**효과**: 기대한 에러가 났는지까지 검증된다.

```ts
expect(() => parseOrder("{")).toThrow();                  // ❌
expect(() => parseOrder("{")).toThrow("주문 형식");        // ✅
```

## testing-library/no-node-access

**잡는 것**: `parentElement`·`children`·`querySelector` 등 DOM 노드에 직접 접근하는 코드.

**왜**: DOM 구조에 기대면 마크업을 감싸는 `div` 하나만 바뀌어도 테스트가 깨지고, 사용자가 보는 것과 무관한 구조를 검증한다.

**효과**: 역할·이름으로 찾고 `within` 으로 범위를 좁히면, 마크업 리팩터에 강하고 접근성도 함께 검증된다.

```ts
screen.getByText("주문").parentElement;                               // ❌
within(screen.getByRole("row", { name: /주문/ })).getByRole("button"); // ✅
```

## testing-library/no-container

**잡는 것**: `render` 결과의 `container` 로 DOM 을 뒤지는 코드.

**왜·효과**: [testing-library/no-node-access](#testing-libraryno-node-access) 와 같다.

```ts
const { container } = render(<OrderList />);
container.querySelector("li");                 // ❌
screen.getAllByRole("listitem");               // ✅
```

## testing-library/prefer-screen-queries

**잡는 것**: `render` 결과에서 꺼낸 쿼리(`view.getByRole`).

**왜**: 테스트마다 `render` 결과를 들고 다니면 쿼리 출처가 제각각이 되고, 포털로 그린 요소(모달)는 `render` 의 범위 밖이라 놓친다.

**효과**: `screen` 하나로 통일되어 어떤 테스트든 같은 방식으로 찾는다.

```ts
const view = render(<OrderList />); view.getByRole("list");   // ❌
render(<OrderList />); screen.getByRole("list");              // ✅
```

## testing-library/prefer-presence-queries

**잡는 것**: 있음을 확인하는데 `queryBy*` 를 쓰거나, 없음을 확인하는데 `getBy*` 를 쓰는 코드.

**왜**: `getBy*` 는 없으면 그 자리에서 throw 하므로 `not.toBeInTheDocument()` 와 쓰면 단언까지 가지 못한다. `queryBy*` 로 있음을 확인하면 실패했을 때 "null 이 아니어야 한다"는 덜 친절한 메시지가 나온다.

**효과**: 있음은 `getBy*`, 없음은 `queryBy*` 로 갈려서 실패 메시지가 원인을 정확히 말한다.

```ts
expect(screen.queryByRole("button")).toBeInTheDocument();     // ❌
expect(screen.getByRole("dialog")).not.toBeInTheDocument();   // ❌
expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); // ✅
```

## testing-library/prefer-find-by

**잡는 것**: `await waitFor(() => screen.getByRole(…))` 처럼 `waitFor` 로 동기 쿼리를 감싼 코드.

**왜**: 같은 일을 `findBy*` 가 한 줄로 한다. `waitFor` 로 감싸면 의도("나타날 때까지 기다린다")가 덜 드러난다.

**효과**: 비동기로 나타나는 요소를 기다리는 코드가 `await screen.findByRole(…)` 하나로 통일된다.

```ts
await waitFor(() => screen.getByRole("button"));   // ❌
await screen.findByRole("button");                 // ✅
```

## testing-library/prefer-user-event

**잡는 것**: `fireEvent.click` 등 `fireEvent` 호출.

**왜**: `fireEvent` 는 이벤트 하나만 쏜다. 실제 클릭은 pointerdown → mousedown → focus → pointerup → click 순서로 일어나서, 포커스나 키보드 동작에 기대는 코드는 `fireEvent` 로 검증되지 않는다.

**효과**: `userEvent` 가 사용자 동작 순서를 재현해서 실제 브라우저에 가까운 상태로 검증된다.

```ts
fireEvent.click(screen.getByRole("button"));          // ❌
await user.click(screen.getByRole("button"));         // ✅ const user = userEvent.setup()
```

## testing-library/await-async-queries

**잡는 것**: `await` 하지 않은 `findBy*` 쿼리.

**왜**: `findBy*` 는 Promise 를 돌려준다. `await` 하지 않으면 요소가 나타나기 전에 테스트가 끝나고, 실패해도 잡히지 않는다.

**효과**: 비동기 쿼리의 결과와 실패가 테스트에 반영된다.

```ts
screen.findByRole("button");          // ❌
await screen.findByRole("button");    // ✅
```

## testing-library/await-async-utils

**잡는 것**: `await` 하지 않은 `waitFor`·`waitForElementToBeRemoved`.

**왜·효과**: [testing-library/await-async-queries](#testing-libraryawait-async-queries) 와 같다.

```ts
waitForElementToBeRemoved(() => screen.queryByRole("status"));         // ❌
await waitForElementToBeRemoved(() => screen.queryByRole("status"));   // ✅
```

## testing-library/no-await-sync-queries

**잡는 것**: `await screen.getByRole(…)` 처럼 동기 쿼리를 `await` 하는 코드.

**왜**: `getBy*` 는 동기라서 `await` 해도 기다리지 않는다. 기다린다고 착각하게 만든다.

**효과**: 기다리는 코드(`findBy*`)와 즉시 찾는 코드(`getBy*`)가 구분되어 읽힌다.

```ts
await screen.getByRole("button");    // ❌
screen.getByRole("button");          // ✅ 기다려야 하면 await screen.findByRole
```

## testing-library/no-wait-for-multiple-assertions

**잡는 것**: `waitFor` 콜백 안에 `expect` 가 여러 개 있는 코드.

**왜**: `waitFor` 는 콜백이 throw 하지 않을 때까지 다시 돈다. 단언이 여러 개면 첫 단언이 통과할 때까지 나머지가 기다리지 않아 실패 원인이 흐려지고 테스트가 느려진다.

**효과**: 하나만 기다리고 나머지는 그 뒤에서 단언하면, 무엇을 기다리는지와 무엇을 검증하는지가 갈린다.

```ts
await waitFor(() => { expect(a).toBe(1); expect(b).toBe(2); });   // ❌
await waitFor(() => expect(a).toBe(1)); expect(b).toBe(2);        // ✅
```

## testing-library/no-wait-for-side-effects

**잡는 것**: `waitFor` 콜백 안의 클릭·렌더 같은 부수효과.

**왜**: 콜백은 조건이 맞을 때까지 여러 번 실행된다. 안에 클릭이 있으면 클릭이 여러 번 일어난다.

**효과**: 동작은 `waitFor` 앞에서 한 번만 하고, 콜백에는 단언만 남아 결과가 결정적이다.

```ts
await waitFor(() => { fireEvent.click(button); expect(dialog).toBeVisible(); });   // ❌
await user.click(button); await waitFor(() => expect(dialog).toBeVisible());     // ✅
```

## testing-library/no-unnecessary-act

**잡는 것**: `render`·`userEvent` 등 Testing Library 유틸을 `act` 로 감싼 코드, 감쌀 것이 없는 `act`.

**왜**: Testing Library 유틸은 이미 `act` 로 감싸져 있다. 다시 감싸면 아무 효과 없이 "act 경고를 덮으려는" 코드처럼 보여 진짜 문제를 숨긴다.

**효과**: `act` 가 꼭 필요한 곳(직접 만든 타이머·외부 구독)에만 남아 눈에 띈다.

```ts
act(() => { render(<OrderList />); });   // ❌
render(<OrderList />);                    // ✅
```

## testing-library/no-manual-cleanup

**잡는 것**: 테스트에서 직접 부르는 `cleanup()`.

**왜**: 테스트 러너(vitest·jest)와 Testing Library 가 테스트마다 자동으로 정리한다. 직접 부르면 정리 시점이 두 번이 되어 순서 문제가 생길 수 있다.

**효과**: 정리는 한 곳(러너 설정)에서만 일어난다.

## testing-library/no-debugging-utils

**잡는 것**: `screen.debug()`·`prettyDOM` 같은 디버깅 출력.

**왜**: 디버깅하고 남긴 출력이 CI 로그를 DOM 덤프로 채워 진짜 실패 메시지를 묻는다.

**효과**: 테스트 로그에는 실패 정보만 남는다.

```ts
screen.debug();   // ❌ 지운다
```
