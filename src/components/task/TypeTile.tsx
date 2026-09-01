import { TASK_TYPES } from '@/lib/task-config'
import { cn } from '@/lib/utils'
import type { TaskType } from '@/types/task'

interface TypeTileProps {
  type: TaskType
  selected: boolean
  onSelect: (type: TaskType) => void
}

export function TypeTile({ type, selected, onSelect }: TypeTileProps) {
  const { label, description, icon: Icon } = TASK_TYPES[type]
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(type)}
      className={cn(
        'flex flex-col gap-2.5 rounded-lg border p-4 text-left transition-colors',
        selected
          ? 'border-primary bg-primary-wash'
          : 'border-hairline bg-canvas hover:bg-surface-soft',
      )}
    >
      <Icon
        className={cn('size-5', selected ? 'text-primary-text' : 'text-muted')}
        strokeWidth={1.75}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-ink text-[14px] font-medium">{label}</span>
        <span className="text-muted text-[12px] leading-[1.45]">{description}</span>
      </span>
    </button>
  )
}
