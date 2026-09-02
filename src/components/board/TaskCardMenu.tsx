import { ArrowRightLeft, ArrowUpRight, Ban, Ellipsis, Flag } from 'lucide-react'
import type { SyntheticEvent } from 'react'
import { PriorityRadioItems } from '@/components/common/PriorityRadioItems'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { COLUMNS, PRIORITY_LABEL } from '@/lib/task-config'
import type { BoardStatus, Priority, Task } from '@/types/task'

/** 카드 kebab 과 보드가 공유하는 액션 — 실제 처리(게이트 경고·확인 다이얼로그)는 페이지가 한다 */
export interface TaskCardActions {
  onOpen: (task: Task) => void
  onMove: (task: Task, status: BoardStatus) => void
  onChangePriority: (task: Task, priority: Priority) => void
  onCancel: (task: Task) => void
}

/** 카드 안 이벤트가 카드 클릭(상세 이동)·드래그 센서로 번지지 않게 막는다. 포털 안 메뉴도 React 트리로 버블링된다. */
const stop = (event: SyntheticEvent) => event.stopPropagation()

interface TaskCardMenuProps {
  task: Task
  actions: TaskCardActions
}

/** 카드 우상단 kebab — 드래그 대신 쓸 수 있는 키보드 경로이기도 하다 */
export function TaskCardMenu({ task, actions }: TaskCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={stop}
        onPointerDown={stop}
        onKeyDown={stop}
        render={
          <button
            type="button"
            aria-label="태스크 메뉴"
            className="text-muted hover:bg-surface-card data-popup-open:bg-surface-card inline-flex size-7 items-center justify-center rounded-md opacity-0 transition-opacity outline-none group-focus-within/card:opacity-100 group-hover/card:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
          />
        }
      >
        <Ellipsis className="size-4" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onClick={stop}
        onPointerDown={stop}
        onKeyDown={stop}
      >
        <DropdownMenuItem onClick={() => actions.onOpen(task)}>
          <ArrowUpRight strokeWidth={1.75} />
          상세 열기
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Flag strokeWidth={1.75} />
            우선순위
            <span className="text-muted ml-auto pl-3 text-[12px]">
              {PRIORITY_LABEL[task.priority]}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-[140px]">
            <PriorityRadioItems
              value={task.priority}
              onChange={(priority) => actions.onChangePriority(task, priority)}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowRightLeft strokeWidth={1.75} />
            이동
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-[120px]">
            {COLUMNS.filter((column) => column.key !== task.status).map((column) => (
              <DropdownMenuItem key={column.key} onClick={() => actions.onMove(task, column.key)}>
                {column.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => actions.onCancel(task)}>
          <Ban strokeWidth={1.75} />
          태스크 취소
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
