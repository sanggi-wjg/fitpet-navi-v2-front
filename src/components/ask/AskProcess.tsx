import { AskStepRow } from '@/components/ask/AskStepRow'
import { BusyDots } from '@/components/common/BusyDots'
import { useElapsed } from '@/hooks/useElapsed'
import { formatElapsed } from '@/lib/format'
import type { AskStep, AskTurnStatus } from '@/types/ask'

interface AskProcessProps {
  steps: AskStep[]
  status: AskTurnStatus
  startedAt: number
  /** done 이면 서버가 준 소요 시간, 아니면 진행 중 경과를 초 단위로 센다 */
  elapsedMs: number | null
}

/** 과정 블록 — 항상 펼침 (DESIGN.md D.4 `ask-process`) */
export function AskProcess({ steps, status, startedAt, elapsedMs }: AskProcessProps) {
  const running = status.kind === 'streaming'
  const seconds = useElapsed(startedAt, running)
  const header = running
    ? `탐색 중 · ${steps.length}단계`
    : status.kind === 'aborted'
      ? `탐색 과정 · ${steps.length}단계 · 중단`
      : `탐색 과정 · ${steps.length}단계`

  return (
    <div className="bg-surface-soft flex flex-col gap-3 rounded-lg px-3.5 py-3">
      <div className="flex items-center gap-2" role="status">
        {running && <BusyDots />}
        <span className="kicker">{header}</span>
        <span className="text-muted ml-auto font-mono text-[12px]">
          {elapsedMs !== null ? formatElapsed(elapsedMs) : `${seconds}초`}
        </span>
      </div>
      <ol aria-label="탐색 과정" className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <AskStepRow key={index} step={step} turnStatus={status} />
        ))}
      </ol>
    </div>
  )
}
