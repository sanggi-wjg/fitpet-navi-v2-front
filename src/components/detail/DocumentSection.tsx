import { PenLine } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Callout } from '@/components/common/Callout'
import { MarkdownDoc } from '@/components/common/MarkdownDoc'
import { MarkerTextarea } from '@/components/common/MarkerTextarea'
import { Button } from '@/components/ui/button'
import { findForbiddenHeading } from '@/lib/markdown'

interface DocumentSectionProps {
  /** DOM id (스크롤 대상) */
  id: string
  /** 표시 이름 (백엔드 섹션명 그대로) */
  name: string
  body: string
  editing: boolean
  saving: boolean
  readOnly?: boolean
  required?: boolean
  /** 저장이 409 로 실패함 — 편집기에 최신 본문 안내를 띄운다 (`body` 는 재조회된 최신 값) */
  conflict?: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (body: string) => void
  /** 충돌 안내를 닫는다 (최신 내용 반영 또는 내 내용 유지) */
  onResolveConflict?: () => void
  /** 헤더 우측 상태 pill (제안 대기 · 만료 · 적용됨) */
  badge?: ReactNode
  /** 본문 자리에 대신 그릴 내용 — 제안 블록. 편집 중에는 편집기가 우선한다 */
  content?: ReactNode
  /** 편집 버튼 숨김 — 대기 중인 제안이 있으면 먼저 처리하게 한다 */
  hideEdit?: boolean
}

/**
 * 문서 섹션 — 읽기(마크다운 렌더) / 편집(섹션 단위 textarea).
 * 편집 단위 = 섹션 (DESIGN.md D.2 `section-editing`). 식별은 섹션 id 로, 이름은 표시용.
 */
export function DocumentSection({
  id,
  name,
  body,
  editing,
  saving,
  readOnly = false,
  required = false,
  conflict = false,
  onEdit,
  onCancel,
  onSave,
  onResolveConflict,
  badge,
  content,
  hideEdit = false,
}: DocumentSectionProps) {
  const title = name
  return (
    <section id={id} className="group/section flex scroll-mt-24 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-ink text-[16px] leading-[1.4] font-medium">
          {title}
          {required && <span className="text-muted ml-1.5 text-[12px] font-medium">필수</span>}
        </h2>
        <div className="flex items-center gap-2">
          {badge}
          {editing ? (
            <span className="text-primary-text text-[12px] font-medium">편집 중</span>
          ) : (
            !readOnly &&
            !hideEdit && (
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
      </div>
      {editing ? (
        <SectionEditor
          label={`${title} 편집`}
          initialBody={body}
          saving={saving}
          conflict={conflict}
          onCancel={onCancel}
          onSave={onSave}
          onResolveConflict={onResolveConflict}
        />
      ) : (
        (content ?? <MarkdownDoc markdown={body} />)
      )}
    </section>
  )
}

interface SectionEditorProps {
  label: string
  initialBody: string
  saving: boolean
  conflict: boolean
  onCancel: () => void
  onSave: (body: string) => void
  onResolveConflict?: () => void
}

/**
 * 편집 모드에 들어올 때 마운트되어 초기값을 받는다 (effect 없이 리셋).
 * 409 충돌 시 draft 는 그대로 두고, 최신 본문(`initialBody`)을 불러올지 내 내용을 유지할지 사용자가 고른다 —
 * 안내 없이 새 version 으로 다시 저장하면 상대 변경을 덮어쓰기 때문.
 */
function SectionEditor({
  label,
  initialBody,
  saving,
  conflict,
  onCancel,
  onSave,
  onResolveConflict,
}: SectionEditorProps) {
  const [draft, setDraft] = useState(initialBody)
  const dirty = draft.trim() !== initialBody.trim()
  const forbidden = findForbiddenHeading(draft)
  const canSave = dirty && !forbidden && !saving

  return (
    <div className="flex flex-col gap-2.5">
      {conflict && (
        <Callout variant="warning" title="다른 사용자가 이 섹션을 먼저 수정했습니다">
          <span>
            최신 내용을 불러오면 지금 작성한 내용은 사라지고, 그대로 저장하면 상대 변경을
            덮어씁니다.
          </span>
          <div className="mt-1.5 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDraft(initialBody)
                onResolveConflict?.()
              }}
            >
              최신 내용 불러오기
            </Button>
            <Button size="sm" variant="ghost" onClick={onResolveConflict}>
              내 내용 유지
            </Button>
          </div>
        </Callout>
      )}
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
