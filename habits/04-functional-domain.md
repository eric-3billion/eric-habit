# 04 · 함수형 / 도메인 룰

함수형 우선 — 불변·선언적·합타입 중심. OOP 상용구는 배제하되 **범주론 용어로 포장하지 않는다**(실제 리뷰에서 발화되는 것만).

## 함수형 원칙

각 항목은 스캔용 체크리스트다. 헷갈릴 만한 것만 ❌/✅를 붙인다.

- **불변 기본**: 상태 변경은 가변변수 재할당 대신 **섀도잉 / 새 인스턴스 반환**. 부수효과는 격리.
- **명시적 루프 금지** → `map`/`filter`/`reduce` 체이닝으로 선언적 표현.

  ```ts
  // ❌ 가변 변수 + 명시적 루프
  let total = 0;
  for (const it of items) { if (it.active) total += it.price; }
  // ✅ 불변 + 선언적
  const total = items.filter((it) => it.active).reduce((sum, it) => sum + it.price, 0);
  ```

- **예외 throw 금지** → `Result`/`Option` + 에러 전파. (throw는 시그니처에 안 드러나는 숨은 분기)

  ```ts
  // ❌ 성공 타입만 노출, 실패는 호출부가 예측 못 함
  function parsePort(s: string): number { const n = Number(s); if (Number.isNaN(n)) throw Error(); return n; }
  // ✅ 실패가 반환 타입에 드러남 → 호출부가 반드시 다룸
  function parsePort(s: string): Result<number, "NaN"> { … }
  ```

- **합타입(Discriminated Union) + 패턴매칭 + exhaustive `never`**로 분기를 컴파일타임에 완전 처리. 케이스 추가 시 누락을 컴파일러가 잡아줌. 비지터/중첩 if 대체.

  ```ts
  // ✅ 케이스 빠뜨리면 default에서 컴파일 에러
  function label(s: Status): string {
    switch (s.type) {
      case "loading": return "…";
      case "error":   return s.message;
      default: { const _exhaustive: never = s; return _exhaustive; }
    }
  }
  ```

- **DI/팩토리는 커링/부분적용**으로 설정값·런타임 인자 분리(생성/사용 단계 분리). 함수형 DI는 권장 — OOP IoC 상용구만 배제.

  ```ts
  // ✅ 설정(logger)은 생성 시, 런타임 인자(id)는 사용 시 — 두 단계 분리
  const makeGetUser = (logger: Logger) => (id: string) => { logger.info(id); return fetchUser(id); };
  ```

- **리턴 타입 명시**, 메서드 체이닝은 **수직 줄바꿈**.

## 도메인 룰 = 이름 붙은 순수함수

- 도메인 룰은 `entities/<x>/lib/`에 **이름 붙은 순수함수 + 룰 docstring**으로 추출. 인라인 비교/하드코딩 금지.
- 함수 이름과 docstring만 봐도 룰이 드러나야 함([00-intent](00-intent.md)).
- 정전 예시 → [canonical-examples](canonical-examples.md):
  - `isSubCategory(categoryId, rootId) => categoryId !== rootId`
  - `defineKeyStore` 브랜디드 키 팩토리 + 순수 판별

→ 연관: [02-structure-cohesion](02-structure-cohesion.md)(도메인 룰 SSOT), [05-types](05-types.md)(합타입), [canonical-examples](canonical-examples.md)(실제 코드).
