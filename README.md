# Fitpet Navi v2 Front

담당자가 개발자에게 넘기기 전에 요구사항을 정제·확인하는 도구의 프론트엔드입니다. 디자인 시스템은 [`docs/DESIGN.md`](docs/DESIGN.md)를 따릅니다.

- **범위 1 — 태스크 생성**: 유형(신규 기능 / 기존 기능 수정 / 자동화·배치 / 정책 변경) 템플릿 삽입, `(예: …)` 예제 마커 하이라이트, "분석 시작" 시 마커 잔존 경고 — **구현됨**
- **범위 2 — 정제**: Navi 가 섹션 단위 변경을 제안하고 사용자가 문서 위 diff 에서 수락/거부(거부 사유로 재제안) — **구현됨**
- **범위 3 — 개발 준비됨 게이트**: 마커 0건 · 분석 1회 · 미결정 답변 완료 — 마커 항목만 실계산, 나머지는 백엔드 API 대기

## 시작하기

요구 사항: Node 22+, npm, 백엔드(FastAPI) `http://localhost:9000`.

```bash
npm ci
cp .env.example .env          # VITE_API_BASE_URL 은 dev 에서 비워 둔다 (프록시가 /api → :9000)
npm run generate:api          # 백엔드가 떠 있어야 할 때만 필요 — openapi.json 스냅샷 + src/api/ 재생성(둘 다 커밋 대상)
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
  api/            orval 생성물 (커밋 대상, 직접 수정 금지)
  types/          프론트 뷰 모델 (task.ts — Task · TaskSection / proposal.ts — Proposal · PanelMessage / ask.ts — AskTurn · AskStep)
  lib/
    api-mapping.ts  DTO ↔ 뷰 모델, enum 매핑, 태그(쉼표 문자열↔배열)·우선순위
    markdown.ts     (예: 마커 검사/분할 · 편집 본문의 `## ` 헤딩 차단
    proposal-mapping.ts  제안 DTO → 뷰 모델, 만료 판정
    diff.ts         제안 diff 계산 (줄 LCS → 바뀐 줄끼리 어절 LCS)
    api-error.ts    axios 오류 해석 (409 낙관적 잠금 · toast 문구)
    task-cache.ts   React Query 캐시 병합 (섹션 없는 PATCH 응답을 섹션 포함 행 위에)
    gate.ts         개발 준비 게이트 계산과 문구
    board-order.ts  컬럼별 카드 순서 — 드래그 중 이동 계산, 숨은 카드 병합
    task-config.ts  유형/컬럼/우선순위 설정
    ask-stream.ts   구현 확인 SSE 리더 (fetch + ReadableStream · 프레임 파서 · 이벤트 디코더 · AskRequestError)
    ask-reducer.ts  구현 확인 이벤트 → 턴 뷰 모델 (대상 행 합성 · note 행 · 도구 라벨/target · 이력 구성)
    ask-config.ts   구현 확인 예시 질문 (카테고리 6개 × 문항 2~3개)
    keyboard.ts     채팅 입력 Enter 판정 (Shift+Enter · IME 조합 가드)
  hooks/
    useTasks.ts      orval 훅 래퍼 (템플릿 · 목록+아카이브 · 상세 · 생성 · 이동+순서 · 상태 · 메타 · 아카이브/해제 · 섹션 저장)
    useProposals.ts  제안 목록 + Navi 세션 (채팅 · 수락 · 거부→재제안 · 만료 · 중단)
    useAskSession.ts 구현 확인 세션 (스트림 전송 · 중단 · 재시도 · 새 대화 — 세션 로컬)
    useElapsed.ts · useStickToBottom.ts  진행 중 경과 초 · 창 스크롤을 대화 끝에 붙이기
  components/
    ui/           shadcn(base-nova) 생성물 — DESIGN.md 토큰으로 치환됨 (dropdown-menu · popover · skeleton 포함)
    common/       TypeChip · ReadyBadge · Callout · MarkdownDoc(doc/chat) · BusyDots · MarkerTextarea · TagList · PriorityMenu · TagsEditor …
    board/        KanbanBoard · KanbanColumn · ArchiveList · TaskCard(+Sortable) · TaskCardMenu · CancelTaskDialog · TodoMoveWarningDialog · BoardSkeleton
    task/         TaskCreateDialog · TypeTile
    detail/       TaskHeader · GateStrip · DocumentSection · ProposalBlock · DiffView · NaviPanel · AnalyzeWarningDialog · UndecidedSection · DetailSkeleton …
    ask/          AskEmptyState · AskInput · AskTurnView · AskProcess · AskStepRow · AskMeta
    layout/       AppLayout · Topbar · TopbarTabs
  pages/          TaskBoardPage (/board) · TaskDetailPage (/tasks/:id) · AskPage (/ask)
  test/           Vitest setup(jsdom 폴리필) · factories · renderWithProviders · queryWrapper(훅 테스트용 QueryClient)
