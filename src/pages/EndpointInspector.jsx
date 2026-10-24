import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Inbox, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { deleteEndpoint, getEndpoint, rotateSlug, updateEndpoint } from '@/api/endpoints'
import { listEvents } from '@/api/events'
import CodeBlock from '@/components/CodeBlock'
import ConfirmDialog from '@/components/ConfirmDialog'
import CopyButton from '@/components/CopyButton'
import DestinationsPanel from '@/components/DestinationsPanel'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import MethodBadge from '@/components/MethodBadge'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePolling } from '@/hooks/usePolling'
import { useRealtimeConnected, useRealtimeEvent } from '@/hooks/useRealtime'
import { cn, formatBytes, timeAgo } from '@/lib/utils'
import { EventPanel } from '@/pages/EventDetail'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const desktop = window.matchMedia('(min-width: 1024px)')

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      desktop.addEventListener('change', onChange)
      return () => desktop.removeEventListener('change', onChange)
    },
    () => desktop.matches,
  )
}

function SettingsTab({ endpoint, onChange, onRotate, onDelete }) {
  const [name, setName] = useState(endpoint.name)
  const [idempotencyHeader, setIdempotencyHeader] = useState(endpoint.idempotencyHeader ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      onChange(await updateEndpoint(endpoint.id, { name, idempotencyHeader: idempotencyHeader || null }))
      toast.success('Settings saved')
    } catch (err) {
      setError(err)
    }
    setSaving(false)
  }

  async function toggleActive(isActive) {
    try {
      onChange(await updateEndpoint(endpoint.id, { isActive }))
      toast.success(isActive ? 'Endpoint enabled' : 'Endpoint disabled')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={save} className="space-y-4 rounded-xl border bg-card p-5">
        <ErrorMessage error={error} />
        <div className="space-y-2">
          <Label htmlFor="endpoint-name">Name</Label>
          <Input id="endpoint-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endpoint-idempotency">Idempotency header</Label>
          <Input id="endpoint-idempotency" className="font-mono" placeholder="x-github-delivery" maxLength={100} value={idempotencyHeader} onChange={(e) => setIdempotencyHeader(e.target.value)} />
          <p className="text-xs text-muted-foreground">Requests that repeat this header's value are captured once.</p>
        </div>
        <Button type="submit" disabled={saving}>Save changes</Button>
      </form>

      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5">
        <div>
          <p className="text-sm font-medium">Accept requests</p>
          <p className="text-sm text-muted-foreground">Disabled endpoints reject incoming requests.</p>
        </div>
        <Switch checked={endpoint.isActive} onCheckedChange={toggleActive} aria-label="Accept requests" />
      </div>

      <div className="space-y-4 rounded-xl border border-destructive/40 p-5">
        <h3 className="font-medium text-destructive">Danger zone</h3>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-sm text-muted-foreground">Rotating the slug gives you a new URL. The old URL stops working immediately.</p>
          <Button variant="outline" onClick={onRotate}>Rotate slug</Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-sm text-muted-foreground">Deletes the endpoint and all of its captured events.</p>
          <Button variant="destructive" onClick={onDelete}>Delete endpoint</Button>
        </div>
      </div>
    </div>
  )
}

