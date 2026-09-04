import type { ChatResponseDto, ProposalResponseDto, ProposalStatusEnum } from '@/api/model'
import { normalizeIso } from '@/lib/api-mapping'
import type { ChatOutcome, Proposal, ProposalStatus } from '@/types/proposal'
import type { TaskSection } from '@/types/task'

const STATUS_FROM_API: Record<ProposalStatusEnum, ProposalStatus> = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CLOSED: 'closed',
}

const stringField = (input: Record<string, unknown>, key: string): string | null => {
  const value = input[key]
  return typeof value === 'string' ? value : null
}

/**
 * DTO → 뷰 모델. `tool_input` 은 자유 객체라 `new_content` 가 문자열인 제안만 살린다 —
 * 본문 없는 제안은 보여 줄 diff 도, 수락할 내용도 없다. `no_change` 는 저장되지 않지만 방어한다.
 */
export function toProposal(dto: ProposalResponseDto): Proposal | null {
  if (dto.tool !== 'replace_section') return null
  const newContent = stringField(dto.tool_input, 'new_content')
  if (newContent === null) return null
  return {
    id: dto.id,
    taskId: dto.task_id,
    sectionId: dto.section_id,
    sectionName: stringField(dto.tool_input, 'section') ?? '섹션',
    sectionVersion: dto.section_version,
    newContent,
    reason: stringField(dto.tool_input, 'reason'),
    status: STATUS_FROM_API[dto.status],
    stale: dto.is_stale,
    rejectReason: dto.reject_reason,
    createdAt: normalizeIso(dto.created_at),
    updatedAt: normalizeIso(dto.updated_at),
  }
}

/** chat / reject 응답 — 서버 diff 문자열은 쓰지 않는다 (`src/lib/diff.ts` 가 본문으로 계산) */
export function toChatOutcome(dto: ChatResponseDto): ChatOutcome {
  return {
    message: dto.message ?? null,
    proposal: dto.proposal ? toProposal(dto.proposal) : null,
  }
}

/** 만료 판정 — 서버 플래그 · 섹션 version 차이 · accept 409 문구 중 하나 */
export function isProposalStale(
  proposal: Proposal,
  section: Pick<TaskSection, 'version'>,
  staleMessage: string | null = null,
): boolean {
  return proposal.stale || proposal.sectionVersion !== section.version || staleMessage !== null
}
