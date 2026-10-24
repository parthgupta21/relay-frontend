import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { logout } from '@/api/auth'
import Logo from '@/components/Logo'
import Sidebar from '@/components/Sidebar'
import VerifyBanner from '@/components/VerifyBanner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { socket } from '@/lib/socket'

export default function AppLayout({ me }) {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let timer
    const retry = () => {
      timer = setTimeout(() => socket.connect(), 5000)
    }
    socket.on('connect_error', retry)
    socket.connect()
    return () => {
      clearTimeout(timer)
      socket.off('connect_error', retry)
      socket.disconnect()
    }
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const sidebar = <Sidebar me={me} onLogout={handleLogout} loggingOut={loggingOut} />

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r bg-sidebar lg:block">{sidebar}</aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-lg lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0" onClick={(e) => e.target.closest('a') && setMenuOpen(false)}>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Navigation</SheetDescription>
              {sidebar}
            </SheetContent>
          </Sheet>
          <Logo to="/app/endpoints" />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {!me.user.emailVerified && <VerifyBanner email={me.user.email} />}
          <Outlet context={{ me }} />
        </main>
      </div>
    </div>
  )
}
