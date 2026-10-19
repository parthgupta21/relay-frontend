import { cn } from '@/lib/utils'

const COLORS = {
  GET: 'bg-info/10 text-info',
  POST: 'bg-success/10 text-success',
  PUT: 'bg-warning/10 text-warning',
  PATCH: 'bg-warning/10 text-warning',
  DELETE: 'bg-destructive/10 text-destructive',
}

export default function MethodBadge({ method, className }) {
  return (
    <span className={cn('inline-block min-w-[3.25rem] rounded px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold', COLORS[method] ?? 'bg-muted text-muted-foreground', className)}>
      {method}
    </span>
  )
}
