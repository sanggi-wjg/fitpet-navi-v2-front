import { describe, expect, it } from 'vitest'
import type { TaskResponseDto } from '@/api/model'
import {
  createTypeInferrer,
  isBoardTask,
  normalizeIso,
  toTask,
  toTemplateMap,
} from '@/lib/api-mapping'

const templates = toTemplateMap([
  {
    task_type: 'NEW_FEATURE',
    template: '## 정책:\n- a\n\n## 세부사항:\n- b\n\n## 예외 조건:\n- c\n',
  },
  {
    task_type: 'AUTOMATION_BATCH',
    template: '## 정책:\n- a\n\n## 배치 주기:\n- x\n\n## 세부사항:\n- b\n\n## 예외 조건:\n- c\n',
  },
  {
    task_type: 'POLICY_CHANGE',
    template:
      '## 변경 전 정책:\n- a\n\n## 변경 후 정책:\n- b\n\n## 적용 대상:\n- c\n\n## 세부사항:\n- d\n\n## 예외 조건:\n- e\n',
  },
])
const inferType = createTypeInferrer(templates)

const base: TaskResponseDto = {
  id: 7,
  title: 't',
  content: '## 정책:\n- 실제\n\n## 배치 주기:\n- 매일\n\n## 세부사항:\n- x\n\n## 예외 조건:\n- y\n',
  tags: null,
  status: 'IN_PROGRESS',
  display_order: 2,
  priority: 0,
  is_archived: false,
  archived_at: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T01:00:00',
}

describe('createTypeInferrer', () => {
  it('섹션 구성이 정확히 일치하는 템플릿을 고른다', () => {
    expect(inferType(base.content)).toBe('automation')
    expect(inferType('## 정책:\n- 실제\n\n## 세부사항:\n- x\n\n## 예외 조건:\n- y\n')).toBe(
      'new_feature',
    )
  })
  it('섹션이 없으면 null', () => {
    expect(inferType('자유 텍스트')).toBeNull()
  })
})

describe('toTask', () => {
  it('DTO 를 뷰 모델로 바꾸고 naive 시각은 UTC 로 본다', () => {
    const task = toTask(base, inferType)
    expect(task).toMatchObject({
      id: 7,
      type: 'automation',
      status: 'in_progress',
      readOnly: false,
    })
    expect(task.updatedAt).toBe('2026-09-01T01:00:00Z')
    expect(normalizeIso('2026-09-01T01:00:00+09:00')).toBe('2026-09-01T01:00:00+09:00')
  })

  it('취소·아카이브는 보드에서 빠지고 상세에서 읽기 전용', () => {
    const canceled = { ...base, status: 'CANCELED' as const }
    expect(toTask(canceled, inferType)).toMatchObject({ status: 'canceled', readOnly: true })
    expect(isBoardTask(canceled)).toBe(false)
    const archived = { ...base, is_archived: true }
    expect(toTask(archived, inferType)).toMatchObject({
      status: 'in_progress',
      archived: true,
      readOnly: true,
    })
    expect(isBoardTask(archived)).toBe(false)
    expect(isBoardTask(base)).toBe(true)
  })
})
