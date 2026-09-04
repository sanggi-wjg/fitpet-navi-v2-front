import type { DiffLine } from '@/lib/diff'
import { cn } from '@/lib/utils'

const DELETED =
  'bg-error-wash text-error-deep rounded-xs px-0.5 line-through decoration-error-deep/60'
const INSERTED = 'bg-success-wash text-success-deep rounded-xs px-0.5 font-medium'

/**
 * 제안 diff 렌더 (DESIGN.md D.2 `section-proposal`) — 계산은 `src/lib/diff.ts`.
 * 삭제 = 취소선 + error-wash, 추가 = success-wash + 500. changed 줄만 어절 단위.
 */
export function DiffView({ diff, className }: { diff: DiffLine[]; className?: string }) {
  return (
    <div className={cn('text-body flex flex-col text-[15px] leading-[1.6]', className)}>
      {diff.map((line, index) => {
        if (line.type === 'changed') {
          return (
            <p key={index} className="whitespace-pre-wrap">
              {line.parts.map((part, partIndex) =>
                part.op === 'equal' ? (
                  <span key={partIndex}>{part.text}</span>
                ) : (
                  <span key={partIndex} className={part.op === 'delete' ? DELETED : INSERTED}>
                    {part.text}
                  </span>
                ),
              )}
            </p>
          )
        }
        const text = line.text.length === 0 ? ' ' : line.text
        return (
          <p key={index} className="whitespace-pre-wrap">
            {line.type === 'equal' ? (
              text
            ) : (
              <span
                className={cn(line.type === 'delete' ? DELETED : INSERTED, 'box-decoration-clone')}
              >
                {text}
              </span>
            )}
          </p>
        )
      })}
    </div>
  )
}
