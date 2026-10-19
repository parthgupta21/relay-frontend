import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import AuthCard from '@/components/AuthCard'
import ErrorMessage from '@/components/ErrorMessage'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate(state?.from ?? '/endpoints', { replace: true })
    } catch (err) {
      setError(err)
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Log in">
      {state?.notice && (
        <Alert><AlertDescription>{state.notice}</AlertDescription></Alert>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <ErrorMessage error={error} />
        <Button type="submit" className="w-full" disabled={submitting}>Log in</Button>
      </form>
      <div className="flex justify-between text-sm text-muted-foreground">
        <Link to="/forgot-password" className="underline">Forgot password?</Link>
        <Link to="/register" className="underline">Create account</Link>
      </div>
    </AuthCard>
  )
}
