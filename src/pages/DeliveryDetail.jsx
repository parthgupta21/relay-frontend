import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { getDelivery, replayDelivery } from '@/api/deliveries'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import StatusBadge, { failureLabel, ManualTag } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePolling } from '@/hooks/usePolling'
import { timeAgo } from '@/lib/utils'

const IN_PROGRESS = ['pending', 'in_flight', 'retry_scheduled']

function Countdown({ at }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const seconds = Math.max(0, Math.ceil((new Date(at).getTime() - now) / 1000))
  return <span className="font-mono">next attempt in {Math.floor(seconds / 60)}m {seconds % 60}s</span>
}

function Attempt({ attempt, last }) {
  const headers = Object.entries(attempt.responseHeaders ?? {})
  const hasResponse = headers.length > 0 || attempt.responseBody

  return (
    <li className="relative pl-8">
      {!last && <span className="absolute left-[7px] top-5 h-full w-px bg-border" />}
      <span className="absolute left-0 top-1.5 size-4 rounded-full border-2 border-border bg-background" />
      <div className="space-y-2 pb-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium">Attempt {attempt.attemptNo}</span>
          <StatusBadge status={attempt.outcome} />
          {attempt.responseStatus !== null && <span className="font-mono text-sm">HTTP {attempt.responseStatus}</span>}
          <span className="font-mono text-xs text-muted-foreground">{attempt.durationMs} ms</span>
          <time className="text-xs text-muted-foreground" title={attempt.startedAt}>{timeAgo(attempt.startedAt)}</time>
        </div>
        {attempt.errorMessage && <p className="break-words text-sm text-destructive">{attempt.errorMessage}</p>}
        {hasResponse && (
          <details className="group rounded-lg border bg-card">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Response</summary>
            <div className="space-y-3 border-t p-3">
              {headers.length > 0 && (
                <dl className="space-y-1 font-mono text-xs">
                  {headers.map(([name, value]) => (
                    <div key={name} className="flex flex-wrap gap-x-2">
                      <dt className="font-medium">{name}:</dt>
                      <dd className="break-all text-muted-foreground">{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {attempt.responseBody && (
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 font-mono text-xs">{attempt.responseBody}</pre>
              )}
            </div>
          </details>
        )}
      </div>
    </li>
  )
}

export default function DeliveryDetail() {
  const { id } = useParams()
  const [delivery, setDelivery] = useState(null)
  const [error, setError] = useState(null)
  const [replaying, setReplaying] = useState(false)
  const navigate = useNavigate()

  async function replay() {
    setReplaying(true)
    try {
      const { delivery: replayed } = await replayDelivery(id)
      toast.success('Replay queued')
      navigate(`/app/deliveries/${replayed.id}`)
    } catch (err) {
      toast.error(err.code === 'QUOTA_EXCEEDED' ? 'Replay limit reached, try again later' : err.message)
    }
    setReplaying(false)
  }

  const load = useCallback(
    () => getDelivery(id).then(setDelivery).catch(setError),
    [id],
  )

  useEffect(() => {
    load()
  }, [load])

  usePolling(() => delivery && IN_PROGRESS.includes(delivery.status) && load(), 5000)

  if (error) return <ErrorMessage error={error} />
  if (!delivery) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        back={{ to: `/app/events/${delivery.eventId}`, label: 'Back to event' }}
        title={delivery.destinationName}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusBadge status={delivery.status} />
            <span>
              {delivery.maxAttempts ? `attempt ${delivery.attemptCount} of ${delivery.maxAttempts}` : `${delivery.attemptCount} ${delivery.attemptCount === 1 ? 'attempt' : 'attempts'}`}
            </span>
            {delivery.lastStatus !== null && <span className="font-mono">last HTTP {delivery.lastStatus}</span>}
            {delivery.trigger === 'manual' && <ManualTag />}
            {delivery.replayOf && <Link to={`/app/deliveries/${delivery.replayOf}`} className="text-brand-text hover:underline">replay of {delivery.replayOf}</Link>}
            {delivery.nextAttemptAt && delivery.status === 'retry_scheduled' && <Countdown at={delivery.nextAttemptAt} />}
          </span>
        }
        actions={
          <Button variant="outline" onClick={replay} disabled={replaying}><RotateCw />Replay</Button>
        }
      />

      {delivery.failureReason && <p className="break-words text-sm text-destructive">{failureLabel(delivery.failureReason)}</p>}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Attempts</h2>
        {delivery.attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attempts yet. The first one starts shortly.</p>
        ) : (
          <ol>
            {delivery.attempts.map((attempt, i) => (
              <Attempt key={attempt.attemptNo} attempt={attempt} last={i === delivery.attempts.length - 1} />
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
