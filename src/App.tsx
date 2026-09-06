import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { RouteError } from '@/components/common/RouteError'
import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/sonner'
import { AskPage } from '@/pages/AskPage'
import { TaskBoardPage } from '@/pages/TaskBoardPage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, retry: 1 } },
})

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/board" replace /> },
      { path: 'board', element: <TaskBoardPage /> },
      { path: 'ask', element: <AskPage /> },
      { path: 'tasks/:taskId', element: <TaskDetailPage /> },
    ],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  )
}
