import { TaskStatusEnum, TaskTypeEnum } from '@/api/model'
import type {
  SimpleTaskResponseDto,
  TaskResponseDto,
  TaskSectionResponseDto,
  TaskTypeTemplate,
} from '@/api/model'
import { countMarkers } from '@/lib/markdown'
import { DEFAULT_PRIORITY, isBoardStatus } from '@/lib/task-config'
import type { Priority, Task, TaskSection, TaskStatus, TaskType } from '@/types/task'

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

/** 유형별 섹션 템플릿 — 생성 시 백엔드가 이 구성으로 섹션을 만든다 */
export interface TemplateSection {
  name: string
  body: string
  displayOrder: number
  isRequired: boolean
}

export type TemplateMap = Partial<Record<TaskType, TemplateSection[]>>

/** display_order 오름차순, 같으면 id (없으면 원래 순서) */
function byDisplayOrder<T extends { displayOrder: number; id?: number }>(a: T, b: T): number {
  return a.displayOrder - b.displayOrder || (a.id ?? 0) - (b.id ?? 0)
}

export function toTemplateMap(templates: TaskTypeTemplate[] | undefined): TemplateMap {
  const map: TemplateMap = {}
  for (const item of templates ?? []) {
    map[TYPE_FROM_API[item.task_type]] = item.sections
      .map((section) => ({
        name: section.name,
        body: section.body,
        displayOrder: section.display_order,
        isRequired: section.is_required,
      }))
      .sort(byDisplayOrder)
  }
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
export function isBoardTask(dto: SimpleTaskResponseDto): boolean {
  return !dto.is_archived && isBoardStatus(STATUS_FROM_API[dto.status])
}

/**
 * 섹션 행 → 뷰 모델. 마커 수는 `example_marker_count` 대신 본문에서 직접 센다 —
 * 백엔드 마커(`예:`)와 프론트 하이라이트(`(예:`)의 정의가 아직 다르므로 화면 안에서는 한 정의를 쓴다.
 */
export function toTaskSection(dto: TaskSectionResponseDto): TaskSection {
  return {
    id: dto.id,
    taskId: dto.task_id,
    name: dto.name,
    body: dto.body,
    displayOrder: dto.display_order,
    isRequired: dto.is_required,
    version: dto.version,
    markerCount: countMarkers(dto.body),
  }
}

export function toTask(dto: TaskResponseDto): Task {
  const status = STATUS_FROM_API[dto.status]
  const sections = dto.task_sections.map(toTaskSection).sort(byDisplayOrder)
  return {
    id: dto.id,
    title: dto.title,
    type: TYPE_FROM_API[dto.task_type],
    status,
    version: dto.version,
    tags: parseTags(dto.tags),
    displayOrder: dto.display_order,
    priority: toPriority(dto.priority),
    archived: dto.is_archived,
    archivedAt: dto.archived_at ? normalizeIso(dto.archived_at) : null,
    readOnly: dto.is_archived || !isBoardStatus(status),
    sections,
    markerCount: sections.reduce((sum, section) => sum + section.markerCount, 0),
    createdAt: normalizeIso(dto.created_at),
    updatedAt: normalizeIso(dto.updated_at),
  }
}
