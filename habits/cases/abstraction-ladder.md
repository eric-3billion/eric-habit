# 케이스 스터디: 공유 UI 추상화 사다리 (헤드리스 훅 → 컴파운드 → 필수 prop)

> [03-composition](../03-composition.md) "훅이냐 컴파운드냐 / 컴파운드냐 필수 prop이냐"의 실제 배경 사례.
> 한 줄 요약: **"나눠라"는 형태를 정하지 않는다. 소비처가 실제로 갈라지는 지점 + 조각의 필수·단일성으로 형태(훅/컴파운드/필수 prop)를 고른다. 접점마다 옵션이 번식하면 축이 틀린 것이고, 개수를 effect로 세고 싶어지면 필수 prop으로 올려야 한다는 신호다.**

이 문서 하나로 판단 프레임워크를 재현할 수 있게, 실제로 헤매며 지나온 갈림길을 순서대로 적는다.

---

## 상황 (Context)

드래그로 옮기고 크기를 조절하는 비차단형(non-modal) 다이얼로그가 필요했다. 소비처 5곳:

- Edit Variant / ROH Visualizer / Disease Information / AI Interpretation Basis — 네 개는 **큰 참조 패널**(드래그 + 리사이즈 + 위치·크기 localStorage 영속화 + 헤더에 제목·닫기)
- 파일 업로드 진행 위젯 — 우하단 **상주 패널**(드래그만, 리사이즈·영속화 없음, 리스트 접기 토글)

목표: 다섯을 관통하는 공유 컴포넌트를 만들되, **어떤 형태로 추상화할지**를 정하는 것.

각 조각의 성격:
- 드래그 이동 / 리사이즈 / 뷰포트 클램프 / 위치 영속화 = **메커니즘**(내부 연결이 복잡, 소비처가 매번 조립하면 복제됨)
- 헤더(제목 + 닫기 버튼 + 드래그 핸들 겸 `aria-labelledby` 대상) = **핵심·필수·단일** 조각
- 본문 = 소비처마다 완전히 다른 자유 콘텐츠

---

## 갈림길 1 — 훅이냐 컴파운드냐: "렌더가 다르냐 같냐"

첫 유혹: "유연하게 헤드리스 훅으로 빼자." `useAdjustableDialog()`가 드래그·리사이즈·위치 상태를 주고, 그리기는 소비처가.

```tsx
// ❌ 헤드리스 훅 — 소비처가 Draggable/Resizable/shell 조립을 매번 복제
function SomeDialog() {
  const d = useAdjustableDialog({ storageKey, defaultState });
  return (
    <Draggable {...d.drag}>
      <Resizable {...d.resize}>
        <div role="dialog" className="...박스 스타일...">{/* 4곳이 이걸 복붙 */}</div>
      </Resizable>
    </Draggable>
  );
}
```

**판단 질문: 소비처들이 같은 상태를 서로 다르게 렌더하나, 같은 렌더를 원하나?**

- 다르게 렌더(같은 정렬 상태를 테이블은 행으로, 차트는 축으로) → **헤드리스 훅**이 맞다.
- 같은 렌더를 원함 → **컴포넌트가 메커니즘을 소유**하고 소비처는 콘텐츠만 공급(컴파운드/조합).

여기 5곳은 전부 **같은 렌더**(드래그되는 fixed 박스 + 리사이즈 그립 + 동일 border/shadow)를 원한다. 헤드리스로 뒤집으면 드래그·리사이즈·클램프 **조립을 5벌 복제**한다 — 헤드리스는 이 경우 자유가 아니라 그냥 복제기다.

```tsx
// ✅ 컴포넌트가 메커니즘 소유, 소비처는 콘텐츠만
<AdjustableDialog storageKey={...} defaultState={...}>
  {/* 본문 */}
</AdjustableDialog>
```

→ **결론: 컴파운드/조합 방향.** (근거: [03-composition](../03-composition.md) ① 헤드리스 vs 컴파운드)

---

## 갈림길 2 — 컴파운드 계약을 닫아라: 내부 연결을 소비처에 떠넘기면 냄새

