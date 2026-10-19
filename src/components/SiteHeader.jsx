import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'

const LINKS = [
  ['Features', '#features'],
  ['How it works', '#how-it-works'],
  ['Docs', '#docs'],
]

export default function SiteHeader({ me }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {LINKS.map(([label, href]) => (
              <a key={href} href={href} className="rounded transition-colors hover:text-foreground">{label}</a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {me ? (
            <Button size="sm" asChild><Link to="/app/endpoints">Open dashboard</Link></Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
              <Button size="sm" asChild><Link to="/register">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
