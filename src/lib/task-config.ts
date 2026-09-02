import { PenLine, Scale, Sparkles, Timer, type LucideIcon } from 'lucide-react'
import type { BoardStatus, Priority, TaskStatus, TaskType } from '@/types/task'

export interface TaskTypeConfig {
  label: string
  /** 유형 타일 설명 — 명사구 (DESIGN.md D.1) */
  description: string
  icon: LucideIcon
}

export const TASK_TYPES: Record<TaskType, TaskTypeConfig> = {
  new_feature: { label: '신규 기능', description: '새 기능 추가', icon: Sparkles },
  modify_feature: { label: '기존 기능 수정', description: '기존 동작 변경', icon: PenLine },
  automation: { label: '자동화·배치', description: '주기 실행·자동 처리', icon: Timer },
  policy_change: { label: '정책 변경', description: '규칙·조건·금액 변경', icon: Scale },
}

export const TASK_TYPE_ORDER: TaskType[] = [
  'new_feature',
  'modify_feature',
  'automation',
  'policy_change',
]

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: '진행중',
  done: '완료',
  canceled: '취소',
}

export interface ColumnConfig {
  key: BoardStatus
  label: string
  /** 라틴 라벨은 uppercase + 넓은 트래킹, 한글은 좁은 트래킹 (DESIGN.md §B) */
  latin: boolean
}

/** 보드 컬럼. 개발자 전용 컬럼은 만들지 않는다 (spec 범위 3). */
export const COLUMNS: ColumnConfig[] = (
  [
    ['backlog', true],
    ['todo', true],
    ['in_progress', false],
    ['done', false],
  ] as Array<[BoardStatus, boolean]>
).map(([key, latin]) => ({ key, label: STATUS_LABEL[key], latin }))

export const BOARD_STATUSES: readonly BoardStatus[] = COLUMNS.map((column) => column.key)

export function isBoardStatus(status: TaskStatus): status is BoardStatus {
  return (BOARD_STATUSES as readonly TaskStatus[]).includes(status)
}

/** 우선순위 라벨 — 0이 가장 높다. 카드에는 기본값(보통)을 표시하지 않는다. */
export const PRIORITY_LABEL: Record<Priority, string> = {
  0: '매우 높음',
  1: '높음',
  2: '보통',
  3: '낮음',
  4: '매우 낮음',
}

export const PRIORITIES: readonly Priority[] = [0, 1, 2, 3, 4]

export const DEFAULT_PRIORITY: Priority = 2
