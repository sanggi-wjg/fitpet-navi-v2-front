import { describe, expect, it } from 'vitest'
import type { ProposalResponseDto } from '@/api/model'
import { parseSections } from '@/lib/markdown'
import {
  apiErrorInfo,
  matchProposalSection,
  proposalTargetLabel,
  toChatOutcome,
  toProposal,
} from '@/lib/proposal-mapping'

const base: ProposalResponseDto = {
  id: 11,
  task_id: 7,
  tool: 'replace_section',
  status: 'PENDING',
  task_version: 2,
  reason: '이유',
  section: '예외 조건',
  field: null,
  value: null,
  reject_reason: null,
  created_at: '2026-09-02T00:00:00',
}

describe('toProposal', () => {
  it('DTO 를 뷰 모델로 바꾸고 naive 시각은 UTC 로 본다', () => {
    expect(toProposal(base)).toMatchObject({
      id: 11,
      tool: 'replace_section',
      status: 'pending',
      taskVersion: 2,
      section: '예외 조건',
      createdAt: '2026-09-02T00:00:00Z',
    })
  })
  it('no_change 는 제안이 아니다', () => {
    expect(toProposal({ ...base, tool: 'no_change' })).toBeNull()
  })
})

describe('toChatOutcome', () => {
  it('no_change 는 message 만, 제안이면 proposal + diff', () => {
    expect(toChatOutcome({ tool: 'no_change', message: '지금으로 충분해요.' })).toEqual({
      message: '지금으로 충분해요.',
      proposal: null,
      diff: [],
    })
    const outcome = toChatOutcome({
      tool: 'replace_section',
      proposal: base,
      diff: [
        { type: 'insert', text: '- 추가' },
        { type: 'changed', parts: [{ op: 'equal', text: 'a' }] },
      ],
    })
    expect(outcome.proposal?.id).toBe(11)
    expect(outcome.diff).toEqual([
      { type: 'insert', text: '- 추가', parts: [] },
      { type: 'changed', text: '', parts: [{ op: 'equal', text: 'a' }] },
    ])
  })
})

describe('matchProposalSection', () => {
  const doc = parseSections('## 정책:\n- a\n\n## 예외 조건:\n- b\n')
  it('콜론 없는 정규화 이름으로 섹션을 찾는다', () => {
    expect(matchProposalSection(doc.sections, '예외 조건')?.name).toBe('예외 조건:')
  })
  it('없거나 중복이면 null', () => {
    expect(matchProposalSection(doc.sections, '없는 섹션')).toBeNull()
    const dup = parseSections('## 정책:\n- a\n\n## 정책:\n- b\n')
    expect(matchProposalSection(dup.sections, '정책')).toBeNull()
    expect(matchProposalSection(doc.sections, null)).toBeNull()
  })
})

describe('apiErrorInfo', () => {
  it('axios 오류에서 상태와 서버 메시지를 꺼낸다', () => {
    const error = Object.assign(new Error('conflict'), {
      isAxiosError: true,
      response: { status: 409, data: { status: 409, message: '문서가 변경되었습니다' } },
    })
    expect(apiErrorInfo(error)).toEqual({ status: 409, message: '문서가 변경되었습니다' })
  })
  it('일반 오류·네트워크 단절은 null', () => {
    expect(apiErrorInfo(new Error('x'))).toEqual({ status: null, message: null })
    const offline = Object.assign(new Error('net'), { isAxiosError: true })
    expect(apiErrorInfo(offline)).toEqual({ status: null, message: null })
  })
})

describe('proposalTargetLabel', () => {
  it('섹션명 또는 필드 라벨', () => {
    expect(proposalTargetLabel({ ...toProposal(base)! })).toBe('예외 조건')
    expect(
      proposalTargetLabel(
        toProposal({ ...base, tool: 'update_field', field: 'tags', section: null })!,
      ),
    ).toBe('태그')
  })
})
