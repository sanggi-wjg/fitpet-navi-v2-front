import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { SortableTaskCard } from '@/components/board/TaskCard'
import type { TaskCardActions } from '@/components/board/TaskCardMenu'
import type { ColumnConfig } from '@/lib/task-config'
import { cn } from '@/lib/utils'
import type { BoardStatus, Task } from '@/types/task'

const EMPTY_LABEL: Record<BoardStatus, string> = {
  backlog: '태스크가 없습니다 — 새 태스크를 만들어 보세요',
  todo: '개발 준비된 태스크를 여기로 옮기세요',
  in_progress: '진행 중인 태스크가 없습니다',
  done: '완료된 태스크가 없습니다',
}

interface KanbanColumnProps {
  column: ColumnConfig
  tasks: Task[]
  /** 드래그 중인 카드가 이 컬럼에 놓일 예정 (다른 컬럼에서 왔을 때만) */
  receiving: boolean
  actions: TaskCardActions
  onAdd?: () => void
}

export function KanbanColumn({ column, tasks, receiving, actions, onAdd }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.key })
  return (
    <section
      ref={setNodeRef}
      aria-label={column.label}
      className={cn(
        'flex w-[300px] shrink-0 flex-col gap-2 rounded-lg p-3 transition-colors',
        receiving ? 'bg-surface-card' : 'bg-surface-soft',
      )}
    >
      <div className="flex items-center justify-between px-1 pt-0.5 pb-1.5">
        <span className={column.latin ? 'kicker-latin' : 'kicker'}>{column.label}</span>
        <span className="text-muted font-mono text-[12px]">{tasks.length}</span>
      </div>
      <SortableContext
        id={column.key}
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} actions={actions} />
        ))}
      </SortableContext>
      {tasks.length === 0 && (
        <div className="border-checkbox-border text-muted rounded-lg border border-dashed px-3 py-5 text-center text-[13px]">
          {EMPTY_LABEL[column.key]}
        </div>
      )}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="text-muted hover:bg-surface-card flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors"
        >
          <Plus className="size-3.5" strokeWidth={1.75} />
          태스크 추가
        </button>
      )}
    </section>
  )
}
