import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAskSession } from '@/hooks/useAskSession'
import { ASK_INCOMPLETE_ERROR } from '@/lib/ask-reducer'
import { AskRequestError, type CodeQaEvent, type StreamCodeQaChatOptions } from '@/lib/ask-stream'

const streamMock = vi.fn<(options: StreamCodeQaChatOptions) => Promise<void>>()

vi.mock('@/lib/ask-stream', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ask-stream')>()),
  streamCodeQaChat: (options: StreamCodeQaChatOptions) => streamMock(options),
}))

/** 손으로 제어하는 가짜 스트림 — emit 으로 이벤트, finish/fail 로 종료, 중단 시 AbortError reject */
function deferredStream() {
  const handle = {
    options: null as StreamCodeQaChatOptions | null,
    finish: () => {},
    fail: (() => {}) as (error: unknown) => void,
    emit(event: CodeQaEvent) {
      handle.options?.onEvent(event)
    },
  }
  streamMock.mockImplementationOnce(
    (options) =>
      new Promise<void>((resolve, reject) => {
        handle.options = options
        handle.finish = resolve
        handle.fail = reject
        options.signal.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        )
      }),
  )
  return handle
}

const done: CodeQaEvent = { type: 'done', repos: [], iterations: 1, elapsedMs: 10 }
const readFile: CodeQaEvent = {
  type: 'tool_call',
  seq: 1,
  name: 'read_file',
  arguments: { repo: 'r', path: 'a.kt' },
}

const flush = () => act(async () => {})

