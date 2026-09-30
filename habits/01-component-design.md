# 01 · 컴포넌트 설계 (관심사 분기 룰)

핵심: **시점이동, 아래로 흐르는 코드, 분기를 미리 제거해 단순화, 단일 관심사/책임.**

## 1. 단일 관심사

- **로직은 사용부로 내리기**: 상위가 모든 로직을 들지 않고, 관심사별 컴포넌트가 자기 로직을 소유.

**① 컴포넌트는 관심사(concern, 주제)로 — 굵게 나눈다**

```tsx
// ❌ 한 컴포넌트에 여러 관심사(주제) 혼재
function ProductPage() {
  const product = useProduct();
  const [quantity, setQuantity] = useState(1);
  const reviews = useReviews();
  // '상품정보' + '장바구니' + '리뷰' 가 한 곳에 — 바뀔 이유가 셋
}
// ✅ 관심사별 컴포넌트로 — 각자 자기 로직을 소유
function ProductPage() {
  return (<><ProductInfoSection /><CartSection /><ReviewSection /></>);
}
```

**② 훅/함수는 책임(responsibility, 하는 일)으로 — 가늘게 나눈다**

```tsx
// ❌ 한 훅에 여러 책임 (변경 이유가 여럿)
function useCart() {
  const [items, setItems] = useState([]);     // 장바구니 상태
  const { data: coupons } = useCoupons();      // 쿠폰 조달
  const total = items.reduce(/* ... */);       // 합계 계산
  const createPayment = () => api.createPayment(items);  // 결제 요청
  // 상태 / fetch / 계산 / 결제 — 하나만 바뀌어도 이 훅을 건드린다
}
// ✅ 책임별로 — 각 훅·함수는 한 가지 일만
function useCartItems() {/* 장바구니 상태만 */}
const calculateTotal = (items: CartItem[]) => /* 합계 계산(순수함수) */;
function useCheckout() {/* 결제 요청만 */}
```

**③ 둘이 만나는 지점 — 관심사 컴포넌트가 자기 책임 훅들을 조립**

```tsx
function CartSection() {                            // 관심사: 장바구니
  const { items, add, remove } = useCartItems();    // 책임: 상태
  const total = calculateTotal(items);              // 책임: 합계
  // ...
}
```

> **관심사(concern) = 어느 주제냐(컴포넌트를 굵게), 책임(responsibility) = 그 안에서 무슨 일을 하느냐(훅·함수를 가늘게).** 둘은 대립이 아니라 **분리의 스케일 차이**다. 잘 쪼개면 *작은 관심사 하나 = 책임 하나*로 수렴해 둘이 같아 보이는데, 그게 정상이다.
> 판단이 헷갈리면 메서드 수가 아니라 **"이게 바뀔 이유가 몇 개냐"**를 묻는다.
> 싼 검출기 하나: **이름을 정직하게 쓰는데 `and` 가 필요하면 이미 둘이다**([00-intent](00-intent.md) 「함수 이름」).

## 2. 분기는 상위로 끌어올리기 (시점이동)

- 조건부 렌더링은 **최상위에서 결정**, 하위는 자기 케이스만.
- **분기별로 다른 훅을 호출하면 분리한다.** 단 상태가 스텝을 타고 흐르는 멀티스텝 폼은 분리 비용이 검증 비용으로 청구되므로 단일 유지가 맞다([05-types](05-types.md) 전환기 4번).
- boolean 플래그를 여러 단으로 drilling 후 리프에서 if 체인 = 안티 → 상위에서 **태그드 유니온 view-state 1개**로 정규화.

```tsx
// ❌ 한 컴포넌트에서 분기 + 양쪽 훅 다 호출
function PostDialog({ canEdit }) {
  const form = useForm();
  const mutate = useSavePost();
  if (canEdit) return <EditUI form={form} />;
  return <ReadOnlyUI />;
}
// ✅ 분기를 상위로, 하위는 단순
function PostDialogBranch({ postId }) {
  const { canEdit } = usePermission();
  return canEdit ? <EditablePost postId={postId} /> : <ReadOnlyPost postId={postId} />;
}
```

## 3. Compound Pattern + Suspense

- Suspense는 "로딩 UI 도구"가 아니라 **성공 케이스만 신경쓰게 해주는 경계**. 경계 안은 "데이터가 항상 준비됨"으로 가정 → 옵셔널 체이닝(`?.`) 전염 차단.
- `Component.loading` / `Component.error`를 **정적 프로퍼티로 붙여** 성공·로딩·에러 UI를 한 파일에 응집.
- **조회는 `useSuspenseQuery` 가 기본이다. `useQuery` 는 조건부 조회가 꼭 필요할 때만** 쓴다 — `enabled`·`skipToken` 으로 조회를 끄고 켜야 하는 경우(검색어가 비었을 때, 선택값이 아직 없을 때). suspense 쿼리는 끌 수 없기 때문이다. 단 그 전에 suspense 로 풀 수 있는지 먼저 본다:
  - 조건을 위에서 판정해 **쿼리를 쓰는 컴포넌트 자체를 조건부로 렌더**한다(§2 분기는 상위로).
  - 앞 결과가 필요한 의존 쿼리는 한 컴포넌트 안에서 순서대로 부르면 된다 — suspense 는 원래 직렬로 조회한다.
  - 쿼리 키가 바뀔 때 fallback 이 다시 뜨는 게 문제면 키를 바꾸는 업데이트를 `startTransition` 으로 감싼다.
  - (TanStack Query 공식 문서 「Suspense」: suspense 쿼리는 `enabled`·`placeholderData` 를 지원하지 않는다)

