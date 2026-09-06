import { describe, expect, it } from 'vitest'
import { NETWORK_HINT } from '@/lib/api-error'
import {
  ASK_FALLBACK_ERROR,
  ASK_INCOMPLETE_ERROR,
  MAX_HISTORY_TURNS,
  applyCodeQaEvent,
  buildHistory,
  createTurn,
  finishAborted,
  finishError,
  finishIncomplete,
  isFailedSummary,
  isRetryable,
  toolLabel,
  toolTarget,
} from '@/lib/ask-reducer'
import type { CodeQaEvent, CodeQaToolArgs } from '@/lib/ask-stream'
import type { AskTurn } from '@/types/ask'

const R = 'fitpetmall-backend-v4'

const toolCall = (seq: number, name: string, args: Partial<CodeQaToolArgs> = {}): CodeQaEvent => ({
  type: 'tool_call',
  seq,
  name,
  arguments: { repo: R, ...args },
})
const toolResult = (seq: number, summary: string): CodeQaEvent => ({
  type: 'tool_result',
  seq,
  name: 'x',
  summary,
})
const thinking = (delta: string): CodeQaEvent => ({ type: 'thinking', delta })
const answer = (delta: string): CodeQaEvent => ({ type: 'answer', delta })
const done: CodeQaEvent = {
  type: 'done',
  repos: [{ name: R, commit: 'f3818f6' }],
  iterations: 2,
  elapsedMs: 8800,
}

const run = (events: CodeQaEvent[], turn: AskTurn = createTurn(1, 'q', 0)) =>
  events.reduce(applyCodeQaEvent, turn)

describe('toolLabel', () => {
  it('알려진 도구는 한국어 라벨, 미지 도구는 이름 그대로', () => {
    expect(toolLabel('list_dir')).toBe('폴더 보기')
    expect(toolLabel('search_code')).toBe('코드 검색')
    expect(toolLabel('read_file')).toBe('파일 읽기')
    expect(toolLabel('run_tests')).toBe('run_tests')
  })
})

describe('toolTarget', () => {
  it('repo:path 에 pattern 과 줄 범위를 이어 붙인다', () => {
    expect(toolTarget({ repo: R, path: 'a/b.kt', startLine: 12, endLine: 80 })).toBe(
      `${R}:a/b.kt 12~80줄`,
    )
    expect(toolTarget({ repo: R, pattern: 'mileage|point' })).toBe(`${R} 'mileage|point'`)
    expect(toolTarget({ repo: R })).toBe(R)
    expect(toolTarget({ repo: R, path: 'a.kt', startLine: 5 })).toBe(`${R}:a.kt 5줄~`)
    expect(toolTarget({ repo: R, path: 'a.kt', endLine: 9 })).toBe(`${R}:a.kt ~9줄`)
    expect(toolTarget({ repo: null, path: 'a.kt' })).toBe('a.kt')
    expect(toolTarget({ repo: null })).toBe('')
  })
})

describe('isFailedSummary · isRetryable', () => {
  it('summary 의 "오류" 로 실패를, 503 · 네트워크(null)로 재시도 가능을 판정한다', () => {
    expect(isFailedSummary(`${R} 검색 'x' → 3건`)).toBe(false)
    expect(isFailedSummary('read_file 오류: 파일이 아닙니다: a.kt')).toBe(true)
    expect(isRetryable(503)).toBe(true)
    expect(isRetryable(null)).toBe(true)
    expect(isRetryable(500)).toBe(false)
  })
})

