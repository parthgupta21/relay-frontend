import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'

export default function AuthCard({ title, description, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col p-6">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold">{title}</h1>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="space-y-4">{children}</div>
          </div>
        </main>
      </div>
      <aside className="relative hidden overflow-hidden border-l bg-sidebar lg:flex lg:flex-col lg:justify-end lg:p-12">
        <div className="bg-grid absolute inset-0" />
        <div className="bg-glow absolute inset-0" />
        <div className="relative max-w-md space-y-4">
          <p className="text-3xl font-semibold leading-tight">Never lose a webhook again.</p>
          <p className="text-muted-foreground">Capture every request byte for byte, inspect it live, and forward it with signed deliveries and automatic retries.</p>
        </div>
      </aside>
    </div>
  )
}
