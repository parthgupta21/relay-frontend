import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent } from '@/api/events'
import CopyButton from '@/components/CopyButton'
import ErrorMessage from '@/components/ErrorMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes } from '@/lib/utils'

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

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-all text-sm">{children}</dd>
    </div>
  )
}

function BodyViewer({ event }) {
  const bytes = useMemo(() => (event.body ? decodeBase64(event.body) : null), [event.body])
  if (!bytes || bytes.length === 0) return <p className="text-sm text-muted-foreground">This event has no body.</p>

  const raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  const hasJson = event.bodyJson !== null
  const views = [
    ...(hasJson ? [['pretty', 'Pretty', JSON.stringify(event.bodyJson, null, 2)]] : []),
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
            <a href={`/api/v1/events/${event.id}/body`} download>Download raw</a>
          </Button>
        </div>
      </div>
      {views.map(([value, , text]) => (
        <TabsContent key={value} value={value}>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 font-mono text-xs">{text}</pre>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default function EventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getEvent(id)
      .then((e) => active && setEvent(e))
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [id])

  if (error) return <ErrorMessage error={error} />
  if (!event) return <p className="text-muted-foreground">Loading...</p>

  const fullPath = event.queryString ? `${event.path}?${event.queryString}` : event.path

  return (
    <div className="space-y-6">
      <Link to={`/app/endpoints/${event.endpointId}`} className="text-sm text-muted-foreground hover:underline">Back to events</Link>

      <div className="flex items-start gap-3">
        <Badge variant="outline" className="font-mono">{event.method}</Badge>
        <h1 className="break-all font-mono text-lg font-semibold">{fullPath}</h1>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Received">{new Date(event.receivedAt).toLocaleString()} ({event.receivedAt})</Field>
        <Field label="Source IP">{event.sourceIp}</Field>
        <Field label="Size">{formatBytes(event.bodySize)}</Field>
        <Field label="Content type">{event.contentType ?? 'none'}</Field>
        <Field label="Idempotency key">{event.idempotencyKey ?? 'none'}</Field>
      </dl>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Headers</h2>
        <Table>
          <TableBody>
            {Object.entries(event.headers).map(([name, value]) => (
              <TableRow key={name}>
                <TableCell className="w-1/3 break-all font-mono text-xs font-medium">{name}</TableCell>
                <TableCell className="break-all font-mono text-xs whitespace-normal">{Array.isArray(value) ? value.join(', ') : String(value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Body</h2>
        <BodyViewer event={event} />
      </section>

      {event.deliveries.length === 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Deliveries</h2>
          <p className="text-sm text-muted-foreground">Forwarding arrives in the next phase</p>
        </section>
      )}
    </div>
  )
}
