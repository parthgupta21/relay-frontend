import { Navigate, useLocation } from 'react-router-dom'
import { useMe } from '@/hooks/useMe'
import AppLayout from '@/components/AppLayout'
import ErrorMessage from '@/components/ErrorMessage'
import { Skeleton } from '@/components/ui/skeleton'

export default function RequireAuth() {
  const { me, loading, error, refresh } = useMe()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
        <Skeleton className="hidden rounded-none lg:block" />
        <div className="space-y-4 p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }
  if (error?.status === 401) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (error) return <div className="p-6"><ErrorMessage error={error} /></div>
  return <AppLayout me={me} refresh={refresh} />
}
