import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/** "개발 준비됨" — 유일한 채움 pill. 게이트 3항목을 모두 통과했을 때만. */
export function ReadyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'bg-success-wash text-success-deep inline-flex h-[22px] items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[12px] leading-none font-medium',
        className,
      )}
    >
      <CircleCheck className="size-3.5" strokeWidth={2} />
      개발 준비됨
    </span>
  )
}
