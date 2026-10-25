import { apiFetch } from './client'

export const listTokens = () => apiFetch('/tokens')
export const createToken = (body) => apiFetch('/tokens', { method: 'POST', body })
export const revokeToken = (id) => apiFetch(`/tokens/${id}`, { method: 'DELETE' })
