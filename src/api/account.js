import { apiFetch } from './client'

export const deleteAccount = (password) => apiFetch('/account/delete', { method: 'POST', body: { password } })
