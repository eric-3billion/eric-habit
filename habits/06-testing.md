# 06 · 테스트

기본기(일반 testing-library 상식 — 짧게): 전역 짧은 텍스트 조회 금지 → `within`/행·열 헤더로 스코프, role/접근성 쿼리 우선, `data-testid` 결합 지양. feature가 깨지면 확실히 잡히는 단언.

## 비자명한 것 (실제로 물렸던 것)

- **styled-component 중첩 CSS는 jsdom이 못 읽음** → `getComputedStyle` 대신 `toHaveStyle` 매처 사용.
- **mock이 쿼리 파라미터를 실제로 반영**해야 함 — 필터 파라미터를 받고도 안 쓰면 실제 분기를 가려 false confidence. 표본도 페이지네이션/정렬을 받칠 만큼 충분히.
- **도메인 용어 리네임 시 fixture placeholder string은 건드리지 않는다.**
- 분기·폴백(에러→retry 복구, N/A, 빈값 등) 커버리지 누락 주의.
- fixture/헬퍼 중복 지양(여러 파일 복붙) → 공유([02-structure-cohesion](02-structure-cohesion.md)).

→ 연관: [02-structure-cohesion](02-structure-cohesion.md).
