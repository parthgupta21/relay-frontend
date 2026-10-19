import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Logo({ to = '/', className }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2 rounded-md font-semibold tracking-tight', className)}>
      <span className="grid size-6 place-items-center rounded-md bg-brand text-brand-foreground">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h12m-5-5 5 5-5 5" />
        </svg>
      </span>
      RELAY
    </Link>
  )
}
