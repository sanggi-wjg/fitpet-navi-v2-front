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
  types/          프론트 뷰 모델 (task.ts · proposal.ts)
  lib/
    api-mapping.ts  DTO ↔ 뷰 모델, enum 매핑, 태그(쉼표 문자열↔배열)·우선순위
    markdown.ts     `## 섹션명:` 파서 · 섹션 교체 · (예: 마커 검사/분할
    gate.ts         개발 준비 게이트 계산과 문구
    board-order.ts  컬럼별 카드 순서 — 드래그 중 이동 계산, 숨은 카드 병합
    proposal-mapping.ts  제안 DTO ↔ 뷰 모델 · 섹션 매칭 · API 오류 해석
    task-config.ts  유형/컬럼/우선순위 설정
  hooks/
    useTasks.ts      orval 훅 래퍼 (템플릿 · 목록 · 상세 · 생성 · 이동+순서 · 상태 · 메타 · 섹션 저장)
    useProposals.ts  제안 목록 + Navi 세션 (채팅·수락·거부·중단·만료 처리)
  components/
    ui/           shadcn(base-nova) 생성물 — DESIGN.md 토큰으로 치환됨 (dropdown-menu · popover · skeleton 포함)
    common/       TypeChip · ReadyBadge · Callout · MarkdownDoc · MarkerTextarea · TagList · PriorityMenu · TagsEditor …
    board/        KanbanBoard · KanbanColumn · TaskCard(+Sortable) · TaskCardMenu · CancelTaskDialog · TodoMoveWarningDialog · BoardSkeleton
    task/         TaskCreateDialog · TypeTile
    detail/       TaskHeader · GateStrip · DocumentSection · ProposalBlock · DiffView · NaviPanel · AnalyzeWarningDialog · DetailSkeleton …
    layout/       AppLayout · Topbar
  pages/          TaskBoardPage (/board) · TaskDetailPage (/tasks/:id)
  test/           Vitest setup(jsdom 폴리필) · factories · renderWithProviders
docs/
  spec.md         제품 스펙
  DESIGN.md       디자인 시스템 (getdesign Claude 원문 + Navi v2 적용 가이드)
  design/         Claude Design 캔버스 아트보드 소스 (*.dc.html, canvas.json)
```

### 문서 모델

정본은 마크다운이며 `## 섹션명:` 헤딩 단위로 섹션이 나뉩니다. 섹션 구성은 백엔드 템플릿(`GET /api/v1/tasks/templates`)이 고정합니다. 상세 화면의 편집은 섹션 단위로 이루어지고(`replaceSection`), 저장 시 문서 전체를 `PATCH /api/v1/tasks/{id}` 로 보냅니다. `version` 은 본문이 실제로 바뀔 때만 백엔드가 +1 합니다.

### 제안 파이프라인 (범위 2)

- `POST /tasks/{id}/chat` 는 동기입니다(LLM 최대 60초 + 검증 재시도 1회) — 프론트는 busy 상태와 **중단**(AbortController)을 제공합니다. 대화는 stateless 라 패널 메시지는 세션 로컬입니다.
- 제안 종류: `replace_section`(섹션 교체, 서버 LCS diff 를 그대로 렌더) · `update_field`(제목/태그, 문서 상단 카드) · `no_change`(카드 없이 일반 답변).
- 수락 `POST /proposals/{id}/accept` — 서버가 제안 시점 스냅샷과 현재 값을 비교해 다르면 **409 + STALE** 로 바꿉니다. 프론트는 409 메시지를 만료 배너로 보여주고, `task.version` 차이는 사전 경고로만 표시합니다.
- 거부 `POST /proposals/{id}/reject` — 사유를 저장하고 그 사유를 반영한 **새 제안을 같은 응답으로** 돌려줍니다.

## 백엔드 연동

- 클라이언트는 orval 이 `http://localhost:9000/openapi.json` 에서 생성합니다 (`orval.config.ts`, axios mutator `src/lib/axios-instance.ts`).
- 현재 백엔드: 태스크(템플릿 · 목록 · 생성 · 조회 · 수정 · 순서 변경) + 제안(chat · 목록 · accept · reject).
- 보드 순서: `display_order` 는 **컬럼 안에서만** 비교합니다. 카드를 놓으면 (상태가 바뀌었을 때) `PATCH /tasks/{id}` 후 놓인 컬럼의 전체 id 순서를 `PATCH /tasks/reorder` 로 보냅니다.
- 요청 사항
  1. `GET /tasks/{id}/proposals` 에 `new_content`(또는 diff)가 없어 **리로드 후 pending 제안의 변경 미리보기를 표시하지 못합니다** (수락·거부는 가능). 목록 응답에 diff 나 new_content 를 포함해 주세요.
  2. accept 가 409 를 돌려줄 때 제안을 STALE 로 바꾸는 변경이 **예외와 함께 롤백되어 저장되지 않습니다** (실측: 409 후에도 목록에 PENDING). 프론트는 세션 안에서는 만료 배너를 보여주지만, 리로드하면 다시 pending 으로 보입니다. 예외 경로에서도 상태 변경이 커밋되어야 합니다.
  3. 분석 실행 · 미결정 사항 엔드포인트 — 범위 3 구현에 필요합니다.
  4. 아카이브 변경 API 가 없습니다 (`is_archived` 는 응답에만 있고 `TaskUpdateRequestDto` 로 바꿀 수 없음). 프론트는 취소(`status=CANCELED`)와 Backlog 복원만 제공합니다.

## 디자인

- 토큰·타이포·컴포넌트 규칙: [`docs/DESIGN.md`](docs/DESIGN.md) (§E 에 Tailwind `@theme` 매핑)
- 화면 목업: [Claude Design 캔버스](https://claude.ai/code/artifact/7cc77e35-2c68-47c5-b758-227efe4d5c75) — 소스는 `docs/design/`. 목업을 바꿀 때는 `*.dc.html` 과 `canvas.json` 을 수정한 뒤 캔버스를 다시 저장합니다.
- 서체: Pretendard(UI) · Noto Serif KR(페이지 타이틀) · JetBrains Mono(코드) — npm 패키지로 self-host.
