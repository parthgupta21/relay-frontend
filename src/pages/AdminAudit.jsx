import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { toast } from 'sonner'
import { listAudit } from '@/api/admin'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function AdminAudit() {
  const [draft, setDraft] = useState({ action: '', workspaceId: '' })
  const [filters, setFilters] = useState(draft)
  const [result, setResult] = useState({})
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let active = true
    listAudit(filters)
      .then((page) => active && setResult({ filters, page }))
      .catch((error) => active && setResult({ filters, error }))
    return () => {
      active = false
    }
  }, [filters])

  const { page, error } = result.filters === filters ? result : {}

  async function loadMore() {
    setLoadingMore(true)
    try {
      const next = await listAudit({ ...filters, cursor: page.nextCursor })
      setResult({ filters, page: { items: [...page.items, ...next.items], nextCursor: next.nextCursor } })
    } catch (err) {
      toast.error(err.message)
    }
    setLoadingMore(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Operator and account actions across all workspaces." back={{ to: '/app/admin', label: 'Workspaces' }} />

      <form
        className="flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setFilters(draft)
        }}
      >
        <Input aria-label="Action" className="max-w-xs" placeholder="Action" value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} />
        <Input aria-label="Workspace ID" className="max-w-xs font-mono" placeholder="Workspace ID" value={draft.workspaceId} onChange={(e) => setDraft({ ...draft, workspaceId: e.target.value })} />
        <Button type="submit" variant="outline">Apply</Button>
      </form>

      {error ? (
        <ErrorMessage error={error.status === 404 ? { message: 'No workspace with that ID.' } : error} />
      ) : !page ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : page.items.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit entries" description="Nothing matches these filters." />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.items.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{entry.action}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.workspaceId ?? '—'}</TableCell>
                    <TableCell>{entry.actorEmail ?? '—'}</TableCell>
                    <TableCell className="font-mono">{entry.ip ?? '—'}</TableCell>
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
