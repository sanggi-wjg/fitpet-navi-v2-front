import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AskRequestError,
  askErrorInfo,
  createSseParser,
  parseCodeQaEvent,
  streamCodeQaChat,
  type CodeQaEvent,
} from '@/lib/ask-stream'

const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

describe('createSseParser', () => {
  it('한 청크에 프레임이 여러 개면 순서대로 돌려준다', () => {
    const parser = createSseParser()
    expect(parser.push('event: a\ndata: 1\n\nevent: b\ndata: 2\n\n')).toEqual([
      { event: 'a', data: '1' },
      { event: 'b', data: '2' },
    ])
  })

  it('프레임이 청크 경계에 걸려도 합쳐서 돌려준다', () => {
    const parser = createSseParser()
    expect(parser.push('event: thin')).toEqual([])
    expect(parser.push('king\ndata: {"a"')).toEqual([])
    expect(parser.push(':1}\n\n')).toEqual([{ event: 'thinking', data: '{"a":1}' }])
  })

  it('CRLF: \\r 과 \\n 이 다른 청크에 갈려도 처리한다', () => {
    const parser = createSseParser()
    const first = parser.push('event: x\r')
    const second = parser.push('\ndata: y\r\n\r\n')
    expect([...first, ...second]).toEqual([{ event: 'x', data: 'y' }])
  })

  it('주석·id·retry 줄은 무시하고 event 가 없으면 message 로 본다', () => {
    const parser = createSseParser()
    expect(parser.push(': ping\nid: 3\nretry: 1000\ndata: hello\n\n')).toEqual([
      { event: 'message', data: 'hello' },
    ])
  })

  it('data 없는 빈 줄은 프레임을 만들지 않고, 다중 data 는 개행으로 잇는다', () => {
    const parser = createSseParser()
    expect(parser.push('\n\nevent: e\n\n')).toEqual([])
    expect(parser.push('data: a\ndata: b\n\n')).toEqual([{ event: 'message', data: 'a\nb' }])
  })

  it('flush: 종료 개행 없이 끝난 마지막 프레임을 돌려주고 두 번째는 비어 있다', () => {
    const parser = createSseParser()
    expect(parser.push('event: done\ndata: {}')).toEqual([])
    expect(parser.flush()).toEqual([{ event: 'done', data: '{}' }])
    expect(parser.flush()).toEqual([])
  })
})

describe('parseCodeQaEvent', () => {
  it('타입별로 변환하고 snake_case 를 camelCase 로 바꾼다', () => {
    expect(parseCodeQaEvent({ event: 'thinking', data: '{"delta":"a"}' })).toEqual({
      type: 'thinking',
      delta: 'a',
    })
    expect(parseCodeQaEvent({ event: 'answer', data: '{"delta":"b"}' })).toEqual({
      type: 'answer',
      delta: 'b',
    })
    expect(
      parseCodeQaEvent({
        event: 'tool_call',
        data: JSON.stringify({
          seq: 1,
          name: 'read_file',
          arguments: { repo: 'r', path: 'p', start_line: 1, end_line: 9 },
        }),
      }),
    ).toEqual({
      type: 'tool_call',
      seq: 1,
      name: 'read_file',
      arguments: { repo: 'r', path: 'p', startLine: 1, endLine: 9 },
    })
    expect(
      parseCodeQaEvent({
        event: 'tool_result',
        data: JSON.stringify({ seq: 1, name: 'read_file', summary: 's', content: 'long' }),
      }),
    ).toEqual({ type: 'tool_result', seq: 1, name: 'read_file', summary: 's' })
    expect(
      parseCodeQaEvent({
        event: 'done',
        data: JSON.stringify({
          repos: [{ name: 'r', commit: 'abc' }, { name: 'x', commit: null }, { bad: 1 }],
          iterations: 2,
          elapsed_ms: 8800,
        }),
      }),
    ).toEqual({
      type: 'done',
      repos: [
        { name: 'r', commit: 'abc' },
        { name: 'x', commit: null },
      ],
      iterations: 2,
      elapsedMs: 8800,
    })
    expect(
      parseCodeQaEvent({
        event: 'error',
        data: JSON.stringify({ status: 503, statusText: 'X', message: 'm', timestamp: 't' }),
      }),
    ).toEqual({ type: 'error', status: 503, message: 'm' })
  })

  it('깨진 JSON · 모르는 event · 필드 타입 불일치는 null', () => {
    expect(parseCodeQaEvent({ event: 'thinking', data: '{oops' })).toBeNull()
    expect(parseCodeQaEvent({ event: 'ping', data: '{}' })).toBeNull()
    expect(parseCodeQaEvent({ event: 'thinking', data: '{"delta":1}' })).toBeNull()
    expect(parseCodeQaEvent({ event: 'tool_call', data: '{"seq":"1","name":"x"}' })).toBeNull()
    expect(parseCodeQaEvent({ event: 'done', data: '[]' })).toBeNull()
  })

  it('arguments 가 없으면 repo null, done · error 필드가 없으면 기본값', () => {
    expect(parseCodeQaEvent({ event: 'tool_call', data: '{"seq":1,"name":"x"}' })).toEqual({
      type: 'tool_call',
      seq: 1,
      name: 'x',
      arguments: { repo: null },
    })
    expect(parseCodeQaEvent({ event: 'done', data: '{}' })).toEqual({
      type: 'done',
      repos: [],
      iterations: 0,
      elapsedMs: 0,
    })
    expect(parseCodeQaEvent({ event: 'error', data: '{}' })).toEqual({
      type: 'error',
      status: 500,
      message: null,
    })
  })
})

