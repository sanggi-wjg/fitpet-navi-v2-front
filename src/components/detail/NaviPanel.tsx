import {
  ArrowRight,
  ArrowUp,
  CircleAlert,
  CircleCheck,
  Square,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PanelMessage, Proposal } from '@/types/proposal'

const SUGGESTIONS = [
  '예외 조건에 빠진 엣지케이스를 추가해줘',
  '세부사항의 값을 항목 — 값 형태로 정리해줘',
  '문서 전체를 검토하고 가장 먼저 고칠 곳을 제안해줘',
]

const GREETING =
  '문서를 고치고 싶은 내용을 말해주세요. 저는 직접 수정하지 않고 변경안을 만들어 보여드려요. 수락하면 그때 문서에 반영돼요.'

interface NaviPanelProps {
  messages: PanelMessage[]
  proposalsById: Map<number, Proposal>
  /** 이 세션 대화에 없는 대기 제안 (이전 세션·리로드) — 인사말 아래에 요약 카드로 */
  priorPending: Proposal[]
  busy: boolean
  /** 읽기 전용 태스크 — 입력·칩 비활성 */
  disabled?: boolean
  onSend: (text: string) => void
  onAbort: () => void
  onShowProposal: (proposal: Proposal) => void
}

/** Navi 패널 — 대화 + 제안 요약 카드. diff·수락은 문서 쪽 (DESIGN.md D.2). */
export function NaviPanel({
  messages,
  proposalsById,
  priorPending,
  busy,
  disabled = false,
  onSend,
  onAbort,
  onShowProposal,
}: NaviPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, busy])

  return (
    <aside className="border-hairline bg-surface-soft sticky top-14 hidden h-[calc(100vh-56px)] w-[400px] shrink-0 flex-col border-l lg:flex">
      <div className="border-hairline flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <span className="bg-primary size-2 rounded-full" aria-hidden />
        <span className="text-ink text-[14px] font-medium">Navi</span>
        <span className="text-muted text-[12px]">요구사항 코칭</span>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <NaviBubble text={GREETING} />
        {priorPending.length > 0 && (
          <>
            <div className="text-muted px-1 text-[12px]">
              이전에 받은 제안이 문서에 남아 있습니다
            </div>
            {priorPending.map((proposal) => (
              <ProposalSummaryCard
                key={proposal.id}
                proposal={proposal}
                onShow={() => onShowProposal(proposal)}
              />
            ))}
          </>
        )}
        {messages.map((message, index) => (
          <PanelRow
            key={index}
            message={message}
            proposalsById={proposalsById}
            onShowProposal={onShowProposal}
            onRetry={(text) => onSend(text)}
          />
        ))}
        {busy && (
          <div className="flex items-center gap-2.5 px-1" role="status">
            <span className="inline-flex gap-[5px]" aria-hidden>
              <span className="bg-accent-teal size-2 rounded-full" />
              <span className="bg-accent-teal size-2 rounded-full opacity-60" />
              <span className="bg-accent-teal size-2 rounded-full opacity-30" />
            </span>
            <span className="text-muted text-[13px]">Navi가 제안을 만들고 있습니다…</span>
          </div>
        )}
      </div>

      <PanelInput busy={busy} disabled={disabled} onSend={onSend} onAbort={onAbort} />
    </aside>
  )
}

function NaviBubble({ text }: { text: string }) {
  return (
    <div className="bg-canvas text-body max-w-[330px] rounded-lg px-3.5 py-2.5 text-[14px] leading-[1.6] whitespace-pre-wrap">
      {text}
    </div>
  )
}

function PanelRow({
  message,
  proposalsById,
  onShowProposal,
  onRetry,
}: {
  message: PanelMessage
  proposalsById: Map<number, Proposal>
  onShowProposal: (proposal: Proposal) => void
  onRetry: (text: string) => void
}) {
  switch (message.kind) {
    case 'navi':
      return <NaviBubble text={message.text} />
    case 'user':
      return (
        <div className="bg-surface-card text-ink ml-auto max-w-[300px] rounded-lg px-3.5 py-2.5 text-[14px] leading-[1.55] whitespace-pre-wrap">
          {message.text}
        </div>
      )
    case 'info':
      return <div className="text-muted px-1 text-[12px]">{message.text}</div>
    case 'proposal': {
      const proposal = proposalsById.get(message.proposalId)
      if (!proposal) return null
      return <ProposalSummaryCard proposal={proposal} onShow={() => onShowProposal(proposal)} />
    }
    case 'error':
      return (
        <div className="bg-error-wash text-error-deep flex items-start gap-2.5 rounded-lg px-3.5 py-3">
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[13px] leading-[1.45] font-medium">제안을 만들지 못했습니다</span>
            <span className="text-[13px] leading-[1.45]">{message.text}</span>
            {message.retryText && (
              <Button
                variant="ghost"
                size="sm"
                className="text-error-deep hover:text-error-deep -ml-2 self-start text-[13px]"
                onClick={() => onRetry(message.retryText!)}
              >
                다시 시도
              </Button>
            )}
          </div>
        </div>
      )
  }
}

