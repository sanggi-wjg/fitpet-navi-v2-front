/** 제안 뷰 모델 (범위 2). DTO 변환은 `src/lib/proposal-mapping.ts`. */

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'stale'

/** no_change 는 제안 카드가 아니라 일반 답변 — Proposal 로 저장되지 않는다 */
export type ProposalTool = 'replace_section' | 'update_field'

export interface DiffPart {
  op: 'equal' | 'delete' | 'insert'
  text: string
}

/** 서버(difflib)가 계산한 줄 단위 diff. changed 줄만 어절 단위 parts 를 갖는다. */
export interface DiffLine {
  type: 'equal' | 'insert' | 'delete' | 'changed'
  text: string
  parts: DiffPart[]
}

export interface Proposal {
  id: number
  taskId: number
  tool: ProposalTool
  status: ProposalStatus
  /** 제안 시점의 task.version — 현재 버전과 다르면 만료 가능성이 있다 */
  taskVersion: number
  /** 제안 사유 (Navi 발화, 해요체) */
  reason: string | null
  /** replace_section 의 대상 — 콜론 없는 섹션명 (백엔드 정규화) */
  section: string | null
  /** update_field 의 대상 필드 */
  field: 'title' | 'tags' | null
  /** update_field 의 새 값 */
  value: string | null
  rejectReason: string | null
  createdAt: string
}

/** POST chat / reject 응답 — no_change 는 message 만, 그 외엔 proposal + diff */
export interface ChatOutcome {
  message: string | null
  proposal: Proposal | null
  diff: DiffLine[]
}

/** Navi 패널 대화 항목. 대화는 서버에 저장되지 않는다(stateless) — 세션 로컬. */
export type PanelMessage =
  | { kind: 'navi'; text: string }
  | { kind: 'user'; text: string }
  | { kind: 'info'; text: string }
  | { kind: 'proposal'; proposalId: number }
  | { kind: 'error'; text: string; retryText?: string }
