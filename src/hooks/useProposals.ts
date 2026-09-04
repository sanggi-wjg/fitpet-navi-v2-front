import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  acceptProposalApiV1ProposalsProposalIdAcceptPost,
  chatApiV1TasksTaskIdChatPost,
  closeProposalApiV1ProposalsProposalIdClosePost,
  getGetProposalsApiV1TasksTaskIdProposalsGetQueryKey,
  rejectProposalApiV1ProposalsProposalIdRejectPost,
  useGetProposalsApiV1TasksTaskIdProposalsGet,
} from '@/api/endpoints/proposal/proposal'
import type { ChatResponseDto, ProposalResponseDto } from '@/api/model'
import { useTaskCache } from '@/hooks/useTasks'
import { apiErrorInfo, isConflict } from '@/lib/api-error'
import { toChatOutcome, toProposal } from '@/lib/proposal-mapping'
import type { PanelMessage, Proposal } from '@/types/proposal'
import type { Task } from '@/types/task'

/** 태스크의 제안 목록 (최신 먼저) */
export function useProposals(taskId: number | undefined) {
  const query = useGetProposalsApiV1TasksTaskIdProposalsGet(taskId ?? 0, {
    query: { enabled: taskId !== undefined },
  })
  const proposals = useMemo<Proposal[]>(
    () =>
      (query.data ?? [])
        .map(toProposal)
        .filter((proposal): proposal is Proposal => proposal !== null)
        .sort((a, b) => b.id - a.id),
    [query.data],
  )
  const byId = useMemo(() => new Map(proposals.map((p) => [p.id, p])), [proposals])
  return { ...query, proposals, byId }
}

export type NaviBusy = { kind: 'chat' } | { kind: 'reject'; proposalId: number } | null

interface SessionState {
  taskId: number | null
  messages: PanelMessage[]
  busy: NaviBusy
  acceptingId: number | null
  /** accept 409 후 서버가 알려준 만료 사유 */
  staleNotices: Record<number, string>
  /** 닫는 중인 제안 (버튼 비활성) */
  closingId: number | null
  /** 수락으로 바뀐 섹션 version (sectionId → version) — 헤더 "Navi 제안 적용 · vN" */
  applied: Record<number, number>
}

const emptySession = (taskId: number | null): SessionState => ({
  taskId,
  messages: [],
  busy: null,
  acceptingId: null,
  staleNotices: {},
  closingId: null,
  applied: {},
})

const FALLBACK_ERROR = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
const STALE_FALLBACK = '문서가 변경되어 이 제안을 적용하지 못했습니다.'

/**
 * Navi 제안 세션 — 채팅 · 수락 · 거부(→같은 응답으로 재제안) · 만료 처리.
 * 대화는 세션 로컬(백엔드 stateless), 제안 목록만 서버 상태다. 세션 상태는 태스크가 바뀌면 통째로 버린다.
 */
