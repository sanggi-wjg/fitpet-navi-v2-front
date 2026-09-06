import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AskSession } from '@/hooks/useAskSession'
import { ASK_SUGGESTION_GROUPS } from '@/lib/ask-config'
import { applyCodeQaEvent, createTurn } from '@/lib/ask-reducer'
import { AskPage } from '@/pages/AskPage'
import { renderWithProviders } from '@/test/render'

const session: AskSession = {
  turns: [],
  busy: false,
  send: vi.fn(async () => {}),
  abort: vi.fn(),
  reset: vi.fn(),
  retry: vi.fn(),
}

vi.mock('@/hooks/useAskSession', () => ({ useAskSession: () => session }))

const renderPage = () => renderWithProviders(<AskPage />, { route: '/ask' })

describe('AskPage', () => {
  beforeEach(() => {
    session.turns = []
    session.busy = false
    vi.clearAllMocks()
  })

  it('빈 상태: 예시 칩 · 비활성 전송 · 비활성 새 대화, 구현 확인 탭이 활성이다', () => {
    renderPage()
    expect(screen.getByRole('group', { name: '예시 질문' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전송' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /새 대화/ })).toBeDisabled()
    expect(screen.getByRole('link', { name: '구현 확인' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('log')).not.toBeInTheDocument()
  })

  it('입력 + Enter 와 예시 칩 클릭은 send 를 부른다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByRole('textbox', { name: '구현에 대해 질문' }), '질문{Enter}')
    expect(session.send).toHaveBeenCalledWith('질문')

    const chips = within(screen.getByRole('group', { name: '예시 질문' })).getAllByRole('button')
    await user.click(chips[0]!)
    expect(session.send).toHaveBeenLastCalledWith(ASK_SUGGESTION_GROUPS[0]!.questions[0])
  })

  it('진행 중: 대화 로그에 턴이 보이고 중단 버튼이 abort 를 부른다', async () => {
    const user = userEvent.setup()
    session.turns = [
      applyCodeQaEvent(createTurn(1, '적립금 비율은?', 0), { type: 'thinking', delta: '생각' }),
    ]
    session.busy = true
    renderPage()

    expect(
      within(screen.getByRole('log', { name: '대화' })).getByText('적립금 비율은?'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '응답 중단' }))
    expect(session.abort).toHaveBeenCalledTimes(1)
  })

  it('턴이 있으면 새 대화가 활성이고 reset 을 부른다', async () => {
    const user = userEvent.setup()
    session.turns = [createTurn(1, 'q', 0)]
    renderPage()
    await user.click(screen.getByRole('button', { name: /새 대화/ }))
    expect(session.reset).toHaveBeenCalledTimes(1)
  })
})
