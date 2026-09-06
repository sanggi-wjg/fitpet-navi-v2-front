import type { CodeQaChatRequestDto, CodeQaMessageDto, ErrorResponseDto } from '@/api/model'
import type { ApiErrorInfo } from '@/lib/api-error'
import { API_BASE_URL } from '@/lib/env'
import type { AskRepoRef } from '@/types/ask'

/**
 * 구현 확인 스트림 리더 — `POST /api/v1/code-qa/chat` 의 SSE 를 fetch + ReadableStream 으로 읽는다.
 * orval 은 스트리밍 응답을 만들지 못하므로 요청 DTO 타입만 생성물에서 가져오고 리더는 여기서 직접 쓴다.
 * 이벤트 → 뷰 모델 변환은 `src/lib/ask-reducer.ts`. 명세는 `docs/ask-stream-contract.md`.
 */

export const CODE_QA_CHAT_PATH = '/api/v1/code-qa/chat'

// ---------------------------------------------------------------------------
// SSE 프레임 파서 — 청크 경계·CRLF 에 안전한 증분 파서
// ---------------------------------------------------------------------------

export interface SseFrame {
  event: string
  data: string
}

export interface SseParser {
  /** 청크를 넣고 그 사이 완성된 프레임을 돌려준다 */
  push(chunk: string): SseFrame[]
  /** 스트림 끝 — 종료 개행 없이 남은 프레임을 돌려준다 */
  flush(): SseFrame[]
}

export function createSseParser(): SseParser {
  let buffer = ''
  let event = 'message'
  let dataLines: string[] = []

  const dispatch = (out: SseFrame[]) => {
    if (dataLines.length > 0) out.push({ event, data: dataLines.join('\n') })
    event = 'message'
    dataLines = []
  }

  const handleLine = (rawLine: string, out: SseFrame[]) => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
    if (line === '') {
      dispatch(out)
      return
    }
    if (line.startsWith(':')) return // 주석(heartbeat)
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    let value = colon === -1 ? '' : line.slice(colon + 1)
    if (value.startsWith(' ')) value = value.slice(1)
    if (field === 'event') event = value
    else if (field === 'data') dataLines.push(value)
    // id · retry · 그 외 필드는 쓰지 않는다
  }

  return {
    push(chunk) {
      const out: SseFrame[] = []
      buffer += chunk
      let newline = buffer.indexOf('\n')
      while (newline !== -1) {
        handleLine(buffer.slice(0, newline), out)
        buffer = buffer.slice(newline + 1)
        newline = buffer.indexOf('\n')
      }
      return out
    },
    flush() {
      const out: SseFrame[] = []
      if (buffer !== '') {
        handleLine(buffer, out)
        buffer = ''
      }
      dispatch(out)
      return out
    },
  }
}

// ---------------------------------------------------------------------------
// 이벤트 디코딩 — 서버 payload(snake_case) → 와이어 타입(camelCase)
// ---------------------------------------------------------------------------

export interface CodeQaToolArgs {
  /** 도구가 접근한 레포 이름 — 첫 tool_call 의 repo 가 "대상 선택" 결과다 */
  repo: string | null
  path?: string
  pattern?: string
  startLine?: number
  endLine?: number
}

export type CodeQaEvent =
  | { type: 'thinking'; delta: string }
  | { type: 'tool_call'; seq: number; name: string; arguments: CodeQaToolArgs }
  /** content(도구 결과 전문)는 debug 전용이라 버린다 */
  | { type: 'tool_result'; seq: number; name: string; summary: string }
  | { type: 'answer'; delta: string }
  | { type: 'done'; repos: AskRepoRef[]; iterations: number; elapsedMs: number }
  | { type: 'error'; status: number; message: string | null }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

function toToolArgs(raw: unknown): CodeQaToolArgs {
  if (!isRecord(raw)) return { repo: null }
  const args: CodeQaToolArgs = { repo: asString(raw.repo) ?? null }
  const path = asString(raw.path)
  if (path !== undefined) args.path = path
  const pattern = asString(raw.pattern)
  if (pattern !== undefined) args.pattern = pattern
  const startLine = asNumber(raw.start_line)
  if (startLine !== undefined) args.startLine = startLine
  const endLine = asNumber(raw.end_line)
  if (endLine !== undefined) args.endLine = endLine
  return args
}

