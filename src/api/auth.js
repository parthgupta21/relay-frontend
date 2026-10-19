import { apiFetch } from './client'

export const register = (email, password) =>
  apiFetch('/auth/register', { method: 'POST', body: { email, password } })
export const verifyEmail = (token) =>
  apiFetch('/auth/verify-email', { method: 'POST', body: { token } })
export const resendVerification = (email) =>
  apiFetch('/auth/resend-verification', { method: 'POST', body: { email } })
export const login = (email, password) =>
  apiFetch('/auth/login', { method: 'POST', body: { email, password } })
export const logout = () => apiFetch('/auth/logout', { method: 'POST' })
export const forgotPassword = (email) =>
  apiFetch('/auth/forgot-password', { method: 'POST', body: { email } })
export const resetPassword = (token, password) =>
  apiFetch('/auth/reset-password', { method: 'POST', body: { token, password } })
export const getMe = () => apiFetch('/auth/me')
