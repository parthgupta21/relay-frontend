import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Fingerprint, History, Radio, Repeat, ShieldCheck, Workflow } from 'lucide-react'
import CodeBlock, { JsonHighlight } from '@/components/CodeBlock'
import MethodBadge from '@/components/MethodBadge'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { Button } from '@/components/ui/button'
import { useMe } from '@/hooks/useMe'

const SAMPLES = [
  { method: 'POST', path: '/stripe', size: '1.2 KB', body: { type: 'invoice.paid', data: { id: 'in_1Pq', amount: 4200, currency: 'usd' } } },
  { method: 'POST', path: '/github', size: '8.4 KB', body: { action: 'opened', pull_request: { number: 482, draft: false } } },
  { method: 'PUT', path: '/crm/contacts/17', size: '310 B', body: { email: 'ada@example.com', plan: 'pro' } },
  { method: 'GET', path: '/health?probe=1', size: '0 B', body: null },
  { method: 'DELETE', path: '/sessions/9c2', size: '0 B', body: null },
  { method: 'POST', path: '/shopify', size: '2.7 KB', body: { topic: 'orders/create', order: { id: 5521, total: '89.00' } } },
]

const STEPS = [
  ['Create an endpoint', 'Get a public URL in one click. Name it, optionally pick an idempotency header.'],
  ['Point your provider at it', 'Paste the URL into Stripe, GitHub, Shopify or your own service. Every request is stored byte for byte.'],
  ['Inspect and forward', 'Watch events arrive live, then forward them to your servers with retries and signed deliveries.'],
]

const FEATURES = [
  [Fingerprint, 'Byte-exact capture', 'Bodies are stored as raw bytes, so signatures still verify and nothing is re-encoded.'],
  [Radio, 'Live inspector', 'Events appear within seconds with headers, query, pretty JSON, raw and hex views.'],
  [Workflow, 'Reliable forwarding', 'Forward to any number of destinations with timeouts and automatic retries.'],
  [Repeat, 'One-click replay', 'Re-send any captured event to a destination and see every attempt in a timeline.'],
  [History, 'Signed deliveries', 'Each delivery carries an HMAC signature so your servers can verify it came from RELAY.'],
  [ShieldCheck, 'SSRF-safe, tenant-isolated', 'Destinations are validated and blocked from private networks. Workspaces never see each other.'],
]

const CURL = `curl -X POST https://relay.dev/h/k7x2m9 \\
  -H 'content-type: application/json' \\
  -d '{"event":"invoice.paid","amount":4200}'`

const VERIFY = `import { createHmac, timingSafeEqual } from 'node:crypto'

export function verify(rawBody, header, secret) {
  const { t, v1 } = Object.fromEntries(header.split(',').map((part) => part.split('=')))
  const expected = createHmac('sha256', secret).update(\`\${t}.\${rawBody}\`).digest('hex')
  return v1.length === expected.length && timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
}`

function MockInspector() {
  const reduceMotion = useReducedMotion()
  const [rows, setRows] = useState(() => SAMPLES.slice(0, 3).map((s, i) => ({ ...s, key: i })).reverse())

  useEffect(() => {
    if (reduceMotion) return
    let n = 3
    const timer = setInterval(() => {
      setRows((current) => [{ ...SAMPLES[n % SAMPLES.length], key: n++ }, ...current].slice(0, 5))
    }, 2800)
    return () => clearInterval(timer)
  }, [reduceMotion])

  const selected = rows[0]

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-brand/10" aria-hidden="true">
      <div className="flex items-center gap-3 border-b px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/60" />
          <span className="size-2.5 rounded-full bg-success/60" />
        </div>
        <span className="flex-1 truncate rounded-md bg-muted px-3 py-1 text-center font-mono text-xs text-muted-foreground">relay.dev/h/k7x2m9</span>
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />Live
        </span>
      </div>
      <div className="grid md:grid-cols-[1fr_1.1fr]">
        <ul className="min-h-[17rem] divide-y overflow-hidden md:border-r">
          <AnimatePresence initial={false}>
            {rows.map((row, i) => (
              <motion.li
                key={row.key}
                layout
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? 'bg-accent/60' : ''}`}
              >
                <MethodBadge method={row.method} />
                <span className="min-w-0 flex-1 truncate font-mono text-xs">{row.path}</span>
                <span className="text-xs text-muted-foreground">{row.size}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <div className="hidden p-4 md:block">
          <p className="mb-2 text-xs text-muted-foreground">Body</p>
          <pre className="font-mono text-xs leading-relaxed">
            {selected.body ? <JsonHighlight json={JSON.stringify(selected.body, null, 2)} /> : <span className="text-muted-foreground">(no body)</span>}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const { me } = useMe()

  return (
    <div className="min-h-screen">
      <SiteHeader me={me} />
      <main>
        <section className="relative overflow-hidden">
          <div className="bg-grid absolute inset-0" />
          <div className="bg-glow absolute inset-0" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:pt-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <span className="size-1.5 rounded-full bg-brand" />Capture, inspect, forward, retry
              </p>
              <h1 className="text-4xl font-semibold leading-[1.05] sm:text-6xl">Never lose a webhook again</h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                RELAY captures every request byte for byte, lets you inspect it live, and forwards it to your servers with signed deliveries and automatic retries.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button size="lg" variant="brand" asChild>
                  <Link to={me ? '/app/endpoints' : '/register'}>{me ? 'Open dashboard' : 'Get started free'}<ArrowRight /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild><a href="#how-it-works">See how it works</a></Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className="mx-auto mt-16 max-w-4xl"
            >
              <MockInspector />
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="rounded-xl border bg-card p-6">
                <span className="grid size-8 place-items-center rounded-full bg-brand/15 font-mono text-sm text-brand-text">{i + 1}</span>
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="text-3xl font-semibold">Built for webhooks that matter</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([Icon, title, text], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                className="rounded-xl border bg-card p-6"
              >
                <Icon className="size-5 text-brand-text" aria-hidden="true" />
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="docs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="text-3xl font-semibold">Send it. Verify it.</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">Point any sender at your RELAY URL, then verify the signature on every forwarded delivery.</p>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <CodeBlock label="curl" code={CURL} />
            <CodeBlock label="verify.js" code={VERIFY} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-14 text-center">
            <div className="bg-glow absolute inset-0 opacity-60" />
            <div className="relative">
              <h2 className="text-3xl font-semibold">Catch your next webhook in a minute</h2>
              <p className="mt-2 text-muted-foreground">Create an endpoint, point a provider at it, and watch the first event land.</p>
              <Button size="lg" variant="brand" className="mt-6" asChild>
                <Link to={me ? '/app/endpoints' : '/register'}>{me ? 'Open dashboard' : 'Get started free'}<ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
