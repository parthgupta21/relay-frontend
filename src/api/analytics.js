import { apiFetch } from './client'

export function getDeliveryAnalytics({ range, endpointId }) {
  const params = new URLSearchParams({ range })
  if (endpointId) params.set('endpointId', endpointId)
  return apiFetch(`/analytics/deliveries?${params}`)
}
