import { MessageSquarePlus } from 'lucide-react'
import { useRef } from 'react'
import { AskEmptyState } from '@/components/ask/AskEmptyState'
import { AskInput } from '@/components/ask/AskInput'
import { AskTurnView } from '@/components/ask/AskTurnView'
import { Topbar } from '@/components/layout/Topbar'
import { TopbarTabs } from '@/components/layout/TopbarTabs'
import { Button } from '@/components/ui/button'
import { useAskSession } from '@/hooks/useAskSession'
import { useStickToBottom } from '@/hooks/useStickToBottom'
import type { AskTurn } from '@/types/ask'

/** 자동 스크롤 신호 — 행 수만이 아니라 thinking 이어붙임 · summary 도착 · 답변 델타까지 잡는다 */
function contentSize(turn: AskTurn): number {
  return turn.steps.reduce((total, step) => {
    if (step.kind === 'thinking' || step.kind === 'note') return total + step.text.length
    if (step.kind === 'tool')
      return total + (step.summary?.length ?? 0) + (step.status === 'running' ? 0 : 1)
    return total
  }, turn.answer.length)
}

/**
 * 구현 확인 — 코드 구현을 채팅으로 묻는 독립 탭 (DESIGN.md D.4, docs/ask-stream-contract.md).
 * 창 스크롤 + 하단 sticky 입력. 대화는 세션 로컬이라 "새 대화"는 확인 없이 비운다.
 */
export function AskPage() {
  const { turns, busy, send, abort, reset, retry } = useAskSession()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const last = turns.at(-1)
  const scrollToBottom = useStickToBottom(
    last ? `${turns.length}:${last.steps.length}:${contentSize(last)}:${last.status.kind}` : '',
  )

  const handleSend = (text: string) => {
    scrollToBottom()
    void send(text)
  }
  const handleReset = () => {
    reset()
    inputRef.current?.focus()
  }

  return (
    <>
      <Topbar
        left={<TopbarTabs />}
        right={
          <Button variant="outline" size="lg" disabled={turns.length === 0} onClick={handleReset}>
            <MessageSquarePlus className="size-4" strokeWidth={1.75} />새 대화
          </Button>
        }
      />

      <main className="flex min-w-0 flex-1 flex-col items-center px-6">
        <div className="flex w-full max-w-[760px] flex-1 flex-col">
          {turns.length === 0 ? (
            <AskEmptyState onPick={handleSend} disabled={busy} />
          ) : (
            <div role="log" aria-label="대화" className="flex flex-col gap-7 pt-6">
              {turns.map((turn) => (
                <AskTurnView key={turn.id} turn={turn} busy={busy} onRetry={retry} />
              ))}
            </div>
          )}
          <div className="bg-canvas sticky bottom-0 mt-auto pt-6 pb-8">
            <AskInput ref={inputRef} busy={busy} onSend={handleSend} onAbort={abort} />
          </div>
        </div>
      </main>
    </>
  )
}
