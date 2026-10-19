import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '@/api/auth'
import AuthCard from '@/components/AuthCard'
import ErrorMessage from '@/components/ErrorMessage'
import ResendForm from '@/components/ResendForm'

export default function Verify() {
  const token = useSearchParams()[0].get('token')
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    verifyEmail(token)
      .then(() => navigate('/endpoints', { replace: true }))
      .catch(setError)
  }, [token, navigate])

  if (!token || error?.status === 422) {
    return (
      <AuthCard title="Link invalid or expired" description="Request a new verification email.">
        <ResendForm variant="outline" />
        <p className="text-sm text-center text-muted-foreground">
          <Link to="/login" className="underline">Back to log in</Link>
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Verifying your email">
      {error ? <ErrorMessage error={error} /> : <p className="text-sm text-muted-foreground">Please wait...</p>}
    </AuthCard>
  )
}
