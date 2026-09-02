import { Ban, ChevronRight, Ellipsis } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CancelTaskDialog } from '@/components/board/CancelTaskDialog'
import { Callout } from '@/components/common/Callout'
import { AnalyzeWarningDialog } from '@/components/detail/AnalyzeWarningDialog'
import { DetailSkeleton } from '@/components/detail/DetailSkeleton'
import { DocumentSection } from '@/components/detail/DocumentSection'
import { NaviPanel } from '@/components/detail/NaviPanel'
import { ProposalBlock } from '@/components/detail/ProposalBlock'
import { TaskHeader } from '@/components/detail/TaskHeader'
import { UndecidedSection } from '@/components/detail/UndecidedSection'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNaviSession } from '@/hooks/useProposals'
import { useSetTaskStatus, useTask, useUpdateSection, useUpdateTaskMeta } from '@/hooks/useTasks'
import { gateOf } from '@/lib/gate'
import {
  PREAMBLE_KEY,
  collectMarkers,
  parseSections,
  sectionDisplayName,
  splitMarkers,
  type Section,
} from '@/lib/markdown'
import { matchProposalSection } from '@/lib/proposal-mapping'
import { STATUS_LABEL } from '@/lib/task-config'
import type { Proposal } from '@/types/proposal'
import type { Task } from '@/types/task'

const REQUIRED_HINT = /^(세부사항|예외 조건)/
const NETWORK_HINT = '네트워크를 확인하고 다시 시도해 주세요.'
const FIELD_CARDS_ID = 'field-proposals'

const sectionDomId = (key: string) => `section-${key.replace(/[^\w-]/g, '_')}`

const scrollToId = (id: string) =>
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))

