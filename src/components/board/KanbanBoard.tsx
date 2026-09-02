import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { KanbanColumn } from '@/components/board/KanbanColumn'
import { TaskCard } from '@/components/board/TaskCard'
import type { TaskCardActions } from '@/components/board/TaskCardMenu'
import { useBoardSensors } from '@/components/board/useBoardSensors'
import {
  columnOrders,
  findColumn,
  moveActive,
  sameOrder,
  type ColumnOrders,
  type DropTarget,
} from '@/lib/board-order'
import { COLUMNS, isBoardStatus } from '@/lib/task-config'
import type { BoardStatus, Task, TaskStatus } from '@/types/task'

/**
 * 포인터가 실제로 카드/컬럼 위에 있을 때만 드롭으로 본다.
 * closestCorners 는 교차 없이도 가장 가까운 컬럼을 잡아 아무 데나 놓아도 이동이 커밋됐다.
 * pointerWithin 은 작은 사각형(카드)을 컬럼보다 먼저 돌려준다.
 */
const dropOnColumnOnly: CollisionDetection = (args) => {
  const within = pointerWithin(args)
  return within.length > 0 ? within : rectIntersection(args)
}

interface PendingOrders {
  /** 이 순서를 만든 기준 — 목록이 바뀌면(낙관적 갱신·롤백) 버린다 */
  base: ColumnOrders
  orders: ColumnOrders
}

interface KanbanBoardProps {
  /** 필터가 적용된 표시 목록 (정렬됨) */
  tasks: Task[]
  actions: TaskCardActions
  /**
   * 드롭 결과. `orderedIds` 는 놓인 컬럼의 표시 순서(이동한 카드 포함).
   * false 를 돌려주면(게이트 경고 등) 카드를 원위치로 되돌린다.
   */
  onMove: (task: Task, status: BoardStatus, orderedIds: number[]) => boolean
  onAddToBacklog: () => void
}

export function KanbanBoard({ tasks, actions, onMove, onAddToBacklog }: KanbanBoardProps) {
  const [active, setActive] = useState<Task | null>(null)
  const [pending, setPending] = useState<PendingOrders | null>(null)
  const sensors = useBoardSensors()

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])
  const baseOrders = useMemo(() => columnOrders(tasks), [tasks])
  /** 드래그 중·커밋 직후에는 로컬 순서를, 목록이 갱신되면 서버 순서를 본다 */
  const orders = pending && pending.base === baseOrders ? pending.orders : baseOrders

  const taskOf = (event: DragStartEvent | DragOverEvent | DragEndEvent) =>
    (event.active.data.current as { task?: Task } | undefined)?.task ?? null

  const targetOf = (event: DragOverEvent | DragEndEvent): DropTarget | null => {
    const { over, active: activeItem } = event
    if (!over) return null
    if (typeof over.id === 'number') {
      const translated = activeItem.rect.current.translated
      const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false
      return { kind: 'task', id: over.id, below }
    }
    const status = over.id as TaskStatus
    return isBoardStatus(status) ? { kind: 'column', status } : null
  }

  const receivingColumn = active ? findColumn(orders, active.id) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={dropOnColumnOnly}
      onDragStart={(event) => {
        setActive(taskOf(event))
        setPending({ base: baseOrders, orders: baseOrders })
      }}
      onDragOver={(event) => {
        const task = taskOf(event)
        const target = targetOf(event)
        if (!task || !target) return
        setPending((previous) => {
          const current = previous && previous.base === baseOrders ? previous.orders : baseOrders
          const next = moveActive(current, task.id, target)
          return next === current && previous ? previous : { base: baseOrders, orders: next }
        })
      }}
      onDragCancel={() => {
        setActive(null)
        setPending(null)
      }}
      onDragEnd={(event) => {
        setActive(null)
        const task = taskOf(event)
        if (!task) return setPending(null)
        const target = targetOf(event)
        const final = target ? moveActive(orders, task.id, target) : orders
        const status = findColumn(final, task.id)
        if (!status) return setPending(null)
        const ids = final[status]
        if (status === task.status && sameOrder(ids, baseOrders[status])) return setPending(null)
        const accepted = onMove(task, status, ids)
        setPending(accepted ? { base: baseOrders, orders: final } : null)
      }}
    >
      <div className="flex items-start gap-4 overflow-x-auto pb-8">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.key}
            column={column}
            tasks={orders[column.key]
              .map((id) => taskById.get(id))
              .filter((task): task is Task => !!task)}
            receiving={receivingColumn === column.key && active?.status !== column.key}
            actions={actions}
            onAdd={column.key === 'backlog' ? onAddToBacklog : undefined}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {active && (
          <div className="w-[276px]">
            <TaskCard task={active} overlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
