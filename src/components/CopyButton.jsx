import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function CopyButton({ text, label = 'Copy', variant = 'ghost' }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return toast.error('Could not copy to clipboard')
    }
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 1500)
  }

  const button = (
    <Button type="button" variant={variant} size={variant === 'ghost' ? 'icon-sm' : 'sm'} onClick={copy} aria-label={label}>
      {copied ? <Check /> : <Copy />}
      {variant !== 'ghost' && (copied ? 'Copied' : label)}
    </Button>
  )
  if (variant !== 'ghost') return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
