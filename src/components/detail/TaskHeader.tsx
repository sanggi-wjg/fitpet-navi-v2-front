import { PriorityMenu } from '@/components/common/PriorityMenu'
import { StatusPill } from '@/components/common/StatusPill'
import { TagsEditor } from '@/components/common/TagsEditor'
import { TypeChip } from '@/components/common/TypeChip'
import { GateStrip } from '@/components/detail/GateStrip'
import type { TaskMetaPatch } from '@/hooks/useTasks'
import { relativeTime } from '@/lib/format'
import type { GateResult } from '@/lib/gate'
import { PRIORITY_LABEL } from '@/lib/task-config'
import type { Task } from '@/types/task'

interface TaskHeaderProps {
  task: Task
  gate: GateResult
  /** 없으면 읽기 전용 — 우선순위·태그를 텍스트로만 보인다 */
  onUpdateMeta?: (patch: TaskMetaPatch) => Promise<unknown>
  metaPending?: boolean
}

export function TaskHeader({ task, gate, onUpdateMeta, metaPending = false }: TaskHeaderProps) {
  const divider = (
    <span className="text-hairline" aria-hidden>
      |
    </span>
  )
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <TypeChip type={task.type} />
        <StatusPill status={task.status} />
      </div>
      <h1 className="font-display text-ink text-[28px] leading-[1.25] font-normal tracking-[-0.3px]">
        {task.title}
      </h1>
      <div className="text-muted flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] font-medium">
        <span className="font-mono text-[12px]">v{task.version}</span>
        {divider}
        <span className="font-mono text-[12px]">#{task.id}</span>
        {divider}
        {onUpdateMeta ? (
          <>
            <PriorityMenu
              value={task.priority}
              disabled={metaPending}
              onChange={(priority) => void onUpdateMeta({ priority })}
            />
            <TagsEditor
              tags={task.tags}
              disabled={metaPending}
              onSave={(tags) => onUpdateMeta({ tags })}
            />
          </>
        ) : (
          <>
            <span>
              우선순위 <span className="text-ink">{PRIORITY_LABEL[task.priority]}</span>
            </span>
            <span>
              태그{' '}
              <span className="text-ink">
                {task.tags.length > 0 ? task.tags.join(', ') : '없음'}
              </span>
            </span>
          </>
        )}
        {divider}
        <span>{relativeTime(task.createdAt)} 생성</span>
        {divider}
        <span>{relativeTime(task.updatedAt)} 수정</span>
      </div>
      <GateStrip gate={gate} />
    </div>
  )
}
