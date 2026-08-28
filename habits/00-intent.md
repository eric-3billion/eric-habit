# 00 · 의도 드러남 / 예측가능성 (최우선)

가장 싫어하는 것: **의도가 안 드러나는 코드, 예측 불가능한 코드.**

- 훅/함수/모듈 이름이 **반환값·동작을 정직하게 telegraph**해야 한다.
  - 예: `const [user, setUser] = useCurrentUser()` — 이름만 봐도 반환·동작이 뻔히 읽힘.
- innocent한 이름 뒤에 **숨은 부수효과/surprise 금지** (principle of least astonishment).
- **도메인 모듈·함수 단위로 의도를 표면화.** `format*`인데 분류/판정 로직을 숨기거나, `*Identity` 같은 거울 state처럼 왜 존재하는지 이름이 설명 못 하는 것 금지.
- **매직값·센티넬**(`-1`=N/A, `""`=unknown 등)은 네이밍 또는 주석으로 의미가 드러나게.

## 체크 질문

> 이 이름만 보고 동작·반환·부수효과를 예측할 수 있는가? 아니면 개명하거나 분해한다.

## 진단 — 의도가 안 드러날 때 나오는 증상 3종

표면이 달라도 같은 병이다: **코드가 의도를 못 드러내서 다른 수단이 대신 떠맡은 것.** 처방은 그 표면을 다듬는 게 아니라 구조를 고치는 것이다.

| 증상 | 실제 병 | 처방 |
|---|---|---|
| 설명 주석이 길어진다 | 이름·타입이 의미를 못 담음 | 파생값에 **이름**을 붙이거나 타입으로 좁힌다 |
| 몸통에 복잡한 삼항이 낀다 | 그 함수가 두 일을 함 | **쪼갠다**([01 §1](01-component-design.md)) |
| 정직한 이름이 안 떠오른다 | 경계가 틀림 | 이름을 짜내지 말고 **분해**한다 |

- **주석이 길어졌다는 것 자체가 신호다.** 내용이 정확한 주석이어도 **길면** 그 자리의 코드가 안 읽힌다는 뜻이다.
  - 단 이건 *설명* 주석에 대한 진단이다. **코드로는 볼 수 없는 제약**(호출 맥락 가정, 의도적 복제, 연동 지점)은 길어도 남긴다 — 그건 코드가 대신할 수 없다([canonical-examples](canonical-examples.md) `useProjectId`, [01 §7](01-component-design.md)).
- 제너럴한 이름(`*Query`·`*Info`·`*Data`)은 축 경계를 무너뜨린다([02-structure-cohesion](02-structure-cohesion.md)).
- 한 자리를 고쳤으면 **같은 증상을 레포 전체에서 훑는다** — 이 병은 한 군데서 끝나지 않는다.

## 안티 예시 (실제로 걸렸던 것)

- `queryIdentity` — "정체성"이라는데 실제론 *이전 쿼리 거울 state*. 이름이 존재 이유를 설명 못 함.
- `formatScore(-1 → "N/A")` — `format`인데 *결측 판정*을 숨김.
- `data-has-query` — DOM에 박힌 의도가 불명(읽는 곳도 없음).
- `isInteractiveRowClick` — "인터랙티브"의 정의가 셀렉터 안에 숨어 예측 불가.

## 긍정 예

`useProjectId`의 `= ""` 폴백은 **sentinel이 아니라 useParams partial 타입을 좁히기 위한 것**이고, 그 의도를 주석이 명시해 예측 가능하게 만든다. 코드 전문/주석 → [canonical-examples](canonical-examples.md).

→ 연관: [03-composition](03-composition.md)(JSX가 화면을 드러냄), [02-structure-cohesion](02-structure-cohesion.md)(SSOT).
