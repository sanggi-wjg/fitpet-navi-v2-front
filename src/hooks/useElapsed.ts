import { useEffect, useState } from 'react'

/** 시작 시각부터 지난 초 — running 동안 1초마다 갱신하고, 멈추면 마지막 값을 유지한다 */
export function useElapsed(startedAt: number, running: boolean): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [running, startedAt])

  return Math.max(0, Math.floor((now - startedAt) / 1000))
}