docs/
  DESIGN.md       디자인 시스템 (getdesign Claude 원문 + Navi v2 적용 가이드)
  design/         Claude Design 캔버스 아트보드 소스 (*.dc.html, canvas.json)
  ask-stream-contract.md  구현 확인(코드 질의 채팅) code-qa 스트림 명세와 프론트 표시 규칙
```

### 문서 모델

정본은 백엔드의 섹션 행(`task_sections`)입니다. 섹션 구성(이름·순서·필수)은 유형 템플릿(`GET /api/v1/tasks/templates`)이 정하고 생성 시 확정되며, 프론트는 섹션을 만들거나 지우지 않습니다. 목록·상세·생성 응답 모두 섹션을 포함하므로 뷰 모델 `Task` 는 `sections` 와 그 마커 합 `markerCount` 를 갖습니다.

- 섹션 편집은 `PATCH /api/v1/tasks/{id}/sections/{section_id}` 에 `{ body, version }` 을 보냅니다. `version` 은 섹션별 낙관적 잠금 토큰이며 불일치면 **409** — 프론트는 서버 메시지를 toast 로 보이고 편집기를 열어 둔 채 최신 내용을 다시 받습니다.
- 제목·태그·상태·우선순위는 `PATCH /api/v1/tasks/{id}` 에 태스크 `version` 을 동봉합니다(불일치 409). 태스크 `version` 은 메타가 실제로 바뀔 때만 +1 하고, 섹션 편집으로는 오르지 않습니다.
- 예제 마커 `(예:` 는 프론트가 본문에서 직접 셉니다(`countMarkers`). 백엔드의 `example_marker_count` 는 마커 정의가 `예:` 라 아직 쓰지 않습니다(아래 요청 사항).

### 제안 (범위 2)

- `POST /api/v1/tasks/{id}/chat` `{ message }` → `{ tool, message?, proposal? }`. `replace_section` 이면 제안이 저장되어 돌아오고, `no_change` 면 `message` 만 패널에 Navi 답변으로 보입니다. LLM 호출은 동기(최대 60초)라 패널 입력창이 중단 버튼으로 바뀝니다(AbortController — 중단해도 서버는 끝까지 돌아 제안이 남을 수 있어 목록을 다시 읽습니다).
- 제안은 **섹션 id · 제안 시점 섹션 version** 으로 문서와 이어집니다. diff 는 응답의 unified diff 문자열 대신 **프론트가 현재 섹션 본문과 `tool_input.new_content` 를 비교해** 그립니다(`src/lib/diff.ts`) — 목록 응답에도 본문이 있어 리로드 후에도 미리보기가 됩니다.
- 수락 `POST /proposals/{id}/accept` → `{ proposal, section }` 의 섹션을 캐시에 반영합니다. 제안 이후 섹션이 바뀌었으면 **409** — 블록이 만료 배너로 바뀌고 "다시 제안 받기"(닫기 + 현재 문서 기준 재요청) / "닫기"(`POST /proposals/{id}/close`, pending → CLOSED, 섹션·LLM 무관, 이미 처리된 제안은 400) 를 제공합니다. 만료는 서버 `is_stale` · 섹션 version 차이 · 409 중 하나로 판정합니다.
- 거부 `POST /proposals/{id}/reject` `{ reason }` 는 거부 저장과 재제안이 한 트랜잭션이라 같은 응답으로 새 제안(또는 `no_change`)이 돌아옵니다. 503 이면 거부도 롤백되어 제안이 pending 으로 남습니다.
- 대화는 서버에 저장되지 않습니다(세션 로컬). 리로드 후 대기 제안은 패널 상단 요약 카드와 문서의 블록으로만 보입니다.

### 구현 확인 (코드 질의 채팅)

비개발자가 "지금 구현이 어떻게 되어 있나"를 채팅으로 묻는 독립 탭(`/ask`). 명세와 표시 규칙은 [`docs/ask-stream-contract.md`](docs/ask-stream-contract.md).

- `POST /api/v1/code-qa/chat` `{ messages[] }` → SSE(`thinking · tool_call · tool_result · answer · done · error`). orval 은 스트림을 만들지 못해 **`src/lib/ask-stream.ts` 가 fetch + ReadableStream 으로 직접 읽고**, 생성물은 요청 DTO 타입(`CodeQaMessageDto`)만 씁니다.
- 대화는 세션 로컬입니다. 후속 질문은 완료된 턴의 [질문, 최종 답변] 쌍(최근 20턴)을 `messages` 로 동봉합니다. 중단·오류 턴은 제외합니다.
- 대상 레포는 백엔드 LLM 이 고릅니다. 프론트는 첫 `tool_call.arguments.repo` 로 "대상 선택" 행을 합성하고, 도구 이름을 한국어 라벨로 바꾸며, 도구 호출 사이에 온 `answer` 는 과정 블록의 "설명" 행으로 옮깁니다(`src/lib/ask-reducer.ts`).
- 중단은 AbortController(받은 내용 유지), 종결 이벤트 없는 EOF 는 재시도 가능한 오류로 봅니다. 재시도는 503·네트워크 오류에만 노출됩니다.
- 빈 상태의 예시 질문은 `src/lib/ask-config.ts` 가 정본입니다(카테고리 6개 × 문항 2~3개, 카테고리 탭으로 접어 보임). 문항을 바꾸면 `docs/DESIGN.md` §D.4 `ask-suggestions` 와 목업 `docs/design/AskEmpty.dc.html` 도 함께 갱신합니다.

## 백엔드 연동

- 클라이언트는 orval 이 스냅샷 `openapi.json` 에서 생성합니다. `npm run generate:api` 가 `http://localhost:9000/openapi.json` 을 먼저 받아 스냅샷을 갱신합니다 (`orval.config.ts`, axios mutator `src/lib/axios-instance.ts`).
- 현재 백엔드: 태스크(템플릿 · 목록 · 생성 · 조회 · 메타 수정 · 순서 변경 · 아카이브/해제) + 섹션 수정 + 제안(채팅 · 목록 · 수락 · 거부 · 닫기) + 코드 Q&A(`code-qa/chat` 스트림). 분석·미결정 사항 API 는 아직 없습니다.
- 보드 순서: `display_order` 는 **컬럼 안에서만** 비교합니다. 카드를 놓으면 (상태가 바뀌었을 때) `PATCH /tasks/{id}` 후 놓인 컬럼의 전체 id 순서를 `PATCH /tasks/reorder` 로 보냅니다.
- 요청 사항
  1. 예제 마커 정의 통일 — 백엔드 `EXAMPLE_MARKER` 가 `"예:"` 라 `example_marker_count` 가 프론트의 `(예:` 검색과 어긋날 수 있습니다. `"(예:"` 로 맞추면 프론트가 그 값을 그대로 쓸 수 있습니다.
  2. 분석 실행 · 미결정 사항 엔드포인트 — 범위 3 구현에 필요합니다.
  3. 생성 시 섹션 본문(`sections?: [{name, body}]`)을 받으면 생성 다이얼로그에서 바로 편집할 수 있습니다(지금은 템플릿 미리보기만).
  4. 코드 Q&A 스트림 — 15초 간격 `: ping` 주석(프록시 idle timeout), `tool_result.ok` 필드(실패 판정), 레포 표시명(`docs/ask-stream-contract.md` §6).

## 디자인

- 토큰·타이포·컴포넌트 규칙: [`docs/DESIGN.md`](docs/DESIGN.md) (§E 에 Tailwind `@theme` 매핑)
- 화면 목업: [Claude Design 캔버스](https://claude.ai/code/artifact/7cc77e35-2c68-47c5-b758-227efe4d5c75) — 소스는 `docs/design/`. 목업을 바꿀 때는 `*.dc.html` 과 `canvas.json` 을 수정한 뒤 캔버스를 다시 저장합니다.
- 새 화면 추가 절차: `DESIGN.md` §A 결정 표에 행 추가 → `docs/design/` 아트보드 + `canvas.json` → 캔버스 재저장 → §D 컴포넌트 스펙 → 구현. 백엔드 의존 화면은 계약 문서(`docs/ask-stream-contract.md` 형식)를 먼저 쓴다.
- 서체: Pretendard(UI) · Noto Serif KR(페이지 타이틀) · JetBrains Mono(코드) — npm 패키지로 self-host.
