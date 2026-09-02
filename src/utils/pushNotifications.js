/**
 * Browser Push (Desktop) Notifications
 * Thin wrapper around the Web Notifications API so the app can raise native
 * OS notifications for real-time events (leave, DAR, attendance, etc.).
 *
 * Works while the app is open in a browser tab (foreground or background).
 * True "closed-browser" push would additionally need a Service Worker + Web
 * Push (VAPID) on the backend — see notes in the notification feature.
 */

export const isNotificationSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

export const getNotificationPermission = () =>
  isNotificationSupported() ? Notification.permission : 'unsupported'

/**
 * Ask the user for notification permission if not already decided.
 * Returns the resulting permission string:
 * 'granted' | 'denied' | 'default' | 'unsupported'
 */
export const ensureNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    // Some browsers return a promise, older ones use a callback.
    const result = await Notification.requestPermission()
    return result || Notification.permission
  } catch {
    return Notification.permission
  }
}

/**
 * Show a native browser notification.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} [opts.body]
 * @param {string} [opts.tag]   - collapses duplicate notifications
 * @param {string} [opts.icon]  - image URL
 * @param {Function} [opts.onClick]
 * @returns {Notification|null}
 */
export const showBrowserNotification = ({ title, body, tag, icon, onClick } = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted' || !title) {
    return null
  }
  try {
    const notification = new Notification(title, {
      body: body || '',
      tag: tag || undefined,
      icon: icon || undefined,
      badge: icon || undefined,
      renotify: !!tag,
    })
    notification.onclick = (event) => {
      event.preventDefault()
      try {
        window.focus()
      } catch {
        /* ignore */
      }
      if (typeof onClick === 'function') onClick()
      notification.close()
    }
    // Auto-close after 8s to avoid clutter (some OSes keep them otherwise).
    setTimeout(() => {
      try {
        notification.close()
      } catch {
        /* ignore */
      }
    }, 8000)
    return notification
  } catch {
    return null
  }
}
