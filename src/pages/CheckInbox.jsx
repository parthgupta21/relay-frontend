import { Link, useLocation } from 'react-router-dom'
import AuthCard from '@/components/AuthCard'
import ResendForm from '@/components/ResendForm'

export default function CheckInbox() {
  const email = useLocation().state?.email

  return (
    <AuthCard title="Check your inbox" description="We sent you a verification link. It expires after a while.">
      <ResendForm email={email} variant="outline" />
      <p className="text-sm text-center text-muted-foreground">
        <Link to="/login" className="underline">Back to log in</Link>
      </p>
    </AuthCard>
  )
}
