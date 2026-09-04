import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ArchiveList } from '@/components/board/ArchiveList'
import type { TaskCardActions } from '@/components/board/TaskCardMenu'
import { makeTask } from '@/test/factories'
import { renderWithProviders } from '@/test/render'

const actions = (): TaskCardActions => ({
  onOpen: vi.fn(),
  onMove: vi.fn(),
  onChangePriority: vi.fn(),
  onCancel: vi.fn(),
  onArchive: vi.fn(),
  onUnarchive: vi.fn(),
})

const archived = (id: number, title: string) =>
  makeTask({ id, title, archived: true, archivedAt: '2026-09-02T00:00:00Z', readOnly: true })

describe('ArchiveList', () => {
  it('비어 있으면 안내 문구', () => {
    renderWithProviders(<ArchiveList tasks={[]} actions={actions()} />)
    expect(screen.getByText('아카이브된 태스크가 없습니다')).toBeInTheDocument()
  })

  it('받은 순서대로 카드를 그리고 클릭·Enter 는 onOpen', async () => {
    const user = userEvent.setup()
    const handlers = actions()
    const tasks = [archived(9, '둘째'), archived(3, '첫째')]
    renderWithProviders(<ArchiveList tasks={tasks} actions={handlers} />)
    const list = screen.getByRole('region', { name: '아카이브' })
    expect(
      within(list)
        .getAllByRole('heading')
        .map((h) => h.textContent),
    ).toEqual(['둘째', '첫째'])

    await user.click(screen.getByRole('heading', { name: '첫째' }))
    expect(handlers.onOpen).toHaveBeenLastCalledWith(tasks[1])

    const cards = within(list).getAllByRole('button', { name: /둘째/ })
    cards[0].focus()
    await user.keyboard('{Enter}')
    expect(handlers.onOpen).toHaveBeenLastCalledWith(tasks[0])
  })

  it('kebab 과 메뉴 항목 클릭은 상세로 번지지 않는다', async () => {
    const user = userEvent.setup()
    const handlers = actions()
    const task = archived(3, '첫째')
    renderWithProviders(<ArchiveList tasks={[task]} actions={handlers} />)
    await user.click(screen.getByRole('button', { name: '태스크 메뉴' }))
    await user.click(await screen.findByRole('menuitem', { name: '아카이브 해제' }))
    expect(handlers.onUnarchive).toHaveBeenCalledWith(task)
    expect(handlers.onOpen).not.toHaveBeenCalled()
  })

  it('Space 로도 연다', async () => {
    const user = userEvent.setup()
    const handlers = actions()
    const task = archived(3, '첫째')
    renderWithProviders(<ArchiveList tasks={[task]} actions={handlers} />)
    screen.getAllByRole('button', { name: /첫째/ })[0].focus()
    await user.keyboard(' ')
    expect(handlers.onOpen).toHaveBeenCalledWith(task)
  })
})