describe('applyCodeQaEvent', () => {
  it('첫 이벤트에서 connecting → streaming', () => {
    const turn = run([thinking('a')])
    expect(turn.status).toEqual({ kind: 'streaming' })
  })

  it('thinking: 연속 델타는 한 행으로 잇고, 도구 호출 뒤에는 새 행, 빈 델타는 무시', () => {
    const turn = run([
      thinking('a'),
      thinking('b'),
      toolCall(1, 'read_file'),
      thinking(''),
      thinking('c'),
    ])
    const rows = turn.steps.filter((step) => step.kind === 'thinking')
    expect(rows).toEqual([
      { kind: 'thinking', text: 'ab' },
      { kind: 'thinking', text: 'c' },
    ])
  })

  it('첫 tool_call: 대상 선택 행을 합성하고 도구 행을 running 으로 추가한다', () => {
    const turn = run([toolCall(1, 'search_code', { pattern: 'mileage' })])
    expect(turn.steps).toEqual([
      { kind: 'target', repo: R, mode: 'select' },
      {
        kind: 'tool',
        seq: 1,
        name: 'search_code',
        label: '코드 검색',
        target: `${R} 'mileage'`,
        status: 'running',
        summary: null,
      },
    ])
  })

  it('같은 repo 는 대상 행을 다시 만들지 않고, 새 repo 는 "대상 추가" 행', () => {
    const turn = run([
      toolCall(1, 'read_file'),
      toolCall(2, 'read_file'),
      toolCall(3, 'list_dir', { repo: 'fitpetmall-frontend' }),
    ])
    const targets = turn.steps.filter((step) => step.kind === 'target')
    expect(targets).toEqual([
      { kind: 'target', repo: R, mode: 'select' },
      { kind: 'target', repo: 'fitpetmall-frontend', mode: 'add' },
    ])
  })

  it('repo 가 없는 tool_call 은 대상 행을 만들지 않는다', () => {
    const turn = run([toolCall(1, 'read_file', { repo: null })])
    expect(turn.steps.map((step) => step.kind)).toEqual(['tool'])
  })

  it('answer 뒤에 tool_call 이 오면 중간 설명(note) → 대상 → 도구 순으로 옮기고 answer 를 비운다', () => {
    const turn = run([answer('먼저 '), answer('정책부터 볼게요.'), toolCall(1, 'read_file')])
    expect(turn.steps.map((step) => step.kind)).toEqual(['note', 'target', 'tool'])
    expect(turn.steps[0]).toEqual({ kind: 'note', text: '먼저 정책부터 볼게요.' })
    expect(turn.answer).toBe('')
  })

  it('공백만 있는 answer 는 note 를 만들지 않는다', () => {
    const turn = run([answer('  \n'), toolCall(1, 'read_file')])
    expect(turn.steps.map((step) => step.kind)).toEqual(['target', 'tool'])
  })

  it('tool_result: seq 로 짝을 찾아 done/failed 로 바꾸고, 모르는 seq 는 그대로', () => {
    const before = run([toolCall(1, 'read_file'), toolCall(2, 'search_code')])
    const after = applyCodeQaEvent(before, toolResult(2, `${R} 검색 'x' → 3건`))
    expect(after.steps[2]).toMatchObject({ status: 'done', summary: `${R} 검색 'x' → 3건` })
    expect(after.steps[1]).toBe(before.steps[1]) // 안 바뀐 행은 참조 유지

    const failed = applyCodeQaEvent(after, toolResult(1, 'read_file 오류: 파일이 아닙니다'))
    expect(failed.steps[1]).toMatchObject({ status: 'failed' })

    expect(applyCodeQaEvent(failed, toolResult(9, 'x'))).toBe(failed)
  })

  it('answer 는 그대로 누적된다', () => {
    expect(run([answer('a\n'), answer('b')]).answer).toBe('a\nb')
  })

  it('done: 상태·메타를 기록하고 running 도구는 실패로 정리한다', () => {
    const turn = run([toolCall(1, 'read_file'), answer('끝'), done])
    expect(turn.status).toEqual({ kind: 'done' })
    expect(turn.meta).toEqual({
      repos: [{ name: R, commit: 'f3818f6' }],
      iterations: 2,
      elapsedMs: 8800,
    })
    expect(turn.steps[1]).toMatchObject({ status: 'failed' })
    expect(turn.answer).toBe('끝')
  })

  it('error: 503 은 재시도 가능, 500 은 불가, 메시지가 없으면 폴백 문구', () => {
    const unavailable = run([{ type: 'error', status: 503, message: 'LLM 불가' }])
    expect(unavailable.status).toEqual({
      kind: 'error',
      message: 'LLM 불가',
      status: 503,
      retryable: true,
    })
    const internal = run([{ type: 'error', status: 500, message: null }])
    expect(internal.status).toEqual({
      kind: 'error',
      message: ASK_FALLBACK_ERROR,
      status: 500,
      retryable: false,
    })
  })

  it('종결된 턴은 어떤 이벤트에도 바뀌지 않는다', () => {
    const finished = run([answer('a'), done])
    expect(applyCodeQaEvent(finished, answer('late'))).toBe(finished)
    expect(applyCodeQaEvent(finished, toolCall(5, 'read_file'))).toBe(finished)
    const errored = run([{ type: 'error', status: 500, message: null }])
    expect(applyCodeQaEvent(errored, done)).toBe(errored)
  })
})

