import { Plus, Search } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArchiveList } from '@/components/board/ArchiveList'
import { BoardSkeleton } from '@/components/board/BoardSkeleton'
import { CancelTaskDialog } from '@/components/board/CancelTaskDialog'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import type { TaskCardActions } from '@/components/board/TaskCardMenu'
import { TodoMoveWarningDialog } from '@/components/board/TodoMoveWarningDialog'
import { Callout } from '@/components/common/Callout'
import { Topbar } from '@/components/layout/Topbar'
import { TaskCreateDialog } from '@/components/task/TaskCreateDialog'
import { Button } from '@/components/ui/button'
import {
  useArchiveTask,
  useMoveTask,
  useSetTaskStatus,
  useTasks,
  useTemplates,
  useUpdateTaskMeta,
} from '@/hooks/useTasks'
import { errorDescription } from '@/lib/api-error'
import { mergeVisibleOrder } from '@/lib/board-order'
import { gateOf, type GateResult } from '@/lib/gate'
import { STATUS_LABEL } from '@/lib/task-config'
import { cn } from '@/lib/utils'
import type { BoardStatus, Task } from '@/types/task'

/** 전체·준비됨만은 보드 필터, 아카이브는 별도 뷰 */
type BoardView = 'all' | 'ready' | 'archived'

const VIEW_CHIPS: Array<{ key: BoardView; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'ready', label: '준비됨만' },
  { key: 'archived', label: '아카이브' },
]

const matchesKeyword = (task: Task, keyword: string) =>
  !keyword ||
  task.title.toLowerCase().includes(keyword) ||
  task.tags.some((tag) => tag.toLowerCase().includes(keyword))

interface PendingMove {
  task: Task
  status: BoardStatus
  /** 놓인 컬럼의 표시 순서 (이동한 카드 포함) */
  visibleIds: number[]
  gate: GateResult
}

