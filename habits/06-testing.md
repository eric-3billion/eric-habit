# 06 · 테스트

기본기(일반 testing-library 상식 — 짧게): 전역 짧은 텍스트 조회 금지 → `within`/행·열 헤더로 스코프, role/접근성 쿼리 우선, `data-testid` 금지. feature가 깨지면 확실히 잡히는 단언.

## 비자명한 것 (실제로 물렸던 것)

- **스타일·레이아웃 단언은 browser test(`*.browser.test.*`)에서 `getComputedStyle` 로 한다.** jsdom 은 Tailwind 클래스도 styled 중첩 CSS 도 계산하지 못하고, `toHaveStyle` 도 내부에서 같은 `getComputedStyle` 을 불러 jsdom 에서는 정확도가 같다.
- **mock이 쿼리 파라미터를 실제로 반영**해야 함 — 필터 파라미터를 받고도 안 쓰면 실제 분기를 가려 false confidence. 표본도 페이지네이션/정렬을 받칠 만큼 충분히.
- **도메인 용어 리네임 시 fixture placeholder string은 건드리지 않는다.**
- 분기·폴백(에러→retry 복구, N/A, 빈값 등) 커버리지 누락 주의.
- fixture/헬퍼 중복 지양(여러 파일 복붙) → 공유([02-structure-cohesion](02-structure-cohesion.md)). 단 공유는 **레이어 public API 안에서** — 다른 레이어의 mock-data 를 딥임포트하지 말고 소비 레이어 로컬 fixture 를 public 타입으로 세운다.

→ 연관: [02-structure-cohesion](02-structure-cohesion.md).