function toRepos(raw: unknown): AskRepoRef[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item): AskRepoRef[] => {
    if (!isRecord(item)) return []
    const name = asString(item.name)
    if (name === undefined) return []
    return [{ name, commit: asString(item.commit) ?? null }]
  })
}

/** 프레임 하나를 이벤트로. 깨진 JSON·모르는 event·필드 불일치는 null(전방 호환으로 무시) */
export function parseCodeQaEvent(frame: SseFrame): CodeQaEvent | null {
  let payload: unknown
  try {
    payload = JSON.parse(frame.data)
  } catch {
    return null
  }
  if (!isRecord(payload)) return null

  switch (frame.event) {
    case 'thinking':
    case 'answer': {
      const delta = asString(payload.delta)
      return delta === undefined ? null : { type: frame.event, delta }
    }
    case 'tool_call': {
      const seq = asNumber(payload.seq)
      const name = asString(payload.name)
      if (seq === undefined || name === undefined) return null
      return { type: 'tool_call', seq, name, arguments: toToolArgs(payload.arguments) }
    }
    case 'tool_result': {
      const seq = asNumber(payload.seq)
      const name = asString(payload.name)
      if (seq === undefined || name === undefined) return null
      return { type: 'tool_result', seq, name, summary: asString(payload.summary) ?? '' }
    }
    case 'done':
      return {
        type: 'done',
        repos: toRepos(payload.repos),
        iterations: asNumber(payload.iterations) ?? 0,
        elapsedMs: asNumber(payload.elapsed_ms) ?? 0,
      }
    case 'error':
      return {
        type: 'error',
        status: asNumber(payload.status) ?? 500,
        message: asString(payload.message) ?? null,
      }
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// fetch 리더
// ---------------------------------------------------------------------------

/** 스트림이 시작되기 전의 실패(비-2xx · 네트워크). status null = 네트워크 단절이나 본문 없음 */
export class AskRequestError extends Error {
  readonly status: number | null
  readonly serverMessage: string | null

  constructor(status: number | null, serverMessage: string | null) {
    super(serverMessage ?? (status === null ? 'network error' : `HTTP ${status}`))
    this.name = 'AskRequestError'
    this.status = status
    this.serverMessage = serverMessage
  }
}

/** `apiErrorInfo` 의 fetch 판 — axios 를 쓰지 않으므로 여기서 따로 뽑는다 */
export function askErrorInfo(error: unknown): ApiErrorInfo {
  if (error instanceof AskRequestError) {
    return { status: error.status, message: error.serverMessage }
  }
  return { status: null, message: null }
}

export interface StreamCodeQaChatOptions {
  messages: CodeQaMessageDto[]
  signal: AbortSignal
  onEvent: (event: CodeQaEvent) => void
  /** true 면 tool_result 에 도구 결과 전문이 실린다 — MVP 는 쓰지 않는다 */
  debug?: boolean
}

/**
 * 스트림을 끝까지 읽으며 이벤트마다 onEvent 를 부른다.
 * done/error 이벤트 뒤의 프레임은 무시하고 연결을 끊는다. 종결 이벤트 없이 EOF 가 오면 그대로 resolve 하며,
 * "끊긴 응답" 처리는 호출 측(useAskSession)이 맡는다. 중단(AbortController)은 AbortError 로 reject 된다.
 */
export async function streamCodeQaChat({
  messages,
  signal,
  onEvent,
  debug,
}: StreamCodeQaChatOptions): Promise<void> {
  const body: CodeQaChatRequestDto = debug ? { messages, debug: true } : { messages }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${CODE_QA_CHAT_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new AskRequestError(null, null)
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as Partial<ErrorResponseDto> | null
    throw new AskRequestError(
      response.status,
      typeof data?.message === 'string' ? data.message : null,
    )
  }
  if (!response.body) throw new AskRequestError(null, null)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const parser = createSseParser()
  let terminal = false

  const emit = (frames: SseFrame[]) => {
    for (const frame of frames) {
      if (terminal) return
      const event = parseCodeQaEvent(frame)
      if (!event) continue
      onEvent(event)
      if (event.type === 'done' || event.type === 'error') terminal = true
    }
  }

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      emit(parser.push(decoder.decode(value, { stream: true })))
      if (terminal) return
    }
    emit(parser.push(decoder.decode()))
    emit(parser.flush())
  } finally {
    // 종결 이벤트 뒤 · onEvent 예외 · 중단 — 어느 경로든 연결을 정리한다 (다 읽은 뒤에는 no-op)
    void reader.cancel().catch(() => undefined)
  }
}
