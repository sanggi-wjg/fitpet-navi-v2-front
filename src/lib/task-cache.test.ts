import { describe, expect, it } from 'vitest'
import type { SimpleTaskResponseDto, TaskResponseDto, TaskSectionResponseDto } from '@/api/model'
import { mergeDetail, mergeTaskRow, mergeTaskRows, patchSectionIn } from '@/lib/task-cache'

const section = (id: number, body = '- a'): TaskSectionResponseDto => ({
  id,
  task_id: 7,
  name: `s${id}`,
  body,
  display_order: id,
  is_required: true,
  version: 0,
  example_marker_count: 0,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
})

const simple = (id: number, version: number): SimpleTaskResponseDto => ({
  id,
  title: `t${id}`,
  tags: null,
  task_type: 'NEW_FEATURE',
  status: 'TODO',
  display_order: 0,
  priority: 2,
  is_archived: false,
  archived_at: null,
  version,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
})

const full = (id: number): TaskResponseDto => ({
  ...simple(id, 1),
  status: 'BACKLOG',
  task_sections: [section(1), section(2)],
})

describe('mergeTaskRow(s)', () => {
  it('같은 id 행만 갱신하고 task_sections 는 보존한다', () => {
    const list = [full(7), full(8)]
    const merged = mergeTaskRow(list, simple(7, 2))
    expect(merged?.[0]).toMatchObject({ id: 7, version: 2, status: 'TODO' })
    expect(merged?.[0].task_sections).toBe(list[0].task_sections)
    expect(merged?.[1]).toBe(list[1])
    expect(mergeTaskRow(undefined, simple(7, 2))).toBeUndefined()
  })
  it('여러 행(reorder 응답)을 한 번에 병합한다', () => {
    const merged = mergeTaskRows([full(7), full(8)], [simple(8, 5)])
    expect(merged?.map((row) => row.version)).toEqual([1, 5])
    expect(merged?.[1].task_sections).toHaveLength(2)
  })
})

describe('mergeDetail', () => {
  it('상세 캐시가 있으면 위에 병합, 없으면 undefined(no-op)', () => {
    const merged = mergeDetail(full(7), simple(7, 3))
    expect(merged).toMatchObject({ version: 3, status: 'TODO' })
    expect(merged?.task_sections).toHaveLength(2)
    expect(mergeDetail(undefined, simple(7, 3))).toBeUndefined()
  })
})

describe('patchSectionIn', () => {
  it('해당 id 섹션만 교체하고 없는 섹션은 추가하지 않는다', () => {
    const patched = patchSectionIn(full(7), { ...section(2, '- 바뀜'), version: 1 })
    expect(patched.task_sections.map((s) => s.body)).toEqual(['- a', '- 바뀜'])
    expect(patched.task_sections[1].version).toBe(1)
    expect(patchSectionIn(full(7), section(9)).task_sections).toHaveLength(2)
  })
})
