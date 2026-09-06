# 구현 확인(Ask) — code-qa 스트림 명세와 프론트 표시 규칙

> 백엔드 `POST /api/v1/code-qa/chat`(`feature/ask-agent`, 2026-09-05 실서버·소스로 확인) 기준. 초안 단계의 "프론트 요구 계약"은 이 문서로 대체됐다.
> 프론트 구현: 리더 `src/lib/ask-stream.ts` · 이벤트→뷰 모델 `src/lib/ask-reducer.ts` · 세션 `src/hooks/useAskSession.ts` · 화면 `src/pages/AskPage.tsx`. 시각 규칙은 `docs/DESIGN.md` §D.4, 목업은 `docs/design/AskEmpty.dc.html` · `AskAnswer.dc.html` · `AskStates.dc.html`.

## 1. 전제 (사용자 결정 2026-09-05)

| 항목            | 결정                                                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 위치            | 상단바 탭 "구현 확인"(`/ask`). 태스크와 무관한 독립 화면. 업무 보드 상단바에도 탭 링크                                                                                                              |
| 저장            | **서버 저장 없음.** 대화는 브라우저 세션 로컬, 리로드 시 소멸                                                                                                                                       |
| 후속 질문       | 허용. 클라이언트가 완료된 턴을 `messages[]` 로 동봉한다(서버는 stateless, 최근 20턴만 사용)                                                                                                         |
| 대상 코드베이스 | 사용자는 고르지 않는다. 백엔드 LLM 이 시스템 프롬프트의 레포 안내로 고른다. **선택 이벤트는 없고** 첫 `tool_call.arguments.repo` 가 선택 결과다                                                     |
| 레포 표시명     | 표시명 API 없음 → **기술명 그대로**(`fitpetmall-backend-v4` 등) mono 로 표시                                                                                                                        |
| 응답            | **스트림.** 과정(thinking · tool)은 접지 않고 전부 표시, 답변은 마크다운, 답변 아래 메타 줄(확인한 레포 · 커밋 · 탐색 횟수 · 소요 시간). 참고한 코드 카드는 두지 않는다(답변 끝 "근거" 목록과 중복) |
| 문체            | `answer` · `thinking` 은 Navi 발화 **해요체**, 프론트 라벨 · 안내 · 오류 제목은 시스템 **합니다체 · 명사형**                                                                                        |

## 2. 엔드포인트 — `POST /api/v1/code-qa/chat`

요청 `Content-Type: application/json`, 응답 `Content-Type: text/event-stream` (`Cache-Control: no-cache`, `X-Accel-Buffering: no`).

```json
{
  "messages": [
    { "role": "user", "content": "적립금 비율은?" },
    { "role": "assistant", "content": "…이전 답변의 최종 answer 본문…" },
    { "role": "user", "content": "기준 금액은?" }
  ],
  "debug": false
}
```

- `messages` 는 1개 이상, **마지막은 `user`**(아니면 422). `role` 은 `user` | `assistant` 만.
- `debug: true` 면 `tool_result.content` 에 도구 결과 전문이 실린다. 프론트 MVP 는 쓰지 않는다(리더는 `debug?` 인자만 열어 둠).
- 스트림 시작 **전** 실패는 일반 JSON 오류(422 Validation / 500 `ErrorResponseDto { status, statusText, message, timestamp }`).
- 프론트는 `EventSource` 가 아니라 **fetch + `ReadableStream.getReader()` + `AbortController`** 로 읽는다(POST 본문 필요, `lib` 에 `DOM.AsyncIterable` 이 없어 `for await` 불가). URL 은 `API_BASE_URL + '/api/v1/code-qa/chat'`(dev 는 Vite 프록시).
- `messages` 구성 규칙: **`done` 으로 끝나고 답변이 비어있지 않은 턴**만 `[user 질문, assistant 최종 answer]` 쌍으로 넣는다. 중단 · 오류 턴은 질문까지 제외(부분 답변이 모델을 오도하고 user/assistant 교대가 깨짐). 최근 20턴 상한, 마지막에 새 질문.

## 3. 이벤트 → 화면

SSE 프레임 `event: <type>\ndata: <JSON 한 줄>\n\n`(LF, 프론트는 CRLF 도 허용). 스트림은 `done` 또는 `error` 로 끝난다.

