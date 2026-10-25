import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { KeyRound, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createToken, listTokens, revokeToken } from '@/api/tokens'
import CodeBlock from '@/components/CodeBlock'
import ConfirmDialog from '@/components/ConfirmDialog'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import PageHeader from '@/components/PageHeader'
import SecretDialog from '@/components/SecretDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const EXPIRY_OPTIONS = [
  ['never', 'Never'],
  ['7', '7 days'],
  ['30', '30 days'],
  ['90', '90 days'],
  ['365', '365 days'],
]

const isExpired = ({ expiresAt }) => Boolean(expiresAt) && new Date(expiresAt) < new Date()

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'Never')

export default function ApiTokens() {
  const { me } = useOutletContext()
  const [tokens, setTokens] = useState(null)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('never')
  const [secret, setSecret] = useState(null)
  const [revoking, setRevoking] = useState(null)

  useEffect(() => {
    let active = true
    listTokens()
      .then((list) => active && setTokens(list))
      .catch((err) => active && setError(err))
    return () => {
      active = false
    }
  }, [])

  async function create() {
    const { token, ...created } = await createToken({ name, ...(expiry !== 'never' && { expiresInDays: Number(expiry) }) })
    setTokens((list) => [created, ...list])
    setSecret(token)
    setName('')
    setExpiry('never')
  }

  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="API tokens"
        description="Authenticate scripts and CI with Authorization: Bearer. A token has full access to this workspace."
        actions={<Button variant="brand" disabled={!tokens || !me.user.emailVerified} onClick={() => setCreating(true)}><Plus />New token</Button>}
      />

      {!tokens ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : tokens.length === 0 ? (
        <EmptyState icon={KeyRound} title="No API tokens yet" description="Create a token to call the RELAY API from your own scripts and CI.">
          <Button variant="brand" disabled={!me.user.emailVerified} onClick={() => setCreating(true)}><Plus />Create your first token</Button>
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {tokens.map((token) => (
            <li key={token.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <div className="min-w-0 flex-1 basis-64 space-y-1">
                <p className="flex items-center gap-2 font-medium">
                  {token.name}
                  {isExpired(token) && <Badge variant="destructive">Expired</Badge>}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{token.prefix}…</p>
              </div>
              <dl className="flex gap-x-6 text-xs text-muted-foreground">
                <div><dt>Created</dt><dd className="text-foreground">{formatDate(token.createdAt)}</dd></div>
                <div><dt>Last used</dt><dd className="text-foreground">{formatDate(token.lastUsedAt)}</dd></div>
                <div><dt>Expires</dt><dd className="text-foreground">{formatDate(token.expiresAt)}</dd></div>
              </dl>
              <Button variant="ghost" size="icon-sm" onClick={() => setRevoking(token)} aria-label={`Revoke ${token.name}`}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={creating}
        onOpenChange={setCreating}
        title="New API token"
        description="The token is shown once, right after you create it."
        confirmLabel="Create"
        onConfirm={create}
      >
        <div className="space-y-2">
          <Label htmlFor="token-name">Name</Label>
          <Input id="token-name" required maxLength={100} placeholder="CI pipeline" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="token-expiry">Expires</Label>
          <Select value={expiry} onValueChange={setExpiry}>
            <SelectTrigger id="token-expiry" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPIRY_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="Revoke token?"
        description={`Anything using ${revoking?.name ?? 'this token'} stops working immediately.`}
        confirmLabel="Revoke"
        destructive
        onConfirm={async () => {
          await revokeToken(revoking.id)
          setTokens((list) => list.filter((t) => t.id !== revoking.id))
          toast.success('Token revoked')
        }}
      />

      {secret && (
        <SecretDialog
          title="API token"
          description="Send it as a bearer token in the Authorization header."
          value={secret}
          copyLabel="Copy token"
          hint="If you lose it, revoke it and create a new one."
          onClose={() => setSecret(null)}
        >
          <CodeBlock label="curl" code={`curl ${window.location.origin}/api/v1/endpoints \\
  -H 'Authorization: Bearer ${secret}'`} />
        </SecretDialog>
      )}
    </div>
  )
}
