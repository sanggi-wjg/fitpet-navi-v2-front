import type { CodeQaMessageDto } from '@/api/model'
import { NETWORK_HINT, type ApiErrorInfo } from '@/lib/api-error'
import type { CodeQaEvent, CodeQaToolArgs } from '@/lib/ask-stream'
import type { AskStep, AskTurn } from '@/types/ask'

/**
 * 구현 확인 — 스트림 이벤트를 턴(뷰 모델)에 반영하는 순수 함수들.
 * 규칙은 `docs/ask-stream-contract.md` §4. 종결된 턴(done · aborted · error)은 어떤 함수도 바꾸지 않는다 —
 * 늦게 도착한 이벤트와 중복 종결을 안전하게 무시하는 근거다.
 */

/** 도구 이름 → 화면 라벨(명사형). 서버가 라벨을 주지 않아 프론트가 매핑한다 */
export const TOOL_LABELS: Record<string, string> = {
  list_dir: '폴더 보기',
  search_code: '코드 검색',
  read_file: '파일 읽기',
}

export const ASK_FALLBACK_ERROR = '답변을 받지 못했습니다. 잠시 후 다시 시도해 주세요.'
export const ASK_INCOMPLETE_ERROR = '응답이 중간에 끊겼습니다. 다시 시도해 주세요.'
/** 서버가 쓰는 이력 상한(max_history)과 같게 맞춘다 */
export const MAX_HISTORY_TURNS = 20

type ToolCallEvent = Extract<CodeQaEvent, { type: 'tool_call' }>
type ToolStep = Extract<AskStep, { kind: 'tool' }>

export function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name
}

/** `repo:path 'pattern' 12~80줄` — 있는 인자만 이어 붙인다 */
export function toolTarget(args: CodeQaToolArgs): string {
  const parts: string[] = []
  const base = args.repo ? (args.path ? `${args.repo}:${args.path}` : args.repo) : (args.path ?? '')
  if (base !== '') parts.push(base)
  if (args.pattern !== undefined) parts.push(`'${args.pattern}'`)
  const lines = lineRange(args.startLine, args.endLine)
  if (lines !== null) parts.push(lines)
  return parts.join(' ')
}

function lineRange(start: number | undefined, end: number | undefined): string | null {
  if (start !== undefined && end !== undefined) return `${start}~${end}줄`
  if (start !== undefined) return `${start}줄~`
  if (end !== undefined) return `~${end}줄`
  return null
}

/** tool_result 에 실패 필드가 없어 summary 문구로 판정한다 (best-effort, 백엔드에 `ok` 필드 요청 중) */
export function isFailedSummary(summary: string): boolean {
  return /오류/.test(summary)
}

/** 503(LLM 불가 · 반복 한도) 과 네트워크 단절(status 없음)만 다시 시도할 수 있다 */
export function isRetryable(status: number | null): boolean {
  return status === 503 || status === null
}

export function isActiveTurn(turn: AskTurn): boolean {
  return turn.status.kind === 'connecting' || turn.status.kind === 'streaming'
}

export function createTurn(id: number, question: string, now: number = Date.now()): AskTurn {
  return {
    id,
    question,
    status: { kind: 'connecting' },
    steps: [],
    answer: '',
    meta: null,
    startedAt: now,
  }
}

/** 이벤트 하나를 턴에 반영한다. 종결된 턴은 그대로 돌려준다 */
export function applyCodeQaEvent(turn: AskTurn, event: CodeQaEvent): AskTurn {
  if (!isActiveTurn(turn)) return turn
  const live: AskTurn =
    turn.status.kind === 'streaming' ? turn : { ...turn, status: { kind: 'streaming' } }

  switch (event.type) {
    case 'thinking':
      return appendThinking(live, event.delta)
    case 'tool_call':
      return appendToolCall(live, event)
    case 'tool_result':
      return settleTool(live, event.seq, event.summary)
    case 'answer':
      return { ...live, answer: live.answer + event.delta }
    case 'done':
      return {
        ...live,
        status: { kind: 'done' },
        steps: settleRunning(live.steps),
        meta: { repos: event.repos, iterations: event.iterations, elapsedMs: event.elapsedMs },
      }
    case 'error':
      return {
        ...live,
        status: {
          kind: 'error',
          message: event.message ?? ASK_FALLBACK_ERROR,
          status: event.status,
          retryable: isRetryable(event.status),
        },
        steps: settleRunning(live.steps),
      }
  }
}

