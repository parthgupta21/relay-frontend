import { cn } from '@/lib/utils'

export default function UsageMeter({ label, value, limit }) {
  const ratio = limit ? value / limit : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value.toLocaleString()} / {limit.toLocaleString()}</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(value, limit)} className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', ratio >= 1 ? 'bg-destructive' : ratio >= 0.8 ? 'bg-warning' : 'bg-brand')} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
    </div>
  )
}
