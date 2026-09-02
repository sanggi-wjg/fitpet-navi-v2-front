import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * 메타 행(우선순위·태그)의 인라인 편집 트리거 — 텍스트처럼 보이고 hover 시 배경 한 단계.
 * Base UI `render` 프롭에 넘겨 쓴다.
 */
export function MetaButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'text-muted hover:bg-surface-soft data-popup-open:bg-surface-soft focus-visible:ring-primary/40 -mx-1.5 inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none',
        className,
      )}
      {...props}
    />
  )
}
