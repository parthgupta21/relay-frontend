import { useState } from 'react'
import ErrorMessage from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, destructive, confirmDisabled, onConfirm, children }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  function handleOpenChange(next) {
    setError(null)
    onOpenChange(next)
  }

  async function submit(e) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err)
    }
    setPending(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          <ErrorMessage error={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant={destructive ? 'destructive' : 'default'} disabled={pending || confirmDisabled}>{confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
