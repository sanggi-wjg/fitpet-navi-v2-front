import { formatElapsed } from '@/lib/format'
import type { AskMeta as AskMetaModel } from '@/types/ask'

/** 답변 아래 한 줄 — 확인한 레포 @ 커밋 · 탐색 횟수 · 소요 시간 (DESIGN.md D.4 `ask-meta`) */
export function AskMeta({ meta }: { meta: AskMetaModel }) {
  return (
    <p className="text-muted px-0.5 text-[12px]">
      {meta.repos.length > 0 && (
        <>
          확인한 레포{' '}
          {meta.repos.map((repo, index) => (
            <span key={repo.name}>
              <span className="font-mono">
                {repo.commit ? `${repo.name} @ ${repo.commit}` : repo.name}
              </span>
              {index < meta.repos.length - 1 && ', '}
            </span>
          ))}
          {' · '}
        </>
      )}
      {meta.iterations}회 탐색 · {formatElapsed(meta.elapsedMs)}
    </p>
  )
}
