import { useState } from 'react'
import { toast } from 'sonner'
import { Callout } from '@/components/common/Callout'
import { MarkdownDoc } from '@/components/common/MarkdownDoc'
import { TypeTile } from '@/components/task/TypeTile'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateTask, useTemplates } from '@/hooks/useTasks'
import { errorDescription } from '@/lib/api-error'
import type { TemplateSection } from '@/lib/api-mapping'
import { countMarkers } from '@/lib/markdown'
import { TASK_TYPES, TASK_TYPE_ORDER } from '@/lib/task-config'
import type { Task, TaskType } from '@/types/task'

interface TaskCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (task: Task) => void
}

/**
 * 태스크 생성 (spec 범위 1). 유형을 고르면 그 유형의 섹션 템플릿을 미리 보여주고,
 * 섹션은 백엔드가 템플릿으로 만든다 — 본문 편집은 생성 후 상세 화면에서.
 * 생성과 분석은 별개 단계 — 여기서는 Backlog 에 만들기만 한다.
 */
export function TaskCreateDialog({ open, onOpenChange, onCreated }: TaskCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="text-[22px] leading-[1.3] font-medium">새 태스크</DialogTitle>
          <DialogDescription className="sr-only">
            유형을 고르면 그 유형의 섹션이 만들어집니다. 예제 값은 (예: …) 로 표시되며 생성 후 상세
            화면에서 편집합니다.
          </DialogDescription>
        </DialogHeader>
        {/* 열릴 때마다 새로 마운트되어 초기 상태가 리셋된다 */}
        {open && <CreateTaskForm onClose={() => onOpenChange(false)} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  )
}

const DEFAULT_TYPE: TaskType = 'new_feature'

interface CreateTaskFormProps {
  onClose: () => void
  onCreated?: (task: Task) => void
}

function CreateTaskForm({ onClose, onCreated }: CreateTaskFormProps) {
  const {
    templates,
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = useTemplates()
  const { createTask, isPending } = useCreateTask()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>(DEFAULT_TYPE)

  const sections = templates[type] ?? []
  const markerCount = sections.reduce((sum, section) => sum + countMarkers(section.body), 0)
  const canSubmit = title.trim().length > 0 && !isPending && !templatesError

  const submit = async () => {
    if (!canSubmit) return
    try {
      const created = await createTask({ title, type })
      toast.success('태스크를 만들었습니다', { description: 'Backlog에 추가되었습니다.' })
      onClose()
      onCreated?.(created)
    } catch (error) {
      toast.error('태스크를 만들지 못했습니다', { description: errorDescription(error) })
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-title" className="text-muted text-[13px] font-medium">
          제목
        </label>
        <Input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="예: 생일 유저 적립금 자동 발급 배치"
          className="bg-surface-soft h-10 px-3.5 text-[16px] md:text-[16px]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-muted text-[13px] font-medium">유형</span>
        <div role="radiogroup" aria-label="태스크 유형" className="grid grid-cols-4 gap-3">
          {TASK_TYPE_ORDER.map((item) => (
            <TypeTile key={item} type={item} selected={item === type} onSelect={setType} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-muted text-[13px] font-medium">섹션 미리보기</span>
          <span className="text-muted text-[12px]">
            {TASK_TYPES[type].label} 템플릿 · 예제 값은 <span className="font-mono">(예: …)</span>{' '}
            로 표시됩니다
          </span>
        </div>
        {templatesError ? (
          <Callout variant="error" title="템플릿을 불러오지 못했습니다" className="min-h-[120px]">
            <div className="mt-1.5">
              <Button size="sm" variant="outline" onClick={() => void refetchTemplates()}>
                다시 시도
              </Button>
            </div>
          </Callout>
        ) : templatesLoading && sections.length === 0 ? (
          <div className="border-hairline bg-surface-soft text-muted flex min-h-[320px] items-center justify-center rounded-lg border text-[13px]">
            템플릿을 불러오는 중…
          </div>
        ) : (
          <TemplatePreview sections={sections} />
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-muted text-[13px]">
          Backlog에 생성됩니다 · 내용은 생성 후 상세 화면에서 편집합니다
          {markerCount > 0 &&
            ` · 예제 텍스트 ${markerCount}건은 분석 시작 전에 실제 값으로 바꿔 주세요`}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 px-4 text-[14px]" onClick={onClose}>
            취소
          </Button>
          <Button
            className="h-10 px-4 text-[14px] font-semibold"
            disabled={!canSubmit}
            onClick={() => void submit()}
          >
            {isPending ? '만드는 중…' : '태스크 생성'}
          </Button>
        </div>
      </div>
    </>
  )
}

/** 선택한 유형의 섹션 템플릿 — 읽기 전용. 섹션 구성은 백엔드가 정한다. */
function TemplatePreview({ sections }: { sections: TemplateSection[] }) {
  return (
    <div
      role="region"
      aria-label="섹션 미리보기"
      className="border-hairline bg-surface-soft flex max-h-[320px] min-h-[160px] flex-col gap-5 overflow-y-auto rounded-lg border px-4 py-3.5"
    >
      {sections.length === 0 && (
        <span className="text-muted text-[13px]">이 유형의 템플릿이 없습니다.</span>
      )}
      {sections.map((section) => (
        <section key={`${section.displayOrder}-${section.name}`} className="flex flex-col gap-1">
          <h3 className="text-ink text-[14px] leading-[1.4] font-medium">
            {section.name}
            {section.isRequired && (
              <span className="text-muted ml-1.5 text-[12px] font-medium">필수</span>
            )}
          </h3>
          <MarkdownDoc markdown={section.body} />
        </section>
      ))}
    </div>
  )
}
