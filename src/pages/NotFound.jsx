import { Link, useLocation } from 'react-router-dom'

export default function NotFound() {
  const inApp = useLocation().pathname.startsWith('/app')
  return (
    <div className="p-10 text-center space-y-2">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to={inApp ? '/app/endpoints' : '/'} className="underline">{inApp ? 'Back to endpoints' : 'Back to home'}</Link>
    </div>
  )
}
