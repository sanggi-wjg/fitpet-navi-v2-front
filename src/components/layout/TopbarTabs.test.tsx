import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TopbarTabs } from '@/components/layout/TopbarTabs'
import { renderWithProviders } from '@/test/render'

describe('TopbarTabs', () => {
  it('/ask 에서는 구현 확인이 활성(aria-current)이고 업무 보드는 /board 링크다', () => {
    renderWithProviders(<TopbarTabs />, { route: '/ask' })
    expect(screen.getByRole('link', { name: '구현 확인' })).toHaveAttribute('aria-current', 'page')
    const board = screen.getByRole('link', { name: '업무 보드' })
    expect(board).not.toHaveAttribute('aria-current')
    expect(board).toHaveAttribute('href', '/board')
  })

  it('/board 에서는 업무 보드가 활성이다', () => {
    renderWithProviders(<TopbarTabs />, { route: '/board' })
    expect(screen.getByRole('link', { name: '업무 보드' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: '구현 확인' })).not.toHaveAttribute('aria-current')
  })
})
