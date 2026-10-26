import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { deleteAccount } from '@/api/account'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LIMIT_LABELS = [
  ['maxEndpoints', 'Endpoints'],
  ['maxDestinations', 'Destinations per endpoint'],
  ['maxEventsPerDay', 'Events per day'],
  ['maxEventsPerMonth', 'Events per month'],
  ['maxBodyBytes', 'Max body size (bytes)'],
  ['retentionDays', 'Retention (days)'],
]

function DeleteAccountDialog({ email, onClose }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const passwordError = error?.details?.find((d) => d.path === 'body.password')?.message

  async function submit(e) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await deleteAccount(password)
      toast.success('Account deleted')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err)
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>Your endpoints, events, deliveries and API tokens are permanently deleted. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-password">Password</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'delete-password-error' : undefined}
            />
            {passwordError && <p id="delete-password-error" className="text-sm text-destructive">{passwordError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-email">Type <span className="font-mono">{email}</span> to confirm</Label>
            <Input id="delete-email" autoComplete="off" required value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} />
          </div>
          <ErrorMessage error={passwordError ? null : error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={pending || confirmEmail !== email}>Delete account</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function Account() {
  const { me } = useOutletContext()
  const [deleting, setDeleting] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader title="Account" description="Your profile and workspace plan." />

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="min-w-0"><dt className="text-xs text-muted-foreground">Email</dt><dd className="truncate">{me.user.email}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Status</dt><dd><Badge variant={me.user.emailVerified ? 'secondary' : 'outline'}>{me.user.emailVerified ? 'Verified' : 'Not verified'}</Badge></dd></div>
          <div className="min-w-0"><dt className="text-xs text-muted-foreground">Workspace ID</dt><dd className="truncate font-mono">{me.workspace.id}</dd></div>
        </dl>
        <dl className="grid gap-4 border-t pt-4 text-sm sm:grid-cols-3">
          {LIMIT_LABELS.map(([key, label]) => (
            <div key={key}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-mono">{me.workspace.limits[key].toLocaleString()}</dd></div>
          ))}
        </dl>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/50 bg-card p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
          <p className="text-sm text-muted-foreground">Permanently delete your account and everything in this workspace.</p>
        </div>
        <Button variant="destructive" onClick={() => setDeleting(true)}>Delete account</Button>
      </section>

      {deleting && <DeleteAccountDialog email={me.user.email} onClose={() => setDeleting(false)} />}
    </div>
  )
}
