import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollText, Search } from 'lucide-react'
import { toast } from 'sonner'
import { listWorkspaces } from '@/api/admin'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const ALL = 'all'

const toParams = (q, status) => ({ q, status: status === ALL ? '' : status })

export default function AdminWorkspaces() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState(ALL)
  const [result, setResult] = useState({})
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setQ(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    listWorkspaces(toParams(q, status))
      .then((page) => active && setResult({ q, status, page }))
      .catch((error) => active && setResult({ q, status, error }))
    return () => {
      active = false
    }
  }, [q, status])

  const { page, error } = result.q === q && result.status === status ? result : {}

  async function loadMore() {
    setLoadingMore(true)
    try {
      const next = await listWorkspaces({ ...toParams(q, status), cursor: page.nextCursor })
      setResult({ q, status, page: { items: [...page.items, ...next.items], nextCursor: next.nextCursor } })
    } catch (err) {
      toast.error(err.message)
    }
    setLoadingMore(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspaces"
        description="Every workspace on this RELAY instance."
        actions={<Button variant="outline" asChild><Link to="/app/admin/audit"><ScrollText />Audit log</Link></Button>}
      />

      <div className="flex flex-wrap gap-3">
        <Input aria-label="Search by owner email" className="max-w-xs" placeholder="Owner email starts with…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Status" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ErrorMessage error={error} />
      ) : !page ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : page.items.length === 0 ? (
        <EmptyState icon={Search} title="No workspaces found" description="Try a different email prefix or status." />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Endpoints</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.items.map((workspace) => (
                  <TableRow key={workspace.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/app/admin/workspaces/${workspace.id}`} className="font-medium hover:underline">{workspace.ownerEmail}</Link>
                        {workspace.ownerIsOperator && <Badge variant="secondary">Operator</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={workspace.status} /></TableCell>
                    <TableCell className="text-right font-mono">{workspace.endpointCount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(workspace.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {page.nextCursor && <Button variant="outline" disabled={loadingMore} onClick={loadMore}>Load more</Button>}
        </div>
      )}
    </div>
  )
}
