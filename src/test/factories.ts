import type { Proposal } from '@/types/proposal'
import type { Task, TaskSection } from '@/types/task'

/** 테스트용 섹션 — 마커 없는 필수 섹션이 기본 */
export function makeSection(overrides: Partial<TaskSection> = {}): TaskSection {
  return {
    id: 1,
    taskId: 7,
    name: '세부사항',
    body: '- 금액 — 1,000원\n',
    displayOrder: 0,
    isRequired: true,
    version: 0,
    markerCount: 0,
    ...overrides,
  }
}

/** 테스트용 태스크 — 마커 없는 완성 문서(정책 · 세부사항 · 예외 조건)가 기본 */
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 7,
    title: '생일 유저 적립금 자동 발급 배치',
    type: 'automation',
    status: 'backlog',
    version: 1,
    tags: [],
    displayOrder: 0,
    priority: 2,
    archived: false,
    archivedAt: null,
    readOnly: false,
    sections: [
      makeSection({ id: 1, name: '정책', body: '- 생일 당일 적립금 지급\n', isRequired: false }),
      makeSection({ id: 2, name: '세부사항', body: '- 금액 — 1,000원\n', displayOrder: 1 }),
      makeSection({ id: 3, name: '예외 조건', body: '- 휴면 계정 제외\n', displayOrder: 2 }),
    ],
    markerCount: 0,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  }
}

/** 테스트용 제안 — 예외 조건(id 3) 섹션 교체가 기본 */
export function makeProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 11,
    taskId: 7,
    sectionId: 3,
    sectionName: '예외 조건',
    sectionVersion: 0,
    newContent: '- 휴면 계정 제외\n- 마케팅 미동의 유저는 알림톡 없이 적립금만 발급\n',
    reason: '마케팅 미동의 유저의 적립금 처리를 분명히 했어요.',
    status: 'pending',
    stale: false,
    rejectReason: null,
    createdAt: '2026-09-02T00:00:00Z',
    updatedAt: '2026-09-02T00:00:00Z',
    ...overrides,
  }
}
