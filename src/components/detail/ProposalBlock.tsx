import { AlertTriangle, CircleCheck, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DiffView } from '@/components/detail/DiffView'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { lineDiff } from '@/lib/diff'
import { isProposalStale } from '@/lib/proposal-mapping'
import { cn } from '@/lib/utils'
import type { Proposal } from '@/types/proposal'
import type { TaskSection } from '@/types/task'

interface ProposalBlockProps {
  proposal: Proposal
  /** 현재 섹션 — diff 기준 본문과 만료 판정용 version */
  section: Pick<TaskSection, 'body' | 'version'>
  accepting: boolean
  /** 거부 직후 — 사유를 반영한 재제안 생성 중 */
  regenerating: boolean
  /** accept 409 이후 서버 만료 문구 */
  staleMessage: string | null
  onAccept: () => void
  onReject: (reason: string) => void
  onRequestAgain: () => void
  /** 만료 블록 닫기 — 수락·거부 없이 종결(CLOSED) */
  onClose: () => void
  closing?: boolean
}

/**
 * 문서 위 제안 블록 — 섹션 본문 자리에 diff 와 [거부][수락].
 * pending → (수락 | 거부→사유→재제안) · stale → 경고 배너 + 다시 제안 받기 (DESIGN.md D.2)
 */