헤더는 소비처마다 제목·버튼이 다르니 슬롯으로 열어야 한다. 첫 시도는 `dragHandleId` 문자열 prop:

```tsx
// ❌ 열린 계약 — 소비처가 세 몫을 다 해야 드래그가 작동
<AdjustableDialog dragHandleId="edit-variant-handle">
  <header id="edit-variant-handle" className="cursor-move">  {/* id 직접 달고 */}
    <Title/><CloseButton/>
  </header>
  {/* id 오타 / cursor 누락 / 헤더 위치 실수 → 조용히 드래그 안 됨 */}
</AdjustableDialog>
```

소비처가 ① id를 내려주고 ② 그 id를 단 헤더 요소를 직접 만들고 ③ `cursor:move`까지 얹어야 드래그가 산다. 셋 중 하나만 틀려도 침묵의 고장. **계약이 열려 있어 어기기 쉽다.**

→ **컴파운드 슬롯이 그 연결을 내부에서 흡수해 계약을 닫는다.** id는 내부 `useId`로 생성해 context로 연결:

```tsx
// ✅ 닫힌 계약 — id 생성·드래그 연결·커서를 컴파운드가 내부 처리
<AdjustableDialog>
  <AdjustableDialog.Header>   {/* useId + context로 내부에서 연결, 소비처는 내용만 */}
    <Title/><CloseButton/>
  </AdjustableDialog.Header>
  {/* 본문 */}
</AdjustableDialog>
```

### 파생 함정: `useId` 값은 CSS 셀렉터로 못 쓴다

드래그 핸들을 react-draggable의 `handle`(CSS 셀렉터)로 지정해야 하는데, `useId()` 값(`:r0:`)은 콜론 때문에 셀렉터로 부적합(`#:r0:` 깨짐). → **역할을 쪼갠다**: `id`는 `aria-labelledby` 전용, 드래그 핸들 매칭은 고정 **data 속성**(`[data-adjustable-dialog-handle]`)으로.

→ **결론: 내부 연결을 흡수한 컴파운드로 계약을 닫았다.** (근거: [03-composition](../03-composition.md) ② 계약을 닫아라, [00-intent](../00-intent.md) 닫힌 계약 = 예측가능)

---

## 갈림길 3 — 컴파운드도 cardinality는 못 막는다: effect 유혹을 경계하라

컴파운드는 *내부 연결*(id 맞추기·이벤트·커서)은 닫았지만 **개수(cardinality)는 못 닫는다.** `children` 슬롯은 본질적으로 위치 기반·개수 자유라, 소비처가 `.Header`를 **0개(빠뜨림)** 또는 **2개(중복)** 써도 컴파일러가 못 잡는다.

- 0개 → 드래그 핸들·`aria-labelledby` 대상이 없어 **조용히 드래그가 죽고** 접근성이 깨진다.
- 2개 → 같은 `id`가 둘 → **DOM에 중복 id**(잘못된 HTML) + 드래그 핸들 둘.

여기서 나온 오답 유혹: "개발 모드에서 `.Header` 개수를 세서 경고하자."

```tsx
// ❌ 개수를 세려면 렌더 후 실제 DOM을 뒤져야 한다 = effect (또는 ref 콜백)
function DialogShell({ children }) {
  const ref = useRef();
  useEffect(() => {
    const n = ref.current.querySelectorAll("[data-adjustable-dialog-handle]").length;
    if (n !== 1) console.error(`Header는 정확히 1개여야 함, 현재 ${n}개`);
  });
  // 렌더 후 DOM 조회 = 파생상태를 손으로 확인하는 effect. 증상 땜빵.
}
```

`children` 안 아무 깊이에나 있을 수 있어 렌더 중엔 못 센다 → 반드시 렌더 후 DOM 조회 = **effect/ref-callback**. 이건 [01-component-design](../01-component-design.md) "effect는 최후" 원칙 위반이고, **개수 강제라는 문제를 메커니즘(effect)으로 우회**하는 것이다.

**신호: 개수를 런타임에 세서 warn/throw하고 싶어지면, 슬롯의 형태가 틀렸다는 뜻이다.** children 컴파운드가 감당 못 하는 걸 effect로 떠받치지 말고, 조각을 한 단계 위로 올려라.

