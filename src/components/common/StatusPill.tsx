import { STATUS_LABEL } from '@/lib/task-config'
import type { TaskStatus } from '@/types/task'

export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span className="bg-surface-card text-muted inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium">
      {STATUS_LABEL[status]}
    </span>
  )
}
