import { cn } from '@/lib/utils'

const STATES = {
  active: ['Active', 'text-success', 'bg-success'],
  disabled: ['Disabled', 'text-muted-foreground', 'bg-muted-foreground'],
  pending: ['Pending', 'text-muted-foreground', 'bg-muted-foreground'],
  in_flight: ['In flight', 'text-warning', 'bg-warning animate-pulse'],
  retry_scheduled: ['Retrying', 'text-info', 'bg-info'],
  succeeded: ['Succeeded', 'text-success', 'bg-success'],
  failed: ['Failed', 'text-destructive', 'bg-destructive'],
  success: ['Success', 'text-success', 'bg-success'],
  http_error: ['HTTP error', 'text-destructive', 'bg-destructive'],
  timeout: ['Timeout', 'text-destructive', 'bg-destructive'],
  network_error: ['Network error', 'text-destructive', 'bg-destructive'],
  blocked: ['Blocked', 'text-destructive', 'bg-destructive'],
}

export function ManualTag({ className }) {
  return <span className={cn('rounded-md border px-1.5 py-0.5 text-xs text-brand-text', className)}>manual</span>
}

export default function StatusBadge({ status, className }) {
  const [label, text, dot] = STATES[status] ?? [status, 'text-muted-foreground', 'bg-muted-foreground']
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium', text, className)}>
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}
