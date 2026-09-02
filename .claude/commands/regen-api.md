---
description: 백엔드 OpenAPI → orval 재생성 후 연동 영향 점검 (openapi.json·src/api 는 커밋 대상 — git diff 로 변경 확인)
allowed-tools: Bash(curl -sf -o /dev/null --max-time 3 http://localhost:9000/openapi.json), Bash(npm run generate:api), Bash(npm run typecheck), Bash(npm run test:run), Bash(npm run lint), Bash(git diff*)
---

백엔드 스키마 변경을 프론트에 반영하는 절차입니다. `openapi.json`(스냅샷)과 `src/api`(orval 생성물)는 커밋 대상이므로 재생성 후 git diff 로 변경을 확인할 수 있습니다.

1. **백엔드 확인**: `curl -sf -o /dev/null --max-time 3 http://localhost:9000/openapi.json` 이 실패하면 중단하고, 백엔드(`~/workspace_ai/fitpet-navi-v2`)를 먼저 실행해 달라고 사용자에게 알립니다.
2. `npm run generate:api` — 스냅샷(`openapi.json`) 갱신 + orval 재생성이 한 번에 실행됩니다.
3. **변경 확인**: `git diff --stat openapi.json src/api` 와 diff 내용으로 추가·변경된 엔드포인트/DTO 필드를 요약합니다.
4. **연동 반영**: 새 필드·엔드포인트가 있으면 `src/lib/api-mapping.ts` → `src/types/*.ts` → 훅(`src/hooks/`) 순으로 매핑을 갱신합니다. `src/api` 직접 수정은 금지.
5. `npm run typecheck && npm run test:run && npm run lint` 로 검증하고, 변경 요약(새 API, 매핑 반영 여부, 남은 작업)을 보고합니다.

`$ARGUMENTS` 가 있으면 해당 범위(예: "범위 3 분석 API")에 집중해 4번 단계를 수행합니다.
