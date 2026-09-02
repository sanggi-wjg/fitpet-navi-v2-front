import { AlertTriangle, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { DiffView } from '@/components/detail/DiffView'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FIELD_LABEL, proposalTargetLabel } from '@/lib/proposal-mapping'
import { cn } from '@/lib/utils'
import type { DiffLine, Proposal } from '@/types/proposal'

interface ProposalBlockProps {
  proposal: Proposal
  /** chat/reject 응답의 diff — 리로드 후에는 없다 (목록 API 가 diff 를 주지 않음) */
  diff: DiffLine[] | null
  /** 현재 task.version — 제안 시점과 다르면 만료 가능성 경고 */
  currentVersion: number
  /** update_field 표시용 현재 값 */
  currentValue?: string | null
  accepting: boolean
  /** 거부 직후 — 사유를 반영한 재제안 생성 중 */
  regenerating: boolean
  /** accept 409 이후 서버 만료 문구 (상태 stale 포함) */
  staleMessage: string | null
  onAccept: () => void
  onReject: (reason: string) => void
  onRequestAgain: () => void
}

/**
 * 문서 위 제안 블록 — 섹션 본문 자리(replace_section) 또는 문서 상단(update_field).
 * pending → (수락 | 거부→사유→재제안) · stale → 경고 배너 + 다시 제안 받기 (DESIGN.md D.2)
 */
export function ProposalBlock({
  proposal,
  diff,
  currentVersion,
  currentValue,
  accepting,
  regenerating,
  staleMessage,
  onAccept,
  onReject,
  onRequestAgain,
}: ProposalBlockProps) {
  const [rejecting, setRejecting] = useState(false)

  if (regenerating) return <RegeneratingBlock proposal={proposal} />

  const stale = proposal.status === 'stale' || staleMessage !== null
  const versionDrift = !stale && proposal.taskVersion !== currentVersion

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
            {staleMessage ?? '문서가 변경되어 이 제안은 만료되었습니다'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-warning-deep hover:text-warning-deep -my-1 text-[13px]"
            onClick={onRequestAgain}
          >
            다시 제안 받기
          </Button>
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
          <span className="text-muted font-mono text-[12px]">{proposalTargetLabel(proposal)}</span>
          {versionDrift && (
            <span className="text-warning-deep ml-auto text-[12px] font-medium">
              제안 후 문서가 수정됨 (v{proposal.taskVersion} → v{currentVersion})
            </span>
          )}
        </div>
        {proposal.reason && (
          <p className="text-body text-[13px] leading-[1.5]">{proposal.reason}</p>
        )}
      </div>

      <div className={cn('bg-canvas px-4 py-3.5', stale && 'opacity-50')}>
        <ProposalBody proposal={proposal} diff={diff} currentValue={currentValue} />
      </div>

      {!stale && (
        <div className="border-hairline-soft bg-canvas border-t px-4 py-2.5">
          {rejecting ? (
            <RejectForm
              busy={accepting}
              onCancel={() => setRejecting(false)}
              onSubmit={(reason) => {
                setRejecting(false)
                onReject(reason)
              }}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted text-[12px]">
                {proposal.tool === 'replace_section'
                  ? `수락하면 이 섹션만 교체되고 v${currentVersion + 1}로 저장됩니다`
                  : '수락하면 이 필드만 바뀝니다'}
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
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
                  {accepting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" strokeWidth={2} />
                      적용 중…
                    </>
                  ) : (
                    '수락'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProposalBody({
  proposal,
  diff,
  currentValue,
}: {
  proposal: Proposal
  diff: DiffLine[] | null
  currentValue?: string | null
}) {
  if (proposal.tool === 'update_field') {
    const label = proposal.field ? FIELD_LABEL[proposal.field] : '필드'
    return (
      <p className="text-body text-[15px] leading-[1.6]">
        <span className="text-muted font-medium">{label}: </span>
        {currentValue ? (
          <span className="bg-error-wash text-error-deep decoration-error-deep/60 rounded-[4px] px-0.5 line-through">
            {currentValue}
          </span>
        ) : (
          <span className="text-muted">없음</span>
        )}
        <span className="text-muted"> → </span>
        <span className="bg-success-wash text-success-deep rounded-[4px] px-0.5 font-medium">
          {proposal.value}
        </span>
      </p>
    )
  }
  if (diff && diff.length > 0) return <DiffView diff={diff} />
  return (
    <p className="text-muted text-[13px] leading-[1.5]">
      이전 세션에서 만든 제안이라 변경 내용 미리보기를 표시할 수 없습니다. 수락하면 제안 내용대로{' '}
      <span className="font-mono">{proposal.section}</span> 섹션이 교체됩니다 — 내용을 확인하려면
      거부 후 다시 요청해 주세요.
    </p>
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
  const canSubmit = reason.trim().length > 0 && !busy
  return (
    <div className="bg-surface-soft -mx-4 -my-2.5 flex flex-col gap-2 px-4 py-3">
      <span className="text-ink text-[13px] font-medium">
        거부 사유 — Navi가 이 사유를 반영해 다시 제안합니다
      </span>
      <Textarea
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
