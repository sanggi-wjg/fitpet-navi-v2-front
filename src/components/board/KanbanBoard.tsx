import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { KanbanColumn } from '@/components/board/KanbanColumn'
import { TaskCard } from '@/components/board/TaskCard'
import { COLUMNS } from '@/lib/task-config'
import type { BoardStatus, Task } from '@/types/task'

/**
 * 포인터가 실제로 컬럼 위에 있을 때만 드롭으로 본다.
 * closestCorners 는 교차 없이도 가장 가까운 컬럼을 잡아 아무 데나 놓아도 이동이 커밋됐다.
 */
const dropOnColumnOnly: CollisionDetection = (args) => {
  const within = pointerWithin(args)
  return within.length > 0 ? within : rectIntersection(args)
}

interface KanbanBoardProps {
  tasks: Task[]
  onMove: (task: Task, status: BoardStatus) => void
  onAddToBacklog: () => void
}

export function KanbanBoard({ tasks, onMove, onAddToBacklog }: KanbanBoardProps) {
  const [active, setActive] = useState<Task | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const byStatus = useMemo(() => {
    const map = new Map<BoardStatus, Task[]>(COLUMNS.map((column) => [column.key, []]))
    for (const task of tasks) map.get(task.status as BoardStatus)?.push(task)
    return map
  }, [tasks])

  const taskOf = (event: DragStartEvent | DragEndEvent) =>
    (event.active.data.current as { task?: Task } | undefined)?.task ?? null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={dropOnColumnOnly}
      onDragStart={(event) => setActive(taskOf(event))}
      onDragCancel={() => setActive(null)}
      onDragEnd={(event) => {
        setActive(null)
        const task = taskOf(event)
        const target = event.over?.id as BoardStatus | undefined
        if (!task || !target || target === task.status) return
        onMove(task, target)
      }}
    >
      <div className="flex items-start gap-4 overflow-x-auto pb-8">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.key}
            column={column}
            tasks={byStatus.get(column.key) ?? []}
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
