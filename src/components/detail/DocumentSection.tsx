import { PenLine } from 'lucide-react'
import { useState } from 'react'
import { MarkdownDoc } from '@/components/common/MarkdownDoc'
import { MarkerTextarea } from '@/components/common/MarkerTextarea'
import { Button } from '@/components/ui/button'
import { findForbiddenHeading, sectionDisplayName } from '@/lib/markdown'

interface DocumentSectionProps {
  /** DOM id (스크롤 대상) */
  id: string
  /** 표시 이름 — 헤딩 콜론은 여기서 뗀다 */
  name: string
  body: string
  editing: boolean
  saving: boolean
  readOnly?: boolean
  required?: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (body: string) => void
}

/**
 * 문서 섹션 — 읽기(마크다운 렌더) / 편집(섹션 단위 textarea).
 * 편집 단위 = 제안 단위 = 섹션 (DESIGN.md D.2 `section-editing`). 식별은 인덱스로, 이름은 표시용.
 */
export function DocumentSection({
  id,
  name,
  body,
  editing,
  saving,
  readOnly = false,
  required = false,
  onEdit,
  onCancel,
  onSave,
}: DocumentSectionProps) {
  const title = sectionDisplayName(name)
  return (
    <section id={id} className="group/section flex scroll-mt-24 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-ink text-[16px] leading-[1.4] font-medium">
          {title}
          {required && <span className="text-muted ml-1.5 text-[12px] font-medium">필수</span>}
        </h2>
        {editing ? (
          <span className="text-primary-text text-[12px] font-medium">편집 중</span>
        ) : (
          !readOnly && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="text-muted h-7 gap-1 px-2 text-[12px] opacity-0 transition-opacity group-hover/section:opacity-100 focus-visible:opacity-100"
            >
              <PenLine className="size-3.5" strokeWidth={1.75} />
              편집
            </Button>
          )
        )}
      </div>
      {editing ? (
        <SectionEditor
          label={`${title} 편집`}
          initialBody={body}
          saving={saving}
          onCancel={onCancel}
          onSave={onSave}
        />
      ) : (
        <MarkdownDoc markdown={body} />
      )}
    </section>
  )
}

interface SectionEditorProps {
  label: string
  initialBody: string
  saving: boolean
  onCancel: () => void
  onSave: (body: string) => void
}

/** 편집 모드에 들어올 때 마운트되어 초기값을 받는다 (effect 없이 리셋) */
function SectionEditor({ label, initialBody, saving, onCancel, onSave }: SectionEditorProps) {
  const [draft, setDraft] = useState(initialBody)
  const dirty = draft.trim() !== initialBody.trim()
  const forbidden = findForbiddenHeading(draft)
  const canSave = dirty && !forbidden && !saving

  return (
    <div className="flex flex-col gap-2.5">
      <MarkerTextarea
        value={draft}
        onChange={setDraft}
        minHeight={140}
        className="bg-canvas"
        aria-label={label}
        aria-invalid={forbidden !== null}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSave) onSave(draft)
        }}
      />
      <div className="flex items-center justify-between gap-4">
        {forbidden ? (
          <span className="text-error-deep text-[12px] font-medium">
            섹션 헤딩(<span className="font-mono">## </span>)은 본문에 넣을 수 없습니다 — 섹션
            구성은 템플릿이 정합니다. 소제목은 <span className="font-mono">###</span> 을 쓰세요.
          </span>
        ) : (
          <span className="text-muted text-[12px]">이 섹션만 저장됩니다 · 마크다운 · ⌘↵ 저장</span>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="lg"
            className="px-3 text-[14px]"
            onClick={onCancel}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="px-3.5 text-[14px]"
            onClick={() => onSave(draft)}
            disabled={!canSave}
          >
            {saving ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}
