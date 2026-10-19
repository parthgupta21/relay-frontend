import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/api/auth'
import VerifyBanner from '@/components/VerifyBanner'
import { Button } from '@/components/ui/button'

export default function AppLayout({ me, refresh }) {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/app/endpoints" className="font-bold tracking-widest">RELAY</Link>
          <div className="flex items-center gap-3 min-w-0">
            <span className="truncate text-sm text-muted-foreground">{me.user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut}>Log out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {!me.user.emailVerified && <VerifyBanner email={me.user.email} />}
        <Outlet context={{ me, refresh }} />
      </main>
    </div>
  )
}
