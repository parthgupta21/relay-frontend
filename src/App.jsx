import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from '@/components/RequireAuth'
import CheckInbox from '@/pages/CheckInbox'
import EndpointInspector from '@/pages/EndpointInspector'
import Endpoints from '@/pages/Endpoints'
import EventDetail from '@/pages/EventDetail'
import ForgotPassword from '@/pages/ForgotPassword'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import Register from '@/pages/Register'
import ResetPassword from '@/pages/ResetPassword'
import Verify from '@/pages/Verify'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/check-inbox" element={<CheckInbox />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/endpoints" replace />} />
          <Route path="/endpoints" element={<Endpoints />} />
          <Route path="/endpoints/:id" element={<EndpointInspector />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
