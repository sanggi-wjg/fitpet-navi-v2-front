import { describe, expect, it } from 'vitest'
import {
  CONFLICT_HINT,
  NETWORK_HINT,
  apiErrorInfo,
  errorDescription,
  isConflict,
} from '@/lib/api-error'

const axiosError = (status: number, message?: string) =>
  Object.assign(new Error('http'), {
    isAxiosError: true,
    response: { status, data: { status, ...(message && { message }) } },
  })

describe('apiErrorInfo', () => {
  it('axios 오류에서 상태와 서버 메시지를 꺼낸다', () => {
    expect(apiErrorInfo(axiosError(409, '문서가 변경되었습니다'))).toEqual({
      status: 409,
      message: '문서가 변경되었습니다',
    })
  })
  it('일반 오류·네트워크 단절은 null', () => {
    expect(apiErrorInfo(new Error('x'))).toEqual({ status: null, message: null })
    const offline = Object.assign(new Error('net'), { isAxiosError: true })
    expect(apiErrorInfo(offline)).toEqual({ status: null, message: null })
  })
})

describe('isConflict · errorDescription', () => {
  it('409 만 낙관적 잠금 실패로 본다', () => {
    expect(isConflict(axiosError(409))).toBe(true)
    expect(isConflict(axiosError(500))).toBe(false)
    expect(isConflict(new Error('x'))).toBe(false)
  })
  it('409 는 서버 메시지(없으면 폴백), 그 외는 네트워크 안내', () => {
    expect(errorDescription(axiosError(409, '먼저 수정됨'))).toBe('먼저 수정됨')
    expect(errorDescription(axiosError(409))).toBe(CONFLICT_HINT)
    expect(errorDescription(axiosError(500, '서버 오류'))).toBe(NETWORK_HINT)
    expect(errorDescription(new Error('x'))).toBe(NETWORK_HINT)
  })
})
