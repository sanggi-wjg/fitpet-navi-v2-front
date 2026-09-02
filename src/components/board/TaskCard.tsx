import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { ReadyBadge } from '@/components/common/ReadyBadge'
import { TagList } from '@/components/common/TagList'
import { TypeChip } from '@/components/common/TypeChip'
import { GateDots } from '@/components/board/GateDots'
import { TaskCardMenu, type TaskCardActions } from '@/components/board/TaskCardMenu'
import { relativeTime } from '@/lib/format'
import { gateOf } from '@/lib/gate'
import { DEFAULT_PRIORITY, PRIORITY_LABEL } from '@/lib/task-config'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'

interface TaskCardProps {
  task: Task
  /** 없으면 kebab 을 그리지 않는다 (DragOverlay) */
  actions?: TaskCardActions
  /** DragOverlay 안 — 들린 카드 스타일 */
  overlay?: boolean
}

/**
 * 보드 카드 — 표시만 담당한다. 드래그·클릭은 `SortableTaskCard` 가 감싼다.
 * 1행 유형 아이콘 + 제목 · 2행 게이트 · (태그) · 3행 id·우선순위 + 시각 (DESIGN.md D.3 `task-card`)
 */
export function TaskCard({ task, actions, overlay = false }: TaskCardProps) {
  const gate = gateOf(task)
  const done = task.status === 'done'
  return (
    <article
      aria-label={task.title}
      className={cn(
        'group/card border-hairline bg-canvas relative flex flex-col gap-2.5 rounded-lg border p-3 text-left transition-colors',
        !overlay && 'hover:bg-surface-soft/70',
        overlay && 'border-primary shadow-2 rotate-[-1.5deg]',
      )}
    >
      <div className="flex items-start gap-2 pr-6">
        <TypeChip type={task.type} iconOnly />
        <h3
          className={cn(
            'line-clamp-2 text-[14px] leading-[1.4] font-medium',
            done ? 'text-muted' : 'text-ink',
          )}
        >
          {task.title}
        </h3>
      </div>
      {actions && (
        <div className="absolute top-2 right-2">
          <TaskCardMenu task={task} actions={actions} />
        </div>
      )}
      {!done && (
        <div className="flex h-[22px] items-center">
          {gate.passed ? <ReadyBadge /> : <GateDots gate={gate} />}
        </div>
      )}
      <TagList tags={task.tags} />
      <div className="text-muted flex items-center justify-between gap-2 text-[12px]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="font-mono">#{task.id}</span>
          {task.priority !== DEFAULT_PRIORITY && (
            <>
              <span aria-hidden>·</span>
              <span className={cn('font-medium', task.priority < DEFAULT_PRIORITY && 'text-ink')}>
                {PRIORITY_LABEL[task.priority]}
              </span>
            </>
          )}
        </span>
        <span className="shrink-0">{relativeTime(task.updatedAt)}</span>
      </div>
    </article>
  )
}

interface SortableTaskCardProps {
  task: Task
  actions: TaskCardActions
}

/** 정렬 가능한 카드 — 클릭/Enter 는 상세, Space 는 키보드 드래그 (KanbanBoard 의 KeyboardSensor 설정) */
export function SortableTaskCard({ task, actions }: SortableTaskCardProps) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  })
  const open = () => void navigate(`/tasks/${task.id}`)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        listeners?.onKeyDown?.(event)
        if (event.key === 'Enter' && !event.defaultPrevented) open()
      }}
      className={cn(
        'focus-visible:ring-primary/40 cursor-pointer rounded-lg outline-none focus-visible:ring-2',
        isDragging && 'opacity-35',
      )}
    >
      <TaskCard task={task} actions={actions} />
    </div>
  )
}
