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

## 조합 닫힘 (closure of operation) — 인자·반환 타입이 같은 연산은 무한 조합된다

Evans DDD의 closure of operation: **조합 연산의 인자 타입과 반환 타입이 같으면**, 결과를 다시 그 연산에 넣을 수 있어 그 타입에 **닫힌 계산 체계**가 된다. 열쇠는 **함수 타입에 도메인 이름을 붙여 인자를 그 뒤로 감추는 것** — 그래야 조합이 *그 타입 위에서* 일어나고, 밑에 깔린 실제 인자를 매번 꺼내지 않는다.

판별 질문: **"이 값들을 조합하는 연산이, 인자를 꺼내지 않고 값끼리 직접 되나?"** — 되면 닫힘. 안 되면 조합할 때마다 인자를 손에 쥔 특수 함수를 새로 판다.

```ts
// 함수 타입에 이름을 붙여 인자(x)를 감춘다. 원자는 모두 Predicate<User>: isAdmin, isOwner, hasFlag, isGuest …
type Predicate<T> = (x: T) => boolean;

// ❌ Predicate 위의 조합 연산이 없다 → 조합하려면 인자(u)를 꺼내 boolean 으로 내린 뒤
//    &&/|| 로 엮는다. point-free 불가, 규칙마다 (u)=>… 를 손으로 새로 판다.
const canEdit = (u: User) => isAdmin(u) && (isOwner(u) || hasFlag(u));
const canView = (u: User) => isAdmin(u) || isGuest(u);
```

```tsx
// ✅ all/any 가 Predicate 를 받아 Predicate 를 반환 = Predicate 에 닫힌 연산
const all = <T>(...ps: Predicate<T>[]): Predicate<T> => x => ps.every(p => p(x));
const any = <T>(...ps: Predicate<T>[]): Predicate<T> => x => ps.some(p => p(x));

// u 를 꺼내지 않고 predicate 끼리 조합 — 깊이 제한 없이 중첩
const canEdit = all(isAdmin, any(isOwner, hasFlag));
const canView = any(isAdmin, isGuest);

// 소비처(가드)는 조합이 아무리 깊어도 Predicate<User> "한 타입"만 받는다
declare function Guard(props: { can: Predicate<User>; children: ReactNode }): ReactNode;
<Guard can={isAdmin}>…</Guard>                             // 원자
<Guard can={all(isAdmin, any(isOwner, hasFlag))}>…</Guard> // 3중 조합 — 시그니처 동일
```

- **소비처가 한 타입만 받는 게 닫힘의 페이오프다**: 위 `Guard`는 조합 깊이와 무관하게 `Predicate<User>` 하나만 평가한다. 판정 로직은 원자·조합자에 모이고(SSOT) 소비처는 조합 결과를 받기만 한다([02-structure-cohesion](02-structure-cohesion.md)).
- reducer, 파서 결합, 미들웨어(`fn → fn`)처럼 **인자·반환이 같은 타입인** 자리면 이 형태로 닫는다.
- (주의) 닫으려고 억지 타입을 만들지 말 것 — 자연히 같은 타입이 반복될 때만. 아니면 하는 일 없는 조합자 = 얕은 포장([03-composition](03-composition.md)).

## 도메인 룰 = 이름 붙은 순수함수

- 도메인 룰은 `entities/<x>/lib/`에 **이름 붙은 순수함수 + 룰 docstring**으로 추출. 인라인 비교/하드코딩 금지.
- 함수 이름과 docstring만 봐도 룰이 드러나야 함([00-intent](00-intent.md)).
- 정전 예시 → [canonical-examples](canonical-examples.md):
  - `isSubCategory(categoryId, rootId) => categoryId !== rootId`
  - `defineKeyStore` 브랜디드 키 팩토리 + 순수 판별

→ 연관: [02-structure-cohesion](02-structure-cohesion.md)(도메인 룰 SSOT), [03-composition](03-composition.md)(조합 닫힘 vs 얕은 포장), [05-types](05-types.md)(합타입), [canonical-examples](canonical-examples.md)(실제 코드).
