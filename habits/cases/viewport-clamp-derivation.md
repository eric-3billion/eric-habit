# 케이스 스터디: 환경값 보정을 effect 동기화로 짰다가 파생으로 되돌린 사례

> [01-component-design](../01-component-design.md) §6 "파생상태를 useEffect로 손 동기화 금지"와
> [02-structure-cohesion](../02-structure-cohesion.md) "소스 → 파생 단방향"의 실제 배경 사례.
> 한 줄 요약: **뷰포트 같은 외부 환경값에 반응하는 보정은 이벤트 리스너 + state 덮어쓰기가 아니라,
> 환경값을 리액티브 소스로 승격(`useSyncExternalStore`)한 뒤 렌더 중 파생으로 푼다.**

---

## 상황 (Context)

드래그 이동 + 크기 조절이 되는 비차단 다이얼로그(AdjustableDialog).
위치/크기는 localStorage에 영속되어 다음 세션에 복원된다.

버그: 큰 모니터에서 크게/아래쪽에 저장해두고 작은 창에서 열면(또는 창을 줄이면)
**하단 리사이즈 핸들이 화면 밖으로 밀려나 다시 줄일 수단이 없어진다.**

---

## 1차 접근 (Detour) — effect + 리스너 + state 덮어쓰기

"창이 줄면 위치를 보정한다"를 그대로 코드로 옮겼다:

```tsx
// ❌ 클램프 결과를 위치 state에 덮어쓰는 동기화
const [position, setPosition] = useState(defaultPosition);

useLayoutEffect(() => {
  const keepInViewport = () => {
    const { width, height } = nodeRef.current.getBoundingClientRect();
    setPosition(prev => clampPositionToViewport(prev, { width, height }, viewport()));
  };
  keepInViewport(); // 마운트 시 1회 보정 (지난 세션 위치가 화면 밖일 수 있음)
  window.addEventListener("resize", keepInViewport);
  return () => window.removeEventListener("resize", keepInViewport);
}, []);
```

동작은 했지만 냄새가 쌓였다:

| 냄새 | 정체 |
|---|---|
| 클램프가 **사용자 의도(state)를 덮어씀** | 창을 다시 키워도 원위치로 못 돌아감 — 의도가 소실됨 |
| "마운트 시 1회 보정" 특수 케이스 | 파생이면 존재할 이유가 없는 코드 |
| DOM 실측(`getBoundingClientRect`) 의존 | 렌더 결과를 다시 읽어 state로 넣는 역류 |
| **주석이 거짓말하기 시작** | "창을 되돌리면 저장 위치로 복귀" — 실제론 다음 마운트에서만 참 |

> 마지막 줄이 경고 신호였다: **설계가 어긋나면 주석이 먼저 거짓말한다.**
> 동작을 정확히 서술하려는데 문장이 자꾸 길어지고 조건이 붙으면, 코드 구조를 의심하라.

---

## 해결 (Solution) — 소스 승격 + 렌더 중 파생

소스와 파생을 다시 그렸다:

- **소스 ①**: 저장된 위치/크기 = *사용자 의도* (localStorage, 드래그/리사이즈 stop에만 갱신)
- **소스 ②**: 뷰포트 크기 = *환경값* — `useSyncExternalStore`로 렌더에서 읽는 리액티브 값으로 승격
- **파생**: 표시 위치 = `clamp(의도, 크기, 뷰포트)` — 렌더 중 순수 계산, state 없음

```tsx
// ✅ 환경값을 리액티브 소스로 승격 — effect도 거울 state도 없다
export function useViewportSize(): Size {
  const width = useSyncExternalStore(subscribeToWindowResize, () => window.innerWidth);
  const height = useSyncExternalStore(subscribeToWindowResize, () => window.innerHeight);
  return { width, height };
}

// ✅ 표시 위치 = 저장 위치의 뷰포트 클램프 파생값 (orchestrator에서 한 번)
const viewport = useViewportSize();
const position = clampPositionToViewport(drag.position, resize.size, viewport);
```

결과:
- 창을 다시 키우면 **저장 위치로 자동 복귀** — 의도를 안 덮어쓰니 공짜로 얻어짐
- "마운트 시 1회 보정" 케이스 **소멸** — 첫 렌더도 그냥 파생이므로
- DOM 실측 제거 — 클램프 룰(`max(0, …)`)이 저장 크기만으로 같은 결과를 보장함을 증명하고 docstring에 명시
- 드래그 레이어는 controlled + stateless로 단순해짐

### 덤: 보정의 절반은 React 밖에서

높이 클램프는 리스너조차 필요 없었다 — re-resizable의 `maxHeight`는 인라인 `max-height`로
적용되므로 `maxHeight="100vh"` 한 줄이면 창 축소 시 **CSS가 알아서** 다이얼로그를 줄인다.

> 보정 메커니즘의 우선순위: **CSS(공짜) → 렌더 중 파생(순수) → 이벤트 구독(useSyncExternalStore) → effect(최후)**.
> effect까지 내려갈 일은 생각보다 드물다.

---

## 핵심 교훈

1. **사용자 의도와 표시값을 분리하라.** 보정(클램프·스냅·제한)이 의도 state를 직접 덮어쓰면
   의도가 소실되고 "되돌리기"가 불가능해진다. 의도는 소스로 보존, 보정은 파생으로.
2. **외부 환경값은 `useSyncExternalStore`로 승격하면 파생이 가능해진다.**
   "리스너 + setState"는 환경값을 거울 state로 복제하는 것 — 01의 거울 state 금지가 환경값에도 그대로 적용된다.
3. **주석이 거짓말하기 시작하면 구조를 의심하라.** 정확히 서술하려는데 단서 조항이 붙기 시작하는 건
   동작이 예측 불가능해졌다는 신호다 ([00-intent](../00-intent.md)).
4. **가장 싼 메커니즘부터.** CSS로 되는 보정에 JS를 쓰지 말 것.

→ 연관: [cases/change-source-of-truth](change-source-of-truth.md)(같은 뿌리 — 메커니즘이 아니라 소스 위치를 고쳐라),
[01-component-design](../01-component-design.md), [02-structure-cohesion](../02-structure-cohesion.md).
