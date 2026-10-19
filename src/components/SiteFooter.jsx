import Logo from '@/components/Logo'

const YEAR = new Date().getFullYear()

export default function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-foreground">Capture, inspect, forward and replay webhooks.</p>
        </div>
        <nav aria-label="Footer" className="flex gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how-it-works" className="hover:text-foreground">How it works</a>
          <a href="#docs" className="hover:text-foreground">Docs</a>
        </nav>
        <p className="text-xs text-muted-foreground">&copy; {YEAR} RELAY</p>
      </div>
    </footer>
  )
}