describe('finishAborted · finishError · finishIncomplete', () => {
  it('중단: 받은 내용은 유지하고 running 도구만 실패로', () => {
    const turn = finishAborted(run([toolCall(1, 'read_file'), answer('부분')]))
    expect(turn.status).toEqual({ kind: 'aborted' })
    expect(turn.answer).toBe('부분')
    expect(turn.steps[1]).toMatchObject({ status: 'failed' })
    expect(finishAborted(turn)).toBe(turn)
  })

  it('오류: 서버 메시지가 없으면 네트워크(null)는 NETWORK_HINT, 그 외는 폴백', () => {
    const network = finishError(createTurn(1, 'q', 0), { status: null, message: null })
    expect(network.status).toEqual({
      kind: 'error',
      message: NETWORK_HINT,
      status: null,
      retryable: true,
    })
    const server = finishError(createTurn(1, 'q', 0), { status: 500, message: null })
    expect(server.status).toMatchObject({ message: ASK_FALLBACK_ERROR, retryable: false })
    const finished = run([done])
    expect(finishError(finished, { status: 500, message: 'x' })).toBe(finished)
  })

  it('종결 없는 EOF 는 재시도 가능한 오류', () => {
    const turn = finishIncomplete(run([thinking('a')]))
    expect(turn.status).toEqual({
      kind: 'error',
      message: ASK_INCOMPLETE_ERROR,
      status: null,
      retryable: true,
    })
  })
})

describe('buildHistory', () => {
  const doneTurn = (id: number, question: string, text: string) =>
    run([answer(text), done], createTurn(id, question, 0))

  it('완료된 턴만 [질문, 답변] 쌍으로 넣고 마지막에 새 질문을 붙인다', () => {
    const turns: AskTurn[] = [
      doneTurn(1, 'q1', 'a1'),
      finishAborted(run([answer('partial')], createTurn(2, 'q2', 0))),
      run([{ type: 'error', status: 503, message: null }], createTurn(3, 'q3', 0)),
      run([done], createTurn(4, 'q4', 0)), // 답변 없이 끝난 턴
      doneTurn(5, 'q5', 'a5'),
    ]
    expect(buildHistory(turns, 'q6')).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q5' },
      { role: 'assistant', content: 'a5' },
      { role: 'user', content: 'q6' },
    ])
  })

  it('첫 질문은 그것만 보내고, 이력은 최근 MAX_HISTORY_TURNS 턴으로 자른다', () => {
    expect(buildHistory([], 'q')).toEqual([{ role: 'user', content: 'q' }])
    const many = Array.from({ length: MAX_HISTORY_TURNS + 3 }, (_, i) =>
      doneTurn(i + 1, `q${i + 1}`, `a${i + 1}`),
    )
    const history = buildHistory(many, 'new')
    expect(history).toHaveLength(MAX_HISTORY_TURNS * 2 + 1)
    expect(history[0]).toEqual({ role: 'user', content: 'q4' })
  })
})
