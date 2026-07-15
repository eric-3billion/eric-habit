# 03 · 조합 / 변경 전파 최소화

## 조합 우선: compound · render props · 명시적 슬롯 > prop 드릴링

- 재사용성을 위해 props를 막 뚫지(prop drilling) 말고 **컴파운드 컴포넌트 / 렌더 프롭스 / 명시적 슬롯**.
- `rightNode={<SomeComponent/>}` 처럼 슬롯으로 주입. 그냥 CSS로 처리해도 되는 것도 명시적 슬롯으로 둬서 **읽히게**.
- 목표: **컴포넌트의 JSX 부분만 봐도 실제 화면과 1:1 대응**(UI 이정표). prop을 잔뜩 뚫으면 화면 구조가 시그니처에 숨어 안 읽히고 수정이 전파됨.
- "만지기 쉬운 코드" — 슬롯/조합이라 한 군데만 바꿔도 됨.

```tsx
// ❌ 분기/렌더를 prop으로 제어
<Header showSearch hideAvatar rightLabel="..." rightOnClick={...} />
// ✅ 슬롯으로 화면을 JSX에 드러냄
<Header right={<SearchButton onClick={...} />} />
```

## 추상화는 실제 로직이 정당화할 때만 (얕은 포장 금지)

위 "조합/분리" 원칙의 **브레이크**다. 01·03은 "나눠라"만 말하는데, 그걸 곧이곧대로 받으면
**하는 일이 없는 껍데기**(래퍼 훅·래퍼 컴포넌트·context)를 만들고 "나눴으니 잘했지" 착각하게 된다.
쪼개라 ≠ **빈 간접 레이어를 만들어라.** 추상화는 공짜가 아니라 **실제 로직으로 값을 치러야 얻는 것**이다.

**"얕은 포장"이란**: 검증·파생 계산·fetch 같은 실질 로직 이동 없이, 기존 코드를 **이름만 바꿔 한 겹 감싸는 것.**
파일·레이어만 늘고 state가 어디 있는지 오히려 더 안 보인다.

```tsx
// ❌ 케이스 A — 이름만 바꾼 래퍼 훅. useState 2개를 감싸기만 하고 하는 일이 없음
function useOrderForm() {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  return { name, setName, qty, setQty }; // 검증도 계산도 없이 그대로 전달
}
// ❌ 케이스 B — 통과용 래퍼 컴포넌트. prop 받아 그대로 넘기기만 함
function OrderNameField({ value, onChange }) {
  return <><label>이름</label><input value={value} onChange={onChange} /></>;
}

// ✅ 얕으면 그냥 useState + 인라인. 부모 JSX만 봐도 화면이 그대로 보임(UI 이정표)
function OrderForm() {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  return (
    <>
      <label>이름</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {/* qty도 여기 인라인 */}
    </>
  );
}
```

**그래서 규칙:**

- 얕은 트리(깊이 1~2단)의 폼·모달에서 state를 공유해야 해도 → **`useState` + 명시적 prop이 기본.** context·래퍼 훅·payload 묶음 객체로 성급히 감싸지 말 것.
- **자기 로직(fetch·파생 계산·검증)을 소유할 때만** 훅·컴포넌트 분리가 정당하다. 로직 없이 prop만 통과시키면 부모에 인라인으로 되돌린다.
- 판단 질문 하나: **"이 레이어가 로직을 옮기나, 이름만 바꾸나?"** — 이름만 바꾸면 지운다.

(cf. [00-intent](00-intent.md) — 존재 이유를 이름이 설명 못 하는 추상화 금지)

## 나누기로 했으면 — 훅이냐 컴파운드냐, 어느 축이냐

얕은 포장(위 브레이크)을 통과해 **정말 추상화가 정당한 공유 UI**라면, 다음 질문은 "어떤 형태로 · 어느 축으로 나누냐"다.

**① 헤드리스 훅 vs 컴파운드 — 렌더가 다르냐 같냐로 가른다.**

- 소비처들이 **같은 상태를 서로 다르게 렌더** → 헤드리스 훅(로직만 주고 그리기는 소비처). 예: 같은 정렬/선택 상태를 테이블은 행으로, 차트는 축으로. (이건 위에서 금지한 얕은 포장 훅과 다르다 — 헤드리스 훅은 정렬/선택 계산이라는 실질 로직을 소유한다.)
- 소비처들이 **같은 렌더를 원함** → 컴포넌트가 메커니즘을 소유하고 소비처는 콘텐츠만 공급(조합/컴파운드). 훅으로 뒤집으면 그 메커니즘의 조립(예: 드래그·크기조절·위치저장 연결)을 소비처 N곳이 복제한다 — 헤드리스는 이 경우 자유가 아니라 그냥 복제기다.

