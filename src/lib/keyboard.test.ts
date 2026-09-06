import { describe, expect, it } from 'vitest'
import { isSubmitEnter } from '@/lib/keyboard'

const key = (key: string, shiftKey = false, isComposing = false) => ({
  key,
  shiftKey,
  nativeEvent: { isComposing },
})

describe('isSubmitEnter', () => {
  it('Enter 만 전송이고 Shift+Enter · IME 조합 중 · 다른 키는 아니다', () => {
    expect(isSubmitEnter(key('Enter'))).toBe(true)
    expect(isSubmitEnter(key('Enter', true))).toBe(false)
    expect(isSubmitEnter(key('Enter', false, true))).toBe(false)
    expect(isSubmitEnter(key('a'))).toBe(false)
  })
})