describe('askErrorInfo', () => {
  it('AskRequestError 는 status·서버 메시지를, 그 외는 null 쌍을 돌려준다', () => {
    expect(askErrorInfo(new AskRequestError(503, 'm'))).toEqual({ status: 503, message: 'm' })
    expect(askErrorInfo(new AskRequestError(null, null))).toEqual({ status: null, message: null })
    expect(askErrorInfo(new Error('x'))).toEqual({ status: null, message: null })
  })
})

describe('streamCodeQaChat', () => {
  const encoder = new TextEncoder()
  const fetchMock = vi.fn<typeof fetch>()
  const messages = [{ role: 'user' as const, content: 'q' }]

  const sseResponse = (chunks: (string | Uint8Array)[]) =>
    new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk)
          }
          controller.close()
        },
      }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    )

  const collect = async (chunks: (string | Uint8Array)[]) => {
    const events: CodeQaEvent[] = []
    fetchMock.mockResolvedValue(sseResponse(chunks))
    await streamCodeQaChat({
      messages,
      signal: new AbortController().signal,
      onEvent: (event) => events.push(event),
    })
    return events
  }

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('요청: code-qa 경로에 POST, SSE Accept 헤더, debug 없는 body', async () => {
    await collect([frame('done', { repos: [], iterations: 1, elapsed_ms: 1 })])
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/v1/code-qa/chat')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ Accept: 'text/event-stream' })
    expect(JSON.parse(init?.body as string)).toEqual({ messages })
  })

  it('이벤트를 순서대로 전달하고 한글이 바이트 경계에 걸려도 복원한다', async () => {
    const answer = encoder.encode(frame('answer', { delta: '적립금' }))
    // 'event: answer\ndata: {"delta":"' 는 30바이트 — 31에서 자르면 "적"(3바이트)이 갈린다
    const events = await collect([
      frame('thinking', { delta: 't' }),
      answer.slice(0, 31),
      answer.slice(31),
      frame('done', { repos: [{ name: 'r', commit: 'c' }], iterations: 1, elapsed_ms: 5 }),
    ])
    expect(events).toEqual([
      { type: 'thinking', delta: 't' },
      { type: 'answer', delta: '적립금' },
      { type: 'done', repos: [{ name: 'r', commit: 'c' }], iterations: 1, elapsedMs: 5 },
    ])
  })

  it('done 뒤에 오는 프레임은 무시한다', async () => {
    const events = await collect([
      frame('done', { repos: [], iterations: 1, elapsed_ms: 1 }) +
        frame('answer', { delta: 'late' }),
    ])
    expect(events.map((event) => event.type)).toEqual(['done'])
  })

  it('종결 이벤트 없이 EOF: 받은 이벤트만 전달하고 resolve 한다 (종료 개행 없어도)', async () => {
    const events = await collect(['event: thinking\ndata: {"delta":"x"}'])
    expect(events).toEqual([{ type: 'thinking', delta: 'x' }])
  })

  it('비-2xx: AskRequestError(status, 서버 message) — JSON 이 아니면 message null', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: 500, statusText: 'E', message: '서버 오류' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    await expect(
      streamCodeQaChat({ messages, signal: new AbortController().signal, onEvent: () => {} }),
    ).rejects.toMatchObject({ name: 'AskRequestError', status: 500, serverMessage: '서버 오류' })

    fetchMock.mockResolvedValue(new Response('nope', { status: 422 }))
    await expect(
      streamCodeQaChat({ messages, signal: new AbortController().signal, onEvent: () => {} }),
    ).rejects.toMatchObject({ status: 422, serverMessage: null })
  })

  it('응답에 body 가 없으면 status null 인 AskRequestError', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
    await expect(
      streamCodeQaChat({ messages, signal: new AbortController().signal, onEvent: () => {} }),
    ).rejects.toMatchObject({ name: 'AskRequestError', status: null })
  })

  it('fetch 가 끝나기 전에 중단되면 AbortError 를 그대로 던진다', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          )
        }),
    )
    const promise = streamCodeQaChat({ messages, signal: controller.signal, onEvent: () => {} })
    controller.abort()
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('fetch 자체가 실패하면 status null 인 AskRequestError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(
      streamCodeQaChat({ messages, signal: new AbortController().signal, onEvent: () => {} }),
    ).rejects.toMatchObject({ name: 'AskRequestError', status: null })
  })

  it('중단: AbortError 로 reject 되고 이후 onEvent 는 없다', async () => {
    const controller = new AbortController()
    let source!: ReadableStreamDefaultController<Uint8Array>
    const stream = new ReadableStream<Uint8Array>({
      start(streamController) {
        source = streamController
      },
    })
    fetchMock.mockImplementation((_input, init) => {
      init?.signal?.addEventListener('abort', () =>
        source.error(new DOMException('aborted', 'AbortError')),
      )
      return Promise.resolve(new Response(stream, { status: 200 }))
    })

    const events: CodeQaEvent[] = []
    const promise = streamCodeQaChat({
      messages,
      signal: controller.signal,
      onEvent: (event) => events.push(event),
    })
    source.enqueue(encoder.encode(frame('thinking', { delta: 'a' })))
    await vi.waitFor(() => expect(events).toHaveLength(1))

    controller.abort()
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(events).toHaveLength(1)
  })
})
