import { cn } from '@/lib/utils'

/** 진행 중 표시 — teal 점 3개(투명도 1/.6/.3). 문구는 옆에 따로 둔다 (DESIGN.md D.2 `navi-streaming`) */
export function BusyDots({ size = 'md', className }: { size?: 'md' | 'sm'; className?: string }) {
  const dot = size === 'md' ? 'size-2' : 'size-1.5'
  return (
    <span
      className={cn('inline-flex shrink-0', size === 'md' ? 'gap-[5px]' : 'gap-1', className)}
      aria-hidden
    >
      <span className={cn('bg-accent-teal rounded-full', dot)} />
      <span className={cn('bg-accent-teal rounded-full opacity-60', dot)} />
      <span className={cn('bg-accent-teal rounded-full opacity-30', dot)} />
    </span>
  )
}
