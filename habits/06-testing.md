# 06 · 테스트

## 단언은 스코프 안에서

- 전역 `getByText("100")` 처럼 짧은 텍스트를 범위 없이 조회 금지 → 다른 셀과 우연 매칭.
- `within(table/row)` 또는 행·열 헤더로 좁혀 "그 셀"을 단언. **feature가 깨지면 확실히 잡히게.**

## 구현 디테일 결합 금지

- `data-testid` 등 구현 디테일에 결합하지 말고 role/접근성 쿼리 우선.
- styled-component 중첩 CSS는 jsdom이 못 읽음 → `toHaveStyle` 매처 사용.

## Mock 충실도

- mock 핸들러가 **쿼리 파라미터를 실제로 반영**해야 함. 필터 파라미터를 받고도 안 쓰면(예: category) 실제 분기를 가려 false confidence.
- 표본이 페이지네이션/정렬 테스트를 받칠 만큼 충분한지.

## 커버리지 / fixture

- 분기·폴백(에러→retry 복구, N/A, 빈값, 옵션별 분기 등) 케이스를 빠뜨리지 않는다.
- fixture/헬퍼 중복 지양(여러 파일에 같은 데이터 복붙) — 공유로([02-structure-cohesion](02-structure-cohesion.md)).
- 도메인 용어 리네임 시 테스트 fixture의 placeholder string은 건드리지 않는다.

→ 연관: [02-structure-cohesion](02-structure-cohesion.md).
