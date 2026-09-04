import { Archive, ArchiveRestore, Ban, ChevronRight, Ellipsis } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CancelTaskDialog } from '@/components/board/CancelTaskDialog'
import { Callout } from '@/components/common/Callout'
import { AnalyzeWarningDialog } from '@/components/detail/AnalyzeWarningDialog'
import { DetailSkeleton } from '@/components/detail/DetailSkeleton'
import { DocumentSection } from '@/components/detail/DocumentSection'
import { NaviPanel } from '@/components/detail/NaviPanel'
import { AppliedPill, ProposalBlock, ProposalPill } from '@/components/detail/ProposalBlock'
import { TaskHeader } from '@/components/detail/TaskHeader'
import { UndecidedSection } from '@/components/detail/UndecidedSection'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNaviSession } from '@/hooks/useProposals'
import {
  useArchiveTask,
  useSetTaskStatus,
  useTask,
  useUpdateSection,
  useUpdateTaskMeta,
} from '@/hooks/useTasks'
import { errorDescription, isConflict } from '@/lib/api-error'
import { gateOf } from '@/lib/gate'
import { collectMarkers } from '@/lib/markdown'
import { isProposalStale } from '@/lib/proposal-mapping'
import { STATUS_LABEL } from '@/lib/task-config'
import type { Proposal } from '@/types/proposal'
import type { Task, TaskSection } from '@/types/task'

