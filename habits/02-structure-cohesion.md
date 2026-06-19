# 02 · 구조 / 응집 / SSOT

## SSOT — 하드코딩·임시처리는 한 곳에

- 하드코딩·임시처리(temp/hack)를 했다면 **여기저기 흩지 말고 단일 모듈로 모아** 트래킹하기 좋게 (single source of truth).
- 매직 값(width, URL, sentinel 등)이 파일마다 흩어지면 → 한 모듈/상수로 모은다.

## 응집

- 관련된 게 여기저기 흩어지는 것 금지. 한 맥락에 필요한 건 모아둔다.

## 선언 = 의존성 순서

- 선언(테이블 컬럼 타입, 상수, 헬퍼 등)을 **의존성 순서대로**.
- **"의존성 역전"이 싫다 = 의존 방향·선언순서가 거꾸로인 것.**
  - 하위가 상위를 알거나, 쓰이는 것이 쓰는 것보다 늦게 선언되거나, 순환 의존.
  - ⚠️ SOLID DIP / IoC 컨테이너(Inversify 등) 얘기가 아님. 함수형 커링 DI는 오히려 권장([04-functional-domain](04-functional-domain.md)).

→ 연관: [00-intent](00-intent.md)(흩어지면 의도가 안 드러남), [04-functional-domain](04-functional-domain.md)(도메인 룰을 한 순수함수로).
