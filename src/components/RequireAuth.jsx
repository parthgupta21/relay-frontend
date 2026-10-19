import { Navigate, useLocation } from 'react-router-dom'
import { useMe } from '@/hooks/useMe'
import AppLayout from '@/components/AppLayout'
import ErrorMessage from '@/components/ErrorMessage'

export default function RequireAuth() {
  const { me, loading, error, refresh } = useMe()
  const location = useLocation()

  if (loading) return <p className="p-6 text-muted-foreground">Loading...</p>
  if (error?.status === 401) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (error) return <div className="p-6"><ErrorMessage error={error} /></div>
  return <AppLayout me={me} refresh={refresh} />
}
