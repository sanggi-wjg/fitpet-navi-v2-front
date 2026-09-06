import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

/** 바닥에서 이 안쪽에 있으면 "따라가는 중"으로 본다 */
const STICK_THRESHOLD_PX = 96

const scrollToEnd = () => window.scrollTo({ top: document.documentElement.scrollHeight })

/**
 * 창 스크롤을 대화 끝에 붙여 둔다 — 사용자가 위로 올려 읽는 중이면 끌어내리지 않는다.
 * `signal` 이 바뀔 때마다(새 턴 · 단계 · 답변 델타) 바닥 근처였다면 끝으로 스크롤한다.
 * 돌려주는 함수는 사용자 행동(전송)에 강제로 붙이는 용도.
 */
export function useStickToBottom(signal: string): () => void {
  const stuckRef = useRef(true)

  useEffect(() => {
    const onScroll = () => {
      const root = document.documentElement
      stuckRef.current =
        root.scrollHeight - root.scrollTop - window.innerHeight < STICK_THRESHOLD_PX
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    if (stuckRef.current) scrollToEnd()
  }, [signal])

  return useCallback(() => {
    stuckRef.current = true
    scrollToEnd()
  }, [])
}
