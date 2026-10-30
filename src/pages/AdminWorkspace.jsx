import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { deleteWorkspace, getWorkspace, updateWorkspace } from '@/api/admin'
import ConfirmDialog from '@/components/ConfirmDialog'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import UsageMeter from '@/components/UsageMeter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const LIMIT_FIELDS = [
  ['maxEndpoints', 'Endpoints', 1, 1000],
  ['maxDestinations', 'Destinations per endpoint', 1, 100],
  ['maxEventsPerDay', 'Events per day', 1, 10000000],
  ['maxEventsPerMonth', 'Events per month', 1, 100000000],
  ['maxBodyBytes', 'Max body size (bytes)', 1024, 10485760],
  ['retentionDays', 'Retention (days)', 1, 90],
]

function LimitsForm({ workspace, onSaved }) {
  const { limits } = workspace
  const [values, setValues] = useState(() => Object.fromEntries(LIMIT_FIELDS.map(([key]) => [key, String(limits[key])])))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const changed = Object.fromEntries(LIMIT_FIELDS.filter(([key]) => values[key] !== String(limits[key])).map(([key]) => [key, Number(values[key])]))

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      onSaved(await updateWorkspace(workspace.id, { limits: changed }))
      toast.success('Limits saved')
    } catch (err) {
      setError(err)
      toast.error(err.message)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border bg-card p-4">
      <h2 className="text-lg font-semibold">Limits</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {LIMIT_FIELDS.map(([key, label, min, max]) => {
          const fieldError = error?.details?.find((d) => d.path === `body.limits.${key}`)?.message
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={`limit-${key}`}>{label}</Label>
              <Input
                id={`limit-${key}`}
                type="number"
                min={min}
                max={max}
                required
                className="font-mono"
                value={values[key]}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                aria-invalid={Boolean(fieldError)}
              />
              {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
            </div>
          )
        })}
      </div>
      {Number(values.retentionDays) < limits.retentionDays && (
        <p className="text-sm text-warning">Lowering retention purges events older than {values.retentionDays} days on the next retention run.</p>
      )}
      <Button type="submit" disabled={saving || workspace.status === 'deleted' || Object.keys(changed).length === 0}>Save limits</Button>
    </form>
  )
}

export default function AdminWorkspace() {
  const { id } = useParams()
  const { me } = useOutletContext()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [error, setError] = useState(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')

  useEffect(() => {
    let active = true
    getWorkspace(id)
      .then((result) => active && setWorkspace(result))
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [id])

  const back = { to: '/app/admin', label: 'Workspaces' }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Workspace" back={back} />
        <ErrorMessage error={error} />
      </div>
    )
  }
  if (!workspace) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  const { owner, status, counts, usage, audit } = workspace
  const deleted = status === 'deleted'
  const nextStatus = status === 'active' ? 'suspended' : 'active'

  return (
    <div className="space-y-6">
      <PageHeader
        title={owner.email}
        description={<span className="font-mono">{workspace.id}</span>}
        back={back}
        actions={
          <>
            <StatusBadge status={status} />
            {!deleted && owner.id !== me.user.id && (
              <Button variant="outline" onClick={() => setChangingStatus(true)}>{status === 'active' ? 'Suspend' : 'Reactivate'}</Button>
            )}
          </>
        }
      />

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Email</dt><dd><Badge variant={owner.emailVerified ? 'secondary' : 'outline'}>{owner.emailVerified ? 'Verified' : 'Not verified'}</Badge></dd></div>
          <div><dt className="text-xs text-muted-foreground">Role</dt><dd>{owner.isOperator ? <Badge variant="secondary">Operator</Badge> : 'Member'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Created</dt><dd>{new Date(workspace.createdAt).toLocaleString()}</dd></div>
        </dl>
        {owner.deletedAt && <p className="text-sm text-muted-foreground">Owner deleted {new Date(owner.deletedAt).toLocaleString()}</p>}
        <dl className="grid gap-4 border-t pt-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Endpoints</dt><dd className="font-mono">{counts.endpoints.toLocaleString()}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Destinations</dt><dd className="font-mono">{counts.destinations.toLocaleString()}</dd></div>
          <div><dt className="text-xs text-muted-foreground">API tokens</dt><dd className="font-mono">{counts.apiTokens.toLocaleString()}</dd></div>
        </dl>
      </section>

      {usage ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border bg-card p-4"><UsageMeter label="Events this month" value={usage.month.events} limit={usage.month.eventsLimit} /></section>
          <section className="rounded-xl border bg-card p-4"><UsageMeter label="Events today" value={usage.today.events} limit={usage.today.eventsLimit} /></section>
        </div>
      ) : (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Usage unavailable</p>
      )}

      <LimitsForm workspace={workspace} onSaved={setWorkspace} />

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.map((entry, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono">{entry.action}</TableCell>
                <TableCell>{entry.actorEmail ?? '—'}</TableCell>
                <TableCell className="font-mono">{entry.ip ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {!deleted && !owner.isOperator && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/50 bg-card p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
            <p className="text-sm text-muted-foreground">Permanently delete this workspace and its owner account.</p>
          </div>
          <Button variant="destructive" onClick={() => setDeleting(true)}>Delete workspace</Button>
        </section>
      )}

      <ConfirmDialog
        open={changingStatus}
        onOpenChange={setChangingStatus}
        title={status === 'active' ? 'Suspend workspace?' : 'Reactivate workspace?'}
        description={status === 'active' ? 'The owner loses access to the app until the workspace is reactivated.' : 'The owner regains access to the app.'}
        confirmLabel={status === 'active' ? 'Suspend' : 'Reactivate'}
        destructive={status === 'active'}
        onConfirm={async () => {
          setWorkspace(await updateWorkspace(workspace.id, { status: nextStatus }))
          toast.success(status === 'active' ? 'Workspace suspended' : 'Workspace reactivated')
        }}
      />

      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => {
          setDeleting(open)
          setConfirmEmail('')
        }}
        title="Delete workspace?"
        description="The workspace, its endpoints, events and API tokens are permanently deleted. This cannot be undone."
        confirmLabel="Delete workspace"
        destructive
        confirmDisabled={confirmEmail !== owner.email}
        onConfirm={async () => {
          await deleteWorkspace(workspace.id, confirmEmail)
          toast.success('Workspace deleted')
          navigate('/app/admin', { replace: true })
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="delete-workspace-email">Type <span className="font-mono">{owner.email}</span> to confirm</Label>
          <Input id="delete-workspace-email" autoComplete="off" required value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} />
        </div>
      </ConfirmDialog>
    </div>
  )
}
