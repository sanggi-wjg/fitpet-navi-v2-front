import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  acceptProposalApiV1ProposalsProposalIdAcceptPost,
  chatApiV1TasksTaskIdChatPost,
  getGetProposalsApiV1TasksTaskIdProposalsGetQueryKey,
  rejectProposalApiV1ProposalsProposalIdRejectPost,
  useGetProposalsApiV1TasksTaskIdProposalsGet,
} from '@/api/endpoints/proposal/proposal'
import {
  getGetTaskApiV1TasksTaskIdGetQueryKey,
  getGetTasksApiV1TasksGetQueryKey,
} from '@/api/endpoints/task/task'
import type { ProposalChatResponseDto, ProposalResponseDto } from '@/api/model'
import {
  apiErrorInfo,
  proposalTargetLabel,
  toChatOutcome,
  toProposal,
} from '@/lib/proposal-mapping'
import type { DiffLine, PanelMessage, Proposal } from '@/types/proposal'
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

interface SessionState {
  taskId: number | null
  messages: PanelMessage[]
  /** chat/reject 응답에서 받은 diff — 목록 조회에는 없다 (리로드 시 미리보기 불가) */
  diffs: Record<number, DiffLine[]>
  /** accept 409 후 서버가 알려준 만료 사유 */
  staleNotices: Record<number, string>
}

const emptySession = (taskId: number | null): SessionState => ({
  taskId,
  messages: [],
  diffs: {},
  staleNotices: {},
})

export type NaviBusy = { kind: 'chat' } | { kind: 'reject'; proposalId: number } | null

const FALLBACK_ERROR = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'

/**
 * Navi 제안 세션 — 채팅 · 수락 · 거부(→즉시 재제안) · 만료 처리.
 * 대화와 diff 는 세션 로컬(백엔드 stateless), 제안 목록만 서버 상태다.
 */
export function useNaviSession(task: Task | undefined) {
  const queryClient = useQueryClient()
  const taskId = task?.id ?? null
  const { proposals, byId } = useProposals(task?.id)

  const [session, setSession] = useState<SessionState>(() => emptySession(taskId))
  const [busy, setBusy] = useState<NaviBusy>(null)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 다른 태스크로 이동하면 세션을 버린다 (렌더 중 상태 보정 — effect 불필요)
  if (session.taskId !== taskId) setSession(emptySession(taskId))

  const proposalsKey = getGetProposalsApiV1TasksTaskIdProposalsGetQueryKey(taskId ?? 0)
  const push = (...messages: PanelMessage[]) =>
    setSession((prev) => ({ ...prev, messages: [...prev.messages, ...messages] }))

  const upsertProposalDto = (dto: ProposalResponseDto) => {
    queryClient.setQueryData<ProposalResponseDto[]>(proposalsKey, (old) => {
      const rest = (old ?? []).filter((item) => item.id !== dto.id)
      return [...rest, dto]
    })
  }

  const markRejected = (proposalId: number, reason: string) => {
    queryClient.setQueryData<ProposalResponseDto[]>(proposalsKey, (old) =>
      old?.map((item) =>
        item.id === proposalId ? { ...item, status: 'REJECTED', reject_reason: reason } : item,
      ),
    )
  }

  const invalidateProposals = () => queryClient.invalidateQueries({ queryKey: proposalsKey })

  /** chat / reject 응답을 세션·캐시에 반영한다 */
  const applyOutcome = (dto: ProposalChatResponseDto) => {
    const outcome = toChatOutcome(dto)
    if (outcome.proposal) {
      if (dto.proposal) upsertProposalDto(dto.proposal)
      setSession((prev) => ({
        ...prev,
        diffs: { ...prev.diffs, [outcome.proposal!.id]: outcome.diff },
        messages: [...prev.messages, { kind: 'proposal', proposalId: outcome.proposal!.id }],
      }))
    } else if (outcome.message) {
      push({ kind: 'navi', text: outcome.message })
    }
  }

  const handleError = (error: unknown, retryText?: string) => {
    const { status, message } = apiErrorInfo(error)
    if (status === null && abortRef.current === null) {
      // abort() 가 이미 컨트롤러를 비웠으면 사용자가 중단한 것
      push({ kind: 'info', text: '요청을 중단했습니다.' })
      return
    }
    push({ kind: 'error', text: message ?? FALLBACK_ERROR, retryText })
    void invalidateProposals()
  }

  const send = async (text: string) => {
    const message = text.trim()
    if (!task || busy || acceptingId !== null || message.length === 0) return
    push({ kind: 'user', text: message })
    setBusy({ kind: 'chat' })
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const dto = await chatApiV1TasksTaskIdChatPost(task.id, { message }, controller.signal)
      abortRef.current = null
      applyOutcome(dto)
    } catch (error) {
      handleError(error, message)
    } finally {
      abortRef.current = null
      setBusy(null)
    }
  }

  const abort = () => {
    const controller = abortRef.current
    abortRef.current = null
    controller?.abort()
  }

  const accept = async (proposal: Proposal) => {
    if (busy || acceptingId !== null) return
    setAcceptingId(proposal.id)
    try {
      const dto = await acceptProposalApiV1ProposalsProposalIdAcceptPost(proposal.id)
      queryClient.setQueryData(getGetTaskApiV1TasksTaskIdGetQueryKey(dto.id), dto)
      void queryClient.invalidateQueries({ queryKey: getGetTasksApiV1TasksGetQueryKey() })
      void invalidateProposals()
      toast.success(
        proposal.tool === 'replace_section'
          ? `제안을 적용했습니다 · v${dto.version}`
          : '제안을 적용했습니다',
      )
    } catch (error) {
      const { status, message } = apiErrorInfo(error)
      if (status === 409) {
        // 서버가 제안을 STALE 로 바꿨다 — 목록을 다시 읽고 배너 문구를 남긴다
        setSession((prev) => ({
          ...prev,
          staleNotices: {
            ...prev.staleNotices,
            [proposal.id]: message ?? '문서가 변경되어 이 제안을 적용하지 못했습니다.',
          },
        }))
        void invalidateProposals()
        void queryClient.invalidateQueries({
          queryKey: getGetTaskApiV1TasksTaskIdGetQueryKey(proposal.taskId),
        })
      } else {
        toast.error('제안을 적용하지 못했습니다', { description: message ?? FALLBACK_ERROR })
      }
    } finally {
      setAcceptingId(null)
    }
  }

  const reject = async (proposal: Proposal, reason: string) => {
    const trimmed = reason.trim()
    if (!task || busy || acceptingId !== null || trimmed.length === 0) return
    push({ kind: 'user', text: `(제안 거부) ${trimmed}` })
    setBusy({ kind: 'reject', proposalId: proposal.id })
    try {
      const dto = await rejectProposalApiV1ProposalsProposalIdRejectPost(proposal.id, {
        reason: trimmed,
      })
      markRejected(proposal.id, trimmed)
      applyOutcome(dto)
    } catch (error) {
      handleError(error)
    } finally {
      setBusy(null)
    }
  }

  /** 만료된 제안을 현재 문서 기준으로 다시 요청한다 */
  const requestAgain = (proposal: Proposal) => {
    void send(
      `만료된 제안(대상: ${proposalTargetLabel(proposal)})을 현재 문서 기준으로 다시 제안해 주세요.`,
    )
  }

  return {
    proposals,
    proposalsById: byId,
    messages: session.messages,
    diffs: session.diffs,
    staleNotices: session.staleNotices,
    busy,
    acceptingId,
    send,
    abort,
    accept,
    reject,
    requestAgain,
  }
}
