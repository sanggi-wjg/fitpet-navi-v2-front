import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu'
import { PRIORITIES, PRIORITY_LABEL } from '@/lib/task-config'
import type { Priority } from '@/types/task'

interface PriorityRadioItemsProps {
  value: Priority
  onChange: (priority: Priority) => void
}

/**
 * 우선순위 라디오 목록 — 메뉴 본문이나 서브메뉴 안에 넣는다.
 * Base UI RadioItem 은 기본으로 메뉴를 닫지 않으므로(`closeOnClick=false`) 고르면 닫히도록 켠다.
 */
export function PriorityRadioItems({ value, onChange }: PriorityRadioItemsProps) {
  return (
    <DropdownMenuRadioGroup
      value={String(value)}
      onValueChange={(next: unknown) => onChange(Number(next) as Priority)}
    >
      {PRIORITIES.map((priority) => (
        <DropdownMenuRadioItem key={priority} value={String(priority)} closeOnClick>
          {PRIORITY_LABEL[priority]}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}
