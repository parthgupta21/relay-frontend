import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteEndpoint, getEndpoint, rotateSlug, updateEndpoint } from '@/api/endpoints'
import { listEvents } from '@/api/events'
import ConfirmDialog from '@/components/ConfirmDialog'
import CopyButton from '@/components/CopyButton'
import ErrorMessage from '@/components/ErrorMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { usePolling } from '@/hooks/usePolling'
import { formatBytes, timeAgo } from '@/lib/utils'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export default function EndpointInspector() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [endpoint, setEndpoint] = useState(null)
  const [events, setEvents] = useState(null)
  const [nextCursor, setNextCursor] = useState(null)
  const [method, setMethod] = useState('ALL')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [newName, setNewName] = useState('')

  const methodFilter = method === 'ALL' ? undefined : method

  useEffect(() => {
    let active = true
    getEndpoint(id)
      .then((e) => active && setEndpoint(e))
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    let active = true
    listEvents(id, { method: methodFilter })
      .then((page) => {
        if (!active) return
        setEvents(page.items)
        setNextCursor(page.nextCursor)
      })
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [id, methodFilter])

  async function fetchNew() {
    setBusy(true)
    try {
      const page = await listEvents(id, { method: methodFilter })
      setEvents((current) => {
        if (!current) return current
        const known = new Set(current.map((e) => e.id))
        return [...page.items.filter((e) => !known.has(e.id)), ...current]
      })
      setError(null)
    } catch (err) {
      setError(err)
    }
    setBusy(false)
  }

  usePolling(fetchNew, 5000)

  async function loadMore() {
    setBusy(true)
    try {
      const page = await listEvents(id, { method: methodFilter, cursor: nextCursor })
      setEvents((current) => [...current, ...page.items])
      setNextCursor(page.nextCursor)
    } catch (err) {
      setError(err)
    }
    setBusy(false)
  }

  async function toggleActive(isActive) {
    try {
      setEndpoint(await updateEndpoint(id, { isActive }))
    } catch (err) {
      setError(err)
    }
  }

  if (error && (!endpoint || !events)) return <ErrorMessage error={error} />
  if (!endpoint || !events) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <Link to="/endpoints" className="text-sm text-muted-foreground hover:underline">All endpoints</Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold break-all">{endpoint.name}</h1>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={endpoint.isActive} onCheckedChange={toggleActive} />
            {endpoint.isActive ? 'Enabled' : 'Disabled'}
          </label>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-muted px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-sm">{endpoint.url}</code>
          <CopyButton text={endpoint.url} label="Copy URL" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { setNewName(endpoint.name); setDialog('rename') }}>Rename</Button>
          <Button variant="outline" size="sm" onClick={() => setDialog('rotate')}>Rotate slug</Button>
          <Button variant="destructive" size="sm" onClick={() => setDialog('delete')}>Delete</Button>
        </div>
      </div>

      <ErrorMessage error={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Events</h2>
        <div className="flex items-center gap-2">
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All methods</SelectItem>
              {METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchNew} disabled={busy}>Refresh</Button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No events yet. Send a request to the URL above and it shows up here.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {events.map((event) => (
            <li key={event.id}>
              <Link to={`/events/${event.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-muted/50">
                <Badge variant="outline" className="font-mono">{event.method}</Badge>
                <span className="min-w-0 flex-1 truncate font-mono text-sm">{event.path}</span>
                <span className="text-xs text-muted-foreground">{event.contentType ?? 'no content type'}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(event.bodySize)}</span>
                <time className="text-xs text-muted-foreground" title={event.receivedAt}>{timeAgo(event.receivedAt)}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {nextCursor && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMore} disabled={busy}>Load more</Button>
        </div>
      )}

      <ConfirmDialog
        open={dialog === 'rename'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Rename endpoint"
        confirmLabel="Save"
        onConfirm={async () => setEndpoint(await updateEndpoint(id, { name: newName }))}
      >
        <Input required maxLength={100} value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="Name" />
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'rotate'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Rotate slug?"
        description="You get a new URL. The old URL stops working immediately, so update every service that sends to it."
        confirmLabel="Rotate"
        destructive
        onConfirm={async () => setEndpoint(await rotateSlug(id))}
      />

      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Delete endpoint?"
        description="The endpoint and all of its captured events are deleted. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteEndpoint(id)
          navigate('/endpoints', { replace: true })
        }}
      />
    </div>
  )
}
