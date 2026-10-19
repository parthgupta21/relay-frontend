import { apiFetch } from './client'

export const getDelivery = (id) => apiFetch(`/deliveries/${id}`)
export const replayDelivery = (id) =>
  apiFetch(`/deliveries/${id}/replay`, { method: 'POST', body: {}, headers: { 'idempotency-key': crypto.randomUUID() } })
