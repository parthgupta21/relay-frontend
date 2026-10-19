import { apiFetch } from './client'

export const getDelivery = (id) => apiFetch(`/deliveries/${id}`)
