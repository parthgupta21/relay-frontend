import { apiFetch } from './client'

export function listEvents(endpointId, { limit = 50, cursor, method } = {}) {
  const params = new URLSearchParams({ limit })
  if (cursor) params.set('cursor', cursor)
  if (method) params.set('method', method)
  return apiFetch(`/endpoints/${endpointId}/events?${params}`)
}

export const getEvent = (id) => apiFetch(`/events/${id}`)
