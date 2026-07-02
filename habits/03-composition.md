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

## 변경 전파 최소화 (blast radius)

- 컴포넌트(특히 모달)는 **자기 데이터를 내부에서 조달**.
- 바깥에서 여러 정보를 조합해 만들어 넘기면, 열림/닫힘 **생명주기에 외부 요인이 끼어 사이드이펙트 폭발**. 변경 전파 범위를 자기 안으로 가둔다.

## 중간 핸들러 금지 (같은 원칙)

- 부모가 형제 조율용 state·콜백을 소유하지 말 것. 로직(API 호출 등)·데이터 fetch는 **실제 쓰는 자식이 직접**.
- 부모는 "무엇을 보여줄지(step/구조)"만, "어떻게 동작하는지(로직)"는 각 자식이 소유.
- 서버 데이터도 prop 주입 대신 해당 컴포넌트가 직접 `useSuspenseQuery`.

→ 연관: [01-component-design](01-component-design.md), [00-intent](00-intent.md).
