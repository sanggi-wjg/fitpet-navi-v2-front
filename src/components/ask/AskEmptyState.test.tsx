import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AskEmptyState } from '@/components/ask/AskEmptyState'
import { ASK_SUGGESTION_GROUPS } from '@/lib/ask-config'

const questionChips = () =>
  within(screen.getByRole('group', { name: '예시 질문' })).getAllByRole('button')

describe('AskEmptyState', () => {
  it('타이틀 · 안내 · 첫 카테고리의 예시 질문을 보이고, 칩 클릭은 문장을 그대로 넘긴다', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<AskEmptyState onPick={onPick} disabled={false} />)

    expect(screen.getByRole('heading', { name: '구현 확인' })).toBeInTheDocument()
    expect(screen.getByText(/대화는 저장되지 않습니다/)).toBeInTheDocument()
    const first = ASK_SUGGESTION_GROUPS[0]!
    expect(questionChips().map((chip) => chip.textContent)).toEqual([...first.questions])

    await user.click(questionChips()[1]!)
    expect(onPick).toHaveBeenCalledWith(first.questions[1])
  })

  it('카테고리 탭은 전송하지 않고 문항만 바꾼다', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<AskEmptyState onPick={onPick} disabled={false} />)

    const tabs = within(screen.getByRole('group', { name: '질문 분류' })).getAllByRole('button')
    expect(tabs.map((tab) => tab.textContent)).toEqual(
      ASK_SUGGESTION_GROUPS.map((group) => group.category),
    )
    expect(tabs[0]).toHaveAttribute('aria-pressed', 'true')

    const target = ASK_SUGGESTION_GROUPS[2]!
    await user.click(screen.getByRole('button', { name: target.category }))
    expect(onPick).not.toHaveBeenCalled()
    expect(tabs[0]).toHaveAttribute('aria-pressed', 'false')
    expect(tabs[2]).toHaveAttribute('aria-pressed', 'true')
    expect(questionChips().map((chip) => chip.textContent)).toEqual([...target.questions])
  })

  it('disabled 면 예시 칩만 비활성이고 카테고리 탭은 여전히 바꿀 수 있다', async () => {
    const user = userEvent.setup()
    render(<AskEmptyState onPick={vi.fn()} disabled />)
    for (const chip of questionChips()) expect(chip).toBeDisabled()

    const target = ASK_SUGGESTION_GROUPS[1]!
    await user.click(screen.getByRole('button', { name: target.category }))
    expect(questionChips().map((chip) => chip.textContent)).toEqual([...target.questions])
  })
})
