export class ApiError extends Error {
  constructor(status, code, message, requestId, details) {
    super(message)
    this.status = status
    this.code = code
    this.requestId = requestId
    this.details = details
  }
}

export async function apiFetch(path, { method = 'GET', body, headers, signal } = {}) {
  let res
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(0, 'NETWORK', 'Could not reach RELAY. Check your connection and try again.')
  }
  if (res.status === 401 && !path.startsWith('/auth/')) {
    window.location.assign('/login')
    return new Promise(() => {})
  }
  if (res.status === 204) return null
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const { code, message, requestId, details } = json?.error ?? {}
    throw new ApiError(res.status, code ?? 'UNKNOWN', message ?? (res.statusText || `Request failed (${res.status})`), requestId, details)
  }
  return json
}
