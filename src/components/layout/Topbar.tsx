import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface TopbarProps {
  left?: ReactNode
  right?: ReactNode
}

/** 앱 상단바 — 좌 워드마크 · 탭/브레드크럼 · 우 화면별 액션 슬롯 (코랄 채움 버튼은 1개) */
export function Topbar({ left, right }: TopbarProps) {
  return (
    <header className="border-hairline bg-canvas sticky top-0 z-30 flex h-14 shrink-0 items-center gap-5 border-b px-6">
      <Link to="/board" className="flex items-center gap-2">
        <span className="bg-primary size-2 rounded-full" aria-hidden />
        <span className="text-ink text-[15px] font-semibold">Navi</span>
      </Link>
      <span className="bg-hairline h-5 w-px" aria-hidden />
      <div className="flex min-w-0 items-center gap-1.5 text-[14px] font-medium">{left}</div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">{right}</div>
    </header>
  )
}
