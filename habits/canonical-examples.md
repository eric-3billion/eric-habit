# Canonical 예시

리뷰/작성 시 비교 기준으로 삼는 정전(canonical) 패턴. 실제 코드를 그대로 싣는다.
(예시는 도메인 중립적으로 추상화됨 — 패턴만 본다.)

## 1. 의도를 드러내는 폴백 + 비자명 제약 주석 — `useProjectId`

```ts
/**
 * project-detail-page 는 `:projectId` 라우트 안에서만 마운트되므로 projectId는 항상 존재한다고 가정한다.
 * 빈 문자열 폴백은 sentinel이 아니라 useParams의 partial 타입을 좁히기 위한 용도.
 *
 * 이 훅은 project-settings-page 에도 동일하게 의도적으로 복제돼 있다.
 * 두 projects/:projectId 페이지에서만 쓰여야 하는데, 레이어드 슬라이스 구조(FSD)상
 * 페이지 슬라이스끼리는 공유가 불가하고 shared 로 내리면 전역 노출돼 스코프가 깨진다.
 * 3줄 래퍼라 복제를 택했으니 한쪽을 바꾸면 다른 쪽(project-settings-page 의 use-project-id)도 맞출 것.
 */
export function useProjectId(): string {
  const { projectId = "" } = useParams<{ projectId: string }>();
  return projectId;
}
```

무엇을 보여주나:
- **의도 드러남([00-intent](00-intent.md))**: 이름 `useProjectId`가 반환을 telegraph. `= ""` 폴백이 **sentinel이 아니라 타입 좁히기**라는 걸 주석이 못박아 예측 가능.
- **주석 룰([01-component-design](01-component-design.md))**: 코드만 봐선 모를 것만 적혀 있다 — ① 라우트 마운트 보장 가정, ② 폴백의 진짜 의도(타입), ③ **의도적 복제** 결정 + 레이어 구조상 왜 공유/하향이 안 되는지, ④ "한쪽 바꾸면 다른 쪽도"라는 결합 제약. 자명한 내레이션은 한 줄도 없음.

## 2. 도메인 룰을 이름 붙은 순수함수로 — `is-sub-category`

```ts
/**
 * 하위 카테고리인지 판별
 * @param categoryId - 카테고리 id
 * @param rootId - 대표(루트) 카테고리 id
 * @note 카테고리 정규화 로직 변경 시 함께 반영
 * @returns categoryId가 rootId와 다르면 하위 카테고리
 */
export function isSubCategory(categoryId: string, rootId: string): boolean {
  return categoryId !== rootId;
}
```

무엇을 보여주나: "하위 카테고리 = id ≠ rootId"라는 도메인 룰이 여러 곳에 `a !== b`로 흩어지지 않고, **이름 붙은 순수함수 한 곳(SSOT)**에 모여 의도가 드러난다. `@note`로 연동 지점도 명시. 위치 예: `src/entities/category/lib/is-sub-category.ts`.

## 3. 식별자 생성/판별의 SSOT — branded key 팩토리

```ts
// (예시) 팀 공용 branded-key 유틸
import { defineKeyStore, type InferKey } from "./key-store";

/**
 * 주문 라인을 고유하게 식별하는 branded key 팩토리.
 * order id와 line sku 조합으로 키를 생성한다.
 */
export const orderLineKeys = defineKeyStore("OrderLineKey", {
  line: (order: { id: string }, line: { sku: string }): string =>
    `${order.id}-${line.sku}`
});

export type OrderLineKey = InferKey<typeof orderLineKeys>;

/**
 * line key가 해당 주문에 속하는지 판별한다.
 * line key는 order.key를 접두어로 포함하므로 그 주문의 모든 라인을 매칭한다.
 */
export const isKeyBelongsToOrder = (
  lineKey: string,
  order: { key: string }
): boolean => lineKey.startsWith(order.key);
```

무엇을 보여주나: 키 생성 규칙을 인라인 템플릿 문자열로 흩지 않고 **브랜디드 키 팩토리 + 순수 판별 함수**로 모아, 생성·매칭 규칙의 단일 출처를 만든다.

## 적용

도메인 비교/키 생성/폴백 의미가 컴포넌트·포맷 함수에 인라인·하드코딩으로 흩어져 있으면, 위처럼 이름 붙은 순수함수 + 의도 드러나는 주석으로의 추출을 처방한다. → [04-functional-domain](04-functional-domain.md), [00-intent](00-intent.md)
