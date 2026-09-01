import { Circle, CircleCheck } from 'lucide-react'
import { ReadyBadge } from '@/components/common/ReadyBadge'
import { gateItemLabels, type GateResult } from '@/lib/gate'
import { cn } from '@/lib/utils'

function Item({ passed, label }: { passed: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] font-medium',
        passed ? 'text-success-deep' : 'text-muted',
      )}
    >
      {passed ? (
        <CircleCheck className="size-[15px]" strokeWidth={2} />
      ) : (
        <Circle className="size-[15px]" strokeWidth={1.75} />
      )}
      {label}
    </span>
  )
}

/** 개발 준비 게이트 3항목 — 분수 표기 없이 실패 사유 문구로 (DESIGN.md D.2) */
export function GateStrip({ gate }: { gate: GateResult }) {
  const labels = gateItemLabels(gate)
  return (
    <div className="border-hairline bg-canvas flex flex-wrap items-center gap-x-[18px] gap-y-2 rounded-lg border px-3.5 py-3">
      <span className="kicker">개발 준비 게이트</span>
      <Item passed={gate.markersClear} label={labels.markers} />
      <Item passed={gate.analysisDone} label={labels.analysis} />
      <Item passed={gate.undecidedClear} label={labels.undecided} />
      {gate.passed && <ReadyBadge className="ml-auto" />}
    </div>
  )
}
