import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, RotateCw, Send } from 'lucide-react'
import { getEvent } from '@/api/events'
import { JsonHighlight } from '@/components/CodeBlock'
import CopyButton from '@/components/CopyButton'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import MethodBadge from '@/components/MethodBadge'
import PageHeader from '@/components/PageHeader'
import ReplayDialog from '@/components/ReplayDialog'
import StatusBadge, { ManualTag } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRealtimeEvent } from '@/hooks/useRealtime'
import { formatBytes, timeAgo } from '@/lib/utils'

const HEX_BYTES = 4096

function decodeBase64(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

function toHexDump(bytes) {
  const lines = []
  for (let offset = 0; offset < Math.min(bytes.length, HEX_BYTES); offset += 16) {
    const row = bytes.slice(offset, Math.min(offset + 16, HEX_BYTES))
    const hex = Array.from(row, (b) => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = Array.from(row, (b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('')
    lines.push(`${offset.toString(16).padStart(8, '0')}  ${hex.padEnd(47)}  ${ascii}`)
  }
  return lines.join('\n')
}

function Chip({ label, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all font-mono">{children}</span>
    </span>
  )
}

function KeyValueTable({ rows, empty }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <div className="rounded-lg border">
      <Table>
        <TableBody>
          {rows.map(([name, value], i) => (
            <TableRow key={`${name}-${i}`}>
              <TableCell className="w-1/3 break-all font-mono text-xs font-medium whitespace-normal">{name}</TableCell>
              <TableCell className="break-all font-mono text-xs whitespace-normal">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function BodyViewer({ event }) {
  const bytes = useMemo(() => (event.body ? decodeBase64(event.body) : null), [event.body])
  if (!bytes || bytes.length === 0) return <p className="text-sm text-muted-foreground">This event has no body.</p>

  const raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  const views = [
    ...(event.bodyJson !== null ? [['pretty', 'Pretty', JSON.stringify(event.bodyJson, null, 2)]] : []),
    ['raw', 'Raw', raw],
    ['hex', bytes.length > HEX_BYTES ? 'Hex (first 4 KB)' : 'Hex', toHexDump(bytes)],
  ]

  return (
    <Tabs defaultValue={views[0][0]}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          {views.map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}
        </TabsList>
        <div className="flex items-center gap-2">
          <CopyButton text={raw} label="Copy body" variant="outline" />
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/v1/events/${event.id}/body`} download><Download />Download</a>
          </Button>
        </div>
      </div>
      {views.map(([value, , text]) => (
        <TabsContent key={value} value={value}>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-all rounded-lg border bg-card p-3 font-mono text-xs leading-relaxed">
            {value === 'pretty' ? <JsonHighlight json={text} /> : text}
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function EventPanel({ id, onLoad }) {
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)
  const [replaying, setReplaying] = useState(false)
  const [version, setVersion] = useState(0)

  useRealtimeEvent('delivery.updated', (e) => e.eventId === id && setVersion((v) => v + 1))
  useRealtimeEvent('connect', () => setVersion((v) => v + 1))

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    getEvent(id, controller.signal)
      .then((e) => {
        if (!active) return
        setEvent(e)
        setError(null)
        onLoad?.(e)
      })
      .catch((err) => active && err.name !== 'AbortError' && setError(err))
    return () => {
      active = false
      controller.abort()
    }
  }, [id, onLoad, version])

  if (!event) {
    if (error) return <ErrorMessage error={error} />
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const query = [...new URLSearchParams(event.queryString ?? '')]
  const headers = Object.entries(event.headers).map(([name, value]) => [name, Array.isArray(value) ? value.join(', ') : String(value)])

  return (
    <div className="space-y-5">
      <ErrorMessage error={error} />
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MethodBadge method={event.method} className="mt-1" />
          <h2 className="break-all font-mono text-base font-semibold">{event.queryString ? `${event.path}?${event.queryString}` : event.path}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip label="Received"><time dateTime={event.receivedAt} title={new Date(event.receivedAt).toLocaleString()}>{timeAgo(event.receivedAt)}</time></Chip>
          <Chip label="Size">{formatBytes(event.bodySize)}</Chip>
          <Chip label="Type">{event.contentType ?? 'none'}</Chip>
          <Chip label="IP">{event.sourceIp}</Chip>
          {event.idempotencyKey && <Chip label="Key">{event.idempotencyKey}</Chip>}
        </div>
      </div>

      <Tabs defaultValue="body">
        <TabsList>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers ({headers.length})</TabsTrigger>
          <TabsTrigger value="query">Query ({query.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="body"><BodyViewer event={event} /></TabsContent>
        <TabsContent value="headers"><KeyValueTable rows={headers} empty="No headers." /></TabsContent>
        <TabsContent value="query"><KeyValueTable rows={query} empty="No query parameters." /></TabsContent>
      </Tabs>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Deliveries</h3>
          <Button variant="outline" size="sm" onClick={() => setReplaying(true)}><RotateCw />Replay event</Button>
        </div>
        {replaying && (
          <ReplayDialog
            eventId={event.id}
            endpointId={event.endpointId}
            onClose={() => setReplaying(false)}
            onReplayed={() => setVersion((v) => v + 1)}
          />
        )}
        {event.deliveries.length === 0 ? (
          <EmptyState icon={Send} title="Not forwarded" description="Add a destination on the endpoint's Destinations tab to forward events like this one." />
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {event.deliveries.map((delivery) => (
              <li key={delivery.id}>
                <Link to={`/app/deliveries/${delivery.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-accent/50">
                  <StatusBadge status={delivery.status} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{delivery.destinationName}</span>
                  {delivery.trigger === 'manual' && <ManualTag />}
                  <span className="text-xs text-muted-foreground">{delivery.attemptCount} {delivery.attemptCount === 1 ? 'attempt' : 'attempts'}</span>
                  <span className="font-mono text-xs text-muted-foreground">{delivery.lastStatus ?? '-'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function EventDetail() {
  const { id } = useParams()
  const [endpointId, setEndpointId] = useState(null)
  const onLoad = useCallback((e) => setEndpointId(e.endpointId), [])

  return (
    <div className="space-y-6">
      <PageHeader title="Event" back={{ to: endpointId ? `/app/endpoints/${endpointId}` : '/app/endpoints', label: 'Back to events' }} />
      <EventPanel id={id} onLoad={onLoad} />
    </div>
  )
}
