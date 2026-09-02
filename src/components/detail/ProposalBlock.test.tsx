import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProposalBlock } from '@/components/detail/ProposalBlock'
import { makeProposal } from '@/test/factories'
import { renderWithProviders } from '@/test/render'
import type { DiffLine } from '@/types/proposal'

const diff: DiffLine[] = [
  { type: 'equal', text: '- 휴면 계정 제외', parts: [] },
  {
    type: 'changed',
    text: '',
    parts: [
      { op: 'equal', text: '- 마케팅 ' },
      { op: 'delete', text: '동의' },
      { op: 'insert', text: '미동의' },
      { op: 'equal', text: ' 유저' },
    ],
  },
  { type: 'insert', text: '- 탈퇴 계정 제외', parts: [] },
]

const handlers = () => ({
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onRequestAgain: vi.fn(),
})

const renderBlock = (
  overrides: Partial<Parameters<typeof ProposalBlock>[0]> = {},
  proposal = makeProposal(),
) => {
  const h = handlers()
  renderWithProviders(
    <ProposalBlock
      proposal={proposal}
      diff={diff}
      currentVersion={1}
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
  it('pending: 사유·diff 런을 그리고 수락은 onAccept', async () => {
    const user = userEvent.setup()
    const h = renderBlock()
    expect(screen.getByText('Navi 제안')).toBeInTheDocument()
    expect(screen.getByText(/마케팅 미동의 유저의 적립금 처리/)).toBeInTheDocument()
    expect(screen.getByText('미동의')).toBeInTheDocument()
    expect(screen.getByText('- 탈퇴 계정 제외')).toBeInTheDocument()
    expect(screen.getByText(/v2로 저장됩니다/)).toBeInTheDocument()
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

  it('만료: 배너 + 다시 제안 받기, 수락/거부 없음', async () => {
    const user = userEvent.setup()
    const h = renderBlock({ staleMessage: '문서가 변경되어 적용하지 못했습니다' })
    expect(screen.getByText('문서가 변경되어 적용하지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '수락' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다시 제안 받기' }))
    expect(h.onRequestAgain).toHaveBeenCalledTimes(1)
  })

  it('버전이 달라지면 만료 가능성 경고를 보인다', () => {
    renderBlock({ currentVersion: 3 })
    expect(screen.getByText(/제안 후 문서가 수정됨 \(v1 → v3\)/)).toBeInTheDocument()
  })

  it('거부 직후에는 재제안 대기 상태를 보인다', () => {
    renderBlock({ regenerating: true }, makeProposal({ status: 'rejected', rejectReason: '사유' }))
    expect(screen.getByText('Navi 제안 · 거부됨')).toBeInTheDocument()
    expect(screen.getByText('사유를 반영해 다시 제안하는 중')).toBeInTheDocument()
  })

  it('diff 가 없으면(리로드) 미리보기 불가 안내를 보인다', () => {
    renderBlock({ diff: null })
    expect(screen.getByText(/미리보기를 표시할 수 없습니다/)).toBeInTheDocument()
  })

  it('update_field: 이전 → 새 값', () => {
    renderBlock(
      { currentValue: '기존 제목' },
      makeProposal({ tool: 'update_field', field: 'title', value: '새 제목', section: null }),
    )
    expect(screen.getByText('기존 제목')).toBeInTheDocument()
    expect(screen.getByText('새 제목')).toBeInTheDocument()
    expect(screen.getByText(/이 필드만 바뀝니다/)).toBeInTheDocument()
  })
})
