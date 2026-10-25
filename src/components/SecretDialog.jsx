import CopyButton from '@/components/CopyButton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function SecretDialog({ title, description, value, copyLabel, hint = 'If you lose it, rotate it to get a new one.', onClose, children }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-1 rounded-md bg-muted px-3 py-2">
          <code className="min-w-0 flex-1 break-all font-mono text-xs">{value}</code>
          <CopyButton text={value} label={copyLabel} />
        </div>
        {children}
        <Alert>
          <AlertTitle>Copy it now</AlertTitle>
          <AlertDescription>This secret will not be shown again. {hint}</AlertDescription>
        </Alert>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