```tsx
// ❌ 성공/로딩/에러가 한 컴포넌트에 뒤섞이고 ?. 가 전염됨
function VariantForm({ variantId, onClose }: VariantFormProps) {
  const { data: variant, isLoading, error } = useQuery(variantQueries.detail(variantId));
  if (isLoading) return <FormSkeleton />;
  if (error) return <FormError />;
  return <Form variant={variant!} onClose={onClose} />;  // variant? 전염 → non-null 땜빵
}

// ✅ Suspense 안은 성공만. 로딩/에러는 정적 프로퍼티로 컴포넌트에 응집
function VariantForm({ variantId, onClose }: VariantFormProps) {
  const { data: variant } = useSuspenseQuery(variantQueries.detail(variantId)); // 항상 존재 가정 → ?. 없음
  return <Form variant={variant} onClose={onClose} />;
}
VariantForm.loading = () => <FormSkeleton />;
VariantForm.error = ({ resetError }: { resetError: () => void }) => <FormError onRetry={resetError} />;

// 사용부 — 조립이 JSX에 드러남
<ErrorBoundary fallback={({ resetError }) => <VariantForm.error resetError={resetError} />}>
  <Suspense fallback={<VariantForm.loading />}>
    <VariantForm variantId={variantId} onClose={handleClose} />
  </Suspense>
</ErrorBoundary>
```

### 조달은 팩토리로 노출하고, 둘 이상이면 병렬로 묶는다

- **쿼리는 `queryOptions` 팩토리로 노출한다 — 훅이 유일한 입구가 되면 안 된다.** 훅만 있으면 소비처가 여러 조달을 **한 번에 묶을 수 없어** 워터폴이 고착된다. 신선도 정책(`refetchOnMount` 등)도 소비처 훅이 아니라 **팩토리에** 붙여 이름으로 드러낸다.
- **쿼리만 감싼 훅은 만들지 않는다.** 하는 일이 없으면 소비처가 팩토리를 직접 쓴다([03-composition](03-composition.md) 얕은 포장). **로직을 공유하는 훅**(다른 훅과 조합, 결과 가공)은 팩토리 위에 얹으면 된다 — 팩토리가 노출돼 있으니 묶어야 하는 소비처는 훅을 우회해 팩토리로 묶는다. (TkDodo 「Creating Query Abstractions」: 설정 공유는 `queryOptions`, 로직 공유는 그 위의 훅.)
- **한 경계에서 독립적인 조달이 둘 이상이면 `useSuspenseQueries` 로 묶는다.** 경계 안에서 **선언 순서는 병렬성을 만들지 못한다** — 첫 호출에서 던져지므로 뒤 쿼리는 그 뒤에 붙는다. "미리 조달한다"는 주석이 거짓말이 되는 자리.
- **단 묶으려고 조달 지점을 옮기지 않는다.** 이미 같은 경계에 있는 조달 얘기다 — 병렬화하려고 하위의 상태·관심사를 상위로 끌어올려야 하면 워터폴을 감수한다([03-composition](03-composition.md) 변경 전파 최소화). "위에서 트리거만 하고 값은 아래서 쓴다"는 우회도 같다.

```tsx
// ❌ 쿼리만 감싼 훅으로 조합을 막고, 나란히 선언해 워터폴을 만든다
function useOrderDetail(id: string) { return useSuspenseQuery(orderQueries.detail(id)); }
const order = useOrderDetail(id);
const catalog = useSuspenseQuery(productQueries.list());  // ← order 가 끝난 뒤 시작
// ✅ 팩토리로 노출 → 소비처가 병렬로 묶는다
const [order, catalog] = useSuspenseQueries({
  queries: [orderQueries.detail(id), productQueries.list()],
});
```

- 쿼리를 쓰는 커스텀 훅 둘을 한 경계에서 나란히 부르는 것도 워터폴이다 — 독립 조달이면 팩토리로 `useSuspenseQueries` 에 묶는다.

## 4. 위에서 아래로 흐르는 코드 / JSX = UI

