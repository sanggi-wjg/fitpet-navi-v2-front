import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AskTurnView } from '@/components/ask/AskTurnView'
import { applyCodeQaEvent, createTurn, finishAborted, finishError } from '@/lib/ask-reducer'
import type { CodeQaEvent } from '@/lib/ask-stream'
import type { AskTurn } from '@/types/ask'

const R = 'fitpetmall-backend-v4'
const build = (events: CodeQaEvent[], id = 1) =>
  events.reduce(applyCodeQaEvent, createTurn(id, '기준 금액은?', 0))
const renderTurn = (turn: AskTurn, busy = false) => {
  const onRetry = vi.fn()
  render(<AskTurnView turn={turn} busy={busy} onRetry={onRetry} />)
  return onRetry
}

describe('AskTurnView', () => {
  it('connecting: 질문 말풍선과 연결 중 안내', () => {
    renderTurn(createTurn(1, '기준 금액은?', 0))
    expect(screen.getByText('기준 금액은?')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('코드베이스에 연결하는 중…')
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true')
  })

  it('streaming: 대상 선택 · 도구 라벨 · target · summary · 상태와 설명(note) 행을 그린다', () => {
    const turn = build([
      { type: 'thinking', delta: '적립금 정책부터 볼게요.' },
      {
        type: 'tool_call',
        seq: 1,
        name: 'search_code',
        arguments: { repo: R, pattern: 'mileage' },
      },
      { type: 'tool_result', seq: 1, name: 'search_code', summary: `${R} 검색 'mileage' → 3건` },
      { type: 'answer', delta: '먼저 정책을 확인했어요.' },
      {
        type: 'tool_call',
        seq: 2,
        name: 'read_file',
        arguments: { repo: R, path: 'a.kt', startLine: 1, endLine: 9 },
      },
    ])
    renderTurn(turn)

    const items = within(screen.getByRole('list', { name: '탐색 과정' })).getAllByRole('listitem')
    expect(items).toHaveLength(5) // 생각 · 대상 선택 · 코드 검색 · 설명 · 파일 읽기
    expect(screen.getByText('적립금 정책부터 볼게요.')).toBeInTheDocument()
    expect(screen.getByText('대상 선택')).toBeInTheDocument()
    expect(screen.getByText(R)).toBeInTheDocument()
    expect(screen.getByText('코드 검색')).toBeInTheDocument()
    expect(screen.getByText(`${R} 'mileage'`)).toBeInTheDocument()
    expect(screen.getByText(`${R} 검색 'mileage' → 3건`)).toBeInTheDocument()
    expect(screen.getByText('설명')).toBeInTheDocument()
    expect(screen.getByText('먼저 정책을 확인했어요.')).toBeInTheDocument()
    expect(screen.getByText('파일 읽기')).toBeInTheDocument()
    expect(screen.getByText(`${R}:a.kt 1~9줄`)).toBeInTheDocument()
    expect(screen.getAllByText('완료')).toHaveLength(2) // 대상 선택 · 코드 검색
    expect(screen.getByText('진행 중')).toBeInTheDocument() // 파일 읽기
    expect(screen.getByRole('status')).toHaveTextContent('탐색 중 · 5단계')
    // 중간 설명은 답변 영역이 아니라 과정 블록에만 있다
    expect(screen.queryByText('먼저 정책을 확인했어요.', { selector: '.prose-chat *' })).toBeNull()
  })

  it('done: 답변 마크다운(마커 하이라이트 없음)과 메타 줄, 과정 헤더 확정', () => {
    const turn = build([
      { type: 'tool_call', seq: 1, name: 'read_file', arguments: { repo: R, path: 'a.kt' } },
      { type: 'tool_result', seq: 1, name: 'read_file', summary: `${R}:a.kt 1~9줄` },
      { type: 'answer', delta: '기준 금액은 **상품 합계**에서 (예: 쿠폰) 할인을 뺀 값이에요.' },
      { type: 'done', repos: [{ name: R, commit: 'f3818f6' }], iterations: 2, elapsedMs: 8800 },
    ])
    renderTurn(turn)

    expect(screen.getByText('상품 합계').tagName).toBe('STRONG')
    expect(document.querySelector('mark')).toBeNull()
    expect(screen.getByText(/확인한 레포/)).toHaveTextContent(
      `확인한 레포 ${R} @ f3818f6 · 2회 탐색 · 8.8초`,
    )
    expect(screen.getByRole('status')).toHaveTextContent('탐색 과정 · 2단계')
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'false')
  })

  it('aborted: 중단됨 pill · 안내 · 진행 중이던 도구는 실패로', () => {
    const turn = finishAborted(
      build([
        { type: 'tool_call', seq: 1, name: 'read_file', arguments: { repo: R, path: 'a.kt' } },
        { type: 'answer', delta: '부분 답변' },
      ]),
    )
    renderTurn(turn)
    expect(screen.getByText('중단됨')).toBeInTheDocument()
    expect(screen.getByText('여기까지 받은 답변만 표시합니다')).toBeInTheDocument()
    expect(screen.getByText('부분 답변')).toBeInTheDocument()
    expect(screen.getByText('실패')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('탐색 과정 · 2단계 · 중단')
  })

  it('error(503): 콜아웃과 다시 시도 → onRetry(turn.id)', async () => {
    const user = userEvent.setup()
    const onRetry = renderTurn(
      finishError(createTurn(7, 'q', 0), { status: 503, message: 'LLM 불가' }),
    )
    expect(screen.getByText('답변을 받지 못했습니다')).toBeInTheDocument()
    expect(screen.getByText('LLM 불가')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(onRetry).toHaveBeenCalledWith(7)
  })

  it('error(500): 재시도 버튼이 없고, busy 중에는 503 이라도 비활성', () => {
    renderTurn(finishError(createTurn(1, 'q', 0), { status: 500, message: '서버 오류' }))
    expect(screen.getByText('서버 오류')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
  })

  it('busy 중에는 재시도 버튼이 비활성이다', () => {
    renderTurn(finishError(createTurn(1, 'q', 0), { status: 503, message: 'x' }), true)
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeDisabled()
  })
})
