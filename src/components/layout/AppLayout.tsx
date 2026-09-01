import { Outlet } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppLayout() {
  return (
    <TooltipProvider delay={200}>
      <div className="bg-canvas text-ink flex min-h-screen flex-col">
        <Outlet />
      </div>
    </TooltipProvider>
  )
}
