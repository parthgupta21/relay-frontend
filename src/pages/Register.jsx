import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/api/auth'
import AuthCard from '@/components/AuthCard'
import ErrorMessage from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await register(email, password)
      navigate('/check-inbox', { state: { email } })
    } catch (err) {
      setError(err)
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Create your account" description="Capture and inspect webhooks in minutes.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">At least 10 characters.</p>
        </div>
        <ErrorMessage error={error} />
        <Button type="submit" className="w-full" disabled={submitting}>Sign up</Button>
      </form>
      <p className="text-sm text-center text-muted-foreground">
        Already have an account? <Link to="/login" className="underline">Sign in</Link>
      </p>
    </AuthCard>
  )
}
