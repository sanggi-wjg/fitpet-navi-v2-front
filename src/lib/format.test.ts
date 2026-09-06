import { describe, expect, it } from 'vitest'
import { formatElapsed, relativeTime } from '@/lib/format'

describe('formatElapsed', () => {
  it('10초 미만은 소수 1자리, 1분 미만은 초, 그 이상은 분·초', () => {
    expect(formatElapsed(8800)).toBe('8.8초')
    expect(formatElapsed(0)).toBe('0.0초')
    expect(formatElapsed(42_300)).toBe('42초')
    expect(formatElapsed(72_000)).toBe('1분 12초')
    expect(formatElapsed(-5)).toBe('0.0초')
  })
})

describe('relativeTime', () => {
  it('잘못된 날짜는 예외 없이 —', () => {
    expect(relativeTime('not-a-date')).toBe('—')
  })
  it('미래 시각(서버 시계 앞섬)은 방금', () => {
    expect(relativeTime(new Date(Date.now() + 5 * 3_600_000).toISOString())).toBe('방금')
  })
  it('2시간 전', () => {
    expect(relativeTime(new Date(Date.now() - 2 * 3_600_000).toISOString())).toBe('2시간 전')
  })
})
