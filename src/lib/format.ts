import { formatDistanceToNowStrict } from 'date-fns'
import { ko } from 'date-fns/locale'

/** "2시간 전" 형태의 상대 시각. 잘못된 값은 '—', 1분 이내(서버 시계가 앞선 경우 포함)는 '방금'. */
export function relativeTime(iso: string): string {
  const date = new Date(iso)
  const time = date.getTime()
  if (Number.isNaN(time)) return '—'
  if (Date.now() - time < 60_000) return '방금'
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: ko })
}

/** 소요 시간 — 10초 미만은 소수 1자리("8.8초"), 1분 미만은 초("42초"), 그 이상은 "1분 12초" */
export function formatElapsed(ms: number): string {
  const safe = Math.max(0, ms)
  if (safe < 10_000) return `${(safe / 1000).toFixed(1)}초`
  const seconds = Math.round(safe / 1000)
  if (seconds < 60) return `${seconds}초`
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`
}
