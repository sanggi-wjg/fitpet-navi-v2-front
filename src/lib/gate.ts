import type { Task, UndecidedItem } from '@/types/task'

export type GateFailure = 'markers' | 'analysis' | 'undecided'

export interface GateResult {
  markerCount: number
  markersClear: boolean
  analysisDone: boolean
  undecidedTotal: number
  undecidedAnswered: number
  undecidedRemaining: number
  undecidedClear: boolean
  failures: GateFailure[]
  firstFailure: GateFailure | null
  passed: boolean
}

/**
 * "개발 준비됨" 게이트 (spec 범위 3). 새 상태가 아니라 기존 조각의 조합이다.
 * 1. 예제 마커 `(예:` 0건  2. 분석 1회 이상  3. 미결정 사항 전부 답변
 */
export interface GateInput {
  /** 섹션 본문의 `(예:` 마커 합 (`Task.markerCount`) */
  markerCount: number
  /** 분석 실행 횟수 — 백엔드 준비 전에는 0 */
  analysisCount?: number
  /** 미결정 사항 — 백엔드 준비 전에는 [] */
  undecided?: UndecidedItem[]
}

export function computeGate(input: GateInput): GateResult {
  const undecided = input.undecided ?? []
  const markerCount = input.markerCount
  const markersClear = markerCount === 0
  const analysisDone = (input.analysisCount ?? 0) >= 1
  const undecidedTotal = undecided.length
  const undecidedAnswered = undecided.filter((item) => item.answer !== null).length
  const undecidedRemaining = undecidedTotal - undecidedAnswered
  const undecidedClear = analysisDone && undecidedRemaining === 0

  const failures: GateFailure[] = []
  if (!markersClear) failures.push('markers')
  if (!analysisDone) failures.push('analysis')
  if (!undecidedClear) failures.push('undecided')

  return {
    markerCount,
    markersClear,
    analysisDone,
    undecidedTotal,
    undecidedAnswered,
    undecidedRemaining,
    undecidedClear,
    failures,
    firstFailure: failures[0] ?? null,
    passed: failures.length === 0,
  }
}

/** 태스크 뷰 모델에서 바로 계산 — 분석·미결정은 백엔드 준비 전이라 문서 마커만 실값 */
export function gateOf(task: Pick<Task, 'markerCount'>): GateResult {
  return computeGate({ markerCount: task.markerCount })
}

/** 카드의 게이트 점 옆 짧은 라벨 = 첫 실패 항목 (DESIGN.md D.3) */
export function gateShortLabel(gate: GateResult): string {
  switch (gate.firstFailure) {
    case 'markers':
      return `마커 ${gate.markerCount}건`
    case 'analysis':
      return '분석 전'
    case 'undecided':
      return `미결정 ${gate.undecidedRemaining}건`
    default:
      return ''
  }
}

/** Todo 이동 경고 헤드라인 — 첫 실패 항목별 분기. 문구는 spec 원문 유지. */
export function gateHeadline(gate: GateResult): string {
  switch (gate.firstFailure) {
    case 'markers':
      return `예제 텍스트 ${gate.markerCount}건이 남아 있습니다`
    case 'analysis':
      return '분석이 실행되지 않았습니다'
    case 'undecided':
      return `미결정 ${gate.undecidedRemaining}건이 남아 있습니다`
    default:
      return ''
  }
}

/** 게이트 스트립 3항목 라벨 (통과/미통과 문구) */
export function gateItemLabels(gate: GateResult): {
  markers: string
  analysis: string
  undecided: string
} {
  return {
    markers: gate.markersClear ? '예제 마커 0건' : `예제 마커 ${gate.markerCount}건 남음`,
    analysis: gate.analysisDone ? '분석 실행됨' : '분석 전',
    undecided: !gate.analysisDone
      ? '미결정 답변 — 분석 후'
      : gate.undecidedClear
        ? '미결정 답변 완료'
        : `미결정 ${gate.undecidedRemaining}건 남음`,
  }
}
