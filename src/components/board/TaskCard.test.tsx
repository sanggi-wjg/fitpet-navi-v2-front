import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SortableTaskCard, TaskCard } from '@/components/board/TaskCard'
import type { TaskCardActions } from '@/components/board/TaskCardMenu'
import { useBoardSensors } from '@/components/board/useBoardSensors'
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

describe('TaskCard', () => {
  it('제목·id·태그를 보이고, 마커가 없어도 분석 전이면 게이트 점 "분석 전"', () => {
    renderWithProviders(
      <TaskCard task={makeTask({ tags: ['적립금', '배치'] })} actions={actions()} />,
    )
    expect(
      screen.getByRole('heading', { name: '생일 유저 적립금 자동 발급 배치' }),
    ).toBeInTheDocument()
    expect(screen.getByText('#7')).toBeInTheDocument()
    expect(screen.getByText('적립금')).toBeInTheDocument()
    expect(screen.getByText('배치')).toBeInTheDocument()
    // 분석 API 연결 전에는 게이트 2번째 항목이 항상 실패 — "개발 준비됨"은 나오지 않는다
    expect(screen.getByText('분석 전')).toBeInTheDocument()
    expect(screen.queryByText('개발 준비됨')).not.toBeInTheDocument()
  })

  it('마커가 남아 있으면 게이트 점 + 첫 실패 항목 문구', () => {
    renderWithProviders(<TaskCard task={makeTask({ markerCount: 2 })} actions={actions()} />)
    expect(screen.getByText('마커 2건')).toBeInTheDocument()
    expect(screen.queryByText('개발 준비됨')).not.toBeInTheDocument()
  })

  it('우선순위는 기본값(보통)이 아닐 때만 보인다', () => {
    const { rerender } = renderWithProviders(<TaskCard task={makeTask({ priority: 2 })} />)
    expect(screen.queryByText('보통')).not.toBeInTheDocument()
    rerender(<TaskCard task={makeTask({ priority: 0 })} />)
    expect(screen.getByText('매우 높음')).toBeInTheDocument()
  })

  it('완료 컬럼 카드는 게이트를 표시하지 않는다', () => {
    renderWithProviders(<TaskCard task={makeTask({ status: 'done' })} actions={actions()} />)
    expect(screen.queryByText('개발 준비됨')).not.toBeInTheDocument()
  })

  it('kebab 메뉴에서 "태스크 취소"를 고르면 onCancel', async () => {
    const user = userEvent.setup()
    const handlers = actions()
    const task = makeTask()
    renderWithProviders(<TaskCard task={task} actions={handlers} />)
    await user.click(screen.getByRole('button', { name: '태스크 메뉴' }))
    await user.click(await screen.findByRole('menuitem', { name: /태스크 취소/ }))
    expect(handlers.onCancel).toHaveBeenCalledWith(task)
  })

  it('kebab 메뉴에서 "아카이브"를 고르면 onArchive', async () => {
    const user = userEvent.setup()
    const handlers = actions()
    const task = makeTask()
    renderWithProviders(<TaskCard task={task} actions={handlers} />)
    await user.click(screen.getByRole('button', { name: '태스크 메뉴' }))
    await user.click(await screen.findByRole('menuitem', { name: /^아카이브$/ }))
    expect(handlers.onArchive).toHaveBeenCalledWith(task)
    expect(handlers.onCancel).not.toHaveBeenCalled()
  })

  it('아카이브된 카드는 상태 pill 을 보이고 메뉴는 상세 열기·아카이브 해제뿐', async () => {
    const user = userEvent.setup()
    const handlers = actions()
    const task = makeTask({
      status: 'canceled',
      archived: true,
      archivedAt: '2026-09-02T00:00:00Z',
      readOnly: true,
    })
    renderWithProviders(<TaskCard task={task} actions={handlers} />)
    expect(screen.getByText('취소')).toBeInTheDocument()
    expect(screen.queryByText('분석 전')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '태스크 메뉴' }))
    const menu = await screen.findByRole('menu')
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['상세 열기', '아카이브 해제'])
    await user.click(within(menu).getByRole('menuitem', { name: '아카이브 해제' }))
    expect(handlers.onUnarchive).toHaveBeenCalledWith(task)
  })

  it('완료 상태로 아카이브된 카드는 "완료" pill', () => {
    renderWithProviders(
      <TaskCard task={makeTask({ status: 'done', archived: true, readOnly: true })} />,
    )
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('overlay 카드는 메뉴가 없다', () => {
    renderWithProviders(<TaskCard task={makeTask()} overlay />)
    expect(screen.queryByRole('button', { name: '태스크 메뉴' })).not.toBeInTheDocument()
  })
})

/** 보드와 같은 센서 설정 — 기본 센서는 pointerdown 즉시 드래그를 시작해 클릭을 삼킨다 */
function Board({
  task,
  handlers,
}: {
  task: ReturnType<typeof makeTask>
  handlers: TaskCardActions
}) {
  const sensors = useBoardSensors()
  return (
    <DndContext sensors={sensors}>
      <SortableContext items={[task.id]}>
        <SortableTaskCard task={task} actions={handlers} />
      </SortableContext>
    </DndContext>
  )
}

describe('SortableTaskCard', () => {
  const renderSortable = (task = makeTask()) =>
    renderWithProviders(<Board task={task} handlers={actions()} />, {
      extraRoutes: { '/tasks/:taskId': <div>상세 화면</div> },
    })

  it('클릭하면 상세로 이동한다', async () => {
    const user = userEvent.setup()
    renderSortable()
    await user.click(screen.getByRole('heading', { name: /생일 유저/ }))
    expect(await screen.findByText('상세 화면')).toBeInTheDocument()
  })

  it('Enter 로도 상세로 이동한다', async () => {
    const user = userEvent.setup()
    renderSortable()
    const card = screen.getAllByRole('button', { name: /생일 유저/ })[0]
    card.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByText('상세 화면')).toBeInTheDocument()
  })

  it('kebab 클릭은 상세로 이동하지 않는다', async () => {
    const user = userEvent.setup()
    renderSortable()
    await user.click(screen.getByRole('button', { name: '태스크 메뉴' }))
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    expect(screen.queryByText('상세 화면')).not.toBeInTheDocument()
  })
})
