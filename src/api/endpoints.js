import { apiFetch } from './client'

export const listEndpoints = () => apiFetch('/endpoints')
export const getEndpoint = (id) => apiFetch(`/endpoints/${id}`)
export const createEndpoint = (body) => apiFetch('/endpoints', { method: 'POST', body })
export const updateEndpoint = (id, body) => apiFetch(`/endpoints/${id}`, { method: 'PATCH', body })
export const deleteEndpoint = (id) => apiFetch(`/endpoints/${id}`, { method: 'DELETE' })
export const rotateSlug = (id) => apiFetch(`/endpoints/${id}/rotate-slug`, { method: 'POST' })
