import { AlertTriangle, CircleAlert, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  warning: { box: 'bg-warning-wash text-warning-deep', Icon: AlertTriangle },
  error: { box: 'bg-error-wash text-error-deep', Icon: CircleAlert },
  info: { box: 'bg-surface-soft text-body', Icon: Info },
} as const

interface CalloutProps {
  variant?: keyof typeof VARIANTS
  title: ReactNode
  children?: ReactNode
  className?: string
}

/** 워시 배경 + 아이콘. 좌측 컬러 보더 없음 (DESIGN.md D.0 `callout`) */
export function Callout({ variant = 'warning', title, children, className }: CalloutProps) {
  const { box, Icon } = VARIANTS[variant]
  return (
    <div className={cn('flex items-start gap-2.5 rounded-md px-3.5 py-3', box, className)}>
      <Icon className="mt-px size-[18px] shrink-0" strokeWidth={1.75} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="text-[14px] leading-[1.45] font-medium">{title}</div>
        {children && <div className="text-[13px] leading-[1.45]">{children}</div>}
      </div>
    </div>
  )
}