export function ProposalBlock({
  proposal,
  section,
  accepting,
  regenerating,
  staleMessage,
  onAccept,
  onReject,
  onRequestAgain,
  onClose,
  closing = false,
}: ProposalBlockProps) {
  const [rejecting, setRejecting] = useState(false)
  const rejectButtonRef = useRef<HTMLButtonElement>(null)
  /** 사유 입력을 닫으면 포커스를 "거부" 버튼으로 되돌린다 (버튼이 다시 마운트된 뒤) */
  const closeReject = () => {
    setRejecting(false)
    requestAnimationFrame(() => rejectButtonRef.current?.focus())
  }
  const diff = useMemo(
    () => lineDiff(section.body, proposal.newContent),
    [section.body, proposal.newContent],
  )

  if (regenerating) return <RegeneratingBlock proposal={proposal} />

  const stale = isProposalStale(proposal, section, staleMessage)

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border',
        stale ? 'border-hairline' : 'border-primary',
      )}
    >
      {stale && (
        <div className="bg-warning-wash text-warning-deep flex flex-wrap items-center gap-2 px-3.5 py-2.5">
          <AlertTriangle className="size-[15px] shrink-0" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 text-[13px] leading-[1.45] font-medium">
            {staleMessage ??
              `문서가 변경되어 이 제안은 만료되었습니다 (v${proposal.sectionVersion} → v${section.version})`}
          </span>
          <div className="-my-1 flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-warning-deep hover:text-warning-deep text-[13px]"
              onClick={onRequestAgain}
              disabled={closing}
            >
              다시 제안 받기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-warning-deep hover:text-warning-deep text-[13px]"
              onClick={onClose}
              disabled={closing}
            >
              {closing ? '닫는 중…' : '닫기'}
            </Button>
          </div>
        </div>
      )}
      <div className={cn('flex flex-col gap-2 px-4 py-3', !stale && 'bg-primary-wash')}>
        <div className="flex items-center gap-2">
          <span
            className={cn('size-2 rounded-full', stale ? 'bg-muted-soft' : 'bg-primary')}
            aria-hidden
          />
          <span
            className={cn('text-[13px] font-medium', stale ? 'text-muted' : 'text-primary-text')}
          >
            Navi 제안
          </span>
          <span className="text-muted font-mono text-[12px]">{proposal.sectionName}</span>
        </div>
        {proposal.reason && (
          <p className="text-body text-[13px] leading-[1.5]">{proposal.reason}</p>
        )}
      </div>

      <div className={cn('bg-canvas px-4 py-3.5', stale && 'opacity-50')}>
        <DiffView diff={diff} />
      </div>

      {!stale && (
        <div className="border-hairline-soft bg-canvas border-t px-4 py-2.5">
          {rejecting ? (
            <RejectForm
              busy={accepting}
              onCancel={closeReject}
              onSubmit={(reason) => {
                setRejecting(false)
                onReject(reason)
              }}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              {accepting ? (
                <span className="text-muted inline-flex items-center gap-1.5 text-[12px]">
                  <LoaderCircle className="size-3.5 animate-spin" strokeWidth={2} />
                  적용 중 — 섹션이 그대로인지 확인하고 v{section.version + 1}로 저장합니다
                </span>
              ) : (
                <span className="text-muted text-[12px]">
                  수락하면 이 섹션만 교체되고 v{section.version + 1}로 저장됩니다
                </span>
              )}
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  ref={rejectButtonRef}
                  variant="ghost"
                  size="lg"
                  className="text-error-deep hover:text-error-deep px-3 text-[14px]"
                  onClick={() => setRejecting(true)}
                  disabled={accepting}
                >
                  거부
                </Button>
                <Button
                  size="lg"
                  className="px-4 text-[14px] font-semibold"
                  onClick={onAccept}
                  disabled={accepting}
                >
                  {accepting ? '적용 중…' : '수락'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** 거부 직후 — 원문 유지, 재제안을 기다리는 상태 (DESIGN.md `section-proposal-rejected`) */
function RegeneratingBlock({ proposal }: { proposal: Proposal }) {
  return (
    <div className="border-hairline flex flex-col gap-2.5 rounded-lg border px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="bg-muted-soft size-2 rounded-full" aria-hidden />
        <span className="text-muted text-[13px] font-medium">Navi 제안 · 거부됨</span>
        <span className="text-muted ml-auto inline-flex items-center gap-1.5 text-[12px]">
          <LoaderCircle className="size-3.5 animate-spin" strokeWidth={2} />
          사유를 반영해 다시 제안하는 중
        </span>
      </div>
      {proposal.rejectReason && (
        <blockquote className="border-hairline text-body border-l-2 pl-2.5 text-[13px] leading-[1.5]">
          {proposal.rejectReason}
        </blockquote>
      )}
    </div>
  )
}

function RejectForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean
  onCancel: () => void
  onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canSubmit = reason.trim().length > 0 && !busy
  // "거부" 버튼이 사라지고 이 폼이 대신 뜨므로 포커스를 이어받는다 (autoFocus 는 a11y 규칙으로 금지)
  useEffect(() => textareaRef.current?.focus(), [])
  return (
    <div className="bg-surface-soft -mx-4 -my-2.5 flex flex-col gap-2 px-4 py-3">
      <span className="text-ink text-[13px] font-medium">
        거부 사유 — Navi가 이 사유를 반영해 다시 제안합니다
      </span>
      <Textarea
        ref={textareaRef}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="예: 마케팅 미동의 유저는 이미 발송 대상에서 빠져 있어요"
        className="bg-canvas min-h-16 text-[14px]"
        aria-label="거부 사유"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSubmit)
            onSubmit(reason)
          if (event.key === 'Escape') onCancel()
        }}
      />
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="sm" className="text-[13px]" onClick={onCancel}>
          취소
        </Button>
        <Button
          size="sm"
          className="text-[13px] font-semibold"
          onClick={() => onSubmit(reason)}
          disabled={!canSubmit}
        >
          사유와 함께 재요청
        </Button>
      </div>
    </div>
  )
}

const PILL =
  'bg-surface-card inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[12px] font-medium'

export type ProposalPillState = 'pending' | 'stale' | 'regenerating'

/** 섹션 헤더 옆 제안 상태 pill — 중립 pill + 코랄 점 (DESIGN.md `badge-pill`) */
export function ProposalPill({ state }: { state: ProposalPillState }) {
  switch (state) {
    case 'pending':
      return (
        <span className={cn(PILL, 'text-ink')}>
          <span className="bg-primary size-2 rounded-full" aria-hidden />
          제안 대기
        </span>
      )
    case 'stale':
      return (
        <span className={cn(PILL, 'text-warning-deep')}>
          <AlertTriangle className="size-3" strokeWidth={2} />
          제안 만료
        </span>
      )
    case 'regenerating':
      return (
        <span className={cn(PILL, 'text-muted')}>
          <span className="bg-muted-soft size-2 rounded-full" aria-hidden />
          재제안 대기
        </span>
      )
  }
}

/** 수락 직후 — "Navi 제안 적용 · vN" (세션 안에서만, 섹션이 다시 바뀌면 사라진다) */
export function AppliedPill({ version }: { version: number }) {
  return (
    <span className={cn(PILL, 'text-ink')}>
      <CircleCheck className="text-success-deep size-3" strokeWidth={2} />
      Navi 제안 적용 · v{version}
    </span>
  )
}
