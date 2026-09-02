import { cn } from '@/lib/utils'
import type { DiffLine } from '@/types/proposal'

const DELETED =
  'bg-error-wash text-error-deep rounded-[4px] px-0.5 line-through decoration-error-deep/60'
const INSERTED = 'bg-success-wash text-success-deep rounded-[4px] px-0.5 font-medium'

/**
 * 서버(LCS)가 계산한 diff 렌더 — 프론트는 런을 그리기만 한다 (DESIGN.md D.2 `section-proposal`).
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
        const empty = line.text.length === 0
        return (
          <p key={index} className="whitespace-pre-wrap">
            {line.type === 'equal' ? (
              empty ? (
                ' '
              ) : (
                line.text
              )
            ) : (
              <span
                className={cn(line.type === 'delete' ? DELETED : INSERTED, 'box-decoration-clone')}
              >
                {empty ? ' ' : line.text}
              </span>
            )}
          </p>
        )
      })}
    </div>
  )
}