export function TaskDetailPage() {
  const { taskId } = useParams()
  const id = Number(taskId)
  const validId = Number.isInteger(id) && id > 0
  const { task, isLoading, isError, refetch } = useTask(validId ? id : undefined)
  const { updateSection, isPending: saving } = useUpdateSection()
  const { updateMeta, isPending: metaPending } = useUpdateTaskMeta()
  const { setTaskStatus, isPending: statusPending } = useSetTaskStatus()
  const navi = useNaviSession(task)

  /** 편집 중인 블록 — 섹션 key 또는 PREAMBLE_KEY */
  const [editing, setEditing] = useState<string | null>(null)
  const [analyzeOpen, setAnalyzeOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Task | null>(null)

  const doc = useMemo(() => (task ? parseSections(task.content) : null), [task])
  const gate = task ? gateOf(task) : null
  const markers = useMemo(() => (task ? collectMarkers(task.content) : []), [task])
  const readOnly = task?.readOnly ?? false

  const regeneratingId = navi.busy?.kind === 'reject' ? navi.busy.proposalId : null

  /** 문서에 얹을 제안 — pending · 방금 만료됨(배너) · 거부 직후(재제안 대기) */
  const docProposals = useMemo(
    () =>
      readOnly
        ? []
        : navi.proposals.filter(
            (proposal) =>
              proposal.status === 'pending' ||
              proposal.id === regeneratingId ||
              (proposal.status === 'stale' && navi.staleNotices[proposal.id] !== undefined),
          ),
    [navi.proposals, navi.staleNotices, regeneratingId, readOnly],
  )

  /** 섹션 key → 표시할 제안 (최신 우선) */
  const sectionProposals = useMemo(() => {
    const map = new Map<string, Proposal>()
    if (!doc) return map
    for (const proposal of docProposals) {
      if (proposal.tool !== 'replace_section') continue
      const section = matchProposalSection(doc.sections, proposal.section)
      if (section && !map.has(section.key)) map.set(section.key, proposal)
    }
    return map
  }, [docProposals, doc])

  /** 메타 필드 제안 (필드당 최신 1개) — 문서 상단 카드 */
  const fieldProposals = useMemo(() => {
    const seen = new Set<string>()
    return docProposals.filter((proposal) => {
      if (proposal.tool !== 'update_field' || !proposal.field || seen.has(proposal.field))
        return false
      seen.add(proposal.field)
      return true
    })
  }, [docProposals])

  const runAnalysis = () => {
    setAnalyzeOpen(false)
    toast.info('분석 API가 아직 연결되지 않았습니다', {
      description: '범위 3에서 백엔드 분석 엔드포인트와 함께 연결됩니다.',
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
    scrollToId(sectionDomId(key))
  }

  const showProposal = (proposal: Proposal) => {
    if (proposal.tool === 'update_field') return scrollToId(FIELD_CARDS_ID)
    const section = doc ? matchProposalSection(doc.sections, proposal.section) : null
    if (section) scrollToId(sectionDomId(section.key))
  }

  const save = async (target: number | typeof PREAMBLE_KEY, body: string) => {
    if (!task) return
    try {
      await updateSection({ task, target, body })
      setEditing(null)
      toast.success('저장했습니다')
    } catch {
      toast.error('저장하지 못했습니다', { description: NETWORK_HINT })
    }
  }

  const saveMeta = async (patch: Parameters<typeof updateMeta>[1]) => {
    if (!task) return
    try {
      await updateMeta(task, patch)
    } catch {
      toast.error('저장하지 못했습니다', { description: NETWORK_HINT })
      throw new Error('meta save failed')
    }
  }

  const cancelTask = async (target: Task) => {
    try {
      await setTaskStatus(target.id, 'canceled')
      setCancelTarget(null)
      setEditing(null)
      toast.success('태스크를 취소했습니다')
    } catch {
      toast.error('취소하지 못했습니다', { description: NETWORK_HINT })
    }
  }

  const restoreTask = async (target: Task) => {
    try {
      await setTaskStatus(target.id, 'backlog')
      toast.success('Backlog로 복원했습니다')
    } catch {
      toast.error('복원하지 못했습니다', { description: NETWORK_HINT })
    }
  }

  const proposalBlock = (proposal: Proposal, currentValue?: string | null) =>
    task && (
      <ProposalBlock
        proposal={proposal}
        diff={navi.diffs[proposal.id] ?? null}
        currentVersion={task.version}
        currentValue={currentValue}
        accepting={navi.acceptingId === proposal.id}
        regenerating={proposal.id === regeneratingId}
        staleMessage={navi.staleNotices[proposal.id] ?? null}
        onAccept={() => void navi.accept(proposal)}
        onReject={(reason) => void navi.reject(proposal, reason)}
        onRequestAgain={() => navi.requestAgain(proposal)}
      />
    )

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
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon-lg" aria-label="태스크 메뉴" />}
                >
                  <Ellipsis className="size-4" strokeWidth={1.75} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem variant="destructive" onClick={() => setCancelTarget(task)}>
                    <Ban strokeWidth={1.75} />
                    태스크 취소
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="lg" className="font-semibold" onClick={startAnalysis}>
                분석 시작
              </Button>
            </>
          )
        }
      />

      <div className="flex min-w-0 flex-1">
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
                <div className="mt-1.5 flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => void refetch()}>
                    다시 시도
                  </Button>
                  <Link to="/board" className="underline">
                    보드로 돌아가기
                  </Link>
                </div>
              </Callout>
            )}
            {validId && isLoading && <DetailSkeleton />}

            {task && gate && doc && (
              <>
                {readOnly && (
                  <Callout
                    variant="info"
                    title={`${task.archived ? '아카이브된' : STATUS_LABEL[task.status]} 태스크입니다 — 읽기 전용`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>보드에 표시되지 않으며 편집·분석을 할 수 없습니다.</span>
                      {task.status === 'canceled' && !task.archived && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void restoreTask(task)}
                          disabled={statusPending}
                        >
                          {statusPending ? '복원 중…' : 'Backlog로 복원'}
                        </Button>
                      )}
                    </div>
                  </Callout>
                )}

                <TaskHeader
                  task={task}
                  gate={gate}
                  onUpdateMeta={readOnly ? undefined : saveMeta}
                  metaPending={metaPending}
                />

                {fieldProposals.length > 0 && (
                  <div id={FIELD_CARDS_ID} className="flex scroll-mt-24 flex-col gap-3">
                    {fieldProposals.map((proposal) => (
                      <div key={proposal.id}>
                        {proposalBlock(
                          proposal,
                          proposal.field === 'title' ? task.title : task.tags.join(', ') || null,
                        )}
                      </div>
                    ))}
                  </div>
                )}

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
                  {doc.sections.map((section) => {
                    const proposal = sectionProposals.get(section.key)
                    if (proposal && editing !== section.key)
                      return (
                        <ProposalSection
                          key={section.key}
                          id={sectionDomId(section.key)}
                          section={section}
                          required={REQUIRED_HINT.test(section.name)}
                          pending={proposal.status === 'pending'}
                        >
                          {proposalBlock(proposal)}
                        </ProposalSection>
                      )
                    return (
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
                    )
                  })}
                  {doc.sections.length === 0 && !doc.preamble && (
                    <div className="text-muted text-[13px]">본문이 비어 있습니다.</div>
                  )}
                </div>

                <UndecidedSection />
              </>
            )}
          </div>
        </main>
        <NaviPanel
          messages={navi.messages}
          proposalsById={navi.proposalsById}
          busy={navi.busy !== null}
          disabled={readOnly || !task}
          onSend={(text) => void navi.send(text)}
          onAbort={navi.abort}
          onShowProposal={showProposal}
        />
      </div>

      <AnalyzeWarningDialog
        open={analyzeOpen}
        onOpenChange={setAnalyzeOpen}
        markers={markers}
        onProceed={runAnalysis}
        onFix={fixFirstMarker}
      />
      <CancelTaskDialog
        task={cancelTarget}
        pending={statusPending}
        onClose={() => setCancelTarget(null)}
        onConfirm={(target) => void cancelTask(target)}
      />
    </>
  )
}

/** 제안이 붙은 섹션 — 본문 자리에 제안 블록, 헤더에 "제안 대기" 표시 (DESIGN.md D.2) */
function ProposalSection({
  id,
  section,
  required,
  pending,
  children,
}: {
  id: string
  section: Section
  required: boolean
  pending: boolean
  children: React.ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-ink text-[16px] leading-[1.4] font-medium">
          {sectionDisplayName(section.name)}
          {required && <span className="text-muted ml-1.5 text-[12px] font-medium">필수</span>}
        </h2>
        {pending && (
          <span className="bg-surface-card text-ink inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium">
            <span className="bg-primary size-1.5 rounded-full" aria-hidden />
            제안 대기
          </span>
        )}
      </div>
      {children}
    </section>
  )
}
