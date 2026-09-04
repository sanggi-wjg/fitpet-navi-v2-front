import { useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGetTaskApiV1TasksTaskIdGetQueryKey } from '@/api/endpoints/task/task'
import type { ProposalResponseDto, TaskResponseDto, TaskSectionResponseDto } from '@/api/model'
import { useNaviSession } from '@/hooks/useProposals'
import { makeTask } from '@/test/factories'
import { makeQueryClient, queryWrapper } from '@/test/query'

const listMock = vi.fn<(taskId: number) => Promise<ProposalResponseDto[]>>()
const chatMock = vi.fn()
const acceptMock = vi.fn()
const closeMock = vi.fn()
const rejectMock = vi.fn()

vi.mock('@/api/endpoints/proposal/proposal', () => ({
  getGetProposalsApiV1TasksTaskIdProposalsGetQueryKey: (taskId: number) => [
    `/api/v1/tasks/${taskId}/proposals`,
  ],
  useGetProposalsApiV1TasksTaskIdProposalsGet: (
    taskId: number,
    options?: { query?: { enabled?: boolean } },
  ) =>
    useQuery({
      queryKey: [`/api/v1/tasks/${taskId}/proposals`],
      queryFn: () => listMock(taskId),
      ...options?.query,
    }),
  chatApiV1TasksTaskIdChatPost: (...args: unknown[]) => chatMock(...args),
  acceptProposalApiV1ProposalsProposalIdAcceptPost: (...args: unknown[]) => acceptMock(...args),
  closeProposalApiV1ProposalsProposalIdClosePost: (...args: unknown[]) => closeMock(...args),
  rejectProposalApiV1ProposalsProposalIdRejectPost: (...args: unknown[]) => rejectMock(...args),
}))

const sectionDto = (overrides: Partial<TaskSectionResponseDto> = {}): TaskSectionResponseDto => ({
  id: 3,
  task_id: 7,
  name: '예외 조건',
  body: '- 휴면 계정 제외\n',
  display_order: 2,
  is_required: true,
  version: 0,
  example_marker_count: 0,
  created_at: '2026-09-01T00:00:00',
  updated_at: '2026-09-01T00:00:00',
  ...overrides,
})

const taskDto: TaskResponseDto = {
  id: 7,
  title: '생일 유저 적립금',
  task_type: 'AUTOMATION_BATCH',
  status: 'BACKLOG',
  version: 1,
  tags: null,
  display_order: 0,
  priority: 2,
  is_archived: false,
  archived_at: null,
  task_sections: [sectionDto()],
  created_at: '2026-09-01T00:00:00',
  updated_at: '2026-09-01T00:00:00',
}

const proposalDto: ProposalResponseDto = {
  id: 11,
  task_id: 7,
  section_id: 3,
  section_version: 0,
  tool: 'replace_section',
  tool_input: {
    section: '예외 조건',
    new_content: '- 휴면 계정 제외\n- 탈퇴 계정 제외',
    reason: '이유',
  },
  status: 'PENDING',
  is_stale: false,
  reject_reason: null,
  created_at: '2026-09-02T00:00:00',
  updated_at: '2026-09-02T00:00:00',
}

const conflictError = (message: string) =>
  Object.assign(new Error('conflict'), {
    isAxiosError: true,
    response: { status: 409, data: { status: 409, message } },
  })

const setup = () => {
  const client = makeQueryClient()
  client.setQueryData(getGetTaskApiV1TasksTaskIdGetQueryKey(7), taskDto)
  const hook = renderHook(({ task }) => useNaviSession(task), {
    initialProps: { task: makeTask() },
    wrapper: queryWrapper(client),
  })
  return { client, ...hook }
}

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue([proposalDto])
})

