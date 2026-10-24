import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { listDestinations } from '@/api/destinations'
import { replayEvent } from '@/api/events'
import ConfirmDialog from '@/components/ConfirmDialog'
import ErrorMessage from '@/components/ErrorMessage'
import { Skeleton } from '@/components/ui/skeleton'

export default function ReplayDialog({ eventId, endpointId, onClose, onReplayed }) {
  const [destinations, setDestinations] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    listDestinations(endpointId)
      .then((list) => {
        if (!active) return
        setDestinations(list)
        setSelected(new Set(list.filter((d) => d.isActive).map((d) => d.id)))
      })
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [endpointId])

  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  async function replay() {
    try {
      const { deliveries } = await replayEvent(eventId, [...selected])
      toast.success(`${deliveries.length} ${deliveries.length === 1 ? 'delivery' : 'deliveries'} queued`)
      onReplayed()
    } catch (err) {
      if (err.code !== 'QUOTA_EXCEEDED') throw err
      toast.error('Replay limit reached, try again later')
    }
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Replay event"
      description="Send this event again to the selected destinations."
      confirmLabel="Replay"
      confirmDisabled={selected.size === 0}
      onConfirm={replay}
    >
      <ErrorMessage error={error} />
      {!destinations && !error && <Skeleton className="h-20 w-full" />}
      {destinations?.length === 0 && <p className="text-sm text-muted-foreground">This endpoint has no destinations.</p>}
      <ul className="space-y-2">
        {destinations?.map((destination) => (
          <li key={destination.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm">
              <input type="checkbox" className="size-4 accent-brand" checked={selected.has(destination.id)} onChange={() => toggle(destination.id)} />
              <span className="min-w-0 flex-1 truncate font-medium">{destination.name}</span>
              {!destination.isActive && <span className="text-xs text-muted-foreground">disabled</span>}
            </label>
          </li>
        ))}
      </ul>
    </ConfirmDialog>
  )
}
