import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { highlightMarkers } from '@/components/common/highlightMarkers'
import { cn } from '@/lib/utils'

const link: Components['a'] = ({ children, href }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-primary-text hover:underline">
    {children}
  </a>
)

/** 문서(섹션 본문) — 예제 마커 하이라이트 포함 */
const docComponents: Components = {
  p: ({ children }) => <p>{highlightMarkers(children)}</p>,
  li: ({ children }) => <li>{highlightMarkers(children)}</li>,
  h3: ({ children }) => (
    <h3 className="text-ink mt-3 mb-1 text-[15px] font-medium">{highlightMarkers(children)}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-ink mt-3 mb-1 text-[15px] font-medium">{highlightMarkers(children)}</h4>
  ),
  code: ({ children, className }) => {
    const isBlock = typeof className === 'string' || String(children).includes('\n')
    return <code className={className}>{highlightMarkers(children, !isBlock)}</code>
  },
  a: link,
}

/** 채팅 답변(구현 확인) — 마커 하이라이트 없음("(예: …)"가 흔한 LLM 문장), 헤딩은 한 단계(h3) 14/500 */
const chatHeading: Components['h3'] = ({ children }) => (
  <h3 className="text-ink mt-3 mb-1 text-[14px] font-medium">{children}</h3>
)
const chatComponents: Components = {
  h1: chatHeading,
  h2: chatHeading,
  h3: chatHeading,
  h4: chatHeading,
  a: link,
}

interface MarkdownDocProps {
  markdown: string
  className?: string
  /** doc = 섹션 본문 16px(기본) · chat = 구현 확인 답변 14px (DESIGN.md D.4 `ask-answer`) */
  variant?: 'doc' | 'chat'
}

/** 마크다운 렌더 (읽기). 정본은 마크다운, 문서 변형은 예제 마커를 하이라이트한다. */
export function MarkdownDoc({ markdown, className, variant = 'doc' }: MarkdownDocProps) {
  return (
    <div className={cn('prose-doc', variant === 'chat' && 'prose-chat', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={variant === 'chat' ? chatComponents : docComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
