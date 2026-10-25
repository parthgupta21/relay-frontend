import { useEffect, useState } from 'react'
import { getUsage } from '@/api/usage'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import UsageMeter from '@/components/UsageMeter'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const formatDay = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })

function DailyChart({ days }) {
  const peak = Math.max(1, ...days.flatMap((day) => [day.events, day.deliveries]))

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Last 31 days</h2>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand" />Events</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-muted-foreground" />Delivery attempts</span>
        </div>
      </div>
      <div aria-hidden="true" className="flex h-40 items-end gap-1">
        {days.map((day) => (
          <div key={day.date} title={`${formatDay(day.date)}: ${day.events} events, ${day.deliveries} delivery attempts`} className="flex h-full min-w-0 flex-1 items-end gap-px">
            <div className="w-1/2 rounded-t-sm bg-brand" style={{ height: `${(day.events / peak) * 100}%` }} />
            <div className="w-1/2 rounded-t-sm bg-muted-foreground" style={{ height: `${(day.deliveries / peak) * 100}%` }} />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDay(days[0].date)}</span>
        <span>{formatDay(days.at(-1).date)}</span>
      </div>
      <table className="sr-only">
        <caption>Events and delivery attempts per day, last 31 days (UTC)</caption>
        <thead>
          <tr><th scope="col">Date</th><th scope="col">Events</th><th scope="col">Delivery attempts</th></tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}><th scope="row">{formatDay(day.date)}</th><td>{day.events}</td><td>{day.deliveries}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default function Usage() {
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    getUsage()
      .then((result) => active && setUsage(result))
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [version])

  function retry() {
    setError(null)
    setVersion((v) => v + 1)
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Usage" description="Events counted against your workspace quota. Days are in UTC." />
        <ErrorMessage error={error.status === 503 ? { message: 'Usage is temporarily unavailable' } : error} />
        <Button variant="outline" onClick={retry}>Retry</Button>
      </div>
    )
  }

  const { month, today, rateLimit, days } = usage ?? {}
  const overQuota = usage && (month.events >= month.eventsLimit || today.events >= today.eventsLimit)

  return (
    <div className="space-y-6">
      <PageHeader title="Usage" description="Events counted against your workspace quota. Days are in UTC." />

      {!usage ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {overQuota && (
            <Alert variant="destructive">
              <AlertDescription>Event quota reached. New events are rejected with 429 until the limit resets.</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="space-y-3 rounded-xl border bg-card p-4">
              <UsageMeter label="Events this month" value={month.events} limit={month.eventsLimit} />
              <p className="text-xs text-muted-foreground">
                resets {formatDay(month.resetsAt)} · {month.deliveries.toLocaleString()} delivery attempts this month
              </p>
            </section>
            <section className="space-y-3 rounded-xl border bg-card p-4">
              <UsageMeter label="Events today" value={today.events} limit={today.eventsLimit} />
              <p className="text-xs text-muted-foreground">
                {today.deliveries.toLocaleString()} delivery attempts today · each retry counts
              </p>
            </section>
          </div>
          <p className="text-sm text-muted-foreground">
            Each endpoint accepts up to <span className="font-mono text-foreground">{rateLimit.perEndpointPerMinute.toLocaleString()}</span> requests per minute.
          </p>
          <DailyChart days={days} />
        </>
      )}
    </div>
  )
}