export function TaskBoardPage() {
  const navigate = useNavigate()
  const { tasks, archivedTasks, isLoading, isError, refetch } = useTasks()
  const { isError: templatesError, refetch: refetchTemplates } = useTemplates()
  const { moveTask } = useMoveTask()
  const { setTaskStatus, isPending: statusPending } = useSetTaskStatus()
  const { updateMeta } = useUpdateTaskMeta()
  const { archive, unarchive } = useArchiveTask()

  const [search, setSearch] = useState('')
  const [view, setView] = useState<BoardView>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [pendingCancel, setPendingCancel] = useState<Task | null>(null)

  const keyword = search.trim().toLowerCase()
  const visible = useMemo(
    () =>
      tasks.filter(
        (task) => matchesKeyword(task, keyword) && (view !== 'ready' || gateOf(task).passed),
      ),
    [tasks, keyword, view],
  )
  const visibleArchived = useMemo(
    () => archivedTasks.filter((task) => matchesKeyword(task, keyword)),
    [archivedTasks, keyword],
  )

  const readyCount = tasks.filter((task) => task.status !== 'done' && gateOf(task).passed).length

  /** 숨은 카드(검색·필터)를 포함한 컬럼 전체 순서 — 서버에는 이 순서를 보낸다 */
  const fullOrder = (status: BoardStatus, visibleIds: number[]) =>
    mergeVisibleOrder(
      tasks.filter((task) => task.status === status).map((task) => task.id),
      visibleIds,
    )

  const doMove = async (task: Task, status: BoardStatus, visibleIds: number[]) => {
    try {
      await moveTask({ task, status, orderedIds: fullOrder(status, visibleIds) })
      if (status !== task.status) toast.success(`${STATUS_LABEL[status]}로 이동했습니다`)
    } catch (error) {
      toast.error('이동하지 못했습니다', { description: errorDescription(error) })
    }
  }

  /** 게이트 미통과 카드의 Todo 이동은 경고 후 진행. 반환값 false = 카드 원위치 */
  const handleMove = (task: Task, status: BoardStatus, visibleIds: number[]): boolean => {
    const gate = gateOf(task)
    if (status === 'todo' && task.status !== 'todo' && !gate.passed) {
      setPendingMove({ task, status, visibleIds, gate })
      return false
    }
    void doMove(task, status, visibleIds)
    return true
  }

  const cancelTask = async (task: Task) => {
    try {
      // 취소로 version 이 올라가므로 되돌리기는 응답의 version 으로 보낸다
      const canceled = await setTaskStatus(task, 'canceled')
      setPendingCancel(null)
      toast.success('태스크를 취소했습니다', {
        action: {
          label: '되돌리기',
          onClick: () => {
            setTaskStatus(canceled, task.status).catch((error: unknown) =>
              toast.error('되돌리지 못했습니다', { description: errorDescription(error) }),
            )
          },
        },
      })
    } catch (error) {
      toast.error('취소하지 못했습니다', { description: errorDescription(error) })
    }
  }

  /** 확인 없이 실행 — 토스트의 되돌리기가 복구 경로 */
  const archiveTask = async (task: Task) => {
    try {
      await archive(task)
      toast.success('아카이브했습니다', {
        description: "보드의 '아카이브' 뷰에서 볼 수 있습니다.",
        action: {
          label: '되돌리기',
          onClick: () => {
            unarchive(task).catch((error: unknown) =>
              toast.error('되돌리지 못했습니다', { description: errorDescription(error) }),
            )
          },
        },
      })
    } catch (error) {
      toast.error('아카이브하지 못했습니다', { description: errorDescription(error) })
    }
  }

  const unarchiveTask = async (task: Task) => {
    try {
      await unarchive(task)
      toast.success('아카이브를 해제했습니다', {
        description:
          task.status === 'canceled' ? '취소 상태라 보드에는 표시되지 않습니다.' : undefined,
        action: {
          label: '되돌리기',
          onClick: () => {
            archive(task).catch((error: unknown) =>
              toast.error('되돌리지 못했습니다', { description: errorDescription(error) }),
            )
          },
        },
      })
    } catch (error) {
      toast.error('해제하지 못했습니다', { description: errorDescription(error) })
    }
  }

  const actions: TaskCardActions = {
    onOpen: (task) => void navigate(`/tasks/${task.id}`),
    onMove: (task, status) =>
      handleMove(task, status, [
        ...visible.filter((item) => item.status === status).map((item) => item.id),
        task.id,
      ]),
    onChangePriority: (task, priority) => {
      updateMeta(task, { priority }).catch((error: unknown) =>
        toast.error('우선순위를 바꾸지 못했습니다', { description: errorDescription(error) }),
      )
    },
    onCancel: setPendingCancel,
    onArchive: (task) => void archiveTask(task),
    onUnarchive: (task) => void unarchiveTask(task),
  }

  return (
    <>
      <Topbar
        left={<span className="bg-surface-card text-ink rounded-md px-2.5 py-1.5">업무 보드</span>}
        right={
          <>
            <label className="border-hairline bg-surface-soft text-muted focus-within:border-primary flex h-9 w-44 items-center gap-2 rounded-md border px-3 text-[14px] xl:w-60">
              <Search className="size-4 shrink-0" strokeWidth={1.75} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="제목·태그 검색"
                className="text-ink placeholder:text-muted-soft min-w-0 flex-1 bg-transparent outline-none"
                aria-label="제목·태그 검색"
              />
            </label>
            <Button size="lg" className="pl-3 font-semibold" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" strokeWidth={2} />새 태스크
            </Button>
          </>
        }
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-end justify-between px-8 pt-7 pb-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] leading-[1.2] tracking-[-0.3px]">업무 보드</h1>
            <div className="text-muted text-[13px] font-medium">
              {view === 'archived'
                ? `아카이브 ${archivedTasks.length}개`
                : `${tasks.length}개 태스크 · 개발 준비됨 ${readyCount}`}
            </div>
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="필터">
            {VIEW_CHIPS.map((chip) => (
              <Fragment key={chip.key}>
                {chip.key === 'archived' && (
                  <span className="border-hairline mx-1 h-5 border-l" aria-hidden />
                )}
                <button
                  type="button"
                  aria-pressed={view === chip.key}
                  onClick={() => setView(chip.key)}
                  className={cn(
                    'h-9 rounded-md px-3 text-[13px] font-medium transition-colors',
                    view === chip.key
                      ? 'bg-surface-card text-ink'
                      : 'text-muted hover:bg-surface-soft',
                  )}
                >
                  {chip.label}
                </button>
              </Fragment>
            ))}
          </div>
        </div>

        <div className="min-w-0 px-8">
          {templatesError && (
            <Callout
              variant="warning"
              title="템플릿을 불러오지 못해 태스크 유형을 표시할 수 없습니다"
              className="mb-4"
            >
              <div className="mt-1.5">
                <Button size="sm" variant="outline" onClick={() => void refetchTemplates()}>
                  다시 시도
                </Button>
              </div>
            </Callout>
          )}
          {isError ? (
            <Callout variant="error" title="태스크를 불러오지 못했습니다">
              <div className="mt-1.5">
                <Button size="sm" variant="outline" onClick={() => void refetch()}>
                  다시 시도
                </Button>
              </div>
            </Callout>
          ) : isLoading ? (
            <BoardSkeleton />
          ) : view === 'archived' ? (
            <ArchiveList tasks={visibleArchived} actions={actions} />
          ) : (
            <KanbanBoard
              tasks={visible}
              actions={actions}
              onMove={handleMove}
              onAddToBacklog={() => setCreateOpen(true)}
            />
          )}
        </div>
      </main>

      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(task) => void navigate(`/tasks/${task.id}`)}
      />
      <TodoMoveWarningDialog
        task={pendingMove?.task ?? null}
        gate={pendingMove?.gate ?? null}
        onCancel={() => setPendingMove(null)}
        onProceed={() => {
          if (pendingMove) void doMove(pendingMove.task, pendingMove.status, pendingMove.visibleIds)
          setPendingMove(null)
        }}
        onReview={() => {
          if (pendingMove) void navigate(`/tasks/${pendingMove.task.id}`)
          setPendingMove(null)
        }}
      />
      <CancelTaskDialog
        task={pendingCancel}
        pending={statusPending}
        onClose={() => setPendingCancel(null)}
        onConfirm={(task) => void cancelTask(task)}
      />
    </>
  )
}
