import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { gateItemLabels, gateShortLabel, type GateResult } from '@/lib/gate'
import { cn } from '@/lib/utils'

/** 카드의 게이트 점 3개 — 순서는 게이트 스트립과 같다 (마커 · 분석 · 미결정). 옆 텍스트는 첫 실패 항목. */
export function GateDots({ gate }: { gate: GateResult }) {
  const labels = gateItemLabels(gate)
  const dots = [gate.markersClear, gate.analysisDone, gate.undecidedClear]
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex h-[22px] items-center gap-2" />}>
        <span className="inline-flex gap-1" aria-hidden>
          {dots.map((passed, index) => (
            <span
              key={index}
              className={cn('size-1.5 rounded-full', passed ? 'bg-success-deep' : 'bg-hairline')}
            />
          ))}
        </span>
        <span className="text-muted text-[12px] leading-none font-medium">
          {gateShortLabel(gate)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {labels.markers} · {labels.analysis} · {labels.undecided}
      </TooltipContent>
    </Tooltip>
  )
}
