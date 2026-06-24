# 케이스 스터디: 변경의 소스를 잘못된 위치에 둬서 생긴 결합

> [02-structure-cohesion](../02-structure-cohesion.md) "변경의 소스(SSOT)를 위에서 선언, 나머지는 파생"의 실제 배경 사례.
> 한 줄 요약: **증상(콜백 주입·동기화)을 고치려 메커니즘을 갈아끼우지 말고, "변경의 소스가 어디 있나"를 의심하라.**

---

## 상황 (Context)

서버사이드 NGS 샘플 테이블:
- 필터 / 정렬 / 페이지네이션을 **서버사이드**로 처리 (TanStack Table manual 모드)
- 행 **선택**(체크박스) → 일괄 처리(batch update)
- 헤더의 **myPage 토글**, URL의 **project** 등으로도 보는 집합이 바뀜

요구사항: **"보는 결과 뷰가 바뀌면(필터/정렬/페이지/myPage 변경) 행 선택을 비운다."**

이 화면에서 "현재 보는 뷰"를 정의하는 값들의 합 = `params`
(`filter + sort + page + pageSize + myPage + project`). 이게 **데이터·선택·카운트 모든 것의 기반(변경의 소스)**이다.

---

## 문제 (Problem)

변경의 소스인 `params`가 **데이터 훅 안에 갇혀** 있었다. 그래서 "뷰가 바뀌면 선택을 비운다"를 풀 기준점이 위(orchestrator)에 없었고, 그 빈자리를 **콜백을 위로 주입**해서 메웠다.

```tsx
// ❌ Before — params 가 useNgsOverviewTableData 내부에 갇힘
function NgsSamplesTable() {
  const selection = useSampleSelection();

  const { state, handlers } = useServerTableState({
    tableId, columns, initialSorting,
    onViewChange: selection.reset,        // ← 콜백 주입: 테이블 상태 훅이 'selection' 을 알아야 함
  });

  // params 를 여기 내부에서 만든다 → 소스가 아래에 갇혀 위에서 못 씀
  const { tableData } = useNgsOverviewTableData({
    columnFilters: state.columnFilters, sorting: state.sorting, pagination: state.pagination,
  });

  return (
    <>
      {/* reset 이 여기저기 prop 으로 흩뿌려짐 */}
      <NgsStatusHeader onMyPageToggle={() => { resetPagination(); selection.reset(); }} />
      <BatchUpdate selectedSamples={selectedSamples} onUpdateEnd={selection.reset} />
    </>
  );
}
```

이 한 줄(`onViewChange: selection.reset`)이 만든 똥냄새:
- `useServerTableState`가 selection 관심사를 떠안음 → **다른 테이블에서 재사용 불가**
- "언제 reset 되는지"가 훅 내부에 숨음 → **예측 불가**
- `reset`을 header·batch에 **prop으로 흩뿌림** → 만지기 어려움

---

## 헛다리 (Detours) — 메커니즘만 바꾼 우회들은 다 실패

소스 위치는 그대로 두고 "비우는 방법"만 바꿔봤지만 전부 더 더러워졌다:

| 시도 | 왜 죽었나 |
|---|---|
| zustand / `useSyncExternalStore` | epoch 카운터 안티패턴, store↔store 배선, 과한 추상화 |
| context + Provider | 재사용 컴포넌트는 구독시키면 안 됨 → 이점 0, View 분리로 prop drilling |
| `getRowId` 합성키 | getRowId에 숨은 부수효과 + 키 누적 |
| viewKey **직렬화** | 직렬화 자체가 의도 흐림 |
| 비움 로직 **제거**(누적 허용) | 페이지 왕복·필터 겹침 시 선택 부활 |

→ **교훈: 우회로가 자꾸 더 더러워지면, 메커니즘이 아니라 구조(소스의 위치)가 틀린 것이다.**

---

## 해결 (Solution)

**`params`(변경의 소스)를 orchestrator 위로 끌어올려 SSOT로 선언하고, 데이터·선택을 전부 그 파생으로 만든다.**

```tsx
// ✅ After — 소스를 위에서 선언, 나머지는 파생 (state → params → 데이터·선택)
function NgsSamplesTable() {
  const { state, handlers, resetPagination } = useServerTableState({   // selection 무지 = 범용
    tableId, columns, initialSorting,
  });

  // 현재 뷰의 기반 정보(SSOT)를 한 번 선언
  const params = useNgsOverviewServerParams({
    columnFilters: state.columnFilters, sorting: state.sorting, pagination: state.pagination,
  });

  const selection = useSampleSelection(params);          // params 파생 — 뷰 바뀌면 스스로 비움
  const { tableData } = useNgsOverviewTableData(params); // params 파생

  return (
    <>
      <NgsStatusHeader onMyPageToggle={resetPagination} />            {/* selection 은 자동 */}
      <BatchUpdate selectedSamples={selectedSamples} onUpdateEnd={selection.reset} /> {/* reset 은 batch 명시 클리어만 */}
    </>
  );
}
```

선택 비움은 콜백 주입이 아니라, selection 훅이 **소스(viewToken)의 변경을 스스로 감지**한다:

```tsx
export function useSampleSelection(viewToken: NgsOverviewServerParams) {
  const [rowSelection, setRowSelection] = useState(EMPTY_SELECTION);

  // 뷰(viewToken)가 바뀌면 렌더 중 보정으로 비운다.
  // useEffect(거울 동기화)도 viewKey 직렬화도 아닌, React 공식 '직전 렌더 값 저장' 패턴.
  const [prevViewToken, setPrevViewToken] = useState(viewToken);
  if (prevViewToken !== viewToken) {
    setPrevViewToken(viewToken);
    if (Object.keys(rowSelection).length > 0) setRowSelection(EMPTY_SELECTION);
  }
  // ...selectedSamplesOf(rows), reset...
}
```

결과:
- 흐름이 **`state → params → (selection · data)`** 단방향 — "필터/소트가 모든 것의 기반"이 코드에 드러남
- `useServerTableState`는 selection을 1도 모름 → **범용**
- `onViewChange` 콜백 주입, prop 흩뿌림 **전부 사라짐**
- myPage·project도 `params`에 포함되므로 토글 시 자동으로 selection 비워짐(별도 처리 불필요)

---

## 핵심 교훈

1. **증상이 아니라 소스를 의심하라.** `onXChange` 콜백을 위로 주입하거나, 같은 정보를 여러 state로 복제해 동기화하고 있으면 → 변경의 소스가 아래에 갇힌 신호.
2. **소스는 위에서 한 번 선언, 나머지는 파생.** 소스→파생 단방향.
3. **"외부값 변경 → state 리셋"은 `useEffect`가 아니다.** 그건 외부 시스템 동기화가 아니라 *파생 상태 조정* → `key` 또는 **렌더 중 보정**. (effect로 하면 commit 후 실행이라 옛 상태가 한 프레임 보이는 깜빡임 + 렌더 1회 추가.)

→ 연관: [00-intent](../00-intent.md), [01-component-design](../01-component-design.md)(렌더중보정), [03-composition](../03-composition.md)(중간 핸들러 금지).
