# 04 · 함수형 / 도메인 룰

범주론적 추상화 기반 함수형. 특정 언어에 국한되지 않고 OOP 상용구를 배제한 수학적 완결성 지향.

## 함수형 원칙

- **불변 기본**: 상태 변경이 필요하면 가변변수 대신 **변수 섀도잉 / 새 인스턴스 반환**. 부수효과 원천 차단.
- **명시적 루프 금지** → `map`/`filter`/`fold(reduce)` 이터레이터 체이닝으로 선언적 표현.
- **런타임 예외 유발 메서드 금지** → `Result`/`Option` + 에러 전파로 우아하게.
- **리턴 타입 명시** (컴파일러 추론 의존 대신). 메서드 체이닝은 **수직 줄바꿈**.
- 디자인 패턴은 기계적 클래스 대신 **수학적 구조**로:
  - 컴포지트/책임연쇄 → 리스트 `fold`/`reduce` (모노이드 연산).
  - 비지터 → **합 타입(Discriminated Union) + 패턴매칭**으로 컴파일타임 완전 처리.
  - 빌더 → 함수 합성 누적(엔도모피즘), 불변 유지.
  - **DI/팩토리 → 커링/부분적용**으로 변하지 않는 설정값과 변하는 런타임 인자 분리(생성/사용 단계 분리). *함수형 DI는 권장 — OOP IoC 상용구만 배제.*
  - 상태 패턴 → 현재 상태 입력받아 새 상태 반환(State 모나드).
- LSP/포스텔 법칙을 프로펑터로: 입력은 반공변(추상 상위/변환가능 허용), 출력은 공변(구체 타입) → 합성/재사용 극대화.

## 도메인 룰 = 이름 붙은 순수함수

- 도메인 룰은 `entities/<x>/lib/`에 **이름 붙은 순수함수 + 룰 docstring**으로 추출. 인라인 비교/하드코딩 금지.
- 함수 이름과 docstring만 봐도 룰이 드러나야 함([00-intent](00-intent.md)).
- 정전 예시 → [canonical-examples](canonical-examples.md):
  - `isSubCategory(categoryId, rootId) => categoryId !== rootId`
  - `defineKeyStore` 브랜디드 키 팩토리 + 순수 판별

→ 연관: [02-structure-cohesion](02-structure-cohesion.md)(도메인 룰 SSOT), [05-types](05-types.md)(합타입), [canonical-examples](canonical-examples.md)(실제 코드).