```tsx
// ❌ 같은 렌더를 원하는 N곳인데 훅으로 뒤집음 → 조립을 N벌 복제
const d = useDraggableBox(...); // 소비처마다 <Draggable><Resizable>… 직접 조립
// ✅ 컴포넌트가 메커니즘 소유, 소비처는 콘텐츠만
<DraggableBox storageKey="...">…</DraggableBox>
```

**② (컴파운드를 골랐다면) 계약을 닫아라 — 내부 연결을 소비처에 떠넘기면 냄새.**

소비처가 prop을 내려주고 *동시에* 그 값에 맞는 요소를 자기 손으로 만들어야 하면, 계약이 열려 있어 어기기 쉽다. 예: 부모가 `handleId` 문자열을 컴포넌트에 내려주고 → 소비처가 그 id를 단 헤더 요소를 직접 만들고 → `cursor:move` 스타일까지 직접 얹어야 드래그가 작동한다. 세 몫 중 하나만 틀려도(id 오타 등) 조용히 깨진다. → **컴파운드 슬롯이 그 연결을 내부에서 흡수**(내부에서 id 생성해 context로 연결)해 계약을 닫는다. 소비처는 슬롯 하나로 끝 — 넘길 문자열도, 맞춰 만들 요소도 없다.

```tsx
// ❌ 열린 계약 — id 내려주고 + 그 id 단 요소 만들고 + cursor:move 까지 소비처 몫
<DraggableBox handleId="box-handle">
  <header id="box-handle" className="cursor-move">제목</header>
  {/* id 오타나 cursor 누락 시 드래그가 조용히 안 먹음 */}
</DraggableBox>
// ✅ 닫힌 계약 — id/드래그연결/커서를 컴파운드가 내부에서 처리
<DraggableBox>
  <DraggableBox.Header>제목</DraggableBox.Header>
</DraggableBox>
```

**③ 축이 틀렸다는 냄새 — 접점마다 옵션이 자란다.**

추상화에 소비처를 욱여넣으려고 경계마다 boolean·보정 prop·이중 의미 className이 자라면, 나눈 **축이 틀린** 신호다. "기능이 있냐 없냐"로 가르지 말고(예: "A만 하는 것 vs A+B 하는 것" — B를 옵션으로 끄고 켜다 옵션이 번식한다), **소비처들이 실제로 갈라지는 지점**으로 가른다. 그 지점을 찾으면 옵션 대신 별개 컴포넌트 둘로 갈리고 각자 단순해진다.

```tsx
// ❌ "기능 유무" 축 — 하나에 옵션을 달아 양쪽을 다 감당 → 옵션이 번식하고
//    급기야 서로 안 맞는 조합(고정인데 드래그 가능?)까지 생긴다 = 축이 틀린 증거
<Panel movable resizable={false} persistPosition={false} />
<Panel movable resizable persistPosition />
// ✅ 소비처가 실제 갈라지는 지점으로 별개 컴포넌트 둘. 각자 옵션 없이 단순
<AnchoredPanel />  {/* 고정 위치, 크기조절·이동 없음 */}
<FloatingWindow /> {/* 사용자가 옮기고 크기 조절, 위치 저장 */}
```

→ 단, 표본이 **하나뿐이면 아직 추출하지 마라(rule of three).** 두 번째 실사용이 나타날 때 공통 축이 드러난다 — 표본 1개로 그은 축은 대개 틀린다.

(cf. [00-intent](00-intent.md) — 닫힌 계약 = 예측가능; [02-structure-cohesion](02-structure-cohesion.md) — "변경의 소스" 위치가 축을 정한다)

## 변경 전파 최소화 (blast radius)

- 컴포넌트(특히 모달)는 **자기 데이터를 내부에서 조달**.
- 바깥에서 여러 정보를 조합해 만들어 넘기면, 열림/닫힘 **생명주기에 외부 요인이 끼어 사이드이펙트 폭발**. 변경 전파 범위를 자기 안으로 가둔다.

## 중간 핸들러 금지 (같은 원칙)

- 부모가 형제 조율용 state·콜백을 소유하지 말 것. 로직(API 호출 등)·데이터 fetch는 **실제 쓰는 자식이 직접**.
- 부모는 "무엇을 보여줄지(step/구조)"만, "어떻게 동작하는지(로직)"는 각 자식이 소유.
- 서버 데이터도 prop 주입 대신 해당 컴포넌트가 직접 `useSuspenseQuery`.

→ 연관: [01-component-design](01-component-design.md), [00-intent](00-intent.md).