export default function EndpointInspector() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const [endpoint, setEndpoint] = useState(null)
  const [list, setList] = useState(null)
  const [method, setMethod] = useState('ALL')
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState(null)
  const fetching = useRef(false)
  const pending = useRef(false)
  const latestFetchNew = useRef(null)

  const methodFilter = method === 'ALL' ? undefined : method
  const key = `${id}:${method}`
  const currentKey = useRef(key)
  const events = list?.key === key ? list.events : null
  const nextCursor = list?.key === key ? list.nextCursor : null

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
        setList({ key, events: page.items, nextCursor: page.nextCursor })
        setSelectedId(page.items[0]?.id ?? null)
      })
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [id, methodFilter, key])

  useEffect(() => {
    latestFetchNew.current = fetchNew
    currentKey.current = key
  })

  useEffect(() => () => {
    pending.current = false
  }, [])

  async function fetchNew() {
    if (fetching.current) {
      pending.current = true
      return
    }
    fetching.current = true
    try {
      const page = await listEvents(id, { method: methodFilter, signal: AbortSignal.timeout(15000) })
      setList((cur) => {
        if (cur?.key !== key) return key === currentKey.current ? { key, events: page.items, nextCursor: page.nextCursor } : cur
        const known = new Set(cur.events.map((e) => e.id))
        return { ...cur, events: [...page.items.filter((e) => !known.has(e.id)), ...cur.events] }
      })
      setSelectedId((s) => s ?? page.items[0]?.id ?? null)
      setError(null)
    } catch (err) {
      setError(err)
    }
    fetching.current = false
    if (pending.current) {
      pending.current = false
      latestFetchNew.current()
    }
  }

  async function refresh() {
    setBusy(true)
    await fetchNew()
    setBusy(false)
  }

  const connected = useRealtimeConnected()
  useRealtimeEvent('event.created', (e) => e.endpointId === id && fetchNew())
  useRealtimeEvent('connect', fetchNew)
  usePolling(fetchNew, connected ? 30000 : 5000)

  async function loadMore() {
    setBusy(true)
    try {
      const page = await listEvents(id, { method: methodFilter, cursor: nextCursor })
      setList((cur) => (cur?.key === key ? { ...cur, events: [...cur.events, ...page.items], nextCursor: page.nextCursor } : cur))
    } catch (err) {
      setError(err)
    }
    setBusy(false)
  }

  if (error && !endpoint) return <ErrorMessage error={error} />
  if (!endpoint) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const activeId = selectedId ?? events?.[0]?.id

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/app/endpoints', label: 'All endpoints' }}
        title={endpoint.name}
        description={
          <span className="flex items-center gap-1">
            <code className="min-w-0 break-all font-mono text-xs">{endpoint.url}</code>
            <CopyButton text={endpoint.url} label="Copy URL" />
          </span>
        }
        actions={<StatusBadge status={endpoint.isActive ? 'active' : 'disabled'} />}
      />

      <ErrorMessage error={error} />

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span role="status">
              {connected ? (
                <span className="flex items-center gap-2 text-sm text-success">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-success" />
                  </span>
                  Live
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Reconnecting</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-36" aria-label="Filter by method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All methods</SelectItem>
                  {METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={refresh} disabled={busy} aria-label="Refresh events"><RefreshCw className={busy ? 'animate-spin' : ''} /></Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {!events ? (
            !error && <Skeleton className="h-96 w-full" />
          ) : events.length === 0 ? (
            <EmptyState icon={Inbox} title="No events yet" description="Send a request to the endpoint URL and it shows up here within seconds.">
              <CodeBlock label="curl" code={`curl -X POST ${endpoint.url} -d 'hello'`} className="mt-2 w-full max-w-xl text-left" />
            </EmptyState>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
              <div>
                <ul className="divide-y overflow-hidden rounded-xl border bg-card lg:max-h-[40rem] lg:overflow-y-auto">
                  <AnimatePresence initial={false}>
                    {events.map((event) => (
                      <motion.li key={event.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                        <Link
                          to={`/app/events/${event.id}`}
                          onClick={(e) => {
                            if (!isDesktop) return
                            e.preventDefault()
                            setSelectedId(event.id)
                          }}
                          aria-current={isDesktop && event.id === activeId ? 'true' : undefined}
                          className={cn('flex flex-col gap-1 px-3 py-2.5 transition-colors hover:bg-accent/50', isDesktop && event.id === activeId && 'bg-accent')}
                        >
                          <span className="flex items-center gap-2">
                            <MethodBadge method={event.method} />
                            <span className="min-w-0 flex-1 truncate font-mono text-xs">{event.path}</span>
                          </span>
                          <span className="flex justify-between text-xs text-muted-foreground">
                            <time dateTime={event.receivedAt} title={new Date(event.receivedAt).toLocaleString()}>{timeAgo(event.receivedAt)}</time>
                            <span>{formatBytes(event.bodySize)}</span>
                          </span>
                        </Link>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                {nextCursor && (
                  <div className="mt-3 text-center">
                    <Button variant="outline" onClick={loadMore} disabled={busy}>Load more</Button>
                  </div>
                )}
              </div>
              {isDesktop && activeId && (
                <div className="min-w-0 rounded-xl border bg-card p-5">
                  <EventPanel key={activeId} id={activeId} />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="destinations">
          <DestinationsPanel endpointId={id} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab endpoint={endpoint} onChange={setEndpoint} onRotate={() => setDialog('rotate')} onDelete={() => setDialog('delete')} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={dialog === 'rotate'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Rotate slug?"
        description="You get a new URL. The old URL stops working immediately, so update every service that sends to it."
        confirmLabel="Rotate"
        destructive
        onConfirm={async () => {
          setEndpoint(await rotateSlug(id))
          toast.success('Slug rotated')
        }}
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
          toast.success('Endpoint deleted')
          navigate('/app/endpoints', { replace: true })
        }}
      />
    </div>
  )
}
