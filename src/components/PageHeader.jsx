import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function PageHeader({ title, description, actions, back }) {
  return (
    <div className="space-y-3">
      {back && (
        <Link to={back.to} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />{back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="break-words text-2xl font-semibold">{title}</h1>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
