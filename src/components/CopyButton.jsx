import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CopyButton({ text, label = 'Copy', variant = 'ghost' }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={copy} aria-label={label}>
      {copied ? <Check /> : <Copy />}
      {variant !== 'ghost' && (copied ? 'Copied' : label)}
    </Button>
  )
}
