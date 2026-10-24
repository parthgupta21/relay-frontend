import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '@/api/auth'
import AuthCard from '@/components/AuthCard'
import ErrorMessage from '@/components/ErrorMessage'
import ResendForm from '@/components/ResendForm'
import { Button } from '@/components/ui/button'

export default function Verify() {
  const token = useSearchParams()[0].get('token')
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(null)
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    verifyEmail(token)
      .then(() => setVerified(true))
      .catch(setError)
  }, [token])

  if (!token || error?.status === 422) {
    return (
      <AuthCard title="Link invalid or expired" description="Request a new verification email.">
        <ResendForm />
        <p className="text-sm text-center text-muted-foreground">
          <Link to="/login" className="underline">Back to sign in</Link>
        </p>
      </AuthCard>
    )
  }

  if (verified) {
    return (
      <AuthCard title="Email verified" description="Your email is verified. Sign in to continue.">
        <Button variant="brand" className="w-full" asChild><Link to="/login">Sign in</Link></Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Verifying your email">
      {error ? <ErrorMessage error={error} /> : <p className="text-sm text-muted-foreground">Please wait...</p>}
    </AuthCard>
  )
}
