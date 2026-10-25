import { useEffect, useState } from 'react'
import { KeyRound, Pencil, Plus, Send, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { createDestination, deleteDestination, listDestinations, rotateSecret, updateDestination } from '@/api/destinations'
import ConfirmDialog from '@/components/ConfirmDialog'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import SecretDialog from '@/components/SecretDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function IconAction({ label, onClick, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={onClick} aria-label={label}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function DestinationDialog({ endpointId, destination, onClose, onSaved }) {
  const [name, setName] = useState(destination?.name ?? '')
  const [url, setUrl] = useState(destination?.url ?? '')
  const [timeoutMs, setTimeoutMs] = useState(destination?.timeoutMs ?? '')
  const [headers, setHeaders] = useState(Object.entries(destination?.customHeaders ?? {}))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const urlError = error?.details?.find((d) => d.path?.[0] === 'url')?.message
  const setHeader = (index, position, value) =>
    setHeaders((rows) => rows.map((row, i) => (i === index ? row.with(position, value) : row)))

  async function submit(e) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const body = {
      name,
      url,
      customHeaders: Object.fromEntries(headers.filter(([key]) => key.trim())),
      ...(timeoutMs !== '' && { timeoutMs: Number(timeoutMs) }),
    }
    try {
      onSaved(destination ? await updateDestination(destination.id, body) : await createDestination(endpointId, body), !destination)
    } catch (err) {
      setError(err)
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{destination ? 'Edit destination' : 'Add destination'}</DialogTitle>
            <DialogDescription>Captured events are forwarded here as signed HTTP requests.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="destination-name">Name</Label>
            <Input id="destination-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination-url">URL</Label>
            <Input
              id="destination-url"
              type="url"
              required
              maxLength={2048}
              placeholder="https://api.example.com/webhooks"
              className="font-mono"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={Boolean(urlError)}
              aria-describedby={urlError ? 'destination-url-error' : undefined}
            />
            {urlError && <p id="destination-url-error" className="text-sm text-destructive">{urlError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination-timeout">Timeout (ms)</Label>
            <Input id="destination-timeout" type="number" min={1000} max={30000} step={500} placeholder="10000" value={timeoutMs} onChange={(e) => setTimeoutMs(e.target.value)} />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Custom headers</legend>
            {headers.map(([key, value], i) => (
              <div key={i} className="flex gap-2">
                <Input aria-label={`Header ${i + 1} name`} className="font-mono" placeholder="x-api-key" value={key} onChange={(e) => setHeader(i, 0, e.target.value)} />
                <Input aria-label={`Header ${i + 1} value`} className="font-mono" placeholder="value" value={value} onChange={(e) => setHeader(i, 1, e.target.value)} />
                <IconAction label="Remove header" onClick={() => setHeaders((rows) => rows.filter((_, j) => j !== i))}><X /></IconAction>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setHeaders((rows) => [...rows, ['', '']])}><Plus />Add header</Button>
          </fieldset>
          <ErrorMessage error={urlError ? null : error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="brand" disabled={pending}>{destination ? 'Save' : 'Add destination'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function DestinationsPanel({ endpointId }) {
  const [destinations, setDestinations] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [secret, setSecret] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [toggling, setToggling] = useState([])

  useEffect(() => {
    let active = true
    listDestinations(endpointId)
      .then((list) => active && setDestinations(list))
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [endpointId])

  const replace = (saved) => setDestinations((list) => list.map((d) => (d.id === saved.id ? { ...d, ...saved } : d)))

  function saved(destination, created) {
    setEditing(null)
    if (created) {
      const { signingSecret, ...rest } = destination
      setDestinations((list) => [...list, rest])
      setSecret({ name: rest.name, value: signingSecret })
    } else {
      replace(destination)
      toast.success('Destination saved')
    }
  }

  async function toggle(destination, isActive) {
    setToggling((ids) => [...ids, destination.id])
    try {
      replace(await updateDestination(destination.id, { isActive }))
    } catch (err) {
      toast.error(err.message)
    }
    setToggling((ids) => ids.filter((id) => id !== destination.id))
  }

  const closeDialog = (open) => !open && setDialog((d) => ({ ...d, type: null }))

  if (error) return <ErrorMessage error={error} />
  if (!destinations) return <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Every captured event is forwarded to each active destination.</p>
        <Button variant="brand" onClick={() => setEditing({})}><Plus />Add destination</Button>
      </div>

      {destinations.length === 0 ? (
        <EmptyState icon={Send} title="No destinations yet" description="Add a URL and RELAY forwards every new event to it, with retries and a signed request.">
          <Button variant="brand" onClick={() => setEditing({})}><Plus />Add your first destination</Button>
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {destinations.map((destination) => (
            <li key={destination.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <div className="min-w-0 flex-1 basis-64 space-y-1">
                <p className="font-medium">{destination.name}</p>
                <p className="break-all font-mono text-xs text-muted-foreground">{destination.url}</p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{destination.timeoutMs} ms</span>
              <Switch checked={destination.isActive} disabled={toggling.includes(destination.id)} onCheckedChange={(on) => toggle(destination, on)} aria-label={`${destination.name} active`} />
              <div className="flex">
                <IconAction label="Edit" onClick={() => setEditing(destination)}><Pencil /></IconAction>
                <IconAction label="Rotate secret" onClick={() => setDialog({ type: 'rotate', destination })}><KeyRound /></IconAction>
                <IconAction label="Delete" onClick={() => setDialog({ type: 'delete', destination })}><Trash2 /></IconAction>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && <DestinationDialog endpointId={endpointId} destination={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={saved} />}
      {secret && (
        <SecretDialog
          title="Signing secret"
          description={`Use it to verify the HMAC signature on every delivery to ${secret.name}.`}
          value={secret.value}
          copyLabel="Copy secret"
          onClose={() => setSecret(null)}
        />
      )}

      <ConfirmDialog
        open={dialog?.type === 'rotate'}
        onOpenChange={closeDialog}
        title="Rotate signing secret?"
        description="The current secret stops working immediately. Update your server with the new one."
        confirmLabel="Rotate"
        destructive
        onConfirm={async () => {
          const { signingSecret } = await rotateSecret(dialog.destination.id)
          setSecret({ name: dialog.destination.name, value: signingSecret })
        }}
      />
      <ConfirmDialog
        open={dialog?.type === 'delete'}
        onOpenChange={closeDialog}
        title="Delete destination?"
        description={`Events are no longer forwarded to ${dialog?.destination?.name}.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteDestination(dialog.destination.id)
          setDestinations((list) => list.filter((d) => d.id !== dialog.destination.id))
          toast.success('Destination deleted')
        }}
      />
    </div>
  )
}
