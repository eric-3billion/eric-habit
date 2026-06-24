# 01 · 컴포넌트 설계 (관심사 분기 룰)

핵심: **시점이동, 아래로 흐르는 코드, 분기를 미리 제거해 단순화, 단일 관심사/책임.**

## 1. 단일 관심사

- 컴포넌트는 **주제(concern)**로 분리: 하나의 컴포넌트는 하나의 도메인 주제만.
- 훅/함수는 **행동(responsibility)**으로 분리: 각 훅은 한 가지 일만.
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
  const checkout = () => api.checkout(items);  // 결제 요청
  // 상태 / fetch / 계산 / 결제 — 하나만 바뀌어도 이 훅을 건드린다
}
// ✅ 책임별로 — 각 훅·함수는 한 가지 일만
function useCartItems() {/* 장바구니 상태만 */}
const calcTotal = (items: CartItem[]) => /* 합계 계산(순수함수) */;
function useCheckout() {/* 결제 요청만 */}
```

**③ 둘이 만나는 지점 — 관심사 컴포넌트가 자기 책임 훅들을 조립**

```tsx
function CartSection() {                            // 관심사: 장바구니
  const { items, add, remove } = useCartItems();    // 책임: 상태
  const total = calcTotal(items);                   // 책임: 합계
  // ...
}
```

> **관심사(concern) = 어느 주제냐(컴포넌트를 굵게), 책임(responsibility) = 그 안에서 무슨 일을 하느냐(훅·함수를 가늘게).** 둘은 대립이 아니라 **분리의 스케일 차이**다. 잘 쪼개면 *작은 관심사 하나 = 책임 하나*로 수렴해 둘이 같아 보이는데(예: `useRowSelection` = '행 선택' 관심사 = '선택 상태·수명 관리' 책임), 그게 정상이다.
> 판단이 헷갈리면 메서드 수가 아니라 **"이게 바뀔 이유가 몇 개냐"**를 묻는다.

## 2. 분기는 상위로 끌어올리기 (시점이동)

- 조건부 렌더링은 **최상위에서 결정**, 하위는 자기 케이스만.
- **분기별로 다른 훅을 호출하면 무조건 분리.**
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

- `Component.loading`, `Component.error`로 상태를 컴포넌트와 함께 관리.
- Suspense로 성공 케이스만 신경쓰게 설계.

## 4. 위에서 아래로 흐르는 코드 / JSX = UI

- 트리 구조 활용: 상위에서 복잡도를 해소할수록 하위가 단순.
- **코드 구조가 화면 레이아웃과 1:1 매핑.** 단순 텍스트는 상수로 빼지 말고 JSX에 직접(UI 이정표).

## 5. 단방향 흐름 / useEffect

- 파생상태를 `useEffect`로 손 동기화(거울 state) 금지 → `key` 리마운트 또는 렌더 중 보정.
- 단방향: 위→아래로 데이터/이벤트 흐름.

## 6. props · 태그드 유니온 · 주석

- props는 `XxxProps` **인터페이스**로 선언(인라인 타입 금지). 단 **기존 파일 소급 수정 금지** — 한 파일 내 기존 패턴 존중.
- 합타입 + 패턴매칭 + **exhaustive `never`** 체크. 동일 union switch 중복은 `Record`로.
- 컴포넌트는 ReactNode 일관 반환(raw `"-"` 반환 금지).
- 주석: **아키텍처 내레이션/소유권 주석 금지.** 코드로 안 보이는 제약만.
- 네이밍은 의미를 드러내고([00-intent](00-intent.md)), 공유 styled/className은 스타일 기반 제너럴 이름.

→ 연관: [03-composition](03-composition.md), [02-structure-cohesion](02-structure-cohesion.md).
