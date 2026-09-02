import { Skeleton } from '@/components/ui/skeleton'

/** 상세 로딩 — 헤더(pill·제목·메타·게이트) + 섹션 3개 뼈대 */
export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy aria-label="불러오는 중">
      <div className="flex flex-col gap-3.5">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-[46px] w-full rounded-lg" />
      </div>
      <div className="flex flex-col gap-6">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
