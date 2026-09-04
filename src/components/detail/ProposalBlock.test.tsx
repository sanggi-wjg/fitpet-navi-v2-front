import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProposalBlock } from '@/components/detail/ProposalBlock'
import { makeProposal, makeSection } from '@/test/factories'
import { renderWithProviders } from '@/test/render'

const section = makeSection({
  id: 3,
  name: '예외 조건',
  body: '- 휴면 계정 제외\n- 마케팅 동의 유저\n',
  version: 0,
})
const proposal = makeProposal({
  newContent: '- 휴면 계정 제외\n- 마케팅 미동의 유저\n- 탈퇴 계정 제외\n',
})

const handlers = () => ({
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onRequestAgain: vi.fn(),
  onClose: vi.fn(),
})

const renderBlock = (overrides: Partial<Parameters<typeof ProposalBlock>[0]> = {}) => {
  const h = handlers()
  renderWithProviders(
    <ProposalBlock
      proposal={proposal}
      section={section}
      accepting={false}
      regenerating={false}
      staleMessage={null}
      {...h}
      {...overrides}
    />,
  )
  return h
}

describe('ProposalBlock', () => {
  it('pending: 사유와 어절 diff 를 그리고 수락은 onAccept', async () => {
    const user = userEvent.setup()
    const h = renderBlock()
    expect(screen.getByText('Navi 제안')).toBeInTheDocument()
    expect(screen.getByText(/마케팅 미동의 유저의 적립금 처리/)).toBeInTheDocument()
    expect(screen.getByText('동의')).toHaveClass('line-through')
    expect(screen.getByText('미동의')).toHaveClass('bg-success-wash')
    expect(screen.getByText('- 탈퇴 계정 제외')).toBeInTheDocument()
    expect(screen.getByText(/v1로 저장됩니다/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '수락' }))
    expect(h.onAccept).toHaveBeenCalledTimes(1)
  })

  it('거부 → 사유 입력 → 재요청은 onReject(사유)', async () => {
    const user = userEvent.setup()
    const h = renderBlock()
    await user.click(screen.getByRole('button', { name: '거부' }))
    expect(screen.getByRole('button', { name: '사유와 함께 재요청' })).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: '거부 사유' }), '이미 반영돼 있어요')
    await user.click(screen.getByRole('button', { name: '사유와 함께 재요청' }))
    expect(h.onReject).toHaveBeenCalledWith('이미 반영돼 있어요')
  })

  it('만료(409 문구): 배너 + 다시 제안 받기 · 닫기, 수락/거부 없음', async () => {
    const user = userEvent.setup()
    const h = renderBlock({ staleMessage: '문서가 변경되어 적용하지 못했습니다' })
    expect(screen.getByText('문서가 변경되어 적용하지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '수락' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다시 제안 받기' }))
    expect(h.onRequestAgain).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('닫는 중에는 만료 배너의 두 버튼이 비활성', () => {
    renderBlock({ staleMessage: '충돌', closing: true })
    expect(screen.getByRole('button', { name: '닫는 중…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '다시 제안 받기' })).toBeDisabled()
  })

  it('섹션 version 이 제안 시점과 다르면 만료 배너에 버전을 보인다', () => {
    renderBlock({ section: { ...section, version: 3 } })
    expect(screen.getByText(/만료되었습니다 \(v0 → v3\)/)).toBeInTheDocument()
  })

  it('수락 요청 중에는 적용 중 문구와 비활성 버튼', () => {
    renderBlock({ accepting: true })
    expect(screen.getByText(/적용 중 — 섹션이 그대로인지 확인하고 v1로/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '적용 중…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '거부' })).toBeDisabled()
  })

  it('거부 직후에는 재제안 대기 상태를 보인다', () => {
    renderBlock({
      regenerating: true,
      proposal: makeProposal({ status: 'rejected', rejectReason: '사유' }),
    })
    expect(screen.getByText('Navi 제안 · 거부됨')).toBeInTheDocument()
    expect(screen.getByText('사유를 반영해 다시 제안하는 중')).toBeInTheDocument()
    expect(screen.getByText('사유')).toBeInTheDocument()
  })
})
