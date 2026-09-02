import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TodoMoveWarningDialog } from '@/components/board/TodoMoveWarningDialog'
import { computeGate } from '@/lib/gate'
import { makeTask } from '@/test/factories'
import { renderWithProviders } from '@/test/render'

const task = makeTask({ content: '## 정책:\n- (예: 금액) (예: 대상)\n' })
const gate = computeGate({ content: task.content })

describe('TodoMoveWarningDialog', () => {
  it('첫 실패 항목(마커)으로 헤드라인을 고르고 3항목 체크리스트를 보인다', () => {
    renderWithProviders(
      <TodoMoveWarningDialog
        task={task}
        gate={gate}
        onCancel={vi.fn()}
        onProceed={vi.fn()}
        onReview={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Todo로 이동' })).toBeInTheDocument()
    expect(screen.getByText('예제 텍스트 2건이 남아 있습니다')).toBeInTheDocument()
    expect(screen.getByText('예제 마커 2건 남음')).toBeInTheDocument()
    expect(screen.getByText('분석 전')).toBeInTheDocument()
    expect(screen.getByText('미결정 답변 — 분석 후')).toBeInTheDocument()
  })

  it('"그래도 이동"은 onProceed, "돌아가서 확인"은 onReview', async () => {
    const user = userEvent.setup()
    const onProceed = vi.fn()
    const onReview = vi.fn()
    renderWithProviders(
      <TodoMoveWarningDialog
        task={task}
        gate={gate}
        onCancel={vi.fn()}
        onProceed={onProceed}
        onReview={onReview}
      />,
    )
    await user.click(screen.getByRole('button', { name: '그래도 이동' }))
    expect(onProceed).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: '돌아가서 확인' }))
    expect(onReview).toHaveBeenCalledTimes(1)
  })

  it('task 가 없으면 닫혀 있다', () => {
    renderWithProviders(
      <TodoMoveWarningDialog
        task={null}
        gate={null}
        onCancel={vi.fn()}
        onProceed={vi.fn()}
        onReview={vi.fn()}
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
