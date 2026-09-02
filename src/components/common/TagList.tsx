import { cn } from '@/lib/utils'

interface TagListProps {
  tags: string[]
  className?: string
}

/** 태그 pill — 20px · surface-card · 12/500 muted. 색으로 구분하지 않는다. */
export function TagList({ tags, className }: TagListProps) {
  if (tags.length === 0) return null
  return (
    <ul className={cn('flex flex-wrap gap-1', className)} aria-label="태그">
      {tags.map((tag) => (
        <li
          key={tag}
          className="bg-surface-card text-muted inline-flex h-5 max-w-full items-center truncate rounded-full px-2 text-[12px] leading-none font-medium"
        >
          {tag}
        </li>
      ))}
    </ul>
  )
}
