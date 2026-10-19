import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="p-10 text-center space-y-2">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/endpoints" className="underline">Back to endpoints</Link>
    </div>
  )
}
