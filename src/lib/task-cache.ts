import type { SimpleTaskResponseDto, TaskResponseDto, TaskSectionResponseDto } from '@/api/model'

/**
 * React Query 캐시 병합 — 순수 함수.
 * 목록·상세 캐시는 섹션을 포함한 `TaskResponseDto` 이고, PATCH·reorder 응답은 섹션이 없는
 * `SimpleTaskResponseDto` 라서 그대로 덮어쓰면 섹션이 사라진다. 항상 기존 행 위에 펼친다.
 */

export function mergeTaskRow(
  list: TaskResponseDto[] | undefined,
  simple: SimpleTaskResponseDto,
): TaskResponseDto[] | undefined {
  return list?.map((row) => (row.id === simple.id ? { ...row, ...simple } : row))
}

export function mergeTaskRows(
  list: TaskResponseDto[] | undefined,
  simples: SimpleTaskResponseDto[],
): TaskResponseDto[] | undefined {
  const byId = new Map(simples.map((simple) => [simple.id, simple]))
  return list?.map((row) => {
    const simple = byId.get(row.id)
    return simple ? { ...row, ...simple } : row
  })
}

/** 상세 캐시가 없으면 undefined — React Query 의 setQueryData 에서 no-op 이 된다 */
export function mergeDetail(
  old: TaskResponseDto | undefined,
  simple: SimpleTaskResponseDto,
): TaskResponseDto | undefined {
  return old ? { ...old, ...simple } : undefined
}

/** 같은 id 의 섹션만 교체. 없는 섹션은 추가하지 않는다 (구성은 템플릿 고정) */
export function patchSectionIn(
  dto: TaskResponseDto,
  section: TaskSectionResponseDto,
): TaskResponseDto {
  return {
    ...dto,
    task_sections: dto.task_sections.map((item) => (item.id === section.id ? section : item)),
  }
}
