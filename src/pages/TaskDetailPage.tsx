import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Callout } from '@/components/common/Callout'
import { AnalyzeWarningDialog } from '@/components/detail/AnalyzeWarningDialog'
import { DocumentSection } from '@/components/detail/DocumentSection'
import { NaviPanel } from '@/components/detail/NaviPanel'
import { TaskHeader } from '@/components/detail/TaskHeader'
import { UndecidedSection } from '@/components/detail/UndecidedSection'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { useTask, useUpdateSection } from '@/hooks/useTasks'
import { gateOf } from '@/lib/gate'
import { PREAMBLE_KEY, collectMarkers, parseSections, splitMarkers } from '@/lib/markdown'
import { STATUS_LABEL } from '@/lib/task-config'

const REQUIRED_HINT = /^(세부사항|예외 조건)/

const sectionDomId = (key: string) => `section-${key.replace(/[^\w-]/g, '_')}`

export function TaskDetailPage() {
  const { taskId } = useParams()
  const id = Number(taskId)
  const validId = Number.isInteger(id) && id > 0
  const { task, isLoading, isError } = useTask(validId ? id : undefined)
  const { updateSection, isPending: saving } = useUpdateSection()

  /** 편집 중인 블록 — 섹션 key 또는 PREAMBLE_KEY */
  const [editing, setEditing] = useState<string | null>(null)
  const [analyzeOpen, setAnalyzeOpen] = useState(false)

  const doc = useMemo(() => (task ? parseSections(task.content) : null), [task])
  const gate = task ? gateOf(task) : null
  const markers = useMemo(() => (task ? collectMarkers(task.content) : []), [task])
  const readOnly = task?.readOnly ?? false

  const runAnalysis = () => {
    setAnalyzeOpen(false)
    toast.info('분석 API가 아직 연결되지 않았습니다', {
      description: '범위 2에서 백엔드 분석 엔드포인트와 함께 연결됩니다.',
    })
  }

  const startAnalysis = () => {
    if (gate && gate.markerCount > 0) setAnalyzeOpen(true)
    else runAnalysis()
  }

  /** 첫 마커가 있는 블록(헤딩 앞 텍스트 포함)을 편집 모드로 열고 스크롤한다 */
  const fixFirstMarker = () => {
    setAnalyzeOpen(false)
    if (!doc) return
    const hasMarker = (text: string) => splitMarkers(text).some((run) => run.marker)
    const key = hasMarker(doc.preamble)
      ? PREAMBLE_KEY
      : doc.sections.find((section) => hasMarker(section.body))?.key
    if (!key) return
    setEditing(key)
    requestAnimationFrame(() =>
      document.getElementById(sectionDomId(key))?.scrollIntoView({ block: 'start' }),
    )
  }

  const save = async (target: number | typeof PREAMBLE_KEY, body: string) => {
    if (!task) return
    try {
      await updateSection({ task, target, body })
      setEditing(null)
      toast.success('저장했습니다')
    } catch {
      toast.error('저장하지 못했습니다', { description: '네트워크를 확인하고 다시 시도해 주세요.' })
    }
  }

  return (
    <>
      <Topbar
        left={
          <>
            <Link to="/board" className="text-muted hover:text-ink">
              업무 보드
            </Link>
            <ChevronRight className="text-muted size-3.5" strokeWidth={1.75} />
            <span className="text-ink truncate">{task?.title ?? '…'}</span>
          </>
        }
        right={
          task &&
          !readOnly && (
            <Button size="lg" className="font-semibold" onClick={startAnalysis}>
              분석 시작
            </Button>
          )
        }
      />

      <div className="flex flex-1">
        <main className="min-w-0 flex-1 px-10 py-8">
          <div className="flex max-w-[760px] flex-col gap-7">
            {!validId && (
              <Callout variant="error" title="잘못된 태스크 주소입니다">
                <Link to="/board" className="underline">
                  보드로 돌아가기
                </Link>
              </Callout>
            )}
            {validId && isError && (
              <Callout variant="error" title="태스크를 불러오지 못했습니다">
                <Link to="/board" className="underline">
                  보드로 돌아가기
                </Link>
              </Callout>
            )}
            {validId && isLoading && <div className="text-muted text-[13px]">불러오는 중…</div>}

            {task && gate && doc && (
              <>
                {readOnly && (
                  <Callout
                    variant="info"
                    title={`${task.archived ? '아카이브된' : STATUS_LABEL[task.status]} 태스크입니다 — 읽기 전용`}
                  >
                    보드에 표시되지 않으며 편집·분석을 할 수 없습니다.
                  </Callout>
                )}

                <TaskHeader task={task} gate={gate} />

                <div className="flex flex-col gap-6">
                  {doc.preamble && (
                    <DocumentSection
                      id={sectionDomId(PREAMBLE_KEY)}
                      name="본문"
                      body={doc.preamble}
                      editing={editing === PREAMBLE_KEY}
                      saving={saving && editing === PREAMBLE_KEY}
                      readOnly={readOnly}
                      onEdit={() => setEditing(PREAMBLE_KEY)}
                      onCancel={() => setEditing(null)}
                      onSave={(body) => void save(PREAMBLE_KEY, body)}
                    />
                  )}
                  {doc.sections.map((section) => (
                    <DocumentSection
                      key={section.key}
                      id={sectionDomId(section.key)}
                      name={section.name}
                      body={section.body}
                      required={REQUIRED_HINT.test(section.name)}
                      editing={editing === section.key}
                      saving={saving && editing === section.key}
                      readOnly={readOnly}
                      onEdit={() => setEditing(section.key)}
                      onCancel={() => setEditing(null)}
                      onSave={(body) => void save(section.index, body)}
                    />
                  ))}
                  {doc.sections.length === 0 && !doc.preamble && (
                    <div className="text-muted text-[13px]">본문이 비어 있습니다.</div>
                  )}
                </div>

                <UndecidedSection />
              </>
            )}
          </div>
        </main>
        <NaviPanel />
      </div>

      <AnalyzeWarningDialog
        open={analyzeOpen}
        onOpenChange={setAnalyzeOpen}
        markers={markers}
        onProceed={runAnalysis}
        onFix={fixFirstMarker}
      />
    </>
  )
}
