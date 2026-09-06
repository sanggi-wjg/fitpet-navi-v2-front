import { useState } from 'react'
import { ASK_SUGGESTION_GROUPS } from '@/lib/ask-config'
import { cn } from '@/lib/utils'

interface AskEmptyStateProps {
  /** 예시 질문 클릭 — 그대로 전송된다 */
  onPick: (question: string) => void
  disabled: boolean
}

/**
 * 첫 진입 — 타이틀 · 안내 · 카테고리 탭 + 예시 질문 (DESIGN.md D.4 `ask-empty` · `ask-suggestions`).
 * 탭은 전송하지 않고 아래 문항만 바꾼다. 선택은 컴포넌트 로컬이라 새 대화 때마다 첫 카테고리로 돌아온다.
 */
export function AskEmptyState({ onPick, disabled }: AskEmptyStateProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = ASK_SUGGESTION_GROUPS[activeIndex] ?? ASK_SUGGESTION_GROUPS[0]!

  return (
    <div className="flex flex-col pt-28">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[28px] leading-[1.2] tracking-[-0.3px]">구현 확인</h1>
        <p className="text-body text-[14px] leading-[1.55]">
          코드를 직접 읽고 지금 구현이 어떻게 되어 있는지 답합니다. 어느 서비스의 코드인지는 Navi 가
          고릅니다.
        </p>
        <p className="text-muted text-[13px] leading-[1.45]">
          대화는 저장되지 않습니다. 새로 고치면 사라집니다.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-14">
        <span className="kicker">이런 질문을 할 수 있습니다</span>
        <div role="group" aria-label="질문 분류" className="flex items-center gap-1">
          {ASK_SUGGESTION_GROUPS.map((group, index) => (
            <button
              key={group.category}
              type="button"
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'inline-flex h-8 items-center rounded-md px-3.5 text-[13px] font-medium transition-colors',
                index === activeIndex
                  ? 'bg-surface-card text-ink'
                  : 'text-muted hover:bg-surface-soft hover:text-ink',
              )}
            >
              {group.category}
            </button>
          ))}
        </div>
        <div role="group" aria-label="예시 질문" className="flex flex-wrap gap-1.5">
          {active.questions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={disabled}
              onClick={() => onPick(question)}
              className="border-hairline bg-canvas text-body hover:bg-surface-soft inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-60"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
