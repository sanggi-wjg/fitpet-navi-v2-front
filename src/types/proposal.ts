/** 제안 뷰 모델 (범위 2). DTO 변환은 `src/lib/proposal-mapping.ts`. */

/** closed = 수락·거부 없이 종결 (만료 블록 '닫기') */
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'closed'

/**
 * Navi 의 섹션 교체 제안. 저장되는 도구는 `replace_section` 뿐이라 tool 필드는 두지 않는다 —
 * `no_change` 는 제안이 아니라 패널의 일반 답변이다.
 */
export interface Proposal {
  id: number
  taskId: number
  /** 대상 섹션 — 식별은 id 로, 이름은 표시용 */
  sectionId: number
  sectionName: string
  /** 제안 시점의 섹션 version — 현재 값과 다르면 만료(수락 시 409) */
  sectionVersion: number
  /** 제안 본문 — 현재 섹션 본문과 비교해 diff 는 프론트가 계산한다 */
  newContent: string
  /** 제안 사유 (Navi 발화, 해요체) */
  reason: string | null
  status: ProposalStatus
  /** 서버 판정 만료 — pending 인데 제안 이후 섹션이 바뀜 */
  stale: boolean
  rejectReason: string | null
  createdAt: string
  updatedAt: string
}

/** POST chat / reject 응답 — no_change 는 message 만, 그 외엔 proposal */
export interface ChatOutcome {
  message: string | null
  proposal: Proposal | null
}

/** Navi 패널 대화 항목. 대화는 서버에 저장되지 않는다(stateless) — 세션 로컬. */
export type PanelMessage =
  | { kind: 'navi'; text: string }
  | { kind: 'user'; text: string }
  | { kind: 'info'; text: string }
  | { kind: 'proposal'; proposalId: number }
  | { kind: 'error'; text: string; retryText?: string }
