import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { MetaButton } from '@/components/common/MetaButton'
import { TagList } from '@/components/common/TagList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { parseTags } from '@/lib/api-mapping'

interface TagsEditorProps {
  tags: string[]
  onSave: (tags: string[]) => Promise<unknown>
  disabled?: boolean
}

/** 상세 헤더 메타 행의 태그 — 팝오버에서 쉼표 구분으로 편집 */
export function TagsEditor({ tags, onSave, disabled = false }: TagsEditorProps) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<MetaButton aria-label="태그 편집" />} disabled={disabled}>
        <span>태그</span>
        <span className="text-ink max-w-[280px] truncate">
          {tags.length > 0 ? tags.join(', ') : '없음'}
        </span>
        <ChevronDown className="size-3" strokeWidth={1.75} aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] gap-3 p-3">
        <TagsForm
          initial={tags}
          onCancel={() => setOpen(false)}
          onSave={async (next) => {
            await onSave(next)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

interface TagsFormProps {
  initial: string[]
  onCancel: () => void
  onSave: (tags: string[]) => Promise<void>
}

/** 팝오버가 열릴 때 마운트되어 초기값을 받는다 (effect 없이 리셋) */
function TagsForm({ initial, onCancel, onSave }: TagsFormProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(initial.join(', '))
  const [saving, setSaving] = useState(false)
  const parsed = parseTags(draft)
  const dirty = parsed.join(',') !== initial.join(',')

  const submit = async () => {
    if (!dirty || saving) return
    setSaving(true)
    try {
      await onSave(parsed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-ink text-[13px] font-medium">
          태그
        </label>
        <Input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void submit()
            }
          }}
          placeholder="적립금, 배치"
          className="bg-surface-soft h-9 text-[14px]"
          disabled={saving}
        />
      </div>
      {parsed.length > 0 ? (
        <TagList tags={parsed} />
      ) : (
        <span className="text-muted text-[12px]">쉼표로 구분합니다</span>
      )}
      <div className="flex items-center justify-end gap-1.5 pt-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="text-[13px]"
          onClick={onCancel}
          disabled={saving}
        >
          취소
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-[13px]"
          onClick={() => void submit()}
          disabled={!dirty || saving}
        >
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  )
}
