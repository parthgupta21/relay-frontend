import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import ResendForm from '@/components/ResendForm'

export default function VerifyBanner({ email }) {
  return (
    <Alert className="mb-6">
      <AlertTitle>Verify your email</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        You need to verify {email} before you can create endpoints.
        <ResendForm email={email} variant="outline" />
      </AlertDescription>
    </Alert>
  )
}
