import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** 초기 경로. 기본 /board */
  route?: string
  /** 이동 결과를 확인할 때 쓰는 추가 라우트 (path → element) */
  extraRoutes?: Record<string, ReactNode>
}

/** 라우터 + 툴팁 프로바이더 안에서 렌더 — 훅(React Query)이 필요한 컴포넌트는 페이지 단위라 여기서 다루지 않는다 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/board', extraRoutes, ...options }: Options = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TooltipProvider delay={0}>
        <Routes>
          <Route path={route} element={ui} />
          {Object.entries(extraRoutes ?? {}).map(([path, element]) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </TooltipProvider>
    </MemoryRouter>,
    options,
  )
}