describe('useNaviSession', () => {
  it('수락 성공: 응답 섹션을 상세 캐시에 반영하고 제안은 ACCEPTED 로', async () => {
    const accepted = { ...proposalDto, status: 'ACCEPTED' as const }
    acceptMock.mockResolvedValue({
      proposal: accepted,
      section: sectionDto({ body: '- 휴면 계정 제외\n- 탈퇴 계정 제외', version: 1 }),
    })
    const { client, result } = setup()
    await waitFor(() => expect(result.current.proposals).toHaveLength(1))

    await act(() => result.current.accept(result.current.proposals[0]))

    expect(acceptMock).toHaveBeenCalledWith(11)
    const detail = client.getQueryData<TaskResponseDto>(getGetTaskApiV1TasksTaskIdGetQueryKey(7))
    expect(detail?.task_sections[0]).toMatchObject({
      version: 1,
      body: '- 휴면 계정 제외\n- 탈퇴 계정 제외',
    })
    expect(result.current.applied).toEqual({ 3: 1 })
    await waitFor(() => expect(result.current.proposalsById.get(11)?.status).toBe('accepted'))
  })

  it('수락 409: 서버 문구를 staleNotices 에 남기고 목록·상세를 다시 읽는다', async () => {
    acceptMock.mockRejectedValue(conflictError('제안 이후 섹션이 수정되어 적용할 수 없습니다.'))
    const { result } = setup()
    await waitFor(() => expect(result.current.proposals).toHaveLength(1))

    await act(() => result.current.accept(result.current.proposals[0]))

    expect(result.current.staleNotices).toEqual({
      11: '제안 이후 섹션이 수정되어 적용할 수 없습니다.',
    })
    expect(result.current.acceptingId).toBeNull()
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2))
  })

  it('닫기 성공: 제안이 closed 가 되어 대기 목록에서 빠진다', async () => {
    closeMock.mockResolvedValue({ ...proposalDto, status: 'CLOSED' })
    const { result } = setup()
    await waitFor(() => expect(result.current.proposals).toHaveLength(1))

    await act(() => result.current.close(result.current.proposals[0]))

    expect(closeMock).toHaveBeenCalledWith(11)
    expect(result.current.proposalsById.get(11)?.status).toBe('closed')
    expect(result.current.proposals.filter((p) => p.status === 'pending')).toHaveLength(0)
    expect(result.current.closingId).toBeNull()
  })

  it('닫기 400(이미 처리됨): 상태를 바꾸지 않고 목록을 다시 읽는다', async () => {
    closeMock.mockRejectedValue(
      Object.assign(new Error('bad'), {
        isAxiosError: true,
        response: { status: 400, data: { message: '이미 처리된 제안입니다' } },
      }),
    )
    const { result } = setup()
    await waitFor(() => expect(result.current.proposals).toHaveLength(1))

    await act(() => result.current.close(result.current.proposals[0]))

    expect(result.current.proposalsById.get(11)?.status).toBe('pending')
    expect(result.current.closingId).toBeNull()
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2))
  })

  it('다시 제안 받기: 닫기와 채팅이 함께 나가고 캐시에 CLOSED + 새 제안이 공존한다', async () => {
    closeMock.mockResolvedValue({ ...proposalDto, status: 'CLOSED' })
    chatMock.mockResolvedValue({
      tool: 'replace_section',
      proposal: { ...proposalDto, id: 12, section_version: 1 },
    })
    const { result } = setup()
    await waitFor(() => expect(result.current.proposals).toHaveLength(1))

    await act(async () => {
      result.current.requestAgain(result.current.proposals[0])
    })

    expect(closeMock).toHaveBeenCalledWith(11)
    expect(chatMock).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(result.current.proposalsById.get(11)?.status).toBe('closed')
      expect(result.current.proposalsById.get(12)?.status).toBe('pending')
    })
    expect(result.current.messages.at(-1)).toEqual({ kind: 'proposal', proposalId: 12 })
  })

  it('채팅 진행 중에는 다시 제안 받기가 닫기도 하지 않는다', async () => {
    chatMock.mockImplementation(() => new Promise(() => {}))
    const { result } = setup()
    await waitFor(() => expect(result.current.proposals).toHaveLength(1))

    act(() => void result.current.send('검토해줘'))
    expect(result.current.busy).toEqual({ kind: 'chat' })
    act(() => result.current.requestAgain(result.current.proposals[0]))

    expect(closeMock).not.toHaveBeenCalled()
    expect(chatMock).toHaveBeenCalledTimes(1)
  })

  it('채팅 응답이 태스크 전환 뒤에 도착하면 새 세션을 건드리지 않는다', async () => {
    let resolveChat: (value: unknown) => void = () => {}
    chatMock.mockImplementation(() => new Promise((resolve) => (resolveChat = resolve)))
    const { result, rerender } = setup()
    await waitFor(() => expect(result.current.proposals).toHaveLength(1))

    act(() => void result.current.send('예외 조건 보강해줘'))
    expect(result.current.busy).toEqual({ kind: 'chat' })
    expect(result.current.messages).toEqual([{ kind: 'user', text: '예외 조건 보강해줘' }])

    rerender({ task: makeTask({ id: 8 }) })
    expect(result.current.messages).toEqual([])

    await act(async () => {
      resolveChat({ tool: 'no_change', message: '지금으로 충분해요.' })
    })
    expect(result.current.messages).toEqual([])
    expect(result.current.busy).toBeNull()
  })

  it('no_change 는 Navi 답변으로, 거부 실패는 오류 행으로 남고 제안은 pending 그대로', async () => {
    chatMock.mockResolvedValue({ tool: 'no_change', message: '지금으로 충분해요.' })
    rejectMock.mockRejectedValue(
      Object.assign(new Error('llm'), {
        isAxiosError: true,
        response: { status: 503, data: { message: 'LLM을 사용할 수 없습니다.' } },
      }),
    )
    const { result } = setup()
    await waitFor(() => expect(result.current.proposals).toHaveLength(1))

    await act(() => result.current.send('검토해줘'))
    expect(result.current.messages).toEqual([
      { kind: 'user', text: '검토해줘' },
      { kind: 'navi', text: '지금으로 충분해요.' },
    ])

    await act(() => result.current.reject(result.current.proposals[0], '사유'))
    expect(result.current.messages.at(-1)).toEqual({
      kind: 'error',
      text: 'LLM을 사용할 수 없습니다.',
      retryText: undefined,
    })
    expect(result.current.proposalsById.get(11)?.status).toBe('pending')
    expect(result.current.busy).toBeNull()
  })
})
