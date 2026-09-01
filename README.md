# Fitpet Navi v2 Front

담당자가 개발자에게 넘기기 전에 요구사항을 정제·확인하는 도구의 프론트엔드입니다. 스펙은 [`docs/spec.md`](docs/spec.md), 디자인 시스템은 [`docs/DESIGN.md`](docs/DESIGN.md)를 따릅니다.

- **범위 1 — 태스크 생성**: 유형(신규 기능 / 기존 기능 수정 / 자동화·배치 / 정책 변경) 템플릿 삽입, `(예: …)` 예제 마커 하이라이트, "분석 시작" 시 마커 잔존 경고 — **구현됨**
- **범위 2 — 정제**: Navi 가 섹션 단위 변경을 제안하고 사용자가 수락/거부 — 백엔드 API 대기
- **범위 3 — 개발 준비됨 게이트**: 마커 0건 · 분석 1회 · 미결정 답변 완료 — 마커 항목만 실계산, 나머지는 백엔드 API 대기

## 시작하기

요구 사항: Node 22+, npm, 백엔드(FastAPI) `http://localhost:9000`.

```bash
npm ci
cp .env.example .env          # VITE_API_BASE_URL 은 dev 에서 비워 둔다 (프록시가 /api → :9000)
npm run generate:api          # 백엔드가 떠 있어야 함 → src/api/ 생성
npm run dev                   # https://localhost:5173 (자체 서명 인증서 — 최초 접속 시 경고 수락)
```

| Script                                        | 설명                                  |
| --------------------------------------------- | ------------------------------------- |
| `npm run dev`                                 | Vite 개발 서버 (HTTPS, `/api` 프록시) |
| `npm run build`                               | 타입체크 + 프로덕션 빌드 (`dist/`)    |
| `npm run preview`                             | 빌드 결과 미리보기                    |
| `npm run lint` / `lint:fix`                   | ESLint                                |
| `npm run typecheck`                           | `tsc -b --noEmit`                     |
| `npm run test` / `test:run` / `test:coverage` | Vitest (jsdom)                        |
| `npm run format`                              | Prettier (`src/api/` 제외)            |
| `npm run generate:api`                        | orval 로 OpenAPI → `src/api/` 재생성  |

커밋 시 Husky + lint-staged 가 ESLint/Prettier 를 자동 적용합니다.

## 구조

```
src/
  api/            orval 생성물 (git 제외, 수정 금지)
  types/task.ts   프론트 뷰 모델 (Task, TaskType, TaskStatus)
  lib/
    api-mapping.ts  DTO ↔ 뷰 모델, enum 매핑, 유형 추론(임시)
    markdown.ts     `## 섹션명:` 파서 · 섹션 교체 · (예: 마커 검사/분할
    gate.ts         개발 준비 게이트 계산과 문구
    task-config.ts  유형/컬럼 설정
  hooks/useTasks.ts  orval 훅 래퍼 (템플릿 · 목록 · 상세 · 생성 · 이동 · 섹션 저장)
  components/
    ui/           shadcn(base-nova) 생성물 — DESIGN.md 토큰으로 치환됨
    common/       TypeChip · ReadyBadge · Callout · MarkdownDoc · MarkerTextarea …
    board/        KanbanBoard · KanbanColumn · TaskCard · GateDots · TodoMoveWarningDialog
    task/         TaskCreateDialog · TypeTile
    detail/       TaskHeader · GateStrip · DocumentSection · AnalyzeWarningDialog · NaviPanel …
    layout/       AppLayout · Topbar
  pages/          TaskBoardPage (/board) · TaskDetailPage (/tasks/:id)
docs/
  spec.md         제품 스펙
  DESIGN.md       디자인 시스템 (getdesign Claude 원문 + Navi v2 적용 가이드)
  design/         Claude Design 캔버스 아트보드 소스 (*.dc.html, canvas.json)
```

### 문서 모델

정본은 마크다운이며 `## 섹션명:` 헤딩 단위로 섹션이 나뉩니다. 섹션 구성은 백엔드 템플릿(`GET /api/v1/tasks/templates`)이 고정합니다. 상세 화면의 편집은 섹션 단위로 이루어지고(`replaceSection`), 저장 시 문서 전체를 `PATCH /api/v1/tasks/{id}` 로 보냅니다. Navi 제안(범위 2)도 같은 섹션 교체 함수를 사용할 예정입니다.

## 백엔드 연동

- 클라이언트는 orval 이 `http://localhost:9000/openapi.json` 에서 생성합니다 (`orval.config.ts`, axios mutator `src/lib/axios-instance.ts`).
- 현재 백엔드는 **태스크 도메인만** 제공합니다: 템플릿 조회 · 목록 · 생성 · 조회 · 수정 · 순서 변경.
- 요청 사항
  1. `TaskResponseDto` 에 `task_type` 이 없어 프론트가 섹션 구성으로 유형을 추론합니다 (`inferTaskType`). 필드가 추가되면 추론을 제거합니다.
  2. 문서 `version`(낙관적 잠금), 분석 실행, 미결정 사항, proposal(`POST /tasks/:id/chat`, accept/reject) 엔드포인트 — 범위 2·3 구현에 필요합니다.

## 디자인

- 토큰·타이포·컴포넌트 규칙: [`docs/DESIGN.md`](docs/DESIGN.md) (§E 에 Tailwind `@theme` 매핑)
- 화면 목업: [Claude Design 캔버스](https://claude.ai/code/artifact/7cc77e35-2c68-47c5-b758-227efe4d5c75) — 소스는 `docs/design/`. 목업을 바꿀 때는 `*.dc.html` 과 `canvas.json` 을 수정한 뒤 캔버스를 다시 저장합니다.
- 서체: Pretendard(UI) · Noto Serif KR(페이지 타이틀) · JetBrains Mono(코드) — npm 패키지로 self-host.
