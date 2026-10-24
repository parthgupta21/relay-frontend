import { apiFetch } from './client'

export const getDelivery = (id, signal) => apiFetch(`/deliveries/${id}`, { signal })
export const replayDelivery = (id) =>
  apiFetch(`/deliveries/${id}/replay`, { method: 'POST', body: {}, headers: { 'idempotency-key': crypto.randomUUID() } })
