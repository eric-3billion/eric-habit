# 04 · 함수형 / 도메인 룰

함수형 우선 — 불변·선언적·합타입 중심. OOP 상용구는 배제하되 **범주론 용어로 포장하지 않는다**(실제 리뷰에서 발화되는 것만).

## 함수형 원칙

- **불변 기본**: 상태 변경은 가변변수 대신 **섀도잉 / 새 인스턴스 반환**. 부수효과 격리.
- **명시적 루프 금지** → `map`/`filter`/`reduce` 체이닝으로 선언적 표현.
- **예외 throw 금지** → `Result`/`Option` + 에러 전파.
- **합타입(Discriminated Union) + 패턴매칭 + exhaustive `never`**로 분기를 컴파일타임에 완전 처리(케이스 누락 방지). 비지터/중첩 if 대체.
- **DI/팩토리는 커링/부분적용**으로 설정값·런타임 인자 분리(생성/사용 단계 분리). 함수형 DI는 권장 — OOP IoC 상용구만 배제.
- **리턴 타입 명시**, 메서드 체이닝은 **수직 줄바꿈**.

## 도메인 룰 = 이름 붙은 순수함수

- 도메인 룰은 `entities/<x>/lib/`에 **이름 붙은 순수함수 + 룰 docstring**으로 추출. 인라인 비교/하드코딩 금지.
- 함수 이름과 docstring만 봐도 룰이 드러나야 함([00-intent](00-intent.md)).
- 정전 예시 → [canonical-examples](canonical-examples.md):
  - `isSubCategory(categoryId, rootId) => categoryId !== rootId`
  - `defineKeyStore` 브랜디드 키 팩토리 + 순수 판별

→ 연관: [02-structure-cohesion](02-structure-cohesion.md)(도메인 룰 SSOT), [05-types](05-types.md)(합타입), [canonical-examples](canonical-examples.md)(실제 코드).
