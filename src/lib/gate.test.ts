import { describe, expect, it } from 'vitest'
import { computeGate, gateHeadline, gateShortLabel } from '@/lib/gate'

const answered = { id: '1', question: 'q', answer: 'a', answeredAt: 'now' }
const open = { id: '2', question: 'q2', answer: null, answeredAt: null }

describe('computeGate', () => {
  it('마커가 남아 있으면 첫 실패는 markers', () => {
    const gate = computeGate({ markerCount: 1, analysisCount: 1, undecided: [answered] })
    expect(gate.passed).toBe(false)
    expect(gate.firstFailure).toBe('markers')
    expect(gateShortLabel(gate)).toBe('마커 1건')
    expect(gateHeadline(gate)).toBe('예제 텍스트 1건이 남아 있습니다')
  })

  it('분석 전이면 미결정도 통과로 치지 않는다', () => {
    const gate = computeGate({ markerCount: 0, analysisCount: 0, undecided: [] })
    expect(gate.failures).toEqual(['analysis', 'undecided'])
    expect(gateShortLabel(gate)).toBe('분석 전')
    expect(gateHeadline(gate)).toBe('분석이 실행되지 않았습니다')
  })

  it('미결정이 남아 있으면 undecided 만 실패', () => {
    const gate = computeGate({
      markerCount: 0,
      analysisCount: 1,
      undecided: [answered, open],
    })
    expect(gate.failures).toEqual(['undecided'])
    expect(gate.undecidedRemaining).toBe(1)
    expect(gateHeadline(gate)).toBe('미결정 1건이 남아 있습니다')
  })

  it('세 조건을 모두 만족하면 통과', () => {
    const gate = computeGate({ markerCount: 0, analysisCount: 1, undecided: [answered] })
    expect(gate.passed).toBe(true)
    expect(gate.firstFailure).toBeNull()
    expect(gateShortLabel(gate)).toBe('')
  })

  it('분석이 미결정 0건을 뽑아도 통과', () => {
    expect(computeGate({ markerCount: 0, analysisCount: 2, undecided: [] }).passed).toBe(true)
  })
})