---

## 갈림길 4 — 핵심·필수·단일 조각이면 필수 prop(render prop/슬롯)으로 올려라

헤더는 이 컴포넌트의 **핵심 기능**(없으면 드래그가 죽는 유일 조각)이다. 그러면 children 컴파운드가 아니라 **필수 prop**으로 받는다. 컴포넌트가 그 prop을 내부에서 **정확히 한 번** 렌더하면 "존재·유일성"이 **타입 레벨에서 보장**된다 — effect도 런타임 카운트도 불필요.

```tsx
// ✅ 필수 prop — title 없으면 타입 에러, 2개는 애초에 불가능
<AdjustableDialog
  title="Edit Variant"       // 필수 → cardinality를 타입이 보장
  onClose={close}            // 표준 닫기(X) 버튼을 컴포넌트가 렌더
  headerActions={<CommentButton/>}  // 제목 오른쪽 추가 버튼만 선택 슬롯
>
  {/* 본문 */}
</AdjustableDialog>
```

**공짜 보너스**: 헤더 마크업이 컴포넌트로 올라오면서, 소비처마다 제각각이던 것이 **SSOT로 수렴**한다. 슬롯이던 시절엔 한 곳은 제목을 `subtitle1`, 한 곳은 `subtitle2`, 패딩·닫기 버튼 크기도 제각각 → 나란히 놓으면 헤더가 다 달라 보였다. 필수 prop으로 올리니 제목 타이포·닫기 버튼·패딩을 컴포넌트가 소유해 **전 다이얼로그가 자동으로 균일**해진다.

### 경계선: 언제 컴파운드고 언제 필수 prop인가

- **자유 배치·반복·선택적** 슬롯(카드 안에 아무거나) → **컴파운드**가 맞다("JSX=화면"). 위 `headerActions`가 이 경우.
- **필수이고 정확히 하나여야 하는 핵심 조각** → **필수 prop**. 위 `title`이 이 경우.
- "컴파운드로 뚫기엔 너무 핵심"이면 후자. 이건 갈림길 1의 "훅이냐 컴파운드냐"와 **직교**하는 축이다 — 여기선 **조각의 필수성·단일성**으로 가른다.

→ **결론: 핵심·필수·단일 헤더는 필수 prop, 선택·복수 액션은 슬롯.** (근거: [03-composition](../03-composition.md) ②-b, [05-types](../05-types.md) 필수 prop = cardinality를 타입으로 보장)

---

## 갈림길 5 (직교) — 애초에 같은 가족이 맞나: 축이 틀렸다는 냄새

파일 업로드 위젯을 위 `AdjustableDialog`에 "리사이즈만 끈 버전"으로 욱여넣으려 했다. 그 순간 접점마다 옵션이 번식했다:

```tsx
// ❌ "기능 유무(리사이즈)" 축으로 갈라 하나에 옵션을 달기 시작 → 번식
<AdjustableDialog
  resizable={false}              // 리사이즈 끄기 옵션
  defaultPosition={(vp) => ...}  // 우하단 앵커 때문에 위치를 함수로
  className="z-[var(--z-floating)]"  // z층이 달라 구멍
/>
// + 크기가 콘텐츠라 측정 훅(useMeasuredSize) 신설, persist 포맷도 분기…
```

`resizable` boolean, 함수형 `defaultPosition`, 목적 불명 `className`, 측정 훅 — 경계마다 옵션·보정이 자라면 **나눈 축이 틀린** 신호다.

**진짜 축은 "리사이즈 유무"가 아니라 "위치의 주인이 누구냐"였다:**

- **사용자 소유 창(window)**: 사용자가 배치를 관리 → 자유 드래그, 위치·크기 **persist**, 복원 시 뷰포트 클램프, z-modal. = `AdjustableDialog`. 소비처 4곳이 완전히 같은 요구.
- **시스템 소유 상주 패널(docked panel)**: 시스템이 배치 → **CSS 앵커**가 위치의 SSOT, 드래그는 "잠깐 밀어두는" 일시 오프셋, persist는 **개념적으로 틀림**(저장하는 순간 앵커가 죽어 다른 모니터에서 엉뚱한 위치). z-floating, 크기는 콘텐츠. = 파일 업로드 위젯.

