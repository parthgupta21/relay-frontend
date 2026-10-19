import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ErrorMessage({ error }) {
  if (!error) return null
  return (
    <Alert variant="destructive">
      <AlertDescription>
        {error.message}
        {error.status >= 500 && error.requestId && (
          <span className="block text-xs mt-1">Request ID: {error.requestId}</span>
        )}
      </AlertDescription>
    </Alert>
  )
}
