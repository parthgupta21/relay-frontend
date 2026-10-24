import { useState } from 'react'
import { resendVerification } from '@/api/auth'
import ErrorMessage from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResendForm({ email: knownEmail }) {
  const [email, setEmail] = useState(knownEmail ?? '')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      await resendVerification(email)
      setStatus('sent')
    } catch (err) {
      setError(err)
      setStatus('idle')
    }
  }

  if (status === 'sent') return <p className="text-sm">Verification email sent.</p>

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {!knownEmail && (
          <Input type="email" aria-label="Email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
        <Button type="submit" variant="outline" size="sm" disabled={status === 'sending'}>
          Resend verification email
        </Button>
      </div>
      <ErrorMessage error={error} />
    </form>
  )
}
