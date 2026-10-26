import { useEffect, useState } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'
import { getDeliveryAnalytics } from '@/api/analytics'
import { listEndpoints } from '@/api/endpoints'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const ALL_ENDPOINTS = 'all'

const FAILURE_REASONS = {
  non_retryable: 'Non-retryable response',
  exhausted: 'Retries exhausted',
  ssrf_blocked: 'Blocked by SSRF protection',
  destination_disabled: 'Destination disabled',
}

const OUTCOMES = {
  success: 'Success',
  http_error: 'HTTP error',
  timeout: 'Timeout',
  network_error: 'Network error',
  blocked: 'Blocked',
}

const formatBucket = (start, bucket) =>
  new Date(start).toLocaleString(undefined, bucket === 'hour' ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' } : { month: 'short', day: 'numeric', timeZone: 'UTC' })

const formatRate = (succeeded, failed) => (succeeded + failed ? `${((succeeded / (succeeded + failed)) * 100).toFixed(1)}%` : '—')

const formatMs = (ms) => (ms === null ? '—' : ms.toLocaleString())

function Stat({ label, value, hint }) {
  return (
    <section className="space-y-1 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-mono text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </section>
  )
}

function DeliveriesChart({ series, bucket }) {
  const peak = Math.max(1, ...series.map((point) => point.succeeded + point.failed + point.inProgress))
  const height = (count) => ({ height: `${(count / peak) * 100}%` })

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Deliveries created per {bucket}</h2>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-success" />Succeeded</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-destructive" />Failed</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-muted-foreground" />In progress</span>
        </div>
      </div>
      <div aria-hidden="true" className="flex h-40 items-end gap-1">
        {series.map((point) => (
          <div
            key={point.start}
            title={`${formatBucket(point.start, bucket)}: ${point.succeeded} succeeded, ${point.failed} failed, ${point.inProgress} in progress`}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
          >
            <div className="bg-muted-foreground" style={height(point.inProgress)} />
            <div className="bg-destructive" style={height(point.failed)} />
            <div className="rounded-b-sm bg-success" style={height(point.succeeded)} />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex justify-between text-xs text-muted-foreground">
        <span>{formatBucket(series[0].start, bucket)}</span>
        <span>{formatBucket(series.at(-1).start, bucket)}</span>
      </div>
      <table className="sr-only">
        <caption>Deliveries created per {bucket} (UTC)</caption>
        <thead>
          <tr><th scope="col">Period</th><th scope="col">Succeeded</th><th scope="col">Failed</th><th scope="col">In progress</th></tr>
        </thead>
        <tbody>
          {series.map((point) => (
            <tr key={point.start}>
              <th scope="row">{formatBucket(point.start, bucket)}</th><td>{point.succeeded}</td><td>{point.failed}</td><td>{point.inProgress}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Breakdown({ title, rows }) {
  const peak = Math.max(1, ...rows.map((row) => row.count))

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.map((row) => (
        <div key={row.label} className="space-y-1.5">
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono">{row.count.toLocaleString()}</span>
          </div>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full', row.color)} style={{ width: `${(row.count / peak) * 100}%` }} />
          </div>
        </div>
      ))}
    </section>
  )
}

export default function Analytics() {
  const [range, setRange] = useState('24h')
  const [endpointId, setEndpointId] = useState(ALL_ENDPOINTS)
  const [endpoints, setEndpoints] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    listEndpoints()
      .then((list) => active && setEndpoints(list))
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [version])

  useEffect(() => {
    let active = true
    getDeliveryAnalytics({ range, endpointId: endpointId === ALL_ENDPOINTS ? undefined : endpointId })
      .then((result) => active && setAnalytics(result))
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [range, endpointId, version])

  function retry() {
    setError(null)
    setVersion((v) => v + 1)
  }

  function changeFilter(setFilter) {
    return (value) => {
      setFilter(value)
      setAnalytics(null)
      setError(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Deliveries created in the selected window. Times in UTC."
        actions={
          <>
            <Tabs value={range} onValueChange={changeFilter(setRange)}>
              <TabsList>
                <TabsTrigger value="24h">24 hours</TabsTrigger>
                <TabsTrigger value="7d">7 days</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={endpointId} onValueChange={changeFilter(setEndpointId)}>
              <SelectTrigger className="w-48" aria-label="Filter by endpoint"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ENDPOINTS}>All endpoints</SelectItem>
                {endpoints.map((endpoint) => <SelectItem key={endpoint.id} value={endpoint.id}>{endpoint.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={retry} aria-label="Refresh analytics"><RefreshCw /></Button>
          </>
        }
      />

      {error && (
        <div className="space-y-4">
          <ErrorMessage error={error.status === 503 ? { message: 'Analytics is temporarily unavailable' } : error} />
          <Button variant="outline" onClick={retry}>Retry</Button>
        </div>
      )}

      {!analytics ? (
        !error && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        )
      ) : analytics.totals.deliveries === 0 ? (
        <EmptyState icon={BarChart3} title="No deliveries in this window" description="Deliveries created in the selected window will show up here." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Deliveries" value={analytics.totals.deliveries.toLocaleString()} hint={`${analytics.totals.attempts.toLocaleString()} attempts`} />
            <Stat label="Success rate" value={formatRate(analytics.totals.succeeded, analytics.totals.failed)} hint="Excludes in progress" />
            <Stat label="Failed" value={analytics.totals.failed.toLocaleString()} hint={`${analytics.totals.inProgress.toLocaleString()} in progress`} />
            <Stat label="Latency p50 / p95" value={`${formatMs(analytics.totals.p50Ms)} / ${formatMs(analytics.totals.p95Ms)}`} hint="Milliseconds per attempt" />
          </div>
          <DeliveriesChart series={analytics.series} bucket={analytics.bucket} />
          <div className="grid gap-4 md:grid-cols-2">
            <Breakdown
              title="Failure reasons"
              rows={Object.entries(analytics.failureReasons).map(([reason, count]) => ({ label: FAILURE_REASONS[reason], count, color: 'bg-destructive' }))}
            />
            <Breakdown
              title="Attempt outcomes"
              rows={Object.entries(analytics.outcomes).map(([outcome, count]) => ({ label: OUTCOMES[outcome], count, color: outcome === 'success' ? 'bg-success' : 'bg-destructive' }))}
            />
          </div>
          <section className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="text-lg font-semibold">Destinations</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Deliveries</TableHead>
                  <TableHead className="text-right">Success rate</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.destinations.map((destination) => (
                  <TableRow key={destination.id}>
                    <TableCell className="whitespace-normal">
                      <span className="flex items-center gap-2">
                        {destination.name}
                        {destination.deleted && <Badge variant="secondary">Deleted</Badge>}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{destination.deliveries.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{formatRate(destination.succeeded, destination.failed)}</TableCell>
                    <TableCell className="text-right font-mono">{destination.failed.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
          <p className="text-xs text-muted-foreground">Delivery history older than {analytics.retentionDays} days is purged.</p>
        </>
      )}
    </div>
  )
}
