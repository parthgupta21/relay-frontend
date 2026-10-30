import { apiFetch } from './client'

const withQuery = (path, params) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString()
  return query ? `${path}?${query}` : path
}

export const listWorkspaces = (params) => apiFetch(withQuery('/admin/workspaces', params))
export const getWorkspace = (id) => apiFetch(`/admin/workspaces/${id}`)
export const updateWorkspace = (id, body) => apiFetch(`/admin/workspaces/${id}`, { method: 'PATCH', body })
export const deleteWorkspace = (id, confirm) => apiFetch(`/admin/workspaces/${id}/delete`, { method: 'POST', body: { confirm } })
export const listAudit = (params) => apiFetch(withQuery('/admin/audit', params))
