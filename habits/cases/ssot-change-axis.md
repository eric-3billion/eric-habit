# 케이스 스터디: "커다란 비즈니스 트리 하나" SSOT 오개념을 변경 축 단위로 교정한 사례

> [02-structure-cohesion](../02-structure-cohesion.md) "SSOT의 범위 — 트리는 하나가 아니라 변경 이유마다 하나"의 실제 배경 사례.
> 한 줄 요약: **SSOT는 규칙을 한 트리에 모으는 게 아니라, 규칙 하나마다 주인을 하나로 만드는 것.
> "같은 종류"로 묶인 상수들은 같은 축인지부터 의심하고, 축은 사람이 긋고 경계 수호는 기계에 맡긴다.**

출처: 토스 프론트엔드 모의고사 디스커션에서 받은 피드백
(https://github.com/toss-fe-interview/frontend-fundamentals-mock-exam-1/discussions/80)

---

## 상황 (Context)

저축 계산 페이지의 비즈니스 로직을 SSOT로 중앙화하려던 설계 질문. 당시 구조:

```
SavingsCalculatorPage/
├── constants/config.ts      # 비즈니스 설정값
├── constants/ui.ts          # UI 레이블
└── utils/
    ├── calculations.ts      # 순수함수
    └── productFilter.ts     # 필터링 로직
```

```ts
// constants/config.ts — "비즈니스 설정값" 한 파일
export const TERM_VALUES = [6, 12, 24] as const;
export const INTEREST_RATE_MULTIPLIER = 0.5;
export const RECOMMENDED_PRODUCTS_COUNT = 2;
```

당시 멘탈 모델: **"모든 설정값·규칙을 비즈니스라는 커다란 트리 하나로 만들면,
변경이 닿는 범위에 전부 전파되고 타입·lint가 오용을 다 잡아줘서 휴먼에러가 방지된다."**
질문도 그 프레임이었다 — "이걸 constants/utils로 나눌까(옵션 1), business 폴더 하나로 모을까(옵션 2)?"

---

## 교정 (Feedback) — 질문의 프레임 자체가 틀렸다

피드백의 핵심: **SSOT는 "한 폴더에 모으기"가 아니라 "각 규칙의 변경 이유와 소유 지점을 하나로 통일"하는 것.**
어느 폴더냐를 묻지 말고 "이 규칙이 바뀌면 몇 파일을 고치냐"를 물어라.

그 눈으로 `config.ts`를 다시 보면 세 상수는 전부 **다른 축**이다:

| 상수 | 바뀌는 이유 (축) | 올바른 자리 |
|---|---|---|
| `TERM_VALUES` | 상품 기획 변경. UI·검증·API가 공유 | 도메인 정책으로 **공개** |
| `INTEREST_RATE_MULTIPLIER` | 이자 계산식 변경. 계산 함수만 사용 | 그 함수 옆 **비공개** 상수 |
| `RECOMMENDED_PRODUCTS_COUNT` | 화면 요구 변경. 호출자마다 다를 수 있음 | 상수가 아니라 **함수 인자** |

변경 이유가 다른 셋을 "설정값"이라는 **종류**로 묶어놨던 것.
`utils/`·`core/`·`logic/`도 같은 병 — 종류 기준 폴더는 변경 이유가 다른 코드가 쌓이는 dumping ground가 된다.

```ts
// ✅ 변경 축별 모듈 — 규칙 하나 = 주인 하나
// domain/interest.ts
const SIMPLE_INTEREST_WEIGHT = 0.5;   // 구현 세부 → export 안 함

export function calculateExpectedAmount(
  monthlyAmount: number,
  termMonths: number,
  annualRatePercent: number,
) {
  return monthlyAmount * termMonths *
    (1 + annualRatePercent / 100 * SIMPLE_INTEREST_WEIGHT);
}
```

### 디테일: 개명이 축 경계를 지킨다

피드백 코드는 상수를 옮기기만 한 게 아니라 `INTEREST_RATE_MULTIPLIER` → `SIMPLE_INTEREST_WEIGHT`로 **개명**했다.
메커니즘 이름(이자율 곱셈 계수)은 아무 이자 규칙에나 붙을 수 있어서, 나중에 복리 계산이 "어 계수 이미 있네" 하고
재사용하는 순간 두 축이 상수 하나를 공유하게 된다(축 오염). 단리 소유를 이름에 박으면 그 문이 미리 닫힌다.

---

## 핵심 교훈

1. **SSOT의 두 축.** 수직(소스 → 파생 전파)만으로는 반쪽이다. 수평(트리의 범위를 변경 이유로 긋기)이 없으면
   "전부 파생시키겠다"는 선의가 전역 god config를 만든다. 전파 범위는 넓히는 게 아니라 규칙마다 정확하게 긋는 것.
2. **같은 축인지 의심하라.** 종류(설정값/상수/유틸)로 묶인 곳은 거의 확실히 여러 축이 섞여 있다.
   진단 질문: "이 두 값이 같은 이유로, 같은 시점에 바뀌는가?"
3. **기계 검증의 분업.** 타입·lint가 잡는 건 경계 안의 오용(참조·형태)이고, 경계 자체(변경 이유가 같냐, 주인이 누구냐)는
   원리적으로 못 잡는다 — 리소스 문제가 아니다. 축은 사람이 긋고, 그어진 경계는 기계(모듈 공개 API, import 제한)가 지킨다.
4. **당시에도 불편함은 느꼈다.** 작업 후 뭔가 어긋난 느낌에 폴더 구조(수직적 도메인룰 트리)로 해결하려 했지만,
   애초에 축이 하나가 아니었으니 어떤 폴더 구조로도 깔끔하게 떨어질 수 없었다.
   구조 재배치로 안 풀리는 불편함은 축이 잘못 그어졌다는 신호다 (cf. [change-source-of-truth](change-source-of-truth.md) — 메커니즘이 아니라 소스 위치를 고쳐라, 와 같은 뿌리).

→ 연관: [02-structure-cohesion](../02-structure-cohesion.md)(SSOT 수직·수평 축), [00-intent](../00-intent.md)(이름의 구체성 = 예측가능성),
[03-composition](../03-composition.md)(rule of three — 두 번째 소비처가 나타날 때 승격), [04-functional-domain](../04-functional-domain.md)(도메인 룰 = 이름 붙은 순수함수).
