import { Skeleton } from '@/components/ui/skeleton'
import { COLUMNS } from '@/lib/task-config'

const CARD_ROWS = [3, 2, 1, 2] as const

/** 보드 로딩 — 컬럼 4개 뼈대. 카드 수는 컬럼마다 다르게 두어 실제 보드처럼 보인다. */
export function BoardSkeleton() {
  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-8" aria-busy aria-label="불러오는 중">
      {COLUMNS.map((column, columnIndex) => (
        <div
          key={column.key}
          className="bg-surface-soft flex w-[300px] shrink-0 flex-col gap-2 rounded-lg p-3"
        >
          <div className="flex items-center justify-between px-1 pt-0.5 pb-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-4" />
          </div>
          {Array.from({ length: CARD_ROWS[columnIndex] ?? 1 }, (_, index) => (
            <div
              key={index}
              className="border-hairline bg-canvas flex flex-col gap-3 rounded-lg border p-3"
            >
              <div className="flex items-start gap-2">
                <Skeleton className="size-[22px] rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <Skeleton className="h-3 w-24" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
