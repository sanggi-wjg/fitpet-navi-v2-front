import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { highlightMarkers } from '@/components/common/highlightMarkers'
import { cn } from '@/lib/utils'

const components: Components = {
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
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary-text hover:underline">
      {children}
    </a>
  ),
}

/** 섹션 본문 렌더 (읽기). 정본은 마크다운, 예제 마커는 하이라이트. */
export function MarkdownDoc({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div className={cn('prose-doc', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
