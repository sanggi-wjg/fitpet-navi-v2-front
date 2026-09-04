import { describe, expect, it } from 'vitest'
import type { TaskResponseDto, TaskSectionResponseDto } from '@/api/model'
import {
  isBoardTask,
  normalizeIso,
  parseTags,
  serializeTags,
  toPriority,
  toTask,
  toTaskSection,
  toTemplateMap,
} from '@/lib/api-mapping'

const section = (overrides: Partial<TaskSectionResponseDto> = {}): TaskSectionResponseDto => ({
  id: 1,
  task_id: 7,
  name: '정책',
  body: '- 실제',
  display_order: 0,
  is_required: false,
  version: 0,
  example_marker_count: 0,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  ...overrides,
})

const base: TaskResponseDto = {
  id: 7,
  title: 't',
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
  task_sections: [
    section({ id: 3, name: '예외 조건', body: '- (예: y)', display_order: 2, is_required: true }),
    section({ id: 1, name: '정책', body: '- 실제', display_order: 0 }),
    section({
      id: 2,
      name: '세부사항',
      body: '- (예: x) (예: z)',
      display_order: 1,
      is_required: true,
      version: 4,
    }),
  ],
}

describe('toTemplateMap', () => {
  it('enum 키를 뷰 모델 유형으로 바꾸고 섹션을 display_order 순으로 담는다', () => {
    expect(
      toTemplateMap([
        {
          task_type: 'NEW_FEATURE',
          sections: [
            { name: '세부사항', body: '- b', display_order: 1, is_required: true },
            { name: '정책', body: '- a', display_order: 0, is_required: false },
          ],
        },
      ]),
    ).toEqual({
      new_feature: [
        { name: '정책', body: '- a', displayOrder: 0, isRequired: false },
        { name: '세부사항', body: '- b', displayOrder: 1, isRequired: true },
      ],
    })
    expect(toTemplateMap(undefined)).toEqual({})
  })
})

describe('toTaskSection', () => {
  it('섹션 행을 뷰 모델로 바꾸고 마커는 본문에서 직접 센다 (example_marker_count 무시)', () => {
    expect(
      toTaskSection(section({ body: '- (예: a)\n- 예: 괄호 없음', example_marker_count: 2 })),
    ).toEqual({
      id: 1,
      taskId: 7,
      name: '정책',
      body: '- (예: a)\n- 예: 괄호 없음',
      displayOrder: 0,
      isRequired: false,
      version: 0,
      markerCount: 1,
    })
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

  it('섹션은 display_order 순으로 정렬하고 markerCount 는 섹션 합', () => {
    const task = toTask(base)
    expect(task.sections.map((item) => item.name)).toEqual(['정책', '세부사항', '예외 조건'])
    expect(task.sections.map((item) => item.markerCount)).toEqual([0, 2, 1])
    expect(task.sections[1]).toMatchObject({ id: 2, isRequired: true, version: 4 })
    expect(task.markerCount).toBe(3)
  })

  it('취소·아카이브는 보드에서 빠지고 상세에서 읽기 전용', () => {
    const canceled = { ...base, status: 'CANCELED' as const }
    expect(toTask(canceled)).toMatchObject({ status: 'canceled', readOnly: true })
    expect(isBoardTask(canceled)).toBe(false)
    expect(toTask(base).archivedAt).toBeNull()
    const archived = { ...base, is_archived: true, archived_at: '2026-09-02T00:00:00' }
    expect(toTask(archived)).toMatchObject({
      status: 'in_progress',
      archived: true,
      archivedAt: '2026-09-02T00:00:00Z',
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
