import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '@/api/auth'
import { useMe } from '@/hooks/useMe'
import AppLayout from '@/components/AppLayout'
import ErrorMessage from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function WorkspaceSuspended() {
  const navigate = useNavigate()

  async function signOut() {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Workspace suspended</h1>
        <p className="text-sm text-muted-foreground">This workspace is suspended or deleted. Contact support if you think this is a mistake.</p>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  )
}

export default function RequireAuth() {
  const { me, loading, error } = useMe()
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
  if (error?.status === 403) return <WorkspaceSuspended />
  if (error) return <div className="p-6"><ErrorMessage error={error} /></div>
  return <AppLayout me={me} />
}
