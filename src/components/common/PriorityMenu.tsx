import { ChevronDown } from 'lucide-react'
import { MetaButton } from '@/components/common/MetaButton'
import { PriorityRadioItems } from '@/components/common/PriorityRadioItems'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PRIORITY_LABEL } from '@/lib/task-config'
import type { Priority } from '@/types/task'

interface PriorityMenuProps {
  value: Priority
  onChange: (priority: Priority) => void
  disabled?: boolean
}

/** 상세 헤더 메타 행의 우선순위 — 클릭하면 라디오 메뉴 */
export function PriorityMenu({ value, onChange, disabled = false }: PriorityMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<MetaButton aria-label="우선순위 변경" />} disabled={disabled}>
        <span>우선순위</span>
        <span className="text-ink">{PRIORITY_LABEL[value]}</span>
        <ChevronDown className="size-3" strokeWidth={1.75} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[150px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>우선순위</DropdownMenuLabel>
          <PriorityRadioItems value={value} onChange={onChange} />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