이 기준으로 보면 파일 업로드는 "AdjustableDialog 마이너스 리사이즈"가 **아니라 다른 종**이다. 공유하는 건 드래그와 박스 뿐. → 억지 공유를 접고 로컬 구현(CSS 앵커 + `Draggable` 직접)으로 되돌렸다.

**그리고 표본이 하나뿐이면 추출하지 않는다(rule of three).** "드래그 전용 창"의 두 번째 실사용이 나타날 때 공통 축이 드러난다. 표본 1개로 그은 축은 대개 틀린다.

→ **결론: 리사이즈 유무가 아니라 위치 소유권이 축. 표본 1개는 추출 보류.** (근거: [03-composition](../03-composition.md) ③ 축이 틀렸다는 냄새 + rule of three)

---

## 판단 순서 (Decision flow)

```
공유 UI가 필요하다
        │
        ▼
① 소비처들이 애초에 같은 종인가?  ──── 아니오(접점마다 옵션 번식) ──▶ 축을 다시 그어라(기능 유무 ✕, 실제 갈리는 지점 ○). 별개 컴포넌트 둘.
        │ 예                                                        표본 1개면 추출 보류(rule of three).
        ▼
② 소비처들이 같은 상태를 다르게 그리나?
        │ 예 ─────────────────────────────────────────────▶ 헤드리스 훅
        │ 아니오(같은 렌더)
        ▼
   컴포넌트가 메커니즘 소유 (컴파운드/조합)
        │
        ▼
③ 각 조각을 어떻게 받나?
   ├─ 자유 배치·반복·선택적 조각 ───────────▶ children 컴파운드 슬롯 (내부 연결은 흡수해 계약을 닫아라)
   └─ 핵심·필수·정확히 하나여야 하는 조각 ──▶ 필수 prop(render prop/슬롯) — cardinality를 타입으로 보장
                                              (개수를 effect로 세고 싶어지면 여기로 올려야 한다는 신호)
```

## 오답 신호 모음 (Smells)

- **헤드리스 훅으로 뺐는데 소비처마다 같은 조립을 복붙** → 훅이 아니라 컴파운드였다.
- **소비처가 값을 내려주고 + 그 값에 맞는 요소를 자기 손으로 만들어야 함**(id 문자열 등) → 열린 계약. 컴파운드가 내부에서 흡수해 닫아라.
- **children 조각의 개수를 런타임(effect/DOM 조회)으로 세고 싶다** → children 컴파운드로는 cardinality를 못 막는다. 필수 prop으로 올려라.
- **접점마다 boolean·보정 prop·이중 의미 className이 자란다** → 나눈 축이 틀렸다. "기능 유무"가 아니라 소비처가 실제 갈리는 지점으로 다시 그어라.
- **한 조각(제목 등)의 스타일이 소비처마다 미묘하게 다르다** → 그 조각은 컴포넌트가 소유(필수 prop)해 SSOT로.

## 최종 형태

```tsx
// 사용자 소유 창 — 메커니즘은 컴포넌트, 핵심(제목/닫기)은 필수 prop, 부가 액션만 슬롯
<AdjustableDialog
  storageKey="edit-variant-dialog"
  defaultState={{ position, size }}
  title="Edit Variant"
  onClose={close}
  headerActions={optionalButton}   // 선택·복수 → 슬롯
>
  {/* 본문 */}
</AdjustableDialog>

// 시스템 소유 상주 패널 — 다른 종. 억지로 공유하지 않고 로컬 구현.
<Draggable axis="y" bounds="parent">
  <FloatingUploadPanel />   {/* CSS 우하단 앵커, persist 없음 */}
</Draggable>
```

---

→ 연관: [03-composition](../03-composition.md)(형태 선택의 룰), [00-intent](../00-intent.md)(닫힌 계약=예측가능), [01-component-design](../01-component-design.md)(effect는 최후), [05-types](../05-types.md)(필수 prop=cardinality 타입 보장), [02-structure-cohesion](../02-structure-cohesion.md)(변경의 소스 위치가 축을 정한다).
