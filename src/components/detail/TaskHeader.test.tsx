import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskHeader } from '@/components/detail/TaskHeader'
import { gateOf } from '@/lib/gate'
import { makeTask } from '@/test/factories'
import { renderWithProviders } from '@/test/render'

describe('TaskHeader', () => {
  it('읽기 전용이면 우선순위·태그를 텍스트로만 보인다', () => {
    const task = makeTask({ priority: 1, tags: ['적립금'] })
    renderWithProviders(<TaskHeader task={task} gate={gateOf(task)} />)
    expect(screen.getByText('높음')).toBeInTheDocument()
    expect(screen.getByText('적립금')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '우선순위 변경' })).not.toBeInTheDocument()
  })

  it('우선순위 메뉴에서 고르면 onUpdateMeta({ priority })', async () => {
    const user = userEvent.setup()
    const onUpdateMeta = vi.fn().mockResolvedValue(undefined)
    const task = makeTask()
    renderWithProviders(<TaskHeader task={task} gate={gateOf(task)} onUpdateMeta={onUpdateMeta} />)
    await user.click(screen.getByRole('button', { name: '우선순위 변경' }))
    await user.click(await screen.findByRole('menuitemradio', { name: '매우 높음' }))
    expect(onUpdateMeta).toHaveBeenCalledWith({ priority: 0 })
  })

  it('태그 팝오버에서 쉼표 구분으로 입력해 저장하면 onUpdateMeta({ tags })', async () => {
    const user = userEvent.setup()
    const onUpdateMeta = vi.fn().mockResolvedValue(undefined)
    const task = makeTask({ tags: ['적립금'] })
    renderWithProviders(<TaskHeader task={task} gate={gateOf(task)} onUpdateMeta={onUpdateMeta} />)
    await user.click(screen.getByRole('button', { name: '태그 편집' }))
    const input = await screen.findByRole('textbox', { name: '태그' })
    await user.clear(input)
    await user.type(input, '적립금, 배치, 배치')
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(onUpdateMeta).toHaveBeenCalledWith({ tags: ['적립금', '배치'] })
  })
})
