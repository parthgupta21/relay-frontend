import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { createEndpoint, listEndpoints } from '@/api/endpoints'
import ConfirmDialog from '@/components/ConfirmDialog'
import CopyButton from '@/components/CopyButton'
import ErrorMessage from '@/components/ErrorMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
  }

  if (error) return <ErrorMessage error={error} />
  if (!endpoints) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Endpoints</h1>
          <p className="text-sm text-muted-foreground">
            {endpoints.length} of {me.workspace.limits.maxEndpoints} endpoints used
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New endpoint</Button>
      </div>

      {endpoints.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
          <p className="font-medium">No endpoints yet</p>
          <p className="text-sm text-muted-foreground">Create one, then send it a request:</p>
          <pre className="mx-auto max-w-full overflow-x-auto rounded-md bg-muted p-3 text-left text-xs">
            {`curl -X POST <your-endpoint-url> -H 'content-type: application/json' -d '{"hello":"world"}'`}
          </pre>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Last 24h</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.map((endpoint) => (
              <TableRow key={endpoint.id}>
                <TableCell className="font-medium">
                  <Link to={`/endpoints/${endpoint.id}`} className="underline-offset-4 hover:underline">{endpoint.name}</Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <code className="max-w-[16rem] truncate text-xs">{endpoint.url}</code>
                    <CopyButton text={endpoint.url} label="Copy URL" />
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={endpoint.isActive ? 'default' : 'secondary'}>{endpoint.isActive ? 'Active' : 'Disabled'}</Badge>
                </TableCell>
                <TableCell className="text-right">{endpoint.eventCount24h}</TableCell>
                <TableCell>{new Date(endpoint.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
