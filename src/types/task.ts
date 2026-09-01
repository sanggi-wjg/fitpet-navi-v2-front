/** 프론트 뷰 모델. 백엔드 DTO(`src/api/model`) 는 `src/lib/api-mapping.ts` 에서 이 형태로 변환한다. */

export type TaskType = 'new_feature' | 'modify_feature' | 'automation' | 'policy_change'

/** 보드 컬럼 4개 + 취소. 취소·아카이브는 보드에 표시하지 않고 상세에서 읽기 전용이다. */
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled'

export type BoardStatus = Exclude<TaskStatus, 'canceled'>

export interface Task {
  id: number
  title: string
  /** 백엔드 응답에 task_type 이 없어 섹션 구성으로 추론한다. 매칭 실패 시 null. */
  type: TaskType | null
  status: TaskStatus
  /** 정본 마크다운. `## 섹션명:` 헤딩 단위로 섹션이 나뉜다 (템플릿이 고정). */
  content: string
  tags: string | null
  displayOrder: number
  priority: number
  archived: boolean
  /** 취소 또는 아카이브 — 상세에서 편집·분석 불가 */
  readOnly: boolean
  createdAt: string
  updatedAt: string
}

/** 범위 3 (미결정 사항) — 백엔드 준비 전. 게이트 계산 타입으로만 사용한다. */
export interface UndecidedItem {
  id: string
  question: string
  answer: string | null
  answeredAt: string | null
}
