import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, LogOut, Moon, Settings, Sun, Webhook } from 'lucide-react'
import { listEndpoints } from '@/api/endpoints'
import Logo from '@/components/Logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

function Soon({ icon: Icon, label }) {
  return (
    <span aria-disabled="true" className="flex cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground/60">
      <Icon className="size-4" />{label}
      <Badge variant="secondary" className="ml-auto">Soon</Badge>
    </span>
  )
}

export default function Sidebar({ me, onLogout, loggingOut }) {
  const { pathname } = useLocation()
  const [used, setUsed] = useState(null)
  const { theme, toggle } = useTheme()
  const max = me.workspace.limits.maxEndpoints

  useEffect(() => {
    let active = true
    listEndpoints()
      .then((list) => active && setUsed(list.length))
      .catch(() => active && setUsed(null))
    return () => {
      active = false
    }
  }, [pathname])

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Logo to="/app/endpoints" className="px-1" />
      <nav aria-label="App" className="flex flex-col gap-1">
        <NavLink
          to="/app/endpoints"
          className={({ isActive }) => cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors', isActive ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground')}
        >
          <Webhook className="size-4" />Endpoints
        </NavLink>
        <Soon icon={BarChart3} label="Analytics" />
        <Soon icon={Settings} label="Settings" />
      </nav>
      <div className="mt-auto space-y-4">
        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Endpoints</span>
            <span className="font-mono">{used ?? '-'} / {max}</span>
          </div>
          <div role="progressbar" aria-label="Endpoints used" aria-valuemin={0} aria-valuemax={max} aria-valuenow={used ?? 0} className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, ((used ?? 0) / max) * 100)}%` }} />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-2" aria-label="User menu">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs uppercase">{me.user.email.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-left text-xs font-normal">{me.user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{me.user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggle() }}>
              {theme === 'dark' ? <Sun /> : <Moon />}{theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onLogout} disabled={loggingOut}><LogOut />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