/** 연속 thinking 은 한 행으로 이어붙인다 */
function appendThinking(turn: AskTurn, delta: string): AskTurn {
  if (delta === '') return turn
  const last = turn.steps.at(-1)
  if (last?.kind === 'thinking') {
    return { ...turn, steps: [...turn.steps.slice(0, -1), { ...last, text: last.text + delta }] }
  }
  return { ...turn, steps: [...turn.steps, { kind: 'thinking', text: delta }] }
}

/**
 * tool_call: 잠정 answer 는 중간 설명(note)이었으므로 과정 블록으로 옮기고,
 * 턴에서 처음 보는 repo 면 대상 행을 합성한 뒤, 도구 행을 running 으로 추가한다 (note → target → tool 순).
 */
function appendToolCall(turn: AskTurn, event: ToolCallEvent): AskTurn {
  const steps: AskStep[] = [...turn.steps]
  const note = turn.answer.trim()
  if (note !== '') steps.push({ kind: 'note', text: note })

  const repo = event.arguments.repo
  if (repo !== null && !steps.some((step) => step.kind === 'target' && step.repo === repo)) {
    const hasTarget = steps.some((step) => step.kind === 'target')
    steps.push({ kind: 'target', repo, mode: hasTarget ? 'add' : 'select' })
  }

  steps.push({
    kind: 'tool',
    seq: event.seq,
    name: event.name,
    label: toolLabel(event.name),
    target: toolTarget(event.arguments),
    status: 'running',
    summary: null,
  })
  return { ...turn, steps, answer: '' }
}

function settleTool(turn: AskTurn, seq: number, summary: string): AskTurn {
  const index = turn.steps.findLastIndex((step) => step.kind === 'tool' && step.seq === seq)
  const step = index === -1 ? undefined : turn.steps[index]
  if (step === undefined || step.kind !== 'tool') return turn
  const settled: ToolStep = {
    ...step,
    status: isFailedSummary(summary) ? 'failed' : 'done',
    summary: summary === '' ? null : summary,
  }
  const steps = [...turn.steps]
  steps[index] = settled
  return { ...turn, steps }
}

/** 종결 시 아직 running 인 도구 행은 실패로 정리한다 (중단 · 응답 없는 종료) */
function settleRunning(steps: AskStep[]): AskStep[] {
  if (!steps.some((step) => step.kind === 'tool' && step.status === 'running')) return steps
  return steps.map((step) =>
    step.kind === 'tool' && step.status === 'running' ? { ...step, status: 'failed' } : step,
  )
}

export function finishAborted(turn: AskTurn): AskTurn {
  if (!isActiveTurn(turn)) return turn
  return { ...turn, status: { kind: 'aborted' }, steps: settleRunning(turn.steps) }
}

export function finishError(turn: AskTurn, info: ApiErrorInfo): AskTurn {
  if (!isActiveTurn(turn)) return turn
  const message = info.message ?? (info.status === null ? NETWORK_HINT : ASK_FALLBACK_ERROR)
  return {
    ...turn,
    status: { kind: 'error', message, status: info.status, retryable: isRetryable(info.status) },
    steps: settleRunning(turn.steps),
  }
}

/** 종결 이벤트(done · error) 없이 스트림이 끝났다 — 재시도 가능한 오류로 본다 */
export function finishIncomplete(turn: AskTurn): AskTurn {
  return finishError(turn, { status: null, message: ASK_INCOMPLETE_ERROR })
}

/**
 * 다음 요청의 messages — 완료(done)되고 답변이 있는 턴만 [질문, 최종 답변] 쌍으로, 최근 20턴, 마지막에 새 질문.
 * 중단 · 오류 턴은 질문까지 제외한다(부분 답변이 모델을 오도하고 user/assistant 교대가 깨진다).
 */
export function buildHistory(turns: AskTurn[], question: string): CodeQaMessageDto[] {
  const completed = turns
    .filter((turn) => turn.status.kind === 'done' && turn.answer.trim() !== '')
    .slice(-MAX_HISTORY_TURNS)
  const history = completed.flatMap<CodeQaMessageDto>((turn) => [
    { role: 'user', content: turn.question },
    { role: 'assistant', content: turn.answer },
  ])
  return [...history, { role: 'user', content: question }]
}
