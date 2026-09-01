import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TASK_TYPES } from '@/lib/task-config'
import { cn } from '@/lib/utils'
import type { TaskType } from '@/types/task'

interface TypeChipProps {
  type: TaskType | null
  /** 카드에서는 아이콘만 + 툴팁 (DESIGN.md D.3) */
  iconOnly?: boolean
  className?: string
}

/** 태스크 유형 — 색이 아니라 아이콘으로 구분한다 */
export function TypeChip({ type, iconOnly = false, className }: TypeChipProps) {
  const config = type ? TASK_TYPES[type] : null
  const Icon = config?.icon
  const label = config?.label ?? '유형 미확인'

  if (iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={cn(
                'bg-surface-card text-muted inline-flex size-[22px] shrink-0 items-center justify-center rounded-full',
                className,
              )}
              aria-label={label}
            />
          }
        >
          {Icon ? (
            <Icon className="size-3.5" strokeWidth={1.75} />
          ) : (
            <span className="text-[11px] font-medium">?</span>
          )}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <span
      className={cn(
        'bg-surface-card text-ink inline-flex h-6 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[12px] font-medium',
        className,
      )}
    >
      {Icon && <Icon className="text-muted size-3.5" strokeWidth={1.75} />}
      <span>{label}</span>
    </span>
  )
}
