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
