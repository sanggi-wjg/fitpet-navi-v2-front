import { describe, expect, it } from 'vitest'
import type { TaskResponseDto } from '@/api/model'
import {
  isBoardTask,
  normalizeIso,
  parseTags,
  serializeTags,
  toPriority,
  toTask,
  toTemplateMap,
} from '@/lib/api-mapping'

const base: TaskResponseDto = {
  id: 7,
  title: 't',
  content: '## 정책:\n- 실제\n\n## 배치 주기:\n- 매일\n\n## 세부사항:\n- x\n\n## 예외 조건:\n- y\n',
  tags: null,
  task_type: 'AUTOMATION_BATCH',
  status: 'IN_PROGRESS',
  version: 3,
  display_order: 2,
  priority: 0,
  is_archived: false,
  archived_at: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T01:00:00',
}

describe('toTemplateMap', () => {
  it('enum 키를 뷰 모델 유형으로 바꾼다', () => {
    expect(toTemplateMap([{ task_type: 'NEW_FEATURE', template: '## 정책:\n' }])).toEqual({
      new_feature: '## 정책:\n',
    })
    expect(toTemplateMap(undefined)).toEqual({})
  })
})

describe('toTask', () => {
  it('DTO 를 뷰 모델로 바꾸고 naive 시각은 UTC 로 본다', () => {
    const task = toTask(base)
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
    expect(toTask(canceled)).toMatchObject({ status: 'canceled', readOnly: true })
    expect(isBoardTask(canceled)).toBe(false)
    const archived = { ...base, is_archived: true }
    expect(toTask(archived)).toMatchObject({
      status: 'in_progress',
      archived: true,
      readOnly: true,
    })
    expect(isBoardTask(archived)).toBe(false)
    expect(isBoardTask(base)).toBe(true)
  })
})

describe('tags · priority', () => {
  it('쉼표 구분 문자열을 정리해 배열로 만들고, 빈 값·중복은 버린다', () => {
    expect(parseTags(' 적립금, 배치 ,,적립금 ')).toEqual(['적립금', '배치'])
    expect(parseTags(null)).toEqual([])
    expect(parseTags('')).toEqual([])
  })
  it('배열은 쉼표 문자열로, 비어 있으면 null 로 보낸다', () => {
    expect(serializeTags(['적립금', ' 배치 '])).toBe('적립금, 배치')
    expect(serializeTags([])).toBeNull()
    expect(serializeTags(['', ' '])).toBeNull()
  })
  it('우선순위는 0~4 만 허용하고 범위 밖은 보통(2)으로', () => {
    expect(toPriority(0)).toBe(0)
    expect(toPriority(4)).toBe(4)
    expect(toPriority(7)).toBe(2)
    expect(toPriority(-1)).toBe(2)
    expect(toPriority(1.5)).toBe(2)
  })
  it('toTask 는 태그·우선순위를 뷰 모델 형태로 바꾼다', () => {
    const task = toTask({ ...base, tags: 'a, b', priority: 1 })
    expect(task.tags).toEqual(['a', 'b'])
    expect(task.priority).toBe(1)
  })
})
