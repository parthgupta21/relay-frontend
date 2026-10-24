import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '@/api/auth'
import AuthCard from '@/components/AuthCard'
import ErrorMessage from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err)
    }
    setSubmitting(false)
  }

  return (
    <AuthCard title="Reset your password">
      {sent ? (
        <p className="text-sm">If the account exists, we sent a link to reset the password.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <ErrorMessage error={error} />
          <Button type="submit" className="w-full" disabled={submitting}>Send reset link</Button>
        </form>
      )}
      <p className="text-sm text-center text-muted-foreground">
        <Link to="/login" className="underline">Back to sign in</Link>
      </p>
    </AuthCard>
  )
}
