import type { Task } from '@/types/task'

/** 테스트용 태스크 — 마커 없는 완성 문서가 기본 */
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 7,
    title: '생일 유저 적립금 자동 발급 배치',
    type: 'automation',
    status: 'backlog',
    content:
      '## 정책:\n- 생일 당일 적립금 지급\n\n## 세부사항:\n- 금액 — 1,000원\n\n## 예외 조건:\n- 휴면 계정 제외\n',
    version: 1,
    tags: [],
    displayOrder: 0,
    priority: 2,
    archived: false,
    readOnly: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  }
}

import type { Proposal } from '@/types/proposal'

/** 테스트용 제안 — 예외 조건 섹션 교체가 기본 */
export function makeProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 11,
    taskId: 7,
    tool: 'replace_section',
    status: 'pending',
    taskVersion: 1,
    reason: '마케팅 미동의 유저의 적립금 처리를 분명히 했어요.',
    section: '예외 조건',
    field: null,
    value: null,
    rejectReason: null,
    createdAt: '2026-09-02T00:00:00Z',
    ...overrides,
  }
}
