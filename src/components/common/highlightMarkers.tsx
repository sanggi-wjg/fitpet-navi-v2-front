import { Children, type ReactNode } from 'react'
import { splitMarkers } from '@/lib/markdown'

/** 문자열 children 안의 `(예: …)` 를 하이라이트한다. 요소 children 은 그대로 둔다. */
export function highlightMarkers(children: ReactNode, inline = false): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== 'string') return child
    return splitMarkers(child).map((run, index) =>
      run.marker ? (
        <mark key={index} className={inline ? 'marker-inline' : 'marker-highlight'}>
          {run.text}
        </mark>
      ) : (
        run.text
      ),
    )
  })
}
