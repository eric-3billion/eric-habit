# 05 · 타입

## 땜빵용 옵셔널 필드 남발 강혐

- 임시로 때우려고 interface에 `?` 옵셔널 필드를 막 붙이는 것 = **개싫어함.**
- 옵셔널은 "정말 없을 수 있다"는 의도일 때만. 땜빵이면 → **필수 필드 / 분리 타입 / 태그드 유니온**으로 의도를 드러낸다([00-intent](00-intent.md), [04-functional-domain](04-functional-domain.md)).
- 새로 붙은 `?` 필드는 "왜 옵셔널인지" 정당한지 항상 따진다.

## 타입 일관성

- (기본 위생) `as` 캐스트 · non-null `!` · `any` 지양 — 일반 TS 상식, 별도 설명 생략.
- **lint 억제 주석으로 사유를 대는 회피는 그 위생 위반보다 더 나쁘다.** `biome-ignore`/`eslint-disable` 로 `!` 를 통과시키려는데 사유가 그럴듯하다면(예: "Suspense 경계 안이라 항상 존재"), 그건 **타입이 그 사실을 표현하지 못한다**는 뜻이다 — 억제하지 말고 값이 항상 존재하도록 **조달 구조를 고친다.**

  ```ts
  // ❌ 사유가 타당해도 억제는 해법이 아니다 — 다음 사람은 이 가정을 검증할 수 없고,
  //    가정이 깨지는 리팩터(경계 밖으로 이동)를 컴파일러가 못 잡는다
  // biome-ignore lint/style/noNonNullAssertion: 경계 안이라 항상 존재
  const total = order!.total;
  // ✅ 조달이 존재를 보장하게 만든다 → `!` 도 억제 주석도 같이 사라진다
  const order = useSuspenseOrder();   // 경계 안: 항상 존재 ([01](01-component-design.md) §3)
  const total = order.total;
  ```
- **도메인 규약 일관성**: 같은 개념을 타입마다 다르게 표현 금지.
  - 예: API 버전을 한 타입은 `"v1"`, 다른 타입은 `"version-1"`로 이원화하면 표시·비교 로직이 갈라지고 의도가 흐려짐.
- DTO→model 매퍼는 경계에서 정규화하되, 무음 데이터 변형(빈값 제거 등)은 의도를 주석/네이밍으로 드러낸다.

## 하위호환 필드는 진입 경계에서 흡수 (리프에서 방어 금지)

- 데이터 하위호환 이슈(필드 추가/이름 변경/optional화 등)를 **리프 컴포넌트에서 각자 방어하면**, 같은 폴백·분기가 소비처 N곳에 복제되며 하드코딩이 번진다.
- 흡수 지점은 **데이터가 앱에 들어오는 단일 경계 한 곳**: `queryFn`(또는 select) → DTO→model 매퍼, BFF 미들웨어(Next.js 서버)를 둔다면 거기. 경계 안쪽(model)은 이미 정규화됐다고 가정하고 리프는 **필드가 항상 있다**는 전제로 단순하게.

  ```ts
  // ❌ 하위호환 폴백이 소비처마다 복제 — 필드 규약이 바뀌면 N곳을 다 고쳐야 함
  function OrderRow({ o }: { o: OrderDTO }) {
    const currency = o.currency ?? "USD"; // 여기, 저기, 또 저기…
  }
  // ✅ 경계에서 한 번 흡수 → model은 필수 필드, 리프는 방어 안 함
  const toOrder = (dto: OrderDTO): Order => ({
    ...dto,
    currency: dto.currency ?? "USD", // 하위호환: currency 없는 레거시 레코드는 USD로 정규화
  });
  ```

- 이유: SSOT(하드코딩은 단일 모듈, [02-structure-cohesion](02-structure-cohesion.md)) + 변경 전파 최소화(blast radius, [03-composition](03-composition.md))의 귀결. 폴백 의미(매직값·sentinel)는 경계에서 **주석/네이밍으로 의도를 드러낸다**([00-intent](00-intent.md)).

→ 연관: [02-structure-cohesion](02-structure-cohesion.md), [03-composition](03-composition.md), [04-functional-domain](04-functional-domain.md).
