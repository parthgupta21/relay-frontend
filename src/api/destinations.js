import { apiFetch } from './client'

export const listDestinations = (endpointId) => apiFetch(`/endpoints/${endpointId}/destinations`)
export const createDestination = (endpointId, body) =>
  apiFetch(`/endpoints/${endpointId}/destinations`, { method: 'POST', body })
export const updateDestination = (id, body) => apiFetch(`/destinations/${id}`, { method: 'PATCH', body })
export const deleteDestination = (id) => apiFetch(`/destinations/${id}`, { method: 'DELETE' })
export const rotateSecret = (id) => apiFetch(`/destinations/${id}/rotate-secret`, { method: 'POST' })
