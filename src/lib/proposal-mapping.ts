import { isAxiosError } from 'axios'
import type {
  DiffLineDto,
  ErrorResponseDto,
  ProposalChatResponseDto,
  ProposalResponseDto,
  ProposalStatusEnum,
} from '@/api/model'
import { normalizeIso } from '@/lib/api-mapping'
import { sectionDisplayName, type Section } from '@/lib/markdown'
import type { ChatOutcome, DiffLine, Proposal, ProposalStatus } from '@/types/proposal'

const STATUS_FROM_API: Record<ProposalStatusEnum, ProposalStatus> = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  STALE: 'stale',
}

export function toProposal(dto: ProposalResponseDto): Proposal | null {
  if (dto.tool === 'no_change') return null
  return {
    id: dto.id,
    taskId: dto.task_id,
    tool: dto.tool,
    status: STATUS_FROM_API[dto.status],
    taskVersion: dto.task_version,
    reason: dto.reason,
    section: dto.section,
    field: dto.field === 'title' || dto.field === 'tags' ? dto.field : null,
    value: dto.value,
    rejectReason: dto.reject_reason,
    createdAt: normalizeIso(dto.created_at),
  }
}

export function toDiffLine(dto: DiffLineDto): DiffLine {
  return { type: dto.type, text: dto.text ?? '', parts: dto.parts ?? [] }
}

export function toChatOutcome(dto: ProposalChatResponseDto): ChatOutcome {
  return {
    message: dto.message ?? null,
    proposal: dto.proposal ? toProposal(dto.proposal) : null,
    diff: (dto.diff ?? []).map(toDiffLine),
  }
}

/**
 * 제안의 section(콜론 없는 정규화 이름)을 문서 섹션과 잇는다.
 * 백엔드가 이름이 유일한 섹션만 지목하므로, 이쪽도 정확히 1개일 때만 매칭한다.
 */
export function matchProposalSection(sections: Section[], name: string | null): Section | null {
  if (!name) return null
  const matched = sections.filter((section) => sectionDisplayName(section.name) === name)
  return matched.length === 1 ? matched[0] : null
}

export interface ApiErrorInfo {
  /** HTTP 상태 — 네트워크 단절 등은 null */
  status: number | null
  /** 서버 ErrorResponseDto.message — 없으면 null */
  message: string | null
}

/** axios 오류에서 백엔드 ErrorResponseDto 를 꺼낸다 (409 stale · 503 LLM · 400 생성 실패 분기용) */
export function apiErrorInfo(error: unknown): ApiErrorInfo {
  if (isAxiosError(error)) {
    const data = error.response?.data as Partial<ErrorResponseDto> | undefined
    return {
      status: error.response?.status ?? null,
      message: typeof data?.message === 'string' ? data.message : null,
    }
  }
  return { status: null, message: null }
}

export const FIELD_LABEL: Record<'title' | 'tags', string> = {
  title: '제목',
  tags: '태그',
}

/** 패널 요약 카드·pill 에 쓰는 제안 대상 라벨 */
export function proposalTargetLabel(proposal: Proposal): string {
  if (proposal.tool === 'replace_section') return proposal.section ?? '섹션'
  return proposal.field ? FIELD_LABEL[proposal.field] : '메타 필드'
}
