import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NaviPanel } from '@/components/detail/NaviPanel'
import { makeProposal } from '@/test/factories'
import { renderWithProviders } from '@/test/render'
import type { PanelMessage, Proposal } from '@/types/proposal'

const renderPanel = (
  overrides: Partial<Parameters<typeof NaviPanel>[0]> = {},
  proposals: Proposal[] = [makeProposal()],
) => {
  const h = { onSend: vi.fn(), onAbort: vi.fn(), onShowProposal: vi.fn() }
  renderWithProviders(
    <NaviPanel
      messages={[]}
      proposalsById={new Map(proposals.map((p) => [p.id, p]))}
      priorPending={[]}
      busy={false}
      {...h}
      {...overrides}
    />,
  )
  return h
}

describe('NaviPanel', () => {
  it('입력 후 Enter 로 전송하고 입력창을 비운다', async () => {
    const user = userEvent.setup()
    const h = renderPanel()
    const input = screen.getByRole('textbox', { name: 'Navi에게 요청' })
    await user.type(input, '예외 조건 보강해줘{enter}')
    expect(h.onSend).toHaveBeenCalledWith('예외 조건 보강해줘')
    expect(input).toHaveValue('')
  })

  it('대화의 제안 카드는 사유와 "문서에서 보기"', async () => {
    const user = userEvent.setup()
    const messages: PanelMessage[] = [
      { kind: 'user', text: '요청' },
      { kind: 'proposal', proposalId: 11 },
    ]
    const h = renderPanel({ messages })
    expect(screen.getByText(/마케팅 미동의 유저의 적립금 처리/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /문서에서 보기/ }))
    expect(h.onShowProposal).toHaveBeenCalledWith(expect.objectContaining({ id: 11 }))
  })

  it('처리된 제안은 상태 pill 로', () => {
    const messages: PanelMessage[] = [
      { kind: 'proposal', proposalId: 1 },
      { kind: 'proposal', proposalId: 2 },
      { kind: 'proposal', proposalId: 3 },
      { kind: 'proposal', proposalId: 4 },
    ]
    renderPanel({ messages }, [
      makeProposal({ id: 1, status: 'accepted', sectionVersion: 2 }),
      makeProposal({ id: 2, status: 'rejected' }),
      makeProposal({ id: 3, stale: true }),
      makeProposal({ id: 4, status: 'closed' }),
    ])
    expect(screen.getByText('적용됨 · v3')).toBeInTheDocument()
    expect(screen.getByText('거부됨')).toBeInTheDocument()
    expect(screen.getByText('만료됨')).toBeInTheDocument()
    expect(screen.getByText('닫힘')).toBeInTheDocument()
  })

  it('이전 세션의 대기 제안은 인사말 아래 안내와 함께 보인다', () => {
    renderPanel({ priorPending: [makeProposal()] })
    expect(screen.getByText(/이전에 받은 제안이 문서에 남아 있습니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /문서에서 보기/ })).toBeInTheDocument()
  })

  it('busy 면 입력창 대신 중단 버튼, 오류 행은 다시 시도', async () => {
    const user = userEvent.setup()
    const h = renderPanel({
      busy: true,
      messages: [{ kind: 'error', text: 'LLM 오류', retryText: '다시 요청' }],
    })
    expect(screen.getByText('Navi가 제안을 만들고 있습니다…')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '요청 중단' }))
    expect(h.onAbort).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(h.onSend).toHaveBeenCalledWith('다시 요청')
  })

  it('읽기 전용이면 입력·추천 칩이 비활성', () => {
    renderPanel({ disabled: true })
    expect(screen.getByRole('textbox', { name: 'Navi에게 요청' })).toBeDisabled()
    expect(screen.getByRole('button', { name: SUGGESTION })).toBeDisabled()
  })
})

const SUGGESTION = '예외 조건에 빠진 엣지케이스를 추가해줘'
