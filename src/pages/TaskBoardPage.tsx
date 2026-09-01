import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { TodoMoveWarningDialog } from '@/components/board/TodoMoveWarningDialog'
import { Callout } from '@/components/common/Callout'
import { Topbar } from '@/components/layout/Topbar'
import { TaskCreateDialog } from '@/components/task/TaskCreateDialog'
import { Button } from '@/components/ui/button'
import { useMoveTask, useTasks, useTemplates } from '@/hooks/useTasks'
import { gateOf, type GateResult } from '@/lib/gate'
import { STATUS_LABEL } from '@/lib/task-config'
import { cn } from '@/lib/utils'
import type { BoardStatus, Task } from '@/types/task'

interface PendingMove {
  task: Task
  status: BoardStatus
  gate: GateResult
}

export function TaskBoardPage() {
  const navigate = useNavigate()
  const { tasks, isLoading, isError, refetch } = useTasks()
  const { isError: templatesError, refetch: refetchTemplates } = useTemplates()
  const { moveTask } = useMoveTask()

  const [search, setSearch] = useState('')
  const [readyOnly, setReadyOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return tasks.filter((task) => {
      if (keyword && !task.title.toLowerCase().includes(keyword)) return false
      if (readyOnly && !gateOf(task).passed) return false
      return true
    })
  }, [tasks, search, readyOnly])

  const readyCount = tasks.filter((task) => task.status !== 'done' && gateOf(task).passed).length

  const doMove = async (task: Task, status: BoardStatus) => {
    try {
      await moveTask(task.id, status)
      toast.success(`${STATUS_LABEL[status]}로 이동했습니다`)
    } catch {
      toast.error('이동하지 못했습니다', { description: '네트워크를 확인하고 다시 시도해 주세요.' })
    }
  }

  const handleMove = (task: Task, status: BoardStatus) => {
    const gate = gateOf(task)
    if (status === 'todo' && !gate.passed) {
      setPendingMove({ task, status, gate })
      return
    }
    void doMove(task, status)
  }

  return (
    <>
      <Topbar
        left={<span className="bg-surface-card text-ink rounded-md px-2.5 py-1.5">업무 보드</span>}
        right={
          <>
            <label className="border-hairline bg-surface-soft text-muted focus-within:border-primary flex h-9 w-60 items-center gap-2 rounded-md border px-3 text-[14px]">
              <Search className="size-4 shrink-0" strokeWidth={1.75} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="태스크 검색"
                className="text-ink placeholder:text-muted-soft min-w-0 flex-1 bg-transparent outline-none"
                aria-label="태스크 검색"
              />
            </label>
            <Button size="lg" className="pl-3 font-semibold" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" strokeWidth={2} />새 태스크
            </Button>
          </>
        }
      />

      <main className="flex flex-1 flex-col">
        <div className="flex items-end justify-between px-8 pt-7 pb-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] leading-[1.2] tracking-[-0.3px]">업무 보드</h1>
            <div className="text-muted text-[13px] font-medium">
              {tasks.length}개 태스크 · 개발 준비됨 {readyCount}
            </div>
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="필터">
            {[
              { key: false, label: '전체' },
              { key: true, label: '준비됨만' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setReadyOnly(chip.key)}
                className={cn(
                  'h-9 rounded-md px-3 text-[13px] font-medium transition-colors',
                  readyOnly === chip.key
                    ? 'bg-surface-card text-ink'
                    : 'text-muted hover:bg-surface-soft',
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-8">
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
            <div className="text-muted py-10 text-[13px]">불러오는 중…</div>
          ) : (
            <KanbanBoard
              tasks={visible}
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
          if (pendingMove) void doMove(pendingMove.task, pendingMove.status)
          setPendingMove(null)
        }}
        onReview={() => {
          if (pendingMove) void navigate(`/tasks/${pendingMove.task.id}`)
          setPendingMove(null)
        }}
      />
    </>
  )
}
