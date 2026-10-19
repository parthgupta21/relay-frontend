import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Plus, Webhook } from 'lucide-react'
import { toast } from 'sonner'
import { createEndpoint, listEndpoints } from '@/api/endpoints'
import CodeBlock from '@/components/CodeBlock'
import ConfirmDialog from '@/components/ConfirmDialog'
import CopyButton from '@/components/CopyButton'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const CURL = `curl -X POST <your-endpoint-url> \\
  -H 'content-type: application/json' \\
  -d '{"hello":"world"}'`

export default function Endpoints() {
  const { me } = useOutletContext()
  const [endpoints, setEndpoints] = useState(null)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [idempotencyHeader, setIdempotencyHeader] = useState('')

  useEffect(() => {
    let active = true
    listEndpoints()
      .then((list) => active && setEndpoints(list))
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [tick])

  async function create() {
    await createEndpoint({ name, ...(idempotencyHeader && { idempotencyHeader }) })
    setName('')
    setIdempotencyHeader('')
    setTick((t) => t + 1)
    toast.success('Endpoint created')
  }

  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Endpoints"
        description={endpoints && `${endpoints.length} of ${me.workspace.limits.maxEndpoints} endpoints used`}
        actions={<Button variant="brand" onClick={() => setDialogOpen(true)}><Plus />New endpoint</Button>}
      />

      {!endpoints ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : endpoints.length === 0 ? (
        <EmptyState icon={Webhook} title="No endpoints yet" description="Create an endpoint, then send it a request. It shows up in the inspector right away.">
          <Button variant="brand" onClick={() => setDialogOpen(true)}><Plus />Create your first endpoint</Button>
          <CodeBlock label="curl" code={CURL} className="mt-4 w-full max-w-xl text-left" />
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {endpoints.map((endpoint) => (
            <li key={endpoint.id} className="relative flex flex-col gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/app/endpoints/${endpoint.id}`} className="min-w-0 break-words font-medium after:absolute after:inset-0 hover:underline">
                  {endpoint.name}
                </Link>
                <StatusBadge status={endpoint.isActive ? 'active' : 'disabled'} />
              </div>
              <div className="relative z-10 flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{endpoint.url}</code>
                <CopyButton text={endpoint.url} label="Copy URL" />
              </div>
              <div className="mt-auto flex items-end justify-between text-xs text-muted-foreground">
                <span><span className="text-xl font-semibold text-foreground">{endpoint.eventCount24h}</span> events / 24h</span>
                <span>{new Date(endpoint.createdAt).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="New endpoint"
        description="You get a public URL that captures every request sent to it."
        confirmLabel="Create"
        onConfirm={create}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idempotencyHeader">Idempotency header (optional)</Label>
          <Input id="idempotencyHeader" placeholder="x-github-delivery" maxLength={100} value={idempotencyHeader} onChange={(e) => setIdempotencyHeader(e.target.value)} />
        </div>
      </ConfirmDialog>
    </div>
  )
}
