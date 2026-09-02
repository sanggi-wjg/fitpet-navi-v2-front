/** 프론트 뷰 모델. 백엔드 DTO(`src/api/model`) 는 `src/lib/api-mapping.ts` 에서 이 형태로 변환한다. */

export type TaskType = 'new_feature' | 'modify_feature' | 'automation' | 'policy_change'

/** 보드 컬럼 4개 + 취소. 취소·아카이브는 보드에 표시하지 않고 상세에서 읽기 전용이다. */
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled'

export type BoardStatus = Exclude<TaskStatus, 'canceled'>

/** 우선순위 0~4, 0이 가장 높음 (백엔드 정의). 기본값 2 = 보통 */
export type Priority = 0 | 1 | 2 | 3 | 4

export interface Task {
  id: number
  title: string
  type: TaskType
  status: TaskStatus
  /** 정본 마크다운. `## 섹션명:` 헤딩 단위로 섹션이 나뉜다 (템플릿이 고정). */
  content: string
  /** 본문이 실제로 바뀔 때만 +1 (백엔드). 제안 만료 판단·표시에 쓴다 */
  version: number
  /** 백엔드는 쉼표 구분 문자열 — 뷰 모델에서는 배열 */
  tags: string[]
  /** 0이 가장 위. 컬럼 안 정렬에만 쓴다 (컬럼 간 비교 없음) */
  displayOrder: number
  priority: Priority
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
