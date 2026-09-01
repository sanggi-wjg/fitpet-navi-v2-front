import { Callout } from '@/components/common/Callout'
import { MarkerText } from '@/components/common/MarkerText'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { MarkerLocation } from '@/lib/markdown'

interface AnalyzeWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 게이트와 같은 소스(문서 전체)에서 뽑은 마커 위치 */
  markers: MarkerLocation[]
  onProceed: () => void
  onFix: () => void
}

/** "분석 시작" 클릭 시 `(예:` 마커가 남아 있으면. 차단하지 않는다 (spec 범위 1). */
export function AnalyzeWarningDialog({
  open,
  onOpenChange,
  markers,
  onProceed,
  onFix,
}: AnalyzeWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-[22px] leading-[1.3] font-medium">
            분석을 시작하기 전에
          </DialogTitle>
          <DialogDescription className="sr-only">예제 텍스트가 남아 있습니다</DialogDescription>
        </DialogHeader>
        <Callout
          title={
            <>
              예제 텍스트 <strong className="font-semibold">{markers.length}건</strong>이 남아
              있습니다
            </>
          }
        >
          예제 값이 그대로 분석되면 미결정 사항과 산정 결과가 부정확해집니다.
        </Callout>
        <ul className="flex max-h-64 flex-col gap-2.5 overflow-y-auto">
          {markers.map((marker, index) => (
            <li key={index} className="flex flex-col gap-1">
              <span className="kicker">{marker.section}</span>
              <span className="text-body text-[14px] leading-[1.6]">
                <MarkerText text={marker.text} />
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" className="h-10 px-4 text-[14px]" onClick={onProceed}>
            그대로 분석
          </Button>
          <Button className="h-10 px-4 text-[14px] font-semibold" onClick={onFix}>
            돌아가서 수정
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
