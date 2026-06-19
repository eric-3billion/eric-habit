# 00 · 의도 드러남 / 예측가능성 (최우선)

가장 싫어하는 것: **의도가 안 드러나는 코드, 예측 불가능한 코드.**

- 훅/함수/모듈 이름이 **반환값·동작을 정직하게 telegraph**해야 한다.
  - 예: `const [user, setUser] = useCurrentUser()` — 이름만 봐도 반환·동작이 뻔히 읽힘.
- innocent한 이름 뒤에 **숨은 부수효과/surprise 금지** (principle of least astonishment).
- **도메인 모듈·함수 단위로 의도를 표면화.** `format*`인데 분류/판정 로직을 숨기거나, `*Identity` 같은 거울 state처럼 왜 존재하는지 이름이 설명 못 하는 것 금지.
- **매직값·센티넬**(`-1`=N/A, `""`=unknown 등)은 네이밍 또는 주석으로 의미가 드러나게.

## 체크 질문

> 이 이름만 보고 동작·반환·부수효과를 예측할 수 있는가? 아니면 개명하거나 분해한다.

## 안티 예시 (실제로 걸렸던 것)

- `queryIdentity` — "정체성"이라는데 실제론 *이전 쿼리 거울 state*. 이름이 존재 이유를 설명 못 함.
- `formatScore(-1 → "N/A")` — `format`인데 *결측 판정*을 숨김.
- `data-has-query` — DOM에 박힌 의도가 불명(읽는 곳도 없음).
- `isInteractiveRowClick` — "인터랙티브"의 정의가 셀렉터 안에 숨어 예측 불가.

## 긍정 예

`useProjectId`의 `= ""` 폴백은 **sentinel이 아니라 useParams partial 타입을 좁히기 위한 것**이고, 그 의도를 주석이 명시해 예측 가능하게 만든다. 코드 전문/주석 → [canonical-examples](canonical-examples.md).

→ 연관: [03-composition](03-composition.md)(JSX가 화면을 드러냄), [02-structure-cohesion](02-structure-cohesion.md)(SSOT).
