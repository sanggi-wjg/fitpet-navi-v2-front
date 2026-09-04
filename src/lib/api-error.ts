import { isAxiosError } from 'axios'
import type { ErrorResponseDto } from '@/api/model'

export interface ApiErrorInfo {
  /** HTTP 상태 — 네트워크 단절 등은 null */
  status: number | null
  /** 서버 ErrorResponseDto.message — 없으면 null */
  message: string | null
}

export const NETWORK_HINT = '네트워크를 확인하고 다시 시도해 주세요.'
/** 409 인데 서버 메시지가 없을 때의 폴백 */
export const CONFLICT_HINT =
  '다른 사용자가 먼저 수정했습니다. 최신 내용을 불러왔으니 다시 시도해 주세요.'

/** axios 오류에서 백엔드 ErrorResponseDto 를 꺼낸다 (409 낙관적 잠금 · 400 검증 실패 분기용) */
export function apiErrorInfo(error: unknown): ApiErrorInfo {
  if (isAxiosError(error)) {
    const data = error.response?.data as Partial<ErrorResponseDto> | undefined
    return {
      status: error.response?.status ?? null,
      message: typeof data?.message === 'string' ? data.message : null,
    }
  }
  return { status: null, message: null }
}

/** 낙관적 잠금 실패 (task.version / section.version 불일치) */
export function isConflict(error: unknown): boolean {
  return apiErrorInfo(error).status === 409
}

/** 실패 toast 의 설명 문구 — 409 는 서버 메시지, 그 외는 네트워크 안내 */
export function errorDescription(error: unknown): string {
  const { status, message } = apiErrorInfo(error)
  if (status === 409) return message ?? CONFLICT_HINT
  return NETWORK_HINT
}
