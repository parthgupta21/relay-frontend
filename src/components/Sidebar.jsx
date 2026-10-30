import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BarChart3, Gauge, KeyRound, LogOut, Moon, Shield, Sun, UserRound, Webhook } from 'lucide-react'
import { listEndpoints } from '@/api/endpoints'
import { getUsage } from '@/api/usage'
import Logo from '@/components/Logo'
import UsageMeter from '@/components/UsageMeter'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

function Item({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors', isActive ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground')}
    >
      <Icon className="size-4" />{label}
    </NavLink>
  )
}

export default function Sidebar({ me, onLogout, loggingOut }) {
  const { pathname } = useLocation()
  const [used, setUsed] = useState(null)
  const [month, setMonth] = useState(null)
  const { theme, toggle } = useTheme()
  const max = me.workspace.limits.maxEndpoints

  useEffect(() => {
    let active = true
    listEndpoints()
      .then((list) => active && setUsed(list.length))
      .catch(() => active && setUsed(null))
    getUsage()
      .then((usage) => active && setMonth(usage.month))
      .catch(() => active && setMonth(null))
    return () => {
      active = false
    }
  }, [pathname])

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Logo to="/app/endpoints" className="px-1" />
      <nav aria-label="App" className="flex flex-col gap-1">
        <Item to="/app/endpoints" icon={Webhook} label="Endpoints" />
        <Item to="/app/usage" icon={Gauge} label="Usage" />
        <Item to="/app/analytics" icon={BarChart3} label="Analytics" />
        <Item to="/app/settings/tokens" icon={KeyRound} label="API tokens" />
        {me.user.isOperator && <Item to="/app/admin" icon={Shield} label="Admin" />}
      </nav>
      <div className="mt-auto space-y-4">
        <div className="space-y-3 rounded-lg border p-3">
          <UsageMeter label="Endpoints" value={used ?? 0} limit={max} />
          {month && <UsageMeter label="Events this month" value={month.events} limit={month.eventsLimit} />}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs uppercase">{me.user.email.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-left text-xs font-normal">{me.user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{me.user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/settings/account"><UserRound />Account</Link>
            </DropdownMenuItem>
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
