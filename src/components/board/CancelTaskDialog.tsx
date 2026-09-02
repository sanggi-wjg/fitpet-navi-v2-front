import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Task } from '@/types/task'

interface CancelTaskDialogProps {
  task: Task | null
  pending?: boolean
  onClose: () => void
  onConfirm: (task: Task) => void
}

/** 태스크 취소 확인 — 되돌릴 수 있으므로 차단형 경고가 아니다. 빨간 채움 버튼은 쓰지 않는다 (DESIGN.md D.0). */
export function CancelTaskDialog({
  task,
  pending = false,
  onClose,
  onConfirm,
}: CancelTaskDialogProps) {
  return (
    <Dialog open={task !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-5 p-6 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-[22px] leading-[1.3] font-medium">태스크 취소</DialogTitle>
          <DialogDescription className="text-body text-[14px] leading-[1.55]">
            <span className="text-ink font-medium">“{task?.title}”</span>
            을(를) 취소합니다. 보드에서 사라지고 상세는 읽기 전용이 됩니다. 나중에 Backlog로 복원할
            수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            className="h-10 px-4 text-[14px]"
            onClick={onClose}
            disabled={pending}
          >
            돌아가기
          </Button>
          <Button
            variant="outline"
            className="text-error-deep hover:text-error-deep h-10 px-4 text-[14px]"
            onClick={() => task && onConfirm(task)}
            disabled={pending}
          >
            {pending ? '취소 중…' : '태스크 취소'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
