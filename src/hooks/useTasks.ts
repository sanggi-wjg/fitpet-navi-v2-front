import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  getGetTaskApiV1TasksTaskIdGetQueryKey,
  getGetTasksApiV1TasksGetQueryKey,
  reorderTasksApiV1TasksReorderPatch,
  updateTaskApiV1TasksTaskIdPatch,
  useArchiveTaskApiV1TasksTaskIdArchivePatch,
  useCreateTaskApiV1TasksPost,
  useGetTaskApiV1TasksTaskIdGet,
  useGetTasksApiV1TasksGet,
  useGetTemplatesApiV1TasksTemplatesGet,
  useUnarchiveTaskApiV1TasksTaskIdUnarchivePatch,
  useUpdateTaskApiV1TasksTaskIdPatch,
  useUpdateTaskSectionApiV1TasksTaskIdSectionsSectionIdPatch,
} from '@/api/endpoints/task/task'
import type { SimpleTaskResponseDto, TaskResponseDto, TaskSectionResponseDto } from '@/api/model'
import { isConflict } from '@/lib/api-error'
import {
  STATUS_TO_API,
  TYPE_TO_API,
  isBoardTask,
  serializeTags,
  toTask,
  toTemplateMap,
  type TemplateMap,
} from '@/lib/api-mapping'
import { mergeDetail, mergeTaskRow, mergeTaskRows, patchSectionIn } from '@/lib/task-cache'
import type {
  BoardStatus,
  Priority,
  Task,
  TaskRef,
  TaskSection,
  TaskStatus,
  TaskType,
} from '@/types/task'

/** 유형별 섹션 템플릿 (백엔드 4종). 자주 바뀌지 않으므로 길게 캐시한다. */
export function useTemplates() {
  const query = useGetTemplatesApiV1TasksTemplatesGet({
    query: { staleTime: 10 * 60_000 },
  })
  const templates = useMemo<TemplateMap>(() => toTemplateMap(query.data), [query.data])
  return { ...query, templates }
}

/** 정렬용 시각 — 아카이브 시각이 없으면 수정 시각 */
const archivedTime = (task: Task) => Date.parse(task.archivedAt ?? task.updatedAt)

/**
 * 보드 태스크 — 컬럼 안 순서는 display_order, 같으면 최신 id 먼저.
 * 같은 목록 응답에서 아카이브된 태스크(`archivedTasks`, 최근 아카이브 먼저)도 함께 돌려준다.
 */
export function useTasks() {
  const query = useGetTasksApiV1TasksGet()
  const tasks = useMemo<Task[]>(
    () =>
      (query.data ?? [])
        .filter(isBoardTask)
        .map(toTask)
        .sort((a, b) => a.displayOrder - b.displayOrder || b.id - a.id),
    [query.data],
  )
  const archivedTasks = useMemo<Task[]>(
    () =>
      (query.data ?? [])
        .filter((dto) => dto.is_archived)
        .map(toTask)
        .sort((a, b) => archivedTime(b) - archivedTime(a) || b.id - a.id),
    [query.data],
  )
  return { ...query, tasks, archivedTasks }
}

export function useTask(taskId: number | undefined) {
  const query = useGetTaskApiV1TasksTaskIdGet(taskId ?? 0, {
    query: { enabled: taskId !== undefined },
  })
  const task = useMemo<Task | undefined>(
    () => (query.data ? toTask(query.data) : undefined),
    [query.data],
  )
  return { ...query, task }
}

/**
 * 목록·상세 캐시는 섹션을 포함한 `TaskResponseDto`. 섹션이 없는 PATCH·reorder 응답은
 * 기존 값 위에 병합하고(`task_sections` 보존), 409 는 서버 버전을 다시 받는다.
 */
