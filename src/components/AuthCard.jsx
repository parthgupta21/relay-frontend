import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCard({ title, description, children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-muted/40">
      <Link to="/" className="text-xl font-bold tracking-widest">RELAY</Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  )
}
