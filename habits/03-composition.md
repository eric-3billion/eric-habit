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

## 변경 전파 최소화 (blast radius)

- 컴포넌트(특히 모달)는 **자기 데이터를 내부에서 조달**.
- 바깥에서 여러 정보를 조합해 만들어 넘기면, 열림/닫힘 **생명주기에 외부 요인이 끼어 사이드이펙트 폭발**. 변경 전파 범위를 자기 안으로 가둔다.

## 중간 핸들러 금지 (같은 원칙)

- 부모가 형제 조율용 state·콜백을 소유하지 말 것. 로직(API 호출 등)·데이터 fetch는 **실제 쓰는 자식이 직접**.
- 부모는 "무엇을 보여줄지(step/구조)"만, "어떻게 동작하는지(로직)"는 각 자식이 소유.
- 서버 데이터도 prop 주입 대신 해당 컴포넌트가 직접 `useSuspenseQuery`.

→ 연관: [01-component-design](01-component-design.md), [00-intent](00-intent.md).