export function useTaskCache() {
  const queryClient = useQueryClient()
  const listKey = getGetTasksApiV1TasksGetQueryKey()
  const detailKey = (taskId: number) => getGetTaskApiV1TasksTaskIdGetQueryKey(taskId)
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: listKey })
  const invalidateDetail = (taskId: number) =>
    queryClient.invalidateQueries({ queryKey: detailKey(taskId) })
  return {
    listKey,
    invalidateList,
    invalidateDetail,
    /** 생성·조회 응답(섹션 포함)만 상세 캐시에 그대로 넣는다 */
    setDetail: (dto: TaskResponseDto) => queryClient.setQueryData(detailKey(dto.id), dto),
    /** 섹션 없는 응답을 목록 행·상세 캐시 위에 병합한다 */
    mergeSimple: (simple: SimpleTaskResponseDto) => {
      queryClient.setQueryData<TaskResponseDto[]>(listKey, (old) => mergeTaskRow(old, simple))
      queryClient.setQueryData<TaskResponseDto>(detailKey(simple.id), (old) =>
        mergeDetail(old, simple),
      )
    },
    /** reorder 응답(여러 행)을 목록에 병합한다 */
    mergeSimples: (simples: SimpleTaskResponseDto[]) =>
      queryClient.setQueryData<TaskResponseDto[]>(listKey, (old) => mergeTaskRows(old, simples)),
    /** 섹션 PATCH 응답을 목록 행·상세 캐시의 해당 섹션에 반영한다 */
    patchSection: (taskId: number, section: TaskSectionResponseDto) => {
      queryClient.setQueryData<TaskResponseDto[]>(listKey, (old) =>
        old?.map((row) => (row.id === taskId ? patchSectionIn(row, section) : row)),
      )
      queryClient.setQueryData<TaskResponseDto>(detailKey(taskId), (old) =>
        old ? patchSectionIn(old, section) : undefined,
      )
    },
    /** 낙관적 잠금 실패(409)면 최신 version 을 다시 받는다 — 그 외 오류는 호출자가 toast */
    onMutationError: (error: unknown, taskId: number) => {
      if (!isConflict(error)) return
      void invalidateList()
      void invalidateDetail(taskId)
    },
    /** 목록 캐시를 낙관적으로 바꾸고 이전 값을 돌려준다 */
    patchList: (update: (dto: TaskResponseDto) => TaskResponseDto) => {
      const previous = queryClient.getQueryData<TaskResponseDto[]>(listKey)
      queryClient.setQueryData<TaskResponseDto[]>(listKey, (old) => old?.map(update))
      return previous
    },
    restoreList: (previous: TaskResponseDto[] | undefined) => {
      if (previous) queryClient.setQueryData(listKey, previous)
    },
    cancelList: () => queryClient.cancelQueries({ queryKey: listKey }),
  }
}

export interface CreateTaskInput {
  title: string
  type: TaskType
}

/** 생성 — 섹션은 백엔드가 유형 템플릿으로 만든다. 본문 편집은 상세에서. */
export function useCreateTask() {
  const cache = useTaskCache()
  const mutation = useCreateTaskApiV1TasksPost({
    mutation: {
      onSuccess: (dto) => {
        cache.setDetail(dto)
        void cache.invalidateList()
      },
    },
  })
  return {
    ...mutation,
    /** 생성 후 뷰 모델을 돌려준다 — DTO 는 훅 밖으로 나가지 않는다 */
    createTask: async (input: CreateTaskInput): Promise<Task> => {
      const dto = await mutation.mutateAsync({
        data: {
          title: input.title.trim(),
          task_type: TYPE_TO_API[input.type],
          status: STATUS_TO_API.backlog,
        },
      })
      return toTask(dto)
    },
  }
}

export interface MoveTaskInput {
  task: Task
  /** 놓인 컬럼 */
  status: BoardStatus
  /** 놓인 컬럼의 최종 id 순서 (이동한 카드 포함, 필터로 숨은 카드까지 합친 전체) */
  orderedIds: number[]
}

/**
 * 보드 이동 + 컬럼 안 순서 변경. 상태가 바뀌면 PATCH(태스크 version 동봉) 후 대상 컬럼을 reorder 한다.
 * 목록 캐시를 먼저 바꾸고(낙관적) 실패하면 되돌린다. display_order 는 컬럼 안에서만 의미가 있다.
 */
export function useMoveTask() {
  const cache = useTaskCache()
  const mutation = useMutation({
    mutationFn: async ({ task, status, orderedIds }: MoveTaskInput) => {
      const updated =
        task.status !== status
          ? await updateTaskApiV1TasksTaskIdPatch(task.id, {
              status: STATUS_TO_API[status],
              version: task.version,
            })
          : null
      const reordered = await reorderTasksApiV1TasksReorderPatch({ ordered_task_ids: orderedIds })
      return { updated, reordered }
    },
    /** 응답의 새 version·display_order 를 바로 병합 — refetch 전 연속 이동에서도 최신 version 을 보낸다 */
    onSuccess: ({ updated, reordered }) => {
      if (updated) cache.mergeSimple(updated)
      cache.mergeSimples(reordered)
    },
    onMutate: async ({ task, status, orderedIds }) => {
      await cache.cancelList()
      const order = new Map(orderedIds.map((id, index) => [id, index]))
      const previous = cache.patchList((dto) => {
        const displayOrder = order.get(dto.id)
        const patched = displayOrder === undefined ? dto : { ...dto, display_order: displayOrder }
        return dto.id === task.id ? { ...patched, status: STATUS_TO_API[status] } : patched
      })
      return { previous }
    },
    onError: (error, { task }, context) => {
      cache.restoreList(context?.previous)
      cache.onMutationError(error, task.id)
    },
    onSettled: (_data, _error, { task }) => {
      void cache.invalidateList()
      void cache.invalidateDetail(task.id)
    },
  })
  return { ...mutation, moveTask: (input: MoveTaskInput) => mutation.mutateAsync(input) }
}

