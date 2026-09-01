import { useDraggable } from '@dnd-kit/core'
import { useNavigate } from 'react-router-dom'
import { ReadyBadge } from '@/components/common/ReadyBadge'
import { TypeChip } from '@/components/common/TypeChip'
import { GateDots } from '@/components/board/GateDots'
import { relativeTime } from '@/lib/format'
import { gateOf } from '@/lib/gate'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'

interface TaskCardProps {
  task: Task
  /** DragOverlay 안에서 렌더될 때 — 드래그 훅 없이 들린 카드 스타일만 */
  overlay?: boolean
}

export function TaskCard({ task, overlay = false }: TaskCardProps) {
  const navigate = useNavigate()
  const gate = gateOf(task)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
    disabled: overlay,
  })

  const open = () => {
    if (!overlay) void navigate(`/tasks/${task.id}`)
  }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      role="button"
      tabIndex={0}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter') open()
      }}
      className={cn(
        'border-hairline bg-canvas hover:bg-surface-soft/70 flex cursor-pointer flex-col gap-2.5 rounded-lg border p-3 text-left transition-colors outline-none',
        isDragging && 'opacity-35',
        overlay && 'border-primary shadow-2 rotate-[-1.5deg] cursor-grabbing',
      )}
    >
      <div className="flex items-start gap-2">
        <TypeChip type={task.type} iconOnly />
        <div className="text-ink line-clamp-2 text-[14px] leading-[1.4] font-medium">
          {task.title}
        </div>
      </div>
      {task.status !== 'done' && (
        <div className="flex h-[22px] items-center">
          {gate.passed ? <ReadyBadge /> : <GateDots gate={gate} />}
        </div>
      )}
      <div className="text-muted flex items-center justify-between text-[12px]">
        <span className="font-mono">#{task.id}</span>
        <span>{relativeTime(task.updatedAt)}</span>
      </div>
    </div>
  )
}