export function useNaviSession(task: Task | undefined) {
  const queryClient = useQueryClient()
  const cache = useTaskCache()
  const taskId = task?.id ?? null
  const { proposals, byId } = useProposals(task?.id)

  const [session, setSession] = useState<SessionState>(() => emptySession(taskId))
  const abortRef = useRef<AbortController | null>(null)
  /** 비동기 콜백이 "어느 태스크의 세션인지" 확인하는 용도 — 렌더에서는 읽지 않는다 */
  const taskIdRef = useRef(taskId)

  // 다른 태스크로 이동하면 세션을 버린다 (렌더 중 상태 보정 — effect 불필요)
  if (session.taskId !== taskId) setSession(emptySession(taskId))
  // 진행 중인 요청은 태스크가 바뀌거나 페이지를 떠날 때 끊는다 (cleanup 이 새 effect 보다 먼저라 ref 는 그 뒤 갱신)
  useEffect(() => {
    taskIdRef.current = taskId
    return () => abortRef.current?.abort()
  }, [taskId])

  const proposalsKey = getGetProposalsApiV1TasksTaskIdProposalsGetQueryKey(taskId ?? 0)
  const patch = (update: (prev: SessionState) => Partial<SessionState>) =>
    setSession((prev) => ({ ...prev, ...update(prev) }))
  const push = (...messages: PanelMessage[]) =>
    patch((prev) => ({ messages: [...prev.messages, ...messages] }))

  const upsertProposalDto = (dto: ProposalResponseDto) =>
    queryClient.setQueryData<ProposalResponseDto[]>(proposalsKey, (old) => [
      ...(old ?? []).filter((item) => item.id !== dto.id),
      dto,
    ])

  const markRejected = (proposalId: number, reason: string) =>
    queryClient.setQueryData<ProposalResponseDto[]>(proposalsKey, (old) =>
      old?.map((item) =>
        item.id === proposalId ? { ...item, status: 'REJECTED', reject_reason: reason } : item,
      ),
    )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: proposalsKey })

  /** chat / reject 응답을 세션·캐시에 반영한다 */
  const applyOutcome = (dto: ChatResponseDto) => {
    const outcome = toChatOutcome(dto)
    if (outcome.proposal) {
      if (dto.proposal) upsertProposalDto(dto.proposal)
      push({ kind: 'proposal', proposalId: outcome.proposal.id })
    } else if (outcome.message) {
      push({ kind: 'navi', text: outcome.message })
    } else {
      // 제안이 왔지만 본문이 없어 보여 줄 수 없다 — 응답이 없는 것처럼 보이지 않게 남긴다
      push({ kind: 'error', text: FALLBACK_ERROR })
    }
  }

  /**
   * LLM 요청 공통 — 중단·태스크 이동 뒤에는 세션을 건드리지 않는다.
   * 중단해도 서버는 계속 돌아 제안이 만들어질 수 있으므로 목록은 다시 읽는다.
   */
  const request = async (
    busy: NonNullable<NaviBusy>,
    run: (signal: AbortSignal) => Promise<ChatResponseDto>,
    retryText?: string,
  ) => {
    const startedFor = taskId
    const controller = new AbortController()
    abortRef.current = controller
    patch(() => ({ busy }))
    try {
      const dto = await run(controller.signal)
      if (taskIdRef.current !== startedFor) return
      applyOutcome(dto)
      void invalidate() // 같은 태스크에 동시에 나간 요청(닫기·수락)과 서버 정본을 다시 맞춘다
    } catch (error) {
      if (taskIdRef.current !== startedFor) return
      if (controller.signal.aborted) {
        push({ kind: 'info', text: '요청을 중단했습니다.' })
      } else {
        const { message } = apiErrorInfo(error)
        push({ kind: 'error', text: message ?? FALLBACK_ERROR, retryText })
      }
      void invalidate()
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      if (taskIdRef.current === startedFor) patch(() => ({ busy: null }))
    }
  }

  const send = async (text: string) => {
    const message = text.trim()
    if (!task || session.busy || session.acceptingId !== null || message.length === 0) return
    push({ kind: 'user', text: message })
    await request(
      { kind: 'chat' },
      (signal) => chatApiV1TasksTaskIdChatPost(task.id, { message }, signal),
      message,
    )
  }

  const abort = () => abortRef.current?.abort()

  const accept = async (proposal: Proposal) => {
    if (session.busy || session.acceptingId !== null) return
    const startedFor = taskId
    patch(() => ({ acceptingId: proposal.id }))
    try {
      const dto = await acceptProposalApiV1ProposalsProposalIdAcceptPost(proposal.id)
      cache.patchSection(proposal.taskId, dto.section)
      upsertProposalDto(dto.proposal)
      // 같은 섹션의 다른 pending 제안은 이제 만료 — 서버 판정을 다시 받는다
      void invalidate()
      if (taskIdRef.current === startedFor)
        patch((prev) => ({ applied: { ...prev.applied, [dto.section.id]: dto.section.version } }))
      toast.success('제안을 적용했습니다', {
        description: `${proposal.sectionName} · v${dto.section.version}`,
      })
    } catch (error) {
      const { status, message } = apiErrorInfo(error)
      if (isConflict(error)) {
        // 제안 이후 섹션이 바뀌었다 — 목록(is_stale)·상세(최신 본문)를 다시 읽고 배너 문구를 남긴다
        if (taskIdRef.current === startedFor)
          patch((prev) => ({
            staleNotices: { ...prev.staleNotices, [proposal.id]: message ?? STALE_FALLBACK },
          }))
        void invalidate()
        cache.onMutationError(error, proposal.taskId) // 409 → 목록·상세 모두 최신 version 으로
      } else {
        toast.error('제안을 적용하지 못했습니다', { description: message ?? FALLBACK_ERROR })
        // 400 = 이미 처리된 제안 — 목록을 맞춘다
        if (status === 400) void invalidate()
      }
    } finally {
      if (taskIdRef.current === startedFor) patch(() => ({ acceptingId: null }))
    }
  }

  /** 거부는 저장과 재제안이 한 트랜잭션 — 실패(503)하면 서버가 거부도 되돌리므로 pending 그대로 둔다 */
  const reject = async (proposal: Proposal, reason: string) => {
    const trimmed = reason.trim()
    if (!task || session.busy || session.acceptingId !== null || trimmed.length === 0) return
    push({ kind: 'user', text: `(제안 거부) ${trimmed}` })
    await request({ kind: 'reject', proposalId: proposal.id }, async (signal) => {
      const dto = await rejectProposalApiV1ProposalsProposalIdRejectPost(
        proposal.id,
        { reason: trimmed },
        signal,
      )
      markRejected(proposal.id, trimmed)
      return dto
    })
  }

  /** 수락·거부 없이 종결한다 — 섹션·LLM 과 무관하므로 만료된 제안도 닫을 수 있다 */
  const close = async (proposal: Proposal) => {
    if (session.closingId !== null) return
    const startedFor = taskId
    patch(() => ({ closingId: proposal.id }))
    try {
      const dto = await closeProposalApiV1ProposalsProposalIdClosePost(proposal.id)
      upsertProposalDto(dto) // CLOSED → pending 필터에서 빠져 블록·패널 카드가 사라진다
    } catch (error) {
      const { status, message } = apiErrorInfo(error)
      toast.error('제안을 닫지 못했습니다', { description: message ?? FALLBACK_ERROR })
      if (status !== null) void invalidate() // 400(이미 처리됨)·404(사라짐) — 서버 판정에 목록을 맞춘다
    } finally {
      if (taskIdRef.current === startedFor) patch(() => ({ closingId: null }))
    }
  }

  /** 만료된 제안을 닫고 현재 문서 기준으로 다시 요청한다 — 두 요청은 독립이지만 전제는 send 와 같다 */
  const requestAgain = (proposal: Proposal) => {
    if (!task || session.busy || session.acceptingId !== null) return
    void close(proposal)
    void send(`만료된 제안(대상: ${proposal.sectionName})을 현재 문서 기준으로 다시 제안해 주세요.`)
  }

  return {
    proposals,
    proposalsById: byId,
    messages: session.messages,
    staleNotices: session.staleNotices,
    closingId: session.closingId,
    applied: session.applied,
    busy: session.busy,
    acceptingId: session.acceptingId,
    send,
    abort,
    accept,
    reject,
    requestAgain,
    close,
    invalidate,
  }
}
