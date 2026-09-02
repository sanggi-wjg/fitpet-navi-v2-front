import { TaskStatusEnum, TaskTypeEnum } from '@/api/model'
import type { TaskResponseDto, TaskTypeTemplate } from '@/api/model'
import { DEFAULT_PRIORITY, isBoardStatus } from '@/lib/task-config'
import type { Priority, Task, TaskStatus, TaskType } from '@/types/task'

export const TYPE_FROM_API: Record<TaskTypeEnum, TaskType> = {
  NEW_FEATURE: 'new_feature',
  FEATURE_MODIFICATION: 'modify_feature',
  AUTOMATION_BATCH: 'automation',
  POLICY_CHANGE: 'policy_change',
}

export const TYPE_TO_API: Record<TaskType, TaskTypeEnum> = {
  new_feature: TaskTypeEnum.NEW_FEATURE,
  modify_feature: TaskTypeEnum.FEATURE_MODIFICATION,
  automation: TaskTypeEnum.AUTOMATION_BATCH,
  policy_change: TaskTypeEnum.POLICY_CHANGE,
}

const STATUS_FROM_API: Record<TaskStatusEnum, TaskStatus> = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELED: 'canceled',
}

export const STATUS_TO_API: Record<TaskStatus, TaskStatusEnum> = {
  backlog: TaskStatusEnum.BACKLOG,
  todo: TaskStatusEnum.TODO,
  in_progress: TaskStatusEnum.IN_PROGRESS,
  done: TaskStatusEnum.DONE,
  canceled: TaskStatusEnum.CANCELED,
}

export type TemplateMap = Partial<Record<TaskType, string>>

export function toTemplateMap(templates: TaskTypeTemplate[] | undefined): TemplateMap {
  const map: TemplateMap = {}
  for (const item of templates ?? []) map[TYPE_FROM_API[item.task_type]] = item.template
  return map
}

/** 타임존 표기가 없는 ISO 문자열은 UTC 로 본다 (FastAPI naive datetime 직렬화). */
export function normalizeIso(value: string): string {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`
}

/** 백엔드 태그는 쉼표 구분 문자열 — 공백 정리, 빈 값·중복 제거 */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of raw.split(',')) {
    const tag = part.trim()
    if (tag && !seen.has(tag)) {
      seen.add(tag)
      tags.push(tag)
    }
  }
  return tags
}

/** 배열 → 쉼표 구분 문자열. 비어 있으면 null (백엔드 컬럼 nullable) */
export function serializeTags(tags: string[]): string | null {
  const normalized = parseTags(tags.join(','))
  return normalized.length > 0 ? normalized.join(', ') : null
}

/** 범위 밖 값은 기본값(보통)으로 — 백엔드는 정수만 검증한다 */
export function toPriority(value: number): Priority {
  return Number.isInteger(value) && value >= 0 && value <= 4
    ? (value as Priority)
    : DEFAULT_PRIORITY
}

/** 보드에 표시할 태스크인지 (아카이브·취소 제외) */
export function isBoardTask(dto: TaskResponseDto): boolean {
  return !dto.is_archived && isBoardStatus(STATUS_FROM_API[dto.status])
}

export function toTask(dto: TaskResponseDto): Task {
  const status = STATUS_FROM_API[dto.status]
  return {
    id: dto.id,
    title: dto.title,
    type: TYPE_FROM_API[dto.task_type],
    status,
    content: dto.content,
    version: dto.version,
    tags: parseTags(dto.tags),
    displayOrder: dto.display_order,
    priority: toPriority(dto.priority),
    archived: dto.is_archived,
    readOnly: dto.is_archived || !isBoardStatus(status),
    createdAt: normalizeIso(dto.created_at),
    updatedAt: normalizeIso(dto.updated_at),
  }
}
