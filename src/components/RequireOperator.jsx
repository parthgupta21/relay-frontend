import { Outlet, useOutletContext } from 'react-router-dom'
import NotFound from '@/pages/NotFound'

export default function RequireOperator() {
  const context = useOutletContext()
  return context.me.user.isOperator ? <Outlet context={context} /> : <NotFound />
}
