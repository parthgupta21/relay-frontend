export class ApiError extends Error {
  constructor(status, code, message, requestId, details) {
    super(message)
    this.status = status
    this.code = code
    this.requestId = requestId
    this.details = details
  }
}

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`/api/v1${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 204) return null
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const { code, message, requestId, details } = json?.error ?? {}
    throw new ApiError(res.status, code ?? 'UNKNOWN', message ?? res.statusText, requestId, details)
  }
  return json
}
