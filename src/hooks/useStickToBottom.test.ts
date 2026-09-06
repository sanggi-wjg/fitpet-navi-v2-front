import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStickToBottom } from '@/hooks/useStickToBottom'

/** jsdom 은 레이아웃이 없어 스크롤 지표를 직접 흉내 낸다 */
function setScroll({ scrollHeight, scrollTop, innerHeight }: Record<string, number>) {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  })
  Object.defineProperty(document.documentElement, 'scrollTop', {
    configurable: true,
    writable: true,
    value: scrollTop,
  })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: innerHeight })
}

describe('useStickToBottom', () => {
  const scrollTo = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('scrollTo', scrollTo)
    scrollTo.mockClear()
    setScroll({ scrollHeight: 2000, scrollTop: 1500, innerHeight: 500 }) // 바닥
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('바닥 근처면 신호가 바뀔 때마다 끝으로 스크롤한다', () => {
    const { rerender } = renderHook(({ signal }) => useStickToBottom(signal), {
      initialProps: { signal: 'a' },
    })
    expect(scrollTo).toHaveBeenCalledTimes(1)
    rerender({ signal: 'b' })
    expect(scrollTo).toHaveBeenCalledTimes(2)
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 2000 })
  })

  it('사용자가 위로 올려 읽는 중이면 따라가지 않고, 강제 호출은 다시 붙인다', () => {
    const { result, rerender } = renderHook(({ signal }) => useStickToBottom(signal), {
      initialProps: { signal: 'a' },
    })
    scrollTo.mockClear()

    setScroll({ scrollHeight: 2000, scrollTop: 200, innerHeight: 500 })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    rerender({ signal: 'b' })
    expect(scrollTo).not.toHaveBeenCalled()

    act(() => result.current())
    expect(scrollTo).toHaveBeenCalledTimes(1)
    rerender({ signal: 'c' })
    expect(scrollTo).toHaveBeenCalledTimes(2)
  })
})
