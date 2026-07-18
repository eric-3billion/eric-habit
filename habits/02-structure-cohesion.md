# 02 · 구조 / 응집 / SSOT

## 변경의 소스(SSOT)를 위에서 선언, 나머지는 파생

**"변경의 소스"란**: 이 화면에서 **그게 바뀌면 나머지가 전부 따라 바뀌는 값.** 보통 *사용자가 보는 뷰를 정의하는 값들*의 합이다 — 필터·정렬·페이지·모드 등. 데이터도, 행 선택도, 카운트도 다 이 값에서 나온다.

**규칙**: 이 소스를 **트리 위(orchestrator)에서 딱 한 번 선언**하고, 나머지(데이터·선택·카운트)는 전부 그 **파생**으로 둔다. 흐름은 **소스 → 파생 단방향.**

**소스를 아래에 가두면 무슨 일이 나나**: 소스를 하위 훅/컴포넌트 안에서 만들면, "소스가 바뀌면 선택도 비워야 해" 같은 걸 풀 기준점이 위에 없다. 그 빈자리를 두 가지 편법으로 메우게 된다 — ① **콜백을 위로 주입**하거나, ② **같은 정보를 딴 state로 복제해놓고 동기화.** 둘 다 결합·예측불가의 근원.

```tsx
// ❌ 소스(params)가 데이터 훅 안에 갇힘 → "뷰 바뀌면 선택 비우기"를 콜백 주입으로 메움
const { state } = useServerTableState({ onViewChange: selection.reset }); // ← 테이블 훅이 selection을 알아야 함
const { data } = useTableData({ ...state });  // params를 여기 내부에서 만듦 → 위에서 못 씀

// ✅ 소스(params)를 위에서 한 번 선언 → 선택·데이터 둘 다 그 파생
const params = useServerParams({ ...state });   // 변경의 소스 = SSOT
const selection = useRowSelection(params);      // params 바뀌면 스스로 비움 (콜백 주입 불필요)
const { data } = useTableData(params);          // params 파생
```

### 진단 휴리스틱 (냄새)

> `onXChange` 콜백을 자꾸 **위로 주입**하거나, 같은 정보를 여러 state로 **복제해 동기화**하고 있으면 → 변경의 소스가 엉뚱한 위치(아래)에 갇힌 신호다.

처방은 하나: **비우는 "방법"(메커니즘)을 갈아끼우지 말고, "소스의 위치"를 위로 끌어올려라.** store·context·합성키 같은 exotic한 우회는 대개 본질을 더 더럽힌다. (실제 사례 전문 — 헛다리 6개 포함 → [cases/change-source-of-truth](cases/change-source-of-truth.md))

→ 연관: [00-intent](00-intent.md)(소스가 갇히면 의도가 안 드러남), [03-composition](03-composition.md)(중간 핸들러 금지 — 같은 뿌리), [01-component-design](01-component-design.md)(외부값→state 리셋은 effect가 아니라 key/렌더중보정).

## SSOT의 범위 — 트리는 하나가 아니라 변경 이유마다 하나

위 절이 SSOT의 **수직 축**(소스 → 파생 단방향)이라면, 이 절은 **수평 축**: 그 트리의 범위를 어디까지로 긋느냐.

- SSOT는 "모든 규칙을 한 곳(전역 config, 커다란 비즈니스 트리)에 모으기"가 **아니다**. **사실 하나마다 주인이 정확히 하나**인 것이다. 트리가 클수록 전파 범위가 커지는 건 힘이 아니라 비용 — 좋은 SSOT의 기준은 "이 규칙이 바뀌면 파일 하나만 고치는가".
- **같은 축인지 의심하라.** "설정값"·"상수"·"유틸"처럼 **종류**로 묶인 파일에는 변경 이유가 다른 값들이 섞여 있기 마련이다.

  ```ts
  // ❌ 종류(설정값)로 묶임 — 세 값의 변경 이유(축)가 전부 다르다
  export const TERM_VALUES = [6, 12, 24] as const;   // 상품 기획이 바뀔 때
  export const INTEREST_RATE_MULTIPLIER = 0.5;       // 이자 계산식이 바뀔 때
  export const RECOMMENDED_PRODUCTS_COUNT = 2;       // 화면 요구가 바뀔 때
  ```

- 처방은 **변경 축별 모듈 + 노출은 의존 범위로**: 한 함수만 쓰는 값은 그 함수 옆 비공개 상수로, 여러 레이어(UI·검증·API)가 쓰면 도메인 정책으로 공개, 호출자마다 달라지는 값은 상수가 아니라 **함수 인자**로.
- **이름의 구체성이 축 경계를 지킨다.** `INTEREST_RATE_MULTIPLIER` 같은 메커니즘 이름은 아무 이자 규칙이나 재사용하게 만들어 축을 오염시킨다 → `SIMPLE_INTEREST_WEIGHT`처럼 소유 규칙을 이름에 박으면, 새 규칙(복리)이 생길 때 재사용 대신 새 상수를 만들게 된다 ([00-intent](00-intent.md)).
- **기계 검증과의 분업**: 타입·lint는 경계 **안의** 오용(참조·형태)을 잡지, 경계 자체("이 두 값이 같은 이유로 바뀌나")를 그어주지 못한다. 축은 사람이 긋고, 그어진 경계를 지키는 일(공개 API, import 규칙)을 기계에 맡긴다.
- 승격은 rule of three: 규칙은 feature 로컬 도메인 모듈에 두고, 두 번째 소비처가 나타날 때 상위로 올린다 ([03-composition](03-composition.md)).

(실제 배경 사례 — 전역 config 세 상수의 축 진단, 개명의 효과 → [cases/ssot-change-axis](cases/ssot-change-axis.md))

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
