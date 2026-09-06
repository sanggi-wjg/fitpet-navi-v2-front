/** 채팅 입력의 Enter 판정에 필요한 만큼만 — React KeyboardEvent 와 구조적으로 호환 */
export interface SubmitKeyEvent {
  key: string
  shiftKey: boolean
  nativeEvent: { isComposing: boolean }
}

/** Enter 전송 — Shift+Enter 는 줄바꿈, 한글 IME 조합 중(isComposing)의 Enter 는 무시한다 */
export function isSubmitEnter(event: SubmitKeyEvent): boolean {
  return event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing
}
