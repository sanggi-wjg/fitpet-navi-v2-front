import { describe, expect, it } from 'vitest'
import { relativeTime } from '@/lib/format'

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
