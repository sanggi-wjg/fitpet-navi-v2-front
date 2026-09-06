import {
  CircleCheck,
  FileText,
  FolderOpen,
  Layers,
  Lightbulb,
  MessageSquareText,
  Search,
  Wrench,
  X,
} from 'lucide-react'
import { BusyDots } from '@/components/common/BusyDots'
import type { AskStep, AskToolStatus, AskTurnStatus } from '@/types/ask'

interface AskStepRowProps {
  step: AskStep
  turnStatus: AskTurnStatus
}

/** 과정 블록 한 행 (DESIGN.md D.4 `ask-step` · `ask-target-step` · `ask-note`) */
export function AskStepRow({ step, turnStatus }: AskStepRowProps) {
  return (
    <li className="flex items-start gap-2.5">
      <StepIcon step={step} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <StepBody step={step} />
      </div>
      <StepStatus step={step} turnStatus={turnStatus} />
    </li>
  )
}

const ICON_CLASS = 'text-muted mt-0.5 size-4 shrink-0'

/** 행 아이콘 — 대상 `Layers` · 생각 `Lightbulb` · 설명 `MessageSquareText` · 도구별(미지 도구는 `Wrench`) */
function StepIcon({ step }: { step: AskStep }) {
  switch (step.kind) {
    case 'target':
      return <Layers className={ICON_CLASS} strokeWidth={1.75} aria-hidden />
    case 'thinking':
      return <Lightbulb className={ICON_CLASS} strokeWidth={1.75} aria-hidden />
    case 'note':
      return <MessageSquareText className={ICON_CLASS} strokeWidth={1.75} aria-hidden />
    case 'tool':
      switch (step.name) {
        case 'list_dir':
          return <FolderOpen className={ICON_CLASS} strokeWidth={1.75} aria-hidden />
        case 'search_code':
          return <Search className={ICON_CLASS} strokeWidth={1.75} aria-hidden />
        case 'read_file':
          return <FileText className={ICON_CLASS} strokeWidth={1.75} aria-hidden />
        default:
          return <Wrench className={ICON_CLASS} strokeWidth={1.75} aria-hidden />
      }
  }
}

function StepBody({ step }: { step: AskStep }) {
  switch (step.kind) {
    case 'target':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Label>{step.mode === 'select' ? '대상 선택' : '대상 추가'}</Label>
          <Target>{step.repo}</Target>
        </div>
      )
    case 'thinking':
      return (
        <>
          <Label>생각</Label>
          <p className="text-muted text-[13px] leading-[1.5] whitespace-pre-wrap">{step.text}</p>
        </>
      )
    case 'note':
      return (
        <>
          <Label>설명</Label>
          <p className="text-body text-[13px] leading-[1.5] whitespace-pre-wrap">{step.text}</p>
        </>
      )
    case 'tool':
      return (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Label>{step.label}</Label>
            {step.target !== '' && <Target>{step.target}</Target>}
          </div>
          {step.summary !== null && <span className="text-muted text-[12px]">{step.summary}</span>}
        </>
      )
  }
}

function Label({ children }: { children: string }) {
  return <span className="text-body text-[13px] font-medium whitespace-nowrap">{children}</span>
}

function Target({ children }: { children: string }) {
  return <span className="text-muted min-w-0 font-mono text-[12px] break-all">{children}</span>
}

/** 우측 상태 — 도구 행은 running/done/failed, 대상 행은 항상 완료. 종결된 턴에 남은 running 은 실패로 본다 */
function StepStatus({ step, turnStatus }: AskStepRowProps) {
  if (step.kind !== 'tool' && step.kind !== 'target') return null
  const active = turnStatus.kind === 'connecting' || turnStatus.kind === 'streaming'
  const status: AskToolStatus =
    step.kind === 'target' ? 'done' : step.status === 'running' && !active ? 'failed' : step.status

  if (status === 'running') {
    return (
      <>
        <BusyDots size="sm" className="mt-[7px]" />
        <span className="sr-only">진행 중</span>
      </>
    )
  }
  if (status === 'done') {
    return (
      <>
        <CircleCheck
          className="text-success-deep mt-[3px] size-3.5 shrink-0"
          strokeWidth={2}
          aria-hidden
        />
        <span className="sr-only">완료</span>
      </>
    )
  }
  return (
    <>
      <X className="text-muted-soft mt-[3px] size-3.5 shrink-0" strokeWidth={2} aria-hidden />
      <span className="sr-only">실패</span>
    </>
  )
}
