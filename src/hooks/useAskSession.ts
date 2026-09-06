import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyCodeQaEvent,
  buildHistory,
  createTurn,
  finishAborted,
  finishError,
  finishIncomplete,
  isActiveTurn,
} from '@/lib/ask-reducer'
import { askErrorInfo, streamCodeQaChat } from '@/lib/ask-stream'
import type { AskTurn } from '@/types/ask'

export interface AskSession {
  turns: AskTurn[]
  /** 진행 중인 턴이 있으면 true — 입력창은 중단 버튼으로 바뀐다 */
  busy: boolean
  send: (question: string) => Promise<void>
  abort: () => void
  /** 새 대화 — 진행 중이면 끊고 모두 비운다 (확인 없음) */
  reset: () => void
  /** 재시도 가능한 오류 턴을 지우고 같은 질문을 다시 보낸다 */
  retry: (turnId: number) => void
}

/**
 * 구현 확인 세션 — 대화는 세션 로컬(서버 stateless), 요청당 AbortController 1개.
 * 이벤트는 자기 턴에만 반영하고, 종결된 턴은 reducer 가 바꾸지 않으므로 늦게 온 이벤트는 자연히 무시된다.
 */
export function useAskSession(): AskSession {
  const [turns, setTurnsState] = useState<AskTurn[]>([])
  /** 콜백이 최신 턴 목록을 렌더 없이 읽기 위한 사본 — setTurns 가 함께 갱신한다 */
  const turnsRef = useRef<AskTurn[]>([])
  /** 진행 중 요청 — null 이면 보낼 수 있다 */
  const abortRef = useRef<AbortController | null>(null)
  const nextIdRef = useRef(0)

  const setTurns = useCallback((update: (prev: AskTurn[]) => AskTurn[]) => {
    turnsRef.current = update(turnsRef.current)
    setTurnsState(turnsRef.current)
  }, [])

  // 페이지를 떠나면 진행 중 요청을 끊는다
  useEffect(() => () => abortRef.current?.abort(), [])

  const send = useCallback(
    async (input: string) => {
      const question = input.trim()
      if (question === '' || abortRef.current !== null) return

      const id = ++nextIdRef.current
      const controller = new AbortController()
      abortRef.current = controller
      const messages = buildHistory(turnsRef.current, question)
      setTurns((prev) => [...prev, createTurn(id, question)])

      const apply = (update: (turn: AskTurn) => AskTurn) =>
        setTurns((prev) => prev.map((turn) => (turn.id === id ? update(turn) : turn)))

      try {
        await streamCodeQaChat({
          messages,
          signal: controller.signal,
          onEvent: (event) => {
            if (!controller.signal.aborted) apply((turn) => applyCodeQaEvent(turn, event))
          },
        })
        // done/error 로 끝났으면 no-op, 종결 없이 EOF 면 끊긴 응답으로 기록
        if (!controller.signal.aborted) apply(finishIncomplete)
      } catch (error) {
        if (controller.signal.aborted) apply(finishAborted)
        else apply((turn) => finishError(turn, askErrorInfo(error)))
      } finally {
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [setTurns],
  )

  const abort = useCallback(() => {
    const controller = abortRef.current
    if (controller === null) return
    abortRef.current = null
    controller.abort()
    // fetch 가 reject 되기 전에 화면부터 정리한다 (busy 즉시 해제)
    setTurns((prev) => prev.map((turn) => (isActiveTurn(turn) ? finishAborted(turn) : turn)))
  }, [setTurns])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setTurns(() => [])
  }, [setTurns])

  const retry = useCallback(
    (turnId: number) => {
      if (abortRef.current !== null) return
      const target = turnsRef.current.find((turn) => turn.id === turnId)
      if (!target || target.status.kind !== 'error' || !target.status.retryable) return
      setTurns((prev) => prev.filter((turn) => turn.id !== turnId))
      void send(target.question)
    },
    [send, setTurns],
  )

  return { turns, busy: turns.some(isActiveTurn), send, abort, reset, retry }
}
