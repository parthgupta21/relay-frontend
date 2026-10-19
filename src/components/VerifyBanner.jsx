import { MailWarning } from 'lucide-react'
import ResendForm from '@/components/ResendForm'

export default function VerifyBanner({ email }) {
  return (
    <div role="status" className="mb-6 flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center">
      <MailWarning className="size-5 shrink-0 text-warning" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">Verify your email</p>
        <p className="text-muted-foreground">You need to verify <span className="font-mono">{email}</span> before you can create endpoints.</p>
      </div>
      <ResendForm email={email} variant="outline" />
    </div>
  )
}
