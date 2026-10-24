import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/api/auth'
import AuthCard from '@/components/AuthCard'
import ErrorMessage from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPassword() {
  const token = useSearchParams()[0].get('token')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await resetPassword(token, password)
      navigate('/login', { state: { notice: 'Password updated. Sign in with your new password.' } })
    } catch (err) {
      setError(err)
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Choose a new password">
      {token ? (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">At least 10 characters.</p>
          </div>
          <ErrorMessage error={error} />
          <Button type="submit" className="w-full" disabled={submitting}>Update password</Button>
        </form>
      ) : (
        <p className="text-sm">This reset link is invalid. <Link to="/forgot-password" className="underline">Request a new one</Link>.</p>
      )}
    </AuthCard>
  )
}
