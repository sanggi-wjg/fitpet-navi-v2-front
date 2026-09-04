import { describe, expect, it } from 'vitest'
import type { ProposalResponseDto } from '@/api/model'
import { isProposalStale, toChatOutcome, toProposal } from '@/lib/proposal-mapping'
import { makeProposal } from '@/test/factories'

const base: ProposalResponseDto = {
  id: 11,
  task_id: 7,
  section_id: 3,
  section_version: 2,
  tool: 'replace_section',
  tool_input: { section: '예외 조건', new_content: '- 휴면 계정 제외', reason: '이유' },
  status: 'PENDING',
  is_stale: false,
  reject_reason: null,
  created_at: '2026-09-02T00:00:00',
  updated_at: '2026-09-02T00:00:00',
}

describe('toProposal', () => {
  it('DTO 를 뷰 모델로 바꾸고 naive 시각은 UTC 로 본다', () => {
    expect(toProposal(base)).toEqual({
      id: 11,
      taskId: 7,
      sectionId: 3,
      sectionName: '예외 조건',
      sectionVersion: 2,
      newContent: '- 휴면 계정 제외',
      reason: '이유',
      status: 'pending',
      stale: false,
      rejectReason: null,
      createdAt: '2026-09-02T00:00:00Z',
      updatedAt: '2026-09-02T00:00:00Z',
    })
  })
  it('no_change 이거나 본문이 없으면 제안이 아니다', () => {
    expect(toProposal({ ...base, tool: 'no_change' })).toBeNull()
    expect(toProposal({ ...base, tool_input: { section: '예외 조건' } })).toBeNull()
  })
  it('CLOSED 는 closed', () => {
    expect(toProposal({ ...base, status: 'CLOSED' })?.status).toBe('closed')
  })
  it('섹션명이 없으면 폴백 라벨', () => {
    expect(toProposal({ ...base, tool_input: { new_content: 'x' } })?.sectionName).toBe('섹션')
  })
})

describe('toChatOutcome', () => {
  it('no_change 는 message 만, 제안이면 proposal', () => {
    expect(toChatOutcome({ tool: 'no_change', message: '지금으로 충분해요.' })).toEqual({
      message: '지금으로 충분해요.',
      proposal: null,
    })
    const outcome = toChatOutcome({ tool: 'replace_section', proposal: base, diff: '--- x' })
    expect(outcome.proposal?.id).toBe(11)
    expect(outcome.message).toBeNull()
  })
})

describe('isProposalStale', () => {
  it('서버 플래그 · version 차이 · 409 문구 중 하나면 만료', () => {
    expect(isProposalStale(makeProposal(), { version: 0 })).toBe(false)
    expect(isProposalStale(makeProposal({ stale: true }), { version: 0 })).toBe(true)
    expect(isProposalStale(makeProposal(), { version: 1 })).toBe(true)
    expect(isProposalStale(makeProposal(), { version: 0 }, '충돌')).toBe(true)
  })
})
