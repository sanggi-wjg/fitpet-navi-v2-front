import { Circle, CircleCheck } from 'lucide-react'
import { Callout } from '@/components/common/Callout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { gateHeadline, gateItemLabels, type GateResult } from '@/lib/gate'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'

interface TodoMoveWarningDialogProps {
  task: Task | null
  gate: GateResult | null
  onCancel: () => void
  onProceed: () => void
  onReview: () => void
}

/**
 * 게이트 미통과 카드를 Todo 로 놓았을 때. 차단하지 않는다 (spec 범위 3).
 * X = 이동 취소(카드 원위치) · "돌아가서 확인" = 취소 + 상세 열기
 */
export function TodoMoveWarningDialog({
  task,
  gate,
  onCancel,
  onProceed,
  onReview,
}: TodoMoveWarningDialogProps) {
  const open = task !== null && gate !== null
  const labels = gate ? gateItemLabels(gate) : null
  const rows =
    gate && labels
      ? [
          { passed: gate.markersClear, label: labels.markers },
          { passed: gate.analysisDone, label: labels.analysis },
          { passed: gate.undecidedClear, label: labels.undecided },
        ]
      : []

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="gap-5 p-6 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-[22px] leading-[1.3] font-medium">Todo로 이동</DialogTitle>
          <DialogDescription className="sr-only">
            개발 준비 게이트를 통과하지 않은 태스크입니다
          </DialogDescription>
        </DialogHeader>
        {gate && (
          <Callout title={gateHeadline(gate)}>
            개발 준비 게이트를 통과하지 않은 태스크입니다. 개발자 역질문이 생길 수 있습니다.
          </Callout>
        )}
        <ul className="border-hairline flex flex-col overflow-hidden rounded-lg border">
          {rows.map((row) => (
            <li
              key={row.label}
              className={cn(
                'border-hairline-soft flex items-center gap-2.5 border-b px-3.5 py-2.5 text-[14px] font-medium last:border-b-0',
                row.passed ? 'text-success-deep' : 'text-body',
              )}
            >
              {row.passed ? (
                <CircleCheck className="size-[15px]" strokeWidth={2} />
              ) : (
                <Circle className="text-muted size-[15px]" strokeWidth={1.75} />
              )}
              {row.label}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" className="h-10 px-4 text-[14px]" onClick={onProceed}>
            그래도 이동
          </Button>
          <Button className="h-10 px-4 text-[14px] font-semibold" onClick={onReview}>
            돌아가서 확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
