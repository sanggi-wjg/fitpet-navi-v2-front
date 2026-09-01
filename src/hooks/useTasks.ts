import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  getGetTaskApiV1TasksTaskIdGetQueryKey,
  getGetTasksApiV1TasksGetQueryKey,
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
  createTypeInferrer,
  isBoardTask,
  toTask,
  toTemplateMap,
  type TemplateMap,
} from '@/lib/api-mapping'
import { PREAMBLE_KEY, replacePreamble, replaceSection } from '@/lib/markdown'
import type { BoardStatus, Task, TaskType } from '@/types/task'

/** 유형별 템플릿 (백엔드 md 4종). 자주 바뀌지 않으므로 길게 캐시한다. */
export function useTemplates() {
  const query = useGetTemplatesApiV1TasksTemplatesGet({
    query: { staleTime: 10 * 60_000 },
  })
  const templates = useMemo<TemplateMap>(() => toTemplateMap(query.data), [query.data])
  const inferType = useMemo(() => createTypeInferrer(templates), [templates])
  return { ...query, templates, inferType }
}

export function useTasks() {
  const { inferType } = useTemplates()
  const query = useGetTasksApiV1TasksGet()
  const tasks = useMemo<Task[]>(
    () =>
      (query.data ?? [])
        .filter(isBoardTask)
        .map((dto) => toTask(dto, inferType))
        .sort((a, b) => a.displayOrder - b.displayOrder || b.id - a.id),
    [query.data, inferType],
  )
  return { ...query, tasks }
}

export function useTask(taskId: number | undefined) {
  const { inferType } = useTemplates()
  const query = useGetTaskApiV1TasksTaskIdGet(taskId ?? 0, {
    query: { enabled: taskId !== undefined },
  })
  const task = useMemo<Task | undefined>(
    () => (query.data ? toTask(query.data, inferType) : undefined),
    [query.data, inferType],
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
    patchList: (taskId: number, patch: Partial<TaskResponseDto>) => {
      const previous = queryClient.getQueryData<TaskResponseDto[]>(listKey)
      queryClient.setQueryData<TaskResponseDto[]>(listKey, (old) =>
        old?.map((dto) => (dto.id === taskId ? { ...dto, ...patch } : dto)),
      )
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
  const { inferType } = useTemplates()
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
      return toTask(dto, inferType)
    },
  }
}

/** 보드 이동 — 목록 캐시를 먼저 바꾸고(낙관적), 실패하면 되돌린다 */
export function useMoveTask() {
  const cache = useTaskCache()
  const mutation = useUpdateTaskApiV1TasksTaskIdPatch({
    mutation: {
      onMutate: async ({ taskId, data }) => {
        await cache.cancelList()
        return { previous: cache.patchList(taskId, { status: data.status ?? undefined }) }
      },
      onError: (_error, _variables, context) => cache.restoreList(context?.previous),
      onSuccess: (dto) => cache.setDetail(dto),
      onSettled: () => void cache.invalidateList(),
    },
  })
  return {
    ...mutation,
    moveTask: (taskId: number, status: BoardStatus) =>
      mutation.mutateAsync({ taskId, data: { status: STATUS_TO_API[status] } }),
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
