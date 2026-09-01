import { TaskStatusEnum, TaskTypeEnum } from '@/api/model'
import type { TaskResponseDto, TaskTypeTemplate } from '@/api/model'
import { parseSections } from '@/lib/markdown'
import { isBoardStatus } from '@/lib/task-config'
import type { Task, TaskStatus, TaskType } from '@/types/task'

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

export type TypeInferrer = (content: string) => TaskType | null

/**
 * 임시: 응답에 task_type 이 없어 문서의 섹션 구성을 템플릿과 대조해 유형을 추론한다.
 * 템플릿 파싱은 한 번만 하고 태스크마다 재사용한다. 백엔드가 `TaskResponseDto.task_type` 을 내려주면 제거한다.
 */
export function createTypeInferrer(templates: TemplateMap): TypeInferrer {
  const candidates = (Object.entries(templates) as Array<[TaskType, string]>).map(
    ([type, template]) => ({
      type,
      names: parseSections(template).sections.map((section) => section.name),
    }),
  )
  return (content) => {
    const names = new Set(parseSections(content).sections.map((section) => section.name))
    if (names.size === 0) return null
    let best: { type: TaskType; score: number } | null = null
    for (const candidate of candidates) {
      const matched = candidate.names.filter((name) => names.has(name)).length
      // 일치 수에서 양쪽 불일치 수를 빼 가장 잘 맞는 템플릿을 고른다
      const score = matched - (candidate.names.length - matched) - (names.size - matched)
      if (matched > 0 && (!best || score > best.score)) best = { type: candidate.type, score }
    }
    return best?.type ?? null
  }
}

export function inferTaskType(content: string, templates: TemplateMap): TaskType | null {
  return createTypeInferrer(templates)(content)
}

/** 타임존 표기가 없는 ISO 문자열은 UTC 로 본다 (FastAPI naive datetime 직렬화). */
export function normalizeIso(value: string): string {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`
}

/** 보드에 표시할 태스크인지 (아카이브·취소 제외) */
export function isBoardTask(dto: TaskResponseDto): boolean {
  return !dto.is_archived && isBoardStatus(STATUS_FROM_API[dto.status])
}

export function toTask(dto: TaskResponseDto, inferType: TypeInferrer): Task {
  const status = STATUS_FROM_API[dto.status]
  return {
    id: dto.id,
    title: dto.title,
    type: inferType(dto.content),
    status,
    content: dto.content,
    tags: dto.tags ?? null,
    displayOrder: dto.display_order,
    priority: dto.priority,
    archived: dto.is_archived,
    readOnly: dto.is_archived || !isBoardStatus(status),
    createdAt: normalizeIso(dto.created_at),
    updatedAt: normalizeIso(dto.updated_at),
  }
}
