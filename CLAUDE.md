# Fitpet Navi v2 Front

요구사항 정제·확인 루프 SPA (`docs/spec.md`). React 19 · Vite · TypeScript strict · Tailwind v4 · shadcn(base-nova) · React Query · orval.
설정·구조·백엔드 상태는 `README.md`, 시각 규칙은 `docs/DESIGN.md`.

## Commands

| Command                | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | 개발 서버 `https://localhost:5173` (`/api` → `localhost:9000`) |
| `npm run build`        | `tsc -b && vite build`                                         |
| `npm run lint`         | ESLint (jsx-a11y · react-hooks · prettier 호환)                |
| `npm run typecheck`    | `tsc -b --noEmit`                                              |
| `npm run test:run`     | Vitest 1회 실행                                                |
| `npm run generate:api` | 백엔드 OpenAPI → `src/api/` 재생성 (백엔드 실행 중이어야 함)   |

## 절대 규칙

1. **`src/api/` 는 orval 생성물 — 직접 수정 금지.** API 를 바꾸려면 백엔드 스펙을 고치고 `npm run generate:api`.
   DTO 는 `src/lib/api-mapping.ts` 에서 뷰 모델(`src/types/task.ts`)로 변환해서만 쓴다.
2. **시각 표면은 `docs/DESIGN.md` 만 따른다.** `src/index.css` `@theme` 의 의미 클래스(`bg-canvas`, `text-muted`, `border-hairline`, `bg-success-wash text-success-deep` …)만 사용. hex·`bg-gray-*` 인라인 금지.
   `muted` 는 **텍스트 색**이다 — shadcn 생성물의 `bg-muted` / `text-muted-foreground` 는 `bg-surface-soft` / `text-muted` 로 치환한다.
3. **템플릿·섹션 구조는 백엔드가 정본.** 헤딩은 `## 섹션명:` 형식이며 표시할 때만 `sectionDisplayName()` 으로 콜론을 뗀다.
   프론트에 섹션명·"완료 조건" 을 하드코딩하지 않는다. 예제 마커 검사는 `(예:` 문자열 검색(`countMarkers`).
4. import 는 `@/*` alias 만. 상대경로(`../`) 금지.
5. 코드 변경 후 `npm run lint && npm run typecheck && npm run test:run`, 마무리 시 `npm run build` 까지 통과해야 한다.
