import { Square } from 'lucide-react'
import { memo } from 'react'
import { AskMeta } from '@/components/ask/AskMeta'
import { AskProcess } from '@/components/ask/AskProcess'
import { BusyDots } from '@/components/common/BusyDots'
import { Callout } from '@/components/common/Callout'
import { MarkdownDoc } from '@/components/common/MarkdownDoc'
import { Button } from '@/components/ui/button'
import type { AskTurn } from '@/types/ask'

interface AskTurnViewProps {
  turn: AskTurn
  /** 세션 진행 중이면 재시도 버튼을 잠근다 */
  busy: boolean
  onRetry: (turnId: number) => void
}

/**
 * 한 턴 — 사용자 질문 · Navi 헤더 · 과정 블록 · 답변 · 메타 줄 · 중단/오류 표시 (DESIGN.md D.4).
 * 끝난 턴은 참조가 바뀌지 않으므로 memo 로 델타마다 다시 그리지 않는다.
 */
export const AskTurnView = memo(function AskTurnView({ turn, busy, onRetry }: AskTurnViewProps) {
  const { status } = turn
  const active = status.kind === 'connecting' || status.kind === 'streaming'

  return (
    <article aria-busy={active} className="flex flex-col gap-3.5">
      <div className="flex justify-end">
        <div className="bg-surface-card text-ink max-w-[560px] rounded-lg px-3.5 py-2.5 text-[14px] leading-[1.55] whitespace-pre-wrap">
          {turn.question}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="bg-primary size-2 rounded-full" aria-hidden />
        <span className="text-primary-text text-[13px] font-medium">Navi</span>
        {status.kind === 'aborted' && (
          <span className="bg-surface-card text-muted inline-flex h-[22px] items-center gap-1 rounded-full pr-2 pl-1.5 text-[12px] font-medium">
            <Square className="size-2.5" strokeWidth={2} fill="currentColor" aria-hidden />
            중단됨
          </span>
        )}
      </div>

      {status.kind === 'connecting' && (
        <div role="status" className="flex items-center gap-2.5">
          <BusyDots />
          <span className="text-muted text-[13px]">코드베이스에 연결하는 중…</span>
        </div>
      )}

      {turn.steps.length > 0 && (
        <AskProcess
          steps={turn.steps}
          status={status}
          startedAt={turn.startedAt}
          elapsedMs={turn.meta?.elapsedMs ?? null}
        />
      )}

      {turn.answer !== '' && (
        <MarkdownDoc variant="chat" markdown={turn.answer} className="min-w-0 px-0.5" />
      )}

      {status.kind === 'aborted' && (
        <p className="text-muted px-0.5 text-[12px]">여기까지 받은 답변만 표시합니다</p>
      )}

      {turn.meta && <AskMeta meta={turn.meta} />}

      {status.kind === 'error' && (
        <Callout variant="error" title="답변을 받지 못했습니다">
          <div className="flex flex-col gap-1.5">
            <span>{status.message}</span>
            {status.retryable && (
              <Button
                variant="ghost"
                size="sm"
                className="text-error-deep hover:text-error-deep -ml-2 self-start text-[13px]"
                disabled={busy}
                onClick={() => onRetry(turn.id)}
              >
                다시 시도
              </Button>
            )}
          </div>
        </Callout>
      )}
    </article>
  )
})
