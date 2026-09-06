import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/board', label: '업무 보드' },
  { to: '/ask', label: '구현 확인' },
]

/** 상단바 좌측 탭 — 활성은 `surface-card` (DESIGN.md D.0 `app-topbar`). "분석"은 라우트가 생기면 추가한다 */
export function TopbarTabs() {
  return (
    <nav aria-label="주요 화면" className="flex items-center gap-1">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            cn(
              'rounded-md px-2.5 py-1.5 transition-colors',
              isActive
                ? 'bg-surface-card text-ink'
                : 'text-muted hover:bg-surface-soft hover:text-ink',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
