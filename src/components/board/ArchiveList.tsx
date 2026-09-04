import { TaskCard } from '@/components/board/TaskCard'
import type { TaskCardActions } from '@/components/board/TaskCardMenu'
import type { Task } from '@/types/task'

interface ArchiveListProps {
  /** 최근 아카이브 먼저 (useTasks.archivedTasks) */
  tasks: Task[]
  actions: TaskCardActions
}

/**
 * 보드의 '아카이브' 뷰 — 컬럼 대신 평면 카드 목록. 취소 상태는 컬럼이 없고 카드는 읽기 전용이라
 * 드래그·이동이 없다. 카드는 컬럼과 같은 `surface-soft` 바탕 위에 놓는다 (DESIGN.md figure/ground).
 */
export function ArchiveList({ tasks, actions }: ArchiveListProps) {
  return (
    <section aria-label="아카이브" className="bg-surface-soft rounded-lg p-3">
      {tasks.length === 0 ? (
        <div className="border-checkbox-border text-muted rounded-lg border border-dashed px-3 py-5 text-center text-[13px]">
          아카이브된 태스크가 없습니다
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(276px,1fr))] gap-3">
          {tasks.map((task) => (
            <ArchivedTaskCard key={task.id} task={task} actions={actions} />
          ))}
        </div>
      )}
    </section>
  )
}

/** 클릭/Enter 는 상세 — `SortableTaskCard` 와 같은 접근성, 드래그 없음. 카드 안 kebab 은 자체 전파 차단. */
function ArchivedTaskCard({ task, actions }: { task: Task; actions: TaskCardActions }) {
  const open = () => actions.onOpen(task)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        // 드래그가 없으므로 ARIA button 대로 Space 도 연다 (SortableTaskCard 는 Space 를 드래그에 양보)
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          open()
        }
      }}
      className="focus-visible:ring-primary/40 cursor-pointer rounded-lg outline-none focus-visible:ring-2"
    >
      <TaskCard task={task} actions={actions} />
    </div>
  )
}
