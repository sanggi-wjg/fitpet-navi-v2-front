import { Link, useRouteError } from 'react-router-dom'
import { Callout } from '@/components/common/Callout'
import { Button } from '@/components/ui/button'

/** 라우트 렌더 오류 바운더리 — 카드 하나의 예외가 보드 전체를 죽이지 않게 한다 */
export function RouteError() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : '알 수 없는 오류'
  return (
    <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-8 py-16">
      <Callout variant="error" title="화면을 그리는 중 오류가 났습니다">
        <span className="font-mono text-[12px]">{message}</span>
      </Callout>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
          새로 고침
        </Button>
        <Link to="/board" className="text-primary-text text-[14px] font-medium">
          보드로 돌아가기
        </Link>
      </div>
    </main>
  )
}
