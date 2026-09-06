import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AskInput } from '@/components/ask/AskInput'

const renderInput = (busy = false) => {
  const handlers = { onSend: vi.fn(), onAbort: vi.fn() }
  const view = render(<AskInput busy={busy} {...handlers} />)
  return { ...handlers, ...view }
}
const textbox = () => screen.getByRole('textbox', { name: '구현에 대해 질문' })

describe('AskInput', () => {
  it('빈 입력이면 전송이 비활성이고, Enter 로 보내면 다듬은 문장을 넘기고 비운다', async () => {
    const user = userEvent.setup()
    const h = renderInput()
    expect(screen.getByRole('button', { name: '전송' })).toBeDisabled()

    await user.type(textbox(), '  적립금 비율은?{Enter}')
    expect(h.onSend).toHaveBeenCalledWith('적립금 비율은?')
    expect(textbox()).toHaveValue('')
  })

  it('Shift+Enter 는 줄바꿈이고 전송하지 않는다', async () => {
    const user = userEvent.setup()
    const h = renderInput()
    await user.type(textbox(), '첫 줄{Shift>}{Enter}{/Shift}둘째')
    expect(h.onSend).not.toHaveBeenCalled()
    expect(textbox()).toHaveValue('첫 줄\n둘째')
  })

  it('공백만 있으면 Enter 로도 보내지 않는다', async () => {
    const user = userEvent.setup()
    const h = renderInput()
    await user.type(textbox(), '   {Enter}')
    expect(h.onSend).not.toHaveBeenCalled()
  })

  it('busy: textarea 비활성 + 안내 placeholder, 전송 대신 중단 버튼이 onAbort 를 부른다', async () => {
    const user = userEvent.setup()
    const h = renderInput(true)
    expect(textbox()).toBeDisabled()
    expect(screen.getByPlaceholderText('응답이 끝나면 다시 질문할 수 있습니다')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '전송' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '응답 중단' }))
    expect(h.onAbort).toHaveBeenCalledTimes(1)
  })

  it('busy 가 풀리면 textarea 로 포커스를 돌려준다', () => {
    const h = renderInput(true)
    h.rerender(<AskInput busy={false} onSend={h.onSend} onAbort={h.onAbort} />)
    expect(textbox()).toHaveFocus()
  })
})
