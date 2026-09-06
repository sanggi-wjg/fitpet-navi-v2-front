import { ArrowUp, Square } from 'lucide-react'
import { useEffect, useRef, useState, type Ref } from 'react'
import { Button } from '@/components/ui/button'
import { isSubmitEnter } from '@/lib/keyboard'
import { cn } from '@/lib/utils'

interface AskInputProps {
  busy: boolean
  onSend: (text: string) => void
  onAbort: () => void
  /** 페이지가 "새 대화" 뒤 포커스를 돌려주기 위한 textarea ref */
  ref?: Ref<HTMLTextAreaElement>
}

/**
 * 하단 고정 입력 (DESIGN.md D.4 `ask-input`). 이 화면의 유일한 코랄 채움은 전송 버튼이고,
 * 진행 중에는 같은 자리가 중단 버튼이 된다. textarea 는 항상 마운트해 두고 busy 면 disabled.
 */
export function AskInput({ busy, onSend, onAbort, ref }: AskInputProps) {
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const wasBusy = useRef(busy)

  // 응답이 끝나거나 중단되면 입력으로 포커스를 돌려준다 (autoFocus 는 쓰지 않는다).
  // 사용자가 다른 곳(탭 · 새 대화 · 답변 링크)에 포커스를 두고 있으면 빼앗지 않는다 — 중단 버튼이 사라진 뒤에는 body 다.
  useEffect(() => {
    const idle = document.activeElement === null || document.activeElement === document.body
    if (wasBusy.current && !busy && idle) textareaRef.current?.focus()
    wasBusy.current = busy
  }, [busy])

  const setRefs = (node: HTMLTextAreaElement | null) => {
    textareaRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  const submit = () => {
    const text = draft.trim()
    if (text === '' || busy) return
    setDraft('')
    onSend(text)
  }
  const canSend = !busy && draft.trim().length > 0

  return (
    <div
      className={cn(
        'border-hairline bg-surface-soft focus-within:border-primary flex min-h-14 items-end gap-2.5 rounded-lg border py-2.5 pr-2.5 pl-4 transition-colors',
        busy && 'opacity-85',
      )}
    >
      <textarea
        ref={setRefs}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (isSubmitEnter(event)) {
            event.preventDefault()
            submit()
          }
        }}
        placeholder={
          busy ? '응답이 끝나면 다시 질문할 수 있습니다' : '구현이 궁금한 점을 물어보세요'
        }
        aria-label="구현에 대해 질문"
        rows={1}
        disabled={busy}
        className="text-ink placeholder:text-muted-soft field-sizing-content max-h-40 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-[1.45] outline-none"
      />
      {busy ? (
        <Button size="icon" className="rounded-full" aria-label="응답 중단" onClick={onAbort}>
          <Square className="size-3" strokeWidth={2} fill="currentColor" />
        </Button>
      ) : (
        <Button
          size="icon"
          className="disabled:bg-primary-disabled disabled:text-muted rounded-full disabled:opacity-100"
          aria-label="전송"
          disabled={!canSend}
          onClick={submit}
        >
          <ArrowUp className="size-3.5" strokeWidth={2} />
        </Button>
      )}
    </div>
  )
}
