import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useElapsed } from '@/hooks/useElapsed'

describe('useElapsed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-05T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('진행 중이면 1초마다 지난 초를 갱신하고, 멈추면 마지막 값을 유지한다', () => {
    const startedAt = Date.now()
    const { result, rerender } = renderHook(({ running }) => useElapsed(startedAt, running), {
      initialProps: { running: true },
    })
    expect(result.current).toBe(0)

    act(() => vi.advanceTimersByTime(2_100))
    expect(result.current).toBe(2)

    rerender({ running: false })
    act(() => vi.advanceTimersByTime(5_000))
    expect(result.current).toBe(2)
  })
})
