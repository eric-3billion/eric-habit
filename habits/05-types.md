# 05 · 타입

## 땜빵용 옵셔널 필드 남발 강혐

- 임시로 때우려고 interface에 `?` 옵셔널 필드를 막 붙이는 것 = **개싫어함.**
- 옵셔널은 "정말 없을 수 있다"는 의도일 때만. 땜빵이면 → **필수 필드 / 분리 타입 / 태그드 유니온**으로 의도를 드러낸다([00-intent](00-intent.md), [04-functional-domain](04-functional-domain.md)).
- 새로 붙은 `?` 필드는 "왜 옵셔널인지" 정당한지 항상 따진다.

## 타입 일관성

- (기본 위생) `as` 캐스트 · non-null `!` · `any` 지양 — 일반 TS 상식, 별도 설명 생략.
- **도메인 규약 일관성**: 같은 개념을 타입마다 다르게 표현 금지.
  - 예: API 버전을 한 타입은 `"v1"`, 다른 타입은 `"version-1"`로 이원화하면 표시·비교 로직이 갈라지고 의도가 흐려짐.
- DTO→model 매퍼는 경계에서 정규화하되, 무음 데이터 변형(빈값 제거 등)은 의도를 주석/네이밍으로 드러낸다.

→ 연관: [02-structure-cohesion](02-structure-cohesion.md), [04-functional-domain](04-functional-domain.md).
