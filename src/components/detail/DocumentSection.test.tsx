import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DocumentSection } from '@/components/detail/DocumentSection'
import { renderWithProviders } from '@/test/render'

const base = {
  id: 'section-0',
  name: '세부사항',
  body: '- 금액 — 1,000원\n',
  saving: false,
  onEdit: vi.fn(),
  onCancel: vi.fn(),
  onSave: vi.fn(),
}

describe('DocumentSection', () => {
  it('이름과 필수 표시를 보이며 "편집"은 onEdit', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithProviders(<DocumentSection {...base} editing={false} required onEdit={onEdit} />)
    expect(screen.getByRole('heading', { name: /세부사항/ })).toHaveTextContent('세부사항필수')
    await user.click(screen.getByRole('button', { name: '편집' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('읽기 전용이면 편집 버튼이 없다', () => {
    renderWithProviders(<DocumentSection {...base} editing={false} readOnly />)
    expect(screen.queryByRole('button', { name: '편집' })).not.toBeInTheDocument()
  })

  it('본문에 `## ` 줄이 있으면 저장을 막고 안내한다', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderWithProviders(<DocumentSection {...base} editing onSave={onSave} />)
    const textarea = screen.getByRole('textbox', { name: '세부사항 편집' })
    await user.clear(textarea)
    await user.type(textarea, '## 새 섹션')
    expect(screen.getByText(/섹션 헤딩/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
    await user.clear(textarea)
    await user.type(textarea, '### 소제목 허용')
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith('### 소제목 허용')
  })

  it('409 충돌 안내에서 "최신 내용 불러오기"는 draft 를 서버 본문으로 바꾸고 안내를 닫는다', async () => {
    const user = userEvent.setup()
    const onResolveConflict = vi.fn()
    renderWithProviders(
      <DocumentSection {...base} editing conflict onResolveConflict={onResolveConflict} />,
    )
    const textarea = screen.getByRole('textbox', { name: '세부사항 편집' })
    await user.clear(textarea)
    await user.type(textarea, '- 내가 쓴 값')
    expect(screen.getByText(/먼저 수정했습니다/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '최신 내용 불러오기' }))
    expect(onResolveConflict).toHaveBeenCalledTimes(1)
    expect(textarea).toHaveValue(base.body)
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('"내 내용 유지"는 draft 를 두고 안내만 닫는다', async () => {
    const user = userEvent.setup()
    const onResolveConflict = vi.fn()
    renderWithProviders(
      <DocumentSection {...base} editing conflict onResolveConflict={onResolveConflict} />,
    )
    const textarea = screen.getByRole('textbox', { name: '세부사항 편집' })
    await user.clear(textarea)
    await user.type(textarea, '- 내가 쓴 값')
    await user.click(screen.getByRole('button', { name: '내 내용 유지' }))
    expect(onResolveConflict).toHaveBeenCalledTimes(1)
    expect(textarea).toHaveValue('- 내가 쓴 값')
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled()
  })

  it('바뀐 것이 없으면 저장이 비활성이고 취소는 onCancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderWithProviders(<DocumentSection {...base} editing onCancel={onCancel} />)
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('DocumentSection — 제안 슬롯', () => {
  it('content 가 있으면 본문 대신 그리고 hideEdit 이면 편집 버튼이 없다', () => {
    renderWithProviders(
      <DocumentSection
        {...base}
        editing={false}
        hideEdit
        badge={<span>제안 대기</span>}
        content={<div>제안 블록</div>}
      />,
    )
    expect(screen.getByText('제안 블록')).toBeInTheDocument()
    expect(screen.getByText('제안 대기')).toBeInTheDocument()
    expect(screen.queryByText(/1,000원/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '편집' })).not.toBeInTheDocument()
  })

  it('편집 중이면 content 보다 편집기가 우선한다', () => {
    renderWithProviders(<DocumentSection {...base} editing content={<div>제안 블록</div>} />)
    expect(screen.getByRole('textbox', { name: '세부사항 편집' })).toBeInTheDocument()
    expect(screen.queryByText('제안 블록')).not.toBeInTheDocument()
  })
})
