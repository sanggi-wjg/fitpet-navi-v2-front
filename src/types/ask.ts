/**
 * 구현 확인(Ask) 뷰 모델.
 * 서버 SSE 이벤트(`src/lib/ask-stream.ts`)를 이 형태로 바꾸는 규칙은 `src/lib/ask-reducer.ts`.
 * 대화는 세션 로컬(서버 저장 없음)이고, 완료된 턴만 다음 요청의 `messages[]` 에 실린다.
 */

/** 도구 단계 상태 — 중단하면 running 은 failed 로 정리한다 */
export type AskToolStatus = 'running' | 'done' | 'failed'

/** 과정 블록의 한 행. append-only 라 인덱스를 key 로 써도 안정적이다 */
export type AskStep =
  /** 프론트 합성 — 턴에서 처음 등장한 repo 는 select, 이후 새 repo 는 add */
  | { kind: 'target'; repo: string; mode: 'select' | 'add' }
  /** 연속 thinking 델타를 이어붙인 한 행 */
  | { kind: 'thinking'; text: string }
  /** tool_call → tool_result. label·target 은 수신 시 계산해 저장한다 */
  | {
      kind: 'tool'
      seq: number
      name: string
      label: string
      target: string
      status: AskToolStatus
      summary: string | null
    }
  /** 도구 호출 사이에 온 answer(중간 설명) — 다음 tool_call 이 오면 답변 영역에서 여기로 옮긴다 */
  | { kind: 'note'; text: string }

export type AskTurnStatus =
  | { kind: 'connecting' }
  | { kind: 'streaming' }
  | { kind: 'done' }
  | { kind: 'aborted' }
  /** retryable = 503(LLM 불가·반복 한도) 또는 네트워크 단절·조기 종료 */
  | { kind: 'error'; message: string; status: number | null; retryable: boolean }

/** done 이벤트의 레포 — 실제로 도구가 접근한 레포와 그 시점의 HEAD */
export interface AskRepoRef {
  name: string
  commit: string | null
}

export interface AskMeta {
  repos: AskRepoRef[]
  iterations: number
  elapsedMs: number
}

export interface AskTurn {
  id: number
  question: string
  status: AskTurnStatus
  steps: AskStep[]
  /** 답변 영역 텍스트. streaming 중엔 잠정(다음 tool_call 이 오면 note 로 이동), done 뒤엔 최종 답변 */
  answer: string
  meta: AskMeta | null
  /** Date.now() — 진행 중 경과 시간 표시용 */
  startedAt: number
}
