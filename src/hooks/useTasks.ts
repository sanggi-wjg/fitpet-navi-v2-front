import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  getGetTaskApiV1TasksTaskIdGetQueryKey,
  getGetTasksApiV1TasksGetQueryKey,
  reorderTasksApiV1TasksReorderPatch,
  updateTaskApiV1TasksTaskIdPatch,
  useCreateTaskApiV1TasksPost,
  useGetTaskApiV1TasksTaskIdGet,
  useGetTasksApiV1TasksGet,
  useGetTemplatesApiV1TasksTemplatesGet,
  useUpdateTaskApiV1TasksTaskIdPatch,
} from '@/api/endpoints/task/task'
import type { TaskResponseDto } from '@/api/model'
import {
  STATUS_TO_API,
  TYPE_TO_API,
  isBoardTask,
  serializeTags,
  toTask,
  toTemplateMap,
  type TemplateMap,
} from '@/lib/api-mapping'
import { PREAMBLE_KEY, replacePreamble, replaceSection } from '@/lib/markdown'
import type { BoardStatus, Priority, Task, TaskStatus, TaskType } from '@/types/task'

/** 유형별 템플릿 (백엔드 md 4종). 자주 바뀌지 않으므로 길게 캐시한다. */
export function useTemplates() {
  const query = useGetTemplatesApiV1TasksTemplatesGet({
    query: { staleTime: 10 * 60_000 },
  })
  const templates = useMemo<TemplateMap>(() => toTemplateMap(query.data), [query.data])
  return { ...query, templates }
}

/** 보드 태스크 — 컬럼 안 순서는 display_order, 같으면 최신 id 먼저 */
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
  return { ...query, tasks }
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

function useTaskCache() {
  const queryClient = useQueryClient()
  const listKey = getGetTasksApiV1TasksGetQueryKey()
  return {
    listKey,
    setDetail: (dto: TaskResponseDto) =>
      queryClient.setQueryData(getGetTaskApiV1TasksTaskIdGetQueryKey(dto.id), dto),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: listKey }),
    invalidateDetail: (taskId: number) =>
      queryClient.invalidateQueries({ queryKey: getGetTaskApiV1TasksTaskIdGetQueryKey(taskId) }),
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
  content: string
}

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
          content: input.content,
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
 * 보드 이동 + 컬럼 안 순서 변경. 상태가 바뀌면 PATCH 후 대상 컬럼을 reorder 한다.
 * 목록 캐시를 먼저 바꾸고(낙관적) 실패하면 되돌린다. display_order 는 컬럼 안에서만 의미가 있다.
 */
export function useMoveTask() {
  const cache = useTaskCache()
  const mutation = useMutation({
    mutationFn: async ({ task, status, orderedIds }: MoveTaskInput) => {
      if (task.status !== status) {
        await updateTaskApiV1TasksTaskIdPatch(task.id, { status: STATUS_TO_API[status] })
      }
      await reorderTasksApiV1TasksReorderPatch({ task_ids: orderedIds })
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
    onError: (_error, _variables, context) => cache.restoreList(context?.previous),
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
      onError: (_error, _variables, context) => cache.restoreList(context?.previous),
      onSuccess: (dto) => cache.setDetail(dto),
      onSettled: () => void cache.invalidateList(),
    },
  })
  return {
    ...mutation,
    setTaskStatus: (taskId: number, status: TaskStatus) =>
      mutation.mutateAsync({ taskId, data: { status: STATUS_TO_API[status] } }),
  }
}

export interface TaskMetaPatch {
  priority?: Priority
  tags?: string[]
}

/** 우선순위·태그 — 본문과 무관한 메타 필드 PATCH */
export function useUpdateTaskMeta() {
  const cache = useTaskCache()
  const mutation = useUpdateTaskApiV1TasksTaskIdPatch({
    mutation: {
      onSuccess: (dto) => {
        cache.setDetail(dto)
        void cache.invalidateList()
      },
    },
  })
  return {
    ...mutation,
    updateMeta: async (task: Task, patch: TaskMetaPatch): Promise<Task> => {
      const dto = await mutation.mutateAsync({
        taskId: task.id,
        data: {
          ...(patch.priority !== undefined && { priority: patch.priority }),
          ...(patch.tags !== undefined && { tags: serializeTags(patch.tags) }),
        },
      })
      return toTask(dto)
    },
  }
}

export interface UpdateSectionInput {
  task: Task
  /** 섹션 인덱스 또는 `PREAMBLE_KEY` (첫 헤딩 앞 텍스트) */
  target: number | typeof PREAMBLE_KEY
  body: string
}

/** 섹션 단위 교체 후 문서 전체를 PATCH 한다 (백엔드에 섹션 API·버전 필드가 생기면 교체). */
export function useUpdateSection() {
  const cache = useTaskCache()
  const mutation = useUpdateTaskApiV1TasksTaskIdPatch({
    mutation: {
      onSuccess: (dto) => {
        cache.setDetail(dto)
        void cache.invalidateList()
      },
    },
  })
  return {
    ...mutation,
    updateSection: ({ task, target, body }: UpdateSectionInput) =>
      mutation.mutateAsync({
        taskId: task.id,
        data: {
          content:
            target === PREAMBLE_KEY
              ? replacePreamble(task.content, body)
              : replaceSection(task.content, target, body),
        },
      }),
  }
}
