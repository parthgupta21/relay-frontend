import { BrowserRouter, generatePath, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import RequireAuth from '@/components/RequireAuth'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import CheckInbox from '@/pages/CheckInbox'
import EndpointInspector from '@/pages/EndpointInspector'
import Endpoints from '@/pages/Endpoints'
import EventDetail from '@/pages/EventDetail'
import ForgotPassword from '@/pages/ForgotPassword'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import Register from '@/pages/Register'
import ResetPassword from '@/pages/ResetPassword'
import Verify from '@/pages/Verify'

function LegacyRedirect({ to }) {
  return <Navigate to={generatePath(to, useParams())} replace />
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/check-inbox" element={<CheckInbox />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/endpoints" element={<LegacyRedirect to="/app/endpoints" />} />
            <Route path="/endpoints/:id" element={<LegacyRedirect to="/app/endpoints/:id" />} />
            <Route path="/events/:id" element={<LegacyRedirect to="/app/events/:id" />} />
            <Route path="/app" element={<RequireAuth />}>
              <Route index element={<Navigate to="endpoints" replace />} />
              <Route path="endpoints" element={<Endpoints />} />
              <Route path="endpoints/:id" element={<EndpointInspector />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  )
}
