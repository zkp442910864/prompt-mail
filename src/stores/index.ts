import { QueryClient } from '@tanstack/react-query'

/** React Query 客户端 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 分钟
    },
  },
})
