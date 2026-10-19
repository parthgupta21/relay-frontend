import CopyButton from '@/components/CopyButton'
import { cn } from '@/lib/utils'

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g

export function JsonHighlight({ json }) {
  const parts = []
  let last = 0
  for (const match of json.matchAll(TOKEN)) {
    const [text, string, colon, literal] = match
    if (match.index > last) parts.push(json.slice(last, match.index))
    const color = string ? (colon ? 'text-info' : 'text-success') : literal ? 'text-brand-text' : 'text-warning'
    parts.push(
      <span key={match.index}>
        <span className={color}>{string ?? text}</span>
        {colon}
      </span>,
    )
    last = match.index + text.length
  }
  parts.push(json.slice(last))
  return parts
}

export default function CodeBlock({ code, label, className }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card', className)}>
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
        <CopyButton text={code} label={`Copy ${label}`} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed"><code>{code}</code></pre>
    </div>
  )
}