| event         | data                                                                          | 프론트 처리 (`DESIGN.md` §D.4)                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `thinking`    | `{ delta }`                                                                   | 직전 단계가 thinking 이면 이어붙이고 아니면 새 "생각" 행(`ask-step`). 13 muted 로 전부 표시                                                                                    |
| `tool_call`   | `{ seq, name, arguments: { repo, path?, pattern?, start_line?, end_line? } }` | (1) 잠정 `answer` 가 있으면 `ask-note` 행으로 이동 (2) 턴에서 처음 보는 `repo` 면 `ask-target-step`("대상 선택", 이후 "대상 추가") (3) `tool` 행 running. 라벨 · target 은 4절 |
| `tool_result` | `{ seq, name, summary, content? }`                                            | 같은 `seq` 의 마지막 tool 행을 완료로, `summary` 는 아래 12 muted. summary 에 "오류" 가 있으면 실패 표시(best-effort). `content` 는 버린다                                     |
| `answer`      | `{ delta }`                                                                   | 답변 영역(`ask-answer`)에 누적. 뒤에 `tool_call` 이 오면 중간 설명이었던 것이므로 `ask-note` 로 이동                                                                           |
| `done`        | `{ repos: [{ name, commit }], iterations, elapsed_ms }`                       | 턴 종결. 과정 헤더 "탐색 과정 · N단계", 메타 줄 "확인한 레포 `name @ commit` · N회 탐색 · 8.8초"                                                                               |
| `error`       | `{ status, statusText, message, timestamp }`                                  | 턴 종결. `callout` error "답변을 받지 못했습니다" + `message`. **503(LLM 불가 · 탐색 40회 한도)만 "다시 시도"**, 500 은 메시지만                                               |

- `seq` 는 스트림 안에서 증가하는 도구 호출 번호. thinking 에는 id 가 없다.
- `answer` 는 도구 호출 사이에도 온다("중간 설명"). 마지막 answer 만 최종 답변이다 — 다음 이벤트가 오기 전에는 알 수 없으므로 프론트는 `tool_call` 시점에 잠정 answer 를 note 로 옮긴다.
- 모르는 event 이름 · 깨진 JSON 은 무시한다(전방 호환).
- 답변 끝 "근거" 목록(`레포이름/파일경로:라인 — 설명`)은 백엔드 시스템 프롬프트가 강제한다. 프론트는 그대로 마크다운으로 렌더한다.

## 4. 프론트 합성 규칙 (`src/lib/ask-reducer.ts`)

- **도구 라벨**: `list_dir` 폴더 보기 · `search_code` 코드 검색 · `read_file` 파일 읽기 · 미지 도구는 `name` 그대로.
- **target 문자열**: `repo:path` (+ ` 'pattern'`, + ` 12~80줄` / ` 12줄~` / ` ~80줄`). path 가 없으면 `repo` 만.
- **대상 행**: 턴에서 처음 등장한 `arguments.repo` → "대상 선택 · repo", 이후 새 repo → "대상 추가 · repo". 고른 이유는 직전 thinking 행이 담당한다.
- **종결**: `done`/`error` 이벤트, 사용자 중단(`aborted`, 받은 내용 유지 + running 단계는 실패 표시), **종결 이벤트 없이 EOF** → 오류 "응답이 중간에 끊겼습니다"(재시도 가능). 종결된 턴은 이후 이벤트를 무시한다.
- **재시도**: `error.status === 503` 또는 네트워크 단절(status 없음) · 조기 EOF 에만. 같은 질문을 새 턴으로 재전송하고 실패 턴은 지운다.
- **되묻기**(대상 판별 불가 등): 도구 호출 없이 answer 만 오므로 과정 블록 없는 일반 답변 턴. 새 이벤트 없음.

## 5. 예시 프레임 (백엔드 컨트롤러 테스트 기준)

```text
event: thinking
data: {"type":"thinking","delta":"적립금은 mileage 로 검색"}

event: tool_call
data: {"type":"tool_call","seq":1,"name":"search_code","arguments":{"repo":"fitpetmall-backend-v4","pattern":"mileage"}}

event: tool_result
data: {"type":"tool_result","seq":1,"name":"search_code","summary":"fitpetmall-backend-v4 검색 'mileage' → 3건","content":null}

event: answer
data: {"type":"answer","delta":"결제 금액에 비율을 곱합니다."}

event: done
data: {"type":"done","repos":[{"name":"fitpetmall-backend-v4","commit":"f3818f6"}],"iterations":2,"elapsed_ms":8800}
```

오류 종결:

```text
event: error
data: {"type":"error","status":503,"statusText":"SERVICE_UNAVAILABLE","message":"LLM을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.","timestamp":"2026-09-05T…"}
```

## 6. 백엔드 후속 요청

1. **heartbeat**: 15초 간격 `: ping` 주석 줄 — 운영 프록시 idle timeout(nginx 기본 60초) 방지. 프론트 파서는 주석을 이미 무시하므로 변경 없음.
2. **`tool_result.ok: boolean`** — 실패 판정을 summary 의 "오류" 문자열에 의존하지 않도록.
3. **레포 표시명** — `repos.toml` 에 표시명을 두고 `done.repos[]` 나 별도 `GET /api/v1/code-qa/repos` 로 주면 프론트가 기술명 대신 표시한다.
4. **운영 프록시**: `proxy_buffering off`(또는 `X-Accel-Buffering: no` 존중) 확인.
