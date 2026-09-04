/** 프론트 뷰 모델. 백엔드 DTO(`src/api/model`) 는 `src/lib/api-mapping.ts` 에서 이 형태로 변환한다. */

export type TaskType = 'new_feature' | 'modify_feature' | 'automation' | 'policy_change'

/** 보드 컬럼 4개 + 취소. 취소는 보드에서 숨기고, 아카이브는 보드의 '아카이브' 뷰에서만 보이며 둘 다 상세에서 읽기 전용이다. */
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled'

export type BoardStatus = Exclude<TaskStatus, 'canceled'>

/** 우선순위 0~4, 0이 가장 높음 (백엔드 정의). 기본값 2 = 보통 */
export type Priority = 0 | 1 | 2 | 3 | 4

/** 문서 섹션 — 백엔드 `task_sections` 행. 구성(이름·순서·필수)은 템플릿이 정하고 프론트는 본문만 바꾼다. */
export interface TaskSection {
  id: number
  taskId: number
  /** 표시 이름 (콜론 없음) */
  name: string
  /** 마크다운 본문 (`###` 소제목·코드 펜스 포함) */
  body: string
  displayOrder: number
  isRequired: boolean
  /** 낙관적 잠금 토큰 — 섹션 PATCH 에 그대로 보낸다. 본문이 바뀔 때만 +1 */
  version: number
  /** 본문의 `(예:` 마커 수 — 프론트 계산 (하이라이트와 같은 정의) */
  markerCount: number
}

export interface Task {
  id: number
  title: string
  type: TaskType
  status: TaskStatus
  /** 메타 필드(제목·태그·상태·우선순위)가 실제로 바뀔 때만 +1. 태스크 PATCH 의 낙관적 잠금 토큰 */
  version: number
  /** 백엔드는 쉼표 구분 문자열 — 뷰 모델에서는 배열 */
  tags: string[]
  /** 0이 가장 위. 컬럼 안 정렬에만 쓴다 (컬럼 간 비교 없음) */
  displayOrder: number
  priority: Priority
  archived: boolean
  /** 아카이브 시각 — archived 일 때만 값이 있다 */
  archivedAt: string | null
  /** 취소 또는 아카이브 — 상세에서 편집·분석 불가 */
  readOnly: boolean
  /** display_order 오름차순 */
  sections: TaskSection[]
  /** 섹션 markerCount 합 — 게이트·카드 라벨 */
  markerCount: number
  createdAt: string
  updatedAt: string
}

/** 버전을 들고 다니는 최소 참조 — 메타·상태 뮤테이션의 입력과 반환값 */
export type TaskRef = Pick<Task, 'id' | 'version'>

/** 범위 3 (미결정 사항) — 백엔드 준비 전. 게이트 계산 타입으로만 사용한다. */
export interface UndecidedItem {
  id: string
  question: string
  answer: string | null
  answeredAt: string | null
}
