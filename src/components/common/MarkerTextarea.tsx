import { useRef, type TextareaHTMLAttributes } from 'react'
import { splitMarkers } from '@/lib/markdown'
import { cn } from '@/lib/utils'

interface MarkerTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'className'
> {
  value: string
  onChange: (value: string) => void
  minHeight?: number
  className?: string
}

/** backdrop 과 textarea 가 글자 위치를 공유하려면 서체·여백이 완전히 같아야 한다 */
const TYPOGRAPHY =
  'px-[22px] py-5 font-sans text-[16px] leading-[1.7] break-words whitespace-pre-wrap'

/**
 * `(예: …)` 마커를 하이라이트하는 마크다운 편집기.
 * textarea 글자는 투명하게 두고, 같은 서체·여백의 backdrop 이 하이라이트된 텍스트를 그린다.
 */
export function MarkerTextarea({
  value,
  onChange,
  minHeight = 320,
  className,
  ...rest
}: MarkerTextareaProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const runs = splitMarkers(value)

  return (
    <div
      className={cn(
        'border-hairline bg-surface-soft focus-within:border-primary relative rounded-lg border transition-colors focus-within:shadow-[0_0_0_3px_var(--color-primary-wash)]',
        className,
      )}
      style={{ minHeight }}
    >
      <div
        ref={backdropRef}
        aria-hidden
        className={cn('text-body pointer-events-none absolute inset-0 overflow-hidden', TYPOGRAPHY)}
      >
        {runs.map((run, index) =>
          run.marker ? (
            <mark key={index} className="marker-inline">
              {run.text}
            </mark>
          ) : (
            <span key={index}>{run.text}</span>
          ),
        )}
        {'​'}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (backdropRef.current) backdropRef.current.scrollTop = event.currentTarget.scrollTop
        }}
        spellCheck={false}
        className={cn(
          'caret-ink relative block field-sizing-content w-full resize-none bg-transparent text-transparent outline-none',
          TYPOGRAPHY,
        )}
        style={{ minHeight }}
        {...rest}
      />
    </div>
  )
}
