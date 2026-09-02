import { cn } from '@/lib/utils'

/** 로딩 자리표시 — 표면 한 단계(surface-card) + pulse. 텍스트 대신 레이아웃 뼈대만 보인다. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn('bg-surface-card animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

export { Skeleton }