const sectionDomId = (sectionId: number) => `section-${sectionId}`

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
  const { archive, unarchive, isPending: archivePending } = useArchiveTask()
  const navi = useNaviSession(task)

  /** 편집 중인 섹션 id */
  const [editing, setEditing] = useState<number | null>(null)
  /** 저장이 409 로 실패한 섹션 — 편집기에 최신 본문 안내 */
  const [conflictId, setConflictId] = useState<number | null>(null)
  const [analyzeOpen, setAnalyzeOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Task | null>(null)

  const gate = task ? gateOf(task) : null
  const markers = useMemo(() => (task ? collectMarkers(task.sections) : []), [task])
  const readOnly = task?.readOnly ?? false

  const regeneratingId = navi.busy?.kind === 'reject' ? navi.busy.proposalId : null

  /** 섹션 id → 문서에 얹을 제안 (대기 중 최신 1개 · 거부 직후는 재제안 대기 블록). 읽기 전용이면 없음 */
  const sectionProposals = useMemo(() => {
    const map = new Map<number, Proposal>()
    if (readOnly) return map
    for (const proposal of navi.proposals) {
      const show = proposal.id === regeneratingId || proposal.status === 'pending'
      if (show && !map.has(proposal.sectionId)) map.set(proposal.sectionId, proposal)
    }
    return map
  }, [navi.proposals, regeneratingId, readOnly])

  /** 이 세션 대화에 없는 대기 제안 — 패널 상단에 요약 카드로 안내 (읽기 전용 제외) */
  const priorPending = useMemo(() => {
    if (readOnly) return []
    const inChat = new Set(
      navi.messages.flatMap((message) => (message.kind === 'proposal' ? [message.proposalId] : [])),
    )
    return navi.proposals.filter(
      (proposal) => proposal.status === 'pending' && !inChat.has(proposal.id),
    )
  }, [navi.messages, navi.proposals, readOnly])

  /** 문서에 대기(수락 가능) 블록이 하나라도 있으면 코랄은 "수락"에 양보한다 (DESIGN.md 코랄 예산) */
  const hasPendingBlock =
    task?.sections.some((section) => {
      const proposal = editing === section.id ? undefined : sectionProposals.get(section.id)
      return (
        proposal !== undefined &&
        proposal.id !== regeneratingId &&
        !isProposalStale(proposal, section, navi.staleNotices[proposal.id] ?? null)
      )
    }) ?? false

  const showProposal = (proposal: Proposal) => scrollToId(sectionDomId(proposal.sectionId))

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

  /** 첫 마커가 있는 섹션을 편집 모드로 열고 스크롤한다 — 대기 제안이 있는 섹션은 건너뛴다(편집하면 만료) */
  const fixFirstMarker = () => {
    setAnalyzeOpen(false)
    const target = task?.sections.find(
      (section) => section.markerCount > 0 && !sectionProposals.has(section.id),
    )
    if (!target) return
    setEditing(target.id)
    scrollToId(sectionDomId(target.id))
  }

  const startEditing = (sectionId: number | null) => {
    setEditing(sectionId)
    setConflictId(null)
  }

  /**
   * 실패해도 편집기는 열어 둔다. 409 면 캐시가 최신 version·본문으로 갱신되고,
   * 편집기 안내에서 최신 내용을 불러올지 내 내용을 유지할지 고른 뒤 다시 저장한다.
   */
  const save = async (section: TaskSection, body: string) => {
    if (!task) return
    try {
      await updateSection({ taskId: task.id, section, body })
      startEditing(null)
      // 이 섹션의 대기 제안은 만료됐다 — 서버 판정(is_stale)을 다시 받는다
      void navi.invalidate()
      toast.success('저장했습니다')
    } catch (error) {
      if (isConflict(error)) setConflictId(section.id)
      toast.error('저장하지 못했습니다', { description: errorDescription(error) })
    }
  }

  const saveMeta = async (patch: Parameters<typeof updateMeta>[1]) => {
    if (!task) return
    try {
      await updateMeta(task, patch)
    } catch (error) {
      toast.error('저장하지 못했습니다', { description: errorDescription(error) })
      throw new Error('meta save failed')
    }
  }

  const cancelTask = async (target: Task) => {
    try {
      await setTaskStatus(target, 'canceled')
      setCancelTarget(null)
      startEditing(null)
      toast.success('태스크를 취소했습니다')
    } catch (error) {
      toast.error('취소하지 못했습니다', { description: errorDescription(error) })
    }
  }

  const restoreTask = async (target: Task) => {
    try {
      await setTaskStatus(target, 'backlog')
      toast.success('Backlog로 복원했습니다')
    } catch (error) {
      toast.error('복원하지 못했습니다', { description: errorDescription(error) })
    }
  }

  /** 확인 없이 실행 — 캐시 병합으로 같은 화면이 읽기 전용으로 바뀌므로 열린 편집기는 닫는다 */
  const archiveTask = async (target: Task) => {
    try {
      await archive(target)
      startEditing(null)
      toast.success('아카이브했습니다', {
        description: "보드의 '아카이브' 뷰에서 볼 수 있습니다.",
        action: {
          label: '되돌리기',
          onClick: () => {
            unarchive(target).catch((error: unknown) =>
              toast.error('되돌리지 못했습니다', { description: errorDescription(error) }),
            )
          },
        },
      })
    } catch (error) {
      toast.error('아카이브하지 못했습니다', { description: errorDescription(error) })
    }
  }

  const unarchiveTask = async (target: Task) => {
    try {
      await unarchive(target)
      toast.success('아카이브를 해제했습니다', {
        description:
          target.status === 'canceled' ? '취소 상태라 보드에는 표시되지 않습니다.' : undefined,
        action: {
          label: '되돌리기',
          onClick: () => {
            archive(target).catch((error: unknown) =>
              toast.error('되돌리지 못했습니다', { description: errorDescription(error) }),
            )
          },
        },
      })
    } catch (error) {
      toast.error('해제하지 못했습니다', { description: errorDescription(error) })
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
          task && (
            <>
              {/* 읽기 전용에서도 kebab 은 남긴다 — 아카이브/해제 경로. 분석 시작만 숨김 */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon-lg" aria-label="태스크 메뉴" />}
                >
                  <Ellipsis className="size-4" strokeWidth={1.75} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {task.archived ? (
                    <DropdownMenuItem
                      disabled={archivePending}
                      onClick={() => void unarchiveTask(task)}
                    >
                      <ArchiveRestore strokeWidth={1.75} />
                      아카이브 해제
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      // 편집 중 아카이브하면 저장 안 한 본문이 사라지므로 먼저 저장·취소하게 한다
                      disabled={archivePending || editing !== null}
                      onClick={() => void archiveTask(task)}
                    >
                      <Archive strokeWidth={1.75} />
                      {editing !== null ? '아카이브 (편집 중)' : '아카이브'}
                    </DropdownMenuItem>
                  )}
                  {!readOnly && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setCancelTarget(task)}>
                        <Ban strokeWidth={1.75} />
                        태스크 취소
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {!readOnly && (
                <Button
                  size="lg"
                  variant={hasPendingBlock ? 'outline' : 'default'}
                  className="font-semibold"
                  onClick={startAnalysis}
                >
                  분석 시작
                </Button>
              )}
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

            {task && gate && (
              <>
                {readOnly && (
                  <Callout
                    variant="info"
                    title={`${task.archived ? '아카이브된' : STATUS_LABEL[task.status]} 태스크입니다 — 읽기 전용`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {task.archived
                          ? "보드의 '아카이브' 뷰에만 표시되며 편집·분석을 할 수 없습니다."
                          : '보드에 표시되지 않으며 편집·분석을 할 수 없습니다.'}
                      </span>
                      {task.archived ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void unarchiveTask(task)}
                          disabled={archivePending}
                        >
                          {archivePending ? '해제 중…' : '아카이브 해제'}
                        </Button>
                      ) : (
                        task.status === 'canceled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void restoreTask(task)}
                            disabled={statusPending}
                          >
                            {statusPending ? '복원 중…' : 'Backlog로 복원'}
                          </Button>
                        )
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

                <div className="flex flex-col gap-6">
                  {task.sections.map((section) => {
                    const proposal =
                      editing === section.id ? undefined : sectionProposals.get(section.id)
                    const staleMessage = proposal ? (navi.staleNotices[proposal.id] ?? null) : null
                    const stale = proposal
                      ? isProposalStale(proposal, section, staleMessage)
                      : false
                    const pillState = !proposal
                      ? null
                      : proposal.id === regeneratingId
                        ? 'regenerating'
                        : stale
                          ? 'stale'
                          : 'pending'
                    return (
                      <DocumentSection
                        key={section.id}
                        id={sectionDomId(section.id)}
                        name={section.name}
                        body={section.body}
                        required={section.isRequired}
                        editing={editing === section.id}
                        saving={saving && editing === section.id}
                        readOnly={readOnly}
                        conflict={conflictId === section.id}
                        onEdit={() => startEditing(section.id)}
                        onCancel={() => startEditing(null)}
                        onSave={(body) => void save(section, body)}
                        onResolveConflict={() => setConflictId(null)}
                        badge={
                          pillState ? (
                            <ProposalPill state={pillState} />
                          ) : navi.applied[section.id] === section.version ? (
                            <AppliedPill version={section.version} />
                          ) : undefined
                        }
                        // 대기 제안이 있으면 먼저 수락·거부하게 한다 (편집하면 만료). 만료 블록은 편집 허용
                        hideEdit={pillState === 'pending' || pillState === 'regenerating'}
                        content={
                          proposal && (
                            <ProposalBlock
                              proposal={proposal}
                              section={section}
                              accepting={navi.acceptingId === proposal.id}
                              regenerating={proposal.id === regeneratingId}
                              staleMessage={staleMessage}
                              onAccept={() => void navi.accept(proposal)}
                              onReject={(reason) => void navi.reject(proposal, reason)}
                              onRequestAgain={() => navi.requestAgain(proposal)}
                              onClose={() => void navi.close(proposal)}
                              closing={navi.closingId === proposal.id}
                            />
                          )
                        }
                      />
                    )
                  })}
                  {task.sections.length === 0 && (
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
          priorPending={priorPending}
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
