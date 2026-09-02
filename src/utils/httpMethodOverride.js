/**
 * HTTP method override for the live (cPanel/Apache) deployment.
 *
 * The Apache vhost that proxies pugmarkhr.com/api to the Node app answers
 * PUT / PATCH / DELETE with a 403 HTML page — those requests never reach the
 * backend, so "update" and "delete" silently fail in production. GET and POST
 * pass through fine.
 *
 * This patches window.fetch once at startup so any such request to our API is
 * sent as POST with `X-HTTP-Method-Override: <real method>`. The backend
 * restores the real method before routing, so route handlers are unchanged.
 *
 * Local dev (vite proxy -> localhost:5000) is unaffected: the override header
 * is honoured there too, and plain PUT/DELETE would work either way.
 */
const OVERRIDDEN = ['PUT', 'PATCH', 'DELETE']

const isApiRequest = (url) => {
  const href = String(url || '')
  // Same-origin relative calls (/api/...) and absolute calls to the API base.
  return href.includes('/api/') || href.startsWith('/api')
}

export const installHttpMethodOverride = () => {
  if (typeof window === 'undefined' || window.__hrmsMethodOverrideInstalled) return
  window.__hrmsMethodOverrideInstalled = true

  const nativeFetch = window.fetch.bind(window)

  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url
    const method = String(init?.method || (typeof input === 'object' ? input?.method : '') || 'GET').toUpperCase()

    if (!OVERRIDDEN.includes(method) || !isApiRequest(url)) {
      return nativeFetch(input, init)
    }

    const headers = new Headers(init.headers || (typeof input === 'object' ? input?.headers : undefined))
    headers.set('X-HTTP-Method-Override', method)

    return nativeFetch(url, { ...init, method: 'POST', headers })
  }
}

export default installHttpMethodOverride
