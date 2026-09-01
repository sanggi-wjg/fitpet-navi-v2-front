import { StatusPill } from '@/components/common/StatusPill'
import { TypeChip } from '@/components/common/TypeChip'
import { GateStrip } from '@/components/detail/GateStrip'
import { relativeTime } from '@/lib/format'
import type { GateResult } from '@/lib/gate'
import type { Task } from '@/types/task'

export function TaskHeader({ task, gate }: { task: Task; gate: GateResult }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <TypeChip type={task.type} />
        <StatusPill status={task.status} />
      </div>
      <h1 className="font-display text-ink text-[28px] leading-[1.25] font-normal tracking-[-0.3px]">
        {task.title}
      </h1>
      <div className="text-muted flex items-center gap-2.5 text-[13px] font-medium">
        <span className="font-mono text-[12px]">#{task.id}</span>
        <span className="text-hairline">|</span>
        <span>{relativeTime(task.createdAt)} 생성</span>
        <span className="text-hairline">|</span>
        <span>{relativeTime(task.updatedAt)} 수정</span>
      </div>
      <GateStrip gate={gate} />
    </div>
  )
}