/** 요약 카드 — 대기 중은 사유 + "문서에서 보기", 처리된 제안은 한 줄 + 상태 pill */
function ProposalSummaryCard({ proposal, onShow }: { proposal: Proposal; onShow: () => void }) {
  const pending = proposal.status === 'pending' && !proposal.stale
  return (
    <div className="border-hairline bg-canvas flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn('size-2 shrink-0 rounded-full', pending ? 'bg-primary' : 'bg-muted-soft')}
          aria-hidden
        />
        <span
          className={cn('text-[13px] font-medium', pending ? 'text-primary-text' : 'text-muted')}
        >
          Navi 제안
        </span>
        <span className="text-muted min-w-0 truncate font-mono text-[12px]">
          {proposal.sectionName}
        </span>
        {!pending && <StatusBadge proposal={proposal} />}
      </div>
      {pending && proposal.reason && (
        <p className="text-body line-clamp-3 text-[13px] leading-[1.5]">{proposal.reason}</p>
      )}
      {proposal.status === 'pending' && (
        <button
          type="button"
          onClick={onShow}
          className="text-primary-text inline-flex items-center gap-1 self-start text-[13px] font-medium hover:underline"
        >
          문서에서 보기
          <ArrowRight className="size-[13px]" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

function StatusBadge({ proposal }: { proposal: Proposal }) {
  const base =
    'bg-surface-card ml-auto inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full pr-2 pl-1.5 text-[12px] font-medium'
  switch (proposal.status) {
    case 'accepted':
      // 수락은 제안 시점 version 에서 정확히 +1 로 저장된다
      return (
        <span className={cn(base, 'text-ink')}>
          <CircleCheck className="text-success-deep size-3" strokeWidth={2} />
          적용됨 · v{proposal.sectionVersion + 1}
        </span>
      )
    case 'rejected':
      return (
        <span className={cn(base, 'text-muted')}>
          <X className="size-3" strokeWidth={2} />
          거부됨
        </span>
      )
    case 'closed':
      return (
        <span className={cn(base, 'text-muted')}>
          <X className="size-3" strokeWidth={2} />
          닫힘
        </span>
      )
    case 'pending':
      return (
        <span className={cn(base, 'text-warning-deep')}>
          <TriangleAlert className="size-3" strokeWidth={2} />
          만료됨
        </span>
      )
  }
}

function PanelInput({
  busy,
  disabled,
  onSend,
  onAbort,
}: {
  busy: boolean
  disabled: boolean
  onSend: (text: string) => void
  onAbort: () => void
}) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    const text = draft.trim()
    if (!text || busy || disabled) return
    setDraft('')
    onSend(text)
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 px-4 pt-2 pb-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="추천 요청">
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onSend(text)}
            disabled={busy || disabled}
            className="border-hairline bg-canvas text-body hover:bg-surface-card inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-60"
          >
            {text}
          </button>
        ))}
      </div>
      <div
        className={cn(
          'border-hairline bg-canvas flex items-end gap-2 rounded-lg border py-2 pr-2 pl-3.5',
          busy && 'opacity-85',
        )}
      >
        {busy ? (
          <>
            <span className="text-muted-soft flex-1 py-1.5 text-[14px] leading-[1.45]">
              응답이 끝나면 다시 요청할 수 있습니다
            </span>
            <button
              type="button"
              onClick={onAbort}
              aria-label="요청 중단"
              className="bg-surface-card text-primary-text hover:bg-surface-cream-strong inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors"
            >
              <Square className="size-3" strokeWidth={2} fill="currentColor" />
            </button>
          </>
        ) : (
          <>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  submit()
                }
              }}
              placeholder={disabled ? '읽기 전용 태스크입니다' : '문서에서 고치고 싶은 내용…'}
              aria-label="Navi에게 요청"
              rows={1}
              disabled={disabled}
              className="text-ink placeholder:text-muted-soft field-sizing-content max-h-32 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-[1.45] outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={submit}
              disabled={disabled || draft.trim().length === 0}
              aria-label="전송"
              className={cn(
                'inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors',
                // 코랄 채움은 화면당 1개 — 전송은 텍스트 색만 바뀐다 (DESIGN.md `chat-input`)
                draft.trim().length > 0 && !disabled
                  ? 'bg-surface-card text-primary-text hover:bg-surface-cream-strong'
                  : 'bg-surface-card text-muted-soft',
              )}
            >
              <ArrowUp className="size-3.5" strokeWidth={2} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