describe('useAskSession', () => {
  beforeEach(() => {
    streamMock.mockReset()
  })

  it('send: 턴을 connecting 으로 추가하고 busy, 첫 질문은 messages 에 그것만 실린다', () => {
    const stream = deferredStream()
    const { result } = renderHook(() => useAskSession())

    act(() => void result.current.send('  적립금 비율은?  '))

    expect(result.current.busy).toBe(true)
    expect(result.current.turns).toHaveLength(1)
    expect(result.current.turns[0]).toMatchObject({
      question: '적립금 비율은?',
      status: { kind: 'connecting' },
    })
    expect(stream.options?.messages).toEqual([{ role: 'user', content: '적립금 비율은?' }])
  })

  it('빈 질문이나 진행 중에는 보내지 않는다', () => {
    deferredStream()
    const { result } = renderHook(() => useAskSession())

    act(() => void result.current.send('   '))
    expect(streamMock).not.toHaveBeenCalled()

    act(() => void result.current.send('q1'))
    act(() => void result.current.send('q2'))
    expect(streamMock).toHaveBeenCalledTimes(1)
    expect(result.current.turns).toHaveLength(1)
  })

  it('이벤트가 턴에 반영되고, done 뒤 resolve 되면 done 을 유지하며 busy 가 풀린다', async () => {
    const stream = deferredStream()
    const { result } = renderHook(() => useAskSession())
    act(() => void result.current.send('q'))

    act(() => {
      stream.emit({ type: 'thinking', delta: '생각' })
      stream.emit(readFile)
      stream.emit({ type: 'answer', delta: '답' })
      stream.emit(done)
    })
    expect(result.current.turns[0]?.status).toEqual({ kind: 'done' })
    expect(result.current.turns[0]?.steps.map((step) => step.kind)).toEqual([
      'thinking',
      'target',
      'tool',
    ])

    stream.finish()
    await flush()
    expect(result.current.turns[0]?.status).toEqual({ kind: 'done' })
    expect(result.current.busy).toBe(false)
  })

  it('후속 질문: 완료된 턴의 질문·답변 쌍 뒤에 새 질문이 실린다', async () => {
    const first = deferredStream()
    const { result } = renderHook(() => useAskSession())
    act(() => void result.current.send('q1'))
    act(() => {
      first.emit({ type: 'answer', delta: 'a1' })
      first.emit(done)
    })
    first.finish()
    await flush()

    const second = deferredStream()
    act(() => void result.current.send('q2'))
    expect(second.options?.messages).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2' },
    ])
  })

  it('종결 이벤트 없이 끝나면 재시도 가능한 오류로 기록한다', async () => {
    const stream = deferredStream()
    const { result } = renderHook(() => useAskSession())
    act(() => void result.current.send('q'))
    act(() => stream.emit({ type: 'thinking', delta: 'x' }))

    stream.finish()
    await flush()
    expect(result.current.turns[0]?.status).toEqual({
      kind: 'error',
      message: ASK_INCOMPLETE_ERROR,
      status: null,
      retryable: true,
    })
  })

  it('abort: 즉시 aborted 로 바꾸고 부분 답변은 남기며, 이후 이벤트는 무시한다', async () => {
    const stream = deferredStream()
    const { result } = renderHook(() => useAskSession())
    act(() => void result.current.send('q'))
    act(() => {
      stream.emit(readFile)
      stream.emit({ type: 'answer', delta: '부분' })
    })

    act(() => result.current.abort())
    expect(result.current.busy).toBe(false)
    expect(result.current.turns[0]).toMatchObject({
      status: { kind: 'aborted' },
      answer: '부분',
    })
    expect(result.current.turns[0]?.steps[1]).toMatchObject({ status: 'failed' })

    await flush() // fetch 의 AbortError reject 처리
    act(() => stream.emit({ type: 'answer', delta: ' 늦은 델타' }))
    expect(result.current.turns[0]?.answer).toBe('부분')
    expect(result.current.turns[0]?.status).toEqual({ kind: 'aborted' })
  })

  it('abort 직후 바로 보내도 새 턴이 시작된다 (fetch 의 reject 를 기다리지 않는다)', async () => {
    const first = deferredStream()
    const { result } = renderHook(() => useAskSession())
    act(() => void result.current.send('q1'))
    act(() => result.current.abort())

    const second = deferredStream()
    act(() => void result.current.send('q2'))
    expect(streamMock).toHaveBeenCalledTimes(2)
    expect(result.current.turns.map((turn) => turn.status.kind)).toEqual(['aborted', 'connecting'])
    expect(second.options?.messages).toEqual([{ role: 'user', content: 'q2' }])

    await flush() // 첫 스트림의 AbortError reject 가 늦게 처리돼도 두 번째 턴은 그대로
    expect(first.options?.signal.aborted).toBe(true)
    expect(result.current.turns[1]?.status).toEqual({ kind: 'connecting' })
  })

  it('503 오류는 재시도 가능하고, retry 는 실패 턴을 지우고 같은 질문을 다시 보낸다', async () => {
    const stream = deferredStream()
    const { result } = renderHook(() => useAskSession())
    act(() => void result.current.send('q'))
    stream.fail(new AskRequestError(503, 'LLM 불가'))
    await flush()
    expect(result.current.turns[0]?.status).toEqual({
      kind: 'error',
      message: 'LLM 불가',
      status: 503,
      retryable: true,
    })

    const again = deferredStream()
    const failedId = result.current.turns[0]!.id
    act(() => result.current.retry(failedId))
    expect(result.current.turns).toHaveLength(1)
    expect(result.current.turns[0]).toMatchObject({ question: 'q', status: { kind: 'connecting' } })
    expect(result.current.turns[0]?.id).not.toBe(failedId)
    expect(again.options?.messages).toEqual([{ role: 'user', content: 'q' }])
  })

  it('500 오류는 재시도 불가 — retry 는 무시된다', async () => {
    const stream = deferredStream()
    const { result } = renderHook(() => useAskSession())
    act(() => void result.current.send('q'))
    stream.fail(new AskRequestError(500, '서버 오류'))
    await flush()
    expect(result.current.turns[0]?.status).toMatchObject({ kind: 'error', retryable: false })

    act(() => result.current.retry(result.current.turns[0]!.id))
    expect(streamMock).toHaveBeenCalledTimes(1)
    expect(result.current.turns[0]?.status).toMatchObject({ kind: 'error' })
  })

  it('reset: 진행 중 요청을 끊고 모두 비우며, 늦은 이벤트·종료는 무시한다', async () => {
    const stream = deferredStream()
    const { result } = renderHook(() => useAskSession())
    act(() => void result.current.send('q'))
    act(() => stream.emit({ type: 'thinking', delta: 'x' }))

    act(() => result.current.reset())
    expect(result.current.turns).toEqual([])
    expect(result.current.busy).toBe(false)
    expect(stream.options?.signal.aborted).toBe(true)

    await flush()
    act(() => stream.emit({ type: 'answer', delta: 'late' }))
    expect(result.current.turns).toEqual([])

    // reset 직후 바로 새 질문을 보낼 수 있다
    const next = deferredStream()
    act(() => void result.current.send('q2'))
    expect(next.options?.messages).toEqual([{ role: 'user', content: 'q2' }])
  })

  it('언마운트하면 진행 중 요청을 끊는다', () => {
    const stream = deferredStream()
    const { result, unmount } = renderHook(() => useAskSession())
    act(() => void result.current.send('q'))
    unmount()
    expect(stream.options?.signal.aborted).toBe(true)
  })
})
