# 01 · 컴포넌트 설계 (관심사 분기 룰)

핵심: **시점이동, 아래로 흐르는 코드, 분기를 미리 제거해 단순화, 단일 관심사/책임.**

## 1. 단일 관심사

- 컴포넌트는 **주제(concern)**로 분리: 하나의 컴포넌트는 하나의 도메인 주제만.
- 훅/함수는 **행동(responsibility)**으로 분리: 각 훅은 한 가지 일만.
- **로직은 사용부로 내리기**: 상위가 모든 로직을 들지 않고, 관심사별 컴포넌트가 자기 로직을 소유.

```tsx
// ❌ 여러 관심사 혼재
function ProductPage() {
  const product = useProduct();
  const [quantity, setQuantity] = useState(1);
  const reviews = useReviews();
}
// ✅ 관심사별 분리
function ProductPage() {
  return (<><ProductInfoSection /><CartSection /><ReviewSection /></>);
}
```

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