/** 상태만 바꾼다 — 취소(보드에서 사라짐) · 복원(Backlog 로). 보드 이동은 useMoveTask. */
export function useSetTaskStatus() {
  const cache = useTaskCache()
  const mutation = useUpdateTaskApiV1TasksTaskIdPatch({
    mutation: {
      onMutate: async ({ taskId, data }) => {
        await cache.cancelList()
        const status = data.status ?? undefined
        return {
          previous: cache.patchList((dto) =>
            dto.id === taskId && status ? { ...dto, status } : dto,
          ),
        }
      },
      onError: (error, { taskId }, context) => {
        cache.restoreList(context?.previous)
        cache.onMutationError(error, taskId)
      },
      onSuccess: (dto) => cache.mergeSimple(dto),
      onSettled: () => void cache.invalidateList(),
    },
  })
  return {
    ...mutation,
    /** 새 version 을 돌려준다 — 되돌리기처럼 이어지는 PATCH 는 이 값을 써야 409 가 나지 않는다 */
    setTaskStatus: async (task: TaskRef, status: TaskStatus): Promise<TaskRef> => {
      const dto = await mutation.mutateAsync({
        taskId: task.id,
        data: { status: STATUS_TO_API[status], version: task.version },
      })
      return { id: dto.id, version: dto.version }
    },
  }
}

export interface TaskMetaPatch {
  priority?: Priority
  tags?: string[]
}

/** 우선순위·태그 — 본문과 무관한 메타 필드 PATCH (태스크 version 동봉) */
export function useUpdateTaskMeta() {
  const cache = useTaskCache()
  const mutation = useUpdateTaskApiV1TasksTaskIdPatch({
    mutation: {
      onSuccess: (dto) => cache.mergeSimple(dto),
      onError: (error, { taskId }) => cache.onMutationError(error, taskId),
    },
  })
  return {
    ...mutation,
    updateMeta: async (task: TaskRef, patch: TaskMetaPatch): Promise<TaskRef> => {
      const dto = await mutation.mutateAsync({
        taskId: task.id,
        data: {
          ...(patch.priority !== undefined && { priority: patch.priority }),
          ...(patch.tags !== undefined && { tags: serializeTags(patch.tags) }),
          version: task.version,
        },
      })
      return { id: dto.id, version: dto.version }
    },
  }
}

type ArchiveVariables = { taskId: number }
type ArchiveContext = { previous: TaskResponseDto[] | undefined }

/**
 * 아카이브 / 해제 — body·version 검사 없음(409 없음). 확인 다이얼로그 없이 실행하므로
 * 목록을 낙관적으로 먼저 바꾸고(보드에서 즉시 사라지거나 돌아옴) 실패하면 되돌린다.
 */
export function useArchiveTask() {
  const cache = useTaskCache()
  const mutationOptions = (
    archived: boolean,
  ): UseMutationOptions<SimpleTaskResponseDto, unknown, ArchiveVariables, ArchiveContext> => ({
    onMutate: async ({ taskId }) => {
      await cache.cancelList()
      return {
        previous: cache.patchList((dto) =>
          dto.id === taskId
            ? {
                ...dto,
                is_archived: archived,
                archived_at: archived ? new Date().toISOString() : null,
              }
            : dto,
        ),
      }
    },
    onError: (error, { taskId }, context) => {
      cache.restoreList(context?.previous)
      cache.onMutationError(error, taskId)
    },
    onSuccess: (dto) => cache.mergeSimple(dto),
    onSettled: (_data, _error, { taskId }) => {
      void cache.invalidateList()
      void cache.invalidateDetail(taskId)
    },
  })
  const archiveMutation = useArchiveTaskApiV1TasksTaskIdArchivePatch({
    mutation: mutationOptions(true),
  })
  const unarchiveMutation = useUnarchiveTaskApiV1TasksTaskIdUnarchivePatch({
    mutation: mutationOptions(false),
  })
  const toRef = (dto: SimpleTaskResponseDto): TaskRef => ({ id: dto.id, version: dto.version })
  return {
    isPending: archiveMutation.isPending || unarchiveMutation.isPending,
    archive: async (task: Pick<Task, 'id'>): Promise<TaskRef> =>
      toRef(await archiveMutation.mutateAsync({ taskId: task.id })),
    unarchive: async (task: Pick<Task, 'id'>): Promise<TaskRef> =>
      toRef(await unarchiveMutation.mutateAsync({ taskId: task.id })),
  }
}

export interface UpdateSectionInput {
  taskId: number
  /** 편집한 섹션 — version 은 편집을 시작할 때 본 값 */
  section: Pick<TaskSection, 'id' | 'version'>
  body: string
}

/** 섹션 본문 PATCH — 섹션 version 불일치면 409, 캐시를 갱신해 새 version 으로 다시 저장할 수 있게 한다 */
export function useUpdateSection() {
  const cache = useTaskCache()
  const mutation = useUpdateTaskSectionApiV1TasksTaskIdSectionsSectionIdPatch({
    mutation: {
      onSuccess: (dto, { taskId }) => cache.patchSection(taskId, dto),
      onError: (error, { taskId }) => cache.onMutationError(error, taskId),
    },
  })
  return {
    ...mutation,
    updateSection: ({ taskId, section, body }: UpdateSectionInput) =>
      mutation.mutateAsync({
        taskId,
        sectionId: section.id,
        data: { body, version: section.version },
      }),
  }
}