- 트리 구조 활용: 상위에서 복잡도를 해소할수록 하위가 단순.
- 파일 안에서도 같다 — **진입점(호출하는 쪽)을 위에**, 그것이 쓰는 조각을 아래에. 모듈 최상위에서 실행 시점에 참조되는 상수와 타입만 TDZ 때문에 의존성 순서다 — 함수 몸통 안에서만 쓰는 상수(styled·className)는 아래에 둬도 된다([02-structure-cohesion](02-structure-cohesion.md)).
- **코드 구조가 화면 레이아웃과 1:1 매핑.** 단순 텍스트는 상수로 빼지 말고 JSX에 직접(UI 이정표). 단 도메인 목록(통화·탭)에서 파생돼야 하는 반복 조각은 열거하지 말고 `map` 으로 자동 추종시키고, 반복 마크업은 슬롯으로 접는다([02-structure-cohesion](02-structure-cohesion.md) SSOT, [03-composition](03-composition.md) 얕은 포장 반례).

## 5. 예측 가능한 컴포넌트 (역할다움)

컴포넌트가 **자기 본래 역할 밖의 props**를 받기 시작하면 인지 강도가 폭발한다. "input답지 않은 input"이 대표적 — input은 값 입력만 해야 하는데 툴팁·검증·분석까지 받으면, 읽는 사람이 시그니처를 다 뜯어봐야 동작을 예측할 수 있다([00-intent](00-intent.md)).

- 역할 밖 관심사(툴팁·검증·분석 등)는 별도 컴포넌트로 분리해 **조합**으로 얹는다([03-composition](03-composition.md) 슬롯/조합).
- 재사용성은 "역할 충실"에서 자연히 따라온다 — 옵션 prop을 늘려 범용화하는 게 아니다.

```tsx
// ❌ input답지 않은 input — 역할 밖 관심사가 prop으로 침투, 예측 불가
<CustomInput showTooltip validateOnBlur asyncValidation trackAnalytics />
// ✅ input은 input답게, 나머지는 조합으로 얹음 — 화면 구조가 JSX에 드러남
<TooltipWrapper>
  <ValidationLayer validateOnBlur>
    <Input {...inputProps} />
  </ValidationLayer>
</TooltipWrapper>
```

## 6. 단방향 흐름 / useEffect

- 파생상태를 `useEffect`로 손 동기화(거울 state) 금지 → `key` 리마운트 또는 렌더 중 보정.
- 외부 환경값(뷰포트 크기 등)도 "리스너 + setState" 거울 금지 → `useSyncExternalStore`로 승격 후 파생.
  보정 메커니즘 우선순위: CSS → 렌더 중 파생 → 이벤트 구독 → effect(최후).
- 단방향: 위→아래로 데이터/이벤트 흐름.

## 7. props · 태그드 유니온 · 주석

- props는 `XxxProps` **인터페이스**로 선언 — 판별 유니온 props(§2 view-state)는 `interface` 가 못 되니 `type`. 인라인 타입은 **한 줄에 들어가는 것만** 허용(`({ resetError }: { resetError: () => void })`), 줄이 넘어가면 인터페이스로 뺀다. 단 **기존 코드는 소급 수정하지 않는다** — 새 코드만 새 룰을 따르고, 파일의 기존 패턴에 맞추지 않는다(lint 는 PR 에서 추가된 줄만 보여주는 diff CI 로 운영한다 — [lint/README](../lint/README.md)).
- 합타입 + 패턴매칭 + **exhaustive `never`** 체크. 동일 union switch 중복은 `Record`로 — 단 **판정이 끝난 뒤의 값 매핑**에만. 판정 자체를 테이블로 옮기지 않는다([04-functional-domain](04-functional-domain.md)).
- 컴포넌트는 ReactNode 일관 반환(raw `"-"` 반환 금지).
- 주석: **코드로 안 보이는 제약**(호출 맥락 가정, 의도적 복제, 연동 지점)**만** — 이건 길어도 남긴다([canonical-examples](canonical-examples.md) `useProjectId`). 아키텍처 내레이션·소유권 주석 금지. 설명 주석이 길어지는 건 코드가 안 읽힌다는 신호다([00](00-intent.md) 신호표).
  - **변경 이력 내레이션("기존엔 ~~였는데", before/after)도 금지.** 리팩터의 근거는 PR 본문에 쓰고 코드에 남기지 않는다 — 다음 독자에게 "기존"은 존재하지 않는 코드다.
  - 리팩터가 끝나면 **이력 주석을 전수조사로 걷어내는 마무리 단계**를 둔다. 작업 중엔 붙이기 쉽고, 끝나면 아무도 안 지운다.
- 공유 styled/className 은 **스타일 기반 이름**(`FlexRow`) — 소유 범위가 스타일이라 도메인 이름을 붙이면 과도한 구체화다([02-structure-cohesion](02-structure-cohesion.md) 「구체성은 소유 범위와 일치」).

→ 연관: [03-composition](03-composition.md), [02-structure-cohesion](02-structure-cohesion.md).
