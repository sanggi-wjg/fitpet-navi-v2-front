---
description: 검증 파이프라인 실행 — lint → typecheck → test → build (CLAUDE.md 절대 규칙 5)
allowed-tools: Bash(npm run lint), Bash(npm run typecheck), Bash(npm run test:run), Bash(npm run build)
---

CLAUDE.md 절대 규칙 5 의 검증 파이프라인을 순서대로 실행하고 결과를 보고하세요.

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:run`
4. `npm run build` — 앞 단계가 모두 통과했을 때만. `$ARGUMENTS` 에 `quick` 이 있으면 생략.

규칙:

- 실패한 단계가 있으면 **중단하지 말고** 오류를 수정한 뒤 그 단계부터 다시 실행합니다. 단, `src/api` 안의 오류는 직접 수정 금지 — 백엔드 스펙 문제이므로 사용자에게 보고합니다.
- 마지막에 단계별 통과/실패와 수정한 내용을 표로 요약합니다 (테스트는 통과 개수 포함).
